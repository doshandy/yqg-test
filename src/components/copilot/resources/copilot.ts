/**
 * Copilot 接口（单机 mock 版）
 * - 保留 @yqg/resource 的调用形式：`CopilotApi.xxx({ params, hideLoading })` 返回 `{ data: { body: ... } }`
 * - 实际请求走 fetch，命中 MSW 的 /api/agentic/agent/* 处理器
 * - 路径参数支持 `:paramName` 占位替换
 */

const URL_PREFIX = '/api/agentic/agent';

type RequestOptions = {
  params?: Record<string, unknown>;
  // @yqg/resource 的 meta 字段，这里仅做签名兼容
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
      headers: { Accept: 'application/json' },
      signal: options.signal,
    });
    const json = (await res.json()) as RawJson<T>;
    // 兼容 @yqg/resource 的返回形状：外层再套一层 data
    return { data: json } as YqgResponse<T>;
  };

const customPost =
  (pathTemplate: string) =>
  async <T = unknown>(
    body?: Record<string, unknown> | RequestOptions,
    options: RequestOptions = {},
  ): Promise<YqgResponse<T>> => {
    // 兼容 `postSessions({ taskCode })` 与 `postChat({ params, hideLoading })` 两种用法
    const isOptions =
      body && typeof body === 'object' && ('params' in (body as RequestOptions));
    const payload = isOptions
      ? (body as RequestOptions).params ?? {}
      : (body as Record<string, unknown> | undefined) ?? {};
    const opts = isOptions ? (body as RequestOptions) : options;
    const { url, rest } = replacePathParams(pathTemplate, opts.params);
    const res = await fetch(buildUrl(url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(isOptions ? rest : payload),
      signal: opts.signal,
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

  /** POST /api/agentic/agent/chat —— 流式接口，本地直接 fetch，不走这里（保留签名以防调用） */
  postChat: customPost('chat'),

  getRecentMessages: customGet('session/:sessionId/recent-messages'),
  getCheckpoint: customGet('session/:sessionId/checkpoint'),
  getQuickIntents: customGet('quick-intents'),

  feedback: customPost('feedback'),
  cancelChat: customPost('chat/cancel'),

  getEnums: customGet('/api/agentic/enums/:name'),

  acceptCheckpoint: customPost('session/:sessionId/accept-checkpoint'),

  getFeatureStatus: customGet('feature/status'),
};

export default CopilotApi;
