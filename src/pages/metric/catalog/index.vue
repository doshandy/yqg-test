<!--
  @file Metric Catalog index.vue
  @description 指标目录（cn-data-lumina /metric/catalog 精简版）
  功能：关键字搜索 + 状态筛选 + 分页列表 + 标签渲染。
  所有接口由 MSW mock。
-->

<template>
  <div class="metric-catalog">
    <div class="page-header">
      <h2>指标目录</h2>
      <p>公司级统一指标库，支持按业务域、状态、关键字快速查找。</p>
    </div>

    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="query" @submit.prevent="handleSearch">
        <a-form-item label="关键字">
          <a-input
            v-model:value="query.keyword"
            placeholder="指标中/英文名"
            allow-clear
            style="width: 220px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="query.status"
            :options="statusOptions"
            placeholder="全部"
            allow-clear
            style="width: 140px"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">搜索</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card :bordered="false" class="list-card">
      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="name-cell">
              <strong>{{ record.name }}</strong>
              <div class="en-name">{{ record.englishName }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColorMap[record.status]">
              {{ statusLabelMap[record.status] }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'tag'">
            <a-tag v-for="t in record.tag" :key="t" color="blue">{{ t }}</a-tag>
          </template>

          <template v-else-if="column.key === 'usage'">
            <span>{{ record.usage.toLocaleString() }} 次</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDetail(record)">
              查看详情
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="detailVisible"
      :title="`指标详情 - ${detail?.name ?? ''}`"
      :footer="null"
      width="640px"
    >
      <a-descriptions v-if="detail" :column="1" bordered size="small">
        <a-descriptions-item label="指标 ID">{{ detail.id }}</a-descriptions-item>
        <a-descriptions-item label="英文名">{{ detail.englishName }}</a-descriptions-item>
        <a-descriptions-item label="业务域">{{ detail.domain }}</a-descriptions-item>
        <a-descriptions-item label="负责人">{{ detail.owner }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColorMap[detail.status]">
            {{ statusLabelMap[detail.status] }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="描述">{{ detail.description }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ detail.updatedAt }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig, TableProps } from 'ant-design-vue';
import MetricApi, { type MetricItem } from '@/resources/metric';

interface Query {
  keyword: string;
  status?: string;
  pageNo: number;
  pageSize: number;
}

const query = reactive<Query>({ keyword: '', status: undefined, pageNo: 1, pageSize: 10 });

const list = ref<MetricItem[]>([]);
const loading = ref(false);
const total = ref(0);
const detail = ref<MetricItem | null>(null);
const detailVisible = ref(false);

const statusOptions = [
  { label: '上线', value: 'online' },
  { label: '下线', value: 'offline' },
  { label: '草稿', value: 'draft' },
];

const statusColorMap: Record<string, string> = {
  online: 'success',
  offline: 'default',
  draft: 'warning',
};

const statusLabelMap: Record<string, string> = {
  online: '上线',
  offline: '下线',
  draft: '草稿',
};

const columns = [
  { title: '指标名称', key: 'name', dataIndex: 'name', width: 220 },
  { title: '业务域', key: 'domain', dataIndex: 'domain', width: 100 },
  { title: '负责人', key: 'owner', dataIndex: 'owner', width: 100 },
  { title: '标签', key: 'tag', dataIndex: 'tag', width: 140 },
  { title: '状态', key: 'status', dataIndex: 'status', width: 90 },
  { title: '使用次数', key: 'usage', dataIndex: 'usage', width: 120 },
  { title: '更新时间', key: 'updatedAt', dataIndex: 'updatedAt', width: 170 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
});

async function fetchData() {
  loading.value = true;
  try {
    const { data: { body } } = await MetricApi.fetchList({
      keyword: query.keyword,
      status: query.status,
      pageNo: query.pageNo,
      pageSize: query.pageSize,
    });
    list.value = body.items;
    total.value = body.total;
    pagination.current = body.pageNo;
    pagination.pageSize = body.pageSize;
    pagination.total = body.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNo = 1;
  fetchData();
}

function handleReset() {
  query.keyword = '';
  query.status = undefined;
  query.pageNo = 1;
  fetchData();
}

const handleTableChange: TableProps['onChange'] = (pager) => {
  query.pageNo = pager.current ?? 1;
  query.pageSize = pager.pageSize ?? 10;
  fetchData();
};

async function openDetail(record: MetricItem) {
  detail.value = record;
  detailVisible.value = true;
  const { data: { body } } = await MetricApi.fetchDetail(record.id);
  if (body) detail.value = body;
}

onMounted(fetchData);
</script>

<style lang="less" scoped>
.metric-catalog {
  .page-header {
    margin-bottom: 16px;

    h2 {
      font-size: 22px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    p {
      color: #6b7280;
      margin: 6px 0 0;
      font-size: 13px;
    }
  }

  .filter-card {
    margin-bottom: 12px;
  }

  .list-card {
    :deep(.ant-table-wrapper) {
      overflow: auto;
    }
  }
}

.name-cell {
  .en-name {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 2px;
  }
}
</style>
