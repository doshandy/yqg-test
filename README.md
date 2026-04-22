# DataPlatform Demo

一个 **完全单机、零后端依赖** 的数据平台演示工程。涵盖 SQL 工作台、数据地图、对话式数据探索 Agent、Copilot AI 助手、指标目录等常见数据平台模块，可直接在浏览器里跑通端到端交互。

所有 `/api/*` 请求都被 [MSW (Mock Service Worker)](https://mswjs.io/) 在浏览器层拦截并返回 mock 数据——无需启动任何后端服务、无需登录、无网络也能跑。

## 在线体验

**👉 https://doshandy.github.io/yqg-test/**

> 每次 push 到 `master` 会触发 GitHub Actions 自动构建并部署到 Pages；CI 大约 2 分钟后生效。

## 仓库地址

https://github.com/doshandy/yqg-test

## 技术栈

| 分类 | 使用 | 版本 |
|---|---|---|
| 构建 | Vite | 8 |
| 框架 | Vue 3（Composition API + `<script setup>`）| 3.5 |
| 语言 | TypeScript | 6 |
| 路由 | vue-router（HTML5 History 模式）| 5 |
| 状态 | Pinia | 3 |
| UI | ant-design-vue + `@ant-design/icons-vue` | 4.2 |
| 表格增强 | vxe-table / vxe-pc-ui | 4 |
| 编辑器 | monaco-editor + monaco-sql-languages + sql-formatter | 0.48 |
| Markdown/安全 | marked + dompurify | 最新 |
| Mock | MSW（Service Worker 模式）| 2 |
| 包管理 | pnpm | 8.14.1 |
| 其它 | dayjs、lodash、uuid、vuedraggable、ansi-to-html | — |

## 快速开始

先装 pnpm（一次）：
```bash
npm i -g pnpm
# 或
brew install pnpm
# 或（推荐）开启 corepack 自动使用 package.json 里 pin 的版本
corepack enable
```

然后：
```bash
pnpm install      # 首次安装依赖
pnpm dev          # 启动 Vite 开发服务器，内嵌 MSW 拦截
```

默认服务地址：`http://127.0.0.1:5173`（端口被占用会自动顺延到 5174/5175…）。

首次访问时浏览器 DevTools Console 会打印：

```text
[MSW] Mocking enabled.
[MSW] mock worker started. 拦截所有以 /api 开头的接口。
```

> 如果没看到这两行，通常是 Service Worker 没注册——刷新一次或 DevTools → Application → Service Workers 里手动 `Unregister` 再刷新即可。

### 其它命令

```bash
pnpm build        # Vite 生产构建（产物写到 dist/）
pnpm typecheck    # vue-tsc --noEmit 独立类型检查
pnpm preview      # 本地预览 dist/，依然带 MSW
```

> 类型检查从 build 里拆出来了：`build` 只跑 Vite（esbuild 转译），`typecheck` 用 `vue-tsc --noEmit` 独立校验。这样生产构建不会因为类型错阻塞。

## 部署到 GitHub Pages

已经配好了 GitHub Actions 工作流 `.github/workflows/deploy.yml`：

- push 到 `master` 自动触发构建 + 发布
- 构建时通过 `PUBLIC_BASE=/yqg-test/` 环境变量注入 Vite 的 `base`
- 自动复制 `index.html` → `404.html` 作为 SPA 深链接的 fallback（避免刷新 `/yqg-test/studio` 时 GitHub Pages 404）

如果把仓库 fork/rename，需要同步改两处：
1. `.github/workflows/deploy.yml` 里的 `PUBLIC_BASE`
2. 本文件顶部的"在线体验"链接

## 目录结构

```
test/
├── public/
│   └── mockServiceWorker.js           # MSW 自动生成的 Service Worker（勿手改）
├── src/
│   ├── main.ts                        # 入口：先 start MSW worker，再 mount Vue
│   ├── App.vue                        # 根组件（ConfigProvider + router-view）
│   │
│   ├── layouts/
│   │   └── AppLayout.vue              # 工作台整体框架：顶部栏 + 左侧菜单 + 主内容区
│   │
│   ├── routers/
│   │   ├── index.ts                   # 路由聚合 + menuRoutes（供左侧菜单消费）
│   │   └── module/                    # 按业务切分的路由片段
│   │       ├── home.ts                # /pilot-home /lumina-home /not-found
│   │       ├── dashboard.ts           # /workbench
│   │       ├── metric.ts              # /metric/catalog /metric/develop
│   │       ├── datamap.ts             # /data-map /data-map/:id /dqc /schedule
│   │       ├── data-map-agent.ts      # /data-map-agent（对话式数据探索）
│   │       ├── data-develop.ts        # /data-develop/task /data-develop/table /studio /ops /explore/sql
│   │       └── tag.ts                 # /tag
│   │
│   ├── pages/
│   │   ├── home/                      # 两套首页 + 404
│   │   ├── workbench/                 # 工作台概览
│   │   ├── metric/catalog/            # 指标目录
│   │   ├── data-map/                  # 数据地图（资产列表 + 详情抽屉）
│   │   ├── data-map-agent/            # ⭐ 数据地图 Agent —— 完整对话式 UI
│   │   ├── studio/                    # ⭐ SQL 工作台 —— 多 tab + Copilot 面板 + 结果集
│   │   ├── data-develop/
│   │   │   ├── task/                  # 任务开发（侧边任务树 + 抽屉配置）
│   │   │   └── table/                 # 表开发（DDL / 版本 / 权限）
│   │   ├── explore/sql/               # SQL 探索（轻量查询）
│   │   ├── ops/                       # 运维中心（任务调度 / 日志）
│   │   ├── tag/                       # 标签/指标管理
│   │   └── common/ComingSoon.vue      # 占位页
│   │
│   ├── components/
│   │   ├── copilot/                   # ⭐ Studio Copilot 面板（挤压式内嵌）
│   │   │   ├── copilot.vue            # 主容器：SSE 流处理 + 消息渲染
│   │   │   ├── components/            # think-card / generating-card / done-card / 各类卡片
│   │   │   ├── modal/                 # associate-table-modal
│   │   │   ├── manage/                # PageOperationManager：前端动作路由枢纽
│   │   │   └── resources/copilot.ts   # API 层（fetch shim）
│   │   ├── monaco-editor/             # Monaco + 自研 SQL parser
│   │   ├── sql-editor/                # 基于 Monaco 的封装
│   │   ├── CodeEditor.vue
│   │   ├── GlobalNotice.vue
│   │   └── PushDrawer.vue
│   │
│   ├── store/                         # Pinia
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── global-notice.ts
│   │   └── tag-tabs.ts
│   │
│   ├── storage/                       # localStorage 封装
│   │   ├── project.ts                 # 当前项目 ID（请求 header 用）
│   │   ├── code-theme.ts
│   │   └── task-folded.ts
│   │
│   ├── resources/                     # HTTP 层（页面直接调用）
│   │   ├── common.ts home.ts metric.ts datamap.ts
│   │   ├── data-develop.ts studio.ts explore.ts ops.ts tag.ts sql.ts
│   │
│   ├── mocks/                         # ⭐ 所有 Mock 统一在此
│   │   ├── browser.ts                 # MSW worker 启动逻辑
│   │   ├── handlers.ts                # 所有接口 handler（约 100 个）
│   │   └── data/                      # 各业务模块的 mock 数据与剧本
│   │
│   └── utils/
│       ├── request.ts                 # 轻量 fetch 封装
│       ├── monaco-setup.ts
│       └── tool.ts
│
├── .github/workflows/deploy.yml       # Pages 自动部署工作流
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── package.json
```

## 核心页面与路由

| 路由 | 页面 | 关键特性 |
|---|---|---|
| `/` | → `/pilot-home` | |
| `/pilot-home` | 科技感首页 | Canvas 粒子 + 打字机 + 鼠标跟随光效 |
| `/lumina-home` | 霓虹风首页 | 动效 SVG Logo + 霓虹光球 |
| `/workbench` | 工作台概览 | 统计卡 + 最近活动 + 快速入口 |
| `/metric/catalog` | 指标目录 | 搜索 / 筛选 / 分页 / 详情弹窗 |
| `/data-map` | 数据地图（资产列表） | 分层 tab + 关键字搜索 + 表格 + 抽屉详情 + Copilot 浮动入口 |
| `/data-map/:id` | 资产详情 | 描述 + 字段 + 血缘占位 |
| **`/data-map-agent`** | **数据地图 Agent** ⭐ | 对话式数据探索：欢迎页 + 推荐提示词 + 流式思考链 + 会话历史 + 收藏表 + 分享 |
| **`/studio`** | **SQL 工作台** ⭐ | Monaco 编辑器 + 多 tab 切换 + 执行结果面板 + **Copilot 挤压式面板**（支持 SQL diff 采纳/回退）|
| `/data-develop/task` | 任务开发 | 侧边任务树 + 版本/调度/监控/质量抽屉 |
| `/data-develop/table` | 表开发 | DDL 预览 + 权限管理 + 版本对比 |
| `/explore/sql` | SQL 探索 | 轻量查询 + 上传/历史抽屉 |
| `/ops` | 运维中心 | 任务调度 + 日志弹窗 |
| `/tag` | 标签/指标 | 指标/规则/分组/查询统计/系统授权 |

## ⭐ Copilot 智能助手

Copilot 在项目里有 **两处挂载**，共享一套 SSE mock：

### 1. Studio 内嵌面板 `/studio`
- 右侧图标栏点紫色 `RobotOutlined` 图标打开
- 挤压式布局（自动缩窄编辑区，不用 Modal）
- FRONTEND_ACTION（比如 `SHOW_SQL_DIFF_CARD`）会触发 SQL 被写入当前编辑器，并支持"回退"

### 2. 独立对话页 `/data-map-agent`
- 左侧会话历史（最近/更早分组）+ 收藏表 + 新建对话
- 中间欢迎页（推荐提示词）或消息流
- 完整的分享配置弹窗、消息反馈（👍/👎）、@ 选表

### 剧本触发关键字（可直接用来测 mock）

| 关键字 | 触发卡片 |
|---|---|
| `查询订单` / `帮我写一段 SQL` | 代码生成 + SQL diff 卡 + DONE 卡 |
| `哪个 / 哪种 / 哪张` | 意图澄清卡（选完表后下一轮吐 SQL diff） |
| `查一下 / 看看 / 分析一下`（无表线索） | 缺上下文卡（需要点"关联表"） |
| `risk_event / user_pii / 风控明细` | 无权限卡 |
| `建表 / create table` | 建表/关联表澄清卡（选母表 → CREATE TABLE 语句） |
| `定位 / 找表 / 在图谱` | `LOCATE_TABLE` 动作，data-map 页会自动填入搜索框 |
| `解释 / 什么意思 / explain` | 代码解释 |

### 前端动作枢纽：PageOperationManager
`src/components/copilot/manage/PageOperationManager.ts` 是一个轻量 pub/sub，作为 Copilot 与宿主页（studio / data-map 等）之间的解耦层：

- Copilot 收到 FRONTEND_ACTION 时只 `pageOperationManager.notify(type, payload)`
- 宿主页 `onMounted` 里 `register(type, handler)`，`onBeforeUnmount` 里 `unregister`
- 已注册的 type：`copilot-replace-code` / `copilot-revert-code` / `data-map-locate-table`

新增一个前端动作的成本：mock 加个 action + Manager 加 type 常量 + 宿主页注册 handler，Copilot 本体不改。

## 架构要点

### 接口响应统一结构
所有 mock 返回保持统一形状：
```ts
{ status: { code: 0, detail: 'ok' }, body: <业务数据> }
```
页面侧统一用 `const { data: { body } } = await XxxApi.fetchXxx()` 解构消费。

### SSE 流式响应
`/api/agentic/agent/chat` 和 `/api/agentic/agent/action` 是流式接口，MSW 用 `ReadableStream` 逐片下发 chunk、监听 `request.signal` 中止。剧本定义在 `src/mocks/data/copilot.ts` —— 根据用户输入关键词挑不同剧本，每个剧本是一串 `{ delay, payload }` 时序。

### data-map 与 data-map-agent 两套独立实现
`/data-map` 是传统的资产列表页；`/data-map-agent` 是对话式数据探索，自带 copilot-main / footer / sidebar / done-card / ai-message-feedback 等整套视图，**不复用** `components/copilot/` 下的 Studio Copilot 组件，保持独立演进。

### 菜单自动注册
`routers/index.ts` 暴露 `menuRoutes`；`AppLayout.vue` 扫描每项的 `meta.title` / `meta.icon` 自动生成左侧菜单。新增一个模块只需在 `routers/module/` 下加文件 + 在 `routers/index.ts` 聚合。

### fullBleed 路由
需要整屏展示（无内边距）的页面要加到 `AppLayout.vue` 的 `fullBleedRoutes` 集合：`/studio` `/ops` `/data-map-agent` 等。

## 新增一个接口的工作流

1. 在 `src/mocks/data/<模块>.ts` 准备响应数据；
2. 在 `src/mocks/handlers.ts` 挂 handler：
   ```ts
   http.get('/api/xxx/yyy', ({ request }) => ok(buildYourData()))
   ```
3. 在 `src/resources/<模块>.ts` 增加 API：
   ```ts
   fetchXxx: (params) => request.get('/api/xxx/yyy', { params })
   ```
4. 页面侧调用 + 解构 body 使用。

新增 SSE 剧本参考 `src/mocks/data/copilot.ts` 的 `buildCodeGenScript` / `buildTableClarifyScript` 等。

## 刻意跳过的内容

以下模块涉及私有依赖或重度集成，Demo 中不实现或保留占位：

- Jupyter Notebook
- G2 图表（依赖深度定制的 `@antv/g2`）
- 神策埋点 / Sentry / FMP 监控
- 私有权限点与多国部署
- 真实认证 / 真实后端
- CI/CD 流水线、发布中心

## 常见问题

**Q: 刷新后 MSW 报 404？**
A: 检查 `public/mockServiceWorker.js` 是否存在。如果没了就跑 `pnpm exec msw init public/ --save` 重新生成。

**Q: dev server 启动但页面白屏？**
A: 打开 DevTools Console；大概率是 Service Worker 首次注册后还没 fetch 到 mock，再刷新一次即可。

**Q: 改了 mock 剧本，Copilot 怎么不生效？**
A: 浏览器会缓存 Service Worker 脚本；DevTools → Application → Service Workers → "Update on reload" 勾上，或手动 unregister 再刷新。

**Q: 线上 Pages 访问首页空白？**
A: 首次部署后 Service Worker 首轮注册完才开始拦截请求，刷新一次即可；如果持续空白，看 DevTools Console 是否有 `/yqg-test/mockServiceWorker.js` 404 报错。

## License

仅用于学习/演示用途，不用于生产环境。
