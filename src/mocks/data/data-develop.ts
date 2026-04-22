export interface TaskTreeNode {
  id: string;
  key: string;
  taskName: string;
  itemType: 'DATABASE' | 'DIRECTORY' | 'TASK';
  productionTaskStatus?: 'ONLINE' | 'ONLINE_HAS_DIFF' | 'OFFLINE_HAS_DIFF' | 'NO_PRODUCTION_TASK';
  owner?: string;
  taskType?: string;
  database?: string;
  updatedAt?: string;
  description?: string;
  children?: TaskTreeNode[];
  isLeaf?: boolean;
}

const databases = ['dwd_risk', 'dwd_ops', 'dwd_growth', 'dws_user', 'ads_bi'];
const owners = ['sunwei', 'lihua', 'zhangsan', 'liubei', 'hanmeimei'];
const taskTypes = ['HIVE_SQL', 'SPARK_SQL', 'PRESTO', 'FLINK_SQL', 'NOTEBOOK'];
const taskStatuses: TaskTreeNode['productionTaskStatus'][] = [
  'ONLINE',
  'ONLINE_HAS_DIFF',
  'OFFLINE_HAS_DIFF',
  'NO_PRODUCTION_TASK',
];

const sampleTaskNames = [
  '用户活跃度日汇总',
  '风控名单宽表',
  '信贷放款明细',
  '用户画像特征',
  '渠道归因',
  '订单漏斗分析',
  '资金流水明细',
  '逾期回收指标',
  '营销活动效果',
  'APP 崩溃监控',
  '新客留存分析',
  '风险等级评分',
  '人群圈选任务',
  '还款预测模型',
  '业绩排名看板',
];

function seedPick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

const directoryNames = ['原始层', '明细层', '汇总层', '应用层', '临时分析'];

function buildTasks(prefix: string, count: number, startIndex: number): TaskTreeNode[] {
  const list: TaskTreeNode[] = [];
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    list.push({
      id: `${prefix}-task-${idx}`,
      key: `${prefix}-task-${idx}`,
      taskName: `${seedPick(sampleTaskNames, idx)}_${String(idx).padStart(3, '0')}`,
      itemType: 'TASK',
      productionTaskStatus: seedPick(taskStatuses, idx)!,
      owner: seedPick(owners, idx),
      taskType: seedPick(taskTypes, idx),
      database: seedPick(databases, idx),
      updatedAt: `2025-${String(((idx % 9) + 1)).padStart(2, '0')}-${String(((idx % 27) + 1)).padStart(2, '0')} 14:22:${String(idx % 60).padStart(2, '0')}`,
      description: `任务 ${seedPick(sampleTaskNames, idx)} 的增量计算逻辑`,
      isLeaf: true,
    });
  }
  return list;
}

export const buildTaskTree = (): TaskTreeNode[] => {
  let taskSeed = 0;
  return databases.map((db, dbIdx) => {
    const dirs: TaskTreeNode[] = directoryNames.map((dirName, dirIdx) => {
      const count = 4 + ((dbIdx + dirIdx) % 5);
      const tasks = buildTasks(`${db}-${dirIdx}`, count, taskSeed);
      taskSeed += count;
      return {
        id: `${db}-dir-${dirIdx}`,
        key: `${db}-dir-${dirIdx}`,
        taskName: dirName,
        itemType: 'DIRECTORY',
        children: tasks,
      };
    });
    return {
      id: `${db}-root`,
      key: `${db}-root`,
      taskName: db,
      itemType: 'DATABASE',
      database: db,
      children: dirs,
    };
  });
};

export const databaseOptions = databases.map((v) => ({ label: v, value: v }));
export const ownerOptions = owners.map((v) => ({ label: v, value: v }));
export const taskTypeOptions = taskTypes.map((v) => ({ label: v, value: v }));

export interface TaskDetail {
  taskId: string;
  taskName: string;
  taskType: string;
  database: string;
  owner: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  retryTimes: number;
  timeout: number;
  updatedAt: string;
  createdAt: string;
  content: string;
}

const SAMPLE_SQL = `-- 示例 SQL：用户活跃度日汇总
WITH base AS (
  SELECT
    user_id,
    event_date,
    COUNT(DISTINCT session_id) AS session_cnt,
    SUM(duration_ms) / 1000 AS active_seconds
  FROM dwd.user_event_detail
  WHERE event_date = '\${bizdate}'
    AND app_id = 'fintopia_cn'
  GROUP BY user_id, event_date
)
INSERT OVERWRITE TABLE ads.user_active_daily PARTITION (dt='\${bizdate}')
SELECT
  user_id,
  session_cnt,
  active_seconds,
  CASE
    WHEN active_seconds >= 600 THEN 'HIGH'
    WHEN active_seconds >= 60  THEN 'MID'
    ELSE 'LOW'
  END AS activity_level
FROM base
WHERE session_cnt > 0
;`;

export const buildTaskDetail = (taskId: string): TaskDetail => {
  const idx = parseInt(taskId.replace(/\D/g, ''), 10) || 1;
  return {
    taskId,
    taskName: `${seedPick(sampleTaskNames, idx)}_${String(idx).padStart(3, '0')}`,
    taskType: seedPick(taskTypes, idx),
    database: seedPick(databases, idx),
    owner: seedPick(owners, idx),
    description: '增量计算任务，每日 02:00 调度',
    priority: (['P0', 'P1', 'P2', 'P3'] as const)[idx % 4],
    retryTimes: 3,
    timeout: 3600,
    createdAt: '2025-03-12 10:20:00',
    updatedAt: '2025-10-08 14:22:11',
    content: SAMPLE_SQL,
  };
};

export interface RunRecord {
  id: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  rowCount: number;
  engine: string;
  operator: string;
}

export const buildRunRecords = (): RunRecord[] => {
  const now = Date.now();
  return Array.from({ length: 12 }).map((_, i) => {
    const start = new Date(now - (i + 1) * 1800000);
    const end = new Date(start.getTime() + 240000 + (i % 5) * 30000);
    const status: RunRecord['status'] = i === 0 ? 'RUNNING' : i === 2 ? 'FAILED' : 'SUCCESS';
    return {
      id: `run-${now}-${i}`,
      startTime: start.toLocaleString('zh-CN', { hour12: false }),
      endTime: status === 'RUNNING' ? '-' : end.toLocaleString('zh-CN', { hour12: false }),
      duration: status === 'RUNNING' ? '-' : `${4 + (i % 5)}m ${(i * 7) % 60}s`,
      status,
      rowCount: status === 'SUCCESS' ? 102400 - i * 233 : 0,
      engine: seedPick(['Spark 3.3', 'Presto 0.28', 'Flink 1.17', 'Hive 3.1'], i),
      operator: seedPick(owners, i),
    };
  });
};

export interface QueryResult {
  columns: { title: string; dataIndex: string; key: string }[];
  rows: Record<string, string | number>[];
  total: number;
  costMs: number;
}

export const buildQueryResult = (): QueryResult => {
  const columns = [
    { title: 'user_id', dataIndex: 'user_id', key: 'user_id' },
    { title: 'event_date', dataIndex: 'event_date', key: 'event_date' },
    { title: 'session_cnt', dataIndex: 'session_cnt', key: 'session_cnt' },
    { title: 'active_seconds', dataIndex: 'active_seconds', key: 'active_seconds' },
    { title: 'activity_level', dataIndex: 'activity_level', key: 'activity_level' },
  ];
  const rows = Array.from({ length: 50 }).map((_, i) => ({
    user_id: 1000000 + i,
    event_date: '2026-04-22',
    session_cnt: 1 + ((i * 7) % 12),
    active_seconds: 30 + ((i * 37) % 1200),
    activity_level: i % 3 === 0 ? 'HIGH' : i % 3 === 1 ? 'MID' : 'LOW',
  }));
  return { columns, rows, total: 10240, costMs: 1268 };
};

export interface VersionItem {
  version: string;
  versionId: string;
  submitter: string;
  submittedAt: string;
  env: 'DEV' | 'PROD';
  changes: number;
  description: string;
}

export const buildVersions = (): VersionItem[] => [
  {
    version: 'v1.9.0',
    versionId: 'v19',
    submitter: 'sunwei',
    submittedAt: '2025-10-08 14:22',
    env: 'PROD',
    changes: 18,
    description: '修复：活跃等级阈值调整；过滤异常 session',
  },
  {
    version: 'v1.8.2',
    versionId: 'v182',
    submitter: 'sunwei',
    submittedAt: '2025-10-01 09:51',
    env: 'PROD',
    changes: 4,
    description: '优化：去除空 session_id 的记录',
  },
  {
    version: 'v1.8.1',
    versionId: 'v181',
    submitter: 'lihua',
    submittedAt: '2025-09-23 20:13',
    env: 'PROD',
    changes: 22,
    description: '新增：活跃等级 HIGH/MID/LOW 维度',
  },
  {
    version: 'v1.8.0',
    versionId: 'v18',
    submitter: 'lihua',
    submittedAt: '2025-09-15 16:02',
    env: 'PROD',
    changes: 61,
    description: '重构：切换新引擎 Spark 3.3 / 去除 MapReduce 代码',
  },
];

export interface ScheduleConfig {
  cron: string;
  startDate: string;
  endDate: string;
  retryTimes: number;
  timeout: number;
  onSuccess: string[];
  onFailure: string[];
  dependencies: Array<{ taskName: string; offset: string; strict: boolean }>;
}

export const buildScheduleConfig = (): ScheduleConfig => ({
  cron: '0 0 2 * * ?',
  startDate: '2025-03-12',
  endDate: '2099-12-31',
  retryTimes: 3,
  timeout: 3600,
  onSuccess: ['发钉钉', '写入监控'],
  onFailure: ['发钉钉', '发邮件', '告警升级'],
  dependencies: [
    { taskName: 'dwd.user_event_detail', offset: '0d', strict: true },
    { taskName: 'dim.user_info', offset: '-1d', strict: false },
    { taskName: 'dim.channel', offset: '0d', strict: true },
  ],
});

export interface MonitorRule {
  id: string;
  name: string;
  target: string;
  level: 'HIGH' | 'MID' | 'LOW';
  trigger: string;
  contactGroup: string;
  status: 'ENABLED' | 'DISABLED';
}

export const buildMonitorRules = (): MonitorRule[] => [
  {
    id: 'mon-1',
    name: '任务运行超时',
    target: '执行时长',
    level: 'HIGH',
    trigger: '> 60 min',
    contactGroup: '数据平台告警群',
    status: 'ENABLED',
  },
  {
    id: 'mon-2',
    name: '行数异常下跌',
    target: '产出行数',
    level: 'HIGH',
    trigger: '环比下跌 > 30%',
    contactGroup: '业务方钉钉群',
    status: 'ENABLED',
  },
  {
    id: 'mon-3',
    name: '失败任务',
    target: '运行状态',
    level: 'MID',
    trigger: '状态 = FAILED',
    contactGroup: '数据平台告警群',
    status: 'ENABLED',
  },
  {
    id: 'mon-4',
    name: '数据延迟',
    target: '完成时间',
    level: 'LOW',
    trigger: '晚于 06:00',
    contactGroup: '业务方钉钉群',
    status: 'DISABLED',
  },
];

export interface QualityRule {
  id: string;
  dimension: '完整性' | '准确性' | '一致性' | '时效性';
  name: string;
  target: string;
  expression: string;
  threshold: string;
  level: 'HIGH' | 'MID' | 'LOW';
  enabled: boolean;
}

export const buildQualityRules = (): QualityRule[] => [
  {
    id: 'q-1',
    dimension: '完整性',
    name: 'user_id 非空',
    target: 'user_id',
    expression: 'COUNT(user_id IS NULL) = 0',
    threshold: '允许空值：0',
    level: 'HIGH',
    enabled: true,
  },
  {
    id: 'q-2',
    dimension: '准确性',
    name: 'active_seconds 非负',
    target: 'active_seconds',
    expression: 'MIN(active_seconds) >= 0',
    threshold: '最小值 ≥ 0',
    level: 'MID',
    enabled: true,
  },
  {
    id: 'q-3',
    dimension: '一致性',
    name: 'activity_level 枚举值',
    target: 'activity_level',
    expression: "activity_level IN ('HIGH','MID','LOW')",
    threshold: '不在枚举内的记录：0',
    level: 'HIGH',
    enabled: true,
  },
  {
    id: 'q-4',
    dimension: '时效性',
    name: '产出时间在 06:00 前',
    target: 'task_finish_time',
    expression: "task_finish_time < '06:00:00'",
    threshold: '未达标次数 = 0',
    level: 'MID',
    enabled: false,
  },
];

export interface TaskParam {
  id: string;
  key: string;
  value: string;
  desc: string;
}

export const buildTaskParams = (): TaskParam[] => [
  { id: 'p-1', key: 'bizdate', value: '${yyyyMMdd}', desc: '业务日期（系统变量）' },
  { id: 'p-2', key: 'source_app_id', value: 'fintopia_cn', desc: '数据来源 App ID' },
  { id: 'p-3', key: 'min_session_cnt', value: '1', desc: '最小 session 数阈值' },
];

export interface TableTreeNode {
  id: string;
  key: string;
  title: string;
  itemType: 'DATABASE' | 'TABLE';
  owner?: string;
  env?: 'DEV' | 'PROD';
  rowCount?: number;
  storageSize?: string;
  updatedAt?: string;
  isLeaf?: boolean;
  children?: TableTreeNode[];
}

const sampleTableNames = [
  'user_event_detail',
  'user_profile',
  'loan_apply_detail',
  'loan_contract',
  'risk_user_label',
  'channel_attribution',
  'order_funnel_daily',
  'fund_flow_detail',
  'overdue_recovery_stats',
  'marketing_campaign_fact',
  'app_crash_log',
  'new_user_retention',
  'risk_rating_daily',
  'audience_segment',
  'repayment_prediction',
];

export const buildTableTree = (): TableTreeNode[] => {
  let i = 0;
  return databases.map((db) => {
    const tableCount = 6 + (db.length % 4);
    const tables: TableTreeNode[] = Array.from({ length: tableCount }).map(() => {
      const name = seedPick(sampleTableNames, i);
      const node: TableTreeNode = {
        id: `${db}.${name}_${i}`,
        key: `${db}.${name}_${i}`,
        title: `${name}_${String(i).padStart(2, '0')}`,
        itemType: 'TABLE',
        owner: seedPick(owners, i),
        env: i % 4 === 0 ? 'DEV' : 'PROD',
        rowCount: 20000 + (i * 1233) % 980000,
        storageSize: `${(0.3 + ((i * 7) % 27)).toFixed(1)} GB`,
        updatedAt: `2025-${String(((i % 9) + 1)).padStart(2, '0')}-${String(((i % 27) + 1)).padStart(2, '0')} 02:${String(i % 60).padStart(2, '0')}`,
        isLeaf: true,
      };
      i++;
      return node;
    });
    return {
      id: `${db}-root`,
      key: `${db}-root`,
      title: db,
      itemType: 'DATABASE',
      children: tables,
    };
  });
};

export interface TableColumn {
  name: string;
  type: string;
  comment: string;
  nullable: boolean;
  isPartition: boolean;
  primaryKey: boolean;
}

export interface TableDetail {
  tableId: string;
  tableName: string;
  database: string;
  owner: string;
  env: 'DEV' | 'PROD';
  rowCount: number;
  storageSize: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  lifecycle: number;
  storageFormat: 'PARQUET' | 'ORC' | 'TEXTFILE';
  columns: TableColumn[];
  partitions: Array<{ name: string; rowCount: number; size: string; createdAt: string }>;
}

export const buildTableDetail = (tableId: string): TableDetail => {
  const idx = parseInt(tableId.replace(/\D/g, ''), 10) || 1;
  const database = seedPick(databases, idx);
  const tableName = `${seedPick(sampleTableNames, idx)}_${String(idx).padStart(2, '0')}`;
  const columns: TableColumn[] = [
    { name: 'user_id', type: 'BIGINT', comment: '用户 ID', nullable: false, isPartition: false, primaryKey: true },
    { name: 'event_date', type: 'STRING', comment: '事件日期', nullable: false, isPartition: true, primaryKey: false },
    { name: 'session_cnt', type: 'INT', comment: '会话数', nullable: true, isPartition: false, primaryKey: false },
    { name: 'active_seconds', type: 'DOUBLE', comment: '活跃秒数', nullable: true, isPartition: false, primaryKey: false },
    { name: 'activity_level', type: 'STRING', comment: '活跃等级', nullable: true, isPartition: false, primaryKey: false },
    { name: 'updated_at', type: 'TIMESTAMP', comment: '更新时间', nullable: true, isPartition: false, primaryKey: false },
    { name: 'dt', type: 'STRING', comment: '分区日期', nullable: false, isPartition: true, primaryKey: false },
  ];
  const partitions = Array.from({ length: 6 }).map((_, i) => ({
    name: `dt=2025-10-${String(8 - i).padStart(2, '0')}`,
    rowCount: 120000 + i * 2000,
    size: `${(1.1 + i * 0.07).toFixed(2)} GB`,
    createdAt: `2025-10-${String(8 - i).padStart(2, '0')} 02:10:00`,
  }));
  return {
    tableId,
    tableName,
    database,
    owner: seedPick(owners, idx),
    env: idx % 4 === 0 ? 'DEV' : 'PROD',
    rowCount: 20000 + idx * 1233,
    storageSize: `${(0.3 + idx * 0.27).toFixed(1)} GB`,
    description: `${tableName} 的业务描述，供下游消费`,
    createdAt: '2025-03-12 10:20:00',
    updatedAt: '2025-10-08 02:15:10',
    lifecycle: 180,
    storageFormat: 'PARQUET',
    columns,
    partitions,
  };
};

export interface TableVersionItem {
  version: string;
  versionId: string;
  submitter: string;
  submittedAt: string;
  env: 'DEV' | 'PROD';
  changes: number;
  description: string;
  ddl: string;
}

const SAMPLE_DDL = `CREATE TABLE IF NOT EXISTS ads.user_active_daily (
  user_id          BIGINT    COMMENT '用户 ID',
  session_cnt      INT       COMMENT '会话数',
  active_seconds   DOUBLE    COMMENT '活跃秒数',
  activity_level   STRING    COMMENT '活跃等级'
)
COMMENT '用户活跃日汇总'
PARTITIONED BY (dt STRING COMMENT '分区日期')
STORED AS PARQUET
LIFECYCLE 180;`;

export const buildTableVersions = (): TableVersionItem[] => [
  {
    version: 'v3.2',
    versionId: 'tv32',
    submitter: 'sunwei',
    submittedAt: '2025-10-08 14:22',
    env: 'PROD',
    changes: 3,
    description: '新增 activity_level 字段',
    ddl: SAMPLE_DDL,
  },
  {
    version: 'v3.1',
    versionId: 'tv31',
    submitter: 'lihua',
    submittedAt: '2025-09-20 11:05',
    env: 'PROD',
    changes: 1,
    description: '调整 active_seconds 类型为 DOUBLE',
    ddl: SAMPLE_DDL.replace('active_seconds   DOUBLE', 'active_seconds   FLOAT'),
  },
  {
    version: 'v3.0',
    versionId: 'tv30',
    submitter: 'lihua',
    submittedAt: '2025-09-01 19:30',
    env: 'PROD',
    changes: 12,
    description: '全量重建表，切换为 PARQUET',
    ddl: SAMPLE_DDL,
  },
];

export interface TableAuth {
  id: string;
  user: string;
  scope: 'SELECT' | 'INSERT' | 'ALTER' | 'DROP';
  grantedBy: string;
  grantedAt: string;
  expireAt: string;
}

export const buildTableAuths = (): TableAuth[] => [
  {
    id: 'a-1',
    user: 'sunwei',
    scope: 'SELECT',
    grantedBy: 'admin',
    grantedAt: '2025-03-12 10:20',
    expireAt: '永久',
  },
  {
    id: 'a-2',
    user: 'lihua',
    scope: 'INSERT',
    grantedBy: 'admin',
    grantedAt: '2025-04-12 10:20',
    expireAt: '2026-04-12',
  },
  {
    id: 'a-3',
    user: 'zhangsan',
    scope: 'SELECT',
    grantedBy: 'sunwei',
    grantedAt: '2025-07-22 15:30',
    expireAt: '2026-01-22',
  },
  {
    id: 'a-4',
    user: 'liubei',
    scope: 'ALTER',
    grantedBy: 'admin',
    grantedAt: '2025-08-05 09:12',
    expireAt: '2026-08-05',
  },
];

export interface RecentTable {
  id: string;
  tableName: string;
  database: string;
  owner: string;
  lastVisit: string;
  rowCount: number;
  env: 'DEV' | 'PROD';
}

export const buildRecentTables = (): RecentTable[] => Array.from({ length: 8 }).map((_, i) => ({
  id: `rt-${i}`,
  tableName: `${seedPick(sampleTableNames, i)}_${String(i).padStart(2, '0')}`,
  database: seedPick(databases, i),
  owner: seedPick(owners, i),
  lastVisit: `2025-10-${String(8 - (i % 8)).padStart(2, '0')} ${String(9 + i).padStart(2, '0')}:15`,
  rowCount: 20000 + i * 12335,
  env: i % 4 === 0 ? 'DEV' : 'PROD',
}));

export const tableOwnerOptions = owners.map((v) => ({ label: v, value: v }));
export const tableDatabaseOptions = databases.map((v) => ({ label: v, value: v }));
