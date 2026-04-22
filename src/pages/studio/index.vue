<template>
  <div class="studio-page">
    <SqlSider
      class="sider-control"
      :get-cur-pane-list="getCurPaneList"
      :copilot-open="copilotOpen"
    />

    <div class="studio-main">
      <StudioPane
        ref="studioPaneRef"
        v-model:active-key="activeKey"
        :pane-list="paneList"
        :running="running"
        :active-tool="activeTool"
        @run="runActive"
        @stop="stopActive"
        @format="formatActive"
        @save="saveActive"
        @fullscreen="openFullscreen"
        @remove-tab="onCloseTab"
        @update-result-list="onUpdateResultList"
        @tool-click="onToolClick"
      />
    </div>

    <FullScreenModal
      v-if="fullScreenPane"
      :visible="fullScreenOpen"
      :script-content="fullScreenPane.scriptContent"
      @close="onFullScreenClose"
    />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import StudioPane from './components/StudioPane.vue';
import SqlSider from './components/sql-sider/index.vue';
import FullScreenModal from '@/components/sql-editor/full-screen-modal.vue';
import {
  pageOperationManager,
  PAGE_OP_COPILOT_REPLACE_CODE,
  PAGE_OP_COPILOT_REVERT_CODE,
  type PageOperation,
} from '@/components/copilot/manage/PageOperationManager';
import StudioApi, { type StudioPane as Pane } from '@/resources/studio';
import { subscribeNewPane } from './common/editor-bridge';
import { setPaneListSnapshot } from './common/pane-db';
import { useSqlSiderState } from './common/sql-sider-state';

const paneList = ref<Pane[]>([]);
const activeKey = ref<string | number>('');

const running = ref(false);
const activeTool = ref<string | null>(null);
const fullScreenOpen = ref(false);
const fullScreenPane = ref<Pane | null>(null);

/** Copilot 面板是否打开 —— 通过 StudioPane ref 读取暴露的 copilotVisible，用于通知 sql-sider 自动折叠 */
const studioPaneRef = ref<InstanceType<typeof StudioPane> | null>(null);
const copilotOpen = ref(false);
watch(
  () => studioPaneRef.value?.copilotVisible,
  (v) => {
    copilotOpen.value = !!v;
  },
);

/**
 * Copilot 生成的代码应用到编辑器：简化版 —— 直接把 `scriptEdits` 合并为完整脚本覆盖到当前 pane。
 * 记录旧代码到 lastCopilotSnapshot 以便用户点回退按钮恢复。
 * 改造为向 pageOperationManager 订阅，后续 data-map 等宿主页可走同一机制。
 */
const lastCopilotSnapshot = ref<Record<string | number, string>>({});

const handleCopilotReplaceCode = (op: PageOperation) => {
  const payload = (op.payload ?? {}) as { sqlEdits?: unknown[] };
  const current = activePane();
  if (!current) return;
  lastCopilotSnapshot.value[current.key] = current.scriptContent ?? '';
  const edits = (payload.sqlEdits ?? []) as Array<{ newText?: string; text?: string } | string>;
  const combined = edits
    .map((e) => (typeof e === 'string' ? e : e.newText ?? e.text ?? ''))
    .join('\n');
  if (combined) {
    current.scriptContent = combined;
    message.success('已将 Copilot 生成的 SQL 写入编辑器');
  }
};

const handleCopilotRevertCode = (op: PageOperation) => {
  const payload = (op.payload ?? {}) as { code?: string };
  const current = activePane();
  if (!current) return;
  const fallback = lastCopilotSnapshot.value[current.key];
  current.scriptContent = payload?.code ?? fallback ?? current.scriptContent;
  message.info('已回退代码');
};

onMounted(() => {
  pageOperationManager.register(PAGE_OP_COPILOT_REPLACE_CODE, handleCopilotReplaceCode);
  pageOperationManager.register(PAGE_OP_COPILOT_REVERT_CODE, handleCopilotRevertCode);
});

onBeforeUnmount(() => {
  pageOperationManager.unregister(PAGE_OP_COPILOT_REPLACE_CODE, handleCopilotReplaceCode);
  pageOperationManager.unregister(PAGE_OP_COPILOT_REVERT_CODE, handleCopilotRevertCode);
});

const { setActiveTabKey } = useSqlSiderState();

function activePane(): Pane | undefined {
  return paneList.value.find((p) => p.key === activeKey.value);
}

/** 给 sql-sider 传递「当前 paneList」函数 */
function getCurPaneList() {
  return paneList.value;
}

/** 初始化：拉一个空默认 pane 保证编辑器有东西可展示 */
async function bootstrap() {
  const first = await StudioApi.openDefaultTask();
  if (first) {
    paneList.value = [first];
    activeKey.value = first.key;
    // 默认 pane 并非树中真实任务，不写入 sql-sider 的 activeTabKey，避免触发定位查找
  }
}

onMounted(bootstrap);

/** sql-sider 的 setNewPane 事件 —— 点击任务树节点/新建/重命名/删除时触发 */
const unsubscribeNewPane = subscribeNewPane((payload: any) => {
  if (!payload) return;

  // 删除场景：从 paneList 中移除该 task 对应 tab
  if (payload.isDelete && payload.id !== undefined) {
    const idx = paneList.value.findIndex(
      (p: any) => String(p.taskId ?? p.key) === String(payload.id),
    );
    if (idx >= 0) {
      paneList.value.splice(idx, 1);
      if (!paneList.value.length) {
        activeKey.value = '';
        setActiveTabKey('');
      } else if (String(activeKey.value) === String(payload.id)) {
        activeKey.value = paneList.value[Math.max(0, idx - 1)].key;
        setActiveTabKey(activeKey.value);
      }
    }
    return;
  }

  // 新建/切换场景
  const folderKey = payload.folderKey ?? payload.id;
  const existIdx = paneList.value.findIndex(
    (p: any) => String(p.key) === String(folderKey),
  );

  const newPane: Pane = {
    key: folderKey,
    taskName: payload.taskName ?? payload.queryName ?? '未命名任务',
    taskType: payload.taskType ?? 'SPARK_SQL',
    databaseName: payload.databaseName ?? '',
    scriptContent:
      payload.scriptContent ?? `-- ${payload.taskName ?? ''}\nSELECT 1;`,
    outerHeight: 420,
    resultList: [{ key: 0, status: '', resultType: 'log' }],
    ...payload,
  };

  if (existIdx >= 0) {
    // 编辑：替换现有 pane（如重命名后刷新）
    if (payload.isEdit) {
      paneList.value.splice(existIdx, 1, newPane);
    }
    activeKey.value = folderKey;
  } else {
    if (paneList.value.length >= 6) {
      message.error('最多显示 6 个页签，请先关闭部分页签');
      return;
    }
    paneList.value.push(newPane);
    activeKey.value = folderKey;
  }
  setActiveTabKey(activeKey.value);
});

onBeforeUnmount(() => {
  unsubscribeNewPane?.();
});

/** 任一 paneList 变化时同步到 paneDB 存根，供 sql-sider 定位任务用 */
watch(
  () => paneList.value.map((p: any) => ({ taskId: p.taskId, folderKey: p.key })),
  (v) => setPaneListSnapshot(v),
  { deep: true, immediate: true },
);

watch(activeKey, (v) => {
  const pane = paneList.value.find((p: any) => p.key === v) as any;
  // 仅对 sql-sider 真实任务（有 taskId 或 folderKey 为数字）写回 activeTabKey
  if (pane?.taskId !== undefined) {
    setActiveTabKey(pane.taskId);
  }
});

function onCloseTab(key: string | number) {
  if (paneList.value.length <= 1) {
    message.warn('至少需要保留一个 Tab');
    return;
  }
  const idx = paneList.value.findIndex((p) => p.key === key);
  if (idx < 0) return;
  paneList.value.splice(idx, 1);
  if (activeKey.value === key) {
    activeKey.value = paneList.value[Math.max(0, idx - 1)].key;
  }
}

function onUpdateResultList(list: Pane['resultList']) {
  const p = activePane();
  if (p && list) p.resultList = list;
}

async function runActive() {
  const p = activePane();
  if (!p) return;
  if (!p.scriptContent?.trim()) {
    message.warn('请输入 SQL 后再运行');
    return;
  }
  running.value = true;
  const newKey = `r-${Date.now()}`;
  const resultItem: any = {
    key: newKey,
    id: newKey,
    status: 'RUNNING',
    resultType: 'log',
    sql: p.scriptContent,
    log: '[INFO] 正在执行 SQL...\n',
    createTime: Date.now(),
  };
  const list = [...(p.resultList || []), resultItem];
  if (list.length > 10) list.shift();
  p.resultList = list;

  try {
    const res = await StudioApi.runSql({ sql: p.scriptContent });
    const final = {
      ...resultItem,
      status: 'FINISHED',
      rowCount: res.rowCount,
      execTime: `${res.duration} ms`,
      log: `${resultItem.log}[INFO] 解析完成\n[INFO] 共扫描 ${res.rowCount} 行\n[INFO] 执行耗时 ${res.duration} ms\n[INFO] 执行成功\n`,
      columns: res.columns,
      rows: res.rows,
      appId: res.appId,
    };
    const idx = p.resultList.findIndex((i: any) => i.key === newKey);
    if (idx >= 0) p.resultList.splice(idx, 1, final);
    message.success('执行完成');
  } catch {
    const failed = {
      ...resultItem,
      status: 'FAILED',
      log: `${resultItem.log}[ERROR] 执行失败\n`,
    };
    const idx = p.resultList.findIndex((i: any) => i.key === newKey);
    if (idx >= 0) p.resultList.splice(idx, 1, failed);
    message.error('执行失败');
  } finally {
    running.value = false;
  }
}

function stopActive() {
  if (!running.value) return;
  running.value = false;
  const p = activePane();
  if (!p || !p.resultList?.length) return;
  const last: any = p.resultList[p.resultList.length - 1];
  if (['INIT', 'ANALYZING', 'RUNNING'].includes(last.status)) {
    last.status = 'ABORTED';
    last.log = `${last.log || ''}[WARN] 用户手动中止\n`;
  }
  message.info('已停止');
}

async function formatActive() {
  const p = activePane();
  if (!p) return;
  try {
    const res = await StudioApi.formatSql({ sql: p.scriptContent ?? '' });
    p.scriptContent = res.sql;
    message.success('已格式化');
  } catch {
    message.error('格式化失败');
  }
}

async function saveActive() {
  const p = activePane();
  if (!p) return;
  await StudioApi.saveDraft({
    taskCode: String(p.key),
    scriptContent: p.scriptContent ?? '',
  });
  message.success('已保存草稿');
}

function openFullscreen() {
  fullScreenPane.value = activePane() ?? null;
  fullScreenOpen.value = true;
}

function onFullScreenClose(v: { scriptContent?: string } = {}) {
  fullScreenOpen.value = false;
  const p = fullScreenPane.value;
  if (p && typeof v.scriptContent === 'string') {
    p.scriptContent = v.scriptContent;
  }
  fullScreenPane.value = null;
}

function onToolClick(key: string) {
  activeTool.value = activeTool.value === key ? null : key;
  message.info(`【${key}】抽屉功能将在下一轮迭代实现`);
  setTimeout(() => {
    activeTool.value = null;
  }, 1200);
}
</script>

<style lang="less" scoped>
.studio-page {
  display: flex;
  height: calc(100vh - 56px);
  background: #fff;
  overflow: hidden;
}

.sider-control {
  position: relative;
  min-height: calc(100vh - 56px);
  height: calc(100vh - 56px);
  flex-shrink: 0;
}

.studio-main {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}
</style>
