<!-- @Author: weisun -->
<!-- @Date: 2024/5/6 10:09 -->
<!-- @Last Modified by: weisun -->
<!-- @Last Modified time: 2024/5/6 10:09 -->

<template>
  <div class="code-box-wrapper">
    <div ref="codeEditBox" class="codeEditBox"/>
    <div
      v-if="placeholder && !modelValue"
      class="code-box-placeholder"
    >{{ placeholder }}</div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  nextTick,
  toRefs,
  createVNode,
  render,
} from 'vue';

import _ from 'lodash';
import * as monaco from 'monaco-editor';
import {
  language as hiveLanguage,
  conf as hiveConf,
} from 'monaco-sql-languages/esm/languages/hive/hive';
import { language as pythonLanguage } from 'monaco-editor/esm/vs/basic-languages/python/python.js';
import { message } from 'ant-design-vue';
import { PushpinOutlined } from '@ant-design/icons-vue';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import * as actions from 'monaco-editor/esm/vs/platform/actions/common/actions';
import type { IParseResult } from 'syntax-parser';
import {
  onSuggestFieldGroup,
  onSuggestFunctionName,
  onSuggestTableFields,
  onSuggestTableNames,
  pipeKeywords,
} from '@/components/sql-editor/util/editor';

// @ts-ignore

// @ts-ignore

import Sql from '@/resources/sql';
import { formatSqlWithLanguages } from '@/utils/tool';

import type { SuggestionChunk } from '@/components/sql-editor/options/monaco-editor-type';
import { editorProps } from '@/components/sql-editor/options/monaco-editor-type';

import type {
  ICursorInfo} from '@/components/monaco-editor/sql-parser';
import {
  mysqlParser,
  reader,
} from '@/components/monaco-editor/sql-parser';

import { splitSql } from '@/components/sql-editor/util/utils';

export default defineComponent({
  name: 'MonacoEditor',
  props: editorProps,
  emits: [
    'update:modelValue',
    'change',
    'change-select',
    'change-position',
    'run-position',
    'select-code',
    'add-to-context', // Data Agent 需求：选中代码点击「添加为上下文」时触发
    'editor-mounted',
    'format-code',
    'run-code',
    'explain-code',
    'save-code',
    'save-position',
    'suggestion-accept', // 采纳建议后触发，用于上报接口
    'suggestion-reject', // 拒绝建议后触发，用于上报接口
    'suggestion-accept-batch', // 全部采纳后触发一次，payload 为所有决策数组，用于一次上报
    'suggestion-reject-batch', // 全部拒绝后触发一次，payload 为所有决策数组，用于一次上报
  ],
  setup(props, { emit }) {
    // 解构 props 以便在 template 和 style 中使用
    const { placeholder, width, height, modelValue } = toRefs(props);

    (globalThis as any).MonacoEnvironment = {
      getWorker(_: any, _label: string) {
        return new EditorWorker();
      },
    };

    const monacoHint = ref(null);
    const monacoHover = ref(null);
    const functionList = ref([]);
    const columnSelection = ref(false);

    // 添加防抖和节流变量
    let parseDebounceTimer: NodeJS.Timeout | null = null;
    let decorationUpdateTimer: NodeJS.Timeout | null = null;
    let lastCursorPosition = { lineNumber: 1, column: 1 };
    let lastContent = '';

    const fetchFunctionList = async () => {
      if (!props.dataSourceId || !props.engine) {
        functionList.value = [];

        return;
      }

      const {
        data: { body },
      } = await Sql.getFunctions({
        params: {
          dataSourceId: props.dataSourceId,
          engine: props.engine,
        },
        hideLoading: true,
      });

      functionList.value = body;
    };

    let editor: monaco.editor.IStandaloneCodeEditor;

    const codeEditBox = ref();

    // ========== Data Agent 需求：选中代码添加为上下文 ==========
    // 选中代码时在选区上方展示「添加为上下文」按钮，使用 Monaco ContentWidget 以文档定位，随内容滚动
    const ADD_CONTEXT_WIDGET_ID = 'code-box-add-context-widget';
    let addContextWidgetPosition: { lineNumber: number; column: number } | null = null;
    /** 当前选中的文本及行范围，点击「添加为上下文」时一并传出 */
    let addContextSelectedText = '';
    let addContextSelectionStartLine = 0;
    let addContextSelectionEndLine = 0;

    /** Data Agent：创建「添加为上下文」按钮 DOM，供 ContentWidget 使用 */
    const createAddContextButtonDomNode = (): HTMLElement => {
      const el = document.createElement('div');
      el.className = 'code-box-add-context-btn';
      const iconEl = document.createElement('span');
      iconEl.className = 'code-box-add-context-btn__icon';
      render(createVNode(PushpinOutlined), iconEl);
      const textEl = document.createElement('span');
      textEl.className = 'code-box-add-context-btn__text';
      textEl.textContent = '添加为上下文';
      el.appendChild(iconEl);
      el.appendChild(textEl);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (addContextSelectedText) {
          emit('add-to-context', {
            text: addContextSelectedText,
            startLine: addContextSelectionStartLine,
            endLine: addContextSelectionEndLine,
          });
        }
      });

      return el;
    };

    let addContextWidgetDomNode: HTMLElement | null = null;

    /** Data Agent：ContentWidget 实例，锚定在选中行上方，随文档滚动 */
    const addContextContentWidget: monaco.editor.IContentWidget = {
      getId: () => ADD_CONTEXT_WIDGET_ID,
      getDomNode: () => {
        if (!addContextWidgetDomNode) addContextWidgetDomNode = createAddContextButtonDomNode();

        return addContextWidgetDomNode;
      },
      getPosition: () => {
        if (!addContextWidgetPosition) return null;
        const visibleRange = editor.getVisibleRanges()[0];
        const isNearTop = visibleRange && addContextWidgetPosition.lineNumber <= visibleRange.startLineNumber + 1;

        return {
          position: { lineNumber: addContextWidgetPosition.lineNumber, column: addContextWidgetPosition.column },
          preference: isNearTop
            ? [monaco.editor.ContentWidgetPositionPreference.BELOW, monaco.editor.ContentWidgetPositionPreference.ABOVE]
            : [monaco.editor.ContentWidgetPositionPreference.ABOVE, monaco.editor.ContentWidgetPositionPreference.BELOW],
        };
      },
    };

    /** Data Agent：有选中且非空时展示并定位「添加为上下文」按钮 */
    const updateAddContextButton = () => {
      if (!props.showAddToContext) {
        hideAddContextButton();

        return;
      }

      if (!editor) return;
      const selection = editor.getSelection();
      const model = editor.getModel();
      if (!selection || !model) {
        hideAddContextButton();

        return;
      }

      const text = model.getValueInRange(selection);
      if (!text || !text.trim()) {
        hideAddContextButton();

        return;
      }

      addContextSelectedText = text;
      addContextSelectionStartLine = selection.startLineNumber;
      addContextSelectionEndLine = selection.endLineNumber;
      addContextWidgetPosition = { lineNumber: selection.startLineNumber, column: selection.startColumn };
      if (!addContextWidgetDomNode) {
        addContextWidgetDomNode = createAddContextButtonDomNode();
        editor.addContentWidget(addContextContentWidget);
      }

      editor.layoutContentWidget(addContextContentWidget);
    };

    /** Data Agent：无选中时隐藏并移除 ContentWidget */
    const hideAddContextButton = () => {
      addContextSelectedText = '';
      addContextSelectionStartLine = 0;
      addContextSelectionEndLine = 0;
      addContextWidgetPosition = null;
      if (addContextWidgetDomNode) {
        render(null, addContextWidgetDomNode);
        if (editor) {
          editor.removeContentWidget(addContextContentWidget);
        }

        addContextWidgetDomNode = null;
      }
    };

    watch(
      () => props.showAddToContext,
      (show) => {
        // false：收起浮层；true：不主动刷新，须用户再次改变选区才出现「添加为上下文」（见 onDidChangeCursorSelection）
        if (!show) hideAddContextButton();
      },
    );

    const currentLineDecoration = ref<string[]>([]);
    let selectionDebounceTimer: NodeJS.Timeout | null = null;
    let scrollDebounceTimer: NodeJS.Timeout | null = null;

    // ===== Inline Suggestion =====
    // 支持多个 diff chunk，按 type：ADD（起始位置插入）、DELETE（删除区间）、UPDATE（替换区间）
    const CHUNK_TYPE_ADD = 'ADD';
    const CHUNK_TYPE_DELETE = 'DELETE';


    // ---------- 建议功能状态 ----------
    let suggestionDecorationsCollection: monaco.editor.IEditorDecorationsCollection | null = null; // 红色“待删除”装饰集合
    let suggestionViewZoneIds: string[] = []; // 绿色“新代码”区域的 zone id 列表
    let suggestionWidgetDom: HTMLElement | null = null; // 接受/拒绝按钮的 DOM
    let suggestionScrollDisposer: monaco.IDisposable | null = null; // 滚动时更新按钮位置的订阅
    let suggestionChunks: SuggestionChunk[] = []; // 当前展示的所有建议块（已按 startLine 排序）
    let currentChunkIndex = 0; // 当前高亮/定位到第几个 chunk（多 chunk 时用于按钮定位）
    let suggestionMouseCleanup: (() => void) | null = null; // 鼠标移动监听的移除函数
    let lastMouseClientY: number | null = null; // 最近一次鼠标视口 Y，滚动时用来重算 contentY 和最近块

    /**
     * 把「视口里的鼠标 Y」转成「内容坐标系 Y」：contentY = clientY - 编辑器顶 + 滚动量。
     * 这样无论是否滚动，同一内容位置对应的 contentY 一致；getTopForLineNumber 也是内容坐标。
     */
    const viewportYToContentY = (clientY: number): number => {
      const editorDomNode = editor.getDomNode();
      if (!editorDomNode) return 0;
      const rect = editorDomNode.getBoundingClientRect();

      return clientY - rect.top + editor.getScrollTop();
    };

    /**
     * 根据内容区 Y 坐标，返回与之最近的 chunk 下标。
     * ADD：块为插入行 + 绿色区域；DELETE：块为红色删除区间；UPDATE：块为红色区间 + 绿色区域。
     */
    const getChunkIndexClosestToY = (contentY: number): number => {
      if (suggestionChunks.length === 0) return 0;
      const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
      let bestIndex = 0;
      let bestDist = Infinity;
      suggestionChunks.forEach((chunk, index) => {
        const type = chunk.type;
        const newLineCount = chunk.content.split('\n').length;
        let top: number;
        let bottom: number;
        if (type === CHUNK_TYPE_ADD) {
          // ADD：绿色区域在 startLine 前（afterLineNumber = startLine - 1），
          // 所以 top 从上一行底部开始；startLine=1 时 afterLn=0，top=0（文档最顶部）
          const afterLn = chunk.startLine - 1;
          top = afterLn >= 1 ? editor.getTopForLineNumber(afterLn) + lineHeight : 0;
          bottom = top + newLineCount * lineHeight;
        } else if (type === CHUNK_TYPE_DELETE) {
          top = editor.getTopForLineNumber(chunk.startLine);
          bottom = editor.getTopForLineNumber(chunk.endLine) + lineHeight;
        } else {
          top = editor.getTopForLineNumber(chunk.startLine);
          bottom = editor.getTopForLineNumber(chunk.endLine) + lineHeight + newLineCount * lineHeight;
        }

        const distToTop = Math.abs(contentY - top);
        const distToBottom = Math.abs(contentY - bottom);
        const dist = Math.min(distToTop, distToBottom);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = index;
        }
      });

      return bestIndex;
    };

    /** 根据当前 chunk 类型和滚动位置，把操作按钮定位到块下方 */
    const updateWidgetPosition = () => {
      if (!suggestionWidgetDom || suggestionChunks.length === 0) return;
      const chunk = suggestionChunks[currentChunkIndex];
      if (!chunk) return;
      const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
      const newLineCount = chunk.content.split('\n').length;
      const type = chunk.type;
      let top: number;
      if (type === CHUNK_TYPE_ADD) {
        // ADD：按钮定位到绿色区域底部。绿色区域起始 = startLine-1 行底部（startLine=1 时为 0）
        const afterLn = chunk.startLine - 1;
        const zoneTop = afterLn >= 1
          ? editor.getTopForLineNumber(afterLn) + lineHeight
          : 0;
        top = zoneTop - editor.getScrollTop() + newLineCount * lineHeight;
      } else if (type === CHUNK_TYPE_DELETE) {
        top = editor.getTopForLineNumber(chunk.endLine) - editor.getScrollTop() + lineHeight;
      } else {
        const lastOldLineTop = editor.getTopForLineNumber(chunk.endLine) - editor.getScrollTop();
        top = lastOldLineTop + lineHeight + newLineCount * lineHeight;
      }

      suggestionWidgetDom.style.top = `${top}px`;
    };

    /** 清除所有建议 UI：红色装饰、绿色 ViewZone、按钮 DOM、滚动订阅，并恢复可编辑 */
    const clearSuggestion = () => {
      if (suggestionDecorationsCollection) {
        suggestionDecorationsCollection.clear();
        suggestionDecorationsCollection = null;
      }

      if (suggestionViewZoneIds.length > 0) {
        editor.changeViewZones((accessor) => {
          suggestionViewZoneIds.forEach((id) => accessor.removeZone(id));
        });
        suggestionViewZoneIds = [];
      }

      if (suggestionWidgetDom && suggestionWidgetDom.parentNode) {
        suggestionWidgetDom.parentNode.removeChild(suggestionWidgetDom);
      }

      suggestionWidgetDom = null;
      if (suggestionScrollDisposer) {
        suggestionScrollDisposer.dispose();
        suggestionScrollDisposer = null;
      }

      if (suggestionMouseCleanup) {
        suggestionMouseCleanup();
        suggestionMouseCleanup = null;
      }

      lastMouseClientY = null;
      suggestionChunks = [];
      currentChunkIndex = 0;
      editor.updateOptions({ readOnly: false });
    };

/** 接受建议：按 type 执行 ADD（插入）/ DELETE（删除）/ UPDATE（替换）；若还有其余块则重新展示剩余块。
     * @param batchMode 为 true 时不 emit，仅返回本次 payload，供全部采纳时合并上报 */
    const acceptSuggestion = (batchMode?: boolean): (SuggestionChunk & { status: string; action: string }) | undefined => {
      if (suggestionChunks.length === 0) return;
      const model = editor.getModel();
      const lineCount = model?.getLineCount() || 0;
      if (!model) return;
      const chunk = suggestionChunks[currentChunkIndex];
      if (!chunk) return;

      const type = chunk.type;
      const newLineCount = chunk.content.split('\n').length;
      const oldLineCount = chunk.endLine - chunk.startLine + 1;

      let edit: { range: monaco.IRange; text: string };
      let lineDelta: number;
      let anchorLine: number;

      if (type === CHUNK_TYPE_ADD) {
        const sl = Math.max(1, chunk.startLine);
        if (sl > lineCount) {
          // startLine 超出文档：追加到末尾
          const lastCol = model.getLineMaxColumn(lineCount);
          edit = { range: new monaco.Range(lineCount, lastCol, lineCount, lastCol), text: `\n${chunk.content.replace(/\n$/, '')}` };
        } else {
          // startLine 在文档范围内：在行首插入 content+\n，原内容（含空行）整体下推
          const text = chunk.content.endsWith('\n') ? chunk.content : `${chunk.content}\n`;
          edit = { range: new monaco.Range(sl, 1, sl, 1), text };
        }

        lineDelta = newLineCount;
        anchorLine = chunk.startLine;
      } else if (type === CHUNK_TYPE_DELETE) {
        // DELETE / UPDATE 才需要 endLine 列号，此处 endLine 一定 <= lineCount
        const endCol = model.getLineMaxColumn(chunk.endLine);
        if (chunk.endLine < lineCount) {
          edit = {
            range: new monaco.Range(chunk.startLine, 1, chunk.endLine + 1, 1),
            text: '',
          };
        } else if (chunk.startLine > 1) {
            edit = {
              range: new monaco.Range(chunk.startLine - 1, model.getLineMaxColumn(chunk.startLine - 1), chunk.endLine, endCol),
              text: '',
            };
          } else {
            edit = {
              range: new monaco.Range(1, 1, chunk.endLine, endCol),
              text: '',
            };
          }

        lineDelta = -oldLineCount;
        anchorLine = chunk.endLine;
      } else {
        const endCol = model.getLineMaxColumn(chunk.endLine);
        edit = {
          range: new monaco.Range(chunk.startLine, 1, chunk.endLine, endCol),
          text: `${chunk.content}`,
        };
        lineDelta = newLineCount - oldLineCount;
        anchorLine = chunk.endLine;
      }

      const remainingChunks = suggestionChunks
        .filter((_, i) => i !== currentChunkIndex)
        .map((c) => {
          const needShift = type === CHUNK_TYPE_ADD ? c.startLine >= anchorLine : c.startLine > anchorLine;
          if (needShift && lineDelta !== 0) {
            return {
              ...c,
              startLine: c.startLine + lineDelta,
              endLine: c.endLine + lineDelta,
            };
          }

          return c;
        });

      if (batchMode) {
        editor.executeEdits('suggestion-accept', [edit]);
        suggestionChunks.length = 0;
        suggestionChunks.push(...remainingChunks);
        currentChunkIndex = Math.min(currentChunkIndex, remainingChunks.length - 1);

        return { ...chunk, status: 'ACCEPTED', action: 'ACCEPT_DIFF' };
      }

      clearSuggestion();
      editor.executeEdits('suggestion-accept', [edit]);
      if (remainingChunks.length > 0) {
        showSuggestions(remainingChunks, { preserveScroll: true });
      }

      emit('suggestion-accept', { ...chunk, status: 'ACCEPTED', action: 'ACCEPT_DIFF' }, remainingChunks.length || 0);
    };

    /** 拒绝建议：仅取消“当前按钮所在”的那一块；若还有其余块则重新展示剩余块。
     * @param batchMode 为 true 时不 emit，仅返回本次 payload，供全部拒绝时合并上报 */
    const rejectSuggestion = (batchMode?: boolean): (SuggestionChunk & { status: string; action: string }) | undefined => {
      if (suggestionChunks.length === 0) return;
      const chunk = suggestionChunks[currentChunkIndex];
      if (!chunk) return;

      const remainingChunks = suggestionChunks.filter((_, i) => i !== currentChunkIndex);

      if (batchMode) {
        suggestionChunks.length = 0;
        suggestionChunks.push(...remainingChunks);
        currentChunkIndex = Math.min(currentChunkIndex, remainingChunks.length - 1);

        return { ...chunk, status: 'REJECTED', action: 'REJECT_DIFF' };
      }

      clearSuggestion();
      if (remainingChunks.length > 0) {
        showSuggestions(remainingChunks, { preserveScroll: true });
      }

      emit('suggestion-reject', { ...chunk, status: 'REJECTED', action: 'REJECT_DIFF' }, remainingChunks.length || 0);
    };

    /** 全部采纳：先清 UI，再逐块执行文本编辑并收集 payload */
    const acceptAllSuggestions = () => {
      const chunks = [...suggestionChunks];
      clearSuggestion();
      if (chunks.length === 0) return;

      const model = editor.getModel();
      if (!model) return;

      const payloads: Array<{ id: string; sessionId?: string; requestId?: string; action: string; status: string }> = [];
      let cumulativeDelta = 0;

      for (const chunk of chunks) {
        const type = chunk.type;
        const startLine = chunk.startLine + cumulativeDelta;
        const endLine = chunk.endLine + cumulativeDelta;
        const newLineCount = chunk.content.split('\n').length;
        const oldLineCount = chunk.endLine - chunk.startLine + 1;
        const lineCount = model.getLineCount();

        let edit: { range: monaco.IRange; text: string };
        let lineDelta: number;

        if (type === CHUNK_TYPE_ADD) {
          // ADD（批量采纳）：startLine <= lineCount 在行首插入；> lineCount 追加到末尾
          const sl = Math.max(1, startLine);
          if (sl > lineCount) {
            // 追加到文档末尾：前置 \n 换行，去掉 content 末尾多余的 \n 避免空行
            const lastCol = model.getLineMaxColumn(lineCount);
            edit = { range: new monaco.Range(lineCount, lastCol, lineCount, lastCol), text: `\n${chunk.content.replace(/\n$/, '')}` };
          } else {
            const text = chunk.content.endsWith('\n') ? chunk.content : `${chunk.content}\n`;
            edit = { range: new monaco.Range(sl, 1, sl, 1), text };
          }

          lineDelta = newLineCount;
        } else if (type === CHUNK_TYPE_DELETE) {
          if (endLine < lineCount) {
            edit = { range: new monaco.Range(startLine, 1, endLine + 1, 1), text: '' };
          } else if (startLine > 1) {
            edit = {
              range: new monaco.Range(startLine - 1, model.getLineMaxColumn(startLine - 1), endLine, model.getLineMaxColumn(endLine)),
              text: '',
            };
          } else {
            edit = { range: new monaco.Range(1, 1, endLine, model.getLineMaxColumn(endLine)), text: '' };
          }

          lineDelta = -oldLineCount;
        } else {
          edit = {
            range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
            text: `${chunk.content}`,
          };
          lineDelta = newLineCount - oldLineCount;
        }

        editor.executeEdits('suggestion-accept', [edit]);
        cumulativeDelta += lineDelta;
        payloads.push({ ...chunk, status: 'ACCEPTED', action: 'ACCEPT_DIFF' });
      }

      if (payloads.length > 0) {
        emit('suggestion-accept-batch', payloads);
      }
    };

    /** 全部拒绝：收集所有 payload 后清一次 UI，由父组件调用一次 action 接口 */
    const rejectAllSuggestions = () => {
      const payloads: Array<{ id: string; sessionId?: string; requestId?: string; action: string; status: string }> = [];
      while (suggestionChunks.length > 0) {
        const p = rejectSuggestion(true);
        if (p) payloads.push(p);
      }

      clearSuggestion();
      if (payloads.length > 0) {
        emit('suggestion-reject-batch', payloads);
      }
    };

    /**
     * 展示多块 AI 建议：旧代码行标红+删除线，新代码以绿色 ViewZone 插在下方，并显示接受/拒绝按钮。
     * 展示期间编辑器设为只读。一次传入所有修改块，不做流式追加。
     * @param options.preserveScroll - 为 true 时不执行 revealLineInCenter，用于接受/拒绝后重绘剩余块时保持当前滚动
     */
    const showSuggestions = (chunks: SuggestionChunk[], options?: { preserveScroll?: boolean }) => {
      const model = editor.getModel();
      if (!model || chunks.length === 0) return;

      const lineCount = model.getLineCount();
      // 限制行号在 1 到 lineCount 之间
      const clampLine = (line: number) => Math.max(1, Math.min(lineCount, Math.floor(line)));
      // 兼容上游未传 endLine：与 editor-content 的 endLine ?? startLine 同语义，避免 ADD 等路径出现 undefined/NaN
      const withEndLine = chunks.map((c) => {
        const el = c.endLine;
        const end =
          el != null && !Number.isNaN(Number(el)) ? Number(el) : Number(c.startLine);

        return { ...c, endLine: end };
      });
      const sortedChunks = [...withEndLine]
        .filter((c) => {
          const type = c.type;
          // ADD：直接展示，不受 lineCount 限制。
          if (type === CHUNK_TYPE_ADD) return true;
          // DELETE / UPDATE：若 startLine > lineCount（整段都在文档下方），直接过滤掉，不参与后续的 clamp 和展示。
          if (c.startLine > lineCount) return false;

          return true;
        })
        .map((c) => {
          const type = c.type;
          if (type === CHUNK_TYPE_ADD) {
            return { ...c };
          }

          return {
            ...c,
            startLine: clampLine(c.startLine),
            endLine: clampLine(c.endLine),
          };
        })
        .filter((c) => {
          if (c.type === CHUNK_TYPE_ADD) {
            return true;
          }
 
            return c.startLine <= c.endLine;
          
        })
        .sort((a, b) => a.startLine - b.startLine);

      if (sortedChunks.length === 0) return;

      clearSuggestion();
      suggestionChunks = sortedChunks;
      currentChunkIndex = 0;
      editor.updateOptions({ readOnly: true });

      // 1. DELETE / UPDATE：旧代码加红色 decoration（红色背景 + 删除线）。ADD 无红色区间。
      const allDecorations: monaco.editor.IModelDeltaDecoration[] = [];
      for (const chunk of suggestionChunks) {
        const type = chunk.type;
        if (type === CHUNK_TYPE_ADD) continue;
        for (let line = chunk.startLine; line <= chunk.endLine; line++) {
          if (line < 1 || line > lineCount) continue;
          allDecorations.push({
            range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
            options: {
              isWholeLine: true,
              className: 'suggestion-delete-line',
              inlineClassName: 'suggestion-delete-inline',
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          });
        }
      }

      suggestionDecorationsCollection = editor.createDecorationsCollection(allDecorations);

      // 2. ADD / UPDATE：新代码用 ViewZone 渲染。ADD 在 startLine 后插入，UPDATE 在 endLine 后插入。DELETE 无绿色区域。
      editor.changeViewZones((accessor) => {
        for (const chunk of suggestionChunks) {
          const type = chunk.type;
          if (type === CHUNK_TYPE_DELETE) continue;
          const newLines = chunk.content.split('\n');
          if (!chunk.content) continue;
          const domNode = document.createElement('div');
          domNode.className = 'suggestion-insert-zone';

          newLines.forEach((lineText) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'suggestion-insert-zone-line';
            lineDiv.textContent = lineText || ' ';
            domNode.appendChild(lineDiv);
          });

          // ADD：afterLineNumber = startLine-1，绿色区域显示在 startLine 行前面（与接受后内容位置一致）
          // UPDATE：afterLineNumber = endLine，绿色区域显示在被替换区间下方
          // clamp 到 [0, lineCount]，0 表示文档最顶部
          const afterLine = type === CHUNK_TYPE_ADD ? chunk.startLine - 1 : chunk.endLine;
          const afterLineClamped = Math.max(0, Math.min(afterLine, lineCount));
          const zoneId = accessor.addZone({
            afterLineNumber: afterLineClamped,
            heightInLines: newLines.length,
            domNode,
          });
          suggestionViewZoneIds.push(zoneId);
        }
      });

      // 3. 创建“接受 / 拒绝”操作按钮的 DOM（⌘Y 接受，⌘N 拒绝）
      const createWidgetDom = () => {
        const widgetDom = document.createElement('div');
        widgetDom.className = 'suggestion-widget';

        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'suggestion-btn suggestion-btn-reject';
        rejectBtn.textContent = '拒绝';
        rejectBtn.title = '拒绝建议';
        rejectBtn.onclick = (e) => {
          e.stopPropagation();
          rejectSuggestion();
        };

        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'suggestion-btn suggestion-btn-accept';
        acceptBtn.textContent = '接受';
        acceptBtn.title = '接受建议';
        acceptBtn.onclick = (e) => { e.stopPropagation(); acceptSuggestion(); };

        widgetDom.appendChild(rejectBtn);
        widgetDom.appendChild(acceptBtn);

        return widgetDom;
      };

      // 4. 将按钮挂到编辑器容器上，监听滚动以保持按钮在绿色区域下方可见
      const widgetDom = createWidgetDom();
      suggestionWidgetDom = widgetDom;

      const editorDomNode = editor.getDomNode();
      if (editorDomNode) {
        editorDomNode.style.position = 'relative';
        editorDomNode.appendChild(widgetDom);
      }

      suggestionScrollDisposer = editor.onDidScrollChange(() => {
        updateWidgetPosition();
        // 滚动后按「当前鼠标位置」重算 contentY，更新最近块（鼠标没动但内容动了）
        if (suggestionChunks.length > 1 && editorDomNode && lastMouseClientY !== null) {
          const rect = editorDomNode.getBoundingClientRect();
          const contentY = lastMouseClientY - rect.top + editor.getScrollTop();
          const newIndex = getChunkIndexClosestToY(contentY);
          if (newIndex !== currentChunkIndex) {
            currentChunkIndex = newIndex;
            updateWidgetPosition();
          }
        }
      });

      // 多块建议时：根据鼠标 Y 位置，把按钮展示在“距离鼠标最近”的那一块下面。
      // Cursor 式行为：鼠标在按钮上或接近按钮时不再跟随，避免点击时按钮“跑掉”
      if (editorDomNode && suggestionChunks.length > 1) {
        const WIDGET_LOCK_MARGIN = 32; // 鼠标与按钮区域距离小于此值时锁定当前块，不随鼠标切换
        const onMouseMove = (e: MouseEvent) => {
          if (!editorDomNode || suggestionChunks.length <= 1) return;
          if (suggestionWidgetDom && suggestionWidgetDom.contains(e.target as Node)) return;
          // 鼠标接近按钮区域时也锁定，避免移向按钮途中因经过别块而按钮跑掉
          if (suggestionWidgetDom) {
            const wr = suggestionWidgetDom.getBoundingClientRect();
            const expand = WIDGET_LOCK_MARGIN;
            const inZone =
              e.clientX >= wr.left - expand &&
              e.clientX <= wr.right + expand &&
              e.clientY >= wr.top - expand &&
              e.clientY <= wr.bottom + expand;
            if (inZone) return;
          }

          lastMouseClientY = e.clientY;
          const contentY = viewportYToContentY(e.clientY);
          const newIndex = getChunkIndexClosestToY(contentY);
          if (newIndex !== currentChunkIndex) {
            currentChunkIndex = newIndex;
            updateWidgetPosition();
          }
        };

        editorDomNode.addEventListener('mousemove', onMouseMove);
        suggestionMouseCleanup = () => editorDomNode.removeEventListener('mousemove', onMouseMove);
      }

      // 仅首次展示时滚到第一块并居中；接受/拒绝后重绘剩余块时保留当前滚动
      if (!options?.preserveScroll) {
        editor.revealLineInCenter(suggestionChunks[0].startLine);
      }

      requestAnimationFrame(() => updateWidgetPosition());
    };

    // 结束----------------------------------------------------

    // 添加全局parseResult变量
    let globalParseResult: IParseResult | null = null;

    // 优化SQL解析函数
    const debouncedParseSql = (text: string, cursor: any) => {
      if (parseDebounceTimer) {
        clearTimeout(parseDebounceTimer);
      }

      parseDebounceTimer = setTimeout(() => {
        if (!text || text === lastContent) return;
        lastContent = text;

        const model = editor.getModel();
        if (!model) return;

        // 清除错误行高亮
        if (previousDecorations.length > 0) {
          editor.deltaDecorations(previousDecorations, []);
          previousDecorations = [];
        }

        const index = model.getOffsetAt(cursor);
        const sqlBlocks = splitSql(text);

        const currentBlock: any = sqlBlocks.find(
          (block) =>
            cursor.lineNumber >= block.startLine &&
            cursor.lineNumber <= block.endLine,
        );

        if (!currentBlock?.statement) return;

        // 计算当前块的起始偏移量
        const blockStartOffset = model.getOffsetAt({
          lineNumber: currentBlock?.startLine || 1,
          column: 1,
        });
        const relativeIndex = index - blockStartOffset;

        // 获取真实光标位置
        const nextCursor = model.getPositionAt(relativeIndex);
        const realCursor: any = {
          ...nextCursor,
          column: nextCursor?.column! + 1,
        };

        const nextIndex = model.getOffsetAt(realCursor);
        const statement = currentBlock?.statement;

        try {
          globalParseResult = mysqlParser(
            currentBlock?.startLine === 1 ? text : statement,
            currentBlock?.startLine === 1 ? index : nextIndex,
          ) as IParseResult;

          if (globalParseResult?.error) {
            const errorPosition = globalParseResult.error.token
              ? {
                  startLineNumber: model.getPositionAt(
                    globalParseResult?.error?.token?.position![0] +
                      blockStartOffset!,
                  ).lineNumber,
                  startColumn: model.getPositionAt(
                    globalParseResult?.error?.token?.position![0] +
                      blockStartOffset!,
                  ).column,
                  endLineNumber: model.getPositionAt(
                    globalParseResult?.error?.token?.position![1] +
                      blockStartOffset!,
                  ).lineNumber,
                  endColumn:
                    model.getPositionAt(
                      globalParseResult?.error?.token?.position![1] +
                        blockStartOffset!,
                    ).column + 1,
                }
              : {
                  startLineNumber: 0,
                  startColumn: 0,
                  endLineNumber: 0,
                  endColumn: 0,
                };

            monaco.editor.setModelMarkers(model, props.language!, [
              {
                ...errorPosition,
                message: '错误',
                severity: monaco.MarkerSeverity.Error,
              },
            ]);
          } else {
            monaco.editor.setModelMarkers(model, props?.language!, []);
          }
        } catch (error) {
          console.warn('SQL parsing error:', error);
        }
      }, 300); // 增加防抖时间到300ms
    };

    // 优化装饰器更新函数
    const debouncedUpdateDecorations = (position: any) => {
      if (decorationUpdateTimer) {
        clearTimeout(decorationUpdateTimer);
      }

      // 检查光标位置是否真的改变了
      if (
        position.lineNumber === lastCursorPosition.lineNumber &&
        position.column === lastCursorPosition.column
      ) {
        return;
      }

      lastCursorPosition = { ...position };

      decorationUpdateTimer = setTimeout(() => {
        const model = editor.getModel();
        if (!model) return;

        // 清除之前的装饰器
        if (currentLineDecoration.value.length > 0) {
          editor.deltaDecorations(currentLineDecoration.value, []);
          currentLineDecoration.value = [];
        }

        const scriptContent = model.getValue();
        const sqlBlocks = splitSql(scriptContent);
        const currentBlock = sqlBlocks.find(
          (block) =>
            position.lineNumber >= block.startLine &&
            position.lineNumber <= block.endLine,
        );

        if (currentBlock) {
          const decorations = [];
          for (
            let line = currentBlock.startLine;
            line <= currentBlock.endLine;
            line++
          ) {
            decorations.push({
              range: new monaco.Range(line, 1, line, 1),
              options: {
                isWholeLine: true,
                linesDecorationsClassName: 'currentLineDecoration',
              },
            });
          }

          // 更新装饰器
          currentLineDecoration.value = editor.deltaDecorations(
            [],
            decorations,
          );

          // 触发 onRunPosition 更新 selectedScript
          emit('run-position', {
            text: currentBlock.statement,
            startLine: currentBlock.startLine,
          });
        }
      }, 150); // 装饰器更新防抖150ms
    };

    const init = () => {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });

      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
      });

      if (props.language === 'sql') {
        monaco.languages.register({ id: 'hive' });
        monaco.languages.setMonarchTokensProvider('hive', hiveLanguage);
        monaco.languages.setLanguageConfiguration('hive', hiveConf);
      }

      // @ts-ignore
      editor = monaco.editor.create(codeEditBox.value, {
        value: props.modelValue,
        language: props.language === 'sql' ? 'hive' : props.language,
        theme: props.theme,
        // @ts-ignore
        readOnly: props.readOnly,
        ...props.options,
      });

      // 如果是 Python 语言，禁用语法验证以避免第一行误报错误
      if (props.language === 'python') {
        const model = editor.getModel();
        if (model) {
          // 清除所有错误标记
          monaco.editor.setModelMarkers(model, 'python', []);
          // 监听内容变化，持续清除错误标记
          const clearPythonErrors = () => {
            monaco.editor.setModelMarkers(model, 'python', []);
          };

          model.onDidChangeContent(clearPythonErrors);
        }
      }

      // 优化内容变化监听
      editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        const cursor = editor.getPosition();

        // 清除错误行高亮
        if (previousDecorations.length > 0) {
          editor.deltaDecorations(previousDecorations, []);
          previousDecorations = [];
        }

        // 给父组件实时返回最新文本
        emit('update:modelValue', value);
        emit('change', value);

        // 如果是 Python 语言，清除所有错误标记，不进行 SQL 解析
        if (props.language === 'python') {
          const model = editor.getModel();
          if (model) {
            monaco.editor.setModelMarkers(model, 'python', []);
          }
        } else {
          // 使用防抖的SQL解析
          debouncedParseSql(value, cursor);
        }
      });

      // 优化选择变化监听
      editor.onDidChangeCursorSelection(() => {
        if (selectionDebounceTimer) {
          clearTimeout(selectionDebounceTimer);
        }

        selectionDebounceTimer = setTimeout(() => {
          const selection = editor.getSelection();
          if (!selection) return;

          // @ts-ignore
          const text = editor.getModel()?.getValueInRange(selection);
          if (text && selection) {
            emit('select-code', {
              text,
              startLine: selection.startLineNumber,
            });
            // Data Agent：更新「添加为上下文」按钮显示/位置
            updateAddContextButton();
          } else {
            emit('select-code', {
              text: '',
              startLine: 1,
            });
            hideAddContextButton();
          }
        }, 50); // 选择变化防抖50ms
      });

      // 优化滚动监听
      editor.onDidScrollChange(() => {
        if (scrollDebounceTimer) {
          clearTimeout(scrollDebounceTimer);
        }

        scrollDebounceTimer = setTimeout(() => {
          emit('save-position', editor.getScrollTop());
        }, 100); // 滚动防抖100ms
      });

      // 优化光标位置变化监听
      editor.onDidChangeCursorPosition((e) => {
        debouncedUpdateDecorations(e.position);
      });

      // @ts-ignore
      monacoHint.value = monaco.languages.registerCompletionItemProvider(
        props.language === 'sql' ? 'hive' : props.language,
        {
          triggerCharacters:
            '$.:{}=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(
              '',
            ),
          async provideCompletionItems(model, position) {
            // 添加缓存机制，避免重复解析
            const modelValue = model.getValue();
            if (!modelValue || modelValue === lastContent) {
              return { suggestions: [] };
            }

            if (props.language === 'python') {
              const suggestions: any[] = [];
              pythonLanguage.keywords.forEach(item => {
                suggestions.push({
                  label: item,
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: item
                });
              });

              return {
                suggestions
              }
            }

            try {
              // 在代码补全前先获取最新的globalParseResult
              const model = editor.getModel();
              if (model) {
                const index = model.getOffsetAt(position);
                const sqlBlocks = splitSql(modelValue);

                const currentBlock: any = sqlBlocks.find(
                  (block) =>
                    position.lineNumber >= block.startLine &&
                    position.lineNumber <= block.endLine,
                );

                if (currentBlock?.statement) {
                  // 计算当前块的起始偏移量
                  const blockStartOffset = model.getOffsetAt({
                    lineNumber: currentBlock?.startLine || 1,
                    column: 1,
                  });
                  const relativeIndex = index - blockStartOffset;

                  // 获取真实光标位置
                  const nextCursor = model.getPositionAt(relativeIndex);
                  const realCursor: any = {
                    ...nextCursor,
                    column: nextCursor?.column! + 1,
                  };

                  const nextIndex = model.getOffsetAt(realCursor);
                  const statement = currentBlock?.statement;

                  try {
                    globalParseResult = mysqlParser(
                      currentBlock?.startLine === 1 ? modelValue : statement,
                      currentBlock?.startLine === 1 ? index : nextIndex,
                    ) as IParseResult;
                  } catch (error) {
                    console.warn('SQL parsing error in completion:', error);
                  }
                }
              }

              const cursorInfo = await reader.getCursorInfo(
                globalParseResult?.ast,
                globalParseResult?.cursorKeyPath!,
              );

              const parserSuggestion = pipeKeywords(
                globalParseResult?.nextMatchings,
              );
              if (!cursorInfo) {
                return {
                  suggestions: parserSuggestion || [],
                };
              }

              switch (cursorInfo.type) {
                case 'tableField':
                  const cursorRootStatementFields =
                    await reader.getFieldsFromStatement(
                      globalParseResult?.ast,
                      globalParseResult?.cursorKeyPath!,
                      async (table) => {
                        return await onSuggestTableFields?.(table, props);
                      },
                    );
                  const groups = _.groupBy(
                    cursorRootStatementFields.filter(
                      (cursorRootStatementField) => {
                        return (
                          cursorRootStatementField.groupPickerName !== null
                        );
                      },
                    ),
                    'groupPickerName',
                  );
                  const functionNames = await onSuggestFunctionName(props);

                  return {
                    suggestions: (cursorRootStatementFields || [])
                      .concat(parserSuggestion)
                      .concat(functionNames)
                      .concat(
                        // @ts-ignore
                        groups
                          ? Object.keys(groups).map((groupName) => {
                              return onSuggestFieldGroup!(groupName);
                            })
                          : [],
                      )
                      .sort((a, b) => {
                        return (
                          a.label.localeCompare(b.label) &&
                          b.weight! - a.weight!
                        );
                      }),
                  };
                case 'tableName':
                  const tableNames = await onSuggestTableNames?.(
                    cursorInfo?.tableInfo,
                    props,
                  );

                  return {
                    suggestions: (tableNames as any) || [],
                  };
                case 'tableFieldAfterGroup':
                  // 字段 . 后面的部分
                  const cursorRootStatementFieldsAfter =
                    await reader.getFieldsFromStatement(
                      globalParseResult?.ast,
                      globalParseResult?.cursorKeyPath as any,
                      (table) => {
                        return onSuggestTableFields?.(table, props);
                      },
                    );

                  return {
                    suggestions: (cursorRootStatementFieldsAfter || [])
                      .filter((cursorRootStatementField: any) => {
                        return (
                          cursorRootStatementField.groupPickerName ===
                          (cursorInfo as ICursorInfo<{ groupName: string }>)
                            .groupName
                        );
                      })
                      .concat(parserSuggestion),
                  };
              }

              return {
                suggestions: [],
              };
            } catch (error) {
              console.warn('Auto-completion error:', error);

              return { suggestions: [] };
            }
          },
        },
      );

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        emit('run-code');
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
        emit('explain-code');
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        emit('save-code');
      });


      // 修复格式化快捷键绑定
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => {
          emit('format-code');
        },
      );

      editor.addAction({
        id: 'custom.action.format',
        label: 'Format',
        contextMenuGroupId: '9_cutcopypaste',
        run: (editor) => {
          const value = editor.getValue();
          if (value) {
            const formattedValue = formatSqlWithLanguages(value);
            if (formattedValue) {
              editor.setValue(formattedValue);
            }
          }
        },
      });

      editor.addAction({
        id: 'custom.action.selectColumn',
        label: '列选择',
        contextMenuGroupId: '9_cutcopypaste',
        run: (editor) => {
          columnSelection.value = !columnSelection.value;
          editor.updateOptions({
            columnSelection: columnSelection.value,
          });
        },
      });

      editor.addAction({
        id: 'custom.action.runSection',
        label: '运行选中内容',
        contextMenuGroupId: 'navigation',
        run: (editor) => {
          const selection = editor.getSelection();
          if (!selection) return;

          // @ts-ignore
          const text = editor.getModel()?.getValueInRange(selection);
          if (text && selection) {
            emit('change-select', {
              text,
              startLine: selection.startLineNumber,
            });
          } else {
            message.error('请选中内容');
          }
        },
      });

      editor.addAction({
        id: 'custom.action.runPosSection',
        label: '运行当前区块',
        contextMenuGroupId: 'navigation',
        run: (editor) => {
          const value = editor.getValue();
          // @ts-ignore
          const { positionLineNumber } = editor.getSelection();
          emit('change-position', { value, positionLineNumber });
        },
      });

      // 处理右键菜单
      const removableIds = [
        'editor.action.refactor',
        'editor.action.sourceAction',
        'editor.action.revealDefinition',
        'editor.action.revealDeclaration',
        'editor.action.goToTypeDefinition',
        'editor.action.goToImplementation',
        'editor.action.goToReferences',
        'editor.action.formatDocument',
        'editor.action.formatSelection',
        'editor.action.changeAll',
        'editor.action.rename',
        'editor.action.quickOutline',
        'editor.action.quickCommand',
        'Peek',
      ];
      const menus = actions.MenuRegistry._menuItems;
      const contextMenuEntry = [...menus].find(
        (entry) =>
          entry[0]._debugName == 'EditorContext' ||
          entry[0].id == 'EditorContext',
      );
      const contextMenuLinks = contextMenuEntry[1] || '';

      // @ts-ignore
      const removeById = (list, ids) => {
        let node = list._first;
        do {
          const shouldRemove = ids.includes(
            node.element?.command?.id || node.element?.title,
          );
          if (shouldRemove) {
            list._remove(node);
          }
        } while ((node = node.next));
      };

      removeById(contextMenuLinks, removableIds);

      emit('editor-mounted', editor);
    };

    const resetEditor = () => {
      // 清理所有定时器
      if (parseDebounceTimer) {
        clearTimeout(parseDebounceTimer);
        parseDebounceTimer = null;
      }

      if (decorationUpdateTimer) {
        clearTimeout(decorationUpdateTimer);
        decorationUpdateTimer = null;
      }

      if (selectionDebounceTimer) {
        clearTimeout(selectionDebounceTimer);
        selectionDebounceTimer = null;
      }

      if (scrollDebounceTimer) {
        clearTimeout(scrollDebounceTimer);
        scrollDebounceTimer = null;
      }

      // 清除所有装饰器
      if (editor) {
        clearSuggestion();
        if (previousDecorations.length > 0) {
          editor.deltaDecorations(previousDecorations, []);
          previousDecorations = [];
        }

        if (currentLineDecoration.value.length > 0) {
          editor.deltaDecorations(currentLineDecoration.value, []);
          currentLineDecoration.value = [];
        }
      }

      // @ts-ignore
      monacoHint.value?.dispose();
      // @ts-ignore
      monacoHover.value?.dispose();
      editor?.dispose();
    };

    watch(
      () => props.modelValue,
      (newValue) => {
        if (editor && newValue) {
          const value = editor.getValue();
          if (newValue !== value) {
            editor.setValue(newValue);
          }
        }
      },
    );

    watch(
      () => props.engine,
      (val) => {
        if (val) {
          fetchFunctionList();
        }
      },
    );

    watch(
      () => props.theme,
      (newValue) => {
        monaco.editor.setTheme(newValue);
      },
    );

    /** 由 props.sqlEdits 驱动：有数据时展示建议块，置空时清除对比状态 */
    watch(
      () => props.sqlEdits as SuggestionChunk[],
      (edits: SuggestionChunk[]) => {
        if (!editor) return;
        if (!Array.isArray(edits) || edits.length === 0) {
          clearSuggestion();

          return;
        }

        const chunks: SuggestionChunk[] = edits;
        nextTick(() => {
          showSuggestions(chunks);
        });
      },
      { deep: true },
    );

    watch(
      () => props.options,
      (newValue) => {
        // @ts-ignore
        editor.updateOptions(newValue);
      },
      { deep: true },
    );

    watch(
      () => props.readOnly,
      (newValue) => {
        editor.updateOptions({ readOnly: newValue });
      },
    );

    watch(
      () => props.language,
      (newValue) => {
        const model = editor.getModel();
        if (model) {
          const targetLang = newValue === 'sql' ? 'hive' : newValue;
          monaco.editor.setModelLanguage(model, targetLang);
          // 如果是 Python 语言，清除所有错误标记
          if (newValue === 'python') {
            monaco.editor.setModelMarkers(model, 'python', []);
          }
        }
      },
    );

    let previousDecorations: string[] = [];

    watch(
      () => props.errorLine,
      (newValue) => {
        if (newValue && editor) {
          const lineNumber = Number(newValue);
          const model = editor.getModel();

          if (model && lineNumber > 0 && lineNumber <= model.getLineCount()) {
            editor.revealLineInCenter(lineNumber);

            // 清除之前的装饰
            editor.deltaDecorations(previousDecorations, []);

            // 添加新的装饰
            const decorations = editor.deltaDecorations(
              [],
              [
                {
                  range: new monaco.Range(
                    lineNumber,
                    1,
                    lineNumber,
                    model.getLineMaxColumn(lineNumber),
                  ),
                  options: {
                    isWholeLine: true,
                    className: 'error-line-highlight',
                    inlineClassName: 'error-line-highlight',
                  },
                },
              ],
            );

            // 保存装饰的引用
            previousDecorations = decorations;
          }
        } else if (!newValue) {
          editor.deltaDecorations(previousDecorations, []);
        }
      },
    );

    const rebindShortcuts = () => {
      if (!editor) return;

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        emit('run-code');
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
        emit('explain-code');
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        emit('save-code');
      });
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => {
          emit('format-code');
        },
      );
    };

    const focus = () => {
      if (editor) {
        editor.focus();
        editor.layout();
        rebindShortcuts();

        // 获取当前光标位置
        const position = editor.getPosition();
        if (position) {
          // 手动触发光标位置变化的逻辑
          const model = editor.getModel();
          if (model) {
            const scriptContent = model.getValue();
            const sqlBlocks = splitSql(scriptContent);
            const currentBlock = sqlBlocks.find(
              (block) =>
                position.lineNumber >= block.startLine &&
                position.lineNumber <= block.endLine,
            );

            if (currentBlock) {
              const decorations = [];
              for (
                let line = currentBlock.startLine;
                line <= currentBlock.endLine;
                line++
              ) {
                decorations.push({
                  range: new monaco.Range(line, 1, line, 1),
                  options: {
                    isWholeLine: true,
                    linesDecorationsClassName: 'currentLineDecoration',
                  },
                });
              }

              // 清除之前的装饰器
              if (currentLineDecoration.value.length > 0) {
                editor.deltaDecorations(currentLineDecoration.value, []);
                currentLineDecoration.value = []; // 清空装饰器数组
              }

              // 更新装饰器
              currentLineDecoration.value = editor.deltaDecorations(
                [],
                decorations,
              );

              emit('run-position', {
                text: currentBlock.statement,
                startLine: currentBlock.startLine,
              });
            }
          }
        }
      }
    };

    const clear = () => {
      if (editor) {
        // 清除错误行高亮
        if (previousDecorations.length > 0) {
          editor.deltaDecorations(previousDecorations, []);
          previousDecorations = [];
        }

        editor.setValue('');
      }
    };

    /** 直接设置编辑器内容（供 Copilot 回填等场景使用） */
    const setValue = (content: string) => {
      if (editor) {
        editor.setValue(content ?? '');
      }
    };

    onBeforeUnmount(() => {
      hideAddContextButton();
      resetEditor();
    });

    onMounted(() => {
      resetEditor();
      init();
      nextTick(() => {
        if (props.beforePosition) {
          const position = String(props.beforePosition);
          editor.setScrollTop(parseFloat(position));
        }
      });
    });

    return { codeEditBox, focus, rebindShortcuts, clear, setValue, showSuggestions, acceptSuggestion, rejectSuggestion, acceptAllSuggestions, rejectAllSuggestions, placeholder, modelValue, width, height };
  },
});
</script>

<style lang="less" scoped>
.code-box-wrapper {
  position: relative;
  // width: v-bind(width);
  height: v-bind(height);
  min-width: 500px;
  width: 100%;
  overflow: hidden;
}

.codeEditBox {
  width: 100%;
  min-width: 500px;
  min-height: 100%;
  height: 100%;
}

.code-box-placeholder {
  position: absolute;
  top: 0;
  left: 64px;
  right: 0;
  padding: 4px 0;
  color: #aaa;
  font-family: Menlo, Monaco, 'Courier New', monospace;
  font-size: 14px;
  line-height: 19px;
  white-space: pre-wrap;
  pointer-events: none;
  z-index: 1;
}

:global(.currentLineDecoration) {
  border-left: 3px solid #1e90ff;
  margin-left: 5px;
}

:global(.error-line-highlight) {
  background-color: rgba(255, 0, 0, 0.2);
}

:global(.suggestion-delete-line) {
  background-color: rgba(255, 0, 0, 0.12) !important;
}

:global(.suggestion-delete-inline) {
  // text-decoration: line-through;
  opacity: 0.5;
}

:global(.suggestion-insert-zone) {
  background-color: rgba(35, 134, 54, 0.12);
  // border-left: 3px solid rgba(35, 134, 54, 0.5);
  // padding-left: 4px;
  user-select: text;
}

:global(.suggestion-insert-zone-line) {
  font-family: Menlo, Monaco, 'Courier New', monospace;
  font-size: 14px;
  line-height: 19px;
  min-height: 19px;
  white-space: pre;
}

:global(.suggestion-widget) {
  position: absolute;
  right: 16px;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 3px;
  width: max-content;
  padding: 2px 4px;
  background: #252526;
  border: 1px solid #454545;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  // z-index: 100;
  pointer-events: auto;
}

:global(.suggestion-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  line-height: 16px;
  border: 1px solid #555;
  color: #ccc;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Data Agent 需求：「添加为上下文」按钮样式，参考 Cursor Add to Chat 风格 */
:global(.code-box-add-context-btn) {
  display: flex !important;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  font-size: 10px;
  line-height: 16px;
  color: #1677ff;
  background: #fff;
  border: none;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  pointer-events: auto;
  transition: color 0.2s, background 0.2s, box-shadow 0.2s;
}

:global(.code-box-add-context-btn:hover) {
  color: #4096ff;
  background: #e6f4ff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

:global(.code-box-add-context-btn__icon) {
  font-size: 10px;
  line-height: 1;
  color: #722ed1;
}

:global(.code-box-add-context-btn__text) {
  white-space: nowrap;
}

/* 深色主题：参考 Cursor 未 hover 状态 - 深灰底、浅灰字、无边框、轻微阴影 */
:global(.vs-dark .code-box-add-context-btn),
:global(.monaco-editor.vs-dark .code-box-add-context-btn) {
  color: #b4b4b4;
  background: #3c3c3c;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

/* 深色主题：参考 Cursor hover 状态 - 略亮灰底、白色字、轻微浮起 */
:global(.vs-dark .code-box-add-context-btn:hover),
:global(.monaco-editor.vs-dark .code-box-add-context-btn:hover) {
  color: #ffffff;
  background: #505050;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
}

:global(.suggestion-btn-reject) {
  background: #333;
  &:hover {
    background: #444;
  }
}

:global(.suggestion-btn-accept) {
  background: #0e639c;
  color: #fff;
  &:hover {
    background: #1177bb;
  }
}
</style>
