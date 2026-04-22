/**
 * 控制台/概览路由（带 Layout 的工作区）
 */

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/workbench',
    name: 'Workbench',
    component: () => import('@/pages/workbench/index.vue'),
    meta: { title: '工作台', icon: 'DashboardOutlined' },
  },
];

export default routes;
