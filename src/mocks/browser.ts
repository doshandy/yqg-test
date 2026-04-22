/**
 * MSW browser worker 入口。
 * 在 main.ts 启动时调用 `startMockWorker()` 即可开启拦截。
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function startMockWorker() {
  // BASE_URL 在 GitHub Pages 下是 '/yqg-test/'，本地 dev 是 '/'。
  // Service Worker 脚本与 scope 都要带上这个前缀，否则部署后 SW 404 或 scope 不覆盖业务路径。
  const base = import.meta.env.BASE_URL || '/';
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: `${base}mockServiceWorker.js`,
    },
  });
  console.info('[MSW] mock worker started. 拦截所有以 /api 开头的接口。');
}
