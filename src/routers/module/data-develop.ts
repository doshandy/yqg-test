/**
 * 数据开发模块路由（mock 版）
 */

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/data-develop/task',
    name: 'DataDevelopTask',
    component: () => import('@/pages/data-develop/task/index.vue'),
    meta: { title: '任务开发', icon: 'CodeOutlined' },
  },
  {
    path: '/data-develop/table',
    name: 'DataDevelopTable',
    component: () => import('@/pages/data-develop/table/index.vue'),
    meta: { title: '表管理', icon: 'TableOutlined' },
  },
  {
    path: '/studio',
    name: 'Studio',
    component: () => import('@/pages/studio/index.vue'),
    meta: { title: 'SQL Studio', icon: 'ExperimentOutlined' },
  },
  {
    path: '/ops',
    name: 'Ops',
    component: () => import('@/pages/ops/index.vue'),
    meta: { title: '任务运维', icon: 'MonitorOutlined' },
  },
  {
    path: '/explore/sql',
    name: 'ExploreSql',
    component: () => import('@/pages/explore/sql/index.vue'),
    meta: { title: 'SQL 查询', icon: 'ConsoleSqlOutlined' },
  },
];

export default routes;
