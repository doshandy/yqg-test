<template>
  <Modal
    v-model:open="open"
    class="delete-task"
    title=""
    :width="type === 'task' ? '600px' : '350px'"
    destroy-on-close
    :footer="null"
    :closable="false"
    @cancel="onCancel"
  >
    <div class="modal-title">
      <ExclamationCircleOutlined style="color: #ff4d4f;margin-right: 8px;"/>
      <span>{{ tips }}</span>
    </div>
    <Row
      style="margin-top: 10px"
      align="middle"
      justify="end"
    >
      <Button style="margin-right: 10px" @click="onCancel">取消</Button>
      <Button type="primary" @click="onConfirm">确定</Button>
    </Row>
  </Modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import {
  Modal,
  Row,
  Button,
  message,
} from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import Sql from '@/resources/sql';
const emit = defineEmits(['on-refresh']);

const open = ref<boolean>(false);
const id = ref(undefined);
const tips = ref('');
const type = ref('');

const showModal = (data) => {
  open.value = true;
  id.value = data.data.id;
  type.value = data.type;
  tips.value = data.type === 'task' ? `确定删除任务：${data.data.taskName}，请谨慎操作！` : '确认删除当前目录?';
};

const onCancel = () => {
  open.value = false;
  id.value = undefined;
  tips.value = '';
  type.value = '';
};

const onConfirm = async () => {
  const save =
        type.value === 'task'
          ? Sql.deleteTasks
          : Sql.deleteDirectory;
  await save({ params: { id: id.value } });
  message.success('删除成功');
  emit('on-refresh', type.value, id.value);
  onCancel();
};

defineExpose({
  showModal,
});
</script>
<style lang="less" scoped>
.delete-task {
  .modal-title {
    padding: 20px;
    font-size: 16px;
    svg {
      margin-right: 8px;
      font-size: 20px;
    }
  }
}
</style>
