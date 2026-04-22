<!-- 使用统计 -->
<template>
  <div class="tag-page">
    <p class="page-desc">统计每位用户的标签查询使用情况，用于容量规划与权限审计。</p>
    <div class="page-toolbar">
      <a-space>
        <a-range-picker style="width: 260px" />
        <a-input-search placeholder="搜索账号" style="width: 200px" allow-clear />
      </a-space>
      <a-button>导出 Excel</a-button>
    </div>
    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :row-key="(r: any) => r.id"
      :pagination="{ pageSize: 10, showTotal: (n: number) => `共 ${n} 条` }"
      :scroll="{ x: 1100 }"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import TagApi, { type QueryStatItem } from '@/resources/tag';

const loading = ref(false);
const list = ref<QueryStatItem[]>([]);

const columns = [
  { title: '账号', key: 'user', dataIndex: 'user' },
  { title: '查询次数', key: 'queryCount', dataIndex: 'queryCount', sorter: (a: any, b: any) => a.queryCount - b.queryCount },
  { title: '最近查询', key: 'lastQuery', dataIndex: 'lastQuery' },
  { title: '高频表', key: 'topTable', dataIndex: 'topTable' },
];

async function load() {
  loading.value = true;
  try {
    const res = await TagApi.fetchQueryStat({ pageNo: 1, pageSize: 100 });
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
