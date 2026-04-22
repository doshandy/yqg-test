/**
 * 消息解析工具：将后端原始消息数据解析为前端 ChatMessage 结构
 * 供 index.vue（主对话页）和未来 share.vue（分享页）共用
 */
import { v4 as uuidv4 } from 'uuid';
import { marked, type Tokens } from 'marked';
import DOMPurify from 'dompurify';
import type { ChatMessage, AiMessage, UserMessage } from '../constant';
import {
  USER, ASSISTANT,
  THOUGHT_CHAIN, INTENT_RECOGNITION, EXECUTION_STEP, OUTPUT_CONTENT,
  CONTEXT_READ, INTERACTIVE_CARD, THOUGHT_DETAIL, FOLLOW_UP_SUGGESTION,
  FRONTEND_ACTION,
} from '../constant';

const customRenderer = new marked.Renderer();
const defaultCodeRenderer = customRenderer.code.bind(customRenderer);
customRenderer.code = function (token: Tokens.Code) {
  const defaultHtml = defaultCodeRenderer(token);
  const lang = token.lang || '';
  const langLabel = lang ? `<span class="code-block-lang">${lang}</span>` : '';
  return `<div class="code-block-wrapper">`
    + `<div class="code-block-header">${langLabel}<button class="code-copy-btn" type="button">复制</button></div>`
    + defaultHtml
    + `</div>`;
};
const defaultTableRenderer = customRenderer.table.bind(customRenderer);
customRenderer.table = function (token: Tokens.Table) {
  const defaultHtml = defaultTableRenderer(token);
  return `<div class="table-wrapper">${defaultHtml}</div>`;
};
marked.setOptions({ renderer: customRenderer });

export function createAiMessageSkeleton(opts: {
  sessionId: string | null;
  messageSeqNo: number | null;
  requestId: string | null;
  thinking?: boolean;
  feedback?: any;
  contextReferences?: any;
}): AiMessage {
  return {
    uniqueId: uuidv4(),
    requestId: opts.requestId,
    sessionId: opts.sessionId,
    messageSeqNo: opts.messageSeqNo,
    role: ASSISTANT,
    listItems: [
      { renderCategory: THOUGHT_CHAIN, content: [{ type: EXECUTION_STEP, steps: [] }] },
      { renderCategory: OUTPUT_CONTENT, content: '', markdownContent: '' },
      { renderCategory: INTERACTIVE_CARD, content: [] },
      { renderCategory: FOLLOW_UP_SUGGESTION, content: '', suggestions: [] },
    ],
    feedback: opts.feedback || { feedbackType: '', reason: '', details: '' },
    contextReferences: opts.contextReferences || [],
    thinking: opts.thinking ?? false,
  } as AiMessage;
}

export interface HandleStreamDataOptions {
  skipFrontendActions?: boolean;
  onFrontendAction?: (
    actionCode: string,
    actionData: Record<string, unknown>,
    meta: { sessionId: string; requestId: string },
  ) => void;
}

export function fillAiMessageFromDelta(data: any, aiMessage: AiMessage, options?: HandleStreamDataOptions) {
  const skipFrontendActions = options?.skipFrontendActions ?? false;
  const streamSessionId = data.sessionId;
  const streamRequestId = data.requestId;
  if (!streamSessionId) return;

  const deltaItems = data.delta?.items ?? [];
  for (const d of deltaItems) {
    const renderCategory = d.renderCategory;
    const msg = aiMessage;

    if (renderCategory === THOUGHT_CHAIN) {
      const thinkingItem = msg.listItems?.find((i: any) => i.renderCategory === THOUGHT_CHAIN);
      const contentArr = thinkingItem?.content ?? [];
      const itemType = (d as { type?: string }).type;
      if (!itemType) continue;

      if (itemType === INTENT_RECOGNITION) {
        let entry = contentArr.find((x: any) => x.type === INTENT_RECOGNITION);
        if (!entry) {
          entry = { type: INTENT_RECOGNITION };
          contentArr.push(entry);
        }
        if (d.intent) entry.intent = d.intent;
      } else if (itemType === EXECUTION_STEP) {
        let entry = contentArr.find((x: any) => x.type === EXECUTION_STEP);
        if (!entry) {
          entry = { type: EXECUTION_STEP, steps: [] };
          contentArr.push(entry);
        }
        const steps = d.steps ?? [];
        entry.steps = entry.steps ?? [];
        for (const s of steps) {
          const index = s?.index ?? '';
          const idx = entry.steps!.findIndex((t: any) => (t?.index ?? '') === index);
          if (idx >= 0) entry.steps![idx] = { ...entry.steps![idx], ...s };
          else entry.steps!.push(s);
        }
      } else if (itemType === CONTEXT_READ) {
        let entry = contentArr.find((x: any) => x.type === CONTEXT_READ);
        if (!entry) {
          entry = { type: CONTEXT_READ, contextReads: [] };
          contentArr.push(entry);
        }
        const reads = (d as { contextReads?: unknown[] }).contextReads ?? [];
        entry.contextReads = entry.contextReads ?? [];
        entry.contextReads.push(...reads);
      } else if (itemType === THOUGHT_DETAIL) {
        let entry = contentArr.find((x: any) => x.type === THOUGHT_DETAIL);
        if (!entry) {
          entry = { type: THOUGHT_DETAIL, thought: '' };
          contentArr.push(entry);
        }
        entry.thought = (entry.thought ?? '') + (d.thought ?? '');
      }
    } else if (renderCategory === OUTPUT_CONTENT) {
      const generatingItem = msg.listItems?.find((i: any) => i.renderCategory === OUTPUT_CONTENT);
      if (generatingItem) {
        generatingItem.content += d.content ?? '';
        generatingItem.markdownContent = DOMPurify.sanitize(
          marked.parse(generatingItem.content.replace(/<br\s*\/?>/g, '\n')) as string,
        );
      }
    } else if (renderCategory === INTERACTIVE_CARD) {
      const doneItem = msg.listItems?.find((i: any) => i.renderCategory === INTERACTIVE_CARD);
      if (doneItem && Array.isArray(doneItem.content)) {
        doneItem.content.push(d);
      }

      if (!skipFrontendActions && options?.onFrontendAction) {
        const type = (d as { type?: string }).type;
        const actionCode = (d as { actionCode?: string }).actionCode;
        const actionData = (d as { actionData?: Record<string, unknown> }).actionData;
        if (type === FRONTEND_ACTION && actionCode && actionData) {
          options.onFrontendAction(actionCode, actionData, {
            sessionId: streamSessionId,
            requestId: streamRequestId,
          });
        }
      }
    } else if (renderCategory === FOLLOW_UP_SUGGESTION) {
      const followUpItem = msg.listItems?.find((i: any) => i.renderCategory === FOLLOW_UP_SUGGESTION);
      if (followUpItem) {
        if (d.content) followUpItem.content = d.content;
        if (Array.isArray((d as any).suggestions)) followUpItem.suggestions = (d as any).suggestions;
      }
    }
  }
}

export function createUserMessage(
  text: string,
  options: { messageSeqNo?: number | null; requestId?: string; sessionId?: string } = {},
): UserMessage {
  const uniqueId = uuidv4();
  return {
    uniqueId,
    requestId: options.requestId || uniqueId,
    sessionId: options.sessionId,
    messageSeqNo: options.messageSeqNo ?? null,
    role: USER,
    content: text,
  };
}

export function parseRawMessages(rawItems: any[], options?: HandleStreamDataOptions): ChatMessage[] {
  const result: ChatMessage[] = [];
  for (const item of rawItems) {
    const messageSeqNo = item.messageSeqNo ?? 0;
    const requestId = item.requestId ?? '';
    const sessionId = item.sessionId ?? '';
    const feedback = item.feedback ?? {};
    const contextReferences = item.contextReferences ?? [];

    if (item.role === USER) {
      const content = item.delta?.items?.[0]?.content ?? '';
      result.push(createUserMessage(content, { messageSeqNo, requestId, sessionId }));
    } else if (item.role === ASSISTANT) {
      const aiMessage = createAiMessageSkeleton({ sessionId, messageSeqNo, requestId, feedback, contextReferences });
      result.push(aiMessage);
      fillAiMessageFromDelta(item, aiMessage, options);
    }
  }
  return result;
}
