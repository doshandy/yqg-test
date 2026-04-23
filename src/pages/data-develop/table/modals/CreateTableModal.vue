<template>
  <a-modal
    :open="open"
    title="新建表"
    width="880"
    :mask-closable="false"
    ok-text="创建"
    @ok="onOk"
    @cancel="emit('update:open', false)"
  >
    <a-form :model="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <a-row :gutter="12">
        <a-col :span="12">
          <a-form-item label="数据库">
            <a-select v-model:value="form.database" :options="dbOptions" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="表名">
            <a-input v-model:value="form.tableName" placeholder="user_active_daily" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="负责人">
            <a-input v-model:value="form.owner" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="生命周期（天）">
            <a-input-number v-model:value="form.lifecycle" :min="1" :max="3650" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="存储格式">
            <a-radio-group v-model:value="form.storageFormat">
              <a-radio value="PARQUET">PARQUET</a-radio>
              <a-radio value="ORC">ORC</a-radio>
              <a-radio value="TEXTFILE">TEXTFILE</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="压缩">
            <a-select v-model:value="form.compression" :options="compressionOptions" />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item label="描述" :label-col="{ span: 2 }" :wrapper-col="{ span: 22 }">
            <a-textarea v-model:value="form.description" :rows="2" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-divider>字段定义</a-divider>
      <div class="columns-toolbar">
        <a-button size="small" @click="onAddColumn">+ 新增字段</a-button>
        <a-button size="small" @click="onAddPartition">+ 新增分区</a-button>
      </div>
      <a-table
        :columns="columns"
        :data-source="form.fields"
        :pagination="false"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.dataIndex === 'name'">
            <a-input v-model:value="record.name" size="small" placeholder="字段名" />
          </template>
          <template v-else-if="column.dataIndex === 'type'">
            <a-select v-model:value="record.type" size="small" :options="typeOptions" style="width: 110px" />
          </template>
          <template v-else-if="column.dataIndex === 'comment'">
            <a-input v-model:value="record.comment" size="small" placeholder="注释" />
          </template>
          <template v-else-if="column.dataIndex === 'isPartition'">
            <a-switch v-model:checked="record.isPartition" size="small" />
          </template>
          <template v-else-if="column.dataIndex === 'nullable'">
            <a-switch v-model:checked="record.nullable" size="small" />
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a class="danger-link" @click="onDeleteColumn(index)">删除</a>
          </template>
        </template>
      </a-table>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { message } from 'ant-design-vue';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void; (e: 'created'): void }>();

interface FieldRow {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  isPartition: boolean;
  comment: string;
}

const form = reactive({
  database: 'dwd_risk',
  tableName: '',
  owner: 'sunwei',
  lifecycle: 180,
  storageFormat: 'PARQUET',
  compression: 'SNAPPY',
  description: '',
  fields: [
    { id: 'f1', name: 'user_id', type: 'BIGINT', nullable: false, isPartition: false, comment: '用户 ID' },
    { id: 'f2', name: 'event_time', type: 'TIMESTAMP', nullable: true, isPartition: false, comment: '事件时间' },
    { id: 'f3', name: 'dt', type: 'STRING', nullable: false, isPartition: true, comment: '分区日期' },
  ] as FieldRow[],
});

const dbOptions = [
  { label: 'dwd_risk', value: 'dwd_risk' },
  { label: 'dwd_ops', value: 'dwd_ops' },
  { label: 'dwd_growth', value: 'dwd_growth' },
  { label: 'dws_user', value: 'dws_user' },
  { label: 'ads_bi', value: 'ads_bi' },
];
const compressionOptions = [
  { label: 'SNAPPY', value: 'SNAPPY' },
  { label: 'GZIP', value: 'GZIP' },
  { label: 'NONE', value: 'NONE' },
];
const typeOptions = ['BIGINT', 'INT', 'DOUBLE', 'FLOAT', 'STRING', 'BOOLEAN', 'TIMESTAMP', 'DATE']
  .map((v) => ({ label: v, value: v }));

const columns = [
  { title: '字段名', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type', width: 130 },
  { title: '分区', dataIndex: 'isPartition', width: 60 },
  { title: '可空', dataIndex: 'nullable', width: 60 },
  { title: '注释', dataIndex: 'comment' },
  { title: '操作', dataIndex: 'action', width: 60 },
];

const onAddColumn = () => {
  form.fields.push({
    id: `f-${Date.now()}`,
    name: '',
    type: 'STRING',
    nullable: true,
    isPartition: false,
    comment: '',
  });
};

const onAddPartition = () => {
  form.fields.push({
    id: `p-${Date.now()}`,
    name: 'dt',
    type: 'STRING',
    nullable: false,
    isPartition: true,
    comment: '分区日期',
  });
};

const onDeleteColumn = (idx: number) => form.fields.splice(idx, 1);

const onOk = () => {
  if (!form.tableName.trim()) {
    message.warning('请填写表名');
    return;
  }
  message.success('建表请求已提交');
  emit('created');
  emit('update:open', false);
};
</script>

<style scoped>
.columns-toolbar { display: flex; gap: 8px; margin-bottom: 10px; }
.danger-link { color: #ff4d4f; }
</style>
