import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import TagCountryStorage from '@/storage/tag-country';

export const useTagCountryStore = defineStore('tag-country', () => {
  const tagCountryState = ref(TagCountryStorage.get());

  function setTagCountry(value: string) {
    tagCountryState.value = value;
    TagCountryStorage.set(value);
  }

  return {
    tagCountry: computed(() => tagCountryState.value),
    setTagCountry,
  };
});
