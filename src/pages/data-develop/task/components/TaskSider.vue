<template>
  <div class="task-sider" :style="{ width: folded ? '0px' : `${width}px` }">
    <div v-show="!folded" class="inner">
      <div class="header">
        <div class="tabs">
          <span class="tab active">任务开发</span>
        </div>
        <a-button type="primary" size="small" @click="onCreate">+ 新建</a-button>
      </div>
      <div class="search-bar">
        <a-input
          v-model:value="keyword"
          placeholder="搜索任务名"
          allow-clear
          size="small"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-popover v-model:open="filterOpen" trigger="click" placement="bottomRight" :arrow="false">
          <template #content>
            <div class="filter-panel">
              <div class="filter-panel-title">筛选条件</div>
              <div class="filter-field">
                <div class="filter-label">数据库</div>
                <a-select
                  v-model:value="draftFilters.databases"
                  mode="multiple"
                  size="small"
                  placeholder="全部数据库"
                  :options="filterOptions.databases"
                  :max-tag-count="2"
                  allow-clear
                  style="min-width: 220px"
                />
              </div>
              <div class="filter-field">
                <div class="filter-label">负责人</div>
                <a-select
                  v-model:value="draftFilters.owners"
                  mode="multiple"
                  size="small"
                  placeholder="全部负责人"
                  :options="filterOptions.owners"
                  :max-tag-count="1"
                  allow-clear
                  style="min-width: 220px"
                />
              </div>
              <div class="filter-field">
                <div class="filter-label">任务类型</div>
                <a-checkbox-group
                  v-model:value="draftFilters.types"
                  :options="filterOptions.taskTypes"
                />
              </div>
              <div class="filter-panel-footer">
                <a @click="onResetFilter">重置</a>
                <a-button type="primary" size="small" @click="onApplyFilter">确定</a-button>
              </div>
            </div>
          </template>
          <div :class="['filter-btn', hasActiveFilter ? 'active' : '']">
            <FilterOutlined />
            <span v-if="hasActiveFilter" class="filter-badge" />
          </div>
        </a-popover>
      </div>
      <div class="tree-toolbar">
        <div class="toolbar-left">
          <AppstoreOutlined />
          <span v-if="isSearching">筛选结果 <span class="count">({{ filteredCount }})</span></span>
          <span v-else>全部</span>
        </div>
        <div class="toolbar-right">
          <a-tooltip title="刷新">
            <RedoOutlined @click="loadTree" />
          </a-tooltip>
          <a-tooltip title="重置筛选">
            <ClearOutlined @click="onResetAll" />
          </a-tooltip>
        </div>
      </div>
      <div class="tree-area">
        <a-spin :spinning="loading">
          <a-tree
            v-if="treeData.length"
            v-model:selected-keys="selectedKeys"
            v-model:expanded-keys="expandedKeys"
            :tree-data="displayTreeData"
            :field-names="{ children: 'children', title: 'taskName', key: 'key' }"
            show-icon
            block-node
            @select="onSelect"
          >
            <template #icon="{ dataRef }">
              <DatabaseOutlined v-if="dataRef.itemType === 'DATABASE'" />
              <FolderOpenOutlined v-else-if="dataRef.itemType === 'DIRECTORY'" style="color: #1677ff" />
              <a-tooltip v-else-if="needUploadIcon(dataRef)" title="未提交">
                <UploadOutlined style="color: #1677ff" />
              </a-tooltip>
              <FileOutlined v-else />
            </template>
            <template #title="{ dataRef }">
              <div :class="['tree-title', dataRef.itemType === 'TASK' ? 'task-item' : '']">
                <span class="ellipsis">{{ dataRef.taskName }}</span>
                <a-tag v-if="dataRef.itemType === 'TASK'" :color="statusColor(dataRef.productionTaskStatus)" class="status-tag">
                  {{ statusLabel(dataRef.productionTaskStatus) }}
                </a-tag>
              </div>
            </template>
          </a-tree>
          <a-empty v-else description="暂无任务" style="margin-top: 40px" />
        </a-spin>
      </div>
    </div>
    <a-button class="fold-btn" size="small" @click="folded = !folded">
      <RightOutlined v-if="folded" />
      <LeftOutlined v-else />
    </a-button>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  AppstoreOutlined,
  ClearOutlined,
  DatabaseOutlined,
  FileOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  RedoOutlined,
  RightOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import DataDevelopApi, { type TaskTreeNode, type FilterOptions } from '@/resources/data-develop';

const emit = defineEmits<{
  (e: 'select', node: TaskTreeNode): void;
  (e: 'create'): void;
}>();

const loading = ref(false);
const folded = ref(false);
const width = 280;

const keyword = ref('');
const filterOpen = ref(false);
const draftFilters = reactive<{ databases: string[]; owners: string[]; types: string[] }>({
  databases: [],
  owners: [],
  types: [],
});
const activeFilters = reactive<{ databases: string[]; owners: string[]; types: string[] }>({
  databases: [],
  owners: [],
  types: [],
});
const filterOptions = reactive<FilterOptions & { taskTypes: { label: string; value: string }[] }>({
  databases: [],
  owners: [],
  taskTypes: [],
});

const treeData = ref<TaskTreeNode[]>([]);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);

const hasActiveFilter = computed(
  () =>
    activeFilters.databases.length > 0 ||
    activeFilters.owners.length > 0 ||
    activeFilters.types.length > 0,
);

const isSearching = computed(() => keyword.value.trim().length > 0 || hasActiveFilter.value);

const filteredTree = computed<TaskTreeNode[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  const hitTask = (task: TaskTreeNode) => {
    const hitKw = !kw || task.taskName.toLowerCase().includes(kw);
    const hitDb = !activeFilters.databases.length || activeFilters.databases.includes(task.database ?? '');
    const hitOwner = !activeFilters.owners.length || activeFilters.owners.includes(task.owner ?? '');
    const hitType = !activeFilters.types.length || activeFilters.types.includes(task.taskType ?? '');
    return hitKw && hitDb && hitOwner && hitType;
  };
  if (!isSearching.value) return treeData.value;
  return treeData.value
    .map((db) => {
      const dirs = (db.children ?? [])
        .map((dir) => {
          const tasks = (dir.children ?? []).filter(hitTask);
          return tasks.length ? { ...dir, children: tasks } : null;
        })
        .filter(Boolean) as TaskTreeNode[];
      return dirs.length ? { ...db, children: dirs } : null;
    })
    .filter(Boolean) as TaskTreeNode[];
});

const displayTreeData = computed(() => filteredTree.value);

const filteredCount = computed(() => {
  let total = 0;
  filteredTree.value.forEach((db) => {
    (db.children ?? []).forEach((dir) => {
      total += (dir.children ?? []).length;
    });
  });
  return total;
});

function statusColor(s?: string) {
  switch (s) {
    case 'ONLINE': return 'green';
    case 'ONLINE_HAS_DIFF': return 'gold';
    case 'OFFLINE_HAS_DIFF': return 'orange';
    case 'NO_PRODUCTION_TASK': return 'default';
    default: return 'default';
  }
}
function statusLabel(s?: string) {
  switch (s) {
    case 'ONLINE': return '已上线';
    case 'ONLINE_HAS_DIFF': return '有差异';
    case 'OFFLINE_HAS_DIFF': return '已下线';
    case 'NO_PRODUCTION_TASK': return '未发布';
    default: return '未知';
  }
}
function needUploadIcon(n: TaskTreeNode) {
  return n.itemType === 'TASK'
    && ['ONLINE_HAS_DIFF', 'OFFLINE_HAS_DIFF', 'NO_PRODUCTION_TASK'].includes(n.productionTaskStatus ?? '');
}

const loadTree = async () => {
  loading.value = true;
  try {
    const [tree, options] = await Promise.all([
      DataDevelopApi.fetchTaskTree(),
      DataDevelopApi.fetchTaskFilterOptions(),
    ]);
    treeData.value = tree;
    filterOptions.databases = options.databases;
    filterOptions.owners = options.owners;
    filterOptions.taskTypes = options.taskTypes ?? [];
    if (tree[0]) expandedKeys.value = [tree[0].key];
  } finally {
    loading.value = false;
  }
};

const onApplyFilter = () => {
  Object.assign(activeFilters, {
    databases: [...draftFilters.databases],
    owners: [...draftFilters.owners],
    types: [...draftFilters.types],
  });
  filterOpen.value = false;
};
const onResetFilter = () => {
  draftFilters.databases = [];
  draftFilters.owners = [];
  draftFilters.types = [];
};
const onResetAll = () => {
  keyword.value = '';
  onResetFilter();
  Object.assign(activeFilters, { databases: [], owners: [], types: [] });
};

const onSelect = (_keys: (string | number)[], info: { node: { dataRef: TaskTreeNode } }) => {
  const node = info.node?.dataRef;
  if (node?.itemType === 'TASK') emit('select', node);
};

const onCreate = () => emit('create');

onMounted(loadTree);
</script>

<style lang="less" scoped>
.task-sider {
  position: relative;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  transition: width 0.3s;
  flex-shrink: 0;
  min-width: 0;

  .inner {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .fold-btn {
    position: absolute;
    top: calc(50% - 20px);
    right: -14px;
    width: 14px;
    height: 40px;
    padding: 15px 0;
    line-height: 0;
    border-radius: 0 8px 8px 0;
    z-index: 9;
    font-size: 12px;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px 8px;

  .tabs {
    display: flex;
    gap: 16px;
    font-size: 13px;

    .tab {
      padding-bottom: 4px;
      color: #999;
      cursor: pointer;

      &.active {
        color: #1677ff;
        font-weight: 600;
        border-bottom: 2px solid #1677ff;
      }
    }
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 8px;

  .filter-btn {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #666;
    position: relative;

    &:hover,
    &.active {
      color: #1677ff;
      background: #e6f4ff;
    }

    .filter-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ff4d4f;
    }
  }
}

.filter-panel {
  width: 300px;
  padding: 12px;

  .filter-panel-title {
    font-weight: 600;
    margin-bottom: 10px;
  }

  .filter-field {
    margin-bottom: 10px;

    .filter-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
  }

  .filter-panel-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }
}

.tree-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  color: #666;
  font-size: 12px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 6px;

    .count { color: #1677ff; }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
    color: #8a8a8a;
    cursor: pointer;

    & > * {
      padding: 2px;
      border-radius: 4px;

      &:hover { color: #1677ff; background: #f0f5ff; }
    }
  }
}

.tree-area {
  flex: 1;
  overflow: auto;
  padding: 0 6px 12px;

  :deep(.ant-tree-node-content-wrapper) {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    flex: 1;
  }

  :deep(.ant-tree-treenode) {
    width: 100%;
  }

  :deep(.ant-tree-title) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }
}

.tree-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  width: 100%;

  .ellipsis {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-tag {
    font-size: 11px;
    margin-right: 0;
    line-height: 16px;
  }
}
</style>
