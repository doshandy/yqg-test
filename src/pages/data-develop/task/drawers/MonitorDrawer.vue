<template>
  <PushDrawer
    :open="open"
    title="运行监控"
    :width="820"
    @update:open="emit('update:open', $event)"
  >
    <div class="monitor-head">
      <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane key="overview" tab="运行概览" />
        <a-tab-pane key="rules" tab="监控规则" />
        <a-tab-pane key="alerts" tab="告警历史" />
      </a-tabs>
    </div>

    <div v-show="activeKey === 'overview'">
      <a-row :gutter="12">
        <a-col :span="6">
          <a-card size="small"><a-statistic title="今日运行次数" :value="28" /></a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small"><a-statistic title="成功率" value="96.4%" :value-style="{ color: '#52c41a' }" /></a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small"><a-statistic title="平均耗时" value="4m 12s" /></a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small"><a-statistic title="告警次数" :value="3" :value-style="{ color: '#ff4d4f' }" /></a-card>
        </a-col>
      </a-row>
      <a-card size="small" title="最近 7 天运行趋势" style="margin-top: 12px">
        <div class="sparkline">
          <div
            v-for="(bar, i) in 7"
            :key="i"
            class="bar"
            :style="{ height: `${50 + ((i * 13) % 70)}px`, background: i === 3 ? '#ff4d4f' : '#1677ff' }"
          />
        </div>
        <div class="sparkline-labels">
          <span v-for="i in 7" :key="i">{{ `Day ${i}` }}</span>
        </div>
      </a-card>
    </div>

    <div v-show="activeKey === 'rules'">
      <div class="rules-toolbar">
        <span class="tip">为任务配置运行时监控规则，触发条件后按告警联系人通知。</span>
        <a-button type="primary" size="small">+ 新建规则</a-button>
      </div>
      <a-table
        :columns="ruleColumns"
        :data-source="rules"
        :pagination="false"
        row-key="id"
        size="small"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'level'">
            <a-tag :color="levelColor(record.level)">{{ record.level }}</a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <a-switch :checked="record.status === 'ENABLED'" size="small" />
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a-space>
              <a>编辑</a>
              <a class="danger-link">删除</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <div v-show="activeKey === 'alerts'">
      <a-timeline>
        <a-timeline-item v-for="(a, i) in alerts" :key="i" :color="a.color">
          <div class="alert-item">
            <div class="alert-title">{{ a.title }}</div>
            <div class="alert-meta">{{ a.time }} · {{ a.channel }}</div>
            <div class="alert-desc">{{ a.desc }}</div>
          </div>
        </a-timeline-item>
      </a-timeline>
    </div>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type MonitorRule } from '@/resources/data-develop';

const props = defineProps<{ open: boolean }>();
defineEmits<{ (e: 'update:open', v: boolean): void }>();

const activeKey = ref('overview');
const loading = ref(false);
const rules = ref<MonitorRule[]>([]);

const ruleColumns = [
  { title: '规则名', dataIndex: 'name' },
  { title: '监控对象', dataIndex: 'target', width: 110 },
  { title: '等级', dataIndex: 'level', width: 70 },
  { title: '触发条件', dataIndex: 'trigger', width: 160 },
  { title: '联系人', dataIndex: 'contactGroup', width: 160 },
  { title: '启用', dataIndex: 'status', width: 70 },
  { title: '操作', dataIndex: 'action', width: 120 },
];

const alerts = [
  { title: '任务 FAILED 告警', time: '2026-04-21 02:15', channel: '钉钉', color: 'red',
    desc: 'SparkSubmit 失败：Container exited with non-zero code 137 (OOM)。' },
  { title: '运行超时告警', time: '2026-04-20 03:40', channel: '邮件', color: 'orange',
    desc: '执行时长 72 min，超过阈值 60 min。' },
  { title: '数据延迟告警', time: '2026-04-19 06:03', channel: '钉钉', color: 'blue',
    desc: '未在 06:00 前完成，延迟 3 分钟。' },
];

function levelColor(l: string) {
  switch (l) { case 'HIGH': return 'red'; case 'MID': return 'orange'; default: return 'default'; }
}

watch(
  () => props.open,
  async (v) => {
    if (v && !rules.value.length) {
      loading.value = true;
      try { rules.value = await DataDevelopApi.fetchMonitors(); } finally { loading.value = false; }
    }
  },
);
</script>

<style scoped>
.monitor-head :deep(.ant-tabs-nav) { margin-bottom: 12px; }
.sparkline { display: flex; align-items: flex-end; gap: 12px; height: 140px; padding: 8px 0; }
.bar { flex: 1; border-radius: 4px 4px 0 0; transition: height 0.3s; }
.sparkline-labels { display: flex; justify-content: space-between; color: #888; font-size: 12px; }
.rules-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.tip { color: #888; font-size: 12px; }
.danger-link { color: #ff4d4f; }
.alert-item { padding: 2px 0; }
.alert-title { font-weight: 600; }
.alert-meta { color: #888; font-size: 12px; margin: 2px 0; }
.alert-desc { color: #555; }
</style>
