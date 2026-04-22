/**
 * 公共 Mock 数据：国家/项目/用户等
 * 单机版：不区分真实租户，所有枚举都返回模拟数据。
 */

export const countryOptions = [
  { label: '中国', value: 'CN' },
  { label: '印度尼西亚', value: 'ID' },
  { label: '墨西哥', value: 'MX' },
  { label: '西班牙', value: 'ES' },
];

export const projectOptions = [
  { label: '数据平台', value: 'data-platform' },
  { label: '风控中心', value: 'risk-control' },
  { label: '营销增长', value: 'growth' },
  { label: '经营分析', value: 'analysis' },
];

export const mockUser = {
  id: 'mock-user-001',
  name: 'demo_user',
  mail: 'demo@example.com',
  roles: ['admin'],
  avatar: '',
};

export const globalNotice = {
  enabled: true,
  level: 'info',
  title: '欢迎使用 DataPlatform 单机体验版',
  content:
    '本项目所有接口请求均由 MSW 拦截并返回 mock 数据，完全单机运行。',
};
