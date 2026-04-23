<template>
  <a-drawer
    :open="open"
    title="DataPilot Copilot规则推荐-推荐列表"
    width="1080"
    :body-style="{ padding: '24px', display: 'flex', flexDirection: 'column' }"
    @close="closeDrawer"
  >
    <div class="ai-drawer__desc">
      <p>基于表：{{ context.tableNameDisplay || '/' }} 的表类型、基础信息、字段信息和历史运行记录，提供质量规则建议。</p>
    </div>

    <div class="ai-drawer__status">
      <div class="ai-drawer__status-left">
        <a-avatar :size="32" class="ai-drawer__avatar">
          <template #icon><RobotOutlined /></template>
        </a-avatar>
      <span class="ai-drawer__status-text">
        <template v-if="isGenerating">Copilot 规则生成中，已生成 {{ generatedCount }} 条...</template>
        <template v-else-if="generatedCount > 0">已生成 {{ generatedCount }} 条规则</template>
        <template v-else>点击开始推荐生成规则</template>
      </span>
      </div>
      <a-space>
        <a-button v-if="!isGenerating" type="primary" @click="startRecommendation">
          <template #icon><PlayCircleOutlined /></template>
          开始推荐
        </a-button>
        <template v-else>
          <a-button @click="stopRecommendation">停止</a-button>
          <a-button @click="cancelRecommendation">取消</a-button>
        </template>
      </a-space>
    </div>

    <div class="ai-drawer__filters">
      <span>规则名称</span>
      <a-input v-model:value="filterRuleName" allow-clear placeholder="请输入" style="width: 220px" />
      <span>规则模板</span>
      <a-select
        v-model:value="filterRuleTemplate"
        allow-clear
        show-search
        placeholder="请选择"
        style="width: 220px"
        :options="templateOptions"
      />
    </div>

    <a-table
      row-key="ruleId"
      :columns="columns"
      :data-source="records"
      :pagination="false"
      :loading="isGenerating"
      :row-selection="rowSelection"
      bordered
      class="ai-drawer__table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'ruleType'">
          {{ templateTypeLabel(record.ruleTemplateType) }}
        </template>
        <template v-else-if="column.key === 'ruleLevel'">
          {{ record.ruleLevel }}
        </template>
        <template v-else-if="column.key === 'threshold'">
          <div class="threshold-view">
            <span class="threshold-view__dot" />
            <span>{{ record.threshold }}</span>
          </div>
        </template>
        <template v-else-if="column.key === 'isEnabled'">
          <a-tag :color="record.isEnabled ? 'green' : 'default'">{{ record.isEnabled ? '启用' : '停用' }}</a-tag>
        </template>
      </template>
    </a-table>

    <div class="ai-drawer__footer">
      <span>已选中 {{ selectedRowKeys.length }} 条规则</span>
      <a-space>
        <a-button @click="closeDrawer">关闭</a-button>
        <a-button type="primary" :disabled="selectedRowKeys.length === 0" @click="acceptRules">接受规则</a-button>
      </a-space>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlayCircleOutlined, RobotOutlined } from '@ant-design/icons-vue';
import DqcApi, { type DqcRuleDetailItem } from '@/resources/dqc';

const emit = defineEmits<{
  accept: [rules: DqcRuleDetailItem[]];
}>();

const open = ref(false);
const isGenerating = ref(false);
const generatedCount = ref(0);
const filterRuleName = ref('');
const filterRuleTemplate = ref<string>();
const selectedRowKeys = ref<string[]>([]);
const templateOptions = ref<Array<{ label: string; value: string }>>([]);
const allRules = ref<DqcRuleDetailItem[]>([]);
const timer = ref<number>();
const context = reactive({
  tableId: '',
  tableNameDisplay: '',
});

const columns = [
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName', width: 220 },
  { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType', width: 110 },
  { title: '规则范围', dataIndex: 'showUseScope', key: 'showUseScope', width: 180 },
  { title: '规则模板', dataIndex: 'ruleTemplateName', key: 'ruleTemplateName', width: 220 },
  { title: '监控阈值', dataIndex: 'threshold', key: 'threshold', width: 160 },
  { title: '重要程度', dataIndex: 'ruleLevel', key: 'ruleLevel', width: 100 },
  { title: '启用状态', dataIndex: 'isEnabled', key: 'isEnabled', width: 100 },
];

const records = computed(() =>
  allRules.value.filter((item) => {
    if (filterRuleName.value && !item.ruleName.toLowerCase().includes(filterRuleName.value.toLowerCase())) return false;
    if (filterRuleTemplate.value && item.ruleTemplateName !== filterRuleTemplate.value) return false;
    return true;
  }),
);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<string | number>) => {
    selectedRowKeys.value = keys.map(String);
  },
}));

function templateTypeLabel(value?: string) {
  return (
    {
      TABLE: '表级规则',
      FIELD: '字段级规则',
      SQL: 'SQL 规则',
      CUSTOM: '自定义规则',
    }[value || ''] || value || '/'
  );
}

function stopTimer() {
  if (timer.value) {
    window.clearInterval(timer.value);
    timer.value = undefined;
  }
}

async function showDrawer(payload: { tableId: string; tableNameDisplay: string }) {
  Object.assign(context, payload);
  open.value = true;
  allRules.value = [];
  generatedCount.value = 0;
  selectedRowKeys.value = [];
  filterRuleName.value = '';
  filterRuleTemplate.value = undefined;
  templateOptions.value = (await DqcApi.fetchRuleTemplateNames()).map((item) => ({ label: item, value: item }));
}

async function startRecommendation() {
  if (!context.tableId) return;
  stopTimer();
  isGenerating.value = true;
  allRules.value = [];
  generatedCount.value = 0;
  selectedRowKeys.value = [];
  const pool = await DqcApi.fetchAiRecommendedRules(context.tableId);
  let index = 0;
  timer.value = window.setInterval(() => {
    if (index >= pool.length) {
      stopTimer();
      isGenerating.value = false;
      return;
    }
    allRules.value.push(pool[index]);
    generatedCount.value = allRules.value.length;
    selectedRowKeys.value = allRules.value.map((item) => String(item.ruleId || item.id));
    index += 1;
  }, 320);
}

function stopRecommendation() {
  stopTimer();
  isGenerating.value = false;
}

function cancelRecommendation() {
  stopRecommendation();
  allRules.value = [];
  generatedCount.value = 0;
  selectedRowKeys.value = [];
}

function acceptRules() {
  const selected = allRules.value.filter((item) => selectedRowKeys.value.includes(String(item.ruleId || item.id)));
  if (!selected.length) {
    message.warning('请先选择规则');
    return;
  }
  emit('accept', selected);
  closeDrawer();
}

function closeDrawer() {
  stopRecommendation();
  open.value = false;
}

onBeforeUnmount(stopTimer);

defineExpose({
  showDrawer,
});
</script>

<style scoped lang="less">
.ai-drawer__desc {
  margin-bottom: 16px;
  color: #475467;
}

.ai-drawer__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
}

.ai-drawer__status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-drawer__status-text {
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
}

.ai-drawer__avatar {
  background: #1677ff;
}

.ai-drawer__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0;
}

.ai-drawer__table {
  flex: 1;
}

.ai-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
}

.threshold-view {
  display: flex;
  align-items: center;
  gap: 8px;
}

.threshold-view__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #cd201f;
}
</style>
