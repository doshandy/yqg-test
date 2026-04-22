/**
 * 指标中心路由
 */

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/metric/catalog',
    name: 'MetricCatalog',
    component: () => import('@/pages/metric/catalog/index.vue'),
    meta: { title: '指标目录', icon: 'UnorderedListOutlined' },
  },
  {
    path: '/metric/develop',
    name: 'MetricDevelop',
    component: () => import('@/pages/common/ComingSoon.vue'),
    meta: { title: '指标开发', icon: 'CodeOutlined', subtitle: '开发态：接入指标工厂与 SQL 工作台' },
  },
];

export default routes;
