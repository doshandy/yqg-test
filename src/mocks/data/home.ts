/**
 * 首页统计卡片 mock 数据
 */

export const homeStats = {
  metricTotal: 128,
  tableTotal: 2450,
  taskRunning: 18,
  alertPending: 3,
};

export const homeRecentActivity = [
  { id: 1, action: '发布指标', target: '日活用户数', user: 'alice', time: '2026-04-22 10:20' },
  { id: 2, action: '新建表', target: 'ads_user_profile_di', user: 'bob', time: '2026-04-22 09:50' },
  { id: 3, action: '下线任务', target: 'task_risk_rule_004', user: 'carol', time: '2026-04-21 18:30' },
  { id: 4, action: '审批通过', target: '数据权限申请 #1029', user: 'dave', time: '2026-04-21 16:10' },
];
