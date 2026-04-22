# DataPlatform Demo

从 [`cn-data-pilot`](../cn-data-pilot) 与 [`cn-data-lumina`](../cn-data-lumina) 两个内部数据平台项目中抽取 **有展示价值的 UI 骨架与交互模式**，重构为一个 **完全单机、无任何私有依赖、无认证、可直接运行** 的演示工程。

所有接口请求都由 [MSW (Mock Service Worker)](https://mswjs.io/) 拦截并在本地返回 mock 数据。

## 技术栈

- Vite 8 + Vue 3.5 + TypeScript 6
- Vue Router 4（Hash 模式）
- Pinia
- ant-design-vue 4.x + @ant-design/icons-vue
- Less
- MSW（浏览器 Service Worker 模式）

## 快速开始

```bash
npm install
npm run dev
```

默认会启动在 `http://127.0.0.1:5173`（端口被占用会自动顺延）。

首次访问时，浏览器控制台会打印：

```
[MSW] Mocking enabled.
[MSW] mock worker started. 拦截所有以 /api 开头的接口。
```

## 目录结构

```
test/
├── public/
│   ├── mockServiceWorker.js   # MSW 生成的 Service Worker
│   └── favicon.svg
├── src/
│   ├── App.vue                # 根组件（ConfigProvider + router-view）
│   ├── main.ts                # 入口（启动 MSW → 挂载 Vue）
│   ├── style.css              # 全局 reset（极简）
│   │
│   ├── layouts/
│   │   └── AppLayout.vue      # 工作台 Layout：顶部栏 + 侧边栏 + 内容区
│   │
│   ├── routers/               # 路由模块化聚合（仿原项目 src/routers/module/*.ts）
│   │   ├── index.ts
│   │   └── module/
│   │       ├── home.ts        # /pilot-home /lumina-home /not-found
│   │       ├── dashboard.ts   # /workbench
│   │       ├── metric.ts      # /metric/catalog /metric/develop
│   │       └── datamap.ts     # /data-map /data-develop /dqc /schedule
│   │
│   ├── pages/
│   │   ├── home/
│   │   │   ├── PilotHome.vue     # ★ DataPilot 科技风首页（Canvas 粒子 + Logo 光环 + 打字机）
│   │   │   ├── LuminaHome.vue    # ★ DataLumina 粉蓝霓虹首页（动效 SVG Logo + 功能卡片）
│   │   │   └── NotFound.vue
│   │   ├── workbench/index.vue       # 工作台：统计卡 + 最近活动 + 快速入口
│   │   ├── metric/catalog/index.vue  # 指标目录：搜索 + 筛选 + 分页 + 详情弹窗
│   │   ├── data-map/
│   │   │   ├── index.vue             # 数据地图：分层卡片 + 表格 + 抽屉详情
│   │   │   └── detail.vue
│   │   └── common/
│   │       └── ComingSoon.vue        # 占位页（数据开发 / DQC / 调度等预留模块）
│   │
│   ├── components/
│   │   └── GlobalNotice.vue          # 全局通知条（受 store 控制）
│   │
│   ├── store/                         # Pinia stores
│   │   ├── global-notice.ts
│   │   ├── project.ts
│   │   └── user.ts
│   │
│   ├── resources/                     # API 层（只做 HTTP 调用封装）
│   │   ├── common.ts
│   │   ├── home.ts
│   │   ├── metric.ts
│   │   └── datamap.ts
│   │
│   ├── mocks/                         # ⭐ 所有 Mock 聚合在这里
│   │   ├── browser.ts                 # MSW worker 启动入口
│   │   ├── handlers.ts                # 所有接口 handler
│   │   └── data/                      # 各业务模块的 mock 数据
│   │       ├── common.ts
│   │       ├── home.ts
│   │       ├── metric.ts
│   │       └── datamap.ts
│   │
│   └── utils/
│       └── request.ts                 # 轻量 fetch 封装（返回结构与 @yqg/resource 一致）
│
├── .cursor/
│   ├── rules/
│   │   ├── b-vue3-common.mdc          # 继承自原项目：Vue 3 通用规范
│   │   ├── b-vue3-component-route.mdc # 继承自原项目：原生模式 / 维护模式判断
│   │   ├── project-architecture.mdc   # ★ 本 Demo 专属约束：禁止私有依赖、必须走 mock 等
│   │   └── code.mdc
│   └── settings.json                  # 故意不启用任何需认证的私有插件
│
├── vite.config.ts
├── tsconfig.app.json
└── package.json
```

## 已实现页面

| 路由 | 页面 | 来源 | 说明 |
|------|------|------|------|
| `/` | → `/pilot-home` | | 默认跳 Pilot 首页 |
| `/pilot-home` | DataPilot 首页 | `cn-data-pilot/src/pages/home` | 完整保留：Canvas 粒子 + Logo 光环 + 打字机 + 特性卡片 + 鼠标跟随光效 |
| `/lumina-home` | DataLumina 首页 | `cn-data-lumina/src/pages/home` | 完整保留：动效 SVG Logo + 霓虹光球 + 功能卡片 |
| `/workbench` | 工作台概览 | 两项目的 home 概览思路融合 | 统计卡 + 最近活动 + 快速入口 |
| `/metric/catalog` | 指标目录 | `cn-data-lumina/src/pages/metric/catalog` | 搜索 / 状态筛选 / 分页 / 详情弹窗 |
| `/data-map` | 数据地图 | `cn-data-pilot/src/pages/data-map` | 分层 tab + 关键字搜索 + 表格 + 抽屉详情 |
| `/data-map/:id` | 资产详情 | 同上 | 路由参数展示 |
| `/metric/develop` | 指标开发 | | `ComingSoon.vue` 占位 |
| `/data-develop` | 数据开发 | | `ComingSoon.vue` 占位 |
| `/dqc` | 数据质量 | | `ComingSoon.vue` 占位 |
| `/schedule` | 任务调度 | | `ComingSoon.vue` 占位 |
| `/not-found` | 404 页 | | 科技感 404 |

## 刻意跳过的内容

原项目中以下模块涉及私有依赖或重度集成，Demo 中用 `ComingSoon.vue` 占位，**不实现**：

- Monaco SQL 编辑器（`src/components/monaco-editor/`）：依赖自定义 SQL parser。
- Jupyter Notebook（`src/utils/jupyter-*`）：依赖内部 JupyterHub 服务。
- AI Agent 对话页（lumina 的 `pages/home/agent`）：依赖内部 Gateway。
- G2 图表（`src/components/g2-chart/`）：原项目按 `@antv/g2 5.x` 深度定制。
- 神策埋点（`sa-sdk-javascript`）：单机场景无埋点需求。
- Sentry / FMP 监控上报。
- `@yqg/permission` 权限点、多国部署判断。
- SQL 工作台（`data-develop/sql`）、发布中心、调度 DAG 编排等重度业务页。

## 新增接口的工作流

1. 在 `src/mocks/data/<模块>.ts` 准备数据；
2. 在 `src/mocks/handlers.ts` 新增一个 `http.get('/api/...', ...)`；
3. 在 `src/resources/<模块>.ts` 增加 `xxxApi.fetchXxx()`；
4. 页面用 `const { data: { body } } = await xxxApi.fetchXxx()` 解构消费。

接口响应结构与原项目 `@yqg/resource` 保持一致：

```ts
{
  status: { code: 0, detail: 'ok' },
  body: <业务数据>
}
```

## 命令

```bash
npm run dev       # 启动开发服务器（含 MSW）
npm run build     # 类型检查 + 生产构建（会产出到 dist/）
npm run preview   # 本地预览生产构建产物
```

## Cursor 规则

本项目保留了原项目的两条核心规则：

- `b-vue3-common.mdc`：Vue 3 通用规范（Composition API、样式隔离、安全合规等）。
- `b-vue3-component-route.mdc`：原生模式 / 维护模式判断（提示 Agent 新文件走原生 antdv）。

并新增 `project-architecture.mdc` 约束：**严禁引入任何私有依赖 / 强制所有接口走 MSW**。

## License

仅用于内部学习/演示目的，不用于生产环境。
