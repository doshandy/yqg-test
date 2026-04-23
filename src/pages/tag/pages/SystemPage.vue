<template>
  <div class="system-page">
    <section class="system-page__hero">
      <div>
        <p class="system-page__eyebrow">应用接入配置</p>
        <h2>系统管理</h2>
        <p class="system-page__desc">维护下游系统的推送方式、回调地址和子应用范围，支撑标签能力对外分发与接入。</p>
      </div>
      <a-button type="primary" size="large" @click="openModal()">新建应用配置</a-button>
    </section>

    <section class="system-page__stats">
      <article class="stat-card">
        <span>应用配置数</span>
        <strong>{{ stats.total }}</strong>
        <small>当前系统总配置</small>
      </article>
      <article class="stat-card">
        <span>Kafka 推送</span>
        <strong>{{ stats.kafka }}</strong>
        <small>已走 Topic 推送的应用</small>
      </article>
      <article class="stat-card">
        <span>回调推送</span>
        <strong>{{ stats.callback }}</strong>
        <small>回调接口配置数量</small>
      </article>
      <article class="stat-card">
        <span>子系统数</span>
        <strong>{{ stats.subApps }}</strong>
        <small>已登记的子应用范围</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>系统配置清单</h3>
          <p>查看应用推送配置、回调地址和子应用范围。</p>
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
          <template v-if="column.key === 'pushType'">
            <a-tag :color="record.pushType === 'KAFKA' ? 'blue' : 'green'">{{ pushTypeMap[record.pushType] || record.pushType }}</a-tag>
          </template>
          <template v-else-if="column.key === 'topic'">{{ record.pushConf?.topic || '/' }}</template>
          <template v-else-if="column.key === 'server'">{{ record.pushConf?.server || '/' }}</template>
          <template v-else-if="column.key === 'subApps'">{{ (record.pushConf?.subAppName || []).join(', ') || '/' }}</template>
          <template v-else-if="column.key === 'callback'">
            <a-button
              v-if="record.callbackUrls?.kafkaPushCallbackUrl"
              type="link"
              class="link-button"
              @click="openPage(record.callbackUrls?.kafkaPushCallbackUrl)"
            >
              {{ record.callbackUrls?.kafkaPushCallbackUrl }}
            </a-button>
            <span v-else>/</span>
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
      :title="form.id ? '编辑系统配置' : '新建系统配置'"
      width="840px"
      @ok="handleSave"
    >
      <div class="form-layout">
        <div class="form-card">
          <h4>基础配置</h4>
          <a-form layout="vertical">
            <a-form-item label="系统名称"><a-input v-model:value="form.appName" /></a-form-item>
            <a-form-item label="推送类型"><a-select v-model:value="form.pushType" :options="pushTypeOptions" /></a-form-item>
            <a-form-item label="负责人"><a-input v-model:value="form.superintendent" /></a-form-item>
          </a-form>
        </div>
        <div class="form-card">
          <h4>推送参数</h4>
          <a-form layout="vertical">
            <a-form-item label="Topic"><a-input v-model:value="form.pushConf!.topic" /></a-form-item>
            <a-form-item label="Server"><a-input v-model:value="form.pushConf!.server" /></a-form-item>
            <a-form-item label="子系统"><a-select v-model:value="form.pushConf!.subAppName" mode="tags" /></a-form-item>
          </a-form>
        </div>
        <div class="form-card form-card--full">
          <h4>回调地址</h4>
          <a-form layout="vertical">
            <a-form-item label="Kafka 回调"><a-input v-model:value="form.callbackUrls!.kafkaPushCallbackUrl" /></a-form-item>
            <a-form-item label="SQL 回调"><a-input v-model:value="form.callbackUrls!.sqlRuleCallbackUrl" /></a-form-item>
          </a-form>
        </div>
      </div>
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="应用配置详情" width="560">
      <div v-if="currentRecord" class="detail-layout">
        <div class="detail-card detail-card--full">
          <span>应用概览</span>
          <strong>{{ currentRecord.appName }}</strong>
          <div class="detail-tags">
            <a-tag :color="currentRecord.pushType === 'KAFKA' ? 'blue' : 'green'">{{ pushTypeMap[currentRecord.pushType] || currentRecord.pushType }}</a-tag>
            <a-tag v-if="currentRecord.pushConf?.subAppName?.length" color="purple">{{ currentRecord.pushConf?.subAppName?.length }} 个子系统</a-tag>
          </div>
        </div>
        <div class="detail-card">
          <span>系统名称</span>
          <strong>{{ currentRecord.appName }}</strong>
        </div>
        <div class="detail-card">
          <span>推送类型</span>
          <strong>{{ pushTypeMap[currentRecord.pushType] || currentRecord.pushType }}</strong>
        </div>
        <div class="detail-card">
          <span>负责人</span>
          <strong>{{ currentRecord.superintendent }}</strong>
        </div>
        <div class="detail-card">
          <span>更新时间</span>
          <strong>{{ currentRecord.updateTime }}</strong>
        </div>
        <div class="detail-block">
          <h4>推送配置</h4>
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="Topic">{{ currentRecord.pushConf?.topic || '/' }}</a-descriptions-item>
            <a-descriptions-item label="Server">{{ currentRecord.pushConf?.server || '/' }}</a-descriptions-item>
            <a-descriptions-item label="子系统范围">{{ (currentRecord.pushConf?.subAppName || []).join(', ') || '/' }}</a-descriptions-item>
          </a-descriptions>
        </div>
        <div class="detail-block">
          <h4>回调地址</h4>
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="Kafka 回调">
              <a-button
                v-if="currentRecord.callbackUrls?.kafkaPushCallbackUrl"
                type="link"
                class="link-button"
                @click="openPage(currentRecord.callbackUrls?.kafkaPushCallbackUrl)"
              >
                {{ currentRecord.callbackUrls?.kafkaPushCallbackUrl }}
              </a-button>
              <span v-else>/</span>
            </a-descriptions-item>
            <a-descriptions-item label="SQL 回调">
              <a-button
                v-if="currentRecord.callbackUrls?.sqlRuleCallbackUrl"
                type="link"
                class="link-button"
                @click="openPage(currentRecord.callbackUrls?.sqlRuleCallbackUrl)"
              >
                {{ currentRecord.callbackUrls?.sqlRuleCallbackUrl }}
              </a-button>
              <span v-else>/</span>
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type SystemAppItem } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';

const loading = ref(false);
const open = ref(false);
const detailOpen = ref(false);
const list = ref<SystemAppItem[]>([]);
const enums = ref<Record<string, any>>({});
const currentRecord = ref<SystemAppItem | null>(null);
const pushTypeOptions = computed(() => (enums.value.pushTypes || []) as Array<{ label: string; value: string }>);
const pushTypeMap = computed<Record<string, string>>(() => Object.fromEntries(pushTypeOptions.value.map((item) => [item.value, item.label])));
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
});
const columns = [
  { title: '系统名称', dataIndex: 'appName', key: 'appName', width: 120 },
  { title: '推送类型', dataIndex: 'pushType', key: 'pushType', width: 110 },
  { title: 'Topic', key: 'topic', width: 140 },
  { title: 'Server', key: 'server', width: 160 },
  { title: '子系统', key: 'subApps' },
  { title: '负责人', dataIndex: 'superintendent', key: 'superintendent', width: 100 },
  { title: '回调地址', key: 'callback', width: 220 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 168 },
  { title: '操作', key: 'op', width: 180, fixed: 'right' },
];
const form = reactive<Partial<SystemAppItem>>({
  appName: '',
  pushType: 'KAFKA',
  superintendent: 'demo_user',
  pushConf: { topic: '', server: '', subAppName: [] },
  callbackUrls: { kafkaPushCallbackUrl: '', sqlRuleCallbackUrl: '' },
});

const stats = computed(() => ({
  total: list.value.length,
  kafka: list.value.filter((item) => item.pushType === 'KAFKA').length,
  callback: list.value.filter((item) => item.pushType === 'CALLBACK').length,
  subApps: list.value.reduce((sum, item) => sum + (item.pushConf?.subAppName?.length || 0), 0),
}));

function resetForm() {
  Object.assign(form, {
    id: undefined,
    appName: '',
    pushType: 'KAFKA',
    superintendent: 'demo_user',
    pushConf: { topic: '', server: '', subAppName: [] },
    callbackUrls: { kafkaPushCallbackUrl: '', sqlRuleCallbackUrl: '' },
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchSystemApps({
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function openModal(record?: SystemAppItem) {
  resetForm();
  if (record) Object.assign(form, safeClone(record));
  open.value = true;
}

function showDetail(record: SystemAppItem) {
  currentRecord.value = record;
  detailOpen.value = true;
}

function openPage(url?: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function handleSave() {
  await TagApi.saveSystemApp(form);
  open.value = false;
  message.success(form.id ? '系统配置已更新' : '系统配置已创建');
  fetchData();
}

async function handleDelete(id: string) {
  await TagApi.deleteSystemApp(id);
  message.success('系统配置已删除');
  fetchData();
}

onMounted(async () => {
  enums.value = await TagApi.fetchEnums();
  fetchData();
});
</script>

<style lang="less" scoped>
.system-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 26%),
    linear-gradient(180deg, #f7fafc 0%, #edf4ff 100%);
}

.system-page__hero,
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

.system-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.system-page__eyebrow {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.system-page__hero h2,
.panel__header h3,
.form-card h4,
.detail-block h4 {
  margin: 0;
}

.system-page__desc,
.panel__header p,
.detail-block p {
  margin: 8px 0 0;
  color: #667085;
}

.system-page__stats {
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

.stat-card small {
  color: #98a2b3;
}

.panel {
  padding: 20px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #344054;
}

.link-button {
  padding-inline: 0;
  height: auto;
}

.form-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-card {
  padding: 18px;
}

.form-card--full,
.detail-block {
  grid-column: 1 / -1;
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

.detail-card span {
  color: #667085;
  font-size: 13px;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
  color: #101828;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

@media (max-width: 960px) {
  .system-page {
    padding: 16px;
  }

  .system-page__hero,
  .panel__header {
    flex-direction: column;
  }

  .system-page__stats,
  .form-layout,
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>
