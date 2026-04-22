<!-- 指标管理 -->
<template>
  <div class="tag-page">
    <div class="page-toolbar">
      <a-space>
        <a-input-search
          v-model:value="keyword"
          placeholder="搜索指标名 / code"
          style="width: 280px"
          allow-clear
          @search="load"
        />
        <a-select
          v-model:value="status"
          :options="statusOptions"
          placeholder="状态"
          style="width: 120px"
          allow-clear
          @change="load"
        />
      </a-space>
      <a-space>
        <a-button>导出</a-button>
        <a-button type="primary">
          <template #icon><PlusOutlined /></template>
          新建指标
        </a-button>
      </a-space>
    </div>

    <a-table
      size="middle"
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="pagination"
      :row-key="(r: any) => r.id"
      :scroll="{ x: 1200 }"
      @change="onTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)" :bordered="false">
            {{ statusText(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'ops'">
          <a-button type="link" size="small">查看</a-button>
          <a-button type="link" size="small">编辑</a-button>
          <a-button type="link" size="small" danger>下线</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import TagApi, { type MetricItem } from '@/resources/tag';

const loading = ref(false);
const list = ref<MetricItem[]>([]);
const keyword = ref('');
const status = ref('');

const statusOptions = [
  { label: '已上线', value: 'ONLINE' },
  { label: '已下线', value: 'OFFLINE' },
  { label: '草稿', value: 'DRAFT' },
];
const statusColor = (s: string) =>
  ({ ONLINE: 'success', OFFLINE: 'default', DRAFT: 'processing' } as Record<string, string>)[s] || 'default';
const statusText = (s: string) =>
  ({ ONLINE: '已上线', OFFLINE: '已下线', DRAFT: '草稿' } as Record<string, string>)[s] || s;

const columns = [
  { title: '指标 Code', key: 'code', dataIndex: 'code', width: 160 },
  { title: '指标名', key: 'name', dataIndex: 'name' },
  { title: '类别', key: 'category', dataIndex: 'category', width: 100 },
  { title: '数据类型', key: 'dataType', dataIndex: 'dataType', width: 120 },
  { title: '负责人', key: 'owner', dataIndex: 'owner', width: 100 },
  { title: '状态', key: 'status', dataIndex: 'status', width: 100 },
  { title: '更新时间', key: 'updatedAt', dataIndex: 'updatedAt', width: 160 },
  { title: '操作', key: 'ops', width: 200, fixed: 'right' },
];

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (n: number) => `共 ${n} 条`,
});

async function load() {
  loading.value = true;
  try {
    const res = await TagApi.fetchMetrics({
      keyword: keyword.value,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items;
    pagination.total = res.total;
  } catch (e) {
    message.error('加载失败');
  } finally {
    loading.value = false;
  }
}

function onTableChange(p: any) {
  pagination.current = p.current;
  pagination.pageSize = p.pageSize;
  load();
}

onMounted(load);
</script>

<style lang="less" scoped>
@import './common-page.less';
</style>
