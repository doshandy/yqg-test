<!--
 * 用户聊天消息气泡组件
-->
<template>
  <div class="copilot-msg__body">
      <!-- 默认：气泡 + 操作 -->
      <template v-if="!editing">
        <div class="copilot-msg__bubble-row">
          <div class="copilot-msg__bubble">{{ content }}</div>
        </div>
        <div class="copilot-msg__actions">
          <Button type="text" class="copilot-msg__action-btn" @click="onCopy">
            <template #icon><CopyOutlined /></template>
          </Button>
          <Tooltip :title="aiReplyLoading ? '正在回答中' : ''">
            <Button type="text" class="copilot-msg__action-btn" :disabled="aiReplyLoading" @click="enterEdit">
              <template #icon><EditOutlined /></template>
            </Button>
          </Tooltip>
        </div>
      </template>
      <!-- 编辑态：卡片 + 输入框 + 四个操作按钮 -->
      <div v-else ref="editCardRef" class="copilot-msg__edit-card">
        <Input.TextArea
          v-model:value="editContent"
          class="copilot-msg__edit-input"
          :auto-size="{ minRows: 3, maxRows: 8 }"
          :bordered="false"
          placeholder="输入内容..."
        />
        <div class="copilot-msg__edit-actions">
          <Tooltip :title="!editContent?.trim() ? '请输入内容后再覆盖重写' : '将代码回退到此消息发送前的状态，并使用新指令重新生成。'">
            <Button class="copilot-msg__edit-btn" :disabled="!editContent?.trim()" @click="handleOverwrite">
              <template #icon><SyncOutlined /></template>
              <span style="margin-left: 2px;">覆盖重写</span>
            </Button>
          </Tooltip>
          <Tooltip title="放弃当前所有修改，仅将代码还原到此消息前的版本，不发送新消息。">
            <Button class="copilot-msg__edit-btn" @click="handleRevert">
              <template #icon><RollbackOutlined /></template>
              <span style="margin-left: 2px;">仅回退</span>
            </Button>
          </Tooltip>
          <Button type="text" class="copilot-msg__edit-cancel" @click="exitEdit">取消</Button>
        </div>
      </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import { Button, Input, Tooltip, message } from 'ant-design-vue';
import {
  CopyOutlined,
  EditOutlined,
  SyncOutlined,
  RollbackOutlined,
} from '@ant-design/icons-vue';

const props = withDefaults(
  defineProps<{
    content?: string;
    aiReplyLoading?: boolean;
  }>(),
  { content: '', aiReplyLoading: false }
);

const emit = defineEmits<{
  edit: [];
  overwrite: [value: string];
  revert: [];
}>();

const editing = ref(false);
const editContent = ref(props.content);
const editCardRef = ref<HTMLElement | null>(null);

watch(
  () => props.content,
  (v) => {
    editContent.value = v;
  }
);

const enterEdit = () => {
  editContent.value = props.content;
  editing.value = true;
  const focusTextarea = () => {
    const el = editCardRef.value;
    if (!el) return;
    const textarea = el.querySelector('textarea');
    textarea?.focus();
  };

  nextTick(focusTextarea);
  setTimeout(focusTextarea, 80);
}

const onCopy = async () => {
  if (!props.content) return;
  try {
    await navigator.clipboard.writeText(props.content);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}

const exitEdit = () => {
  editing.value = false;
  editContent.value = props.content;
}

const handleOverwrite = () => {
  emit('overwrite', editContent.value);
  exitEdit();
}

const handleRevert = () => {
  emit('revert');
  exitEdit();
}
</script>

<style lang="less" scoped>
@brand-purple: #6b4c9a;
@text-primary: rgba(0, 0, 0, 0.88);
@text-secondary: rgba(0, 0, 0, 0.45);

.copilot-msg__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  width: 100%;
  min-width: 0;
}

.copilot-msg__bubble-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  width: 100%;
}

.copilot-msg__bubble {
  max-width: 100%;
  padding: 10px 14px;
  border-radius: 14px 14px 4px 14px;
  background: @brand-purple;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.copilot-msg__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.copilot-msg__action-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  min-width: 24px;
  color: @text-secondary;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    color: @text-primary;
  }
}

.copilot-msg__edit-card {
  width: 100%;
  max-width: 100%;
  background: #fff;
  border: 1px solid #a5b4fc;
  border-radius: 8px;
  overflow: hidden;
}

.copilot-msg__edit-input {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  :deep(.ant-input) {
    padding: 0;
    border: none;
    resize: none;
  }
}

.copilot-msg__edit-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.copilot-msg__edit-btn {
  height: 22px;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    color: #4338ca;
    border-color: #a5b4fc;
    background: #f5f3ff;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: #bbb;
    border-color: #eee;
    background: #f5f5f5;
  }
}

.copilot-msg__edit-cancel {
  height: 22px;
  margin-left: auto;
  font-size: 12px;
  color: @text-secondary;
  padding: 0 10px;
  &:hover {
    color: @text-primary;
    background: rgba(0, 0, 0, 0.06);
  }
}
</style>
