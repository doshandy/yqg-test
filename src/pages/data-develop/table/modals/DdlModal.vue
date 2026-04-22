<template>
  <a-modal
    :open="open"
    title="使用 DDL 建表"
    width="820"
    :mask-closable="false"
    ok-text="解析并建表"
    @ok="onOk"
    @cancel="emit('update:open', false)"
  >
    <a-alert
      type="info"
      show-icon
      message="粘贴 CREATE TABLE 语句，自动解析字段、分区、生命周期等配置。"
      style="margin-bottom: 10px"
    />
    <div class="ddl-box">
      <CodeEditor v-model="ddl" language="sql" />
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import CodeEditor from '@/components/CodeEditor.vue';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void; (e: 'created'): void }>();

const ddl = ref(`CREATE TABLE IF NOT EXISTS dwd_risk.user_activity_flux (
  user_id          BIGINT       NOT NULL COMMENT '用户 ID',
  source           STRING                COMMENT '来源渠道',
  event_cnt        INT                   COMMENT '事件数',
  amount           DECIMAL(16, 2)        COMMENT '金额'
)
COMMENT '用户行为明细'
PARTITIONED BY (dt STRING COMMENT '分区日期')
STORED AS PARQUET
LIFECYCLE 180;`);

const onOk = () => {
  if (!ddl.value.trim()) {
    message.warning('请粘贴 DDL 语句');
    return;
  }
  message.success('DDL 解析成功，建表请求已提交（演示）');
  emit('created');
  emit('update:open', false);
};
</script>

<style scoped>
.ddl-box { height: 360px; border: 1px solid #f0f0f0; border-radius: 4px; overflow: hidden; }
</style>
