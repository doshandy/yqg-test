/**
 * 首页类路由（全屏，无 Layout）：
 * - /pilot-home    DataPilot 风格首页
 * - /lumina-home   DataLumina 风格首页
 * - /not-found     404
 */

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/pilot-home',
    name: 'PilotHome',
    component: () => import('@/pages/home/PilotHome.vue'),
    meta: { title: 'DataPilot 首页', hiddenLayout: true },
  },
  {
    path: '/lumina-home',
    name: 'LuminaHome',
    component: () => import('@/pages/home/LuminaHome.vue'),
    meta: { title: 'DataLumina 首页', hiddenLayout: true },
  },
  {
    path: '/not-found',
    name: 'NotFound',
    component: () => import('@/pages/home/NotFound.vue'),
    meta: { title: '页面未找到', hiddenLayout: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found',
  },
];

export default routes;
