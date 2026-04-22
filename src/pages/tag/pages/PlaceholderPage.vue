<!-- 其他菜单的占位骨架页面 -->
<template>
  <div class="tag-page">
    <a-result
      :status="'info'"
      :title="title"
      :sub-title="subTitle"
    >
      <template #icon>
        <component :is="icon" style="font-size: 48px; color: #1677ff" />
      </template>
      <template #extra>
        <a-space>
          <a-button type="primary">{{ primaryText }}</a-button>
          <a-button>了解更多</a-button>
        </a-space>
      </template>
    </a-result>

    <a-card v-if="features.length" size="small" title="模块能力预览" style="max-width: 720px; margin: 16px auto">
      <ul class="feature-list">
        <li v-for="item in features" :key="item">
          <CheckCircleOutlined style="color: #52c41a" />
          <span>{{ item }}</span>
        </li>
      </ul>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { CheckCircleOutlined } from '@ant-design/icons-vue';

defineProps<{
  title: string;
  subTitle?: string;
  icon?: any;
  features?: string[];
  primaryText?: string;
}>();
</script>

<style lang="less" scoped>
@import './common-page.less';
.tag-page {
  padding: 48px 24px 24px;
  overflow: auto;
}
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    color: rgba(0, 0, 0, 0.85);
    & + li {
      border-top: 1px dashed rgba(5, 5, 5, 0.06);
    }
  }
}
</style>
