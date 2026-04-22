/**
 * 轻量 HTTP 封装：返回结构与原项目 @yqg/resource 保持一致，
 * 页面 resource 层可以沿用 `const { data: { body } } = await xxx()` 的写法。
 */

export interface YqgResponse<T = unknown> {
  data: {
    status: { code: number; detail: string };
    body: T;
  };
}

interface RequestOptions {
  params?: Record<string, unknown> | object;
  signal?: AbortSignal;
}

function buildUrl(url: string, params?: Record<string, unknown> | object) {
  if (!params) return url;
  const search = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
}

async function toYqgResponse<T>(res: Response): Promise<YqgResponse<T>> {
  const data = await res.json();
  return { data };
}

export async function httpGet<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<YqgResponse<T>> {
  const res = await fetch(buildUrl(url, options.params), {
    method: 'GET',
    signal: options.signal,
    headers: { 'Content-Type': 'application/json' },
  });
  return toYqgResponse<T>(res);
}

export async function httpPost<T = unknown>(
  url: string,
  payload?: unknown,
  options: RequestOptions = {}
): Promise<YqgResponse<T>> {
  const res = await fetch(buildUrl(url, options.params), {
    method: 'POST',
    signal: options.signal,
    headers: { 'Content-Type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  return toYqgResponse<T>(res);
}
