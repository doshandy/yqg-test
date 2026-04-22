<!--
  分享模式底部操作栏：全选 / 已选计数 / 取消 / 分享按钮
  样式参考 datapilot-datamap ShareActionBar
-->
<template>
  <transition name="slide-up">
    <div v-if="visible" class="share-bar-wrapper">
      <div class="share-bar">
        <div class="share-bar__left">
          <Checkbox
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            class="share-bar__checkbox"
            @change="emit('toggleAll', $event)"
          >
            <span class="share-bar__select-label">全选</span>
          </Checkbox>
          <span class="share-bar__count">已选 {{ selectedCount }} 组</span>
        </div>
        <div class="share-bar__right">
          <Button class="share-bar__cancel" @click="emit('cancel')">取消</Button>
          <Button
            type="primary"
            class="share-bar__confirm"
            :disabled="selectedCount === 0"
            @click="emit('openModal')"
          >
            分享
          </Button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { Button, Checkbox } from 'ant-design-vue';

defineProps<{
  visible: boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  selectedCount: number;
}>();

const emit = defineEmits<{
  toggleAll: [e: any];
  cancel: [];
  openModal: [];
}>();
</script>

<style lang="less" scoped>
@brand-purple: rgba(108, 76, 155, 1);

.share-bar-wrapper {
  position: fixed;
  bottom: 40px;
  z-index: 50;
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: auto;
  padding: 0 24px;
  pointer-events: none;
}

.share-bar {
  width: 100%;
  max-width: 720px;
  padding: 16px 24px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: auto;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__select-label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
  }

  &__count {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.45);
    margin-left: 4px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__cancel {
    border-radius: 8px;
    padding: 0 24px;
  }

  &__confirm {
    border-radius: 8px;
    padding: 0 24px;
    background-color: @brand-purple !important;
    border-color: @brand-purple !important;

    &:hover:not(:disabled) {
      background-color: rgba(108, 76, 155, 0.9) !important;
      border-color: rgba(108, 76, 155, 0.9) !important;
    }

    &:disabled {
      background-color: #f5f5f5 !important;
      border-color: #d9d9d9 !important;
      color: rgba(0, 0, 0, 0.25) !important;
    }
  }

  &__checkbox {
    :deep(.ant-checkbox-inner) {
      border-color: #d9d9d9;
    }
    :deep(.ant-checkbox-checked .ant-checkbox-inner) {
      background-color: @brand-purple;
      border-color: @brand-purple;
    }
    :deep(.ant-checkbox-indeterminate .ant-checkbox-inner::after) {
      background-color: @brand-purple;
    }
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
