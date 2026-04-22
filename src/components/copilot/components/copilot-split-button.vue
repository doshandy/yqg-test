<template>
  <div class="copilot-split-btn">
    <span class="copilot-split-main" @click="onMainClick">
      <ThunderboltOutlined class="copilot-icon" />
      <span>Copilot</span>
    </span>
    <span class="copilot-split-divider" />
    <Dropdown
      trigger="click"
      overlay-class-name="copilot-dropdown-overlay"
      :get-popup-container="getPopupContainer"
    >
      <span class="copilot-split-arrow">
        <DownOutlined />
      </span>
      <template #overlay>
        <Menu
          :items="menuItems"
          @click="({ key }) => onMenuClick(key as string)"
        />
      </template>
    </Dropdown>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { ThunderboltOutlined, DownOutlined } from '@ant-design/icons-vue';
import { Dropdown, Menu } from 'ant-design-vue';
import CopilotApi from '@/components/copilot/resources/copilot';

export interface CopilotMenuItem {
  key: string;
  label: string;
}

const emit = defineEmits<{
  (e: 'mainClick'): void;
  (e: 'menuClick', key: string): void;
}>();

const quickIntents = ref<{ value: string; label: string }[]>([]);

onMounted(async () => {
  try {
    const res = await CopilotApi.getQuickIntents({hideLoading: true});
    const list = res?.data?.body ?? [];
    quickIntents.value = Array.isArray(list)
      ? list.map((item) => ({ value: item.value, label: item.label })).filter((o) => o.value)
      : [];
  } catch (e) {
    console.warn('getQuickIntents failed', e);
  }
});

/** Menu 需要 key 字段，用 value 作为 key 才能拿到正确的 key */
const menuItems = computed(() =>
  quickIntents.value.map((i) => ({ key: i.value, label: i.label }))
);

const onMainClick = () => {
  emit('mainClick');
};

const onMenuClick = (key: string) => {
  emit('menuClick', key);
};

const getPopupContainer = (n: HTMLElement) => n.parentElement ?? document.body;
</script>

<style lang="less" scoped>
.copilot-split-btn {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 4px 0 10px;
  background: rgba(138, 99, 210, 0.12);
  border: 1px solid rgba(138, 99, 210, 0.35);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;

  .copilot-split-main {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 6px 0 2px;
    color: #6b4c9a;
    font-size: 13px;
    font-weight: 500;

    .copilot-icon {
      font-size: 14px;
    }
  }

  .copilot-split-main:hover {
    color: #552d7a;
  }

  .copilot-split-divider {
    width: 1px;
    height: 16px;
    background: rgba(138, 99, 210, 0.35);
    flex-shrink: 0;
  }

  .copilot-split-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 26px;
    color: #6b4c9a;
    font-size: 10px;
    border-radius: 0 999px 999px 0;
  }
}
</style>

<style lang="less">
/* 下拉 overlay 样式需全局，避免从窄变宽的过渡 */
.copilot-dropdown-overlay,
.copilot-dropdown-overlay * {
  transition: none !important;
  animation: none !important;
}

:has(> .copilot-dropdown-overlay) {
  transition: none !important;
  animation: none !important;
}

.copilot-dropdown-overlay {
  width: 120px !important;
  min-width: 120px !important;

  .ant-dropdown-menu {
    width: 120px !important;
    min-width: 120px !important;
  }
}
</style>
