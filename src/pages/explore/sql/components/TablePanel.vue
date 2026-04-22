<!--
  库表面板：数据库 → 表 → 字段三级树
-->
<template>
  <div class="table-panel">
    <div class="panel-header">
      <a-input-search
        v-model:value="keyword"
        placeholder="搜索表名 / 字段"
        size="small"
        allow-clear
      />
    </div>
    <div class="panel-body">
      <a-spin :spinning="loading">
        <a-tree
          v-if="filteredTree.length"
          :tree-data="filteredTree"
          :field-names="{ title: 'title', key: 'key', children: 'children' }"
          block-node
          show-icon
          :default-expand-all="!!keyword"
          @select="onSelect"
        >
          <template #icon="{ dataRef }">
            <DatabaseOutlined v-if="dataRef.type === 'database'" style="color: #1677ff" />
            <TableOutlined v-else-if="dataRef.type === 'table'" style="color: #52c41a" />
            <FieldBinaryOutlined v-else style="color: #8c8c8c" />
          </template>
          <template #title="{ dataRef }">
            <span class="node-title">
              <span class="node-text">{{ dataRef.title }}</span>
              <span v-if="dataRef.type === 'column' && dataRef.dataType" class="node-meta">
                {{ dataRef.dataType }}
              </span>
            </span>
          </template>
        </a-tree>
        <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" description="无匹配结果" />
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { Empty, message } from 'ant-design-vue';
import {
  DatabaseOutlined,
  TableOutlined,
  FieldBinaryOutlined,
} from '@ant-design/icons-vue';
import ExploreApi, { type DbTable } from '@/resources/explore';

const emit = defineEmits<{
  (e: 'pick-table', dbTable: string): void;
}>();

const loading = ref(false);
const tree = ref<DbTable[]>([]);
const keyword = ref('');

function filterTree(nodes: DbTable[], kw: string): DbTable[] {
  if (!kw) return nodes;
  const k = kw.toLowerCase();
  const walk = (list: DbTable[]): DbTable[] =>
    list
      .map((n) => {
        const hit = n.title.toLowerCase().includes(k);
        const children = n.children ? walk(n.children) : [];
        if (hit || children.length) return { ...n, children };
        return null;
      })
      .filter(Boolean) as DbTable[];
  return walk(nodes);
}

const filteredTree = computed(() => filterTree(tree.value, keyword.value));

async function load() {
  loading.value = true;
  try {
    tree.value = await ExploreApi.fetchTableTree();
  } catch (e) {
    message.error('加载库表失败');
  } finally {
    loading.value = false;
  }
}

function onSelect(_: unknown, { node }: { node: { dataRef: DbTable } }) {
  if (node.dataRef.type === 'table') {
    emit('pick-table', node.dataRef.key);
  }
}

onMounted(load);
</script>

<style lang="less" scoped>
.table-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.panel-header {
  padding: 8px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
}
.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 4px;
}
.node-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.node-meta {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}
</style>
