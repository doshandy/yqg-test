<template>
  <div class="search-page">
    <section class="search-page__hero">
      <div>
        <p class="search-page__eyebrow">用户命中查询</p>
        <h2>用户查询</h2>
        <p class="search-page__desc">按用户 ID 查询标签与人群命中情况，支持结果导出与命中统计。</p>
      </div>
      <a-button :disabled="!result.items.length" @click="handleExport">导出当前结果</a-button>
    </section>

    <section class="search-page__stats">
      <article class="stat-card">
        <span>查询用户数</span>
        <strong>{{ stats.userCount }}</strong>
        <small>当前输入的用户 ID 数量</small>
      </article>
      <article class="stat-card">
        <span>命中结果数</span>
        <strong>{{ result.total || 0 }}</strong>
        <small>当前结果记录数</small>
      </article>
      <article class="stat-card">
        <span>筛选人群数</span>
        <strong>{{ groupCodes.length }}</strong>
        <small>已选人群条件</small>
      </article>
      <article class="stat-card">
        <span>筛选标签数</span>
        <strong>{{ ruleCodes.length }}</strong>
        <small>已选标签条件</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>查询条件</h3>
          <p>人群和标签条件互斥，单次按一种条件类型进行命中校验。</p>
        </div>
      </div>
      <div class="filter-grid">
        <a-input v-model:value="userIds" placeholder="多个用户 ID 用逗号分隔" />
        <a-select v-model:value="groupCodes" mode="multiple" :options="groupOptions" placeholder="人群" @change="ruleCodes = []" />
        <a-select v-model:value="ruleCodes" mode="multiple" :options="ruleOptions" placeholder="标签" @change="groupCodes = []" />
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="handleSearch">搜索</a-button>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>查询结果</h3>
          <p>根据返回字段动态渲染结果表格，展示用户维度命中结果。</p>
        </div>
        <a-tag color="blue">{{ result.total || 0 }} 条</a-tag>
      </div>
      <div class="result-summary">
        <div>
          <span>查询模式</span>
          <strong>{{ groupCodes.length ? '人群命中' : ruleCodes.length ? '标签命中' : '全部结果' }}</strong>
        </div>
        <div>
          <span>命中字段数</span>
          <strong>{{ matchedFieldCount }}</strong>
        </div>
        <div>
          <span>结果记录数</span>
          <strong>{{ result.total || 0 }}</strong>
        </div>
      </div>
      <a-table :data-source="result.items" :columns="tableColumns" row-key="_rowKey" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key !== 'user_id'">
            <a-tag :color="record[column.key] === '命中' ? 'success' : 'default'">{{ record[column.key] }}</a-tag>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal v-model:open="downloadOpen" title="导出结果" :footer="null" width="720px">
      <a-alert type="info" show-icon message="已生成当前查询结果，可直接查看导出内容预览。" style="margin-bottom: 16px" />
      <a-descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
        <a-descriptions-item label="用户数">{{ stats.userCount }}</a-descriptions-item>
        <a-descriptions-item label="结果数">{{ result.total || 0 }}</a-descriptions-item>
      </a-descriptions>
      <pre class="export-preview">{{ downloadText }}</pre>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import TagApi from '@/resources/tag';

const userIds = ref('10001,10002,10003');
const groupCodes = ref<string[]>([]);
const ruleCodes = ref<string[]>([]);
const groupOptions = ref<Array<{ label: string; value: string }>>([]);
const ruleOptions = ref<Array<{ label: string; value: string }>>([]);
const result = ref<{ columns: Array<{ key: string; title: string }>; items: Array<Record<string, string | number>>; total: number }>({
  columns: [],
  items: [],
  total: 0,
});
const downloadOpen = ref(false);
const downloadText = ref('');

const tableColumns = computed(() =>
  result.value.columns.map((column) => ({
    title: column.title,
    dataIndex: column.key,
    key: column.key,
    ellipsis: true,
  })),
);

const stats = computed(() => ({
  userCount: parseIds().length,
}));
const matchedFieldCount = computed(
  () => result.value.columns.filter((column) => column.key !== 'user_id').length,
);

function parseIds() {
  return userIds.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function handleSearch() {
  const ids = parseIds();
  if (!ids.length) {
    message.warning('请至少输入一个用户 ID');
    return;
  }
  result.value = await TagApi.queryUserSearch({
    userIds: ids,
    groupCodes: groupCodes.value.length ? groupCodes.value : undefined,
    ruleCodes: ruleCodes.value.length ? ruleCodes.value : undefined,
  });
}

async function handleExport() {
  const ids = parseIds();
  const file = await TagApi.exportUserSearch({
    userIds: ids,
    groupCodes: groupCodes.value,
    ruleCodes: ruleCodes.value,
  });
  downloadText.value = file.content;
  downloadOpen.value = true;
}

function handleReset() {
  userIds.value = '';
  groupCodes.value = [];
  ruleCodes.value = [];
  result.value = { columns: [], items: [], total: 0 };
}

onMounted(async () => {
  const options = await TagApi.fetchUserSearchOptions();
  groupOptions.value = options.groups;
  ruleOptions.value = options.rules;
  handleSearch();
});
</script>

<style lang="less" scoped>
.search-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
}

.search-page__hero,
.panel,
.stat-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.search-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.search-page__eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.export-preview {
  margin: 0;
  overflow: auto;
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 14px;
  background: #f8fafc;
  padding: 14px 16px;
  color: #334155;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.search-page__hero h2,
.panel__header h3 {
  margin: 0;
}

.search-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.search-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
}

.stat-card span {
  color: #667085;
  font-size: 13px;
}

.stat-card strong {
  color: #101828;
  font-size: 28px;
}

.panel {
  margin-bottom: 20px;
  padding: 20px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.result-summary > div {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%);
  padding: 16px 18px;
}

.result-summary span {
  color: #667085;
  font-size: 12px;
}

.result-summary strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 18px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr auto auto;
  gap: 12px;
}

@media (max-width: 960px) {
  .search-page {
    padding: 16px;
  }

  .search-page__hero,
  .panel__header,
  .search-page__stats,
  .filter-grid,
  .result-summary {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
