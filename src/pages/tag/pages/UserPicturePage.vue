<template>
  <div class="picture-page">
    <section class="picture-page__hero">
      <div>
        <p class="picture-page__eyebrow">人群画像分析</p>
        <h2>人群画像</h2>
        <p class="picture-page__desc">管理画像分析属性，把指标和人群洞察维度绑定起来，并提供详情预览。</p>
      </div>
      <a-button type="primary" size="large" @click="openModal()">新增分析属性</a-button>
    </section>

    <section class="picture-page__stats">
      <article class="stat-card">
        <span>画像属性</span>
        <strong>{{ stats.total }}</strong>
        <small>当前分析属性总数</small>
      </article>
      <article class="stat-card">
        <span>基础维度</span>
        <strong>{{ stats.base }}</strong>
        <small>基础类画像字段</small>
      </article>
      <article class="stat-card">
        <span>行为维度</span>
        <strong>{{ stats.behavior }}</strong>
        <small>行为类画像字段</small>
      </article>
      <article class="stat-card">
        <span>价值维度</span>
        <strong>{{ stats.value }}</strong>
        <small>价值类画像字段</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>画像属性列表</h3>
          <p>维护分析属性与指标编码的映射关系。</p>
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
          <template v-if="column.key === 'dimension'">
            <a-tag color="blue">{{ dimensionMap[record.dimension] || record.dimension }}</a-tag>
          </template>
          <template v-else-if="column.key === 'metricsType'">{{ record.metrics.metricsType }}</template>
          <template v-else-if="column.key === 'metricsCode'">{{ record.metrics.metricsCode }}</template>
          <template v-else-if="column.key === 'metricsName'">{{ record.metrics.metricsName }}</template>
          <template v-else-if="column.key === 'op'">
            <a-space>
              <a-button size="small" @click="showDetail(record)">详情</a-button>
              <a-button size="small" type="primary" @click="openModal(record)">编辑</a-button>
              <a-popconfirm title="确认删除该分析属性？" @confirm="handleDelete(record.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal v-model:open="open" :title="form.id ? '编辑分析属性' : '新增分析属性'" width="760px" @ok="handleSave">
      <div class="form-layout">
        <div class="form-card">
          <h4>属性信息</h4>
          <a-form layout="vertical">
            <a-form-item label="分析属性名称"><a-input v-model:value="form.userProfileName" /></a-form-item>
            <a-form-item label="所属维度"><a-select v-model:value="form.dimension" :options="dimensionOptions" /></a-form-item>
          </a-form>
        </div>
        <div class="form-card">
          <h4>指标映射</h4>
          <a-form layout="vertical">
            <a-form-item label="指标编码">
              <a-select
                v-model:value="form.metrics!.metricsCode"
                :options="metricCodeOptions"
                :loading="metricsLoading"
                :disabled="Boolean(form.id)"
                show-search
                option-filter-prop="label"
                @change="handleMetricCodeChange"
              />
            </a-form-item>
            <a-form-item label="指标名称"><a-input v-model:value="form.metrics!.metricsName" disabled /></a-form-item>
            <a-form-item label="指标类型"><a-input :value="form.metrics!.metricsType" disabled /></a-form-item>
          </a-form>
        </div>
      </div>
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="画像属性详情" width="520">
      <div v-if="currentRecord" class="detail-layout">
        <div class="detail-card detail-card--full">
          <span>画像概览</span>
          <strong>{{ currentRecord.userProfileName }}</strong>
          <div class="detail-summary">
            <a-tag color="blue">{{ dimensionMap[currentRecord.dimension] || currentRecord.dimension }}</a-tag>
            <span>{{ currentRecord.metrics.metricsType }}</span>
          </div>
        </div>
        <div class="detail-card">
          <span>属性名称</span>
          <strong>{{ currentRecord.userProfileName }}</strong>
        </div>
        <div class="detail-card">
          <span>所属维度</span>
          <strong>{{ dimensionMap[currentRecord.dimension] || currentRecord.dimension }}</strong>
        </div>
        <div class="detail-card">
          <span>指标类型</span>
          <strong>{{ currentRecord.metrics.metricsType }}</strong>
        </div>
        <div class="detail-card">
          <span>指标编码</span>
          <strong>{{ currentRecord.metrics.metricsCode }}</strong>
        </div>
        <div class="detail-block">
          <h4>指标名称</h4>
          <p>{{ currentRecord.metrics.metricsName }}</p>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type MetricItem, type UserPictureItem } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';

const enums = ref<Record<string, any>>({});
const list = ref<UserPictureItem[]>([]);
const metricList = ref<MetricItem[]>([]);
const loading = ref(false);
const metricsLoading = ref(false);
const open = ref(false);
const detailOpen = ref(false);
const currentRecord = ref<UserPictureItem | null>(null);
const pagination = reactive<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0, showSizeChanger: true });
const dimensionOptions = computed(() => (enums.value.userProfileDimensions || []) as Array<{ label: string; value: string }>);
const dimensionMap = computed<Record<string, string>>(() => Object.fromEntries(dimensionOptions.value.map((item) => [item.value, item.label])));
const metricCodeOptions = computed(() => metricList.value.map((item) => ({ label: item.code, value: item.code })));
const columns = [
  { title: '分析属性名称', dataIndex: 'userProfileName', key: 'userProfileName', width: 180 },
  { title: '所属维度', dataIndex: 'dimension', key: 'dimension', width: 120 },
  { title: '指标类型', key: 'metricsType', width: 120 },
  { title: '指标编码', key: 'metricsCode', width: 140 },
  { title: '指标名称', key: 'metricsName' },
  { title: '操作', key: 'op', width: 180, fixed: 'right' },
];
const form = reactive<Partial<UserPictureItem>>({
  userProfileName: '',
  dimension: 'BASE',
  metrics: {
    metricsType: 'ATOMIC',
    metricsCode: '',
    metricsName: '',
  },
});

const stats = computed(() => ({
  total: list.value.length,
  base: list.value.filter((item) => item.dimension === 'BASE').length,
  behavior: list.value.filter((item) => item.dimension === 'BEHAVIOR').length,
  value: list.value.filter((item) => item.dimension === 'VALUE').length,
}));

async function fetchMetricOptions() {
  metricsLoading.value = true;
  try {
    const res = await TagApi.fetchMetrics({ pageNo: 1, pageSize: 100 });
    metricList.value = res.items;
  } finally {
    metricsLoading.value = false;
  }
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    userProfileName: '',
    dimension: 'BASE',
    metrics: {
      metricsType: 'ATOMIC',
      metricsCode: '',
      metricsName: '',
    },
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchUserPictures({
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

function handleMetricCodeChange(code?: string) {
  const matched = metricList.value.find((item) => item.code === code);
  if (!matched) return;
  form.metrics = {
    metricsCode: matched.code,
    metricsName: matched.name,
    metricsType: matched.metricsType,
  };
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function openModal(record?: UserPictureItem) {
  resetForm();
  if (record) Object.assign(form, safeClone(record));
  open.value = true;
}

function showDetail(record: UserPictureItem) {
  currentRecord.value = record;
  detailOpen.value = true;
}

async function handleSave() {
  await TagApi.saveUserPicture(form);
  open.value = false;
  message.success(form.id ? '分析属性已更新' : '分析属性已创建');
  fetchData();
}

async function handleDelete(id: string) {
  await TagApi.deleteUserPicture(id);
  message.success('分析属性已删除');
  fetchData();
}

onMounted(async () => {
  enums.value = await TagApi.fetchEnums();
  await fetchMetricOptions();
  fetchData();
});
</script>

<style lang="less" scoped>
.picture-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
}

.picture-page__hero,
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

.picture-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.picture-page__eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.picture-page__hero h2,
.panel__header h3,
.form-card h4,
.detail-block h4 {
  margin: 0;
}

.picture-page__desc,
.panel__header p,
.detail-block p {
  margin: 8px 0 0;
  color: #667085;
}

.picture-page__stats {
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

.form-layout,
.detail-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-card,
.detail-card,
.detail-block {
  padding: 18px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  align-items: center;
  gap: 10px 12px;
  margin-top: 10px;
  color: #667085;
  font-size: 12px;
}

.detail-card--full {
  grid-column: 1 / -1;
}

@media (max-width: 960px) {
  .picture-page {
    padding: 16px;
  }

  .picture-page__hero,
  .panel__header {
    flex-direction: column;
  }

  .picture-page__stats,
  .form-layout,
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>
