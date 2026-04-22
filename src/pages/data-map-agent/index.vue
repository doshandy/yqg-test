<!--
 * @Author: shengzhitong shengzhitong@fintopia.tech
 * @Date: 2026-03-04 11:43:26
 * @LastEditors: shengzhitong shengzhitong@fintopia.tech
 * @LastEditTime: 2026-04-20 14:09:33
 * @FilePath: /cn-data-pilot/src/components/copilot/copilot.vue
 * @Description: DataPilot Copilot 智能助手界面
-->
<template>
  <div class="data-map-layout">
    <!-- 左侧侧边栏 -->
    <div
      v-show="!sidebarCollapsed"
      class="data-map-layout__sidebar"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <CopilotSidebar
        :recent-sessions="recentSessions"
        :earlier-sessions="earlierSessions"
        :favorite-tables="favoriteTables"
        :active-session-id="activeSessionId"
        :earlier-has-more="earlierHasMore"
        :earlier-loading="earlierLoading"
        @new-chat="onNewChat"
        @collapse="sidebarCollapsed = true"
        @select-history="onSelectHistory"
        @send-from-fav="onSendFromFav"
        @toggle-favorite="onToggleFavorite"
        @delete-history="onDeleteHistory"
        @rename-history="onRenameHistory"
        @share-history="onShareHistory"
        @load-more-earlier="onLoadMoreEarlier"
      />
      <div class="data-map-layout__resize-handle" @mousedown="startDragSidebar" />
    </div>

    <!-- 侧边栏收起时的悬浮按钮 -->
    <div v-if="sidebarCollapsed" class="data-map-layout__expand-bar">
      <Tooltip placement="bottom" title="展开侧边栏">
        <div class="data-map-layout__expand-btn" @click="sidebarCollapsed = false">
          <MenuUnfoldOutlined />
        </div>
      </Tooltip>
      <Tooltip placement="bottom" title="新建对话">
        <div class="data-map-layout__expand-btn" @click="onNewChat">
          <FormOutlined />
        </div>
      </Tooltip>
    </div>

    <!-- 主内容区 -->
    <main class="data-map-layout__main">

      <!-- 新建对话：欢迎页 -->
      <div v-if="isEmptyChat" class="data-map-welcome">
        <div class="data-map-welcome__body">
          <div class="data-map-welcome__greeting">
            <h2 class="data-map-welcome__title">
              <span class="data-map-welcome__sparkle">✦</span>
              你好，我是数据地图 Agent
            </h2>
            <p class="data-map-welcome__desc">我能帮你找表、查血缘、查 SQL，今天想探索什么？</p>
          </div>

          <div class="data-map-welcome__input-area">
            <CopilotFooter
              v-model:input-value="inputValue"
              :ai-reply-loading="aiReplyLoading"
              :create-session-loading="createSessionLoading"
              :show-quick-actions="false"
              placeholder="请输入你想要查询的数据内容，支持 @ 提及表名..."
              @send="onSend"
              @stop="onStopGeneration"
              @at-select="onAtSelect"
            />
          </div>

          <div class="data-map-welcome__suggestions">
            <div class="data-map-welcome__suggestions-label">
              <AppstoreOutlined style="font-size: 14px;" /> 试试这样问
            </div>
            <div class="data-map-welcome__cards">
              <div
                v-for="item in suggestedPrompts"
                :key="item.value"
                class="data-map-welcome__card"
                @click="onSuggestionClick(item)"
              >
                <div class="data-map-welcome__card-title">{{ item.title }}</div>
                <div class="data-map-welcome__card-desc">{{ item.promptTemplate }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 正常聊天模式 -->
      <div v-else class="data-map-chat">
        <div v-if="copilotLoading" class="data-map-loading-overlay">
          <Spin />
          <span v-if="loadingTitle" class="data-map-loading-overlay__text">加载历史对话：{{ loadingTitle }}</span>
        </div>
        <CopilotMain
          :messages="messages"
          :has-more="hasMore"
          :load-more-loading="loadMoreMessagesLoading"
          :ai-reply-loading="aiReplyLoading"
          :is-share-mode="isShareMode"
          :session-title="currentSessionTitle"
          :share-loading="shareLoading"
          @update:is-share-mode="isShareMode = $event"
          @load-more="loadMoreMessages"
          @overwrite-msg="onOverwriteMsg"
          @revert-msg="onRevertMsg"
          @follow-up-click="onFollowUpClick"
          @toggle-favorite-from-card="onToggleFavoriteFromCard"
          @share-confirm="onShareConfirm"
          @share-cancel="cancelShareRequest"
        />
        <CopilotFooter
          v-show="!isShareMode"
          v-model:input-value="inputValue"
          :ai-reply-loading="aiReplyLoading"
          :create-session-loading="createSessionLoading"
          :show-quick-actions="true"
          @send="onSend"
          @stop="onStopGeneration"
          @at-select="onAtSelect"
        />
      </div>

      <AssociateTableModal
        :open="associateTableModalVisible"
        :associate-table-payload="associateTablePayload"
        @close="onAssociateTableModalClose"
        @confirm="onAssociateTableConfirm"
      />

      <!-- 侧边栏分享弹窗（分享整个历史对话） -->
      <ShareConfigModal
        v-model:open="sidebarShareModalVisible"
        :selected-count="0"
        :session-title="sidebarShareTitle"
        :confirm-loading="shareLoading"
        info-text="分享整个对话记录"
        @confirm="onSidebarShareConfirm"
        @cancel="cancelShareRequest"
      />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted, h } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { message, Spin, Tooltip, Modal, Input } from 'ant-design-vue';
import { MenuUnfoldOutlined, FormOutlined, AppstoreOutlined } from '@ant-design/icons-vue';
import AssociateTableModal from './modal/associate-table-modal/index.vue';
import ShareConfigModal from './modal/share-config-modal/index.vue';
import CopilotFooter from './components/copilot-footer/index.vue';
import CopilotMain from './components/copilot-main/index.vue';
import CopilotSidebar from './components/copilot-sidebar/index.vue';
import {
  type ChatMessage,
  type AiMessage,
  type SessionItem,
  type FavoriteItem,
  THOUGHT_CHAIN,
  OUTPUT_CONTENT,
  INTERACTIVE_CARD,
  FOLLOW_UP_SUGGESTION,
  USER,
  ASSISTANT,
} from './constant';
import { createAiMessageSkeleton, fillAiMessageFromDelta, createUserMessage, parseRawMessages } from './utils/message-parser';
import CopilotApi from './resources/copilot';
import FavoritesApi from './resources/favorites';
import ProjectStorage from '@/storage/project';

const getProjectId = () => ProjectStorage.get();

const AGENT_TYPE = 'DATA_MAP';
const RECENT_DAYS = 3;
const EARLIER_PAGE_SIZE = 20;

const sessionId = ref<string | undefined>(undefined);
const inputValue = ref('');
const messages = ref<ChatMessage[]>([]);
const associateTableModalVisible = ref(false);
/** 选表弹窗打开来源：'context-card' 上下文卡片内按钮，'footer' 输入框 @ 按钮 */
const associateTablePayload = ref<{ requestId?: string; sessionId?: string; source?: 'context-card' | 'footer' } | undefined>(undefined);
const curAiMessage = ref<AiMessage | null>(null);
const abortController = ref<AbortController | null>(null);
const cancelAbortController = ref<AbortController | null>(null);
const actionAbortController = ref<AbortController | null>(null);
const messagesAbortController = ref<AbortController | null>(null);
const aiReplyLoading = ref(false);
const createSessionLoading = ref(false);

const isShareMode = ref(false);
const shareLoading = ref(false);
const shareAbortController = ref<AbortController | null>(null);
const sidebarShareModalVisible = ref(false);
const sidebarShareSessionId = ref<string | undefined>(undefined);
const sidebarShareTitle = ref('');
const hasMore = ref(false);
const page = ref(1);
const copilotLoading = ref(false);
const loadingTitle = ref('');
const loadMoreMessagesLoading = ref(false);

// ---- 侧边栏相关状态 ----
const sidebarCollapsed = ref(false);
const SIDEBAR_DEFAULT = 280;
const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 420;
const sidebarWidth = ref(SIDEBAR_DEFAULT);
const isDraggingSidebar = ref(false);
const recentSessions = ref<SessionItem[]>([]);
const earlierSessions = ref<SessionItem[]>([]);
const earlierHasMore = ref(true);
const earlierPageNum = ref(0);
const earlierLoading = ref(false);
const favoriteTables = ref<FavoriteItem[]>([]);
const activeSessionId = computed(() => sessionId.value);

const isEmptyChat = computed(() => messages.value.length === 0 && !copilotLoading.value);

const currentSessionTitle = computed(() => {
  if (!sessionId.value) return '';
  const all = [...recentSessions.value, ...earlierSessions.value];
  return all.find((s) => s.id === sessionId.value)?.title || '';
});

interface SuggestedPrompt {
  value: string;
  title: string;
  promptTemplate: string;
}
const suggestedPrompts = ref<SuggestedPrompt[]>([]);

/** 获取欢迎页推荐提示词列表 */
const fetchSuggestedPrompts = async () => {
  try {
    const res = await CopilotApi.getSuggestedPrompts({
      params: { agentType: AGENT_TYPE },
      hideLoading: true,
    });
    suggestedPrompts.value = res.data?.body || [];
  } catch (e) {
    console.warn('fetchSuggestedPrompts failed', e);
  }
};

/** 点击推荐提示词，填充到输入框 */
const onSuggestionClick = (prompt: SuggestedPrompt) => {
  inputValue.value = prompt.promptTemplate;
};

/** 开始拖拽侧边栏宽度 */
const startDragSidebar = () => {
  isDraggingSidebar.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

/** 拖拽过程中更新侧边栏宽度 */
const onSidebarMouseMove = (e: MouseEvent) => {
  if (!isDraggingSidebar.value) return;
  const w = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, e.clientX));
  sidebarWidth.value = w;
};

/** 结束侧边栏拖拽 */
const stopSidebarDrag = () => {
  if (!isDraggingSidebar.value) return;
  isDraggingSidebar.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

/** 切换历史对话：中止当前请求 → 加载目标会话消息 */
const onSelectHistory = async (item: SessionItem) => {
  if (item.id === sessionId.value) return;
  const targetId = item.id;
  resetConversationState();
  sessionId.value = targetId;
  loadingTitle.value = (item.title || '').length > 20 ? `${item.title!.slice(0, 20)}…` : (item.title || '');
  copilotLoading.value = true;
  try {
    await getRecentMessages(targetId);
  } catch (e: any) {
    if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
    console.warn('load session messages failed', e);
    if (sessionId.value === targetId) message.error('加载会话消息失败');
  } finally {
    if (sessionId.value === targetId) {
      copilotLoading.value = false;
      loadingTitle.value = '';
    }
  }
};

/** 从收藏表点击发送，直接发送查看表详情的提示词 */
const onSendFromFav = (fqn: string) => {
  if (aiReplyLoading.value || createSessionLoading.value || copilotLoading.value) {
    message.warning('请等待当前操作完成后再试');
    return;
  }
  inputValue.value = `查看 ${fqn} 表的详细信息`;
  onSend();
};

/** 获取最近 3 天的会话列表 */
const fetchRecentSessions = async () => {
  try {
    const res = await CopilotApi.getRecentSessions({
      params: { agentType: AGENT_TYPE, days: RECENT_DAYS },
      hideLoading: true,
    });
    recentSessions.value = res.data?.body || [];
  } catch (e) {
    console.warn('fetchRecentSessions failed', e);
  }
};

/** 分页加载更早的会话列表 */
const fetchEarlierSessions = async () => {
  earlierLoading.value = true;
  try {
    const res = await CopilotApi.getEarlierSessions({
      params: { agentType: AGENT_TYPE, days: RECENT_DAYS, pageNum: earlierPageNum.value, pageSize: EARLIER_PAGE_SIZE },
      hideLoading: true,
    });
    const body = res.data?.body || {};
    const items = body.items || [];
    earlierSessions.value = [...earlierSessions.value, ...items];
    earlierHasMore.value = body.hasMore ?? false;
  } catch (e) {
    console.warn('fetchEarlierSessions failed', e);
    message.error('加载更早会话失败');
  } finally {
    earlierLoading.value = false;
  }
};

/** 获取用户收藏的表列表 */
const fetchFavorites = async () => {
  try {
    const res = await FavoritesApi.listFavorites({
      params: { pageNum: 1, pageSize: 50 },
      hideLoading: true,
    });
    favoriteTables.value = res.data?.body || [];
  } catch (e) {
    console.warn('fetchFavorites failed', e);
  }
};

/** 删除历史对话，若删除的是当前会话则自动切到下一个 */
const onDeleteHistory = (targetSessionId: string) => {
  Modal.confirm({
    title: '确认删除该对话？',
    content: '删除后无法恢复。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const res = await CopilotApi.deleteSession({ params: { sessionId: targetSessionId }, hideLoading: true });
        const body = res.data?.body || false;
        if (!body) {
          message.error('删除对话失败');
          return;
        }
        recentSessions.value = recentSessions.value.filter((s) => s.id !== targetSessionId);
        earlierSessions.value = earlierSessions.value.filter((s) => s.id !== targetSessionId);
        message.success('已删除对话');
        if (targetSessionId === sessionId.value) {
          resetConversationState();
        }
      } catch (e) {
        console.warn('deleteSession failed', e);
        message.error('删除对话失败');
      }
    },
  });
};

/** 弹窗重命名历史对话标题（最长 20 字符） */
const onRenameHistory = (session: SessionItem) => {
  let newTitle = session.title;
  Modal.confirm({
    title: '重命名对话',
    content: () => h(Input, {
      defaultValue: session.title,
      onChange: (e: any) => { newTitle = e.target.value; },
    }),
    okText: '确定',
    cancelText: '取消',
    async onOk() {
      const trimmed = newTitle?.trim();
      if (!trimmed) {
        message.warning('标题不能为空');
        return Promise.reject();
      }
      try {
        const params = {
          sessionId: session.id,
          title: trimmed,
        };
        const res = await CopilotApi.updateSession(params, { hideLoading: true} as any);
        const body = res.data?.body || false;
        if (!body) {
          message.error('重命名失败');
          return;
        }
        recentSessions.value = recentSessions.value.map((s) =>
          s.id === session.id ? { ...s, title: trimmed } : s,
        );
        earlierSessions.value = earlierSessions.value.map((s) =>
          s.id === session.id ? { ...s, title: trimmed } : s,
        );
        message.success('重命名成功');
      } catch (e) {
        console.warn('updateSession failed', e);
        message.error('重命名失败');
      }
    },
  });
};

/** 侧边栏收藏表的收藏/取消收藏操作 */
const onToggleFavorite = async (item: FavoriteItem) => {
  const targetFavorited = !item.favorited;
  try {
    const res = await FavoritesApi.toggleFavorite(
      { databaseName: item.databaseName, tableName: item.tableName, favorited: targetFavorited },
      { hideLoading: true } as any,
    );
    const body = res.data?.body || {};
    const nowFavorited = !!body.favorited;

    if (nowFavorited) {
      const existing = favoriteTables.value.find(
        (t) => t.databaseName === item.databaseName && t.tableName === item.tableName,
      );
      if (existing) {
        existing.favorited = true;
      } else {
        favoriteTables.value.unshift({ ...item, favorited: true });
      }
      message.success('已收藏');
    } else {
      favoriteTables.value = favoriteTables.value.filter(
        (t) => !(t.databaseName === item.databaseName && t.tableName === item.tableName),
      );
      message.success('已取消收藏');
    }

    const fqn = `${item.databaseName}.${item.tableName}`;
    updateFavoriteCardState(fqn, nowFavorited);
  } catch (e: any) {
    message.error(e?.data?.status?.detail ?? '操作失败');
  }
};

/** 从 AI 回复的收藏卡片中触发收藏/取消收藏，同步侧边栏和消息卡片状态 */
const onToggleFavoriteFromCard = async (payload: { fqn: string; favorited: boolean; requestId: string }) => {
  const [databaseName, tableName] = payload.fqn.split('.');
  if (!databaseName || !tableName) return;
  try {
    const res = await FavoritesApi.toggleFavorite({ databaseName, tableName, favorited: payload.favorited }, { hideLoading: true } as any);
    const body = res.data?.body || {};
    const nowFavorited = !!body.favorited;

    console.log('onToggleFavoriteFromCard', body);

    updateFavoriteCardState(payload.fqn, nowFavorited, payload.requestId);

    if (nowFavorited) {
      if (!favoriteTables.value.some((t) => t.databaseName === body?.databaseName && t.tableName === body?.tableName)) {
        favoriteTables.value.unshift({
          databaseName: body?.databaseName,
          tableName: body?.tableName,
          owner: body?.owner,
          description: body?.description,
          favorited: true,
          ownerDisplayName: body?.ownerDisplayName,
        });
      }
      message.success('已收藏');
    } else {
      favoriteTables.value = favoriteTables.value.filter(
        (t) => !(t.databaseName === databaseName && t.tableName === tableName),
      );
      message.success('已取消收藏');
    }
  } catch (e: any) {
    message.error(e?.data?.status?.detail ?? '操作失败');
  }
};

/**
 * 同步对话里 SHOW_DATAMAP_FAVORITE_CARD 的 favorited 状态。
 * @param requestId 若传入，只更新该条 AI 消息（与 getRecentMessages 的 requestId 一致）；不传则更新所有匹配 fqn 的卡片（如侧边栏取消收藏）
 */
function updateFavoriteCardState(fqn: string, favorited: boolean, requestId?: string) {
  for (const msg of messages.value) {
    if (msg.role !== ASSISTANT) continue;
    if (requestId && (msg as AiMessage).requestId !== requestId) continue;
    const doneItem = (msg as AiMessage).listItems?.find((i) => i.renderCategory === INTERACTIVE_CARD);
    if (!doneItem || !Array.isArray(doneItem.content)) continue;

    for (let i = 0; i < doneItem.content.length; i++) {
      const action = doneItem.content[i] as any;
      if (action.actionCode === 'SHOW_DATAMAP_FAVORITE_CARD' && action.actionData?.fqn === fqn) {
        doneItem.content[i] = { ...action, actionData: { ...action.actionData, favorited } };
      }
    }
  }
}

/** 中断进行中的分享请求并重置状态 */
function cancelShareRequest() {
  if (shareAbortController.value) {
    shareAbortController.value.abort();
    shareAbortController.value = null;
  }
  shareLoading.value = false;
}

// ---------- 分享确认：生成链接 & 复制到剪贴板 ----------
async function onShareConfirm(payload: { expireDays: number | null; requestIds: string[] }) {
  cancelShareRequest();
  const controller = new AbortController();
  shareAbortController.value = controller;
  shareLoading.value = true;

  let shareUrl = '';
  try {
    const isMessages = payload.requestIds.length > 0;
    const res = await CopilotApi.createShare({
      sessionId: sessionId.value,
      shareType: isMessages ? 'MESSAGES' : 'SESSION',
      requestIds: isMessages ? payload.requestIds : undefined,
      title: currentSessionTitle.value || undefined,
      expireDays: payload.expireDays,
    }, { hideLoading: true, signal: controller.signal } as any);
    const body = res.data?.body || {};
    shareUrl = body.shareUrl;
  } catch (e: any) {
    shareLoading.value = false;
    shareAbortController.value = null;
    if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
    return message.error('分享失败，请稍后重试');
  }
  shareLoading.value = false;
  shareAbortController.value = null;

  copyAndNotify(shareUrl);
}

/** 复制分享链接到剪贴板并提示 */
async function copyAndNotify(shareUrl: string) {
  let copied = false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
    } catch { /* fallback below */ }
  }
  if (!copied) {
    copied = copyTextViaExecCommand(shareUrl);
  }
  if (copied) {
    message.success('分享链接已复制到剪贴板');
  } else {
    message.warning({
      content: `当前页面无法自动写入剪贴板，请手动复制：${shareUrl}`,
      duration: 10,
    });
  }
}

/** 剪贴板 API 不可用时的降级方案，通过 execCommand 复制文本 */
function copyTextViaExecCommand(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** 侧边栏点击分享历史对话：打开分享弹窗 */
function onShareHistory(session: SessionItem) {
  sidebarShareSessionId.value = session.id;
  sidebarShareTitle.value = session.title || '';
  sidebarShareModalVisible.value = true;
}

/** 侧边栏分享弹窗确认：调用接口生成链接并复制 */
async function onSidebarShareConfirm(payload: { expireDays: number | null }) {
  const targetSessionId = sidebarShareSessionId.value;
  if (!targetSessionId) return;

  cancelShareRequest();
  const controller = new AbortController();
  shareAbortController.value = controller;
  shareLoading.value = true;

  let shareUrl = '';
  try {
    const res = await CopilotApi.createShare({
      sessionId: targetSessionId,
      shareType: 'SESSION',
      title: sidebarShareTitle.value || undefined,
      expireDays: payload.expireDays,
    }, { hideLoading: true, signal: controller.signal } as any);
    const body = res.data?.body || {};
    shareUrl = body.shareUrl;
  } catch (e: any) {
    shareLoading.value = false;
    shareAbortController.value = null;
    if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
    return message.error('分享失败，请稍后重试');
  }
  shareLoading.value = false;
  shareAbortController.value = null;

  copyAndNotify(shareUrl);

  sidebarShareModalVisible.value = false;
  sidebarShareSessionId.value = undefined;
  sidebarShareTitle.value = '';
}

/** 加载更早的会话（翻页） */
const onLoadMoreEarlier = () => {
  earlierPageNum.value += 1;
  fetchEarlierSessions();
};

onMounted(() => {
  initSessions();
  fetchSuggestedPrompts();
  window.addEventListener('mousemove', onSidebarMouseMove);
  window.addEventListener('mouseup', stopSidebarDrag);
});

onUnmounted(() => {
  resetConversationState();
  window.removeEventListener('mousemove', onSidebarMouseMove);
  window.removeEventListener('mouseup', stopSidebarDrag);
});


/** 获取指定会话的消息列表并解析为前端消息结构 */
const getRecentMessages = async (id: string) => {
  messagesAbortController.value?.abort();
  const controller = new AbortController();
  messagesAbortController.value = controller;

  hasMore.value = false;
  const res = await CopilotApi.getRecentMessages({
    params: { sessionId: id, page: page.value, size: 50 },
    hideLoading: true,
    signal: controller.signal,
  });

  if (controller.signal.aborted) return;
  messagesAbortController.value = null;

  const bodyData = res.data?.body || {};
  hasMore.value = bodyData?.hasMore ?? false;

  const tempMessages = parseRawMessages(bodyData?.items || [], { skipFrontendActions: true });
  curAiMessage.value = null;
  messages.value = [...tempMessages, ...messages.value];
}

/** 加载更多历史消息（向上翻页） */
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

/** 页面初始化：加载最近会话、收藏表、更早会话 */
const initSessions = async () => {
  copilotLoading.value = true;
  try {
    earlierPageNum.value = 1;
    await Promise.all([fetchRecentSessions(), fetchFavorites(), fetchEarlierSessions()]);
  } catch (e) {
    console.warn('initSessions failed', e);
  } finally {
    copilotLoading.value = false;
  }
};

/** 创建新会话，返回 sessionId */
const createSession = async (options: { agentType?: string } = {}) => {
  const res = await CopilotApi.postSessions({
    agentType: options.agentType || AGENT_TYPE,
  });
  const body = res.data?.body || {};
  return body.id;
};

// 重置会话状态
const resetConversationState = () => {
  abortController.value?.abort();
  abortController.value = null;
  cancelAbortController.value?.abort();
  cancelAbortController.value = null;
  actionAbortController.value?.abort();
  actionAbortController.value = null;
  shareAbortController.value?.abort();
  shareAbortController.value = null;
  messagesAbortController.value?.abort();
  messagesAbortController.value = null;
  shareLoading.value = false;
  aiReplyLoading.value = false;
  createSessionLoading.value = false;
  curAiMessage.value = null;
  messages.value = [];
  inputValue.value = '';
  associateTableModalVisible.value = false;
  associateTablePayload.value = undefined;
  sessionId.value = undefined;
  isShareMode.value = false;
  page.value = 1;
  hasMore.value = false;
  copilotLoading.value = false;
  loadMoreMessagesLoading.value = false;  
}

/** 新建对话：重置所有会话状态回到欢迎页 */
const onNewChat = () => {
  resetConversationState();
};
/** 构建用户消息对象，默认使用当前会话 sessionId */
const getUserMessage = (text: string, options: { messageSeqNo?: number; requestId?: string; sessionId?: string } = {}) =>
  createUserMessage(text, { ...options, sessionId: options.sessionId ?? sessionId.value });

/** 发送消息：无会话时先创建 → 添加用户消息 → 请求 AI 回复 */
const onSend = async () => {
  const text = inputValue.value.trim(); 
  if (!text) return;
  if (aiReplyLoading.value || createSessionLoading.value) {
    message.warning('请等待当前操作完成后再发送');
    return;
  }

  let newConversation = false;

  if (!sessionId.value) {
    createSessionLoading.value = true;
    try {
      const newSessionId = await createSession(
        { agentType: AGENT_TYPE },
      );
      if (newSessionId) {
        sessionId.value = newSessionId;
        fetchRecentSessions();
        newConversation = true;
      } else {
        message.error('创建会话失败');
        return;
      }
    } catch (e) {
      console.warn('create session on send failed', e);
      message.error('创建会话失败');
      return;
    } finally {
      createSessionLoading.value = false;
    }
  }

  const userMessage = getUserMessage(text);
  messages.value.push(userMessage);
  inputValue.value = '';

  await getAiReply(text, userMessage.requestId ?? '', userMessage, newConversation);
};

/** 点击追问建议，填入输入框并发送 */
const onFollowUpClick = (suggestion: string) => {
  if (!suggestion || aiReplyLoading.value || createSessionLoading.value) return;
  inputValue.value = suggestion;
  onSend();
};

/** 移除无实际内容的 AI 消息（避免空气泡残留） */
const removeIfEmptyAiMessage = (msg: AiMessage) => {
  const items = msg.listItems ?? [];
  const hasContent = items.some((item) => {
    if (item.renderCategory === OUTPUT_CONTENT) return !!item.content;
    if (item.renderCategory === INTERACTIVE_CARD) return Array.isArray(item.content) && item.content.length > 0;
    if (item.renderCategory === FOLLOW_UP_SUGGESTION) return Array.isArray(item.suggestions) && item.suggestions.length > 0;
    if (item.renderCategory === THOUGHT_CHAIN) return false;
    return false;
  });
  if (!hasContent) {
    const idx = messages.value.findIndex((m) => m === msg);
    if (idx >= 0) messages.value.splice(idx, 1);
  }
};

/** 停止生成：中止 SSE 流 → 调用后端 cancel 接口 → 清理当前 AI 消息 */
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
        requestId: requestId,
        sessionId: sessionId.value,
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

/** 解析 SSE 流数据并分发到 AI 消息的各个渲染槽位，处理 SHOW_SQL_DIFF_CARD 前端动作 */
const handleStreamData = (data: any, aiMessage: AiMessage, options?: { skipFrontendActions?: boolean }) => {
  fillAiMessageFromDelta(data, aiMessage, {
    skipFrontendActions: options?.skipFrontendActions,
    onFrontendAction: () => {},
  });
}

/** 逐行读取 SSE 流：解析 JSON → 回填消息 ID → 分发到 handleStreamData → DONE/ERROR 时终止 */
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

          // 后端在首轮回复时通过 SSE 下发 sessionTitle，用于更新侧边栏历史列表中当前会话的标题
          const sessionTitle = data.sessionTitle as string | undefined;
          if (sessionTitle && sessionId.value) {
            const updateTitle = (list: SessionItem[]) =>
              list.forEach((s) => { if (s.id === sessionId.value) s.title = sessionTitle; });
            updateTitle(recentSessions.value);
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

/** 创建 AI 消息并追加到消息列表，同时设为当前活跃 AI 消息 */
const createAiMessage = (options: any): AiMessage => {
  const aiMessage = createAiMessageSkeleton(options);
  messages.value.push(aiMessage);
  const currentAiMessage = messages.value[messages.value.length - 1] as AiMessage;
  curAiMessage.value = currentAiMessage;
  return currentAiMessage;
}

const setAiMessageError = (aiMsg: AiMessage, errorText: string) => {
  aiMsg.thinking = false;
  curAiMessage.value = null;
  aiReplyLoading.value = false;
  const outputItem = aiMsg.listItems?.find((item) => item.renderCategory === OUTPUT_CONTENT);
  if (outputItem) {
    if (outputItem.content) {
      outputItem.content += `\n\n---\n\n⚠️ ${errorText}`;
    } else {
      outputItem.content = errorText;
    }
    outputItem.markdownContent = DOMPurify.sanitize(
      marked.parse(outputItem.content.replace(/<br\s*\/?>/g, '\n')) as string,
    );
  }
};

/** 向后端发送聊天请求并通过 SSE 流读取 AI 回复，userMessage 存在时会回填 sessionId */
const getAiReply = async (content: string, requestId: string, userMessage: any, newConversation: boolean) => {
  abortController.value?.abort();
  abortController.value = new AbortController();

  const postChatParams = {
    requestId,
    sessionId: sessionId.value,
    message: content,
    taskDevelopmentAgentType: AGENT_TYPE,
    newConversation
  };

  aiReplyLoading.value = true;
  const currentAiMessage = createAiMessage({ sessionId: null, messageSeqNo: null, requestId: null, thinking: true });

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
      setAiMessageError(currentAiMessage, '服务器未返回有效响应，请稍后重试');
      return;
    }

    const reader = response.body.getReader();
    await readStream(reader, userMessage, currentAiMessage);
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      curAiMessage.value = null;
      aiReplyLoading.value = false;
      currentAiMessage.thinking = false;
    } else {
      setAiMessageError(currentAiMessage, '获取 AI 回复失败，请稍后重试');
    }
  }
};

/** 执行交互动作（如覆盖、回退），通过 SSE 流接收后端响应 */
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
      message.error(e?.data?.status?.detail ?? '操作失败');
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
      await CopilotApi.getCheckpoint({ params });
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
      await CopilotApi.getCheckpoint({params, hideLoading: true});

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

/** 输入框 @ 选择，根据类型分发到对应弹窗 */
const onAtSelect = (type: 'table' | 'tapd', payload?: { source?: 'footer' }) => {
  if (type === 'table') {
    onAssociateTable(payload);
  }
};

/** source: 'context-card' 来自上下文卡片内按钮，'footer' 来自输入框 @ 按钮，不传则视为 footer */
const onAssociateTable = (payload?: { requestId?: string; sessionId?: string; source?: 'context-card' | 'footer' }) => {
  associateTablePayload.value = payload;
  associateTableModalVisible.value = true;
};

/** 关闭选表弹窗 */
const onAssociateTableModalClose = () => {
  associateTableModalVisible.value = false;
  associateTablePayload.value = {};
};

/** 选表弹窗确认：来自上下文卡片时回填原消息，来自输入框时拼接 @表名 */
const onAssociateTableConfirm = async (tableKeys: string[], payload?: { requestId?: string; sessionId?: string; source?: 'context-card' | 'footer' }) => {
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
  } else if (tableKeys.length) {
    const tableStr = tableKeys.map((k) => `@${k}`).join(' ');
    const current = inputValue.value.trim();
    inputValue.value = current ? `${current} ${tableStr} ` : `${tableStr} `;
  }

  associateTableModalVisible.value = false;
  associateTablePayload.value = {};
};
</script>

<style lang="less" scoped>
@brand-purple: rgba(108, 76, 155, 1);

.data-map-layout {
  width: 100%;
  height: calc(100vh - 56px);
  display: flex;
  overflow: hidden;
  background: #f8fafc;

  &__sidebar {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e2e8f0;
    position: relative;
    z-index: 10;
    transition: background 0.3s;
    background: #fff;
  }

  &__resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    z-index: 20;
    transition: background 0.2s;

    &:hover {
      background: fade(@brand-purple, 50%);
    }
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 0;
    transition: background 0.3s;
    // 微妙的点阵纹背景（与 MapAgent 对齐）
    background-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMykiLz48L3N2Zz4=");
    background-color: #f8fafc;
  }

  &__expand-bar {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 50;
    display: flex;
    gap: 8px;
  }

  &__expand-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e2e8f0;
    color: #64748b;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    font-size: 16px;
    transition: all 0.2s;

    &:hover {
      background: #f8fafc;
      color: @brand-purple;
      border-color: fade(@brand-purple, 35%);
    }
  }
}

.data-map-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: transparent;
  position: relative;
}

.data-map-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.6);

  &__text {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.45);
  }
}

/* ---- 欢迎页 ---- */
.data-map-welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 24px;

  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 780px;
  }

  &__greeting {
    text-align: center;
    margin-bottom: 32px;
  }

  &__sparkle {
    font-size: 22px;
    color: @brand-purple;
    margin-right: 8px;
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.88);
    margin: 0 0 8px;
  }

  &__desc {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.55);
    margin: 0;
  }

  &__input-area {
    width: 100%;
    max-width: 680px;
    margin-bottom: 32px;

    :deep(.copilot-input-area) {
      position: static;
      background: transparent;
      padding: 0;
    }
    :deep(.copilot-input-area__disclaimer) {
      display: none;
    }
    :deep(textarea.ant-input) {
      min-height: 80px !important;
    }
  }

  &__suggestions {
    width: 100%;
    max-width: 680px;
  }

  &__suggestions-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
    font-weight: 500;
    margin-bottom: 14px;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-height: 276px;
    overflow-y: auto;
  }

  &__card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: fade(@brand-purple, 45%);
      box-shadow: 0 2px 8px rgba(108, 76, 155, 0.1);
    }
  }

  &__card-title {
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.88);
    margin-bottom: 6px;
  }

  &__card-desc {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    line-height: 1.5;
  }
}
</style>
