<template>
  <Modal
    v-model:open="visible"
    :width="isFullscreen ? '100vw' : 900"
    :style="isFullscreen ? { top: 0, padding: 0, margin: 0, maxWidth: '100vw' } : undefined"
    :wrap-class-name="isFullscreen ? 'log-viewer-fullscreen' : ''"
    destroy-on-close
    @cancel="handleClose"
  >
    <template #title>
      <div class="lv-title">
        <span>运行日志</span>
        <div class="lv-title-right">
          <div class="lv-search-wrap">
            <Input
              v-model:value="searchText"
              placeholder="搜索日志..."
              allow-clear
              size="small"
              :bordered="false"
              class="lv-search-input"
              @press-enter="jumpToMatch(1)"
            >
              <template #prefix>
                <SearchOutlined style="color: #bfbfbf" />
              </template>
            </Input>
            <div v-if="searchText" class="lv-search-nav">
              <span class="lv-search-count">
                {{ totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : '0/0' }}
              </span>
              <Button type="text" size="small" class="lv-nav-btn" :disabled="totalMatches === 0" @click="jumpToMatch(-1)">
                <template #icon><UpOutlined style="font-size: 12px" /></template>
              </Button>
              <Button type="text" size="small" class="lv-nav-btn" :disabled="totalMatches === 0" @click="jumpToMatch(1)">
                <template #icon><DownOutlined style="font-size: 12px" /></template>
              </Button>
            </div>
          </div>
          <Tooltip :title="isFullscreen ? '退出全屏' : '全屏'">
            <Button type="text" @click="isFullscreen = !isFullscreen">
              <template #icon>
                <FullscreenExitOutlined v-if="isFullscreen" />
                <FullscreenOutlined v-else />
              </template>
            </Button>
          </Tooltip>
        </div>
      </div>
    </template>

    <Tabs
      v-if="tabList.length > 0"
      v-model:active-key="activeKey"
      type="card"
      class="lv-tabs"
      @change="handleTabChange"
    >
      <TabPane v-for="item in tabList" :key="String(item.key)" :tab="item.name" />
    </Tabs>

    <div
      class="lv-body"
      :style="{
        height: isFullscreen
          ? (tabList.length > 0 ? 'calc(100vh - 160px)' : 'calc(100vh - 108px)')
          : '65vh',
        maxHeight: isFullscreen ? 'none' : '700px',
        margin: '0 20px',
      }"
    >
      <div ref="logContentRef" class="lv-log-content" @scroll="handleScroll">
        <div class="lv-header">
          <div v-if="activeAppLinks.length > 0" class="lv-header-text">
            <span class="lv-app-label">AppId:</span>
            <template v-for="([appId, link], idx) in activeAppLinks" :key="appId">
              <span v-if="idx > 0" class="lv-app-divider">|</span>
              <a :href="link" target="_blank" rel="noopener noreferrer" class="lv-app-link">{{ appId }}</a>
            </template>
          </div>
          <span v-else />
          <Tooltip v-if="currentLines.length > 0" title="复制日志">
            <Button type="text" size="small" class="lv-copy-btn" @click="handleCopy">
              <template #icon><CopyOutlined /></template>
            </Button>
          </Tooltip>
        </div>

        <div v-for="(line, idx) in currentLines" :key="idx" class="lv-line">
          <span class="lv-line-no">{{ idx + 1 }}</span>
          <template v-if="searchText && searchSegments[idx]">
            <template v-for="(seg, si) in searchSegments[idx]" :key="si">
              <mark
                v-if="seg.isMatch"
                :id="`lv-match-${seg.matchIndex}`"
                class="lv-mark"
                :class="{ 'lv-mark-active': seg.matchIndex === currentMatchIndex }"
              >{{ seg.text }}</mark>
              <span v-else v-html="highlightedSegments[idx]?.[si] ?? ''" />
            </template>
          </template>
          <span v-else v-html="highlightedLines[idx] ?? ''" />
        </div>

        <div v-if="loading || (!hasMore && currentLines.length > 0)" class="lv-load-more">
          <span v-if="loading && currentLines.length === 0">正在加载日志...</span>
          <span v-else-if="loading">正在加载更多日志...</span>
          <span v-else>--- 已经到底了 ---</span>
        </div>
      </div>
    </div>

    <template #footer>
      <Button @click="handleClose">关闭</Button>
      <Button type="primary" @click="handleRefresh">刷新</Button>
    </template>
  </Modal>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue';
import { message, Modal, Button, Input, Tabs, TabPane, Tooltip } from 'ant-design-vue';
import {
  SearchOutlined,
  UpOutlined,
  DownOutlined,
  CopyOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons-vue';
import AnsiToHtml from 'ansi-to-html';

interface LogTab {
  key: string;
  name: string;
  log: string;
  appLink?: Record<string, string>;
}

interface Props {
  open: boolean;
  tabList: LogTab[];
  loading?: boolean;
  hasMore?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hasMore: false,
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  'refresh': [];
  'load-more': [];
}>();

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
});

const isFullscreen = ref(false);
const activeKey = ref('');
const searchText = ref('');
const currentMatchIndex = ref(0);
const logContentRef = ref<HTMLElement | null>(null);

const ansiConverter = new AnsiToHtml({
  fg: '#a9b7c6',
  bg: '#2b2b2b',
  newline: false,
  escapeXML: true,
  stream: false,
});

watch(() => props.open, (val) => {
  if (val) {
    searchText.value = '';
    currentMatchIndex.value = 0;
    isFullscreen.value = false;
  }
});

watch(() => props.tabList, (newList) => {
  if (newList.length > 0 && !newList.find(t => String(t.key) === String(activeKey.value))) {
    activeKey.value = String(newList[0].key);
  }
}, { immediate: true });

const activeTab = computed(() =>
  props.tabList.find(t => String(t.key) === String(activeKey.value)),
);

const activeAppLinks = computed(() => {
  const linkMap = activeTab.value?.appLink;
  if (!linkMap || Object.keys(linkMap).length === 0) return [];

  return Object.entries(linkMap);
});

const preprocessLog = (logText: string): string => {
  if (!logText) return '';

  return logText
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
};

const currentLines = computed(() => {
  const tab = activeTab.value;
  if (!tab?.log) return [];
  const lines = preprocessLog(tab.log).split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines;
});

const highlightSyntax = (text: string): string => {
  if (!text) return '';
  let html = ansiConverter.toHtml(text);
  html = html
    .replace(/\[INFO\]/g, '<span style="color:#73d13d;font-weight:bold;">[INFO]</span>')
    .replace(/\[ERR\]/g, '<span style="color:#ff4d4f;font-weight:bold;">[ERR]</span>')
    .replace(/\[ERROR\]/g, '<span style="color:#ff4d4f;font-weight:bold;">[ERROR]</span>')
    .replace(/\[WARN\]/g, '<span style="color:#faad14;font-weight:bold;">[WARN]</span>')
    .replace(/\[DEBUG\]/g, '<span style="color:#9e9e9e;font-weight:bold;">[DEBUG]</span>')
    .replace(/(taskAppId=[\w-]+)/g, '<span style="color:#177ddc;font-weight:bold;">$1</span>')
    .replace(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/g, '<span style="color:#87e8de;">$1</span>');

  return html;
};

const highlightedLines = computed(() =>
  currentLines.value.map(line => highlightSyntax(line)),
);

const highlightedSegments = computed(() => {
  if (!searchText.value || !searchSegments.value.length) return [];

  return searchSegments.value.map(segs =>
    segs.map(seg => (seg.isMatch ? '' : highlightSyntax(seg.text))),
  );
});

const searchSegments = computed(() => {
  if (!searchText.value || !currentLines.value.length) return [];
  const escaped = searchText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  let matchCounter = 0;

  return currentLines.value.map(line => {
    const parts = line.split(regex);

    return parts
      .filter(p => p.length > 0)
      .map(part => {
        if (part.toLowerCase() === searchText.value.toLowerCase()) {
          return { text: part, isMatch: true as const, matchIndex: matchCounter++ };
        }

        return { text: part, isMatch: false as const, matchIndex: -1 };
      });
  });
});

const totalMatches = computed(() => {
  if (!searchSegments.value.length) return 0;

  return searchSegments.value.reduce(
    (sum, segs) => sum + segs.filter(s => s.isMatch).length,
    0,
  );
});

watch(searchText, () => {
  currentMatchIndex.value = 0;
});

const jumpToMatch = (direction: number) => {
  if (totalMatches.value === 0) return;
  let next = currentMatchIndex.value + direction;
  if (next < 0) next = totalMatches.value - 1;
  if (next >= totalMatches.value) next = 0;
  currentMatchIndex.value = next;
  nextTick(() => {
    const el = document.getElementById(`lv-match-${next}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

let scrollThrottleTimer: ReturnType<typeof setTimeout> | null = null;
const handleScroll = (e: Event) => {
  if (scrollThrottleTimer) return;
  scrollThrottleTimer = setTimeout(() => {
    scrollThrottleTimer = null;
    if (!props.hasMore || props.loading) return;
    const target = e.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
      emit('load-more');
    }
  }, 200);
};

const handleTabChange = (key: string | number) => {
  activeKey.value = String(key);
  searchText.value = '';
  currentMatchIndex.value = 0;
};

const handleClose = () => {
  visible.value = false;
};

const handleRefresh = () => {
  emit('refresh');
};

const handleCopy = () => {
  const tab = activeTab.value;
  if (tab?.log) {
    navigator.clipboard.writeText(preprocessLog(tab.log));
    message.success('已复制');
  }
};
</script>

<style scoped>
.lv-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.lv-title-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 15px;
}

.lv-search-wrap {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  padding: 2px 4px 2px 8px;
  border-radius: 4px;
  height: 28px;
}

.lv-search-input {
  width: 140px;
  background: transparent;
  padding: 0;
}

.lv-search-input :deep(.ant-input) {
  background: transparent;
}

.lv-search-nav {
  display: flex;
  align-items: center;
  margin-left: 4px;
  border-left: 1px solid #e8e8e8;
  padding-left: 8px;
}

.lv-search-count {
  font-size: 12px;
  color: #8c8c8c;
  margin-right: 4px;
  min-width: 32px;
  text-align: center;
}

.lv-nav-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lv-tabs {
  padding: 0 20px;
  margin-bottom: 0;
}

.lv-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.lv-body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 0 8px 8px;
  border: 1px solid #d9d9d9;
}

.lv-log-content {
  flex: 1;
  background: #2b2b2b;
  color: #a9b7c6;
  padding: 16px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-y: auto;
  min-height: 100px;
}

.lv-log-content::-webkit-scrollbar {
  width: 6px;
}

.lv-log-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.lv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
  gap: 8px;
}

.lv-header-text {
  color: #8c8c8c;
  font-size: 12px;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}

.lv-app-label {
  flex-shrink: 0;
  margin-right: 4px;
}

.lv-app-link {
  color: #177ddc;
  text-decoration: underline;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lv-app-link:hover {
  color: #40a9ff;
}

.lv-app-divider {
  margin: 0 6px;
  color: #555;
}

.lv-copy-btn {
  flex-shrink: 0;
  color: #a9b7c6;
}

.lv-line {
  min-height: 20px;
  word-break: break-all;
}

.lv-line-no {
  display: inline-block;
  width: 32px;
  text-align: right;
  margin-right: 12px;
  color: #555;
  user-select: none;
}

.lv-mark {
  color: #fff;
  padding: 0 2px;
  border-radius: 2px;
  background-color: #177ddc;
  transition: background-color 0.3s;
}

.lv-mark-active {
  background-color: #faad14;
}

.lv-load-more {
  text-align: center;
  padding: 16px 0;
  color: #8c8c8c;
  font-size: 12px;
  border-top: 1px dashed #444;
  margin-top: 16px;
}
</style>

<style>
.log-viewer-fullscreen .ant-modal {
  max-width: 100vw;
  top: 0;
  padding-bottom: 0;
  margin: 0;
  height: 100vh;
}

.log-viewer-fullscreen .ant-modal-content {
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.log-viewer-fullscreen .ant-modal-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
}
</style>
