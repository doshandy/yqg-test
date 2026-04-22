<!--
  @file Data Map detail.vue
  @description 数据地图详情占位页（路由接入示例）
-->

<template>
  <div class="datamap-detail">
    <a-page-header :title="`资产详情 #${route.params.id}`" @back="$router.back()" />
    <a-empty v-if="!detail" description="资产不存在或尚未加载" />
    <a-descriptions v-else :column="1" bordered size="small">
      <a-descriptions-item label="表英文名">{{ detail.tableName }}</a-descriptions-item>
      <a-descriptions-item label="表中文名">{{ detail.cnName }}</a-descriptions-item>
      <a-descriptions-item label="分层">{{ detail.layer.toUpperCase() }}</a-descriptions-item>
      <a-descriptions-item label="描述">{{ detail.description }}</a-descriptions-item>
    </a-descriptions>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DataMapApi, { type DataAssetItem } from '@/resources/datamap';

const route = useRoute();
const detail = ref<DataAssetItem | null>(null);

onMounted(async () => {
  const id = route.params.id as string;
  const { data: { body } } = await DataMapApi.fetchAssetDetail(id);
  detail.value = body ?? null;
});
</script>

<style lang="less" scoped>
.datamap-detail {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}
</style>
