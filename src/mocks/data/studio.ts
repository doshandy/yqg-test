/**
 * Studio（数据开发完整编辑器页）mock 数据
 */

export interface TreeNode {
  key: string;
  title: string;
  level?: number;
  type?: 'folder' | 'file';
  taskType?: string;
  databaseName?: string;
  scriptContent?: string;
  children?: TreeNode[];
}

export const buildTableTree = (): TreeNode[] => [
  {
    key: 'db-warehouse',
    title: 'warehouse',
    level: 1,
    children: [
      {
        key: 'tbl-order',
        title: 'dwd_order_info',
        level: 2,
        children: [
          { key: 'col-order-id', title: 'order_id bigint', level: 3 },
          { key: 'col-order-amount', title: 'amount decimal(12,2)', level: 3 },
          { key: 'col-order-user', title: 'user_id bigint', level: 3 },
          { key: 'col-order-status', title: 'status string', level: 3 },
          { key: 'col-order-ts', title: 'created_at timestamp', level: 3 },
        ],
      },
      {
        key: 'tbl-user',
        title: 'dwd_user_info',
        level: 2,
        children: [
          { key: 'col-user-id', title: 'user_id bigint', level: 3 },
          { key: 'col-user-name', title: 'user_name string', level: 3 },
          { key: 'col-user-phone', title: 'phone string', level: 3 },
          { key: 'col-user-region', title: 'region string', level: 3 },
        ],
      },
    ],
  },
  {
    key: 'db-ads',
    title: 'ads',
    level: 1,
    children: [
      {
        key: 'tbl-ads-sales',
        title: 'ads_sales_daily',
        level: 2,
        children: [
          { key: 'col-ads-day', title: 'day string', level: 3 },
          { key: 'col-ads-sales', title: 'sales decimal', level: 3 },
          { key: 'col-ads-orders', title: 'orders bigint', level: 3 },
          { key: 'col-ads-users', title: 'users bigint', level: 3 },
        ],
      },
    ],
  },
];

export const buildTaskTree = (): TreeNode[] => [
  {
    key: 'folder-sales',
    title: '销售看板',
    type: 'folder',
    children: [
      {
        key: 'task-sales-daily',
        title: 'ads_sales_daily.sql',
        type: 'file',
        taskType: 'HIVE_SQL',
        databaseName: 'ads',
        scriptContent:
`-- 销售日报
SELECT
  day,
  sum(sales) AS total_sales,
  sum(orders) AS total_orders,
  sum(users) AS active_users
FROM ads.ads_sales_daily
WHERE day >= date_sub(current_date, 7)
GROUP BY day
ORDER BY day DESC;`,
      },
      {
        key: 'task-gmv-week',
        title: 'gmv_weekly.sql',
        type: 'file',
        taskType: 'SPARK_SQL',
        databaseName: 'ads',
        scriptContent:
`-- GMV 周报
SELECT
  date_trunc('week', order_day) AS week,
  sum(gmv) AS weekly_gmv
FROM ads.ads_gmv_daily
WHERE order_day >= date_sub(current_date, 90)
GROUP BY 1
ORDER BY 1 DESC;`,
      },
    ],
  },
  {
    key: 'folder-user',
    title: '用户分析',
    type: 'folder',
    children: [
      {
        key: 'task-user-retention',
        title: 'user_retention.sql',
        type: 'file',
        taskType: 'HIVE_SQL',
        databaseName: 'warehouse',
        scriptContent:
`-- 用户留存
WITH day_actives AS (
  SELECT user_id, to_date(created_at) AS d
  FROM warehouse.dwd_user_login
  WHERE created_at >= date_sub(current_date, 30)
  GROUP BY 1, 2
)
SELECT
  d,
  count(distinct user_id) AS dau
FROM day_actives
GROUP BY d
ORDER BY d DESC
LIMIT 30;`,
      },
    ],
  },
  {
    key: 'folder-tmp',
    title: '临时查询',
    type: 'folder',
    children: [],
  },
];

export const buildDefaultTask = () => ({
  key: 'task-default',
  taskName: '欢迎使用 SQL Studio.sql',
  taskType: 'HIVE_SQL',
  databaseName: 'warehouse',
  scriptContent:
`-- 欢迎使用 SQL Studio
-- 你可以在此编写 SQL，按 Cmd+Enter 或点击"运行"按钮执行。
-- 支持上下拖拽调整编辑器高度，左右拖拽调整侧边栏宽度。

SELECT
  user_id,
  user_name,
  region,
  count(*) AS login_times
FROM warehouse.dwd_user_info
WHERE region IN ('华东', '华北', '华南')
GROUP BY 1, 2, 3
ORDER BY login_times DESC
LIMIT 100;`,
  resultList: [{ key: 0, status: '', resultType: 'log' }],
  outerHeight: 420,
});

const COLUMNS_USER = [
  { field: 'user_id', title: 'user_id' },
  { field: 'user_name', title: 'user_name' },
  { field: 'region', title: 'region' },
  { field: 'login_times', title: 'login_times' },
  { field: 'last_login', title: 'last_login' },
];

const NAMES = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', 'Emma', 'Liam', 'Olivia', 'Noah'];
const REGIONS = ['华东', '华北', '华南', '西北', '西南', '东北'];

export const buildRunResult = () => {
  // 不再返回同步完整 rows，而是给一个 rowCount 让前端通过分页接口逐页拉取，
  // 同时保留 columns 供早期日志展示时占位使用（真正列渲染在 sql-result 内部完成）。
  const rowCount = 500;
  return {
    columns: COLUMNS_USER,
    rows: [],
    rowCount,
    duration: 150 + Math.floor(Math.random() * 800),
    appId: `application_17345${Math.floor(Math.random() * 1e8)}_${Math.floor(Math.random() * 9999)}`,
  };
};

// ----- 原版 sql-result.vue 所需：分页结果 -----

export const RESULT_HEADERS = [
  'user_id',
  'user_name',
  'region',
  'login_times',
  'last_login_ts',
  'create_time',
  'amount',
  'status',
];

const STATUS_POOL = ['ACTIVE', 'FROZEN', 'PENDING', 'CLOSED'];

function buildRow(i: number) {
  return [
    100000 + i,
    NAMES[i % NAMES.length] + '_' + (i + 1),
    REGIONS[i % REGIONS.length],
    Math.floor(Math.random() * 320) + 1,
    // 毫秒时间戳，供「时区切换」演示
    Date.now() - Math.floor(Math.random() * 1000 * 3600 * 24 * 30),
    new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 90)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19),
    (Math.random() * 99999).toFixed(2),
    STATUS_POOL[i % STATUS_POOL.length],
  ];
}

/** 一次执行共产生 500 行，每页 100 行 */
const TOTAL_ROWS = 500;
const PAGE_SIZE = 100;

export function buildPaginatedResults(pageNum = 1) {
  const start = (pageNum - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, TOTAL_ROWS);
  const data: any[][] = [];
  for (let i = start; i < end; i++) data.push(buildRow(i));
  const finish = end >= TOTAL_ROWS;
  return {
    header: RESULT_HEADERS,
    data,
    finish,
    pageNum,
    errorLine: null,
  };
}

/** 表样例数据（无任务场景） */
export function buildTableExample() {
  const data: any[][] = [];
  for (let i = 0; i < 20; i++) data.push(buildRow(i));
  return {
    header: RESULT_HEADERS,
    data,
    finish: true,
    pageNum: 1,
    errorLine: null,
  };
}

/** 下载结果（一次返回全部 500 行供前端生成 CSV） */
export function buildDownloadResults() {
  const data: any[][] = [];
  for (let i = 0; i < TOTAL_ROWS; i++) data.push(buildRow(i));
  return {
    header: RESULT_HEADERS,
    data,
    fileName: `query_${Date.now()}.csv`,
  };
}
