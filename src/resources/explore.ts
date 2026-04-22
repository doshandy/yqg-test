/**
 * SQL 查询接口（骨架版，所有数据由 MSW 提供）
 */

import { httpGet, httpPost, type YqgResponse } from '@/utils/request';
import type {
  DbTable,
  FolderNode,
  AnalysisTaskNode,
  SqlHistoryItem,
  TempTableItem,
} from '@/mocks/data/explore';

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

export type { DbTable, FolderNode, AnalysisTaskNode, SqlHistoryItem, TempTableItem };

export interface SqlRunResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  duration: number;
  sql: string;
}

const ExploreApi = {
  fetchTableTree: () => httpGet<DbTable[]>('/api/explore/sql/table-tree').then(unwrap),
  fetchFolderTree: () => httpGet<FolderNode[]>('/api/explore/sql/folder-tree').then(unwrap),
  fetchAnalysisTree: () =>
    httpGet<AnalysisTaskNode[]>('/api/explore/sql/analysis-tree').then(unwrap),
  fetchDatabases: () =>
    httpGet<Array<{ label: string; value: string }>>('/api/explore/sql/databases').then(unwrap),
  fetchSqlHistory: (params: { pageNo?: number; pageSize?: number } = {}) =>
    httpGet<{
      items: SqlHistoryItem[];
      total: number;
      pageNo: number;
      pageSize: number;
    }>('/api/explore/sql/history', { params }).then(unwrap),
  fetchTempTables: () => httpGet<TempTableItem[]>('/api/explore/sql/temp-tables').then(unwrap),
  runSql: (sql: string) => httpPost<SqlRunResult>('/api/explore/sql/run', { sql }).then(unwrap),
};

export default ExploreApi;
