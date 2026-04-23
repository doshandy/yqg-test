<template>
  <div class="test-page">
    <section class="test-page__hero">
      <div>
        <p class="test-page__eyebrow">测试样本管理</p>
        <h2>标签测试</h2>
        <p class="test-page__desc">维护标签测试数据，并支持批量生成测试样本，方便验证规则、人群和指标效果。</p>
      </div>
      <a-space>
        <a-button @click="handleGenerate">批量生成</a-button>
        <a-button type="primary" @click="openModal()">新建</a-button>
      </a-space>
    </section>

    <section class="test-page__stats">
      <article class="stat-card">
        <span>测试记录</span>
        <strong>{{ pagination.total || 0 }}</strong>
        <small>当前列表记录数</small>
      </article>
      <article class="stat-card">
        <span>规则编码</span>
        <strong>{{ ruleCode || '-' }}</strong>
        <small>当前检索规则</small>
      </article>
      <article class="stat-card">
        <span>批量生成数</span>
        <strong>{{ count }}</strong>
        <small>生成器默认条数</small>
      </article>
      <article class="stat-card">
        <span>种子</span>
        <strong>{{ seed }}</strong>
        <small>生成器随机种子</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>查询条件</h3>
          <p>支持按规则编码和用户 ID 查询测试数据。</p>
        </div>
      </div>
      <div class="filter-grid">
        <a-input v-model:value="ruleCode" placeholder="规则编码" allow-clear />
        <a-input v-model:value="userIdKeyword" placeholder="用户ID" allow-clear />
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="fetchData">搜索</a-button>
      </div>
    </section>

    <section class="workspace">
      <div class="panel">
      <div class="panel__header">
        <div>
          <h3>测试数据列表</h3>
          <p>支持编辑、删除，并可查看记录详情。</p>
        </div>
        <a-tag color="blue">{{ pagination.total || 0 }} 条</a-tag>
      </div>
      <div class="result-summary">
        <div>
          <span>当前规则</span>
          <strong>{{ ruleCode || '全部规则' }}</strong>
        </div>
        <div>
          <span>检索用户</span>
          <strong>{{ userIdKeyword || '全部用户' }}</strong>
        </div>
        <div>
          <span>当前记录数</span>
          <strong>{{ pagination.total || 0 }}</strong>
        </div>
      </div>
      <a-table :data-source="rows" :columns="columns" row-key="id" :pagination="pagination" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'userId'">
              <span class="wrapper-line">{{ Array.isArray(record.userId) ? record.userId.join(',') : record.userId }}</span>
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
      </div>

      <div class="panel panel--side">
        <div class="panel__header">
          <div>
            <h3>批量生成配置</h3>
            <p>用于快速生成批量测试样本。</p>
          </div>
        </div>
        <a-form layout="vertical">
          <a-form-item label="场景">
            <a-input v-model:value="scene" />
          </a-form-item>
          <a-form-item label="数量">
            <a-input-number v-model:value="count" :min="1" :max="100" style="width: 100%" />
          </a-form-item>
          <a-form-item label="Seed">
            <a-input v-model:value="seed" />
          </a-form-item>
          <a-button type="primary" block @click="handleGenerate">立即生成</a-button>
        </a-form>
      </div>
    </section>

    <a-modal v-model:open="open" :title="form.id ? '编辑测试数据' : '新建测试数据'" width="720px" @ok="handleSave">
      <a-form layout="vertical">
        <a-form-item label="规则编码"><a-input v-model:value="form.ruleCode" /></a-form-item>
        <a-form-item label="用户ID"><a-input v-model:value="userIdText" placeholder="多个ID用英文逗号分隔" /></a-form-item>
        <a-form-item label="数据类型">
          <a-select v-model:value="form.dataMockType" :options="mockTypeOptions" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="测试数据详情" width="520">
      <div v-if="currentRecord" class="detail-cards">
        <div class="detail-summary">
          <div>
            <span>规则编码</span>
            <strong>{{ currentRecord.ruleCode }}</strong>
          </div>
          <div>
            <span>记录类型</span>
            <strong>{{ currentRecord.dataMockType === 'RULE' ? '规则' : '指标' }}</strong>
          </div>
          <div>
            <span>用户数</span>
            <strong>{{ detailUserCount }}</strong>
          </div>
        </div>
        <div class="detail-card">
          <span>规则编码</span>
          <strong>{{ currentRecord.ruleCode }}</strong>
        </div>
        <div class="detail-card">
          <span>记录类型</span>
          <strong>{{ currentRecord.dataMockType === 'RULE' ? '规则' : '指标' }}</strong>
        </div>
        <div class="detail-card">
          <span>创建人</span>
          <strong>{{ currentRecord.creatorName }}</strong>
        </div>
        <div class="detail-card">
          <span>更新时间</span>
          <strong>{{ currentRecord.updateTime }}</strong>
        </div>
        <div class="detail-card detail-card--full">
          <span>用户 ID</span>
          <strong>{{ Array.isArray(currentRecord.userId) ? currentRecord.userId.join(',') : currentRecord.userId }}</strong>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi from '@/resources/tag';

const scene = ref('risk-review');
const count = ref(10);
const seed = ref('lumina');
const ruleCode = ref('');
const userIdKeyword = ref('');
const rows = ref<Array<Record<string, unknown>>>([]);
const open = ref(false);
const detailOpen = ref(false);
const currentRecord = ref<any>(null);
const userIdText = ref('');
const pagination = reactive<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0, showSizeChanger: true });
const detailUserCount = computed(() => {
  if (!currentRecord.value) return 0;
  if (Array.isArray(currentRecord.value.userId)) return currentRecord.value.userId.length;
  return String(currentRecord.value.userId || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean).length;
});
const mockTypeOptions = [
  { label: '规则', value: 'RULE' },
  { label: '指标', value: 'METRICS' },
];
const form = reactive<any>({
  ruleCode: '',
  dataMockType: 'RULE',
});
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 150 },
  { title: '规则编码', dataIndex: 'ruleCode', key: 'ruleCode', width: 140 },
  { title: '用户ID', key: 'userId' },
  { title: '创建人', dataIndex: 'creatorName', key: 'creatorName', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 168 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 168 },
  { title: '操作', key: 'op', width: 180, fixed: 'right' },
];

async function handleGenerate() {
  const generated = await TagApi.generateTestData({
    scene: scene.value,
    count: Number(count.value),
    seed: seed.value,
  });
  rows.value = generated;
  pagination.total = generated.length;
  message.success(`已生成 ${generated.length} 条测试数据`);
}

async function fetchData() {
  const res = await TagApi.fetchTestData({
    ruleCode: ruleCode.value || undefined,
    userId: userIdKeyword.value || undefined,
    pageNo: pagination.current,
    pageSize: pagination.pageSize,
  });
  rows.value = res.items;
  pagination.total = res.total;
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function handleReset() {
  ruleCode.value = '';
  userIdKeyword.value = '';
  pagination.current = 1;
  fetchData();
}

function openModal(record?: any) {
  form.id = record?.id;
  form.ruleCode = record?.ruleCode || '';
  form.dataMockType = record?.dataMockType || 'RULE';
  userIdText.value = Array.isArray(record?.userId) ? record.userId.join(',') : record?.userId || '';
  open.value = true;
}

function showDetail(record: any) {
  currentRecord.value = record;
  detailOpen.value = true;
}

async function handleSave() {
  await TagApi.saveTestData({
    ...form,
    userId: userIdText.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  });
  open.value = false;
  message.success(form.id ? '测试数据已更新' : '测试数据已创建');
  fetchData();
}

async function handleDelete(id: string) {
  await TagApi.deleteTestData(id);
  message.success('测试数据已删除');
  fetchData();
}

fetchData();
</script>

<style lang="less" scoped>
.test-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.14), transparent 24%),
    linear-gradient(180deg, #fffaf5 0%, #fdf1e6 100%);
}

.test-page__hero,
.panel,
.stat-card,
.detail-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.test-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.test-page__eyebrow {
  margin: 0 0 8px;
  color: #ea580c;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.test-page__hero h2,
.panel__header h3 {
  margin: 0;
}

.test-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.test-page__stats {
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
  grid-template-columns: 1fr 1fr auto auto;
  gap: 12px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.result-summary > div,
.detail-summary > div {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: linear-gradient(180deg, #fff9f5 0%, #fff3eb 100%);
  padding: 16px 18px;
}

.result-summary span,
.detail-summary span {
  color: #667085;
  font-size: 12px;
}

.result-summary strong,
.detail-summary strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 16px;
}

.panel--side {
  height: fit-content;
}

.wrapper-line {
  white-space: normal;
  word-break: break-all;
}

.detail-cards {
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
  padding: 18px;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
}

.detail-card--full {
  grid-column: 1 / -1;
}

@media (max-width: 960px) {
  .test-page {
    padding: 16px;
  }

  .test-page__hero,
  .test-page__stats,
  .workspace,
  .filter-grid,
  .result-summary,
  .detail-summary,
  .detail-cards {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
