import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/alert',
    name: 'AlertCenter',
    component: () => import('@/pages/alert/index.vue'),
    meta: { title: '监控运维', icon: 'MonitorOutlined', subtitle: '告警中心与通知策略单机版' },
  },
];

export default routes;
