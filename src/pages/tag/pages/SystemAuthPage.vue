<!-- 系统权限 -->
<template>
  <div class="tag-page">
    <div class="page-toolbar">
      <a-space>
        <a-input-search placeholder="搜索账号 / 姓名" style="width: 240px" allow-clear />
      </a-space>
      <a-button type="primary">
        <template #icon><PlusOutlined /></template>
        添加用户
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :row-key="(r: any) => r.id"
      :pagination="{ pageSize: 10 }"
      :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'roles'">
          <a-tag v-for="r in record.roles" :key="r" color="blue">{{ r }}</a-tag>
        </template>
        <template v-else-if="column.key === 'ops'">
          <a-button type="link" size="small">编辑权限</a-button>
          <a-button type="link" size="small" danger>禁用</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import TagApi, { type SystemAuthItem } from '@/resources/tag';

const loading = ref(false);
const list = ref<SystemAuthItem[]>([]);

const columns = [
  { title: '账号', key: 'account', dataIndex: 'account', width: 160 },
  { title: '姓名', key: 'name', dataIndex: 'name', width: 120 },
  { title: '角色', key: 'roles', dataIndex: 'roles' },
  { title: '邮箱', key: 'mail', dataIndex: 'mail' },
  { title: '更新时间', key: 'updatedAt', dataIndex: 'updatedAt', width: 160 },
  { title: '操作', key: 'ops', width: 200, fixed: 'right' },
];

async function load() {
  loading.value = true;
  try {
    list.value = await TagApi.fetchSystemAuth();
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
