<!--
  SQL Main：多 Tab 页签 + 编辑器 + 结果区
-->
<template>
  <div class="sql-main">
    <div class="custom-tabs">
      <div class="tab-list">
        <a-dropdown
          v-for="(pane, index) in panes"
          :key="pane.key"
          :trigger="['contextmenu']"
        >
          <div
            :class="['tab-card', { active: pane.key === activeKey }]"
            @click="switchTab(pane.key)"
            @dblclick="enterEditTitle(pane)"
          >
            <component
              :is="pane.taskId ? BranchesOutlined : ConsoleSqlOutlined"
              class="tab-type-icon"
            />
            <a-input
              v-if="pane.titleEditing"
              ref="inputRefs"
              v-model:value="titleTmp"
              size="small"
              class="edit-input"
              autofocus
              @blur="saveTitle(pane)"
              @press-enter="saveTitle(pane)"
            />
            <a-tooltip v-else :title="pane.title" placement="top" :mouse-enter-delay="0.3">
              <span class="tab-title">{{ displayTitle(pane.title) }}</span>
            </a-tooltip>
            <CloseOutlined
              v-if="panes.length > 1"
              class="tab-close"
              @click.stop="remove(pane.key)"
            />
          </div>

          <template #overlay>
            <a-menu theme="dark">
              <a-menu-item
                key="close"
                :disabled="panes.length === 1"
                @click="remove(pane.key)"
              >
                关闭
              </a-menu-item>
              <a-menu-item
                key="close-other"
                :disabled="panes.length === 1"
                @click="removeOthers(pane.key)"
              >
                关闭其他标签
              </a-menu-item>
              <a-menu-item
                key="close-left"
                :disabled="index === 0"
                @click="removeLeft(pane.key)"
              >
                关闭左侧标签
              </a-menu-item>
              <a-menu-item
                key="close-right"
                :disabled="index === panes.length - 1"
                @click="removeRight(pane.key)"
              >
                关闭右侧标签
              </a-menu-item>
              <a-menu-item key="rename" @click="enterEditTitle(pane)">重命名</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <a-tooltip title="新建查询">
          <div class="tab-add" @click="addTab()">
            <PlusOutlined />
          </div>
        </a-tooltip>
      </div>
    </div>

    <div class="editor-area" v-if="currentPane">
      <div class="toolbar">
        <a-space size="small">
          <a-select
            v-model:value="currentPane.database"
            :options="databases"
            size="small"
            style="width: 160px"
            placeholder="选择数据源"
          />
          <a-button type="primary" size="small" :loading="runLoading" @click="runSql">
            <template #icon><CaretRightOutlined /></template>
            {{ runLoading ? '运行中' : '运行' }}
          </a-button>
          <a-button size="small" @click="formatSql">
            <template #icon><AlignCenterOutlined /></template>
            格式化
          </a-button>
          <a-button size="small" @click="saveSql">
            <template #icon><SaveOutlined /></template>
            保存
          </a-button>
        </a-space>
      </div>

      <div class="editor-body">
        <CodeEditor v-model="currentPane.sql" language="sql" :height="260" />
      </div>

      <div class="result-area">
        <div class="result-header">
          <span class="result-title">
            <CheckCircleOutlined v-if="currentPane.result" style="color: #52c41a" />
            <ClockCircleOutlined v-else style="color: #8c8c8c" />
            执行结果
          </span>
          <span v-if="currentPane.result" class="result-meta">
            {{ currentPane.result.rowCount }} 行 · {{ currentPane.result.duration }} ms
          </span>
        </div>
        <div class="result-body">
          <a-empty
            v-if="!currentPane.result"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            description="点击运行按钮以执行 SQL"
          />
          <a-table
            v-else
            size="small"
            :columns="resultColumns"
            :data-source="currentPane.result.rows"
            :pagination="{ pageSize: 10, size: 'small' }"
            :row-key="(_, i) => i"
            :scroll="{ x: 'max-content' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { Empty, message } from 'ant-design-vue';
import {
  BranchesOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ConsoleSqlOutlined,
  AlignCenterOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons-vue';
import CodeEditor from '@/components/CodeEditor.vue';
import ExploreApi, { type SqlRunResult } from '@/resources/explore';

export interface SqlPane {
  key: string;
  title: string;
  database: string;
  sql: string;
  result?: SqlRunResult;
  taskId?: string;
  titleEditing?: boolean;
}

const props = defineProps<{
  databases: Array<{ label: string; value: string }>;
}>();

const panes = ref<SqlPane[]>([]);
const activeKey = ref('');
const titleTmp = ref('');
const inputRefs = ref<any[]>([]);
const runLoading = ref(false);

const defaultSql = '-- 在此编写 SQL\nSELECT * FROM ods_db.ods_user_info_df LIMIT 100;';

function genKey() {
  return `pane_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function addTab(opts?: Partial<SqlPane>) {
  const key = genKey();
  panes.value.push({
    key,
    title: opts?.title || `查询 ${panes.value.length + 1}`,
    database: opts?.database || props.databases[0]?.value || '',
    sql: opts?.sql ?? defaultSql,
    taskId: opts?.taskId,
  });
  activeKey.value = key;
}

function switchTab(key: string) {
  activeKey.value = key;
}

function remove(key: string) {
  const idx = panes.value.findIndex((p) => p.key === key);
  if (idx < 0) return;
  panes.value.splice(idx, 1);
  if (activeKey.value === key && panes.value.length) {
    activeKey.value = panes.value[Math.max(0, idx - 1)].key;
  }
}

function removeOthers(key: string) {
  panes.value = panes.value.filter((p) => p.key === key);
  activeKey.value = key;
}

function removeLeft(key: string) {
  const idx = panes.value.findIndex((p) => p.key === key);
  if (idx <= 0) return;
  panes.value.splice(0, idx);
}

function removeRight(key: string) {
  const idx = panes.value.findIndex((p) => p.key === key);
  if (idx < 0) return;
  panes.value.splice(idx + 1);
}

function displayTitle(title: string) {
  return title.length > 15 ? `${title.slice(0, 15)}..` : title;
}

function enterEditTitle(pane: SqlPane) {
  titleTmp.value = pane.title;
  pane.titleEditing = true;
  nextTick(() => {
    inputRefs.value?.[0]?.focus?.();
  });
}

function saveTitle(pane: SqlPane) {
  const t = titleTmp.value.trim();
  if (t) pane.title = t;
  pane.titleEditing = false;
}

const currentPane = computed(() => panes.value.find((p) => p.key === activeKey.value));

async function runSql() {
  const pane = currentPane.value;
  if (!pane) return;
  if (!pane.sql.trim()) {
    message.warning('请先输入 SQL');
    return;
  }
  runLoading.value = true;
  try {
    pane.result = await ExploreApi.runSql(pane.sql);
    message.success(`执行成功，${pane.result.rowCount} 行，耗时 ${pane.result.duration} ms`);
  } catch (e) {
    message.error('执行失败');
  } finally {
    runLoading.value = false;
  }
}

function formatSql() {
  const pane = currentPane.value;
  if (!pane) return;
  message.info('骨架 Demo：格式化功能未实现');
}

function saveSql() {
  message.success('已保存草稿（Demo）');
}

const resultColumns = computed(() => {
  const pane = currentPane.value;
  if (!pane?.result) return [];
  return pane.result.columns.map((c) => ({
    title: c,
    dataIndex: c,
    key: c,
    ellipsis: true,
  }));
});

function openTabWithSql(sql: string, title?: string) {
  addTab({ sql, title: title || `查询 ${panes.value.length + 1}` });
}

function openTaskTab(taskId: string, title: string) {
  const exist = panes.value.find((p) => p.taskId === taskId);
  if (exist) {
    activeKey.value = exist.key;
    return;
  }
  if (panes.value.length >= 6) {
    message.error('最多显示 6 个页签，请先关闭其他');
    return;
  }
  addTab({ taskId, title, sql: `-- 分析节点: ${title}\nSELECT 1;` });
}

defineExpose({ addTab, openTabWithSql, openTaskTab, removeAll: () => (panes.value = []) });

onMounted(() => {
  if (!panes.value.length) addTab();
});
</script>

<style lang="less" scoped>
.sql-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  background: #fff;
}

.custom-tabs {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  background: #fafafa;
}
.tab-list {
  display: flex;
  overflow-x: auto;
  height: 36px;
}
.tab-card {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 36px;
  line-height: 36px;
  background: transparent;
  border-right: 1px solid rgba(5, 5, 5, 0.06);
  cursor: pointer;
  user-select: none;
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  flex-shrink: 0;
  max-width: 200px;

  .tab-type-icon {
    color: rgba(0, 0, 0, 0.45);
  }

  .tab-title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .edit-input {
    width: 120px;
  }

  .tab-close {
    color: rgba(0, 0, 0, 0.3);
    font-size: 12px;
    padding: 2px;
    border-radius: 2px;
    opacity: 0;
    transition: all 0.2s;
    &:hover {
      color: rgba(0, 0, 0, 0.85);
      background: rgba(0, 0, 0, 0.06);
    }
  }

  &:hover {
    background: rgba(0, 0, 0, 0.02);
    .tab-close {
      opacity: 1;
    }
  }

  &.active {
    background: #fff;
    color: #1677ff;
    position: relative;
    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 2px;
      background: #1677ff;
    }
    .tab-close {
      opacity: 1;
    }
    .tab-type-icon {
      color: #1677ff;
    }
  }
}

.tab-add {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  &:hover {
    color: #1677ff;
    background: rgba(0, 0, 0, 0.02);
  }
}

.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  background: #fff;
  flex-shrink: 0;
}
.editor-body {
  flex-shrink: 0;
  padding: 4px;
  background: #fff;
}
.result-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid rgba(5, 5, 5, 0.06);
  background: #fff;
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.85);
  border-bottom: 1px solid #fafafa;
  flex-shrink: 0;
  .result-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .result-meta {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
  }
}
.result-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 12px;
}
</style>
