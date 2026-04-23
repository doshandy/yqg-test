> 本文档面向 **发布中心（publishCenter / release-center）** 模块的接手人。**代码物理位置在 `src/pages/data-develop/publish/`**，但路由由 `publishCenter.ts` 单独挂到 `/publish/*`。发布中心是 data-develop / matrix / asset 等多个模块提交后汇聚的审批 + 发布枢纽。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/GjhSwgUJ6i59ArkladmccFSdnWM

# 一、模块概览

发布中心（PublishCenter）是 `cn-data-pilot` 下的 **发布包管理 + 审批 + 发布执行** 子系统，路由前缀 `/publish`。总量 ≈ 3770 行，其中 detail 1448 行 + 列表 1150 行 + QualityConfigPane 612 行 + aiChat 412 行。

**Owner**：韩帅（data-develop / **schedule / publish / project** / note 后端主负责）

业务主线：
1. **发布包列表** — 查看全部发布包 / 过滤 / 审批 / 撤回 / 催办
2. **发布包详情** — 多 Tab 展示代码 / 元数据 / 调度 / 资源参数 / 质量监控的 diff，支持审批 / 拒绝 / 撤回，自动触发 AI Summary（SSE）
3. **AI 对话助手** — 浮动聊天面板，供发包审核期间咨询上下文
4. **跨模块入口** — data-develop/sql / matrix/access-detail / asset 都走同一个 `release_center/packages/create-and-submit` 提交

## 1.1 一级路由（`src/routers/module/publishCenter.ts`）

| 路径 | 路由名 | 页面 | 说明 |
| --- | --- | --- | --- |
| `/publish` | Publish | `pages/index.vue` | 壳，redirect → Center |
| `/publish/center` | Center | `pages/data-develop/publish/index.vue` | 发布包管理（默认页） |
| `/publish/publish-detail` | PublishCenter | `pages/data-develop/publish/components/detail/index.vue` | 详情（hidden，关闭 breadcrumb） |

> **特别注意**：代码目录在 `data-develop/publish/`，但路由挂在 `/publish/*`。同时 data-develop/sql 的提交流 + version-compare-modal 也在复用 `publish/aiChat`。**修改 publish 相关组件会同时影响两个路由入口 + 两个 data-develop 内使用点**。

## 1.2 目录结构

```
src/pages/data-develop/publish/
├── index.vue                                 # ⭐ 列表（1150 行）
└── components/
    ├── aiChat/
    │   └── index.vue                         # AI 聊天面板（412 行）
    └── detail/
        ├── index.vue                         # ⭐ 详情（1448 行）
        └── components/
            ├── QualityCompare.vue            # 新老 dqc 对比（149）
            └── QualityConfigPane.vue         # 单份 dqc 配置展示（612）
```

## 1.3 后端接口

### `src/resources/publish.ts`（前缀 `/api/release_center` + Jarvis）

| 接口 | 说明 |
| --- | --- |
| `POST /api/release_center/packages/search` | 列表分页 |
| `GET  /api/release_center/packages/:id` | 包详情 |
| `POST /api/release_center/packages/:id/approve` | 审批（同一接口承载 APPROVED / REJECTED） |
| `POST /api/release_center/packages/:packageId/cancel` | 撤回（需 cancelReason） |
| `POST /api/release_center/packages/:id/reminder` | 催办 |
| `GET  /api/release_center/status/all` | 状态枚举 |
| `GET  /api/jarvis/project_config/publish-type-options` | 发布类型下拉 |
| `GET  /api/jarvis/task_prod_versions/versions/:taskCode/:versionNumber` | 任务版本详情 |
| `GET  /api/jarvis/task_prod_versions/ai-summary/:taskCode?version1=&version2=` | AI Summary（SSE） |
| `GET  /api/jarvis/task_prod_versions/table/ai-summary/:tableUUid` | 表 AI Summary |
| `GET  /api/jarvis/table_management/tableRelease/versions/:batchId/:versionNumber` | 表版本详情 |
| `GET  /api/jarvis/table_management/table-batch-release-info/:batchId/:versionNumber` | 表批次发布信息 |

### `src/resources/aiChat.ts`（前缀 `/api/llm`）

| 接口 | 说明 |
| --- | --- |
| `POST /api/llm/conversation/sessions` | 建会话（会话类型 `RELEASE_MANAGEMENT`） |
| `POST /api/llm/conversation/sessions/:sessionId/messages/stream` | 消息流（SSE） |

---

# 二、发布包列表 `publish/index.vue`（1150 行 🔴）

## 2.1 筛选

- **基础**：包名（关键字）、状态（单选）、发布类型（多选，响应式 tag）
- **展开**：提交人（"我申请的"勾选后禁用）、审核人（"待我审批"勾选后禁用）、提交时间区间、发布时间区间

## 2.2 表格列

| 列 | 内容 |
| --- | --- |
| 包名 | 名称 + 上线/下线 Tag + 复制图标 |
| 包含明细 | 任务类型 tag 列（超过 3 个走 Popover） |
| 提交描述 | memo，超长 tooltip |
| 申请信息 | 提交人 + 提交时间 |
| 审核信息 | 审核人 + 审核时间，或 "免审" tag |
| 状态 | Badge + 时间戳；FAILED 带错误详情 Popover |
| 操作 | 详情 / 撤回 / 催办 / 审核 |

## 2.3 状态枚举

| 状态 | Badge | 文案 |
| --- | --- | --- |
| `REVIEWING` | warning | 待审核 |
| `PUBLISHING` | processing | 发布中 |
| `PUBLISHED` | success | 发布成功 |
| `FAILED` | error | 发布失败 |
| `REJECTED` | error | 已拒绝 |
| `CANCELLED` | default | 已撤回 |

## 2.4 操作条件

| 操作 | 条件 |
| --- | --- |
| 详情 | 始终可点（新窗口 `/publish/publish-detail?id=`） |
| 撤回 | status = REVIEWING 且 submittedBy = 当前用户 |
| 催办 | 同撤回条件；按钮走 loading |
| 审核 | status = REVIEWING 且 `canReviewPackage === true` |

## 2.5 错误详情 Popover

FAILED 状态的包点状态时展示：
- 失败的节点类型 / 节点名
- Trace ID（带复制按钮）
- 错误 message（从 `errorMessage` 字段 JSON.parse）
- 一键"复制错误摘要"生成聚合报告

## 2.6 任务类型 Tag 颜色

```
SPARK_SQL / SPARK_PYTHON / LLM_SKILLS / NOTEBOOK → rc-type-tag-dev + CodeOutlined
DATA_INTEGRATION → rc-type-tag-integration + SwapOutlined
TABLE_MANAGEMENT → rc-type-tag-table + TableOutlined
DQC              → rc-type-tag-dqc + SafetyCertificateOutlined
```

---

# 三、发布包详情 `components/detail/index.vue`（1448 行 🔴）

> 全模块最复杂的页面，多任务类型共一个壳，AI Summary + 多 Tab + 审批 + 撤回 + Dqc 对比都在这里。

## 3.1 页面结构

- **Header 卡**：包名 + 状态 tag + 上线/下线 tag；若 `status === REVIEWING && canReviewPackage`：显示"通过 / 拒绝"按钮；若 `submittedBy === currentUser`：显示"撤回"
- **原因卡**：status ∈ [CANCELLED, REJECTED, FAILED] 时展示对应原因
- **版本信息卡**：非 integration 任务展示 prod / release 两个版本的元信息
- **AI Summary 卡**：折叠可展开，mount 时自动发起 SSE 流式生成 markdown 差异摘要
- **Tabs**（按任务类型条件渲染）：

| Tab | 条件 | 组件 |
| --- | --- | --- |
| 元数据查看 | `isTablePublish` | `TabelInfoDiff` |
| 代码查看 | `isTaskPublish` | `CodeDiff`（基于 `v-code-diff`，side-by-side） |
| 调度配置 | `isTaskPublish` | `DispatchDetail` |
| 资源参数 | `isTaskPublish` | `ParamsDetail` |
| 质量监控 | `isTaskPublish` | `QualityCompare`（下节详解） |

## 3.2 任务类型判定

`normalizeTaskType()` 把 `taskType` 字符串（逗号/空格/竖线分隔）展开成数组，再用 computed 判断：

- `isIntegrationTask`：含 `INTEGRATION_PUBLISH` 或 `DATA_INTEGRATION`
- `isTablePublish`：含 `TABLE_PUBLISH`
- `isTaskPublish`：含 `TASK_PUBLISH`

## 3.3 审批动作

| 按钮 | 动作 | 接口 |
| --- | --- | --- |
| 通过 | status REVIEWING → PUBLISHING（后端自动流转到 PUBLISHED / FAILED） | `POST approve { approvalResult: 'APPROVED' }` |
| 拒绝 | 打开 `closeModal` 收 reason（≤256） | `POST approve { approvalResult: 'REJECTED', approvalComment }` |
| 撤回 | 打开 `onClosCloseModal` 收 reason（≤256） | `POST cancel { cancelReason }` |

## 3.4 AI Summary 流式

- 触发：mount + 非 integration 任务 + 非全部已拒绝
- 任务端点：`GET /api/jarvis/task_prod_versions/ai-summary/:taskCode?version1=&version2=`
- 表端点：`GET /api/jarvis/task_prod_versions/tableBatchId/ai-summary/:batchId?...`
- 实现：同 aiChat 的 SSE 模式（Fetch stream），30ms typewriter delay，`marked.parse(rawText)` 边拿边渲染
- **脆弱点**：**没有 AbortController**，用户在流式期间切 Tab / 刷新会残留

## 3.5 Quality 数据规范化

API 返回的 DQC 原始规则组里枚举是中英混合，`transformQualityData()` 做归一化：

```
ruleLevel:         "强规则" → "ERROR" （默认 "WARN"）
generateMethod:    "AI推荐"/"表级模板"/"字段级模板"/"SQL"/"手动"
                 → "AI" / "TABLE" / "FIELD" / "SQL" / "MANUAL"
partitionType:     "分区表"/"全表" → "PARTITION" / "NONE"
triggerType:       "定时调度触发"/"生产调度触发" → "CRON" / "SCHEDULED"
scheduleFrequency: "天级"/"小时级" → "DAY" / "HOUR"
```

> 脆弱点：字符串硬匹配，API 若加新枚举会走默认分支，需要加回归用例。

## 3.6 数据加载

- `getPackagesInfo({ id })` 拿包元信息
- 任务发布：并行 `Sql.getVersionDetail({ taskCode, versionNumber })` 拿 prod + release 两版
  - 字段：scriptContent（SQL）/ 调度配置 / 资源参数 / dqcRuleGroups
- 表发布：`PublishAPI.getTableVersion` + `getTableVersionInfo`
- 数据集成：委托给 `accessDetail` 组件（只读态）

---

# 四、Quality 对比

## 4.1 `QualityCompare.vue`（149 行）

- Props：`oldVersion`（[]）+ `newVersion`（[]）
- 按 UUID 合并形成 Tab 列表，每个 Tab 名 = 监控名
- 双栏布局：左灰底为老版本，右白底为新版本
- 空态："上个版本无此监控配置" / "新版本无此监控配置"
- 子组件：`QualityConfigPane`

## 4.2 `QualityConfigPane.vue`（612 行）

单份 dqc 配置的完整展示，共 5 个 section：

1. **基础信息**：监控名 + 数据范围（全表 or `col operator value` 过滤表达式）
2. **质量规则表格**：列 — 规则名 / 级别（强/弱 Tag）/ 生成方式（AI / TABLE / FIELD / SQL / MANUAL）/ 作用域 / 阈值 / 状态开关（禁用）
3. **运行设置（Descriptions）**：触发类型 + CRON + scheduleConfig 时的频率与执行时间（日级显示 `expectedTime`，小时级显示"每 X 小时第 Y 分钟"）
4. **关联调度节点**：`dsWorkFlows.length > 0` 时展示；项目 / 工作流 / 来源（MANUAL / SYSTEM）
5. **告警通知策略**：通过 `AlertPolicyApi.getPolicyDetail({ policyId })` 拉 policy name

### 异步名称解析与缓存

- 项目名：一次性 `MonitorApi.getProjectNameOptions()` 全拉并缓存
- 工作流名：每个 projectCode 首次 `MonitorApi.getWorkflowNameOptions({ projectCode })` 后缓存
- 竞态保护：`fetchRequestId` 自增计数器，仅最新请求结果 UI 生效

---

# 五、AI 对话助手 `components/aiChat/index.vue`（412 行）

## 5.1 入口

- 浮动按钮（RobotOutlined），固定 `bottom: 40px, right: 40px`
- 点击打开固定 420×520 的聊天面板
- 标题 "DataPilot 助手"，底部免责"内容由 AI 生成，仅供参考"

## 5.2 SSE 实现

```typescript
fetch(`/api/llm/conversation/sessions/${sessionId}/messages/stream`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    datapilot_project_id: projectId
  },
  signal: abortController.signal,
  body: JSON.stringify({ message: userMessage })
});
```

- 行解析：`data:` 前缀取片段，`event:complete` 结束
- Typewriter：30ms/char
- Session：首次打开 `getSession({ title, conversationType: 'RELEASE_MANAGEMENT' })`，面板生命周期内复用

**与项目其他 SSE 实现对比**：

| 模块 | 实现 | 特点 |
| --- | --- | --- |
| data-develop/sql-ai | axios `onDownloadProgress` + 正则 | 脆弱 |
| data-develop/submit-validate-drawer | 同上 | 脆弱 |
| data-map/index.vue | Fetch + reader + JSON.parse | 最干净 |
| **publish/aiChat** | **Fetch + SSE + typewriter + AbortController** | 有 abort，但解析仍基于字符串切分 |
| **publish/detail AI Summary** | Fetch stream | **缺 AbortController**（见上节风险） |

## 5.3 复用点

- 被 **`data-develop/sql/components/sql-main/modal/version-drawer/modal/version-compare-modal.vue`** 直接 import → 版本对比抽屉里同样挂这个 chat
- 改动 aiChat 组件等于同时影响 publish 列表/详情 + version-compare modal

---

# 六、跨模块提交统一入口

三个模块都通过 `POST /api/release_center/packages/create-and-submit` 汇入发布中心：

## 6.1 data-develop/sql → publish

- 文件：`sql/components/sql-main/modal/submit-pane-modal.vue`
- 字段：packageName / packageType=RELEASE / releaseAction / description / taskPublishExpireTime / tasks[] / approvalFlowConfig
- 成功后：弹窗提示 + "查看发布包"按钮 → 新窗口打开 `/publish/publish-detail?id={packageId}`

## 6.2 matrix/access-detail → publish

- 文件：`src/resources/matrix.ts`
- 接口：`publishTask: customPost('/api/release_center/packages/create-and-submit')`
- 用于 SEATUNNEL 任务自动发布

## 6.3 asset → publish

- 文件：`src/resources/asset.ts`
- `submitTask: customPost('/api/release_center/packages/create-and-submit')`

## 6.4 approvalFlowConfig 约定

```
{
  flowType: 'SINGLE',
  approvalLevels: [{
    level: 0,
    approverType: 'USER',
    approvers: string[] | []     // 空数组表示免审
  }]
}
```

---

# 七、审批状态机

```
用户提交
  ↓
[REVIEWING] ────→ [REJECTED]  （审核人拒绝 + reason）
     │     ────→ [CANCELLED]  （提交人撤回 + reason）
     │
     └── APPROVE ──→ [PUBLISHING]（后端异步发布）
                       ├──→ [PUBLISHED] （success）
                       └──→ [FAILED]    （失败，errorMessage 写入 releaseTasks）
```

- **前端不轮询**：状态变化只能靠用户手动刷新列表/详情
- **后端负责异步流转** PUBLISHING → PUBLISHED / FAILED

---

# 八、⚠️ 重点风险与陷阱

## 8.1 代码物理位置 vs 路由入口错位

- `src/pages/data-develop/publish/` 里的代码对应 `/publish/*` 路由
- 同样被 `data-develop/sql` 的 submit 流 / version-compare 弹窗直接 import 复用
- 修改 publish 组件必须 grep 两处使用点同步验证

## 8.2 大文件集中 🔴

| 文件 | 行数 |
| --- | --- |
| `components/detail/index.vue` | **1448** |
| `publish/index.vue` | **1150** |
| `components/detail/components/QualityConfigPane.vue` | 612 |
| `components/aiChat/index.vue` | 412 |
| `components/detail/components/QualityCompare.vue` | 149 |

## 8.3 AI Summary 缺 AbortController

- 详情页 mount 时自动 fetch SSE stream
- 用户快速切走 / 刷新，流仍在后台继续
- 连续切 Tab 可能导致状态渲染错乱
- 建议：加 AbortController + 组件 unmount 清理

## 8.4 SSE 字符串分割脆弱

- publish 内两份 SSE 都依赖 `data:` / `event:complete` 行前缀字符串匹配
- 后端格式变动会静默失败
- data-map 有更好的 reader + JSON.parse 实现可参考

## 8.5 Quality 数据枚举规范化脆弱

- `transformQualityData()` 依赖中英文字符串精确匹配（"强规则" / "AI 推荐"等）
- 后端调整文案就会 break
- 建议：改由后端直接下发英文枚举，前端只负责展示映射

## 8.6 状态枚举多处硬编码

- 列表 STATUS_BADGE_MAP / 详情页 tag / 筛选下拉 / 后端 `release_center/status/all`
- 状态新增/重命名需要至少 4 处同步
- 建议：以后端 `getStatusOptions()` 为唯一源，前端只存 fallback

## 8.7 无实时刷新

- PUBLISHING 期间用户看不到进度
- 列表默认不轮询
- 建议：详情页在 PUBLISHING 状态下 10-15s polling 或后端 SSE 推送

## 8.8 v-code-diff 性能

- side-by-side diff 在大 SQL（万行量级）会明显卡顿
- 无懒加载 / 虚拟化
- 目前实际任务 SQL 量可控，但需关注

## 8.9 审批流程只支持单级

- `approvalFlowConfig.flowType: 'SINGLE'` 硬编码
- 多级审批 / 会签目前没实现
- 扩展时需要后端同步能力

## 8.10 aiChat 会话生命周期

- Session 只在面板生命周期内保留（关闭即丢）
- 用户不小心关闭会清空上下文
- 建议：把 session 绑定到当前发布包，关闭不清会话

## 8.11 packageId URL 传值无校验

- `/publish/publish-detail?id=123` 直接从 query 读取
- 非数字 / 注入型 id 会直接进入 API 调用
- 建议：前端先 `Number()` + NaN 校验

## 8.12 任务类型字符串解析容错

- `normalizeTaskType()` 处理逗号/空格/竖线分隔
- 未来新增分隔符会漏
- 建议：后端直接返回数组

## 8.13 错误 Popover 的 JSON.parse 无兜底

- 列表 FAILED 包的 `errorMessage` 走 JSON.parse
- 非法 JSON 会抛
- 建议：try-catch + 降级为原始 string 展示

---

# 九、给接手人的建议优先级

## 第一周：上手
1. 使用 data-develop/sql 新建任务 → 提交 → 走一遍发布流（审核通过 / 拒绝 / 撤回 / 催办）
2. 在发布列表点进详情，熟悉 5 个 Tab（元数据 / 代码 / 调度 / 资源 / 质量）的展示
3. 触发 AI Summary + aiChat 各一次，观察 SSE 流
4. 读一遍 detail/index.vue 的 transformQualityData + normalizeTaskType
5. 对着 `/api/release_center/...` 接口清单过一遍后端联调点

## 第一月：止血
1. AI Summary 加 AbortController + 卸载时清理
2. Quality transform 改后端下发英文枚举
3. 状态枚举收敛到 getStatusOptions 唯一源
4. PUBLISHING 状态下详情页 polling 15s
5. Error Popover / 任务类型解析加 try-catch 兜底
6. SSE 解析统一到 data-map 的 reader + JSON.parse 模式

## 第二季：结构性重构
1. 拆 `detail/index.vue`（1448）：Header / AI Summary / Tabs 独立子组件
2. 拆 `QualityConfigPane`（612）：5 个 section 各独立
3. 多级审批流能力（后端 + 前端）
4. 代码 diff 虚拟化（大 SQL 场景）
5. aiChat 的 session 与发布包绑定（重新打开能恢复上下文）

---

# 十、关键联系人

- **产品**：王蕊 / 袁超琪
- **后端**：
  - **韩帅 — data-develop / schedule / publish / project / note 主负责**
- **跨模块提交源**：
  - 韩帅（sql 提交）/ 李仟姗（matrix 提交）
- **质量监控相关**：陈伟（dqc 后端）
- **告警策略相关**：盛思宇（alert policy）
- **测试**：彭丽娅 / 杨天雅

（对齐交接主文档"关键联系人"。发布流程 / 审批链路相关问题首选韩帅）
