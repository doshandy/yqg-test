<!--
  分享配置弹窗：展示已选组数、选择链接有效期、安全提示、生成并复制链接
-->
<template>
  <Modal
    :open="open"
    :width="440"
    centered
    :footer="null"
    @cancel="onCancel"
  >
    <template #title>
      <div class="share-modal__title">
        <ShareAltOutlined class="share-modal__title-icon" />
        <span>分享对话记录</span>
      </div>
    </template>

    <div class="share-modal">
      <div class="share-modal__info">
        <MessageOutlined class="share-modal__info-icon" />
        <div class="share-modal__info-body">
          <span v-if="sessionTitle" class="share-modal__session-title">{{ sessionTitle }}</span>
          <span v-if="infoText">{{ infoText }}</span>
          <span v-else>已选择 <strong>{{ selectedCount }}</strong> 组对话进行分享</span>
        </div>
      </div>

      <div class="share-modal__field">
        <span class="share-modal__label">链接有效期</span>
        <div class="share-modal__options">
          <div
            v-for="opt in EXPIRE_OPTIONS"
            :key="opt.label"
            class="share-modal__option"
            :class="{ 'share-modal__option--active': expire === opt.value }"
            @click="expire = opt.value"
          >
            {{ opt.label }}
          </div>
        </div>
      </div>

      <Alert
        type="info"
        show-icon
        class="share-modal__notice"
        message="分享链接仅公司内网环境可访问，请注意数据安全，切勿将敏感数据外传。"
      />

      <div class="share-modal__footer">
        <Button :disabled="confirmLoading" @click="onCancel">取 消</Button>
        <Button type="primary" class="share-modal__confirm" :loading="confirmLoading" @click="onConfirm">
          <template v-if="!confirmLoading"><LinkOutlined /></template>
          {{ confirmLoading ? '生成中...' : '生成并复制链接' }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Modal, Button, Alert } from 'ant-design-vue';
import { ShareAltOutlined, LinkOutlined, MessageOutlined } from '@ant-design/icons-vue';

const EXPIRE_OPTIONS = [
  { value: 7, label: '7 天' },
  { value: 30, label: '30 天' },
  { value: null, label: '永久有效' },
];

const props = defineProps<{
  open: boolean;
  selectedCount: number;
  infoText?: string;
  sessionTitle?: string;
  confirmLoading?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [val: boolean];
  confirm: [payload: { expireDays: number | null }];
  cancel: [];
}>();

const expire = ref<number | null>(7);

watch(() => props.open, (val) => {
  if (val) {
    expire.value = 7;
  }
});

function onConfirm() {
  emit('confirm', { expireDays: expire.value });
}

function onCancel() {
  emit('update:open', false);
  emit('cancel');
}
</script>

<style lang="less" scoped>
@brand-purple: rgba(108, 76, 155, 1);

.share-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0 0;

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.88);
  }

  &__title-icon {
    color: @brand-purple;
    font-size: 18px;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
  }

  &__info-icon {
    font-size: 18px;
    color: rgba(0, 0, 0, 0.35);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__info-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__session-title {
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
  }

  &__options {
    display: flex;
    gap: 12px;
  }

  &__option {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: @brand-purple;
      color: @brand-purple;
    }

    &--active {
      border-color: @brand-purple;
      color: @brand-purple;
      background: rgba(108, 76, 155, 0.04);
      font-weight: 500;
    }
  }

  &__notice {
    border-radius: 8px;
    :deep(.ant-alert-icon) {
      align-self: flex-start;
      margin-top: 2px;
    }
    :deep(.ant-alert-message) {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.55);
      line-height: 1.6;
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 4px;
  }

  &__confirm {
    background-color: @brand-purple !important;
    border-color: @brand-purple !important;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &:hover:not(:disabled) {
      background-color: rgba(108, 76, 155, 0.88) !important;
      border-color: rgba(108, 76, 155, 0.88) !important;
    }
  }
}
</style>
