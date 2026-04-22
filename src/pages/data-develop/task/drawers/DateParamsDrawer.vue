<template>
  <PushDrawer
    :open="open"
    title="运行参数"
    :width="420"
    @update:open="emit('update:open', $event)"
  >
    <a-form layout="vertical">
      <a-form-item label="业务日期 bizdate">
        <a-date-picker v-model:value="form.bizdate" style="width: 100%" />
      </a-form-item>
      <a-form-item label="分区模式">
        <a-radio-group v-model:value="form.partitionMode">
          <a-radio value="INCREMENT">增量</a-radio>
          <a-radio value="FULL">全量</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="引擎">
        <a-select v-model:value="form.engine" :options="engineOptions" />
      </a-form-item>
      <a-form-item label="额外参数（JSON）">
        <a-textarea v-model:value="form.extra" :rows="6" />
      </a-form-item>
    </a-form>
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px">
        <a-button @click="emit('update:open', false)">取消</a-button>
        <a-button type="primary" @click="onSubmit">运行</a-button>
      </div>
    </template>
  </PushDrawer>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import { reactive } from 'vue';
import { message } from 'ant-design-vue';
import PushDrawer from '@/components/PushDrawer.vue';

defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: 'update:open', v: boolean): void;
  (e: 'run'): void;
}>();

const form = reactive({
  bizdate: dayjs().subtract(1, 'day'),
  partitionMode: 'INCREMENT' as 'INCREMENT' | 'FULL',
  engine: 'spark',
  extra: '{\n  "spark.executor.memory": "8g"\n}',
});

const engineOptions = [
  { label: 'Spark 3.3', value: 'spark' },
  { label: 'Presto 0.28', value: 'presto' },
  { label: 'Flink 1.17', value: 'flink' },
  { label: 'Hive 3.1', value: 'hive' },
];

const onSubmit = () => {
  message.success(`开始运行（业务日期 ${form.bizdate.format('YYYY-MM-DD')}）`);
  emit('run');
  emit('update:open', false);
};
</script>
