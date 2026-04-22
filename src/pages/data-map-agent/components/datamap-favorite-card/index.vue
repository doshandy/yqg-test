<!--
 * 数据地图收藏卡片 - 由 SHOW_DATAMAP_FAVORITE_CARD action 触发，展示表收藏/取消收藏按钮
-->
<template>
  <button
    class="fav-btn"
    :class="{ 'is-favorited': localFavorited, 'is-disabled': readonly }"
    :disabled="readonly"
    @click="onToggle"
  >
    <span class="fav-btn__icon">
      <StarFilled v-if="localFavorited" />
      <StarOutlined v-else />
    </span>
    <span>{{ localFavorited ? '已收藏' : '收藏' }}</span>
  </button>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { StarFilled, StarOutlined } from '@ant-design/icons-vue';

export interface FavoriteActionData {
  fqn: string;
  cnName?: string;
  favorited?: boolean;
}

const props = withDefaults(
  defineProps<{
    actionData: FavoriteActionData;
    readonly?: boolean;
  }>(),
  {
    actionData: () => ({ fqn: '' }),
    readonly: false,
  }
);

const emit = defineEmits<{
  toggleFavorite: [payload: { fqn: string; favorited: boolean }];
}>();

const localFavorited = computed(() => !!props.actionData.favorited);

const onToggle = () => {
  emit('toggleFavorite', { fqn: props.actionData.fqn, favorited: !localFavorited.value });
};
</script>

<style lang="less" scoped>
.fav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;

  &:hover:not(.is-disabled) {
    border-color: rgba(108, 76, 155, 0.45);
    color: rgba(108, 76, 155, 1);
    background: rgba(108, 76, 155, 0.06);
  }

  &.is-favorited {
    border-color: #fed7aa;
    color: #c2410c;
    background: #fff7ed;
  }

  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &__icon {
    display: flex;
    line-height: 0;
    font-size: 14px;
  }

  &.is-favorited &__icon {
    color: #fb923c;
  }
}
</style>
