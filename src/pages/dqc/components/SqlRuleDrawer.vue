<template>
  <a-drawer
    :open="open"
    title="新建规则"
    width="1010"
    :body-style="{ padding: '0 10px', display: 'flex', minWidth: '980px' }"
    @close="closeDrawer"
  >
    <div class="sql-layout">
      <div class="sql-layout__tree">
        <a-input-search v-model:value="searchValue" size="small" placeholder="请输入关键字" />
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

      <div class="sql-layout__content">
        <a-alert type="warning" show-icon class="sql-alert">
          <template #message><p>解析SQL说明：</p></template>
          <template #description>
            <p>1. 表创建质量监控时，通过自定义 SQL 配置规则后，质量监控中设置的数据范围将不会生效。</p>
            <p>2. 解析 SQL 中生成的监控字段，监控字段按照 OR 的关系进行监控预警。</p>
            <p>3. 每次解析后将覆盖当前解析字段，但如果字段别名没有变化，阈值将沿用当前设置。</p>
          </template>
        </a-alert>

        <a-card v-for="(card, index) in cardList" :key="card.id" size="small" class="rule-card" :class="{ 'rule-card--error': card.error }" :title="card.errorMsg || undefined" :head-style="card.error ? { color: '#f5222d' } : undefined" :body-style="{ padding: '10px' }" :hoverable="true">
          <template #extra>
            <a-button type="link" danger @click="removeCard(index)">删除</a-button>
          </template>
          <div class="form-grid form-grid--2">
            <a-form-item label="规则名称"><a-input v-model:value="card.ruleName" /></a-form-item>
            <a-form-item label="规则模板"><a-input v-model:value="card.ruleTemplateName" disabled /></a-form-item>
            <a-form-item label="规则类型"><a-select v-model:value="card.ruleTemplateType" :options="templateTypeOptions" /></a-form-item>
            <a-form-item label="SQL" class="grid-full">
              <div class="sql-toolbar">
                <a-space>
                  <a-button size="small" @click="copySql(card)">复制</a-button>
                  <a-button size="small" @click="openFullscreen(card)">
                    <template #icon><FullscreenOutlined /></template>
                    全屏
                  </a-button>
                </a-space>
              </div>
              <CodeEditor v-model="card.customSql" language="sql" :height="260" />
              <div class="sql-actions">
                <a-space>
                  <a-button type="primary" size="small" :disabled="!card.customSql" @click="formatSql(card)">格式化</a-button>
                  <a-button type="primary" size="small" :disabled="!card.customSql" @click="parseSql(card)">解析</a-button>
                </a-space>
              </div>
            </a-form-item>
            <a-form-item label="监控阈值" class="grid-full">
              <a-table
                v-if="card.customSqlFields?.conditions?.length"
                :data-source="card.customSqlFields.conditions"
                :pagination="false"
                :columns="thresholdColumns"
                size="small"
                bordered
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'threshold'">
                    <div class="threshold-editor">
                      <span class="threshold-editor__label">异常阈值</span>
                      <a-select v-model:value="record.operator" :options="operatorOptions" style="width: 140px" />
                      <a-input v-model:value="record.value" style="width: 220px" />
                    </div>
                  </template>
                </template>
              </a-table>
              <span v-else>解析 SQL 获取</span>
            </a-form-item>
            <a-form-item label="启用状态"><a-switch v-model:checked="card.isEnabled" /></a-form-item>
            <a-form-item label="重要程度"><a-radio-group v-model:value="card.ruleLevel" :options="levelOptions" /></a-form-item>
            <a-form-item label="描述" class="grid-full"><a-textarea v-model:value="card.description" :rows="4" /></a-form-item>
          </div>
        </a-card>

        <div v-if="cardList.length" class="sql-footer">
          <a-button @click="closeDrawer">返回</a-button>
          <a-button type="primary" @click="submitCards">提交</a-button>
          <span>共 {{ cardList.length }} 条规则</span>
        </div>
      </div>
    </div>
  </a-drawer>

  <a-modal
    v-model:open="fullscreenOpen"
    title="SQL 编辑器"
    :width="'100vw'"
    wrap-class-name="sql-rule-fullscreen-modal"
    :style="{ top: 0, maxWidth: '100vw', paddingBottom: 0 }"
    :body-style="{ height: 'calc(100vh - 110px)', padding: '16px', overflow: 'hidden' }"
    @ok="applyFullscreenSql"
  >
    <div class="sql-fullscreen-shell">
      <div class="sql-fullscreen-toolbar">
        <a-space>
          <a-button size="small" @click="copyFullscreenSql">复制</a-button>
          <a-button size="small" type="primary" @click="formatFullscreenSql">格式化</a-button>
          <a-button size="small" type="primary" @click="parseFullscreenSql">解析</a-button>
        </a-space>
      </div>
      <CodeEditor v-model="fullscreenSql" language="sql" :height="`calc(100vh - 260px)`" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { format } from 'sql-formatter';
import { message } from 'ant-design-vue';
import { FullscreenOutlined, PlusOutlined } from '@ant-design/icons-vue';
import CodeEditor from '@/components/CodeEditor.vue';
import DqcApi, { type DqcRuleDetailItem, type DqcRuleTemplateTreeNode } from '@/resources/dqc';

const emit = defineEmits<{
  accept: [rules: DqcRuleDetailItem[]];
}>();

const open = ref(false);
const treeData = ref<DqcRuleTemplateTreeNode[]>([]);
const selectedKeys = ref<string[]>([]);
const searchValue = ref('');
const cardList = ref<any[]>([]);
const context = ref({ tableId: '' });
const fullscreenOpen = ref(false);
const fullscreenCardId = ref('');
const fullscreenSql = ref('');

const operatorOptions = ['>', '>=', '<=', '<', '=', '!='].map((item) => ({ label: item, value: item }));
const levelOptions = ['P0', 'P1', 'P2'].map((item) => ({ label: item, value: item }));
const templateTypeOptions = [
  { label: '表级规则', value: 'TABLE' },
  { label: '字段级规则', value: 'FIELD' },
  { label: 'SQL 规则', value: 'SQL' },
  { label: '自定义规则', value: 'CUSTOM' },
];
const thresholdColumns = [
  { title: '监控字段', dataIndex: 'col', key: 'col', width: 220 },
  { title: '阈值设置', key: 'threshold' },
];

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

async function showDrawer(payload: { tableId: string }) {
  context.value = payload;
  open.value = true;
  searchValue.value = '';
  cardList.value = [];
  selectedKeys.value = [];
  treeData.value = await DqcApi.fetchRuleTemplateTree(payload.tableId, 'CUSTOM_SQL');
}

async function handleTemplateSelect(keys: Array<string | number>, info: any) {
  if (!keys.length || info.node.children?.length) return;
  selectedKeys.value = [String(keys[0])];
  if (cardList.value.length >= 10) {
    message.error('单张表一次最多创建 10 条规则卡片');
    return;
  }
  const rules = await DqcApi.generateRuleCards({ tableId: context.value.tableId, ruleTemplateId: String(info.node.value), generateMethod: 'MANUAL' });
  if (cardList.value.length + rules.length > 10) {
    message.error('单张表一次最多创建 10 条规则卡片');
    return;
  }
  cardList.value.push(...rules);
}

function formatSql(card: any) {
  try {
    card.customSql = format(card.customSql || '', { language: 'mysql' });
  } catch {
    message.warning('无法格式化 SQL，可能已被格式化或不支持当前语法。');
  }
}

async function parseSql(card: any) {
  card.customSqlFields = {
    logic: 'OR',
    conditions: await DqcApi.parseSqlFields(card.customSql || ''),
  };
}

function openFullscreen(card: any) {
  fullscreenCardId.value = card.id;
  fullscreenSql.value = card.customSql || '';
  fullscreenOpen.value = true;
}

function applyFullscreenSql() {
  const target = cardList.value.find((item) => item.id === fullscreenCardId.value);
  if (target) {
    target.customSql = fullscreenSql.value;
  }
  fullscreenOpen.value = false;
}

async function parseFullscreenSql() {
  const target = cardList.value.find((item) => item.id === fullscreenCardId.value);
  if (!target) return;
  target.customSql = fullscreenSql.value;
  await parseSql(target);
  fullscreenSql.value = target.customSql || '';
  message.success('SQL 解析完成');
}

function formatFullscreenSql() {
  try {
    fullscreenSql.value = format(fullscreenSql.value || '', { language: 'mysql' });
  } catch {
    message.warning('无法格式化 SQL，可能已被格式化或不支持当前语法。');
  }
}

async function copyFullscreenSql() {
  if (!fullscreenSql.value) {
    message.warning('SQL 为空');
    return;
  }
  await navigator.clipboard.writeText(fullscreenSql.value);
  message.success('已复制到剪贴板');
}

async function copySql(card: any) {
  if (!card.customSql) {
    message.warning('SQL 为空');
    return;
  }
  await navigator.clipboard.writeText(card.customSql);
  message.success('已复制到剪贴板');
}

function removeCard(index: number) {
  cardList.value.splice(index, 1);
}

function submitCards() {
  if (!cardList.value.length) {
    message.warning('请先生成规则');
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
    if (!item.customSql?.trim()) {
      item.error = true;
      item.errorMsg = 'SQL 不能为空';
      hasError = true;
    }
    if (!item.customSqlFields?.conditions?.length) {
      item.error = true;
      item.errorMsg = '请先解析 SQL';
      hasError = true;
    }
    item.customSqlFields?.conditions?.forEach((cond: any) => {
      if (!cond.operator || cond.value === undefined || cond.value === '') {
        item.error = true;
        item.errorMsg = '监控阈值中的操作符和值不能为空';
        hasError = true;
      }
    });
    const duplicateKey = [item.ruleTemplateName, item.customSql, JSON.stringify(item.customSqlFields?.conditions || [])].join('::');
    if (duplicateSet.has(duplicateKey)) {
      item.error = true;
      item.errorMsg = '当前卡片信息填写重复，请检查';
      hasError = true;
    }
    duplicateSet.add(duplicateKey);
    return {
      ...item,
      threshold: item.customSqlFields?.conditions?.[0] ? `${item.customSqlFields.conditions[0].operator} ${item.customSqlFields.conditions[0].value}` : item.threshold,
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
  fullscreenOpen.value = false;
  fullscreenCardId.value = '';
  fullscreenSql.value = '';
}

defineExpose({ showDrawer });
</script>

<style scoped lang="less">
.sql-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 14px;
  width: 100%;
}

.sql-layout__tree {
  padding-top: 12px;
  border-right: 1px solid rgba(16, 24, 40, 0.08);
}

.sql-layout__content {
  overflow: auto;
  padding: 12px 0 12px 8px;
}

.sql-alert {
  margin-bottom: 12px;
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

.sql-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.sql-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.rule-card + .rule-card {
  margin-top: 12px;
}

.rule-card--error {
  border-color: #f5222d;
}

.sql-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin: 14px 0 8px;
}

.sql-fullscreen-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.sql-fullscreen-toolbar {
  display: flex;
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
  height: calc(100vh - 105px);
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

<style>
.sql-rule-fullscreen-modal .ant-modal {
  top: 0;
  max-width: 100vw;
  margin: 0;
  padding-bottom: 0;
  height: 100vh;
}

.sql-rule-fullscreen-modal .ant-modal-content {
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.sql-rule-fullscreen-modal .ant-modal-body {
  flex: 1;
}
</style>
