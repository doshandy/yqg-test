<template>
  <div class="auth-page">
    <section class="auth-page__hero">
      <div>
        <p class="auth-page__eyebrow">系统权限配置</p>
        <h2>系统权限</h2>
        <p class="auth-page__desc">统一维护应用的标签、人群与定时任务权限，支持完整的配置与查看链路。</p>
      </div>
      <a-button type="primary" size="large" @click="openModal()">
        新建权限配置
      </a-button>
    </section>

    <section class="auth-page__stats">
      <article class="stat-card">
        <span class="stat-card__label">应用数</span>
        <strong>{{ stats.appCount }}</strong>
        <small>已配置系统权限的应用</small>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">权限串</span>
        <strong>{{ stats.authorityCount }}</strong>
        <small>标签域通用权限串总数</small>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">标签操作</span>
        <strong>{{ stats.ruleOps }}</strong>
        <small>标签权限动作覆盖数</small>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">人群操作</span>
        <strong>{{ stats.groupOps }}</strong>
        <small>人群权限动作覆盖数</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>筛选条件</h3>
          <p>按系统快速定位已有权限模板，并支持直接查看明细。</p>
        </div>
      </div>
      <div class="filter-grid">
        <a-select v-model:value="appName" :options="appOptions" allow-clear placeholder="系统名称" />
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="fetchData">搜索</a-button>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>权限清单</h3>
          <p>默认展示应用维度的标签、人群、定时任务操作权限。</p>
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
          <template v-if="column.key === 'authorities'">
            <div class="authority-lines">
              <span v-for="item in record.authorities" :key="item">{{ item }}</span>
              <span v-if="!record.authorities.length">/</span>
            </div>
          </template>
          <template v-else-if="column.key === 'rule'">
            <div class="authority-lines">
              <span v-for="item in record.rule" :key="item">{{ authMap[item] || item }}</span>
              <span v-if="!record.rule.length">/</span>
            </div>
          </template>
          <template v-else-if="column.key === 'group'">
            <div class="authority-lines">
              <span v-for="item in record.group" :key="item">{{ authMap[item] || item }}</span>
              <span v-if="!record.group.length">/</span>
            </div>
          </template>
          <template v-else-if="column.key === 'timing'">
            <div class="authority-lines">
              <span v-for="item in record.timing" :key="item">{{ authMap[item] || item }}</span>
              <span v-if="!record.timing.length">/</span>
            </div>
          </template>
          <template v-else-if="column.key === 'op'">
            <a-space>
              <a-button size="small" @click="showDetail(record)">详情</a-button>
              <a-button size="small" type="primary" @click="openModal(record)">编辑</a-button>
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
      :title="form.id ? '编辑系统权限' : '新建系统权限'"
      width="760px"
      @ok="handleSave"
    >
      <div class="form-layout">
        <div class="form-card">
          <h4>基础信息</h4>
          <a-form layout="vertical">
            <a-form-item label="系统名称">
              <a-select v-model:value="form.appName" :options="appOptions" />
            </a-form-item>
            <a-form-item label="权限串">
              <a-select v-model:value="form.authorities" mode="tags" placeholder="输入如 tag.read / tag.write" />
            </a-form-item>
          </a-form>
        </div>
        <div class="form-card">
          <h4>权限范围</h4>
          <a-form layout="vertical">
            <a-form-item label="标签权限">
              <a-select v-model:value="form.rule" mode="multiple" :options="operationOptions" />
            </a-form-item>
            <a-form-item label="人群权限">
              <a-select v-model:value="form.group" mode="multiple" :options="operationOptions" />
            </a-form-item>
            <a-form-item label="定时权限">
              <a-select v-model:value="form.timing" mode="multiple" :options="operationOptions" />
            </a-form-item>
          </a-form>
        </div>
      </div>
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="权限详情" width="540">
      <div v-if="currentRecord" class="detail-layout">
        <div class="detail-card detail-card--full">
          <span>权限概览</span>
          <strong>{{ currentRecord.appName }}</strong>
          <div class="detail-summary">
            <span>权限串 {{ currentRecord.authorities.length }} 项</span>
            <span>标签权限 {{ currentRecord.rule.length }} 项</span>
            <span>人群权限 {{ currentRecord.group.length }} 项</span>
            <span>定时权限 {{ currentRecord.timing.length }} 项</span>
          </div>
        </div>
        <div class="detail-card">
          <span>系统名称</span>
          <strong>{{ currentRecord.appName }}</strong>
        </div>
        <div class="detail-card">
          <span>创建人</span>
          <strong>{{ currentRecord.creatorName }}</strong>
        </div>
        <div class="detail-card">
          <span>创建时间</span>
          <strong>{{ currentRecord.createTime }}</strong>
        </div>
        <div class="detail-card">
          <span>更新时间</span>
          <strong>{{ currentRecord.updateTime }}</strong>
        </div>

        <div class="detail-block">
          <h4>权限串</h4>
          <div class="authority-lines">
            <span v-for="item in currentRecord.authorities" :key="item">{{ item }}</span>
            <span v-if="!currentRecord.authorities.length">/</span>
          </div>
        </div>
        <div class="detail-block">
          <h4>标签权限</h4>
          <div class="authority-lines">
            <span v-for="item in currentRecord.rule" :key="item">{{ authMap[item] || item }}</span>
            <span v-if="!currentRecord.rule.length">/</span>
          </div>
        </div>
        <div class="detail-block">
          <h4>人群权限</h4>
          <div class="authority-lines">
            <span v-for="item in currentRecord.group" :key="item">{{ authMap[item] || item }}</span>
            <span v-if="!currentRecord.group.length">/</span>
          </div>
        </div>
        <div class="detail-block">
          <h4>定时权限</h4>
          <div class="authority-lines">
            <span v-for="item in currentRecord.timing" :key="item">{{ authMap[item] || item }}</span>
            <span v-if="!currentRecord.timing.length">/</span>
          </div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type SystemAuthItem } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';

const appName = ref<string>();
const loading = ref(false);
const open = ref(false);
const detailOpen = ref(false);
const list = ref<SystemAuthItem[]>([]);
const enums = ref<Record<string, any>>({});
const currentRecord = ref<SystemAuthItem | null>(null);
const appOptions = computed(() => (enums.value.appNames || []) as Array<{ label: string; value: string }>);
const operationOptions = computed(() => (enums.value.authOperationTypes || []) as Array<{ label: string; value: string }>);
const authMap = computed<Record<string, string>>(() => Object.fromEntries(operationOptions.value.map((item) => [item.value, item.label])));
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
});
const columns = [
  { title: '系统名称', dataIndex: 'appName', key: 'appName', width: 120 },
  { title: '权限串', key: 'authorities' },
  { title: '标签权限', key: 'rule' },
  { title: '人群权限', key: 'group' },
  { title: '定时权限', key: 'timing' },
  { title: '创建人', dataIndex: 'creatorName', key: 'creatorName', width: 96 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 168 },
  { title: '操作', key: 'op', width: 180, fixed: 'right' },
];
const form = reactive<Partial<SystemAuthItem>>({
  appName: 'barrett',
  authorities: ['tag.read'],
  rule: ['READ'],
  group: ['READ'],
  timing: ['READ'],
});

const stats = computed(() => ({
  appCount: new Set(list.value.map((item) => item.appName)).size,
  authorityCount: list.value.reduce((sum, item) => sum + item.authorities.length, 0),
  ruleOps: list.value.reduce((sum, item) => sum + item.rule.length, 0),
  groupOps: list.value.reduce((sum, item) => sum + item.group.length, 0),
}));

function resetForm() {
  Object.assign(form, {
    id: undefined,
    appName: 'barrett',
    authorities: ['tag.read'],
    rule: ['READ'],
    group: ['READ'],
    timing: ['READ'],
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchSystemAuth({
      appName: appName.value,
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
  appName.value = undefined;
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function openModal(record?: SystemAuthItem) {
  resetForm();
  if (record) Object.assign(form, safeClone(record));
  open.value = true;
}

function showDetail(record: SystemAuthItem) {
  currentRecord.value = record;
  detailOpen.value = true;
}

async function handleSave() {
  await TagApi.saveSystemAuth(form);
  open.value = false;
  message.success(form.id ? '系统权限已更新' : '系统权限已创建');
  fetchData();
}

async function handleDelete(id: string) {
  await TagApi.deleteSystemAuth(id);
  message.success('系统权限已删除');
  fetchData();
}

onMounted(async () => {
  enums.value = await TagApi.fetchEnums();
  fetchData();
});
</script>

<style lang="less" scoped>
.auth-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(24, 144, 255, 0.12), transparent 28%),
    linear-gradient(180deg, #f7faff 0%, #eef3fb 100%);
}

.auth-page__hero,
.panel,
.stat-card,
.detail-card,
.detail-block,
.form-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.auth-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.auth-page__eyebrow {
  margin: 0 0 8px;
  color: #1677ff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-page__hero h2,
.panel__header h3,
.form-card h4,
.detail-block h4 {
  margin: 0;
}

.auth-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.auth-page__stats {
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

.stat-card strong {
  color: #101828;
  font-size: 28px;
}

.stat-card__label,
.detail-card span {
  color: #667085;
  font-size: 13px;
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
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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

.form-card h4 {
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
  margin-top: 6px;
  color: #101828;
  font-size: 15px;
}

.detail-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 10px;
  color: #667085;
  font-size: 12px;
}

.detail-block {
  grid-column: 1 / -1;
}

.detail-block h4 {
  margin-bottom: 12px;
}

@media (max-width: 1200px) {
  .auth-page__stats,
  .form-layout,
  .detail-layout {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .auth-page {
    padding: 16px;
  }

  .auth-page__hero,
  .panel__header {
    flex-direction: column;
  }

  .auth-page__stats,
  .form-layout,
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>
