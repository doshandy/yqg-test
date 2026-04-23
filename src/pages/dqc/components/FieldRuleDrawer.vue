<template>
  <a-drawer
    :open="open"
    title="新建规则"
    width="1300"
    :body-style="{ padding: '0 10px', display: 'flex', minWidth: '1100px' }"
    @close="closeDrawer"
  >
    <div class="field-layout">
      <div class="field-layout__tree">
        <a-input-search v-model:value="treeKeyword" size="small" placeholder="请输入关键字" />
        <a-tree
          v-if="treeData.length"
          :tree-data="filteredTreeData"
          :selected-keys="selectedKeys"
          default-expand-all
          block-node
          @select="handleTemplateSelect"
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

      <div class="field-layout__fields">
        <span class="field-title"><span class="required">*</span> 字段选择</span>
        <a-alert type="warning" show-icon message="蓝色字体字段，表示该字段已配置该规则模板。" />
        <a-input-search v-model:value="fieldKeyword" allow-clear placeholder="请输入字段关键字" />
        <a-table
          row-key="value"
          :data-source="filteredFields"
          :columns="fieldColumns"
          :pagination="false"
          :row-selection="rowSelection"
          size="small"
          bordered
          :scroll="{ y: 'calc(100vh - 270px)' }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'field'">
              <span :class="{ 'field-blue': record.isBlue }">{{ record.label }}</span>
            </template>
          </template>
        </a-table>
        <div v-if="selectedFields.length" class="field-actions">
          <span>共选中 {{ selectedFields.length }} 个字段</span>
          <a-button type="primary" size="small" @click="generateCards">生成规则卡片</a-button>
        </div>
      </div>

      <div class="field-layout__cards">
        <a-input-search v-if="cardList.length" v-model:value="cardKeyword" allow-clear placeholder="请输入字段关键字" />
        <div class="field-card-list">
          <a-card v-for="card in filteredCards" :key="card.id" size="small" class="rule-card" :class="{ 'rule-card--error': card.error }" :title="card.errorMsg || undefined" :head-style="card.error ? { color: '#f5222d' } : undefined" :body-style="{ padding: '10px' }" :hoverable="true">
            <template #extra>
              <a-button type="link" danger @click="removeCardById(card.id)">删除</a-button>
            </template>
            <div class="form-grid form-grid--2">
              <a-form-item label="规则名称"><a-input v-model:value="card.ruleName" /></a-form-item>
              <a-form-item label="规则模板"><a-input v-model:value="card.ruleTemplateName" disabled /></a-form-item>
              <a-form-item label="规则类型"><a-input :value="templateTypeLabel(card.ruleTemplateType)" disabled /></a-form-item>
              <a-form-item label="规则范围">
                <a-select v-model:value="card.fieldsName" :options="fieldOptions" show-search />
              </a-form-item>
              <a-form-item label="过滤条件" class="grid-full">
                <a-textarea v-model:value="card.filterConditionText" :rows="3" />
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
        </div>
        <div v-if="cardList.length" class="field-actions field-actions--footer">
          <a-button @click="closeDrawer">返回</a-button>
          <a-button type="primary" @click="submitCards">提交</a-button>
          <span>共 {{ cardList.length }} 条规则</span>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import DqcApi, { type DqcRuleDetailItem, type DqcRuleFieldOption, type DqcRuleTemplateTreeNode } from '@/resources/dqc';

const emit = defineEmits<{
  accept: [rules: DqcRuleDetailItem[]];
}>();

const open = ref(false);
const treeData = ref<DqcRuleTemplateTreeNode[]>([]);
const selectedKeys = ref<string[]>([]);
const treeKeyword = ref('');
const fieldKeyword = ref('');
const cardKeyword = ref('');
const fieldOptions = ref<Array<{ label: string; value: string; isBlue?: boolean }>>([]);
const selectedFields = ref<string[]>([]);
const selectedTemplateId = ref('');
const allowMultiFields = ref(true);
const cardList = ref<any[]>([]);
const context = reactive({ tableId: '', existingFields: [] as string[] });

const operatorOptions = ['>', '>=', '<=', '<', '=', '!='].map((item) => ({ label: item, value: item }));
const levelOptions = ['P0', 'P1', 'P2'].map((item) => ({ label: item, value: item }));
const fieldColumns = [
  { title: '字段英文名', dataIndex: 'field', key: 'field' },
  { title: '主键', dataIndex: 'isPrimaryKey', key: 'isPrimaryKey', width: 70 },
];

const filteredTreeData = computed(() => {
  if (!treeKeyword.value) return treeData.value;
  const filterNode = (node: DqcRuleTemplateTreeNode): DqcRuleTemplateTreeNode | null => {
    const next = { ...node };
    if (node.children?.length) {
      next.children = node.children.map(filterNode).filter(Boolean) as DqcRuleTemplateTreeNode[];
      if (next.children.length) return next;
    }
    return node.label.toLowerCase().includes(treeKeyword.value.toLowerCase()) ? next : null;
  };
  return treeData.value.map(filterNode).filter(Boolean) as DqcRuleTemplateTreeNode[];
});

const filteredFields = computed(() =>
  fieldOptions.value
    .filter((item) => !fieldKeyword.value || item.label.toLowerCase().includes(fieldKeyword.value.toLowerCase()))
    .map((item) => ({
      ...item,
      fieldName: item.value,
      isPrimaryKey: ['id', 'user_id', 'dt'].includes(item.value),
    })),
);

const filteredCards = computed(() =>
  cardList.value.filter((item) => !cardKeyword.value || String(item.fieldsName || '').toLowerCase().includes(cardKeyword.value.toLowerCase())),
);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedFields.value,
  onChange: (keys: Array<string | number>) => {
    const values = keys.map(String);
    selectedFields.value = allowMultiFields.value ? values : values.slice(-1);
  },
  getCheckboxProps: (record: any) => ({
    disabled: !selectedTemplateId.value || (!allowMultiFields.value && selectedFields.value.length > 0 && !selectedFields.value.includes(record.value)),
  }),
}));

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

async function showDrawer(payload: { tableId: string; existingRules?: DqcRuleDetailItem[] }) {
  context.tableId = payload.tableId;
  context.existingFields = (payload.existingRules || []).map((item) => item.fieldsName || '').filter(Boolean);
  open.value = true;
  treeKeyword.value = '';
  fieldKeyword.value = '';
  cardKeyword.value = '';
  cardList.value = [];
  selectedFields.value = [];
  selectedTemplateId.value = '';
  allowMultiFields.value = true;
  treeData.value = await DqcApi.fetchRuleTemplateTree(payload.tableId, 'FIELD');
  const fields = await DqcApi.fetchRuleFieldOptions(payload.tableId);
  fieldOptions.value = fields.map((item: DqcRuleFieldOption) => ({
    label: `${item.label}(${item.columnType})`,
    value: item.value,
    isBlue: context.existingFields.includes(item.value),
  }));
}

function handleTemplateSelect(keys: Array<string | number>, info: any) {
  if (!keys.length || info.node.children?.length) return;
  selectedKeys.value = [String(keys[0])];
  selectedTemplateId.value = String(info.node.value);
  allowMultiFields.value = !!info.node.allowMultiFields;
  selectedFields.value = [];
}

async function generateCards() {
  if (!selectedTemplateId.value) {
    message.warning('请先选择规则模板');
    return;
  }
  if (!selectedFields.value.length) {
    message.warning('请先选择字段');
    return;
  }
  if (cardList.value.length >= 10) {
    message.error('单张表一次最多创建 10 条规则卡片');
    return;
  }
  const rules = await DqcApi.generateRuleCards({
    tableId: context.tableId,
    ruleTemplateId: selectedTemplateId.value,
    selectedFields: selectedFields.value,
    generateMethod: 'MANUAL',
  });
  if (cardList.value.length + rules.length > 10) {
    message.error('单张表一次最多创建 10 条规则卡片');
    return;
  }
  cardList.value.push(
    ...rules.map((item) => ({
      ...item,
      ...splitThreshold(item.threshold, item.thresholdType),
      filterConditionText: item.filterExpr?.length ? "dt = '2026-04-22'" : '',
    })),
  );
}

function removeCard(index: number) {
  cardList.value.splice(index, 1);
}

function removeCardById(id: string) {
  cardList.value = cardList.value.filter((item) => item.id !== id);
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
    if (!item.fieldsName) {
      item.error = true;
      item.errorMsg = '规则范围不能为空';
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
    const duplicateKey = [item.ruleTemplateName, item.fieldsName, item.thresholdOperator, item.thresholdValue].join('::');
    if (duplicateSet.has(duplicateKey)) {
      item.error = true;
      item.errorMsg = '当前卡片信息填写重复，请检查';
      hasError = true;
    }
    duplicateSet.add(duplicateKey);
    return {
      ...item,
      showUseScope: `${item.fieldsName}(string)`,
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
.field-layout {
  display: grid;
  grid-template-columns: 250px 360px minmax(0, 1fr);
  gap: 14px;
  width: 100%;
}

.field-layout__tree,
.field-layout__fields,
.field-layout__cards {
  min-height: 100%;
}

.field-layout__tree {
  padding-top: 12px;
  border-right: 1px solid rgba(16, 24, 40, 0.08);
}

.field-layout__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
}

.field-layout__cards {
  padding: 12px 0 12px 8px;
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

.field-title {
  font-size: 14px;
}

.required {
  color: #f5222d;
}

.field-blue {
  color: #1677ff;
}

.field-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-card--error {
  border-color: #f5222d;
}

.field-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.field-actions--footer {
  justify-content: flex-end;
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
