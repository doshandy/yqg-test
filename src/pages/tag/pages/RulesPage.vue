<!-- 自定义标签 -->
<template>
  <div class="tag-page">
    <div class="page-toolbar">
      <a-space>
        <a-input-search placeholder="搜索标签 code/名称" style="width: 260px" allow-clear />
        <a-select
          placeholder="状态"
          :options="[{ label: '已上线', value: 'ONLINE' }, { label: '已下线', value: 'OFFLINE' }]"
          style="width: 120px"
          allow-clear
        />
      </a-space>
      <a-button type="primary">
        <template #icon><PlusOutlined /></template>
        新建自定义标签
      </a-button>
    </div>
    <a-table
      size="middle"
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :row-key="(r: any) => r.id"
      :pagination="{ pageSize: 10, showTotal: (n: number) => `共 ${n} 条` }"
      :scroll="{ x: 1200 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'ONLINE' ? 'success' : 'default'" :bordered="false">
            {{ record.status === 'ONLINE' ? '已上线' : '已下线' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'ruleText'">
          <code class="rule-code">{{ record.ruleText }}</code>
        </template>
        <template v-else-if="column.key === 'ops'">
          <a-button type="link" size="small">查看规则</a-button>
          <a-button type="link" size="small">编辑</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import TagApi, { type RuleTagItem } from '@/resources/tag';

const loading = ref(false);
const list = ref<RuleTagItem[]>([]);

const columns = [
  { title: '标签 Code', key: 'code', dataIndex: 'code', width: 180 },
  { title: '标签名', key: 'name', dataIndex: 'name' },
  { title: '规则表达式', key: 'ruleText', dataIndex: 'ruleText' },
  { title: '负责人', key: 'owner', dataIndex: 'owner', width: 100 },
  { title: '状态', key: 'status', dataIndex: 'status', width: 100 },
  { title: '更新时间', key: 'updatedAt', dataIndex: 'updatedAt', width: 160 },
  { title: '操作', key: 'ops', width: 180, fixed: 'right' },
];

async function load() {
  loading.value = true;
  try {
    const res = await TagApi.fetchRules({ pageNo: 1, pageSize: 100 });
    list.value = res.items;
  } catch (e) {
    message.error('加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style lang="less" scoped>
@import './common-page.less';
.rule-code {
  display: inline-block;
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 12px;
  color: #1a1a2e;
}
</style>
