<template>
  <div class="foundation-page">
    <section class="foundation-page__hero">
      <div>
        <p class="foundation-page__eyebrow">项目基础能力</p>
        <h2>基础能力总览</h2>
        <p class="foundation-page__desc">集中展示项目中的通用方法、组件、请求封装、状态管理和资源层。</p>
      </div>
      <a-space>
      <a-button @click="showNotice">查看通知链路</a-button>
      <a-button type="primary" @click="detailOpen = true">查看架构说明</a-button>
      </a-space>
    </section>

    <section class="foundation-page__stats">
      <article class="stat-card">
        <span>通用组件</span>
        <strong>{{ componentItems.length }}</strong>
        <small>可跨模块复用</small>
      </article>
      <article class="stat-card">
        <span>状态仓库</span>
        <strong>{{ storeItems.length }}</strong>
        <small>全局状态仓库</small>
      </article>
      <article class="stat-card">
        <span>资源层</span>
        <strong>{{ resourceItems.length }}</strong>
        <small>统一 API 封装</small>
      </article>
      <article class="stat-card">
        <span>请求链</span>
        <strong>1</strong>
        <small>统一请求封装</small>
      </article>
    </section>

    <section class="grid-section">
      <div class="panel">
        <div class="panel__header">
          <div>
            <h3>请求封装 / 拦截链</h3>
            <p>当前项目没有拆分 axios 拦截器文件，请求能力集中收口在 `utils/request.ts`。</p>
          </div>
        </div>
        <div class="cap-card cap-card--single">
          <div class="cap-card__title">utils/request.ts</div>
          <p>负责 `httpGet / httpPost`、参数拼接、统一 YqgResponse 结构解包，是当前项目实际承担“请求拦截职责”的入口。</p>
          <pre class="snippet">{{ requestSnippet }}</pre>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header">
          <div>
            <h3>通用组件</h3>
            <p>开发新模块时优先复用这些基础组件，避免每个页面重复造轮子。</p>
          </div>
        </div>
        <div class="cap-grid">
          <div v-for="item in componentItems" :key="item.name" class="cap-card">
            <div class="cap-card__title">{{ item.name }}</div>
            <div class="cap-card__path">{{ item.path }}</div>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid-section">
      <div class="panel">
        <div class="panel__header">
          <div>
            <h3>状态管理</h3>
            <p>当前项目使用 Pinia 管理用户、项目、标签页签和全局通知等跨页状态。</p>
          </div>
        </div>
        <div class="cap-grid">
          <div v-for="item in storeItems" :key="item.name" class="cap-card">
            <div class="cap-card__title">{{ item.name }}</div>
            <div class="cap-card__path">{{ item.path }}</div>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header">
          <div>
            <h3>资源层</h3>
            <p>通过 `resources/*` 做 API 归口，页面层尽量不直接操作 fetch。</p>
          </div>
        </div>
        <div class="cap-grid">
          <div v-for="item in resourceItems" :key="item.name" class="cap-card">
            <div class="cap-card__title">{{ item.name }}</div>
            <div class="cap-card__path">{{ item.path }}</div>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="panel demo-panel">
      <div class="panel__header">
        <div>
          <h3>建设规范</h3>
          <p>统一页面、资源层、状态管理和组件复用方式。</p>
        </div>
      </div>
      <div class="advice-grid">
        <div class="cap-card">
          <div class="cap-card__title">模块建设顺序</div>
          <p>优先整理 `resources/* + mocks/* + 页面主容器`，再完善详情页、弹窗和样式细节。</p>
        </div>
        <div class="cap-card">
          <div class="cap-card__title">推荐复用件</div>
          <p>`GlobalNotice` 适合全局提示，`PushDrawer` 适合工作台右侧面板，`CodeEditor` 适合 SQL / JSON / TS 编辑场景。</p>
        </div>
        <div class="cap-card">
          <div class="cap-card__title">接口链约束</div>
          <p>所有页面都应经由 `resources/*` 发请求，再由 `mocks/handlers.ts` 统一返回数据，保证视图和交互始终一致。</p>
        </div>
      </div>
    </section>

    <a-drawer v-model:open="detailOpen" title="详细说明" width="720">
      <div class="detail-block">
        <h4>通用方法</h4>
        <p>`utils/request.ts` 是请求入口；`utils/tool.ts` 和 `utils/monaco-setup.ts` 负责工具型能力和编辑器初始化。</p>
      </div>
      <div class="detail-block">
        <h4>组件体系</h4>
        <p>`CodeEditor.vue` 提供 Monaco 编辑体验；`PushDrawer.vue` 负责挤压式工作区；`GlobalNotice.vue` 负责顶部全局通知；`copilot/*` 和 `sql-editor/*` 是更重的业务组件。</p>
      </div>
      <div class="detail-block">
        <h4>Store 体系</h4>
        <p>`project / user / global-notice / tag-country / tag-tabs` 共同承接项目级、用户级和模块级状态，后续模块开发时可以直接接入。</p>
      </div>
      <div class="detail-block">
        <h4>资源层与数据返回</h4>
        <p>所有页面都应该走 `resources/*` 调接口，再由 MSW 在 `mocks/handlers.ts` 中统一拦截返回数据，这也是当前项目的核心运行方式。</p>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useGlobalNoticeStore } from '@/store/global-notice';

const noticeStore = useGlobalNoticeStore();
const detailOpen = ref(false);

const requestSnippet = `httpGet / httpPost -> buildUrl -> fetch -> toYqgResponse -> resource unwrap`;

const componentItems = [
  { name: 'CodeEditor', path: 'src/components/CodeEditor.vue', desc: 'Monaco 二次封装，适合 SQL / TS / JSON 等代码编辑场景。' },
  { name: 'PushDrawer', path: 'src/components/PushDrawer.vue', desc: '挤压式抽屉，用于和主编辑区共存的工作台右侧面板。' },
  { name: 'GlobalNotice', path: 'src/components/GlobalNotice.vue', desc: 'Layout 顶部全局通知条，受 store 控制。' },
  { name: 'Copilot Components', path: 'src/components/copilot/*', desc: '对话式助手组件集，含消息卡片、反馈、分享、关联表等能力。' },
];

const storeItems = [
  { name: 'project', path: 'src/store/project.ts', desc: '维护当前项目与国家选择，是 Layout 顶部切换器的数据源。' },
  { name: 'user', path: 'src/store/user.ts', desc: '维护当前登录用户信息，并提供懒加载获取逻辑。' },
  { name: 'global-notice', path: 'src/store/global-notice.ts', desc: '控制全局通知条的展示、隐藏和级别。' },
  { name: 'tag-tabs', path: 'src/store/tag-tabs.ts', desc: '承接标签管理模块的工作台式多 Tab 交互。' },
  { name: 'tag-country', path: 'src/store/tag-country.ts', desc: '维护标签管理区域切换状态。' },
];

const resourceItems = [
  { name: 'common', path: 'src/resources/common.ts', desc: '用户、项目、全局通知等通用接口归口。' },
  { name: 'tag', path: 'src/resources/tag.ts', desc: '标签管理所有接口的资源层封装。' },
  { name: 'studio/sql/explore', path: 'src/resources/studio.ts / sql.ts / explore.ts', desc: 'SQL 工作台与查询页的接口入口。' },
  { name: 'ops/data-develop', path: 'src/resources/ops.ts / data-develop.ts', desc: '任务开发与运维类接口封装。' },
];

function showNotice() {
  noticeStore.show({
    title: '基础能力说明',
    content: '当前页面正在通过全局通知 store 驱动顶部消息条。',
    level: 'success',
  });
}
</script>

<style lang="less" scoped>
.foundation-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%);
}

.foundation-page__hero,
.panel,
.stat-card,
.cap-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.foundation-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.foundation-page__eyebrow {
  margin: 0 0 8px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.foundation-page__hero h2,
.panel__header h3,
.detail-block h4 {
  margin: 0;
}

.foundation-page__desc,
.panel__header p,
.detail-block p {
  margin: 8px 0 0;
  color: #667085;
}

.foundation-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
}

.stat-card span {
  color: #667085;
  font-size: 13px;
}

.stat-card strong {
  color: #101828;
  font-size: 28px;
}

.grid-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  padding: 20px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.cap-grid,
.advice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.cap-card {
  padding: 16px;
}

.cap-card--single {
  padding: 20px;
}

.cap-card__title {
  color: #101828;
  font-size: 15px;
  font-weight: 600;
}

.cap-card__path {
  margin-top: 6px;
  color: #3b82f6;
  font-size: 12px;
}

.cap-card p {
  margin: 10px 0 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.7;
}

.snippet {
  margin: 14px 0 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: #0f172a;
  color: #e5e7eb;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.demo-panel {
  margin-bottom: 0;
}

.detail-block + .detail-block {
  margin-top: 20px;
}

@media (max-width: 960px) {
  .foundation-page {
    padding: 16px;
  }

  .foundation-page__hero,
  .foundation-page__stats,
  .grid-section,
  .cap-grid,
  .advice-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
