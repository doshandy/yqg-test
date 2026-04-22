<!--
 * 关联上下文数据表弹窗
-->
<template>
  <Modal
    :open="open"
    title="关联上下文数据表"
    :footer="null"
    width="900px"
    class="associate-table-modal"
    :destroy-on-close="true"
    @cancel="emit('close')"
  >
    <div class="associate-table-modal__body">
      <div class="associate-table-modal__left">
        <Input.Search
          v-model:value="dbSearch"
          placeholder="搜索数据库..."
          allow-clear
          class="associate-table-modal__search"
        />
        <div class="associate-table-modal__db-list">
          <div v-if="databasesLoading" class="associate-table-modal__db-loading">加载中...</div>
          <template v-else>
            <div
              v-for="db in filteredDatabases"
              :key="db.name"
              class="associate-table-modal__db-item"
              :class="{ 'associate-table-modal__db-item--active': currentDb?.name === db.name }"
              @click="onDbClick(db)"
            >
              <FolderOutlined class="associate-table-modal__db-icon" />
              <Tooltip :title="db.name" placement="topLeft">
                <span class="associate-table-modal__db-name">{{ db.name }}</span>
              </Tooltip>
              <span class="associate-table-modal__db-count">{{ db.tableCount }}</span>
            </div>
          </template>
        </div>
      </div>
      <div class="associate-table-modal__right">
        <div class="associate-table-modal__right-header">
          <div class="associate-table-modal__right-header-left">
            <span class="associate-table-modal__right-header-left-title">{{ currentDb?.name }}</span>
          </div>
          <div class="associate-table-modal__right-header-right">
            <Button
              type="default"
              class="associate-table-modal__filter-btn"
              :class="{ 'associate-table-modal__filter-btn--active': isSelfFilter }"
              @click="toggleIsSelfFilter"
            >
              <FilterOutlined />
              我负责的
            </Button>
            <Input.Search
              v-model:value="tableSearch"
              placeholder="在当前库中搜索表名..."
              allow-clear
              class="associate-table-modal__table-search"
              @search="onTableSearch"
            />
          </div>
        </div>
        <Table
          :columns="tableColumns"
          :data-source="tableList"
          :row-selection="rowSelection"
          :pagination="tablePagination"
          :scroll="{ y: 400 }"
          :loading="tablesLoading"
          size="small"
          class="associate-table-modal__table"
        >
          <template #bodyCell="{ column, record, text }">
            <template v-if="column.key === 'tableName'">
              <span class="associate-table-modal__table-name-cell">
                <Tooltip v-if="record.tableName" :title="record.tableName" placement="topLeft">
                  <span class="associate-table-modal__table-name-text">{{ text }}</span>
                </Tooltip>
                <span v-else>-</span>
                <span v-if="record.isSelf" class="associate-table-modal__mine-tag"> 我负责的</span>
              </span>
            </template>
            <template v-else-if="column.key === 'owner'">
              <span class="associate-table-modal__owner-cell">
                <UserOutlined class="associate-table-modal__owner-icon" />
                {{ text || '—' }}
              </span>
            </template>
            <template v-else>
              {{ text }}
            </template>
          </template>
        </Table>
      </div>
    </div>
    <div class="associate-table-modal__footer">
      <div class="associate-table-modal__footer-actions">
        <Button @click="emit('close')">取消</Button>
        <Button type="primary" :disabled="totalSelectedCount === 0" @click="handleConfirm">
          确认添加 ({{ totalSelectedCount }})
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Modal, Input, Button, Table, Tooltip } from 'ant-design-vue';
import { FolderOutlined, FilterOutlined, UserOutlined } from '@ant-design/icons-vue';
import CopilotApi from '../../resources/copilot';

const paginationLocale = { items_per_page: '条/页' };

const props = withDefaults(
  defineProps<{
    open: boolean;
    /** 打开时的上下文：来源、sessionId、requestId */
    associateTablePayload?: {
      source?: 'context-card' | 'footer';
      sessionId?: string;
      requestId?: string;
    };
  }>(),
  { associateTablePayload: () => ({}) }
);

const emit = defineEmits<{
  close: [];
  confirm: [tableKeys: string[], payload?: Record<string, unknown>];
}>();

const dbSearch = ref('');
const tableSearch = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
/** 是否只看自己负责的表，对应接口 isSelf */
const isSelfFilter = ref(false);

interface DatabaseItem {
  name: string;
  tableCount: number;
  dataSourceId: string;
}

const databases = ref<DatabaseItem[]>([]);
const databasesLoading = ref(false);

const currentDb = ref<DatabaseItem | null>(null);

const fetchDatabases = async () => {
  databasesLoading.value = true;
  try {
    const res = await CopilotApi.getDatabases();
    const raw = res?.data?.body || [];
    databases.value = raw;
  } catch (e) {
    console.error('getDatabases failed', e);
    databases.value = [];
    currentDb.value = null;
  } finally {
    databasesLoading.value = false;
  }
}

const filteredDatabases = computed(() => {
  const q = dbSearch.value.trim().toLowerCase();
  if (!q) return databases.value;
  return databases.value.filter((d) => d.name.toLowerCase().includes(q));
});

/** 接口返回的单个表结构（与后端一致） */
interface TableItemRaw {
  tableName: string;
  databaseName: string;
  description?: string;
  owner?: string;
  ownerName?: string;
  isSelf?: boolean;
}

const tableList = ref<any[]>([]);
const tableTotal = ref(0);
const tablesLoading = ref(false);

const stripEmailDomain = (val?: string) => {
  if (!val) return val;
  const idx = val.indexOf('@');
  return idx > 0 ? val.slice(0, idx) : val;
};

const mapTableItem = (item: TableItemRaw) => {
  const name = item.tableName ?? '';
  const dbName = item.databaseName ?? '';
  const key = `${dbName}.${name}`;

  return {
    key,
    ...item,
    owner: stripEmailDomain(item.owner),
    ownerName: stripEmailDomain(item.ownerName),
  };
}

const fetchTablesByDb = async (
  databaseName: string,
  pageNum: number,
  pageSizeVal: number,
  keyword?: string,
  isSelf?: boolean
) => {
  if (!databaseName) return;
  tablesLoading.value = true;
  try {
    const params: Record<string, any> = { databaseName, pageNum, pageSize: pageSizeVal };
    if (keyword != null && keyword !== '') params.keyword = keyword;
    if (isSelf != null) params.isSelf = isSelf;
    const res = await CopilotApi.getTablesByDatabase({ params } as any);
    const body = res?.data?.body ?? {};
    const items: TableItemRaw[] = body?.items ?? [];
    const total = body?.total ?? 0;
    tableList.value = items.map(mapTableItem);
    tableTotal.value = total;
  } catch (e) {
    console.error('getTablesByDatabase failed', e);
    tableList.value = [];
    tableTotal.value = 0;
  } finally {
    tablesLoading.value = false;
  }
}

const doFetchTables = () => {
  const db = currentDb.value;
  if (!db?.name) return;
  const keyword = tableSearch.value.trim() || undefined;
  fetchTablesByDb(db.name, currentPage.value, pageSize.value, keyword, isSelfFilter.value);
}

function toggleIsSelfFilter() {
  isSelfFilter.value = !isSelfFilter.value;
  currentPage.value = 1;
  doFetchTables();
}

function onTableSearch() {
  currentPage.value = 1;
  doFetchTables();
}

const tablePagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: tableTotal.value,
  showSizeChanger: true,
  showTotal: (totalNum: number) => `共 ${totalNum} 项数据`,
  size: 'small' as const,
  locale: paginationLocale,
  onChange: (page: number, size: number) => {
    currentPage.value = page;
    pageSize.value = size;
    doFetchTables();
  },
}));

const tableColumns = [
  { title: '数据表名称', dataIndex: 'tableName', key: 'tableName' },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 160 },
];

// 按数据库维度保留勾选项，切换左侧数据库时恢复
const selectedByDbId = ref<Record<string, string[]>>({});
const selectedRowKeys = ref<string[]>([]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  preserveSelectedRowKeys: true,
  onChange: (keys: (string | number)[]) => {
    const keysStr = keys.map(String);
    selectedRowKeys.value = keysStr;
    const dbKey = currentDb.value?.name ?? '';
    if (dbKey) {
      selectedByDbId.value[dbKey] = keysStr;
      selectedByDbId.value = { ...selectedByDbId.value };
    }
  },
}));

watch(
  () => props.open,
  (visible) => {
    if (visible) {
      dbSearch.value = '';
      tableSearch.value = '';
      currentPage.value = 1;
      pageSize.value = 10;
      isSelfFilter.value = false;
      selectedByDbId.value = {};
      selectedRowKeys.value = [];
      currentDb.value = null;
      tableList.value = [];
      tableTotal.value = 0;
      fetchDatabases();
    }
  }
);

const totalSelectedCount = computed(
  () => Object.values(selectedByDbId.value).flat().length
);

const onDbClick = (db: DatabaseItem) => {
  currentDb.value = db;
  tableSearch.value = '';
  currentPage.value = 1;
  isSelfFilter.value = false;
  const dbKey = db.name;
  selectedRowKeys.value = selectedByDbId.value[dbKey] ?? [];
  doFetchTables();
}

function handleConfirm() {
  const allKeys = Object.values(selectedByDbId.value).flat();
  emit('confirm', allKeys, props.associateTablePayload);
  emit('close');
}
</script>

<style lang="less" scoped>
@brand-purple: #722ed1;

.associate-table-modal__body {
  display: flex;
  height: 540px;
}

.associate-table-modal__left {
  width: 228px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-right: 1px solid #f0f0f0;
  padding-right: 12px;
}

.associate-table-modal__search {
  flex-shrink: 0;
}

.associate-table-modal__search-icon {
  color: rgba(0, 0, 0, 0.45);
}

.associate-table-modal__db-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.associate-table-modal__db-loading {
  padding: 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.associate-table-modal__db-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
  }

  &--active {
    background: rgba(114, 46, 209, 0.08);
    .associate-table-modal__db-icon,
    .associate-table-modal__db-name {
      color: @brand-purple;
    }
    .associate-table-modal__db-count {
      background: @brand-purple;
      color: #fff;
    }
  }
}

.associate-table-modal__db-icon {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.45);
  flex-shrink: 0;
}

.associate-table-modal__db-name {
  flex: 1;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.associate-table-modal__db-item--active .associate-table-modal__db-name {
  color: @brand-purple;
}

.associate-table-modal__db-count {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  background: rgba(114, 46, 209, 0.12);
  color: @brand-purple;
  flex-shrink: 0;
  font-weight: 500;
}

.associate-table-modal__right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 12px;
  padding-bottom: 12px;
}

.associate-table-modal__right-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.associate-table-modal__right-header-left {
  flex-shrink: 0;
}

.associate-table-modal__right-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.associate-table-modal__filter-btn {
  flex-shrink: 0;
  &--active {
    color: #fff;
    border-color: @brand-purple;
    background: @brand-purple;
    &:hover {
      color: #fff !important;
      border-color: lighten(@brand-purple, 10%) !important;
      background: lighten(@brand-purple, 10%) !important;
    }
  }
}

.associate-table-modal__table-search {
  width: 240px;
  flex-shrink: 0;
}

.associate-table-modal__table {
  flex: 1;
  min-height: 0;
  :deep(.ant-table-thead > tr > th) {
    font-weight: 600;
    font-size: 13px;
  }
  :deep(.ant-table) {
    font-size: 13px;
  }
}

.associate-table-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  // margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.associate-table-modal__footer-actions {
  display: flex;
  gap: 8px;
}

.associate-table-modal__table-name-cell {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.associate-table-modal__table-name-text {
  word-break: break-all;
}

.associate-table-modal__mine-tag {
  margin: 0;
  font-size: 11px;
  padding: 0 6px;
  border-radius: 4px;
  color: #531dab;
  background: #f9f0ff;
  line-height: 20px;
  display: inline-block;
  margin-left: 8px;
}

.associate-table-modal__desc-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.associate-table-modal__owner-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.associate-table-modal__owner-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  line-height: 22px;
  font-size: 14px;
  background-color: rgb(229, 231, 235);
  color: rgb(107, 114, 128);
  flex-shrink: 0;
  border-radius: 11px;
}
</style>

<style lang="less">
.associate-table-modal.ant-modal .ant-modal-body {
  padding: 0;
}
</style>
