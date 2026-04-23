> 本文档面向 **数据质量（dqc / Baymax-DQC）** 模块的接手人。覆盖质量监控（规则模板/配置/运维）、数据对比、数据测试三条主线，重点记录功能边界、大文件分布、跨模块依赖以及已知的风险点。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/AQsZww25BiERQdkiADdcIwXjnrf

# 一、模块概览

DQC 是 `cn-data-pilot` 下负责 **数据质量治理** 的子系统，路由前缀 `/baymax-dqc`。业务上分成三大块：

- **Monitor（监控）**：规则模板、按表配置规则、创建质量监控、查看运行记录
- **Diff（数据对比）**：两张表（或两段 SQL）的对比任务与报告 — **owner: 王硕**
- **Test（数据测试）**：字段级探查 + 质量测试任务 + 报告

模块总量 ≈ 1.7 万行，大文件主要集中在 `diff-detail`（2066）、`test-detail`（1559）、`add-monitor`（1554）、`form-condition`（1251）、`run-record/detail`（902）、`test-report`（954）、`test/index`（619）。

## 1.1 一级路由（`src/routers/module/dqc.ts`）

| 路径 | 路由名 | 说明 |
| --- | --- | --- |
| `/baymax-dqc/monitor/rule-template` | ruleTemplate | 规则模板库（只读） |
| `/baymax-dqc/monitor/rule-config/table-config` | tableConfig | 按表配置入口（默认页） |
| `/baymax-dqc/monitor/rule-config/add-monitor` | addMonitor | 新建/编辑质量监控向导（hidden） |
| `/baymax-dqc/monitor/rule-config/config-detail` | configDetail | 表质量详情（hidden） |
| `/baymax-dqc/monitor/dev-ops/run-record` | runRecord | 运行记录列表 |
| `/baymax-dqc/monitor/dev-ops/run-record/detail` | runRecordDetail | 运行记录详情（hidden） |
| `/baymax-dqc/diff` | dqcDiff | 数据对比任务列表 |
| `/baymax-dqc/diff-detail` | diffEdit | 新建/编辑对比（hidden） |
| `/baymax-dqc/diff-report` | diffReport | 对比报告（hidden） |
| `/baymax-dqc/test` | dqcTest | 数据测试列表 |
| `/baymax-dqc/test-detail` | testEdit | 创建测试任务（hidden） |
| `/baymax-dqc/test-report` | testReport | 测试报告（hidden） |

模块默认 redirect 到 `tableConfig`。多数编辑/详情页启用 `runtimeLayoutConfig: { showBreadcrumb: false }`。

## 1.2 目录结构

```
src/pages/dqc/
├── constant/                         # 共享枚举、状态颜色
├── monitor/
│   ├── rule-template/                # 规则模板库
│   ├── rule-config/
│   │   ├── table-config/             # 按表配置入口
│   │   ├── add-monitor/              # ⭐ 新建监控向导（1554 行 + 5 个 drawer）
│   │   │   └── modal/                # ai / table / field / sql / rule-edit
│   │   ├── config-detail/            # 表质量详情
│   │   └── components/
│   │       └── form-condition.vue    # ⭐ 条件构造器（1251 行）
│   └── dev-ops/
│       └── run-record/               # 运行记录 + 详情（902 行）
├── diff/                             # 数据对比（王硕）
│   ├── index.vue                     # 列表（471）
│   ├── diff-detail/index.vue         # ⭐ 新建对比（2066 行）
│   ├── diff-report/index.vue         # 对比报告
│   └── constant/options.ts
└── test/                             # 数据测试
    ├── index.vue                     # 列表 + 内嵌实例表（619）
    ├── test-detail/index.vue         # ⭐ 创建测试（1559 行）
    ├── test-report/index.vue         # 测试报告（954）
    └── constant/options.ts
```

## 1.3 后端接口

| 资源文件 | Base URL | 作用域 |
| --- | --- | --- |
| `src/resources/monitor.ts` | `/api/dqc` | 规则模板 / 规则 / 规则组（监控） / 运行记录 / AI 规则流 / 调度节点 / 通知组 |
| `src/resources/dqc.ts` | `/api/dqc/dataCompare` | 数据对比任务、字段、分区、报告、日志 |
| `src/resources/data-test.ts` | `/api/dqc` | 数据测试任务 / 实例 / 反馈 / 分享 |
| `src/resources/quality.ts` | `/api/jarvis/tasks/dqc/checkCreate/:taskId` | 与 Jarvis 的接入校验 |

典型接口分组（monitor）：
- `enums/:name` — 动态加载枚举（`RuleTemplateType` / `RuleTemplateScope` / `RunStatus` / `TriggerType` 等）
- `rule-template`、`rule-template/:scope` — 模板库
- `rule/:id`、`rule/dqcDetail/:tableId` — 规则 CRUD
- `rule-group`、`rule-group/:id`、`rule-group/dqcDetail/:tableId` — 监控（规则组）CRUD
- `rule-group/schedule/previewHourlyTimes` — 小时级 cron 预览
- `rule/dqc/ai-submit`、`rule/streaming/:taskId`、`rule/dqc/abort/:taskId` — AI 规则流式
- `rule-group/ds/getProject`、`rule-group/ds/getWorkFlow` — 关联调度节点

---

# 二、Monitor（监控）子模块

## 2.1 规则模板库 `monitor/rule-template/index.vue`（246 行）

- 仅浏览 / 搜索，无创建入口（模板由后端维护）
- 过滤：`type`（RuleTemplateType）+ `scope`（RuleTemplateScope）
- 列：类型、名称、作用域、关联规则数（可排序）、描述
- 分页默认 10/页

## 2.2 按表配置 `monitor/rule-config/table-config/index.vue`（639 行）

双栏布局：
- **左**：树形数据源（HIVE / STARROCKS 等）
- **右**：表列表 + 过滤（owner、未配置规则、我负责的） + 分页

状态持久化：使用 `localStorage.tableConfigQuery` 记忆上次查询（**注意**：无 schema 版本，升级字段时旧数据会坏）。

操作：
- "新建监控" → `addMonitor`（hidden route）
- "查看监控" → `configDetail`（hidden route）

## 2.3 新建监控向导 `monitor/rule-config/add-monitor/index.vue`（1554 行 🔴）

> 这是 DQC 模块最复杂的页面，接手后的首要阅读对象。

### 2.3.1 四步 Step

| 步骤 | 内容 |
| --- | --- |
| Basic（基础信息） | 监控名称、描述、数据范围、调度节点 |
| Rule（质量规则） | 挂载/编辑/删除规则，通过 5 个 drawer 创建规则 |
| Config（运行设置） | 触发方式：`SCHEDULED` / `CRON` + 调度频率 + 偏移 |
| Alert（告警通知策略） | 选择 NotifyPolicy，跨项目选择要弹警告 |

### 2.3.2 关键交互

- **条件展示**：非 STARROCKS 的表才显示 AI / 模板 / 字段 / SQL 四类规则入口
- **分区表**：数据范围通过 `FormCondition` 自定义 WHERE
- **调度预览**：小时级 cron 会调用 `schedule/previewHourlyTimes` 展示下 5 次执行时间（500ms 防抖）
- **调度节点关联**：通过 Dagster `projectCode` + `workflowCode` 绑定工作流；**未关联节点的监控，强规则不会阻断**，代码 / UI 都有提示
- **跨项目策略**：所选 notify policy 如果属于其他项目，edit/copy 模式下禁用修改

### 2.3.3 5 个 Drawer / Modal（`add-monitor/modal/`）

| 文件 | 行数 | 作用 |
| --- | --- | --- |
| `rule-edit-modal.vue` | 772 | 规则编辑（edit/view），三 Tab：Basic / Threshold / Advanced |
| `field-drawer.vue` | 996 | 批量按字段应用模板规则（左模板树 + 中字段多选 + 右卡片预览） |
| `sql-drawer.vue` | 863 | 自定义 SQL 规则，内置 CodeBox + "解析 SQL → 生成监控字段 + 阈值" |
| `table-drawer.vue` | 755 | 表级模板规则 |
| `ai-drawer.vue` | 541 | Copilot 流式生成规则（`submitAI` + `streamingAI` + `abortAI`） |

> **状态同步坑**：5 个 drawer 共享 `ruleList`，每个都有独立 `onClose` 回调。修改其中一个 drawer 的数据结构时，别的回调经常忘记同步，导致规则列表错位。

### 2.3.4 校验细节

- 监控名称正则：`^[一-龥a-zA-Z][一-龥0-9_a-zA-Z]*$`
- `minuteOffset`：0-59 整数，blur 触发校验
- `hourInterval`：24 的因子硬编码数组 `[0, 1, 2, 3, 4, 6, 8, 12]`
- 规则的阈值百分比通过 `%` 后缀显示

## 2.4 表质量详情 `config-detail/index.vue`（92 行）

薄壳组件，按 query 参数路由到：
- `monitor-detail.vue`（259 行）— 监控概览 + 运行统计
- `rule-detail.vue`（544 行）— 监控下所有规则的搜索列表 + 单条测试

## 2.5 运行记录 `dev-ops/run-record/`

- `index.vue`（414 行）：按 数据源 / 表 / 监控名 / 触发类型 / 运行状态 / 告警状态 筛选
- `detail/index.vue`（902 行 🔴）：双栏布局；左侧规则列表（按告警状态 / 作用域 / 模板类型 / 运行状态 / 生成方式过滤），右侧单规则详情（执行时间、结果、失败原因、指标）

运行/告警状态颜色：
```
RUN_STATUS_MAP = { INIT: 'default', RUNNING: 'blue', SUCCESS: 'green', FAILED: 'red' }
AlarmStatusColor = { NORMAL: 'green', ALARM: 'red' }
```

## 2.6 `form-condition.vue`（1251 行 🔴）

通用条件构造器，被 `add-monitor` 等多处使用：

- 支持 AND/OR 多级条件组
- 字段类型感知的操作符（`StringTypeOptions` / `NumberTypeOptions` / `DateTypeOptions` / `BooleanTypeOptions`）
- 日期变量（`${p_date}`、`${month_dt}` 等）下拉建议
- 复杂类型支持索引（`col[key]` / `arr[0]`）
- 多选值模式（`in` / `not in`）

**注意**：该组件内部使用递归模板，修改时务必测试深层嵌套的增删改。

---

# 三、Diff（数据对比）子模块 — owner: 王硕

## 3.1 列表 `diff/index.vue`（471 行）

- 过滤：任务 ID / 名称 / 对比模式（TABLE / SQL） / A、B 表名 / 运行状态 / 创建者
- 任务状态：`CREATED` / `RUNNING` / `SUCCESS` / `FAILED` / `STOPPED` / `TIMEOUT` / `ERROR`
- 行操作：对比报告（仅 SUCCESS 可用）、运行、停止、编辑、复制、查看、日志、删除

## 3.2 新建 / 编辑对比 `diff/diff-detail/index.vue`（2066 行 🔴 全模块最大）

多步向导：

1. **基础信息**：任务名（正则 `^[一-龥a-zA-Z][一-龥0-9_a-zA-Z]*$`），对比模式 TABLE 或 SQL
2. **A 表配置**：
   - TABLE 模式：数据源 → 库 → 表 → owner（自动）→ 对比范围（PARTITION / WHERE）→ 分区选择 / WHERE textarea
   - SQL 模式：执行引擎 → 表别名（正则 `^[a-z][0-9_a-z]*$`）→ SQL（CodeBox + 格式化 / 校验按钮）
3. **B 表配置**：与 A 表同构，WHERE 可独立
4. **字段映射**：
   - 自动拉 A、B 字段列表
   - 手动映射：A 字段 ↔ B 字段
   - 标主键（用于逐行对比）
   - 忽略字段

**对比方式**：`ROW_BY_ROW` vs `TARGET_INCLUDES_SOURCE`
**抽样**：全量对比 + 差异抽样 1000 条 diff（来自后端）

**表单 Ref**：`basicForm`、`sourceForm`、`targetForm`（分段校验），提交前逐个 validate。

## 3.3 对比报告 `diff/diff-report/index.vue`（256 行）

- 报告头：A/B 表、创建人、对比模式、耗时
- 概览：行数差、主键匹配数、对比方式
- 字段级差异表：源字段/类型、目标字段/类型、差异条数、差异比例、结果（SAME / DIFFERENT）
- 工具函数：`formatNumber` / `formatPercent` / `formatDuration`
- 接口：`DqcApi.getReportSummary` / `DqcApi.getReportDetail`

## 3.4 常量 `diff/constant/options.ts`（164 行）

- `compareModeOptions`、`compareRangeOptions`（PARTITION / WHERE）、`compareResultOptions`
- `fieldMappingColumns`、`reportTableOptions`

---

# 四、Test（数据测试）子模块

## 4.1 列表 `test/index.vue`（619 行）

双层表格：
- **外层**：任务 ID、名称（带 "测试" 标签）、库.表、创建 / 修改时间、创建者、操作
- **内层（可展开）**：运行实例表 — 实例 ID、状态、执行人、反馈、耗时、操作（报告 / 查看 / 分享 / 日志 / 停止 / 删除）

实例反馈状态：`EXPECT_MATCH` / `EXPECT_NOT_MATCH` / pending
分页：外层 10，内层 5

辅助 Modal：
- `share.vue`（74 行）— 分享实例
- `log.vue`（186 行）— 任务日志

## 4.2 新建测试 `test/test-detail/index.vue`（1559 行 🔴）

四段配置：

1. **选择测试对象**：数据源 / 环境（PROD/STAGING/DEV）/ 库 / 表 / 数据范围（ALL / PARTITION / WHERE）
2. **字段类型打标**：字段表（按字段名、打标类型过滤，支持"未打标字段"筛选）、主键 checkbox、tagType 下拉（取自 `TagType` 枚举）、字段删除
3. **测试规则**：基于字段添加质量规则（NULL、基数、格式等）
4. **任务信息**：名称、描述、期望结果（用于反馈）

特殊处理：
- 库无权限时弹 Alert，提供跳转 Cerebro 的申请入口
- 字段打标时主键校验：主键不可重复

## 4.3 测试报告 `test/test-report/index.vue`（954 行）

- 概览：库.表、实例 ID、完成时间、耗时、执行人
- 统计卡片：主键去重记录数、重复记录数、规则总数、失败规则数（> 0 标红）
- 字段探查表：主键、字段名、类型、tagType、NULL 计数、空串计数、枚举值、数值统计（可视化）
- 规则结果：各规则通过/失败 + 指标

接口：`DataTestApi.fetchInstanceReport({ instanceId })`

## 4.4 常量 `test/constant/options.ts`（331 行）

`TableOptions` / `InnerTableOptions` / `SectionList` / `FieldTableOptions` / `DataRangeOptions` / `ReportFieldOptions`（约 30 列）。

---

# 五、共享 / 依赖

## 5.1 常量 `dqc/constant/`

- `enum.ts`（298 行）：动态加载的枚举 + 字段类型分类（`StringTypeEnum` / `NumberTypeEnum` / `DateTypeEnum` / `BooleanTypeEnum`）+ 对应的操作符选项 + 日期变量 `DefaultEnum`
- `status-color.ts`（5 行）：状态颜色（`UNREGISTERED / ONLINE / OFFLINE`）

枚举加载使用 `getEnum('TableStatus')` 风格的 lazy 方案。**没有显式缓存，同一个枚举会被多次请求**（@yqg/enum 的 `queryOnce: true` 目前仅部分启用）。

## 5.2 跨模块引用

| 依赖 | 用途 |
| --- | --- |
| `@/store/project` | 跨项目 policy 校验 |
| `@/hooks/use-policy-options` | 通知策略选择器复用 |
| `@/components/notify-policy-select` | 策略选择组件 |
| `@/resources/alert-policy` | 拉 policy 详情 |
| `@/pages/alert/center/policy/modal/detail.vue` | 异步 lazy load 的 policy 详情 modal |
| Monaco / CodeBox | SQL 编辑（diff / sql-drawer） |
| Ant Design Vue | 所有表格、表单、弹窗、抽屉 |

## 5.3 与 data-develop / matrix 的关系

- **data-develop/sql 的 quality-drawer（3031 行）** 与 dqc 的质量能力 **是两套独立代码**：data-develop 的那套面向 "SQL 任务内嵌规则"，dqc 这套面向 "表级监控"，后端接口也是独立的。接手时别误以为可以直接复用。
- **与 matrix 的调度抽屉无关**：dqc 的调度使用 SCHEDULED / CRON 的扁平配置，且预览通过 `previewHourlyTimes` 直接走后端。

---

# 六、⚠️ 重点风险与陷阱

## 6.1 大文件集中 🔴

| 文件 | 行数 |
| --- | --- |
| `diff/diff-detail/index.vue` | **2066** |
| `test/test-detail/index.vue` | **1559** |
| `monitor/rule-config/add-monitor/index.vue` | **1554** |
| `monitor/rule-config/components/form-condition.vue` | **1251** |
| `monitor/rule-config/add-monitor/modal/field-drawer.vue` | 996 |
| `test/test-report/index.vue` | 954 |
| `monitor/dev-ops/run-record/detail/index.vue` | 902 |
| `monitor/rule-config/add-monitor/modal/sql-drawer.vue` | 863 |
| `monitor/rule-config/add-monitor/modal/rule-edit-modal.vue` | 772 |
| `monitor/rule-config/add-monitor/modal/table-drawer.vue` | 755 |
| `test/index.vue` | 619 |
| `monitor/rule-config/table-config/index.vue` | 639 |
| `monitor/rule-config/add-monitor/modal/ai-drawer.vue` | 541 |

## 6.2 `add-monitor` 与 5 个 Drawer 的状态同步

- 5 个 drawer 各持 `ruleList` 修改权，回调分散
- 修改数据结构时容易漏掉其中一个 drawer 的回写
- **建议**：抽 `useRuleList()` composable 统一增删改

## 6.3 `diff-detail` 巨型向导

- 2066 行单文件 + TABLE / SQL 双模式 + A/B 两侧 + 字段映射
- 任何修改都要跑 4 种场景（TABLE+TABLE、SQL+SQL、TABLE+SQL、SQL+TABLE）
- 建议按 Step 拆分子组件

## 6.4 调度参数隐式约束

- `hourInterval` 必须是 24 的因子（`[0,1,2,3,4,6,8,12]`）— 前端仅用下拉覆盖，没有二次校验
- `minuteOffset` 0-59 整数，自定义 validator 挂在 blur，**绕过 blur 时会漏**
- 建议加 submit-time 最终校验

## 6.5 AI 流式规则（`ai-drawer.vue`）

- 轮询 `streamingAI(taskId)` 获取新增规则；当前**没有 backoff、没有超时退出**
- 长时间无响应会持续调用 API
- 建议：加最大轮询次数 + 指数退避；服务端支持 SSE 时优先改 SSE

## 6.6 localStorage 未做版本化

- `tableConfigQuery` 直接写 localStorage，无 schema 版本号
- 字段增删后旧数据会破坏页面
- 建议：加 `version` key，读取时做兼容

## 6.7 枚举动态加载无缓存保护

- 同一枚举在不同页面被多次请求
- 丢失的枚举没有错误边界，会静默破坏渲染
- 建议：统一 `useEnum()` hook + 缓存 + 出错降级

## 6.8 魔法字符串遍地

- `'SCHEDULED'` / `'CRON'` / `'TABLE'` / `'FIELD'` / `'PARTITION'` / `'WHERE'` 等在多处硬编码
- 推荐建 `src/pages/dqc/constant/schedule.ts`、`rule-scope.ts`、`data-range.ts` 统一托管

## 6.9 跨项目 Policy 校验

- `isPolicyCrossProject` 分散在多处
- 对比逻辑 `Number(projectStore.project)` 类型不稳
- 建议抽 service

## 6.10 表单 Ref 分段校验

- 一个页面多个 FormRef（`basicForm` / `sourceForm` / `targetForm` / `configForm` / `alertForm`）
- 统一提交时需依次 `await validate()`，任何一段漏调都会绕过校验
- 建议：抽 `validateAll()` 合并校验

## 6.11 错误提示不统一

- 后端错误读取路径有两种：`e.data?.status?.detail` / `e.response?.data?.message`
- 不同页面写法不同，失败后兜底文案不一
- 建议：封装统一 `handleApiError(e)`

## 6.12 与 Jarvis 的耦合

- `resources/quality.ts` 里的 `checkCreate/:taskId` 是创建前的二次检查
- 如果 Jarvis 链路变更，DQC 会静默失败
- 建议：接手后和 Jarvis 维护方（韩帅）对齐接口契约

---

# 七、给接手人的建议优先级

## 第一周：上手
1. 按 `tableConfig → addMonitor`（4 步 + 5 drawer）走一遍完整新建流程，覆盖 AI / 模板 / 字段 / SQL 四种规则入口
2. 跑通 `diff` TABLE 模式 + SQL 模式的新建 / 运行 / 对比报告
3. 跑通 `test` 创建 / 打标 / 运行 / 查看报告
4. 通读 `resources/monitor.ts` / `resources/dqc.ts` / `resources/data-test.ts`

## 第一月：止血
1. 封装 `useEnum()` hook，统一缓存 + 错误降级
2. 统一 API 错误处理（封装 `handleApiError`）
3. AI 流式：加超时退出 + 轮询退避
4. localStorage 加 schema 版本号，做版本兼容
5. `add-monitor` 的 `ruleList` 抽 composable

## 第二季：结构性重构
1. `diff-detail` / `add-monitor` / `test-detail` 按 Step 拆子组件
2. 枚举（Scheduled/Cron/DataRange/RuleScope）集中到 constant
3. `form-condition` 按能力拆（条件组、字段选择、值输入）
4. 补单元测试（表单校验、调度预览、字段映射）
5. 和 data-develop/sql 的 quality-drawer 做能力复用评估（当前两套独立，但很多 UI 概念重叠）

---

# 八、关键联系人

- **产品**：王蕊 / 袁超琪 / 赵一鸣
- **后端**：
  - 陈伟 — dataMap、dqc（monitor 主负责）
  - 王硕 — dqc-diff（数据对比）
- **上游依赖**：韩帅（Jarvis / schedule / publish / project）
- **测试**：彭丽娅 / 杨天雅

（对齐交接主文档"关键联系人"）
