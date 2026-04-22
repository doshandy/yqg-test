/**
 * SQL 编辑器相关接口 - 供 code-box 及其工具函数使用。
 * 全部走 MSW mock。hideLoading 等字段在原项目是 @yqg/resource 的 meta，这里保留签名但不做任何处理。
 */
import { httpGet, httpPost, type YqgResponse } from '@/utils/request';

interface SqlRequestOptions {
  params?: Record<string, unknown>;
  hideLoading?: boolean;
  signal?: AbortSignal;
}

const get = <T = unknown>(url: string, opts: SqlRequestOptions = {}) =>
  httpGet<T>(url, { params: opts.params as Record<string, unknown>, signal: opts.signal });

const post = <T = unknown>(url: string, body?: unknown, opts: SqlRequestOptions = {}) =>
  httpPost<T>(url, body, { params: opts.params as Record<string, unknown>, signal: opts.signal });

const Sql = {
  // 数据库 / 表 / 列 / 函数（补全能力依赖）
  getDatabaseList: (opts?: SqlRequestOptions) =>
    get<Array<{ name: string }>>('/api/sql/databases', opts),
  getTableList: (opts?: SqlRequestOptions) =>
    get<Array<{ databaseName: string; tableItems: Array<{ tableName: string }> }>>(
      '/api/sql/tables',
      opts,
    ),
  getColumnList: (opts?: SqlRequestOptions) =>
    get<Array<{ name: string; type?: string; comment?: string }>>(
      '/api/sql/columns',
      opts,
    ),
  getFunctions: (opts?: SqlRequestOptions) =>
    get<Array<{ functionName: string; comment?: string }>>(
      '/api/sql/functions',
      opts,
    ),

  // SQL 执行 / 保存 / 历史 / 版本
  execute: (body: {
    sql: string;
    taskCode?: string;
    databaseName?: string;
    dataSourceId?: string;
  }) =>
    post<{
      executionId: string;
    }>('/api/sql/execute', body),

  getResult: (opts: SqlRequestOptions & { params: { executionId: string } }) =>
    get<{
      status: 'INIT' | 'ANALYZING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
      columns: Array<{ name: string; type?: string }>;
      rows: Array<Record<string, unknown>>;
      totalNumber: number;
      currentNumber: number;
      duration: number;
      log: string;
      extraInfo?: Record<string, unknown>;
      appId?: string;
    }>('/api/sql/result', opts),

  saveDraft: (body: { taskCode: string; scriptContent: string }) =>
    post<{ taskCode: string; savedAt: number }>('/api/sql/save-draft', body),

  formatSql: (body: { sql: string; engine?: string }) =>
    post<{ sql: string }>('/api/sql/format', body),

  stop: (body: { executionId: string }) =>
    post<{ stopped: boolean }>('/api/sql/stop', body),

  // sql-result.vue 所需：分页拉取结果
  getResults: (
    opts: SqlRequestOptions & {
      params: { id: string | number; pageNum: number };
    },
  ) =>
    get<{
      header: string[];
      data: any[][];
      finish: boolean;
      pageNum: number;
      errorLine?: number | null;
      error?: string;
    }>('/api/sql/paginated-results', opts),

  // 查看表样例数据
  getExample: (
    opts: SqlRequestOptions & {
      params: { dataSourceId: any; database: any; table: any };
    },
  ) =>
    get<{
      header: string[];
      data: any[][];
      finish: boolean;
      pageNum: number;
      errorLine?: number | null;
    }>('/api/sql/table-example', opts),

  // 下载结果（原版返回 blob + headers，我们 mock 直接返回结构化 JSON，前端生成 CSV）
  downloadResults: (
    params: { id: string | number | undefined },
    _opts?: Record<string, unknown>,
  ) =>
    get<{ header: string[]; data: any[][]; fileName: string }>(
      '/api/sql/download-results',
      { params },
    ),

  // ============== sql-sider 所需 ==============

  /** 任务目录树：分页 */
  getDirectoryList: (
    opts: SqlRequestOptions & {
      params: {
        parentId?: number | string;
        pageNum?: number;
        pageSize?: number;
        databaseName?: string;
      };
    },
  ) =>
    get<{
      hasNextPage: boolean;
      list: Array<{
        task?: any;
        taskDirectory: any;
        children?: any[];
      }>;
    }>('/api/sql/directory-list', opts),

  /** 搜索目录树（带筛选） */
  searchDirectoryList: (
    opts: SqlRequestOptions & {
      params: {
        itemType?: string;
        name?: string;
        databaseNames?: string;
        owners?: string;
        taskTypes?: string;
      };
    },
  ) =>
    get<
      Array<{
        task?: any;
        taskDirectory: any;
        children?: any[];
      }>
    >('/api/sql/search-directory-list', opts),

  /** 单任务详情 */
  getTask: (opts: SqlRequestOptions & { params: { id: string | number } }) =>
    get<{
      task: any;
      taskDirectory: any;
    }>('/api/sql/task', opts),

  /** 任务 CRUD */
  createTasks: (body: Record<string, any>) =>
    post<{ task: { id: number | string } }>('/api/sql/create-task', body),
  updateTasks: (body: Record<string, any>) =>
    post<{ task: { id: number | string } }>('/api/sql/update-task', body),
  deleteTasks: (
    opts: SqlRequestOptions & { params: { id: string | number } },
  ) => get<{ success: boolean }>('/api/sql/delete-task', opts),

  /** 目录 CRUD */
  createDirectory: (body: Record<string, any>) =>
    post<{ id: number | string }>('/api/sql/create-directory', body),
  updateDirectory: (body: Record<string, any>) =>
    post<{ id: number | string }>('/api/sql/update-directory', body),
  deleteDirectory: (
    opts: SqlRequestOptions & { params: { id: string | number } },
  ) => get<{ success: boolean }>('/api/sql/delete-directory', opts),
  moveTaskDirectory: (body: Record<string, any>) =>
    post<{ success: boolean }>('/api/sql/move-task-directory', body),

  /** 筛选条件用枚举源 */
  getProjectDatabases: () =>
    get<string[]>('/api/sql/project-databases'),
  getProjectUsersDeduplicated: () =>
    get<
      Array<{
        user: { username: string; formatedName?: string };
      }>
    >('/api/sql/project-users-deduplicated'),
  getTaskTypeList: (opts?: SqlRequestOptions) =>
    get<Array<{ label: string; value: string }>>(
      '/api/sql/task-type-list',
      opts,
    ),
};

export default Sql;
export type { YqgResponse };
