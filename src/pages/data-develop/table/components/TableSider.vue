<template>
  <div class="table-sider">
    <div class="header bench-title">
      <a-button
        type="link"
        size="small"
        :class="['workbench-link', { active: showDashboard }]"
        @click="onShowDashboard"
      >
        <HomeOutlined />工作台
      </a-button>
      <a-tooltip :title="currentEnv === 'PROD' ? '生产环境不支持直接建表' : ''">
        <a-button
          :type="currentEnv === 'DEV' ? 'primary' : 'default'"
          size="small"
          @click="emit('create')"
        >
          + 新建
        </a-button>
      </a-tooltip>
    </div>

    <div class="field-row">
      <div class="label">数据源</div>
      <a-select v-model:value="currentSource" :options="sourceOptions" size="small" style="width: 100%" />
    </div>
    <div class="field-row">
      <div class="label">环境</div>
      <a-select :value="currentEnv" :options="envOptions" size="small" style="width: 100%" @change="onEnvChange" />
    </div>

    <div class="search-bar">
      <a-input v-model:value="keyword" placeholder="搜索表名" allow-clear size="small">
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-popover v-model:open="filterOpen" trigger="click" placement="bottomRight" :arrow="false">
        <template #content>
          <div class="filter-panel">
            <div class="filter-panel-title">筛选条件</div>
            <div class="filter-field">
              <div class="filter-label">数据库</div>
              <a-select
                v-model:value="draft.databases"
                mode="multiple"
                size="small"
                placeholder="全部数据库"
                :options="filterOptions.databases"
                allow-clear
                style="min-width: 220px"
              />
            </div>
            <div class="filter-field">
              <div class="filter-label">负责人</div>
              <a-select
                v-model:value="draft.owners"
                mode="multiple"
                size="small"
                placeholder="全部负责人"
                :options="filterOptions.owners"
                allow-clear
                style="min-width: 220px"
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
      <div class="left">
        <AppstoreOutlined />
        <span v-if="isSearching">筛选结果 <span class="count">({{ filteredCount }})</span></span>
        <span v-else>全部</span>
      </div>
      <div class="right">
        <a-tooltip title="刷新"><RedoOutlined @click="load" /></a-tooltip>
        <a-tooltip title="重置筛选"><ClearOutlined @click="onResetAll" /></a-tooltip>
      </div>
    </div>

    <div class="tree-area">
      <a-spin :spinning="loading">
        <a-tree
          v-if="displayTree.length"
          v-model:selected-keys="selectedKeys"
          v-model:expanded-keys="expandedKeys"
          :tree-data="displayTree"
          :field-names="{ children: 'children', title: 'title', key: 'key' }"
          show-icon
          block-node
          @select="onSelect"
        >
          <template #icon="{ dataRef }">
            <DatabaseOutlined v-if="dataRef.itemType === 'DATABASE'" />
            <TableOutlined v-else style="color: #1677ff" />
          </template>
          <template #title="{ dataRef }">
            <div :class="['tree-title', dataRef.itemType === 'TABLE' ? 'table-item' : '']">
              <span class="ellipsis">{{ dataRef.title }}</span>
              <a-tag v-if="dataRef.itemType === 'TABLE'" :color="dataRef.env === 'PROD' ? 'green' : 'blue'" class="env-tag">
                {{ dataRef.env }}
              </a-tag>
            </div>
          </template>
        </a-tree>
        <a-empty v-else description="暂无表" style="margin-top: 40px" />
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  AppstoreOutlined,
  ClearOutlined,
  DatabaseOutlined,
  FilterOutlined,
  HomeOutlined,
  RedoOutlined,
  SearchOutlined,
  TableOutlined,
} from '@ant-design/icons-vue';
import DataDevelopApi, { type FilterOptions, type TableTreeNode } from '@/resources/data-develop';

const props = defineProps<{ showDashboard?: boolean; currentEnv: 'DEV' | 'PROD' }>();
const emit = defineEmits<{
  (e: 'select', node: TableTreeNode): void;
  (e: 'create'): void;
  (e: 'show-dashboard'): void;
  (e: 'update:currentEnv', env: 'DEV' | 'PROD'): void;
}>();

const loading = ref(false);
const keyword = ref('');
const currentSource = ref('default');
const filterOpen = ref(false);

const sourceOptions = [
  { label: 'Default Data Source', value: 'default' },
  { label: 'Risk ODS', value: 'risk-ods' },
  { label: 'BI Warehouse', value: 'bi' },
];
const envOptions = [
  { label: '开发（DEV）', value: 'DEV' },
  { label: '生产（PROD）', value: 'PROD' },
];

const filterOptions = reactive<FilterOptions>({ databases: [], owners: [] });
const draft = reactive<{ databases: string[]; owners: string[] }>({ databases: [], owners: [] });
const active = reactive<{ databases: string[]; owners: string[] }>({ databases: [], owners: [] });

const treeData = ref<TableTreeNode[]>([]);
const selectedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);

const hasActiveFilter = computed(
  () => active.databases.length > 0 || active.owners.length > 0,
);

const isSearching = computed(() => keyword.value.trim().length > 0 || hasActiveFilter.value);

const filteredTree = computed<TableTreeNode[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  const hit = (t: TableTreeNode) => {
    const hitKw = !kw || t.title.toLowerCase().includes(kw);
    const hitOwner = !active.owners.length || active.owners.includes(t.owner ?? '');
    return hitKw && hitOwner;
  };
  if (!isSearching.value) return treeData.value;
  return treeData.value
    .map((db) => {
      if (active.databases.length && !active.databases.includes(db.title)) return null;
      const children = (db.children ?? []).filter(hit);
      return children.length ? { ...db, children } : null;
    })
    .filter(Boolean) as TableTreeNode[];
});

const displayTree = computed(() => filteredTree.value);

const filteredCount = computed(() => {
  let n = 0;
  filteredTree.value.forEach((db) => { n += (db.children ?? []).length; });
  return n;
});

const load = async () => {
  loading.value = true;
  try {
    const [tree, options] = await Promise.all([
      DataDevelopApi.fetchTableTree(),
      DataDevelopApi.fetchTableFilterOptions(),
    ]);
    treeData.value = tree;
    filterOptions.databases = options.databases;
    filterOptions.owners = options.owners;
    if (tree[0]) expandedKeys.value = [tree[0].key];
  } finally {
    loading.value = false;
  }
};

const onApplyFilter = () => {
  active.databases = [...draft.databases];
  active.owners = [...draft.owners];
  filterOpen.value = false;
};
const onResetFilter = () => { draft.databases = []; draft.owners = []; };
const onResetAll = () => {
  keyword.value = '';
  onResetFilter();
  active.databases = [];
  active.owners = [];
};

const onEnvChange = (v: 'DEV' | 'PROD') => emit('update:currentEnv', v);
const onShowDashboard = () => emit('show-dashboard');
const onSelect = (_keys: (string | number)[], info: { node: { dataRef: TableTreeNode } }) => {
  if (info.node?.dataRef?.itemType === 'TABLE') emit('select', info.node.dataRef);
};

onMounted(load);

defineExpose({ reload: load });
// Make props referenced so Vue compiler does not warn about unused declaration.
void props;
</script>

<style lang="less" scoped>
.table-sider {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px 6px;

  .workbench-link {
    color: #666;

    &.active {
      color: #1677ff;
      font-weight: 600;
    }
  }
}

.field-row {
  padding: 2px 12px 6px;

  .label {
    font-size: 12px;
    color: #666;
    margin-bottom: 3px;
  }
}

.search-bar {
  display: flex;
  gap: 8px;
  padding: 6px 12px 8px;

  .filter-btn {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    cursor: pointer;
    position: relative;

    &:hover,
    &.active { color: #1677ff; background: #e6f4ff; }

    .filter-badge {
      position: absolute;
      top: 4px; right: 4px;
      width: 6px; height: 6px;
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
  .filter-field { margin-bottom: 10px; }
  .filter-label { font-size: 12px; color: #666; margin-bottom: 4px; }
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
  padding: 4px 12px;
  font-size: 12px;
  color: #666;

  .left { display: flex; align-items: center; gap: 6px; }
  .count { color: #1677ff; }

  .right {
    display: flex;
    gap: 10px;
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
  .env-tag {
    font-size: 11px;
    line-height: 16px;
    margin-right: 0;
  }
}
</style>
