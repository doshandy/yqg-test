<template>
  <a-drawer
    :open="open"
    title="新建规则"
    width="1080"
    :body-style="{ padding: '0 10px', display: 'flex', minWidth: '980px' }"
    @close="closeDrawer"
  >
    <div class="drawer-tree">
      <a-input-search v-model:value="searchValue" size="small" placeholder="请输入关键字" />
      <a-tree
        v-if="treeData.length"
        :tree-data="filteredTreeData"
        :selected-keys="selectedKeys"
        default-expand-all
        block-node
        @select="handleSelect"
      >
        <template #title="{ label, number, selected }">
          <div class="tree-node">
            <span>{{ label }}</span>
            <span class="tree-node__meta">
              <span class="tree-node__count">{{ number }}</span>
              <span v-if="selected" class="tree-node__use">
                <PlusOutlined />
                使用
              </span>
            </span>
          </div>
        </template>
      </a-tree>
    </div>

    <div ref="wrapperRef" class="drawer-content">
      <a-alert class="drawer-alert" type="info" show-icon message="点击左侧模板即可生成规则卡片；单张表单次最多可配置 10 条规则。" />
      <a-card
        v-for="(card, index) in cardList"
        :key="card.id"
        size="small"
        class="rule-card"
        :class="{ 'rule-card--error': card.error }"
        :title="card.errorMsg || undefined"
        :head-style="card.error ? { color: '#f5222d' } : undefined"
        :body-style="{ padding: '10px' }"
        :hoverable="true"
      >
        <template #extra>
          <a-button type="link" danger @click="removeCard(index)">删除</a-button>
        </template>
        <div class="form-grid form-grid--2">
          <a-form-item label="规则名称"><a-input v-model:value="card.ruleName" /></a-form-item>
          <a-form-item label="规则模板"><a-input v-model:value="card.ruleTemplateName" disabled /></a-form-item>
          <a-form-item label="规则类型"><a-input :value="templateTypeLabel(card.ruleTemplateType)" disabled /></a-form-item>
          <a-form-item label="规则范围"><a-input :value="card.showUseScope" disabled /></a-form-item>
          <a-form-item label="过滤条件" class="grid-full">
            <a-textarea v-model:value="card.filterConditionText" :rows="3" :disabled="!card.filterExpr?.length && !card.filterConditionText" />
          </a-form-item>
          <a-form-item label="监控阈值" class="grid-full">
            <div class="threshold-editor">
              <span class="threshold-editor__label">异常阈值</span>
              <a-select v-model:value="card.thresholdOperator" :options="operatorOptions" style="width: 140px" />
              <a-input v-model:value="card.thresholdValue" style="width: 220px" />
              <a-tag v-if="card.thresholdType === 'PERCENTAGE'">%</a-tag>
            </div>
          </a-form-item>
          <a-form-item label="启用状态"><a-switch v-model:checked="card.isEnabled" /></a-form-item>
          <a-form-item label="重要程度"><a-radio-group v-model:value="card.ruleLevel" :options="levelOptions" /></a-form-item>
          <a-form-item label="描述" class="grid-full"><a-textarea v-model:value="card.description" :rows="4" /></a-form-item>
        </div>
      </a-card>

      <div v-if="cardList.length" class="drawer-actions">
        <a-button @click="closeDrawer">返回</a-button>
        <a-button type="primary" @click="submitCards">提交</a-button>
        <span>共 {{ cardList.length }} 条规则</span>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import DqcApi, { type DqcRuleDetailItem, type DqcRuleTemplateTreeNode } from '@/resources/dqc';

const emit = defineEmits<{
  accept: [rules: DqcRuleDetailItem[]];
}>();

const open = ref(false);
const treeData = ref<DqcRuleTemplateTreeNode[]>([]);
const selectedKeys = ref<string[]>([]);
const searchValue = ref('');
const cardList = ref<any[]>([]);
const wrapperRef = ref<HTMLElement>();
const context = reactive({ tableId: '' });

const operatorOptions = ['>', '>=', '<=', '<', '=', '!='].map((item) => ({ label: item, value: item }));
const levelOptions = ['P0', 'P1', 'P2'].map((item) => ({ label: item, value: item }));

const filteredTreeData = computed(() => {
  if (!searchValue.value) return treeData.value;
  const filterNode = (node: DqcRuleTemplateTreeNode): DqcRuleTemplateTreeNode | null => {
    const next = { ...node };
    if (node.children?.length) {
      next.children = node.children.map(filterNode).filter(Boolean) as DqcRuleTemplateTreeNode[];
      if (next.children.length) return next;
    }
    return node.label.toLowerCase().includes(searchValue.value.toLowerCase()) ? next : null;
  };
  return treeData.value.map(filterNode).filter(Boolean) as DqcRuleTemplateTreeNode[];
});

function templateTypeLabel(value?: string) {
  return { TABLE: '表级规则', FIELD: '字段级规则', SQL: 'SQL 规则', CUSTOM: '自定义规则' }[value || ''] || value || '/';
}

function splitThreshold(text?: string, thresholdType?: string) {
  const matched = String(text || '').match(/(>=|<=|!=|=|>|<)\s*(.+)/);
  return {
    thresholdOperator: matched?.[1] || '<=',
    thresholdValue: matched?.[2]?.replace('%', '') || (thresholdType === 'PERCENTAGE' ? '1' : '0'),
  };
}

async function showDrawer(payload: { tableId: string }) {
  context.tableId = payload.tableId;
  open.value = true;
  searchValue.value = '';
  cardList.value = [];
  selectedKeys.value = [];
  treeData.value = await DqcApi.fetchRuleTemplateTree(payload.tableId, 'TABLE');
}

async function handleSelect(keys: Array<string | number>, info: any) {
  if (!keys.length || info.node.children?.length) return;
  selectedKeys.value = [String(keys[0])];
  if (cardList.value.length >= 10) {
    message.error('单张表一次最多创建 10 条规则卡片');
    return;
  }
  const items = await DqcApi.generateRuleCards({ tableId: context.tableId, ruleTemplateId: String(info.node.value), generateMethod: 'MANUAL' });
  if (cardList.value.length + items.length > 10) {
    message.error('单张表一次最多创建 10 条规则卡片');
    return;
  }
  cardList.value.push(
    ...items.map((item) => ({
      ...item,
      ...splitThreshold(item.threshold, item.thresholdType),
      filterConditionText: item.filterExpr?.length ? "dt = '2026-04-22'" : '',
    })),
  );
  nextTick(() => wrapperRef.value?.scrollTo({ top: wrapperRef.value.scrollHeight, behavior: 'smooth' }));
}

function removeCard(index: number) {
  cardList.value.splice(index, 1);
}

function submitCards() {
  if (!cardList.value.length) {
    message.warning('请先生成规则卡片');
    return;
  }
  let hasError = false;
  const duplicateSet = new Set<string>();
  const normalized = cardList.value.map((item) => {
    item.error = false;
    item.errorMsg = '';
    if (!item.ruleName?.trim()) {
      item.error = true;
      item.errorMsg = '规则名称不能为空';
      hasError = true;
    }
    if (!item.thresholdOperator || item.thresholdValue === undefined || item.thresholdValue === '') {
      item.error = true;
      item.errorMsg = '监控阈值中的操作符和值不能为空';
      hasError = true;
    }
    if (item.thresholdType === 'PERCENTAGE' && Number(item.thresholdValue) < 0) {
      item.error = true;
      item.errorMsg = '监控阈值不能小于0，请修改后重试。';
      hasError = true;
    }
    const duplicateKey = [item.ruleTemplateName, item.showUseScope, item.thresholdOperator, item.thresholdValue].join('::');
    if (duplicateSet.has(duplicateKey)) {
      item.error = true;
      item.errorMsg = '当前卡片信息填写重复，请检查';
      hasError = true;
    }
    duplicateSet.add(duplicateKey);
    return {
      ...item,
      threshold: `${item.thresholdOperator} ${item.thresholdValue}${item.thresholdType === 'PERCENTAGE' ? '%' : ''}`,
      filterExpr: item.filterConditionText ? [{ expr: item.filterConditionText }] : [],
    };
  });
  if (hasError) {
    message.error('请检查卡片信息填写是否正确');
    return;
  }
  emit('accept', normalized.map((item) => ({
    ...item,
  })));
  closeDrawer();
}

function closeDrawer() {
  open.value = false;
}

defineExpose({ showDrawer });
</script>

<style scoped lang="less">
.drawer-tree {
  width: 280px;
  padding: 12px 10px 0 0;
  border-right: 1px solid rgba(16, 24, 40, 0.08);
}

.drawer-content {
  flex: 1;
  overflow: auto;
  padding-left: 14px;
}

.drawer-alert {
  margin: 12px 0;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tree-node__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tree-node__count {
  color: #667085;
  font-size: 12px;
}

.tree-node__use {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #1677ff;
  font-size: 12px;
}

.rule-card + .rule-card {
  margin-top: 12px;
}

.rule-card--error {
  border-color: #f5222d;
}

.drawer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin: 14px 0 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.form-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-full {
  grid-column: 1 / -1;
}

.threshold-editor {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.threshold-editor__label::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 999px;
  background: #cd201f;
}

:deep(.ant-tree) {
  padding: 0 8px;
  height: calc(100vh - 110px);
  overflow-y: auto;
}

:deep(.ant-tree .ant-tree-treenode) {
  width: 230px;
  border-radius: 4px;
}

:deep(.ant-tree .ant-tree-treenode-selected) {
  background: #f0f7ff;
  color: #1677ff;
}
</style>
