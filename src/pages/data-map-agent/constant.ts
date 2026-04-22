/**
 * data-map-agent 模块：与原版 /data-map 独立的类型与常量定义。
 * 复刻自 cn-data-pilot/src/pages/data-map/constant.ts。
 */

// ---------- 会话消息数据结构 ----------

export type AiCardType = 'think' | 'intent-clarification' | 'no-access' | 'missing-context';

export interface UserMessage {
  uniqueId: string;
  role: 'USER';
  content: string;
  requestId?: string;
  sessionId?: string;
  messageSeqNo?: number | null;
}

export interface AiMessageListItem {
  renderCategory: string;
  content: any;
  markdownContent?: string;
  suggestions?: string[];
}

export interface AiMessage {
  thinking?: boolean;
  uniqueId: string;
  id?: string;
  role: 'ASSISTANT';
  type?: AiCardType;
  bubbleContent?: string;
  title?: string;
  message?: string;
  options?: { id: string; label: string; subLabel?: string }[];
  items?: { tableName: string; type: 'readonly' | 'readwrite' }[];
  feedback?: {
    feedbackType: 'LIKE' | 'DISLIKE' | '' | null;
    reason: string;
    details: string;
  };
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

export const INITIAL_MESSAGES: ChatMessage[] = [];

// ---------- 上下文标签 ----------
export type ContextTagTable = { id: string; type: 'TABLE'; tableName: string };
export type ContextTagCodeSnippet = {
  id: string;
  type: 'CODE_SNIPPET';
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
  clarifyType?: 'TABLE_DISAMBIGUATION' | 'INTENT_AMBIGUOUS';
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

// ---------- 通用常量 ----------

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
export const FOLLOW_UP_SUGGESTION = 'FOLLOW_UP_SUGGESTION';

// ---------- 侧边栏数据结构 ----------

export interface SessionItem {
  id: string;
  title: string;
  agentType: string;
  status: string;
  summary?: string;
  taskCode?: string;
  projectId?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface FavoriteItem {
  databaseName: string;
  tableName: string;
  owner: string;
  description: string;
  favorited: boolean;
  ownerDisplayName: string;
}

export interface HistoryGroup {
  group: string;
  items: SessionItem[];
}

// ---------- data-map agent 类型标识 ----------
export const AGENT_TYPE_DATA_MAP = 'DATA_MAP';

// ---------- 快捷意图映射 ----------
import type { Component } from 'vue';
import {
  RocketOutlined,
  BulbOutlined,
  BugFilled,
  CommentOutlined,
  SyncOutlined,
  ThunderboltFilled,
} from '@ant-design/icons-vue';

export const QUICK_INTENT_CONFIG: Record<string, { icon: Component; placeholder: string }> = {
  CODE_GENERATE: { icon: RocketOutlined, placeholder: '使用自然语言生成代码' },
  CODE_EXPLAIN: { icon: BulbOutlined, placeholder: '将代码转换成自然语言' },
  CODE_FIX: { icon: BugFilled, placeholder: '检查代码是否存在错误 / 风险' },
  CODE_COMMENT: { icon: CommentOutlined, placeholder: '为代码添加清晰注释' },
  CODE_REWRITE: { icon: SyncOutlined, placeholder: '按要求重构或转换代码逻辑' },
  CODE_OPTIMIZE: { icon: ThunderboltFilled, placeholder: '为代码提供性能优化建议' },
};
