<!--
 * @Author: shengzhitong shengzhitong@fintopia.tech
 * @Date: 2026-04-13 12:52:00
 * @LastEditors: shengzhitong shengzhitong@fintopia.tech
 * @LastEditTime: 2026-04-13 19:07:24
 * @FilePath: /cn-data-pilot/src/pages/data-map/components/done-card/index.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!--
 * AI 完成阶段卡片：展示 DONE 阶段的 action 结果
-->
<template>
  <div class="copilot-card copilot-card--done">
    <div class="copilot-card__inner">
      <template v-for="(item, idx) in doneList" :key="`${item.actionCode}-${idx}`">
        <template v-if="item.type === 'FRONTEND_ACTION'">
          <div
            v-if="item.actionCode === 'SHOW_PERMISSION_CARD'"
            class="copilot-done copilot-done--no-access"
          >
            <ShowPermissionCard
              :action-data="item.actionData || {}"
            />
          </div>

          <div
            v-else-if="item.actionCode === 'SHOW_DATAMAP_FAVORITE_CARD'"
            class="copilot-done copilot-done--favorite"
          >
            <DatamapFavoriteCard
              :action-data="(item.actionData as any ?? { fqn: '' })"
              :readonly="readonly"
              @toggle-favorite="onToggleFavoriteFromCard($event)"
            />
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import ShowPermissionCard from '../show-permission-card/index.vue';
import DatamapFavoriteCard from '../datamap-favorite-card/index.vue';

/** DONE 阶段 action 项 */
interface DoneActionItem {
  type?: string;
  actionCode?: string;
  actionData?: Record<string, unknown>;
}

const props = withDefaults(
  defineProps<{
    content?: unknown[];
    readonly?: boolean;
    requestId?: string;
  }>(),
  {
    content: () => [],
    readonly: false,
    requestId: '',
  }
);

const emit = defineEmits<{
  toggleFavoriteFromCard: [payload: { fqn: string; favorited: boolean; requestId: string }];
}>();

function onToggleFavoriteFromCard(ev: { fqn: string; favorited: boolean }) {
  emit('toggleFavoriteFromCard', { ...ev, requestId: props.requestId || '' });
}

const doneList = computed(() => (Array.isArray(props.content) ? props.content : []) as DoneActionItem[]);
</script>

<style lang="less" scoped>
.copilot-card--done {
  flex: 1;
  min-width: 0;

  .copilot-card__inner {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }
}

.copilot-done {
  // background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}
</style>
