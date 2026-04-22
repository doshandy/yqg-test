<template>
  <div class="studio-pane">
    <div class="studio-pane-left">
      <StudioEditor
        v-model:active-key="innerActiveKey"
        :pane-list="paneList"
        :running="running"
        @run="$emit('run')"
        @stop="$emit('stop')"
        @format="$emit('format')"
        @save="$emit('save')"
        @fullscreen="$emit('fullscreen')"
        @remove-tab="(k) => $emit('remove-tab', k)"
      />
      <StudioResultContent
        ref="resultRef"
        :result-list="activePane?.resultList || []"
        @fold-change="onFoldChange"
        @update:resultList="(list) => $emit('update-result-list', list)"
      />
    </div>

    <!-- Copilot 挤压式面板（push-drawer 风格）：打开时占据一列，自然挤压左侧编辑区。
         替换/回退代码通过 pageOperationManager 直接通知宿主页，不再走 emit 透传链 -->
    <div v-if="copilotVisible" class="studio-pane-copilot">
      <Copilot
        ref="copilotRef"
        :task-code="String(activePane?.key ?? '')"
        :task-name="activePane?.taskName"
        :current-script-content="(activePane?.scriptContent as string) ?? ''"
        @close="closeCopilot"
        @copilot-reply-loading="onCopilotLoading"
      />
    </div>

    <!-- 右侧 50px 图标栏 -->
    <div class="studio-pane-right">
      <Tooltip placement="left" title="Copilot AI 助手">
        <div
          class="right-tool-icon copilot-icon"
          :class="{ active: copilotVisible }"
          @click="toggleCopilot"
        >
          <RobotOutlined />
        </div>
      </Tooltip>

      <div class="right-tool-divider" />

      <Tooltip
        v-for="tool in rightTools"
        :key="tool.key"
        placement="left"
        :title="tool.title"
      >
        <div
          class="right-tool-icon"
          :class="{ active: activeTool === tool.key }"
          @click="handleToolClick(tool.key)"
        >
          <component :is="tool.icon" />
        </div>
      </Tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref, watch } from 'vue';
import { Tooltip } from 'ant-design-vue';
import {
  ControlOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  AlertOutlined,
  DiffOutlined,
  CalendarOutlined,
  RobotOutlined,
} from '@ant-design/icons-vue';
import StudioEditor from './StudioEditor.vue';
import StudioResultContent from './StudioResultContent.vue';
import Copilot from '@/components/copilot/copilot.vue';

interface Pane {
  key: string | number;
  taskName: string;
  scriptContent?: string;
  resultList?: Array<{ key: string | number; status?: string }>;
  [k: string]: unknown;
}

const props = defineProps<{
  paneList: Pane[];
  activeKey: string | number;
  running?: boolean;
  activeTool?: string | null;
}>();

const emit = defineEmits<{
  'run': [];
  'stop': [];
  'format': [];
  'save': [];
  'fullscreen': [];
  'remove-tab': [key: string | number];
  'update:active-key': [key: string | number];
  'update-result-list': [list: Pane['resultList']];
  'tool-click': [key: string];
}>();

const innerActiveKey = ref<string | number>(props.activeKey);
watch(
  () => props.activeKey,
  (v) => { innerActiveKey.value = v; },
);
watch(innerActiveKey, (v) => emit('update:active-key', v));

const activePane = computed(() => props.paneList.find((p) => p.key === innerActiveKey.value));

const rightTools = [
  { key: 'resource', icon: h(ControlOutlined), title: '资源参数' },
  { key: 'basicInfo', icon: h(FileTextOutlined), title: '基本信息' },
  { key: 'schedule', icon: h(FieldTimeOutlined), title: '调度配置' },
  { key: 'monitor', icon: h(AlertOutlined), title: '运行监控' },
  { key: 'version', icon: h(DiffOutlined), title: '版本管理' },
  { key: 'history', icon: h(HistoryOutlined), title: '执行历史' },
  { key: 'date', icon: h(CalendarOutlined), title: '日期参数' },
];

const handleToolClick = (key: string) => {
  emit('tool-click', key);
};

// ---------- Copilot 面板控制 ----------
const copilotVisible = ref(false);
const copilotLoading = ref(false);
const copilotRef = ref<InstanceType<typeof Copilot> | null>(null);

const toggleCopilot = () => {
  copilotVisible.value = !copilotVisible.value;
};

const closeCopilot = () => {
  copilotVisible.value = false;
  copilotLoading.value = false;
};

const onCopilotLoading = (loading: boolean) => {
  copilotLoading.value = loading;
};

defineExpose({
  copilotVisible,
  openCopilot: () => { copilotVisible.value = true; },
  closeCopilot,
  addCopilotContextTag: (tag: unknown) => {
    copilotRef.value?.addContextTag?.(tag);
  },
});

const resultRef = ref<InstanceType<typeof StudioResultContent> | null>(null);
const onFoldChange = (_folded: boolean) => {
  // 折叠状态可选择同步到编辑器高度等，这里暂时仅用于视觉变化
};
</script>

<style lang="less" scoped>
.studio-pane {
  display: flex;
  height: 100%;
  background: #fff;

  .studio-pane-left {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid rgba(5, 5, 5, 0.06);
  }

  .studio-pane-copilot {
    width: 480px;
    flex-shrink: 0;
    min-width: 360px;
    max-width: 720px;
    border-left: 1px solid rgba(5, 5, 5, 0.06);
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .studio-pane-right {
    width: 50px;
    flex-shrink: 0;
    padding: 8px;
    border-left: 1px solid rgba(5, 5, 5, 0.06);

    .right-tool-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      cursor: pointer;
      color: #595959;
      border-radius: 4px;
      font-size: 18px;
      transition: all 0.2s;

      &:hover {
        background: #f0f0f0;
        color: #1677ff;
      }

      &.active {
        background: #e6f7ff;
        color: #1677ff;
      }

      &.copilot-icon {
        color: #722ed1;

        &:hover,
        &.active {
          background: #f9f0ff;
          color: #722ed1;
        }
      }
    }

    .right-tool-divider {
      height: 1px;
      background: rgba(5, 5, 5, 0.06);
      margin: 4px 0 12px;
    }
  }
}
</style>
