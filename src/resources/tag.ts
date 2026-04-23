import { httpGet, httpPost, type YqgResponse } from '@/utils/request';
import type {
  TagMenuNode,
  MetricItem,
  RuleTagItem,
  GroupItem,
  SqlGroupItem,
  TimingItem,
  SystemAuthItem,
  SystemAppItem,
  ContentAuthItem,
  CategoryNode,
  WhiteListItem,
  UserPictureItem,
  TagAreaOption,
  PagedResult,
  UserSearchResult,
  BloodlineNode,
  TagOpsOverview,
  TagOpsSectionItem,
  TagOpsExecRecord,
  TestDataRecord,
} from '@/mocks/data/tag';

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

export type {
  TagMenuNode,
  MetricItem,
  RuleTagItem,
  GroupItem,
  SqlGroupItem,
  TimingItem,
  SystemAuthItem,
  SystemAppItem,
  ContentAuthItem,
  CategoryNode,
  WhiteListItem,
  UserPictureItem,
  TagAreaOption,
  PagedResult,
  UserSearchResult,
  BloodlineNode,
  TagOpsOverview,
  TagOpsSectionItem,
  TagOpsExecRecord,
  TestDataRecord,
};

const TagApi = {
  fetchMenu: (area: string) =>
    httpGet<TagMenuNode[]>('/api/tag/menu', { params: { area } }).then(unwrap),
  fetchAreas: () => httpGet<TagAreaOption[]>('/api/tag/areas').then(unwrap),
  fetchEnums: () => httpGet<Record<string, unknown>>('/api/tag/enums').then(unwrap),

  fetchMetrics: (params: {
    keyword?: string;
    category?: string;
    metricsCode?: string;
    metricsName?: string;
    type?: string;
    metricsType?: string;
    creator?: string;
    metricsCustomType?: string;
    status?: string;
    parentId?: string;
    metricsTimeLiness?: string;
    ownTable?: string;
    ownColumn?: string;
    pageNo?: number;
    pageSize?: number;
  } = {}) =>
    httpGet<PagedResult<MetricItem>>('/api/tag/metrics', { params }).then(unwrap),
  saveMetric: (payload: Partial<MetricItem>) =>
    httpPost<MetricItem>('/api/tag/metrics/save', payload).then(unwrap),
  deleteMetric: (id: string) =>
    httpPost('/api/tag/metrics/delete', { id }).then(unwrap),
  batchDisableMetrics: (ids: string[]) =>
    httpPost('/api/tag/metrics/batch-disable', { ids }).then(unwrap),
  toggleMetricStatus: (id: string) =>
    httpPost('/api/tag/metrics/toggle-status', { id }).then(unwrap),
  fetchMetricEnumOptions: (params: { typeName: 'tables' | 'columns'; dbName?: string; tableName?: string }) =>
    httpGet<Array<{ label: string; value: string }>>('/api/tag/metrics/enums', { params }).then(unwrap),
  checkMetricIsNewTable: (params: { dbName?: string; tableName?: string }) =>
    httpGet<boolean>('/api/tag/metrics/check-new-table', { params }).then(unwrap),
  addMetricDepTable: (payload: { dolphinProjectId?: string; dolphinProcessId?: string; dbName?: string; tableName?: string }) =>
    httpPost<{ success: boolean }>('/api/tag/metrics/add-dep-table', payload).then(unwrap),
  fetchMetricProjects: () =>
    httpGet<Array<{ label: string; value: string }>>('/api/tag/white-list/projects').then(unwrap),
  fetchMetricWorkflows: (projectId: string) =>
    httpGet<Array<{ label: string; value: string }>>('/api/tag/white-list/workflows', { params: { projectId } }).then(unwrap),

  fetchRules: (params: {
    keyword?: string;
    metricsName?: string;
    ruleCode?: string;
    ruleName?: string;
    ruleTimeliness?: string;
    status?: string;
    customType?: string;
    parentId?: string;
    creatorName?: string;
    pageNo?: number;
    pageSize?: number;
  } = {}) =>
    httpGet<PagedResult<RuleTagItem>>('/api/tag/rules', { params }).then(unwrap),
  saveRule: (payload: Partial<RuleTagItem>) =>
    httpPost<RuleTagItem>('/api/tag/rules/save', payload).then(unwrap),
  deleteRule: (id: string) =>
    httpPost('/api/tag/rules/delete', { id }).then(unwrap),
  toggleRuleStatus: (id: string) =>
    httpPost('/api/tag/rules/toggle-status', { id }).then(unwrap),
  executeSqlRule: (code: string) =>
    httpPost<{ success: boolean; message?: string }>('/api/tag/rules/execute-sql', { code }).then(unwrap),

  fetchGroups: (params: {
    keyword?: string;
    groupCode?: string;
    groupName?: string;
    parentId?: string;
    groupType?: string;
    creatorName?: string;
    sourceType?: string;
    pageNo?: number;
    pageSize?: number;
    sqlOnly?: 0 | 1;
  } = {}) =>
    httpGet<PagedResult<GroupItem>>('/api/tag/groups', { params }).then(unwrap),
  saveGroup: (payload: Partial<GroupItem>) =>
    httpPost<GroupItem>('/api/tag/groups/save', payload).then(unwrap),
  deleteGroup: (id: string) =>
    httpPost('/api/tag/groups/delete', { id }).then(unwrap),
  batchEditGroups: (ids: string[]) =>
    httpPost('/api/tag/groups/batch-edit', { ids }).then(unwrap),
  exportGroup: (id: string) =>
    httpPost<{ fileName: string; content: string }>('/api/tag/groups/export', { id }).then(unwrap),
  countGroup: (id: string) =>
    httpPost<number>('/api/tag/groups/count', { id }).then(unwrap),

  fetchSqlGroups: (params: {
    keyword?: string;
    sqlGroupCode?: string;
    name?: string;
    status?: string;
    application?: string;
    ownerName?: string;
    creatorName?: string;
    pageNo?: number;
    pageSize?: number;
  } = {}) =>
    httpGet<PagedResult<SqlGroupItem>>('/api/tag/sql-groups', { params }).then(unwrap),
  saveSqlGroup: (payload: Partial<SqlGroupItem>) =>
    httpPost<SqlGroupItem>('/api/tag/sql-groups/save', payload).then(unwrap),
  deleteSqlGroup: (id: string) =>
    httpPost('/api/tag/sql-groups/delete', { id }).then(unwrap),
  changeSqlGroupStatus: (id: string, action: 'startPush' | 'stopPush') =>
    httpPost('/api/tag/sql-groups/change-status', { id, action }).then(unwrap),
  executeSqlGroup: (id: string, mode: 'EXECUTE' | 'PUSH' | 'ALL') =>
    httpPost<{ success: boolean; result: string }>('/api/tag/sql-groups/execute', { id, mode }).then(unwrap),
  sampleSqlGroup: (id: string, userIds: string[]) =>
    httpPost<{ result: string }>('/api/tag/sql-groups/sample', { id, userIds }).then(unwrap),
  transferSqlGroupOwner: (id: string, ownerName: string) =>
    httpPost('/api/tag/sql-groups/transfer-owner', { id, ownerName }).then(unwrap),
  exportSqlGroup: (id: string) =>
    httpPost<{ fileName: string; content: string }>('/api/tag/sql-groups/export', { id }).then(unwrap),

  fetchTimings: (params: {
    keyword?: string;
    groupCode?: string;
    metricsCode?: string;
    timing?: string;
    status?: string;
    application?: string;
    isFullData?: string;
    creatorName?: string;
    targetType?: string;
    pageNo?: number;
    pageSize?: number;
  } = {}) =>
    httpGet<PagedResult<TimingItem>>('/api/tag/timings', { params }).then(unwrap),
  saveTiming: (payload: Partial<TimingItem>) =>
    httpPost<TimingItem>('/api/tag/timings/save', payload).then(unwrap),
  deleteTiming: (id: string) =>
    httpPost('/api/tag/timings/delete', { id }).then(unwrap),
  runTiming: (id: string) =>
    httpPost<TimingItem>('/api/tag/timings/run', { id }).then(unwrap),
  toggleTimingStatus: (id: string) =>
    httpPost('/api/tag/timings/toggle-status', { id }).then(unwrap),
  fetchTimingTaskDetail: (id: string) =>
    httpGet<{
      id: string;
      steps: Array<{
        name: string;
        status: string;
        detail?: {
          nodeName?: string;
          executor?: string;
          triggerTime?: string;
          duration?: string;
          application?: string;
          message?: string;
          logs?: string[];
        };
      }>;
    }>('/api/tag/timings/task-detail', { params: { id } }).then(unwrap),

  fetchSystemAuth: (params: { appName?: string; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PagedResult<SystemAuthItem>>('/api/tag/system-auth', { params }).then(unwrap),
  saveSystemAuth: (payload: Partial<SystemAuthItem>) =>
    httpPost<SystemAuthItem>('/api/tag/system-auth/save', payload).then(unwrap),
  deleteSystemAuth: (id: string) =>
    httpPost('/api/tag/system-auth/delete', { id }).then(unwrap),

  fetchSystemApps: (params: { pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PagedResult<SystemAppItem>>('/api/tag/system-apps', { params }).then(unwrap),
  saveSystemApp: (payload: Partial<SystemAppItem>) =>
    httpPost<SystemAppItem>('/api/tag/system-apps/save', payload).then(unwrap),
  deleteSystemApp: (id: string) =>
    httpPost('/api/tag/system-apps/delete', { id }).then(unwrap),

  fetchContentAuth: (params: {
    chidoriName?: string;
    accessType?: string;
    type?: string;
    organizationId?: string;
    pageNo?: number;
    pageSize?: number;
  } = {}) => httpGet<PagedResult<ContentAuthItem>>('/api/tag/content-auth', { params }).then(unwrap),
  saveContentAuth: (payload: Partial<ContentAuthItem>) =>
    httpPost<ContentAuthItem>('/api/tag/content-auth/save', payload).then(unwrap),
  deleteContentAuth: (id: string) =>
    httpPost('/api/tag/content-auth/delete', { id }).then(unwrap),

  fetchOrganizations: (type: 'RULE' | 'GROUP') =>
    httpGet<Record<string, string>>('/api/tag/organizations', { params: { type } }).then(unwrap),

  fetchCategoryTree: () =>
    httpGet<CategoryNode>('/api/tag/category').then(unwrap),
  saveCategory: (payload: Partial<CategoryNode>) =>
    httpPost('/api/tag/category/save', payload).then(unwrap),
  deleteCategory: (id: string) =>
    httpPost('/api/tag/category/delete', { id }).then(unwrap),

  fetchWhiteList: (params: { dbName?: string; tableName?: string; usedType?: string; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PagedResult<WhiteListItem>>('/api/tag/white-list', { params }).then(unwrap),
  saveWhiteList: (payload: Partial<WhiteListItem>) =>
    httpPost<WhiteListItem>('/api/tag/white-list/save', payload).then(unwrap),
  deleteWhiteList: (id: string) =>
    httpPost('/api/tag/white-list/delete', { id }).then(unwrap),
  checkWhiteListUsage: (dbName: string, tableName: string) =>
    httpGet<{ used: boolean; mes: string; items: Array<{ type: string; code: string; name: string }> }>(
      '/api/tag/white-list/check-usage',
      { params: { dbName, tableName } },
    ).then(unwrap),

  fetchUserPictures: (params: { pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PagedResult<UserPictureItem>>('/api/tag/user-picture', { params }).then(unwrap),
  saveUserPicture: (payload: Partial<UserPictureItem>) =>
    httpPost<UserPictureItem>('/api/tag/user-picture/save', payload).then(unwrap),
  deleteUserPicture: (id: string) =>
    httpPost('/api/tag/user-picture/delete', { id }).then(unwrap),

  fetchUserSearchOptions: () =>
    httpGet<{ groups: Array<{ value: string; label: string }>; rules: Array<{ value: string; label: string }> }>(
      '/api/tag/user-search/options',
    ).then(unwrap),
  queryUserSearch: (payload: { userIds: string[]; groupCodes?: string[]; ruleCodes?: string[]; pageNo?: number; pageSize?: number }) =>
    httpPost<UserSearchResult>('/api/tag/user-search/query', payload).then(unwrap),
  exportUserSearch: (payload: { userIds: string[]; groupCodes?: string[]; ruleCodes?: string[] }) =>
    httpPost<{ fileName: string; content: string }>('/api/tag/user-search/export', payload).then(unwrap),

  fetchTestData: (params: { ruleCode?: string; userId?: string; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PagedResult<TestDataRecord>>('/api/tag/test-data', { params }).then(unwrap),
  saveTestData: (payload: Partial<TestDataRecord>) =>
    httpPost<TestDataRecord>('/api/tag/test-data/save', payload).then(unwrap),
  deleteTestData: (id: string) =>
    httpPost('/api/tag/test-data/delete', { id }).then(unwrap),

  fetchStatMeta: () =>
    httpGet<{
      apps: Array<{ value: string; label: string }>;
      modules: Array<{ value: string; label: string }>;
      urls: Array<{ value: string; label: string }>;
      codes: Array<{ value: string; label: string }>;
    }>('/api/tag/stat/meta').then(unwrap),
  queryStat: (payload: {
    tab: string;
    type: string;
    appName?: string;
    code?: string;
    url?: string;
    startDate?: string;
    endDate?: string;
  }) => httpPost<{ rows: Array<Record<string, unknown>>; points: Array<Record<string, unknown>> }>('/api/tag/stat/query', payload).then(unwrap),

  fetchBloodline: (params: { code: string; type: string; dep: number }) =>
    httpGet<BloodlineNode[]>('/api/tag/bloodline/query', { params }).then(unwrap),
  fetchBloodlineDetail: (code: string) =>
    httpGet<BloodlineNode | null>('/api/tag/bloodline/detail', { params: { code } }).then(unwrap),
  exportBloodline: (code: string) =>
    httpPost<{ fileName: string; content: string }>('/api/tag/bloodline/export', { code }).then(unwrap),

  fetchTagOpsDbs: () =>
    httpGet<string[]>('/api/tag/tag-ops/dbs').then(unwrap),
  fetchTagOpsTables: (dbName: string) =>
    httpGet<string[]>('/api/tag/tag-ops/tables', { params: { dbName } }).then(unwrap),
  fetchTagOpsOverview: (dbName: string, tableNames: string[]) =>
    httpGet<TagOpsOverview>('/api/tag/tag-ops/overview', { params: { dbName, tableNames: tableNames.join(',') } }).then(unwrap),
  fetchTagOpsSection: (
    section: 'preTask' | 'metric' | 'tag' | 'group' | 'timing',
    params: { pageNo?: number; pageSize?: number; keyword?: string } = {},
  ) => httpGet<PagedResult<TagOpsSectionItem>>(`/api/tag/tag-ops/section/${section}`, { params }).then(unwrap),
  fetchTagOpsExecRecords: (params: { pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PagedResult<TagOpsExecRecord>>('/api/tag/tag-ops/exec-records', { params }).then(unwrap),
  exportTagOps: (payload: { dbName: string; tableNames: string[] }) =>
    httpPost<{ fileName: string; content: string }>('/api/tag/tag-ops/export', payload).then(unwrap),

  generateTestData: (payload: { scene: string; count: number; seed?: string }) =>
    httpPost<Array<Record<string, unknown>>>('/api/tag/test-data/generate', payload).then(unwrap),
};

export default TagApi;
