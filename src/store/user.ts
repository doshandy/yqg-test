/**
 * 当前用户信息 store（单机 mock 版）
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import CommonApi, { type CurrentUser } from '@/resources/common';

export const useUserStore = defineStore('user', () => {
  const user = ref<CurrentUser | null>(null);
  const loading = ref(false);

  async function fetchUser() {
    if (user.value) return user.value;
    loading.value = true;
    try {
      const { data: { body } } = await CommonApi.fetchCurrentUser();
      user.value = body;
      return body;
    } finally {
      loading.value = false;
    }
  }

  return { user, loading, fetchUser };
});
