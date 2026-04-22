/**
 * 项目/国家选择 store（单机版：仅内存持久化）
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useProjectStore = defineStore('project', () => {
  const project = ref<string>('data-platform');
  const country = ref<string>('CN');

  function setProject(next: string) {
    project.value = next;
  }

  function setCountry(next: string) {
    country.value = next;
  }

  return { project, country, setProject, setCountry };
});
