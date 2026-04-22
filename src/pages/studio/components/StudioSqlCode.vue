<template>
  <div class="studio-sql-code">
    <div class="toolbar">
      <Button size="small" @click="handleCopy">
        <template #icon><CopyOutlined /></template>
        复制
      </Button>
    </div>
    <pre class="code-block">{{ code || '-- 暂无执行的 SQL --' }}</pre>
  </div>
</template>

<script lang="ts" setup>
import { Button, message } from 'ant-design-vue';
import { CopyOutlined } from '@ant-design/icons-vue';

interface Props {
  code?: string;
}

const props = withDefaults(defineProps<Props>(), { code: '' });

const handleCopy = () => {
  if (!props.code) {
    message.warn('暂无代码');
    return;
  }
  navigator.clipboard.writeText(props.code);
  message.success('已复制');
};
</script>

<style lang="less" scoped>
.studio-sql-code {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .toolbar {
    flex-shrink: 0;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(5, 5, 5, 0.06);
    text-align: right;
  }

  .code-block {
    flex: 1;
    margin: 0;
    padding: 12px 14px;
    background: #fafafa;
    overflow: auto;
    font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
