<template>
  <div class="tag-page">
    <a-form :model="filters" layout="inline" class="tag-search-card">
      <a-form-item label="人群编码">
        <a-input v-model:value="filters.groupCode" allow-clear placeholder="请输入人群编码" style="width: 180px" />
      </a-form-item>
      <a-form-item label="推送属性">
        <a-select v-model:value="filters.metricsCode" allow-clear show-search :options="metricOptions" style="width: 220px" />
      </a-form-item>
      <a-form-item label="推送时间">
        <a-select v-model:value="filters.timing" allow-clear :options="timingOptions" style="width: 150px" />
      </a-form-item>
      <a-form-item label="状态">
        <a-select v-model:value="filters.status" allow-clear :options="statusOptions" style="width: 140px" />
      </a-form-item>
      <a-form-item label="推送系统">
        <a-select v-model:value="filters.application" allow-clear :options="applicationOptions" style="width: 150px" />
      </a-form-item>
      <a-form-item label="是否增量推送">
        <a-select v-model:value="filters.isFullData" allow-clear :options="fullDataOptions" style="width: 150px" />
      </a-form-item>
      <a-form-item label="创建人">
        <a-input v-model:value="filters.creatorName" allow-clear placeholder="请输入创建人" style="width: 160px" />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button @click="handleReset">重置</a-button>
          <a-button type="primary" @click="fetchData">搜索</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <div class="tag-page__toolbar">
      <a-space>
        <a-button type="primary" @click="openEditModal()">新建</a-button>
        <a-button @click="fetchData">刷新</a-button>
      </a-space>
    </div>

    <div class="timing-summary">
      <div class="timing-summary__item">
        <span>任务总数</span>
        <strong>{{ pagination.total || 0 }}</strong>
      </div>
      <div class="timing-summary__item">
        <span>已启用</span>
        <strong>{{ enableCount }}</strong>
      </div>
      <div class="timing-summary__item">
        <span>全量推送</span>
        <strong>{{ fullDataCount }}</strong>
      </div>
      <div class="timing-summary__item">
        <span>推送系统</span>
        <strong>{{ uniqueApplicationCount }}</strong>
      </div>
    </div>

    <a-table
      :data-source="list"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1600 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'metricsCode'">
          <span v-if="!record.metricsCode?.length">/</span>
          <span v-else>{{ getMetricDisplay(record.metricsCode) }}</span>
        </template>
        <template v-else-if="column.key === 'timing'">
          {{ record.timing || record.cron }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'ENABLE' ? 'green' : 'default'">{{ statusLabelMap[record.status] }}</a-tag>
        </template>
        <template v-else-if="column.key === 'isFullData'">
          {{ record.isFullData ? '全量' : '增量' }}
        </template>
        <template v-else-if="column.key === 'op'">
          <a-space wrap>
            <a-popconfirm title="确认执行" :disabled="record.status === 'DISABLE'" @confirm="handleRun(record)">
              <a-button size="small" type="primary" :disabled="record.status === 'DISABLE'">执行</a-button>
            </a-popconfirm>
            <a-popconfirm
              :title="record.status === 'ENABLE' ? '确认下线？' : '确认上线？'"
              @confirm="handleToggle(record)"
            >
              <a-button size="small">{{ record.status === 'ENABLE' ? '下线' : '上线' }}</a-button>
            </a-popconfirm>
            <a-button size="small" type="primary" @click="openEditModal(record)">编辑</a-button>
            <a-popconfirm title="确认删除该任务？" @confirm="handleDelete(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
            <a-button size="small" @click="openTaskDrawer(record)">详细参数</a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="editOpen" :title="form.id ? '编辑定时任务' : '创建定时任务'" width="980px" :confirm-loading="saving" @ok="handleSave">
      <a-tabs v-model:activeKey="editTab">
        <a-tab-pane key="base" tab="基础配置">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 16px"
            message="任务保存后会进入定时调度流程，建议先确认人群、推送属性和 Cron 表达式。"
          />
          <a-form layout="vertical">
            <div class="edit-grid">
              <a-form-item label="任务ID">
                <a-input v-model:value="form.taskCode" placeholder="请输入任务ID" />
              </a-form-item>
              <a-form-item label="任务名称">
                <a-input v-model:value="form.taskName" placeholder="请输入任务名称" />
              </a-form-item>
              <a-form-item label="人群ID" required>
                <a-select v-model:value="form.groupCode" show-search :options="groupOptions" placeholder="请选择人群ID" />
              </a-form-item>
              <a-form-item label="人群名称">
                <a-input :value="linkedGroupName" disabled />
              </a-form-item>
              <a-form-item label="推送属性">
                <a-select v-model:value="form.metricsCode" mode="multiple" :options="metricOptions" placeholder="支持多选推送属性" />
              </a-form-item>
              <a-form-item label="推送时间">
                <a-select v-model:value="form.timing" :options="timingOptions" />
              </a-form-item>
              <a-form-item label="推送系统">
                <a-select v-model:value="form.application" :options="applicationOptions" />
              </a-form-item>
              <a-form-item label="是否增量推送">
                <a-switch v-model:checked="formIsFullDataSwitch" checked-children="全量" un-checked-children="增量" />
              </a-form-item>
              <a-form-item label="重跑类型">
                <a-select v-model:value="form.type" :options="executeTypeOptions" />
              </a-form-item>
              <a-form-item label="状态">
                <a-select v-model:value="form.status" :options="statusOptions" />
              </a-form-item>
              <a-form-item label="Cron 表达式" class="grid-span-2">
                <a-input v-model:value="form.cron" placeholder="例如 0 0 9 * * ?" />
              </a-form-item>
            </div>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="push" tab="推送配置">
          <a-alert
            type="warning"
            show-icon
            style="margin-bottom: 16px"
            message="推送配置会和任务参数一起校验，保存后建议在“详细参数”中确认任务节点状态。"
          />
          <a-form layout="vertical">
            <div class="edit-grid">
              <a-form-item label="推送方式">
                <a-select v-model:value="form.pushType" :options="pushTypeOptions" />
              </a-form-item>
              <a-form-item label="创建人">
                <a-input v-model:value="form.creatorName" placeholder="请输入创建人" />
              </a-form-item>
              <a-form-item label="主题 Topic">
                <a-input v-model:value="pushConf.topic" placeholder="请输入消息主题" />
              </a-form-item>
              <a-form-item label="推送地址">
                <a-input v-model:value="pushConf.server" placeholder="请输入地址或服务名" />
              </a-form-item>
              <a-form-item label="任务说明" class="grid-span-2">
                <a-alert
                  type="info"
                  show-icon
                  message="保存前会结合推送配置和任务参数进行校验，提交后进入定时任务流程。"
                />
              </a-form-item>
            </div>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <a-drawer v-model:open="taskDrawerOpen" title="详细参数" width="920px">
      <div class="timing-task-summary">
        <div class="timing-task-summary__item">
          <span>任务ID</span>
          <strong>{{ currentTask?.taskCode || '-' }}</strong>
        </div>
        <div class="timing-task-summary__item">
          <span>推送系统</span>
          <strong>{{ currentTask?.application || '-' }}</strong>
        </div>
        <div class="timing-task-summary__item">
          <span>任务状态</span>
          <strong>
            <a-tag :color="currentTask?.status === 'ENABLE' ? 'green' : 'default'">
              {{ statusLabelMap[currentTask?.status || 'DISABLE'] }}
            </a-tag>
          </strong>
        </div>
        <div class="timing-task-summary__item">
          <span>下次执行时间</span>
          <strong>{{ currentTask?.nextRunTime || '-' }}</strong>
        </div>
      </div>
      <a-tabs v-model:activeKey="taskTab">
        <a-tab-pane key="config" tab="任务配置">
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="任务ID">{{ currentTask?.taskCode }}</a-descriptions-item>
            <a-descriptions-item label="任务名称">{{ currentTask?.taskName }}</a-descriptions-item>
            <a-descriptions-item label="人群ID">{{ currentTask?.groupCode }}</a-descriptions-item>
            <a-descriptions-item label="人群名称">{{ currentTask?.groupName }}</a-descriptions-item>
            <a-descriptions-item label="推送属性">{{ getMetricDisplay(currentTask?.metricsCode) }}</a-descriptions-item>
            <a-descriptions-item label="推送时间">{{ currentTask?.timing || currentTask?.cron }}</a-descriptions-item>
            <a-descriptions-item label="推送系统">{{ currentTask?.application }}</a-descriptions-item>
            <a-descriptions-item label="推送方式">{{ currentTask?.pushType || '-' }}</a-descriptions-item>
            <a-descriptions-item label="是否增量推送">{{ currentTask?.isFullData ? '全量' : '增量' }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ statusLabelMap[currentTask?.status || 'DISABLE'] }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="task" tab="任务节点">
          <a-table :data-source="taskSteps" :columns="taskColumns" :pagination="false" row-key="name" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'SUCCESS' ? 'green' : record.status === 'SKIPPED' ? 'default' : record.status === 'PENDING' ? 'gold' : 'processing'">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-if="column.key === 'detail'">
                <a-button size="small" @click="openStepDetail(record)">查看细节</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-drawer>

    <a-modal v-model:open="stepDetailOpen" title="任务细节" :footer="null" width="760px">
      <template v-if="currentStepDetail">
        <div class="timing-step-overview">
          <div class="timing-step-overview__item">
            <span>节点序号</span>
            <strong>{{ currentStepDetail.stepIndex || '-' }}</strong>
          </div>
          <div class="timing-step-overview__item">
            <span>任务ID</span>
            <strong>{{ currentStepDetail.taskId || '-' }}</strong>
          </div>
          <div class="timing-step-overview__item">
            <span>节点状态</span>
            <strong>
              <a-tag
                :color="currentStepDetail.status === 'SUCCESS' ? 'green' : currentStepDetail.status === 'SKIPPED' ? 'default' : currentStepDetail.status === 'PENDING' ? 'gold' : currentStepDetail.status === 'FAILED' ? 'red' : 'processing'"
              >
                {{ stepStatusLabelMap[currentStepDetail.status || 'PENDING'] || currentStepDetail.status || '-' }}
              </a-tag>
            </strong>
          </div>
          <div class="timing-step-overview__item">
            <span>任务名称</span>
            <strong>{{ currentStepDetail.taskName || '-' }}</strong>
          </div>
        </div>
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="节点名称">{{ currentStepDetail.nodeName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="执行人">{{ currentStepDetail.executor || '-' }}</a-descriptions-item>
          <a-descriptions-item label="触发时间">{{ currentStepDetail.triggerTime || '-' }}</a-descriptions-item>
          <a-descriptions-item label="耗时">{{ currentStepDetail.duration || '-' }}</a-descriptions-item>
          <a-descriptions-item label="推送系统">{{ currentStepDetail.application || '-' }}</a-descriptions-item>
          <a-descriptions-item label="说明">{{ currentStepDetail.message || '-' }}</a-descriptions-item>
          <a-descriptions-item label="Topic">{{ currentStepDetail.pushConf?.topic || '-' }}</a-descriptions-item>
          <a-descriptions-item label="推送服务">{{ currentStepDetail.pushConf?.server || '-' }}</a-descriptions-item>
        </a-descriptions>
        <div class="timing-step-logs">
          <div class="timing-step-logs__title">节点日志</div>
          <a-empty v-if="!(currentStepDetail.logs || []).length" description="当前节点暂无日志输出" />
          <a-timeline v-else>
            <a-timeline-item v-for="(item, index) in currentStepDetail.logs || []" :key="`${index}-${item}`">
              {{ item }}
            </a-timeline-item>
          </a-timeline>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { message } from 'ant-design-vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type GroupItem, type MetricItem, type TimingItem } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';

type EditFormState = Partial<TimingItem>;

type TaskStepDetail = {
  nodeName?: string;
  executor?: string;
  triggerTime?: string;
  duration?: string;
  application?: string;
  message?: string;
  logs?: string[];
  taskId?: string;
  taskName?: string;
  stepIndex?: number;
  status?: string;
  pushConf?: TimingItem['pushConf'];
};

type TaskStepRow = {
  name: string;
  status: string;
  detail: TaskStepDetail;
};

const loading = ref(false);
const saving = ref(false);
const editOpen = ref(false);
const taskDrawerOpen = ref(false);
const stepDetailOpen = ref(false);
const editTab = ref('base');
const taskTab = ref('config');
const list = ref<TimingItem[]>([]);
const metricsList = ref<MetricItem[]>([]);
const groupsList = ref<GroupItem[]>([]);
const currentTask = ref<TimingItem | null>(null);
const taskSteps = ref<TaskStepRow[]>([]);
const currentStepDetail = ref<TaskStepDetail | null>(null);

const filters = reactive({
  groupCode: '',
  metricsCode: undefined as string | undefined,
  timing: undefined as string | undefined,
  status: undefined as string | undefined,
  application: undefined as string | undefined,
  isFullData: undefined as string | undefined,
  creatorName: '',
});

const form = reactive<EditFormState>({
  taskCode: '',
  taskName: '',
  groupCode: '',
  groupName: '',
  metricsCode: [],
  timing: '每天 09:00',
  cron: '0 0 9 * * ?',
  application: 'barrett',
  isFullData: true,
  type: 'FULL',
  pushType: 'KAFKA',
  pushConf: {
    topic: 'tag_timing_topic_new',
    server: 'push-1.internal',
  },
  creatorName: 'demo_user',
  owner: 'demo_user',
  status: 'ENABLE',
  targetType: 'TAG',
});

const pushConf = reactive({
  topic: 'tag_timing_topic_new',
  server: 'push-1.internal',
});

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const columns = [
  { title: '任务ID', dataIndex: 'taskCode', key: 'taskCode', width: 140 },
  { title: '人群ID', dataIndex: 'groupCode', key: 'groupCode', width: 140 },
  { title: '人群名称', dataIndex: 'groupName', key: 'groupName', width: 160 },
  { title: '推送属性', key: 'metricsCode', width: 240 },
  { title: '推送时间', key: 'timing', width: 150 },
  { title: '状态', key: 'status', width: 110 },
  { title: '推送系统', dataIndex: 'application', key: 'application', width: 120 },
  { title: '是否增量推送', key: 'isFullData', width: 140 },
  { title: '创建人', dataIndex: 'creatorName', key: 'creatorName', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'op', width: 300, fixed: 'right' as const },
];

const taskColumns = [
  { title: '步骤', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '细节', key: 'detail', width: 120 },
];

const statusLabelMap: Record<string, string> = {
  ENABLE: '已启用',
  DISABLE: '已停用',
};

const stepStatusLabelMap: Record<string, string> = {
  SUCCESS: '成功',
  SKIPPED: '跳过',
  PENDING: '等待中',
  RUNNING: '运行中',
  FAILED: '失败',
};

const timingOptions = ['每天 09:00', '每周一 11:00', '每天 02:30', '每30分钟'].map((value) => ({ label: value, value }));
const statusOptions = Object.entries(statusLabelMap).map(([value, label]) => ({ value, label }));
const applicationOptions = ['barrett', 'apollo', 'odin'].map((value) => ({ label: value, value }));
const fullDataOptions = [
  { label: '全量', value: 'true' },
  { label: '增量', value: 'false' },
];
const executeTypeOptions = [
  { label: '全量重跑', value: 'FULL' },
  { label: '失败重跑', value: 'RETRY' },
  { label: '增量重跑', value: 'INCREMENTAL' },
];
const pushTypeOptions = [
  { label: 'KAFKA', value: 'KAFKA' },
  { label: 'HTTP', value: 'HTTP' },
];

const metricOptions = computed(() =>
  metricsList.value.map((item) => ({
    label: `${item.metricsCode || item.code} / ${item.metricsName || item.name}`,
    value: item.metricsCode || item.code,
  })),
);

const groupOptions = computed(() =>
  groupsList.value.map((item) => ({
    label: `${item.groupCode} / ${item.groupName}`,
    value: item.groupCode,
  })),
);

const linkedGroupName = computed(() => groupsList.value.find((item) => item.groupCode === form.groupCode)?.groupName || '');
const enableCount = computed(() => list.value.filter((item) => item.status === 'ENABLE').length);
const fullDataCount = computed(() => list.value.filter((item) => item.isFullData).length);
const uniqueApplicationCount = computed(() => new Set(list.value.map((item) => item.application).filter(Boolean)).size);
const formIsFullDataSwitch = computed({
  get: () => Boolean(form.isFullData),
  set: (value: boolean) => {
    form.isFullData = value;
  },
});

watch(
  () => form.groupCode,
  (value) => {
    if (!value) return;
    const hit = groupsList.value.find((item) => item.groupCode === value);
    if (hit) {
      form.groupName = hit.groupName;
      form.targetType = hit.sourceType === 'SQL' ? 'GROUP' : 'TAG';
    }
  },
);

function resetForm() {
  Object.assign(form, {
    id: undefined,
    taskCode: '',
    taskName: '',
    groupCode: '',
    groupName: '',
    metricsCode: [],
    timing: '每天 09:00',
    cron: '0 0 9 * * ?',
    application: 'barrett',
    isFullData: true,
    type: 'FULL',
    pushType: 'KAFKA',
    creatorName: 'demo_user',
    owner: 'demo_user',
    status: 'ENABLE',
    targetType: 'TAG',
  });
  pushConf.topic = 'tag_timing_topic_new';
  pushConf.server = 'push-1.internal';
}

function syncPushConfToForm() {
  form.pushConf = {
    topic: pushConf.topic,
    server: pushConf.server,
  };
}

async function fetchBaseOptions() {
  const [metricsRes, groupsRes] = await Promise.all([
    TagApi.fetchMetrics({ pageNo: 1, pageSize: 200 }),
    TagApi.fetchGroups({ pageNo: 1, pageSize: 200 }),
  ]);
  metricsList.value = metricsRes.items;
  groupsList.value = groupsRes.items;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchTimings({
      groupCode: filters.groupCode || undefined,
      metricsCode: filters.metricsCode || undefined,
      timing: filters.timing || undefined,
      status: filters.status || undefined,
      application: filters.application || undefined,
      isFullData: filters.isFullData || undefined,
      creatorName: filters.creatorName || undefined,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items;
    pagination.total = res.total;
  } catch (error) {
    console.error(error);
    message.error('定时任务列表加载失败');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  filters.groupCode = '';
  filters.metricsCode = undefined;
  filters.timing = undefined;
  filters.status = undefined;
  filters.application = undefined;
  filters.isFullData = undefined;
  filters.creatorName = '';
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function getMetricDisplay(codes?: string[]) {
  if (!codes?.length) return '/';
  return codes
    .map((code) => metricsList.value.find((item) => (item.metricsCode || item.code) === code)?.metricsName || code)
    .join(', ');
}

function openEditModal(record?: TimingItem) {
  resetForm();
  if (record) {
    Object.assign(form, safeClone(record));
    pushConf.topic = record.pushConf?.topic || 'tag_timing_topic_new';
    pushConf.server = record.pushConf?.server || 'push-1.internal';
  }
  editTab.value = 'base';
  editOpen.value = true;
}

async function handleSave() {
  if (!form.groupCode || !form.taskCode || !form.taskName) {
    message.warning('请先填写任务ID、任务名称和人群ID');
    return;
  }
  saving.value = true;
  try {
    syncPushConfToForm();
    await TagApi.saveTiming({
      ...form,
      groupName: linkedGroupName.value || form.groupName,
      owner: form.creatorName || form.owner || 'demo_user',
    });
    message.success(form.id ? '定时任务更新成功' : '定时任务创建成功');
    editOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('定时任务保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  try {
    await TagApi.deleteTiming(id);
    message.success('定时任务删除成功');
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('定时任务删除失败');
  }
}

async function handleRun(record: TimingItem) {
  try {
    await TagApi.runTiming(record.id);
    message.success('执行成功');
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('执行失败');
  }
}

async function handleToggle(record: TimingItem) {
  try {
    await TagApi.toggleTimingStatus(record.id);
    message.success(record.status === 'ENABLE' ? '下线成功' : '上线成功');
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('状态切换失败');
  }
}

async function openTaskDrawer(record: TimingItem) {
  currentTask.value = record;
  taskTab.value = 'config';
  const res = await TagApi.fetchTimingTaskDetail(record.id);
  taskSteps.value = res.steps.map((step, index) => ({
    ...step,
    detail: {
      taskId: record.taskCode,
      taskName: record.taskName,
      stepIndex: index + 1,
      triggerTime: step.detail?.triggerTime || record.updateTime,
      application: step.detail?.application || record.application,
      pushConf: record.pushConf,
      status: step.status,
      ...safeClone(step.detail || {}),
    },
  }));
  taskDrawerOpen.value = true;
}

function openStepDetail(step: TaskStepRow) {
  currentStepDetail.value = step.detail;
  stepDetailOpen.value = true;
}

onMounted(async () => {
  await Promise.all([fetchBaseOptions(), fetchData()]);
});
</script>

<style lang="less" scoped>
.tag-page {
  padding: 20px;
  background: #fff;
  min-height: 100%;
}

.tag-page__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.timing-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.timing-summary__item {
  padding: 14px 16px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 14px;
  background: #fafcff;
}

.timing-summary__item span {
  color: #8c8c8c;
  font-size: 12px;
}

.timing-summary__item strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 22px;
}

.timing-task-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.timing-task-summary__item,
.timing-step-overview__item {
  padding: 14px 16px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 14px;
  background: linear-gradient(180deg, #fafcff 0%, #f5f8fd 100%);
}

.timing-task-summary__item span,
.timing-step-overview__item span {
  color: #8c8c8c;
  font-size: 12px;
}

.timing-task-summary__item strong,
.timing-step-overview__item strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 15px;
  font-weight: 600;
}

.timing-step-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.timing-step-logs {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 14px;
  background: #fafcff;
}

.timing-step-logs__title {
  margin-bottom: 12px;
  color: #101828;
  font-weight: 600;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.grid-span-2 {
  grid-column: span 2;
}
</style>
