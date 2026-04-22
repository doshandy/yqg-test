/**
 * 数据地图收藏相关接口（单机 mock 版）。
 * 路径前缀：/api/agentic/platform，由 MSW 接管。
 */

import ProjectStorage from '@/storage/project';

const URL_PREFIX = '/api/agentic/platform';

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

const commonHeaders = (): Record<string, string> => {
  const pid = ProjectStorage.get();
  return { datapilot_project_id: pid != null ? String(pid) : '' };
};

const buildUrl = (path: string) =>
  /^https?:\/\//i.test(path) || path.startsWith('/') ? path : `${URL_PREFIX}/${path}`;

const customGet =
  (path: string) =>
  async <T = unknown>(options: RequestOptions = {}): Promise<YqgResponse<T>> => {
    const params = options.params || {};
    const qs = Object.keys(params).length
      ? `?${new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            if (v == null) return acc;
            acc[k] = String(v);
            return acc;
          }, {}),
        ).toString()}`
      : '';
    const res = await fetch(`${buildUrl(path)}${qs}`, {
      method: 'GET',
      headers: { Accept: 'application/json', ...commonHeaders() },
      signal: options.signal,
    });
    const json = (await res.json()) as RawJson<T>;
    return { data: json } as YqgResponse<T>;
  };

const customPost =
  (path: string) =>
  async <T = unknown>(body?: Record<string, unknown> | RequestOptions): Promise<YqgResponse<T>> => {
    const isOptions = body && typeof body === 'object' && ('params' in (body as RequestOptions));
    const payload = isOptions ? (body as RequestOptions).params ?? {} : body ?? {};
    const res = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...commonHeaders() },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as RawJson<T>;
    return { data: json } as YqgResponse<T>;
  };

const FavoritesApi = {
  urlPrefix: URL_PREFIX,
  listFavorites: customGet('favorites/list'),
  toggleFavorite: customPost('favorites/toggle'),
};

export default FavoritesApi;
