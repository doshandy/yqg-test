/**
 * 全局通知 store
 * 复刻自 cn-data-pilot / cn-data-lumina 的 global-notice store。
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NoticeLevel = 'info' | 'warn' | 'error' | 'success';

export const useGlobalNoticeStore = defineStore('global-notice', () => {
  const enabled = ref(true);
  const visible = ref(false);
  const title = ref('');
  const content = ref('');
  const level = ref<NoticeLevel>('info');

  function setEnabled(next: boolean) {
    enabled.value = next;
  }

  function show(payload?: { title?: string; content?: string; level?: NoticeLevel }) {
    if (!enabled.value) return;
    if (payload?.title) title.value = payload.title;
    if (payload?.content) content.value = payload.content;
    if (payload?.level) level.value = payload.level;
    visible.value = true;
  }

  function hide() {
    visible.value = false;
  }

  return { enabled, visible, title, content, level, setEnabled, show, hide };
});
