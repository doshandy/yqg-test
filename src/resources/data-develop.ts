/**
 * 数据开发（任务开发 + 表管理）接口。
 *
 * 注：本项目所有 httpGet/httpPost 返回 { data: { status, body } }，
 *     此处统一在 resource 层解包为 body，调用方直接拿到业务数据。
 */

import { httpGet, httpPost, type YqgResponse } from '@/utils/request';
import type {
  TaskTreeNode,
  TaskDetail,
  RunRecord,
  QueryResult,
  VersionItem,
  ScheduleConfig,
  MonitorRule,
  QualityRule,
  TaskParam,
  TableTreeNode,
  TableDetail,
  TableVersionItem,
  TableAuth,
  RecentTable,
} from '@/mocks/data/data-develop';

export interface FilterOptions {
  databases: Array<{ label: string; value: string }>;
  owners: Array<{ label: string; value: string }>;
  taskTypes?: Array<{ label: string; value: string }>;
}

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

const DataDevelopApi = {
  fetchTaskTree: () =>
    httpGet<TaskTreeNode[]>('/api/data-develop/task/tree').then(unwrap),
  fetchTaskFilterOptions: () =>
    httpGet<FilterOptions>('/api/data-develop/task/filter-options').then(unwrap),
  fetchTaskDetail: (id: string) =>
    httpGet<TaskDetail>(`/api/data-develop/task/detail/${id}`).then(unwrap),
  fetchRunRecords: () =>
    httpGet<RunRecord[]>('/api/data-develop/task/run-records').then(unwrap),
  runQuery: (params: { sql: string }) =>
    httpPost<QueryResult>('/api/data-develop/task/query', params).then(unwrap),
  fetchVersions: () =>
    httpGet<VersionItem[]>('/api/data-develop/task/versions').then(unwrap),
  fetchSchedule: () =>
    httpGet<ScheduleConfig>('/api/data-develop/task/schedule').then(unwrap),
  fetchMonitors: () =>
    httpGet<MonitorRule[]>('/api/data-develop/task/monitors').then(unwrap),
  fetchQualityRules: () =>
    httpGet<QualityRule[]>('/api/data-develop/task/quality-rules').then(unwrap),
  fetchTaskParams: () =>
    httpGet<TaskParam[]>('/api/data-develop/task/params').then(unwrap),

  fetchTableTree: () =>
    httpGet<TableTreeNode[]>('/api/data-develop/table/tree').then(unwrap),
  fetchTableFilterOptions: () =>
    httpGet<FilterOptions>('/api/data-develop/table/filter-options').then(unwrap),
  fetchTableDetail: (id: string) =>
    httpGet<TableDetail>(`/api/data-develop/table/detail/${id}`).then(unwrap),
  fetchTableVersions: () =>
    httpGet<TableVersionItem[]>('/api/data-develop/table/versions').then(unwrap),
  fetchTableAuths: () =>
    httpGet<TableAuth[]>('/api/data-develop/table/auths').then(unwrap),
  fetchRecentTables: () =>
    httpGet<RecentTable[]>('/api/data-develop/table/recent').then(unwrap),
  createTable: (params: { ddl: string; database: string }) =>
    httpPost<{ success: boolean; tableId: string }>(
      '/api/data-develop/table/create',
      params,
    ).then(unwrap),
  rollbackTable: (params: { tableId: string; versionId: string }) =>
    httpPost<{ success: boolean }>(
      '/api/data-develop/table/rollback',
      params,
    ).then(unwrap),
};

export type {
  TaskTreeNode,
  TaskDetail,
  RunRecord,
  QueryResult,
  VersionItem,
  ScheduleConfig,
  MonitorRule,
  QualityRule,
  TaskParam,
  TableTreeNode,
  TableDetail,
  TableVersionItem,
  TableAuth,
  RecentTable,
};

export default DataDevelopApi;
