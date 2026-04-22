<template>
  <a-modal
    :open="open"
    title="提交到生产"
    width="680"
    ok-text="提交"
    :ok-button-props="{ disabled: !form.description.trim() }"
    @ok="onOk"
    @cancel="emit('update:open', false)"
  >
    <a-steps :current="0" size="small" style="margin-bottom: 16px">
      <a-step title="填写变更说明" />
      <a-step title="校验" />
      <a-step title="审批" />
      <a-step title="生效" />
    </a-steps>

    <a-form layout="vertical">
      <a-form-item label="变更说明" required>
        <a-textarea
          v-model:value="form.description"
          :rows="4"
          placeholder="简要描述本次变更内容、影响面，以及是否需要下游同学配合"
        />
      </a-form-item>
      <a-form-item label="关联需求单">
        <a-input v-model:value="form.ticket" placeholder="如 TAPD-12345" />
      </a-form-item>
      <a-form-item label="审批人">
        <a-select v-model:value="form.approvers" mode="multiple" :options="approverOptions" placeholder="选择审批人" />
      </a-form-item>
      <a-form-item label="变更预览">
        <div class="diff-preview">
          <pre class="diff-line diff-add">+ 新增字段 activity_level STRING</pre>
          <pre class="diff-line diff-add">+ 新增分区字段 dt</pre>
          <pre class="diff-line diff-del">- 移除字段 deprecated_flag</pre>
          <pre class="diff-line">  表注释保持不变</pre>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { message } from 'ant-design-vue';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

const form = reactive({
  description: '',
  ticket: '',
  approvers: ['sunwei'] as string[],
});
const approverOptions = [
  { label: 'sunwei', value: 'sunwei' },
  { label: 'lihua', value: 'lihua' },
  { label: 'liubei', value: 'liubei' },
];

const onOk = () => {
  if (!form.description.trim()) {
    message.warning('请填写变更说明');
    return;
  }
  message.success('已提交到生产（演示）');
  emit('update:open', false);
};
</script>

<style scoped>
.diff-preview {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 8px;
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 12px;
}
.diff-line { margin: 0; padding: 2px 4px; }
.diff-add { background: #f6ffed; color: #389e0d; }
.diff-del { background: #fff1f0; color: #cf1322; }
</style>
