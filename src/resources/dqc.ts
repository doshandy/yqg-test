import { httpGet, httpPost, type YqgResponse } from '@/utils/request';
import type {
  DqcSummary,
  DqcTemplateItem,
  DqcRuleConfigItem,
  DqcRuleDetailItem,
  DqcRunRecordItem,
  DqcRunRuleRecordItem,
  DqcDiffItem,
  DqcDiffConfig,
  DqcDiffReportSummary,
  DqcDiffReportDetailItem,
  DqcDiffLogItem,
  DqcTestTaskItem,
  DqcTestInstanceItem,
  DqcTestTaskDetail,
  DqcTestReportOverview,
  DqcTestProbeItem,
  DqcTestRuleReportItem,
  DqcPagedResult,
  DqcRuleMonitorItem,
  DqcRuleTreeNode,
  DqcRuleFieldOption,
  DqcRuleTemplateCatalogItem,
  DqcMonitorEditor,
  DqcScheduleNode,
  DqcRuleTemplateTreeNode,
} from '@/mocks/data/dqc';

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

export type {
  DqcSummary,
  DqcTemplateItem,
  DqcRuleConfigItem,
  DqcRuleDetailItem,
  DqcRunRecordItem,
  DqcRunRuleRecordItem,
  DqcDiffItem,
  DqcDiffConfig,
  DqcDiffReportSummary,
  DqcDiffReportDetailItem,
  DqcDiffLogItem,
  DqcTestTaskItem,
  DqcTestInstanceItem,
  DqcTestTaskDetail,
  DqcTestReportOverview,
  DqcTestProbeItem,
  DqcTestRuleReportItem,
  DqcPagedResult,
  DqcRuleMonitorItem,
  DqcRuleTreeNode,
  DqcRuleFieldOption,
  DqcRuleTemplateCatalogItem,
  DqcMonitorEditor,
  DqcScheduleNode,
  DqcRuleTemplateTreeNode,
};

const DqcApi = {
  fetchSummary: () => httpGet<DqcSummary>('/api/dqc/summary').then(unwrap),
  fetchEnums: () => httpGet<Record<string, unknown>>('/api/dqc/enums').then(unwrap),

  fetchTemplates: (params: { type?: string; scope?: string; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<DqcPagedResult<DqcTemplateItem>>('/api/dqc/templates', { params }).then(unwrap),
  saveTemplate: (payload: Partial<DqcTemplateItem>) =>
    httpPost<DqcTemplateItem>('/api/dqc/templates/save', payload).then(unwrap),
  deleteTemplate: (id: string) =>
    httpPost('/api/dqc/templates/delete', { id }).then(unwrap),

  fetchRuleConfigTree: () =>
    httpGet<DqcRuleTreeNode[]>('/api/dqc/rule-configs/tree').then(unwrap),
  fetchRuleTableSuggestions: (keyword?: string) =>
    httpGet<Array<{ label: string; value: string; tableId: string }>>('/api/dqc/rule-configs/table-suggestions', { params: { keyword } }).then(unwrap),
  fetchRuleConfigs: (params: { tableName?: string; ownerUser?: string; notHasRule?: boolean; isSelf?: boolean; dbSourceType?: string; dataSourceId?: string; databaseName?: string; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<DqcPagedResult<DqcRuleConfigItem>>('/api/dqc/rule-configs', { params }).then(unwrap),
  fetchRuleConfigDetail: (tableId: string) =>
    httpGet<{ tableInfo: DqcRuleConfigItem; monitorRecords: DqcRuleMonitorItem[]; ruleRecords: DqcRuleDetailItem[] } | null>('/api/dqc/rule-configs/detail', { params: { tableId } }).then(unwrap),
  fetchRuleTableInfo: (tableId: string) =>
    httpGet<DqcRuleConfigItem | null>('/api/dqc/rule-configs/table-info', { params: { tableId } }).then(unwrap),
  fetchRuleFieldOptions: (tableId: string) =>
    httpGet<DqcRuleFieldOption[]>('/api/dqc/rule-configs/fields', { params: { tableId } }).then(unwrap),
  fetchRuleTemplateCatalog: (tableId: string, scopeType?: string) =>
    httpGet<DqcRuleTemplateCatalogItem[]>('/api/dqc/rule-configs/template-catalog', { params: { tableId, scopeType } }).then(unwrap),
  fetchRuleTemplateTree: (tableId: string, scopeType?: string) =>
    httpGet<DqcRuleTemplateTreeNode[]>('/api/dqc/rule-configs/template-tree', { params: { tableId, scopeType } }).then(unwrap),
  fetchRuleTemplateNames: () =>
    httpGet<string[]>('/api/dqc/rule-configs/template-names').then(unwrap),
  generateRuleCards: (payload: { tableId: string; ruleTemplateId: string; selectedFields?: string[]; generateMethod?: 'SYSTEM' | 'MANUAL' }) =>
    httpPost<DqcRuleDetailItem[]>('/api/dqc/rule-configs/generate-cards', payload).then(unwrap),
  fetchAiRecommendedRules: (tableId: string) =>
    httpGet<DqcRuleDetailItem[]>('/api/dqc/rule-configs/ai-recommend', { params: { tableId } }).then(unwrap),
  parseSqlFields: (sql: string) =>
    httpPost<Array<{ col: string; operator: string; value: number | string }>>('/api/dqc/rule-configs/parse-sql', { sql }).then(unwrap),
  fetchMonitorEditor: (params: { groupId?: string; tableId?: string } = {}) =>
    httpGet<DqcMonitorEditor | null>('/api/dqc/rule-configs/monitor-editor', { params }).then(unwrap),
  saveMonitorEditor: (payload: DqcMonitorEditor) =>
    httpPost<DqcMonitorEditor>('/api/dqc/rule-configs/monitor-editor/save', payload).then(unwrap),
  deleteMonitorEditor: (id: string) =>
    httpPost('/api/dqc/rule-configs/monitor-editor/delete', { id }).then(unwrap),
  runMonitorTest: (groupId: string) =>
    httpPost<DqcRunRecordItem | null>('/api/dqc/rule-configs/monitor-editor/run-test', { groupId }).then(unwrap),
  fetchPreviewTimes: (hourInterval?: number | string, minuteOffset?: number | string) =>
    httpGet<string[]>('/api/dqc/rule-configs/preview-times', { params: { hourInterval, minuteOffset } }).then(unwrap),
  fetchProjectWorkflows: (projectCode?: string) =>
    httpGet<Array<{ label: string; value: string; projectCode: string; projectName: string }>>('/api/dqc/rule-configs/workflows', { params: { projectCode } }).then(unwrap),
  saveRule: (payload: Partial<DqcRuleDetailItem> & { tableId?: string }) =>
    httpPost<DqcRuleDetailItem>('/api/dqc/rules/save', payload).then(unwrap),
  deleteRule: (id: string) =>
    httpPost('/api/dqc/rules/delete', { id }).then(unwrap),
  toggleRule: (id: string) =>
    httpPost<DqcRuleDetailItem>('/api/dqc/rules/toggle', { id }).then(unwrap),

  fetchRuns: (params: { tableName?: string; ruleGroupName?: string; triggerType?: string; runStatus?: string; alarmStatus?: string; isSelf?: boolean; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<DqcPagedResult<DqcRunRecordItem>>('/api/dqc/runs', { params }).then(unwrap),
  fetchRunDetail: (runRecordId: string) =>
    httpGet<{ record: DqcRunRecordItem; rules: DqcRunRuleRecordItem[] } | null>('/api/dqc/runs/detail', { params: { runRecordId } }).then(unwrap),
  rerunRecord: (id: string) =>
    httpPost<DqcRunRecordItem>('/api/dqc/runs/rerun', { id }).then(unwrap),

  fetchDiffs: (params: { taskId?: string; taskName?: string; compareMode?: string; sourceTableName?: string; targetTableName?: string; taskStatus?: string; creator?: string; isSelf?: boolean; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<DqcPagedResult<DqcDiffItem>>('/api/dqc/diffs', { params }).then(unwrap),
  fetchDiffDetail: (id: string) =>
    httpGet<DqcDiffConfig | null>('/api/dqc/diffs/detail', { params: { id } }).then(unwrap),
  fetchDiffReport: (id: string) =>
    httpGet<{ summary: DqcDiffReportSummary; detail: DqcDiffReportDetailItem[]; logs: DqcDiffLogItem[] } | null>('/api/dqc/diffs/report', { params: { id } }).then(unwrap),
  saveDiff: (payload: Partial<DqcDiffConfig & DqcDiffItem>) =>
    httpPost<DqcDiffItem>('/api/dqc/diffs/save', payload).then(unwrap),
  deleteDiff: (id: string) =>
    httpPost('/api/dqc/diffs/delete', { id }).then(unwrap),
  runDiff: (id: string) =>
    httpPost<DqcDiffItem>('/api/dqc/diffs/run', { id }).then(unwrap),

  fetchTests: (params: { taskName?: string; databaseName?: string; tableName?: string; createUser?: string; isSelf?: boolean; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<DqcPagedResult<DqcTestTaskItem>>('/api/dqc/tests', { params }).then(unwrap),
  fetchTestInstances: (taskId: string) =>
    httpGet<DqcTestInstanceItem[]>('/api/dqc/tests/instances', { params: { taskId } }).then(unwrap),
  fetchTestDetail: (id: string) =>
    httpGet<DqcTestTaskDetail | null>('/api/dqc/tests/detail', { params: { id } }).then(unwrap),
  fetchTestReport: (instanceId: string) =>
    httpGet<{ overview: DqcTestReportOverview; probeRecords: DqcTestProbeItem[]; ruleRecords: DqcTestRuleReportItem[]; logs: DqcDiffLogItem[] } | null>('/api/dqc/tests/report', { params: { instanceId } }).then(unwrap),
  saveTestFeedback: (payload: { instanceId: string; feedbackStatus: 'EXPECT_MATCH' | 'EXPECT_NOT_MATCH'; feedbackText?: string }) =>
    httpPost('/api/dqc/tests/report/feedback', payload).then(unwrap),
  saveTest: (payload: Partial<DqcTestTaskDetail & DqcTestTaskItem>) =>
    httpPost<DqcTestTaskItem>('/api/dqc/tests/save', payload).then(unwrap),
  deleteTest: (id: string) =>
    httpPost('/api/dqc/tests/delete', { id }).then(unwrap),
  runTest: (id: string) =>
    httpPost<DqcTestInstanceItem>('/api/dqc/tests/run', { id }).then(unwrap),
};

export default DqcApi;
