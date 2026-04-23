<template>
  <div class="task-page">
    <TaskSider @select="onSelect" @create="onCreate" />
    <TaskMain
      v-model:panes="panes"
      v-model:active-key="activeKey"
      @create="onCreate"
      @run="onRun"
    />

    <!-- 挤压式抽屉：作为水平 flex 的子节点，打开时挤压主编辑区 -->
    <BaseInfoDrawer v-model:open="drawers.baseInfo" :task-id="activePane?.taskId" />
    <ParamsDrawer v-model:open="drawers.params" />
    <DateParamsDrawer v-model:open="drawers.dateParams" @run="onRun" />
    <DispatchDrawer v-model:open="drawers.dispatch" />
    <MonitorDrawer v-model:open="drawers.monitor" />
    <QualityDrawer v-model:open="drawers.quality" />
    <VersionDrawer v-model:open="drawers.version" />
    <HistoryDrawer v-model:open="drawers.history" />

    <!-- 右侧固定工具栏 -->
    <div class="right-tools">
      <a-tooltip
        v-for="tool in rightTools"
        :key="tool.key"
        placement="left"
        :title="tool.title"
      >
        <div
          :class="['right-tool-icon', { active: activeTool === tool.key }]"
          @click="toggleTool(tool.key)"
        >
          <component :is="tool.icon" />
        </div>
      </a-tooltip>
    </div>

    <a-modal
      :open="createOpen"
      title="新建任务"
      ok-text="创建"
      @ok="onCreateConfirm"
      @cancel="createOpen = false"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="任务名">
          <a-input v-model:value="createForm.name" placeholder="如 user_active_daily" />
        </a-form-item>
        <a-form-item label="任务类型">
          <a-select v-model:value="createForm.type" :options="taskTypeOptions" />
        </a-form-item>
        <a-form-item label="所属数据库">
          <a-select v-model:value="createForm.database" :options="dbOptions" />
        </a-form-item>
        <a-form-item label="负责人">
          <a-input v-model:value="createForm.owner" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  AlertOutlined,
  CalendarOutlined,
  ControlOutlined,
  DiffOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons-vue';
import TaskSider from './components/TaskSider.vue';
import TaskMain from './components/TaskMain.vue';
import BaseInfoDrawer from './drawers/BaseInfoDrawer.vue';
import ParamsDrawer from './drawers/ParamsDrawer.vue';
import DateParamsDrawer from './drawers/DateParamsDrawer.vue';
import DispatchDrawer from './drawers/DispatchDrawer.vue';
import MonitorDrawer from './drawers/MonitorDrawer.vue';
import QualityDrawer from './drawers/QualityDrawer.vue';
import VersionDrawer from './drawers/VersionDrawer.vue';
import HistoryDrawer from './drawers/HistoryDrawer.vue';
import DataDevelopApi, { type TaskTreeNode } from '@/resources/data-develop';

interface Pane {
  key: string;
  title: string;
  taskId: string;
  content: string;
}

type ToolKey =
  | 'baseInfo'
  | 'params'
  | 'dispatch'
  | 'monitor'
  | 'quality'
  | 'version'
  | 'history'
  | 'dateParams';

const panes = ref<Pane[]>([]);
const activeKey = ref<string>('');
const createOpen = ref(false);

const activePane = computed(() => panes.value.find((p) => p.key === activeKey.value));

const drawers = reactive<Record<ToolKey, boolean>>({
  baseInfo: false,
  params: false,
  dispatch: false,
  monitor: false,
  quality: false,
  version: false,
  history: false,
  dateParams: false,
});

const activeTool = ref<ToolKey | null>(null);

const rightTools: Array<{ key: ToolKey; icon: any; title: string }> = [
  { key: 'baseInfo', icon: h(FileTextOutlined), title: '基本信息' },
  { key: 'params', icon: h(ControlOutlined), title: '资源参数' },
  { key: 'dispatch', icon: h(FieldTimeOutlined), title: '调度配置' },
  { key: 'monitor', icon: h(AlertOutlined), title: '运行监控' },
  { key: 'quality', icon: h(SafetyCertificateOutlined), title: '质量监控' },
  { key: 'version', icon: h(DiffOutlined), title: '版本管理' },
  { key: 'history', icon: h(HistoryOutlined), title: '执行历史' },
  { key: 'dateParams', icon: h(CalendarOutlined), title: '运行参数' },
];

const closeAllDrawers = () => {
  (Object.keys(drawers) as ToolKey[]).forEach((k) => (drawers[k] = false));
};

const toggleTool = (key: ToolKey) => {
  if (activeTool.value === key) {
    activeTool.value = null;
    drawers[key] = false;
  } else {
    closeAllDrawers();
    activeTool.value = key;
    drawers[key] = true;
  }
};

// 当抽屉被关闭（用户点关闭按钮）时，同步工具栏高亮状态
watch(drawers, () => {
  const anyOpen = (Object.keys(drawers) as ToolKey[]).find((k) => drawers[k]);
  if (!anyOpen) activeTool.value = null;
});

const createForm = reactive({
  name: '',
  type: 'SPARK_SQL',
  database: 'dwd_risk',
  owner: 'sunwei',
});

const taskTypeOptions = [
  { label: 'Spark SQL', value: 'SPARK_SQL' },
  { label: 'Hive SQL', value: 'HIVE_SQL' },
  { label: 'Presto', value: 'PRESTO' },
  { label: 'Flink SQL', value: 'FLINK_SQL' },
  { label: 'Notebook', value: 'NOTEBOOK' },
];
const dbOptions = [
  { label: 'dwd_risk', value: 'dwd_risk' },
  { label: 'dwd_ops', value: 'dwd_ops' },
  { label: 'dwd_growth', value: 'dwd_growth' },
  { label: 'dws_user', value: 'dws_user' },
  { label: 'ads_bi', value: 'ads_bi' },
];

const onSelect = async (node: TaskTreeNode) => {
  const existing = panes.value.find((p) => p.key === node.key);
  if (existing) {
    activeKey.value = existing.key;
    return;
  }
  const detail = await DataDevelopApi.fetchTaskDetail(node.id);
  panes.value.push({
    key: node.key,
    title: node.taskName,
    taskId: node.id,
    content: detail.content,
  });
  activeKey.value = node.key;
};

const onCreate = () => {
  createOpen.value = true;
};

const onCreateConfirm = () => {
  if (!createForm.name.trim()) {
    message.warning('请输入任务名');
    return;
  }
  const key = `new-${Date.now()}`;
  panes.value.push({
    key,
    title: createForm.name,
    taskId: key,
    content: `-- 新建任务 ${createForm.name}\n-- 数据库：${createForm.database}\n\nSELECT 1;\n`,
  });
  activeKey.value = key;
  createOpen.value = false;
  createForm.name = '';
  message.success('任务已创建');
};

const onRun = () => {
  // 由 TaskMain 内部处理，这里只做占位以便 DateParamsDrawer 触发时向上透传
};
</script>

<style lang="less" scoped>
.task-page {
  display: flex;
  height: calc(100vh - 60px);
  background: #fff;
  overflow: hidden;
}

.right-tools {
  width: 48px;
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid rgba(5, 5, 5, 0.06);
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .right-tool-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #595959;
    border-radius: 4px;
    font-size: 18px;
    transition: all 0.2s;

    &:hover {
      background-color: #f0f0f0;
      color: #1677ff;
    }

    &.active {
      background-color: #e6f7ff;
      color: #1677ff;
    }
  }
}
</style>
