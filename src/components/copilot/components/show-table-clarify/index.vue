<!--
 * 表意图澄清卡片 - 接受 actionData，用于让用户选择表/数据源等。
 * options 展示规则：若有 recommended 为 true 的项，则只展示推荐项并显示勾选样式；否则展示全部。
-->
<template>
  <div class="copilot-card copilot-card--clarify">
    <div class="copilot-card__box">
      <div class="copilot-card__header">
        <QuestionCircleOutlined class="copilot-card__header-icon" />
        <span class="copilot-card__title">表意图澄清</span>
      </div>
      <div class="copilot-card__body">
        <div class="copilot-card__desc">{{ actionData?.message ?? '' }}</div>
        <div class="copilot-card__options">
          <div
            v-for="opt in displayOptions"
            :key="opt.value"
            class="copilot-card__option"
            :class="{ 'is-selected': isSelected(opt.value) }"
            @click="onOptionClick(opt)"
          >
            <span v-if="isSelected(opt.value)" class="copilot-card__option-selected-label">已选择:</span>
            <TableOutlined class="copilot-card__option-icon" />
            <div class="copilot-card__option-text">
              <span class="copilot-card__option-label">{{ opt.label ?? opt.value }}</span>
            </div>
            <CheckCircleFilled v-if="isSelected(opt.value)" class="copilot-card__option-check" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { QuestionCircleOutlined, TableOutlined, CheckCircleFilled } from '@ant-design/icons-vue';

/** 意图澄清 option，支持 recommended 控制是否参与“只展示非推荐”的过滤 */
export interface IntentClarifyOption {
  value: string;
  label: string;
  recommended?: boolean;
}

/** 意图澄清 actionData 结构 */
export interface IntentClarifyActionData {
  clarifyType?: string;
  message?: string;
  options?: IntentClarifyOption[];
  multiSelect?: boolean;
}

const props = withDefaults(
  defineProps<{
    actionData?: IntentClarifyActionData;
  }>(),
  {
    actionData: () => ({}),
  }
);

const emit = defineEmits<{
  select: [payload: Record<string, unknown>];
}>();

const displayOptions = computed(() => {
  const list = props.actionData?.options ?? [];
  const recommended = list.filter((o) => o.recommended === true);

  return recommended.length > 0 ? recommended : list;
});

const selectedValues = ref<string[]>([]);

const recommendedValues = computed(() => {
  const list = props.actionData?.options ?? [];

  return new Set(list.filter((o) => o.recommended === true).map((o) => o.value));
});

const isSelected = (value: string) =>
  selectedValues.value.includes(value) || recommendedValues.value.has(value);

const onOptionClick = (opt: IntentClarifyOption) => {
  // 只支持单选
  selectedValues.value = [opt.value];
  const payload = {
    action: 'CLARIFY_SELECT',
    clarifyType: props.actionData?.clarifyType,
    selectedValue: opt.value,
    selectedLabel: opt.label,
  };
  emit('select', payload);
};
</script>
  
  <style lang="less" scoped>
  @brand-purple: #6b4c9a;
  @text-primary: rgba(0, 0, 0, 0.88);
  @text-secondary: rgba(0, 0, 0, 0.45);
  
  .copilot-card--clarify {
    flex: 1;
    min-width: 0;
  
    .copilot-card__box {
      flex: 1;
      min-width: 0;
      max-width: 560px;
      background: #fff;
      border: 1px solid #d8b4fe;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
  
    .copilot-card__header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
    }
  
    .copilot-card__header-icon {
      font-size: 16px;
      color: @brand-purple;
    }
  
    .copilot-card__title {
      font-size: 14px;
      font-weight: 600;
      color: @brand-purple;
    }
  
    .copilot-card__body {
      padding: 0 14px 14px;
    }
  
    .copilot-card__desc {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
      margin: 0 0 12px 0;
    }
  
    .copilot-card__options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  
    .copilot-card__option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: #fafafa;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      .copilot-card__option-selected-label {
        font-size: 12px;
        color: @text-secondary;
        flex-shrink: 0;
      }

      .copilot-card__option-icon {
        font-size: 14px;
        color: @text-secondary;
        flex-shrink: 0;
      }

      .copilot-card__option-text {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px;
        min-width: 0;
      }

      .copilot-card__option-label {
        font-size: 12px;
        color: @text-primary;
      }

      .copilot-card__option-sublabel {
        font-size: 11px;
        color: @text-secondary;
      }

      .copilot-card__option-check {
        font-size: 16px;
        color: #52c41a;
        flex-shrink: 0;
      }

      &:hover {
        border-color: rgba(138, 99, 210, 0.5);
        background: rgba(138, 99, 210, 0.08);
        .copilot-card__option-icon {
          color: @brand-purple;
        }
      }

      &.is-selected {
        border-color: rgba(82, 196, 26, 0.4);
        background: rgba(82, 196, 26, 0.06);
      }
    }
  }
  </style>
  