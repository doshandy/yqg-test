<!--
 * 意图澄清卡片 - 对话中用于让用户选择数据源等
-->
<template>
  <div class="copilot-card copilot-card--clarify">
    <div class="copilot-card__box">
        <div class="copilot-card__header">
          <QuestionCircleOutlined class="copilot-card__header-icon" />
          <span class="copilot-card__title">{{ title }}</span>
        </div>
        <div class="copilot-card__body">
          <div class="copilot-card__desc">{{ message }}</div>
          <!-- 有选中的 -->
          <template v-if="recommendedOptions.length > 0">
            <div class="copilot-card__options">
              <div
                v-for="opt in recommendedOptions"
                :key="opt.value"
                class="copilot-card__option is-selected"
              >
                <span class="copilot-card__option-selected-label">已选择:</span>
                <template v-if="clarifyType === 'TABLE_DISAMBIGUATION'">
                  <TableOutlined class="copilot-card__option-icon" />
                </template>
                <template v-else-if="clarifyType === 'INTENT_AMBIGUOUS'">
                  <DatabaseOutlined class="copilot-card__option-icon" />
                </template>
                <div class="copilot-card__option-text">
                  <Tooltip :title="getOptionTooltip(opt)" placement="topLeft">
                    <div class="copilot-card__option-text-inner">
                      <span class="copilot-card__option-label">{{ opt.label }}</span>
                      <span v-if="opt.description" class="copilot-card__option-sublabel">{{ opt.description }}</span>
                    </div>
                  </Tooltip>
                </div>
                <CheckCircleFilled class="copilot-card__option-check" />
              </div>
            </div>
          </template>
          <!-- 没有选中的 -->
          <template v-else>
            <div v-if="options.length > 0" class="copilot-card__options">
              <div
                v-for="opt in options"
                :key="opt.value"
                class="copilot-card__option"
                @click="onOptionClick(opt)"
              >
                <template v-if="clarifyType === 'TABLE_DISAMBIGUATION'">
                  <TableOutlined class="copilot-card__option-icon" />
                </template>
                <template v-else-if="clarifyType === 'INTENT_AMBIGUOUS'">
                  <DatabaseOutlined class="copilot-card__option-icon" />
                </template>
                <div class="copilot-card__option-text">
                  <Tooltip :title="getOptionTooltip(opt)" placement="topLeft">
                    <div class="copilot-card__option-text-inner">
                      <span class="copilot-card__option-label">{{ opt.label }}</span>
                      <span v-if="opt.description" class="copilot-card__option-sublabel">{{ opt.description }}</span>
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          </template>
        </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { Tooltip } from 'ant-design-vue';
import { QuestionCircleOutlined, TableOutlined, DatabaseOutlined, CheckCircleFilled } from '@ant-design/icons-vue';
import type { ClarifyOption, IntentClarifyActionData, ClarifySelectPayload } from '../../constant';

const props = withDefaults(
  defineProps<{
    actionData: IntentClarifyActionData;
    sessionId: string;
    requestId: string;
    messageSeqNo: number | null;
  }>(),
  {
    actionData: () => ({}),
    sessionId: '',
    messageSeqNo: null,
  }
);

const emit = defineEmits<{
  select: [payload: ClarifySelectPayload];
}>();
const title = '意图澄清';
const message = computed(() => props.actionData?.message);
const options = computed<ClarifyOption[]>(() => props.actionData?.options ?? []);
const clarifyType = computed(() => props.actionData?.clarifyType);
const selectedValue = ref<string | null>(null);
const recommendedOptions = computed(() => {
  if (selectedValue.value) {
    return options.value.filter((opt) => opt.value === selectedValue.value);
  }

  return options.value.filter((opt) => opt.recommended === true);
});

const getOptionTooltip = (opt: ClarifyOption) =>
  opt.description ? `${opt.label ?? ''} ${opt.description}`.trim() : (opt.label ?? '');

const onOptionClick = (opt: ClarifyOption) => {
  selectedValue.value = opt.value ?? null;
  const ct = props.actionData?.clarifyType;

  if (ct === 'TABLE_DISAMBIGUATION' || ct === 'INTENT_AMBIGUOUS') {
    const payload: ClarifySelectPayload = {
      requestId: props.requestId,
      sessionId: props.sessionId,
      action: 'CLARIFY_SELECT',
      data: {
        selectedValue: opt.value,
        selectedLabel: opt.label,
        clarifyType: ct,
        unselectedOptions: options.value.filter((o) => o.value !== selectedValue.value),
      },
    };
    emit('select', payload);
  }
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
    padding: 10px 14px;
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

    .copilot-card__option-selected-label {
      font-size: 12px;
      color: @brand-purple;
      font-weight: 500;
      flex-shrink: 0;
    }

    .copilot-card__option-icon {
      font-size: 14px;
      color: #595959;
      flex-shrink: 0;
    }

    .copilot-card__option-text {
      flex: 1;
      min-width: 0;
    }

    .copilot-card__option-text-inner {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .copilot-card__option-label {
      font-size: 12px;
      font-weight: 500;
      color: #262626;
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
      border-color: rgba(107, 76, 154, 0.4);
      background: rgba(107, 76, 154, 0.06);
      .copilot-card__option-icon {
        color: @brand-purple;
      }
    }

    &.is-selected {
      border-color: rgba(82, 196, 26, 0.35);
      background: rgba(82, 196, 26, 0.06);
    }
  }
}
</style>
