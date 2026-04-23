export interface TagAreaOption {
  label: string;
  value: string;
}

export interface TagMenuNode {
  key: string;
  label: string;
  icon?: string;
  routePath?: string;
  children?: TagMenuNode[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface MetricItem {
  id: string;
  code: string;
  name: string;
  metricsCode?: string;
  metricsName?: string;
  desc?: string;
  metricsDesc?: string;
  category: string;
  parentId?: string;
  owner: string;
  creatorName?: string;
  dataType: string;
  type?: string;
  metricsType?: string;
  metricsCustomType?: string;
  timeliness?: string;
  metricsTimeLiness?: string;
  ownSchema?: string;
  ownTable?: string;
  ownColumn?: string;
  ownColumnValues?: string[];
  dolphinProjectId?: string;
  dolphinProcessId?: string;
  createTime?: string;
  status: 'ONLINE' | 'OFFLINE' | 'DRAFT' | 'ENABLE' | 'DISABLE' | 'INVALID';
  updateTime: string;
  source: 'SYSTEM' | 'CUSTOM';
}

export interface RuleTagItem {
  id: string;
  code: string;
  name: string;
  ruleCode?: string;
  ruleName?: string;
  expression: string;
  parentId?: string;
  customType?: 'NORMAL' | 'SQL' | 'CSV';
  owner: string;
  creatorName?: string;
  status: 'ONLINE' | 'OFFLINE';
  createTime?: string;
  updateTime: string;
  dataUpdateTime?: string;
  ruleTimeliness?: string;
  ruleUsedNum?: number;
  hitRate: string;
}

export interface GroupItem {
  id: string;
  groupCode: string;
  groupName: string;
  parentId?: string;
  groupType?: string;
  sourceType: 'RULE' | 'SQL' | 'UPLOAD';
  creator: string;
  creatorName?: string;
  userCount: number;
  status: 'READY' | 'RUNNING' | 'FAILED';
  schedule: string;
  createTime?: string;
  ruleUpdateTime?: string;
  updateTime: string;
}

export interface SqlGroupItem {
  id: string;
  sqlGroupCode: string;
  name: string;
  desc?: string;
  groupType?: string;
  ruleCodes?: string[];
  metricsCode?: string[];
  timing?: string;
  execTime?: string;
  shareeUsers?: string[];
  shareePlat?: string[];
  dbName?: string;
  tableName?: string;
  status: 'ENABLE' | 'DISABLE';
  maxExecuteTime: number;
  cnt: number;
  application: string;
  ownerName: string;
  creatorName: string;
  permission: string[];
  pushStatus: boolean;
  runtimeStatus?: 'IDLE' | 'RUNNING' | 'WAITING' | 'PUSHING';
  sqlText?: string;
  notifyUsers?: string[];
  updateTime: string;
  createTime: string;
}

export interface TimingItem {
  id: string;
  groupCode?: string;
  groupName?: string;
  taskCode: string;
  taskName: string;
  cron: string;
  timing?: string;
  metricsCode?: string[];
  application?: string;
  isFullData?: boolean;
  type?: string;
  pushType?: string;
  pushConf?: {
    topic?: string;
    server?: string;
  };
  nextRunTime: string;
  owner: string;
  creatorName?: string;
  createTime?: string;
  updateTime?: string;
  status: 'ENABLE' | 'DISABLE';
  targetType: 'TAG' | 'GROUP';
}

export interface TestDataRecord {
  id: string;
  ruleCode: string;
  userId: string[] | string;
  creatorName: string;
  createTime: string;
  updateTime: string;
  dataMockType: 'RULE' | 'METRICS';
  metricsInfo?: Array<Record<string, unknown>>;
}

export interface SystemAuthItem {
  id: string;
  appName: string;
  authorities: string[];
  rule: string[];
  group: string[];
  timing: string[];
  creatorName: string;
  createTime: string;
  updateTime: string;
}

export interface SystemAppItem {
  id: string;
  appName: string;
  pushType: string;
  superintendent: string;
  pushConf: {
    topic?: string;
    server?: string;
    subAppName?: string[];
  };
  callbackUrls: {
    kafkaPushCallbackUrl?: string;
    sqlRuleCallbackUrl?: string;
  };
  createTime: string;
  updateTime: string;
}

export interface ContentAuthItem {
  id: string;
  chidoriName: string;
  accessType: string;
  type: 'RULE' | 'GROUP';
  organizationId: string[];
  createTime: string;
  updateTime: string;
}

export interface CategoryNode {
  id: string;
  parentId?: string;
  metricsName: string;
  metricsDesc?: string;
  children?: CategoryNode[];
}

export interface WhiteListItem {
  id: string;
  dbName: string;
  tableName: string;
  dsProjectName: string;
  dsProcessName: string;
  usedType: string[];
  usedNum: number;
  creator: string;
  createTime: string;
}

export interface UserPictureItem {
  id: string;
  userProfileName: string;
  dimension: string;
  metrics: {
    metricsType: string;
    metricsCode: string;
    metricsName: string;
  };
}

export interface UserSearchResult {
  columns: Array<{ key: string; title: string }>;
  items: Record<string, string | number>[];
  total: number;
}

export interface StatOption {
  label: string;
  value: string;
}

export interface StatResultRow {
  rowKey: string;
  code?: string;
  app?: string;
  cnt: number;
}

export interface StatPoint {
  date: string;
  code?: string;
  app?: string;
  cnt: number;
}

export interface BloodlineNode {
  id: string;
  code: string;
  name: string;
  type: 'METRIC' | 'RULE' | 'SQL_RULE' | 'GROUP' | 'COMPOSITION_GROUP';
  owner: string;
  upstream: string[];
  downstream: string[];
  description: string;
  organizationId?: string[];
}

export interface TagOpsOverview {
  validMetricsCount: number;
  validTagsCount: number;
  validGroupsCount: number;
  validTimingJobsCount: number;
}

export interface TagOpsSectionItem {
  id: string;
  code: string;
  name: string;
  status: string;
  owner: string;
  updateTime: string;
  extra?: string;
}

export interface TagOpsExecRecord {
  id: string;
  executeNo: string;
  targetCode: string;
  targetName: string;
  targetType: string;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED';
  duration: string;
  executeTime: string;
}

export const tagAreaOptions: TagAreaOption[] = [
  { label: '国内', value: 'CN' },
  { label: '国内激活未注册', value: 'ACTIVITY' },
  { label: '国内 RTA', value: 'CN_RTA' },
  { label: '菲律宾', value: 'PHI' },
  { label: '菲律宾 RTA', value: 'PHI_RTA' },
  { label: '印尼', value: 'EC' },
  { label: '印尼激活未注册', value: 'EC_ACTIVITY' },
  { label: '印尼 RTA', value: 'EC_RTA' },
  { label: '墨西哥', value: 'MEX' },
  { label: '墨西哥激活未注册', value: 'MEX_ACTIVITY' },
  { label: '墨西哥 RTA', value: 'MEX_RTA' },
  { label: '波兰', value: 'PL' },
  { label: '波兰 RTA', value: 'PL_RTA' },
];

const QUERY_STAT_AREAS = ['CN', 'ACTIVITY', 'EC', 'EC_ACTIVITY', 'MEX', 'MEX_ACTIVITY', 'PHI', 'PL'];
const USER_PICTURE_AREAS = ['CN', 'EC'];
const NO_BLOODLINE_AREAS = ['CN_RTA', 'PHI_RTA', 'MEX_RTA', 'EC_RTA', 'CN_RTA_MOBILEPHONE', 'CN_RTA_EXPOSE'];

export function shouldShowQueryStatItems(area: string) {
  return QUERY_STAT_AREAS.includes(area);
}

export function shouldShowUserPicture(area: string) {
  return USER_PICTURE_AREAS.includes(area);
}

export function shouldShowBloodline(area: string) {
  return !NO_BLOODLINE_AREAS.includes(area);
}

export function buildTagMenu(area = 'CN'): TagMenuNode[] {
  return [
    {
      key: 'clientele',
      label: '客群管理',
      icon: 'TeamOutlined',
      children: [
        { key: 'metrics', label: '指标管理', icon: 'BarChartOutlined', routePath: '/clientele/metrics' },
        { key: 'rule', label: '自定义标签', icon: 'TagOutlined', routePath: '/clientele/rule' },
        { key: 'group', label: '人群管理', icon: 'UsergroupAddOutlined', routePath: '/clientele/group' },
        ...(
          shouldShowQueryStatItems(area)
            ? [{ key: 'sql-group', label: 'SQL 人群', icon: 'DatabaseOutlined', routePath: '/groupManagement/sqlGroup' }]
            : []
        ),
        { key: 'timing', label: '定时管理', icon: 'ClockCircleOutlined', routePath: '/clientele/timing' },
      ],
    },
    {
      key: 'query-stat',
      label: '查询统计',
      icon: 'SearchOutlined',
      children: [
        ...(shouldShowQueryStatItems(area)
          ? [
              { key: 'user-search', label: '用户查询', icon: 'SearchOutlined', routePath: '/clientele/user-search' },
              { key: 'stat', label: '使用统计', icon: 'LineChartOutlined', routePath: '/clientele/stat' },
              { key: 'white-list', label: 'SQL 库表白名单', icon: 'FileTextOutlined', routePath: '/clientele/white-list' },
            ]
          : []),
        ...(shouldShowBloodline(area)
          ? [{ key: 'bloodline', label: '血缘查询', icon: 'ApartmentOutlined', routePath: '/clientele/bloodline' }]
          : []),
        ...(area !== 'PHI_RTA'
          ? [{ key: 'tag-ops', label: '标签运维', icon: 'ToolOutlined', routePath: '/clientele/tag-ops' }]
          : []),
      ],
    },
    {
      key: 'platform',
      label: '平台管理',
      icon: 'SettingOutlined',
      children: [
        { key: 'system-auth', label: '系统权限', icon: 'SafetyOutlined', routePath: '/clientele/system-auth' },
        { key: 'system', label: '系统管理', icon: 'SettingOutlined', routePath: '/clientele/system' },
        { key: 'content-auth', label: '内容权限', icon: 'LockOutlined', routePath: '/clientele/content-auth' },
        { key: 'category', label: '类别管理', icon: 'AppstoreOutlined', routePath: '/clientele/category' },
        ...(shouldShowUserPicture(area)
          ? [{ key: 'user-picture', label: '人群画像', icon: 'UserOutlined', routePath: '/clientele/user-picture' }]
          : []),
      ],
    },
    {
      key: 'tag-test',
      label: '标签测试',
      icon: 'ExperimentOutlined',
      children: [
        { key: 'test-data-generator', label: '标签测试', icon: 'ExperimentOutlined', routePath: '/clientele/test-data-generator' },
      ],
    },
  ];
}

const makeTime = (day: number, hour = 10, min = 0) =>
  `2026-04-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;

let metricsList: MetricItem[] = Array.from({ length: 24 }, (_, i) => ({
  id: `metric-${i + 1}`,
  code: `metric_${String(i + 1).padStart(3, '0')}`,
  metricsCode: `metric_${String(i + 1).padStart(3, '0')}`,
  name: ['首借金额', '30天活跃度', '订单转化率', '近7日还款率', '授信通过率', '风控评分'][i % 6],
  metricsName: ['首借金额', '30天活跃度', '订单转化率', '近7日还款率', '授信通过率', '风控评分'][i % 6],
  desc: ['首借订单金额聚合', '用户近30天活跃行为评分', '订单漏斗转化率', '还款履约情况', '审批通过概率', '模型风控评分'][i % 6],
  metricsDesc: ['首借订单金额聚合', '用户近30天活跃行为评分', '订单漏斗转化率', '还款履约情况', '审批通过概率', '模型风控评分'][i % 6],
  category: ['风控', '运营', '财务', '画像'][i % 4],
  parentId: ['cat-risk-1', 'cat-growth-1', 'cat-risk-2', 'cat-growth', 'cat-risk'][i % 5],
  owner: ['alice', 'bob', 'carol', 'david'][i % 4],
  creatorName: ['alice', 'bob', 'carol', 'david'][i % 4],
  dataType: ['DOUBLE', 'LONG', 'STRING'][i % 3],
  type: ['STRING', 'LONG', 'DOUBLE'][i % 3],
  metricsType: ['ATOMIC', 'DERIVED'][i % 2],
  metricsCustomType: ['NORMAL', 'SPECIAL'][i % 2],
  timeliness: ['T+1', '实时', '小时级'][i % 3],
  metricsTimeLiness: ['T1', 'REAL_TIME', 'HOUR'][i % 3],
  ownSchema: ['ads_risk', 'ads_growth', 'dwd_user'][i % 3],
  ownTable: ['ads_metric_summary_di', 'ads_growth_tag_di', 'dwd_user_profile_di'][i % 3],
  ownColumn: ['loan_amount_first', 'active_score_30d', 'credit_pass_rate'][i % 3],
  ownColumnValues: [['loan_amount_first'], ['active_score_30d'], ['credit_pass_rate']][i % 3],
  dolphinProjectId: i % 3 === 0 ? 'risk-project' : undefined,
  dolphinProcessId: i % 3 === 0 ? 'risk-nightly' : undefined,
  createTime: makeTime((i % 18) + 1, 8 + (i % 5), 15),
  status: (['ENABLE', 'DISABLE', 'INVALID'] as const)[i % 3],
  updateTime: makeTime((i % 18) + 1, 9 + (i % 8), i % 60),
  source: i % 5 === 0 ? 'CUSTOM' : 'SYSTEM',
}));

const metricsTableMap: Record<string, string[]> = {
  ads_risk: ['ads_metric_summary_di', 'risk_feature_detail_di', 'risk_user_profile_di'],
  ads_growth: ['ads_growth_tag_di', 'ads_marketing_result_di', 'ads_coupon_push_di'],
  dwd_user: ['dwd_user_profile_di', 'dwd_user_login_di', 'dwd_user_credit_di'],
};

const metricsColumnMap: Record<string, string[]> = {
  'ads_risk.ads_metric_summary_di': ['loan_amount_first', 'credit_pass_rate', 'approve_success_cnt'],
  'ads_risk.risk_feature_detail_di': ['risk_score', 'overdue_days_7d', 'blacklist_level'],
  'ads_risk.risk_user_profile_di': ['risk_segment', 'audit_result', 'risk_reason'],
  'ads_growth.ads_growth_tag_di': ['active_score_30d', 'coupon_use_rate', 'sms_click_rate'],
  'ads_growth.ads_marketing_result_di': ['campaign_cnt', 'conversion_rate', 'roi_score'],
  'ads_growth.ads_coupon_push_di': ['push_cnt_7d', 'coupon_receive_rate', 'coupon_redeem_rate'],
  'dwd_user.dwd_user_profile_di': ['credit_pass_rate', 'user_age', 'register_days'],
  'dwd_user.dwd_user_login_di': ['login_days_30d', 'login_device_cnt', 'last_login_gap'],
  'dwd_user.dwd_user_credit_di': ['credit_limit', 'credit_balance', 'credit_utilization'],
};

const dolphinProjects = [
  { label: '风险夜间任务', value: 'risk-project' },
  { label: '增长标签任务', value: 'growth-project' },
  { label: '用户画像任务', value: 'profile-project' },
];

const dolphinWorkflowMap: Record<string, Array<{ label: string; value: string }>> = {
  'risk-project': [
    { label: '风险指标日调度', value: 'risk-nightly' },
    { label: '风控宽表生成', value: 'risk-wide-table' },
  ],
  'growth-project': [
    { label: '增长指标同步', value: 'growth-sync' },
    { label: '营销结果聚合', value: 'growth-agg' },
  ],
  'profile-project': [
    { label: '用户画像主流程', value: 'profile-master' },
    { label: '画像补录任务', value: 'profile-repair' },
  ],
};

let ruleTags: RuleTagItem[] = Array.from({ length: 22 }, (_, i) => ({
  id: `rule-${i + 1}`,
  code: `rule_${String(i + 1).padStart(3, '0')}`,
  ruleCode: `rule_${String(i + 1).padStart(3, '0')}`,
  name: ['高风险用户', '高活跃用户', '沉默用户', '羊毛党识别', '高价值用户'][i % 5],
  ruleName: ['高风险用户', '高活跃用户', '沉默用户', '羊毛党识别', '高价值用户'][i % 5],
  expression: ['score > 90', 'login_days_30 > 20', 'last_active_days > 30', 'coupon_cnt_7d > 5', 'loan_amount_90d > 50000'][i % 5],
  parentId: ['cat-risk', 'cat-growth', 'cat-risk-2', 'cat-growth-1'][i % 4],
  customType: (['NORMAL', 'SQL', 'CSV'] as const)[i % 3],
  owner: ['alice', 'bob', 'carol'][i % 3],
  creatorName: ['alice', 'bob', 'carol'][i % 3],
  status: (['ONLINE', 'OFFLINE'] as const)[i % 2],
  createTime: makeTime((i % 18) + 1, 8, 10),
  updateTime: makeTime((i % 20) + 1, 11, i % 40),
  dataUpdateTime: makeTime((i % 18) + 1, 7 + (i % 6), 20),
  ruleTimeliness: ['T+1', '实时', '小时级'][i % 3],
  ruleUsedNum: 2 + (i % 7),
  hitRate: `${12 + i}%`,
}));

let groups: GroupItem[] = Array.from({ length: 18 }, (_, i) => ({
  id: `group-${i + 1}`,
  groupCode: `group_${String(i + 1).padStart(3, '0')}`,
  groupName: ['营销触达客群', '高风险人群', '沉睡用户召回', '授信高潜人群'][i % 4],
  parentId: ['rule_001', 'rule_002', 'rule_003', 'rule_004'][i % 4],
  groupType: ['静态人群', '动态人群', '组合人群'][i % 3],
  sourceType: (['RULE', 'SQL', 'UPLOAD'] as const)[i % 3],
  creator: ['alice', 'bob', 'carol'][i % 3],
  creatorName: ['Alice', 'Bob', 'Carol'][i % 3],
  userCount: 800 + i * 367,
  status: (['READY', 'RUNNING', 'FAILED'] as const)[i % 3],
  schedule: ['每天 09:00', '每周一 10:00', '手动更新'][i % 3],
  createTime: makeTime((i % 15) + 1, 10, 20),
  ruleUpdateTime: makeTime((i % 15) + 1, 5 + (i % 8), 10),
  updateTime: makeTime((i % 16) + 1, 12, i % 60),
}));

let sqlGroups: SqlGroupItem[] = Array.from({ length: 14 }, (_, i) => ({
  id: `sql-group-${i + 1}`,
  sqlGroupCode: `sql_group_${String(i + 1).padStart(3, '0')}`,
  name: ['高活跃 SQL 人群', '复贷高潜客群', '风控观察人群', '营销白名单人群'][i % 4],
  desc: ['近30天活跃用户圈选', '复贷潜力用户识别', '风险监控重点客群', '用于营销白名单推送'][i % 4],
  groupType: ['静态人群', '动态人群'][i % 2],
  ruleCodes: [[`rule_${String((i % 6) + 1).padStart(3, '0')}`], [`rule_${String((i % 6) + 1).padStart(3, '0')}`, `rule_${String(((i + 1) % 6) + 1).padStart(3, '0')}`]][i % 2],
  metricsCode: [metricsList[i % metricsList.length].code, metricsList[(i + 1) % metricsList.length].code],
  timing: ['每天', '每周一', '每小时', '每月1日'][i % 4],
  execTime: ['07:00', '08:30', '09:00', '12:00'][i % 4],
  shareeUsers: [['alice', 'risk_bot'], ['bob', 'growth_bot'], ['carol', 'ops_bot']][i % 3],
  shareePlat: [['barrett'], ['apollo', 'odin'], ['barrett', 'apollo']][i % 3],
  dbName: ['ec_user_tag', 'ec_dwd', 'ec_dm'][i % 3],
  tableName: ['user_profile_di', 'loan_order_di', 'marketing_result_di'][i % 3],
  status: (['ENABLE', 'DISABLE'] as const)[i % 2],
  maxExecuteTime: [2, 4, 6, 12][i % 4],
  cnt: 1000 + i * 531,
  application: ['barrett', 'apollo', 'odin'][i % 3],
  ownerName: ['alice', 'bob', 'carol'][i % 3],
  creatorName: ['demo_user', 'alice', 'bob'][i % 3],
  permission: [['edit', 'push', 'execute', 'delete'], ['edit', 'execute'], ['push', 'execute', 'delete']][i % 3],
  pushStatus: i % 2 === 0,
  runtimeStatus: (['IDLE', 'RUNNING', 'WAITING', 'PUSHING'] as const)[i % 4],
  notifyUsers: [['alice', 'risk_bot'], ['bob', 'growth_bot'], ['carol', 'ops_bot']][i % 3],
  sqlText: [
    "select user_id from ec_user_tag.user_profile_di where active_days_30 > 10",
    "select user_id from ec_user_tag.user_profile_di where loan_cnt_90d >= 2",
    "select user_id from ec_user_tag.user_profile_di where risk_score > 80",
  ][i % 3],
  updateTime: makeTime((i % 16) + 1, 13, 20),
  createTime: makeTime((i % 16) + 1, 9, 10),
}));

let timings: TimingItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `timing-${i + 1}`,
  groupCode: groups[i % groups.length].groupCode,
  groupName: groups[i % groups.length].groupName,
  taskCode: `timing_${String(i + 1).padStart(3, '0')}`,
  taskName: ['日常标签重算', '营销人群更新', '用户画像同步', 'SQL 人群刷新'][i % 4],
  cron: ['0 0 9 * * ?', '0 0 11 ? * MON', '0 30 2 * * ?', '0 0/30 * * * ?'][i % 4],
  timing: ['每天 09:00', '每周一 11:00', '每天 02:30', '每30分钟'][i % 4],
  metricsCode: [metricsList[i % metricsList.length].code, metricsList[(i + 1) % metricsList.length].code],
  application: ['barrett', 'apollo', 'odin'][i % 3],
  isFullData: i % 2 === 0,
  type: ['FULL', 'RETRY', 'INCREMENTAL'][i % 3],
  pushType: ['KAFKA', 'HTTP'][i % 2],
  pushConf: {
    topic: `tag_timing_topic_${i + 1}`,
    server: `push-${(i % 3) + 1}.internal`,
  },
  nextRunTime: makeTime((i % 12) + 1, 8 + (i % 6), 30),
  owner: ['alice', 'bob', 'carol'][i % 3],
  creatorName: ['alice', 'bob', 'carol'][i % 3],
  createTime: makeTime((i % 12) + 1, 7 + (i % 4), 20),
  updateTime: makeTime((i % 12) + 1, 9 + (i % 4), 10),
  status: (['ENABLE', 'DISABLE'] as const)[i % 2],
  targetType: (['TAG', 'GROUP'] as const)[i % 2],
}));

let testDataRecords: TestDataRecord[] = Array.from({ length: 8 }, (_, i) => ({
  id: `mock-${i + 1}`,
  ruleCode: ruleTags[i % ruleTags.length].code,
  userId: i % 2 === 0 ? [`u${1000 + i}`, `u${2000 + i}`] : `u${3000 + i}`,
  creatorName: ['demo_user', 'alice', 'bob'][i % 3],
  createTime: makeTime((i % 10) + 1, 10, 10),
  updateTime: makeTime((i % 10) + 1, 12, 20),
  dataMockType: (['RULE', 'METRICS'] as const)[i % 2],
  metricsInfo: i % 2 === 1 ? [{ metricsCode: metricsList[i % metricsList.length].code, mockValue: 10 + i }] : undefined,
}));

let systemAuthList: SystemAuthItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `sys-auth-${i + 1}`,
  appName: ['barrett', 'apollo', 'odin'][i % 3],
  authorities: ['tag.read', 'tag.write', 'tag.export'].slice(0, (i % 3) + 1),
  rule: ['READ', 'EDIT'].slice(0, (i % 2) + 1),
  group: ['READ', 'EDIT', 'DELETE'].slice(0, ((i + 1) % 3) + 1),
  timing: ['READ', 'EDIT'].slice(0, (i % 2) + 1),
  creatorName: ['alice', 'bob'][i % 2],
  createTime: makeTime((i % 11) + 1, 10),
  updateTime: makeTime((i % 11) + 1, 16),
}));

let systemApps: SystemAppItem[] = Array.from({ length: 9 }, (_, i) => ({
  id: `sys-app-${i + 1}`,
  appName: ['barrett', 'apollo', 'odin', 'hera'][i % 4] + `-${i + 1}`,
  pushType: ['KAFKA', 'CALLBACK'][i % 2],
  superintendent: ['alice', 'bob', 'carol'][i % 3],
  pushConf: {
    topic: `tag_topic_${i + 1}`,
    server: `kafka-${(i % 3) + 1}.internal`,
    subAppName: ['datamap', 'studio', 'metric'].slice(0, (i % 3) + 1),
  },
  callbackUrls: {
    kafkaPushCallbackUrl: `https://callback.example.com/tag/${i + 1}`,
    sqlRuleCallbackUrl: `/api/tag/callback/${i + 1}`,
  },
  createTime: makeTime((i % 10) + 1, 9),
  updateTime: makeTime((i % 10) + 1, 18),
}));

let contentAuthList: ContentAuthItem[] = Array.from({ length: 14 }, (_, i) => ({
  id: `content-auth-${i + 1}`,
  chidoriName: ['风控角色', '营销角色', '运营角色', '数据分析角色'][i % 4] + `-${i + 1}`,
  accessType: ['READ', 'EDIT', 'EXPORT'][i % 3],
  type: (['RULE', 'GROUP'] as const)[i % 2],
  organizationId: i % 2 === 0 ? ['risk', 'ops'] : ['growth'],
  createTime: makeTime((i % 12) + 1, 9),
  updateTime: makeTime((i % 12) + 1, 17),
}));

let categoryTree: CategoryNode = {
  id: 'cat-root',
  metricsName: '指标分类',
  metricsDesc: '根节点',
  children: [
    {
      id: 'cat-risk',
      parentId: 'cat-root',
      metricsName: '风控',
      metricsDesc: '风控指标域',
      children: [
        { id: 'cat-risk-1', parentId: 'cat-risk', metricsName: '审批', metricsDesc: '审批指标' },
        { id: 'cat-risk-2', parentId: 'cat-risk', metricsName: '贷后', metricsDesc: '贷后指标' },
      ],
    },
    {
      id: 'cat-growth',
      parentId: 'cat-root',
      metricsName: '运营',
      metricsDesc: '运营指标域',
      children: [
        { id: 'cat-growth-1', parentId: 'cat-growth', metricsName: '拉新', metricsDesc: '拉新指标' },
      ],
    },
  ],
};

let whiteList: WhiteListItem[] = Array.from({ length: 14 }, (_, i) => ({
  id: `white-${i + 1}`,
  dbName: ['ods_risk', 'dwd_user', 'ads_growth'][i % 3],
  tableName: ['order_detail_df', 'user_profile_di', 'coupon_push_record'][i % 3] + `_${i + 1}`,
  dsProjectName: ['tag-platform', 'risk-system', 'marketing'][i % 3],
  dsProcessName: ['daily_sync', 'weekly_refresh', 'hourly_check'][i % 3],
  usedType: [['RULE'], ['SQL_GROUP'], ['RULE', 'GROUP']][i % 3],
  usedNum: 3 + i,
  creator: ['alice', 'bob', 'carol'][i % 3],
  createTime: makeTime((i % 20) + 1, 8, 20),
}));

let userPictures: UserPictureItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `profile-${i + 1}`,
  userProfileName: ['授信额度分层', '近30天活跃分层', '还款偏好分层', '营销敏感度'][i % 4],
  dimension: ['BASE', 'BEHAVIOR', 'VALUE'][i % 3],
  metrics: {
    metricsType: ['DERIVED', 'ATOMIC'][i % 2],
    metricsCode: metricsList[i % metricsList.length].code,
    metricsName: metricsList[i % metricsList.length].name,
  },
}));

const bloodlineNodes: BloodlineNode[] = [
  { id: 'metric-001', code: 'metric_001', name: '首借金额', type: 'METRIC', owner: 'alice', upstream: ['rule_001'], downstream: [], description: '来自授信和订单信息的派生指标', organizationId: ['risk'] },
  { id: 'rule-001', code: 'rule_001', name: '高风险用户', type: 'RULE', owner: 'bob', upstream: ['group_001'], downstream: ['metric_001'], description: '用于高风险识别的标签', organizationId: ['risk', 'ops'] },
  { id: 'group-001', code: 'group_001', name: '营销触达人群', type: 'GROUP', owner: 'carol', upstream: ['sql_rule_001'], downstream: ['rule_001'], description: '营销投放主客群', organizationId: ['growth'] },
  { id: 'sql-rule-001', code: 'sql_rule_001', name: '近30天高活跃 SQL 标签', type: 'SQL_RULE', owner: 'david', upstream: [], downstream: ['group_001'], description: '根据行为明细计算出的 SQL 标签', organizationId: ['growth'] },
  { id: 'group-composition-001', code: 'composition_group_001', name: '高价值组合人群', type: 'COMPOSITION_GROUP', owner: 'alice', upstream: ['rule_001'], downstream: [], description: '组合多个标签后生成的人群', organizationId: ['growth', 'risk'] },
];

const tagOpsDbMap: Record<string, string[]> = {
  ods_risk: ['order_detail_df', 'risk_event_df', 'loan_base_di'],
  dwd_user: ['user_profile_di', 'user_login_di', 'user_credit_score_di'],
  ads_growth: ['coupon_push_record', 'sms_touch_record', 'growth_result_di'],
};

const tagOpsSections = {
  preTask: Array.from({ length: 8 }, (_, i) => ({
    id: `pre-${i + 1}`,
    code: `pre_task_${i + 1}`,
    name: ['宽表生成', '标签原子层刷新', '结果回流', '埋点回补'][i % 4],
    status: ['SUCCESS', 'RUNNING', 'FAILED'][i % 3],
    owner: ['alice', 'bob', 'carol'][i % 3],
    updateTime: makeTime((i % 18) + 1, 6 + (i % 4)),
    extra: ['Dolphin 调度', 'Airflow 调度'][i % 2],
  })),
  metric: Array.from({ length: 12 }, (_, i) => ({
    id: `ops-metric-${i + 1}`,
    code: metricsList[i % metricsList.length].code,
    name: metricsList[i % metricsList.length].name,
    status: ['ENABLE', 'DISABLE'][i % 2],
    owner: metricsList[i % metricsList.length].owner,
    updateTime: metricsList[i % metricsList.length].updateTime,
    extra: metricsList[i % metricsList.length].category,
  })),
  tag: Array.from({ length: 12 }, (_, i) => ({
    id: `ops-tag-${i + 1}`,
    code: ruleTags[i % ruleTags.length].code,
    name: ruleTags[i % ruleTags.length].name,
    status: ['ENABLE', 'DISABLE'][i % 2],
    owner: ruleTags[i % ruleTags.length].owner,
    updateTime: ruleTags[i % ruleTags.length].updateTime,
    extra: ruleTags[i % ruleTags.length].hitRate,
  })),
  group: Array.from({ length: 10 }, (_, i) => ({
    id: `ops-group-${i + 1}`,
    code: groups[i % groups.length].groupCode,
    name: groups[i % groups.length].groupName,
    status: ['ENABLE', 'DISABLE'][i % 2],
    owner: groups[i % groups.length].creator,
    updateTime: groups[i % groups.length].updateTime,
    extra: `${groups[i % groups.length].userCount}`,
  })),
  timing: Array.from({ length: 9 }, (_, i) => ({
    id: `ops-timing-${i + 1}`,
    code: timings[i % timings.length].taskCode,
    name: timings[i % timings.length].taskName,
    status: timings[i % timings.length].status,
    owner: timings[i % timings.length].owner,
    updateTime: timings[i % timings.length].nextRunTime,
    extra: timings[i % timings.length].cron,
  })),
};

const tagOpsExecRecords: TagOpsExecRecord[] = Array.from({ length: 20 }, (_, i) => ({
  id: `exec-${i + 1}`,
  executeNo: `JOB202604${String(1000 + i)}`,
  targetCode: ['metric_001', 'rule_001', 'group_001', 'timing_001'][i % 4],
  targetName: ['首借金额', '高风险用户', '营销触达人群', '日常标签重算'][i % 4],
  targetType: ['指标', '标签', '人群', '定时任务'][i % 4],
  status: (['SUCCESS', 'RUNNING', 'FAILED'] as const)[i % 3],
  duration: `${20 + i}s`,
  executeTime: makeTime((i % 18) + 1, 7 + (i % 8), 15),
}));

const organizationOptions = {
  rule: {
    risk: '风控中心',
    ops: '运营中心',
    growth: '增长中心',
  },
  group: {
    growth: '增长中心',
    crm: 'CRM 中台',
    market: '市场部门',
  },
};

const enumMaps = {
  accessTypes: [
    { value: 'READ', label: '只读' },
    { value: 'EDIT', label: '编辑' },
    { value: 'EXPORT', label: '导出' },
  ],
  backupTypes: [
    { value: 'RULE', label: '标签权限' },
    { value: 'GROUP', label: '人群权限' },
  ],
  appNames: [
    { value: 'barrett', label: 'barrett' },
    { value: 'apollo', label: 'apollo' },
    { value: 'odin', label: 'odin' },
  ],
  pushTypes: [
    { value: 'KAFKA', label: 'Kafka 推送' },
    { value: 'CALLBACK', label: '回调推送' },
  ],
  authOperationTypes: [
    { value: 'READ', label: '查看' },
    { value: 'EDIT', label: '编辑' },
    { value: 'DELETE', label: '删除' },
  ],
  metricsTypes: [
    { value: 'ATOMIC', label: '原子指标' },
    { value: 'DERIVED', label: '派生指标' },
  ],
  userProfileDimensions: [
    { value: 'BASE', label: '基础属性' },
    { value: 'BEHAVIOR', label: '行为属性' },
    { value: 'VALUE', label: '价值属性' },
  ],
  sqlWhitelistUsedTypes: [
    { value: 'RULE', label: '标签' },
    { value: 'GROUP', label: '人群' },
    { value: 'SQL_GROUP', label: 'SQL 人群' },
  ],
  statTabs: [
    { value: 'system', label: '系统统计' },
    { value: 'content', label: '内容统计' },
  ],
  statModules: [
    { value: 'METRICS', label: '指标' },
    { value: 'RULE', label: '标签' },
    { value: 'GROUP', label: '人群' },
  ],
};

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}

function paginate<T>(list: T[], pageNo = 1, pageSize = 10): PagedResult<T> {
  const start = (pageNo - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    total: list.length,
    pageNo,
    pageSize,
  };
}

function includesKeyword(value: string, keyword: string) {
  return value.toLowerCase().includes(keyword.toLowerCase());
}

export function getTagEnums() {
  return enumMaps;
}

export function queryMetrics(params: {
  keyword?: string;
  category?: string;
  metricsCode?: string;
  metricsName?: string;
  type?: string;
  metricsType?: string;
  creator?: string;
  metricsCustomType?: string;
  status?: string;
  parentId?: string;
  metricsTimeLiness?: string;
  ownTable?: string;
  ownColumn?: string;
  pageNo?: number;
  pageSize?: number;
}) {
  const keyword = params.keyword?.trim();
  const category = params.category?.trim();
  const list = metricsList.filter((item) => {
    const hitKeyword = !keyword || [item.code, item.name, item.owner, item.metricsCode || '', item.metricsName || ''].some((v) => includesKeyword(v, keyword));
    const hitCategory = !category || item.category === category;
    const hitMetricsCode = !params.metricsCode || includesKeyword(item.metricsCode || item.code, params.metricsCode);
    const hitMetricsName = !params.metricsName || includesKeyword(item.metricsName || item.name, params.metricsName);
    const hitType = !params.type || item.type === params.type;
    const hitMetricsType = !params.metricsType || item.metricsType === params.metricsType;
    const hitCreator = !params.creator || includesKeyword(item.creatorName || item.owner, params.creator);
    const hitCustomType = !params.metricsCustomType || item.metricsCustomType === params.metricsCustomType;
    const hitStatus = !params.status || item.status === params.status;
    const hitParentId = !params.parentId || item.parentId === params.parentId;
    const hitTimeliness = !params.metricsTimeLiness || item.metricsTimeLiness === params.metricsTimeLiness;
    const hitOwnTable = !params.ownTable || includesKeyword(item.ownTable || '', params.ownTable);
    const hitOwnColumn = !params.ownColumn || includesKeyword(item.ownColumn || '', params.ownColumn);
    return hitKeyword && hitCategory && hitMetricsCode && hitMetricsName && hitType && hitMetricsType && hitCreator && hitCustomType && hitStatus && hitParentId && hitTimeliness && hitOwnTable && hitOwnColumn;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveMetric(payload: Partial<MetricItem>) {
  if (payload.id) {
    metricsList = metricsList.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            ...payload,
            code: payload.code || payload.metricsCode || item.code,
            metricsCode: payload.metricsCode || payload.code || item.metricsCode || item.code,
            name: payload.name || payload.metricsName || item.name,
            metricsName: payload.metricsName || payload.name || item.metricsName || item.name,
            desc: payload.desc || payload.metricsDesc || item.desc,
            metricsDesc: payload.metricsDesc || payload.desc || item.metricsDesc || item.desc,
            owner: payload.owner || payload.creatorName || item.owner,
            creatorName: payload.creatorName || payload.owner || item.creatorName || item.owner,
            timeliness: payload.timeliness || payload.metricsTimeLiness || item.timeliness,
            metricsTimeLiness: payload.metricsTimeLiness || payload.timeliness || item.metricsTimeLiness,
            ownColumn: payload.ownColumn || payload.ownColumnValues?.[0] || item.ownColumn,
            ownColumnValues: payload.ownColumnValues || (payload.ownColumn ? [payload.ownColumn] : item.ownColumnValues),
            updateTime: makeTime(23, 18),
          } as MetricItem
        : item,
    );
    return metricsList.find((item) => item.id === payload.id) ?? null;
  }
  const next: MetricItem = {
    id: nextId('metric'),
    code: payload.code || payload.metricsCode || nextId('metric_code'),
    metricsCode: payload.metricsCode || payload.code || nextId('metric_code'),
    name: payload.name || payload.metricsName || '新建指标',
    metricsName: payload.metricsName || payload.name || '新建指标',
    desc: payload.desc || payload.metricsDesc || '新建指标描述',
    metricsDesc: payload.metricsDesc || payload.desc || '新建指标描述',
    category: payload.category || '运营',
    parentId: payload.parentId || 'cat-growth-1',
    owner: payload.owner || payload.creatorName || 'demo_user',
    creatorName: payload.creatorName || payload.owner || 'demo_user',
    dataType: payload.dataType || 'STRING',
    type: payload.type || payload.dataType || 'STRING',
    metricsType: payload.metricsType || 'ATOMIC',
    metricsCustomType: payload.metricsCustomType || 'NORMAL',
    timeliness: payload.timeliness || payload.metricsTimeLiness || 'T+1',
    metricsTimeLiness: payload.metricsTimeLiness || 'T1',
    ownSchema: payload.ownSchema || 'ads_growth',
    ownTable: payload.ownTable || 'ads_metric_summary_di',
    ownColumn: payload.ownColumn || payload.ownColumnValues?.[0] || 'metric_value',
    ownColumnValues: payload.ownColumnValues || (payload.ownColumn ? [payload.ownColumn] : ['metric_value']),
    dolphinProjectId: payload.dolphinProjectId,
    dolphinProcessId: payload.dolphinProcessId,
    createTime: makeTime(23, 10),
    status: payload.status || 'DISABLE',
    updateTime: makeTime(23, 18),
    source: payload.source || 'CUSTOM',
  };
  metricsList = [next, ...metricsList];
  return next;
}

export function deleteMetric(id: string) {
  metricsList = metricsList.filter((item) => item.id !== id);
}

export function batchDisableMetrics(ids: string[]) {
  metricsList = metricsList.map((item) =>
    ids.includes(item.id) ? { ...item, status: 'DISABLE', updateTime: makeTime(23, 19) } : item,
  );
}

export function toggleMetricStatus(id: string) {
  metricsList = metricsList.map((item) =>
    item.id === id
      ? { ...item, status: item.status === 'ENABLE' ? 'DISABLE' : 'ENABLE', updateTime: makeTime(23, 19) }
      : item,
  );
}

export function getMetricEnumOptions(typeName: string, dbName?: string, tableName?: string) {
  if (typeName === 'tables') {
    return (metricsTableMap[dbName || ''] || []).map((value) => ({ label: value, value }));
  }
  if (typeName === 'columns') {
    return (metricsColumnMap[`${dbName || ''}.${tableName || ''}`] || []).map((value) => ({ label: value, value }));
  }
  return [];
}

export function checkMetricIsNewTable(dbName?: string, tableName?: string) {
  if (!dbName || !tableName) return false;
  return tableName.includes('result') || tableName.includes('summary');
}

export function addMetricDepTable(_payload: { dolphinProjectId?: string; dolphinProcessId?: string; dbName?: string; tableName?: string }) {
  return { success: true };
}

export function getMetricProjects() {
  return dolphinProjects;
}

export function getMetricWorkflows(projectId?: string) {
  return dolphinWorkflowMap[projectId || ''] || [];
}

export function queryRules(params: {
  keyword?: string;
  metricsName?: string;
  ruleCode?: string;
  ruleName?: string;
  ruleTimeliness?: string;
  status?: string;
  customType?: string;
  parentId?: string;
  creatorName?: string;
  pageNo?: number;
  pageSize?: number;
}) {
  const keyword = params.keyword?.trim();
  const list = ruleTags.filter((item) => {
    const hitKeyword = !keyword || [item.code, item.name, item.expression].some((v) => includesKeyword(v, keyword));
    const hitMetricsName = !params.metricsName || includesKeyword(item.expression, params.metricsName);
    const hitRuleCode = !params.ruleCode || includesKeyword(item.ruleCode || item.code, params.ruleCode);
    const hitRuleName = !params.ruleName || includesKeyword(item.ruleName || item.name, params.ruleName);
    const hitTimeliness = !params.ruleTimeliness || item.ruleTimeliness === params.ruleTimeliness;
    const hitStatus = !params.status || item.status === params.status;
    const hitCustomType = !params.customType || item.customType === params.customType;
    const hitParentId = !params.parentId || item.parentId === params.parentId;
    const hitCreatorName = !params.creatorName || includesKeyword(item.creatorName || item.owner, params.creatorName);
    return hitKeyword && hitMetricsName && hitRuleCode && hitRuleName && hitTimeliness && hitStatus && hitCustomType && hitParentId && hitCreatorName;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveRule(payload: Partial<RuleTagItem>) {
  if (payload.id) {
    ruleTags = ruleTags.map((item) =>
      item.id === payload.id ? { ...item, ...payload, updateTime: makeTime(23, 18) } as RuleTagItem : item,
    );
    return ruleTags.find((item) => item.id === payload.id) ?? null;
  }
  const next: RuleTagItem = {
    id: nextId('rule'),
    code: payload.code || nextId('rule_code'),
    ruleCode: payload.ruleCode || payload.code || nextId('rule_code'),
    name: payload.name || '新建标签',
    ruleName: payload.ruleName || payload.name || '新建标签',
    expression: payload.expression || 'score > 80',
    parentId: payload.parentId || 'cat-root',
    customType: payload.customType || 'NORMAL',
    owner: payload.owner || 'demo_user',
    creatorName: payload.creatorName || payload.owner || 'demo_user',
    status: payload.status || 'OFFLINE',
    createTime: makeTime(23, 9),
    updateTime: makeTime(23, 18),
    dataUpdateTime: payload.dataUpdateTime || makeTime(23, 6),
    ruleTimeliness: payload.ruleTimeliness || 'T+1',
    ruleUsedNum: payload.ruleUsedNum || 0,
    hitRate: payload.hitRate || '0%',
  };
  ruleTags = [next, ...ruleTags];
  return next;
}

export function deleteRule(id: string) {
  ruleTags = ruleTags.filter((item) => item.id !== id);
}

export function toggleRuleStatus(id: string) {
  ruleTags = ruleTags.map((item) =>
    item.id === id
      ? { ...item, status: item.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE', updateTime: makeTime(23, 19) }
      : item,
  );
}

export function executeSqlRule(code: string) {
  const found = ruleTags.find((item) => item.code === code);
  return found ? { success: true, message: `${found.name} 已触发立即计算` } : { success: false };
}

export function queryGroups(params: {
  keyword?: string;
  groupCode?: string;
  groupName?: string;
  parentId?: string;
  groupType?: string;
  creatorName?: string;
  sourceType?: string;
  pageNo?: number;
  pageSize?: number;
  sqlOnly?: boolean;
}) {
  const keyword = params.keyword?.trim();
  const sourceType = params.sqlOnly ? 'SQL' : params.sourceType;
  const list = groups.filter((item) => {
    const hitKeyword = !keyword || [item.groupCode, item.groupName, item.creator].some((v) => includesKeyword(v, keyword));
    const hitType = !sourceType || item.sourceType === sourceType;
    const hitGroupCode = !params.groupCode || includesKeyword(item.groupCode, params.groupCode);
    const hitGroupName = !params.groupName || includesKeyword(item.groupName, params.groupName);
    const hitParentId = !params.parentId || item.parentId === params.parentId;
    const hitGroupType = !params.groupType || item.groupType === params.groupType;
    const hitCreatorName = !params.creatorName || includesKeyword(item.creatorName || item.creator, params.creatorName);
    return hitKeyword && hitType && hitGroupCode && hitGroupName && hitParentId && hitGroupType && hitCreatorName;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveGroup(payload: Partial<GroupItem>) {
  if (payload.id) {
    groups = groups.map((item) =>
      item.id === payload.id ? { ...item, ...payload, updateTime: makeTime(23, 18) } as GroupItem : item,
    );
    return groups.find((item) => item.id === payload.id) ?? null;
  }
  const next: GroupItem = {
    id: nextId('group'),
    groupCode: payload.groupCode || nextId('group_code'),
    groupName: payload.groupName || '新建人群',
    parentId: payload.parentId || 'rule_001',
    groupType: payload.groupType || '动态人群',
    sourceType: payload.sourceType || 'RULE',
    creator: payload.creator || 'demo_user',
    creatorName: payload.creatorName || payload.creator || 'demo_user',
    userCount: payload.userCount || 0,
    status: payload.status || 'READY',
    schedule: payload.schedule || '手动更新',
    createTime: payload.createTime || makeTime(23, 9),
    ruleUpdateTime: payload.ruleUpdateTime || makeTime(23, 8),
    updateTime: makeTime(23, 18),
  };
  groups = [next, ...groups];
  return next;
}

export function deleteGroup(id: string) {
  groups = groups.filter((item) => item.id !== id);
}

export function batchEditGroups(ids: string[]) {
  groups = groups.map((item) =>
    ids.includes(item.id) ? { ...item, updateTime: makeTime(23, 19), schedule: '批量修改后每周三 10:00' } : item,
  );
}

export function exportGroup(id: string) {
  const found = groups.find((item) => item.id === id);
  return {
    fileName: `${found?.groupCode || 'group'}.csv`,
    content: ['groupCode,groupName,userCount', `${found?.groupCode || ''},${found?.groupName || ''},${found?.userCount || 0}`].join('\n'),
  };
}

export function countGroup(id: string) {
  return groups.find((item) => item.id === id)?.userCount ?? 0;
}

export function querySqlGroups(params: {
  keyword?: string;
  sqlGroupCode?: string;
  name?: string;
  status?: string;
  application?: string;
  ownerName?: string;
  creatorName?: string;
  pageNo?: number;
  pageSize?: number;
}) {
  const keyword = params.keyword?.trim();
  const ownerName = params.ownerName?.trim();
  const list = sqlGroups.filter((item) => {
    const hitKeyword = !keyword || [item.sqlGroupCode, item.name, item.application].some((v) => includesKeyword(v, keyword));
    const hitOwner = !ownerName || includesKeyword(item.ownerName, ownerName);
    const hitCode = !params.sqlGroupCode || includesKeyword(item.sqlGroupCode, params.sqlGroupCode);
    const hitName = !params.name || includesKeyword(item.name, params.name);
    const hitStatus = !params.status || item.status === params.status;
    const hitApp = !params.application || includesKeyword(item.application, params.application);
    const hitCreator = !params.creatorName || includesKeyword(item.creatorName, params.creatorName);
    return hitKeyword && hitOwner && hitCode && hitName && hitStatus && hitApp && hitCreator;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveSqlGroup(payload: Partial<SqlGroupItem>) {
  if (payload.id) {
    sqlGroups = sqlGroups.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            ...payload,
            notifyUsers: payload.notifyUsers || item.notifyUsers,
            shareeUsers: payload.shareeUsers || item.shareeUsers,
            shareePlat: payload.shareePlat || item.shareePlat,
            metricsCode: payload.metricsCode || item.metricsCode,
            ruleCodes: payload.ruleCodes || item.ruleCodes,
            runtimeStatus: payload.runtimeStatus || item.runtimeStatus || 'IDLE',
            updateTime: makeTime(23, 19),
          } as SqlGroupItem
        : item,
    );
    return sqlGroups.find((item) => item.id === payload.id) ?? null;
  }
  const next: SqlGroupItem = {
    id: nextId('sql-group'),
    sqlGroupCode: payload.sqlGroupCode || nextId('sql_group_code'),
    name: payload.name || '新建 SQL 人群',
    desc: payload.desc || '新建 SQL 人群描述',
    groupType: payload.groupType || '动态人群',
    ruleCodes: payload.ruleCodes || [],
    metricsCode: payload.metricsCode || [metricsList[0].code],
    timing: payload.timing || '每天',
    execTime: payload.execTime || '07:00',
    shareeUsers: payload.shareeUsers || ['demo_user'],
    shareePlat: payload.shareePlat || ['barrett'],
    dbName: payload.dbName || 'ec_user_tag',
    tableName: payload.tableName || 'user_profile_di',
    status: payload.status || 'DISABLE',
    maxExecuteTime: payload.maxExecuteTime || 4,
    cnt: payload.cnt || 0,
    application: payload.application || 'barrett',
    ownerName: payload.ownerName || 'demo_user',
    creatorName: payload.creatorName || 'demo_user',
    permission: payload.permission || ['edit', 'push', 'execute', 'delete'],
    pushStatus: payload.pushStatus ?? false,
    runtimeStatus: payload.runtimeStatus || 'IDLE',
    sqlText: payload.sqlText || "select user_id from ec_user_tag.user_profile_di where active_days_30 > 10",
    notifyUsers: payload.notifyUsers || ['demo_user'],
    updateTime: makeTime(23, 19),
    createTime: makeTime(23, 10),
  };
  sqlGroups = [next, ...sqlGroups];
  return next;
}

export function deleteSqlGroup(id: string) {
  sqlGroups = sqlGroups.filter((item) => item.id !== id);
}

export function changeSqlGroupStatus(id: string, action: 'startPush' | 'stopPush') {
  sqlGroups = sqlGroups.map((item) =>
    item.id === id
      ? {
          ...item,
          status: action === 'startPush' ? 'ENABLE' : 'DISABLE',
          pushStatus: action === 'startPush',
          runtimeStatus: action === 'startPush' ? 'WAITING' : 'IDLE',
          updateTime: makeTime(23, 19),
        }
      : item,
  );
}

export function executeSqlGroup(id: string, mode: 'EXECUTE' | 'PUSH' | 'ALL') {
  const found = sqlGroups.find((item) => item.id === id);
  sqlGroups = sqlGroups.map((item) =>
    item.id === id
      ? {
          ...item,
          runtimeStatus: mode === 'PUSH' ? 'PUSHING' : mode === 'ALL' ? 'RUNNING' : 'RUNNING',
          updateTime: makeTime(23, 19),
        }
      : item,
  );
  return {
    success: true,
    result: `${found?.name || id} 已执行 ${mode === 'EXECUTE' ? '仅计算' : mode === 'PUSH' ? '仅推送' : '计算及推送'}`,
  };
}

export function sampleSqlGroup(id: string, ids: string[]) {
  return ids.map((userId, index) => `${userId}: ${index % 2 === 0 ? '命中' : '未命中'}`).join('\n');
}

export function transferSqlGroupOwner(id: string, ownerName: string) {
  sqlGroups = sqlGroups.map((item) =>
    item.id === id ? { ...item, ownerName, updateTime: makeTime(23, 19) } : item,
  );
}

export function exportSqlGroup(id: string) {
  const found = sqlGroups.find((item) => item.id === id);
  return {
    fileName: `${found?.sqlGroupCode || 'sql-group'}.csv`,
    content: ['sqlGroupCode,name,cnt,application', `${found?.sqlGroupCode || ''},${found?.name || ''},${found?.cnt || 0},${found?.application || ''}`].join('\n'),
  };
}

export function queryTimings(params: {
  keyword?: string;
  groupCode?: string;
  metricsCode?: string;
  timing?: string;
  status?: string;
  application?: string;
  isFullData?: string;
  creatorName?: string;
  targetType?: string;
  pageNo?: number;
  pageSize?: number;
}) {
  const keyword = params.keyword?.trim();
  const targetType = params.targetType?.trim();
  const list = timings.filter((item) => {
    const hitKeyword = !keyword || [item.taskCode, item.taskName, item.owner].some((v) => includesKeyword(v, keyword));
    const hitType = !targetType || item.targetType === targetType;
    const hitGroupCode = !params.groupCode || includesKeyword(item.groupCode || '', params.groupCode);
    const hitMetricsCode = !params.metricsCode || (item.metricsCode || []).some((v) => includesKeyword(v, params.metricsCode!));
    const hitTiming = !params.timing || includesKeyword(item.cron, params.timing);
    const hitStatus = !params.status || item.status === params.status;
    const hitApp = !params.application || includesKeyword(item.application || '', params.application);
    const hitFullData = !params.isFullData || String(item.isFullData) === params.isFullData;
    const hitCreator = !params.creatorName || includesKeyword(item.creatorName || item.owner, params.creatorName);
    return hitKeyword && hitType && hitGroupCode && hitMetricsCode && hitTiming && hitStatus && hitApp && hitFullData && hitCreator;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveTiming(payload: Partial<TimingItem>) {
  if (payload.id) {
    timings = timings.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            ...payload,
            timing: payload.timing || item.timing,
            pushConf: payload.pushConf || item.pushConf,
            updateTime: makeTime(23, 19),
          } as TimingItem
        : item,
    );
    return timings.find((item) => item.id === payload.id) ?? null;
  }
  const next: TimingItem = {
    id: nextId('timing'),
    groupCode: payload.groupCode || groups[0].groupCode,
    groupName: payload.groupName || groups[0].groupName,
    taskCode: payload.taskCode || nextId('timing_code'),
    taskName: payload.taskName || '新建定时任务',
    cron: payload.cron || '0 0 9 * * ?',
    timing: payload.timing || '每天 09:00',
    metricsCode: payload.metricsCode || [metricsList[0].code],
    application: payload.application || 'barrett',
    isFullData: payload.isFullData ?? true,
    type: payload.type || 'FULL',
    pushType: payload.pushType || 'KAFKA',
    pushConf: payload.pushConf || { topic: 'tag_timing_topic_new', server: 'push-1.internal' },
    nextRunTime: makeTime(24, 9),
    owner: payload.owner || 'demo_user',
    creatorName: payload.creatorName || payload.owner || 'demo_user',
    createTime: payload.createTime || makeTime(24, 8),
    updateTime: payload.updateTime || makeTime(24, 8, 30),
    status: payload.status || 'ENABLE',
    targetType: payload.targetType || 'TAG',
  };
  timings = [next, ...timings];
  return next;
}

export function deleteTiming(id: string) {
  timings = timings.filter((item) => item.id !== id);
}

export function runTiming(id: string) {
  return timings.find((item) => item.id === id) ?? null;
}

export function toggleTimingStatus(id: string) {
  timings = timings.map((item) =>
    item.id === id ? { ...item, status: item.status === 'ENABLE' ? 'DISABLE' : 'ENABLE' } : item,
  );
}

export function getTimingTaskDetail(id: string) {
  const found = timings.find((item) => item.id === id);
  return {
    id,
    steps: [
      {
        name: '读取指标配置',
        status: 'SUCCESS',
        detail: {
          nodeName: 'read_metric_config',
          executor: found?.owner,
          triggerTime: found?.updateTime,
          duration: '12s',
          application: found?.application,
          message: '已读取推送属性、人群配置和调度参数。',
          logs: ['开始加载指标配置', '完成推送属性映射', '任务进入下一节点'],
        },
      },
      {
        name: '执行圈选逻辑',
        status: found?.status === 'ENABLE' ? 'SUCCESS' : 'SKIPPED',
        detail: {
          nodeName: 'execute_group_task',
          executor: 'sql-engine',
          triggerTime: found?.updateTime,
          duration: found?.status === 'ENABLE' ? '1m 24s' : '0s',
          application: found?.application,
          message: found?.status === 'ENABLE' ? '已完成圈选逻辑计算，并输出结果表。' : '任务处于停用状态，本步骤跳过执行。',
          logs: found?.status === 'ENABLE'
            ? ['初始化 Spark 任务', '加载目标人群配置', '生成结果表快照']
            : ['任务停用，节点跳过'],
        },
      },
      {
        name: '推送下游系统',
        status: found?.application ? 'SUCCESS' : 'PENDING',
        detail: {
          nodeName: 'push_downstream',
          executor: 'push-worker',
          triggerTime: found?.updateTime,
          duration: found?.application ? '18s' : '0s',
          application: found?.application,
          message: found?.application ? `已将任务结果推送至 ${found.application}。` : '未配置推送系统，等待处理。',
          logs: found?.application
            ? [`连接 ${found.application} 推送网关`, '写入 topic 并等待回执', '推送完成']
            : ['当前未配置推送系统'],
        },
      },
    ],
  };
}

export function querySystemAuth(params: { appName?: string; pageNo?: number; pageSize?: number }) {
  const appName = params.appName?.trim();
  const list = systemAuthList.filter((item) => !appName || item.appName === appName);
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveSystemAuth(payload: Partial<SystemAuthItem>) {
  if (payload.id) {
    systemAuthList = systemAuthList.map((item) =>
      item.id === payload.id ? { ...item, ...payload, updateTime: makeTime(23, 18) } as SystemAuthItem : item,
    );
    return systemAuthList.find((item) => item.id === payload.id) ?? null;
  }
  const next: SystemAuthItem = {
    id: nextId('sys-auth'),
    appName: payload.appName || 'barrett',
    authorities: payload.authorities || ['tag.read'],
    rule: payload.rule || ['READ'],
    group: payload.group || ['READ'],
    timing: payload.timing || ['READ'],
    creatorName: 'demo_user',
    createTime: makeTime(23, 17),
    updateTime: makeTime(23, 17),
  };
  systemAuthList = [next, ...systemAuthList];
  return next;
}

export function deleteSystemAuth(id: string) {
  systemAuthList = systemAuthList.filter((item) => item.id !== id);
}

export function querySystemApps(params: { pageNo?: number; pageSize?: number }) {
  return paginate(systemApps, params.pageNo, params.pageSize);
}

export function saveSystemApp(payload: Partial<SystemAppItem>) {
  if (payload.id) {
    systemApps = systemApps.map((item) =>
      item.id === payload.id ? { ...item, ...payload, updateTime: makeTime(23, 18) } as SystemAppItem : item,
    );
    return systemApps.find((item) => item.id === payload.id) ?? null;
  }
  const next: SystemAppItem = {
    id: nextId('sys-app'),
    appName: payload.appName || 'new-app',
    pushType: payload.pushType || 'KAFKA',
    superintendent: payload.superintendent || 'demo_user',
    pushConf: payload.pushConf || { topic: 'tag_topic_new', server: 'kafka-1.internal', subAppName: ['datamap'] },
    callbackUrls: payload.callbackUrls || { kafkaPushCallbackUrl: 'https://callback.example.com/tag/new', sqlRuleCallbackUrl: '/api/tag/callback/new' },
    createTime: makeTime(23, 17),
    updateTime: makeTime(23, 17),
  };
  systemApps = [next, ...systemApps];
  return next;
}

export function deleteSystemApp(id: string) {
  systemApps = systemApps.filter((item) => item.id !== id);
}

export function queryContentAuth(params: { chidoriName?: string; accessType?: string; type?: string; organizationId?: string; pageNo?: number; pageSize?: number }) {
  const list = contentAuthList.filter((item) => {
    const hitName = !params.chidoriName || includesKeyword(item.chidoriName, params.chidoriName);
    const hitAccess = !params.accessType || item.accessType === params.accessType;
    const hitType = !params.type || item.type === params.type;
    const hitOrg = !params.organizationId || item.organizationId.includes(params.organizationId);
    return hitName && hitAccess && hitType && hitOrg;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveContentAuth(payload: Partial<ContentAuthItem>) {
  if (payload.id) {
    contentAuthList = contentAuthList.map((item) =>
      item.id === payload.id ? { ...item, ...payload, updateTime: makeTime(23, 18) } as ContentAuthItem : item,
    );
    return contentAuthList.find((item) => item.id === payload.id) ?? null;
  }
  const next: ContentAuthItem = {
    id: nextId('content-auth'),
    chidoriName: payload.chidoriName || '新建角色',
    accessType: payload.accessType || 'READ',
    type: (payload.type as 'RULE' | 'GROUP') || 'RULE',
    organizationId: payload.organizationId || [],
    createTime: makeTime(23, 17),
    updateTime: makeTime(23, 17),
  };
  contentAuthList = [next, ...contentAuthList];
  return next;
}

export function deleteContentAuth(id: string) {
  contentAuthList = contentAuthList.filter((item) => item.id !== id);
}

export function getCategoryTree() {
  return structuredClone(categoryTree);
}

function walkCategoryTree(node: CategoryNode, cb: (node: CategoryNode) => void) {
  cb(node);
  node.children?.forEach((child) => walkCategoryTree(child, cb));
}

export function saveCategory(payload: Partial<CategoryNode>) {
  if (payload.id) {
    walkCategoryTree(categoryTree, (node) => {
      if (node.id === payload.id) {
        node.metricsName = payload.metricsName || node.metricsName;
        node.metricsDesc = payload.metricsDesc ?? node.metricsDesc;
      }
    });
    return;
  }
  const parentId = payload.parentId || 'cat-root';
  const next: CategoryNode = {
    id: nextId('cat'),
    parentId,
    metricsName: payload.metricsName || '新建分类',
    metricsDesc: payload.metricsDesc || '',
  };
  walkCategoryTree(categoryTree, (node) => {
    if (node.id === parentId) {
      node.children = node.children || [];
      node.children.push(next);
    }
  });
}

export function deleteCategory(id: string) {
  function remove(children?: CategoryNode[]) {
    if (!children) return [];
    return children
      .filter((child) => child.id !== id)
      .map((child) => ({ ...child, children: remove(child.children) }));
  }
  categoryTree = { ...categoryTree, children: remove(categoryTree.children) };
}

export function queryWhiteList(params: { dbName?: string; tableName?: string; usedType?: string; pageNo?: number; pageSize?: number }) {
  const list = whiteList.filter((item) => {
    const hitDb = !params.dbName || includesKeyword(item.dbName, params.dbName);
    const hitTable = !params.tableName || includesKeyword(item.tableName, params.tableName);
    const hitType = !params.usedType || item.usedType.includes(params.usedType);
    return hitDb && hitTable && hitType;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveWhiteList(payload: Partial<WhiteListItem>) {
  const next: WhiteListItem = {
    id: nextId('white'),
    dbName: payload.dbName || 'dwd_user',
    tableName: payload.tableName || 'new_table',
    dsProjectName: payload.dsProjectName || 'tag-platform',
    dsProcessName: payload.dsProcessName || 'daily_sync',
    usedType: payload.usedType || ['RULE'],
    usedNum: payload.usedNum || 0,
    creator: 'demo_user',
    createTime: makeTime(23, 18),
  };
  whiteList = [next, ...whiteList];
  return next;
}

export function deleteWhiteList(id: string) {
  whiteList = whiteList.filter((item) => item.id !== id);
}

export function getWhiteListUsage(dbName: string, tableName: string) {
  return {
    used: tableName.includes('record') || tableName.includes('profile'),
    mes: `${dbName}.${tableName} 正被 2 个标签、1 个人群、1 个 SQL 人群引用`,
    items: [
      { type: 'RULE', code: 'rule_001', name: '高风险用户' },
      { type: 'GROUP', code: 'group_001', name: '营销触达人群' },
      { type: 'SQL_GROUP', code: 'sql_group_001', name: '近30天高活跃 SQL 人群' },
    ],
  };
}

export function queryUserPictures(params: { pageNo?: number; pageSize?: number }) {
  return paginate(userPictures, params.pageNo, params.pageSize);
}

export function saveUserPicture(payload: Partial<UserPictureItem>) {
  if (payload.id) {
    userPictures = userPictures.map((item) =>
      item.id === payload.id ? { ...item, ...payload } as UserPictureItem : item,
    );
    return userPictures.find((item) => item.id === payload.id) ?? null;
  }
  const next: UserPictureItem = {
    id: nextId('profile'),
    userProfileName: payload.userProfileName || '新建画像属性',
    dimension: payload.dimension || 'BASE',
    metrics: payload.metrics || {
      metricsType: 'ATOMIC',
      metricsCode: metricsList[0].code,
      metricsName: metricsList[0].name,
    },
  };
  userPictures = [next, ...userPictures];
  return next;
}

export function deleteUserPicture(id: string) {
  userPictures = userPictures.filter((item) => item.id !== id);
}

export function getUserSearchOptions() {
  return {
    groups: groups.map((item) => ({ value: item.groupCode, label: item.groupName })),
    rules: ruleTags.map((item) => ({ value: item.code, label: item.name })),
  };
}

export function searchUsers(payload: { userIds: string[]; groupCodes?: string[]; ruleCodes?: string[]; pageNo?: number; pageSize?: number }): UserSearchResult {
  const fields = payload.groupCodes?.length
    ? payload.groupCodes.map((code) => ({
        key: code,
        title: groups.find((item) => item.groupCode === code)?.groupName || code,
      }))
    : (payload.ruleCodes || []).map((code) => ({
        key: code,
        title: ruleTags.find((item) => item.code === code)?.name || code,
      }));
  const items = payload.userIds.map((userId, idx) => {
    const row: Record<string, string | number> = { _rowKey: `${userId}-${idx}`, user_id: userId };
    fields.forEach((field, fieldIdx) => {
      row[field.key] = (idx + fieldIdx) % 2 === 0 ? '命中' : '未命中';
    });
    return row;
  });
  return {
    columns: [{ key: 'user_id', title: '用户ID' }, ...fields],
    items,
    total: items.length,
  };
}

export function exportUsers(payload: { userIds: string[] }) {
  return {
    fileName: 'user-search.csv',
    content: ['user_id', ...payload.userIds].join('\n'),
  };
}

export function queryTestData(params: { ruleCode?: string; userId?: string; pageNo?: number; pageSize?: number }) {
  const list = testDataRecords.filter((item) => {
    const hitRule = !params.ruleCode || includesKeyword(item.ruleCode, params.ruleCode);
    const rawUserIds = Array.isArray(item.userId) ? item.userId.join(',') : item.userId;
    const hitUser = !params.userId || includesKeyword(rawUserIds, params.userId);
    return hitRule && hitUser;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveTestData(payload: Partial<TestDataRecord>) {
  if (payload.id) {
    testDataRecords = testDataRecords.map((item) =>
      item.id === payload.id
        ? { ...item, ...payload, updateTime: makeTime(23, 19) } as TestDataRecord
        : item,
    );
    return testDataRecords.find((item) => item.id === payload.id) ?? null;
  }
  const next: TestDataRecord = {
    id: nextId('mock'),
    ruleCode: payload.ruleCode || ruleTags[0].code,
    userId: payload.userId || ['u10001', 'u10002'],
    creatorName: payload.creatorName || 'demo_user',
    createTime: makeTime(23, 19),
    updateTime: makeTime(23, 19),
    dataMockType: payload.dataMockType || 'RULE',
    metricsInfo: payload.metricsInfo || [],
  };
  testDataRecords = [next, ...testDataRecords];
  return next;
}

export function deleteTestData(id: string) {
  testDataRecords = testDataRecords.filter((item) => item.id !== id);
}

export function getStatMeta() {
  return {
    apps: enumMaps.appNames,
    modules: enumMaps.statModules,
    urls: [
      { value: '/tag/metric/detail', label: '/tag/metric/detail' },
      { value: '/tag/rule/detail', label: '/tag/rule/detail' },
      { value: '/tag/group/detail', label: '/tag/group/detail' },
    ],
    codes: metricsList.slice(0, 8).map((item) => ({ value: item.code, label: item.code })),
  };
}

export function queryStat(payload: { tab: string; type: string; appName?: string; code?: string; url?: string; startDate?: string; endDate?: string }) {
  const rows: StatResultRow[] = Array.from({ length: 8 }, (_, i) =>
    payload.tab === 'content'
      ? {
          rowKey: `stat-${i}`,
          app: enumMaps.appNames[i % enumMaps.appNames.length].label,
          cnt: 100 + i * 17,
        }
      : {
          rowKey: `stat-${i}`,
          code: metricsList[i % metricsList.length].code,
          cnt: 120 + i * 13,
        },
  );
  const points: StatPoint[] = Array.from({ length: 7 }, (_, dayIdx) =>
    rows.flatMap((row) => [
      {
        date: `2026-04-${String(dayIdx + 1).padStart(2, '0')}`,
        code: row.code,
        app: row.app,
        cnt: row.cnt - 10 + dayIdx * 3,
      },
    ]),
  );
  return { rows, points };
}

export function getBloodline(params: { code?: string; dep?: number; type?: string }) {
  const found = bloodlineNodes.find((item) => item.code === params.code) || bloodlineNodes[0];
  if (params.dep === -1) {
    return bloodlineNodes.filter((item) => found.upstream.includes(item.code));
  }
  if (params.dep === 1) {
    return bloodlineNodes.filter((item) => found.downstream.includes(item.code));
  }
  return [found];
}

export function getBloodlineDetail(code: string) {
  return bloodlineNodes.find((item) => item.code === code) || null;
}

export function exportBloodline(code: string) {
  const lines = bloodlineNodes
    .filter((item) => item.code === code || item.upstream.includes(code) || item.downstream.includes(code))
    .map((item) => `${item.code},${item.name},${item.type}`);
  return {
    fileName: `bloodline-${code}.csv`,
    content: ['code,name,type', ...lines].join('\n'),
  };
}

export function getOrganizations(type: 'RULE' | 'GROUP') {
  return type === 'RULE' ? organizationOptions.rule : organizationOptions.group;
}

export function getTagOpsDbList() {
  return Object.keys(tagOpsDbMap);
}

export function getTagOpsTableList(dbName: string) {
  return tagOpsDbMap[dbName] || [];
}

export function getTagOpsOverview(params: { tableNames?: string[] }) {
  const factor = Math.max(params.tableNames?.length || 0, 1);
  const result: TagOpsOverview = {
    validMetricsCount: 12 * factor,
    validTagsCount: 18 * factor,
    validGroupsCount: 6 * factor,
    validTimingJobsCount: 4 * factor,
  };
  return result;
}

export function getTagOpsSection(section: keyof typeof tagOpsSections, params: { pageNo?: number; pageSize?: number; keyword?: string }) {
  const keyword = params.keyword?.trim();
  const source = tagOpsSections[section].filter((item) => !keyword || [item.code, item.name, item.owner].some((v) => includesKeyword(v, keyword)));
  return paginate(source, params.pageNo, params.pageSize);
}

export function getTagOpsExecRecords(params: { pageNo?: number; pageSize?: number }) {
  return paginate(tagOpsExecRecords, params.pageNo, params.pageSize);
}

export function exportTagOps(params: { dbName: string; tableNames: string[] }) {
  return {
    fileName: 'tag-ops-export.csv',
    content: [
      'dbName,tableName',
      ...params.tableNames.map((tableName) => `${params.dbName},${tableName}`),
    ].join('\n'),
  };
}

export function generateTestData(payload: { scene: string; count: number; seed?: string }) {
  return Array.from({ length: payload.count }, (_, i) => ({
    userId: `mock_user_${payload.seed || 'seed'}_${i + 1}`,
    mobile: `1380000${String(100 + i).padStart(4, '0')}`,
    scene: payload.scene,
    score: 60 + (i % 35),
    tags: [ruleTags[i % ruleTags.length].code, ruleTags[(i + 1) % ruleTags.length].code],
  }));
}
