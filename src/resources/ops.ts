/**
 * 任务运维接口
 */

import { httpGet, httpPost, type YqgResponse } from '@/utils/request';

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

export interface OpsTask {
  taskId: string;
  taskInstanceId?: string;
  processInstanceId?: string;
  taskName: string;
  taskDescription?: string;
  taskType: string;
  taskStatus: 'ONLINE' | 'OFFLINE';
  owner: string;
  releaseDate: string;
  scheduleType: 'NORMAL' | 'MATRIX';
  scheduleCycle: 'MINUTE' | 'HOUR' | 'DAY' | 'MONTH';
  lastScheduleBatch?: string;
  lastRunStatus: string;
  lastRunStartTime?: string;
  lastRunEndTime?: string;
  lastRunDurationMs?: number;
}

export interface LogTab {
  name: string;
  log: string;
  lineCount: number;
  appLink?: Record<string, string>;
}

export interface OpsListFilters {
  taskName?: string;
  taskType?: string;
  taskStatus?: string;
  owner?: string;
  lastRunStatus?: string;
  myResponsibility?: boolean;
  pageNo?: number;
  pageSize?: number;
}

const OpsApi = {
  fetchTaskTypes: () =>
    httpGet<Array<{ label: string; value: string }>>('/api/ops/task-types').then(unwrap),
  fetchOwners: () =>
    httpGet<Array<{ label: string; value: string }>>('/api/ops/owners').then(unwrap),

  fetchTasks: (params: OpsListFilters = {}) =>
    httpGet<{ items: OpsTask[]; total: number; pageNo: number; pageSize: number }>(
      '/api/ops/tasks',
      { params: params as Record<string, unknown> },
    ).then(unwrap),

  runTask: (body: { taskId: string; scheduleTime?: string }) =>
    httpPost<{ success: boolean; startedAt: number }>('/api/ops/run', body).then(unwrap),

  getLogs: (params: { taskId: string; processInstanceId?: string; skipLineNum?: number }) =>
    httpGet<LogTab[]>('/api/ops/logs', { params }).then(unwrap),
};

export default OpsApi;
