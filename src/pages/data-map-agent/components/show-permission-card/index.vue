<!--
 * 暂无访问权限卡片 - 提示缺失表权限并引导申请
-->
<template>
  <div class="copilot-card copilot-card--no-access">
    <div class="copilot-card__box">
        <div class="copilot-card__header">
          <CloseCircleFilled class="copilot-card__header-icon" />
          <span class="copilot-card__title">暂无访问权限</span>
        </div>
        <div class="copilot-card__body">
          <div class="copilot-card__desc">{{ actionData.message }}</div>
          <div v-if="actionData.tables && actionData.tables.length > 0" class="copilot-card__list">
            <div
              v-for="item in actionData.tables"
              :key="`${item.tableName}-${item.permissionType}`"
              class="copilot-card__item"
            >
              <span
                class="copilot-card__tag"
                :class="item.permissionType === 'WRITE' ? 'copilot-card__tag--readwrite' : 'copilot-card__tag--readonly'"
              >
                {{ item.permissionType === 'WRITE' ? '缺失读写权限' : '缺失只读权限' }}
              </span>
              <span class="copilot-card__table-name">{{ item.tableName }}</span>
            </div>
          </div>
        </div>
        <div class="copilot-card__actions">
          <Button type="primary" danger class="copilot-card__btn" @click="onApply">
            <template #icon><LockOutlined /></template>
            申请表权限
          </Button>
        </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CloseCircleFilled, LockOutlined } from '@ant-design/icons-vue';
import { Button, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import type { PermissionActionData } from '../../constant';

const router = useRouter();

withDefaults(
  defineProps<{
    actionData: PermissionActionData;
  }>(),
  {
    actionData: () => ({}),
  }
);

const onApply = () => {
  message.info('正在跳转至安全中心申请权限...');

  const routeData = router.resolve({
    path: '/cerebro/auth/detail',
    query: {
      applyType: 'group'
    }
  });
  window.open(routeData.href, '_blank');
};
</script>

<style lang="less" scoped>
@brand-purple: #6b4c9a;
@card-border-pink: #fca5a5;
@red-accent: #ff4d4f;
@text-body: #6b7280;

.copilot-card--no-access {
  flex: 1;
  min-width: 0;

  .copilot-card__box {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid @card-border-pink;
    border-radius: 10px;
    overflow: hidden;
    padding: 16px;
    gap: 12px;
  }

  .copilot-card__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .copilot-card__header-icon {
    font-size: 18px;
    color: @red-accent;
  }

  .copilot-card__title {
    font-size: 14px;
    font-weight: 600;
    color: rgb(239, 68, 68);
  }

  .copilot-card__body {
    // padding: 0 14px 14px;
  }

  .copilot-card__desc {
    font-size: 13px;
    color: @text-body;
    line-height: 1.6;
    margin: 0 0 12px 0;
  }

  .copilot-card__list {
    background: #fef2f2;
    border-radius: 6px;
    padding: 8px 12px;
    border: 1px dashed #fca5a5;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .copilot-card__item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  .copilot-card__tag {
    margin: 0px;
    padding: 0px 4px;
    font-size: 10px;
    line-height: 18px;
    flex-shrink: 0;
    border-radius: 4px;
    &--readonly {
      color: #0958d9;
      background: #e6f4ff;
    }
    &--readwrite {
      color: #ff4d4f;
      background: #fff2f0;
    }
  }

  .copilot-card__table-name {
    font-size: 12px;
    color: #b91c1c;
    word-break: break-all;
    min-width: 0;
  }

  .copilot-card__actions {
    display: flex;
    justify-content: flex-end;
  }

  .copilot-card__btn {
    align-items: center;
    gap: 2px;
    font-size: 12px;
    padding: 0px 7px;
    height: 24px;
    border-radius: 8px;
    background: @red-accent !important;
    border-color: @red-accent !important;
    &:hover {
      background: #ff7875 !important;
      border-color: #ff7875 !important;
    }
  }
}
</style>
