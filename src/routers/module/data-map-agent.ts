/**
 * 数据地图 Agent（复刻自 cn-data-pilot 的 /data-map 对话页），挂在 /data-map-agent 下，
 * 与现有资产列表页 `/data-map` 并存。
 */

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/data-map-agent',
    name: 'DataMapAgent',
    component: () => import('@/pages/data-map-agent/index.vue'),
    meta: { title: '数据地图 Agent', icon: 'AppstoreOutlined', subtitle: '对话式数据探索' },
  },
];

export default routes;
