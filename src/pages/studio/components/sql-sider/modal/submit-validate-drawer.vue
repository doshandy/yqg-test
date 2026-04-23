<!-- 单机 mock 占位：原版是「提交校验」抽屉，这里简化为点击即通过 -->
<template>
  <Drawer
    v-model:open="open"
    title="提交校验"
    width="540"
    placement="right"
    destroy-on-close
    @close="onClose"
  >
    <div class="submit-validate-body">
      <p>这里会展示任务校验接口返回的规则结果。</p>
      <p>
        当前任务：
        <b>{{ paneName }}</b>
      </p>
      <a-space>
        <a-button type="primary" @click="onConfirm">校验通过，提交上线</a-button>
        <a-button @click="onClose">取消</a-button>
      </a-space>
    </div>
  </Drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Drawer } from 'ant-design-vue';

const emit = defineEmits(['on-close']);
const open = ref(false);
const paneName = ref('');
const pane = ref<any>(null);

const showDrawer = (payload: { pane?: any }) => {
  open.value = true;
  pane.value = payload?.pane ?? null;
  paneName.value = payload?.pane?.taskName ?? '未知任务';
};

const onConfirm = () => {
  open.value = false;
  emit('on-close', pane.value, 'ONLINE');
};

const onClose = () => {
  open.value = false;
};

defineExpose({ showDrawer });
</script>

<style lang="less" scoped>
.submit-validate-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 14px;
  color: #333;
}
</style>
