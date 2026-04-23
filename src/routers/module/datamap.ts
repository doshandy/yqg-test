/**
 * 数据地图路由
 */

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/data-map',
    name: 'DataMap',
    component: () => import('@/pages/data-map/index.vue'),
    meta: { title: '数据地图', icon: 'DatabaseOutlined' },
  },
  {
    path: '/data-map/:id',
    name: 'DataMapDetail',
    component: () => import('@/pages/data-map/detail.vue'),
    meta: { title: '资产详情', hiddenInMenu: true },
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/pages/schedule/index.vue'),
    meta: { title: '调度管理', icon: 'ScheduleOutlined', subtitle: '任务运维、实例运维与依赖诊断' },
  },
];

export default routes;
