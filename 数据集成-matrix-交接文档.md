> 本文档面向 **数据集成（Matrix）** 模块的接手人。重点记录本模块在 `cn-data-pilot` 项目前端层面的功能范围、代码结构、历史遗留和需要特别小心的风险点。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/GorzwulUNiXURkkPIfHcsRcqnkf

# 一、模块概览

数据集成 (Matrix) 是 `cn-data-pilot` 下负责 **数据接入管道配置** 的子系统。业务上承载了从多种异构数据源（MySQL / HIVE / MongoDB / OSS / SFTP / StarRocks 等）将数据接入到数仓（HIVE / StarRocks / OSS / SFTP）的任务配置、调度、监控和发布的全流程。

## 1.1 一级路由

路由定义：`src/routers/module/matrix.ts`

| 路径 | 路由名 | 页面 | 说明 |
| --- | --- | --- | --- |
| `/matrix/data-source` | DataSource | `pages/matrix/data-source/index.vue` | 数据源管理（CRUD + 测试连接） |
| `/matrix/access` | Access | `pages/matrix/access/index.vue` | 接入任务列表（搜索、发布、运行、日志等） |
| `/matrix/access/detail` | AccessDetail | `pages/matrix/access-detail/index.vue` | 新建 / 编辑 / 查看接入任务（向导式） |

模块默认 redirect 到 `Access` 列表。`AccessDetail` 页使用自定义 layout，隐藏 breadcrumb。

## 1.2 目录结构

```
src/pages/matrix/
├── access/                    # 任务列表
├── access-detail/             # 新建/编辑任务（核心，6098 行 ⚠️）
├── data-source/               # 数据源管理
├── date-params-drawer/        # SQL 日期参数参考抽屉
├── dispatch-drawer/           # 调度配置抽屉（老版本，待废弃）
├── dispatch-drawer-new/       # 调度配置抽屉（新版本，Tab 化）
├── monitor-drawer/            # 运行监控/告警/SLA 配置
├── source-params/             # Spark/Seatunnel 资源参数配置
├── task/                      # 占位（14 行，尚未使用）
└── transform-rule/            # 字段转换规则（脱敏/JSON 提取等）
```

## 1.3 后端接口

API 定义：`src/resources/matrix.ts`，Base URL: `/api/matrix`

核心分组：
- **任务配置 CRUD**：`task_config`、`task_config/update`、`task_config/:id`、`task_config/stop/:id`、`task_config/publishTask/:id`
- **保存前校验**：`task_config/saveCheck`、`task_config/updateCheck`（后端会返回 `nameDuplicate` / `haveTableExist` / `sourceDuplicate` / `sinkDuplicate` 等字段）
- **源/目标元数据**：`task_config/sync-mode`、`task_config/source-name`、`task_config/database-list`、`task_config/table-name`、`task_config/table-info`
- **类型匹配**：`task_config/data-type`（HIVE→StarRocks 等的类型映射推荐）
- **运行状态**：`task_config/runStatus/:id`、`task_config/logInfo/:id`、`task_config/logTypes/:id`、`task_config/logDetail/:id`
- **初始化与补数**：`task_config/manualInit`（全量初始化）
- **数据源**：`datasource/save`、`datasource/:id`、`datasource/type`、`datasource/testConnection`
- **发布**：`/api/release_center/packages/create-and-submit`
- **调度相关**：`task_config/getAdhocProjectId`、`common/task-backend-owner`、`common/task-owner`

---

# 二、核心页面详解

## 2.1 接入管理列表 `access/index.vue`（870 行）

- **搜索区**：6 个基础筛选（任务名称、同步模式、状态、存储类型等）+ 7 个展开筛选（源类型、源名、库、表、调度类型、Owner、BackendOwner）
- **表格列**：15+ 列，宽度约 2500px，包含任务元信息、源信息、同步模式（颜色标签）、目标信息、运行状态、最后修改人等
- **行操作**：下拉菜单聚合 "发布/重发布、编辑、查看、重跑、停止、删除、全量初始化、DQC 配置、查看日志" 等；严格按 `status` 禁用操作（例如 RUNNING/AUDITING 不允许编辑/删除/发布）
- **子模态**：`LogModal`（日志）、`StatusModal`（执行时间线）、`InitModal`（全量初始化）
- **跳转**：通过 `router.push({ name: 'AccessDetail', query: { id, type } })` 进入详情页，`type=view` 为只读

## 2.2 新建/编辑接入（核心）`access-detail/index.vue`（6098 行 🔴）

> 这是整个模块最复杂、也是最容易踩坑的文件。接手人请重点阅读本节。

### 2.2.1 页面结构

三段式向导（步骤顺序会随场景重排）：
1. **数据来源 / 去向选择**（method 步）：源类型、源名、同步模式、目标类型、目标名
2. **字段映射**（field 步）：表级/字段级映射，可能呈现 "单侧" 或 "源-目标双侧合并" 两种形态
3. **基本信息**（basic 步）：任务名、Owner、BackendOwner、Comment 等

右侧菜单挂载多个抽屉：
- `dispatch-drawer-new`（调度配置，推荐）
- `dispatch-drawer`（调度配置，旧版，仍在触发保存回调，见风险章节）
- `date-params-drawer`（SQL 日期参数帮助）
- `monitor-drawer`（告警/SLA）
- `source-params`（资源参数）
- `transform-rule`（字段转换规则）

### 2.2.2 场景矩阵（15+ 种组合）

通过若干 computed 标志位来驱动 UI 与校验：

| 计算属性 | 组合 |
| --- | --- |
| `isMysql2Hive` | MYSQL → HIVE（任何 syncMode） |
| `isMysql2HiveSeatunnel` | MYSQL → HIVE + SEATUNNEL（**唯一使用"合并字段表"的场景**） |
| `isMongo2Hive` | MongoDB → HIVE |
| `isHive2Sr` / `isHive2SrSeatunnel` | HIVE → StarRocks |
| `isHive2Oss` | HIVE → OSS |
| `isHive2Sftp` | HIVE → SFTP |
| `isSrExternal` | syncMode = SR_EXTERNAL |

每个组合会影响：字段表的列结构、默认值、必填校验、可编辑字段范围。

### 2.2.3 同步模式分支

- **SEATUNNEL**：多源通用、支持全量 + 增量、分区策略、字段转换、资源参数配置
- **DTS_BINLOG**：仅 MySQL 支持、仅增量；**表行数超过 5 亿会展示告警**（代码中硬编码阈值）；不支持字段级转换
- **SR_EXTERNAL**：仅 StarRocks，外部表直接加载，配置被简化

### 2.2.4 字段映射的三种表格形态

- **Mode A（仅源字段）**：Position / IsKey / FieldName / DataType / Comment / [加密]
- **Mode B（仅目标字段）**：同上结构但面向目标表
- **Mode C（源-目标合并表）**：**仅 `isMysql2HiveSeatunnel` 场景启用**
  - 左 5 列源字段 + 分隔列 + 右 5 列目标字段 + 转换规则按钮
  - 行数按 `max(sourceRecords.length, targetRecords.length)` 动态撑开
  - 编辑态有"历史已同步字段"不可取消的锁定逻辑（`historicalSyncedKeys`）

### 2.2.5 数据保存与发布链路

```
updateTaskCheck(postData)                // 后端校验
  → updateTask(postData)                 // 真正更新
  → 若 SEATUNNEL 且非 DTS_BINLOG：
    publishTask({ packageType: 'RELEASE', releaseAction: 'ONLINE', ... })
                                         // 自动发布到调度/执行引擎
```

后端校验返回以下任一字段需对应错误提示：
- `nameDuplicate` → 任务名冲突
- `haveTableExist` → 目标表已被其他任务占用
- `sourceDuplicate` / `sinkDuplicate` → 源/目标冲突

## 2.3 数据源管理 `data-source/index.vue`（247 行）+ `modal/detail-drawer.vue`（995 行）

### 2.3.1 列表页
- 3 个筛选（类型、源名、库）
- 表格操作：查看（打开 DetailDrawer）、复制（复制一份配置作为新建）

### 2.3.2 DetailDrawer 支持的数据源类型

| 类型 | 连接字段 | 备注 |
| --- | --- | --- |
| MYSQL | host, port, database, userName, password | 支持测试连接 |
| MongoDB | host, port, database, userName, password | database 变更会自动联动 source name |
| StarRocks | host, port, loadUrl（逗号分隔多地址）, database, userName, password | loadUrl 用于数据加载 |
| OSS | bucket（3-63 字符,字母数字/下划线/连字符）, accessKeyId, accessKeySecret | 无 host/port |
| SFTP | host, port, userName, password | 远程文件传输 |
| HIVE | 无物理连接配置 | 只读，跟集群挂钩 |

### 2.3.3 测试连接流程

```
configForm.validate()
  → MatrixApi.testLink(confJson)
    → success ? linkStatus = 'SUCCESS' (绿色 Alert)
              : linkStatus = 'FAILED'  (红色 Alert + errorMessage)
```

**约束**：测试必须通过才允许保存。

---

# 三、调度抽屉的新老双版本（高优先级关注）

项目中同时存在 `dispatch-drawer`（710 行，旧）和 `dispatch-drawer-new`（615 行，新）两个版本，且 access-detail **同时挂载**并各自触发保存回调 `onDispatchConfigSave` / `onDispatchConfigNewSave`。

| 对比项 | dispatch-drawer（老） | dispatch-drawer-new（新） |
| --- | --- | --- |
| 布局 | 单卡片纵向表单 | Tabs 形式：策略 / 故障 / 依赖 |
| 依赖管理 | 表格内手动增删 | 独立 `depend-tab.vue` + 弹窗选择 |
| Cron | `CronTime` 组件嵌入表单 | 同 CronTime，但在 `strategy-tab.vue` 内 |
| 字段存储 | `schedulerConf.*` 扁平 | `scheduleConfig.*` 嵌套 |
| 状态 | 代码仍在调用 | **推荐使用**，模块更清晰 |

**风险**：两份保存回调各自回写不同字段，存在时间戳冲突 / 数据覆盖问题。接手后应尽快**下线老版本**。

新版子组件：
- `components/strategy-tab.vue`（496 行）— 调度策略、频率快选、时区
- `components/fault-tab.vue`（205 行）— 重试、失败告警
- `components/depend-tab.vue`（270 行）— 上游依赖（含天/时偏移）

---

# 四、其他抽屉与子组件

## 4.1 `monitor-drawer/`（604 行）

三段监控配置，保存时 emit `on-close` 携带合并后的 `formConfig`：

1. **运行状态监控**：失败告警开关、自动重试告警策略（ONLY_FIRST_FAILURE / ALL_FAILURES）、告警级别
2. **运行过程监控**：超时阈值（分钟）、告警级别
3. **SLA 监控**：承诺开始时间、承诺结束时间、告警级别、自动解除时间

## 4.2 `date-params-drawer/`（139 行）

只读帮助抽屉，展示 SQL 日期宏（`${...}` 格式）。从 `Sql.getDateParams()` 拉取（**非** Matrix API），提供 "复制" 按钮。

## 4.3 `source-params/`（113 行）

Spark / Seatunnel 资源参数配置，默认值：

```
parallelism: '1'
executorCore: '2'
executorMemory: '4G'
executorInstances: '2'
shufflePartitions: '200'
executorMemoryOverhead: '1G'
readBytesPerSecond: '10485760'
readRowsPerSecond: '10000'
```

支持加载已有的 `envConfig`（数组或对象）并回填；保存时 emit 对象形态。

## 4.4 `transform-rule/`（324 行）

**仅 MySQL→Hive + SEATUNNEL 组合的合并字段表**中可用。三种规则：

1. **不转换**（passthrough）
2. **数据脱敏**：算法 md5 / hash；可选择处理 JSON 内部字段（支持多路径 `$.data.phone` 风格）
3. **JSON 提取**：单条 JSONPath（必须 `$` 开头）

保存结构：`{ ruleType, functionName, jsonPaths, jsonDraw }`，写回到对应目标字段行。

## 4.5 `task/`（14 行）

占位 `<div>task</div>`。目前无用，**未删除**。接手后可考虑清理或规划用途。

---

# 五、⚠️ 重点风险与陷阱

下列是接手后最容易踩坑的点，请优先理解：

## 5.1 巨型组件 `access-detail/index.vue`（6098 行）

- 80+ reactive ref、25+ computed、10+ watcher
- 任一业务场景的改动都要思考 **15+ 种组合** 是否都会被影响
- **建议**：优先把源/目标/同步模式的分支逻辑抽成 `src/pages/matrix/utils/scenarios.ts`，再拆分步骤组件（Basic / Source / Field）

## 5.2 watcher 级联副作用

`editing.sourceType → sinkType reset → sourceTable 清空 → fields 清空`，一次切换可能触发 4-5 次请求并重置。
- 已存在的空指针/竞态点需要加 `if (!editing.value.sourceType) return;` 这类守卫
- 修改 watcher 时务必跑一遍所有场景

## 5.3 多份"真相"导致的状态不一致

同一份字段数据同时存在：
- `editing.value.sourceConfig.fieldInfo[]`（后端返回）
- `sourceRecords.value[]`（UI 响应式副本）
- `selectedSourceKeys.value[]`（勾选状态）
- `historicalSyncedKeys`（计算属性，仅编辑态）

**在编辑态/查看态切换、源切换之后，这几份状态不同步会导致"用户看到的勾选 ≠ 实际提交的配置"。**

## 5.4 校验散落，无中心 schema

- 组件级：`basicForm.validate()` / `sourceForm.validate()` / `sinkForm.validate()`
- 接口级：`saveCheck` / `updateCheck`
- 规则级：15+ 条件分支按 sourceType/sinkType/syncMode 判断必填

会出现"前端校验通过，后端拦截"或反之的情况。建议引入中心化 schema（Zod / JSONSchema）。

## 5.5 字段加密开关的条件显隐

- `taskTransformColumn`（加密列）仅在特定源/同步模式组合下加入
- 切换源类型会造成已勾选的加密配置丢失
- 建议在源切换时弹窗提示二次确认

## 5.6 合并字段表的 UI 细节

- 行数按 `max(源, 目标)` 撑开，数量不一致时有样式错位风险
- 分隔列有独立样式与选中联动逻辑
- **只有 `isMysql2HiveSeatunnel` 场景会走这段逻辑**，QA 需重点覆盖

## 5.7 新老调度抽屉并存（见第三节）

**当前两个抽屉都在接事件**，是已知的高优先级技术债务。

## 5.8 后端返回结构不一致

同一接口可能返回 `{ data: { body: {...} } }` 或 `{ data: { body: [...] } }`。`dataMatchType` 返回数组，`updateTaskCheck` 返回嵌套对象。拆包时请注意。

## 5.9 DTS_BINLOG 的 5 亿行限制

- 阈值硬编码，位于 access-detail 的 Alert 区块
- `tableCnt == null` 时不展示，容易让用户在不知情的情况下超限
- 建议提前拉取行数并禁用选择

## 5.10 编辑态"历史已同步字段"不可取消

- 对 FINISHED/FAILED 的任务编辑时，曾经同步过的字段被锁死
- 源侧 schema 扩展后可能需要重复同步，但当前 UI 不给出清晰入口

## 5.11 同步模式是魔法字符串

代码中直接用 `'SEATUNNEL' / 'DTS_BINLOG' / 'SR_EXTERNAL'` 字符串判断，已有 `MatrixSyncMode` 枚举（`src/constant/enum.ts`）可用但未全面接入，易写错。

---

# 六、代码体量速览

| 文件 | 行数 | 复杂度 |
| --- | --- | --- |
| access-detail/index.vue | 6098 | 🔴 极高 |
| data-source/modal/detail-drawer.vue | 995 | 🟠 高 |
| access/index.vue | 870 | 🟠 高 |
| dispatch-drawer/index.vue（旧） | 710 | 🟡 中 |
| dispatch-drawer-new/index.vue | 615 | 🟡 中 |
| monitor-drawer/index.vue | 604 | 🟡 中 |
| dispatch-drawer-new/components/strategy-tab.vue | 496 | 🟡 中 |
| transform-rule/index.vue | 324 | 🟡 中 |
| dispatch-drawer-new/components/depend-tab.vue | 270 | 🟡 中 |
| data-source/index.vue | 247 | 🟢 低 |
| dispatch-drawer-new/components/fault-tab.vue | 205 | 🟢 低 |
| date-params-drawer/index.vue | 139 | 🟢 低 |
| source-params/index.vue | 113 | 🟢 低 |
| task/index.vue | 14 | 🟢 低（未使用） |
| **合计** | **≈10715** | |

---

# 七、给接手人的建议优先级

## 第一周：上手
1. 把 MySQL→Hive+Seatunnel 全链路（新建/编辑/发布/重跑）跑一遍，这是最复杂、覆盖最多分支的场景
2. 通读 `access-detail/index.vue` 的 computed / watcher 区，画出场景决策表
3. 阅读 `src/resources/matrix.ts` 了解接口边界

## 第一月：止血
1. **下线旧版 dispatch-drawer**，只保留新版
2. 把 `access-detail` 的场景分支抽到独立工具文件（`utils/scenarios.ts`）
3. 对字段映射核心逻辑补单元测试
4. 把 syncMode 的字符串判断全部换成 `MatrixSyncMode` 枚举

## 第二季：结构性重构
1. 拆分 `access-detail` 为 Step 组件（Basic / Source / Field / Mapping）
2. 引入中心化校验 schema
3. 补 E2E 场景覆盖
4. 把 watcher 体系调整为显式 action，避免级联

---

# 八、关键联系人

- **产品**：王蕊（pilot & dwLighthouse）、袁超琪（pilot）
- **后端**：李仟姗（matrix 数据集成）
- **测试**：彭丽娅 / 杨天雅

（以上与总览交接文档一致，具体同步/发布相关问题可直接找李仟姗）
