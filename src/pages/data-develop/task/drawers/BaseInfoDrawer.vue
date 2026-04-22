<template>
  <PushDrawer
    :open="open"
    title="基本信息"
    :width="520"
    @update:open="emit('update:open', $event)"
  >
    <a-skeleton v-if="loading" active />
    <a-descriptions v-else :column="1" bordered size="small">
      <a-descriptions-item label="任务 ID">{{ detail?.taskId }}</a-descriptions-item>
      <a-descriptions-item label="任务名">{{ detail?.taskName }}</a-descriptions-item>
      <a-descriptions-item label="任务类型">
        <a-tag color="blue">{{ detail?.taskType }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="所属数据库">{{ detail?.database }}</a-descriptions-item>
      <a-descriptions-item label="负责人">{{ detail?.owner }}</a-descriptions-item>
      <a-descriptions-item label="优先级">
        <a-tag :color="priorityColor(detail?.priority)">{{ detail?.priority }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="重试次数">{{ detail?.retryTimes }}</a-descriptions-item>
      <a-descriptions-item label="超时时间">{{ detail?.timeout }} 秒</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ detail?.createdAt }}</a-descriptions-item>
      <a-descriptions-item label="最近修改">{{ detail?.updatedAt }}</a-descriptions-item>
      <a-descriptions-item label="描述">{{ detail?.description }}</a-descriptions-item>
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
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type TaskDetail } from '@/resources/data-develop';

const props = defineProps<{ open: boolean; taskId?: string }>();
const emit = defineEmits<{
  (e: 'update:open', v: boolean): void;
}>();

const loading = ref(false);
const detail = ref<TaskDetail>();

const priorityColor = (p?: string) => {
  switch (p) {
    case 'P0': return 'red';
    case 'P1': return 'orange';
    case 'P2': return 'gold';
    default: return 'default';
  }
};

const loadDetail = async () => {
  if (!props.taskId) return;
  loading.value = true;
  try {
    detail.value = await DataDevelopApi.fetchTaskDetail(props.taskId);
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.open, props.taskId] as const,
  ([op, id]) => {
    if (op && id) loadDetail();
  },
);

const onSave = () => {
  message.success('保存成功（演示）');
  emit('update:open', false);
};
</script>
