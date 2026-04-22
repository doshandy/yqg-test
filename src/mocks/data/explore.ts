/**
 * SQL 查询模块 mock 数据
 * 参考 cn-data-lumina 的 explore/sql 模块做 UI 骨架复刻。
 */

export interface DbTable {
  key: string;
  title: string;
  type: 'database' | 'table' | 'column';
  dataType?: string;
  comment?: string;
  children?: DbTable[];
}

export interface FolderNode {
  key: string;
  title: string;
  type: 'folder' | 'file';
  creator?: string;
  updatedAt?: string;
  children?: FolderNode[];
}

export interface AnalysisTaskNode {
  key: string;
  title: string;
  type: 'folder' | 'task';
  status?: 'SUCCESS' | 'RUNNING' | 'FAILED' | 'DRAFT';
  owner?: string;
  updatedAt?: string;
  children?: AnalysisTaskNode[];
}

export interface SqlHistoryItem {
  id: string;
  sqlText: string;
  database: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  startTime: string;
  duration: number;
  rows: number;
}

export interface TempTableItem {
  id: string;
  name: string;
  columns: number;
  rows: number;
  uploadTime: string;
  creator: string;
  size: string;
}

const DATABASES = ['ods_db', 'dwd_db', 'dws_db', 'ads_db', 'dim_db'];
const TABLE_THEMES: Record<string, string[]> = {
  ods_db: [
    'ods_user_info_df',
    'ods_order_info_df',
    'ods_pay_record_df',
    'ods_credit_apply_df',
    'ods_repayment_plan_df',
  ],
  dwd_db: [
    'dwd_user_detail_df',
    'dwd_order_detail_df',
    'dwd_loan_detail_df',
    'dwd_overdue_detail_df',
  ],
  dws_db: ['dws_user_monthly_df', 'dws_order_daily_df', 'dws_risk_monthly_df'],
  ads_db: ['ads_user_growth_df', 'ads_business_daily_df', 'ads_risk_report_df'],
  dim_db: ['dim_user', 'dim_product', 'dim_region', 'dim_date'],
};

const COLUMN_TEMPLATE = [
  { name: 'id', type: 'bigint', comment: '主键' },
  { name: 'user_id', type: 'bigint', comment: '用户ID' },
  { name: 'amount', type: 'decimal(18,2)', comment: '金额' },
  { name: 'status', type: 'string', comment: '状态' },
  { name: 'create_time', type: 'timestamp', comment: '创建时间' },
  { name: 'update_time', type: 'timestamp', comment: '更新时间' },
  { name: 'dt', type: 'string', comment: '分区日期' },
];

export function buildTableTree(): DbTable[] {
  return DATABASES.map((db) => ({
    key: db,
    title: db,
    type: 'database',
    children: TABLE_THEMES[db].map((t) => ({
      key: `${db}.${t}`,
      title: t,
      type: 'table' as const,
      comment: '业务数据表',
      children: COLUMN_TEMPLATE.map((c) => ({
        key: `${db}.${t}.${c.name}`,
        title: c.name,
        type: 'column' as const,
        dataType: c.type,
        comment: c.comment,
      })),
    })),
  }));
}

export const databaseFlatOptions = DATABASES.map((d) => ({ label: d, value: d }));

export function buildFolderTree(): FolderNode[] {
  return [
    {
      key: 'folder-me',
      title: '我的文件夹',
      type: 'folder',
      children: [
        {
          key: 'folder-me-daily',
          title: '日常取数',
          type: 'folder',
          children: [
            {
              key: 'file-me-daily-1',
              title: '用户留存分析.sql',
              type: 'file',
              creator: 'demo_user',
              updatedAt: '2025-10-18 14:30',
            },
            {
              key: 'file-me-daily-2',
              title: '订单漏斗.sql',
              type: 'file',
              creator: 'demo_user',
              updatedAt: '2025-10-16 10:21',
            },
          ],
        },
        {
          key: 'file-me-1',
          title: '风险用户画像.sql',
          type: 'file',
          creator: 'demo_user',
          updatedAt: '2025-10-12 20:05',
        },
      ],
    },
    {
      key: 'folder-shared',
      title: '共享文件夹',
      type: 'folder',
      children: [
        {
          key: 'folder-shared-risk',
          title: '风险指标',
          type: 'folder',
          children: [
            {
              key: 'file-shared-risk-1',
              title: '首逾率-按月.sql',
              type: 'file',
              creator: 'alice',
              updatedAt: '2025-10-10 12:11',
            },
            {
              key: 'file-shared-risk-2',
              title: '贷后催收触达.sql',
              type: 'file',
              creator: 'bob',
              updatedAt: '2025-09-28 17:50',
            },
          ],
        },
      ],
    },
    {
      key: 'folder-public',
      title: '公共文件夹',
      type: 'folder',
      children: [
        {
          key: 'file-public-1',
          title: 'sample_hello.sql',
          type: 'file',
          creator: 'system',
          updatedAt: '2025-08-01 09:00',
        },
      ],
    },
  ];
}

export function buildAnalysisTaskTree(): AnalysisTaskNode[] {
  return [
    {
      key: 'at-folder-1',
      title: '风控看板',
      type: 'folder',
      children: [
        {
          key: 'at-task-1',
          title: '首逾风险分析',
          type: 'task',
          status: 'SUCCESS',
          owner: 'demo_user',
          updatedAt: '2025-10-19 08:12',
        },
        {
          key: 'at-task-2',
          title: '用户地域画像',
          type: 'task',
          status: 'RUNNING',
          owner: 'demo_user',
          updatedAt: '2025-10-19 09:03',
        },
      ],
    },
    {
      key: 'at-folder-2',
      title: '运营分析',
      type: 'folder',
      children: [
        {
          key: 'at-task-3',
          title: '活动 ROI 分析',
          type: 'task',
          status: 'DRAFT',
          owner: 'demo_user',
          updatedAt: '2025-10-15 17:44',
        },
        {
          key: 'at-task-4',
          title: '拉新留存漏斗',
          type: 'task',
          status: 'FAILED',
          owner: 'alice',
          updatedAt: '2025-10-14 23:20',
        },
      ],
    },
  ];
}

export function buildSqlHistory(): SqlHistoryItem[] {
  const base: SqlHistoryItem[] = [];
  const samples = [
    'SELECT user_id, count(*) FROM ods_db.ods_order_info_df WHERE dt = \'2025-10-18\' GROUP BY user_id',
    'SELECT * FROM dwd_db.dwd_loan_detail_df LIMIT 100',
    'SELECT dt, sum(amount) FROM dws_db.dws_order_daily_df GROUP BY dt ORDER BY dt DESC',
    'DROP TABLE IF EXISTS tmp.user_test',
    'SELECT count(1) FROM ads_db.ads_risk_report_df WHERE dt = \'2025-10-17\'',
  ];
  const statuses: SqlHistoryItem['status'][] = ['SUCCESS', 'FAILED', 'SUCCESS', 'SUCCESS', 'FAILED'];
  for (let i = 0; i < 30; i += 1) {
    const idx = i % samples.length;
    base.push({
      id: `hist-${i + 1}`,
      sqlText: samples[idx],
      database: DATABASES[i % DATABASES.length],
      status: statuses[i % statuses.length],
      startTime: `2025-10-${String(18 - Math.floor(i / 5)).padStart(2, '0')} ${String(
        (14 + i) % 24,
      ).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
      duration: 200 + ((i * 137) % 9000),
      rows: i % 5 === 1 ? 0 : 100 + ((i * 31) % 5000),
    });
  }
  return base;
}

export function buildTempTables(): TempTableItem[] {
  return [
    {
      id: 'temp-1',
      name: 'tmp_user_blacklist_0918',
      columns: 5,
      rows: 23810,
      uploadTime: '2025-10-15 10:12',
      creator: 'demo_user',
      size: '1.2 MB',
    },
    {
      id: 'temp-2',
      name: 'tmp_marketing_leads',
      columns: 12,
      rows: 9821,
      uploadTime: '2025-10-12 17:25',
      creator: 'demo_user',
      size: '3.6 MB',
    },
    {
      id: 'temp-3',
      name: 'tmp_city_mapping',
      columns: 3,
      rows: 3200,
      uploadTime: '2025-10-08 09:00',
      creator: 'alice',
      size: '140 KB',
    },
  ];
}

export function buildSqlResult(sql: string) {
  const columns = ['id', 'user_id', 'amount', 'status', 'dt'];
  const rows = Array.from({ length: 50 }, (_, i) => ({
    id: 10000 + i,
    user_id: 88000000 + i * 13,
    amount: (1000 + ((i * 13) % 5000)).toFixed(2),
    status: ['PAID', 'REFUND', 'PENDING', 'OVERDUE'][i % 4],
    dt: `2025-10-${String(18 - (i % 7)).padStart(2, '0')}`,
  }));
  return {
    columns,
    rows,
    rowCount: rows.length,
    duration: 820,
    sql,
  };
}
