<!--
 * AI 思维链路卡片组件
-->
<template>
  <div v-if="hasThinkContent || thinking" class="copilot-card copilot-card--think">
    <div class="copilot-card__inner">
        <div
          class="copilot-think copilot-think--fixed"
          :class="{ 'copilot-think--collapsed': thinkCardCollapsed }"
        >
          <div class="copilot-think__header" @click="toggleThinkCard">
            <div
              class="copilot-think__title-wrap"
              :class="{ 'copilot-think__title-wrap--thinking': thinking }"
            >
              <template v-if="thinking">
                <LoadingOutlined class="copilot-think__thinking-icon" spin />
                <span class="copilot-think__thinking-text">Agent 思考中...</span>
              </template>
              <template v-else>
                <BulbOutlined class="copilot-think__icon" />
                <span>思维链路</span>
              </template>
            </div>
            <span class="copilot-think__collapse">
              <RightOutlined v-if="thinkCardCollapsed" />
              <DownOutlined v-else />
            </span>
          </div>
          <div v-show="!thinkCardCollapsed" class="copilot-think__body">
            <template v-for="item in thinkList" :key="item.type">
              <div v-if="item.type === 'INTENT_RECOGNITION'" class="copilot-think__section">
                <div class="copilot-think__section-title">意图识别</div>
                <div v-if="item.intent" class="copilot-think__pill">{{ intentMap[item.intent] ?? item.intent }}</div>
              </div>
              <div v-if="item.type === 'EXECUTION_STEP'" class="copilot-think__section">
                <div class="copilot-think__section-title">执行步骤</div>
                <div
                  v-for="step in item.steps"
                  :key="step.index"
                  class="copilot-think__step"
                >
                  <LoadingOutlined
                    v-if="step.status === 'running'"
                    class="copilot-think__step-icon copilot-think__step-icon--running"
                    spin
                  />
                  <CheckCircleOutlined
                    v-else
                    class="copilot-think__step-icon copilot-think__step-icon--success"
                  />
                  <span>{{ step.text }}</span>
                </div>
              </div>
              <div v-if="item.type === 'CONTEXT_READ'" class="copilot-think__section">
                <div class="copilot-think__section-title">上下文读取</div>
                <div v-for="(contextRead, idx) in item.contextReads" :key="`ctx-${(contextRead as { name?: string })?.name}-${idx}`" class="copilot-think__step">
                  <FileSearchOutlined class="copilot-think__step-icon copilot-think__step-icon--primary" />
                  <span>{{ (contextRead as { name?: string })?.name }}</span>
                </div>
              </div>
              <div v-if="item.type === 'THOUGHT_DETAIL'" class="copilot-think__section">
                <div class="copilot-think__section-title">思考详情</div>
                <ThoughtDetail :thought="item.thought" />
              </div>
            </template>
          </div>
        </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import {
  BulbOutlined,
  DownOutlined,
  RightOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue';
import ThoughtDetail from './ThoughtDetail.vue';

/** THINKING content 单项（与 initAiMessage 一致） */
type ThinkingContentItem =
  | { type: 'INTENT_RECOGNITION'; intent: string }
  | { type: 'EXECUTION_STEP'; steps: { index?: number; status?: string; text?: string; durationMs?: number | null; toolName?: string | null; toolInput?: unknown; toolOutput?: unknown }[] }
  | { type: 'CONTEXT_READ'; contextReads: unknown[] }
  | { type: 'THOUGHT_DETAIL'; thought: string };

const props = withDefaults(
  defineProps<{
    bubbleContent?: ThinkingContentItem[] | string;
    thinking?: boolean;
    intentMap?: Record<string, string>;
  }>(),
  {
    bubbleContent: () => [],
    thinking: false,
    intentMap: () => ({}),
  }
);

const thinkCardCollapsed = ref(true);

/** 思考中展开；结束后默认收起，可点击标题再展开 */
watch(
  () => props.thinking,
  (thinking) => {
    if (thinking) {
      thinkCardCollapsed.value = false;
    } else {
      thinkCardCollapsed.value = true;
    }
  },
  { immediate: true }
);

const thinkList = computed(() =>
  Array.isArray(props.bubbleContent) ? props.bubbleContent : []
);

/** 意图识别、执行步骤、上下文读取、思考详情 任一有值时才展示思维链路卡片 */
const hasThinkContent = computed(() => {
  const list = thinkList.value;
  if (!list.length) return false;

  return list.some((item) => {
    if (item.type === 'INTENT_RECOGNITION') return !!item.intent;
    if (item.type === 'EXECUTION_STEP') return Array.isArray(item.steps) && item.steps.length > 0;
    if (item.type === 'CONTEXT_READ') return Array.isArray(item.contextReads) && item.contextReads.length > 0;
    if (item.type === 'THOUGHT_DETAIL') return !!item.thought?.trim();

    return false;
  });
});

const toggleThinkCard = () => {
  thinkCardCollapsed.value = !thinkCardCollapsed.value;
};

</script>

<style lang="less" scoped>
@brand-purple: #6b4c9a;
@border-color: rgba(0, 0, 0, 0.06);
@text-primary: rgba(0, 0, 0, 0.88);
@text-secondary: rgba(0, 0, 0, 0.45);

.copilot-card--think {
  flex: 1;
  min-width: 0;

  .copilot-card__inner {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .copilot-think {
    background: #fafafa;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid @border-color;

    &--fixed {
      max-width: 560px;
    }

    &--collapsed {
      background: transparent;
      border: none;
      border-radius: 14px;
      .copilot-think__header {
        border-radius: 14px;
      }
    }
  }

  .copilot-think__header {
    padding: 8px 12px;
    background: var(--agent-bg-light, #f5f3ff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: #4338ca;
    gap: 8px;
  }

  .copilot-think__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;

    &--thinking {
      .copilot-think__thinking-icon,
      .copilot-think__thinking-text {
        color: #1677ff;
      }
    }
  }

  .copilot-think__thinking-icon {
    font-size: 14px;
  }

  .copilot-think__thinking-text {
    font-weight: 500;
  }

  .copilot-think__icon {
    font-size: 14px;
  }

  .copilot-think__collapse {
    font-size: 10px;
    opacity: 0.7;
    display: inline-flex;
  }

  .copilot-think__body {
    padding: 12px;
  }

  .copilot-think__section {
    margin-bottom: 12px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  .copilot-think__section-title {
    font-size: 10px;
    color: rgb(153, 153, 153);
    margin-bottom: 4px;
  }

  .copilot-think__pill {
    font-size: 12px;
    color: rgb(67, 56, 202);
    background: rgb(224, 231, 255);
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
  }

  .copilot-think__step {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: @text-primary;
    margin-bottom: 4px;
    min-width: 0;
    &:last-child {
      margin-bottom: 0;
    }
    > span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .copilot-think__step-icon {
    flex-shrink: 0;
    font-size: 14px;
    &--success {
      color: rgb(16, 185, 129);
    }
    &--running {
      color: @brand-purple;
    }
    &--primary {
      color: @brand-purple;
    }
  }

  .copilot-think__cot {
    font-size: 12px;
    color: #a5b4fc;
    background: #2d3748;
    padding: 10px 12px;
    border-radius: 4px;
    line-height: 1.6;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  :deep(.copilot-think__cot.markdown-body pre) {
    overflow-x: auto;
    padding: 12px;
    background: #1e2a3a;
    border-radius: 6px;
  }

  :deep(.copilot-think__cot.markdown-body code) {
    word-break: break-word;
    color: #a5b4fc;
    text-shadow: none;
  }

  :deep(.copilot-think__cot.markdown-body img) {
    max-width: 100%;
  }

  :deep(.copilot-think__cot.markdown-body table) {
    display: block;
    overflow-x: auto;
  }

  .copilot-card__bubble {
    font-size: 14px;
    color: @text-primary;
    line-height: 1.6;
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .copilot-card__bubble-text {
    margin: 0;
    white-space: pre-line;
  }
}
</style>
