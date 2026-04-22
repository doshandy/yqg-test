/**
 * SQL Studio 接口（全部走 MSW mock）
 */

import { httpGet, httpPost, type YqgResponse } from '@/utils/request';

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

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

export interface StudioPane {
  key: string | number;
  taskName: string;
  taskType?: string;
  databaseName?: string;
  scriptContent?: string;
  outerHeight?: number;
  resultList: Array<{
    key: string | number;
    status?: string;
    resultType?: string;
    [k: string]: unknown;
  }>;
}

export interface RunResult {
  columns: Array<{ field: string; title: string }>;
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  duration: number;
  appId?: string;
}

const StudioApi = {
  fetchTableTree: () =>
    httpGet<TreeNode[]>('/api/studio/table-tree').then(unwrap),
  fetchTaskTree: () =>
    httpGet<TreeNode[]>('/api/studio/task-tree').then(unwrap),
  openDefaultTask: () =>
    httpGet<StudioPane>('/api/studio/default-task').then(unwrap),

  runSql: (body: { sql: string }) =>
    httpPost<RunResult>('/api/studio/run', body).then(unwrap),
  formatSql: (body: { sql: string; engine?: string }) =>
    httpPost<{ sql: string }>('/api/studio/format', body).then(unwrap),
  saveDraft: (body: { taskCode: string; scriptContent: string }) =>
    httpPost<{ taskCode: string; savedAt: number }>(
      '/api/studio/save-draft',
      body,
    ).then(unwrap),
};

export default StudioApi;
