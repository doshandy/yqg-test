<!--
  SQL 历史记录抽屉（挤压式）
-->
<template>
  <PushDrawer
    :open="open"
    title="历史记录"
    :width="680"
    @update:open="emit('update:open', $event)"
  >
    <a-spin :spinning="loading">
      <div class="history-toolbar">
        <a-segmented
          v-model:value="filter"
          :options="[
            { label: '全部', value: 'all' },
            { label: '成功', value: 'SUCCESS' },
            { label: '失败', value: 'FAILED' },
          ]"
        />
        <a-input-search
          v-model:value="keyword"
          placeholder="搜索 SQL"
          allow-clear
          style="flex: 1; min-width: 160px"
        />
        <a-button size="small" @click="refresh">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </div>
      <a-table
        size="small"
        :columns="columns"
        :data-source="filteredItems"
        :pagination="{ pageSize: 10, size: 'small' }"
        :row-key="(r: HistoryRow) => r.id"
        class="history-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)" :bordered="false">
              {{ statusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'sqlText'">
            <a-tooltip :title="record.sqlText">
              <span class="sql-cell">{{ record.sqlText }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'duration'">
            {{ (record.duration / 1000).toFixed(2) }} s
          </template>
          <template v-else-if="column.key === 'ops'">
            <a-button type="link" size="small" @click="onApply(record)">新建页签</a-button>
          </template>
        </template>
      </a-table>
    </a-spin>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import ExploreApi, { type SqlHistoryItem } from '@/resources/explore';

type HistoryRow = SqlHistoryItem;

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'open-tab', sql: string): void;
}>();

const loading = ref(false);
const items = ref<HistoryRow[]>([]);
const filter = ref<'all' | 'SUCCESS' | 'FAILED'>('all');
const keyword = ref('');

const columns = [
  { title: '状态', key: 'status', dataIndex: 'status', width: 80 },
  { title: 'SQL', key: 'sqlText', dataIndex: 'sqlText', ellipsis: true },
  { title: '数据源', key: 'database', dataIndex: 'database', width: 100 },
  { title: '耗时', key: 'duration', dataIndex: 'duration', width: 80 },
  { title: '行数', key: 'rows', dataIndex: 'rows', width: 80 },
  { title: '时间', key: 'startTime', dataIndex: 'startTime', width: 140 },
  { title: '操作', key: 'ops', width: 100, fixed: 'right' },
];

const filteredItems = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  return items.value.filter((r) => {
    const byStatus = filter.value === 'all' || r.status === filter.value;
    const byText = !k || r.sqlText.toLowerCase().includes(k);
    return byStatus && byText;
  });
});

const statusColor = (s: string) => (s === 'SUCCESS' ? 'success' : s === 'FAILED' ? 'error' : 'processing');
const statusText = (s: string) => (s === 'SUCCESS' ? '成功' : s === 'FAILED' ? '失败' : '运行中');

async function refresh() {
  loading.value = true;
  try {
    const { items: list } = await ExploreApi.fetchSqlHistory({ pageNo: 1, pageSize: 100 });
    items.value = list;
  } catch (e) {
    message.error('加载历史记录失败');
  } finally {
    loading.value = false;
  }
}

function onApply(record: HistoryRow) {
  emit('open-tab', record.sqlText);
  emit('update:open', false);
}

watch(
  () => props.open,
  (v) => {
    if (v && !items.value.length) refresh();
  },
);
</script>

<style lang="less" scoped>
.history-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.history-table {
  :deep(.ant-table-tbody > tr > td) {
    white-space: nowrap;
  }
}
.sql-cell {
  font-family: monospace;
  color: #1a1a2e;
  display: inline-block;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
</style>
