/**
 * MSW handlers - 聚合所有接口的 mock 实现。
 *
 * 所有接口遵循原项目 @yqg/resource 返回结构：
 *   { status: { code: 0, detail: 'ok' }, body: <payload> }
 * 方便页面 resource 层统一解构 `res.data.body`。
 */

import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  countryOptions,
  mockUser,
  projectOptions,
  globalNotice,
} from './data/common';
import {
  getAlertOverview,
  getAlertEnums,
  queryAlerts,
  updateAlertStatus,
  batchUpdateAlerts,
  getAlertDetail,
  getAlertLogs,
  queryPolicies,
  savePolicy,
  deletePolicy,
  togglePolicy,
  setDefaultPolicy,
} from './data/alert';
import { metricList } from './data/metric';
import { assetList } from './data/datamap';
import { homeStats, homeRecentActivity } from './data/home';
import {
  buildTaskTree,
  buildTaskDetail,
  buildRunRecords,
  buildQueryResult,
  buildVersions,
  buildScheduleConfig,
  buildMonitorRules,
  buildQualityRules,
  buildTaskParams,
  buildTableTree,
  buildTableDetail,
  buildTableVersions,
  buildTableAuths,
  buildRecentTables,
  databaseOptions,
  ownerOptions,
  taskTypeOptions,
  tableDatabaseOptions,
  tableOwnerOptions,
} from './data/data-develop';
import {
  buildTableTree as buildExploreTableTree,
  buildFolderTree,
  buildAnalysisTaskTree,
  buildSqlHistory,
  buildTempTables,
  buildSqlResult,
  databaseFlatOptions,
} from './data/explore';
import {
  buildTagMenu,
  tagAreaOptions,
  queryMetrics,
  saveMetric,
  deleteMetric,
  batchDisableMetrics,
  toggleMetricStatus,
  getMetricEnumOptions,
  checkMetricIsNewTable,
  addMetricDepTable,
  getMetricProjects,
  getMetricWorkflows,
  queryRules,
  saveRule,
  deleteRule,
  toggleRuleStatus,
  executeSqlRule,
  queryGroups,
  saveGroup,
  deleteGroup,
  batchEditGroups,
  exportGroup,
  countGroup,
  querySqlGroups,
  saveSqlGroup,
  deleteSqlGroup,
  changeSqlGroupStatus,
  executeSqlGroup,
  sampleSqlGroup,
  transferSqlGroupOwner,
  exportSqlGroup,
  queryTimings,
  saveTiming,
  deleteTiming,
  runTiming,
  toggleTimingStatus,
  getTimingTaskDetail,
  querySystemAuth,
  saveSystemAuth,
  deleteSystemAuth,
  querySystemApps,
  saveSystemApp,
  deleteSystemApp,
  queryContentAuth,
  saveContentAuth,
  deleteContentAuth,
  getCategoryTree,
  saveCategory,
  deleteCategory,
  queryWhiteList,
  saveWhiteList,
  deleteWhiteList,
  getWhiteListUsage,
  queryUserPictures,
  saveUserPicture,
  deleteUserPicture,
  getUserSearchOptions,
  searchUsers,
  exportUsers,
  queryTestData,
  saveTestData,
  deleteTestData,
  getStatMeta,
  queryStat,
  getBloodline,
  getBloodlineDetail,
  exportBloodline,
  getOrganizations,
  getTagEnums,
  getTagOpsDbList,
  getTagOpsTableList,
  getTagOpsOverview,
  getTagOpsSection,
  getTagOpsExecRecords,
  exportTagOps,
  generateTestData,
} from './data/tag';
import {
  getDqcSummary,
  getDqcEnums,
  queryDqcTemplates,
  saveDqcTemplate,
  deleteDqcTemplate,
  getDqcRuleConfigTree,
  queryDqcRuleTableSuggestions,
  queryDqcRuleConfigs,
  getDqcRuleConfigDetail,
  getDqcRuleConfigTableInfo,
  getDqcRuleFieldOptions,
  getDqcRuleTemplateCatalog,
  getDqcRuleTemplateTree,
  getDqcRuleTemplateNames,
  generateDqcRuleCards,
  getDqcAiRecommendedRules,
  parseDqcSqlFields,
  getDqcMonitorEditor,
  saveDqcMonitorEditor,
  deleteDqcMonitorEditor,
  runDqcMonitorTest,
  getDqcPreviewTimes,
  getDqcProjectWorkflows,
  saveDqcRule,
  deleteDqcRule,
  toggleDqcRule,
  queryDqcRuns,
  getDqcRunDetail,
  rerunDqcRecord,
  queryDqcDiffs,
  getDqcDiffDetail,
  getDqcDiffReport,
  saveDqcDiff,
  deleteDqcDiff,
  runDqcDiff,
  queryDqcTests,
  getDqcTestInstances,
  getDqcTestDetail,
  getDqcTestReport,
  saveDqcTestFeedback,
  saveDqcTest,
  deleteDqcTest,
  runDqcTest,
} from './data/dqc';
import {
  buildTableTree as buildStudioTableTree,
  buildTaskTree as buildStudioTaskTree,
  buildDefaultTask as buildStudioDefaultTask,
  buildRunResult as buildStudioRunResult,
  buildPaginatedResults,
  buildTableExample,
  buildDownloadResults,
} from './data/studio';
import {
  buildOpsTasks,
  buildTaskTypeOptions as buildOpsTaskTypeOptions,
  buildOwnerOptions as buildOpsOwnerOptions,
  buildLogTabs,
} from './data/ops';
import {
  getScheduleSummary,
  getScheduleEnums,
  queryScheduleTasks,
  checkScheduleNeedDate,
  runScheduleTask,
  getScheduleLogs,
  getScheduleTaskDetail,
  queryScheduleInstances,
  rerunScheduleInstance,
  stopScheduleInstance,
  forceSuccessInstance,
  getDependencyView,
  getDependencyDiagnosis,
} from './data/schedule';
import {
  getDirectoryList as getSiderDirectoryList,
  searchDirectoryList as searchSiderDirectoryList,
  getTask as getSiderTask,
  createTask as createSiderTask,
  updateTask as updateSiderTask,
  deleteTask as deleteSiderTask,
  createDirectory as createSiderDirectory,
  updateDirectory as updateSiderDirectory,
  deleteDirectory as deleteSiderDirectory,
  moveTaskDirectory as moveSiderTaskDirectory,
  getProjectDatabases as getSiderProjectDatabases,
  getProjectUsers as getSiderProjectUsers,
  getTaskTypeList as getSiderTaskTypeList,
} from './data/sql-sider';
import {
  buildChatScript,
  mockQuickIntents,
  mockSessionList,
  mockFeatureStatus,
  mockDatabases,
  mockTablesByDatabase,
  mockEnum,
  mockRecentMessages,
  mockCheckpoint,
  type MockChatRequest,
} from './data/copilot';
import {
  dataMapRecentSessions,
  dataMapEarlierSessions,
  dataMapFavoriteTables,
  dataMapSuggestedPrompts,
} from './data/data-map-agent';

const ok = <T>(body: T) =>
  HttpResponse.json({
    status: { code: 0, detail: 'ok' },
    body,
  });

function paginate<T>(list: T[], pageNo = 1, pageSize = 10) {
  const total = list.length;
  const start = (pageNo - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  return { items, total, pageNo, pageSize };
}

export const handlers: HttpHandler[] = [
  http.get('/api/user/current', () => ok(mockUser)),
  http.post('/api/user/logout', () => ok({ success: true })),

  http.get('/api/common/country-options', () => ok(countryOptions)),
  http.get('/api/common/project-options', () => ok(projectOptions)),
  http.get('/api/common/global-notice', () => ok(globalNotice)),

  http.get('/api/schedule/summary', () => ok(getScheduleSummary())),
  http.get('/api/schedule/enums', () => ok(getScheduleEnums())),
  http.get('/api/schedule/tasks', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryScheduleTasks({
      taskName: url.searchParams.get('taskName') ?? undefined,
      taskType: url.searchParams.get('taskType') ?? undefined,
      taskStatus: url.searchParams.get('taskStatus') ?? undefined,
      owner: url.searchParams.get('owner') ?? undefined,
      scheduleType: url.searchParams.get('scheduleType') ?? undefined,
      lastRunStatus: url.searchParams.get('lastRunStatus') ?? undefined,
      myResponsibility: url.searchParams.get('myResponsibility') === 'true' || url.searchParams.get('onlyMyTasks') === 'true',
      pageNo: Number(url.searchParams.get('pageNo') ?? url.searchParams.get('pageNum') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      releaseDate: url.searchParams.get('releaseDateStart')
        ? {
            startTime: url.searchParams.get('releaseDateStart') ?? undefined,
            endTime: url.searchParams.get('releaseDateEnd') ?? undefined,
          }
        : undefined,
      lastScheduleBatch: url.searchParams.get('lastScheduleBatchStart')
        ? {
            startTime: url.searchParams.get('lastScheduleBatchStart') ?? undefined,
            endTime: url.searchParams.get('lastScheduleBatchEnd') ?? undefined,
          }
        : undefined,
    }));
  }),
  http.get('/api/schedule/tasks/need-date', ({ request }) => {
    const url = new URL(request.url);
    return ok(checkScheduleNeedDate(url.searchParams.get('taskId') ?? ''));
  }),
  http.get('/api/schedule/tasks/logs', ({ request }) => {
    const url = new URL(request.url);
    return ok(getScheduleLogs({
      processInstanceId: url.searchParams.get('processInstanceId') ?? undefined,
      skipLineNum: Number(url.searchParams.get('skipLineNum') ?? 0),
    }));
  }),
  http.get('/api/schedule/tasks/detail', ({ request }) => {
    const url = new URL(request.url);
    return ok(getScheduleTaskDetail(url.searchParams.get('taskId') ?? ''));
  }),
  http.post('/api/schedule/tasks/run', async ({ request }) => {
    const body = (await request.json()) as { taskId: string; scheduleTime?: string };
    return ok(runScheduleTask(body));
  }),
  http.get('/api/schedule/instances', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryScheduleInstances({
      taskName: url.searchParams.get('taskName') ?? undefined,
      taskType: url.searchParams.get('taskType') ?? undefined,
      runStatus: url.searchParams.get('runStatus') ?? undefined,
      scheduleType: url.searchParams.get('scheduleType') ?? undefined,
      scheduleExecuteType: url.searchParams.get('scheduleExecuteType') ?? undefined,
      scheduleUser: url.searchParams.get('scheduleUser') ?? undefined,
      pageNo: Number(url.searchParams.get('pageNo') ?? url.searchParams.get('pageNum') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      scheduleBatch: url.searchParams.get('scheduleBatchStart')
        ? {
            startTime: url.searchParams.get('scheduleBatchStart') ?? undefined,
            endTime: url.searchParams.get('scheduleBatchEnd') ?? undefined,
          }
        : undefined,
    }));
  }),
  http.get('/api/schedule/instances/logs', ({ request }) => {
    const url = new URL(request.url);
    return ok(getScheduleLogs({
      processInstanceId: url.searchParams.get('processInstanceId') ?? undefined,
      skipLineNum: Number(url.searchParams.get('skipLineNum') ?? 0),
    }));
  }),
  http.post('/api/schedule/instances/rerun', async ({ request }) => {
    const body = (await request.json()) as { taskInstanceId: string };
    return ok(rerunScheduleInstance(body));
  }),
  http.post('/api/schedule/instances/stop', async ({ request }) => {
    const body = (await request.json()) as { taskInstanceId: string };
    return ok(stopScheduleInstance(body));
  }),
  http.post('/api/schedule/instances/force-success', async ({ request }) => {
    const body = (await request.json()) as { taskInstanceId: string };
    return ok(forceSuccessInstance(body));
  }),
  http.get('/api/schedule/dependency/view', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDependencyView(url.searchParams.get('taskId') ?? ''));
  }),
  http.get('/api/schedule/dependency/diagnosis', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDependencyDiagnosis(url.searchParams.get('taskId') ?? ''));
  }),

  http.get('/api/alert/overview', () => ok(getAlertOverview())),
  http.get('/api/alert/enums', () => ok(getAlertEnums())),
  http.get('/api/alert/events', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryAlerts({
      keyword: url.searchParams.get('keyword') ?? undefined,
      eventId: url.searchParams.get('eventId') ?? undefined,
      resourceType: url.searchParams.get('resourceType') ?? undefined,
      eventTypes: url.searchParams.getAll('eventTypes'),
      statuses: url.searchParams.getAll('statuses'),
      severities: url.searchParams.getAll('severities'),
      owners: url.searchParams.getAll('owners'),
      lastOperators: url.searchParams.getAll('lastOperators'),
      isSelf: url.searchParams.get('isSelf') === 'true',
      todayOnly: url.searchParams.get('todayOnly') === 'true',
      status: url.searchParams.get('status') ?? undefined,
      severity: url.searchParams.get('severity') ?? undefined,
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }));
  }),
  http.get('/api/alert/events/detail', ({ request }) => {
    const url = new URL(request.url);
    return ok(getAlertDetail(url.searchParams.get('id') ?? ''));
  }),
  http.get('/api/alert/events/logs', ({ request }) => {
    const url = new URL(request.url);
    return ok(getAlertLogs(url.searchParams.get('id') ?? ''));
  }),
  http.post('/api/alert/events/update-status', async ({ request }) => {
    const body = (await request.json()) as {
      id: string;
      action: 'acknowledge' | 'resolve' | 'falsePositive' | 'silence' | 'transfer';
      owner?: string;
      remark?: string;
      reason?: string;
      rootCause?: string;
      silenceHours?: number;
    };
    return ok(updateAlertStatus(body.id, body.action, body));
  }),
  http.post('/api/alert/events/batch-update', async ({ request }) => {
    const body = (await request.json()) as {
      ids: string[];
      action: 'acknowledge' | 'resolve' | 'falsePositive' | 'silence' | 'transfer';
      owner?: string;
      remark?: string;
      reason?: string;
      rootCause?: string;
      silenceHours?: number;
    };
    return ok(batchUpdateAlerts(body.ids, body.action, body));
  }),
  http.get('/api/alert/policies', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryPolicies({
      keyword: url.searchParams.get('keyword') ?? undefined,
      createdBy: url.searchParams.get('createdBy') ?? undefined,
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }));
  }),
  http.post('/api/alert/policies/save', async ({ request }) => ok(savePolicy((await request.json()) as Record<string, unknown>))),
  http.post('/api/alert/policies/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(deletePolicy(body.id));
  }),
  http.post('/api/alert/policies/toggle', async ({ request }) => {
    const body = (await request.json()) as { id: string; enabled: boolean };
    return ok(togglePolicy(body.id, body.enabled));
  }),
  http.post('/api/alert/policies/set-default', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(setDefaultPolicy(body.id));
  }),

  http.get('/api/dqc/summary', () => ok(getDqcSummary())),
  http.get('/api/dqc/enums', () => ok(getDqcEnums())),
  http.get('/api/dqc/templates', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryDqcTemplates({
      type: url.searchParams.get('type') ?? undefined,
      scope: url.searchParams.get('scope') ?? undefined,
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }));
  }),
  http.post('/api/dqc/templates/save', async ({ request }) => ok(saveDqcTemplate((await request.json()) as Record<string, unknown>))),
  http.post('/api/dqc/templates/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(deleteDqcTemplate(body.id));
  }),
  http.get('/api/dqc/rule-configs/tree', () => ok(getDqcRuleConfigTree())),
  http.get('/api/dqc/rule-configs/table-suggestions', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryDqcRuleTableSuggestions(url.searchParams.get('keyword') ?? undefined));
  }),
  http.get('/api/dqc/rule-configs', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryDqcRuleConfigs({
      tableName: url.searchParams.get('tableName') ?? undefined,
      ownerUser: url.searchParams.get('ownerUser') ?? undefined,
      notHasRule: url.searchParams.get('notHasRule') === 'true',
      isSelf: url.searchParams.get('isSelf') === 'true',
      dbSourceType: url.searchParams.get('dbSourceType') ?? undefined,
      dataSourceId: url.searchParams.get('dataSourceId') ?? undefined,
      databaseName: url.searchParams.get('databaseName') ?? undefined,
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }));
  }),
  http.get('/api/dqc/rule-configs/detail', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcRuleConfigDetail(url.searchParams.get('tableId') ?? ''));
  }),
  http.get('/api/dqc/rule-configs/table-info', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcRuleConfigTableInfo(url.searchParams.get('tableId') ?? ''));
  }),
  http.get('/api/dqc/rule-configs/fields', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcRuleFieldOptions(url.searchParams.get('tableId') ?? ''));
  }),
  http.get('/api/dqc/rule-configs/template-catalog', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcRuleTemplateCatalog(url.searchParams.get('tableId') ?? '', url.searchParams.get('scopeType') ?? undefined));
  }),
  http.get('/api/dqc/rule-configs/template-tree', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcRuleTemplateTree(url.searchParams.get('tableId') ?? '', url.searchParams.get('scopeType') ?? undefined));
  }),
  http.get('/api/dqc/rule-configs/template-names', () => ok(getDqcRuleTemplateNames())),
  http.post('/api/dqc/rule-configs/generate-cards', async ({ request }) =>
    ok(generateDqcRuleCards((await request.json()) as Record<string, unknown> as never))),
  http.get('/api/dqc/rule-configs/ai-recommend', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcAiRecommendedRules(url.searchParams.get('tableId') ?? ''));
  }),
  http.post('/api/dqc/rule-configs/parse-sql', async ({ request }) => {
    const body = (await request.json()) as { sql: string };
    return ok(parseDqcSqlFields(body.sql));
  }),
  http.get('/api/dqc/rule-configs/monitor-editor', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcMonitorEditor(url.searchParams.get('groupId') ?? undefined, url.searchParams.get('tableId') ?? undefined));
  }),
  http.post('/api/dqc/rule-configs/monitor-editor/save', async ({ request }) =>
    ok(saveDqcMonitorEditor((await request.json()) as Record<string, unknown> as never))),
  http.post('/api/dqc/rule-configs/monitor-editor/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(deleteDqcMonitorEditor(body.id));
  }),
  http.post('/api/dqc/rule-configs/monitor-editor/run-test', async ({ request }) => {
    const body = (await request.json()) as { groupId: string };
    return ok(runDqcMonitorTest(body.groupId));
  }),
  http.get('/api/dqc/rule-configs/preview-times', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcPreviewTimes(Number(url.searchParams.get('hourInterval') ?? 1), Number(url.searchParams.get('minuteOffset') ?? 0)));
  }),
  http.get('/api/dqc/rule-configs/workflows', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcProjectWorkflows(url.searchParams.get('projectCode') ?? undefined));
  }),
  http.post('/api/dqc/rules/save', async ({ request }) => ok(saveDqcRule((await request.json()) as Record<string, unknown>))),
  http.post('/api/dqc/rules/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(deleteDqcRule(body.id));
  }),
  http.post('/api/dqc/rules/toggle', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(toggleDqcRule(body.id));
  }),
  http.get('/api/dqc/runs', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryDqcRuns({
      tableName: url.searchParams.get('tableName') ?? undefined,
      ruleGroupName: url.searchParams.get('ruleGroupName') ?? undefined,
      triggerType: url.searchParams.get('triggerType') ?? undefined,
      runStatus: url.searchParams.get('runStatus') ?? undefined,
      alarmStatus: url.searchParams.get('alarmStatus') ?? undefined,
      isSelf: url.searchParams.get('isSelf') === 'true',
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }));
  }),
  http.get('/api/dqc/runs/detail', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcRunDetail(url.searchParams.get('runRecordId') ?? ''));
  }),
  http.post('/api/dqc/runs/rerun', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(rerunDqcRecord(body.id));
  }),
  http.get('/api/dqc/diffs', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryDqcDiffs({
      taskId: url.searchParams.get('taskId') ?? undefined,
      taskName: url.searchParams.get('taskName') ?? undefined,
      compareMode: url.searchParams.get('compareMode') ?? undefined,
      sourceTableName: url.searchParams.get('sourceTableName') ?? undefined,
      targetTableName: url.searchParams.get('targetTableName') ?? undefined,
      taskStatus: url.searchParams.get('taskStatus') ?? undefined,
      creator: url.searchParams.get('creator') ?? undefined,
      isSelf: url.searchParams.get('isSelf') === 'true',
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }));
  }),
  http.get('/api/dqc/diffs/detail', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcDiffDetail(url.searchParams.get('id') ?? ''));
  }),
  http.get('/api/dqc/diffs/report', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcDiffReport(url.searchParams.get('id') ?? ''));
  }),
  http.post('/api/dqc/diffs/save', async ({ request }) => ok(saveDqcDiff((await request.json()) as Record<string, unknown>))),
  http.post('/api/dqc/diffs/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(deleteDqcDiff(body.id));
  }),
  http.post('/api/dqc/diffs/run', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(runDqcDiff(body.id));
  }),
  http.get('/api/dqc/tests', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryDqcTests({
      taskName: url.searchParams.get('taskName') ?? undefined,
      databaseName: url.searchParams.get('databaseName') ?? undefined,
      tableName: url.searchParams.get('tableName') ?? undefined,
      createUser: url.searchParams.get('createUser') ?? undefined,
      isSelf: url.searchParams.get('isSelf') === 'true',
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }));
  }),
  http.get('/api/dqc/tests/instances', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcTestInstances(url.searchParams.get('taskId') ?? ''));
  }),
  http.get('/api/dqc/tests/detail', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcTestDetail(url.searchParams.get('id') ?? ''));
  }),
  http.get('/api/dqc/tests/report', ({ request }) => {
    const url = new URL(request.url);
    return ok(getDqcTestReport(url.searchParams.get('instanceId') ?? ''));
  }),
  http.post('/api/dqc/tests/report/feedback', async ({ request }) => {
    const body = (await request.json()) as { instanceId: string; feedbackStatus: 'EXPECT_MATCH' | 'EXPECT_NOT_MATCH'; feedbackText?: string };
    return ok(saveDqcTestFeedback(body.instanceId, body));
  }),
  http.post('/api/dqc/tests/save', async ({ request }) => ok(saveDqcTest((await request.json()) as Record<string, unknown>))),
  http.post('/api/dqc/tests/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(deleteDqcTest(body.id));
  }),
  http.post('/api/dqc/tests/run', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(runDqcTest(body.id));
  }),

  http.get('/api/home/stats', () => ok(homeStats)),
  http.get('/api/home/recent-activity', () => ok(homeRecentActivity)),

  http.get('/api/metric/list', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.trim() ?? '';
    const pageNo = Number(url.searchParams.get('pageNo') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    const status = url.searchParams.get('status') ?? '';

    const filtered = metricList.filter((item) => {
      const hitKeyword =
        !keyword ||
        item.name.includes(keyword) ||
        item.englishName.toLowerCase().includes(keyword.toLowerCase());
      const hitStatus = !status || item.status === status;
      return hitKeyword && hitStatus;
    });

    return ok(paginate(filtered, pageNo, pageSize));
  }),

  http.get('/api/metric/detail/:id', ({ params }) => {
    const found = metricList.find((m) => m.id === params.id);
    if (!found) {
      return ok(null);
    }
    return ok(found);
  }),

  http.get('/api/datamap/asset/list', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.trim() ?? '';
    const layer = url.searchParams.get('layer') ?? '';
    const pageNo = Number(url.searchParams.get('pageNo') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);

    const filtered = assetList.filter((item) => {
      const hitKeyword =
        !keyword ||
        item.tableName.includes(keyword) ||
        item.cnName.includes(keyword);
      const hitLayer = !layer || item.layer === layer;
      return hitKeyword && hitLayer;
    });
    return ok(paginate(filtered, pageNo, pageSize));
  }),

  http.get('/api/datamap/asset/detail/:id', ({ params }) => {
    const found = assetList.find((a) => a.id === params.id);
    return ok(found ?? null);
  }),

  http.get('/api/data-develop/task/tree', () => ok(buildTaskTree())),
  http.get('/api/data-develop/task/filter-options', () =>
    ok({
      databases: databaseOptions,
      owners: ownerOptions,
      taskTypes: taskTypeOptions,
    }),
  ),
  http.get('/api/data-develop/task/detail/:id', ({ params }) =>
    ok(buildTaskDetail(String(params.id))),
  ),
  http.get('/api/data-develop/task/run-records', () => ok(buildRunRecords())),
  http.post('/api/data-develop/task/query', () => ok(buildQueryResult())),
  http.get('/api/data-develop/task/versions', () => ok(buildVersions())),
  http.get('/api/data-develop/task/schedule', () => ok(buildScheduleConfig())),
  http.get('/api/data-develop/task/monitors', () => ok(buildMonitorRules())),
  http.get('/api/data-develop/task/quality-rules', () => ok(buildQualityRules())),
  http.get('/api/data-develop/task/params', () => ok(buildTaskParams())),

  http.get('/api/data-develop/table/tree', () => ok(buildTableTree())),
  http.get('/api/data-develop/table/filter-options', () =>
    ok({
      databases: tableDatabaseOptions,
      owners: tableOwnerOptions,
    }),
  ),
  http.get('/api/data-develop/table/detail/:id', ({ params }) =>
    ok(buildTableDetail(String(params.id))),
  ),
  http.get('/api/data-develop/table/versions', () => ok(buildTableVersions())),
  http.get('/api/data-develop/table/auths', () => ok(buildTableAuths())),
  http.get('/api/data-develop/table/recent', () => ok(buildRecentTables())),
  http.post('/api/data-develop/table/create', () =>
    ok({ success: true, tableId: `new-${Date.now()}` }),
  ),
  http.post('/api/data-develop/table/rollback', () => ok({ success: true })),

  http.get('/api/explore/sql/table-tree', () => ok(buildExploreTableTree())),
  http.get('/api/explore/sql/folder-tree', () => ok(buildFolderTree())),
  http.get('/api/explore/sql/analysis-tree', () => ok(buildAnalysisTaskTree())),
  http.get('/api/explore/sql/databases', () => ok(databaseFlatOptions)),
  http.get('/api/explore/sql/history', ({ request }) => {
    const url = new URL(request.url);
    const pageNo = Number(url.searchParams.get('pageNo') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    const list = buildSqlHistory();
    return ok(paginate(list, pageNo, pageSize));
  }),
  http.get('/api/explore/sql/temp-tables', () => ok(buildTempTables())),
  http.post('/api/explore/sql/run', async ({ request }) => {
    const body = (await request.json()) as { sql: string };
    return ok(buildSqlResult(body?.sql ?? ''));
  }),

  http.get('/api/tag/menu', ({ request }) => {
    const url = new URL(request.url);
    return ok(buildTagMenu(url.searchParams.get('area') ?? 'CN'));
  }),
  http.get('/api/tag/areas', () => ok(tagAreaOptions)),
  http.get('/api/tag/metrics', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      queryMetrics({
        keyword: url.searchParams.get('keyword') ?? undefined,
        category: url.searchParams.get('category') ?? undefined,
        metricsCode: url.searchParams.get('metricsCode') ?? undefined,
        metricsName: url.searchParams.get('metricsName') ?? undefined,
        type: url.searchParams.get('type') ?? undefined,
        metricsType: url.searchParams.get('metricsType') ?? undefined,
        creator: url.searchParams.get('creator') ?? undefined,
        metricsCustomType: url.searchParams.get('metricsCustomType') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        parentId: url.searchParams.get('parentId') ?? undefined,
        metricsTimeLiness: url.searchParams.get('metricsTimeLiness') ?? undefined,
        ownTable: url.searchParams.get('ownTable') ?? undefined,
        ownColumn: url.searchParams.get('ownColumn') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      }),
    );
  }),
  http.post('/api/tag/metrics/save', async ({ request }) => ok(saveMetric((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/metrics/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteMetric(body.id);
    return ok({ success: true });
  }),
  http.post('/api/tag/metrics/batch-disable', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] };
    batchDisableMetrics(body.ids || []);
    return ok({ success: true });
  }),
  http.post('/api/tag/metrics/toggle-status', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    toggleMetricStatus(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/metrics/enums', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      getMetricEnumOptions(
        url.searchParams.get('typeName') ?? '',
        url.searchParams.get('dbName') ?? undefined,
        url.searchParams.get('tableName') ?? undefined,
      ),
    );
  }),
  http.get('/api/tag/metrics/check-new-table', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      checkMetricIsNewTable(
        url.searchParams.get('dbName') ?? undefined,
        url.searchParams.get('tableName') ?? undefined,
      ),
    );
  }),
  http.post('/api/tag/metrics/add-dep-table', async ({ request }) =>
    ok(addMetricDepTable((await request.json()) as Record<string, unknown> as {
      dolphinProjectId?: string;
      dolphinProcessId?: string;
      dbName?: string;
      tableName?: string;
    }))),
  http.get('/api/tag/white-list/projects', () => ok(getMetricProjects())),
  http.get('/api/tag/white-list/workflows', ({ request }) => {
    const url = new URL(request.url);
    return ok(getMetricWorkflows(url.searchParams.get('projectId') ?? undefined));
  }),
  http.get('/api/tag/rules', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      queryRules({
        keyword: url.searchParams.get('keyword') ?? undefined,
        metricsName: url.searchParams.get('metricsName') ?? undefined,
        ruleCode: url.searchParams.get('ruleCode') ?? undefined,
        ruleName: url.searchParams.get('ruleName') ?? undefined,
        ruleTimeliness: url.searchParams.get('ruleTimeliness') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        customType: url.searchParams.get('customType') ?? undefined,
        parentId: url.searchParams.get('parentId') ?? undefined,
        creatorName: url.searchParams.get('creatorName') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      }),
    );
  }),
  http.post('/api/tag/rules/save', async ({ request }) => ok(saveRule((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/rules/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteRule(body.id);
    return ok({ success: true });
  }),
  http.post('/api/tag/rules/toggle-status', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    toggleRuleStatus(body.id);
    return ok({ success: true });
  }),
  http.post('/api/tag/rules/execute-sql', async ({ request }) => {
    const body = (await request.json()) as { code: string };
    return ok(executeSqlRule(body.code));
  }),
  http.get('/api/tag/groups', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      queryGroups({
        keyword: url.searchParams.get('keyword') ?? undefined,
        groupCode: url.searchParams.get('groupCode') ?? undefined,
        groupName: url.searchParams.get('groupName') ?? undefined,
        parentId: url.searchParams.get('parentId') ?? undefined,
        groupType: url.searchParams.get('groupType') ?? undefined,
        creatorName: url.searchParams.get('creatorName') ?? undefined,
        sourceType: url.searchParams.get('sourceType') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 10),
        sqlOnly: url.searchParams.get('sqlOnly') === '1',
      }),
    );
  }),
  http.post('/api/tag/groups/save', async ({ request }) => ok(saveGroup((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/groups/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteGroup(body.id);
    return ok({ success: true });
  }),
  http.post('/api/tag/groups/batch-edit', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] };
    batchEditGroups(body.ids || []);
    return ok({ success: true });
  }),
  http.post('/api/tag/groups/export', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(exportGroup(body.id));
  }),
  http.post('/api/tag/groups/count', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(countGroup(body.id));
  }),
  http.get('/api/tag/sql-groups', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      querySqlGroups({
        keyword: url.searchParams.get('keyword') ?? undefined,
        sqlGroupCode: url.searchParams.get('sqlGroupCode') ?? undefined,
        name: url.searchParams.get('name') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        application: url.searchParams.get('application') ?? undefined,
        ownerName: url.searchParams.get('ownerName') ?? undefined,
        creatorName: url.searchParams.get('creatorName') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      }),
    );
  }),
  http.post('/api/tag/sql-groups/save', async ({ request }) => ok(saveSqlGroup((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/sql-groups/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteSqlGroup(body.id);
    return ok({ success: true });
  }),
  http.post('/api/tag/sql-groups/change-status', async ({ request }) => {
    const body = (await request.json()) as { id: string; action: 'startPush' | 'stopPush' };
    changeSqlGroupStatus(body.id, body.action);
    return ok({ success: true });
  }),
  http.post('/api/tag/sql-groups/execute', async ({ request }) => {
    const body = (await request.json()) as { id: string; mode: 'EXECUTE' | 'PUSH' | 'ALL' };
    return ok(executeSqlGroup(body.id, body.mode));
  }),
  http.post('/api/tag/sql-groups/sample', async ({ request }) => {
    const body = (await request.json()) as { id: string; userIds: string[] };
    return ok({ result: sampleSqlGroup(body.id, body.userIds || []) });
  }),
  http.post('/api/tag/sql-groups/transfer-owner', async ({ request }) => {
    const body = (await request.json()) as { id: string; ownerName: string };
    transferSqlGroupOwner(body.id, body.ownerName);
    return ok({ success: true });
  }),
  http.post('/api/tag/sql-groups/export', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(exportSqlGroup(body.id));
  }),
  http.get('/api/tag/timings', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      queryTimings({
        keyword: url.searchParams.get('keyword') ?? undefined,
        groupCode: url.searchParams.get('groupCode') ?? undefined,
        metricsCode: url.searchParams.get('metricsCode') ?? undefined,
        timing: url.searchParams.get('timing') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        application: url.searchParams.get('application') ?? undefined,
        isFullData: url.searchParams.get('isFullData') ?? undefined,
        creatorName: url.searchParams.get('creatorName') ?? undefined,
        targetType: url.searchParams.get('targetType') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      }),
    );
  }),
  http.post('/api/tag/timings/save', async ({ request }) => ok(saveTiming((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/timings/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteTiming(body.id);
    return ok({ success: true });
  }),
  http.post('/api/tag/timings/run', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    return ok(runTiming(body.id));
  }),
  http.post('/api/tag/timings/toggle-status', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    toggleTimingStatus(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/timings/task-detail', ({ request }) => {
    const url = new URL(request.url);
    return ok(getTimingTaskDetail(url.searchParams.get('id') ?? ''));
  }),
  http.get('/api/tag/system-auth', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      querySystemAuth({
        appName: url.searchParams.get('appName') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 20),
      }),
    );
  }),
  http.post('/api/tag/system-auth/save', async ({ request }) => ok(saveSystemAuth((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/system-auth/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteSystemAuth(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/system-apps', ({ request }) => {
    const url = new URL(request.url);
    return ok(querySystemApps({
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
    }));
  }),
  http.post('/api/tag/system-apps/save', async ({ request }) => ok(saveSystemApp((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/system-apps/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteSystemApp(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/content-auth', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      queryContentAuth({
        chidoriName: url.searchParams.get('chidoriName') ?? undefined,
        accessType: url.searchParams.get('accessType') ?? undefined,
        type: url.searchParams.get('type') ?? undefined,
        organizationId: url.searchParams.get('organizationId') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 20),
      }),
    );
  }),
  http.post('/api/tag/content-auth/save', async ({ request }) => ok(saveContentAuth((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/content-auth/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteContentAuth(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/category', () => ok(getCategoryTree())),
  http.post('/api/tag/category/save', async ({ request }) => {
    saveCategory((await request.json()) as Record<string, unknown>);
    return ok({ success: true });
  }),
  http.post('/api/tag/category/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteCategory(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/white-list', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      queryWhiteList({
        dbName: url.searchParams.get('dbName') ?? undefined,
        tableName: url.searchParams.get('tableName') ?? undefined,
        usedType: url.searchParams.get('usedType') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 20),
      }),
    );
  }),
  http.post('/api/tag/white-list/save', async ({ request }) => ok(saveWhiteList((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/white-list/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteWhiteList(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/white-list/check-usage', ({ request }) => {
    const url = new URL(request.url);
    return ok(getWhiteListUsage(url.searchParams.get('dbName') ?? '', url.searchParams.get('tableName') ?? ''));
  }),
  http.get('/api/tag/user-picture', ({ request }) => {
    const url = new URL(request.url);
    return ok(queryUserPictures({
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
    }));
  }),
  http.post('/api/tag/user-picture/save', async ({ request }) => ok(saveUserPicture((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/user-picture/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteUserPicture(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/user-search/options', () => ok(getUserSearchOptions())),
  http.post('/api/tag/user-search/query', async ({ request }) => ok(searchUsers((await request.json()) as any))),
  http.post('/api/tag/user-search/export', async ({ request }) => ok(exportUsers((await request.json()) as any))),
  http.get('/api/tag/test-data', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      queryTestData({
        ruleCode: url.searchParams.get('ruleCode') ?? undefined,
        userId: url.searchParams.get('userId') ?? undefined,
        pageNo: Number(url.searchParams.get('pageNo') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      }),
    );
  }),
  http.post('/api/tag/test-data/save', async ({ request }) => ok(saveTestData((await request.json()) as Record<string, unknown>))),
  http.post('/api/tag/test-data/delete', async ({ request }) => {
    const body = (await request.json()) as { id: string };
    deleteTestData(body.id);
    return ok({ success: true });
  }),
  http.get('/api/tag/stat/meta', () => ok(getStatMeta())),
  http.post('/api/tag/stat/query', async ({ request }) => ok(queryStat((await request.json()) as any))),
  http.get('/api/tag/bloodline/query', ({ request }) => {
    const url = new URL(request.url);
    return ok(getBloodline({
      code: url.searchParams.get('code') ?? undefined,
      dep: Number(url.searchParams.get('dep') ?? 0),
      type: url.searchParams.get('type') ?? undefined,
    }));
  }),
  http.get('/api/tag/bloodline/detail', ({ request }) => {
    const url = new URL(request.url);
    return ok(getBloodlineDetail(url.searchParams.get('code') ?? ''));
  }),
  http.post('/api/tag/bloodline/export', async ({ request }) => {
    const body = (await request.json()) as { code: string };
    return ok(exportBloodline(body.code));
  }),
  http.get('/api/tag/organizations', ({ request }) => {
    const url = new URL(request.url);
    return ok(getOrganizations((url.searchParams.get('type') as 'RULE' | 'GROUP') || 'RULE'));
  }),
  http.get('/api/tag/enums', () => ok(getTagEnums())),
  http.get('/api/tag/tag-ops/dbs', () => ok(getTagOpsDbList())),
  http.get('/api/tag/tag-ops/tables', ({ request }) => {
    const url = new URL(request.url);
    return ok(getTagOpsTableList(url.searchParams.get('dbName') ?? ''));
  }),
  http.get('/api/tag/tag-ops/overview', ({ request }) => {
    const url = new URL(request.url);
    return ok(getTagOpsOverview({ tableNames: (url.searchParams.get('tableNames') ?? '').split(',').filter(Boolean) }));
  }),
  http.get('/api/tag/tag-ops/section/:section', ({ request, params }) => {
    const url = new URL(request.url);
    return ok(getTagOpsSection(params.section as any, {
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      keyword: url.searchParams.get('keyword') ?? undefined,
    }));
  }),
  http.get('/api/tag/tag-ops/exec-records', ({ request }) => {
    const url = new URL(request.url);
    return ok(getTagOpsExecRecords({
      pageNo: Number(url.searchParams.get('pageNo') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
    }));
  }),
  http.post('/api/tag/tag-ops/export', async ({ request }) => ok(exportTagOps((await request.json()) as any))),
  http.post('/api/tag/test-data/generate', async ({ request }) => ok(generateTestData((await request.json()) as any))),

  // ============== SQL Studio ==============
  http.get('/api/studio/table-tree', () => ok(buildStudioTableTree())),
  http.get('/api/studio/task-tree', () => ok(buildStudioTaskTree())),
  http.get('/api/studio/default-task', () => ok(buildStudioDefaultTask())),
  http.post('/api/studio/run', async () => {
    // 模拟后端执行耗时
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
    return ok(buildStudioRunResult());
  }),
  http.post('/api/studio/format', async ({ request }) => {
    const body = (await request.json()) as { sql: string };
    // 简单返回（真正的 SQL 格式化在前端完成）
    return ok({ sql: body?.sql ?? '' });
  }),
  http.post('/api/studio/save-draft', async ({ request }) => {
    const body = (await request.json()) as { taskCode: string };
    return ok({ taskCode: body.taskCode, savedAt: Date.now() });
  }),

  // ============== SQL 编辑器补全（code-box 使用） ==============
  http.get('/api/sql/databases', () =>
    ok([{ name: 'warehouse' }, { name: 'ads' }, { name: 'dim' }, { name: 'tmp' }]),
  ),
  http.get('/api/sql/tables', ({ request }) => {
    const url = new URL(request.url);
    const db = url.searchParams.get('databaseName') ?? 'warehouse';
    return ok([
      {
        databaseName: db,
        tableItems: [
          { tableName: 'dwd_order_info' },
          { tableName: 'dwd_user_info' },
          { tableName: 'ads_sales_daily' },
        ],
      },
    ]);
  }),
  http.get('/api/sql/columns', () =>
    ok([
      { name: 'order_id', type: 'bigint' },
      { name: 'amount', type: 'decimal(12,2)' },
      { name: 'user_id', type: 'bigint' },
      { name: 'status', type: 'string' },
      { name: 'created_at', type: 'timestamp' },
    ]),
  ),
  http.get('/api/sql/functions', () =>
    ok([
      { functionName: 'count', comment: '计数' },
      { functionName: 'sum', comment: '求和' },
      { functionName: 'avg', comment: '平均' },
      { functionName: 'max', comment: '最大值' },
      { functionName: 'min', comment: '最小值' },
      { functionName: 'date_trunc', comment: '日期截断' },
      { functionName: 'to_date', comment: '转日期' },
      { functionName: 'current_date', comment: '当前日期' },
      { functionName: 'date_sub', comment: '日期减' },
    ]),
  ),
  http.get('/api/sql/paginated-results', async ({ request }) => {
    // 模拟分页请求延迟
    await new Promise((r) => setTimeout(r, 200));
    const url = new URL(request.url);
    const pageNum = Number(url.searchParams.get('pageNum') ?? 1);
    return ok(buildPaginatedResults(pageNum));
  }),
  http.get('/api/sql/table-example', async () => {
    await new Promise((r) => setTimeout(r, 150));
    return ok(buildTableExample());
  }),
  http.get('/api/sql/download-results', () => ok(buildDownloadResults())),

  // ============== sql-sider（任务目录树） ==============
  http.get('/api/sql/directory-list', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      getSiderDirectoryList({
        parentId: url.searchParams.get('parentId') ?? undefined,
        pageNum: Number(url.searchParams.get('pageNum') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 100),
        databaseName: url.searchParams.get('databaseName') ?? undefined,
      }),
    );
  }),
  http.get('/api/sql/search-directory-list', ({ request }) => {
    const url = new URL(request.url);
    return ok(
      searchSiderDirectoryList({
        itemType: url.searchParams.get('itemType') ?? undefined,
        name: url.searchParams.get('name') ?? undefined,
        databaseNames: url.searchParams.get('databaseNames') ?? undefined,
        owners: url.searchParams.get('owners') ?? undefined,
        taskTypes: url.searchParams.get('taskTypes') ?? undefined,
      }),
    );
  }),
  http.get('/api/sql/task', ({ request }) => {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));
    return ok(getSiderTask(id));
  }),
  http.post('/api/sql/create-task', async ({ request }) => {
    const body = (await request.json()) as any;
    return ok(createSiderTask(body));
  }),
  http.post('/api/sql/update-task', async ({ request }) => {
    const body = (await request.json()) as any;
    return ok(updateSiderTask(body));
  }),
  http.get('/api/sql/delete-task', ({ request }) => {
    const url = new URL(request.url);
    return ok(deleteSiderTask(Number(url.searchParams.get('id'))));
  }),
  http.post('/api/sql/create-directory', async ({ request }) => {
    const body = (await request.json()) as any;
    return ok(createSiderDirectory(body));
  }),
  http.post('/api/sql/update-directory', async ({ request }) => {
    const body = (await request.json()) as any;
    return ok(updateSiderDirectory(body));
  }),
  http.get('/api/sql/delete-directory', ({ request }) => {
    const url = new URL(request.url);
    return ok(deleteSiderDirectory(Number(url.searchParams.get('id'))));
  }),
  http.post('/api/sql/move-task-directory', async ({ request }) => {
    const body = (await request.json()) as any;
    return ok(moveSiderTaskDirectory(body));
  }),
  http.get('/api/sql/project-databases', () =>
    ok(getSiderProjectDatabases()),
  ),
  http.get('/api/sql/project-users-deduplicated', () =>
    ok(getSiderProjectUsers()),
  ),
  http.get('/api/sql/task-type-list', () => ok(getSiderTaskTypeList())),

  // ============== 任务运维（Ops） ==============
  http.get('/api/ops/task-types', () => ok(buildOpsTaskTypeOptions())),
  http.get('/api/ops/owners', () => ok(buildOpsOwnerOptions())),
  http.get('/api/ops/tasks', ({ request }) => {
    const url = new URL(request.url);
    const pageNo = Number(url.searchParams.get('pageNo') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    const keyword = url.searchParams.get('taskName')?.trim() ?? '';
    const taskType = url.searchParams.get('taskType') ?? '';
    const taskStatus = url.searchParams.get('taskStatus') ?? '';
    const owner = url.searchParams.get('owner') ?? '';
    const myResp = url.searchParams.get('myResponsibility') === 'true';
    const lastRunStatus = url.searchParams.get('lastRunStatus') ?? '';

    const filtered = buildOpsTasks().filter((t) => {
      if (keyword && !t.taskName.includes(keyword)) return false;
      if (taskType && t.taskType !== taskType) return false;
      if (taskStatus && t.taskStatus !== taskStatus) return false;
      if (owner && t.owner !== owner) return false;
      if (lastRunStatus && t.lastRunStatus !== lastRunStatus) return false;
      if (myResp && t.owner !== 'alice') return false;
      return true;
    });
    return ok(paginate(filtered, pageNo, pageSize));
  }),
  http.post('/api/ops/run', async ({ request }) => {
    const body = (await request.json()) as { taskId: string };
    return ok({ success: true, taskId: body?.taskId, startedAt: Date.now() });
  }),
  http.get('/api/ops/logs', ({ request }) => {
    const url = new URL(request.url);
    const skip = Number(url.searchParams.get('skipLineNum') ?? 0);
    // 累计到 800 行后返回空，表示到底
    if (skip >= 800) return ok([]);
    return ok(buildLogTabs(skip));
  }),

  // ========== Copilot / Agentic ==========
  http.get('/api/agentic/agent/feature/status', () => ok(mockFeatureStatus)),
  http.get('/api/agentic/agent/quick-intents', () => ok(mockQuickIntents)),
  http.get('/api/agentic/enums/:name', ({ params }) =>
    ok(mockEnum(String(params.name))),
  ),
  http.get('/api/agentic/agent/databases', () => ok(mockDatabases)),
  http.get('/api/agentic/agent/databases/:databaseName/tables', ({ params, request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') ?? '';
    return ok(mockTablesByDatabase(String(params.databaseName), keyword));
  }),
  http.get('/api/agentic/agent/sessions', () => ok(mockSessionList())),
  http.post('/api/agentic/agent/sessions', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    // 真实后端创建会话时 title/summary 一律返 null，由首条对话后异步生成。
    const nowMs = Date.now();
    const iso = new Date(nowMs).toISOString().replace(/Z$/, '').slice(0, -1) + '000';
    return ok({
      id: `sess_${nowMs.toString(16)}`,
      title: null,
      taskScriptKind: null,
      status: 'ACTIVE',
      summary: null,
      taskCode: body?.taskCode ?? null,
      projectId: 1,
      createdAt: iso,
      lastActiveAt: iso,
      agentType: body?.agentType ?? 'TEXT2SQL',
    });
  }),
  http.get(
    '/api/agentic/agent/session/:sessionId/recent-messages',
    () => ok(mockRecentMessages()),
  ),
  http.get(
    '/api/agentic/agent/session/:sessionId/checkpoint',
    () => ok(mockCheckpoint()),
  ),
  http.post('/api/agentic/agent/feedback', async () => ok({ success: true })),
  http.post('/api/agentic/agent/chat/cancel', async () => ok({ success: true })),
  http.post(
    '/api/agentic/agent/session/:sessionId/accept-checkpoint',
    async () => ok({ success: true }),
  ),

  // SSE 流式：聊天
  http.post('/api/agentic/agent/chat', async ({ request }) => {
    const req = (await request
      .json()
      .catch(() => ({} as MockChatRequest))) as MockChatRequest;
    return streamSse(buildChatScript(req), request.signal);
  }),

  // SSE 流式：前端卡片动作（澄清 / 采纳等）—— 使用同一脚本生成后续回复
  http.post('/api/agentic/agent/action', async ({ request }) => {
    const req = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const chatReq: MockChatRequest = {
      sessionId: (req.sessionId as string) || undefined,
      requestId: `req_${Date.now()}`,
      message: `[action] ${(req.action as string) ?? ''}`,
    };
    return streamSse(buildChatScript(chatReq), request.signal);
  }),

  // ========== data-map-agent 专用接口 ==========
  http.get('/api/agentic/agent/suggested-prompts', () => ok(dataMapSuggestedPrompts)),

  http.get('/api/agentic/agent/sessions/recent', () => ok(dataMapRecentSessions)),

  http.get('/api/agentic/agent/sessions/earlier', ({ request }) => {
    const url = new URL(request.url);
    const pageNum = Number(url.searchParams.get('pageNum') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    const start = (pageNum - 1) * pageSize;
    const items = dataMapEarlierSessions.slice(start, start + pageSize);
    const hasMore = start + pageSize < dataMapEarlierSessions.length;
    return ok({ items, hasMore, pageNum, pageSize, total: dataMapEarlierSessions.length });
  }),

  http.delete('/api/agentic/agent/sessions/:sessionId', ({ params }) => {
    const { sessionId } = params;
    const idx1 = dataMapRecentSessions.findIndex((s) => s.id === sessionId);
    if (idx1 >= 0) dataMapRecentSessions.splice(idx1, 1);
    const idx2 = dataMapEarlierSessions.findIndex((s) => s.id === sessionId);
    if (idx2 >= 0) dataMapEarlierSessions.splice(idx2, 1);
    return ok(true);
  }),

  http.post('/api/agentic/agent/sessions/:sessionId', async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = String(body.title ?? '');
    const apply = (arr: typeof dataMapRecentSessions) => {
      const s = arr.find((x) => x.id === params.sessionId);
      if (s && title) s.title = title;
    };
    apply(dataMapRecentSessions);
    apply(dataMapEarlierSessions);
    return ok(true);
  }),

  // 收藏表
  http.get('/api/agentic/platform/favorites/list', () => ok(dataMapFavoriteTables)),

  http.post('/api/agentic/platform/favorites/toggle', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      databaseName?: string;
      tableName?: string;
      favorited?: boolean;
    };
    const { databaseName = '', tableName = '', favorited = false } = body;
    const existingIdx = dataMapFavoriteTables.findIndex(
      (t) => t.databaseName === databaseName && t.tableName === tableName,
    );
    if (favorited) {
      if (existingIdx >= 0) {
        dataMapFavoriteTables[existingIdx].favorited = true;
      } else {
        dataMapFavoriteTables.unshift({
          databaseName,
          tableName,
          owner: 'demo_owner',
          description: '',
          favorited: true,
          ownerDisplayName: '演示负责人',
        });
      }
    } else if (existingIdx >= 0) {
      dataMapFavoriteTables.splice(existingIdx, 1);
    }
    return ok({
      databaseName,
      tableName,
      owner: 'demo_owner',
      description: '',
      favorited,
      ownerDisplayName: '演示负责人',
    });
  }),

  // 分享：生成链接（mock 下直接回一个 /data-map-agent/share?shareId=xxx 链接）
  http.post('/api/agentic/session/share', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const shareId = `share_${Date.now()}`;
    const origin = typeof location !== 'undefined' ? location.origin : '';
    return ok({
      shareId,
      shareUrl: `${origin}/data-map-agent/share?shareId=${shareId}`,
      sessionId: body.sessionId,
      expireDays: body.expireDays ?? 7,
    });
  }),

  http.get('/api/agentic/agent/share', ({ request }) => {
    const url = new URL(request.url);
    const shareId = url.searchParams.get('shareId') ?? '';
    return ok({
      shareId,
      title: '分享的数据地图对话',
      items: [],
    });
  }),
];

/**
 * 用 ReadableStream 实现 SSE 流式响应。
 * 每个 chunk 间按 `delay` 毫秒暂停，模拟后端逐片下发。
 * 监听 request.signal，用户点「停止生成」时提前结束流。
 */
function streamSse(
  chunks: Array<{ delay: number; payload: unknown }>,
  abortSignal?: AbortSignal,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const onAbort = () => {
        try {
          controller.close();
        } catch {
          // noop
        }
      };
      abortSignal?.addEventListener('abort', onAbort);
      try {
        for (const { delay, payload } of chunks) {
          if (abortSignal?.aborted) break;
          // eslint-disable-next-line no-await-in-loop
          await sleep(delay);
          if (abortSignal?.aborted) break;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        }
      } finally {
        abortSignal?.removeEventListener('abort', onAbort);
        try {
          controller.close();
        } catch {
          // noop
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
