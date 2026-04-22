<!-- Copilot 智能助手界面 -->
<template>
  <div class="copilot">
    <div v-if="copilotLoading" class="copilot-loading-overlay">
      <Spin />
    </div>
    <CopilotHeader
      @new-chat="onNewChat"
      @close="onClose"
    />
    <CopilotMain
      :messages="messages"
      :quick-intents="quickIntents"
      :intent-map="intentMap"
      :intent-tag="intentTag"
      :has-more="hasMore"
      :load-more-loading="loadMoreMessagesLoading"
      :ai-reply-loading="aiReplyLoading"
      @load-more="loadMoreMessages"
      @overwrite-msg="onOverwriteMsg"
      @revert-msg="onRevertMsg"
      @quick-action="onQuickAction"
      @clarify-select="onClarifySelect"
      @associate-table="onAssociateTable"
    />
    <CopilotFooter
      v-model:input-value="inputValue"
      :context-tags="contextTags"
      :ai-reply-loading="aiReplyLoading"
      :quick-intents="quickIntents"
      :sync-slash-key="intentTag"
      :task-name="taskName"
      @send="onSend"
      @stop="onStopGeneration"
      @remove-context-tag="removeContextTag"
      @at-select="onAtSelect"
      @slash-select="onSlashSelect"
    />
    <AssociateTableModal
      :open="associateTableModalVisible"
      :associate-table-payload="associateTablePayload"
      @close="onAssociateTableModalClose"
      @confirm="onAssociateTableConfirm"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { message, Spin } from 'ant-design-vue';
import AssociateTableModal from './modal/associate-table-modal/index.vue';
import CopilotFooter from './components/copilot-footer/index.vue';
import CopilotHeader from './components/copilot-header/index.vue';
import CopilotMain from './components/copilot-main/index.vue';
import {
  type ChatMessage,
  type AiMessage,
  type UserMessage,
  type ContextTag,
  type ContextTagTable,
  type ClarifySelectPayload,
  THOUGHT_CHAIN,
  INTENT_RECOGNITION,
  EXECUTION_STEP,
  OUTPUT_CONTENT,
  CONTEXT_READ,
  INTERACTIVE_CARD,
  THOUGHT_DETAIL,
  FRONTEND_ACTION,
  USER,
  ASSISTANT,
} from './constant';
import CopilotApi from './resources/copilot';
import {
  pageOperationManager,
  PAGE_OP_COPILOT_REPLACE_CODE,
  PAGE_OP_COPILOT_REVERT_CODE,
  PAGE_OP_DATA_MAP_LOCATE_TABLE,
} from './manage/PageOperationManager';
import ProjectStorage from '@/storage/project';

const props = defineProps<{
  intentTag?: string;
  taskCode?: string;
  taskName?: string;
  /** 当前脚本内容，来自 code-box-new 编辑器 */
  currentScriptContent?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'copilot-reply-loading', loading: boolean): void;
}>();

const getProjectId = () => ProjectStorage.get();

const sessionId = ref<string | undefined>(undefined);
const intentTag = ref<string | undefined>(props.intentTag);
const inputValue = ref('');
const messages = ref<ChatMessage[]>([]);
const associateTableModalVisible = ref(false);
/** 选表弹窗打开来源：'context-card' 上下文卡片内按钮，'footer' 输入框 @ 按钮 */
const associateTablePayload = ref<{ requestId?: string; sessionId?: string; source?: 'context-card' | 'footer' } | undefined>(undefined);
const curAiMessage = ref<AiMessage | null>(null);
const abortController = ref<AbortController | null>(null);
const cancelAbortController = ref<AbortController | null>(null);
const actionAbortController = ref<AbortController | null>(null);
const contextTags = ref<ContextTag[]>([]);
const aiReplyLoading = ref(false);

const hasMore = ref(false);
const page = ref(1);
const copilotLoading = ref(false);
const loadMoreMessagesLoading = ref(false);
const intentMap = ref<Record<string, string>>({});

watch(
  aiReplyLoading,
  (loading) => {
    emit('copilot-reply-loading', loading);
  },
  { immediate: true }
);


/** 快捷意图列表（来自接口 quick-intents），用于 footer / 能力选择 */
const quickIntents = ref<{ value: string; label: string }[]>([]);

watch(
  () => props.intentTag,
  (value) => {
    intentTag.value = value;
  }
);

const removeContextTag = (id: string) => {
  contextTags.value = contextTags.value.filter((t) => t.id !== id);
};

onMounted(() => {
  fetchQuickIntents();
  fetchEnums();
  initSessions();
});

onUnmounted(() => {
  resetConversationState();
});

const fetchEnums = async () => {
  const params = {
    name: 'IntentType',
  };
  try {
    const res = await CopilotApi.getEnums({params, hideLoading: true});
    const body = res.data?.body || [];

    const tempIntentMap: Record<string, string> = {};
    body.forEach((item: any) => {
      tempIntentMap[item.value] = item.label;
    });

    intentMap.value = tempIntentMap;

  } catch (e) {
    console.warn('getEnums failed', e);
  }
};

const fetchQuickIntents = async () => {
  try {
    const res = await CopilotApi.getQuickIntents({hideLoading: true});
    const list = (res as { data?: { body?: { value: string; label: string; code?: string | null }[] } })?.data?.body ?? [];
    quickIntents.value = Array.isArray(list)
      ? list.map((item) => ({ value: item.value, label: item.label })).filter((o) => o.value)
      : [];
  } catch (e) {
    console.warn('getQuickIntents failed', e);
  }
};

const getRecentMessages = async (id: string) => {
  hasMore.value = false;
  const getRecentMessagesParams = {
    sessionId: id,
    page: page.value,
    size: 50,
  };
  const res = await CopilotApi.getRecentMessages({params: getRecentMessagesParams, hideLoading: true});
  const bodyData = res.data?.body || {};

  const messagesData = bodyData?.items || [];
  hasMore.value = bodyData?.hasMore ?? false;

  // 处理消息数据
  const tempMessages: ChatMessage[] = [];
  messagesData.forEach((messageItem: any) => {
    const messageSeqNo = messageItem.messageSeqNo ?? 0;
    const requestId = messageItem.requestId ?? '';
    const sessionId = messageItem.sessionId ?? '';
    const feedback = messageItem.feedback ?? {};
    const contextReferences = messageItem.contextReferences ?? [];
    if (messageItem.role === USER) {
      const content = messageItem.delta?.items?.[0]?.content ?? '';
      const userMessage = getUserMessage(content, { messageSeqNo, requestId, sessionId });
      tempMessages.push(userMessage);
    } else if (messageItem.role === ASSISTANT) {
      curAiMessage.value = null;

      const aiMessage = initAiMessage({ sessionId, messageSeqNo, requestId, feedback, contextReferences, thinking: false });
      tempMessages.push(aiMessage);
      handleStreamData(messageItem, aiMessage, { skipFrontendActions: true });
    }
  });

  if (page.value === 1) {
    const lastItem = messagesData[messagesData.length - 1];
    const refs = lastItem?.contextReferences ?? [];
    if (Array.isArray(refs) && refs.length > 0) {
      contextTags.value = refs.map((r: any, i: number) => {
        if (r.type === 'TABLE') {
          return { id: `table-${Date.now()}-${i}`, type: 'TABLE' as const, tableName: r.tableName };
        }

        return {
          id: `tag-${Date.now()}-${i}`,
          type: 'CODE_SNIPPET' as const,
          taskName: r.taskName ?? '',
          codeContent: r.codeContent ?? '',
          selection: r.selection ?? { selectedText: '' },
        };
      });
    }
  }

  messages.value = [...tempMessages, ...messages.value];
}

const loadMoreMessages = async () => {
  if (!sessionId.value || !hasMore.value || loadMoreMessagesLoading.value) return;
  loadMoreMessagesLoading.value = true;
  page.value += 1;
  try {
    await getRecentMessages(sessionId.value);
  } catch (e) {
    page.value -= 1;
    console.warn('loadMoreMessages failed', e);
    message.error('加载更多失败');
  } finally {
    loadMoreMessagesLoading.value = false;
  }
};

const initSessions = async () => {
  const getSessionsParams = {
    taskCode: props.taskCode,
  };
  copilotLoading.value = true;
  try {
    const res = await CopilotApi.getSessions({params: getSessionsParams, hideLoading: true});
    const items = res.data?.body?.items || [];
    if (items.length > 0) {
      const latestSession = items[0];
      if (latestSession?.id) {
        sessionId.value = latestSession.id;

        await getRecentMessages(latestSession.id);
      }
    } else if (props.taskCode) {
        const newSessionId = await createSession(props.taskCode);
        sessionId.value = newSessionId;
      }
  } catch (e) {
    console.warn('getSessions failed', e);
  } finally {
    copilotLoading.value = false;
  }
};

const createSession = async (taskCode: string) => {
  const res = await CopilotApi.postSessions({
    taskCode,
    agentType: 'TEXT2SQL',
  });
  const body = res.data?.body || {};

  return body.id;
};

/** 供父组件调用的添加上下文标签。TABLE 传 type + tableName；CODE_SNIPPET 传 type + codeContent + selection */
const addContextTag = (
  tag:
    | { type: 'TABLE'; tableName: string }
    | {
        type: 'CODE_SNIPPET';
        taskName: string;
        codeContent: string;
        selection: { startLine?: number; endLine?: number; selectedText: string };
      }
) => {
  if (tag.type === 'TABLE') {
    if (contextTags.value.some((t) => t.type === 'TABLE' && t.tableName === tag.tableName)) return;
    contextTags.value = [
      ...contextTags.value,
      { id: `tag-${Date.now()}`, type: 'TABLE', tableName: tag.tableName },
    ];
  } else {
    const { taskName, codeContent, selection } = tag;
    // 代码片段只保留一个，新的替换老的
    contextTags.value = [
      ...contextTags.value.filter((t) => t.type !== 'CODE_SNIPPET'),
      { id: `tag-${Date.now()}`, type: 'CODE_SNIPPET', taskName, codeContent, selection },
    ];
  }
}

// 重置会话状态
const resetConversationState = () => {
  abortController.value?.abort();
  abortController.value = null;
  cancelAbortController.value?.abort();
  cancelAbortController.value = null;
  actionAbortController.value?.abort();
  actionAbortController.value = null;
  aiReplyLoading.value = false;
  curAiMessage.value = null;
  messages.value = [];
  inputValue.value = '';
  contextTags.value = [];
  associateTableModalVisible.value = false;
  associateTablePayload.value = undefined;
  sessionId.value = undefined;
  setIntentTag(undefined);
  page.value = 1;
  hasMore.value = false;
  copilotLoading.value = false;
  loadMoreMessagesLoading.value = false;  
}

const onNewChat = async () => {
  if (!props.taskCode) {
    message.warning('当前任务缺少 taskCode，无法新建会话');

    return;
  }

  resetConversationState();

  try {
    const newSessionId = await createSession(props.taskCode);
    if (newSessionId) {
      sessionId.value = newSessionId;
    }
  } catch (e) {
    console.warn('create new session failed', e);
    message.error('新建会话失败');
  }
};

const onClose = () => {
  emit('close');
};

const setIntentTag = (key?: string) => {
  intentTag.value = key;
};

const getUserMessage = (text: string, options: { messageSeqNo?: number; requestId?: string; sessionId?: string } = {}): UserMessage => {
  const uniqueId = uuidv4();

  return {
    uniqueId,
    requestId: options.requestId || uniqueId,
    sessionId: options.sessionId ?? sessionId.value,
    messageSeqNo: options.messageSeqNo ?? null,
    role: USER,
    content: text,
  };
};

const initAiMessage = ({
  sessionId,
  messageSeqNo,
  requestId,
  thinking,
  feedback,
  contextReferences,
}: {
  sessionId: string | null;
  messageSeqNo: number | null;
  requestId: string | null;
  thinking?: boolean;
  feedback?: any;
  contextReferences?: any;
}): AiMessage => {
  return {
    uniqueId: uuidv4(),
    requestId,
    sessionId,
    messageSeqNo,
    role: ASSISTANT,
    listItems: [
      {
        renderCategory: THOUGHT_CHAIN,
        content: [
          {
            type: INTENT_RECOGNITION,
            intent: '',
          },
          {
            type: EXECUTION_STEP,
            steps: [],
          },
          {
            type: CONTEXT_READ,
            contextReads: [],
          },
          {
            type: THOUGHT_DETAIL,
            thought: '',
          },
        ],
      },
      {
        renderCategory: OUTPUT_CONTENT,
        content: '',
        markdownContent: '',
      },
      {
        renderCategory: INTERACTIVE_CARD,
        content: [],
      },
    ],
    feedback: feedback || {
      feedbackType: '',
      reason: '',
      details: '',
    },
    contextReferences: contextReferences || [],
    thinking: thinking ?? false,
  } as AiMessage;
};

const onSend = async () => {
  const text = inputValue.value.trim(); 
  if (!text || aiReplyLoading.value) return;

  // 创建用户消息
  const userMessage = getUserMessage(text);
  messages.value.push(userMessage);
  inputValue.value = ''; // 清空输入框

  await getAiReply(text, userMessage.requestId ?? '', userMessage);
};

const removeIfEmptyAiMessage = (msg: AiMessage) => {
  const items = msg.listItems ?? [];
  const hasContent = items.some((item) => {
    if (item.renderCategory === OUTPUT_CONTENT) return !!item.content;
    if (item.renderCategory === INTERACTIVE_CARD) return Array.isArray(item.content) && item.content.length > 0;
    if (item.renderCategory === THOUGHT_CHAIN) return false;

    return false;
  });
  if (!hasContent) {
    const idx = messages.value.findIndex((m) => m === msg);
    if (idx >= 0) messages.value.splice(idx, 1);
  }
};

const onStopGeneration = async () => {
  const requestId = curAiMessage.value?.requestId;
  cancelAbortController.value = new AbortController();

  // 取消对话流
  if (abortController.value) {
    abortController.value.abort();  
    abortController.value = null;
  }

  if (actionAbortController.value) {
    actionAbortController.value.abort();
    actionAbortController.value = null;
  }

  const cur = curAiMessage.value;
  if (cur) {
    cur.thinking = false;
    const idx = messages.value.findIndex((m) => m === cur);
    if (idx >= 0) {
      messages.value.splice(idx, 1);
    }

    curAiMessage.value = null;
  }

  if (requestId) {
    try {
      const params = {
        requestId,
        sessionId: sessionId.value,
        taskCode: props.taskCode,
      }

      const response = await fetch('/api/agentic/agent/chat/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'datapilot_project_id': getProjectId()
        },
        signal: cancelAbortController.value?.signal,
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      if (!response.body) {
        console.error("服务器未返回流");
        aiReplyLoading.value = false;

        return;
      }

      const currentAiMessage = createAiMessage({ sessionId: null, messageSeqNo: null, requestId: null, thinking: true });

      const reader = response.body.getReader();
      await readStream(reader, null, currentAiMessage);
      aiReplyLoading.value = false;
      removeIfEmptyAiMessage(currentAiMessage);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // ignore
      } else {
        message.error('中断会话失败');
      }

      aiReplyLoading.value = false;
      const cancelCur = curAiMessage.value as AiMessage | null;
      if (cancelCur) {
        cancelCur.thinking = false;
        removeIfEmptyAiMessage(cancelCur);
      }
    }
  } else {
    aiReplyLoading.value = false;
  }
};

const handleStreamData = (data: any, aiMessage: AiMessage, options?: { skipFrontendActions?: boolean; }) => {
  const skipFrontendActions = options?.skipFrontendActions ?? false;
  const streamSessionId = data.sessionId;
  const streamRequestId = data.requestId;
  if (streamSessionId) {
    const deltaItems = data.delta?.items ?? [];
    for (const d of deltaItems) {
      const renderCategory = d.renderCategory;
      const msg = aiMessage;
      if (renderCategory === THOUGHT_CHAIN) {
        const thinkingItem = msg.listItems?.find((item: any) => item.renderCategory === THOUGHT_CHAIN);
        const contentArr = thinkingItem?.content ?? [];

        const itemType = (d as { type?: string }).type;
        if (!itemType) continue;
        
        if (itemType === INTENT_RECOGNITION) {
          const entry = contentArr.find((x: any) => x.type === INTENT_RECOGNITION);
          if (entry && d.intent) entry.intent = d.intent;
        } else if (itemType === EXECUTION_STEP) {
          const entry = contentArr.find((x: any) => x.type === EXECUTION_STEP);
          const steps = d.steps ?? [];
          if (entry) {
            entry.steps = entry.steps ?? [];
            for (const s of steps) {
              const index = s?.index ?? '';
              const idx = entry.steps!.findIndex((t: any) => (t?.index ?? '') === index);
              if (idx >= 0) {
                entry.steps![idx] = { ...entry.steps![idx], ...s };
              } else {
                entry.steps!.push(s);
              }
            }
          }
        } else if (itemType === CONTEXT_READ) {
          const entry = contentArr.find((x: any) => x.type === CONTEXT_READ);
          const reads = (d as { contextReads?: unknown[] }).contextReads ?? [];
          if (entry) {
            entry.contextReads = entry.contextReads ?? [];
            entry.contextReads.push(...reads);
          }
        } else if (itemType === THOUGHT_DETAIL) {
          const entry = contentArr.find((x: any) => x.type === THOUGHT_DETAIL);
          const detail = d.thought ?? '';
          if (entry) entry.thought = (entry.thought ?? '') + detail;
        }
      } else if (renderCategory === OUTPUT_CONTENT) {
        const generatingItem = msg.listItems?.find((item: any) => item.renderCategory === OUTPUT_CONTENT);
        if (generatingItem) {
          generatingItem.content += d.content ?? '';
          generatingItem.markdownContent = DOMPurify.sanitize(marked.parse(generatingItem.content.replace(/<br\s*\/?>/g, '\n')) as string);
        }
      } else if (renderCategory === INTERACTIVE_CARD) {
        const doneItem = msg.listItems?.find((item: any) => item.renderCategory === INTERACTIVE_CARD);
        if (doneItem && Array.isArray(doneItem.content)) {
          doneItem.content.push(d);
        }

        if (!skipFrontendActions) {
          const type = (d as { type?: string }).type;
          const actionCode = (d as { actionCode?: string }).actionCode;
          const actionData = (d as { actionData?: Record<string, unknown> }).actionData;
          if (type === FRONTEND_ACTION && actionCode === 'SHOW_SQL_DIFF_CARD' && actionData) {
            const payload = {
              sessionId: streamSessionId,
              requestId: streamRequestId,
              sqlEdits: actionData.scriptEdits as unknown[],
            };
            // 路由到宿主页已注册的 handler；宿主页可能是 studio / data-map / 未来其它页
            pageOperationManager.notify({
              type: PAGE_OP_COPILOT_REPLACE_CODE,
              source: 'copilot',
              payload,
              timestamp: Date.now(),
            });
          }
          if (type === FRONTEND_ACTION && actionCode === 'LOCATE_TABLE' && actionData) {
            pageOperationManager.notify({
              type: PAGE_OP_DATA_MAP_LOCATE_TABLE,
              source: 'copilot',
              payload: {
                tableName: actionData.tableName as string | undefined,
                layer: actionData.layer as string | undefined,
              },
              timestamp: Date.now(),
            });
          }
        }
      }
    }
  }
}

// userMessage参数为用户消息实例对象，如果存在，则给用户消息设置 sessionId
const readStream = async (reader: any, userMessage?: any, aiMessage?: any) => {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        try {
          const data = JSON.parse(jsonStr) as Record<string, unknown>;

          const streamSessionId = data.sessionId as string;
          const streamMessageSeqNo = data.messageSeqNo as number;
          const streamRequestId = data.requestId as string;
          if (userMessage && !userMessage.sessionId && streamSessionId) {
            userMessage.sessionId = streamSessionId;
          }

          if (!aiMessage.sessionId) {
            aiMessage.sessionId = streamSessionId;
          }

          if (aiMessage.messageSeqNo == null) {
            aiMessage.messageSeqNo = streamMessageSeqNo;
          }

          if (!aiMessage.requestId) {
            aiMessage.requestId = streamRequestId;
          }
          
          // 处理ai消息
          handleStreamData(data, aiMessage);

          if (data.phase === 'DONE' || data.phase === 'ERROR') {
            aiReplyLoading.value = false;
            aiMessage.thinking = false;
            curAiMessage.value = null;

            return;
          }
        } catch {
          // 非 JSON 或解析失败则忽略
        }
      }
    }
  }
};

const createAiMessage = (options: any): AiMessage => {
  const aiMessage = initAiMessage(options);
  messages.value.push(aiMessage);
  const currentAiMessage = messages.value[messages.value.length - 1] as AiMessage;
  curAiMessage.value = currentAiMessage;

  return currentAiMessage;
}

// userMessage参数为用户消息实例对象，如果存在，则给用户消息设置 sessionId
const getAiReply = async (content: string, requestId: string, userMessage: any) => {
  abortController.value?.abort();
  abortController.value = new AbortController();

  // 当前意图 + 当前上下文（TABLE / CODE_SNIPPET）一并带上
  const contextReferences = contextTags.value.map((t) => {
    if (t.type === 'TABLE') {
      return { type: 'TABLE' as const, tableName: t.tableName };
    }

    return {
      type: 'CODE_SNIPPET' as const,
      taskName: t.taskName,
      selection: t.selection,
    };
  });

  const postChatParams = {
    requestId,
    sessionId: sessionId.value,
    taskCode: props.taskCode,
    message: content,
    intentTag: intentTag.value,
    contextReferences,
    context: {
      currentScriptContent: props.currentScriptContent ?? '',
    }
  };

  aiReplyLoading.value = true;

  try {
    const response = await fetch('/api/agentic/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'datapilot_project_id': getProjectId()
      },
      signal: abortController.value.signal,
      body: JSON.stringify(postChatParams),
    });
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    if (!response.body) {
      console.error("服务器未返回流");

      return;
    }

    const currentAiMessage = createAiMessage({ sessionId: null, messageSeqNo: null, requestId: null, thinking: true });

    const reader = response.body.getReader();
    await readStream(reader, userMessage, currentAiMessage);
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      message.error('获取AI回复失败');
    }

;
    aiReplyLoading.value = false;
    const cur = curAiMessage.value;
    if (cur) {
      cur.thinking = false;
    }
  }
};

const actionHandle = async (params: {
  requestId: string;
  sessionId: string;
  action: any;
  data: any;
}, userMessage?: any) => {
  const { requestId, sessionId, action, data } = params;
  actionAbortController.value = new AbortController();

  curAiMessage.value = null;

  const actionParams = {
    actionId: uuidv4(),
    requestId,
    sessionId,
    action,
    data
  };

  aiReplyLoading.value = true;

  try {
    const response = await fetch('/api/agentic/agent/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'datapilot_project_id': getProjectId()
      },
      signal: actionAbortController.value.signal,
      body: JSON.stringify(actionParams),
    });
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    if (!response.body) {
      console.error("服务器未返回流");
      aiReplyLoading.value = false;

      return;
    }

    const currentAiMessage = createAiMessage({ sessionId: null, messageSeqNo: null, requestId: null, thinking: true });

    const reader = response.body.getReader();
    await readStream(reader, userMessage, currentAiMessage);
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      message.error('操作失败');
    }

    aiReplyLoading.value = false;
    const cur = curAiMessage.value as AiMessage | null;
    if (cur) {
      cur.thinking = false;
    }
  }
};

/** 通过 uniqueId 获取消息在 messages 中的下标（用户消息用 uniqueId，AI 消息用 id） */
const getMessageIndexByUniqueId = (uniqueId: string): number =>
  messages.value.findIndex((m) => (m as any).uniqueId === uniqueId || (m as any).id === uniqueId);

/** 覆盖重写：删除当前及之后会话 → 拉取历史代码回填 → 发新消息 */
const onOverwriteMsg = async (payload: {
  newContent: string;
  uniqueId: string;
  requestId?: string;
  sessionId?: string;
}) => {
  const fromIndex = getMessageIndexByUniqueId(payload.uniqueId);
  if (fromIndex >= 0) {
    (messages.value[fromIndex] as any).content = payload.newContent;
    const removeFrom = fromIndex + 1;
    const removeCount = messages.value.length - removeFrom;
    if (removeCount > 0) {
      messages.value.splice(removeFrom, removeCount);
    }
  }
  
  // 步骤2：调用 getCheckpoint 获取当时的代码并回填到编辑器
  try {
    if (payload.sessionId) {
      const params = {
        sessionId: payload.sessionId,
        requestId: payload.requestId,
      }
      const res = await CopilotApi.getCheckpoint({ params });
      const previousCode = (res as any)?.data?.body?.previousCode ?? '';

      pageOperationManager.notify({
        type: PAGE_OP_COPILOT_REVERT_CODE,
        source: 'copilot',
        payload: { code: previousCode },
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    console.warn('getCheckpoint failed', e);
  }

  actionHandle({
    requestId: payload.requestId ?? '',
    sessionId: payload.sessionId ?? '',
    action: 'OVERWRITE',
    data: { editedMessage: payload.newContent },
  }, null);
};

/** 仅回退：保留当前 user message，删掉它后面的所有消息，还原编辑器代码 */
const onRevertMsg = async (payload: {
  uniqueId: string;
  requestId?: string;
  sessionId?: string;
}) => {
  const fromIndex = getMessageIndexByUniqueId(payload.uniqueId);
  if (fromIndex >= 0) {
    const removeFrom = fromIndex + 1;
    const removeCount = messages.value.length - removeFrom;
    if (removeCount > 0) {
      messages.value.splice(removeFrom, removeCount);
    }
  }

  try {
    if (payload.sessionId) {
      const params = {
        sessionId: payload.sessionId,
        requestId: payload.requestId,
      };
      const res = await CopilotApi.getCheckpoint({params, hideLoading: true});
      const code = (res as any)?.data?.body?.previousCode ?? '';
      if (code) {
        pageOperationManager.notify({
          type: PAGE_OP_COPILOT_REVERT_CODE,
          source: 'copilot',
          payload: { code },
          timestamp: Date.now(),
        });
      }

      actionHandle({
        requestId: payload.requestId ?? '',
        sessionId: payload.sessionId ?? '',
        action: 'ROLLBACK',
        data: {},
      });
    }
  } catch (e) {
    console.warn('getCheckpoint failed', e);
  }
};

const onClarifySelect = (payload: ClarifySelectPayload) => {
  const data = payload?.data ?? {};
  const clarifyType = data?.clarifyType;
  const sessionId = payload?.sessionId;
  const requestId = payload?.requestId;

  if (!sessionId || !requestId) {
    message.error('sessionId 或 requestId 不存在');

    return;
  }

  if (clarifyType === 'TABLE_DISAMBIGUATION' || clarifyType === 'TABLE_CLARIFY') {
    const selectedTable = data?.selectedValue ?? data?.selectedLabel;
    const unselectedOptions = data?.unselectedOptions ?? [];
    const unselectedTableNames = new Set(unselectedOptions.map((o) => o.value).filter(Boolean));
    // 从上下文中移除未选中的表
    contextTags.value = contextTags.value.filter((t) => {
      if (t.type !== 'TABLE') return true;

      return !unselectedTableNames.has(t.tableName);
    });
    // 将选中的表加入上下文（若尚未存在）
    if (selectedTable && !contextTags.value.some((t) => t.type === 'TABLE' && t.tableName === selectedTable)) {
      contextTags.value = [
        ...contextTags.value,
        { id: `tag-${Date.now()}`, type: 'TABLE', tableName: selectedTable },
      ];
    }
  }

  if (clarifyType === 'INTENT_AMBIGUOUS' || clarifyType === 'TABLE_DISAMBIGUATION' || clarifyType === 'TABLE_CLARIFY') {
    // 根据 requestId 和 sessionId 获取用户输入内容
    // 从messages.value中找到requestId对应的userMessage
    const userMessage = messages.value.find((m) => m.role === USER && (m as UserMessage).requestId === requestId) as UserMessage | undefined;
    if (userMessage) {
      const originalMessage = userMessage.content;
      const carriesTable = clarifyType === 'TABLE_DISAMBIGUATION' || clarifyType === 'TABLE_CLARIFY';
      const tempObj = carriesTable ? {selectedValue: data.selectedValue, selectedLabel: data.selectedLabel} : {};

      const actionParams = {
        clarifyType,
        originalMessage,
        contextReferences: contextTags.value || [],
        ...tempObj
      };

      actionHandle({ requestId, sessionId, action: 'CLARIFY_SELECT', data: actionParams });
    }
  }
};

const onAtSelect = (type: 'table' | 'tapd', payload?: { source?: 'footer' }) => {
  if (type === 'table') {
    onAssociateTable(payload);
  }
};

const onSlashSelect = (key: string) => {
  setIntentTag(key);
};

const onQuickAction = (payload: { value: string; label: string }) => {
  setIntentTag(payload.value);
};


/** source: 'context-card' 来自上下文卡片内按钮，'footer' 来自输入框 @ 按钮，不传则视为 footer */
const onAssociateTable = (payload?: { requestId?: string; sessionId?: string; source?: 'context-card' | 'footer' }) => {
  associateTablePayload.value = payload;
  associateTableModalVisible.value = true;
};

const onAssociateTableModalClose = () => {
  associateTableModalVisible.value = false;
  associateTablePayload.value = {};
};

const onAssociateTableConfirm = async (tableKeys: string[], payload?: { requestId?: string; sessionId?: string; source?: 'context-card' | 'footer' }) => {
  const existingTableNames = new Set(
    contextTags.value.filter((t) => t.type === 'TABLE').map((t) => (t as ContextTagTable).tableName)
  );
  const newTableTags: ContextTagTable[] = tableKeys
    .filter((key) => !existingTableNames.has(key))
    .map((key, i) => ({
      id: `table-${Date.now()}-${i}`,
      type: 'TABLE' as const,
      tableName: key,
    }));
  contextTags.value = [...contextTags.value, ...newTableTags];

  if (payload?.source === 'context-card') {
    try {
      const params = {
        sessionId: payload.sessionId,
        requestId: payload.requestId,
      };
      const res = await CopilotApi.getCheckpoint({params, hideLoading: true});
      const userMessageContent = (res as any)?.data?.body?.userMessageContent ?? '';
      if (userMessageContent) {
        inputValue.value = userMessageContent;
      }
    } catch (e) {
      console.warn('getCheckpoint failed', e);
      message.error('获取上下文失败');
    }
  }

  associateTableModalVisible.value = false;
  associateTablePayload.value = {};
};


defineExpose({ addContextTag });
</script>

<style lang="less" scoped>
.copilot {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  background: #fff;
  position: relative;
}
.copilot-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
}
</style>
