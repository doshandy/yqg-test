<!--
  上传临时表抽屉（挤压式骨架）
-->
<template>
  <PushDrawer
    :open="open"
    title="创建临时表"
    :width="520"
    @update:open="emit('update:open', $event)"
  >
    <div class="upload-intro">
      通过上传 CSV / Excel 文件快速生成一张临时表，便于在 SQL 中 JOIN 自定义数据。
    </div>
    <a-upload-dragger
      v-model:fileList="fileList"
      :before-upload="() => false"
      accept=".csv,.xlsx,.xls,.txt"
      :max-count="1"
    >
      <p class="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
      <p class="ant-upload-hint">支持 CSV / Excel / TXT，单文件 ≤ 20 MB</p>
    </a-upload-dragger>

    <a-form layout="vertical" class="upload-form">
      <a-form-item label="临时表名" required>
        <a-input v-model:value="form.name" placeholder="tmp_xxx" />
      </a-form-item>
      <a-form-item label="分隔符">
        <a-select
          v-model:value="form.separator"
          :options="[
            { label: '逗号 (,)', value: ',' },
            { label: '制表符 (\\t)', value: '\\t' },
            { label: '分号 (;)', value: ';' },
            { label: '竖线 (|)', value: '|' },
          ]"
        />
      </a-form-item>
      <a-form-item label="首行为表头">
        <a-switch v-model:checked="form.hasHeader" />
      </a-form-item>
    </a-form>

    <div class="upload-existing">
      <div class="subtitle">已上传的临时表</div>
      <a-spin :spinning="loading">
        <a-list size="small" :data-source="list" :split="false">
          <template #renderItem="{ item }">
            <a-list-item class="temp-row">
              <div class="temp-meta">
                <div class="temp-name">
                  <TableOutlined />
                  <span>{{ item.name }}</span>
                </div>
                <div class="temp-desc">
                  {{ item.columns }} 字段 · {{ item.rows.toLocaleString() }} 行 · {{ item.size }} ·
                  {{ item.uploadTime }}
                </div>
              </div>
              <a-button type="link" size="small" @click="onPick(item)">插入 SQL</a-button>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px">
        <a-button @click="emit('update:open', false)">取消</a-button>
        <a-button type="primary" :disabled="!form.name || !fileList.length" @click="onSubmit">
          创建临时表
        </a-button>
      </div>
    </template>
  </PushDrawer>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { InboxOutlined, TableOutlined } from '@ant-design/icons-vue';
import PushDrawer from '@/components/PushDrawer.vue';
import ExploreApi, { type TempTableItem } from '@/resources/explore';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'open-tab', sql: string): void;
}>();

const fileList = ref<unknown[]>([]);
const form = reactive({
  name: '',
  separator: ',',
  hasHeader: true,
});

const loading = ref(false);
const list = ref<TempTableItem[]>([]);

async function load() {
  loading.value = true;
  try {
    list.value = await ExploreApi.fetchTempTables();
  } catch (e) {
    message.error('加载临时表失败');
  } finally {
    loading.value = false;
  }
}

function onSubmit() {
  message.success(`已创建临时表 ${form.name}（Demo 模式）`);
  form.name = '';
  fileList.value = [];
}

function onPick(item: TempTableItem) {
  emit('open-tab', `SELECT * FROM ${item.name} LIMIT 100`);
  emit('update:open', false);
}

watch(
  () => props.open,
  (v) => {
    if (v && !list.value.length) load();
  },
);

onMounted(() => {
  // noop
});
</script>

<style lang="less" scoped>
.upload-intro {
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  margin-bottom: 12px;
}
.upload-form {
  margin-top: 16px;
}
.upload-existing {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}
.subtitle {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 8px;
}
.temp-row {
  justify-content: space-between !important;
  padding: 8px 0 !important;
}
.temp-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.temp-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1a1a2e;
  font-weight: 500;
}
.temp-desc {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}
</style>
