import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/dqc',
    name: 'Dqc',
    component: () => import('@/pages/dqc/index.vue'),
    meta: { title: '数据质量', icon: 'SafetyCertificateOutlined', subtitle: 'DQC 单机版工作台' },
  },
];

export default routes;
