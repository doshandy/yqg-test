<!-- @Author: weisun -->
<!-- @Date: 2024/5/6 11:18 -->
<!-- @Last Modified by: weisun -->
<!-- @Last Modified time: 2024/5/6 11:18 -->

<template>
  <Modal
    v-model:open="open"
    title="sql查看"
    width="100%"
    wrap-class-name="full-modal"
    :footer="null"
    @cancel="onClose"
  >
    <CodeBox
      v-model="sql"
      :language="language"
      height="94%"
      :theme="theme"
      :read-only="true"
    />

    <Flex justify="flex-end" style="margin-top: 10px">
      <Button @click="onClose">关闭</Button>
      <Button
        v-if="language === 'sql'"
        style="margin-left: 10px"
        type="primary"
        :disabled="!sql"
        @click="formatSql"
      >
        {{ formatText }}
      </Button>
    </Flex>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Modal, Button, Flex, message } from 'ant-design-vue';

import { formatSqlWithLanguages } from '@/utils/tool';
import CodeBox from '@/components/sql-editor/code-box.vue';
import CodeThemeStorage from '@/storage/code-theme';

defineEmits(['on-close']);
const open = ref<boolean>(false);
const sql = ref('');
const sqlStr = ref('');
const isInit = ref(true);
const theme = ref('vs-dark');
const language = ref('sql');

const showModal = (data) => {
  theme.value = CodeThemeStorage.get() || 'vs-dark';
  open.value = true;
  sqlStr.value = data.content;
  sql.value = sqlStr.value;
  language.value = data.scriptType === 'SQL' ? 'sql' : 'python';
  if (data.scriptType === 'SQL') formatSql();
};

const onClose = () => {
  open.value = false;
  sqlStr.value = '';
  sql.value = '';
  isInit.value = true;
  language.value = 'sql';
  // 触发 Modal 关闭事件，通知其他组件重新绑定快捷键
  document.dispatchEvent(new CustomEvent('modal-close'));
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
    sql.value = sqlValue;
  }

  isInit.value = !isInit.value;
};

defineExpose({
  showModal,
});
</script>

<style lang="less">
.full-modal {
  .ant-modal {
    max-width: 100%;
    top: 0;
    padding-bottom: 0;
    margin: 0;

    .ant-modal-content {
      height: 100vh !important;
    }

    .ant-modal-body {
      height: 90%;
    }
  }
}
</style>
