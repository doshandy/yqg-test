/**
 * MSW browser worker 入口。
 * 在 main.ts 启动时调用 `startMockWorker()` 即可开启拦截。
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function startMockWorker() {
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
  console.info('[MSW] mock worker started. 拦截所有以 /api 开头的接口。');
}
