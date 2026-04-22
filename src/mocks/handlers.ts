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
  metricsMockList,
  rulesMockList,
  groupsMockList,
  queryStatMockList,
  systemAuthMockList,
  categoryMockList,
} from './data/tag';
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

  http.get('/api/tag/menu', () => ok(buildTagMenu())),
  http.get('/api/tag/areas', () => ok(tagAreaOptions)),
  http.get('/api/tag/metrics', ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword')?.trim() ?? '';
    const pageNo = Number(url.searchParams.get('pageNo') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    const list = metricsMockList.filter((m) =>
      !keyword || m.name.includes(keyword) || m.code.includes(keyword),
    );
    return ok(paginate(list, pageNo, pageSize));
  }),
  http.get('/api/tag/rules', ({ request }) => {
    const url = new URL(request.url);
    const pageNo = Number(url.searchParams.get('pageNo') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    return ok(paginate(rulesMockList, pageNo, pageSize));
  }),
  http.get('/api/tag/groups', ({ request }) => {
    const url = new URL(request.url);
    const pageNo = Number(url.searchParams.get('pageNo') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    return ok(paginate(groupsMockList, pageNo, pageSize));
  }),
  http.get('/api/tag/query-stat', ({ request }) => {
    const url = new URL(request.url);
    const pageNo = Number(url.searchParams.get('pageNo') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    return ok(paginate(queryStatMockList, pageNo, pageSize));
  }),
  http.get('/api/tag/system-auth', () => ok(systemAuthMockList)),
  http.get('/api/tag/category', () => ok(categoryMockList)),

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
    return ok({
      sessionId: `sess_${Date.now()}`,
      taskCode: body?.taskCode ?? '',
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
