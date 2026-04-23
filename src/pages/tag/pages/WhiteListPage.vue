<template>
  <div class="white-page">
    <section class="white-page__hero">
      <div>
        <p class="white-page__eyebrow">数据访问白名单</p>
        <h2>SQL 库表白名单</h2>
        <p class="white-page__desc">集中维护标签域依赖的库表权限，查看引用详情、影响范围和登记信息。</p>
      </div>
      <a-button type="primary" size="large" @click="openModal()">新增白名单</a-button>
    </section>

    <section class="white-page__stats">
      <article class="stat-card">
        <span>白名单条数</span>
        <strong>{{ stats.total }}</strong>
        <small>当前库表登记总数</small>
      </article>
      <article class="stat-card">
        <span>数据库数</span>
        <strong>{{ stats.dbCount }}</strong>
        <small>去重后的数据库数量</small>
      </article>
      <article class="stat-card">
        <span>引用次数</span>
        <strong>{{ stats.usedNum }}</strong>
        <small>当前页累计引用次数</small>
      </article>
      <article class="stat-card">
        <span>高频引用</span>
        <strong>{{ stats.topTable }}</strong>
        <small>当前页最高引用表</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>筛选条件</h3>
          <p>按库表名、引用类型快速筛选，并查看被标签或人群使用的范围。</p>
        </div>
      </div>
      <div class="filter-grid">
        <a-input v-model:value="dbName" placeholder="库名" allow-clear />
        <a-input v-model:value="tableName" placeholder="表名" allow-clear />
        <a-select v-model:value="usedType" :options="usedTypeOptions" placeholder="引用类型" allow-clear />
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="fetchData">搜索</a-button>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>白名单列表</h3>
          <p>支持查看引用详情，并按运维视角展示登记与使用统计。</p>
        </div>
        <a-tag color="blue">{{ pagination.total || 0 }} 条</a-tag>
      </div>
      <a-table
        :data-source="list"
        :columns="columns"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'usedType'">
            <div class="tag-list">
              <a-tag v-for="item in record.usedType" :key="item">{{ usedTypeMap[item] || item }}</a-tag>
            </div>
          </template>
          <template v-else-if="column.key === 'usedNum'">
            <a-badge :count="record.usedNum" :number-style="{ backgroundColor: record.usedNum > 12 ? '#1677ff' : '#d9d9d9' }" />
          </template>
          <template v-else-if="column.key === 'op'">
            <a-space>
              <a-button size="small" @click="showUsage(record)">引用详情</a-button>
              <a-button size="small" type="primary" @click="showPreview(record)">预览</a-button>
              <a-popconfirm title="确认删除？" @confirm="handleDelete(record)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal v-model:open="open" title="新增白名单" width="760px" @ok="handleSave">
      <div class="form-layout">
        <div class="form-card">
          <h4>库表信息</h4>
          <a-form layout="vertical">
            <a-form-item label="库名"><a-input v-model:value="form.dbName" /></a-form-item>
            <a-form-item label="表名"><a-input v-model:value="form.tableName" /></a-form-item>
            <a-form-item label="引用类型"><a-select v-model:value="form.usedType" mode="multiple" :options="usedTypeOptions" /></a-form-item>
          </a-form>
        </div>
        <div class="form-card">
          <h4>Dolphin 配置</h4>
          <a-form layout="vertical">
            <a-form-item label="Dolphin 项目"><a-input v-model:value="form.dsProjectName" /></a-form-item>
            <a-form-item label="Dolphin 工作流"><a-input v-model:value="form.dsProcessName" /></a-form-item>
            <a-alert type="info" show-icon message="登记提示" description="白名单新增后，可直接在引用详情中查看是否被标签、人群或 SQL 人群使用。" />
          </a-form>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="usageOpen" :footer="null" width="700px">
      <template #title>
        <div class="usage-title">
          <span>引用详情</span>
          <div class="usage-title__filter">
            <span>引用类型</span>
            <a-select
              v-model:value="currentUsedType"
              :options="usageTypeFilterOptions"
              :disabled="usageTypeFilterOptions.length <= 1"
              style="width: 140px"
            />
          </div>
        </div>
      </template>
      <div class="usage-header">
        <a-typography-title :level="5">{{ currentRecord?.dbName }}.{{ currentRecord?.tableName }}</a-typography-title>
        <a-typography-paragraph>{{ usageText }}</a-typography-paragraph>
      </div>
      <a-list :data-source="filteredUsageItems" size="small" bordered>
        <template #renderItem="{ item }">
          <a-list-item>
            <div class="usage-row">
              <a-tag>{{ usedTypeMap[item.type] || item.type }}</a-tag>
              <span>{{ item.code }}</span>
              <span>{{ item.name }}</span>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </a-modal>

    <a-drawer v-model:open="previewOpen" title="白名单预览" width="520">
      <div v-if="currentRecord" class="detail-layout">
        <div class="detail-card detail-card--full">
          <span>白名单概览</span>
          <strong>{{ currentRecord.dbName }}.{{ currentRecord.tableName }}</strong>
          <div class="detail-summary">
            <span>引用 {{ currentRecord.usedNum }} 次</span>
            <span>创建人 {{ currentRecord.creator }}</span>
          </div>
        </div>
        <div class="detail-card">
          <span>数据库</span>
          <strong>{{ currentRecord.dbName }}</strong>
        </div>
        <div class="detail-card">
          <span>表名</span>
          <strong>{{ currentRecord.tableName }}</strong>
        </div>
        <div class="detail-card">
          <span>项目</span>
          <strong>{{ currentRecord.dsProjectName }}</strong>
        </div>
        <div class="detail-card">
          <span>工作流</span>
          <strong>{{ currentRecord.dsProcessName }}</strong>
        </div>
        <div class="detail-card">
          <span>创建人</span>
          <strong>{{ currentRecord.creator }}</strong>
        </div>
        <div class="detail-card">
          <span>创建时间</span>
          <strong>{{ currentRecord.createTime }}</strong>
        </div>
        <div class="detail-block">
          <h4>引用类型</h4>
          <div class="tag-list">
            <a-tag v-for="item in currentRecord.usedType" :key="item">{{ usedTypeMap[item] || item }}</a-tag>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type WhiteListItem } from '@/resources/tag';

const dbName = ref('');
const tableName = ref('');
const usedType = ref<string>();
const enums = ref<Record<string, any>>({});
const list = ref<WhiteListItem[]>([]);
const loading = ref(false);
const open = ref(false);
const usageOpen = ref(false);
const previewOpen = ref(false);
const currentRecord = ref<WhiteListItem | null>(null);
const currentUsedType = ref<string>();
const usageText = ref('');
const usageItems = ref<Array<{ type: string; code: string; name: string }>>([]);
const pagination = reactive<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0, showSizeChanger: true });
const usedTypeOptions = computed(() => (enums.value.sqlWhitelistUsedTypes || []) as Array<{ label: string; value: string }>);
const usedTypeMap = computed<Record<string, string>>(() => Object.fromEntries(usedTypeOptions.value.map((item) => [item.value, item.label])));
const usageTypeFilterOptions = computed(() => {
  const base = currentRecord.value?.usedType || [];
  return base.map((value) => ({
    value,
    label: usedTypeMap.value[value] || value,
  }));
});
const filteredUsageItems = computed(() =>
  currentUsedType.value ? usageItems.value.filter((item) => item.type === currentUsedType.value) : usageItems.value,
);
const columns = [
  { title: '库名', dataIndex: 'dbName', key: 'dbName', width: 120 },
  { title: '表名', dataIndex: 'tableName', key: 'tableName', width: 200 },
  { title: 'Dolphin 项目', dataIndex: 'dsProjectName', key: 'dsProjectName', width: 140 },
  { title: 'Dolphin 工作流', dataIndex: 'dsProcessName', key: 'dsProcessName', width: 140 },
  { title: '引用类型', key: 'usedType' },
  { title: '引用次数', dataIndex: 'usedNum', key: 'usedNum', width: 100 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 96 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 168 },
  { title: '操作', key: 'op', width: 220, fixed: 'right' },
];
const form = reactive<Partial<WhiteListItem>>({
  dbName: '',
  tableName: '',
  dsProjectName: '',
  dsProcessName: '',
  usedType: [],
});

const stats = computed(() => {
  const top = [...list.value].sort((a, b) => b.usedNum - a.usedNum)[0];
  return {
    total: list.value.length,
    dbCount: new Set(list.value.map((item) => item.dbName)).size,
    usedNum: list.value.reduce((sum, item) => sum + item.usedNum, 0),
    topTable: top ? `${top.tableName} (${top.usedNum})` : '-',
  };
});

function resetForm() {
  Object.assign(form, {
    dbName: '',
    tableName: '',
    dsProjectName: '',
    dsProcessName: '',
    usedType: [],
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchWhiteList({
      dbName: dbName.value || undefined,
      tableName: tableName.value || undefined,
      usedType: usedType.value,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  dbName.value = '';
  tableName.value = '';
  usedType.value = undefined;
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function openModal() {
  resetForm();
  open.value = true;
}

async function handleSave() {
  await TagApi.saveWhiteList(form);
  open.value = false;
  message.success('白名单已创建');
  fetchData();
}

async function showUsage(record: WhiteListItem) {
  currentRecord.value = record;
  const usage = await TagApi.checkWhiteListUsage(record.dbName, record.tableName);
  usageText.value = usage.mes;
  usageItems.value = usage.items;
  currentUsedType.value = record.usedType?.[0] || usage.items[0]?.type;
  usageOpen.value = true;
}

function showPreview(record: WhiteListItem) {
  currentRecord.value = record;
  previewOpen.value = true;
}

async function handleDelete(record: WhiteListItem) {
  const usage = await TagApi.checkWhiteListUsage(record.dbName, record.tableName);
  if (usage.used) {
    currentRecord.value = record;
    usageText.value = usage.mes;
    usageItems.value = usage.items;
    currentUsedType.value = record.usedType?.[0] || usage.items[0]?.type;
    usageOpen.value = true;
    Modal.warning({
      title: '存在引用关系',
      content: usage.mes,
    });
    return;
  }
  await TagApi.deleteWhiteList(record.id);
  message.success('白名单已删除');
  fetchData();
}

onMounted(async () => {
  enums.value = await TagApi.fetchEnums();
  fetchData();
});
</script>

<style lang="less" scoped>
.white-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.16), transparent 24%),
    linear-gradient(180deg, #fffaf3 0%, #f7f4ee 100%);
}

.white-page__hero,
.panel,
.stat-card,
.form-card,
.detail-card,
.detail-block {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.white-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.white-page__eyebrow {
  margin: 0 0 8px;
  color: #b45309;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.white-page__hero h2,
.panel__header h3,
.form-card h4,
.detail-block h4 {
  margin: 0;
}

.white-page__desc,
.panel__header p,
.usage-header :deep(p) {
  margin: 8px 0 0;
  color: #667085;
}

.white-page__stats {
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

.stat-card span,
.detail-card span {
  color: #667085;
  font-size: 13px;
}

.stat-card strong {
  color: #101828;
  font-size: 28px;
}

.panel {
  margin-bottom: 20px;
  padding: 20px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.1fr 1.2fr 1fr auto auto;
  gap: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-card {
  padding: 18px;
}

.form-card h4,
.detail-block h4 {
  margin-bottom: 14px;
}

.usage-header {
  margin-bottom: 16px;
}

.usage-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.usage-title__filter {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #667085;
  font-size: 13px;
}

.usage-row {
  display: grid;
  grid-template-columns: 96px 150px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
}

.detail-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-card,
.detail-block {
  padding: 16px;
}

.detail-block {
  grid-column: 1 / -1;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
}

.detail-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 10px;
  color: #667085;
  font-size: 12px;
}

.detail-card--full {
  grid-column: 1 / -1;
}

@media (max-width: 960px) {
  .white-page {
    padding: 16px;
  }

  .white-page__hero,
  .panel__header {
    flex-direction: column;
  }

  .white-page__stats,
  .filter-grid,
  .form-layout,
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>
