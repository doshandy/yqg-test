<template>
  <div class="tag-management">
    <div class="tag-layout">
      <aside class="tag-sider" :class="{ 'is-collapsed': collapsed }">
        <div class="tag-sider__top">
          <div class="tag-sider__brand" @click="tabsStore.reset()">
            <span class="tag-sider__brand-mark" />
            <span v-if="!collapsed">标签管理</span>
          </div>
          <TagCountry @change="handleAreaChange" />
        </div>
        <div class="tag-sider__menu">
          <a-menu
            v-model:selectedKeys="selectedKeys"
            v-model:openKeys="openKeys"
            mode="inline"
            :inline-collapsed="collapsed"
          >
            <template v-for="menu in menuData" :key="menu.key">
              <a-sub-menu v-if="menu.children?.length" :key="`menu-${menu.key}`">
                <template #icon><component :is="getIconComponent(menu.icon)" v-if="menu.icon" /></template>
                <template #title>{{ menu.label }}</template>
                <a-menu-item v-for="child in menu.children" :key="child.key" @click="handleMenuClick(child)">
                  {{ child.label }}
                </a-menu-item>
              </a-sub-menu>
            </template>
          </a-menu>
        </div>
        <div class="tag-sider__collapse" @click="collapsed = !collapsed">
          <LeftOutlined :rotate="collapsed ? 180 : 0" />
        </div>
      </aside>

      <section class="tag-content">
        <div class="tag-tabs">
          <a-tabs v-model:activeKey="activeKey" type="editable-card" hide-add @edit="handleTabEdit" @change="handleTabChange">
            <a-tab-pane v-for="tab in tabsStore.tabs" :key="tab.key" :tab="tab.title" :closable="tab.closable" />
            <template #rightExtra>
              <a-space :size="4">
                <a-tooltip title="刷新当前标签">
                  <a-button type="text" size="small" @click="handleRefresh"><ReloadOutlined /></a-button>
                </a-tooltip>
                <a-tooltip title="关闭其他标签">
                  <a-button type="text" size="small" @click="handleCloseOther"><CloseCircleOutlined /></a-button>
                </a-tooltip>
                <a-tooltip title="关闭所有标签">
                  <a-button type="text" size="small" @click="handleCloseAll"><CloseSquareOutlined /></a-button>
                </a-tooltip>
              </a-space>
            </template>
          </a-tabs>
        </div>

        <div class="tag-view" :key="contentKey">
          <template v-for="tab in tabsStore.tabs" :key="tab.key">
            <TagHome v-if="tab.menuKey === 'home'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <MetricsPage v-else-if="tab.menuKey === 'metrics'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <RulesPage v-else-if="tab.menuKey === 'rule'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <GroupsPage v-else-if="tab.menuKey === 'group'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <SqlGroupsPage v-else-if="tab.menuKey === 'sql-group'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <TimingPage v-else-if="tab.menuKey === 'timing'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <UserSearchPage v-else-if="tab.menuKey === 'user-search'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <StatPage v-else-if="tab.menuKey === 'stat'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <WhiteListPage v-else-if="tab.menuKey === 'white-list'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <BloodlinePage v-else-if="tab.menuKey === 'bloodline'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <SystemAuthPage v-else-if="tab.menuKey === 'system-auth'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <SystemPage v-else-if="tab.menuKey === 'system'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <ContentAuthPage v-else-if="tab.menuKey === 'content-auth'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <CategoryPage v-else-if="tab.menuKey === 'category'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <UserPicturePage v-else-if="tab.menuKey === 'user-picture'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <TagOpsPage v-else-if="tab.menuKey === 'tag-ops'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
            <TestDataGeneratorPage v-else-if="tab.menuKey === 'test-data-generator'" v-show="tabsStore.activeKey === tab.key" class="tag-view__pane" />
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, ref, watch } from 'vue';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseSquareOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LeftOutlined,
  LineChartOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SearchOutlined,
  SettingOutlined,
  TagOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons-vue';
import TagCountry from '@/components/tag-country/index.vue';
import { storeToRefs } from 'pinia';
import { useTagCountryStore } from '@/store/tag-country';
import { useTagTabsStore } from '@/store/tag-tabs';
import TagApi, { type TagMenuNode } from '@/resources/tag';
import TagHome from './home/index.vue';
import MetricsPage from './pages/MetricsPage.vue';
import RulesPage from './pages/RulesPage.vue';
import GroupsPage from './pages/GroupsPage.vue';
import SqlGroupsPage from './pages/SqlGroupsPage.vue';
import TimingPage from './pages/TimingPage.vue';
import UserSearchPage from './pages/UserSearchPage.vue';
import StatPage from './pages/StatPage.vue';
import WhiteListPage from './pages/WhiteListPage.vue';
import BloodlinePage from './pages/BloodlinePage.vue';
import SystemAuthPage from './pages/SystemAuthPage.vue';
import SystemPage from './pages/SystemPage.vue';
import ContentAuthPage from './pages/ContentAuthPage.vue';
import CategoryPage from './pages/CategoryPage.vue';
import UserPicturePage from './pages/UserPicturePage.vue';
import TagOpsPage from './pages/TagOpsPage.vue';
import TestDataGeneratorPage from './pages/TestDataGeneratorPage.vue';

const tabsStore = useTagTabsStore();
const tagCountryStore = useTagCountryStore();
const { tagCountry } = storeToRefs(tagCountryStore);

const collapsed = ref(false);
const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>(['menu-clientele', 'menu-query-stat', 'menu-platform']);
const menuData = ref<TagMenuNode[]>([]);
const contentKey = ref(0);

const iconMap: Record<string, unknown> = {
  TeamOutlined,
  SearchOutlined,
  SettingOutlined,
  BarChartOutlined,
  TagOutlined,
  UsergroupAddOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  SafetyOutlined,
  LockOutlined,
  AppstoreOutlined,
  UserOutlined,
  ToolOutlined,
  ExperimentOutlined,
};

const activeKey = computed({
  get: () => tabsStore.activeKey,
  set: (value: string | number) => {
    tabsStore.activeKey = String(value);
  },
});

function getIconComponent(name?: string) {
  return name ? (() => h(iconMap[name] as any)) : undefined;
}

async function loadMenu() {
  menuData.value = await TagApi.fetchMenu(tagCountry.value);
}

function handleMenuClick(menu: TagMenuNode) {
  if (!menu.routePath) return;
  tabsStore.openTab({
    menuKey: menu.key,
    title: menu.label,
    routePath: menu.routePath,
  });
  syncMenuState();
}

function syncMenuState() {
  const menuKey = tabsStore.currentMenuKey;
  selectedKeys.value = menuKey === 'home' ? [] : [menuKey];
}

function handleTabEdit(targetKey: unknown, action: 'add' | 'remove') {
  if (action !== 'remove') return;
  if (typeof targetKey === 'string' || typeof targetKey === 'number') {
    tabsStore.closeTab(String(targetKey));
    syncMenuState();
  }
}

function handleTabChange(key: string | number) {
  tabsStore.switchTab(String(key));
  syncMenuState();
}

function handleRefresh() {
  contentKey.value += 1;
}

function handleCloseOther() {
  tabsStore.closeOtherTabs();
  syncMenuState();
}

function handleCloseAll() {
  tabsStore.closeAllTabs();
  syncMenuState();
}

async function handleAreaChange() {
  tabsStore.reset();
  await loadMenu();
  syncMenuState();
}

watch(() => tagCountry.value, loadMenu);

onMounted(async () => {
  await loadMenu();
  syncMenuState();
});
</script>

<style lang="less" scoped>
.tag-management {
  min-height: calc(100vh - 112px);
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.1), transparent 28%),
    linear-gradient(180deg, #f6f8fc 0%, #eef3fb 100%);
}

.tag-layout {
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr);
  min-height: calc(100vh - 144px);
  gap: 16px;
}

.tag-sider {
  position: relative;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  overflow: hidden;

  &.is-collapsed {
    width: 80px;
  }
}

.tag-sider__top {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.tag-sider__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.tag-sider__brand-mark {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  flex-shrink: 0;
}

.tag-sider__menu {
  padding: 12px 10px 56px;
  height: calc(100% - 96px);

  :deep(.ant-menu) {
    border-inline-end: 0;
    background: transparent;
    color: #334155;
  }

  :deep(.ant-menu-submenu-title) {
    margin: 4px 0;
    border-radius: 12px;
    font-weight: 600;
  }

  :deep(.ant-menu-item) {
    margin: 4px 0;
    border-radius: 12px;
  }

  :deep(.ant-menu-item-selected) {
    background: linear-gradient(90deg, rgba(37, 99, 235, 0.14), rgba(14, 165, 233, 0.08));
    color: #2563eb;
    font-weight: 600;
  }

  :deep(.ant-menu-sub.ant-menu-inline) {
    background: transparent;
  }
}

.tag-sider__collapse {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: 1px solid rgba(37, 99, 235, 0.14);
}

.tag-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.tag-tabs {
  padding: 12px 16px 0;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border-bottom: 1px solid #f0f0f0;

  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }

  :deep(.ant-tabs-tab) {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
}

.tag-view {
  flex: 1;
  min-height: 0;
  background: #f8fbff;
}

.tag-view__pane {
  height: 100%;
}

@media (max-width: 1100px) {
  .tag-layout {
    grid-template-columns: 1fr;
  }

  .tag-sider {
    min-height: auto;
  }
}
</style>
