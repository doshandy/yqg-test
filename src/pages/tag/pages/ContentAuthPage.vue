<template>
  <div class="content-page">
    <section class="content-page__hero">
      <div>
        <p class="content-page__eyebrow">内容访问控制</p>
        <h2>内容权限</h2>
        <p class="content-page__desc">按角色维护标签与人群的内容访问范围，支持组织架构维度的快速筛选、预览与编辑。</p>
      </div>
      <a-button type="primary" size="large" @click="openModal()">新建内容权限</a-button>
    </section>

    <section class="content-page__stats">
      <article class="stat-card">
        <span>角色数</span>
        <strong>{{ stats.roleCount }}</strong>
        <small>当前权限角色总数</small>
      </article>
      <article class="stat-card">
        <span>标签权限</span>
        <strong>{{ stats.ruleCount }}</strong>
        <small>标签域角色条数</small>
      </article>
      <article class="stat-card">
        <span>人群权限</span>
        <strong>{{ stats.groupCount }}</strong>
        <small>人群域角色条数</small>
      </article>
      <article class="stat-card">
        <span>组织范围</span>
        <strong>{{ stats.orgCount }}</strong>
        <small>已配置组织节点数</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>搜索条件</h3>
          <p>支持按角色、访问类型、权限类型和组织架构快速过滤。</p>
        </div>
      </div>
      <div class="filter-grid">
        <a-input v-model:value="searchForm.chidoriName" placeholder="角色名" allow-clear />
        <a-select v-model:value="searchForm.accessType" :options="accessOptions" placeholder="访问类型" allow-clear />
        <a-select v-model:value="searchForm.type" :options="typeOptions" placeholder="权限类型" allow-clear />
        <a-select
          v-model:value="searchForm.organizationId"
          :options="searchOrganizationOptions"
          placeholder="组织架构"
          allow-clear
        />
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="fetchData">搜索</a-button>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>权限角色列表</h3>
          <p>统一维护角色内容权限，并支持内容预览与授权调整。</p>
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
          <template v-if="column.key === 'accessType'">
            <a-tag :color="record.accessType === 'READ' ? 'default' : record.accessType === 'EDIT' ? 'blue' : 'gold'">
              {{ accessMap[record.accessType] || record.accessType }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="record.type === 'GROUP' ? 'purple' : 'cyan'">{{ typeMap[record.type] || record.type }}</a-tag>
          </template>
          <template v-else-if="column.key === 'organizationId'">
            <div class="authority-lines">
              <span v-for="id in record.organizationId" :key="id">{{ getOrganizationLabel(record.type, id) }}</span>
              <span v-if="!record.organizationId.length">/</span>
            </div>
          </template>
          <template v-else-if="column.key === 'op'">
            <a-space>
              <a-button size="small" @click="showDetail(record)">详情</a-button>
              <a-button type="primary" size="small" @click="openModal(record)">编辑</a-button>
              <a-popconfirm title="确认删除？" @confirm="handleDelete(record.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal
      v-model:open="open"
      :title="form.id ? '编辑内容权限' : '新建内容权限'"
      width="780px"
      @ok="handleSave"
    >
      <div class="form-layout">
        <div class="form-card">
          <h4>角色信息</h4>
          <a-form layout="vertical">
            <a-form-item label="角色名"><a-input v-model:value="form.chidoriName" /></a-form-item>
            <a-form-item label="访问类型"><a-select v-model:value="form.accessType" :options="accessOptions" /></a-form-item>
            <a-form-item label="权限类型"><a-select v-model:value="form.type" :options="typeOptions" @change="loadOrganizations" /></a-form-item>
          </a-form>
        </div>
        <div class="form-card">
          <h4>组织范围</h4>
          <a-form layout="vertical">
            <a-form-item label="组织架构">
              <a-select v-model:value="form.organizationId" mode="multiple" :options="formOrganizationOptions" />
            </a-form-item>
            <a-alert
              type="info"
              show-icon
              message="权限说明"
              description="标签权限与人群权限共用角色体系，但组织范围按权限类型分别维护。"
            />
          </a-form>
        </div>
      </div>
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="内容权限详情" width="560">
      <div v-if="currentRecord" class="detail-layout">
        <div class="detail-card detail-card--full">
          <span>权限概览</span>
          <strong>{{ currentRecord.chidoriName }}</strong>
          <div class="detail-summary">
            <a-tag :color="currentRecord.accessType === 'READ' ? 'default' : currentRecord.accessType === 'EDIT' ? 'blue' : 'gold'">
              {{ accessMap[currentRecord.accessType] || currentRecord.accessType }}
            </a-tag>
            <a-tag :color="currentRecord.type === 'GROUP' ? 'purple' : 'cyan'">
              {{ typeMap[currentRecord.type] || currentRecord.type }}
            </a-tag>
            <span>组织范围 {{ currentRecord.organizationId.length }} 项</span>
          </div>
        </div>
        <div class="detail-card">
          <span>角色名</span>
          <strong>{{ currentRecord.chidoriName }}</strong>
        </div>
        <div class="detail-card">
          <span>访问类型</span>
          <strong>{{ accessMap[currentRecord.accessType] || currentRecord.accessType }}</strong>
        </div>
        <div class="detail-card">
          <span>权限类型</span>
          <strong>{{ typeMap[currentRecord.type] || currentRecord.type }}</strong>
        </div>
        <div class="detail-card">
          <span>更新时间</span>
          <strong>{{ currentRecord.updateTime }}</strong>
        </div>
        <div class="detail-block">
          <h4>组织范围</h4>
          <div class="authority-lines">
            <span v-for="id in currentRecord.organizationId" :key="id">{{ getOrganizationLabel(currentRecord.type, id) }}</span>
            <span v-if="!currentRecord.organizationId.length">/</span>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type ContentAuthItem } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';

const enums = ref<Record<string, any>>({});
const list = ref<ContentAuthItem[]>([]);
const loading = ref(false);
const open = ref(false);
const detailOpen = ref(false);
const currentRecord = ref<ContentAuthItem | null>(null);
const ruleOrganizations = ref<Record<string, string>>({});
const groupOrganizations = ref<Record<string, string>>({});

const searchForm = reactive({
  chidoriName: '',
  accessType: undefined as string | undefined,
  type: undefined as string | undefined,
  organizationId: undefined as string | undefined,
});
const pagination = reactive<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0, showSizeChanger: true });
const accessOptions = computed(() => (enums.value.accessTypes || []) as Array<{ label: string; value: string }>);
const typeOptions = computed(() => (enums.value.backupTypes || []) as Array<{ label: string; value: string }>);
const accessMap = computed<Record<string, string>>(() => Object.fromEntries(accessOptions.value.map((item) => [item.value, item.label])));
const typeMap = computed<Record<string, string>>(() => Object.fromEntries(typeOptions.value.map((item) => [item.value, item.label])));
const searchOrganizationOptions = computed(() =>
  Object.entries(searchForm.type === 'GROUP' ? groupOrganizations.value : ruleOrganizations.value).map(([value, label]) => ({ value, label })),
);
const formOrganizationOptions = computed(() =>
  Object.entries(form.type === 'GROUP' ? groupOrganizations.value : ruleOrganizations.value).map(([value, label]) => ({ value, label })),
);
const columns = [
  { title: '角色名', dataIndex: 'chidoriName', key: 'chidoriName', width: 180 },
  { title: '访问类型', dataIndex: 'accessType', key: 'accessType', width: 110 },
  { title: '权限类型', dataIndex: 'type', key: 'type', width: 110 },
  { title: '组织架构', key: 'organizationId' },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 168 },
  { title: '操作', key: 'op', width: 180, fixed: 'right' },
];
const form = reactive<Partial<ContentAuthItem>>({
  chidoriName: '',
  accessType: 'READ',
  type: 'RULE',
  organizationId: [],
});

const stats = computed(() => ({
  roleCount: list.value.length,
  ruleCount: list.value.filter((item) => item.type === 'RULE').length,
  groupCount: list.value.filter((item) => item.type === 'GROUP').length,
  orgCount: new Set(list.value.flatMap((item) => item.organizationId)).size,
}));

async function loadOrganizations() {
  ruleOrganizations.value = await TagApi.fetchOrganizations('RULE');
  groupOrganizations.value = await TagApi.fetchOrganizations('GROUP');
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    chidoriName: '',
    accessType: 'READ',
    type: 'RULE',
    organizationId: [],
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchContentAuth({
      ...searchForm,
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
  searchForm.chidoriName = '';
  searchForm.accessType = undefined;
  searchForm.type = undefined;
  searchForm.organizationId = undefined;
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function openModal(record?: ContentAuthItem) {
  resetForm();
  if (record) Object.assign(form, safeClone(record));
  open.value = true;
}

function showDetail(record: ContentAuthItem) {
  currentRecord.value = record;
  detailOpen.value = true;
}

async function handleSave() {
  await TagApi.saveContentAuth(form);
  open.value = false;
  message.success(form.id ? '内容权限已更新' : '内容权限已创建');
  fetchData();
}

async function handleDelete(id: string) {
  await TagApi.deleteContentAuth(id);
  message.success('内容权限已删除');
  fetchData();
}

function getOrganizationLabel(type: 'RULE' | 'GROUP', id: string) {
  return (type === 'GROUP' ? groupOrganizations.value : ruleOrganizations.value)[id] || id;
}

watch(
  () => searchForm.type,
  () => {
    searchForm.organizationId = undefined;
  },
);

onMounted(async () => {
  enums.value = await TagApi.fetchEnums();
  await loadOrganizations();
  fetchData();
});
</script>

<style lang="less" scoped>
.content-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 28%),
    linear-gradient(180deg, #f7faf7 0%, #eef7f2 100%);
}

.content-page__hero,
.panel,
.stat-card,
.detail-card,
.detail-block,
.form-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.content-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.content-page__eyebrow {
  margin: 0 0 8px;
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.content-page__hero h2,
.panel__header h3,
.form-card h4,
.detail-block h4 {
  margin: 0;
}

.content-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.content-page__stats {
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

.stat-card small {
  color: #98a2b3;
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
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.authority-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #344054;
  line-height: 1.5;
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

.detail-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-card,
.detail-block {
  padding: 16px;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
}

.detail-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  margin-top: 10px;
  color: #667085;
  font-size: 12px;
}

.detail-card--full {
  grid-column: 1 / -1;
}

.detail-block {
  grid-column: 1 / -1;
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .content-page {
    padding: 16px;
  }

  .content-page__hero,
  .panel__header {
    flex-direction: column;
  }

  .content-page__stats,
  .form-layout,
  .detail-layout,
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
