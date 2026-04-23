> 本文档面向 **调度管理（schedule）** 模块的接手人。覆盖任务运维、实例运维、依赖诊断 / 依赖查看画布，以及 Dispatch / MatrixDispatch / DispatchDetailModal / LogModal 几个横跨模块的弹窗。重点记录 G6 画布的交互、modal chain 与风险。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/TgxHw8FwmicEelkkrS3cg10Enuf

# 一、模块概览

调度管理是 `cn-data-pilot` 下负责 **任务/实例调度、依赖可视化、运维操作** 的子系统，路由前缀 `/schedule`、`/scheduleCenter`、`/devops`、`/dependency-view`、`/dependency-diagnosis`。总代码量 ≈ 1.3 万行，45 个文件，核心画布文件（DependencyDiagnosis / DependencyView）各 1500+ 行。

## 1.1 一级路由（`src/routers/module/schedule.ts`）

| 路径 | 路由名 | 页面 | 说明 |
| --- | --- | --- | --- |
| `/scheduleCenter` | ScheduleCenter | `pages/schedule/index.vue` | 任务运维（默认页） |
| `/devops` | DevOps | `pages/schedule/component/DevOps/index.vue` | 实例运维 |
| `/dependency-view` | dependencyView | `pages/schedule/component/DependencyView/index.vue` | 依赖查看（hidden，只读画布） |
| `/dependency-diagnosis` | DependencyDiagnosis | `pages/schedule/component/DependencyDiagnosis/index.vue` | 依赖诊断（hidden，可操作画布） |

所有页面都启用 `runtimeLayoutConfig: { contentStyle: { margin: 0 }, showBreadcrumb: false }`。

## 1.2 目录结构

```
src/pages/schedule/
├── index.vue                           # ScheduleCenter 入口（895 行）
├── component/
│   ├── DependencyDiagnosis/            # ⭐ 依赖诊断（1624 行）
│   │   ├── index.vue
│   │   ├── utils.ts                    # 491 行（数据转换 / 层级计算 / G6 转换）
│   │   ├── constant/index.ts           # 状态列表 / 文案
│   │   └── components/                 # header / nodeList / canvasToolbar / nodeDetailPanel
│   ├── DependencyView/                 # ⭐ 依赖查看（1580 行，只读）
│   │   ├── index.vue
│   │   └── utils.ts                    # 499 行
│   ├── DevOps/                         # 实例运维（841 行）
│   │   └── index.vue
│   ├── dispatch/                       # 通用 Dispatch 抽屉（457 行）
│   ├── matrixDispatch/                 # Matrix 特化 Dispatch 抽屉（540 行）
│   ├── DispatchDetailModal/            # SQL 任务详情 Modal（284 行）
│   ├── log-modal.vue                   # 日志查看器（534 行）
│   └── log-empty.vue                   # 空状态占位（45 行）
├── constant/
│   └── run-status.ts                   # RUN_STATUS_MAP（状态→颜色/badge）
└── utils/
    ├── run-duration.ts                 # 时长格式化
    └── schedule-batch.ts               # 批次时区提示
```

## 1.3 后端接口

主要资源文件：
- `src/resources/schedule.ts` → `ScheduleApi`（任务级）
- `src/resources/instances.ts` → `InstancesApi`（实例级）
- `src/resources/common.ts` → `CommonApi`（枚举）
- `src/resources/matrix.ts` → `MatrixApi.fetchTaskDetail`
- `src/resources/sql.ts` → `SqlApi.getProjectUsersDeduplicated`（Owner 下拉）

核心接口：

| 接口 | 说明 |
| --- | --- |
| `ScheduleApi.pageList` | 任务分页列表 |
| `ScheduleApi.getSupportedTypes` / `getTaskStatusEnum` | 任务类型 / 状态枚举 |
| `ScheduleApi.checkNeedDate` | 运行前检查是否需选日期 |
| `ScheduleApi.runTask` | 触发运行 |
| `ScheduleApi.getLogs` | 日志分页（`skipLineNum` 偏移） |
| `ScheduleApi.dependency` | 依赖图拉取（节点 + 边） |
| `ScheduleApi.stopTask` | 停止 |
| `InstancesApi.pageList` | 实例分页 |
| `InstancesApi.stopTask` / `runTask` / `forceSuccess` | 实例停止 / 重跑 / 置成功 |
| `InstancesApi.getLogs` | 实例日志 |
| `CommonApi.fetchOptions` | 通用枚举：`ScheduleCycle` / `TaskModuleEnum` / `ScheduleTypeEnum` / `TaskInstanceStatusEnum` |

---

# 二、ScheduleCenter（任务运维）`index.vue`（895 行）

**主功能**：任务维度的全量列表 + 筛选 + 行级运维。

## 2.1 页面布局

- **筛选面板**（可展开）：
  - 基础：任务名、任务类型、状态
  - 展开：Owner、发布时间区间、调度类型、上次调度批次、上次运行状态、"我负责的"
- **表格**：固定左列 `任务名（带复制）+ 描述`；滚动区包含类型、ONLINE/OFFLINE 标签、Owner、发布时间、调度信息（类型 / cycle / 上次批次 / 上次状态）、运行信息（起止时间 / 时长）、操作
- **行操作**：运行、日志、历史、依赖

## 2.2 状态映射

`constant/run-status.ts` 的 `RUN_STATUS_MAP`：
- SUCCESS → 绿（success）
- FAILURE / STOP / PAUSE / BLOCK → 红（error）
- RUNNING_EXECUTION / DELAY_EXECUTION → 蓝（processing）
- DEPENDENCY_WAIT / SERIAL_WAIT / WAIT_TO_RUN → 黄（warning）
- NEVER_RUN → 灰（default）

## 2.3 运行链路

- `runTask()` → 先 `checkNeedDate`，需要日期则弹出 `RunTaskModal` 选日期再 `runTask`
- `showDetail()` 按 `taskModule` 分支：
  - `DATA_INTEGRATION` → `MatrixApi.fetchTaskDetail` → 打开 `MatrixDispatch`
  - `DATA_DEVELOPMENT` → 打开 `DispatchDetailModal`
- `openViewDependency()` → 新窗口打开 `/dependency-view`
- `checkLog()` → `getLogs` → `LogModal`（tab 化 + 搜索 + 复制 + 全屏 + 分页 `skipLineNum`）

---

# 三、DependencyDiagnosis（依赖诊断）`component/DependencyDiagnosis/`（1624 行 🔴）

> 整个模块最复杂的页面，G6 画布 + 4 个 Modal 串联。接手后第一阅读对象。

## 3.1 图库

- **AntV G6**（`import { Graph } from '@antv/g6'`）
- 布局：`antv-dagre`（左→右）
- 节点类型：`html`（自定义 HTML 节点，支持内嵌交互按钮）
- 节点尺寸：`[240, 100]`
- 边类型：`cubic-horizontal`（三次贝塞尔）
- 行为：`drag-canvas`、`zoom-canvas`

## 3.2 节点结构

每个节点展示：状态图标、状态文本、任务类型 tag、名称、起止时间。

按照层级排序：
- 上游（level 降序）→ 中心（level=0）→ 下游（level 升序）

节点左右两侧有 **展开 / 折叠按钮**：
- `preIsExpand`（左）：'TRUE'（展开显 −）/ 'FALSE'（折叠显 +）/ 'NONE'（不显示）
- `nextIsExpand`（右）：同上

## 3.3 画布交互

| 交互 | 行为 |
| --- | --- |
| 左/右按钮 | 上游 / 下游展开或折叠，调 `ScheduleApi.dependency` 获取新增节点 + 边 |
| 节点点击 | 选中 → 左侧 list 高亮 + 底部 `nodeDetailPanel` 展示 |
| 节点右键 | 菜单 "以此节点为中心打开新画布"，新窗口打开 `/dependency-diagnosis` |
| Hover | 名称超长时显示完整 tooltip |
| Toolbar（`canvas-toolbar.vue`） | 放大 / 缩小 / Fit view |

**并发锁**：`expandCollapseInProgress` 互斥标志，防止并发展开/折叠导致数据错乱。**注意**：加锁后 UI 无明显 loading，容易让用户以为点击无效。

## 3.4 底部 `nodeDetailPanel`（440 行）

- **基础信息**：Owner、workspace、cycle、cron
- **实例信息**：实际起止 / 时长（有实例才展示），与计划时间对比
- **30 天均值**：平均起止时间与时长
- **操作按钮**（按 status 列表决定可用性）：
  - 查看日志（有实例）
  - 查看实例（非跨项目）
  - 重跑 — `rerunStatusList: [SUCCESS, PAUSE, FAILURE, STOP, BLOCK]`
  - 置为成功 — `setSuccessStatusList: [PAUSE, FAILURE, STOP, BLOCK]`
  - 停止 — `stopStatusList: [RUNNING_EXECUTION, READY_PAUSE]`
  - **跨项目**：所有操作禁用，hover 提示"跨空间仅支持查看，不支持运维"

## 3.5 数据转换（`utils.ts` 491 行）

核心函数：
- `transformToG6Data()` — 原始依赖数据 → G6 格式
- `generateNodeList()` — 按层级生成左侧 list
- `recalculateNodeLevels()` — BFS 从中心节点重算层级（expand/collapse 后）
- `extractNewNodesAndEdges()` — 合并新拉取的节点/边，去重
- `transformNodesToG6NodeData()` / `transformEdgesToG6EdgeData()` — 格式化
- `statusColorMap` — 状态 → `{ bg, border, headerBg }`
- `hexToRgba()` — 阴影用

## 3.6 Modal Chain（交接主文档已预警的坑点 🔴）

画布上的节点操作会串联 4 个外部组件，可能同时挂载：

```
DependencyDiagnosis 画布
├── Dispatch（通用 Dispatch 抽屉）
├── MatrixDispatch（Matrix 任务详情抽屉）
├── DispatchDetailModal（SQL 任务详情 Modal）
└── LogEmpty（空状态 Modal）
```

外加 `LogModal`（从 nodeDetailPanel 的"查看日志"触发）。

**状态隔离不好**：4 个 modal 的状态放在同一层 ref，Z-order 混乱，用户常不清楚要关哪层。

---

# 四、DependencyView（依赖查看）`component/DependencyView/`（1580 行 🔴 只读）

与 DependencyDiagnosis UI 基本同构，差异：

- 节点**没有展开/折叠按钮**
- 底部没有 nodeDetailPanel 操作区
- 右键菜单仅"详情"链接（要求 `taskInfoTaskId` 有值）
- 非 DataPilot 项目的节点：tooltip 提示"非 DataPilot 项目无法展示详情"
- 使用同一套 G6 + dagre + utils

用途：面向外部或只读场景的依赖可视化（比如从 ScheduleCenter 表格的"依赖"按钮新窗口打开）。

---

# 五、DevOps（实例运维）`component/DevOps/`（841 行）

实例维度的列表 + 筛选 + 批量操作。

## 5.1 筛选

- 基础：调度批次（日期区间，默认近 3 天）、任务名、任务类型
- 展开：运行状态、调度类型、调度方式（execute type）、触发用户

## 5.2 表格列

批次、任务名、类型、调度类型、cycle、execute type、触发用户、起止时间、时长、运行状态、操作（停止 / 重跑 / 置成功 / 日志 / 依赖诊断）

## 5.3 操作可用性

通过 `canStop()` / `canReRun()` / `canSetSuccess()` / `canShowDependency()` 四个谓词按 `runStatus` 控制。

## 5.4 Modal 挂载

与 ScheduleCenter 同：`LogModal` + `Dispatch` + `MatrixDispatch` + `DispatchDetailModal` + `LogEmpty`。

---

# 六、Dispatch 三件套

## 6.1 `dispatch/index.vue`（457 行）

**通用 Dispatch 抽屉**，大部分字段只读（看现有配置）：
- 基础 Tab：任务名、类型、描述、Owner、yarn queue
- 属性 Tab：cron、超时、重试、依赖

内嵌 `CronTime` 组件（6 Tab：分/时/天/周/月/年），支持 `*` / `?` / `n-m` / `n/m` / `n,m,p` / `nW` / `nL` / `n#m` 各种 cron 语法。

## 6.2 `matrixDispatch/index.vue`（540 行）

**Matrix（数据集成）任务 Dispatch**，比通用版多了：
- 任务信息：源、目标、同步方式、字段映射
- 调度配置：cron、超时、重试
- 运行监控：历史运行统计
- 资源参数：yarn 队列、并行度等

## 6.3 `DispatchDetailModal/index.vue`（284 行）

**SQL 任务（data-develop）详情 Modal**，Tab 化只读视图：
- 任务信息：Owner、module、创建/更新时间
- 代码视图：SQL 高亮
- 调度配置
- 运行监控
- 资源参数

底部"编辑任务"按钮 → 跳回 `/data-develop/sql` 编辑。

## 6.4 Cron 组件

`dispatch/components/cron-time/` 与 `matrixDispatch/components/cron-time/` **是两份独立代码**，UI 一致。基于 `useCron()` composable，支持 Quartz 7 字段 cron。**同步维护是潜在负担**。

---

# 七、Log 组件

## 7.1 `log-modal.vue`（534 行）

特性：
- Tab 化（单实例多流日志）
- 行号显示
- 前向/后向搜索 + 关键词导航
- 提取 logs 中的 AppId 链接
- 全屏切换
- "加载更多"分页（client 端按 `lineCount` 累加 `skipLineNum`）
- 复制全部

**脆弱点**：日志分页没有服务端 cursor，完全依赖客户端记录 `skipLineNum`。如果响应顺序或内容变动，分页会错位。

## 7.2 `log-empty.vue`（45 行）

简单空态弹窗，"暂无内容"占位。

---

# 八、常量与工具

## 8.1 `constant/run-status.ts`（31 行）

```
RUN_STATUS_MAP = {
  SUCCESS: { color: '#52c41a', badgeStatus: 'success' },
  FAILURE / STOP / PAUSE / BLOCK: { color: '#f5222d', badgeStatus: 'error' },
  RUNNING_EXECUTION / DELAY_EXECUTION: { color: '#1677ff', badgeStatus: 'processing' },
  DEPENDENCY_WAIT / SERIAL_WAIT / WAIT_TO_RUN: { color: '#faad14', badgeStatus: 'warning' },
  NEVER_RUN: { color: '#d3d3d3', badgeStatus: 'default' }
}
```

## 8.2 `utils/run-duration.ts`（20 行）

`formatRunDuration(ms)` → "Xh Ym Zs"，null/undefined 返回 "/"，被 ScheduleCenter 和 DevOps 共用。

## 8.3 `utils/schedule-batch.ts`（21 行）

`getScheduleBatchTooltipTitle()` 按 `CountryStorage` 返回 "国内时间" / "印尼时间" 后缀，用于批次日期 tooltip。

## 8.4 `DependencyDiagnosis/constant/index.ts`（37 行）

- `crossProjectTooltipText`
- `rerunStatusList` / `setSuccessStatusList` / `stopStatusList`（action 可用性列表）

---

# 九、跨模块依赖

| 依赖 | 用途 |
| --- | --- |
| `@/resources/schedule` | 任务级 API |
| `@/resources/instances` | 实例级 API |
| `@/resources/matrix` | Matrix 任务详情（详情抽屉） |
| `@/resources/sql` | SQL 用户下拉 |
| `@/resources/common` | 枚举 |
| `@/storage/country` | 时区 / 国家上下文 |
| `@/pages/data-develop/sql/common/utils` | `copyToClipboard` |
| `@antv/g6` | 依赖画布 |
| `dayjs` / `uuid` / `ant-design-vue` | 基础库 |

集成点：
- **data-develop**：编辑 SQL 任务会跳转 `/data-develop/sql`
- **matrix**：编辑数据集成任务会跳回 `/matrix/access/detail`
- **Dolphin Scheduler**：部分外部工作流节点，仅支持查看，不支持操作（跨项目）

---

# 十、⚠️ 重点风险与陷阱

## 10.1 G6 画布性能（Diagnosis / View）🔴

- 节点使用 HTML 渲染，节点 > 100 明显卡顿
- 没有虚拟化
- dagre 布局在大图上 `recalculate` 会卡主线程
- **建议**：加节点数限制 + loading 动画，后期考虑 WebGL/ x6

## 10.2 展开 / 折叠互斥锁

- `expandCollapseInProgress` 阻止并发，但**没有给用户视觉反馈**
- 连续点击会像"点了没反应"
- 建议：按钮变 loading + 禁用

## 10.3 Modal Chain 状态混乱 🔴

- Dispatch / MatrixDispatch / DispatchDetailModal / LogEmpty 同层 ref 挂载
- Z-order 依赖打开顺序，用户不知道要关哪层
- 多层叠加后 ESC 关闭行为不稳定
- 建议：引入中心化 modal orchestrator，显式管理层级

## 10.4 日志分页脆弱

- 客户端按 `lineCount` 累加 `skipLineNum`
- 响应排序/内容变化会打乱分页
- 没有服务端 cursor 回落
- 建议：改服务端 cursor；或至少做客户端幂等校验

## 10.5 跨项目任务操作的不可见禁用

- 跨项目节点的操作按钮禁用只靠 tooltip 提示
- 用户不 hover 不知道为什么点不了
- 建议：按钮旁加醒目图标 + 标签

## 10.6 时区显示

- 批次日期 `YYYY-MM-DD`/`YYYY-MM-DD HH:mm` 不带时区
- 依赖 tooltip 文案（`CountryStorage`）告知用户
- 跨时区团队容易误解
- 建议：UI 固定角标时区

## 10.7 状态枚举分散

- `RUN_STATUS_MAP` / `rerunStatusList` / `setSuccessStatusList` / `stopStatusList` 多套
- 新加状态要改多处
- 建议：聚合到一个 `status-capability.ts`，基于能力表生成各子列表

## 10.8 G6 事件监听清理

- `initGraph()` 往容器挂 4+ 事件监听
- 清理逻辑放在模块作用域变量
- 若重复初始化，旧监听不总是被清
- 建议：用 `graph.off(...)` + `onBeforeUnmount` 统一管理

## 10.9 Dispatch 抽屉的"死 UI"

- `dispatch/index.vue` 的 cron 编辑器基本只读，但 UI 完整可编辑
- 用户以为能保存，其实没有保存按钮
- 建议：要么统一成只读 tooltip 视图，要么直连编辑接口

## 10.10 Cron 组件双份维护

- `dispatch` 和 `matrixDispatch` 各有一份 `cron-time`
- 同步改动易漏
- 建议：提到 `src/components/cron-time/` 公用

## 10.11 节点详情面板 stale state

- 用户选中节点 A → 折叠父节点 B 导致 A 从图中消失，但右下面板还开着
- 没有响应式收拢
- 建议：监听 `currentNodeId` 是否仍在 `nodeList` 中

## 10.12 任务类型筛选 fetch 失败静默

- `taskTypeLoading` + 下拉空选项
- 无错误提示
- 建议：加 error 空态 + 重试

## 10.13 大文件集中

| 文件 | 行数 |
| --- | --- |
| `component/DependencyDiagnosis/index.vue` | **1624** 🔴 |
| `component/DependencyView/index.vue` | **1580** 🔴 |
| `index.vue`（ScheduleCenter） | 895 |
| `component/DevOps/index.vue` | 841 |
| `component/matrixDispatch/index.vue` | 540 |
| `component/log-modal.vue` | 534 |
| `component/DependencyView/utils.ts` | 499 |
| `component/DependencyDiagnosis/utils.ts` | 491 |
| `component/dispatch/index.vue` | 457 |
| `component/DependencyDiagnosis/components/node-detail-panel.vue` | 440 |
| `component/DispatchDetailModal/index.vue` | 284 |

---

# 十一、给接手人的建议优先级

## 第一周：上手
1. 跑通 ScheduleCenter 的筛选 + 运行 + 日志 + 依赖链路
2. 在依赖诊断画布上做几次 expand/collapse、右键新画布、重跑、置成功、查看日志
3. 在 DevOps 做一次停止 + 重跑
4. 通读 `resources/schedule.ts` + `resources/instances.ts` + `DependencyDiagnosis/utils.ts`

## 第一月：止血
1. Modal Chain 收口：引入统一的 modal 管理器，固定 Z-order
2. G6 事件监听统一到 `onBeforeUnmount` 清理
3. 日志分页加服务端 cursor 或客户端幂等校验
4. 展开/折叠按钮加 loading 反馈
5. Cron 组件去重，提到公用目录

## 第二季：结构性重构
1. 拆分 `DependencyDiagnosis/index.vue` 和 `DependencyView/index.vue`：提取 G6 封装、交互逻辑、数据转换
2. 状态枚举聚合到能力表
3. 大图性能：> 100 节点启用分层折叠或 WebGL
4. 跨项目操作禁用改成显式徽标 + 说明
5. 对齐 `data-develop/matrix` 的编辑入口，统一"跳回编辑"的 UX

---

# 十二、关键联系人

- **产品**：王蕊 / 袁超琪
- **后端**：
  - 韩帅 — dataDevelop / **schedule / publish / project** / note
  - 盛思宇 — alert 监控运维 / 三方调度平台（相关联）
- **测试**：彭丽娅 / 杨天雅

（对齐交接主文档的"关键联系人"；调度相关问题首选韩帅，涉及三方调度/Dolphin 集成找盛思宇）
