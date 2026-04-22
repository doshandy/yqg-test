/**
 * 应用入口：启动前先初始化 MSW mock worker，再挂载 Vue 实例。
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import VxeUI from 'vxe-pc-ui';
import VxeTable from 'vxe-table';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';
import './style.css';

import App from './App.vue';
import router from './routers';

async function bootstrap() {
  // 启动 MSW 拦截（单机无后端，所有 /api/* 请求均来自此 worker）
  if (typeof window !== 'undefined') {
    const { startMockWorker } = await import('./mocks/browser');
    try {
      await startMockWorker();
    } catch (err) {
      console.warn('[MSW] failed to start, 请检查 /mockServiceWorker.js 是否已部署', err);
    }
  }

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(Antd);
  app.use(VxeUI);
  app.use(VxeTable);
  app.mount('#app');
}

bootstrap();
