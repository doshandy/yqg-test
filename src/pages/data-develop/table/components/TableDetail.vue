<template>
  <div class="table-detail">
    <a-skeleton v-if="loading" active :paragraph="{ rows: 8 }" />
    <template v-else-if="detail">
      <div class="detail-head">
        <div>
          <div class="title-row">
            <h2>{{ detail.database }}.{{ detail.tableName }}</h2>
            <a-tag :color="detail.env === 'PROD' ? 'green' : 'blue'">{{ detail.env }}</a-tag>
            <a-tag color="geekblue">{{ detail.storageFormat }}</a-tag>
          </div>
          <div class="meta">
            负责人：{{ detail.owner }} · 行数：{{ detail.rowCount.toLocaleString() }} · 存储：{{ detail.storageSize }}
            · 更新：{{ detail.updatedAt }}
          </div>
        </div>
        <a-space>
          <a-button v-if="detail.env === 'DEV'" type="primary" size="small" @click="emit('openSubmit')">
            <template #icon><CloudUploadOutlined /></template>
            提交到生产
          </a-button>
          <a-button size="small" @click="emit('openVersion')">
            <template #icon><DiffOutlined /></template>
            版本管理
          </a-button>
          <a-button size="small" @click="emit('openAuth')">
            <template #icon><LockOutlined /></template>
            权限管理
          </a-button>
          <a-dropdown>
            <a-button size="small">
              更多 <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu @click="onMenuClick">
                <a-menu-item key="edit">
                  <EditOutlined /> 编辑表结构
                </a-menu-item>
                <a-menu-item key="recreate">
                  <RedoOutlined /> 重建表
                </a-menu-item>
                <a-menu-item key="delete">
                  <DeleteOutlined /> 删除表
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </div>

      <a-tabs v-model:activeKey="tab">
        <a-tab-pane key="overview" tab="概览">
          <a-descriptions :column="3" bordered size="small">
            <a-descriptions-item label="表 ID">{{ detail.tableId }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ detail.createdAt }}</a-descriptions-item>
            <a-descriptions-item label="生命周期">{{ detail.lifecycle }} 天</a-descriptions-item>
            <a-descriptions-item label="行数">{{ detail.rowCount.toLocaleString() }}</a-descriptions-item>
            <a-descriptions-item label="存储大小">{{ detail.storageSize }}</a-descriptions-item>
            <a-descriptions-item label="存储格式">{{ detail.storageFormat }}</a-descriptions-item>
            <a-descriptions-item label="描述" :span="3">{{ detail.description }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="columns" tab="字段（Schema）">
          <a-table
            :columns="colColumns"
            :data-source="detail.columns"
            :pagination="false"
            size="small"
            row-key="name"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'isPartition' || column.dataIndex === 'nullable' || column.dataIndex === 'primaryKey'">
                <a-tag v-if="record[column.dataIndex]" color="blue">是</a-tag>
                <span v-else class="hint">否</span>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="partitions" tab="分区">
          <a-table
            :columns="partColumns"
            :data-source="detail.partitions"
            :pagination="false"
            size="small"
            row-key="name"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'rowCount'">{{ record.rowCount.toLocaleString() }}</template>
              <template v-else-if="column.dataIndex === 'action'">
                <a-space>
                  <a>查看</a>
                  <a-popconfirm title="确认删除该分区？"><a class="danger-link">删除</a></a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="ddl" tab="DDL">
          <div class="ddl-box">
            <CodeEditor v-model="ddlText" language="sql" readonly />
          </div>
        </a-tab-pane>
        <a-tab-pane key="lineage" tab="血缘">
          <a-alert
            message="血缘展示上下游表和依赖任务。"
            type="info"
            show-icon
            style="margin-bottom: 12px"
          />
          <div class="lineage-demo">
            <div class="lineage-node">dim.user_info</div>
            <div class="lineage-arrow">→</div>
            <div class="lineage-node current">{{ detail.database }}.{{ detail.tableName }}</div>
            <div class="lineage-arrow">→</div>
            <div class="lineage-node">ads.user_active_daily</div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DiffOutlined,
  DownOutlined,
  EditOutlined,
  LockOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import CodeEditor from '@/components/CodeEditor.vue';
import DataDevelopApi, { type TableDetail } from '@/resources/data-develop';

const props = defineProps<{ tableId?: string }>();
const emit = defineEmits<{
  (e: 'openSubmit'): void;
  (e: 'openVersion'): void;
  (e: 'openAuth'): void;
  (e: 'openRecreate'): void;
}>();

const loading = ref(false);
const detail = ref<TableDetail>();
const tab = ref('overview');
const ddlText = ref('');

const colColumns = [
  { title: '字段名', dataIndex: 'name', width: 180 },
  { title: '类型', dataIndex: 'type', width: 110 },
  { title: '分区', dataIndex: 'isPartition', width: 70 },
  { title: '可空', dataIndex: 'nullable', width: 70 },
  { title: '主键', dataIndex: 'primaryKey', width: 70 },
  { title: '注释', dataIndex: 'comment' },
];
const partColumns = [
  { title: '分区', dataIndex: 'name', width: 200 },
  { title: '行数', dataIndex: 'rowCount', width: 140 },
  { title: '大小', dataIndex: 'size', width: 120 },
  { title: '创建时间', dataIndex: 'createdAt' },
  { title: '操作', dataIndex: 'action', width: 120 },
];

const load = async () => {
  if (!props.tableId) return;
  loading.value = true;
  try {
    const d = await DataDevelopApi.fetchTableDetail(props.tableId);
    detail.value = d;
    ddlText.value = buildDDL(d);
  } finally {
    loading.value = false;
  }
};

function buildDDL(d: TableDetail) {
  const cols = d.columns
    .filter((c) => !c.isPartition)
    .map((c) => `  \`${c.name}\` ${c.type}${c.nullable ? '' : ' NOT NULL'} COMMENT '${c.comment}'`)
    .join(',\n');
  const parts = d.columns.filter((c) => c.isPartition);
  const partSql = parts.length
    ? `PARTITIONED BY (\n${parts.map((p) => `  \`${p.name}\` ${p.type} COMMENT '${p.comment}'`).join(',\n')}\n)`
    : '';
  return `CREATE TABLE IF NOT EXISTS ${d.database}.${d.tableName} (
${cols}
)
COMMENT '${d.description}'
${partSql}
STORED AS ${d.storageFormat}
LIFECYCLE ${d.lifecycle};`;
}

const onMenuClick = ({ key }: { key: string }) => {
  if (key === 'edit') message.info('编辑表结构');
  if (key === 'recreate') emit('openRecreate');
  if (key === 'delete') message.warning('删除表需走流程审批');
};

watch(() => props.tableId, load, { immediate: true });
</script>

<style lang="less" scoped>
.table-detail {
  flex: 1;
  padding: 12px 16px;
  background: #fff;
  overflow: auto;
  min-width: 0;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;

  h2 { margin: 0 10px 0 0; display: inline; }
  .title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .meta { color: #666; font-size: 12px; }
}

.hint { color: #aaa; }
.danger-link { color: #ff4d4f; }

.ddl-box { height: 420px; border: 1px solid #f0f0f0; border-radius: 4px; overflow: hidden; }

.lineage-demo {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;

  .lineage-node {
    padding: 12px 18px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background: #fafafa;

    &.current {
      border-color: #1677ff;
      background: #e6f4ff;
      font-weight: 600;
      color: #1677ff;
    }
  }

  .lineage-arrow {
    color: #888;
    font-size: 20px;
  }
}
</style>
