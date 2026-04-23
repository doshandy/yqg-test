<template>
  <div class="stat-page">
    <section class="stat-page__hero">
      <div>
        <p class="stat-page__eyebrow">标签使用分析</p>
        <h2>使用统计</h2>
        <p class="stat-page__desc">按系统或内容维度查看标签能力使用情况，展示汇总结果与趋势明细。</p>
      </div>
      <a-button type="primary" @click="handleSearch">刷新统计</a-button>
    </section>

    <section class="stat-page__stats">
      <article class="stat-card">
        <span>统计类型</span>
        <strong>{{ tab === 'system' ? '系统' : '内容' }}</strong>
        <small>当前统计视角</small>
      </article>
      <article class="stat-card">
        <span>结果行数</span>
        <strong>{{ rows.length }}</strong>
        <small>汇总表返回记录数</small>
      </article>
      <article class="stat-card">
        <span>趋势点数</span>
        <strong>{{ points.length }}</strong>
        <small>时间序列记录数</small>
      </article>
      <article class="stat-card">
        <span>时间区间</span>
        <strong>{{ dayCount }}</strong>
        <small>查询区间天数</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>查询条件</h3>
          <p>支持按系统、内容对象、URL 和日期区间切换统计口径。</p>
        </div>
      </div>
      <div class="filter-grid">
        <a-radio-group v-model:value="tab" :options="tabOptions" option-type="button" />
        <a-select v-model:value="type" :options="moduleOptions" placeholder="模块类型" />
        <a-select v-if="tab === 'system'" v-model:value="appName" :options="meta.apps" placeholder="系统名称" allow-clear />
        <a-select v-else v-model:value="code" :options="meta.codes" placeholder="code" allow-clear />
        <a-select v-model:value="url" :options="meta.urls" placeholder="url" allow-clear />
        <a-date-picker v-model:value="startDate" value-format="YYYY-MM-DD" />
        <a-date-picker v-model:value="endDate" value-format="YYYY-MM-DD" />
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="handleSearch">查询</a-button>
      </div>
    </section>

    <section class="stat-layout">
      <div class="panel">
      <div class="panel__header">
        <div>
          <h3>汇总结果</h3>
          <p>展示当前筛选条件下的访问量排行。</p>
        </div>
      </div>
      <div class="table-summary">
        <div>
          <span>累计访问量</span>
          <strong>{{ rowSummary.total }}</strong>
        </div>
        <div>
          <span>最高访问对象</span>
          <strong>{{ rowSummary.topLabel }}</strong>
        </div>
        <div>
          <span>峰值访问量</span>
          <strong>{{ rowSummary.topCount }}</strong>
        </div>
      </div>
      <a-table :data-source="rows" :columns="columns" :pagination="false" row-key="rowKey" />
    </div>
    <div class="panel">
        <div class="panel__header">
          <div>
          <h3>趋势数据</h3>
          <p>按日期拆分展示趋势数据明细。</p>
        </div>
      </div>
      <div class="table-summary table-summary--trend">
        <div>
          <span>趋势总访问量</span>
          <strong>{{ trendSummary.total }}</strong>
        </div>
        <div>
          <span>峰值日期</span>
          <strong>{{ trendSummary.peakDate }}</strong>
        </div>
        <div>
          <span>峰值访问量</span>
          <strong>{{ trendSummary.peakCount }}</strong>
        </div>
      </div>
      <a-table :data-source="points" :columns="pointColumns" :pagination="false" row-key="date" size="small" />
    </div>
  </section>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import TagApi from '@/resources/tag';

const meta = ref<{ apps: any[]; modules: any[]; urls: any[]; codes: any[] }>({ apps: [], modules: [], urls: [], codes: [] });
const tab = ref('system');
const type = ref('METRICS');
const appName = ref<string>();
const code = ref<string>();
const url = ref<string>();
const startDate = ref(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
const endDate = ref(dayjs().format('YYYY-MM-DD'));
const rows = ref<Array<Record<string, unknown>>>([]);
const points = ref<Array<Record<string, unknown>>>([]);
const tabOptions = [
  { label: '系统统计', value: 'system' },
  { label: '内容统计', value: 'content' },
];
const moduleOptions = computed(() => meta.value.modules);
const columns = computed(() =>
  tab.value === 'system'
    ? [
        { title: 'code', dataIndex: 'code', key: 'code' },
        { title: '昨日访问量', dataIndex: 'cnt', key: 'cnt' },
      ]
    : [
        { title: '系统', dataIndex: 'app', key: 'app' },
        { title: '昨日访问量', dataIndex: 'cnt', key: 'cnt' },
      ],
);
const pointColumns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '对象', dataIndex: 'code', key: 'code' },
  { title: '系统', dataIndex: 'app', key: 'app' },
  { title: '访问量', dataIndex: 'cnt', key: 'cnt' },
];
const dayCount = computed(() => Math.max(dayjs(endDate.value).diff(dayjs(startDate.value), 'day') + 1, 0));
const rowSummary = computed(() => {
  const total = rows.value.reduce((sum, item) => sum + Number(item.cnt || 0), 0);
  const top = [...rows.value].sort((a, b) => Number(b.cnt || 0) - Number(a.cnt || 0))[0];
  return {
    total,
    topLabel: String(top?.app || top?.code || '-'),
    topCount: Number(top?.cnt || 0),
  };
});
const trendSummary = computed(() => {
  const total = points.value.reduce((sum, item) => sum + Number(item.cnt || 0), 0);
  const peak = [...points.value].sort((a, b) => Number(b.cnt || 0) - Number(a.cnt || 0))[0];
  return {
    total,
    peakDate: String(peak?.date || '-'),
    peakCount: Number(peak?.cnt || 0),
  };
});

async function handleSearch() {
  const res = await TagApi.queryStat({
    tab: tab.value,
    type: type.value,
    appName: appName.value,
    code: code.value,
    url: url.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
  rows.value = res.rows;
  points.value = res.points;
}

function handleReset() {
  tab.value = 'system';
  type.value = 'METRICS';
  appName.value = undefined;
  code.value = undefined;
  url.value = undefined;
  startDate.value = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  endDate.value = dayjs().format('YYYY-MM-DD');
  rows.value = [];
  points.value = [];
}

onMounted(async () => {
  meta.value = await TagApi.fetchStatMeta();
  handleSearch();
});
</script>

<style lang="less" scoped>
.stat-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(6, 182, 212, 0.12), transparent 24%),
    linear-gradient(180deg, #f7fcfd 0%, #edf8fb 100%);
}

.stat-page__hero,
.panel,
.stat-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.stat-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.stat-page__eyebrow {
  margin: 0 0 8px;
  color: #0891b2;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat-page__hero h2,
.panel__header h3 {
  margin: 0;
}

.stat-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.stat-page__stats {
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
  padding: 20px;
}

.panel__header {
  margin-bottom: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 12px;
}

.stat-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.table-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.table-summary > div {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fcfe 0%, #f3fafc 100%);
  padding: 16px 18px;
}

.table-summary span {
  color: #667085;
  font-size: 12px;
}

.table-summary strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 18px;
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .stat-page {
    padding: 16px;
  }

  .stat-page__hero,
  .stat-page__stats,
  .stat-layout,
  .filter-grid,
  .table-summary {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
