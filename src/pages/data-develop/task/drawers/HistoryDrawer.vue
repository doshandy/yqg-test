<template>
  <PushDrawer
    :open="open"
    title="执行历史"
    :width="820"
    @update:open="emit('update:open', $event)"
  >
    <div class="history-head">
      <a-space>
        <a-range-picker size="small" />
        <a-select v-model:value="statusFilter" :options="statusOptions" size="small" style="width: 140px" allow-clear placeholder="全部状态" />
      </a-space>
      <a-button size="small" @click="load">
        <template #icon><ReloadOutlined /></template>
        刷新
      </a-button>
    </div>
    <a-table
      :columns="columns"
      :data-source="filtered"
      :pagination="{ pageSize: 10 }"
      row-key="id"
      size="small"
      :loading="loading"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a>日志</a>
            <a>查看结果</a>
            <a class="danger-link" v-if="record.status === 'RUNNING'">终止</a>
          </a-space>
        </template>
      </template>
    </a-table>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type RunRecord } from '@/resources/data-develop';

const props = defineProps<{ open: boolean }>();
defineEmits<{ (e: 'update:open', v: boolean): void }>();

const loading = ref(false);
const records = ref<RunRecord[]>([]);
const statusFilter = ref<string>();

const statusOptions = [
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
  { label: '运行中', value: 'RUNNING' },
];

const columns = [
  { title: '执行编号', dataIndex: 'id', width: 160 },
  { title: '开始时间', dataIndex: 'startTime', width: 160 },
  { title: '结束时间', dataIndex: 'endTime', width: 160 },
  { title: '耗时', dataIndex: 'duration', width: 90 },
  { title: '状态', dataIndex: 'status', width: 90 },
  { title: '行数', dataIndex: 'rowCount', width: 100,
    customRender: ({ text }: { text: number }) => text ? text.toLocaleString() : '-' },
  { title: '引擎', dataIndex: 'engine', width: 100 },
  { title: '执行人', dataIndex: 'operator', width: 100 },
  { title: '操作', dataIndex: 'action', width: 180 },
];

const load = async () => {
  loading.value = true;
  try {
    records.value = await DataDevelopApi.fetchRunRecords();
  } finally {
    loading.value = false;
  }
};

function statusLabel(s: string) {
  switch (s) { case 'SUCCESS': return '成功'; case 'FAILED': return '失败'; case 'RUNNING': return '运行中'; default: return s; }
}
function statusColor(s: string) {
  switch (s) { case 'SUCCESS': return 'green'; case 'FAILED': return 'red'; case 'RUNNING': return 'blue'; default: return 'default'; }
}

const filtered = computed(() => {
  if (!statusFilter.value) return records.value;
  return records.value.filter((r) => r.status === statusFilter.value);
});

watch(
  () => props.open,
  (v) => { if (v) load(); },
);
</script>

<style scoped>
.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.danger-link { color: #ff4d4f; }
</style>
