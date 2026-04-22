/**
 * 首页数据接口。
 */

import { httpGet } from '@/utils/request';

export interface HomeStats {
  metricTotal: number;
  tableTotal: number;
  taskRunning: number;
  alertPending: number;
}

export interface HomeActivityItem {
  id: number;
  action: string;
  target: string;
  user: string;
  time: string;
}

const HomeApi = {
  fetchStats: () => httpGet<HomeStats>('/api/home/stats'),
  fetchRecentActivity: () => httpGet<HomeActivityItem[]>('/api/home/recent-activity'),
};

export default HomeApi;
