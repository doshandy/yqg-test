<template>
  <PushDrawer
    :open="open"
    title="表版本管理"
    :width="820"
    @update:open="emit('update:open', $event)"
  >
    <a-alert
      type="info"
      show-icon
      message="每次提交到生产会产生一个新版本。可查看每个版本的 DDL 并回滚。"
      style="margin-bottom: 12px"
    />
    <a-table
      :columns="columns"
      :data-source="versions"
      :pagination="false"
      row-key="versionId"
      size="small"
      :loading="loading"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'env'">
          <a-tag :color="record.env === 'PROD' ? 'green' : 'blue'">{{ record.env }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a @click="onView(record)">查看 DDL</a>
            <a @click="onCompare(record)">对比</a>
            <a-popconfirm title="确认回滚到此版本？" @confirm="onRollback(record)">
              <a class="danger-link">回滚</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      :open="detailOpen"
      :title="`版本 ${current?.version} - DDL`"
      width="720"
      :footer="null"
      @cancel="detailOpen = false"
    >
      <div class="ddl-box">
        <CodeEditor :model-value="current?.ddl ?? ''" language="sql" readonly @update:model-value="() => {}" />
      </div>
    </a-modal>

    <a-modal
      :open="compareOpen"
      title="版本对比"
      width="1080"
      :footer="null"
      @cancel="compareOpen = false"
    >
      <div class="compare-wrap">
        <div class="compare-col">
          <div class="compare-title">当前 v{{ versions[0]?.version }}</div>
          <CodeEditor :model-value="versions[0]?.ddl ?? ''" language="sql" readonly @update:model-value="() => {}" />
        </div>
        <div class="compare-col">
          <div class="compare-title">选中 v{{ current?.version }}</div>
          <CodeEditor :model-value="current?.ddl ?? ''" language="sql" readonly @update:model-value="() => {}" />
        </div>
      </div>
    </a-modal>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import CodeEditor from '@/components/CodeEditor.vue';
import DataDevelopApi, { type TableVersionItem } from '@/resources/data-develop';

const props = defineProps<{ open: boolean; tableId?: string }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

const loading = ref(false);
const versions = ref<TableVersionItem[]>([]);
const detailOpen = ref(false);
const compareOpen = ref(false);
const current = ref<TableVersionItem>();

const columns = [
  { title: '版本', dataIndex: 'version', width: 80 },
  { title: '环境', dataIndex: 'env', width: 70 },
  { title: '提交人', dataIndex: 'submitter', width: 100 },
  { title: '提交时间', dataIndex: 'submittedAt', width: 150 },
  { title: '变更', dataIndex: 'changes', width: 60 },
  { title: '描述', dataIndex: 'description' },
  { title: '操作', dataIndex: 'action', width: 180 },
];

const load = async () => {
  loading.value = true;
  try {
    versions.value = await DataDevelopApi.fetchTableVersions();
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  (v) => { if (v) load(); },
);

const onView = (r: TableVersionItem) => { current.value = r; detailOpen.value = true; };
const onCompare = (r: TableVersionItem) => { current.value = r; compareOpen.value = true; };
const onRollback = async (r: TableVersionItem) => {
  await DataDevelopApi.rollbackTable({ tableId: props.tableId ?? '', versionId: r.versionId });
  message.success(`已回滚到 ${r.version}`);
};
</script>

<style scoped>
.ddl-box { height: 380px; border: 1px solid #f0f0f0; border-radius: 4px; overflow: hidden; }
.compare-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 440px; }
.compare-col { display: flex; flex-direction: column; border: 1px solid #f0f0f0; border-radius: 4px; overflow: hidden; }
.compare-title { padding: 6px 10px; background: #fafafa; border-bottom: 1px solid #f0f0f0; font-weight: 600; font-size: 12px; }
.compare-col :deep(.code-editor) { flex: 1; }
.danger-link { color: #ff4d4f; }
</style>
