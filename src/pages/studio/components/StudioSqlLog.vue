<template>
  <div ref="logContainer" class="studio-sql-log">
    <pre v-if="logInfo" class="log-detail">{{ logInfo }}</pre>
    <Empty v-else :image="simpleImage" description="暂无日志" />

    <div v-if="appId" class="float-btn-wrapper">
      <Button type="link" size="small">Application ID: {{ appId }}</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, watch } from 'vue';
import { Empty, Button } from 'ant-design-vue';

interface Props {
  log?: string;
  appId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  log: '',
  appId: '',
});

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
const logContainer = ref<HTMLElement | null>(null);
const logInfo = ref(props.log);

watch(
  () => props.log,
  (v) => {
    logInfo.value = v;
    nextTick(() => {
      const el = logContainer.value;
      if (el) el.scrollTop = el.scrollHeight;
    });
  },
);
</script>

<style lang="less" scoped>
.studio-sql-log {
  position: relative;
  height: 100%;
  overflow: auto;
  // background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 12px 14px;

  .log-detail {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .float-btn-wrapper {
    position: sticky;
    bottom: 8px;
    left: 0;
    text-align: right;
    padding-right: 16px;
  }

  :deep(.ant-empty-description) {
    color: #8c8c8c;
  }
}
</style>
