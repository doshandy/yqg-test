import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/foundation',
    name: 'Foundation',
    component: () => import('@/pages/foundation/index.vue'),
    meta: { title: '基础能力', icon: 'AppstoreOutlined', subtitle: '通用方法 / 组件 / Store / 资源层' },
  },
];

export default routes;
