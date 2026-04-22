<!--
 * Copilot 主内容区：聊天列表（由 messages 数据驱动）；无消息时展示欢迎空状态
-->
<template>
  <main class="copilot-main">
    <div
      v-show="messages.length > 0 && hasMore && isNearTop"
      class="copilot-main__load-more-wrap"
    >
      <Button
        type="link"
        size="small"
        class="copilot-main__load-more"
        :loading="loadMoreLoading"
        @click="onLoadMoreClick"
      >
        加载更多
      </Button>
    </div>
    <div ref="chatContainerRef" class="copilot-main__chat" :class="{ 'copilot-main__chat--share': isShareMode }" @scroll="onChatScroll">
      <template v-for="group in messageGroups" :key="group.id">
        <div
          class="copilot-main__group"
          :class="{ 'copilot-main__group--share': isShareMode }"
          :data-group-id="group.id"
        >
          <!-- 分享模式勾选框 -->
          <div v-if="isShareMode" class="copilot-main__group-checkbox">
            <Checkbox
              :checked="selectedGroupIds.includes(group.id)"
              @change="toggleGroup(group.id)"
            />
          </div>

          <div class="copilot-main__group-content" :class="{ 'copilot-main__group-content--indent': isShareMode }">
            <template v-for="msg in group.messages" :key="msg.uniqueId">
              <!-- 用户消息 -->
              <div v-if="msg.role === USER" class="copilot-msg copilot-msg--user">
                <Avatar class="copilot-avatar copilot-avatar--user" :size="32" :icon="h(UserOutlined)" />
                <UserChatMsg
                  :content="msg.content"
                  :ai-reply-loading="props.aiReplyLoading"
                  @overwrite="onUserMsgOverwrite(msg, $event)"
                  @revert="onUserMsgRevert(msg)"
                />
              </div>

              <template v-if="msg.role === ASSISTANT">
                <div class="copilot-msg copilot-msg--ai">
                  <div class="copilot-avatar copilot-avatar--ai">
                    <StarFilled class="copilot-avatar__icon" />
                  </div>
                  <div class="copilot-main__ai-block">
                    <template v-for="(item, itemIdx) in msg.listItems" :key="`${item.renderCategory}-${itemIdx}`">
                      <ThinkCard
                        v-if="item.renderCategory === THOUGHT_CHAIN"
                        :bubble-content="item.content"
                        :thinking="msg.thinking"
                      />
                      <GeneratingCard v-if="item.renderCategory === OUTPUT_CONTENT && item.content" :content="item.content" :markdownContent="item.markdownContent" />
                      <DoneCard
                        v-if="item.renderCategory === INTERACTIVE_CARD"
                        :content="item.content"
                        :request-id="msg.requestId ?? ''"
                        @toggle-favorite-from-card="emit('toggleFavoriteFromCard', $event)"
                      />
                      <div
                        v-if="item.renderCategory === FOLLOW_UP_SUGGESTION && item.suggestions?.length && !isShareMode"
                        class="follow-up-suggestions"
                      >
                        <div class="follow-up-suggestions__header">
                          <BulbOutlined class="follow-up-suggestions__icon" />
                          <span>{{ item.content || '您可以继续问我：' }}</span>
                        </div>
                        <div class="follow-up-suggestions__list">
                          <div
                            v-for="(suggestion, sIdx) in item.suggestions"
                            :key="sIdx"
                            class="follow-up-suggestions__item"
                            @click="emit('followUpClick', suggestion)"
                          >
                            <div class="follow-up-suggestions__dot" />
                            <span class="follow-up-suggestions__text">{{ suggestion }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
                    <div v-if="msg.thinking" class="copilot-dots-loading">
                      <span class="copilot-dots-loading__dot" />
                      <span class="copilot-dots-loading__dot" />
                      <span class="copilot-dots-loading__dot" />
                    </div>
                    <AiMessageFeedback
                      v-if="!isShareMode && !msg.thinking"
                      :msg="msg"
                      @share="onShareFromMsg"
                    />
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>
      </template>

      <!-- 分享操作栏（sticky 在滚动区底部） -->
      <ShareActionBar
        :visible="isShareMode"
        :is-all-selected="isAllSelected"
        :is-indeterminate="isIndeterminate"
        :selected-count="selectedGroupIds.length"
        @toggle-all="toggleSelectAll"
        @cancel="cancelShareMode"
        @open-modal="openShareModal"
      />
    </div>

    <!-- 分享配置弹窗 -->
    <ShareConfigModal
      v-model:open="shareModalVisible"
      :selected-count="selectedGroupIds.length"
      :session-title="sessionTitle"
      :confirm-loading="shareLoading"
      @confirm="onShareConfirm"
      @cancel="onShareCancel"
    />
  </main>
</template>

<script lang="ts" setup>
import { h, ref, watch, nextTick, computed, onBeforeUnmount } from 'vue';
import type { Component } from 'vue';
import type { PropType } from 'vue';
import type { ChatMessage } from '../../constant';
import DoneCard from '../done-card/index.vue';
import GeneratingCard from '../generating-card/index.vue';
import ThinkCard from '../think-card/index.vue';
import UserChatMsg from '../user-chat-msg/index.vue';
import AiMessageFeedback from './ai-message-feedback.vue';
import ShareActionBar from '../share-action-bar/index.vue';
import ShareConfigModal from '../../modal/share-config-modal/index.vue';
import { Avatar, Button, Checkbox, message as antMessage } from 'ant-design-vue';
import {
  UserOutlined,
  StarFilled,
  BulbOutlined,
} from '@ant-design/icons-vue';
import { THOUGHT_CHAIN, OUTPUT_CONTENT, INTERACTIVE_CARD, FOLLOW_UP_SUGGESTION, USER, ASSISTANT, QUICK_INTENT_CONFIG } from '../../constant';

interface MessageGroup {
  id: string;
  messages: ChatMessage[];
}

const props = defineProps({
  messages: {
    type: Array as PropType<ChatMessage[]>,
    required: true,
  },
  isShareMode: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
  loadMoreLoading: {
    type: Boolean,
    default: false,
  },
  aiReplyLoading: {
    type: Boolean,
    default: false,
  },
  sessionTitle: {
    type: String,
    default: '',
  },
  shareLoading: {
    type: Boolean,
    default: false,
  },
});

const chatContainerRef = ref<HTMLElement | null>(null);
const shouldAutoScroll = ref(true);
const AUTO_SCROLL_THRESHOLD = 24;
/** 加载更多前置顶的 scroll 高度，用于插入历史消息后恢复视口 */
const loadMoreScrollAnchor = ref<{ scrollHeight: number; scrollTop: number } | null>(null);
/** 为 true 时禁止自动滚底（避免 prepend 历史消息后被 messages watch / MutationObserver 拉到底部） */
const preserveScrollForLoadMore = ref(false);
const LOAD_MORE_SHOW_THRESHOLD = 80;
const isNearTop = ref(false);

// ---------- 对话分组：每组 = 一条用户消息 + 后续 AI 消息 ----------
const messageGroups = computed<MessageGroup[]>(() => {
  const groups: MessageGroup[] = [];
  let current: ChatMessage[] = [];
  for (const msg of props.messages) {
    if (msg.role === USER) {
      if (current.length > 0) {
        const aiMsg = current.find(m => m.role === ASSISTANT);
        groups.push({ id: aiMsg?.uniqueId ?? current[0].uniqueId, messages: current });
      }
      current = [msg];
    } else {
      current.push(msg);
    }
  }
  if (current.length > 0) {
    const aiMsg = current.find(m => m.role === ASSISTANT);
    groups.push({ id: aiMsg?.uniqueId ?? current[0].uniqueId, messages: current });
  }
  return groups;
});

// ---------- 分享模式状态 ----------
const selectedGroupIds = ref<string[]>([]);
const shareModalVisible = ref(false);

const isAllSelected = computed(() =>
  messageGroups.value.length > 0 && selectedGroupIds.value.length === messageGroups.value.length
);
const isIndeterminate = computed(() =>
  selectedGroupIds.value.length > 0 && selectedGroupIds.value.length < messageGroups.value.length
);

function toggleGroup(groupId: string) {
  const idx = selectedGroupIds.value.indexOf(groupId);
  if (idx > -1) selectedGroupIds.value.splice(idx, 1);
  else selectedGroupIds.value.push(groupId);
}

function toggleSelectAll(e: any) {
  selectedGroupIds.value = e.target.checked
    ? messageGroups.value.map(g => g.id)
    : [];
}

function cancelShareMode() {
  emit('update:isShareMode', false);
  selectedGroupIds.value = [];
}

function openShareModal() {
  if (selectedGroupIds.value.length === 0) {
    antMessage.warning('请至少选择一组对话');
    return;
  }
  shareModalVisible.value = true;
}

function onShareFromMsg(uniqueId: string) {
  const group = messageGroups.value.find(g =>
    g.messages.some(m => m.uniqueId === uniqueId)
  );
  const groupId = group?.id;
  emit('update:isShareMode', true);
  selectedGroupIds.value = groupId ? [groupId] : [];

  nextTick(() => {
    requestAnimationFrame(() => {
      if (!groupId || !chatContainerRef.value) return;
      const container = chatContainerRef.value;
      const el = container.querySelector(`[data-group-id="${groupId}"]`) as HTMLElement | null;
      if (!el) return;
      const elTop = el.offsetTop - container.offsetTop;
      const targetTop = elTop - container.clientHeight / 3;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    });
  });
}

function onShareConfirm(payload: { expireDays: number | null }) {
  const requestIds = messageGroups.value
    .filter(g => selectedGroupIds.value.includes(g.id))
    .flatMap(g => g.messages.filter(m => m.role === ASSISTANT && m.requestId).map(m => m.requestId as string));
  emit('shareConfirm', { expireDays: payload.expireDays, requestIds });
}

function onShareCancel() {
  cancelShareMode();
  emit('shareCancel');
}

watch(() => props.shareLoading, (loading, prev) => {
  if (prev && !loading && shareModalVisible.value) {
    shareModalVisible.value = false;
    cancelShareMode();
  }
});

function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= AUTO_SCROLL_THRESHOLD;
}

let scrollRafId: number | null = null;

function scrollToBottom() {
  if (preserveScrollForLoadMore.value) return;
  if (!shouldAutoScroll.value) return;
  if (scrollRafId !== null) return;
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null;
    const el = chatContainerRef.value;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  });
}

function onChatScroll() {
  const el = chatContainerRef.value;
  if (!el) return;
  shouldAutoScroll.value = isNearBottom(el as HTMLElement);
  isNearTop.value = el.scrollTop <= LOAD_MORE_SHOW_THRESHOLD;
}

watch(
  () => props.messages.length,
  () => {
    if (preserveScrollForLoadMore.value) return;
    shouldAutoScroll.value = true;
    scrollToBottom();
  },
  { flush: 'post' }
);

let chatObserver: MutationObserver | null = null;

watch(chatContainerRef, (el, oldEl) => {
  chatObserver?.disconnect();
  if (!el) return;
  isNearTop.value = el.scrollTop <= LOAD_MORE_SHOW_THRESHOLD;
  chatObserver = new MutationObserver(() => {
    if (preserveScrollForLoadMore.value) return;
    scrollToBottom();
  });
  chatObserver.observe(el as unknown as Node, { childList: true, subtree: true, characterData: true });
}, { immediate: true });

onBeforeUnmount(() => {
  chatObserver?.disconnect();
  if (scrollRafId !== null) cancelAnimationFrame(scrollRafId);
});

watch(
  () => props.loadMoreLoading,
  (loading, wasLoading) => {
    if (!wasLoading || loading) return;
    if (loadMoreScrollAnchor.value) {
      const anchor = loadMoreScrollAnchor.value;
      loadMoreScrollAnchor.value = null;
      nextTick(() => {
        const el = chatContainerRef.value;
        if (el) {
          el.scrollTop = el.scrollHeight - anchor.scrollHeight + anchor.scrollTop;
        }
        preserveScrollForLoadMore.value = false;
      });
    } else {
      preserveScrollForLoadMore.value = false;
    }
  }
);

function onLoadMoreClick() {
  preserveScrollForLoadMore.value = true;
  const el = chatContainerRef.value;
  if (el) {
    loadMoreScrollAnchor.value = {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
    };
  }
  emit('loadMore');
  nextTick(() => {
    if (!props.loadMoreLoading) {
      preserveScrollForLoadMore.value = false;
    }
  });
}

/** 覆盖重写：从当前用户消息及之后全部删除，requestId/sessionId 取自该条用户消息 */
const onUserMsgOverwrite = (msg: ChatMessage, newContent: string) => {
  const userMsg = msg as unknown as Record<string, unknown>;
  const requestId = userMsg.requestId as string | undefined;
  const sessionId = userMsg.sessionId as string | undefined;
  emit('overwriteMsg', {
    newContent,
    uniqueId: msg.uniqueId,
    requestId,
    sessionId,
  });
}

/** 仅回退：拉取该条消息前的代码快照回填编辑器，不删会话消息 */
function onUserMsgRevert(msg: ChatMessage) {
  const userMsg = msg as unknown as Record<string, unknown>;
  const requestId = userMsg.requestId as string | undefined;
  const sessionId = userMsg.sessionId as string | undefined;
  emit('revertMsg', {
    uniqueId: msg.uniqueId,
    requestId,
    sessionId,
  });
}

const emit = defineEmits<{
  loadMore: [];
  overwriteMsg: [payload: { newContent: string; uniqueId: string; requestId?: string; sessionId?: string }];
  revertMsg: [payload: { uniqueId: string; requestId?: string; sessionId?: string }];
  followUpClick: [suggestion: string];
  toggleFavoriteFromCard: [payload: { fqn: string; favorited: boolean; requestId: string }];
  'update:isShareMode': [val: boolean];
  shareConfirm: [payload: { expireDays: number | null; requestIds: string[] }];
  shareCancel: [];
}>();
</script>

<style lang="less" scoped>
@brand-purple: #6b4c9a;
@border-color: rgba(0, 0, 0, 0.06);
@text-primary: rgba(0, 0, 0, 0.88);
@text-secondary: rgba(0, 0, 0, 0.45);

.copilot-main {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  &__load-more-wrap {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 5;
    display: flex;
    justify-content: center;
    padding: 16px 0 14px;
    background: linear-gradient(to bottom, #fafafa 40%, transparent);
    pointer-events: none;
  }

  &__load-more {
    font-size: 12px;
    padding: 0 8px;
    height: auto;
    pointer-events: auto;
  }

  &__chat {
    flex: 1;
    width: 100%;
    background: #fafafa;
    padding: 40px 24px 40px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    position: relative;

    &--share {
      padding-bottom: 120px;
    }

    :deep(.copilot-msg) {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      &.copilot-msg--user {
        flex-direction: row-reverse;
      }
    }
    :deep(.copilot-avatar) {
      flex-shrink: 0;
      &.copilot-avatar--user {
        background: #f0f0f0;
        border-radius: 8px;
        .anticon {
          color: rgba(0, 0, 0, 0.45);
        }
      }
      &.copilot-avatar--ai {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: linear-gradient(135deg, @brand-purple 0%, rgba(138, 99, 210, 0.85) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        .copilot-avatar__icon {
          font-size: 14px;
          color: #fff;
        }
      }
    }
  }

  &__ai-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  &__group {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
    max-width: 48rem;
    transition: background 0.3s, padding 0.3s, border-radius 0.3s;

    &--share {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 12px;
      padding: 12px;
    }
  }

  &__group-checkbox {
    position: absolute;
    left: 12px;
    top: 12px;
    z-index: 10;
  }

  &__group-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    transition: padding-left 0.3s;

    &--indent {
      padding-left: 28px;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    // min-height: 280px;
  }

  &__empty-brand {
    text-align: center;
    margin-bottom: 32px;
  }

  &__empty-logo {
    font-size: 48px;
    color: @brand-purple;
    margin-bottom: 12px;
  }

  &__empty-title {
    font-size: 18px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.88);
    margin: 0 0 8px 0;
  }

  &__empty-desc {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.65);
    margin: 0;
    line-height: 1.5;
  }

  &__empty-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-width: 400px;
  }

  &__empty-btn {
    width: 160px;
    --agent-primary: #722ed1;
    background: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;

    &:hover {
      border-color: var(--agent-primary);
      background: #f5efff;
      color: var(--agent-primary);
    }
  }

  &__empty-btn-icon {
    font-size: 20px;
    color: #666;
    transition: color 0.2s;
  }

  &__empty-btn:hover &__empty-btn-icon {
    color: var(--agent-primary);
  }
  }

.follow-up-suggestions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    margin-bottom: 10px;
  }

  &__icon {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.45);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
    width: fit-content;
    transition: color 0.2s;
    color: rgba(0, 0, 0, 0.65);

    &:hover {
      color: @brand-purple;

      .follow-up-suggestions__dot {
        background: @brand-purple;
      }
    }
  }

  &__dot {
    margin-top: 7px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.25);
    transition: background 0.2s;
  }

  &__text {
    font-size: 14px;
    line-height: 1.6;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.copilot-dots-loading {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 0;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6b4c9a;
    animation: dots-wave 1.4s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.16s;
    }
    &:nth-child(3) {
      animation-delay: 0.32s;
    }
  }
}

@keyframes dots-wave {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
