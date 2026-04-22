<!-- 单机 mock 占位：原版是「关联 TAPD」选择器 -->
<template>
  <div class="tapd-card-section">
    <div v-if="showTitle" class="tapd-title">关联 TAPD 需求（Mock）</div>
    <a-space direction="vertical" style="width: 100%">
      <a-input
        v-for="(item, idx) in list"
        :key="idx"
        :value="item.title"
        placeholder="请输入 TAPD 需求标题"
        @update:value="(val) => onUpdate(idx, val)"
      >
        <template #suffix>
          <a @click="onRemove(idx)">移除</a>
        </template>
      </a-input>
      <a-button block type="dashed" @click="onAdd">+ 添加 TAPD 需求</a-button>
    </a-space>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface TapdItem {
  title: string;
  id?: string | number;
}

const props = defineProps<{
  modelValue?: TapdItem[];
  showTitle?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: TapdItem[]): void;
}>();

const list = computed<TapdItem[]>(() => props.modelValue || []);

const onAdd = () => {
  emit('update:modelValue', [...list.value, { title: '' }]);
};

const onRemove = (idx: number) => {
  const next = [...list.value];
  next.splice(idx, 1);
  emit('update:modelValue', next);
};

const onUpdate = (idx: number, val: string) => {
  const next = [...list.value];
  next[idx] = { ...next[idx], title: val };
  emit('update:modelValue', next);
};
</script>

<style lang="less" scoped>
.tapd-card-section {
  width: 100%;
}

.tapd-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
</style>
