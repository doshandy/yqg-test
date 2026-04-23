<template>
  <div class="tag-page">
    <a-form :model="filters" layout="inline" class="tag-search-card">
      <a-form-item label="指标id">
        <a-input v-model:value="filters.metricsCode" allow-clear placeholder="请输入指标id" style="width: 190px" />
      </a-form-item>
      <a-form-item label="指标名称">
        <a-input v-model:value="filters.metricsName" allow-clear placeholder="请输入指标名称" style="width: 190px" />
      </a-form-item>
      <a-form-item label="字段类型">
        <a-select v-model:value="filters.type" allow-clear :options="typeOptions" placeholder="请选择" style="width: 160px" />
      </a-form-item>
      <a-form-item label="指标类型">
        <a-select v-model:value="filters.metricsType" allow-clear :options="metricsTypeOptions" placeholder="请选择" style="width: 160px" />
      </a-form-item>
      <a-form-item label="创建人">
        <a-input v-model:value="filters.creator" allow-clear placeholder="请输入创建人" style="width: 170px" />
      </a-form-item>
      <a-form-item label="特殊管理">
        <a-select
          v-model:value="filters.metricsCustomType"
          allow-clear
          :options="metricsCustomTypeOptions"
          placeholder="请选择"
          style="width: 160px"
        />
      </a-form-item>
      <a-form-item label="状态">
        <a-select v-model:value="filters.status" allow-clear :options="statusOptions" placeholder="请选择" style="width: 150px" />
      </a-form-item>
      <a-form-item label="分类">
        <a-cascader
          v-model:value="filters.parentIdPath"
          :options="categoryOptions"
          :field-names="{ label: 'label', value: 'value', children: 'children' }"
          change-on-select
          allow-clear
          placeholder="请选择分类"
          style="width: 220px"
        />
      </a-form-item>
      <a-form-item label="指标时效">
        <a-select
          v-model:value="filters.metricsTimeLiness"
          allow-clear
          :options="timelinessOptions"
          placeholder="请选择"
          style="width: 160px"
        />
      </a-form-item>
      <a-form-item label="表名">
        <a-input v-model:value="filters.ownTable" allow-clear placeholder="请输入表名" style="width: 180px" />
      </a-form-item>
      <a-form-item label="列名">
        <a-input v-model:value="filters.ownColumn" allow-clear placeholder="请输入列名" style="width: 180px" />
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
        <a-button type="primary" @click="openModal()">新建</a-button>
        <a-button :disabled="!batchDisableIds.length" @click="handleBatchDisable">批量下线</a-button>
      </a-space>
      <a-space>
        <a-button @click="aiOpen = true">AI 助手</a-button>
        <a-button @click="fetchData">刷新</a-button>
      </a-space>
    </div>

    <a-table
      :data-source="list"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1680 }"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'metricsDesc'">
          <div class="ellipsis-cell" :title="record.metricsDesc || record.desc">{{ record.metricsDesc || record.desc || '-' }}</div>
        </template>
        <template v-else-if="column.key === 'metricsCustomType'">
          {{ metricsCustomTypeLabelMap[record.metricsCustomType || ''] || record.metricsCustomType || '-' }}
        </template>
        <template v-else-if="column.key === 'metricsTimeLiness'">
          {{ timelinessLabelMap[record.metricsTimeLiness || ''] || record.metricsTimeLiness || '-' }}
        </template>
        <template v-else-if="column.key === 'metricsType'">
          {{ metricsTypeLabelMap[record.metricsType || ''] || record.metricsType || '-' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColorMap[record.status] || 'default'">{{ statusLabelMap[record.status] || record.status }}</a-tag>
        </template>
        <template v-else-if="column.key === 'parentId'">
          {{ categoryPathLabelMap[record.parentId || ''] || categoryNameMap[record.parentId || ''] || record.parentId || '-' }}
        </template>
        <template v-else-if="column.key === 'op'">
          <a-space>
            <a-popconfirm
              v-if="record.status === 'ENABLE'"
              title="确认下线？"
              placement="left"
              :disabled="record.status === 'INVALID'"
              @confirm="handleToggleStatus(record.id)"
            >
              <a-button size="small" :disabled="record.status === 'INVALID'">下线</a-button>
            </a-popconfirm>
            <a-button
              v-else
              size="small"
              :disabled="record.status === 'INVALID'"
              @click="handleToggleStatus(record.id)"
            >
              上线
            </a-button>
            <a-button size="small" type="primary" @click="openModal(record)">编辑</a-button>
            <a-popconfirm title="确认删除该指标？" placement="left" @confirm="handleDelete(record.id)">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="editOpen"
      :title="form.id ? '编辑指标' : '创建指标'"
      width="920px"
      :confirm-loading="saving"
      @ok="handleSave"
    >
      <a-form layout="vertical" class="metrics-edit-form">
        <div class="section-title">基础信息</div>
        <div class="metrics-edit-grid">
          <a-form-item label="指标id">
            <a-input :value="form.metricsCode" disabled placeholder="保存后自动生成" />
          </a-form-item>
          <a-form-item label="指标名称" required>
            <a-input v-model:value="form.metricsName" placeholder="50字以内" />
          </a-form-item>
          <a-form-item label="字段类型" required>
            <a-select v-model:value="form.type" :options="typeOptions" placeholder="请选择" />
          </a-form-item>
          <a-form-item label="指标类型">
            <a-select v-model:value="form.metricsType" :options="metricsTypeOptions" placeholder="请选择" />
          </a-form-item>
          <a-form-item label="分类" required class="grid-span-2">
            <a-cascader
              v-model:value="form.parentIdPath"
              :options="categoryOptions"
              :field-names="{ label: 'label', value: 'value', children: 'children' }"
              change-on-select
              placeholder="选择到父级路径"
            />
            <div v-if="selectedCategoryPathLabel" class="field-hint">当前分类路径：{{ selectedCategoryPathLabel }}</div>
          </a-form-item>
          <a-form-item label="指标描述" required class="grid-span-2">
            <a-textarea v-model:value="form.metricsDesc" :rows="3" placeholder="500字以内" />
          </a-form-item>
          <a-form-item label="是否特殊管理" required>
            <a-select v-model:value="form.metricsCustomType" :options="metricsCustomTypeOptions" placeholder="请选择" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="form.status" :options="statusOptions" placeholder="请选择" />
          </a-form-item>
        </div>

        <div class="section-title">数据来源</div>
        <div class="metrics-edit-grid">
          <a-form-item label="库名" required>
            <a-select v-model:value="form.ownSchema" :options="schemaOptions" placeholder="请选择" @change="handleSchemaChange" />
          </a-form-item>
          <a-form-item label="表名" required>
            <a-select v-model:value="form.ownTable" :options="tableOptions" placeholder="请选择" @change="handleTableChangeInForm" />
          </a-form-item>
          <a-form-item label="列名" required class="grid-span-2">
            <a-select
              v-model:value="form.ownColumnValues"
              mode="multiple"
              :options="columnOptions"
              placeholder="请选择"
              :max-tag-count="3"
            />
            <div v-if="form.ownColumnValues.length" class="field-hint">已选择 {{ form.ownColumnValues.length }} 个字段：{{ form.ownColumnValues.join('、') }}</div>
          </a-form-item>
          <a-form-item label="指标时效">
            <a-select v-model:value="form.metricsTimeLiness" :options="timelinessOptions" placeholder="请选择" />
          </a-form-item>
          <a-form-item label="创建人">
            <a-input v-model:value="form.creatorName" placeholder="请输入创建人" />
          </a-form-item>
        </div>

        <template v-if="isNewTable">
          <div class="section-title">新表依赖配置</div>
          <a-alert
            type="warning"
            show-icon
            message="当前选中的表会被视为新表，请同步填写 Dolphin 项目和工作流，完成依赖登记。"
            style="margin-bottom: 12px"
          />
          <div class="metrics-edit-grid">
            <a-form-item label="Dolphin项目名" required>
              <a-select
                v-model:value="form.dolphinProjectId"
                :options="projectOptions"
                placeholder="请选择项目"
                @change="handleProjectChange"
              />
            </a-form-item>
            <a-form-item label="Dolphin工作流" required>
              <a-select v-model:value="form.dolphinProcessId" :options="workflowOptions" placeholder="请选择工作流" />
            </a-form-item>
          </div>
        </template>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="aiOpen" title="AI 指标助手" width="420">
      <div class="ai-panel">
        <a-alert
          type="info"
          show-icon
          message="提供指标命名和字段映射建议，便于完善指标信息。"
        />
        <a-card size="small" title="推荐检查项">
          <ul class="ai-list">
            <li>指标命名是否统一使用业务语义，不直接暴露底表字段名。</li>
            <li>特殊管理指标建议补充库表和依赖说明，方便后续调度接入。</li>
            <li>若选择了新表，请同步填写 Dolphin 项目和工作流。</li>
          </ul>
        </a-card>
        <a-card size="small" title="建议结果">
          <p>当前搜索结果里，`首借金额` 和 `风控评分` 更适合作为原子指标，建议指标类型设为 `ATOMIC`。</p>
          <p>如果是营销结果汇总类指标，建议归类到 `增长 / 拉新` 下，并使用 `growth-project` 作为依赖项目。</p>
        </a-card>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type CategoryNode, type MetricItem } from '@/resources/tag';

type CascaderOption = {
  label: string;
  value: string;
  children?: CascaderOption[];
};

type FilterState = {
  metricsCode: string;
  metricsName: string;
  type?: string;
  metricsType?: string;
  creator: string;
  metricsCustomType?: string;
  status?: string;
  parentIdPath?: string[];
  metricsTimeLiness?: string;
  ownTable: string;
  ownColumn: string;
};

type EditState = {
  id?: string;
  metricsCode: string;
  metricsName: string;
  metricsDesc: string;
  type?: string;
  metricsType?: string;
  metricsCustomType?: string;
  status?: MetricItem['status'];
  parentIdPath?: string[];
  ownSchema?: string;
  ownTable?: string;
  ownColumnValues: string[];
  metricsTimeLiness?: string;
  creatorName: string;
  dolphinProjectId?: string;
  dolphinProcessId?: string;
};

const loading = ref(false);
const saving = ref(false);
const editOpen = ref(false);
const aiOpen = ref(false);
const isNewTable = ref(false);
const list = ref<MetricItem[]>([]);
const selectedRowKeys = ref<string[]>([]);
const selectedRows = ref<MetricItem[]>([]);
const categoryTree = ref<CategoryNode | null>(null);
const categoryNameMap = ref<Record<string, string>>({});
const categoryPathMap = ref<Record<string, string[]>>({});
const categoryPathLabelMap = ref<Record<string, string>>({});
const tableOptions = ref<Array<{ label: string; value: string }>>([]);
const columnOptions = ref<Array<{ label: string; value: string }>>([]);
const projectOptions = ref<Array<{ label: string; value: string }>>([]);
const workflowOptions = ref<Array<{ label: string; value: string }>>([]);

const filters = reactive<FilterState>({
  metricsCode: '',
  metricsName: '',
  type: undefined,
  metricsType: undefined,
  creator: '',
  metricsCustomType: undefined,
  status: undefined,
  parentIdPath: undefined,
  metricsTimeLiness: undefined,
  ownTable: '',
  ownColumn: '',
});

const form = reactive<EditState>({
  metricsCode: '',
  metricsName: '',
  metricsDesc: '',
  type: 'STRING',
  metricsType: 'ATOMIC',
  metricsCustomType: 'NORMAL',
  status: 'DISABLE',
  parentIdPath: undefined,
  ownSchema: undefined,
  ownTable: undefined,
  ownColumnValues: [],
  metricsTimeLiness: 'T1',
  creatorName: 'demo_user',
  dolphinProjectId: undefined,
  dolphinProcessId: undefined,
});

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const statusOptions = [
  { label: '启用', value: 'ENABLE' },
  { label: '停用', value: 'DISABLE' },
  { label: '失效', value: 'INVALID' },
];
const statusLabelMap: Record<string, string> = {
  ENABLE: '启用',
  DISABLE: '停用',
  INVALID: '失效',
  ONLINE: '启用',
  OFFLINE: '停用',
  DRAFT: '失效',
};
const statusColorMap: Record<string, string> = {
  ENABLE: 'green',
  DISABLE: 'default',
  INVALID: 'red',
  ONLINE: 'green',
  OFFLINE: 'default',
  DRAFT: 'gold',
};
const typeOptions = ['STRING', 'LONG', 'DOUBLE'].map((value) => ({ label: value, value }));
const metricsTypeOptions = [
  { label: '原子指标', value: 'ATOMIC' },
  { label: '派生指标', value: 'DERIVED' },
];
const metricsTypeLabelMap: Record<string, string> = {
  ATOMIC: '原子指标',
  DERIVED: '派生指标',
};
const metricsCustomTypeOptions = [
  { label: '普通', value: 'NORMAL' },
  { label: '特殊管理', value: 'SPECIAL' },
];
const metricsCustomTypeLabelMap: Record<string, string> = {
  NORMAL: '普通',
  SPECIAL: '特殊管理',
};
const timelinessOptions = [
  { label: 'T+1', value: 'T1' },
  { label: '实时', value: 'REAL_TIME' },
  { label: '小时级', value: 'HOUR' },
];
const timelinessLabelMap: Record<string, string> = {
  T1: 'T+1',
  REAL_TIME: '实时',
  HOUR: '小时级',
};
const schemaOptions = [
  { label: 'ads_risk', value: 'ads_risk' },
  { label: 'ads_growth', value: 'ads_growth' },
  { label: 'dwd_user', value: 'dwd_user' },
];

const columns = [
  { title: '指标id', dataIndex: 'metricsCode', key: 'metricsCode', width: 150, fixed: 'left' as const },
  { title: '指标名称', dataIndex: 'metricsName', key: 'metricsName', width: 160, fixed: 'left' as const },
  { title: '指标描述', dataIndex: 'metricsDesc', key: 'metricsDesc', width: 220 },
  { title: '是否特殊管理', dataIndex: 'metricsCustomType', key: 'metricsCustomType', width: 120 },
  { title: '状态', key: 'status', width: 110 },
  { title: '库名', dataIndex: 'ownSchema', key: 'ownSchema', width: 130 },
  { title: '表名', dataIndex: 'ownTable', key: 'ownTable', width: 180 },
  { title: '列名', dataIndex: 'ownColumn', key: 'ownColumn', width: 180 },
  { title: '创建人', dataIndex: 'creatorName', key: 'creatorName', width: 120 },
  { title: '分类', key: 'parentId', width: 140 },
  { title: '字段类型', dataIndex: 'type', key: 'type', width: 110 },
  { title: '指标时效', dataIndex: 'metricsTimeLiness', key: 'metricsTimeLiness', width: 110 },
  { title: '指标类型', dataIndex: 'metricsType', key: 'metricsType', width: 110 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'op', width: 210, fixed: 'right' as const },
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

const batchDisableIds = computed(() =>
  selectedRows.value
    .filter((item) => item.status === 'ENABLE')
    .map((item) => item.id),
);

const selectedCategoryPathLabel = computed(() => {
  const targetId = form.parentIdPath?.at(-1);
  return targetId ? categoryPathLabelMap.value[targetId] || '' : '';
});

function normalizeMetric(record: MetricItem) {
  return {
    ...record,
    metricsCode: record.metricsCode || record.code,
    metricsName: record.metricsName || record.name,
    metricsDesc: record.metricsDesc || record.desc,
    creatorName: record.creatorName || record.owner,
    type: record.type || record.dataType,
    metricsTimeLiness: record.metricsTimeLiness || record.timeliness,
    ownColumnValues: record.ownColumnValues || (record.ownColumn ? [record.ownColumn] : []),
  };
}

function findCategoryPath(targetId?: string) {
  return targetId ? categoryPathMap.value[targetId] || [targetId] : undefined;
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    metricsCode: '',
    metricsName: '',
    metricsDesc: '',
    type: 'STRING',
    metricsType: 'ATOMIC',
    metricsCustomType: 'NORMAL',
    status: 'DISABLE',
    parentIdPath: undefined,
    ownSchema: undefined,
    ownTable: undefined,
    ownColumnValues: [],
    metricsTimeLiness: 'T1',
    creatorName: 'demo_user',
    dolphinProjectId: undefined,
    dolphinProcessId: undefined,
  });
  tableOptions.value = [];
  columnOptions.value = [];
  workflowOptions.value = [];
  isNewTable.value = false;
}

async function loadCategoryTree() {
  const tree = await TagApi.fetchCategoryTree();
  categoryTree.value = tree;
  const nameMap: Record<string, string> = {};
  const pathMap: Record<string, string[]> = {};
  const pathLabelMap: Record<string, string> = {};
  const walk = (node: CategoryNode, path: string[]) => {
    const nextPath = [...path, node.id];
    nameMap[node.id] = node.metricsName;
    pathMap[node.id] = nextPath;
    pathLabelMap[node.id] = nextPath
      .map((id) => nameMap[id] || (id === node.id ? node.metricsName : id))
      .join(' / ');
    node.children?.forEach((child) => walk(child, nextPath));
  };
  walk(tree, []);
  categoryNameMap.value = nameMap;
  categoryPathMap.value = pathMap;
  categoryPathLabelMap.value = pathLabelMap;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchMetrics({
      metricsCode: filters.metricsCode || undefined,
      metricsName: filters.metricsName || undefined,
      type: filters.type,
      metricsType: filters.metricsType,
      creator: filters.creator || undefined,
      metricsCustomType: filters.metricsCustomType,
      status: filters.status,
      parentId: filters.parentIdPath?.at(-1),
      metricsTimeLiness: filters.metricsTimeLiness,
      ownTable: filters.ownTable || undefined,
      ownColumn: filters.ownColumn || undefined,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items.map(normalizeMetric);
    pagination.total = res.total;
    selectedRowKeys.value = [];
    selectedRows.value = [];
  } catch (error) {
    list.value = [];
    pagination.total = 0;
    console.error('[MetricsPage] fetchData failed', error);
    message.error('指标列表加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

function onSelectChange(keys: (string | number)[], rows: MetricItem[]) {
  selectedRowKeys.value = keys.map(String);
  selectedRows.value = rows.map(normalizeMetric);
}

function handleReset() {
  Object.assign(filters, {
    metricsCode: '',
    metricsName: '',
    type: undefined,
    metricsType: undefined,
    creator: '',
    metricsCustomType: undefined,
    status: undefined,
    parentIdPath: undefined,
    metricsTimeLiness: undefined,
    ownTable: '',
    ownColumn: '',
  });
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

async function ensureTableOptions(schema?: string) {
  tableOptions.value = schema
    ? await TagApi.fetchMetricEnumOptions({ typeName: 'tables', dbName: schema })
    : [];
}

async function ensureColumnOptions(schema?: string, table?: string) {
  columnOptions.value = schema && table
    ? await TagApi.fetchMetricEnumOptions({ typeName: 'columns', dbName: schema, tableName: table })
    : [];
}

async function handleSchemaChange(value: string) {
  form.ownSchema = value;
  form.ownTable = undefined;
  form.ownColumnValues = [];
  form.dolphinProjectId = undefined;
  form.dolphinProcessId = undefined;
  workflowOptions.value = [];
  isNewTable.value = false;
  await ensureTableOptions(value);
  columnOptions.value = [];
}

async function handleTableChangeInForm(value: string) {
  form.ownTable = value;
  form.ownColumnValues = [];
  form.dolphinProjectId = undefined;
  form.dolphinProcessId = undefined;
  await ensureColumnOptions(form.ownSchema, value);
  try {
    isNewTable.value = await TagApi.checkMetricIsNewTable({
      dbName: form.ownSchema,
      tableName: value,
    });
  } catch (error) {
    console.error('[MetricsPage] checkMetricIsNewTable failed', error);
    isNewTable.value = false;
  }
}

async function handleProjectChange(value: string) {
  form.dolphinProjectId = value;
  form.dolphinProcessId = undefined;
  try {
    workflowOptions.value = value ? await TagApi.fetchMetricWorkflows(value) : [];
  } catch (error) {
    console.error('[MetricsPage] fetchMetricWorkflows failed', error);
    workflowOptions.value = [];
  }
}

async function openModal(record?: MetricItem) {
  resetForm();
  if (projectOptions.value.length === 0) {
    try {
      projectOptions.value = await TagApi.fetchMetricProjects();
    } catch (error) {
      console.error('[MetricsPage] fetchMetricProjects in modal failed', error);
      projectOptions.value = [];
    }
  }
  if (record) {
    const normalized = normalizeMetric(record);
    Object.assign(form, {
      id: normalized.id,
      metricsCode: normalized.metricsCode,
      metricsName: normalized.metricsName,
      metricsDesc: normalized.metricsDesc || '',
      type: normalized.type,
      metricsType: normalized.metricsType || 'ATOMIC',
      metricsCustomType: normalized.metricsCustomType || 'NORMAL',
      status: normalized.status,
      parentIdPath: findCategoryPath(normalized.parentId),
      ownSchema: normalized.ownSchema,
      ownTable: normalized.ownTable,
      ownColumnValues: normalized.ownColumnValues || [],
      metricsTimeLiness: normalized.metricsTimeLiness || 'T1',
      creatorName: normalized.creatorName || normalized.owner,
      dolphinProjectId: normalized.dolphinProjectId,
      dolphinProcessId: normalized.dolphinProcessId,
    });
    await ensureTableOptions(normalized.ownSchema);
    await ensureColumnOptions(normalized.ownSchema, normalized.ownTable);
    try {
      isNewTable.value = await TagApi.checkMetricIsNewTable({
        dbName: normalized.ownSchema,
        tableName: normalized.ownTable,
      });
    } catch (error) {
      console.error('[MetricsPage] checkMetricIsNewTable in modal failed', error);
      isNewTable.value = false;
    }
    if (normalized.dolphinProjectId) {
      try {
        workflowOptions.value = await TagApi.fetchMetricWorkflows(normalized.dolphinProjectId);
      } catch (error) {
        console.error('[MetricsPage] fetchMetricWorkflows in modal failed', error);
        workflowOptions.value = [];
      }
    }
  }
  editOpen.value = true;
}

function validateForm() {
  if (!form.metricsName.trim()) return '请填写指标名称';
  if (!form.type) return '请选择字段类型';
  if (!form.parentIdPath?.length) return '请选择分类';
  if (!form.ownSchema) return '请选择库名';
  if (!form.ownTable) return '请选择表名';
  if (!form.ownColumnValues.length) return '请选择列名';
  if (!form.metricsDesc.trim()) return '请填写指标描述';
  if (!form.metricsCustomType) return '请选择是否特殊管理';
  if (isNewTable.value && !form.dolphinProjectId) return '请选择 Dolphin 项目名';
  if (isNewTable.value && !form.dolphinProcessId) return '请选择 Dolphin 工作流';
  return '';
}

async function handleSave() {
  const error = validateForm();
  if (error) {
    message.warning(error);
    return;
  }

  saving.value = true;
  try {
    await TagApi.saveMetric({
      id: form.id,
      metricsCode: form.metricsCode || undefined,
      metricsName: form.metricsName.trim(),
      metricsDesc: form.metricsDesc.trim(),
      type: form.type,
      metricsType: form.metricsType,
      metricsCustomType: form.metricsCustomType,
      status: form.status,
      parentId: form.parentIdPath?.at(-1),
      ownSchema: form.ownSchema,
      ownTable: form.ownTable,
      ownColumnValues: [...form.ownColumnValues],
      ownColumn: form.ownColumnValues[0],
      metricsTimeLiness: form.metricsTimeLiness,
      creatorName: form.creatorName.trim() || 'demo_user',
      dolphinProjectId: isNewTable.value ? form.dolphinProjectId : undefined,
      dolphinProcessId: isNewTable.value ? form.dolphinProcessId : undefined,
    });
    if (isNewTable.value) {
      await TagApi.addMetricDepTable({
        dolphinProjectId: form.dolphinProjectId,
        dolphinProcessId: form.dolphinProcessId,
        dbName: form.ownSchema,
        tableName: form.ownTable,
      });
    }
    message.success(form.id ? '编辑成功' : '创建成功');
    editOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error('[MetricsPage] handleSave failed', error);
    message.error(form.id ? '编辑失败，请稍后重试' : '创建失败，请稍后重试');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  try {
    await TagApi.deleteMetric(id);
    message.success('删除成功');
    await fetchData();
  } catch (error) {
    console.error('[MetricsPage] handleDelete failed', error);
    message.error('删除失败，请稍后重试');
  }
}

async function handleBatchDisable() {
  if (!batchDisableIds.value.length) {
    message.warning('请选择可下线的启用指标');
    return;
  }
  try {
    await TagApi.batchDisableMetrics(batchDisableIds.value);
    message.success('批量下线成功');
    await fetchData();
  } catch (error) {
    console.error('[MetricsPage] handleBatchDisable failed', error);
    message.error('批量下线失败，请稍后重试');
  }
}

async function handleToggleStatus(id: string) {
  const current = list.value.find((item) => item.id === id);
  try {
    await TagApi.toggleMetricStatus(id);
    message.success(current?.status === 'ENABLE' ? '下线成功' : '上线成功');
    await fetchData();
  } catch (error) {
    console.error('[MetricsPage] handleToggleStatus failed', error);
    message.error(current?.status === 'ENABLE' ? '下线失败，请稍后重试' : '上线失败，请稍后重试');
  }
}

onMounted(async () => {
  try {
    await loadCategoryTree();
  } catch (error) {
    console.error('[MetricsPage] loadCategoryTree failed', error);
  }
  try {
    projectOptions.value = await TagApi.fetchMetricProjects();
  } catch (error) {
    console.error('[MetricsPage] fetchMetricProjects failed', error);
    projectOptions.value = [];
  }
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
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ellipsis-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metrics-edit-form {
  max-height: 68vh;
  overflow-y: auto;
}

.section-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
}

.section-title:not(:first-child) {
  margin-top: 18px;
}

.metrics-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.grid-span-2 {
  grid-column: span 2;
}

.ai-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-list {
  padding-left: 18px;
  margin: 0;
  line-height: 1.8;
}

.field-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #667085;
  line-height: 1.6;
}
</style>
