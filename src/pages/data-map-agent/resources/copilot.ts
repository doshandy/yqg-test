/**
 * data-map-agent 的后端 API（单机 mock 版）。
 * 路由前缀沿用原版 /api/agentic/agent，由 MSW 接管。
 * 保持和原版 @yqg/resource 一致的调用/返回形态：
 *   - GET:  CopilotApi.getXxx({ params: {...} }) → { data: { status, body } }
 *   - POST: CopilotApi.postXxx({ params: {...} }) → { data: { status, body } }
 *   - DELETE: CopilotApi.deleteXxx({ params: {...} }) → { data: { status, body } }
 */

import ProjectStorage from '@/storage/project';

const URL_PREFIX = '/api/agentic/agent';

type RequestOptions = {
  params?: Record<string, unknown>;
  hideLoading?: boolean;
  signal?: AbortSignal;
};

interface YqgResponse<T = unknown> {
  data: {
    status: { code: number; detail: string };
    body: T;
  };
}

interface RawJson<T = unknown> {
  status: { code: number; detail: string };
  body: T;
}

const replacePathParams = (
  pathTemplate: string,
  params?: Record<string, unknown>,
): { url: string; rest: Record<string, unknown> } => {
  const rest: Record<string, unknown> = { ...(params || {}) };
  const url = pathTemplate.replace(/:([a-zA-Z_][\w]*)/g, (_m, key: string) => {
    if (rest[key] != null) {
      const val = String(rest[key]);
      delete rest[key];
      return encodeURIComponent(val);
    }
    return `:${key}`;
  });
  return { url, rest };
};

const buildUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path;
  return `${URL_PREFIX}/${path}`;
};

/** 为每次请求附加 datapilot_project_id 头部，仿照原项目业务逻辑 */
const commonHeaders = (): Record<string, string> => {
  const pid = ProjectStorage.get();
  return { datapilot_project_id: pid != null ? String(pid) : '' };
};

const customGet =
  (pathTemplate: string) =>
  async <T = unknown>(options: RequestOptions = {}): Promise<YqgResponse<T>> => {
    const { url, rest } = replacePathParams(pathTemplate, options.params);
    const qs = Object.keys(rest).length
      ? `?${new URLSearchParams(
          Object.entries(rest).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v == null) return acc;
            acc[k] = String(v);
            return acc;
          }, {}),
        ).toString()}`
      : '';
    const res = await fetch(`${buildUrl(url)}${qs}`, {
      method: 'GET',
      headers: { Accept: 'application/json', ...commonHeaders() },
      signal: options.signal,
    });
    const json = (await res.json()) as RawJson<T>;
    return { data: json } as YqgResponse<T>;
  };

const customPost =
  (pathTemplate: string) =>
  async <T = unknown>(
    body?: Record<string, unknown> | RequestOptions,
    options: RequestOptions = {},
  ): Promise<YqgResponse<T>> => {
    const isOptions =
      body && typeof body === 'object' && ('params' in (body as RequestOptions));
    const payload = isOptions
      ? (body as RequestOptions).params ?? {}
      : (body as Record<string, unknown> | undefined) ?? {};
    const opts = isOptions ? (body as RequestOptions) : options;
    const { url, rest } = replacePathParams(pathTemplate, opts.params);
    const res = await fetch(buildUrl(url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...commonHeaders() },
      body: JSON.stringify(isOptions ? rest : payload),
      signal: opts.signal,
    });
    const json = (await res.json()) as RawJson<T>;
    return { data: json } as YqgResponse<T>;
  };

const customDelete =
  (pathTemplate: string) =>
  async <T = unknown>(options: RequestOptions = {}): Promise<YqgResponse<T>> => {
    const { url } = replacePathParams(pathTemplate, options.params);
    const res = await fetch(buildUrl(url), {
      method: 'DELETE',
      headers: { Accept: 'application/json', ...commonHeaders() },
      signal: options.signal,
    });
    const json = (await res.json()) as RawJson<T>;
    return { data: json } as YqgResponse<T>;
  };

const CopilotApi = {
  urlPrefix: URL_PREFIX,

  getDatabases: customGet('databases'),
  getTablesByDatabase: customGet('databases/:databaseName/tables'),

  getSessions: customGet('sessions'),
  postSessions: customPost('sessions'),

  postChat: customPost('chat'),

  getRecentMessages: customGet('session/:sessionId/recent-messages'),
  getCheckpoint: customGet('session/:sessionId/checkpoint'),

  getQuickIntents: customGet('quick-intents'),

  feedback: customPost('feedback'),

  cancelChat: customPost('chat/cancel'),

  acceptCheckpoint: customPost('session/:sessionId/accept-checkpoint'),

  getFeatureStatus: customGet('feature/status'),

  getRecentSessions: customGet('sessions/recent'),
  getEarlierSessions: customGet('sessions/earlier'),
  deleteSession: customDelete('sessions/:sessionId'),
  updateSession: customPost('sessions/:sessionId'),

  getSuggestedPrompts: customGet('suggested-prompts'),

  /** 分享相关（路径以 / 开头，buildUrl 会原样保留）*/
  createShare: customPost('/api/agentic/session/share'),
  getShareDetail: customGet('/api/agentic/agent/share'),
};

export default CopilotApi;
