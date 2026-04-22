/**
 * 标签管理模块 mock 数据（UI 骨架）
 */

export interface TagMenuNode {
  key: string;
  label: string;
  icon?: string;
  routePath: string;
  children?: TagMenuNode[];
}

export const tagAreaOptions = [
  { label: '国内', value: 'CN' },
  { label: '印尼', value: 'ID' },
  { label: '墨西哥', value: 'MEX' },
  { label: '菲律宾', value: 'PHI' },
];

export function buildTagMenu(): TagMenuNode[] {
  return [
    {
      key: 'clientele',
      label: '客群管理',
      icon: 'TeamOutlined',
      routePath: '',
      children: [
        { key: 'metrics', label: '指标管理', icon: 'BarChartOutlined', routePath: '/clientele/metrics' },
        { key: 'rule', label: '自定义标签', icon: 'TagOutlined', routePath: '/clientele/rule' },
        { key: 'group', label: '人群管理', icon: 'UsergroupAddOutlined', routePath: '/clientele/group' },
        { key: 'sql-group', label: 'SQL 人群', icon: 'DatabaseOutlined', routePath: '/clientele/sql-group' },
        { key: 'timing', label: '定时管理', icon: 'ClockCircleOutlined', routePath: '/clientele/timing' },
      ],
    },
    {
      key: 'query-stat',
      label: '查询统计',
      icon: 'SearchOutlined',
      routePath: '',
      children: [
        { key: 'user-search', label: '用户查询', icon: 'SearchOutlined', routePath: '/clientele/user-search' },
        { key: 'stat', label: '使用统计', icon: 'LineChartOutlined', routePath: '/clientele/stat' },
        { key: 'white-list', label: 'SQL 库表白名单', icon: 'FileTextOutlined', routePath: '/clientele/white-list' },
        { key: 'bloodline', label: '血缘查询', icon: 'ApartmentOutlined', routePath: '/clientele/bloodline' },
      ],
    },
    {
      key: 'platform',
      label: '平台管理',
      icon: 'SettingOutlined',
      routePath: '',
      children: [
        { key: 'system-auth', label: '系统权限', icon: 'SafetyOutlined', routePath: '/clientele/system-auth' },
        { key: 'system', label: '系统管理', icon: 'SettingOutlined', routePath: '/clientele/system' },
        { key: 'content-auth', label: '内容权限', icon: 'LockOutlined', routePath: '/clientele/content-auth' },
        { key: 'category', label: '类别管理', icon: 'AppstoreOutlined', routePath: '/clientele/category' },
        { key: 'user-picture', label: '人群画像', icon: 'UserOutlined', routePath: '/clientele/user-picture' },
      ],
    },
  ];
}

export interface MetricItem {
  id: string;
  code: string;
  name: string;
  category: string;
  dataType: string;
  owner: string;
  status: 'ONLINE' | 'OFFLINE' | 'DRAFT';
  updatedAt: string;
}

export const metricsMockList: MetricItem[] = Array.from({ length: 38 }, (_, i) => ({
  id: `m-${i + 1}`,
  code: `metric_${String(i + 1).padStart(3, '0')}`,
  name: ['用户首逾金额', '月度活跃人数', '注册转化率', '当日放款笔数', '过期标签占比', '首借客户数'][i % 6] + (i > 5 ? `-v${Math.floor(i / 6)}` : ''),
  category: ['风控', '运营', '财务', '画像'][i % 4],
  dataType: ['DECIMAL', 'LONG', 'DOUBLE', 'STRING'][i % 4],
  owner: ['demo_user', 'alice', 'bob', 'carol'][i % 4],
  status: (['ONLINE', 'OFFLINE', 'DRAFT'] as const)[i % 3],
  updatedAt: `2025-10-${String(1 + (i % 20)).padStart(2, '0')} 09:${String(i % 60).padStart(2, '0')}`,
}));

export interface RuleTagItem {
  id: string;
  code: string;
  name: string;
  ruleText: string;
  owner: string;
  status: 'ONLINE' | 'OFFLINE';
  updatedAt: string;
}

export const rulesMockList: RuleTagItem[] = Array.from({ length: 22 }, (_, i) => ({
  id: `rule-${i + 1}`,
  code: `tag_rule_${String(i + 1).padStart(3, '0')}`,
  name: ['高净值用户', '高活跃客群', '僵尸客户', '新注册 7 天', '首次放款客户'][i % 5] + (i > 4 ? `_v${Math.floor(i / 5)}` : ''),
  ruleText: "age > 25 AND monthlyIncome >= 8000",
  owner: ['demo_user', 'alice', 'bob'][i % 3],
  status: (['ONLINE', 'OFFLINE'] as const)[i % 2],
  updatedAt: `2025-10-${String(1 + (i % 18)).padStart(2, '0')} 11:05`,
}));

export interface GroupItem {
  id: string;
  groupCode: string;
  name: string;
  userCount: number;
  source: string;
  creator: string;
  createdAt: string;
  status: 'READY' | 'COMPUTING' | 'FAILED';
}

export const groupsMockList: GroupItem[] = Array.from({ length: 18 }, (_, i) => ({
  id: `grp-${i + 1}`,
  groupCode: `grp_${String(i + 1).padStart(4, '0')}`,
  name: ['营销推送 - 10 月', '风险名单 - 10 月', '新户召回', '沉睡客户激活'][i % 4] + ` #${i + 1}`,
  userCount: 5000 + ((i * 13 * 1024) % 500000),
  source: ['SQL', '规则标签', '人工导入'][i % 3],
  creator: ['demo_user', 'alice'][i % 2],
  createdAt: `2025-10-${String(1 + (i % 20)).padStart(2, '0')} 14:20`,
  status: (['READY', 'READY', 'READY', 'COMPUTING', 'FAILED'] as const)[i % 5],
}));

export interface QueryStatItem {
  id: string;
  user: string;
  queryCount: number;
  lastQuery: string;
  topTable: string;
}

export const queryStatMockList: QueryStatItem[] = Array.from({ length: 25 }, (_, i) => ({
  id: `qs-${i + 1}`,
  user: ['demo_user', 'alice', 'bob', 'carol', 'david'][i % 5],
  queryCount: 10 + ((i * 7) % 120),
  lastQuery: `2025-10-${String(1 + (i % 18)).padStart(2, '0')} ${String((8 + i) % 24).padStart(2, '0')}:10`,
  topTable: ['ods_db.ods_user_info_df', 'dwd_db.dwd_order_detail_df', 'ads_db.ads_business_daily_df'][i % 3],
}));

export interface SystemAuthItem {
  id: string;
  account: string;
  name: string;
  roles: string[];
  mail: string;
  updatedAt: string;
}

export const systemAuthMockList: SystemAuthItem[] = Array.from({ length: 16 }, (_, i) => ({
  id: `u-${i + 1}`,
  account: `user_${String(i + 1).padStart(3, '0')}`,
  name: ['张三', '李四', '王五', '赵六', '陈七', '田八'][i % 6],
  roles: [['ADMIN'], ['DEVELOPER'], ['VIEWER'], ['DEVELOPER', 'VIEWER']][i % 4],
  mail: `user_${String(i + 1).padStart(3, '0')}@example.com`,
  updatedAt: `2025-09-${String(1 + (i % 25)).padStart(2, '0')} 10:00`,
}));

export interface CategoryItem {
  id: string;
  code: string;
  name: string;
  itemCount: number;
  enabled: boolean;
}

export const categoryMockList: CategoryItem[] = [
  { id: 'cat-1', code: 'risk', name: '风控', itemCount: 42, enabled: true },
  { id: 'cat-2', code: 'ops', name: '运营', itemCount: 35, enabled: true },
  { id: 'cat-3', code: 'fin', name: '财务', itemCount: 28, enabled: true },
  { id: 'cat-4', code: 'portrait', name: '画像', itemCount: 22, enabled: true },
  { id: 'cat-5', code: 'legacy', name: '废弃', itemCount: 6, enabled: false },
];
