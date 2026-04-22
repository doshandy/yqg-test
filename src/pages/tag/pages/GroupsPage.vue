<!-- 人群管理 -->
<template>
  <div class="tag-page">
    <div class="page-toolbar">
      <a-space>
        <a-input-search placeholder="搜索人群名称 / code" style="width: 260px" allow-clear />
        <a-select
          placeholder="来源"
          :options="[
            { label: 'SQL', value: 'SQL' },
            { label: '规则标签', value: 'RULE' },
            { label: '人工导入', value: 'IMPORT' },
          ]"
          allow-clear
          style="width: 120px"
        />
      </a-space>
      <a-space>
        <a-button>批量下发</a-button>
        <a-button type="primary">
          <template #icon><PlusOutlined /></template>
          新建人群
        </a-button>
      </a-space>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :row-key="(r: any) => r.id"
      :pagination="{ pageSize: 10, showTotal: (n: number) => `共 ${n} 条` }"
      :scroll="{ x: 1300 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'userCount'">
          <span>{{ record.userCount.toLocaleString() }}</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)" :bordered="false">
            {{ statusText(record.status) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'ops'">
          <a-button type="link" size="small">查看</a-button>
          <a-button type="link" size="small">下发</a-button>
          <a-button type="link" size="small">重新计算</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import TagApi, { type GroupItem } from '@/resources/tag';

const loading = ref(false);
const list = ref<GroupItem[]>([]);

const statusColor = (s: string) =>
  ({ READY: 'success', COMPUTING: 'processing', FAILED: 'error' } as Record<string, string>)[s] || 'default';
const statusText = (s: string) =>
  ({ READY: '就绪', COMPUTING: '计算中', FAILED: '失败' } as Record<string, string>)[s] || s;

const columns = [
  { title: '人群 Code', key: 'groupCode', dataIndex: 'groupCode', width: 140 },
  { title: '人群名称', key: 'name', dataIndex: 'name' },
  { title: '用户数', key: 'userCount', dataIndex: 'userCount', width: 120 },
  { title: '来源', key: 'source', dataIndex: 'source', width: 100 },
  { title: '创建人', key: 'creator', dataIndex: 'creator', width: 100 },
  { title: '状态', key: 'status', dataIndex: 'status', width: 100 },
  { title: '创建时间', key: 'createdAt', dataIndex: 'createdAt', width: 160 },
  { title: '操作', key: 'ops', width: 240, fixed: 'right' },
];

async function load() {
  loading.value = true;
  try {
    const res = await TagApi.fetchGroups({ pageNo: 1, pageSize: 100 });
    list.value = res.items;
  } catch (e) {
    // noop
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style lang="less" scoped>
@import './common-page.less';
</style>
