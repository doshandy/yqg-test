/**
 * @Author: weisun
 * @Date: 2024/5/6-10:12
 * @Last Modified by: weisun
 * @Last Modified time: 2024/5/6-10:12
 */

import type { PropType } from 'vue';

export type Theme = 'vs' | 'hc-black' | 'vs-dark';
export type FoldingStrategy = 'auto' | 'indentation';
export type RenderLineHighlight = 'all' | 'line' | 'none' | 'gutter';
export interface Options {
  automaticLayout: boolean; // 自适应布局
  foldingStrategy: FoldingStrategy; // 折叠方式  auto | indentation
  renderLineHighlight: RenderLineHighlight; // 行亮
  selectOnLineNumbers: boolean; // 显示行号
  columnSelection: boolean; // 列选择
  minimap: {
    // 关闭小地图
    enabled: boolean;
  };
  readOnly: boolean; // 只读
  fontSize: number; // 字体大小
  scrollBeyondLastLine: boolean; // 取消代码后面一大段空白
  overviewRulerBorder: boolean; // 不要滚动条的边框
  // 鼠标滚轮事件，默认情况下 Monaco 在代码编辑器容器里不对该事件做冒泡，也就导致当你在编辑器里用鼠标滚轮滚动到底部时也无法触发页面的滚动
  // 因此需要将该配置设置为 false 。
  scrollbar: {
    alwaysConsumeMouseWheel: boolean;
  };
  // 滚动时的代码块提示
  stickyScroll: {
    enabled: boolean;
  };
  suggestOnTriggerCharacters: boolean; // 自动提示
  wordBasedSuggestions: boolean; // 单词建议
  parameterHints: {
    enabled: boolean; // 参数提示
  };
  quickSuggestions: boolean; // 自动完成
  occurrencesHighlight: boolean; // 高亮相同项
  // 性能优化配置
  largeFileOptimizations: boolean; // 大文件优化
  maxTokenizationLineLength: number; // 最大词法分析行长度
  maxTokenizationLineNumber: number; // 最大词法分析行数
  renderWhitespace:
    | 'none'
    | 'boundary'
    | 'mark'
    | 'selection'
    | 'trailing'
    | 'all'; // 空白字符渲染
  renderControlCharacters: boolean; // 渲染控制字符
  renderLineHighlightOnlyWhenFocus: boolean; // 仅在聚焦时渲染行高亮
  // 自动完成性能优化
  quickSuggestionsDelay: number; // 自动完成延迟
  suggest: {
    localityBonus: boolean; // 本地性奖励
    snippetsPreventQuickSuggestions: boolean; // 代码片段阻止快速建议
    showIcons: boolean; // 显示图标
    maxVisibleSuggestions: number; // 最大可见建议数
    filteredTypes: {
      keyword: boolean;
      snippet: boolean;
      [key: string]: boolean;
    };
  };
  // 语法高亮优化
  bracketPairColorization: {
    enabled: boolean; // 括号对着色
  };
  guides: {
    bracketPairs: boolean; // 括号对引导线
    indentation: boolean; // 缩进引导线
  };
}

export interface SuggestionChunk {
  sessionId: string;
  requestId: string;
  id: string;
  type: string;
  startLine: number;
  startColumn?: number;
  endLine: number;
  endColumn?: number;
  content: string;
}

export const editorProps = {
  curSqlParams: {
    type: Object as PropType<Options>,
    default: {},
  },
  databaseOptions: {
    type: Array as PropType<Array<any>>,
    default: [],
  },
  modelValue: {
    type: String as PropType<string>,
    default: null,
  },
  dataSourceId: {
    type: [String, Number] as PropType<string | number>,
    default: '',
  },
  engine: {
    type: String as PropType<string>,
    default: '',
  },
  width: {
    type: [String, Number] as PropType<string | number>,
    default: '100%',
  },
  height: {
    type: [String, Number] as PropType<string | number>,
    default: '100%',
  },
  language: {
    type: String as PropType<string>,
    default: 'sql',
  },
  theme: {
    type: String as PropType<Theme>,
    validator(value: string): boolean {
      return ['vs', 'hc-light', 'hc-black', 'vs-dark'].includes(value);
    },
    default: 'vs-dark',
  },
  readOnly: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  columnSelection: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  beforePosition: {
    type: [String, Number] as PropType<string | number>,
    default: 0,
  },
  errorLine: {
    type: [String, Number] as PropType<string | number>,
    default: null,
  },
  paneKey: {
    type: [String, Number] as PropType<string | number>,
    default: '',
  },
  placeholder: {
    type: String as PropType<string>,
    default: '',
  },
  /** Copilot SHOW_SQL_DIFF_CARD 下发的 SQL 变更，用于在编辑器中展示建议块 */
  sqlEdits: {
    type: Array as PropType<Array<SuggestionChunk>>,
    default: () => [],
  },
  /** 是否展示「添加为上下文」浮层（与 Copilot 入口一致，由父组件控制） */
  showAddToContext: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  options: {
    type: Object as PropType<Options>,
    default () {
      return {
        automaticLayout: true,
        foldingStrategy: 'indentation',
        selectOnLineNumbers: true,
        columnSelection: false,
        minimap: {
          enabled: false,
        },
        fontSize: 14,
        scrollBeyondLastLine: true,
        overviewRulerBorder: false,
        formatOnPaste: true,
        autoIndex: true,
        tabCompletion: 'on',
        autoClosingBrackets: 'always',
        autoClosingOvertype: 'always',
        autoClosingQuotes: 'always',
        quickSuggestionsDelay: 200, // 增加延迟以减少频繁触发
        colorDecorators: true,
        scrollbar: {
          alwaysConsumeMouseWheel: false,
        },
        suggestOnTriggerCharacters: true,
        wordBasedSuggestions: true,
        parameterHints: {
          enabled: true,
        },
        stickyScroll: {
          enabled: false,
        },
        quickSuggestions: true,
        selectionHighlight: false,
        occurrencesHighlight: false,
        renderLineHighlight: false,
        // 快捷键相关配置
        multiCursorModifier: 'alt', // 多光标修饰键
        accessibilitySupport: 'auto', // 无障碍支持
        // 性能优化配置
        largeFileOptimizations: true,
        maxTokenizationLineLength: 20000,
        maxTokenizationLineNumber: 20000,
        renderWhitespace: 'none',
        renderControlCharacters: false,
        renderLineHighlightOnlyWhenFocus: true,
        // 自动完成性能优化
        suggest: {
          localityBonus: false,
          snippetsPreventQuickSuggestions: true,
          showIcons: false,
          maxVisibleSuggestions: 12,
          filteredTypes: {
            keyword: true,
            snippet: false,
          },
        },
        // 语法高亮优化
        bracketPairColorization: {
          enabled: false, // 关闭括号对着色以提高性能
        },
        guides: {
          bracketPairs: false,
          indentation: false,
        },
      };
    },
  },
};
