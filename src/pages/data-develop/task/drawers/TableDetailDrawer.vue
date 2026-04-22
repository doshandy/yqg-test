<template>
  <PushDrawer
    :open="open"
    title="引用表详情"
    :width="760"
    @update:open="emit('update:open', $event)"
  >
    <a-skeleton v-if="loading" active />
    <template v-else-if="detail">
      <div class="head">
        <div>
          <h3>{{ detail.database }}.{{ detail.tableName }}</h3>
          <div class="meta">负责人：{{ detail.owner }} · 最近更新：{{ detail.updatedAt }}</div>
        </div>
        <a-tag :color="detail.env === 'PROD' ? 'green' : 'blue'">{{ detail.env }}</a-tag>
      </div>
      <a-descriptions :column="2" bordered size="small" style="margin: 12px 0">
        <a-descriptions-item label="行数">{{ detail.rowCount.toLocaleString() }}</a-descriptions-item>
        <a-descriptions-item label="存储">{{ detail.storageSize }}</a-descriptions-item>
        <a-descriptions-item label="存储格式">{{ detail.storageFormat }}</a-descriptions-item>
        <a-descriptions-item label="生命周期">{{ detail.lifecycle }} 天</a-descriptions-item>
      </a-descriptions>
      <a-tabs>
        <a-tab-pane key="columns" tab="字段">
          <a-table
            :columns="colColumns"
            :data-source="detail.columns"
            :pagination="false"
            size="small"
            row-key="name"
          />
        </a-tab-pane>
        <a-tab-pane key="partitions" tab="分区">
          <a-table
            :columns="partColumns"
            :data-source="detail.partitions"
            :pagination="false"
            size="small"
            row-key="name"
          />
        </a-tab-pane>
      </a-tabs>
    </template>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type TableDetail } from '@/resources/data-develop';

const props = defineProps<{ open: boolean; tableId?: string }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

const loading = ref(false);
const detail = ref<TableDetail>();

const colColumns = [
  { title: '字段名', dataIndex: 'name', width: 160 },
  { title: '类型', dataIndex: 'type', width: 110 },
  { title: '是否分区', dataIndex: 'isPartition', width: 80,
    customRender: ({ text }: { text: boolean }) => (text ? '是' : '否') },
  { title: '可空', dataIndex: 'nullable', width: 60,
    customRender: ({ text }: { text: boolean }) => (text ? '是' : '否') },
  { title: '主键', dataIndex: 'primaryKey', width: 60,
    customRender: ({ text }: { text: boolean }) => (text ? '是' : '否') },
  { title: '注释', dataIndex: 'comment' },
];
const partColumns = [
  { title: '分区', dataIndex: 'name', width: 180 },
  { title: '行数', dataIndex: 'rowCount', width: 120,
    customRender: ({ text }: { text: number }) => text.toLocaleString() },
  { title: '大小', dataIndex: 'size', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt' },
];

const load = async () => {
  if (!props.tableId) return;
  loading.value = true;
  try {
    detail.value = await DataDevelopApi.fetchTableDetail(props.tableId);
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.open, props.tableId] as const,
  ([op, id]) => { if (op && id) load(); },
);
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.head h3 { margin: 0; }
.head .meta { color: #888; font-size: 12px; margin-top: 4px; }
</style>
