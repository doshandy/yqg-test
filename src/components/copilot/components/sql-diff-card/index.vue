<!--
 * @Author: shengzhitong shengzhitong@fintopia.tech
 * @Date: 2026-03-13 10:58:14
 * @LastEditors: shengzhitong shengzhitong@fintopia.tech
 * @LastEditTime: 2026-03-19 16:51:04
 * @FilePath: /cn-data-pilot/src/components/copilot/components/sql-diff-card/index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
 
<!--
 * SQL 变更卡片 - 展示 SHOW_SQL_DIFF_CARD：变更说明 + 新 SQL + 复制
-->
<template>
  <div class="copilot-card copilot-card--sql-diff">
    <span>{{ actionData?.message ?? '' }}</span>
  </div>
</template>

<script lang="ts" setup>
export interface SqlEditItem {
  startLine: number;
  endLine: number;
  content: string;
}

export interface SqlDiffActionData {
  checkpointId?: string;
  sql?: string;
  language?: string;
  message?: string;
  commandType?: string;
  sqlEdits?: SqlEditItem[];
}

withDefaults(
  defineProps<{
    actionData?: SqlDiffActionData;
  }>(),
  {
    actionData: () => ({}),
  }
);
</script>

<style lang="less" scoped>
@border-color: rgba(0, 0, 0, 0.06);
@text-primary: rgba(0, 0, 0, 0.88);
@text-secondary: rgba(0, 0, 0, 0.45);

.copilot-card--sql-diff {
  flex: 1;
  min-width: 0;

  &__summary {
    color: @text-primary;
    font-size: 13px;
    margin-bottom: 8px;
  }

  &__code-wrap {
    position: relative;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid @border-color;
    border-radius: 6px;
    padding: 10px 12px;
    padding-right: 72px;
  }

  &__code {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: @text-primary;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &__copy {
    position: absolute;
    top: 6px;
    right: 6px;
    color: @text-secondary;
    font-size: 12px;
  }
}
</style>
