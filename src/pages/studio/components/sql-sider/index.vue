<!-- @Author: weisun -->
<!-- @Date: 2024/4/23 14:12 -->
<!-- @Last Modified by: weisun -->
<!-- @Last Modified time: 2024/4/23 14:12 -->

<template>
  <div
    :class="['sql-sider', { resizing: isResizing }]"
    :style="siderStyle"
  >
    <SqlQuery
      :style="{ display: !folded ? 'block' : 'none' }"
      :get-cur-pane-list="getCurPaneList"
      :task-name="taskName"
      :task-id="taskId"
    />
    <div v-if="!folded" class="sider-resize-handle" @mousedown="onResizeStart"/>
    <Button
      class="fold-btn"
      size="small"
      type="default"
      @click="onFold"
    >
      <RightOutlined v-if="folded" />
      <LeftOutlined v-else />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { Button, message } from 'ant-design-vue';

import {
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons-vue';
import { useRoute } from 'vue-router';
import SqlQuery from './components/sql-query.vue';
import TaskFoldedStorage from '@/storage/task-folded';
import { useSqlSiderState } from '../../common/sql-sider-state';

const props = defineProps({
  getCurPaneList: {
    type: Function,
    default: () => null,
  },
  copilotOpen: {
    type: Boolean,
    default: false,
  },
});
const DEFAULT_WIDTH = 270;
const MIN_WIDTH = 260;
const MAX_WIDTH = 600;

const folded = ref(TaskFoldedStorage.get() || false);
const sqlStore = useSqlSiderState();
const { siderFolded } = sqlStore;

const siderWidth = ref(DEFAULT_WIDTH);
const isResizing = ref(false);
let startX = 0;
let startWidth = 0;

const siderStyle = computed(() => {
  if (folded.value) return { width: '0px', minWidth: '0px' };

  return { width: `${siderWidth.value  }px`, minWidth: `${MIN_WIDTH  }px` };
});

let resizeRaf = 0;

function onResizeStart(e: MouseEvent) {
  e.preventDefault();
  isResizing.value = true;
  startX = e.clientX;
  startWidth = siderWidth.value;
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
}

function onResizeMove(e: MouseEvent) {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0;
    const delta = e.clientX - startX;
    siderWidth.value = Math.max(MIN_WIDTH, Math.min(startWidth + delta, MAX_WIDTH));
  });
}

function onResizeEnd() {
  if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = 0; }

  isResizing.value = false;
  document.body.style.userSelect = '';
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
}

onBeforeUnmount(() => {
  if (resizeRaf) { cancelAnimationFrame(resizeRaf); resizeRaf = 0; }

  document.body.style.userSelect = '';
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
});

watch(siderFolded, (val) => {
  folded.value = val;
});

watch(
  () => props.copilotOpen,
  (open) => {
    if (open) {
      if (!folded.value) {
        message.info('已自动收起列表以优化视野');
      }

      folded.value = true;
      TaskFoldedStorage.set(true);
    }
  },
);

const route = useRoute();
const taskId = route.query.taskId as string;
const taskName = route.query.taskName as string;

const onFold = () => {
  folded.value = !folded.value;
  TaskFoldedStorage.set(folded.value);
  sqlStore.setSiderFolded(folded.value);
};

</script>

<style lang="less" scoped>
.sql-sider {
  position: relative;
  background-color: #fff;
  border-right: 1px solid #f0f0f0;
  transition: width 0.3s, min-width 0.3s;
  flex-shrink: 0;

  &.resizing {
    transition: none;
    user-select: none;
  }

  .fold-btn {
    position: absolute;
    top: calc(50% - 20px);
    right: -14px;
    width: 14px;
    height: 40px;
    line-height: 0px;
    border-radius: 0 8px 8px 0;
    padding: 15px 0;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    z-index: 999;
    border-left: none;
  }

  .fold-btn:hover {
    border-color: #d9d9d9;
  }

  &.hide-handle {
    display: none;

    .fold-btn {
      right: -7px;
    }
  }
}

.sider-resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 2px;
    width: 2px;
    height: 100%;
    border-radius: 1px;
    transition: background-color 0.2s;
  }

  &:hover::after {
    background-color: var(--primary-color, #6366f1);
  }
}
</style>
