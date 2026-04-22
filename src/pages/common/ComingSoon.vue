<!--
  @file ComingSoon.vue
  @description 占位页：路由 meta.subtitle 描述本模块未来功能。
  复刻自 cn-data-pilot / cn-data-lumina 的 coming-soon 组件。
-->

<template>
  <div class="coming-soon">
    <div class="coming-soon__card">
      <div class="coming-soon__icon">
        <RocketOutlined />
      </div>
      <h2 class="coming-soon__title">{{ title }}</h2>
      <p class="coming-soon__subtitle">{{ subtitle }}</p>
      <a-tag color="processing" class="coming-soon__tag">Coming Soon</a-tag>
      <div class="coming-soon__hint">
        该模块在原项目中包含重度依赖（Monaco / Notebook / DAG 等），单机 Demo 先不展开实现。
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { RocketOutlined } from '@ant-design/icons-vue';

const route = useRoute();

const title = computed(() => (route.meta?.title as string) ?? '敬请期待');
const subtitle = computed(() => (route.meta?.subtitle as string) ?? '功能建设中');
</script>

<style lang="less" scoped>
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);

  &__card {
    background: #fff;
    padding: 64px 80px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
    border: 1px solid rgba(99, 102, 241, 0.08);
  }

  &__icon {
    font-size: 56px;
    color: #6366f1;
    margin-bottom: 20px;
    animation: float 3s ease-in-out infinite;
  }

  &__title {
    font-size: 22px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  &__subtitle {
    color: #6b7280;
    margin-bottom: 18px;
  }

  &__tag {
    font-weight: 500;
  }

  &__hint {
    margin-top: 18px;
    color: #9ca3af;
    font-size: 12px;
    max-width: 420px;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>
