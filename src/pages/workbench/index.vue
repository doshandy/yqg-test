<!--
  @file Workbench index.vue
  @description 工作台：首页统计卡片 + 最近活动。数据全部来自 MSW mock。
-->

<template>
  <div class="workbench">
    <div class="workbench__header">
      <h2>工作台</h2>
      <p>一眼看清平台最近的数据与活动。所有接口由 MSW mock，单机运行。</p>
    </div>

    <a-row :gutter="16" class="workbench__stats">
      <a-col
        v-for="card in statCards"
        :key="card.key"
        :xs="24"
        :sm="12"
        :md="6"
      >
        <div class="stat-card" :style="{ '--accent': card.color }">
          <div class="stat-card__label">{{ card.label }}</div>
          <div class="stat-card__value">
            <a-statistic :value="stats[card.key]" :loading="loading" />
          </div>
          <div class="stat-card__hint">{{ card.hint }}</div>
        </div>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="workbench__body">
      <a-col :xs="24" :lg="14">
        <a-card title="最近活动" :bordered="false">
          <a-list
            :data-source="activities"
            :loading="loading"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <span>{{ item.user }}</span>
                    <a-tag color="blue" class="ml-8">{{ item.action }}</a-tag>
                    <span class="target">{{ item.target }}</span>
                  </template>
                  <template #description>
                    {{ item.time }}
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="10">
        <a-card title="快速入口" :bordered="false">
          <a-space direction="vertical" class="quick-links" size="middle">
            <router-link to="/metric/catalog" class="quick-link">
              <UnorderedListOutlined />
              <div>
                <strong>指标目录</strong>
                <p>浏览全公司统一口径指标</p>
              </div>
            </router-link>
            <router-link to="/data-map" class="quick-link">
              <DatabaseOutlined />
              <div>
                <strong>数据地图</strong>
                <p>按分层查找数据资产</p>
              </div>
            </router-link>
            <router-link to="/dqc" class="quick-link">
              <SafetyCertificateOutlined />
              <div>
                <strong>数据质量</strong>
                <p>规则管理与监控（占位）</p>
              </div>
            </router-link>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import {
  DatabaseOutlined,
  SafetyCertificateOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue';
import HomeApi, { type HomeActivityItem, type HomeStats } from '@/resources/home';

const loading = ref(false);
const stats = ref<HomeStats>({
  metricTotal: 0,
  tableTotal: 0,
  taskRunning: 0,
  alertPending: 0,
});
const activities = ref<HomeActivityItem[]>([]);

const statCards: {
  key: keyof HomeStats;
  label: string;
  color: string;
  hint: string;
}[] = [
  { key: 'metricTotal', label: '指标总数', color: '#3b82f6', hint: '已上线指标' },
  { key: 'tableTotal', label: '数据表数', color: '#8b5cf6', hint: '跨所有分层' },
  { key: 'taskRunning', label: '运行中任务', color: '#22c55e', hint: '今日调度' },
  { key: 'alertPending', label: '待处理告警', color: '#ef4444', hint: '质量/调度告警' },
];

async function loadData() {
  loading.value = true;
  try {
    const [statsRes, activityRes] = await Promise.all([
      HomeApi.fetchStats(),
      HomeApi.fetchRecentActivity(),
    ]);
    stats.value = statsRes.data?.body ?? stats.value;
    activities.value = activityRes.data?.body ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style lang="less" scoped>
.workbench {
  &__header {
    margin-bottom: 20px;

    h2 {
      font-size: 22px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    p {
      color: #6b7280;
      margin: 6px 0 0;
      font-size: 13px;
    }
  }

  &__stats {
    margin-bottom: 16px;
  }

  &__body {
    margin-top: 8px;

    .ant-card {
      height: 100%;
    }
  }
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid #eef2f7;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--accent, #3b82f6) 0%, transparent 60%);
    opacity: 0.08;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  }

  &__label {
    color: #6b7280;
    font-size: 13px;
  }

  &__value {
    margin-top: 6px;

    :deep(.ant-statistic-content-value) {
      color: var(--accent, #111827);
      font-size: 28px;
      font-weight: 700;
    }
  }

  &__hint {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 4px;
  }
}

.ml-8 {
  margin-left: 8px;
}

.target {
  color: #374151;
  margin-left: 6px;
}

.quick-links {
  width: 100%;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f9fafb;
  color: #1f2937;
  text-decoration: none;
  transition: all 0.25s ease;

  :deep(.anticon) {
    font-size: 22px;
    color: #6366f1;
  }

  strong {
    font-weight: 600;
  }

  p {
    margin: 2px 0 0;
    color: #6b7280;
    font-size: 12px;
  }

  &:hover {
    background: #eef2ff;
    transform: translateX(4px);
  }
}
</style>
