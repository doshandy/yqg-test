/**
 * 标签管理 - Tab 页签 store
 * 复刻自 cn-data-lumina/src/store/tag-tabs 的精简版。
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface TagTabItem {
  key: string;
  title: string;
  menuKey: string;
  routePath: string;
  closable: boolean;
}

const HOME_TAB: TagTabItem = {
  key: 'home',
  title: '首页',
  menuKey: 'home',
  routePath: '/home',
  closable: false,
};

export const useTagTabsStore = defineStore('tag-tabs', () => {
  const tabs = ref<TagTabItem[]>([{ ...HOME_TAB }]);
  const activeKey = ref<string>('home');

  const activeTab = computed(() => tabs.value.find((t) => t.key === activeKey.value));
  const currentMenuKey = computed(() => activeTab.value?.menuKey ?? 'home');

  function openTab(input: { menuKey: string; title: string; routePath: string }) {
    const exist = tabs.value.find((t) => t.menuKey === input.menuKey);
    if (exist) {
      activeKey.value = exist.key;
      return;
    }
    const key = `tab_${input.menuKey}_${Date.now()}`;
    tabs.value.push({
      key,
      title: input.title,
      menuKey: input.menuKey,
      routePath: input.routePath,
      closable: true,
    });
    activeKey.value = key;
  }

  function closeTab(key: string) {
    const idx = tabs.value.findIndex((t) => t.key === key);
    if (idx < 0) return;
    const tab = tabs.value[idx];
    if (!tab.closable) return;
    tabs.value.splice(idx, 1);
    if (activeKey.value === key) {
      const next = tabs.value[Math.max(0, idx - 1)];
      activeKey.value = next?.key ?? 'home';
    }
  }

  function closeOtherTabs() {
    tabs.value = tabs.value.filter((t) => !t.closable || t.key === activeKey.value);
  }

  function closeAllTabs() {
    tabs.value = tabs.value.filter((t) => !t.closable);
    activeKey.value = 'home';
  }

  function switchTab(key: string) {
    if (tabs.value.some((t) => t.key === key)) activeKey.value = key;
  }

  function refreshCurrentTab() {
    // Demo：骨架版无需真刷新，直接占位
  }

  function reset() {
    tabs.value = [{ ...HOME_TAB }];
    activeKey.value = 'home';
  }

  return {
    tabs,
    activeKey,
    activeTab,
    currentMenuKey,
    openTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    switchTab,
    refreshCurrentTab,
    reset,
  };
});
