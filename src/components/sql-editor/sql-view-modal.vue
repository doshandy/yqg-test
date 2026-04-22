<!-- @Author: weisun -->
<!-- @Date: 2024/9/9 10:28 -->
<!-- @Last Modified by: weisun -->
<!-- @Last Modified time: 2024/9/9 10:28 -->

<template>
  <Modal
    v-model:open="open"
    class="sql-modal"
    title="查看SQL"
    width="1000px"
    destroy-on-close
    :footer="null"
    @cancel="onCancel"
  >
    <Row align="middle" justify="end">
      <Button
        type="text"
        style="font-size: 12px; color: #1677ff"
        :icon="h(CopyOutlined)"
        @click="onCopy()"
      />
      <Button
        type="text"
        style="font-size: 12px; color: #1677ff"
        :icon="h(FullscreenOutlined)"
        @click="onFull()"
      />
    </Row>

    <CodeBox
      v-model="sql"
      style="min-height: unset"
      language="sql"
      height="450px"
      width="950px"
      :theme="theme"
      :read-only="true"
    />

    <Row style="margin-top: 10px" align="middle" justify="end">
      <Button @click="onCancel">关闭</Button>
      <Button
        style="margin-left: 10px"
        type="primary"
        :disabled="!sql"
        @click="formatSql"
      >
        {{ formatText }}
      </Button>
    </Row>

    <FullScreenModal ref="fullScreenModal" />
  </Modal>
</template>

<script lang="ts" setup>
import { ref, h, computed } from 'vue';
import { Modal, Row, Button, message } from 'ant-design-vue';

import { CopyOutlined, FullscreenOutlined } from '@ant-design/icons-vue';
import { formatSqlWithLanguages } from '@/utils/tool';

import CodeThemeStorage from '@/storage/code-theme';

import CodeBox from '@/components/sql-editor/code-box.vue';
import FullScreenModal from '@/components/sql-editor/full-screen-modal.vue';

const open = ref(false);
const sql = ref('');
const sqlStr = ref('');
const fullScreenModal = ref(null);
const isInit = ref(true);
const language = ref('hive');
const theme = ref('vs-dark');

const showModal = (sqlValue, lang) => {
  theme.value = CodeThemeStorage.get() || 'vs-dark';
  open.value = true;
  language.value = lang || 'hive';
  sqlStr.value = sqlValue;
  sql.value = sqlStr.value;
  formatSql();
};

const onCancel = () => {
  open.value = false;
  sqlStr.value = '';
  sql.value = '';
  isInit.value = true;
};

const formatText = computed(() => {
  return isInit.value ? '格式化' : '初始化';
});

const formatSql = () => {
  const sqlValue = sqlStr.value;
  if (!sqlValue) return;

  if (isInit.value) {
    const formattedSql = formatSqlWithLanguages(sqlValue);
    if (formattedSql) {
      sql.value = formattedSql;
    } else {
      message.warning('无法格式化 SQL，可能已被格式化或是不支持的语法');
    }
  } else {
    sql.value = sqlStr.value;
  }

  isInit.value = !isInit.value;
};

const onCopy = () => {
  if (!sql.value) {
    message.error('sql为空');

    return;
  }

  const listener = (e) => {
    e.clipboardData.setData('text/plain', sql.value);
    e.preventDefault();
  };

  document.addEventListener('copy', listener);
  document.execCommand('copy');
  document.removeEventListener('copy', listener);
  message.success('已复制到剪贴板');
};

const onFull = () => {
  if (!sql.value) {
    message.error('sql为空');

    return;
  }

  fullScreenModal.value.showModal({ content: sqlStr.value, scriptType: 'SQL' });
};

defineExpose({
  showModal,
});
</script>
