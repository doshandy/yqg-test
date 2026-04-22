<!--
  分析节点面板：已保存的分析任务
-->
<template>
  <div class="analysis-panel">
    <div class="panel-header">
      <a-input-search
        v-model:value="keyword"
        placeholder="搜索分析节点"
        size="small"
        allow-clear
      />
      <a-tooltip title="新建分析节点">
        <a-button size="small" type="text" @click="onCreate">
          <template #icon><PlusOutlined /></template>
        </a-button>
      </a-tooltip>
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
            <BranchesOutlined v-else style="color: #722ed1" />
          </template>
          <template #title="{ dataRef }">
            <span class="node-title">
              <span>{{ dataRef.title }}</span>
              <a-tag v-if="dataRef.type === 'task'" :color="statusColor(dataRef.status)">
                {{ statusText(dataRef.status) }}
              </a-tag>
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
  BranchesOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import ExploreApi, { type AnalysisTaskNode } from '@/resources/explore';

const emit = defineEmits<{ (e: 'pick-task', node: AnalysisTaskNode): void }>();

const loading = ref(false);
const tree = ref<AnalysisTaskNode[]>([]);
const keyword = ref('');

function filterTree(nodes: AnalysisTaskNode[], kw: string): AnalysisTaskNode[] {
  if (!kw) return nodes;
  const k = kw.toLowerCase();
  const walk = (list: AnalysisTaskNode[]): AnalysisTaskNode[] =>
    list
      .map((n) => {
        const hit = n.title.toLowerCase().includes(k);
        const children = n.children ? walk(n.children) : [];
        if (hit || children.length) return { ...n, children };
        return null;
      })
      .filter(Boolean) as AnalysisTaskNode[];
  return walk(nodes);
}

const filteredTree = computed(() => filterTree(tree.value, keyword.value));

const statusColor = (s?: string) =>
  ({ SUCCESS: 'success', RUNNING: 'processing', FAILED: 'error', DRAFT: 'default' } as Record<string, string>)[
    s || ''
  ] || 'default';
const statusText = (s?: string) =>
  ({ SUCCESS: '成功', RUNNING: '运行中', FAILED: '失败', DRAFT: '草稿' } as Record<string, string>)[
    s || ''
  ] || '-';

async function load() {
  loading.value = true;
  try {
    tree.value = await ExploreApi.fetchAnalysisTree();
  } catch (e) {
    message.error('加载分析节点失败');
  } finally {
    loading.value = false;
  }
}

function onSelect(_: unknown, { node }: { node: { dataRef: AnalysisTaskNode } }) {
  if (node.dataRef.type === 'task') emit('pick-task', node.dataRef);
}

const onCreate = () => message.info('骨架 Demo：新建分析节点未实现');

onMounted(load);
</script>

<style lang="less" scoped>
.analysis-panel {
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
  :deep(.ant-input-search) {
    flex: 1;
    min-width: 0;
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
</style>
