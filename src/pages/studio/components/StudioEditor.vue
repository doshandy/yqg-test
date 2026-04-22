<template>
  <div class="studio-editor">
    <!-- 顶部 tabs -->
    <div class="tabs-bar">
      <Tabs
        v-model:active-key="innerActiveKey"
        hide-add
        type="editable-card"
        size="small"
        class="task-tabs"
        @edit="onEdit"
        @change="(k) => $emit('change-tab', String(k))"
      >
        <TabPane
          v-for="p in paneList"
          :key="p.key"
          :tab="p.taskName"
          :closable="paneList.length > 1"
        />
      </Tabs>
    </div>

    <!-- 操作工具栏 -->
    <Flex class="tool-bar" align="center" justify="space-between">
      <Flex align="center" gap="small">
        <Tooltip title="运行（Cmd+Enter）">
          <Button type="primary" size="small" :loading="running" @click="$emit('run')">
            <template #icon><PlayCircleOutlined /></template>
            运行
          </Button>
        </Tooltip>
        <Tooltip title="停止">
          <Button size="small" :disabled="!running" @click="$emit('stop')">
            <template #icon><PauseCircleOutlined /></template>
            停止
          </Button>
        </Tooltip>
        <Tooltip title="格式化（Shift+Alt+F）">
          <Button size="small" @click="$emit('format')">
            <template #icon><ClearOutlined /></template>
            格式化
          </Button>
        </Tooltip>
        <Tooltip title="保存（Cmd+S）">
          <Button size="small" @click="$emit('save')">
            <template #icon><SaveOutlined /></template>
            保存
          </Button>
        </Tooltip>
        <Tooltip title="撤销">
          <Button size="small" @click="handleUndo">
            <template #icon><UndoOutlined /></template>
          </Button>
        </Tooltip>
        <Tooltip title="重做">
          <Button size="small" @click="handleRedo">
            <template #icon><RedoOutlined /></template>
          </Button>
        </Tooltip>
      </Flex>
      <Flex align="center" gap="small">
        <Tag color="blue">{{ (activePane?.taskType || 'SQL') }}</Tag>
        <Tooltip title="主题">
          <Select
            v-model:value="theme"
            size="small"
            style="width: 104px"
            :options="themeOptions"
            @change="onThemeChange"
          />
        </Tooltip>
        <Tooltip title="全屏">
          <Button size="small" @click="$emit('fullscreen')">
            <template #icon><FullscreenOutlined /></template>
          </Button>
        </Tooltip>
      </Flex>
    </Flex>

    <!-- 编辑器主体 -->
    <div ref="editorOuter" class="editor-outer" :style="{ height: outerHeight + 'px' }">
      <CodeBox
        v-if="activePane"
        :key="'code-' + activePane.key"
        ref="codeBoxRef"
        v-model="activePane.scriptContent"
        :theme="theme as any"
        height="100%"
        language="sql"
        :cur-sql-params="{ database: activePane.databaseName }"
        :pane-key="activePane.key"
        @format-code="$emit('format')"
        @run-code="$emit('run')"
        @save-code="$emit('save')"
      />
      <!-- 上下拖拽手柄 -->
      <div class="editor-resize-handle" @mousedown="onResizeStart" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import {
  Tabs,
  TabPane,
  Flex,
  Tooltip,
  Button,
  Tag,
  Select,
  message,
} from 'ant-design-vue';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClearOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  FullscreenOutlined,
} from '@ant-design/icons-vue';
import CodeBox from '@/components/sql-editor/code-box.vue';
import CodeThemeStorage from '@/storage/code-theme';

interface Pane {
  key: string | number;
  taskName: string;
  taskType?: string;
  databaseName?: string;
  scriptContent?: string;
  outerHeight?: number;
  [k: string]: unknown;
}

const props = defineProps<{
  paneList: Pane[];
  activeKey: string | number;
  running?: boolean;
}>();

const emit = defineEmits<{
  'run': [];
  'stop': [];
  'format': [];
  'save': [];
  'fullscreen': [];
  'change-tab': [key: string];
  'remove-tab': [key: string | number];
  'update:active-key': [key: string | number];
}>();

const innerActiveKey = ref<string | number>(props.activeKey);
watch(
  () => props.activeKey,
  (v) => { innerActiveKey.value = v; },
);
watch(innerActiveKey, (v) => emit('update:active-key', v));

const activePane = computed(() => props.paneList.find((p) => p.key === innerActiveKey.value));

const codeBoxRef = ref<any>(null);
const editorOuter = ref<HTMLElement | null>(null);
const outerHeight = ref<number>(activePane.value?.outerHeight ?? 420);

watch(
  () => activePane.value?.outerHeight,
  (v) => {
    if (v && v > 0) outerHeight.value = v;
  },
);

const theme = ref<string>(CodeThemeStorage.get() ?? 'vs');
const themeOptions = [
  { label: '浅色', value: 'vs' },
  { label: '深色', value: 'vs-dark' },
  { label: '高对比', value: 'hc-black' },
];
const onThemeChange = (v: string) => {
  CodeThemeStorage.set(v);
};

const handleUndo = () => {
  try {
    const ed = (codeBoxRef.value as any)?.$el?.querySelector('.monaco-editor');
    if (!ed) return message.warn('请先聚焦编辑器');
    document.execCommand('undo');
  } catch {
    // ignore
  }
};
const handleRedo = () => {
  try {
    document.execCommand('redo');
  } catch {
    // ignore
  }
};

const onEdit = (key: string | number, action: 'add' | 'remove') => {
  if (action === 'remove') emit('remove-tab', key);
};

// ========= 上下拖拽 =========
let startY = 0;
let startH = 0;
let raf = 0;
let maxH = 0;
const MIN_H = 120;

function onResizeStart(e: MouseEvent) {
  e.preventDefault();
  if (!editorOuter.value) return;
  startY = e.clientY;
  startH = editorOuter.value.offsetHeight;
  const container = editorOuter.value.closest('.studio-pane-left') as HTMLElement | null;
  maxH = container
    ? container.getBoundingClientRect().height - 120
    : window.innerHeight - 200;
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
}

function onResizeMove(e: MouseEvent) {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    if (!editorOuter.value) return;
    const delta = e.clientY - startY;
    const next = Math.max(MIN_H, Math.min(startH + delta, maxH));
    outerHeight.value = next;
    editorOuter.value.style.height = `${next}px`;
  });
}

function onResizeEnd() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  document.body.style.userSelect = '';
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
  if (activePane.value && editorOuter.value) {
    activePane.value.outerHeight = editorOuter.value.offsetHeight;
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
});

defineExpose({ codeBoxRef });
</script>

<style lang="less" scoped>
.studio-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;

  .tabs-bar {
    flex-shrink: 0;
    padding: 4px 8px 0;
    border-bottom: 1px solid rgba(5, 5, 5, 0.06);

    :deep(.ant-tabs-nav) {
      margin-bottom: 0;
    }
    :deep(.ant-tabs-tab) {
      padding: 4px 10px;
      font-size: 13px;
    }
  }

  .tool-bar {
    flex-shrink: 0;
    height: 40px;
    padding: 0 12px;
    background: #fafafa;
    border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  }

  .editor-outer {
    position: relative;
    flex-shrink: 0;
    min-height: 120px;
    overflow: hidden;
    border-bottom: 1px solid rgba(5, 5, 5, 0.06);

    .editor-resize-handle {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 6px;
      cursor: ns-resize;
      z-index: 10;
      transition: background 0.15s;

      &:hover {
        background: rgba(22, 119, 255, 0.2);
      }
    }
  }
}
</style>
