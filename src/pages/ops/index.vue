<template>
  <div class="ops-page">
    <!-- 筛选区 -->
    <div class="ops-filter">
      <a-form layout="vertical" :model="filter" class="filter-form">
        <div class="filter-row">
          <div class="filter-item">
            <a-form-item label="任务名称">
              <a-input v-model:value="filter.taskName" placeholder="请输入任务名称" allow-clear />
            </a-form-item>
          </div>
          <div class="filter-item">
            <a-form-item label="任务类型">
              <a-select
                v-model:value="filter.taskType"
                placeholder="请选择"
                allow-clear
                show-search
                option-filter-prop="label"
                :options="taskTypeOptions"
                style="width: 100%"
              />
            </a-form-item>
          </div>
          <div class="filter-item">
            <a-form-item label="任务状态">
              <a-select
                v-model:value="filter.taskStatus"
                placeholder="请选择"
                allow-clear
                :options="taskStatusOptions"
                style="width: 100%"
              />
            </a-form-item>
          </div>
          <div class="filter-item">
            <a-form-item label="负责人">
              <a-select
                v-model:value="filter.owner"
                placeholder="请选择"
                allow-clear
                show-search
                option-filter-prop="label"
                :options="ownerOptions"
                style="width: 100%"
              />
            </a-form-item>
          </div>
          <div class="filter-item">
            <a-form-item label="最近运行状态">
              <a-select
                v-model:value="filter.lastRunStatus"
                placeholder="请选择"
                allow-clear
                :options="lastRunStatusOptions"
                style="width: 100%"
              />
            </a-form-item>
          </div>
          <div class="filter-item filter-actions">
            <a-form-item label=" ">
              <div class="filter-actions-inner">
                <a-button @click="onReset">重置</a-button>
                <a-button type="primary" @click="onQuery">查询</a-button>
              </div>
            </a-form-item>
          </div>
        </div>
      </a-form>
    </div>

    <!-- 表格区 -->
    <div class="ops-table">
      <div class="ops-table-header">
        <div class="ops-table-header-left">
          <span>任务列表</span>
          <a-switch
            v-model:checked="filter.myResponsibility"
            checked-children="只看我负责"
            un-checked-children="全部任务"
            size="small"
            @change="onQuery"
          />
        </div>
        <div class="ops-table-header-right">
          <a-button :loading="loading" @click="fetchList">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </div>
      </div>

      <a-table
        :loading="loading"
        :columns="columns"
        :data-source="list"
        :pagination="pagination"
        :scroll="{ x: 1400 }"
        row-key="taskId"
        size="small"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'taskName'">
            <a-tooltip :title="record.taskDescription">
              <span class="ops-link">{{ record.taskName }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'taskStatus'">
            <a-tag :color="record.taskStatus === 'ONLINE' ? 'green' : 'default'">
              {{ record.taskStatus === 'ONLINE' ? '上线' : '下线' }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'lastRunStatus'">
            <a-tag :color="runStatusColor[record.lastRunStatus] ?? 'default'">
              {{ runStatusLabel[record.lastRunStatus] ?? record.lastRunStatus }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'lastRunDurationMs'">
            <span v-if="record.lastRunDurationMs">
              {{ formatDuration(record.lastRunDurationMs) }}
            </span>
            <span v-else>--</span>
          </template>
          <template v-else-if="column.dataIndex === 'operation'">
            <a-button
              type="link"
              size="small"
              :disabled="!record.taskInstanceId"
              @click="openLog(record)"
            >
              查看日志
            </a-button>
            <a-divider type="vertical" />
            <a-button type="link" size="small" @click="onRun(record)">运行</a-button>
          </template>
        </template>
      </a-table>
    </div>

    <LogModal
      v-model:open="logOpen"
      :tab-list="logTabs"
      :loading="logLoading"
      :has-more="logHasMore"
      @refresh="refreshLog"
      @load-more="loadMoreLog"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import OpsApi, { type OpsTask, type LogTab } from '@/resources/ops';
import LogModal from './components/LogModal.vue';

const columns = [
  { title: '任务 ID', dataIndex: 'taskId', width: 120, fixed: 'left' as const },
  { title: '任务名称', dataIndex: 'taskName', width: 220, fixed: 'left' as const, ellipsis: true },
  { title: '任务类型', dataIndex: 'taskType', width: 140 },
  { title: '任务状态', dataIndex: 'taskStatus', width: 90 },
  { title: '负责人', dataIndex: 'owner', width: 100 },
  { title: '发布日期', dataIndex: 'releaseDate', width: 110 },
  { title: '调度周期', dataIndex: 'scheduleCycle', width: 90 },
  { title: '最近调度批次', dataIndex: 'lastScheduleBatch', width: 130 },
  { title: '最近运行状态', dataIndex: 'lastRunStatus', width: 110 },
  { title: '运行开始', dataIndex: 'lastRunStartTime', width: 170 },
  { title: '运行耗时', dataIndex: 'lastRunDurationMs', width: 100 },
  { title: '操作', dataIndex: 'operation', width: 160, fixed: 'right' as const },
];

const taskStatusOptions = [
  { label: '上线', value: 'ONLINE' },
  { label: '下线', value: 'OFFLINE' },
];
const lastRunStatusOptions = [
  { label: '成功', value: 'SUCCESS' },
  { label: '运行中', value: 'RUNNING' },
  { label: '失败', value: 'FAILED' },
  { label: '排队', value: 'PENDING' },
  { label: '未运行', value: 'NOT_RUN' },
];
const runStatusColor: Record<string, string> = {
  SUCCESS: 'green',
  RUNNING: 'processing',
  FAILED: 'red',
  PENDING: 'gold',
  NOT_RUN: 'default',
};
const runStatusLabel: Record<string, string> = {
  SUCCESS: '成功',
  RUNNING: '运行中',
  FAILED: '失败',
  PENDING: '排队',
  NOT_RUN: '未运行',
};

const filter = reactive({
  taskName: '',
  taskType: undefined as string | undefined,
  taskStatus: undefined as string | undefined,
  owner: undefined as string | undefined,
  lastRunStatus: undefined as string | undefined,
  myResponsibility: false,
});

const loading = ref(false);
const list = ref<OpsTask[]>([]);
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true });
const taskTypeOptions = ref<Array<{ label: string; value: string }>>([]);
const ownerOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadOptions() {
  const [types, owners] = await Promise.all([OpsApi.fetchTaskTypes(), OpsApi.fetchOwners()]);
  taskTypeOptions.value = types || [];
  ownerOptions.value = owners || [];
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await OpsApi.fetchTasks({
      taskName: filter.taskName || undefined,
      taskType: filter.taskType,
      taskStatus: filter.taskStatus,
      owner: filter.owner,
      lastRunStatus: filter.lastRunStatus,
      myResponsibility: filter.myResponsibility,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res?.items ?? [];
    pagination.total = res?.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onQuery() {
  pagination.current = 1;
  fetchList();
}
function onReset() {
  Object.assign(filter, {
    taskName: '',
    taskType: undefined,
    taskStatus: undefined,
    owner: undefined,
    lastRunStatus: undefined,
    myResponsibility: false,
  });
  onQuery();
}
function onTableChange(pag: { current?: number; pageSize?: number }) {
  pagination.current = pag.current ?? 1;
  pagination.pageSize = pag.pageSize ?? 10;
  fetchList();
}

async function onRun(record: OpsTask) {
  try {
    await OpsApi.runTask({ taskId: record.taskId });
    message.success(`任务 ${record.taskName} 已提交执行`);
  } catch {
    message.error('提交失败');
  }
}

function formatDuration(ms: number) {
  if (!ms) return '--';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rest = sec % 60;
  return `${min}m ${rest}s`;
}

// --- Log Modal ---
const logOpen = ref(false);
const logLoading = ref(false);
const logHasMore = ref(false);
const logTabs = ref<Array<{ key: string; name: string; log: string; appLink?: Record<string, string> }>>([]);
const logContext = reactive({
  taskId: '',
  processInstanceId: '' as string | undefined,
  skipLineNum: 0,
});

function mapLogTabs(raw: LogTab[]): typeof logTabs.value {
  return raw.map((t, i) => ({
    key: `${i}-${t.name}`,
    name: t.name,
    log: t.log,
    appLink: t.appLink,
  }));
}

async function openLog(record: OpsTask) {
  if (!record.taskInstanceId) {
    message.warning('该任务暂无可查看的运行实例');
    return;
  }
  logContext.taskId = record.taskId;
  logContext.processInstanceId = record.processInstanceId;
  logContext.skipLineNum = 0;
  logTabs.value = [];
  logOpen.value = true;
  await fetchLog(true);
}

async function fetchLog(reset = false) {
  logLoading.value = true;
  try {
    const tabs = await OpsApi.getLogs({
      taskId: logContext.taskId,
      processInstanceId: logContext.processInstanceId,
      skipLineNum: logContext.skipLineNum,
    });
    const totalNew = tabs?.reduce((acc, t) => acc + (t.lineCount || 0), 0) ?? 0;
    if (reset) {
      logTabs.value = mapLogTabs(tabs || []);
    } else if (totalNew > 0) {
      const mapped = mapLogTabs(tabs || []);
      logTabs.value = logTabs.value.map((item) => {
        const extra = mapped.find((m) => m.name === item.name);
        return extra ? { ...item, log: item.log + extra.log, appLink: { ...(item.appLink ?? {}), ...(extra.appLink ?? {}) } } : item;
      });
    }
    logContext.skipLineNum += totalNew;
    logHasMore.value = totalNew > 0;
  } finally {
    logLoading.value = false;
  }
}

function refreshLog() {
  logContext.skipLineNum = 0;
  fetchLog(true);
}

function loadMoreLog() {
  if (!logHasMore.value || logLoading.value) return;
  fetchLog(false);
}

onMounted(() => {
  loadOptions();
  fetchList();
});
</script>

<style scoped>
.ops-page {
  padding: 16px 24px;
  height: 100%;
  overflow-y: auto;
  background: #f0f2f5;
}

.ops-filter,
.ops-table {
  background: #fff;
  border-radius: 6px;
  padding: 16px 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.ops-filter {
  margin-bottom: 12px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0 16px;
}

.filter-item {
  min-width: 0;
}

.filter-actions-inner {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ops-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ops-table-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  font-size: 14px;
}

.ops-link {
  color: #1677ff;
  cursor: pointer;
}
.ops-link:hover {
  text-decoration: underline;
}
</style>
