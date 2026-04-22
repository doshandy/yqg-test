<!--
 * Copilot 头部：Logo + 操作按钮
-->
<template>
  <header class="copilot-header">
    <div class="copilot-header__left">
      <ThunderboltOutlined class="copilot-header__logo-icon" />
      <span class="copilot-header__title">DataPilot Copilot</span>
    </div>
    <div class="copilot-header__actions">
      <Button type="text" class="copilot-header__btn" @click="emit('newChat')">
        <PlusOutlined />
      </Button>
      <Button type="text" class="copilot-header__btn" @click="emit('close')">
        <CloseOutlined />
      </Button>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { Button } from 'ant-design-vue';
import {
  ThunderboltOutlined,
  PlusOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue';

const emit = defineEmits<{
  newChat: [];
  close: [];
}>();
</script>

<style lang="less" scoped>
@header-height: 44px;
@brand-purple: #6b4c9a;
@border-color: rgba(0, 0, 0, 0.06);
@text-primary: rgba(0, 0, 0, 0.88);
@text-secondary: rgba(0, 0, 0, 0.45);

.copilot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: @header-height;
  padding: 0 16px;
  border-bottom: 1px solid @border-color;
  flex-shrink: 0;

  &__left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  &__logo-icon {
    font-size: 18px;
    color: @brand-purple;
  }

  &__title {
    font-size: 15px;
    font-weight: 500;
    color: @text-primary;
  }

  &__actions {
    display: inline-flex;
    align-items: center;
    gap: 0;
  }

  &__btn {
    color: @text-secondary;
    width: 32px;
    height: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: @text-primary;
    }
  }
}
</style>
