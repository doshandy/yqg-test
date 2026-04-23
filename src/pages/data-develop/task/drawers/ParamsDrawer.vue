<template>
  <PushDrawer
    :open="open"
    title="资源参数"
    :width="640"
    @update:open="emit('update:open', $event)"
  >
    <div class="params-toolbar">
      <span class="tip">在此配置任务级别的参数，可在 SQL 中通过 <code>${'${'}bizdate}</code> 引用。</span>
      <a-button type="primary" size="small" @click="onAdd">+ 新增参数</a-button>
    </div>
    <a-table
      :columns="columns"
      :data-source="rows"
      :pagination="false"
      size="small"
      row-key="id"
      :loading="loading"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'key'">
          <a-input v-model:value="record.key" size="small" placeholder="参数名" />
        </template>
        <template v-else-if="column.dataIndex === 'value'">
          <a-input v-model:value="record.value" size="small" placeholder="参数值" />
        </template>
        <template v-else-if="column.dataIndex === 'desc'">
          <a-input v-model:value="record.desc" size="small" placeholder="描述" />
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a type="link" @click="onDelete(index)">删除</a>
        </template>
      </template>
    </a-table>

    <a-divider />
    <h4>资源配置</h4>
    <a-descriptions :column="2" bordered size="small">
      <a-descriptions-item label="计算引擎">Spark 3.3</a-descriptions-item>
      <a-descriptions-item label="队列">root.data.default</a-descriptions-item>
      <a-descriptions-item label="Executor 数量">4</a-descriptions-item>
      <a-descriptions-item label="Executor 内存">8 GB</a-descriptions-item>
      <a-descriptions-item label="Driver 内存">2 GB</a-descriptions-item>
      <a-descriptions-item label="动态分配">开启</a-descriptions-item>
    </a-descriptions>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px">
        <a-button @click="emit('update:open', false)">取消</a-button>
        <a-button type="primary" @click="onSave">保存</a-button>
      </div>
    </template>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type TaskParam } from '@/resources/data-develop';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

const loading = ref(false);
const rows = reactive<TaskParam[]>([]);

const columns = [
  { title: '参数名', dataIndex: 'key', width: 160 },
  { title: '参数值', dataIndex: 'value', width: 200 },
  { title: '描述', dataIndex: 'desc' },
  { title: '操作', dataIndex: 'action', width: 70 },
];

const loadParams = async () => {
  loading.value = true;
  try {
    rows.splice(0, rows.length, ...(await DataDevelopApi.fetchTaskParams()));
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  (v) => { if (v && !rows.length) loadParams(); },
);

const onAdd = () => {
  rows.push({ id: `tmp-${Date.now()}`, key: '', value: '', desc: '' });
};
const onDelete = (idx: number) => rows.splice(idx, 1);
const onSave = () => {
  message.success('保存成功');
  emit('update:open', false);
};
</script>

<style scoped>
.params-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.tip { color: #888; font-size: 12px; }
h4 { margin: 12px 0 8px; }
</style>
