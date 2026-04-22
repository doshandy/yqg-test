<template>
  <div class="task-main">
    <div class="tabs-bar">
      <div class="tab-list">
        <div
          v-for="pane in paneList"
          :key="pane.key"
          :class="['tab', { active: pane.key === activeKey }]"
          @click="activeKey = pane.key"
        >
          <FileTextOutlined class="tab-icon" />
          <span class="tab-title">{{ pane.title }}</span>
          <CloseOutlined class="tab-close" @click.stop="onClose(pane.key)" />
        </div>
      </div>
    </div>

    <div v-if="!activePane" class="empty-state">
      <a-empty description="请从左侧任务树选择或新建任务">
        <a-button type="primary" @click="emit('create')">+ 新建任务</a-button>
      </a-empty>
    </div>

    <div v-else class="pane-body">
      <div class="toolbar">
        <a-space size="small">
          <a-button type="primary" size="small" @click="onRun">
            <template #icon><CaretRightOutlined /></template>
            运行
          </a-button>
          <a-button size="small">
            <template #icon><SaveOutlined /></template>
            保存
          </a-button>
          <a-button size="small" type="dashed">
            <template #icon><CloudUploadOutlined /></template>
            提交到生产
          </a-button>
          <a-button size="small" :loading="aiLoading" @click="onAskAI">
            <template #icon><ExperimentOutlined /></template>
            AI 优化 SQL
          </a-button>
        </a-space>
      </div>

      <div class="editor-area">
        <CodeEditor v-model="activePane.content" language="sql" />
      </div>

      <div class="result-area">
        <a-tabs v-model:activeKey="resultTabKey" size="small">
          <a-tab-pane key="result" tab="运行结果">
            <div v-if="resultLoading" class="result-loading">
              <a-spin /> 正在执行 SQL...
            </div>
            <div v-else-if="result">
              <div class="result-summary">
                <span>共 <strong>{{ result.total.toLocaleString() }}</strong> 行</span>
                <span>耗时 <strong>{{ result.costMs }} ms</strong></span>
                <span>引擎 Spark 3.3</span>
              </div>
              <a-table
                :columns="result.columns"
                :data-source="result.rows"
                :pagination="{ pageSize: 8, size: 'small' }"
                size="small"
                bordered
                row-key="user_id"
                :scroll="{ y: 240 }"
              />
            </div>
            <a-empty v-else description="点击「运行」查看查询结果" style="margin-top: 40px" />
          </a-tab-pane>
          <a-tab-pane key="log" tab="运行日志">
            <pre class="log-box">{{ sampleLog }}</pre>
          </a-tab-pane>
          <a-tab-pane key="plan" tab="执行计划">
            <pre class="log-box">{{ samplePlan }}</pre>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import {
  CaretRightOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  SaveOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import CodeEditor from '@/components/CodeEditor.vue';
import DataDevelopApi, { type QueryResult } from '@/resources/data-develop';

interface Pane {
  key: string;
  title: string;
  taskId: string;
  content: string;
}

const paneList = defineModel<Pane[]>('panes', { default: () => [] });
const activeKey = defineModel<string>('activeKey', { default: '' });

const activePane = computed(() => paneList.value.find((p) => p.key === activeKey.value));

const resultTabKey = ref('result');
const result = ref<QueryResult>();
const resultLoading = ref(false);
const aiLoading = ref(false);

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'run'): void;
}>();

const onClose = (key: string) => {
  const idx = paneList.value.findIndex((p) => p.key === key);
  if (idx === -1) return;
  paneList.value.splice(idx, 1);
  if (activeKey.value === key) {
    activeKey.value = paneList.value[idx]?.key ?? paneList.value[idx - 1]?.key ?? '';
  }
};

const onRun = async () => {
  if (!activePane.value) return;
  resultLoading.value = true;
  resultTabKey.value = 'result';
  try {
    result.value = await DataDevelopApi.runQuery({ sql: activePane.value.content });
    message.success('执行完成');
  } finally {
    resultLoading.value = false;
  }
};

const onAskAI = async () => {
  aiLoading.value = true;
  setTimeout(() => {
    aiLoading.value = false;
    message.success('AI 已为你重写 SQL，逻辑等价，去除了冗余子查询（演示）');
  }, 800);
};

watch(
  () => activeKey.value,
  () => { result.value = undefined; },
);

const sampleLog = `2026-04-22 10:22:15 [INFO ] Submitting application to YARN ResourceManager
2026-04-22 10:22:16 [INFO ] ApplicationMaster host: cn-prd-node-07
2026-04-22 10:22:18 [INFO ] Using 4 executors, 8GB memory each
2026-04-22 10:22:21 [INFO ] Reading from dwd.user_event_detail partition (dt=2026-04-21)
2026-04-22 10:22:24 [INFO ] Shuffle read: 128 MB, Shuffle write: 64 MB
2026-04-22 10:22:28 [INFO ] Writing 102400 rows to ads.user_active_daily
2026-04-22 10:22:30 [INFO ] Stage completed: Stage 4 (writeToPath) finished in 2.1 s
2026-04-22 10:22:31 [INFO ] Application finished successfully.
`;

const samplePlan = `== Physical Plan ==
*(3) InsertIntoHiveTable ads.user_active_daily
+- *(3) HashAggregate(keys=[user_id, event_date], functions=[count(distinct session_id), sum(duration_ms)])
   +- Exchange hashpartitioning(user_id, event_date, 200)
      +- *(2) HashAggregate(keys=[user_id, event_date], functions=[partial_count(distinct session_id), partial_sum(duration_ms)])
         +- *(2) Filter (app_id = 'fintopia_cn')
            +- *(2) ColumnarToRow
               +- FileScan parquet dwd.user_event_detail[...] Batched: true, Location: InMemoryFileIndex, PartitionFilters: [dt = '\${bizdate}'], ReadSchema: struct<...>
`;
</script>

<style lang="less" scoped>
.task-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.tabs-bar {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  .tab-list {
    display: flex;
    overflow-x: auto;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 13px;
    background: #fafafa;
    cursor: pointer;
    border-right: 1px solid #f0f0f0;
    color: #666;
    min-width: 160px;
    max-width: 260px;

    &.active {
      background: #fff;
      color: #1677ff;
      font-weight: 500;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        left: 0; right: 0; bottom: 0;
        height: 2px;
        background: #1677ff;
      }
    }

    .tab-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tab-icon { color: #1677ff; }

    .tab-close {
      color: #999;
      font-size: 12px;

      &:hover {
        color: #ff4d4f;
      }
    }
  }
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pane-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  .right-tools :deep(.ant-btn) {
    color: #666;

    &:hover {
      color: #1677ff;
      background: #e6f4ff;
    }
  }
}

.editor-area {
  flex: 1 1 60%;
  min-height: 0;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.result-area {
  flex: 1 1 40%;
  min-height: 0;
  background: #fff;
  padding: 0 12px;
  overflow: auto;
}

.result-summary {
  display: flex;
  gap: 18px;
  padding: 6px 0 12px;
  font-size: 12px;
  color: #666;

  strong {
    color: #1677ff;
    margin: 0 2px;
  }
}

.result-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 40px;
  justify-content: center;
  color: #666;
}

.log-box {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Menlo', 'Consolas', monospace;
  max-height: 320px;
  overflow: auto;
  margin: 0;
}

</style>
