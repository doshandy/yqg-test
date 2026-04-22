<!--
  AI 消息反馈区：复制 / 点赞 / 点踩，点踩后展开反馈表单。
  feedbackType 有值时不可再操作：LIKE 时赞高亮，DISLIKE/具体问题类型时点踩高亮并展示「已反馈」卡片。
-->
<template>
  <div class="ai-message-feedback">
    <div class="ai-message-feedback__actions">
      <Button
        type="text"
        class="ai-message-feedback__btn"
        @click="onCopy"
      >
        <template #icon><CopyOutlined /></template>
      </Button>
      <div class="ai-message-feedback__divider" />
      <Button
        type="text"
        class="ai-message-feedback__btn"
        :class="{ 'ai-message-feedback__btn--like-active': isLike }"
        @click="onLike"
      >
        <template #icon><LikeFilled v-if="isLike" /><LikeOutlined v-else /></template>
      </Button>
      <Button
        type="text"
        class="ai-message-feedback__btn"
        :class="{ 'ai-message-feedback__btn--dislike-active': isDislike }"
        @click="onDislikeClick"
      >
        <template #icon><DislikeFilled v-if="isDislike" /><DislikeOutlined v-else /></template>
      </Button>
    </div>
    <!-- 已反馈（点踩）展示 -->
    <div v-if="isDislike && feedbackLabel" class="ai-message-feedback__done">
      <span class="ai-message-feedback__done-prefix">已反馈:</span>
      <span class="ai-message-feedback__done-text">{{ feedbackLabel }}{{ feedbackDetails ? `: "${feedbackDetails}"` : '' }}</span>
    </div>
    <div v-else-if="isOpen" class="ai-message-feedback__card">
      <div class="ai-message-feedback__label-row">
        <div
          class="ai-message-feedback__label"
          :class="{ 'ai-message-feedback__label--error': showReasonError }"
        >
          问题类型 (必选)
        </div>
        <div v-if="showReasonError" class="ai-message-feedback__reason-error">
          <CloseCircleFilled class="ai-message-feedback__reason-error-icon" />
          <span>请选择一项原因</span>
        </div>
      </div>
      <div class="ai-message-feedback__tags">
        <span
          v-for="opt in FEEDBACK_PROBLEM_OPTIONS"
          :key="opt.value"
          class="ai-message-feedback__tag"
          :class="{ 'ai-message-feedback__tag--selected': feedbackReason === opt.value }"
          @click="onSelectReason(opt.value)"
        >
          {{ opt.label }}
        </span>
      </div>
      <div class="ai-message-feedback__field">
        <Input.TextArea
          :value="feedbackDetails"
          placeholder="具体描述问题 (可选)..."
          :rows="2"
          :bordered="true"
          :maxlength="FEEDBACK_DETAILS_MAX_LEN"
          show-count
          class="ai-message-feedback__textarea"
          @update:value="setDetails"
        />
      </div>
      <div class="ai-message-feedback__actions-row">
        <Button type="link" class="ai-message-feedback__cancel" @click="close">取消</Button>
        <Button
          type="primary"
          class="ai-message-feedback__submit"
          @click="onSubmit"
        >
          提交反馈
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Button, Input, message  } from 'ant-design-vue';
import { CopyOutlined, LikeOutlined, LikeFilled, DislikeOutlined, DislikeFilled, CloseCircleFilled } from '@ant-design/icons-vue';
import { OUTPUT_CONTENT, type AiMessage } from '../../constant';
import Api from '../../resources/copilot';

const props = defineProps<{
  msg: AiMessage;
}>();

const FEEDBACK_DETAILS_MAX_LEN = 150;

const FEEDBACK_PROBLEM_OPTIONS = [
  { value: 'HALLUCINATION', label: '模型幻觉/虚构事实' },
  { value: 'WRONG_ACCURACY', label: '口径错误/诊断不准' },
  { value: 'CANNOT_RUN', label: '代码无法运行' },
  { value: 'INTENT_MISMATCH', label: '意图理解偏差' },
  { value: 'OPTIMIZATION_INVALID', label: '性能优化无效' },
  { value: 'INCOMPLETE', label: '回答卡顿/不完整' },
  { value: 'OTHER', label: '其他' },
];

const isOpen = ref(false);
/** 未选问题类型时点击提交，在右上角显示提示 */
const showReasonError = ref(false);

const feedbackType = ref(props.msg?.feedback?.feedbackType ?? '');
const feedbackReason = ref(props.msg?.feedback?.reason ?? '');
const feedbackDetails = ref(props.msg?.feedback?.details ?? '');

watch(() => props.msg?.feedback, (newVal: AiMessage['feedback']) => {
  feedbackType.value = newVal?.feedbackType ?? '';
  feedbackReason.value = newVal?.reason ?? '';
  feedbackDetails.value = newVal?.details ?? '';
});

/** 已点赞 */
const isLike = computed(() => feedbackType.value === 'LIKE');
/** 已点踩（含具体问题类型） */
const isDislike = computed(() => feedbackType.value === 'DISLIKE');
/** 点踩时的问题类型文案（用于「已反馈」展示） */
const feedbackLabel = computed(() => {
  if (!isDislike.value) return '';
  const v = feedbackReason.value;
  const opt = FEEDBACK_PROBLEM_OPTIONS.find((o) => o.value === v);

  return opt?.label ?? v;
});

function onCopy() {
  const outputItem = (props.msg?.listItems ?? []).find(
    (item: any) => item?.renderCategory === OUTPUT_CONTENT
  );
  const content = typeof outputItem?.content === 'string' ? outputItem.content : '';

  if (!content) {
    message.warning('暂无可复制内容');

    return;
  }

  navigator.clipboard.writeText(content).then(() => {
    message.success('复制成功');
  }).catch(() => {
    message.error('复制失败');
  });
}

function onLike() {
  const params = {
    requestId: props.msg.requestId,
    sessionId: props.msg.sessionId,
    messageSeqNo: props.msg.messageSeqNo,
    feedbackType: feedbackType.value === 'LIKE' ? 'CANCEL' : 'LIKE',
  };

  Api.feedback(params).then((res) => {
    if (res.data?.body) {
      message.success('感谢您的反馈');
      if (feedbackType.value === 'LIKE') {
        feedbackType.value = '';
        feedbackReason.value = '';
        feedbackDetails.value = '';
        isOpen.value = false;
      } else {
        feedbackType.value = 'LIKE';

        feedbackReason.value = '';
        feedbackDetails.value = '';
        isOpen.value = false;
      }
    }
  }).catch(() => {
    message.error('操作失败，请重试');
  });
}

function onDislikeClick() {
  if (isDislike.value) {
    const params = {
      requestId: props.msg.requestId,
      sessionId: props.msg.sessionId,
      messageSeqNo: props.msg.messageSeqNo,
      feedbackType: 'CANCEL',
    };
    Api.feedback(params).then((res) => {
      if (res.data?.body) {
        feedbackType.value = '';
        feedbackReason.value = '';
        feedbackDetails.value = '';
        isOpen.value = false;
      }
    }).catch(() => {
      message.error('操作失败，请重试');
    });

    return;
  }
  
  isOpen.value = !isOpen.value;
  
}

function close() {
  isOpen.value = false;
  showReasonError.value = false;
  feedbackReason.value = '';
  feedbackDetails.value = '';
}

function setDetails(value: string) {
  feedbackDetails.value = value;
}

function onSelectReason(value: string) {
  feedbackReason.value = value;
  showReasonError.value = false;
}

function onSubmit() {
  if (!feedbackReason.value) {
    showReasonError.value = true;

    return;
  }

  showReasonError.value = false;

  const params = {
    requestId: props.msg.requestId,
    sessionId: props.msg.sessionId,
    messageSeqNo: props.msg.messageSeqNo,
    feedbackType: 'DISLIKE',
    reason: feedbackReason.value,
    details: feedbackDetails.value,
  };

  Api.feedback(params).then((res) => {
    if (res.data?.body) {
      message.success('反馈已提交，我们会持续改进');
      feedbackType.value = 'DISLIKE';
      isOpen.value = false;
      showReasonError.value = false;
    }
  }).catch(() => {
    message.error('操作失败，请重试');
  });
}
</script>

<style lang="less" scoped>
.ai-message-feedback {
  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
    padding: 0;
    min-width: 24px;
    color: rgba(0, 0, 0, 0.45);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    &:hover:not(:disabled) {
      color: rgba(0, 0, 0, 0.88);
    }
    &--disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    &--like-active {
      color: #1890ff !important;
      background: transparent;
    }
    &--dislike-active {
      color: #ff4d4f !important;
      // background: rgba(255, 77, 79, 0.08);
      // border: 1px solid #ff4d4f;
      border-radius: 4px;
    }
  }

  &__done {
    margin-top: 10px;
    padding: 2px 4px;
    background: #eee;
    max-width: 480px;
    display: flex;
    align-items: baseline;
    overflow: hidden;
  }

  &__done-prefix {
    color: #ff4d4f;
    font-size: 12px;
    margin-right: 4px;
    flex-shrink: 0;
  }

  &__done-text {
    color: rgba(0, 0, 0, 0.65);
    font-size: 12px;
    word-break: break-all;
    min-width: 0;
  }

  &__divider {
    width: 1px;
    height: 12px;
    background: rgb(224, 224, 224);
    flex-shrink: 0;
  }

  &__card {
    margin-top: 10px;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    max-width: 480px;
  }

  &__label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 2px;
  }

  &__label {
    font-size: 11px;
    font-weight: bold;
    color: rgb(102, 102, 102);

    &--error {
      color: #ff4d4f;
    }
  }

  &__reason-error {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 4px;
    color: #ff4d4f;
    font-size: 12px;
  }

  &__reason-error-icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #f0f0f0;
    background: #fafafa;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;

    &--selected {
      background: #fff1f0;
      border-color: #ff4d4f;
      color: #ff4d4f;
      font-weight: 500;
    }
  }

  &__textarea {
    resize: none;
    font-size: 12px;
    :deep(.ant-input) {
      font-size: 12px;
    }
  }

  &__actions-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
  }

  &__cancel {
    color: rgb(102, 102, 102) !important;
    font-size: 12px !important;
    font-weight: normal;
    padding: 0;
    height: auto;
    &:hover {
      color: rgb(102, 102, 102) !important;
      opacity: 0.8;
    }
  }

  &__submit {
    font-size: 12px !important;
    font-weight: bold !important;
    border-radius: 4px;
    padding: 0 6px;
    height: 24px;
    display: flex;
    align-items: center;
  }
}
</style>
