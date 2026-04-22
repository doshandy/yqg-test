<template>
  <div class="studio-result-item">
    <Row align="middle" class="meta-row">
      <Col>
        <Descriptions
          size="small"
          :column="5"
          :content-style="{ fontSize: '12px' }"
          :label-style="{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.58)' }"
        >
          <Descriptions.Item label="状态">
            <span :style="{ color: ColorMap[resultItem.status] || '#333' }">
              {{ StatusMap[resultItem.status] || '/' }}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="耗时">
            {{ resultItem.execTime || '/' }}
          </Descriptions.Item>
          <Descriptions.Item label="结果行数">
            {{ resultItem.rowCount ?? '/' }}
          </Descriptions.Item>
          <Descriptions.Item :span="2" label="提交时间">
            {{
              resultItem.createTime
                ? dayjs(resultItem.createTime).format('YYYY-MM-DD HH:mm:ss')
                : '/'
            }}
          </Descriptions.Item>
        </Descriptions>
      </Col>
    </Row>

    <Tabs v-model:active-key="activeTab" tab-position="left" size="small">
      <TabPane key="log">
        <template #tab>
          <Tooltip title="查询日志" placement="right">
            <FileSearchOutlined />
          </Tooltip>
        </template>
        <StudioSqlLog :log="resultItem.log" :app-id="resultItem.appId" />
      </TabPane>
      <TabPane key="result">
        <template #tab>
          <Tooltip title="查询结果" placement="right">
            <TableOutlined />
          </Tooltip>
        </template>
        <StudioSqlResult
          :pane="paneForResult"
          :sql-info="sqlInfoForResult"
          :row-count="resultItem.rowCount"
        />
      </TabPane>
      <TabPane key="code">
        <template #tab>
          <Tooltip title="代码" placement="right">
            <CodeOutlined />
          </Tooltip>
        </template>
        <StudioSqlCode :code="resultItem.sql" />
      </TabPane>
    </Tabs>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import dayjs from 'dayjs';
import { Descriptions, Row, Col, Tabs, TabPane, Tooltip } from 'ant-design-vue';
import {
  FileSearchOutlined,
  TableOutlined,
  CodeOutlined,
} from '@ant-design/icons-vue';
import StatusMap, { ColorMap } from '../constant/status-map';
import StudioSqlLog from './StudioSqlLog.vue';
import StudioSqlResult from './StudioSqlResult.vue';
import StudioSqlCode from './StudioSqlCode.vue';

interface ResultInfo {
  key?: string | number;
  id?: string | number;
  status?: string;
  execTime?: string;
  rowCount?: number;
  createTime?: number;
  sql?: string;
  log?: string;
  appId?: string;
  columns?: Array<{ field: string; title: string }>;
  rows?: Array<Record<string, unknown>>;
  database?: string;
  dataSourceId?: string | number;
  table?: string;
  extraInfo?: { errorMsg?: string };
}

const props = defineProps<{ sqlInfo: ResultInfo }>();

const activeTab = ref<string>(
  props.sqlInfo.rowCount && props.sqlInfo.rowCount > 0 ? 'result' : 'log',
);
const resultItem = ref<ResultInfo>({ ...props.sqlInfo });

// 适配原版 sql-result.vue 的 pane/sqlInfo 参数形态
const paneForResult = computed(() => ({
  id: resultItem.value.id ?? resultItem.value.key,
  dataSourceId: resultItem.value.dataSourceId,
  database: resultItem.value.database,
  table: resultItem.value.table,
  extraInfo: resultItem.value.extraInfo,
  errorLine: null as number | null,
}));

const sqlInfoForResult = computed(() => ({
  id: resultItem.value.id ?? resultItem.value.key,
  status: resultItem.value.status === 'FINISHED'
    ? 'FINISHED'
    : resultItem.value.status,
  rowCount: resultItem.value.rowCount,
  database: resultItem.value.database,
  engine: 'HIVE',
  isExpired: 0,
  extraInfo: resultItem.value.extraInfo,
}));

watch(
  () => props.sqlInfo,
  (v) => {
    resultItem.value = { ...v };
    if (v.rowCount && v.rowCount > 0 && activeTab.value === 'log') {
      activeTab.value = 'result';
    }
  },
  { deep: true },
);
</script>

<style lang="less" scoped>
.studio-result-item {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .meta-row {
    flex-shrink: 0;
    padding: 6px 16px 2px 62px;
  }

  :deep(.ant-descriptions-small) {
    .ant-descriptions-row > td {
      padding: 0;
    }
  }

  :deep(.ant-tabs) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;

    .ant-tabs-nav {
      margin: 0;
      flex-shrink: 0;
      width: 40px;
      border-right: 1px solid rgba(5, 5, 5, 0.06);
    }

    .ant-tabs-content-holder {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .ant-tabs-content {
      height: 100%;
    }

    .ant-tabs-tabpane {
      height: 100%;
    }

    .ant-tabs-tab {
      padding: 8px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 16px;
      width: 40px;
      height: 40px;
      margin: 0;
      color: rgba(0, 0, 0, 0.45);

      &.ant-tabs-tab-active .ant-tabs-tab-btn {
        color: #1677ff;
      }
    }

    .ant-tabs-ink-bar {
      display: none !important;
    }
  }
}
</style>
