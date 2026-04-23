<template>
  <div class="tag-page">
    <a-form :model="filters" layout="inline" class="tag-search-card">
      <a-form-item label="人群编码"><a-input v-model:value="filters.groupCode" allow-clear style="width: 180px" /></a-form-item>
      <a-form-item label="人群名称"><a-input v-model:value="filters.groupName" allow-clear style="width: 180px" /></a-form-item>
      <a-form-item label="父规则/父人群"><a-input v-model:value="filters.parentId" allow-clear style="width: 180px" /></a-form-item>
      <a-form-item label="人群类型"><a-select v-model:value="filters.groupType" allow-clear :options="groupTypeOptions" style="width: 160px" /></a-form-item>
      <a-form-item label="创建人"><a-input v-model:value="filters.creatorName" allow-clear style="width: 160px" /></a-form-item>
      <a-form-item v-if="!sqlOnly" label="来源类型"><a-select v-model:value="filters.sourceType" allow-clear :options="sourceOptions" style="width: 160px" /></a-form-item>
      <a-form-item>
        <a-space>
          <a-button @click="handleReset">重置</a-button>
          <a-button type="primary" @click="fetchData">搜索</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <div class="tag-page__toolbar">
      <a-space>
        <a-button :disabled="!selectedRecords.length" @click="openBatchEdit">批量编辑</a-button>
        <a-button :disabled="!selectedRecords.length" @click="handleBatchAnalyse">人群分析</a-button>
        <a-button type="primary" @click="openModal()">新增{{ sqlOnly ? 'SQL ' : '' }}人群</a-button>
      </a-space>
    </div>

    <a-table
      :data-source="list"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1480 }"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'READY' ? 'green' : record.status === 'RUNNING' ? 'blue' : 'red'">
            {{ statusLabelMap[record.status] }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'op'">
          <a-space wrap>
            <a-button size="small" @click="openDetail(record)">查看详情</a-button>
            <a-button size="small" @click="handleCount(record)">运算人群</a-button>
            <a-button size="small" @click="openExport(record)">导出</a-button>
            <a-button size="small" type="primary" @click="openModal(record)">编辑</a-button>
            <a-button size="small" @click="openModal({ ...record, id: undefined, groupCode: '', groupName: `${record.groupName}-副本` } as GroupItem)">复制</a-button>
            <a-popconfirm title="确认删除该人群？" @confirm="handleDelete(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="editOpen" :title="form.id ? '编辑人群' : `新增${sqlOnly ? 'SQL ' : ''}人群`" width="980px" :confirm-loading="saving" @ok="handleSave">
      <a-tabs v-model:activeKey="editTab">
        <a-tab-pane key="base" tab="基础信息">
          <div class="edit-grid">
            <a-form-item label="人群编码"><a-input v-model:value="form.groupCode" /></a-form-item>
            <a-form-item label="人群名称" required><a-input v-model:value="form.groupName" /></a-form-item>
            <a-form-item label="来源类型"><a-select v-model:value="form.sourceType" :options="sourceOptions" :disabled="sqlOnly" /></a-form-item>
            <a-form-item label="人群类型"><a-select v-model:value="form.groupType" :options="groupTypeOptions" /></a-form-item>
            <a-form-item label="创建人"><a-input v-model:value="form.creator" /></a-form-item>
            <a-form-item label="预计人数"><a-input-number v-model:value="form.userCount" style="width: 100%" /></a-form-item>
            <a-form-item label="父规则/父人群"><a-input v-model:value="form.parentId" /></a-form-item>
            <a-form-item label="调度配置"><a-input v-model:value="form.schedule" /></a-form-item>
          </div>
        </a-tab-pane>
        <a-tab-pane key="logic" tab="人群逻辑">
          <a-alert type="info" show-icon message="通过规则组和逻辑连接方式维护圈选条件，提交后会同步生成人群定义。" style="margin-bottom: 12px" />
          <div class="logic-list">
            <div v-for="(node, index) in groupRules" :key="node.id" class="logic-row">
              <a-space align="start" style="width: 100%">
                <a-select v-model:value="node.logic" :options="logicOptions" style="width: 100px" />
                <a-input v-model:value="node.field" placeholder="字段/标签/指标" style="width: 180px" />
                <a-select v-model:value="node.operator" :options="operatorOptions" style="width: 120px" />
                <a-input v-model:value="node.value" placeholder="条件值" style="width: 180px" />
                <a-button @click="copyGroupRule(node)">复制</a-button>
                <a-button danger @click="removeGroupRule(index)">删除</a-button>
              </a-space>
            </div>
          </div>
          <a-space>
            <a-button type="dashed" @click="appendGroupRule()">新增规则组</a-button>
            <a-button @click="syncScheduleHint">同步分析摘要</a-button>
          </a-space>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <a-modal v-model:open="batchEditOpen" title="批量编辑" width="760px" @ok="handleBatchEdit">
      <a-form layout="vertical">
        <a-form-item label="已选人群">
          <a-space wrap>
            <a-tag v-for="item in selectedRecords" :key="item.id" color="blue">{{ item.groupCode }}</a-tag>
          </a-space>
        </a-form-item>
        <div class="edit-grid">
          <a-form-item label="补充标签编码"><a-input v-model:value="batchEditForm.ruleCode" /></a-form-item>
          <a-form-item label="生效调度"><a-input v-model:value="batchEditForm.schedule" /></a-form-item>
          <a-form-item label="负责人"><a-input v-model:value="batchEditForm.owner" /></a-form-item>
          <a-form-item label="变更说明"><a-input v-model:value="batchEditForm.remark" /></a-form-item>
        </div>
      </a-form>
    </a-modal>

    <a-modal v-model:open="exportOpen" title="导出人群" width="720px" @ok="handleExportConfirm">
      <a-form layout="vertical">
        <div class="edit-grid">
          <a-form-item label="导出条数"><a-select v-model:value="exportForm.nums" :options="exportNumOptions" /></a-form-item>
          <a-form-item label="文件格式"><a-select v-model:value="exportForm.format" :options="exportFormatOptions" /></a-form-item>
          <a-form-item label="脱敏"><a-switch v-model:checked="exportForm.masked" checked-children="是" un-checked-children="否" /></a-form-item>
        </div>
      </a-form>
      <a-alert type="info" show-icon message="已生成人群导出内容，可直接查看结果预览。" style="margin-bottom: 16px" />
      <pre class="export-preview">{{ fileContent }}</pre>
    </a-modal>

    <a-modal v-model:open="countOpen" title="运算人群" width="760px" :footer="null">
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="人群编码">{{ countRecord?.groupCode }}</a-descriptions-item>
        <a-descriptions-item label="人群名称">{{ countRecord?.groupName }}</a-descriptions-item>
        <a-descriptions-item label="预估人数">{{ groupCount }}</a-descriptions-item>
        <a-descriptions-item label="调度">{{ countRecord?.schedule }}</a-descriptions-item>
      </a-descriptions>
      <a-table style="margin-top: 12px" :data-source="operationRows" :columns="analyseColumns" :pagination="false" row-key="label" size="small" />
    </a-modal>

    <a-modal v-model:open="analyseOpen" title="人群分析" width="760px" :footer="null">
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="选中数量">{{ selectedRecords.length }}</a-descriptions-item>
        <a-descriptions-item label="分析结论">{{ analyseSummary }}</a-descriptions-item>
      </a-descriptions>
      <a-table style="margin-top: 12px" :data-source="analyseRows" :columns="analyseColumns" :pagination="false" row-key="label" size="small" />
    </a-modal>

    <a-modal v-model:open="historyCompareOpen" title="历史版本对比" width="860px" :footer="null">
      <a-table :data-source="historyCompareRows" :columns="historyCompareColumns" :pagination="false" row-key="field" size="small" />
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="人群详情" width="920px">
      <a-tabs v-model:activeKey="detailTab">
        <a-tab-pane key="base" tab="基本信息">
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="人群编码">{{ currentDetail?.groupCode }}</a-descriptions-item>
            <a-descriptions-item label="人群名称">{{ currentDetail?.groupName }}</a-descriptions-item>
            <a-descriptions-item label="人群类型">{{ currentDetail?.groupType }}</a-descriptions-item>
            <a-descriptions-item label="来源类型">{{ currentDetail?.sourceType }}</a-descriptions-item>
            <a-descriptions-item label="创建人">{{ currentDetail?.creatorName || currentDetail?.creator }}</a-descriptions-item>
            <a-descriptions-item label="当前人数">{{ currentDetail?.userCount }}</a-descriptions-item>
            <a-descriptions-item label="父规则/父人群">{{ currentDetail?.parentId || '/' }}</a-descriptions-item>
            <a-descriptions-item label="调度">{{ currentDetail?.schedule }}</a-descriptions-item>
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
            <a-descriptions-item label="规则更新时间">{{ currentDetail?.ruleUpdateTime }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ currentDetail?.createTime }}</a-descriptions-item>
            <a-descriptions-item label="更新时间">{{ currentDetail?.updateTime }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ statusLabelMap[currentDetail?.status || 'READY'] }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
      </a-tabs>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type GroupItem } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';

const props = defineProps<{ sqlOnly?: boolean }>();
const sqlOnly = computed(() => Boolean(props.sqlOnly));

type GroupRule = {
  id: string;
  logic: 'AND' | 'OR';
  field: string;
  operator: string;
  value: string;
};

type HistoryRow = {
  id: string;
  version: string;
  updateTime: string;
  operator: string;
  schedule: string;
  userCount: number;
  status: GroupItem['status'];
  sourceType: GroupItem['sourceType'];
};

const loading = ref(false);
const saving = ref(false);
const editOpen = ref(false);
const batchEditOpen = ref(false);
const exportOpen = ref(false);
const countOpen = ref(false);
const analyseOpen = ref(false);
const detailOpen = ref(false);
const historyCompareOpen = ref(false);
const detailTab = ref('base');
const editTab = ref('base');
const list = ref<GroupItem[]>([]);
const selectedRowKeys = ref<string[]>([]);
const currentDetail = ref<GroupItem | null>(null);
const exportRecord = ref<GroupItem | null>(null);
const countRecord = ref<GroupItem | null>(null);
const historyRows = ref<HistoryRow[]>([]);
const selectedHistoryKeys = ref<string[]>([]);
const fileContent = ref('');
const groupCount = ref(0);
const analyseSummary = ref('');
const analyseRows = ref<Array<{ label: string; value: string }>>([]);
const groupRules = ref<GroupRule[]>([]);

const filters = reactive({
  groupCode: '',
  groupName: '',
  parentId: '',
  groupType: undefined as string | undefined,
  creatorName: '',
  sourceType: undefined as string | undefined,
});

const form = reactive<Partial<GroupItem>>({
  groupCode: '',
  groupName: '',
  sourceType: props.sqlOnly ? 'SQL' : 'RULE',
  groupType: '动态人群',
  creator: 'demo_user',
  creatorName: 'demo_user',
  userCount: 0,
  status: 'READY',
  parentId: 'rule_001',
  schedule: '手动更新',
});

const batchEditForm = reactive({
  ruleCode: '',
  schedule: '每周三 10:00',
  owner: 'demo_user',
  remark: '',
});

const exportForm = reactive({
  nums: 'TWENTY',
  format: 'CSV',
  masked: false,
});

const sourceOptions = [
  { label: '规则人群', value: 'RULE' },
  { label: 'SQL人群', value: 'SQL' },
  { label: '上传人群', value: 'UPLOAD' },
];
const groupTypeOptions = ['静态人群', '动态人群', '组合人群'].map((value) => ({ label: value, value }));
const logicOptions = [
  { label: 'AND', value: 'AND' },
  { label: 'OR', value: 'OR' },
];
const operatorOptions = ['包含', '等于', '大于', '小于', '命中标签', '命中指标'].map((value) => ({ label: value, value }));
const exportNumOptions = [
  { label: '20 条', value: 'TWENTY' },
  { label: '100 条', value: 'HUNDRED' },
  { label: '全部', value: 'ALL' },
];
const exportFormatOptions = [
  { label: 'CSV', value: 'CSV' },
  { label: 'TXT', value: 'TXT' },
];
const statusLabelMap: Record<string, string> = {
  READY: '已就绪',
  RUNNING: '执行中',
  FAILED: '执行失败',
};

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const columns = [
  { title: '人群编码', dataIndex: 'groupCode', key: 'groupCode', width: 150 },
  { title: '人群名称', dataIndex: 'groupName', key: 'groupName', width: 160 },
  { title: '人群类型', dataIndex: 'groupType', key: 'groupType', width: 120 },
  { title: '来源类型', dataIndex: 'sourceType', key: 'sourceType', width: 120 },
  { title: '当前人数', dataIndex: 'userCount', key: 'userCount', width: 120 },
  { title: '创建人', dataIndex: 'creatorName', key: 'creatorName', width: 120 },
  { title: '规则更新时间', dataIndex: 'ruleUpdateTime', key: 'ruleUpdateTime', width: 180 },
  { title: '调度', dataIndex: 'schedule', key: 'schedule', width: 160 },
  { title: '状态', key: 'status', width: 120 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'op', width: 420, fixed: 'right' as const },
];

const analyseColumns = [
  { title: '维度', dataIndex: 'label', key: 'label' },
  { title: '结果', dataIndex: 'value', key: 'value' },
];

const historyColumns = [
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
  { title: '操作人', dataIndex: 'operator', key: 'operator' },
  { title: '调度', dataIndex: 'schedule', key: 'schedule' },
  { title: '人数', dataIndex: 'userCount', key: 'userCount' },
  { title: '状态', dataIndex: 'status', key: 'status' },
];

const historyCompareColumns = [
  { title: '字段', dataIndex: 'field', key: 'field', width: 160 },
  { title: '较早版本', dataIndex: 'left', key: 'left' },
  { title: '较新版本', dataIndex: 'right', key: 'right' },
];

const selectedRecords = computed(() => list.value.filter((item) => selectedRowKeys.value.includes(item.id)));
const operationRows = computed(() => {
  if (!countRecord.value) return [];
  return [
    { label: '预计命中人数', value: `${groupCount.value}` },
    { label: '近7日新增用户', value: `${Math.max(Math.round(groupCount.value * 0.18), 1)}` },
    { label: '近7日活跃用户', value: `${Math.max(Math.round(groupCount.value * 0.42), 1)}` },
    { label: '推荐投放策略', value: countRecord.value.sourceType === 'SQL' ? '保守推送' : '标准推送' },
  ];
});

const historyCompareRows = computed(() => {
  const selected = historyRows.value.filter((item) => selectedHistoryKeys.value.includes(item.id));
  if (selected.length !== 2) return [];
  const [left, right] = [...selected].sort((a, b) => a.updateTime.localeCompare(b.updateTime));
  return [
    { field: '版本', left: left.version, right: right.version },
    { field: '更新时间', left: left.updateTime, right: right.updateTime },
    { field: '操作人', left: left.operator, right: right.operator },
    { field: '调度', left: left.schedule, right: right.schedule },
    { field: '用户数', left: `${left.userCount}`, right: `${right.userCount}` },
    { field: '状态', left: statusLabelMap[left.status], right: statusLabelMap[right.status] },
    { field: '来源类型', left: left.sourceType, right: right.sourceType },
  ];
});

function buildDefaultRule(): GroupRule {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    logic: 'AND',
    field: '',
    operator: '包含',
    value: '',
  };
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    groupCode: '',
    groupName: '',
    sourceType: props.sqlOnly ? 'SQL' : 'RULE',
    groupType: '动态人群',
    creator: 'demo_user',
    creatorName: 'demo_user',
    userCount: 0,
    status: 'READY',
    parentId: 'rule_001',
    schedule: '手动更新',
  });
  groupRules.value = [buildDefaultRule()];
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchGroups({
      groupCode: filters.groupCode || undefined,
      groupName: filters.groupName || undefined,
      parentId: filters.parentId || undefined,
      groupType: filters.groupType,
      creatorName: filters.creatorName || undefined,
      sourceType: sqlOnly.value ? undefined : filters.sourceType,
      sqlOnly: sqlOnly.value ? 1 : 0,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items;
    pagination.total = res.total;
    selectedRowKeys.value = [];
  } catch (error) {
    console.error('[GroupsPage] fetchData failed', error);
    message.error('人群列表加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  Object.assign(filters, {
    groupCode: '',
    groupName: '',
    parentId: '',
    groupType: undefined,
    creatorName: '',
    sourceType: undefined,
  });
  pagination.current = 1;
  fetchData();
}

function onSelectChange(keys: (string | number)[]) {
  selectedRowKeys.value = keys.map(String);
}

function onHistorySelectChange(keys: (string | number)[]) {
  selectedHistoryKeys.value = keys.map(String);
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function appendGroupRule() {
  groupRules.value.push(buildDefaultRule());
}

function copyGroupRule(rule: GroupRule) {
  groupRules.value.push({ ...rule, id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}` });
}

function removeGroupRule(index: number) {
  if (groupRules.value.length === 1) {
    groupRules.value = [buildDefaultRule()];
    return;
  }
  groupRules.value.splice(index, 1);
}

function syncScheduleHint() {
  const summary = groupRules.value.map((item) => `${item.field}${item.operator}${item.value}`).filter(Boolean).join(' 且 ');
  form.schedule = summary ? `手动更新 / ${summary}` : '手动更新';
  message.success('已同步人群逻辑摘要');
}

function openModal(record?: GroupItem) {
  resetForm();
  if (record) {
    Object.assign(form, safeClone(record));
    groupRules.value = [
      { id: 'rule-1', logic: 'AND', field: record.parentId || '', operator: '命中标签', value: record.sourceType || 'RULE' },
      { id: 'rule-2', logic: 'AND', field: 'user_count', operator: '大于', value: `${record.userCount || 0}` },
    ];
  }
  editTab.value = 'base';
  editOpen.value = true;
}

function openBatchEdit() {
  batchEditForm.ruleCode = '';
  batchEditForm.schedule = '每周三 10:00';
  batchEditForm.owner = 'demo_user';
  batchEditForm.remark = '';
  batchEditOpen.value = true;
}

async function handleBatchEdit() {
  try {
    await TagApi.batchEditGroups(selectedRowKeys.value);
    message.success('批量编辑成功');
    batchEditOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error('[GroupsPage] handleBatchEdit failed', error);
    message.error('批量编辑失败，请稍后重试');
  }
}

async function handleSave() {
  if (!(form.groupName || '').trim()) {
    message.warning('请填写人群名称');
    return;
  }
  saving.value = true;
  try {
    await TagApi.saveGroup(form);
    message.success(form.id ? '编辑成功' : '创建成功');
    editOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error('[GroupsPage] handleSave failed', error);
    message.error('保存失败，请稍后重试');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  try {
    await TagApi.deleteGroup(id);
    message.success('删除成功');
    await fetchData();
  } catch (error) {
    console.error('[GroupsPage] handleDelete failed', error);
    message.error('删除失败，请稍后重试');
  }
}

async function handleCount(record: GroupItem) {
  countRecord.value = record;
  groupCount.value = await TagApi.countGroup(record.id);
  countOpen.value = true;
}

async function openExport(record: GroupItem) {
  exportRecord.value = record;
  exportForm.nums = 'TWENTY';
  exportForm.format = 'CSV';
  exportForm.masked = false;
  const res = await TagApi.exportGroup(record.id);
  fileContent.value = res.content;
  exportOpen.value = true;
}

function handleExportConfirm() {
  message.success(`已生成 ${exportForm.format} 导出结果`);
  exportOpen.value = false;
}

function handleBatchAnalyse() {
  analyseSummary.value = `已对 ${selectedRecords.value.length} 个人群完成分析，当前更适合营销触达与风险分层。`;
  const total = selectedRecords.value.reduce((sum, item) => sum + item.userCount, 0);
  analyseRows.value = [
    { label: '覆盖人数总量', value: `${total}` },
    { label: '平均人群规模', value: `${selectedRecords.value.length ? Math.round(total / selectedRecords.value.length) : 0}` },
    { label: '推荐应用', value: selectedRecords.value.some((item) => item.sourceType === 'SQL') ? '精细化运营' : '标准营销' },
  ];
  analyseOpen.value = true;
}

function buildHistory(record: GroupItem): HistoryRow[] {
  return [
    {
      id: `${record.id}-v2`,
      version: 'V2',
      updateTime: record.updateTime,
      operator: record.creatorName || record.creator,
      schedule: record.schedule,
      userCount: record.userCount,
      status: record.status,
      sourceType: record.sourceType,
    },
    {
      id: `${record.id}-v1`,
      version: 'V1',
      updateTime: record.ruleUpdateTime || record.updateTime,
      operator: 'system',
      schedule: '手动更新',
      userCount: Math.max((record.userCount || 0) - 120, 0),
      status: 'READY',
      sourceType: record.sourceType,
    },
  ];
}

function openDetail(record: GroupItem) {
  currentDetail.value = record;
  detailTab.value = 'base';
  historyRows.value = buildHistory(record);
  selectedHistoryKeys.value = [];
  detailOpen.value = true;
}

function openHistoryCompare() {
  if (selectedHistoryKeys.value.length !== 2) {
    message.warning('请选择两项历史版本');
    return;
  }
  historyCompareOpen.value = true;
}

onMounted(fetchData);
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

.logic-list {
  display: grid;
  gap: 10px;
}

.logic-row {
  padding: 12px;
  background: #fbfcff;
  border: 1px solid #edf2fb;
  border-radius: 10px;
}

.detail-history__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-history__tip {
  font-size: 12px;
  color: #667085;
}

.export-preview {
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
