<!--
 * Copilot 底部输入区：对齐 MapAgent InputArea 风格
 * 悬浮在底部 + 渐变背景 + 快捷意图按钮 + 免责声明
-->
<template>
  <div class="copilot-input-area">
    <div class="copilot-input-area__container">
      <!-- 输入框 -->
      <div class="copilot-input-area__box">
        <div style="padding: 14px;">
          <Textarea
            :value="inputValue"
            class="copilot-input-area__textarea"
            :auto-size="{ minRows: 1, maxRows: 5 }"
            :placeholder="
              aiReplyLoading
                ? 'AI 正在回复中，请稍候...'
                : createSessionLoading
                  ? '正在创建会话，请稍候...'
                  : (placeholder || '继续追问，或输入 @ 提及表名...')
            "
            :bordered="false"
            :disabled="aiReplyLoading"
            @update:value="onInputUpdate"
            @keydown="onKeydown"
          />
        </div>
        
        <div class="copilot-input-area__actions">
          <div class="copilot-input-area__actions-left">
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
              <button type="button" class="copilot-input-area__quick-btn">
                <span class="copilot-input-area__at-symbol">@</span>
              </button>
            </Popover>

            <template v-if="showQuickActions !== false">
              <span class="copilot-input-area__divider" />

              <button type="button" class="copilot-input-area__quick-btn" @click="onFillInput('找表 ')">
                <SearchOutlined class="copilot-input-area__quick-icon" />
                找表
              </button>
              <button type="button" class="copilot-input-area__quick-btn" @click="onFillInput('看详情 @')">
                <TableOutlined class="copilot-input-area__quick-icon" />
                看详情
              </button>
              <button type="button" class="copilot-input-area__quick-btn" @click="onFillInput('查血缘 @')">
                <NodeIndexOutlined class="copilot-input-area__quick-icon" />
                查血缘
              </button>
            </template>
          </div>

          <div class="copilot-input-area__actions-right">
            <Tooltip v-if="aiReplyLoading" title="停止生成" placement="top">
              <div class="copilot-input-area__send-btn copilot-input-area__send-btn--stop" @click="emit('stop')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </div>
            </Tooltip>
            <Tooltip v-else-if="createSessionLoading" title="正在创建会话" placement="top">
              <div
                class="copilot-input-area__send-btn copilot-input-area__send-btn--loading"
                aria-disabled="true"
              >
                <Spin :indicator="loadingIndicator" />
              </div>
            </Tooltip>
            <div
              v-else
              class="copilot-input-area__send-btn"
              :class="{ 'copilot-input-area__send-btn--active': inputValue?.trim() }"
              @click="inputValue?.trim() && emit('send')"
            >
              <svg viewBox="0 0 1024 1024" width="18" height="18" fill="currentColor"><path d="M233.984 489.472l131.072 92.672c13.824 9.728 32.768 8.192 44.544-3.584l188.416-188.416c9.728-9.728 26.112-9.728 35.84 0 9.728 9.728 9.728 26.112 0 35.84L445.44 614.4c-11.776 11.776-13.824 30.72-3.584 44.544l92.672 131.072c32.768 46.592 104.448 35.84 122.368-18.432l158.208-475.136c17.92-54.272-33.792-105.984-88.064-88.064l-474.624 158.72c-54.272 17.92-64.512 89.6-18.432 122.368z" /></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 免责声明 -->
      <div class="copilot-input-area__disclaimer">
        DataPilot 生成内容仅供参考，请以实际数据为准
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, h } from 'vue';
import { Popover, Tooltip, Textarea, Spin } from 'ant-design-vue';
import {
  FileTextOutlined,
  TableOutlined,
  CloseOutlined,
  SearchOutlined,
  NodeIndexOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue';

const loadingIndicator = h(LoadingOutlined, { style: 'font-size: 16px; color: #6b4c9a' });
const props = withDefaults(
  defineProps<{
    inputValue: string;
    aiReplyLoading?: boolean;
    /** 创建会话中：发送按钮置灰且不可点（与 AI 流式回复的 loading 区分，不展示停止按钮） */
    createSessionLoading?: boolean;
    placeholder?: string;
    showQuickActions?: boolean;
  }>(),
  {
    createSessionLoading: false,
  },
);

const inputValue = computed(() => props.inputValue ?? '');

const emit = defineEmits<{
  'update:inputValue': [value: string];
  send: [];
  stop: [];
  atSelect: [type: 'table' | 'tapd', payload?: { source?: 'footer' }];
}>();

const atPopoverOpen = ref(false);

const onAtSelect = (type: 'table' | 'tapd') => {
  atPopoverOpen.value = false;
  emit('atSelect', type, { source: 'footer' });
};

const onFillInput = (text: string) => {
  emit('update:inputValue', text);
};

let justSent = false;

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  if (props.aiReplyLoading || props.createSessionLoading) return;
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
  const prev = props.inputValue || '';
  if (val.length === prev.length + 1 && val.endsWith('@') && !prev.endsWith('@')) {
    emit('update:inputValue', val.slice(0, -1));
    onAtSelect('table');
    return;
  }
  emit('update:inputValue', val);
}
</script>

<style lang="less" scoped>
@brand-purple: rgba(108, 76, 155, 1);
@brand-purple-light: rgba(108, 76, 155, 0.08);
@brand-purple-hover: rgba(108, 76, 155, 0.2);

.copilot-input-area {
  background: linear-gradient(to top, #fafafa 60%, transparent);
  padding: 0px 24px 24px;
  z-index: 10;
  pointer-events: none;

  &__container {
    max-width: 780px;
    margin: 0 auto;
    pointer-events: auto;
  }

  &__context {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
    max-height: 72px;
    overflow-y: auto;
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    cursor: default;
    transition: all 0.2s;

    &.CODE_SNIPPET {
      background: rgba(138, 99, 210, 0.12);
      color: #6b4c9a;
    }
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
    max-width: 280px;
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

  &__box {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #d9d9d9;
    padding: 8px;
    background: #fff;
    transition: all 0.3s;

    &:focus-within {
      border-color: @brand-purple;
      box-shadow: 0 0 0 2px rgba(108, 76, 155, 0.15);
    }
  }

  &__textarea {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0px !important;
    font-size: 14px !important;
    width: 100%;

    :deep(.ant-input),
    :deep(textarea.ant-input) {
      background: transparent !important;
      border: none;
      font-size: 14px;
      padding: 6px 8px !important;
      resize: none;
      color: #334155;
      max-height: 210px !important;
      &::placeholder {
        color: #94a3b8;
      }
    }
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px 4px;
    margin-top: 4px;
  }

  &__actions-left {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__divider {
    display: inline-block;
    width: 1px;
    height: 14px;
    background: #e2e8f0;
    margin: 0 4px;
  }

  &__quick-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 32px;
    padding: 0 12px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: @brand-purple;
      background: @brand-purple-light;
    }
  }

  &__at-symbol {
    font-weight: 700;
    font-size: 15px;
    line-height: 1;
  }

  &__quick-icon {
    font-size: 13px;
    opacity: 0.8;
  }

  &__actions-right {
    display: flex;
    align-items: center;
  }

  &__send-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: not-allowed;
    color: #cbd5e1;
    background: transparent;
    transition: all 0.3s;

    &--active {
      cursor: pointer;
      color: @brand-purple;
      background: rgba(108, 76, 155, 0.1);

      &:hover {
        color: #fff;
        background: @brand-purple;
      }
    }

    &--stop {
      cursor: pointer;
      color: #64748b;
      background: #fff;
      border: 1px solid #e2e8f0;
      &:hover {
        background: #f8fafc;
        color: #334155;
      }
    }

    &--disabled {
      cursor: not-allowed;
      color: #cbd5e1;
      background: #f1f5f9;
      pointer-events: none;
    }

    &--loading {
      cursor: default;
      background: rgba(108, 76, 155, 0.06);
      pointer-events: none;
    }
  }

  &__disclaimer {
    text-align: center;
    margin-top: 12px;
    font-size: 12px;
    font-weight: 500;
    color: #999;
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
