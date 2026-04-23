export interface AlertOverview {
  firing: number;
  processing: number;
  silenced: number;
  resolved: number;
}

export interface AlertEventItem {
  id: string;
  eventId: string;
  resourceType: 'TASK' | 'DATA_QUALITY' | 'TABLE';
  resourceName: string;
  monitorEvent: string;
  severity: 'ERROR' | 'WARN';
  status: 'FIRING' | 'PROCESSING' | 'SILENCED' | 'RESOLVED' | 'FALSE_POSITIVE' | 'TRANSFERRED';
  owner: string;
  projectName: string;
  lastOperator: string;
  triggerTime: string;
  durationMinutes: number;
  executionBatch?: string;
  description: string;
  rootCause?: string;
  resolvedType?: 'MANUAL' | 'AUTO';
  channel?: string;
  notifyPolicyName?: string;
  executionId?: string;
  notifyCount?: number;
  escalationDesc?: string;
  resolvedTime?: string;
  silencedUntil?: string;
  falsePositiveRemark?: string;
  qualityGroupName?: string;
  qualityDataRange?: string;
  qualityTriggerType?: string;
}

export interface AlertPolicyItem {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  updatedAt: string;
  enabled: boolean;
  isBuiltin: boolean;
  isDefault: boolean;
  frequencyIntervalMinutes: number;
  maxSendTimes: number;
  receivers: string[];
  channels: string[];
}

export interface AlertLogItem {
  id: string;
  eventId: string;
  action: string;
  operator: string;
  detail: string;
  time: string;
}

export interface AlertPagedResult<T> {
  items: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

const makeTime = (day: number, hour: number, minute = 0) =>
  `2026-04-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

let events: AlertEventItem[] = Array.from({ length: 22 }, (_, i) => ({
  id: `alert_${i + 1}`,
  eventId: `EVT202604${String(1000 + i)}`,
  resourceType: (['TASK', 'DATA_QUALITY', 'TABLE'] as const)[i % 3],
  resourceName: ['用户画像主流程', '贷款质量校验', '营销结果宽表'][i % 3] + `_${i + 1}`,
  monitorEvent: ['任务失败', '数据质量告警', '表分区延迟'][i % 3],
  severity: (['ERROR', 'WARN'] as const)[i % 2],
  status: (['FIRING', 'PROCESSING', 'SILENCED', 'RESOLVED', 'FALSE_POSITIVE', 'TRANSFERRED'] as const)[i % 6],
  owner: ['alice', 'bob', 'carol'][i % 3],
  projectName: ['DataPilot', 'DataLumina', 'GrowthOps'][i % 3],
  lastOperator: ['alice', 'bob', 'carol', 'demo_user'][i % 4],
  triggerTime: makeTime((i % 18) + 1, 8 + (i % 10), 15),
  durationMinutes: 10 + i * 5,
  executionBatch: `202604${String((i % 28) + 1).padStart(2, '0')}00`,
  description: '用于单机版演示的告警事件，包含认领、静默、误报、转派、解决等完整状态流转。',
  rootCause: i % 3 === 0 ? '上游分区未产出，导致本次调度触发失败。' : '',
  resolvedType: i % 5 === 0 ? 'AUTO' : 'MANUAL',
  channel: ['IM', 'MAIL', 'SMS'][i % 3],
  notifyPolicyName: ['默认任务告警策略_1', '数据质量升级策略_2', '夜间值班策略_3'][i % 3],
  executionId: `EXEC_${202604000 + i + 1}`,
  notifyCount: 1 + (i % 3),
  escalationDesc: i % 4 === 0 ? '20分钟未认领升级至值班人' : '',
  resolvedTime: makeTime((i % 18) + 1, 12 + (i % 6), 20),
  silencedUntil: makeTime((i % 18) + 1, 22, 0),
  falsePositiveRemark: i % 5 === 0 ? '已确认属于测试演练' : '',
  qualityGroupName: i % 3 === 1 ? `dq_group_${i + 1}` : '',
  qualityDataRange: i % 3 === 1 ? 'dt=2026-04-22' : '',
  qualityTriggerType: i % 3 === 1 ? '调度触发' : '',
}));

let alertLogs: AlertLogItem[] = events.flatMap((item, index) => [
  {
    id: `log_${item.id}_1`,
    eventId: item.eventId,
    action: '触发',
    operator: 'system',
    detail: `${item.monitorEvent} 被监控规则触发，当前状态为 ${item.status}`,
    time: item.triggerTime,
  },
  {
    id: `log_${item.id}_2`,
    eventId: item.eventId,
    action: index % 2 === 0 ? '通知' : '备注',
    operator: index % 2 === 0 ? 'quality_bot' : item.owner,
    detail: index % 2 === 0 ? `已通过 ${item.channel} 通知负责人和值班人。` : '已收到告警，正在进一步排查。',
    time: makeTime(((index + 1) % 18) + 1, 10 + (index % 8), 30),
  },
]);

let policies: AlertPolicyItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `policy_${i + 1}`,
  name: ['默认任务告警策略', '数据质量升级策略', '夜间值班策略'][i % 3] + `_${i + 1}`,
  description: '控制告警接收对象、渠道、频控和默认策略。',
  createdBy: ['alice', 'bob', 'carol'][i % 3],
  updatedAt: makeTime((i % 12) + 1, 10 + (i % 6), 20),
  enabled: i % 4 !== 0,
  isBuiltin: i % 5 === 0,
  isDefault: i === 0,
  frequencyIntervalMinutes: [10, 15, 30][i % 3],
  maxSendTimes: [3, 5, 10][i % 3],
  receivers: [['owner', 'oncall'], ['owner', 'leader'], ['owner', 'quality_bot']][i % 3],
  channels: [['IM', 'MAIL'], ['IM'], ['MAIL', 'SMS']][i % 3],
}));

function paginate<T>(list: T[], pageNo = 1, pageSize = 10): AlertPagedResult<T> {
  const start = (pageNo - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    total: list.length,
    pageNo,
    pageSize,
  };
}

const filterKeyword = (value?: string) => value?.trim().toLowerCase() ?? '';

export function getAlertOverview(): AlertOverview {
  return {
    firing: events.filter((item) => item.status === 'FIRING').length,
    processing: events.filter((item) => item.status === 'PROCESSING').length,
    silenced: events.filter((item) => item.status === 'SILENCED').length,
    resolved: events.filter((item) => item.status === 'RESOLVED').length,
  };
}

export function queryAlerts(params: {
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
} = {}) {
  const keyword = filterKeyword(params.keyword);
  const list = events.filter((item) => {
    const hitKeyword =
      !keyword
      || item.resourceName.toLowerCase().includes(keyword)
      || item.eventId.toLowerCase().includes(keyword)
      || item.owner.toLowerCase().includes(keyword);
    const hitEventId = !params.eventId || item.eventId.toLowerCase().includes(params.eventId.toLowerCase());
    const hitResourceType = !params.resourceType || item.resourceType === params.resourceType;
    const hitEventType = !params.eventTypes?.length || params.eventTypes.includes(item.monitorEvent);
    const hitStatuses = !params.statuses?.length || params.statuses.includes(item.status);
    const hitLegacyStatus = !params.status || item.status === params.status;
    const hitSeverities = !params.severities?.length || params.severities.includes(item.severity);
    const hitLegacySeverity = !params.severity || item.severity === params.severity;
    const hitOwners = !params.owners?.length || params.owners.includes(item.owner);
    const hitLastOperators = !params.lastOperators?.length || params.lastOperators.includes(item.lastOperator);
    const hitSelf = !params.isSelf || item.owner === 'demo_user';
    const hitToday = !params.todayOnly || item.triggerTime.startsWith('2026-04-23');
    return hitKeyword
      && hitEventId
      && hitResourceType
      && hitEventType
      && hitStatuses
      && hitLegacyStatus
      && hitSeverities
      && hitLegacySeverity
      && hitOwners
      && hitLastOperators
      && hitSelf
      && hitToday;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function updateAlertStatus(
  id: string,
  action: 'acknowledge' | 'resolve' | 'falsePositive' | 'silence' | 'transfer',
  payload?: { owner?: string; remark?: string; reason?: string; rootCause?: string; silenceHours?: number },
) {
  const statusMap = {
    acknowledge: 'PROCESSING',
    resolve: 'RESOLVED',
    falsePositive: 'FALSE_POSITIVE',
    silence: 'SILENCED',
    transfer: 'TRANSFERRED',
  } as const;
  events = events.map((item) =>
    item.id === id
      ? {
          ...item,
          status: statusMap[action],
          lastOperator: payload?.owner || 'demo_user',
          owner: action === 'transfer' && payload?.owner ? payload.owner : item.owner,
          rootCause: action === 'resolve' ? (payload?.rootCause || item.rootCause || '人工处理后恢复') : item.rootCause,
          resolvedType: action === 'resolve' ? 'MANUAL' : item.resolvedType,
        }
      : item,
  );
  const updated = events.find((item) => item.id === id) || null;
  if (updated) {
    alertLogs = [
      {
        id: `log_${Date.now()}_${id}`,
        eventId: updated.eventId,
        action: ({
          acknowledge: '认领',
          resolve: '解决',
          falsePositive: '误报',
          silence: '静默',
          transfer: '转派',
        } as const)[action],
        operator: payload?.owner || 'demo_user',
        detail: payload?.remark || payload?.reason || payload?.rootCause || '已完成状态流转。',
        time: makeTime(23, 19, 10),
      },
      ...alertLogs,
    ];
  }
  return updated;
}

export function batchUpdateAlerts(
  ids: string[],
  action: 'acknowledge' | 'resolve' | 'falsePositive' | 'silence' | 'transfer',
  payload?: { owner?: string; remark?: string; reason?: string; rootCause?: string; silenceHours?: number },
) {
  ids.forEach((id) => updateAlertStatus(id, action, payload));
  return true;
}

export function getAlertDetail(id: string) {
  return events.find((item) => item.id === id) || null;
}

export function getAlertLogs(id: string) {
  const event = events.find((item) => item.id === id);
  if (!event) return [];
  return alertLogs.filter((item) => item.eventId === event.eventId);
}

export function queryPolicies(params: { keyword?: string; createdBy?: string; pageNo?: number; pageSize?: number } = {}) {
  const keyword = filterKeyword(params.keyword);
  const list = policies.filter((item) => {
    const hitKeyword = !keyword || item.name.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword);
    const hitCreator = !params.createdBy || item.createdBy === params.createdBy;
    return hitKeyword && hitCreator;
  });
  return paginate(list, params.pageNo, params.pageSize);
}

export function savePolicy(payload: Partial<AlertPolicyItem>) {
  if (payload.id) {
    policies = policies.map((item) => (item.id === payload.id ? { ...item, ...payload, updatedAt: makeTime(23, 18) } as AlertPolicyItem : item));
    return policies.find((item) => item.id === payload.id) || null;
  }
  const next: AlertPolicyItem = {
    id: `policy_${Date.now()}`,
    name: payload.name || '新建告警策略',
    description: payload.description || '单机版新增告警策略。',
    createdBy: payload.createdBy || 'demo_user',
    updatedAt: makeTime(23, 18),
    enabled: payload.enabled ?? true,
    isBuiltin: false,
    isDefault: false,
    frequencyIntervalMinutes: payload.frequencyIntervalMinutes || 15,
    maxSendTimes: payload.maxSendTimes || 3,
    receivers: payload.receivers || ['owner'],
    channels: payload.channels || ['IM'],
  };
  policies = [next, ...policies];
  return next;
}

export function deletePolicy(id: string) {
  policies = policies.filter((item) => item.id !== id);
  return true;
}

export function togglePolicy(id: string, enabled: boolean) {
  policies = policies.map((item) => (item.id === id ? { ...item, enabled, updatedAt: makeTime(23, 18) } : item));
  return policies.find((item) => item.id === id) || null;
}

export function setDefaultPolicy(id: string) {
  policies = policies.map((item) => ({ ...item, isDefault: item.id === id }));
  return policies.find((item) => item.id === id) || null;
}

export function getAlertEnums() {
  return {
    resourceTypes: [
      { label: '任务', value: 'TASK' },
      { label: '数据质量', value: 'DATA_QUALITY' },
      { label: '表监控', value: 'TABLE' },
    ],
    eventTypes: [
      { label: '任务失败', value: '任务失败' },
      { label: '数据质量告警', value: '数据质量告警' },
      { label: '表分区延迟', value: '表分区延迟' },
    ],
    severities: [
      { label: 'ERROR', value: 'ERROR' },
      { label: 'WARN', value: 'WARN' },
    ],
    statuses: [
      { label: '触发中', value: 'FIRING' },
      { label: '处理中', value: 'PROCESSING' },
      { label: '已屏蔽', value: 'SILENCED' },
      { label: '已解决', value: 'RESOLVED' },
      { label: '误报', value: 'FALSE_POSITIVE' },
      { label: '已转派', value: 'TRANSFERRED' },
    ],
    owners: ['alice', 'bob', 'carol', 'demo_user'].map((item) => ({ label: item, value: item })),
    channels: [
      { label: 'IM', value: 'IM' },
      { label: 'MAIL', value: 'MAIL' },
      { label: 'SMS', value: 'SMS' },
    ],
    falsePositiveReasons: [
      { label: '阈值配置偏紧', value: '阈值配置偏紧' },
      { label: '临时演练', value: '临时演练' },
      { label: '已知问题无需处理', value: '已知问题无需处理' },
    ],
  };
}
