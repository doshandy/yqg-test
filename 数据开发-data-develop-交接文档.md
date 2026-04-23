> 本文档面向 **数据开发（data-develop）** 模块的接手人。重点记录 SQL 工作台、表管理、发布相关前端代码的结构、历史债和风险点。这是整个 pilot 前端最复杂的一块，建议配合 `access-detail` 之后重点阅读。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/YsNNwB0XPi5U1ekUF2ccNYPdnXd

# 一、模块概览

数据开发是 `cn-data-pilot` 下负责 **数据任务开发、调试、发布、表治理** 的核心模块。一级路由由 `src/routers/module/dataDevelop.ts` 定义。本模块代码总量 ≈ 5 万行，其中 SQL 工作台单文件 1000+ 行、质量规则抽屉 3000+ 行、建表弹窗 2600+ 行。

## 1.1 一级路由

| 路径 | 路由名 | 页面 | 说明 |
| --- | --- | --- | --- |
| `/data-develop/sql` | Sql | `pages/data-develop/sql/index.vue` | 任务开发（SQL 工作台，支持多 Tab、多任务类型） |
| `/data-develop/table` | Table | `pages/data-develop/table/index.vue` | 表管理（DDL、字段、权限、版本） |

两个页面都启用 `runtimeLayoutConfig: { contentStyle: { margin: 0 }, showBreadcrumb: false }`，目的是腾出空间给双栏布局（左侧树/列表 + 右侧 Tab 编辑器）。

## 1.2 目录结构

```
src/pages/data-develop/
├── sql/                          # SQL 工作台
│   ├── common/                   # 工具与常量
│   ├── components/
│   │   ├── sql-sider/            # 左侧任务树/列表
│   │   ├── sql-history/          # 历史记录面板
│   │   ├── history-drawer/       # 历史抽屉
│   │   ├── sql-main/             # ⭐ 核心：Tab 化的多任务工作台
│   │   └── common/               # 公共子组件
│   ├── constant/                 # 枚举、tab 类型等
│   └── index.vue                 # 入口（路由对应页，88 行）
│
├── table/                        # 表管理
│   ├── components/
│   │   ├── modal-table-add/      # ⭐ 建表/改表弹窗（2607 行）
│   │   ├── dashboard/            # 表信息看板
│   │   ├── detail/               # 详情 Tab
│   │   ├── version/              # 版本对比/回滚
│   │   ├── authorization/        # 授权
│   │   ├── onlineDelete/         # 下线/删除
│   │   ├── submit/ & submit-form/# 提交流程
│   │   └── common/
│   ├── utils/
│   └── index.vue                 # 入口（1657 行）
│
└── publish/                      # 发布相关组件（本模块内被复用）
    ├── components/
    └── index.vue
```

## 1.3 与 publish-center 的关系

`publish/` 目录在 `data-develop` 下，但 **路由由 `src/routers/module/publishCenter.ts` 单独挂载**（/publish-center）。本模块只是复用其组件。接手人需要了解：修改发布相关组件时会同时影响两个路由入口。

---

# 二、SQL 工作台 `sql/`（核心核心核心 🔴）

## 2.1 路由入口 `sql/index.vue`（88 行）

入口文件很薄，负责：左侧 `sql-sider` + 右侧 `sql-main` 的分栏布局，顺带挂载 `sql-history`、`history-drawer` 等外层抽屉。

## 2.2 左侧 `sql-sider/index.vue`（207 行）

任务树 / 列表视图，支持：项目切换、任务搜索、新建（SPARK_SQL / PYTHON / LLM_SKILLS / NOTEBOOK）、拖拽排序、右键菜单（重命名/删除/克隆）。

## 2.3 sql-main（核心）

目录：`sql/components/sql-main/`

### 2.3.1 主文件 `sql-main/index.vue`（1138 行）

- **四种 Tab 类型共用一个文件**：`SPARK_SQL` / `PYTHON` / `LLM_SKILLS` / `NOTEBOOK`
- **Draggable 多 Tab**：使用 `vuedraggable`，拖拽顺序会落 localStorage
- **KeepAlive 策略**：
  - 其他三种走 `<keep-alive>` 缓存
  - **Notebook 单独管理**（由 ref 维护打开状态），原因是 notebook iframe/iframe-like 组件不能被重建
- **provide / inject**：向下 provide 了一个 `stopSave`（关闭自动保存开关），被子组件 `submit-validate-drawer` 提交时调用，避免保存与发布串行抢锁

### 2.3.2 Tab 类型分支逻辑

`taskType` 是全局开关，同一段 `sql-main/index.vue` 里走 4 个分支：

- `SPARK_SQL` → `editor-content.vue`（monaco 编辑器）
- `PYTHON` → `editor-content.vue`（python 语法高亮）
- `LLM_SKILLS` → `skills-pane-container.vue` + `skills-editor.vue`
- `NOTEBOOK` → `notebook-container.vue`

> ⚠️ 任何一处修改都要**把 4 种类型都想一遍**，否则极易漏场景。

### 2.3.3 子组件清单（`sql-main/components/`）

| 文件 | 行数 | 说明 |
| --- | --- | --- |
| `editor-content.vue` | 1541 | 主编辑区，挂 Monaco 编辑器、工具栏、执行按钮 |
| `sql-result.vue` | 1859 | 执行结果展示（表格、下载、图表、分页） |
| `notebook-container.vue` | 791 | Notebook 容器 |
| `skills-pane-container.vue` | 756 | LLM Skills 面板容器 |
| `pane-container.vue` | 590 | 通用 Pane 容器 |
| `sql-ai.vue` | 565 | AI 助手（SSE 流式） |
| `result-item.vue` | 405 | 单个结果项 |
| `result-content.vue` | 361 | 结果内容区 |
| `sql-log.vue` | 255 | 执行日志 |
| `sql-code.vue` | 210 | 代码块 |
| `skills-editor.vue` | 137 | Skills 编辑器 |
| `llm/` | - | LLM 相关子组件 |

### 2.3.4 Modal / Drawer 清单（`sql-main/modal/`）

| 抽屉/弹窗 | 说明 |
| --- | --- |
| `quality-drawer/` ⚠️ | **3031 行的巨兽**，质量规则配置子系统（含 5 个子 modal：SQL / 字段 / 表 / AI / 规则编辑） |
| `submit-validate-drawer.vue` | 提交校验抽屉，含 SSE 流式校验结果 |
| `dispatch-drawer-new/` | 新版调度配置（Tabs 形式） |
| `dispatch-drawer/` | 老版调度配置，**待清理**（与 matrix 模块是同一个坑） |
| `monitor-drawer/` | 告警 / SLA |
| `date-params-drawer/` | SQL 日期参数帮助 |
| `params-drawer/` | 任务参数 |
| `base-info-drawer/` | 基本信息 |
| `version-drawer/` | 版本对比 / 回滚 |
| `table-detail-drawer/` | 表详情 |
| `submit-pane-modal.vue` | 提交面板 |
| `close-modal.vue` | 关闭 Tab 二次确认（未保存提示） |
| `unlock-modal.vue` | 强制解锁弹窗（见任务锁机制） |

## 2.4 任务锁（lock / acquireTaskLock）⚠️ 重点

- 接口：`task_locks/check`、`task_locks/acquire`
- 每个窗口持有一个唯一 `uniqueFlag`（写 sessionStorage）
- 自动保存周期 **硬编码 10s** 轮询一次
- 抢锁失败后弹 `unlock-modal`，允许强制夺锁
- **已知坑点**：
  - 刷新窗口会导致 uniqueFlag 丢失 → 静默丢锁
  - 长时间离开页面回来时竞态：本地还以为自己有锁，但后端已释放
  - `stopSave`（provide 下来的那个）只在提交阶段暂停自动保存，复杂场景下还是会出现保存-提交并发

## 2.5 质量规则抽屉 `quality-drawer/`（3031 行 🔴）

单独一个功能完整的"质量规则配置子系统"，业务上独立于 SQL 工作台但 UI 嵌入其中。

结构：
- 主抽屉：规则列表、启停、规则级联
- **5 个子 modal**（从主抽屉打开，之间还有联动）：
  - SQL 模态（基于 SQL 的规则）
  - 字段模态（字段级约束）
  - 表模态（表级约束）
  - AI 模态（AI 生成规则）
  - 规则编辑模态（统一编辑入口）
- 数据流：列表 → 子 modal 编辑 → 回写列表 → 保存 → 后端校验

> **接手人注意**：
> - 规则改动一条会打开 1-2 层 modal，**modal 之间共享部分响应式状态**，改一处要防止串数据
> - 规则跳转路径又多又深，QA 脚本要覆盖"从空 → 创建 → 编辑 → 删除 → 再创建"的全链路
> - 性能：规则数 ≥ 100 时抽屉明显变卡，当前没有虚拟化

## 2.6 提交校验抽屉 `submit-validate-drawer.vue`（369 行）

- 提交任务前拉起，展示 SSE 流式校验结果（语法、依赖、权限、质量规则等）
- 通过 `onDownloadProgress` 解析流式返回
- **已知风险**：
  - SSE 解析是正则从 `data:` 行提取 JSON 片段，后端若改格式会**静默失败**（前端无异常但无结果）
  - 没有超时与断线重连，弱网下需要手动重发

## 2.7 AI 助手 `sql-ai.vue`（565 行）

- SSE 流式生成 SQL 片段
- 结果直接写入 Monaco 编辑器
- 同样使用 `onDownloadProgress` 拼接
- 与 `copilot/` 子应用（`src/components/copilot/`）共存，部分场景下会同时挂载两套 AI 入口，需要区分谁是"活动 AI"

---

# 三、Monaco 编辑器与 SQL Parser

## 3.1 `src/components/monaco-editor/`

- 封装 Monaco，暴露支持 SQL / Python 的统一编辑器组件
- 自定义 SQL Parser 两套：
  - **base**：通用 SQL 语法（语法高亮、括号匹配、基础补全）
  - **mysql**：MySQL 方言（特定函数、关键字补全）
- 两套并存原因：多数仓/多引擎环境下 SQL 语义差异较大；切换数据源时切换 parser
- Parser 跑在 Web Worker 以免阻塞 UI

## 3.2 `src/components/sql-editor/`

- 基于 monaco-editor 再封装的业务层 SQL 编辑器
- 包含：`code-box`（只读代码块）、`full-screen-modal`（全屏编辑弹窗）
- 被 `editor-content.vue` 及多个只读展示场景复用

## 3.3 `src/components/copilot/`

- **独立子应用级的 AI 交互组件**
- 内含：聊天卡片（chat card）、思考过程展示（think display）、Diff 可视化
- 通信：EventSource / Fetch ReadableStream
- 在 `pane-container.vue` 中通过 props/events 集成进 SQL 工作台
- 维护方提示：Copilot 的协议/UI 与 lumina 在对齐，改动务必与 lumina 对齐（交接主文档中也标注了 MonacoEditor 要同步 lumina 和 pilot）

---

# 四、表管理 `table/`

## 4.1 入口 `table/index.vue`（1657 行）

- 布局：左侧环境/数据源选择 + 树形表列表；右侧表详情 Tab 化（Dashboard / Detail / 版本 / 授权 / 下线）
- 搜索：按表名、字段、注释、owner 模糊搜索
- 操作：建表、DDL 查看、编辑、下线、克隆

## 4.2 建表/改表弹窗 `components/modal-table-add/`（2607 行 🔴）

| 文件 | 行数 | 说明 |
| --- | --- | --- |
| `index.vue` | 2607 | 建表主弹窗（字段、分区、生命周期、引用表等） |
| `lifecycle-config.vue` | 295 | 生命周期策略配置 |
| `modal-ref-table.vue` | 328 | 引用已有表 |
| `recreate-modal.vue` | 87 | 重建表二次确认 |

- 字段表支持动态增删、批量编辑、从 SQL 推导
- 分区配置支持静态/动态/范围分区
- 生命周期：TTL、归档策略、冷热数据分层

## 4.3 其他子模块

- `dashboard/` — 表信息总览（元信息、血缘入口、使用统计）
- `detail/` — 字段明细、索引、约束
- `version/` — 版本历史 + Diff + 回滚
- `authorization/` — 表/字段级授权
- `onlineDelete/` — 下线/删除流程（强依赖发布中心）
- `submit/` + `submit-form/` — 提交变更走发布审批流

---

# 五、发布相关 `publish/`

- 本目录提供发布相关组件（包列表、审批、发布包详情等）
- **路由不在本模块定义**，由 `src/routers/module/publishCenter.ts` 挂在 `/publish-center` 下
- 内含 AI Chat（使用 Fetch ReadableStream）用于包级 Review
- 接手人注意：改 publish 组件等于同时改两个入口（/data-develop 下的提交流 + /publish-center 的审批流）

---

# 六、后端接口

主要资源定义：`src/resources/`（SQL / Table / TaskLock / Publish / Quality 等）

典型分组：
- **任务 CRUD / 执行**：sqlTask 查询、保存、执行、停止、日志、结果
- **任务锁**：`task_locks/check`、`task_locks/acquire`、`task_locks/release`
- **版本**：`task_versions/*`（任务版本）、`table_versions/*`（表版本）
- **质量规则**：`quality_rules/*`
- **AI 流式**：独立 SSE endpoint（走 `onDownloadProgress` 或 Fetch stream）
- **调度**：`scheduler/*`（与新版 dispatch-drawer 对接）
- **发布**：`release_center/packages/*`、`release_center/approvals/*`
- **表**：DDL、字段、分区、生命周期、授权、下线
- **字典/枚举**：环境、项目、owner、业务线

建议接手后先通读 `resources/` 下与本模块相关的所有文件，一次把接口边界摸清。

---

# 七、共享状态、Hooks、工具

## 7.1 Pinia Store

- `store/sql.ts`（当前任务列表、活动 tab、未保存变更标识）
- `store/editor.ts`（Monaco 编辑器状态）

现状：Store 写得较轻量，大量状态仍以局部 ref 承载，耦合度较高。

## 7.2 Composables / Hooks

- `hooks/use-drawer-position` — 抽屉随顶部通知栏高度自适应
- `hooks/version-compare` — 对象深比较，用于版本 diff
- `sql/common/` — SQL 解析/拼接、Tab 存储、数据源切换等

## 7.3 常量与枚举

- `sql/constant/` — Tab 类型、状态码、执行引擎等
- 全局枚举在 `src/constant/enum.ts`，建议新加的状态都通过枚举统一引入（和 matrix 模块一样，目前仍有大量魔法字符串）

---

# 八、⚠️ 重点风险与陷阱

## 8.1 sql-main 巨型组件（1138 行）+ 4 种 Tab 类型

- 同文件内 4 种分支，任何改动都要 4 份场景回归
- KeepAlive 对 Notebook 特殊处理，**不要尝试统一到一套 keep-alive 策略**，曾经试过会白屏

## 8.2 质量规则抽屉（3031 行）

- 5 个子 modal + 联动状态，拆分优先级最高
- 性能：规则多于 100 条开始卡，需要虚拟化

## 8.3 SSE 解析易碎

- 提交校验、AI 生成 SQL、Copilot 均使用 SSE
- 当前都走正则从 `data:` 行拼 JSON，**任何格式变动都会静默失败**
- 建议：统一 SSE 工具函数，接入 schema 校验 + 异常上报

## 8.4 任务锁机制

- 刷新/离开页面丢 uniqueFlag
- 10s 轮询间隔硬编码
- 自动保存 vs 提交并发，依赖 provide 下来的 `stopSave` 人工干预
- 建议：引入 BroadcastChannel 做多 Tab 同步；把轮询周期改成可配置；把 `stopSave` 改成更语义化的 `savingState`

## 8.5 新老调度抽屉并存

- 与 matrix 模块同样的坑：`dispatch-drawer`（老）和 `dispatch-drawer-new`（新）都在触发保存
- 接手后优先下线老版本

## 8.6 Copilot / sql-ai / lumina 三处对齐

- Monaco 编辑器层、AI 交互层目前 **pilot 与 lumina 并行维护，容易分叉**
- 交接主文档明确提示 "MoncaoEditor 编辑器需要同步 lumina 和 pilot"
- 建议：任何 monaco / copilot 层的改动，先和 lumina 负责人（李荣谦）对齐再落地

## 8.7 建表弹窗（2607 行）

- 字段 / 分区 / 生命周期 / 引用表 / 重建 多态同存
- 目前靠大量 `if/else` 判断场景，没有场景 schema
- 重构优先级中等，建议抽场景工具函数，再按 Tab 拆分

## 8.8 publish 共用

- `publish/` 同时被 data-develop 和 publish-center 使用
- 修改前确认两个入口影响范围

## 8.9 魔法字符串

- taskType、status、syncMode 等仍有大量字符串硬编码
- 建议所有新代码必须走 `constant/enum.ts`，老代码渐进调整

## 8.10 大文件集中

超过 500 行的文件列表（按大小排序）：

| 文件 | 行数 |
| --- | --- |
| `sql/components/sql-main/modal/quality-drawer/index.vue` | **3031** 🔴 |
| `table/components/modal-table-add/index.vue` | **2607** 🔴 |
| `sql/components/sql-main/components/sql-result.vue` | 1859 |
| `table/index.vue` | 1657 |
| `sql/components/sql-main/components/editor-content.vue` | 1541 |
| `sql/components/sql-main/index.vue` | 1138 |
| `sql/components/sql-main/components/notebook-container.vue` | 791 |
| `sql/components/sql-main/components/skills-pane-container.vue` | 756 |
| `sql/components/sql-main/components/pane-container.vue` | 590 |
| `sql/components/sql-main/components/sql-ai.vue` | 565 |

---

# 九、给接手人的建议优先级

## 第一周：上手

1. 跑通 **SPARK_SQL / PYTHON / LLM_SKILLS / NOTEBOOK** 4 种 Tab 的新建 / 编辑 / 执行 / 保存 / 提交 / 发布全流程
2. 跑通 表管理的建表 → 提交 → 发布审批 → 授权 → 下线 全流程
3. 通读 `sql-main/index.vue`、`editor-content.vue`、`quality-drawer/index.vue` 前 200 行
4. 通读 `src/resources/` 下 SQL、Task、Table、Publish 相关接口文件

## 第一月：止血

1. 下线老版 `dispatch-drawer`
2. SSE 解析统一化 + schema 校验 + 异常上报
3. 任务锁：加 BroadcastChannel 多 Tab 同步，把 10s 轮询改成可配置
4. 全局枚举整治：把 taskType / status / syncMode 等从字符串改到 enum

## 第二季：结构性重构

1. 拆分 `quality-drawer`（巨兽）：按 5 个 modal 的能力线拆子组件 + 轻量 store
2. 拆分 `sql-main`：按 4 种 taskType 拆成独立 pane 组件，共享一个 orchestrator
3. 拆分 `modal-table-add`：字段 / 分区 / 生命周期 / 引用 / 重建 按场景 Tab 化
4. 引入中心化校验 schema（任务、建表、发布三条线）
5. 与 lumina 对齐 Copilot / Monaco 的组件层接口

---

# 十、关键联系人

- **产品**：王蕊（pilot & dwLighthouse）、袁超琪（pilot）
- **后端**：
  - 韩帅 — dataDevelop 数据开发 / schedule / publish / project / note
  - 陈伟 — dataMap、dqc
  - 向炜斌 — 数据开发相关
- **AI / Copilot**：与 lumina 对齐（李荣谦）
- **测试**：彭丽娅 / 杨天雅

（参考交接主文档"关键联系人"部分）
