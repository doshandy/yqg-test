<template>
  <div class="ops-page">
    <section class="ops-page__hero">
      <div>
        <p class="ops-page__eyebrow">标签运行分析</p>
        <h2>标签运维</h2>
        <p class="ops-page__desc">按库表视角查看标签体系运行情况，支持执行记录、分区视图和结果导出。</p>
      </div>
      <a-button :disabled="!overview" @click="handleExport">导出当前视图</a-button>
    </section>

    <section class="ops-page__filters panel">
      <div class="panel__header">
        <div>
          <h3>筛选条件</h3>
          <p>选择库表后自动加载运维概览和分区数据。</p>
        </div>
      </div>
      <div class="filter-grid">
        <a-select v-model:value="dbName" :options="dbOptions" placeholder="库名" @change="handleDbChange" />
        <a-select v-model:value="tableNames" :options="tableOptions" mode="multiple" placeholder="表名" />
        <a-input v-model:value="keyword" allow-clear placeholder="搜索编码/名称/负责人" />
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="handleSearch">搜索</a-button>
      </div>
    </section>

    <section v-if="overview" class="ops-page__stats">
      <article class="stat-card">
        <span>有效指标</span>
        <strong>{{ overview.validMetricsCount }}</strong>
        <small>当前库表内可用指标数</small>
      </article>
      <article class="stat-card">
        <span>已生效标签</span>
        <strong>{{ overview.validTagsCount }}</strong>
        <small>已启用标签数量</small>
      </article>
      <article class="stat-card">
        <span>有效人群</span>
        <strong>{{ overview.validGroupsCount }}</strong>
        <small>当前可下发人群数</small>
      </article>
      <article class="stat-card">
        <span>启用定时任务</span>
        <strong>{{ overview.validTimingJobsCount }}</strong>
        <small>正在运行的定时任务</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>分区视图</h3>
          <p>切换不同运维分区查看前置任务、指标、标签、人群和执行记录。</p>
        </div>
      </div>
      <div class="table-summary">
        <div>
          <span>当前分区</span>
          <strong>{{ tabLabelMap[activeTab] }}</strong>
        </div>
        <div>
          <span>当前库表</span>
          <strong>{{ currentTableSummary }}</strong>
        </div>
        <div>
          <span>结果记录数</span>
          <strong>{{ pagination.total || 0 }}</strong>
        </div>
      </div>
      <a-tabs v-model:activeKey="activeTab" @change="loadSection">
        <a-tab-pane key="preTask" tab="前置任务" />
        <a-tab-pane key="metric" tab="指标" />
        <a-tab-pane key="tag" tab="标签" />
        <a-tab-pane key="group" tab="人群" />
        <a-tab-pane key="timing" tab="定时推送" />
        <a-tab-pane key="execRecord" tab="执行记录" />
      </a-tabs>
      <a-table
        :data-source="records"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :scroll="{ x: 1240 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'code'">
            <a-button type="link" @click="showDetail(record)">{{ record.code }}</a-button>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'name'">
            <div class="record-cell">
              <strong>{{ record.name }}</strong>
              <small>{{ record.owner }}</small>
            </div>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal v-model:open="exportOpen" title="导出内容" :footer="null" width="760px">
      <a-alert type="info" show-icon message="已生成当前运维视图导出内容，可直接查看结果预览。" style="margin-bottom: 16px" />
      <a-descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
        <a-descriptions-item label="当前分区">{{ activeTab }}</a-descriptions-item>
        <a-descriptions-item label="记录数">{{ pagination.total || 0 }}</a-descriptions-item>
      </a-descriptions>
      <pre class="export-preview">{{ exportText }}</pre>
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="运维详情" width="620">
      <div v-if="currentRecord" class="detail-layout">
        <div class="detail-summary">
          <div>
            <span>所属分区</span>
            <strong>{{ tabLabelMap[activeTab] }}</strong>
          </div>
          <div>
            <span>当前状态</span>
            <strong>{{ statusLabel(currentRecord.status) }}</strong>
          </div>
          <div>
            <span>最后更新时间</span>
            <strong>{{ currentRecord.updateTime }}</strong>
          </div>
        </div>
        <div class="detail-card">
          <span>编码</span>
          <strong>{{ currentRecord.code }}</strong>
        </div>
        <div class="detail-card">
          <span>名称</span>
          <strong>{{ currentRecord.name }}</strong>
        </div>
        <div class="detail-card">
          <span>状态</span>
          <strong>{{ statusLabel(currentRecord.status) }}</strong>
        </div>
        <div class="detail-card">
          <span>负责人</span>
          <strong>{{ currentRecord.owner }}</strong>
        </div>
        <div class="detail-card detail-card--full">
          <span>扩展信息</span>
          <strong>{{ currentRecord.extra || '-' }}</strong>
        </div>
        <div class="detail-card detail-card--full">
          <span>更新时间</span>
          <strong>{{ currentRecord.updateTime }}</strong>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type TagOpsExecRecord, type TagOpsOverview, type TagOpsSectionItem } from '@/resources/tag';

const dbName = ref<string>();
const tableNames = ref<string[]>([]);
const keyword = ref('');
const dbOptions = ref<Array<{ label: string; value: string }>>([]);
const tableOptions = ref<Array<{ label: string; value: string }>>([]);
const overview = ref<TagOpsOverview | null>(null);
const activeTab = ref<'preTask' | 'metric' | 'tag' | 'group' | 'timing' | 'execRecord'>('preTask');
const loading = ref(false);
const records = ref<Array<TagOpsSectionItem | TagOpsExecRecord>>([]);
const exportOpen = ref(false);
const exportText = ref('');
const detailOpen = ref(false);
const currentRecord = ref<any>(null);
const pagination = reactive<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0, showSizeChanger: true });
const tabLabelMap = {
  preTask: '前置任务',
  metric: '指标',
  tag: '标签',
  group: '人群',
  timing: '定时推送',
  execRecord: '执行记录',
} as const;
const currentTableSummary = computed(() =>
  dbName.value && tableNames.value.length
    ? `${dbName.value}.${tableNames.value[0]}${tableNames.value.length > 1 ? ` +${tableNames.value.length - 1}` : ''}`
    : '-',
);
const columns = computed(() => {
  if (activeTab.value === 'execRecord') {
    return [
      { title: '执行号', dataIndex: 'code', key: 'code', width: 180 },
      { title: '对象名称', dataIndex: 'name', key: 'name', width: 180 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
      { title: '对象编码', dataIndex: 'owner', key: 'owner', width: 180 },
      { title: '耗时', dataIndex: 'extra', key: 'extra', width: 120 },
      { title: '执行时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
    ];
  }
  return [
    { title: '编码', dataIndex: 'code', key: 'code', width: 180 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
    { title: '负责人', dataIndex: 'owner', key: 'owner', width: 140 },
    { title: activeTab.value === 'preTask' ? '任务来源' : '扩展信息', dataIndex: 'extra', key: 'extra', width: 200 },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  ];
});

async function loadSection() {
  loading.value = true;
  try {
    if (activeTab.value === 'execRecord') {
      const res = await TagApi.fetchTagOpsExecRecords({
        pageNo: pagination.current,
        pageSize: pagination.pageSize,
      });
      records.value = res.items.map((item) => ({
        id: item.id,
        code: item.executeNo,
        name: item.targetName,
        status: item.status,
        owner: item.targetCode,
        extra: item.duration,
        updateTime: item.executeTime,
      }));
      pagination.total = res.total;
      return;
    }
    const res = await TagApi.fetchTagOpsSection(activeTab.value, {
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
      keyword: keyword.value || undefined,
    });
    records.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

async function handleDbChange(next: string) {
  tableNames.value = [];
  tableOptions.value = (await TagApi.fetchTagOpsTables(next)).map((item) => ({ label: item, value: item }));
  tableNames.value = tableOptions.value.slice(0, 2).map((item) => item.value);
}

async function handleSearch() {
  if (!dbName.value || !tableNames.value.length) return;
  overview.value = await TagApi.fetchTagOpsOverview(dbName.value, tableNames.value);
  pagination.current = 1;
  loadSection();
}

function handleReset() {
  keyword.value = '';
  if (dbOptions.value.length) {
    void bootstrapDefaultData();
    return;
  }
  dbName.value = undefined;
  tableNames.value = [];
  tableOptions.value = [];
  overview.value = null;
  records.value = [];
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  loadSection();
}

async function handleExport() {
  if (!dbName.value) return;
  const file = await TagApi.exportTagOps({ dbName: dbName.value, tableNames: tableNames.value });
  exportText.value = [`库名: ${dbName.value}`, `表名: ${tableNames.value.join(', ')}`, '', file.content].join('\n');
  exportOpen.value = true;
}

function statusLabel(status?: string) {
  return {
    ENABLE: '启用',
    DISABLE: '停用',
    SUCCESS: '成功',
    FAILED: '失败',
    RUNNING: '运行中',
    WAITING: '等待中',
  }[status || ''] || status || '-';
}

function statusColor(status?: string) {
  return {
    ENABLE: 'green',
    SUCCESS: 'green',
    RUNNING: 'blue',
    WAITING: 'gold',
    DISABLE: 'default',
    FAILED: 'red',
  }[status || ''] || 'default';
}

function showDetail(record: any) {
  currentRecord.value = record;
  detailOpen.value = true;
}

async function bootstrapDefaultData() {
  if (!dbOptions.value.length) return;
  dbName.value = dbOptions.value[0].value;
  tableOptions.value = (await TagApi.fetchTagOpsTables(dbName.value)).map((item) => ({ label: item, value: item }));
  tableNames.value = tableOptions.value.slice(0, 2).map((item) => item.value);
  overview.value = await TagApi.fetchTagOpsOverview(dbName.value, tableNames.value);
  pagination.current = 1;
  await loadSection();
}

onMounted(async () => {
  dbOptions.value = (await TagApi.fetchTagOpsDbs()).map((item) => ({ label: item, value: item }));
  await bootstrapDefaultData();
});
</script>

<style lang="less" scoped>
.ops-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.12), transparent 24%),
    linear-gradient(180deg, #f5fcfb 0%, #eaf8f5 100%);
}

.ops-page__hero,
.panel,
.stat-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.ops-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.ops-page__eyebrow {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.export-preview {
  margin: 0;
  overflow: auto;
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 14px;
  background: #f8fafc;
  padding: 14px 16px;
  color: #334155;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.ops-page__hero h2,
.panel__header h3 {
  margin: 0;
}

.ops-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.panel {
  margin-bottom: 20px;
  padding: 20px;
}

.panel__header {
  margin-bottom: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 180px 280px 220px auto auto;
  gap: 12px;
}

.ops-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
}

.stat-card span {
  color: #667085;
  font-size: 13px;
}

.stat-card strong {
  color: #101828;
  font-size: 28px;
}

.record-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  small {
    color: #667085;
  }
}

.table-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.table-summary > div,
.detail-summary > div {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: linear-gradient(180deg, #f6fbfa 0%, #edf8f4 100%);
  padding: 16px 18px;
}

.table-summary span,
.detail-summary span {
  color: #667085;
  font-size: 12px;
}

.table-summary strong,
.detail-summary strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 16px;
}

.detail-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-summary {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 16px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: #fff;

  span {
    display: block;
    color: #667085;
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    color: #101828;
  }
}

.detail-card--full {
  grid-column: 1 / -1;
}

@media (max-width: 960px) {
  .ops-page {
    padding: 16px;
  }

  .ops-page__hero,
  .ops-page__stats,
  .filter-grid,
  .table-summary,
  .detail-layout,
  .detail-summary {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
