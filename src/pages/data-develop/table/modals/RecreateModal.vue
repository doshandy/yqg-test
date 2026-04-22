<template>
  <a-modal
    :open="open"
    title="重建表"
    width="560"
    ok-text="开始重建"
    :ok-button-props="{ danger: true }"
    @ok="onOk"
    @cancel="emit('update:open', false)"
  >
    <a-alert
      type="warning"
      show-icon
      message="危险操作"
      description="重建表会先删除当前表，再按新的 DDL 重新创建。原有数据会丢失，请确保已备份。"
      style="margin-bottom: 12px"
    />
    <a-form layout="vertical">
      <a-form-item label="确认输入表名以继续">
        <a-input v-model:value="confirmName" :placeholder="`请输入：${tableName}`" />
      </a-form-item>
      <a-form-item label="原因">
        <a-textarea v-model:value="reason" :rows="3" placeholder="请说明重建原因" />
      </a-form-item>
      <a-checkbox v-model:checked="backup">重建前备份当前数据到 tmp 库</a-checkbox>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';

const props = defineProps<{ open: boolean; tableName?: string }>();
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>();

const confirmName = ref('');
const reason = ref('');
const backup = ref(true);

const onOk = () => {
  if (confirmName.value !== props.tableName) {
    message.warning('确认名不匹配');
    return;
  }
  if (!reason.value.trim()) {
    message.warning('请填写重建原因');
    return;
  }
  message.success('重建请求已提交（演示）');
  emit('update:open', false);
};
</script>
