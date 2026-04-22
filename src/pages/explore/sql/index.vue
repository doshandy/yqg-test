<!--
  SQL 查询模块（UI 骨架）

  布局：
    [40px 图标栏] [可展开左面板] [中间 Tab 编辑器] [挤压式抽屉 ×2] [40px 右图标栏]
  抽屉采用挤压式，不覆盖主编辑区。
-->
<template>
  <div class="sql">
    <div class="left-icon-bar">
      <a-tooltip v-for="item in leftIcons" :key="item.key" :title="item.title" placement="right">
        <div
          :class="['icon-btn', { active: activeLeftKey === item.key }]"
          @click="toggleLeftPanel(item.key)"
        >
          <component :is="item.icon" />
        </div>
      </a-tooltip>
    </div>

    <div v-if="activeLeftKey" class="left-sider" :style="{ width: leftSiderWidth + 'px' }">
      <div class="sider-content">
        <TablePanel v-if="activeLeftKey === 'table'" @pick-table="onPickTable" />
        <FolderPanel v-else-if="activeLeftKey === 'folder'" @pick-file="onPickFile" />
        <AnalysisPanel v-else-if="activeLeftKey === 'task'" @pick-task="onPickTask" />
      </div>
      <div class="collapse-btn" @click="toggleLeftPanel(activeLeftKey)">
        <LeftOutlined />
      </div>
    </div>

    <SqlMain ref="mainRef" class="main-control" :databases="databases" />

    <HistoryDrawer
      v-model:open="drawers.history"
      @open-tab="openSqlInNewTab"
    />
    <UploadDrawer
      v-model:open="drawers.upload"
      @open-tab="openSqlInNewTab"
    />

    <div class="right-icon-bar">
      <a-tooltip
        v-for="item in rightIcons"
        :key="item.key"
        :title="item.title"
        placement="left"
      >
        <div
          :class="['icon-btn', { active: activeRightKey === item.key }]"
          @click="toggleRightDrawer(item.key)"
        >
          <component :is="item.icon" />
        </div>
      </a-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  BranchesOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  LeftOutlined,
  TableOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import TablePanel from './components/TablePanel.vue';
import FolderPanel from './components/FolderPanel.vue';
import AnalysisPanel from './components/AnalysisPanel.vue';
import SqlMain from './components/SqlMain.vue';
import HistoryDrawer from './drawers/HistoryDrawer.vue';
import UploadDrawer from './drawers/UploadDrawer.vue';
import ExploreApi, {
  type AnalysisTaskNode,
  type FolderNode,
} from '@/resources/explore';

type LeftKey = '' | 'table' | 'folder' | 'task';
type RightKey = '' | 'history' | 'upload';

const LEFT_SIDER_WIDTH_KEY = 'test-sql-left-width';
const LEFT_ACTIVE_KEY = 'test-sql-left-active';

const leftSiderWidth = ref(280);
const activeLeftKey = ref<LeftKey>('table');
const activeRightKey = ref<RightKey>('');

const drawers = reactive({
  history: false,
  upload: false,
});

const databases = ref<Array<{ label: string; value: string }>>([]);
const mainRef = ref<InstanceType<typeof SqlMain> | null>(null);

const leftIcons = [
  { key: 'table' as const, title: '库表', icon: h(TableOutlined) },
  { key: 'folder' as const, title: '文件夹', icon: h(FolderOpenOutlined) },
  { key: 'task' as const, title: '分析节点', icon: h(BranchesOutlined) },
];

const rightIcons = [
  { key: 'history' as const, title: '历史记录', icon: h(HistoryOutlined) },
  { key: 'upload' as const, title: '创建临时表', icon: h(UploadOutlined) },
];

function toggleLeftPanel(key: LeftKey) {
  activeLeftKey.value = activeLeftKey.value === key ? '' : key;
  localStorage.setItem(LEFT_ACTIVE_KEY, activeLeftKey.value);
}

function toggleRightDrawer(key: RightKey) {
  if (activeRightKey.value === key) {
    activeRightKey.value = '';
    drawers.history = false;
    drawers.upload = false;
    return;
  }
  drawers.history = key === 'history';
  drawers.upload = key === 'upload';
  activeRightKey.value = key;
}

function onPickTable(dbTable: string) {
  const sql = `SELECT * FROM ${dbTable} LIMIT 100;`;
  mainRef.value?.openTabWithSql(sql);
}

function onPickFile(file: FolderNode) {
  message.info(`加载文件：${file.title}（Demo）`);
  mainRef.value?.openTabWithSql(`-- ${file.title}\nSELECT 1;`);
}

function onPickTask(task: AnalysisTaskNode) {
  mainRef.value?.openTaskTab(task.key, task.title);
}

function openSqlInNewTab(sql: string) {
  mainRef.value?.openTabWithSql(sql);
}

async function loadDatabases() {
  try {
    databases.value = await ExploreApi.fetchDatabases();
  } catch (e) {
    // noop
  }
}

onMounted(() => {
  const savedWidth = localStorage.getItem(LEFT_SIDER_WIDTH_KEY);
  if (savedWidth) leftSiderWidth.value = Math.max(240, parseInt(savedWidth, 10) || 280);

  const savedKey = localStorage.getItem(LEFT_ACTIVE_KEY);
  if (savedKey !== null && ['', 'table', 'folder', 'task'].includes(savedKey)) {
    activeLeftKey.value = savedKey as LeftKey;
  }

  loadDatabases();
});
</script>

<style lang="less" scoped>
.sql {
  display: flex;
  height: calc(100vh - 60px);
  background: #fff;
  overflow: hidden;
}

.left-icon-bar,
.right-icon-bar {
  width: 40px;
  flex-shrink: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
}
.left-icon-bar {
  border-right: 1px solid rgba(5, 5, 5, 0.06);
}
.right-icon-bar {
  border-left: 1px solid rgba(5, 5, 5, 0.06);
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.45);
  transition: all 0.2s;
  &:hover {
    color: rgba(0, 0, 0, 0.88);
    background-color: rgba(0, 0, 0, 0.04);
  }
  &.active {
    color: #1677ff;
    background-color: rgba(22, 119, 255, 0.08);
  }
}

.left-sider {
  min-width: 240px;
  max-width: 600px;
  height: 100%;
  background: #fff;
  border-right: 1px solid rgba(5, 5, 5, 0.06);
  flex-shrink: 0;
  position: relative;
  transition: width 0.3s ease;
  .sider-content {
    height: 100%;
    overflow: hidden;
  }
  .collapse-btn {
    position: absolute;
    right: -1px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 48px;
    border-radius: 6px 0 0 6px;
    background-color: rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    font-size: 10px;
    color: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: all 0.2s;
    &:hover {
      background-color: rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.65);
    }
  }
  &:hover .collapse-btn {
    opacity: 1;
  }
}

.main-control {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
</style>
