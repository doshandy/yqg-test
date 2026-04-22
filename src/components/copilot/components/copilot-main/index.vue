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
    <div ref="chatContainerRef" class="copilot-main__chat" @scroll="onChatScroll">
      <!-- 无消息时：欢迎区 + 快捷能力按钮 -->
      <div v-if="messages.length === 0 && !intentTag" class="copilot-main__empty">
        <div class="copilot-main__empty-brand">
          <StarFilled class="copilot-main__empty-logo" />
          <h2 class="copilot-main__empty-title">DataPilot Copilot</h2>
          <p class="copilot-main__empty-desc">我是您的数据开发智能助手，</p>
          <p class="copilot-main__empty-desc">可以协助您进行 SparkSQL开发。</p>
        </div>
        <div class="copilot-main__empty-actions">
          <div
            v-for="item in quickIntentsList"
            :key="item.value"
            class="copilot-main__empty-btn"
            @click="emit('quickAction', { value: item.value, label: item.label })"
          >
            <component :is="getQuickIntentIcon(item.value)" class="copilot-main__empty-btn-icon" />
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
      <template v-for="msg in messages" v-else :key="msg.uniqueId">
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
                  :intent-map="intentMap"
                  :thinking="msg.thinking"
                />
                <GeneratingCard v-if="item.renderCategory === OUTPUT_CONTENT && item.content" :content="item.content" :markdown-content="item.markdownContent" />
                <DoneCard
                  v-if="item.renderCategory === INTERACTIVE_CARD"
                  :request-id="msg.requestId"
                  :session-id="msg.sessionId"
                  :message-seq-no="msg.messageSeqNo"
                  :content="item.content"
                  @clarify-select="emit('clarifySelect', $event)"
                  @associate-table="forwardAssociateTable"
                  @context-select="emit('contextSelect', $event)"
                />
              </template>
              <AiMessageFeedback
                :msg="msg"
              />
            </div>
          </div>
        </template>
      </template>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { h, ref, watch, nextTick, computed, onBeforeUnmount } from 'vue';
import type { Component, PropType  } from 'vue';
import { Avatar, Button } from 'ant-design-vue';
import {
  UserOutlined,
  StarFilled,
} from '@ant-design/icons-vue';
import type { ChatMessage, ClarifySelectPayload  } from '../../constant';
import DoneCard from '../done-card/index.vue';
import GeneratingCard from '../generating-card/index.vue';
import ThinkCard from '../think-card/index.vue';
import UserChatMsg from '../user-chat-msg/index.vue';
import { THOUGHT_CHAIN, OUTPUT_CONTENT, INTERACTIVE_CARD, USER, ASSISTANT, QUICK_INTENT_CONFIG } from '../../constant';
import AiMessageFeedback from './ai-message-feedback.vue';

const props = defineProps({
  messages: {
    type: Array as PropType<ChatMessage[]>,
    required: true,
  },
  /** 快捷意图（来自 fetchQuickIntents），用于空状态能力卡片与 ThinkCard */
  quickIntents: {
    type: Array as PropType<{ value: string; label: string }[]>,
    default: () => [],
  },
  intentMap: {
    type: Object as PropType<Record<string, string>>,
    default: () => {},
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
  loadMoreLoading: {
    type: Boolean,
    default: false,
  },
  intentTag: {
    type: String,
    default: '',
  },
  aiReplyLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  loadMore: [];
  overwriteMsg: [payload: { newContent: string; uniqueId: string; requestId?: string; sessionId?: string }];
  revertMsg: [payload: { uniqueId: string; requestId?: string; sessionId?: string }];
  quickAction: [payload: { value: string; label: string }];
  clarifySelect: [payload: ClarifySelectPayload];
  contextSelect: [value: string];
  associateTable: [payload?: { requestId?: string; sessionId?: string; source?: 'context-card' }];
  associateTapd: [];
}>();
const chatContainerRef = ref<HTMLElement | null>(null);
const shouldAutoScroll = ref(true);
const AUTO_SCROLL_THRESHOLD = 24;
/** 加载更多前置顶的 scroll 高度，用于插入历史消息后恢复视口 */
const loadMoreScrollAnchor = ref<{ scrollHeight: number; scrollTop: number } | null>(null);
/** 为 true 时禁止自动滚底（避免 prepend 历史消息后被 messages watch / MutationObserver 拉到底部） */
const preserveScrollForLoadMore = ref(false);
const LOAD_MORE_SHOW_THRESHOLD = 80;
const isNearTop = ref(false);

/** 空状态展示的快捷意图列表（与 footer / 下拉一致） */
const quickIntentsList = computed(() => props.quickIntents ?? []);

function getQuickIntentIcon(value: string): Component | undefined {
  return QUICK_INTENT_CONFIG[value]?.icon;
}

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

watch(chatContainerRef, (el) => {
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

function forwardAssociateTable(payload?: { requestId?: string; sessionId?: string; source?: 'context-card' }) {
  emit('associateTable', payload);
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
    padding: 8px 0 14px;
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
    padding: 20px 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    position: relative;

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
</style>
