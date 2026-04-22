<!--
 * Copilot 侧边栏：新建对话 / 历史会话 / 收藏表
 * 视觉对齐 MapAgent Sidebar
-->
<template>
  <aside class="copilot-sidebar">
    <!-- 新建对话 -->
    <div class="copilot-sidebar__header">
      <Button
        block
        size="large"
        class="copilot-sidebar__new-btn"
        @click="emit('newChat')"
      >
        <template #icon><PlusOutlined /></template>
        新建对话
      </Button>
    </div>

    <!-- 滚动区域：历史 + 收藏 -->
    <div class="copilot-sidebar__body">
      <!-- 历史会话 -->
      <div class="copilot-sidebar__section">
        <div v-if="!recentSessions.length && !earlierSessions.length" class="copilot-sidebar__empty-hint">
          暂无历史会话
        </div>
        <template v-else>
          <!-- 最近 3 天 -->
          <div v-if="recentSessions.length" class="copilot-sidebar__group" :class="{ 'is-expanded': showRecent }">
            <div class="copilot-sidebar__group-title" @click="toggleGroup('recent')">
              <span>最近 3 天</span>
              <RightOutlined class="copilot-sidebar__group-arrow" :class="{ 'is-open': showRecent }" />
            </div>
            <div v-show="showRecent" class="copilot-sidebar__group-list">
              <div
                v-for="item in recentSessions"
                :key="item.id"
                class="copilot-sidebar__item"
                :class="{ 'is-active': item.id === activeSessionId }"
                @click="emit('selectHistory', item)"
              >
                <div class="copilot-sidebar__item-content">
                  <MessageOutlined class="copilot-sidebar__item-icon" />
                  <span class="copilot-sidebar__item-title">{{ item.title || '新对话' }}</span>
                </div>
                <Dropdown placement="bottomRight" :trigger="['click']">
                  <div class="copilot-sidebar__item-more" @click.stop>
                    <MoreOutlined />
                  </div>
                  <template #overlay>
                    <Menu>
                      <MenuItem key="rename" @click="onHistoryAction('rename', item)">
                        <template #icon><EditOutlined /></template>
                        重命名
                      </MenuItem>
                      <MenuItem key="share" @click="onHistoryAction('share', item)">
                        <template #icon><ShareAltOutlined /></template>
                        分享对话
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem key="delete" danger @click="onHistoryAction('delete', item)">
                        <template #icon><DeleteOutlined /></template>
                        删除对话
                      </MenuItem>
                    </Menu>
                  </template>
                </Dropdown>
              </div>
            </div>
          </div>

          <!-- 更早 -->
          <div class="copilot-sidebar__group" :class="{ 'is-expanded': showEarlier }">
            <div class="copilot-sidebar__group-title" @click="toggleGroup('earlier')">
              <span>更早</span>
              <RightOutlined class="copilot-sidebar__group-arrow" :class="{ 'is-open': showEarlier }" />
            </div>
            <div v-show="showEarlier" class="copilot-sidebar__group-list">
              <div
                v-for="item in earlierSessions"
                :key="item.id"
                class="copilot-sidebar__item"
                :class="{ 'is-active': item.id === activeSessionId }"
                @click="emit('selectHistory', item)"
              >
                <div class="copilot-sidebar__item-content">
                  <MessageOutlined class="copilot-sidebar__item-icon" />
                  <span class="copilot-sidebar__item-title">{{ item.title || '新对话' }}</span>
                </div>
                <Dropdown placement="bottomRight" :trigger="['click']">
                  <div class="copilot-sidebar__item-more" @click.stop>
                    <MoreOutlined />
                  </div>
                  <template #overlay>
                    <Menu>
                      <MenuItem key="rename" @click="onHistoryAction('rename', item)">
                        <template #icon><EditOutlined /></template>
                        重命名
                      </MenuItem>
                      <MenuItem key="share" @click="onHistoryAction('share', item)">
                        <template #icon><ShareAltOutlined /></template>
                        分享对话
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem key="delete" danger @click="onHistoryAction('delete', item)">
                        <template #icon><DeleteOutlined /></template>
                        删除对话
                      </MenuItem>
                    </Menu>
                  </template>
                </Dropdown>
              </div>
              <div v-if="earlierHasMore" class="copilot-sidebar__load-more">
                <Button
                  type="text"
                  size="small"
                  block
                  :disabled="earlierLoading"
                  @click="emit('loadMoreEarlier')"
                >
                  <template v-if="earlierLoading">
                    <Spin :indicator="h(LoadingOutlined, { style: 'font-size: 12px' })" size="small" />
                    <span style="margin-left: 6px;">加载中...</span>
                  </template>
                  <template v-else>加载更多</template>
                </Button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 收藏表折叠区 -->
      <div class="copilot-sidebar__favorites">
        <div class="copilot-sidebar__favorites-header" @click="showFavorites = !showFavorites">
          <span class="copilot-sidebar__favorites-label">
            <StarFilled class="copilot-sidebar__star-icon" />
            我的收藏 ({{ favoriteTables.length }})
          </span>
          <RightOutlined class="copilot-sidebar__favorites-arrow" :class="{ 'is-open': showFavorites }" />
        </div>
        <div v-show="showFavorites" class="copilot-sidebar__favorites-list">
          <div
            v-if="!favoriteTables.length"
            class="copilot-sidebar__favorites-empty"
          >
            暂无收藏表。在对话中关联常用表后，可在此处快速访问。
          </div>
          <Tooltip
            v-for="tbl in favoriteTables"
            :key="`${tbl.databaseName}.${tbl.tableName}`"
            :title="`${tbl.databaseName}.${tbl.tableName}`"
            placement="right"
          >
            <div
              class="copilot-sidebar__fav-item"
              @click="emit('sendFromFav', `${tbl.databaseName}.${tbl.tableName}`)"
            >
              <div class="copilot-sidebar__fav-info">
                <div class="copilot-sidebar__fav-fqn">{{ tbl.databaseName }}.{{ tbl.tableName }}</div>
                <div class="copilot-sidebar__fav-meta">
                  {{ truncateDesc(tbl.description) }}
                  <span class="copilot-sidebar__fav-sep">|</span>
                  {{ formatOwner(tbl) }}
                </div>
              </div>
              <Tooltip title="取消收藏">
                <button
                  type="button"
                  class="copilot-sidebar__fav-remove"
                  @click.stop="emit('toggleFavorite', tbl)"
                >
                  <StarFilled />
                </button>
              </Tooltip>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>

    <!-- 收起按钮 -->
    <div class="copilot-sidebar__footer">
      <Tooltip placement="top" title="收起侧边栏">
        <button type="button" class="copilot-sidebar__collapse-btn" @click="emit('collapse')">
          <MenuFoldOutlined />
        </button>
      </Tooltip>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { ref, computed, h } from 'vue';
import { Button, Dropdown, Menu, MenuItem, MenuDivider, Tooltip, Spin } from 'ant-design-vue';
import {
  PlusOutlined,
  MessageOutlined,
  MenuFoldOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  RightOutlined,
  StarFilled,
  ShareAltOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue';
import type { SessionItem, FavoriteItem } from '../../constant';

defineProps<{
  recentSessions: SessionItem[];
  earlierSessions: SessionItem[];
  favoriteTables: FavoriteItem[];
  activeSessionId?: string;
  earlierHasMore: boolean;
  earlierLoading: boolean;
}>();

const emit = defineEmits<{
  newChat: [];
  collapse: [];
  selectHistory: [item: SessionItem];
  deleteHistory: [sessionId: string];
  renameHistory: [session: SessionItem];
  shareHistory: [session: SessionItem];
  loadMoreEarlier: [];
  sendFromFav: [fqn: string];
  toggleFavorite: [item: FavoriteItem];
}>();

const activeGroup = ref<'recent' | 'earlier' | ''>('recent');
const showRecent = computed(() => activeGroup.value === 'recent');
const showEarlier = computed(() => activeGroup.value === 'earlier');
const toggleGroup = (group: 'recent' | 'earlier') => {
  activeGroup.value = activeGroup.value === group ? '' : group;
};
const showFavorites = ref(true);

const truncateDesc = (desc?: string) => {
  const text = desc || '-';
  return text.length > 10 ? text.slice(0, 10) + '...' : text;
};

const formatOwner = (tbl: FavoriteItem) => {
  const { ownerDisplayName, owner } = tbl;
  const emailPrefix = owner?.includes('@') ? owner.split('@')[0].trim() : '';
  if (ownerDisplayName && emailPrefix) return `${ownerDisplayName}(${emailPrefix})`;
  return ownerDisplayName || emailPrefix || owner || '未配置';
};

const onHistoryAction = (action: string, item: SessionItem) => {
  if (action === 'delete') {
    emit('deleteHistory', item.id);
    return;
  }
  if (action === 'rename') {
    emit('renameHistory', item);
    return;
  }
  if (action === 'share') {
    emit('shareHistory', item);
    return;
  }
};
</script>

<style lang="less" scoped>
@brand-purple: rgba(108, 76, 155, 1);
@brand-purple-shadow: rgba(108, 76, 155, 0.2);

.copilot-sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  min-height: 0;

  &__header {
    padding: 16px;
    flex-shrink: 0;
  }

  &__new-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 12px;
    border: none;
    font-weight: 500;
    font-size: 15px;
    background-color: @brand-purple !important;
    color: #fff !important;
    box-shadow: 0 4px 12px @brand-purple-shadow;
    transition: all 0.2s;

    &:hover {
      filter: brightness(1.08);
    }
  }

  &__body {
    flex: 1;
    padding: 0 12px;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding-bottom: 8px;
  }

  &__empty-hint {
    padding: 8px 12px 16px;
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
  }

  &__group {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    margin-bottom: 4px;

    &.is-expanded {
      flex: 1;
      min-height: 0;
    }
  }

  &__group-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 2px;
    }
    &::-webkit-scrollbar-track {
      background-color: transparent;
    }
  }

  &__group-title {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
    padding: 0 8px;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;

    &:hover {
      color: #64748b;
    }
  }

  &__group-arrow {
    font-size: 9px;
    color: #94a3b8;
    transition: transform 0.3s;

    &.is-open {
      transform: rotate(90deg);
    }
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f8fafc;

      .copilot-sidebar__item-more {
        opacity: 1;
      }
    }

    &.is-active {
      background: fade(@brand-purple, 8%);

      .copilot-sidebar__item-title {
        color: @brand-purple;
        font-weight: 500;
      }

      .copilot-sidebar__item-icon {
        color: @brand-purple;
      }
    }
  }

  &__load-more {
    padding: 4px 8px;
    margin-top: 2px;
  }

  &__item-content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  &__item-icon {
    flex-shrink: 0;
    margin-right: 8px;
    color: #94a3b8;
    font-size: 13px;
  }

  &__item-title {
    font-size: 13px;
    color: #475569;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-more {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 4px;
    opacity: 0;
    transition: all 0.15s;
    color: #94a3b8;

    &:hover {
      background: #e2e8f0;
    }
  }

  // 收藏折叠区
  &__favorites {
    flex: 1;
    min-height: 0;
    border-top: 1px solid #f1f5f9;
    padding-top: 12px;
    display: flex;
    flex-direction: column;
  }

  &__favorites-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 2px;
    }
    &::-webkit-scrollbar-track {
      background-color: transparent;
    }
  }

  &__favorites-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    margin-bottom: 8px;
    cursor: pointer;
    user-select: none;
  }

  &__favorites-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 0.3px;
    transition: color 0.2s;

    &:hover {
      color: #334155;
    }
  }

  &__star-icon {
    color: #f59e0b;
    font-size: 13px;
  }

  &__favorites-arrow {
    font-size: 10px;
    color: #94a3b8;
    transition: transform 0.3s;

    &.is-open {
      transform: rotate(90deg);
    }
  }

  &__favorites-empty {
    padding: 12px;
    border-radius: 8px;
    background: #f8fafc;
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.6;
  }

  &__fav-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    margin-bottom: 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f8fafc;
    }
  }

  &__fav-info {
    flex: 1;
    min-width: 0;
  }

  &__fav-fqn {
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__fav-meta {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__fav-sep {
    margin: 0 4px;
    opacity: 0.4;
  }

  &__fav-remove {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #f59e0b;
    cursor: pointer;
    font-size: 15px;
    transition: background 0.2s;

    &:hover {
      background: #fef3c7;
    }
  }

  // 底部收起按钮
  &__footer {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid #f1f5f9;
  }

  &__collapse-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    outline: none;

    &:hover {
      background: #f1f5f9;
      color: @brand-purple;
      border-color: fade(@brand-purple, 35%);
    }
  }
}
</style>
