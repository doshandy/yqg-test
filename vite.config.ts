import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

// GitHub Pages 部署时所有静态资源都落在 /yqg-test/ 下，由环境变量 PUBLIC_BASE 显式传入；
// 本地 dev 不设时回退到根路径 '/'。
const BASE = process.env.PUBLIC_BASE ?? '/';

export default defineConfig({
  base: BASE,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: [
      'monaco-editor/esm/vs/editor/editor.api',
      'monaco-editor/esm/vs/basic-languages/python/python.js',
      'monaco-sql-languages/esm/languages/hive/hive',
    ],
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false,
  },
});
