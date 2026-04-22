<!--
  @file AppLayout.vue
  @description 工作台布局：顶部栏 + 可折叠侧边栏 + 内容区。
  替代原项目中 `@yqg/max` 的 ProLayout；同时承载全局通知、用户信息展示等。
-->

<template>
  <a-layout class="app-layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      breakpoint="lg"
      width="220"
      :trigger="null"
      class="app-sider"
    >
      <div class="app-sider__logo" @click="goHome">
        <span class="app-sider__logo-dot" />
        <transition name="fade">
          <span v-if="!collapsed" class="app-sider__logo-text">DataPlatform</span>
        </transition>
      </div>

      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        theme="dark"
        :items="menuItems"
        @click="handleMenuClick"
      />
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="app-header">
        <div class="app-header__left">
          <MenuFoldOutlined
            v-if="!collapsed"
            class="app-header__trigger"
            @click="collapsed = true"
          />
          <MenuUnfoldOutlined
            v-else
            class="app-header__trigger"
            @click="collapsed = false"
          />
          <span class="app-header__title">{{ pageTitle }}</span>
        </div>

        <div class="app-header__right">
          <a-space :size="16">
            <a-select
              v-model:value="projectStore.country"
              :options="countryOptions"
              style="width: 120px"
              size="small"
            />
            <a-select
              v-model:value="projectStore.project"
              :options="projectOptions"
              style="width: 140px"
              size="small"
            />
            <router-link to="/pilot-home" class="app-header__link">Pilot 首页</router-link>
            <router-link to="/lumina-home" class="app-header__link">Lumina 首页</router-link>
            <a-dropdown>
              <a-avatar size="small" style="background: #1677ff; cursor: pointer">
                {{ userInitial }}
              </a-avatar>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="profile">{{ userStore.user?.name ?? 'demo_user' }}</a-menu-item>
                  <a-menu-item key="mail" disabled>{{ userStore.user?.mail ?? '' }}</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-layout-header>

      <a-layout-content :class="['app-content', { 'app-content--fullbleed': isFullBleed }]">
        <GlobalNotice />
        <router-view v-slot="{ Component, route }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { MenuProps } from 'ant-design-vue';
import {
  AppstoreOutlined,
  CodeOutlined,
  ConsoleSqlOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MonitorOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  TableOutlined,
  TagsOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue';
import { menuRoutes } from '@/routers';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/project';
import CommonApi, { type OptionVO } from '@/resources/common';
import GlobalNotice from '@/components/GlobalNotice.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();

const collapsed = ref(false);
const selectedKeys = ref<string[]>([route.path]);

const countryOptions = ref<OptionVO[]>([]);
const projectOptions = ref<OptionVO[]>([]);

const iconMap: Record<string, unknown> = {
  AppstoreOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  CodeOutlined,
  ConsoleSqlOutlined,
  ExperimentOutlined,
  MonitorOutlined,
  SafetyCertificateOutlined,
  UnorderedListOutlined,
  ScheduleOutlined,
  TableOutlined,
  TagsOutlined,
};

const fullBleedRoutes = new Set([
  '/data-develop/task',
  '/data-develop/table',
  '/explore/sql',
  '/studio',
  '/ops',
  '/tag',
  '/data-map-agent',
]);
const isFullBleed = computed(() => fullBleedRoutes.has(route.path));

const menuItems = computed<MenuProps['items']>(() => {
  const items: MenuProps['items'] = [];
  const dataDevelopChildren: MenuProps['items'] = [];

  menuRoutes.forEach((r) => {
    const path = r.path!;
    const label = (r.meta?.title as string) ?? String(r.name ?? r.path);
    const iconName = r.meta?.icon as string | undefined;
    const icon = iconName && iconMap[iconName]
      ? () => h(iconMap[iconName] as any)
      : undefined;
    if (
      path.startsWith('/data-develop/')
      || path === '/studio'
      || path === '/ops'
      || path === '/explore/sql'
    ) {
      dataDevelopChildren.push({ key: path, label, icon });
    } else {
      items.push({ key: path, label, icon });
    }
  });

  if (dataDevelopChildren.length) {
    items.splice(3, 0, {
      key: 'data-develop-group',
      label: '数据开发',
      icon: () => h(iconMap.CodeOutlined as any),
      children: dataDevelopChildren,
    });
  }
  return items;
});

const pageTitle = computed(() => (route.meta?.title as string) ?? '工作台');

const userInitial = computed(() => {
  const name = userStore.user?.name ?? 'D';
  return name.slice(0, 1).toUpperCase();
});

function handleMenuClick({ key }: { key: string }) {
  if (typeof key === 'string') {
    router.push(key);
  }
}

function goHome() {
  router.push('/pilot-home');
}

watch(
  () => route.path,
  (next) => {
    selectedKeys.value = [next];
  },
);

onMounted(async () => {
  await userStore.fetchUser();
  const [c, p] = await Promise.all([
    CommonApi.fetchCountryOptions(),
    CommonApi.fetchProjectOptions(),
  ]);
  countryOptions.value = c.data?.body ?? [];
  projectOptions.value = p.data?.body ?? [];
});
</script>

<style lang="less" scoped>
.app-layout {
  min-height: 100vh;
}

.app-sider {
  background: linear-gradient(180deg, #0b1a3a 0%, #111827 100%);

  &__logo {
    height: 56px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px;
    color: #fff;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__logo-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
    flex-shrink: 0;
  }

  &__logo-text {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  :deep(.ant-menu-dark) {
    background: transparent;
  }
}

.app-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__trigger {
    font-size: 18px;
    cursor: pointer;
    padding: 8px;
    transition: color 0.2s;

    &:hover {
      color: #1677ff;
    }
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  &__right {
    display: flex;
    align-items: center;
  }

  &__link {
    color: #6b7280;
    font-size: 13px;
    transition: color 0.2s;

    &:hover {
      color: #1677ff;
    }
  }
}

.app-content {
  padding: 16px;
  background: #f5f7fb;
  overflow: auto;

  &--fullbleed {
    padding: 0;
    background: #fff;
    overflow: hidden;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
