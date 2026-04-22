<!--
 * AI 完成阶段卡片：展示 DONE 阶段的 action 结果（SHOW_SQL_CARD、SHOW_INTENT_CLARIFY_CARD 等）
-->
<template>
  <div class="copilot-card copilot-card--done">
    <div class="copilot-card__inner">
      <template v-for="(item, idx) in doneList" :key="`${item.actionCode}-${idx}`">
        <template v-if="item.type === 'FRONTEND_ACTION'">
          <!-- 意图澄清：actionData.clarifyType / message / options(value,label) / multiSelect -->
          <div
            v-if="item.actionCode === 'SHOW_INTENT_CLARIFY_CARD'"
            class="copilot-done copilot-done--intent-clarify"
          >
            <IntentClarificationCard
              :action-data="item.actionData ?? {}"
              :session-id="props.sessionId ?? ''"
              :request-id="props.requestId ?? ''"
              :message-seq-no="props.messageSeqNo"
              @select="emit('clarifySelect', $event)"
            />
          </div>

          <!-- 权限不足：SHOW_NO_ACCESS_CARD actionData.items(tableName,type) / SHOW_PERMISSION_CARD actionData.message,tables(tableName,reason),status -->
          <div
            v-else-if="item.actionCode === 'SHOW_PERMISSION_CARD'"
            class="copilot-done copilot-done--no-access"
          >
            <ShowPermissionCard
              :action-data="item.actionData || {}"

            />
          </div>

          <!-- 缺上下文：actionData.contextType / message / options(value,label) / multiSelect -->
          <div
            v-else-if="item.actionCode === 'REQUIRE_CONTEXT'"
            class="copilot-done copilot-done--context-clarify"
          >
            <ContextClarificationCard
              :action-data="item.actionData ?? {}"
              :request-id="props.requestId"
              :session-id="props.sessionId"
              @select="onContextCardSelect"
              @associate-table="onAssociateTableFromCard"
            />
          </div>
          <div
            v-else-if="item.actionCode === 'SHOW_SQL_DIFF_CARD'"
            class="copilot-done copilot-done--sql-diff"
          >
            <SqlDiffCard
              :action-data="(item.actionData ?? {})"
            />
          </div>

          <!-- 建表/关联表澄清：actionData.clarifyType=TABLE_CLARIFY / message / options(value,label,recommended) -->
          <div
            v-else-if="item.actionCode === 'SHOW_TABLE_CLARIFY_CARD'"
            class="copilot-done copilot-done--table-clarify"
          >
            <ShowTableClarify
              :action-data="item.actionData ?? {}"
              @select="onTableClarifySelect"
            />
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import IntentClarificationCard from '../intent-clarification-card/index.vue';
import ShowPermissionCard from '../show-permission-card/index.vue';
import SqlDiffCard from '../sql-diff-card/index.vue';
import ContextClarificationCard from '../context-clarification-card/index.vue';
import ShowTableClarify from '../show-table-clarify/index.vue';
import type { ClarifySelectPayload, ClarifyOption } from '../../constant';

/** DONE 阶段 action 项 */
interface DoneActionItem {
  type?: string;
  actionCode?: string;
  actionData?: Record<string, unknown>;
}

const props = withDefaults(
  defineProps<{
    content?: unknown[];
    sessionId?: string;
    messageSeqNo?: number;
    requestId?: string;
  }>(),
  {
    content: () => [],
  }
);

const emit = defineEmits<{
  clarifySelect: [payload: ClarifySelectPayload];
  /** source: 'context-card' 来自上下文卡片按钮，与 footer @ 按钮区分 */
  associateTable: [payload?: { requestId?: string; sessionId?: string; source?: 'context-card' }];
  contextSelect: [value: string];
}>();

function onContextCardSelect(value: string) {
  if (value === 'associate_table') {
    emit('associateTable', { source: 'context-card', sessionId: props.sessionId, requestId: props.requestId });
  } else {
    emit('contextSelect', value);
  }
}

function onAssociateTableFromCard(payload?: { requestId?: string; sessionId?: string; source?: 'context-card' }) {
  emit('associateTable', payload);
}

/**
 * ShowTableClarify 发出的 payload 是轻量形状 { action, clarifyType, selectedValue, selectedLabel }。
 * 这里包装成统一的 ClarifySelectPayload，复用 copilot.vue 里的 onClarifySelect 处理链路。
 */
function onTableClarifySelect(raw: Record<string, unknown>) {
  const item = doneList.value.find((d) => d.actionCode === 'SHOW_TABLE_CLARIFY_CARD');
  const options = (item?.actionData as { options?: ClarifyOption[] } | undefined)?.options ?? [];
  const selectedValue = raw.selectedValue as string | undefined;
  const payload: ClarifySelectPayload = {
    requestId: props.requestId ?? '',
    sessionId: props.sessionId ?? '',
    action: 'CLARIFY_SELECT',
    data: {
      selectedValue,
      selectedLabel: raw.selectedLabel as string | undefined,
      clarifyType: (raw.clarifyType as string | undefined) ?? 'TABLE_CLARIFY',
      unselectedOptions: options.filter((o) => o.value !== selectedValue),
    },
  };
  emit('clarifySelect', payload);
}

const doneList = computed(() => (Array.isArray(props.content) ? props.content : []) as DoneActionItem[]);
</script>

<style lang="less" scoped>
@brand-purple: #6b4c9a;
@border-color: rgba(0, 0, 0, 0.06);
@text-primary: rgba(0, 0, 0, 0.88);
@text-secondary: rgba(0, 0, 0, 0.45);

.copilot-card--done {
  flex: 1;
  min-width: 0;

  .copilot-card__inner {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }
}

.copilot-done {
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
  // border: 1px solid @border-color;
  max-width: 560px;

  &--intent-clarify {
    padding: 0;
    overflow: visible;
  }

  &--sql-diff {
    padding: 0;
    overflow: visible;
  }

  &--sql {
    .copilot-done__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--agent-bg-light, #f5f3ff);
      font-size: 12px;
      font-weight: 600;
      color: #4338ca;
    }

    .copilot-done__title {
      flex: 1;
    }

    .copilot-done__copy {
      font-size: 12px;
      color: @text-secondary;
      padding: 0 4px;
      height: 24px;
      &:hover {
        color: @brand-purple;
      }
    }

    .copilot-done__code {
      margin: 0;
      padding: 12px 14px;
      font-size: 12px;
      line-height: 1.5;
      color: @text-primary;
      background: #fff;
      border-top: 1px solid @border-color;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-x: auto;
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
    }
  }

  &--unknown .copilot-done__raw {
    margin: 0;
    padding: 12px;
    font-size: 11px;
    color: @text-secondary;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
