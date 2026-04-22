<template>
  <PushDrawer
    :open="open"
    title="表权限管理"
    :width="760"
    @update:open="emit('update:open', $event)"
  >
    <div class="auth-head">
      <a-space>
        <a-input-search v-model:value="keyword" placeholder="搜索用户" style="width: 240px" size="small" />
        <a-select v-model:value="scopeFilter" :options="scopeOptions" placeholder="所有权限类型" style="width: 140px" size="small" allow-clear />
      </a-space>
      <a-button type="primary" size="small" @click="grantOpen = true">
        <template #icon><UserAddOutlined /></template>
        授权
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="filtered"
      :pagination="false"
      row-key="id"
      size="small"
      :loading="loading"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'scope'">
          <a-tag :color="scopeColor(record.scope)">{{ record.scope }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a>编辑</a>
            <a-popconfirm title="撤销该用户权限？"><a class="danger-link">撤销</a></a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      :open="grantOpen"
      title="授权"
      @ok="onGrant"
      @cancel="grantOpen = false"
    >
      <a-form layout="vertical">
        <a-form-item label="用户">
          <a-select v-model:value="grantForm.user" show-search :options="userOptions" />
        </a-form-item>
        <a-form-item label="权限类型">
          <a-checkbox-group v-model:value="grantForm.scopes" :options="scopeOptions" />
        </a-form-item>
        <a-form-item label="过期时间">
          <a-date-picker v-model:value="grantForm.expire" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { UserAddOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type TableAuth } from '@/resources/data-develop';

const props = defineProps<{ open: boolean }>();
defineEmits<{ (e: 'update:open', v: boolean): void }>();

const loading = ref(false);
const rows = ref<TableAuth[]>([]);
const keyword = ref('');
const scopeFilter = ref<string>();
const grantOpen = ref(false);

const grantForm = reactive({
  user: undefined as string | undefined,
  scopes: ['SELECT'] as string[],
  expire: undefined as unknown,
});

const scopeOptions = [
  { label: 'SELECT', value: 'SELECT' },
  { label: 'INSERT', value: 'INSERT' },
  { label: 'ALTER', value: 'ALTER' },
  { label: 'DROP', value: 'DROP' },
];

const userOptions = [
  { label: 'sunwei', value: 'sunwei' },
  { label: 'lihua', value: 'lihua' },
  { label: 'zhangsan', value: 'zhangsan' },
  { label: 'liubei', value: 'liubei' },
  { label: 'wangwu', value: 'wangwu' },
];

const columns = [
  { title: '用户', dataIndex: 'user', width: 120 },
  { title: '权限', dataIndex: 'scope', width: 80 },
  { title: '授权人', dataIndex: 'grantedBy', width: 100 },
  { title: '授权时间', dataIndex: 'grantedAt', width: 150 },
  { title: '过期时间', dataIndex: 'expireAt', width: 120 },
  { title: '操作', dataIndex: 'action', width: 140 },
];

const filtered = computed(() => rows.value.filter((r) => {
  const kw = keyword.value.trim().toLowerCase();
  const hitKw = !kw || r.user.toLowerCase().includes(kw);
  const hitScope = !scopeFilter.value || r.scope === scopeFilter.value;
  return hitKw && hitScope;
}));

function scopeColor(s: string) {
  switch (s) {
    case 'SELECT': return 'blue';
    case 'INSERT': return 'green';
    case 'ALTER': return 'orange';
    case 'DROP': return 'red';
    default: return 'default';
  }
}

watch(
  () => props.open,
  async (v) => {
    if (v && !rows.value.length) {
      loading.value = true;
      try { rows.value = await DataDevelopApi.fetchTableAuths(); } finally { loading.value = false; }
    }
  },
);

const onGrant = () => {
  if (!grantForm.user) {
    message.warning('请选择用户');
    return;
  }
  rows.value.push({
    id: `a-${Date.now()}`,
    user: grantForm.user,
    scope: grantForm.scopes[0] as TableAuth['scope'],
    grantedBy: 'sunwei',
    grantedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    expireAt: '永久',
  });
  grantOpen.value = false;
  message.success('授权成功（演示）');
};
</script>

<style scoped>
.auth-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.danger-link { color: #ff4d4f; }
</style>
