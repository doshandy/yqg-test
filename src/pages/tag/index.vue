<!--
  标签管理模块（UI 骨架）

  布局：左侧菜单 + 右侧可编辑 Tabs（带刷新/关闭其他/关闭所有按钮）
-->
<template>
  <div class="tag-management">
    <div class="tag-layout">
      <!-- 左侧菜单 -->
      <div class="tag-sider" :class="{ 'is-collapsed': collapsed }">
        <div class="sider-content">
          <a-menu
            v-model:selectedKeys="selectedKeys"
            v-model:openKeys="openKeys"
            :inline-collapsed="collapsed"
            mode="inline"
            class="tag-menu"
          >
            <template v-for="menu in menuData">
              <a-sub-menu v-if="menu.children && menu.children.length" :key="`menu-${menu.key}`">
                <template #icon>
                  <component :is="getIconComponent(menu.icon)" v-if="menu.icon" />
                </template>
                <template #title>{{ menu.label }}</template>
                <a-menu-item
                  v-for="sub in menu.children"
                  :key="sub.key"
                  @click="handleMenuClick(sub)"
                >
                  {{ sub.label }}
                </a-menu-item>
              </a-sub-menu>
              <a-menu-item v-else :key="menu.key" @click="handleMenuClick(menu)">
                <template #icon>
                  <component :is="getIconComponent(menu.icon)" v-if="menu.icon" />
                </template>
                {{ menu.label }}
              </a-menu-item>
            </template>
          </a-menu>
        </div>

        <div
          class="tag-sider-collapsed-button"
          :class="{ 'is-collapsed': collapsed }"
          @click="collapsed = !collapsed"
        >
          <LeftOutlined />
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="tag-content">
        <div class="tag-tabs-container">
          <a-tabs
            v-model:activeKey="activeKey"
            type="editable-card"
            hide-add
            @edit="handleTabEdit"
            @change="handleTabChange"
          >
            <a-tab-pane
              v-for="tab in tabsStore.tabs"
              :key="tab.key"
              :tab="tab.title"
              :closable="tab.closable"
            />
            <template #rightExtra>
              <a-space :size="4" class="tab-extra-actions">
                <a-tooltip title="刷新当前标签">
                  <a-button type="text" size="small" @click="handleRefresh">
                    <template #icon><ReloadOutlined /></template>
                  </a-button>
                </a-tooltip>
                <a-tooltip title="关闭其他标签">
                  <a-button
                    type="text"
                    size="small"
                    :disabled="closableCount <= 1"
                    @click="handleCloseOther"
                  >
                    <template #icon><CloseCircleOutlined /></template>
                  </a-button>
                </a-tooltip>
                <a-tooltip title="关闭所有标签">
                  <a-button
                    type="text"
                    size="small"
                    :disabled="closableCount === 0"
                    @click="handleCloseAll"
                  >
                    <template #icon><CloseSquareOutlined /></template>
                  </a-button>
                </a-tooltip>
              </a-space>
            </template>
          </a-tabs>
        </div>

        <div class="tag-content-container" :key="contentKey">
          <template v-for="tab in tabsStore.tabs" :key="tab.key">
            <TagHome
              v-if="tab.menuKey === 'home'"
              v-show="tabsStore.activeKey === tab.key"
              class="tag-tab-pane"
            />
            <MetricsPage
              v-else-if="tab.menuKey === 'metrics'"
              v-show="tabsStore.activeKey === tab.key"
              class="tag-tab-pane"
            />
            <RulesPage
              v-else-if="tab.menuKey === 'rule'"
              v-show="tabsStore.activeKey === tab.key"
              class="tag-tab-pane"
            />
            <GroupsPage
              v-else-if="tab.menuKey === 'group' || tab.menuKey === 'sql-group'"
              v-show="tabsStore.activeKey === tab.key"
              class="tag-tab-pane"
            />
            <QueryStatPage
              v-else-if="tab.menuKey === 'stat' || tab.menuKey === 'user-search'"
              v-show="tabsStore.activeKey === tab.key"
              class="tag-tab-pane"
            />
            <SystemAuthPage
              v-else-if="tab.menuKey === 'system-auth'"
              v-show="tabsStore.activeKey === tab.key"
              class="tag-tab-pane"
            />
            <CategoryPage
              v-else-if="tab.menuKey === 'category'"
              v-show="tabsStore.activeKey === tab.key"
              class="tag-tab-pane"
            />
            <PlaceholderPage
              v-else
              v-show="tabsStore.activeKey === tab.key"
              class="tag-tab-pane"
              :title="tab.title"
              :icon="placeholderIcon(tab.menuKey)"
              :sub-title="placeholderSub(tab.menuKey)"
              :features="placeholderFeatures(tab.menuKey)"
              :primary-text="'进入模块'"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseSquareOutlined,
  DatabaseOutlined,
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
  UserOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons-vue';
import { useTagTabsStore } from '@/store/tag-tabs';
import TagApi, { type TagMenuNode } from '@/resources/tag';
import TagHome from './home/index.vue';
import MetricsPage from './pages/MetricsPage.vue';
import RulesPage from './pages/RulesPage.vue';
import GroupsPage from './pages/GroupsPage.vue';
import QueryStatPage from './pages/QueryStatPage.vue';
import SystemAuthPage from './pages/SystemAuthPage.vue';
import CategoryPage from './pages/CategoryPage.vue';
import PlaceholderPage from './pages/PlaceholderPage.vue';

const tabsStore = useTagTabsStore();

const collapsed = ref(false);
const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>(['menu-clientele']);
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
};

function getIconComponent(name?: string) {
  return name ? iconMap[name] : undefined;
}

const activeKey = computed({
  get: () => tabsStore.activeKey,
  set: (v: string | number) => {
    tabsStore.activeKey = String(v);
  },
});

const closableCount = computed(
  () => tabsStore.tabs.filter((t) => t.closable).length,
);

function handleMenuClick(menu: TagMenuNode) {
  if (!menu.routePath) return;
  tabsStore.openTab({ menuKey: menu.key, title: menu.label, routePath: menu.routePath });
  selectedKeys.value = [menu.key];
}

function handleTabEdit(targetKey: unknown, action: 'add' | 'remove') {
  if (action === 'remove' && (typeof targetKey === 'string' || typeof targetKey === 'number')) {
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
  message.success('已刷新当前标签');
}

function handleCloseOther() {
  tabsStore.closeOtherTabs();
  syncMenuState();
}

function handleCloseAll() {
  tabsStore.closeAllTabs();
  syncMenuState();
}

function syncMenuState() {
  const menuKey = tabsStore.currentMenuKey;
  if (menuKey === 'home') {
    selectedKeys.value = [];
    return;
  }
  selectedKeys.value = [menuKey];
  for (const m of menuData.value) {
    if (m.children?.some((c) => c.key === menuKey)) {
      const pk = `menu-${m.key}`;
      if (!openKeys.value.includes(pk)) openKeys.value = [...openKeys.value, pk];
      break;
    }
  }
}

function placeholderIcon(menuKey: string) {
  const map: Record<string, unknown> = {
    timing: ClockCircleOutlined,
    'sql-group': DatabaseOutlined,
    'user-picture': UserOutlined,
    'white-list': FileTextOutlined,
    bloodline: ApartmentOutlined,
    system: SettingOutlined,
    'content-auth': LockOutlined,
  };
  return map[menuKey] || AppstoreOutlined;
}

function placeholderSub(menuKey: string): string {
  const map: Record<string, string> = {
    timing: '定时任务调度管理模块，支持 cron 表达式与依赖配置。',
    'sql-group': '通过 SQL 直接生成人群，适合复杂条件组合场景。',
    'user-picture': '多维度用户画像分析（仅 CN、EC 地区开放）。',
    'white-list': 'SQL 库表白名单管理，控制可访问表的范围。',
    bloodline: '追溯指标、标签、人群之间的血缘关系。',
    system: '系统参数、模型、队列等全局配置。',
    'content-auth': '细粒度的内容级权限，控制标签、指标的可见性。',
  };
  return map[menuKey] || '该模块在 Demo 中以 UI 骨架形式展示。';
}

function placeholderFeatures(menuKey: string): string[] {
  return {
    timing: ['Cron 表达式编辑', '任务依赖配置', '执行记录审计'],
    'sql-group': ['SQL 圈选', '定时重算', '变更审计'],
    'user-picture': ['基础信息画像', '行为画像', '资产画像'],
    'white-list': ['按账号授权', '按角色授权', '操作审计'],
    bloodline: ['指标血缘', '标签血缘', '人群血缘'],
    system: ['全局配置', '模型管理', '队列调度'],
    'content-auth': ['按标签授权', '按指标授权', '按人群授权'],
  }[menuKey] || [
    'UI 骨架展示',
    'Mock 数据驱动',
    '可作为真实模块接入入口',
  ];
}

onMounted(async () => {
  try {
    menuData.value = await TagApi.fetchMenu();
  } catch (e) {
    message.error('加载菜单失败');
  }
});
</script>

<style lang="less" scoped>
.tag-management {
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.tag-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.tag-sider {
  position: relative;
  width: 220px;
  min-width: 220px;
  height: 100%;
  background: #fff;
  border-right: 1px solid rgba(5, 5, 5, 0.06);
  flex-shrink: 0;
  transition: width 0.3s ease;
  overflow: visible;

  &.is-collapsed {
    width: 80px;
    min-width: 80px;
  }

  .sider-content {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .tag-sider-collapsed-button {
    position: absolute;
    inset-block-start: 18px;
    z-index: 101;
    width: 24px;
    height: 24px;
    border-radius: 40px;
    inset-inline-end: -13px;
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow:
      0 2px 8px -2px rgba(0, 0, 0, 0.05),
      0 1px 4px -1px rgba(25, 15, 15, 0.07),
      0 0 1px 0 rgba(0, 0, 0, 0.08);
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    background-color: #fff;

    &:hover {
      color: rgba(0, 0, 0, 0.85);
    }

    &.is-collapsed {
      transform: rotateY(180deg);
    }
  }
}

.tag-menu {
  border-right: none;
  height: 100%;
}

.tag-content {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;

  .tag-tabs-container {
    flex-shrink: 0;
    padding: 8px 16px 0;
    background: #fff;

    :deep(.ant-tabs-nav) {
      margin-bottom: 0;
    }

    :deep(.ant-tabs-tab) {
      padding: 8px 16px;
    }

    :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
      color: #1677ff;
    }

    .tab-extra-actions {
      margin-right: 8px;
      :deep(.ant-btn) {
        color: rgba(0, 0, 0, 0.45);
        &:hover:not(:disabled) {
          color: #1677ff;
          background: rgba(24, 144, 255, 0.08);
        }
      }
    }
  }

  .tag-content-container {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #fafafa;
  }

  .tag-tab-pane {
    position: absolute;
    inset: 0;
    overflow: auto;
    background: #fff;
  }
}
</style>
