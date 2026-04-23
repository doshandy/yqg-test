<template>
  <div class="tag-page">
    <a-form :model="filters" layout="inline" class="tag-search-card">
      <a-form-item label="指标名称">
        <a-input v-model:value="filters.metricsName" allow-clear placeholder="请输入指标名称" style="width: 180px" />
      </a-form-item>
      <a-form-item label="标签编码">
        <a-input v-model:value="filters.ruleCode" allow-clear placeholder="请输入标签编码" style="width: 180px" />
      </a-form-item>
      <a-form-item label="标签名称">
        <a-input v-model:value="filters.ruleName" allow-clear placeholder="请输入标签名称" style="width: 180px" />
      </a-form-item>
      <a-form-item label="标签时效">
        <a-select v-model:value="filters.ruleTimeliness" allow-clear :options="timelinessOptions" style="width: 150px" />
      </a-form-item>
      <a-form-item label="状态">
        <a-select v-model:value="filters.status" allow-clear :options="statusOptions" style="width: 140px" />
      </a-form-item>
      <a-form-item label="自定义类型">
        <a-select v-model:value="filters.customType" allow-clear :options="customTypeOptions" style="width: 150px" />
      </a-form-item>
      <a-form-item label="分类">
        <a-cascader
          v-model:value="filters.parentIdPath"
          :options="categoryOptions"
          :field-names="{ label: 'label', value: 'value', children: 'children' }"
          change-on-select
          allow-clear
          placeholder="请选择分类"
          style="width: 210px"
        />
      </a-form-item>
      <a-form-item label="创建人">
        <a-input v-model:value="filters.creatorName" allow-clear placeholder="请输入创建人" style="width: 160px" />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button @click="handleReset">重置</a-button>
          <a-button type="primary" @click="fetchData">搜索</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <div class="tag-page__toolbar">
      <a-space>
        <a-button type="primary" @click="openModal()">新建指标标签</a-button>
        <a-button @click="openModal({ customType: 'SQL' } as RuleTagItem)">新建SQL标签</a-button>
        <a-button @click="openFileModal">上传数据文件</a-button>
      </a-space>
      <a-space>
        <a-button @click="fetchData">刷新</a-button>
      </a-space>
    </div>

    <a-table
      :data-source="list"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1560 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'parentId'">
          {{ categoryPathLabelMap[record.parentId || ''] || record.parentId || '-' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-badge :status="record.status === 'ONLINE' ? 'success' : 'default'" />
          {{ statusLabelMap[record.status] }}
        </template>
        <template v-else-if="column.key === 'customType'">
          {{ customTypeLabelMap[record.customType || ''] || record.customType || '-' }}
        </template>
        <template v-else-if="column.key === 'op'">
          <a-space wrap>
            <a-button size="small" @click="openDetail(record)">查看详情</a-button>
            <a-button size="small" type="primary" @click="openModal(record)">编辑</a-button>
            <a-button v-if="record.customType === 'SQL'" size="small" @click="openSqlExecute(record)">立即计算</a-button>
            <a-button size="small" @click="openModal({ ...record, id: undefined, code: '', ruleCode: '', name: `${record.name}-副本`, ruleName: `${record.name}-副本` } as RuleTagItem)">复制</a-button>
            <a-popconfirm
              :title="record.status === 'ONLINE' ? '确认下线？' : '确认上线？'"
              @confirm="handleToggleStatus(record)"
            >
              <a-button size="small">{{ record.status === 'ONLINE' ? '下线' : '上线' }}</a-button>
            </a-popconfirm>
            <a-popconfirm title="删除后标签数据不会保存，确认删除？" @confirm="handleDelete(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="editOpen" :title="form.id ? '编辑标签' : '创建标签'" width="1120px" :confirm-loading="saving" @ok="handleSave">
      <a-tabs v-model:activeKey="editTab">
        <a-tab-pane key="base" tab="基本信息">
          <a-form layout="vertical">
            <div class="edit-grid">
              <a-form-item label="标签编码">
                <a-input v-model:value="form.ruleCode" :disabled="Boolean(form.id)" placeholder="保存后可自动生成" />
              </a-form-item>
              <a-form-item label="标签名称" required>
                <a-input v-model:value="form.ruleName" placeholder="请输入标签名称" />
              </a-form-item>
              <a-form-item label="自定义类型" required>
                <a-select v-model:value="form.customType" :options="customTypeOptions" />
              </a-form-item>
              <a-form-item label="标签时效" required>
                <a-select v-model:value="form.ruleTimeliness" :options="timelinessOptions" />
              </a-form-item>
              <a-form-item label="负责人">
                <a-input v-model:value="form.owner" />
              </a-form-item>
              <a-form-item label="创建人">
                <a-input v-model:value="form.creatorName" />
              </a-form-item>
              <a-form-item label="分类" class="grid-span-2">
                <a-cascader
                  v-model:value="form.parentIdPath"
                  :options="categoryOptions"
                  :field-names="{ label: 'label', value: 'value', children: 'children' }"
                  change-on-select
                />
                <div v-if="selectedCategoryPathLabel" class="field-hint">当前分类路径：{{ selectedCategoryPathLabel }}</div>
              </a-form-item>
              <a-form-item label="规则表达式" class="grid-span-2">
                <a-textarea v-model:value="form.expression" :rows="4" placeholder="支持规则拼接或 SQL 条件说明" />
              </a-form-item>
            </div>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="logic" tab="规则配置">
          <div class="rule-editor">
            <div class="rule-editor__left">
              <div class="panel-title">候选指标树</div>
              <a-input v-model:value="metricsKeyword" allow-clear placeholder="按指标名称筛选" style="margin-bottom: 12px" />
              <div class="metric-list">
                <a-card v-for="item in filteredMetrics" :key="item.metricsCode || item.code" size="small" class="metric-card">
                  <div class="metric-card__title">{{ item.metricsName || item.name }}</div>
                  <div class="metric-card__meta">{{ item.metricsCode || item.code }} / {{ item.type || item.dataType }}</div>
                  <div class="metric-card__meta">{{ metricsCustomTypeLabelMap[item.metricsCustomType || ''] || item.metricsCustomType || '普通' }}</div>
                  <a-button type="link" size="small" @click="appendRuleNode(item)">加入规则</a-button>
                </a-card>
              </div>
            </div>
            <div class="rule-editor__right">
              <div class="panel-title">规则组</div>
              <a-alert
                type="info"
                show-icon
                message="按“左侧指标树 + 右侧规则组”的方式组织规则，可直接拼装表达式并保存标签规则。"
                style="margin-bottom: 12px"
              />
              <div class="logic-list">
                <div v-for="(node, index) in ruleNodes" :key="node.id" class="logic-row">
                  <a-space align="start" style="width: 100%">
                    <a-select v-model:value="node.logic" :options="logicOptions" style="width: 100px" />
                    <a-input v-model:value="node.metricName" placeholder="指标名称" style="width: 180px" />
                    <a-select v-model:value="node.operator" :options="operatorOptions" style="width: 110px" />
                    <a-input v-model:value="node.value" placeholder="阈值" style="width: 180px" />
                    <a-button @click="copyRuleNode(node)">复制规则</a-button>
                    <a-button danger @click="removeRuleNode(index)">删除规则</a-button>
                  </a-space>
                </div>
              </div>
              <a-space>
                <a-button type="dashed" @click="appendRuleNode()">新增规则组</a-button>
                <a-button @click="syncExpressionFromNodes">同步到表达式</a-button>
              </a-space>
            </div>
          </div>
        </a-tab-pane>
        <a-tab-pane v-if="form.customType === 'SQL'" key="sql" tab="SQL编辑">
          <a-alert type="warning" show-icon message="SQL 标签使用独立编辑区维护查询逻辑，提交后会同步更新标签规则。" style="margin-bottom: 12px" />
          <a-textarea v-model:value="sqlText" :rows="18" />
        </a-tab-pane>
        <a-tab-pane v-if="form.customType === 'CSV'" key="file" tab="文件配置">
          <a-upload-dragger :before-upload="() => false" :show-upload-list="false" @change="handleFileChange">
            <p class="ant-upload-text">拖拽文件到此处，或点击上传</p>
            <p class="ant-upload-hint">上传后会记录文件名并生成预览信息。</p>
          </a-upload-dragger>
          <a-typography-paragraph v-if="uploadedFileName" style="margin-top: 12px">
            当前文件：{{ uploadedFileName }}
          </a-typography-paragraph>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <a-modal v-model:open="fileModalOpen" title="上传数据文件" width="720px" @ok="confirmUploadFile">
      <a-form layout="vertical">
        <a-form-item label="标签名称">
          <a-input v-model:value="fileUploadForm.ruleName" placeholder="请输入标签名称" />
        </a-form-item>
        <a-form-item label="数据文件">
          <a-upload-dragger :before-upload="() => false" :show-upload-list="false" @change="handleStandaloneFileChange">
            <p class="ant-upload-text">拖拽 CSV 文件到此处，或点击上传</p>
          </a-upload-dragger>
        </a-form-item>
        <a-alert v-if="fileUploadForm.fileName" type="success" show-icon :message="`已选择文件：${fileUploadForm.fileName}`" />
      </a-form>
    </a-modal>

    <a-modal v-model:open="executeOpen" title="立即计算" @ok="handleExecuteConfirm">
      <p>该标签将立即重新计算。</p>
      <p>由于标签系统通常在 0 点到 7 点进行依赖数据计算，建议避开该时间段执行。</p>
    </a-modal>

    <a-modal v-model:open="historyCompareOpen" title="历史版本对比" width="900px" :footer="null">
      <a-table :data-source="historyCompareRows" :columns="historyCompareColumns" :pagination="false" row-key="field" size="small" />
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="标签详情" width="920px">
      <a-tabs v-model:activeKey="detailTab">
        <a-tab-pane key="base" tab="基本信息">
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="标签编码">{{ currentDetail?.ruleCode || currentDetail?.code }}</a-descriptions-item>
            <a-descriptions-item label="标签名称">{{ currentDetail?.ruleName || currentDetail?.name }}</a-descriptions-item>
            <a-descriptions-item label="自定义类型">{{ customTypeLabelMap[currentDetail?.customType || ''] || currentDetail?.customType }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ statusLabelMap[currentDetail?.status || 'OFFLINE'] }}</a-descriptions-item>
            <a-descriptions-item label="创建人">{{ currentDetail?.creatorName || currentDetail?.owner }}</a-descriptions-item>
            <a-descriptions-item label="分类">{{ categoryPathLabelMap[currentDetail?.parentId || ''] || currentDetail?.parentId || '/' }}</a-descriptions-item>
            <a-descriptions-item label="规则表达式" :span="2">{{ currentDetail?.expression }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="history" tab="历史记录">
          <div class="detail-history__toolbar">
            <a-button type="primary" :disabled="selectedHistoryKeys.length !== 2" @click="openHistoryCompare">对比</a-button>
            <span class="detail-history__tip">请选择两项作为对比</span>
          </div>
          <a-table
            :data-source="historyRows"
            :columns="historyColumns"
            :pagination="false"
            row-key="id"
            size="small"
            :row-selection="{ selectedRowKeys: selectedHistoryKeys, onChange: onHistorySelectChange }"
          />
        </a-tab-pane>
        <a-tab-pane key="other" tab="其他信息">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="数据更新时间">{{ currentDetail?.dataUpdateTime }}</a-descriptions-item>
            <a-descriptions-item label="标签时效">{{ timelinessLabelMap[currentDetail?.ruleTimeliness || ''] || currentDetail?.ruleTimeliness }}</a-descriptions-item>
            <a-descriptions-item label="使用数">{{ currentDetail?.ruleUsedNum }}</a-descriptions-item>
            <a-descriptions-item label="命中率">{{ currentDetail?.hitRate }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane v-if="currentDetail?.customType === 'SQL'" key="sql" tab="SQL详情">
          <a-alert type="info" show-icon message="当前标签为 SQL 类型，以下展示最新 SQL 配置内容。" style="margin-bottom: 16px" />
          <pre class="sql-preview">{{ sqlText }}</pre>
        </a-tab-pane>
      </a-tabs>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { message } from 'ant-design-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import type { UploadChangeParam } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type CategoryNode, type MetricItem, type RuleTagItem } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';

type CascaderOption = {
  label: string;
  value: string;
  children?: CascaderOption[];
};

type RuleNode = {
  id: string;
  logic: 'AND' | 'OR';
  metricName: string;
  operator: string;
  value: string;
};

type HistoryRow = {
  id: string;
  version: string;
  updateTime: string;
  operator: string;
  expression: string;
  status: RuleTagItem['status'];
  timeliness: string;
};

const loading = ref(false);
const saving = ref(false);
const editOpen = ref(false);
const detailOpen = ref(false);
const detailTab = ref('base');
const executeOpen = ref(false);
const fileModalOpen = ref(false);
const historyCompareOpen = ref(false);
const editTab = ref('base');
const list = ref<RuleTagItem[]>([]);
const currentDetail = ref<RuleTagItem | null>(null);
const currentExecute = ref<RuleTagItem | null>(null);
const historyRows = ref<HistoryRow[]>([]);
const selectedHistoryKeys = ref<string[]>([]);
const categoryTree = ref<CategoryNode | null>(null);
const categoryPathMap = ref<Record<string, string[]>>({});
const categoryPathLabelMap = ref<Record<string, string>>({});
const availableMetrics = ref<MetricItem[]>([]);
const metricsKeyword = ref('');
const sqlText = ref("select user_id\nfrom ec_user_tag.user_profile_di\nwhere active_days_30 > 10");
const uploadedFileName = ref('');

const filters = reactive({
  metricsName: '',
  ruleCode: '',
  ruleName: '',
  ruleTimeliness: undefined as string | undefined,
  status: undefined as string | undefined,
  customType: undefined as string | undefined,
  parentIdPath: undefined as string[] | undefined,
  creatorName: '',
});

const fileUploadForm = reactive({
  ruleName: '',
  fileName: '',
});

const form = reactive<Partial<RuleTagItem> & { parentIdPath?: string[] }>({
  code: '',
  ruleCode: '',
  name: '',
  ruleName: '',
  expression: '',
  customType: 'NORMAL',
  owner: 'demo_user',
  creatorName: 'demo_user',
  status: 'OFFLINE',
  parentId: 'cat-growth-1',
  parentIdPath: undefined,
  ruleTimeliness: 'T+1',
});

const ruleNodes = ref<RuleNode[]>([]);

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const statusOptions = [
  { label: '已生效', value: 'ONLINE' },
  { label: '待下线', value: 'OFFLINE' },
];
const statusLabelMap: Record<string, string> = {
  ONLINE: '已生效',
  OFFLINE: '待下线',
};
const customTypeOptions = [
  { label: '普通标签', value: 'NORMAL' },
  { label: 'SQL标签', value: 'SQL' },
  { label: '文件标签', value: 'CSV' },
];
const customTypeLabelMap: Record<string, string> = {
  NORMAL: '普通标签',
  SQL: 'SQL标签',
  CSV: '文件标签',
};
const timelinessOptions = [
  { label: 'T+1', value: 'T+1' },
  { label: '实时', value: '实时' },
  { label: '小时级', value: '小时级' },
];
const timelinessLabelMap: Record<string, string> = {
  'T+1': 'T+1',
  实时: '实时',
  小时级: '小时级',
};
const logicOptions = [
  { label: 'AND', value: 'AND' },
  { label: 'OR', value: 'OR' },
];
const operatorOptions = ['>', '>=', '<', '<=', '=', '!=', 'in', 'between'].map((value) => ({ label: value, value }));

const columns = [
  { title: '标签编码', dataIndex: 'ruleCode', key: 'ruleCode', width: 150 },
  { title: '标签名称', dataIndex: 'ruleName', key: 'ruleName', width: 160 },
  { title: '分类', key: 'parentId', width: 180 },
  { title: '数据更新时间', dataIndex: 'dataUpdateTime', key: 'dataUpdateTime', width: 180 },
  { title: '标签时效', dataIndex: 'ruleTimeliness', key: 'ruleTimeliness', width: 120 },
  { title: '自定义类型', key: 'customType', width: 120 },
  { title: '状态', key: 'status', width: 120 },
  { title: '使用数', dataIndex: 'ruleUsedNum', key: 'ruleUsedNum', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '创建人', dataIndex: 'creatorName', key: 'creatorName', width: 120 },
  { title: '操作', key: 'op', width: 420, fixed: 'right' as const },
];

const historyColumns = [
  { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
  { title: '表达式', dataIndex: 'expression', key: 'expression' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
];

const historyCompareColumns = [
  { title: '字段', dataIndex: 'field', key: 'field', width: 160 },
  { title: '较早版本', dataIndex: 'left', key: 'left' },
  { title: '较新版本', dataIndex: 'right', key: 'right' },
];

const categoryOptions = computed<CascaderOption[]>(() => {
  if (!categoryTree.value) return [];
  const convert = (node: CategoryNode): CascaderOption => ({
    label: node.metricsName,
    value: node.id,
    children: node.children?.length ? node.children.map(convert) : undefined,
  });
  return [convert(categoryTree.value)];
});

const filteredMetrics = computed(() => {
  const value = metricsKeyword.value.trim().toLowerCase();
  return !value
    ? availableMetrics.value
    : availableMetrics.value.filter((item) => `${item.metricsCode || item.code} ${item.metricsName || item.name}`.toLowerCase().includes(value));
});

const selectedCategoryPathLabel = computed(() => {
  const targetId = form.parentIdPath?.at(-1);
  return targetId ? categoryPathLabelMap.value[targetId] || '' : '';
});

const historyCompareRows = computed(() => {
  const selected = historyRows.value.filter((item) => selectedHistoryKeys.value.includes(item.id));
  if (selected.length !== 2) return [];
  const [left, right] = [...selected].sort((a, b) => a.updateTime.localeCompare(b.updateTime));
  return [
    { field: '版本', left: left.version, right: right.version },
    { field: '更新时间', left: left.updateTime, right: right.updateTime },
    { field: '操作人', left: left.operator, right: right.operator },
    { field: '表达式', left: left.expression, right: right.expression },
    { field: '状态', left: statusLabelMap[left.status], right: statusLabelMap[right.status] },
    { field: '时效', left: left.timeliness, right: right.timeliness },
  ];
});

function buildDefaultNode(metric?: MetricItem): RuleNode {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    logic: 'AND',
    metricName: metric?.metricsName || metric?.name || '',
    operator: '>',
    value: '0',
  };
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    code: '',
    ruleCode: '',
    name: '',
    ruleName: '',
    expression: '',
    customType: 'NORMAL',
    owner: 'demo_user',
    creatorName: 'demo_user',
    status: 'OFFLINE',
    parentId: 'cat-growth-1',
    parentIdPath: undefined,
    ruleTimeliness: 'T+1',
  });
  ruleNodes.value = [buildDefaultNode()];
  sqlText.value = "select user_id\nfrom ec_user_tag.user_profile_di\nwhere active_days_30 > 10";
  uploadedFileName.value = '';
}

function parseExpressionToNodes(expression?: string) {
  if (!expression) return [buildDefaultNode()];
  const chunks = expression.split(/\s+(AND|OR)\s+/i).filter(Boolean);
  const nodes: RuleNode[] = [];
  let pendingLogic: 'AND' | 'OR' = 'AND';
  chunks.forEach((part) => {
    const upper = part.toUpperCase();
    if (upper === 'AND' || upper === 'OR') {
      pendingLogic = upper as 'AND' | 'OR';
      return;
    }
    const [metricName = '', operator = '>', ...rest] = part.split(' ');
    nodes.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      logic: nodes.length ? pendingLogic : 'AND',
      metricName,
      operator,
      value: rest.join(' ') || '0',
    });
  });
  return nodes.length ? nodes : [buildDefaultNode()];
}

function syncExpressionFromNodes() {
  form.expression = ruleNodes.value
    .map((node, index) => `${index ? `${node.logic} ` : ''}${node.metricName} ${node.operator} ${node.value}`.trim())
    .join(' ');
  message.success('规则表达式已同步');
}

function appendRuleNode(metric?: MetricItem) {
  ruleNodes.value.push(buildDefaultNode(metric));
}

function copyRuleNode(node: RuleNode) {
  ruleNodes.value.push({
    ...node,
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  });
}

function removeRuleNode(index: number) {
  if (ruleNodes.value.length === 1) {
    ruleNodes.value = [buildDefaultNode()];
    return;
  }
  ruleNodes.value.splice(index, 1);
}

async function loadCategoryTree() {
  const tree = await TagApi.fetchCategoryTree();
  categoryTree.value = tree;
  const pathMap: Record<string, string[]> = {};
  const pathLabelMap: Record<string, string> = {};
  const walk = (node: CategoryNode, path: Array<{ id: string; label: string }>) => {
    const nextPath = [...path, { id: node.id, label: node.metricsName }];
    pathMap[node.id] = nextPath.map((item) => item.id);
    pathLabelMap[node.id] = nextPath.map((item) => item.label).join(' / ');
    node.children?.forEach((child) => walk(child, nextPath));
  };
  walk(tree, []);
  categoryPathMap.value = pathMap;
  categoryPathLabelMap.value = pathLabelMap;
}

async function loadMetrics() {
  const res = await TagApi.fetchMetrics({ pageNo: 1, pageSize: 200 });
  availableMetrics.value = res.items;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchRules({
      metricsName: filters.metricsName || undefined,
      ruleCode: filters.ruleCode || undefined,
      ruleName: filters.ruleName || undefined,
      ruleTimeliness: filters.ruleTimeliness,
      status: filters.status,
      customType: filters.customType,
      parentId: filters.parentIdPath?.at(-1),
      creatorName: filters.creatorName || undefined,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items.map((item) => ({
      ...item,
      ruleCode: item.ruleCode || item.code,
      ruleName: item.ruleName || item.name,
      creatorName: item.creatorName || item.owner,
    }));
    pagination.total = res.total;
  } catch (error) {
    console.error('[RulesPage] fetchData failed', error);
    message.error('标签列表加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  Object.assign(filters, {
    metricsName: '',
    ruleCode: '',
    ruleName: '',
    ruleTimeliness: undefined,
    status: undefined,
    customType: undefined,
    parentIdPath: undefined,
    creatorName: '',
  });
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function openModal(record?: RuleTagItem) {
  resetForm();
  if (record) {
    Object.assign(form, safeClone({
      ...record,
      ruleCode: record.ruleCode || record.code,
      ruleName: record.ruleName || record.name,
      parentIdPath: record.parentId ? categoryPathMap.value[record.parentId] || [record.parentId] : undefined,
    }));
    ruleNodes.value = parseExpressionToNodes(record.expression);
    if (record.customType === 'SQL') {
      sqlText.value = `select user_id\nfrom ec_user_tag.rule_result_di\nwhere rule_code = '${record.ruleCode || record.code}'`;
    }
  }
  editTab.value = 'base';
  editOpen.value = true;
}

function openFileModal() {
  fileUploadForm.ruleName = '';
  fileUploadForm.fileName = '';
  fileModalOpen.value = true;
}

function handleFileChange(info: UploadChangeParam) {
  uploadedFileName.value = info.file.name;
}

function handleStandaloneFileChange(info: UploadChangeParam) {
  fileUploadForm.fileName = info.file.name;
}

async function confirmUploadFile() {
  if (!fileUploadForm.ruleName.trim()) {
    message.warning('请填写标签名称');
    return;
  }
  if (!fileUploadForm.fileName) {
    message.warning('请先选择文件');
    return;
  }
  await TagApi.saveRule({
    ruleName: fileUploadForm.ruleName.trim(),
    name: fileUploadForm.ruleName.trim(),
    customType: 'CSV',
    expression: `file://${fileUploadForm.fileName}`,
    owner: 'demo_user',
    creatorName: 'demo_user',
    status: 'OFFLINE',
    parentId: 'cat-growth-1',
    ruleTimeliness: 'T+1',
  });
  message.success('文件标签已创建');
  fileModalOpen.value = false;
  fetchData();
}

function validateForm() {
  if (!(form.ruleName || '').trim()) return '请填写标签名称';
  if (!form.customType) return '请选择自定义类型';
  if (!form.ruleTimeliness) return '请选择标签时效';
  if (!form.parentIdPath?.length) return '请选择分类';
  if (form.customType === 'SQL' && !sqlText.value.trim()) return '请填写 SQL 内容';
  if (form.customType === 'CSV' && !uploadedFileName.value && !(form.expression || '').startsWith('file://')) return '请上传数据文件';
  return '';
}

async function handleSave() {
  const error = validateForm();
  if (error) {
    message.warning(error);
    return;
  }
  syncExpressionFromNodes();
  saving.value = true;
  try {
    await TagApi.saveRule({
      ...form,
      code: form.ruleCode,
      name: form.ruleName,
      ruleCode: form.ruleCode,
      ruleName: form.ruleName,
      expression: form.customType === 'SQL' ? sqlText.value.trim() : form.expression,
      parentId: form.parentIdPath?.at(-1),
    });
    message.success(form.id ? '编辑成功' : '创建成功');
    editOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error('[RulesPage] handleSave failed', error);
    message.error('保存失败，请稍后重试');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  try {
    await TagApi.deleteRule(id);
    message.success('删除成功');
    await fetchData();
  } catch (error) {
    console.error('[RulesPage] handleDelete failed', error);
    message.error('删除失败，请稍后重试');
  }
}

async function handleToggleStatus(record: RuleTagItem) {
  try {
    await TagApi.toggleRuleStatus(record.id);
    message.success(record.status === 'ONLINE' ? '下线成功' : '上线成功');
    await fetchData();
  } catch (error) {
    console.error('[RulesPage] handleToggleStatus failed', error);
    message.error('状态变更失败，请稍后重试');
  }
}

function openSqlExecute(record: RuleTagItem) {
  currentExecute.value = record;
  executeOpen.value = true;
}

async function handleExecuteConfirm() {
  if (!currentExecute.value) return;
  try {
    const res = await TagApi.executeSqlRule(currentExecute.value.ruleCode || currentExecute.value.code);
    message.success(res.message || '已触发立即计算');
    executeOpen.value = false;
  } catch (error) {
    console.error('[RulesPage] handleExecuteConfirm failed', error);
    message.error('立即计算失败，请稍后重试');
  }
}

function buildHistory(record: RuleTagItem): HistoryRow[] {
  return [
    {
      id: `${record.id}-v2`,
      version: 'V2',
      updateTime: record.updateTime,
      operator: record.creatorName || record.owner,
      expression: record.expression,
      status: record.status,
      timeliness: record.ruleTimeliness || 'T+1',
    },
    {
      id: `${record.id}-v1`,
      version: 'V1',
      updateTime: record.dataUpdateTime || record.updateTime,
      operator: 'system',
      expression: `${record.ruleCode || record.code} > 0`,
      status: 'OFFLINE',
      timeliness: record.ruleTimeliness || 'T+1',
    },
  ];
}

function openDetail(record: RuleTagItem) {
  currentDetail.value = record;
  detailTab.value = 'base';
  historyRows.value = buildHistory(record);
  selectedHistoryKeys.value = [];
  if (record.customType === 'SQL') {
    sqlText.value = record.expression;
  }
  detailOpen.value = true;
}

function onHistorySelectChange(keys: (string | number)[]) {
  selectedHistoryKeys.value = keys.map(String);
}

function openHistoryCompare() {
  if (selectedHistoryKeys.value.length !== 2) {
    message.warning('请选择两项历史版本');
    return;
  }
  historyCompareOpen.value = true;
}

onMounted(async () => {
  await Promise.all([loadCategoryTree(), loadMetrics()]);
  fetchData();
});
</script>

<style lang="less" scoped>
.tag-page {
  min-height: 100%;
  padding: 20px;
  background: #fff;
}

.tag-search-card {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 16px 16px 4px;
  margin-bottom: 16px;
  background: #fafcff;
  border: 1px solid #edf2fb;
  border-radius: 14px;
}

.tag-page__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.grid-span-2 {
  grid-column: span 2;
}

.rule-editor {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}

.rule-editor__left,
.rule-editor__right {
  padding: 16px;
  border: 1px solid #edf2fb;
  border-radius: 12px;
  background: #fbfcff;
}

.panel-title {
  margin-bottom: 12px;
  font-weight: 600;
  color: #1f2a44;
}

.metric-list {
  display: grid;
  gap: 10px;
  max-height: 420px;
  overflow: auto;
}

.metric-card__title {
  font-weight: 600;
  color: #1f2a44;
}

.metric-card__meta {
  margin-top: 4px;
  font-size: 12px;
  color: #667085;
}

.logic-list {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.logic-row {
  padding: 12px;
  background: #fff;
  border: 1px solid #edf2fb;
  border-radius: 10px;
}

.detail-history__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-history__tip,
.field-hint {
  font-size: 12px;
  color: #667085;
}

.sql-preview {
  margin: 0;
  overflow: auto;
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 14px;
  background: #f8fafc;
  padding: 14px 16px;
  color: #334155;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
