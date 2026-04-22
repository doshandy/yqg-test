/**
 * 标签管理路由：一个入口，子页面通过 Tab store 维护。
 */

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/tag',
    name: 'TagManagement',
    component: () => import('@/pages/tag/index.vue'),
    meta: { title: '标签管理', icon: 'TagsOutlined' },
  },
];

export default routes;
