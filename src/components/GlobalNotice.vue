<!--
  @file GlobalNotice.vue
  @description 全局通知条：位于 Layout 顶部，受 useGlobalNoticeStore 控制。
-->

<template>
  <transition name="notice-slide">
    <div
      v-if="noticeStore.visible && noticeStore.enabled"
      class="global-notice"
      :class="`global-notice--${noticeStore.level}`"
    >
      <div class="global-notice__inner">
        <span class="global-notice__tag">{{ levelText }}</span>
        <strong class="global-notice__title">{{ noticeStore.title }}</strong>
        <span class="global-notice__content">{{ noticeStore.content }}</span>
      </div>
      <CloseOutlined class="global-notice__close" @click="noticeStore.hide" />
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { CloseOutlined } from '@ant-design/icons-vue';
import { useGlobalNoticeStore } from '@/store/global-notice';
import CommonApi from '@/resources/common';

const noticeStore = useGlobalNoticeStore();

const levelTextMap: Record<string, string> = {
  info: '通知',
  warn: '提示',
  error: '警告',
  success: '完成',
};

const levelText = computed(() => levelTextMap[noticeStore.level] ?? '通知');

onMounted(async () => {
  if (!noticeStore.enabled) return;
  const { data: { body } } = await CommonApi.fetchGlobalNotice();
  if (body?.enabled) {
    noticeStore.show({
      title: body.title,
      content: body.content,
      level: body.level,
    });
  }
});
</script>

<style lang="less" scoped>
.global-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-radius: 8px;
  margin-bottom: 12px;
  color: #fff;
  font-size: 13px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);

  &--info {
    background: linear-gradient(90deg, #1677ff, #6366f1);
  }
  &--warn {
    background: linear-gradient(90deg, #f59e0b, #f97316);
  }
  &--error {
    background: linear-gradient(90deg, #ef4444, #ec4899);
  }
  &--success {
    background: linear-gradient(90deg, #10b981, #22c55e);
  }

  &__inner {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  &__tag {
    background: rgba(255, 255, 255, 0.22);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  &__title {
    font-weight: 600;
  }

  &__content {
    opacity: 0.92;
  }

  &__close {
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}

.notice-slide-enter-active,
.notice-slide-leave-active {
  transition: all 0.3s ease;
}
.notice-slide-enter-from,
.notice-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
