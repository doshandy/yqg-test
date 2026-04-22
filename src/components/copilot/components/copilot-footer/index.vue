<!--
 * Copilot 底部输入区：上下文标签 + 输入框 + @ / 弹窗 + 发送
-->
<template>
  <footer class="copilot-footer">
    <div v-if="contextTags.length" class="copilot-footer__context">
      <div
        v-for="tag in contextTags"
        :key="tag.id"
        class="copilot-footer__tag"
        :class="tag.type"
      >
        <FileTextOutlined v-if="tag.type === 'CODE_SNIPPET'" class="copilot-footer__tag-icon" />
        <TableOutlined v-else-if="tag.type === 'TABLE'" class="copilot-footer__tag-icon" />
        <Tooltip :title="getTagLabel(tag)" placement="topLeft">
          <span class="copilot-footer__tag-label">{{ getTagLabel(tag) }}</span>
        </Tooltip>
        <CloseOutlined class="copilot-footer__tag-close" @click="emit('removeContextTag', tag.id)" />
      </div>
    </div>
    <div class="copilot-footer__input-wrap">
      <div class="copilot-footer__input-bar">
        <Textarea
          :value="inputValue"
          class="copilot-footer__input"
          :placeholder="aiReplyLoading ? 'AI 正在回复中，请稍候...' : inputPlaceholder"
          :bordered="false"
          :rows="3"
          :disabled="aiReplyLoading"
          @update:value="onInputUpdate"
          @keydown="onKeydown"
        />
      </div>
      <div class="copilot-footer__input-actions">
        <div class="copilot-footer__input-actions-left">
          <Select
            v-model:value="slashSelectValue"
            class="copilot-footer__slash-select"
            placeholder="选择意图"
            allow-clear
            :options="slashOptions"
            @change="onSlashSelectChange"
          />
          <Popover
            v-model:open="atPopoverOpen"
            trigger="click"
            placement="topLeft"
            overlay-class-name="copilot-at-popover"
          >
            <template #content>
              <div class="copilot-at-menu">
                <div class="copilot-at-menu__item" @click="onAtSelect('table')">
                  <TableOutlined class="copilot-at-menu__icon" />
                  <span>关联表</span>
                </div>
              </div>
            </template>
            <Button type="text" class="copilot-footer__action-btn">@</Button>
          </Popover>
        </div>
        <div class="copilot-footer__input-actions-right">
          <span class="copilot-footer__shortcut-hint">Enter 发送，Shift+Enter 换行</span>
          <template v-if="aiReplyLoading">
            <Tooltip title="停止生成" placement="top">
              <Button
                class="copilot-footer__send-btn copilot-footer__send-btn--stop"
                @click="emit('stop')"
              >
                <span class="copilot-footer__stop-icon" aria-hidden="true">
                  <span class="copilot-footer__stop-icon-circle">
                    <span class="copilot-footer__stop-icon-square" />
                  </span>
                </span>
              </Button>
            </Tooltip>
          </template>
          <Button
            v-else
            type="primary"
            class="copilot-footer__send-btn"
            :class="{ 'copilot-footer__send-btn--empty': !inputValue?.trim() }"
            :icon="h(ArrowUpOutlined)"
            :disabled="!inputValue?.trim()"
            @click="emit('send')"
          />
        </div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { ref, h, computed, watch } from 'vue';
import { Button, Popover, Select, Tooltip, Textarea } from 'ant-design-vue';
import {
  ArrowUpOutlined,
  FileTextOutlined,
  TableOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue';
import { type ContextTag, QUICK_INTENT_CONFIG } from '../../constant';

const props = defineProps<{
  inputValue: string;
  contextTags: ContextTag[];
  /** AI 正在回复时为 true，此时右侧按钮显示为「停止生成」 */
  aiReplyLoading?: boolean;
  /** 快捷意图（来自接口 quick-intents），用于 / 能力下拉 */
  quickIntents?: { value: string; label: string }[];
  /** 外部同步的 slash 能力 key（如从 split-button 选中后传入），会同步到本组件 Select */
  syncSlashKey?: string;
  taskName: string;
}>();

const emit = defineEmits<{
  'update:inputValue': [value: string];
  send: [];
  stop: [];
  removeContextTag: [id: string];
  atSelect: [type: 'table' | 'tapd', payload?: { source?: 'footer' }];
  slashSelect: [key: string];
}>();

const getTagLabel = (tag: ContextTag): string => {
  if (tag.type === 'TABLE') return tag.tableName;

  return tag.selection.startLine != null && tag.selection.endLine != null
    ? `${props.taskName}（${tag.selection.startLine}-${tag.selection.endLine}）`
    : tag.taskName || '代码';
};

const inputValue = computed(() => props.inputValue ?? '');

const atPopoverOpen = ref(false);

const slashOptions = computed(() => props.quickIntents ?? []);
const slashSelectValue = ref<string | undefined>(undefined);
const selectedSlashAction = computed(() =>
  slashSelectValue.value
    ? props.quickIntents?.find((i) => i.value === slashSelectValue.value) ?? null
    : null
);

watch(
  () => props.syncSlashKey,
  (key) => {
    slashSelectValue.value = key || undefined;
  },
  { immediate: true }
);

const onAtSelect = (type: 'table' | 'tapd') => {
  atPopoverOpen.value = false;
  emit('atSelect', type, {
    source: 'footer',
  });
};

const inputPlaceholder = computed(() => {
  const action = selectedSlashAction.value;
  if (!action) return '选择快捷意图指令，使用 @ 关联上下文';

  return QUICK_INTENT_CONFIG[action.value]?.placeholder ?? '输入消息，Enter 发送，Shift+Enter 换行';
});

let justSent = false;

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  if (props.aiReplyLoading) return;
  if (inputValue.value?.trim()) {
    justSent = true;
    emit('send');
    emit('update:inputValue', '');
  }
}

function onInputUpdate(val: string) {
  if (justSent) {
    justSent = false;

    return;
  }

  emit('update:inputValue', val);
}

function onSlashSelectChange(value: unknown) {
  if (typeof value === 'string' && value) {
    emit('slashSelect', value);
  }
}

</script>

<style lang="less" scoped>
@brand-purple: #722ed1;
@border-color: rgba(0, 0, 0, 0.06);
@text-primary: rgba(0, 0, 0, 0.88);
@text-secondary: rgba(0, 0, 0, 0.45);

.copilot-footer {
  flex-shrink: 0;
  padding: 16px;
  background: #fff;
  border-top: 1px solid @border-color;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__context {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 4px 4px;
    max-height: 148px;
    overflow-y: auto;
    align-content: flex-start;
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    cursor: default;
    border: 1px solid transparent;
    transition: all 0.2s;

    &.code,
    &.CODE_SNIPPET {
      background: rgba(138, 99, 210, 0.12);
      color: #6b4c9a;
    }

    &.table,
    &.TABLE {
      background: rgba(82, 196, 26, 0.12);
      color: #389e0d;
    }
  }

  &__tag-icon {
    font-size: 12px;
    flex-shrink: 0;
  }

  &__tag-label {
    max-width: 320px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
  }

  &__tag-close {
    font-size: 10px;
    opacity: 0.6;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
    }
  }

  &__input-wrap {
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 8px;
    background: #fff;
    transition: border-color 0.2s;
    position: relative;
    display: flex;
    flex-direction: column;

    &:focus-within {
      border-color: @brand-purple;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }
  }

  &__input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #f0f0f0;
  }

  &__input-actions-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    padding: 0 8px;
    border-radius: 4px;
    color: #666;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f0f0f0;
      color: #1677ff;
      border-radius: 14px;
    }
  }

  &__slash-select {
    width: 90px;
    :deep(.ant-select-selector) {
      height: 24px !important;
      min-height: 24px !important;
      padding-inline: 8px !important;
      font-size: 13px;
      align-items: center;
    }
  }

  &__input-actions-right {
    display: flex;
    align-items: center;
  }

  &__shortcut-hint {
    font-size: 11px;
    color: rgba(0, 0, 0, 0.35);
    background-color: transparent;
    margin-right: 10px;
  }

  &__send-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: @brand-purple !important;
    border-color: @brand-purple !important;

    &:hover {
      background: darken(@brand-purple, 6%) !important;
      border-color: darken(@brand-purple, 6%) !important;
    }

    &--empty {
      cursor: not-allowed;
      color: rgba(0, 0, 0, 0.25) !important;
      background: rgba(0, 0, 0, 0.04) !important;
      border-color: transparent !important;
      box-shadow: none !important;

      &:hover {
        color: rgba(0, 0, 0, 0.25) !important;
        background: rgba(0, 0, 0, 0.04) !important;
        border-color: transparent !important;
      }
    }

    &--stop {
      background: #ff4d4f !important;
      box-shadow: none !important;
      border: none !important;

      &:hover {
        background: #ff4d4f !important;
      }
    }
  }

  &__stop-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 11px;
    height: 11px;
    color: inherit;
    background: #ff4d4f;
    border: 1px solid #fff;
  }

  &__input-bar {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    width: 100%;
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 0 !important;
    background: transparent !important;
    resize: none;

    :deep(.ant-input),
    :deep(textarea.ant-input) {
      background: transparent !important;
      border: none;
      font-size: 13px;
      line-height: 32px;
      padding: 0 !important;
      resize: none;
    }
  }
}
</style>

<style lang="less">
.copilot-at-popover {
  .ant-popover-inner {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 4px 0;
  }
}

.copilot-at-menu {
  min-width: 140px;
  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.88);
    cursor: pointer;
    transition: background 0.2s;
    &:hover {
      background: #f5f5f5;
    }
  }
  &__icon {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.45);
    flex-shrink: 0;
  }
}

</style>
