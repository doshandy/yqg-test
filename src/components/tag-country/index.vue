<template>
  <div class="tag-country-select">
    <a-select
      v-model:value="value"
      style="width: 180px"
      size="small"
      show-search
      option-filter-prop="label"
      :options="options"
      @change="handleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useTagCountryStore } from '@/store/tag-country';
import TagApi from '@/resources/tag';

const emit = defineEmits<{
  change: [value: string];
}>();

const store = useTagCountryStore();
const { tagCountry } = storeToRefs(store);

const options = ref<Array<{ label: string; value: string }>>([]);
const value = computed({
  get: () => tagCountry.value,
  set: (next: string) => store.setTagCountry(next),
});

function handleChange(next: string) {
  store.setTagCountry(next);
  emit('change', next);
}

onMounted(async () => {
  options.value = await TagApi.fetchAreas();
});
</script>

<style lang="less" scoped>
.tag-country-select {
  display: inline-flex;
  align-items: center;
}
</style>
