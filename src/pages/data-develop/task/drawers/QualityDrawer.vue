<template>
  <PushDrawer
    :open="open"
    title="质量监控"
    :width="860"
    @update:open="emit('update:open', $event)"
  >
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="rules" tab="质量规则">
        <div class="rules-head">
          <a-space>
            <a-select
              v-model:value="dimFilter"
              placeholder="所有维度"
              style="min-width: 160px"
              :options="dimOptions"
              allow-clear
              size="small"
            />
            <a-input v-model:value="keyword" size="small" placeholder="搜索规则" />
          </a-space>
          <a-button type="primary" size="small">+ 新增规则</a-button>
        </div>
        <a-table
          :columns="ruleColumns"
          :data-source="filteredRules"
          :pagination="false"
          row-key="id"
          size="small"
          :loading="loading"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'dimension'">
              <a-tag color="blue">{{ record.dimension }}</a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'level'">
              <a-tag :color="levelColor(record.level)">{{ record.level }}</a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'enabled'">
              <a-switch :checked="record.enabled" size="small" />
            </template>
            <template v-else-if="column.dataIndex === 'action'">
              <a-space>
                <a>编辑</a>
                <a>对比</a>
                <a class="danger-link">删除</a>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="compare" tab="质量对比">
        <a-alert
          type="info"
          show-icon
          message="可对同一张表、同一个维度在不同运行日期上的规则结果进行对比。"
          style="margin-bottom: 12px"
        />
        <a-row :gutter="12">
          <a-col :span="12">
            <a-card title="基准运行 2026-04-20" size="small">
              <a-descriptions :column="1" size="small">
                <a-descriptions-item label="运行编号">run-20260420-001</a-descriptions-item>
                <a-descriptions-item label="规则数">4</a-descriptions-item>
                <a-descriptions-item label="通过">4</a-descriptions-item>
                <a-descriptions-item label="失败">0</a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>
          <a-col :span="12">
            <a-card title="本次运行 2026-04-22" size="small">
              <a-descriptions :column="1" size="small">
                <a-descriptions-item label="运行编号">run-20260422-001</a-descriptions-item>
                <a-descriptions-item label="规则数">4</a-descriptions-item>
                <a-descriptions-item label="通过"><span style="color: #52c41a">3</span></a-descriptions-item>
                <a-descriptions-item label="失败"><span style="color: #ff4d4f">1（active_seconds 非负）</span></a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>
        </a-row>
      </a-tab-pane>
      <a-tab-pane key="history" tab="执行记录">
        <a-table
          :columns="historyColumns"
          :data-source="history"
          :pagination="false"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'status'">
              <a-tag :color="record.status === 'PASS' ? 'green' : 'red'">
                {{ record.status === 'PASS' ? '通过' : '失败' }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import PushDrawer from '@/components/PushDrawer.vue';
import DataDevelopApi, { type QualityRule } from '@/resources/data-develop';

const props = defineProps<{ open: boolean }>();
defineEmits<{ (e: 'update:open', v: boolean): void }>();

const activeKey = ref('rules');
const loading = ref(false);
const rules = ref<QualityRule[]>([]);
const keyword = ref('');
const dimFilter = ref<string>();

const dimOptions = [
  { label: '完整性', value: '完整性' },
  { label: '准确性', value: '准确性' },
  { label: '一致性', value: '一致性' },
  { label: '时效性', value: '时效性' },
];

const ruleColumns = [
  { title: '维度', dataIndex: 'dimension', width: 80 },
  { title: '规则名', dataIndex: 'name' },
  { title: '监控字段', dataIndex: 'target', width: 120 },
  { title: '表达式', dataIndex: 'expression', ellipsis: true },
  { title: '阈值', dataIndex: 'threshold', width: 160 },
  { title: '等级', dataIndex: 'level', width: 70 },
  { title: '启用', dataIndex: 'enabled', width: 70 },
  { title: '操作', dataIndex: 'action', width: 160 },
];
const historyColumns = [
  { title: '运行时间', dataIndex: 'time', width: 160 },
  { title: '规则', dataIndex: 'rule' },
  { title: '结果', dataIndex: 'status', width: 80 },
  { title: '检出异常行', dataIndex: 'anomaly', width: 120 },
  { title: '执行人', dataIndex: 'operator', width: 120 },
];
const history = [
  { id: 1, time: '2026-04-22 02:15', rule: 'user_id 非空', status: 'PASS', anomaly: 0, operator: 'sunwei' },
  { id: 2, time: '2026-04-22 02:15', rule: 'active_seconds 非负', status: 'FAIL', anomaly: 12, operator: 'sunwei' },
  { id: 3, time: '2026-04-22 02:15', rule: 'activity_level 枚举值', status: 'PASS', anomaly: 0, operator: 'sunwei' },
  { id: 4, time: '2026-04-21 02:15', rule: 'user_id 非空', status: 'PASS', anomaly: 0, operator: 'sunwei' },
  { id: 5, time: '2026-04-21 02:15', rule: 'active_seconds 非负', status: 'PASS', anomaly: 0, operator: 'sunwei' },
];

function levelColor(l: string) {
  switch (l) { case 'HIGH': return 'red'; case 'MID': return 'orange'; default: return 'default'; }
}

const filteredRules = computed(() => {
  const kw = keyword.value.trim();
  return rules.value.filter((r) => {
    const hitKw = !kw || r.name.includes(kw) || r.target.includes(kw);
    const hitDim = !dimFilter.value || r.dimension === dimFilter.value;
    return hitKw && hitDim;
  });
});

watch(
  () => props.open,
  async (v) => {
    if (v && !rules.value.length) {
      loading.value = true;
      try { rules.value = await DataDevelopApi.fetchQualityRules(); } finally { loading.value = false; }
    }
  },
);
</script>

<style scoped>
.rules-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.danger-link { color: #ff4d4f; }
</style>
