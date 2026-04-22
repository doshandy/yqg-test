<!-- 单机 mock 占位：原版在 sql-main/modal 下，负责确认下线/发布弹窗 -->
<template>
  <Modal
    v-model:open="open"
    :title="title"
    destroy-on-close
    @ok="onOk"
    @cancel="onCancel"
  >
    <div class="submit-pane-modal-body">
      <ExclamationCircleOutlined class="submit-pane-modal-icon" />
      <div>
        <div class="submit-pane-modal-title">{{ title }}</div>
        <div class="submit-pane-modal-desc">
          即将对任务 <b>{{ paneName }}</b> 执行「{{ action }}」操作。
          <br />单机 Mock 场景：确认后仅本地提示，不会真正调用远程接口。
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Modal, message } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

const open = ref(false);
const title = ref('确认操作');
const paneName = ref('');
const action = ref('发布');

const showModal = (data: {
  pane?: { taskName?: string };
  title?: string;
  releaseAction?: string;
}) => {
  open.value = true;
  title.value = data?.title ?? '下线';
  paneName.value = data?.pane?.taskName ?? '未知任务';
  action.value = data?.releaseAction ?? title.value;
};

const onOk = () => {
  open.value = false;
  message.success(`${title.value}成功（mock）`);
};

const onCancel = () => {
  open.value = false;
};

defineExpose({ showModal });
</script>

<style lang="less" scoped>
.submit-pane-modal-body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.submit-pane-modal-icon {
  color: #faad14;
  font-size: 22px;
  margin-top: 2px;
}

.submit-pane-modal-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}

.submit-pane-modal-desc {
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}
</style>
