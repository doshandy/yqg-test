/**
 * 路由聚合入口：仿照原项目 src/routers/module/*.ts 的组织方式。
 *
 * 设计：
 * - 「首页类」路由（PilotHome / LuminaHome / NotFound）不套 Layout，全屏展示。
 * - 「工作台类」路由统一套一层 AppLayout（侧边栏 + 顶部栏）。
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';

import home from './module/home';
import dashboard from './module/dashboard';
import metric from './module/metric';
import datamap from './module/datamap';
import dataMapAgent from './module/data-map-agent';
import dataDevelop from './module/data-develop';
import tag from './module/tag';

const layoutChildren: RouteRecordRaw[] = [
  ...dashboard,
  ...metric,
  ...datamap,
  ...dataMapAgent,
  ...dataDevelop,
  ...tag,
];

const layoutRoute: RouteRecordRaw = {
  path: '/',
  component: AppLayout,
  redirect: '/pilot-home',
  children: layoutChildren,
};

const routes: RouteRecordRaw[] = [
  layoutRoute,
  ...home,
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - DataPlatform Demo`;
  }
});

export default router;

export const menuRoutes = layoutChildren.filter((r) => !r.meta?.hiddenInMenu);
