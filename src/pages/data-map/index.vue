<!--
  @file Data Map index.vue
  @description 数据地图（cn-data-pilot /data-map 精简版）
  功能：按分层/关键字搜索数据表资产。所有接口由 MSW mock。
-->

<template>
  <div class="datamap">
    <div class="page-header">
      <h2>数据地图</h2>
      <p>按 ODS/DWD/DWS/ADS 分层查询全公司数据资产。</p>
    </div>

    <div class="layer-tabs">
      <div
        v-for="tab in layerTabs"
        :key="tab.value"
        class="layer-tab"
        :class="{ 'layer-tab--active': query.layer === tab.value }"
        @click="handleSelectLayer(tab.value)"
      >
        <div class="layer-tab__title">{{ tab.label }}</div>
        <div class="layer-tab__desc">{{ tab.desc }}</div>
      </div>
    </div>

    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="query" @submit.prevent="handleSearch">
        <a-form-item label="关键字">
          <a-input
            v-model:value="query.keyword"
            placeholder="表名 / 中文名"
            allow-clear
            style="width: 240px"
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

    <a-card :bordered="false">
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
          <template v-if="column.key === 'tableName'">
            <div class="name-cell">
              <strong>{{ record.tableName }}</strong>
              <div class="cn-name">{{ record.cnName }}</div>
            </div>
          </template>

          <template v-else-if="column.key === 'layer'">
            <a-tag :color="layerColorMap[record.layer]">{{ record.layer.toUpperCase() }}</a-tag>
          </template>

          <template v-else-if="column.key === 'rowCount'">
            {{ record.rowCount.toLocaleString() }}
          </template>

          <template v-else-if="column.key === 'storageGb'">
            {{ record.storageGb.toFixed(2) }} GB
          </template>

          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="detailVisible"
      title="数据资产详情"
      width="520"
      :body-style="{ padding: '16px 24px' }"
    >
      <a-descriptions v-if="detail" :column="1" size="small" bordered>
        <a-descriptions-item label="表英文名">{{ detail.tableName }}</a-descriptions-item>
        <a-descriptions-item label="表中文名">{{ detail.cnName }}</a-descriptions-item>
        <a-descriptions-item label="分层">{{ detail.layer.toUpperCase() }}</a-descriptions-item>
        <a-descriptions-item label="数据库">{{ detail.database }}</a-descriptions-item>
        <a-descriptions-item label="负责人">{{ detail.owner }}</a-descriptions-item>
        <a-descriptions-item label="行数">
          {{ detail.rowCount.toLocaleString() }}
        </a-descriptions-item>
        <a-descriptions-item label="存储">{{ detail.storageGb.toFixed(2) }} GB</a-descriptions-item>
        <a-descriptions-item label="最近访问">{{ detail.lastVisit }}</a-descriptions-item>
        <a-descriptions-item label="描述">{{ detail.description }}</a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <Tooltip placement="left" title="Copilot AI 助手">
      <div class="copilot-fab" @click="copilotOpen = true">
        <RobotOutlined />
      </div>
    </Tooltip>

    <a-drawer
      v-model:open="copilotOpen"
      title="数据地图 Copilot"
      placement="right"
      width="480"
      :body-style="{ padding: 0, height: '100%' }"
      :destroy-on-close="false"
    >
      <Copilot
        v-if="copilotOpen"
        :task-name="'DataMap'"
        :current-script-content="''"
        @close="copilotOpen = false"
      />
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Tooltip, message } from 'ant-design-vue';
import type { TablePaginationConfig, TableProps } from 'ant-design-vue';
import { RobotOutlined } from '@ant-design/icons-vue';
import DataMapApi, { type DataAssetItem } from '@/resources/datamap';
import Copilot from '@/components/copilot/copilot.vue';
import {
  pageOperationManager,
  PAGE_OP_DATA_MAP_LOCATE_TABLE,
  type PageOperation,
} from '@/components/copilot/manage/PageOperationManager';

interface Query {
  keyword: string;
  layer: string;
  pageNo: number;
  pageSize: number;
}

const query = reactive<Query>({ keyword: '', layer: '', pageNo: 1, pageSize: 10 });

const list = ref<DataAssetItem[]>([]);
const loading = ref(false);
const detail = ref<DataAssetItem | null>(null);
const detailVisible = ref(false);
const copilotOpen = ref(false);

const layerTabs = [
  { label: '全部', value: '', desc: '所有分层的数据资产' },
  { label: 'ODS', value: 'ods', desc: '原始业务数据' },
  { label: 'DWD', value: 'dwd', desc: '明细数据层' },
  { label: 'DWS', value: 'dws', desc: '汇总数据层' },
  { label: 'ADS', value: 'ads', desc: '应用数据层' },
];

const layerColorMap: Record<string, string> = {
  ods: 'purple',
  dwd: 'blue',
  dws: 'geekblue',
  ads: 'green',
};

const columns = [
  { title: '数据表', key: 'tableName', width: 280 },
  { title: '分层', key: 'layer', width: 80 },
  { title: '数据库', key: 'database', dataIndex: 'database', width: 140 },
  { title: '负责人', key: 'owner', dataIndex: 'owner', width: 100 },
  { title: '行数', key: 'rowCount', width: 140 },
  { title: '存储', key: 'storageGb', width: 100 },
  { title: '最近访问', key: 'lastVisit', dataIndex: 'lastVisit', width: 160 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
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
    const { data: { body } } = await DataMapApi.fetchAssetList({
      keyword: query.keyword,
      layer: query.layer,
      pageNo: query.pageNo,
      pageSize: query.pageSize,
    });
    list.value = body.items;
    pagination.current = body.pageNo;
    pagination.pageSize = body.pageSize;
    pagination.total = body.total;
  } finally {
    loading.value = false;
  }
}

function handleSelectLayer(next: string) {
  query.layer = next;
  query.pageNo = 1;
  fetchData();
}

function handleSearch() {
  query.pageNo = 1;
  fetchData();
}

function handleReset() {
  query.keyword = '';
  query.layer = '';
  query.pageNo = 1;
  fetchData();
}

const handleTableChange: TableProps['onChange'] = (pager) => {
  query.pageNo = pager.current ?? 1;
  query.pageSize = pager.pageSize ?? 10;
  fetchData();
};

async function openDetail(record: DataAssetItem) {
  detail.value = record;
  detailVisible.value = true;
  const { data: { body } } = await DataMapApi.fetchAssetDetail(record.id);
  if (body) detail.value = body;
}

const handleCopilotLocateTable = (op: PageOperation) => {
  const payload = (op.payload ?? {}) as { tableName?: string; layer?: string };
  if (!payload.tableName) return;
  query.keyword = payload.tableName;
  query.layer = payload.layer ?? '';
  query.pageNo = 1;
  fetchData();
  message.success(`已定位到 ${payload.tableName}`);
};

onMounted(() => {
  fetchData();
  pageOperationManager.register(PAGE_OP_DATA_MAP_LOCATE_TABLE, handleCopilotLocateTable);
});

onBeforeUnmount(() => {
  pageOperationManager.unregister(PAGE_OP_DATA_MAP_LOCATE_TABLE, handleCopilotLocateTable);
});
</script>

<style lang="less" scoped>
.datamap {
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
}

.layer-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.layer-tab {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.25s ease;

  &__title {
    font-weight: 600;
    color: #1f2937;
  }

  &__desc {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 4px;
  }

  &:hover {
    border-color: #6366f1;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.1);
  }

  &--active {
    border-color: transparent;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff;

    .layer-tab__title,
    .layer-tab__desc {
      color: #fff;
    }
  }
}

.name-cell {
  .cn-name {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 2px;
  }
}

.copilot-fab {
  position: fixed;
  right: 32px;
  bottom: 48px;
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
  transition: transform 0.2s;
  z-index: 10;

  &:hover {
    transform: translateY(-2px);
  }
}
</style>
