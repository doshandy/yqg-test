<template>
  <PushDrawer
    :open="open"
    title="版本管理"
    :width="680"
    @update:open="emit('update:open', $event)"
  >
    <a-alert
      message="历史提交记录，支持对比与回滚。"
      type="info"
      show-icon
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
          <a-tag :color="record.env === 'PROD' ? 'green' : 'default'">{{ record.env }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a @click="onDetail(record)">详情</a>
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
      title="版本详情"
      width="720"
      :footer="null"
      @cancel="detailOpen = false"
    >
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="版本号">{{ current?.version }}</a-descriptions-item>
        <a-descriptions-item label="环境">{{ current?.env }}</a-descriptions-item>
        <a-descriptions-item label="提交人">{{ current?.submitter }}</a-descriptions-item>
        <a-descriptions-item label="提交时间">{{ current?.submittedAt }}</a-descriptions-item>
        <a-descriptions-item label="变更行数" :span="2">{{ current?.changes }}</a-descriptions-item>
        <a-descriptions-item label="描述" :span="2">{{ current?.description }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type VersionItem } from '@/resources/data-develop';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

const loading = ref(false);
const versions = ref<VersionItem[]>([]);
const detailOpen = ref(false);
const current = ref<VersionItem>();

const columns = [
  { title: '版本', dataIndex: 'version', width: 90 },
  { title: '环境', dataIndex: 'env', width: 70 },
  { title: '提交人', dataIndex: 'submitter', width: 90 },
  { title: '提交时间', dataIndex: 'submittedAt', width: 150 },
  { title: '变更', dataIndex: 'changes', width: 60 },
  { title: '描述', dataIndex: 'description' },
  { title: '操作', dataIndex: 'action', width: 160 },
];

const load = async () => {
  loading.value = true;
  try {
    versions.value = await DataDevelopApi.fetchVersions();
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  (v) => { if (v && !versions.value.length) load(); },
);

const onDetail = (r: VersionItem) => { current.value = r; detailOpen.value = true; };
const onCompare = (r: VersionItem) => message.info(`对比版本 ${r.version}`);
const onRollback = (r: VersionItem) => message.success(`已回滚到 ${r.version}`);
</script>

<style scoped>
.danger-link { color: #ff4d4f; }
</style>
