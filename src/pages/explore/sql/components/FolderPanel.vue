<!--
  文件夹面板：SQL 文件组织树（骨架）
-->
<template>
  <div class="folder-panel">
    <div class="panel-header">
      <a-input-search
        v-model:value="keyword"
        placeholder="搜索文件 / 文件夹"
        size="small"
        allow-clear
      />
      <div class="ops">
        <a-tooltip title="新建文件夹">
          <a-button size="small" type="text" @click="onCreateFolder">
            <template #icon><FolderAddOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip title="新建 SQL 文件">
          <a-button size="small" type="text" @click="onCreateFile">
            <template #icon><FileAddOutlined /></template>
          </a-button>
        </a-tooltip>
      </div>
    </div>
    <div class="panel-body">
      <a-spin :spinning="loading">
        <a-tree
          v-if="filteredTree.length"
          :tree-data="filteredTree"
          :field-names="{ title: 'title', key: 'key', children: 'children' }"
          show-icon
          block-node
          :default-expand-all="!!keyword"
          @select="onSelect"
        >
          <template #icon="{ dataRef }">
            <FolderFilled v-if="dataRef.type === 'folder'" style="color: #faad14" />
            <FileTextOutlined v-else style="color: #1677ff" />
          </template>
          <template #title="{ dataRef }">
            <span class="node-title">
              <span>{{ dataRef.title }}</span>
              <span v-if="dataRef.type === 'file'" class="node-meta">
                {{ dataRef.creator }} · {{ dataRef.updatedAt }}
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
  FolderFilled,
  FolderAddOutlined,
  FileAddOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue';
import ExploreApi, { type FolderNode } from '@/resources/explore';

const emit = defineEmits<{ (e: 'pick-file', node: FolderNode): void }>();

const loading = ref(false);
const tree = ref<FolderNode[]>([]);
const keyword = ref('');

function filterTree(nodes: FolderNode[], kw: string): FolderNode[] {
  if (!kw) return nodes;
  const k = kw.toLowerCase();
  const walk = (list: FolderNode[]): FolderNode[] =>
    list
      .map((n) => {
        const hit = n.title.toLowerCase().includes(k);
        const children = n.children ? walk(n.children) : [];
        if (hit || children.length) return { ...n, children };
        return null;
      })
      .filter(Boolean) as FolderNode[];
  return walk(nodes);
}

const filteredTree = computed(() => filterTree(tree.value, keyword.value));

async function load() {
  loading.value = true;
  try {
    tree.value = await ExploreApi.fetchFolderTree();
  } catch (e) {
    message.error('加载文件夹失败');
  } finally {
    loading.value = false;
  }
}

function onSelect(_: unknown, { node }: { node: { dataRef: FolderNode } }) {
  if (node.dataRef.type === 'file') emit('pick-file', node.dataRef);
}

const onCreateFolder = () => message.info('骨架 Demo：新建文件夹未实现');
const onCreateFile = () => message.info('骨架 Demo：新建 SQL 文件未实现');

onMounted(load);
</script>

<style lang="less" scoped>
.folder-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.panel-header {
  padding: 8px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  display: flex;
  align-items: center;
  gap: 4px;
  .ant-input-affix-wrapper,
  :deep(.ant-input-search) {
    flex: 1;
    min-width: 0;
  }
  .ops {
    display: flex;
    flex-shrink: 0;
  }
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
  gap: 8px;
}
.node-meta {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}
</style>
