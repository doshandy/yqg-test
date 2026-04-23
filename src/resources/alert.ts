import { httpGet, httpPost, type YqgResponse } from '@/utils/request';
import type {
  AlertOverview,
  AlertEventItem,
  AlertPolicyItem,
  AlertPagedResult,
  AlertLogItem,
} from '@/mocks/data/alert';

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

export type {
  AlertOverview,
  AlertEventItem,
  AlertPolicyItem,
  AlertPagedResult,
  AlertLogItem,
};

const AlertApi = {
  fetchOverview: () => httpGet<AlertOverview>('/api/alert/overview').then(unwrap),
  fetchEnums: () => httpGet<Record<string, unknown>>('/api/alert/enums').then(unwrap),
  fetchEvents: (params: {
    keyword?: string;
    eventId?: string;
    resourceType?: string;
    eventTypes?: string[];
    statuses?: string[];
    severities?: string[];
    owners?: string[];
    lastOperators?: string[];
    isSelf?: boolean;
    todayOnly?: boolean;
    status?: string;
    severity?: string;
    pageNo?: number;
    pageSize?: number;
  } = {}) =>
    httpGet<AlertPagedResult<AlertEventItem>>('/api/alert/events', { params }).then(unwrap),
  fetchDetail: (id: string) =>
    httpGet<AlertEventItem | null>('/api/alert/events/detail', { params: { id } }).then(unwrap),
  fetchLogs: (id: string) =>
    httpGet<AlertLogItem[]>('/api/alert/events/logs', { params: { id } }).then(unwrap),
  updateStatus: (
    id: string,
    action: 'acknowledge' | 'resolve' | 'falsePositive' | 'silence' | 'transfer',
    payload?: { owner?: string; remark?: string; reason?: string; rootCause?: string; silenceHours?: number },
  ) =>
    httpPost<AlertEventItem>('/api/alert/events/update-status', { id, action, ...payload }).then(unwrap),
  batchUpdate: (
    ids: string[],
    action: 'acknowledge' | 'resolve' | 'falsePositive' | 'silence' | 'transfer',
    payload?: { owner?: string; remark?: string; reason?: string; rootCause?: string; silenceHours?: number },
  ) =>
    httpPost('/api/alert/events/batch-update', { ids, action, ...payload }).then(unwrap),

  fetchPolicies: (params: { keyword?: string; createdBy?: string; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<AlertPagedResult<AlertPolicyItem>>('/api/alert/policies', { params }).then(unwrap),
  savePolicy: (payload: Partial<AlertPolicyItem>) =>
    httpPost<AlertPolicyItem>('/api/alert/policies/save', payload).then(unwrap),
  deletePolicy: (id: string) =>
    httpPost('/api/alert/policies/delete', { id }).then(unwrap),
  togglePolicy: (id: string, enabled: boolean) =>
    httpPost<AlertPolicyItem>('/api/alert/policies/toggle', { id, enabled }).then(unwrap),
  setDefaultPolicy: (id: string) =>
    httpPost<AlertPolicyItem>('/api/alert/policies/set-default', { id }).then(unwrap),
};

export default AlertApi;
