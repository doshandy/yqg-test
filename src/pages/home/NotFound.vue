<!--
  @file NotFound.vue
  @description 404 页面。
-->

<template>
  <div class="not-found">
    <div class="not-found__code">404</div>
    <div class="not-found__title">你访问的页面不存在</div>
    <div class="not-found__desc">可能链接已过期，或者在 demo 中未实现。</div>
    <a-space>
      <a-button type="primary" @click="$router.push('/pilot-home')">回到首页</a-button>
      <a-button @click="$router.back()">返回上一页</a-button>
    </a-space>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="less" scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: linear-gradient(180deg, #0b1a3a 0%, #111827 100%);
  color: #fff;

  &__code {
    font-size: 120px;
    font-weight: 800;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
  }

  &__desc {
    color: rgba(255, 255, 255, 0.66);
    margin-bottom: 12px;
  }
}
</style>
