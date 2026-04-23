<template>
  <div class="table-page">
    <TableSider
      v-model:current-env="currentEnv"
      :show-dashboard="showDashboard"
      @select="onSelect"
      @create="onCreateEntry"
      @show-dashboard="showDashboard = true; selectedTable = undefined"
    />
    <div class="main">
      <TableDashboard
        v-if="showDashboard"
        :env="currentEnv"
        @switch-env="onSwitchEnv"
        @create-table="modals.create = true"
        @open-ddl-modal="modals.ddl = true"
        @open-ref-table-modal="modals.ref = true"
        @show-detail="onShowDetailFromRecent"
      />
      <TableDetail
        v-else-if="selectedTable"
        :table-id="selectedTable.id"
        @open-submit="modals.submit = true"
        @open-version="modals.version = true"
        @open-auth="modals.auth = true"
        @open-recreate="modals.recreate = true"
      />
      <a-empty v-else description="请从左侧选择表" style="margin: 120px auto;" />
    </div>

    <CreateTableModal v-model:open="modals.create" @created="onCreated" />
    <DdlModal v-model:open="modals.ddl" @created="onCreated" />
    <RefTableModal v-model:open="modals.ref" @created="onCreated" />
    <VersionDrawer v-model:open="modals.version" :table-id="selectedTable?.id" />
    <AuthDrawer v-model:open="modals.auth" />
    <SubmitModal v-model:open="modals.submit" />
    <RecreateModal v-model:open="modals.recreate" :table-name="selectedTable?.title" />
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import TableSider from './components/TableSider.vue';
import TableDashboard from './components/TableDashboard.vue';
import TableDetail from './components/TableDetail.vue';
import CreateTableModal from './modals/CreateTableModal.vue';
import DdlModal from './modals/DdlModal.vue';
import RefTableModal from './modals/RefTableModal.vue';
import VersionDrawer from './modals/VersionDrawer.vue';
import AuthDrawer from './modals/AuthDrawer.vue';
import SubmitModal from './modals/SubmitModal.vue';
import RecreateModal from './modals/RecreateModal.vue';
import type { TableTreeNode, RecentTable } from '@/resources/data-develop';

const showDashboard = ref(true);
const currentEnv = ref<'DEV' | 'PROD'>('DEV');
const selectedTable = ref<TableTreeNode | { id: string; title: string }>();

const modals = reactive({
  create: false,
  ddl: false,
  ref: false,
  version: false,
  auth: false,
  submit: false,
  recreate: false,
});

const onSelect = (node: TableTreeNode) => {
  selectedTable.value = node;
  showDashboard.value = false;
};

const onShowDetailFromRecent = (record: RecentTable) => {
  selectedTable.value = {
    id: record.id,
    title: record.tableName,
  };
  showDashboard.value = false;
};

const onCreateEntry = () => {
  if (currentEnv.value !== 'DEV') {
    message.warning('生产环境不支持直接建表，请切到 DEV');
    return;
  }
  modals.create = true;
};

const onSwitchEnv = (v: 'DEV' | 'PROD') => { currentEnv.value = v; };

const onCreated = () => {
  message.info('建表任务已发起，可在列表中查看');
};
</script>

<style lang="less" scoped>
.table-page {
  display: flex;
  height: calc(100vh - 60px);
  background: #fff;
}
.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
</style>
