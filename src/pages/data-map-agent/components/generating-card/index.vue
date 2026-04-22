<!--
 * AI 生成中卡片：展示流式生成的文案（GENERATING 阶段）
-->
<template>
  <div v-if="content" class="copilot-card copilot-card--generating">
    <div class="copilot-card__inner">
      <div class="copilot-generating">
        <div class="copilot-generating__body">
          <div class="markdown-body" v-html="markdownContent" v-if="markdownContent !== ''" @click="onMarkdownClick"></div>
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

function onMarkdownClick(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest('.code-copy-btn') as HTMLButtonElement | null;
  if (!btn) return;
  const wrapper = btn.closest('.code-block-wrapper');
  const code = wrapper?.querySelector('pre code')?.textContent || '';
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '已复制';
    setTimeout(() => { btn.textContent = '复制'; }, 2000);
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    btn.textContent = '已复制';
    setTimeout(() => { btn.textContent = '复制'; }, 2000);
  });
}
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
  background: #fff;
  border-radius: 8px;
  overflow: visible;
  border: 1px solid @border-color;
}

.copilot-generating__body {
  padding: 8px 14px;
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
  font-size: 14px;
  color: @text-primary;
  line-height: 1.6;
  word-break: break-word;
}

:deep(.markdown-body .code-block-wrapper) {
  position: relative;
  margin: 8px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f6f8fa;
}

:deep(.markdown-body .code-block-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: #e8ecf0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

:deep(.markdown-body .code-block-lang) {
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
}

:deep(.markdown-body .code-copy-btn) {
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1.4;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.88);
  }
}

:deep(.markdown-body pre) {
  overflow-x: auto;
  padding: 12px;
  background: #f0f3f6;
  border-radius: 0;
  margin: 0;
}

:deep(.markdown-body code) {
  word-break: break-word;
}

:deep(.markdown-body img) {
  max-width: 100%;
}

:deep(.markdown-body .table-wrapper) {
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

:deep(.markdown-body table) {
  display: table;
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
  font-size: 13px;
}

:deep(.markdown-body th),
:deep(.markdown-body td) {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  max-width: 320px;
  word-break: break-word;
}

:deep(.markdown-body th:last-child),
:deep(.markdown-body td:last-child) {
  border-right: none;
}

:deep(.markdown-body tr:last-child td) {
  border-bottom: none;
}

:deep(.markdown-body th) {
  background: #f3f4f6;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.72);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

:deep(.markdown-body tbody tr) {
  transition: background 0.15s;
}

:deep(.markdown-body tbody tr:hover) {
  background: #f9fafb;
}

:deep(.markdown-body tbody tr:nth-child(even)) {
  background: #fafbfc;
}

:deep(.markdown-body tbody tr:nth-child(even):hover) {
  background: #f3f4f6;
}
</style>
