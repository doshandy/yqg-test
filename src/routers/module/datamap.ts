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
    path: '/dqc',
    name: 'Dqc',
    component: () => import('@/pages/common/ComingSoon.vue'),
    meta: { title: '数据质量', icon: 'SafetyCertificateOutlined', subtitle: '规则管理 + 调度执行' },
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/pages/common/ComingSoon.vue'),
    meta: { title: '任务调度', icon: 'ScheduleOutlined', subtitle: '依赖 DAG 编排与实例运维' },
  },
];

export default routes;
