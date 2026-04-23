import { httpGet, httpPost, type YqgResponse } from '@/utils/request';
import type {
  ScheduleSummary,
  ScheduleTaskItem,
  ScheduleInstanceItem,
  ScheduleLogTab,
  ScheduleTaskDetail,
  ScheduleGraphPayload,
} from '@/mocks/data/schedule';

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

export type {
  ScheduleSummary,
  ScheduleTaskItem,
  ScheduleInstanceItem,
  ScheduleLogTab,
  ScheduleTaskDetail,
  ScheduleGraphPayload,
};

export interface SchedulePagedResult<T> {
  items: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

const ScheduleApi = {
  fetchSummary: () => httpGet<ScheduleSummary>('/api/schedule/summary').then(unwrap),
  fetchEnums: () => httpGet<Record<string, Array<{ label: string; value: string }>>>('/api/schedule/enums').then(unwrap),

  fetchTasks: (params: Record<string, unknown> = {}) =>
    httpGet<SchedulePagedResult<ScheduleTaskItem>>('/api/schedule/tasks', { params }).then(unwrap),
  runTask: (payload: { taskId: string; scheduleTime?: string }) =>
    httpPost<ScheduleInstanceItem | null>('/api/schedule/tasks/run', payload).then(unwrap),
  checkNeedDate: (taskId: string) =>
    httpGet<boolean>('/api/schedule/tasks/need-date', { params: { taskId } }).then(unwrap),
  fetchTaskLogs: (params: { processInstanceId?: string; skipLineNum?: number }) =>
    httpGet<ScheduleLogTab[]>('/api/schedule/tasks/logs', { params }).then(unwrap),
  fetchTaskDetail: (taskId: string) =>
    httpGet<ScheduleTaskDetail | null>('/api/schedule/tasks/detail', { params: { taskId } }).then(unwrap),

  fetchInstances: (params: Record<string, unknown> = {}) =>
    httpGet<SchedulePagedResult<ScheduleInstanceItem>>('/api/schedule/instances', { params }).then(unwrap),
  rerunInstance: (payload: { taskInstanceId: string }) =>
    httpPost<ScheduleInstanceItem | null>('/api/schedule/instances/rerun', payload).then(unwrap),
  stopInstance: (payload: { taskInstanceId: string }) =>
    httpPost<ScheduleInstanceItem | null>('/api/schedule/instances/stop', payload).then(unwrap),
  forceSuccess: (payload: { taskInstanceId: string }) =>
    httpPost<ScheduleInstanceItem | null>('/api/schedule/instances/force-success', payload).then(unwrap),
  fetchInstanceLogs: (params: { processInstanceId?: string; skipLineNum?: number }) =>
    httpGet<ScheduleLogTab[]>('/api/schedule/instances/logs', { params }).then(unwrap),

  fetchDependencyView: (taskId: string) =>
    httpGet<ScheduleGraphPayload | null>('/api/schedule/dependency/view', { params: { taskId } }).then(unwrap),
  fetchDependencyDiagnosis: (taskId: string) =>
    httpGet<ScheduleGraphPayload | null>('/api/schedule/dependency/diagnosis', { params: { taskId } }).then(unwrap),
};

export default ScheduleApi;
