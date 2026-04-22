<template>
  <PushDrawer
    :open="open"
    title="调度配置"
    :width="780"
    @update:open="emit('update:open', $event)"
  >
    <a-skeleton v-if="loading" active :paragraph="{ rows: 8 }" />
    <a-tabs v-else v-model:activeKey="activeKey">
      <a-tab-pane key="basic" tab="基本调度">
        <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
          <a-form-item label="启动日期">
            <a-input :value="config.startDate" readonly />
          </a-form-item>
          <a-form-item label="结束日期">
            <a-input :value="config.endDate" readonly />
          </a-form-item>
          <a-form-item label="Cron 表达式">
            <a-input v-model:value="config.cron" placeholder="0 0 2 * * ?" />
          </a-form-item>
          <a-form-item label="调度周期">
            <a-radio-group v-model:value="cycle">
              <a-radio-button value="DAY">天</a-radio-button>
              <a-radio-button value="HOUR">小时</a-radio-button>
              <a-radio-button value="WEEK">周</a-radio-button>
              <a-radio-button value="MONTH">月</a-radio-button>
            </a-radio-group>
          </a-form-item>
          <a-form-item label="重试次数">
            <a-input-number v-model:value="config.retryTimes" :min="0" :max="10" />
          </a-form-item>
          <a-form-item label="超时（秒）">
            <a-input-number v-model:value="config.timeout" :min="60" :max="86400" :step="60" />
          </a-form-item>
        </a-form>
      </a-tab-pane>
      <a-tab-pane key="depend" tab="上游依赖">
        <a-button type="dashed" size="small" style="margin-bottom: 10px">+ 新增依赖</a-button>
        <a-table
          :columns="dependColumns"
          :data-source="config.dependencies"
          :pagination="false"
          size="small"
          row-key="taskName"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'strict'">
              <a-tag :color="record.strict ? 'red' : 'default'">{{ record.strict ? '强依赖' : '弱依赖' }}</a-tag>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="strategy" tab="失败策略">
        <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
          <a-form-item label="成功后动作">
            <a-select v-model:value="config.onSuccess" mode="tags" :options="actionOptions" />
          </a-form-item>
          <a-form-item label="失败后动作">
            <a-select v-model:value="config.onFailure" mode="tags" :options="actionOptions" />
          </a-form-item>
          <a-form-item label="并发策略">
            <a-radio-group v-model:value="concurrent">
              <a-radio value="SERIAL">串行</a-radio>
              <a-radio value="PARALLEL">并行</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-form>
      </a-tab-pane>
      <a-tab-pane key="fault" tab="容灾配置">
        <a-alert
          message="跨集群容灾配置，确保生产任务具备高可用保障。"
          type="info"
          show-icon
          style="margin-bottom: 12px"
        />
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="主集群">cn-prd-01（默认）</a-descriptions-item>
          <a-descriptions-item label="备集群">cn-prd-02</a-descriptions-item>
          <a-descriptions-item label="切换策略">主集群失败后自动切换</a-descriptions-item>
          <a-descriptions-item label="告警接收人">数据平台告警群</a-descriptions-item>
        </a-descriptions>
      </a-tab-pane>
    </a-tabs>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px">
        <a-button @click="emit('update:open', false)">取消</a-button>
        <a-button type="primary" @click="onSave">保存并提交</a-button>
      </div>
    </template>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type ScheduleConfig } from '@/resources/data-develop';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

const loading = ref(false);
const activeKey = ref('basic');
const cycle = ref<'DAY' | 'HOUR' | 'WEEK' | 'MONTH'>('DAY');
const concurrent = ref<'SERIAL' | 'PARALLEL'>('SERIAL');

const config = reactive<ScheduleConfig>({
  cron: '',
  startDate: '',
  endDate: '',
  retryTimes: 0,
  timeout: 0,
  onSuccess: [],
  onFailure: [],
  dependencies: [],
});

const actionOptions = [
  { label: '发钉钉', value: '发钉钉' },
  { label: '发邮件', value: '发邮件' },
  { label: '写入监控', value: '写入监控' },
  { label: '告警升级', value: '告警升级' },
];

const dependColumns = [
  { title: '依赖任务', dataIndex: 'taskName' },
  { title: '偏移', dataIndex: 'offset', width: 80 },
  { title: '类型', dataIndex: 'strict', width: 100 },
];

const load = async () => {
  loading.value = true;
  try {
    const res = await DataDevelopApi.fetchSchedule();
    Object.assign(config, res);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  (v) => { if (v) load(); },
);

const onSave = () => {
  message.success('调度配置已保存（演示）');
  emit('update:open', false);
};
</script>
