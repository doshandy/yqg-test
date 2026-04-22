<!--
 * 缺少必要的上下文卡片 - 引导用户关联数据表
-->
<template>
  <div class="copilot-card copilot-card--missing">
    <div class="copilot-card__box">
        <div class="copilot-card__header">
          <InfoCircleOutlined class="copilot-card__header-icon" />
          <span class="copilot-card__title">{{ title }}</span>
        </div>
        <div class="copilot-card__body">
          <div class="copilot-card__desc">{{ message }}</div>
        </div>
        <div class="copilot-card__actions">
          <Button class="copilot-card__btn copilot-card__btn--secondary" @click="emit('associateTable', 'context-card')">
            <template #icon><TableOutlined /></template>
            <span class="copilot-card__btn-text">关联数据表</span>
          </Button>
        </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { InfoCircleOutlined, TableOutlined } from '@ant-design/icons-vue';
import { Button } from 'ant-design-vue';

withDefaults(
  defineProps<{
    title?: string;
    message?: string;
  }>(),
  {
    title: '缺少必要的上下文',
    message:
      '您的问题较为模糊,且系统未能自动检索到相关的数据源。为了生成准确的代码,请协助补充信息:',
  }
);

const emit = defineEmits<{
  /** source: 'context-card' 表示来自上下文补充卡片内的按钮 */
  associateTable: [source: 'context-card'];
}>();
</script>

<style lang="less" scoped>
@brand-purple: #6b4c9a;
@text-primary: rgba(0, 0, 0, 0.88);
@text-secondary: rgba(0, 0, 0, 0.45);

.copilot-card--missing {
  flex: 1;
  min-width: 0;

  .copilot-card__box {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: #fafafa;
    border: 1px solid #91caff;
    border-radius: 10px;
    overflow: hidden;
  }

  .copilot-card__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .copilot-card__header-icon {
    font-size: 14px;
    color: #1677ff;
  }

  .copilot-card__title {
    font-size: 14px;
    font-weight: 600;
    color: #1677ff;
  }

  .copilot-card__body {
    // padding: 0 14px 14px;
  }

  .copilot-card__desc {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
  }

  .copilot-card__actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .copilot-card__btn {
    height: 24px;
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
    border-radius: 6px;
    // padding: 4px 12px;

    .copilot-card__btn-text {
      font-size: 12px;
      margin: 0px;
    }

    &--primary {
      border: 1px solid #1677ff;
      color: #1677ff;
      background: #fff;
      &:hover {
        border-color: #4096ff;
        color: #4096ff;
        background: #e6f4ff;
      }
    }

    &--secondary {
      border: 1px solid #d9d9d9;
      color: @text-secondary;
      background: #fff;
      &:hover {
        border-color: #4096ff;
        color: #4096ff;
      }
    }
  }
}
</style>
