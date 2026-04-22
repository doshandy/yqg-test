import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
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
