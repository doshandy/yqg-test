<template>
  <a-modal
    :open="open"
    title="参考已有表建新表"
    width="760"
    :mask-closable="false"
    ok-text="下一步：编辑字段"
    @ok="onOk"
    @cancel="emit('update:open', false)"
  >
    <a-alert
      type="info"
      show-icon
      message="选择一张已有表，系统会复制其字段结构和分区，供你作为新表的初始模板。"
      style="margin-bottom: 10px"
    />
    <a-form layout="vertical">
      <a-form-item label="选择参考表">
        <a-select
          v-model:value="selectedKey"
          show-search
          placeholder="搜索并选择表"
          :options="tableOptions"
          option-filter-prop="label"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="新表名">
        <a-input v-model:value="newName" placeholder="输入新表名" />
      </a-form-item>
      <a-form-item label="复制字段">
        <a-checkbox-group v-model:value="copyItems" :options="copyOptions" />
      </a-form-item>
    </a-form>
    <a-descriptions v-if="selected" :column="2" bordered size="small" title="参考表概览">
      <a-descriptions-item label="表名">{{ selected.database }}.{{ selected.title }}</a-descriptions-item>
      <a-descriptions-item label="环境">{{ selected.env ?? '-' }}</a-descriptions-item>
      <a-descriptions-item label="负责人">{{ selected.owner }}</a-descriptions-item>
      <a-descriptions-item label="行数">{{ selected.rowCount?.toLocaleString() }}</a-descriptions-item>
    </a-descriptions>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import DataDevelopApi, { type TableTreeNode } from '@/resources/data-develop';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void; (e: 'created'): void }>();

const allTables = ref<TableTreeNode[]>([]);
const selectedKey = ref<string>();
const newName = ref('');
const copyItems = ref<string[]>(['fields', 'partition', 'comment']);

const copyOptions = [
  { label: '字段', value: 'fields' },
  { label: '分区', value: 'partition' },
  { label: '注释', value: 'comment' },
  { label: '生命周期', value: 'lifecycle' },
];

const tableOptions = computed(() => {
  return allTables.value.map((t) => ({
    label: `${t.database}.${t.title}`,
    value: t.key,
  }));
});

const selected = computed(() => allTables.value.find((t) => t.key === selectedKey.value));

onMounted(async () => {
  const tree = await DataDevelopApi.fetchTableTree();
  const flat: Array<TableTreeNode & { database: string }> = [];
  tree.forEach((db) => {
    (db.children ?? []).forEach((t) => flat.push({ ...t, database: db.title }));
  });
  allTables.value = flat;
});

const onOk = () => {
  if (!selectedKey.value) {
    message.warning('请选择参考表');
    return;
  }
  if (!newName.value.trim()) {
    message.warning('请填写新表名');
    return;
  }
  message.success('已生成字段模板，请在下一步编辑（演示）');
  emit('created');
  emit('update:open', false);
};
</script>
