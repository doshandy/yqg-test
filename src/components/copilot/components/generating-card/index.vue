<!--
 * AI 生成中卡片：展示流式生成的文案（GENERATING 阶段）
-->
<template>
  <div v-if="content" class="copilot-card copilot-card--generating">
    <div class="copilot-card__inner">
      <div class="copilot-generating">
        <div class="copilot-generating__body">
          <div v-if="markdownContent !== ''" class="markdown-body" v-html="markdownContent"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    content?: string;
    markdownContent?: string;
  }>(),
  {
    content: '',
    markdownContent: '',
  }
);
</script>

<style lang="less" scoped>
@brand-purple: #6b4c9a;
@border-color: rgba(0, 0, 0, 0.06);
@text-primary: rgba(0, 0, 0, 0.88);

.copilot-card--generating {
  flex: 1;
  min-width: 0;

  .copilot-card__inner {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }
}

.copilot-generating {
  background: #fafafa;
  border-radius: 8px;
  overflow: visible;
  border: 1px solid @border-color;
  max-width: 560px;
}

.copilot-generating__body {
  padding: 0px 14px;
}

.copilot-generating__text {
  vertical-align: top;
}

@keyframes copilot-generating-blink {
  50% {
    opacity: 0;
  }
}

.markdown-body {
  font-size: 12px;
  color: @text-primary;
  line-height: 1.6;
  word-break: break-word;
}

/* 👇 关键 */
:deep(.markdown-body pre) {
  overflow-x: auto;
  padding: 12px;
  background: #f6f8fa;
  border-radius: 6px;
}

:deep(.markdown-body code) {
  word-break: break-word;
}

:deep(.markdown-body img) {
  max-width: 100%;
}

:deep(.markdown-body table) {
  display: block;
  overflow-x: auto;
}
</style>
