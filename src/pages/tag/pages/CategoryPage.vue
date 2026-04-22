<!-- 类别管理 -->
<template>
  <div class="tag-page">
    <p class="page-desc">维护标签 / 指标所属的业务类别，便于分类检索和权限管理。</p>
    <div class="page-toolbar">
      <a-input-search placeholder="搜索类别" style="width: 240px" allow-clear />
      <a-button type="primary">
        <template #icon><PlusOutlined /></template>
        新建类别
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :row-key="(r: any) => r.id"
      :pagination="false"
      :scroll="{ x: 1000 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'enabled'">
          <a-switch :checked="record.enabled" checked-children="启用" un-checked-children="停用" />
        </template>
        <template v-else-if="column.key === 'ops'">
          <a-button type="link" size="small">编辑</a-button>
          <a-button type="link" size="small" danger>删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import TagApi, { type CategoryItem } from '@/resources/tag';

const loading = ref(false);
const list = ref<CategoryItem[]>([]);

const columns = [
  { title: 'Code', key: 'code', dataIndex: 'code', width: 160 },
  { title: '类别名称', key: 'name', dataIndex: 'name' },
  { title: '指标数量', key: 'itemCount', dataIndex: 'itemCount', width: 120 },
  { title: '状态', key: 'enabled', dataIndex: 'enabled', width: 120 },
  { title: '操作', key: 'ops', width: 160, fixed: 'right' },
];

async function load() {
  loading.value = true;
  try {
    list.value = await TagApi.fetchCategory();
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
