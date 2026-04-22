<!--
  挤压式侧边抽屉（push drawer）
  复刻自 cn-data-pilot/src/pages/data-develop/sql/components/common/push-drawer.vue
  核心机制：自身是 flex 布局的子项，宽度 0 -> width 过渡，打开时挤压兄弟节点而非覆盖。
-->
<template>
  <div :class="['push-drawer', { visible: open }]" :style="rootStyle">
    <div v-if="shouldRenderBody" class="push-drawer__header">
      <div class="push-drawer__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <CloseOutlined class="push-drawer__close" @click="emit('update:open', false)" />
    </div>
    <div v-if="shouldRenderBody" class="push-drawer__body" :style="bodyStyle">
      <slot />
    </div>
    <div v-if="shouldRenderBody && $slots.footer" class="push-drawer__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties, type PropType } from 'vue';
import { CloseOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  open: { type: Boolean, required: true },
  title: { type: String, default: '' },
  width: { type: [String, Number], default: 520 },
  destroyOnClose: { type: Boolean, default: true },
  bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const normalizedWidth = computed(() =>
  typeof props.width === 'number' ? `${props.width}px` : props.width,
);

const rootStyle = computed<CSSProperties>(() =>
  props.open ? { width: normalizedWidth.value } : {},
);

const shouldRenderBody = computed(() => (props.destroyOnClose ? props.open : true));
</script>

<style lang="less" scoped>
.push-drawer {
  width: 0;
  height: 100%;
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.25s ease;
  background: #fff;
  display: flex;
  flex-direction: column;

  &.visible {
    border-left: 1px solid rgba(5, 5, 5, 0.06);
  }
}

.push-drawer__header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fff;
}

.push-drawer__title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.push-drawer__close {
  color: #999;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  padding: 4px;

  &:hover {
    color: #333;
  }
}

.push-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  min-height: 0;
}

.push-drawer__footer {
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  flex-shrink: 0;
}
</style>
