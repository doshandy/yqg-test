// ---------- 会话消息数据结构 ----------

// ---------- 快捷意图相关映射 ----------

import type { Component } from 'vue';
import {
  RocketOutlined,
  BulbOutlined,
  BugFilled,
  CommentOutlined,
  SyncOutlined,
  ThunderboltFilled,
  FormOutlined,
  StopOutlined,
} from '@ant-design/icons-vue';

export type AiCardType = 'think' | 'intent-clarification' | 'no-access' | 'missing-context';

export interface UserMessage {
  uniqueId: string;
  role: 'USER';
  content: string;
  /** 请求 ID，覆盖重写/仅回退时用于拉取历史代码 */
  requestId?: string;
  /** 会话 ID，由 AI 回复时回填 */
  sessionId?: string;
  messageSeqNo?: number | null;
}

export interface AiMessageListItem {
  renderCategory: string;
   
  content: any;
  markdownContent?: string;
}

export interface AiMessage {
  thinking?: boolean;
  uniqueId: string;
  id?: string;
  role: 'ASSISTANT';
  type?: AiCardType;
  /** think 卡片：回复气泡文案 */
  bubbleContent?: string;
  /** 意图澄清 / 无权限 / 缺上下文：标题 */
  title?: string;
  /** 意图澄清 / 无权限 / 缺上下文：描述文案 */
  message?: string;
  /** 意图澄清：选项列表 */
  options?: { id: string; label: string; subLabel?: string }[];
  /** 无权限：表列表 */
  items?: { tableName: string; type: 'readonly' | 'readwrite' }[];
  /** 反馈 */
  feedback?: {
    feedbackType: 'LIKE' | 'DISLIKE' | '' | null;
    reason: string;
    details: string;
  };
  /** 渲染列表项（思维链 / 生成内容 / 交互卡片） */
  listItems?: AiMessageListItem[];
  requestId?: string | null;
  sessionId?: string | null;
  messageSeqNo?: number | null;
  contextReferences?: unknown[];
}

export type ChatMessage = UserMessage | AiMessage;

export function createMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** 初始演示会话：覆盖各类消息结构，便于展示与联调 */
export const INITIAL_MESSAGES: ChatMessage[] = [];

// ---------- 上下文标签（TABLE / CODE_SNIPPET）----------
export type ContextTagTable = { id: string; type: 'TABLE'; tableName: string };
export type ContextTagCodeSnippet = {
  id: string;
  type: 'CODE_SNIPPET';
  /** 任务名，用于展示：任务名（起始行-结束行） */
  taskName: string;
  codeContent: string;
  selection: { startLine?: number; endLine?: number; selectedText: string };
};
export type ContextTag = ContextTagTable | ContextTagCodeSnippet;

// ---------- 意图澄清卡片 ----------

export interface ClarifyOption {
  value: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

export interface IntentClarifyActionData {
  message?: string;
  options?: ClarifyOption[];
  clarifyType?: 'TABLE_DISAMBIGUATION' | 'INTENT_AMBIGUOUS' | 'TABLE_CLARIFY';
  multiSelect?: boolean;
}

export interface ClarifySelectPayload {
  requestId: string;
  sessionId: string;
  action: 'CLARIFY_SELECT';
  data: {
    selectedValue?: string;
    selectedLabel?: string;
    clarifyType?: string;
    unselectedOptions?: ClarifyOption[];
  };
}

// ---------- 权限卡片 ----------

export interface PermissionTable {
  tableName: string;
  permissionType: 'READ' | 'WRITE';
}

export interface PermissionActionData {
  message?: string;
  tables?: PermissionTable[];
}

export const USER = 'USER';
export const ASSISTANT = 'ASSISTANT';

export const THOUGHT_CHAIN = 'THOUGHT_CHAIN';
export const OUTPUT_CONTENT = 'OUTPUT_CONTENT';
export const INTERACTIVE_CARD = 'INTERACTIVE_CARD';

export const INTENT_RECOGNITION = 'INTENT_RECOGNITION';
export const EXECUTION_STEP = 'EXECUTION_STEP';
export const CONTEXT_READ = 'CONTEXT_READ';
export const THOUGHT_DETAIL = 'THOUGHT_DETAIL';
export const ERROR = 'ERROR';

export const FRONTEND_ACTION = 'FRONTEND_ACTION';

export const QUICK_INTENT_CONFIG: Record<string, { icon: Component; placeholder: string }> = {
  CODE_GENERATE: { icon: RocketOutlined, placeholder: '使用自然语言生成代码' },
  SQL_REFINE: { icon: FormOutlined, placeholder: '描述需要如何修改现有 SQL' },
  CODE_REWRITE: { icon: SyncOutlined, placeholder: '按要求重构或转换代码逻辑' },
  CODE_EXPLAIN: { icon: BulbOutlined, placeholder: '将代码转换成自然语言' },
  CODE_FIX: { icon: BugFilled, placeholder: '检查代码是否存在错误 / 风险' },
  CODE_COMMENT: { icon: CommentOutlined, placeholder: '为代码添加清晰注释' },
  CODE_OPTIMIZE: { icon: ThunderboltFilled, placeholder: '为代码提供性能优化建议' },
  OUT_OF_SCOPE: { icon: StopOutlined, placeholder: '该问题可能超出助手能力范围' },
};
