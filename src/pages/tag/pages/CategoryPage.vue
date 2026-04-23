<template>
  <div class="category-page">
    <section class="category-page__hero">
      <div>
        <p class="category-page__eyebrow">分类体系维护</p>
        <h2>类别管理</h2>
        <p class="category-page__desc">用树形结构维护标签与指标的分类体系，并支持节点预览和管理动作。</p>
      </div>
      <a-button type="primary" size="large" @click="openModal()">新增根分类</a-button>
    </section>

    <section class="category-page__stats">
      <article class="stat-card">
        <span>节点总数</span>
        <strong>{{ stats.total }}</strong>
        <small>当前树中所有分类节点</small>
      </article>
      <article class="stat-card">
        <span>一级分类</span>
        <strong>{{ stats.rootChildren }}</strong>
        <small>根节点直属分类数</small>
      </article>
      <article class="stat-card">
        <span>叶子节点</span>
        <strong>{{ stats.leafCount }}</strong>
        <small>未继续拆分的分类数</small>
      </article>
      <article class="stat-card">
        <span>当前选中</span>
        <strong>{{ selectedNode?.metricsName || '-' }}</strong>
        <small>树右侧预览的分类节点</small>
      </article>
    </section>

    <section class="workspace">
      <div class="panel tree-panel">
        <div class="panel__header">
          <div>
            <h3>分类树</h3>
          <p>支持新增、编辑与删除，并按树形结构维护分类层级。</p>
          </div>
        </div>
        <a-tree
          v-if="treeData.length"
          :tree-data="treeData"
          default-expand-all
          :field-names="{ title: 'metricsName', key: 'id', children: 'children' }"
          @select="handleSelect"
        >
          <template #title="node">
            <div class="tree-node">
              <span class="tree-node__title">{{ node.metricsName }}</span>
              <span class="tree-node__actions">
                <a-tooltip title="新增">
                  <PlusOutlined class="tree-node__icon" @click.stop="openModal({ parentId: node.id })" />
                </a-tooltip>
                <a-tooltip title="编辑">
                  <EditOutlined class="tree-node__icon" @click.stop="openModal(node)" />
                </a-tooltip>
                <a-popconfirm title="确认删除该节点？" @confirm="handleDelete(node.id)">
                  <a-tooltip title="删除">
                    <DeleteOutlined class="tree-node__icon tree-node__icon--danger" @click.stop />
                  </a-tooltip>
                </a-popconfirm>
              </span>
            </div>
          </template>
        </a-tree>
        <a-empty v-else description="暂无分类节点" />
      </div>

      <div class="panel preview-panel">
        <div class="panel__header">
          <div>
            <h3>节点预览</h3>
            <p>选中分类后可查看节点描述、上级分类和子节点信息。</p>
          </div>
        </div>
        <template v-if="selectedNode">
          <div class="detail-summary">
            <div>
              <span>当前节点</span>
              <strong>{{ selectedNode.metricsName }}</strong>
            </div>
            <div>
              <span>上级分类</span>
              <strong>{{ parentName || '根节点' }}</strong>
            </div>
            <div>
              <span>子节点数</span>
              <strong>{{ (selectedNode.children || []).length }}</strong>
            </div>
          </div>
          <div class="preview-cards">
            <div class="detail-card">
              <span>分类名称</span>
              <strong>{{ selectedNode.metricsName }}</strong>
            </div>
            <div class="detail-card">
              <span>上级分类</span>
              <strong>{{ parentName || '根节点' }}</strong>
            </div>
            <div class="detail-card detail-card--full">
              <span>分类描述</span>
              <strong>{{ selectedNode.metricsDesc || '-' }}</strong>
            </div>
          </div>
          <div class="detail-block">
            <h4>子节点</h4>
            <div class="tag-list">
              <a-tag v-for="child in selectedNode.children || []" :key="child.id">{{ child.metricsName }}</a-tag>
              <span v-if="!(selectedNode.children || []).length">无子节点</span>
            </div>
          </div>
        </template>
        <a-empty v-else description="请选择分类节点" />
      </div>
    </section>

    <a-modal v-model:open="open" :title="form.id ? '编辑分类' : '新增分类'" width="640px" @ok="handleSave">
      <div class="form-card">
        <h4>分类信息</h4>
        <a-form layout="vertical">
          <a-form-item label="分类名称"><a-input v-model:value="form.metricsName" /></a-form-item>
          <a-form-item label="分类描述"><a-textarea v-model:value="form.metricsDesc" :rows="4" /></a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import TagApi, { type CategoryNode } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';

const treeData = ref<CategoryNode[]>([]);
const selectedNode = ref<CategoryNode | null>(null);
const open = ref(false);
const form = reactive<Partial<CategoryNode>>({
  parentId: 'cat-root',
  metricsName: '',
  metricsDesc: '',
});

const nodeMap = computed(() => {
  const map = new Map<string, CategoryNode>();
  const walk = (nodes: CategoryNode[]) => {
    nodes.forEach((node) => {
      map.set(node.id, node);
      if (node.children?.length) walk(node.children);
    });
  };
  walk(treeData.value);
  return map;
});

const stats = computed(() => {
  let total = 0;
  let leafCount = 0;
  const walk = (nodes: CategoryNode[]) => {
    nodes.forEach((node) => {
      total += 1;
      if (!node.children?.length) leafCount += 1;
      if (node.children?.length) walk(node.children);
    });
  };
  walk(treeData.value);
  return {
    total,
    leafCount,
    rootChildren: treeData.value[0]?.children?.length || 0,
  };
});

const parentName = computed(() => {
  if (!selectedNode.value?.parentId) return '';
  return nodeMap.value.get(selectedNode.value.parentId)?.metricsName || '';
});

function resetForm() {
  Object.assign(form, {
    id: undefined,
    parentId: 'cat-root',
    metricsName: '',
    metricsDesc: '',
  });
}

async function fetchTree() {
  const root = await TagApi.fetchCategoryTree();
  treeData.value = root ? [root] : [];
  selectedNode.value = root || null;
}

function openModal(record?: Partial<CategoryNode>) {
  resetForm();
  if (record) Object.assign(form, safeClone(record));
  open.value = true;
}

function handleSelect(keys: string[]) {
  selectedNode.value = keys.length ? nodeMap.value.get(keys[0]) || null : null;
}

async function handleSave() {
  await TagApi.saveCategory(form);
  open.value = false;
  message.success(form.id ? '分类已更新' : '分类已创建');
  fetchTree();
}

async function handleDelete(id: string) {
  await TagApi.deleteCategory(id);
  message.success('分类已删除');
  fetchTree();
}

onMounted(fetchTree);
</script>

<style lang="less" scoped>
.category-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(168, 85, 247, 0.12), transparent 24%),
    linear-gradient(180deg, #fbf8ff 0%, #f4f0ff 100%);
}

.category-page__hero,
.panel,
.stat-card,
.detail-card,
.detail-block,
.form-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.category-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.category-page__eyebrow {
  margin: 0 0 8px;
  color: #7c3aed;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.category-page__hero h2,
.panel__header h3,
.form-card h4,
.detail-block h4 {
  margin: 0;
}

.category-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.category-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
}

.stat-card span,
.detail-card span {
  color: #667085;
  font-size: 13px;
}

.stat-card strong {
  color: #101828;
  font-size: 28px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(320px, 460px) minmax(0, 1fr);
  gap: 20px;
}

.panel {
  padding: 20px;
}

.panel__header {
  margin-bottom: 16px;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.tree-node__title {
  font-weight: 500;
}

.tree-node__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #667085;
}

.tree-node__icon {
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
}

.tree-node__icon:hover {
  color: #1677ff;
  transform: translateY(-1px);
}

.tree-node__icon--danger:hover {
  color: #ff4d4f;
}

.preview-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.detail-summary > div {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
  padding: 16px 18px;
}

.detail-summary span {
  color: #667085;
  font-size: 12px;
}

.detail-summary strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 16px;
}

.detail-card,
.detail-block,
.form-card {
  padding: 18px;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
}

.detail-card--full,
.detail-block {
  grid-column: 1 / -1;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 960px) {
  .category-page {
    padding: 16px;
  }

  .category-page__hero,
  .workspace,
  .category-page__stats,
  .preview-cards {
    grid-template-columns: 1fr;
  }

  .category-page__hero {
    flex-direction: column;
  }
}
</style>
