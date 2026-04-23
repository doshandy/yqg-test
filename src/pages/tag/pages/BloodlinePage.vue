<template>
  <div class="bloodline-page">
    <section class="bloodline-page__hero">
      <div>
        <p class="bloodline-page__eyebrow">血缘链路分析</p>
        <h2>血缘查询</h2>
        <p class="bloodline-page__desc">查看指标、标签和人群之间的上下游关系。</p>
      </div>
      <a-button :disabled="!centerNode" @click="handleExport">导出血缘</a-button>
    </section>

    <section class="bloodline-page__stats">
      <article class="stat-card">
        <span>当前节点</span>
        <strong>{{ centerNode?.code || '-' }}</strong>
        <small>中心节点编码</small>
      </article>
      <article class="stat-card">
        <span>上游节点</span>
        <strong>{{ upstream.length }}</strong>
        <small>直接上游关系数</small>
      </article>
      <article class="stat-card">
        <span>下游节点</span>
        <strong>{{ downstream.length }}</strong>
        <small>直接下游关系数</small>
      </article>
      <article class="stat-card">
        <span>查询类型</span>
        <strong>{{ searchType }}</strong>
        <small>当前血缘对象类型</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h3>搜索条件</h3>
          <p>支持按对象类型与编码查询血缘，并查看节点详情。</p>
        </div>
      </div>
      <div class="filter-grid">
        <a-select v-model:value="searchType" :options="typeOptions" />
        <a-input v-model:value="keyword" placeholder="请输入指标/标签/人群编码" allow-clear />
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="handleSearch">搜索</a-button>
      </div>
    </section>

    <section v-if="centerNode" class="bloodline-layout">
      <div class="panel">
        <div class="panel__header">
          <div>
            <h3>当前节点</h3>
            <p>展示当前血缘中心对象的基本信息。</p>
          </div>
        </div>
        <div class="detail-summary">
          <div>
            <span>对象类型</span>
            <strong>{{ typeLabelMap[centerNode.type] || centerNode.type }}</strong>
          </div>
          <div>
            <span>上游关系</span>
            <strong>{{ upstream.length }}</strong>
          </div>
          <div>
            <span>下游关系</span>
            <strong>{{ downstream.length }}</strong>
          </div>
        </div>
        <div class="detail-cards">
          <div class="detail-card">
            <span>名称</span>
            <strong>{{ centerNode.name }}</strong>
          </div>
          <div class="detail-card">
            <span>编码</span>
            <strong>{{ centerNode.code }}</strong>
          </div>
          <div class="detail-card">
            <span>类型</span>
            <strong>{{ typeLabelMap[centerNode.type] || centerNode.type }}</strong>
          </div>
          <div class="detail-card">
            <span>负责人</span>
            <strong>{{ centerNode.owner }}</strong>
          </div>
          <div class="detail-card">
            <span>组织范围</span>
            <strong>{{ centerNode.organizationId?.join(', ') || '/' }}</strong>
          </div>
          <div class="detail-card detail-card--full">
            <span>描述</span>
            <strong>{{ centerNode.description }}</strong>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header">
          <div>
            <h3>上游</h3>
            <p>点击名称查看节点详情。</p>
          </div>
        </div>
        <a-table :data-source="upstream" :columns="nodeColumns" :pagination="false" row-key="id" size="small">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a-button type="link" @click="navigateToNode(record)">{{ record.name }}</a-button>
            </template>
            <template v-else-if="column.key === 'type'">
              {{ typeLabelMap[record.type] || record.type }}
            </template>
            <template v-else-if="column.key === 'op'">
              <a-button type="link" @click="showDetail(record)">详情</a-button>
            </template>
          </template>
        </a-table>
      </div>

      <div class="panel">
        <div class="panel__header">
          <div>
            <h3>下游</h3>
            <p>点击名称查看节点详情。</p>
          </div>
        </div>
        <a-table :data-source="downstream" :columns="nodeColumns" :pagination="false" row-key="id" size="small">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a-button type="link" @click="navigateToNode(record)">{{ record.name }}</a-button>
            </template>
            <template v-else-if="column.key === 'type'">
              {{ typeLabelMap[record.type] || record.type }}
            </template>
            <template v-else-if="column.key === 'op'">
              <a-button type="link" @click="showDetail(record)">详情</a-button>
            </template>
          </template>
        </a-table>
      </div>
    </section>

    <a-modal v-model:open="exportOpen" title="导出内容" :footer="null" width="720px">
      <a-alert type="info" show-icon message="已生成当前血缘链路导出内容，可直接查看预览。" style="margin-bottom: 16px" />
      <a-descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
        <a-descriptions-item label="中心节点">{{ centerNode?.code || '-' }}</a-descriptions-item>
        <a-descriptions-item label="查询类型">{{ searchType }}</a-descriptions-item>
      </a-descriptions>
      <pre class="export-preview">{{ exportText }}</pre>
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="节点详情" width="520">
      <div v-if="detailNode" class="detail-cards">
        <div class="detail-summary detail-summary--drawer">
          <div>
            <span>对象类型</span>
            <strong>{{ typeLabelMap[detailNode.type] || detailNode.type }}</strong>
          </div>
          <div>
            <span>负责人</span>
            <strong>{{ detailNode.owner }}</strong>
          </div>
          <div>
            <span>组织数</span>
            <strong>{{ detailNode.organizationId?.length || 0 }}</strong>
          </div>
        </div>
        <div class="detail-card">
          <span>名称</span>
          <strong>{{ detailNode.name }}</strong>
        </div>
        <div class="detail-card">
          <span>编码</span>
          <strong>{{ detailNode.code }}</strong>
        </div>
        <div class="detail-card">
          <span>类型</span>
          <strong>{{ typeLabelMap[detailNode.type] || detailNode.type }}</strong>
        </div>
        <div class="detail-card">
          <span>负责人</span>
          <strong>{{ detailNode.owner }}</strong>
        </div>
        <div class="detail-card">
          <span>组织范围</span>
          <strong>{{ detailNode.organizationId?.join(', ') || '/' }}</strong>
        </div>
        <div class="detail-card detail-card--full">
          <span>描述</span>
          <strong>{{ detailNode.description }}</strong>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TagApi, { type BloodlineNode } from '@/resources/tag';

const searchType = ref('METRIC');
const keyword = ref('metric_001');
const centerNode = ref<BloodlineNode | null>(null);
const upstream = ref<BloodlineNode[]>([]);
const downstream = ref<BloodlineNode[]>([]);
const detailNode = ref<BloodlineNode | null>(null);
const exportOpen = ref(false);
const detailOpen = ref(false);
const exportText = ref('');

const typeOptions = [
  { label: '指标', value: 'METRIC' },
  { label: '标签', value: 'RULE' },
  { label: 'SQL 标签', value: 'SQL_RULE' },
  { label: '人群', value: 'GROUP' },
  { label: '组合人群', value: 'COMPOSITION_GROUP' },
];
const typeLabelMap: Record<string, string> = {
  METRIC: '指标',
  RULE: '标签',
  SQL_RULE: 'SQL 标签',
  GROUP: '人群',
  COMPOSITION_GROUP: '组合人群',
};
const nodeColumns = [
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '负责人', dataIndex: 'owner', key: 'owner' },
  { title: '操作', key: 'op', width: 88 },
];

async function handleSearch() {
  const [center, up, down] = await Promise.all([
    TagApi.fetchBloodline({ code: keyword.value, type: searchType.value, dep: 0 }),
    TagApi.fetchBloodline({ code: keyword.value, type: searchType.value, dep: -1 }),
    TagApi.fetchBloodline({ code: keyword.value, type: searchType.value, dep: 1 }),
  ]);
  centerNode.value = center[0] || null;
  upstream.value = up;
  downstream.value = down;
}

function handleReset() {
  searchType.value = 'METRIC';
  keyword.value = '';
  centerNode.value = null;
  upstream.value = [];
  downstream.value = [];
}

async function navigateToNode(record: BloodlineNode) {
  searchType.value = record.type;
  keyword.value = record.code;
  await handleSearch();
}

async function showDetail(record: BloodlineNode) {
  detailNode.value = (await TagApi.fetchBloodlineDetail(record.code)) || record;
  detailOpen.value = true;
}

async function handleExport() {
  if (!centerNode.value) return;
  const file = await TagApi.exportBloodline(centerNode.value.code);
  exportText.value = file.content;
  exportOpen.value = true;
}

handleSearch();
</script>

<style lang="less" scoped>
.bloodline-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(124, 58, 237, 0.12), transparent 24%),
    linear-gradient(180deg, #fbf8ff 0%, #f2edff 100%);
}

.bloodline-page__hero,
.panel,
.stat-card,
.detail-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.bloodline-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.bloodline-page__eyebrow {
  margin: 0 0 8px;
  color: #7c3aed;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.bloodline-page__hero h2,
.panel__header h3 {
  margin: 0;
}

.bloodline-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.bloodline-page__stats {
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

.stat-card span,
.detail-card span {
  color: #667085;
  font-size: 13px;
}

.stat-card strong,
.detail-card strong {
  color: #101828;
  font-size: 24px;
}

.panel {
  padding: 20px;
}

.panel__header {
  margin-bottom: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 180px 1fr auto auto;
  gap: 12px;
}

.bloodline-layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 20px;
}

.detail-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.detail-summary--drawer {
  grid-column: 1 / -1;
}

.detail-summary > div {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f4ff 100%);
  padding: 16px 18px;
}

.detail-summary span {
  color: #667085;
  font-size: 12px;
}

.detail-summary strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 16px;
}

.detail-card {
  padding: 18px;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
  font-size: 15px;
}

.detail-card--full {
  grid-column: 1 / -1;
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

@media (max-width: 960px) {
  .bloodline-page {
    padding: 16px;
  }

  .bloodline-page__hero,
  .bloodline-page__stats,
  .bloodline-layout,
  .detail-summary,
  .detail-cards,
  .filter-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
