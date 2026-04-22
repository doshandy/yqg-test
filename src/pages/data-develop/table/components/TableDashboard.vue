<template>
  <div class="dashboard">
    <div class="env-banner" :class="envClass">
      <div class="env-info">
        <DeploymentUnitOutlined />
        <span class="env-title">
          当前环境：<strong>{{ env === 'DEV' ? '开发环境（DEV）' : '生产环境（PROD）' }}</strong>
        </span>
        <a-tag :color="env === 'DEV' ? 'blue' : 'green'">{{ env }}</a-tag>
      </div>
      <a-space>
        <span class="env-hint">
          {{ env === 'DEV' ? '建表、改表、删除需先在 DEV 自测，然后提交到 PROD' : '生产环境只读，请切换到 DEV 发起变更' }}
        </span>
        <a-button size="small" type="link" @click="emit('switchEnv', env === 'DEV' ? 'PROD' : 'DEV')">
          切到 {{ env === 'DEV' ? 'PROD' : 'DEV' }}
        </a-button>
      </a-space>
    </div>

    <div v-if="env === 'DEV'" class="quick-cards">
      <a-card size="small" class="entry-card" hoverable @click="emit('createTable')">
        <div class="entry-icon"><PlusCircleOutlined /></div>
        <div class="entry-title">新建表（可视化）</div>
        <div class="entry-desc">字段、分区、生命周期全可视化配置</div>
      </a-card>
      <a-card size="small" class="entry-card" hoverable @click="emit('openDdlModal')">
        <div class="entry-icon"><CodeOutlined /></div>
        <div class="entry-title">DDL 直接建表</div>
        <div class="entry-desc">粘贴 CREATE TABLE 语句，自动解析字段</div>
      </a-card>
      <a-card size="small" class="entry-card" hoverable @click="emit('openRefTableModal')">
        <div class="entry-icon"><CopyOutlined /></div>
        <div class="entry-title">参考已有表建新表</div>
        <div class="entry-desc">基于现有结构复制，快速建相似表</div>
      </a-card>
    </div>

    <a-card class="recent-card" title="最近访问的表" size="small">
      <template #extra>
        <a-space>
          <a-select v-model:value="filterOwner" :options="ownerOptions" placeholder="所有负责人" style="width: 140px" allow-clear size="small" />
          <a-radio-group v-model:value="filterScope" size="small">
            <a-radio-button value="mine">我的</a-radio-button>
            <a-radio-button value="all">全部</a-radio-button>
          </a-radio-group>
        </a-space>
      </template>
      <a-table
        :columns="columns"
        :data-source="filtered"
        :pagination="{ pageSize: 6, size: 'small' }"
        row-key="id"
        size="small"
        :loading="loading"
        :scroll="{ x: 900 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'env'">
            <a-tag :color="record.env === 'PROD' ? 'green' : 'blue'">{{ record.env }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'rowCount'">
            {{ record.rowCount.toLocaleString() }}
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a @click="emit('showDetail', record)">详情</a>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import {
  CodeOutlined,
  CopyOutlined,
  DeploymentUnitOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons-vue';
import DataDevelopApi, { type RecentTable } from '@/resources/data-develop';

const props = defineProps<{ env: 'DEV' | 'PROD' }>();
const emit = defineEmits<{
  (e: 'switchEnv', env: 'DEV' | 'PROD'): void;
  (e: 'createTable'): void;
  (e: 'openDdlModal'): void;
  (e: 'openRefTableModal'): void;
  (e: 'showDetail', record: RecentTable): void;
}>();

const loading = ref(false);
const records = ref<RecentTable[]>([]);
const filterOwner = ref<string>();
const filterScope = ref<'mine' | 'all'>('all');

const envClass = computed(() => (props.env === 'DEV' ? 'env-dev' : 'env-prod'));

const columns = [
  { title: '表名', dataIndex: 'tableName' },
  { title: '库', dataIndex: 'database', width: 120 },
  { title: '环境', dataIndex: 'env', width: 80 },
  { title: '负责人', dataIndex: 'owner', width: 100 },
  { title: '行数', dataIndex: 'rowCount', width: 120 },
  { title: '最近访问', dataIndex: 'lastVisit', width: 160 },
  { title: '操作', dataIndex: 'action', width: 70 },
];

const ownerOptions = computed(() => {
  const set = new Set(records.value.map((r) => r.owner));
  return Array.from(set).map((v) => ({ label: v, value: v }));
});

const filtered = computed(() => {
  return records.value.filter((r) => {
    const hitOwner = !filterOwner.value || r.owner === filterOwner.value;
    const hitScope = filterScope.value === 'all' || r.owner === 'sunwei';
    return hitOwner && hitScope;
  });
});

onMounted(async () => {
  loading.value = true;
  try { records.value = await DataDevelopApi.fetchRecentTables(); } finally { loading.value = false; }
});
</script>

<style lang="less" scoped>
.dashboard {
  padding: 16px 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  height: 100%;
  overflow: auto;
}

.env-banner {
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.env-dev { background: #e6f4ff; border: 1px solid #91caff; }
  &.env-prod { background: #f6ffed; border: 1px solid #b7eb8f; }

  .env-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .env-title strong { color: #1677ff; }
  }

  .env-hint { color: #666; font-size: 12px; }
}

.quick-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  .entry-card {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #1677ff;
      box-shadow: 0 4px 16px rgba(22, 119, 255, 0.12);
    }

    .entry-icon {
      font-size: 22px;
      color: #1677ff;
      margin-bottom: 6px;
    }

    .entry-title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .entry-desc {
      color: #888;
      font-size: 12px;
    }
  }
}

.recent-card { flex: 1; min-height: 0; }
</style>
