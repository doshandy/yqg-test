<template>
  <div class="studio-result-content" :style="{ height: folded ? '0px' : '100%' }">
    <Tabs
      v-model:active-key="activeKey"
      hide-add
      type="editable-card"
      size="small"
      class="result-tabs"
      @edit="onEdit"
    >
      <template #rightExtra>
        <Tag>{{ resultList.length || 1 }} / 10</Tag>
      </template>
      <TabPane
        v-for="(r, idx) in resultList"
        :key="r.key"
        :closable="!['INIT', 'ANALYZING', 'RUNNING'].includes(r.status || '')"
        :force-render="true"
      >
        <template #tab>
          <span class="tab-label">
            <span
              v-if="r.status"
              :style="{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: ColorMap[r.status] || '#d9d9d9',
                marginRight: '6px',
              }"
            />
            {{ `结果${idx + 1}` }}
          </span>
        </template>
        <StudioResultItem :sql-info="r" />
      </TabPane>
    </Tabs>

    <Button class="fold-btn" size="small" type="default" @click="onFold">
      <UpOutlined v-if="folded" />
      <DownOutlined v-else />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Tabs, TabPane, Tag, Button, message } from 'ant-design-vue';
import { UpOutlined, DownOutlined } from '@ant-design/icons-vue';
import { ColorMap } from '../constant/status-map';
import StudioResultItem from './StudioResultItem.vue';

interface ResultInfo {
  key: string | number;
  status?: string;
  [k: string]: unknown;
}

const props = defineProps<{ resultList: ResultInfo[] }>();
const emit = defineEmits<{
  'fold-change': [folded: boolean];
  'update:resultList': [list: ResultInfo[]];
}>();

const folded = ref(false);
const activeKey = ref<string | number>(
  props.resultList.length ? props.resultList[props.resultList.length - 1].key : '',
);

const onFold = () => {
  folded.value = !folded.value;
  emit('fold-change', folded.value);
};

const expand = () => {
  if (folded.value) {
    folded.value = false;
    emit('fold-change', false);
  }
};

defineExpose({ expand });

const onEdit = (key: string | number, action: 'add' | 'remove') => {
  if (action !== 'remove') return;
  const list = [...props.resultList];
  if (list.length <= 1) {
    message.warn('至少需要保留一个结果标签');
    return;
  }
  const idx = list.findIndex((i) => i.key === key);
  if (idx < 0) return;
  list.splice(idx, 1);
  if (activeKey.value === key) {
    activeKey.value = list[Math.max(0, idx - 1)].key;
  }
  emit('update:resultList', list);
};

watch(
  () => props.resultList,
  (newList, oldList) => {
    if (newList && newList.length > (oldList?.length ?? 0)) {
      activeKey.value = newList[newList.length - 1].key;
    } else if (newList?.length && !newList.some((i) => i.key === activeKey.value)) {
      activeKey.value = newList[newList.length - 1].key;
    }
  },
  { deep: true },
);
</script>

<style lang="less" scoped>
.studio-result-content {
  border-top: 1px solid rgba(5, 5, 5, 0.06);
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  transition: all 0.25s;

  .result-tabs {
    margin-top: 8px;
    height: calc(100% - 8px);
    display: flex;
    flex-direction: column;

    :deep(.ant-tabs-content-holder) {
      flex: 1;
      min-height: 0;
      overflow: hidden;

      .ant-tabs-content {
        height: 100% !important;
      }

      .ant-tabs-tabpane {
        height: 100%;
      }
    }
  }

  .tab-label {
    max-width: 120px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 13px;
  }

  .fold-btn {
    position: absolute;
    top: -14px;
    left: calc(50% - 20px);
    width: 40px;
    height: 14px;
    line-height: 0;
    background: #fff;
    border-radius: 8px 8px 0 0;
    padding: 0 15px;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    z-index: 5;
  }
}
</style>
