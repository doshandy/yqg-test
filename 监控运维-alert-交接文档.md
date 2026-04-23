> 本文档面向 **监控运维 / 告警中心（alert）** 模块的接手人。覆盖告警事件全生命周期（触发→处理→屏蔽/转交/解决/误报）、通知策略 CRUD、外链可分享的告警详情页（landing），以及 dqc / matrix / data-develop 交叉引用的策略详情 Modal。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/XiHrw8Wl2ip9OgkT5fecHWbmnPh

# 一、模块概览

Alert（告警中心）是 `cn-data-pilot` 下负责 **监控事件管理 + 通知策略配置** 的子系统，路由前缀 `/alert`。模块总量 ≈ 9000 行，最大单文件 `event/index.vue`（1696 行）与 `policy/modal/edit.vue`（1366 行）。

**Owner**：盛思宇（后端 / 三方调度平台也是他负责）

业务上分三条主线：
1. **Event（告警事件）** — 接收来自 DQC / Schedule / Matrix 等各源头的事件，提供认领 / 屏蔽 / 转交 / 解决 / 误报等运维动作
2. **Landing（告警详情公开页）** — 外部可分享的单事件页（`hideLayout: true`），面向飞书 / 邮件通知点击跳转
3. **Policy（通知策略）** — 严重度驱动的通知策略配置（ERROR / WARN × taskOwner/specified/onCall × WECOM_GROUP/PHONE），同时是 DQC / SQL / Matrix 跨模块引用的能力

## 1.1 一级路由（`src/routers/module/alert.ts`）

| 路径 | 路由名 | 页面 | 说明 |
| --- | --- | --- | --- |
| `/alert` | Alert | `pages/index.vue` | 壳；默认 redirect → `event` |
| `/alert/center` | center | `pages/alert/center/index.vue` | 壳（14 行 router-view） |
| `/alert/center/event` | event | `pages/alert/center/event/index.vue` | 告警事件（**默认页**） |
| `/alert/center/landing` | landing | `pages/alert/center/landing/index.vue` | 告警详情（hidden，hideLayout） |
| `/alert/center/policy` | policy | `pages/alert/center/policy/index.vue` | 通知策略 |

## 1.2 目录结构

```
src/pages/alert/
└── center/
    ├── index.vue                         # 壳（14 行）
    ├── event/
    │   ├── index.vue                     # ⭐ 事件列表（1696 行）
    │   ├── constant/options.ts
    │   └── modal/
    │       ├── detail.vue                # 事件详情抽屉（1082 行）
    │       ├── resolve.vue               # 解决（280）
    │       ├── slience.vue               # 屏蔽（136）
    │       ├── false-positive.vue        # 误报（111）
    │       ├── batch-resolve.vue         # 批量解决（405）
    │       ├── batch-silence.vue         # 批量屏蔽（210）
    │       ├── batch-false-positive.vue  # 批量误报（184）
    │       ├── batch-acknowledge.vue     # 批量认领（148）
    │       ├── log.vue                   # 日志查看（297）
    │       └── data-quality-log-modal.vue# DQ 日志（198）
    ├── landing/
    │   ├── index.vue                     # ⭐ 公开分享详情页（1122 行）
    │   └── modal/
    │       ├── resolve.vue (285)
    │       └── false-positive.vue (111)
    └── policy/
        ├── index.vue                     # 策略列表（444 行）
        ├── constant/
        │   ├── severity-level.ts         # 核心策略配置逻辑（288 行）
        │   └── options.ts                # 表格列 / 渠道 / 静默时长等（78）
        └── modal/
            ├── detail.vue                # ⭐ 详情 Modal（666 行，跨模块引用）
            └── edit.vue                  # ⭐ 编辑 Modal（1366 行）
```

## 1.3 后端接口

两份 resources：

### `src/resources/alert.ts`（≈58 行，前缀 `/api/v1/alerts`）

- `getOverviewStat` / `getTableInfo` / `getAlertDetail(eventId)` / `getEventLog(eventId)`
- 单事件动作：`acknowledgeAlert` / `silenceAlert` / `quickSilenceAlert` / `resolveAlert` / `falsePositiveAlert`
- 批量：`batchAcknowledge` / `batchResolve` / `batchSilence` / `batchFalsePositive` / `batchTransfer` / `batchUpdateRootCause`
- 组查询：`queryAlertGroups`
- 枚举：`getResourceTypeEnum` / `getSeverityEnum` / `getMonitorEventTypeEnum(resourceType?)` / `getStatusEnum` / `getFalsePositiveReasonEnum`

### `src/resources/alert-policy.ts`（≈31 行，前缀 `/api/v1/alert-policies`）

- `getAllPolicy({ enabledOnly?: boolean })` / `createPolicy` / `updatePolicy(policyId)` / `deletePolicy(policyId)`
- `getPolicyDetail(policyId)` / `getPolicyTemplate()` / `getDefaultPolicy()` / `setDefaultPolicy(policyId)`
- `searchProjectPolicy(params)`

---

# 二、Event（告警事件）`event/index.vue`（1696 行 🔴）

## 2.1 Overview 卡片

页面顶部四张卡片：
- 我待处理（my-pending）
- 我今日新增（my-today-new）
- 全部待处理（all-pending）
- 今日新增（today-new）

卡片在 mount 时一次性拉取（`hideLoading: true`），**没有自动刷新**。

## 2.2 筛选

- 基础：来源（resourceType）、资源名、事件 ID
- 展开：事件类型、事件状态、严重度、批次时间区间、Owner、最近操作人、"我负责的"

## 2.3 列表（卡片化布局，非传统表格）

每条事件卡片：
- 左侧：严重度 tag + 资源名 + 状态徽标 + 业务 tag
- 中部：**根据 status 动态展示按钮链**（见下节）
- 元信息行：首次触发时间、来源、监控事件、DQ 元数据（仅 DATA_QUALITY）、通知次数、升级信息（后端下发的人类可读串，例如"20 分钟未认领升级至 王蕊(ruiwang1)"）
- 日志片段（可点展开 → `log.vue` / `data-quality-log-modal.vue`）
- 底栏：事件 ID、Owner、最近操作人

## 2.4 支持的来源（resourceType）

| 枚举 | 说明 |
| --- | --- |
| `DOLPHIN_PROCESS` | Dolphin 流程 |
| `REALTIME_JOB` | 实时作业 |
| `INTEGRATION_REALTIME` | 实时同步 |
| `INTEGRATION_OFFLINE` | 离线同步 |
| `DATA_QUALITY` | 数据质量 |
| `CUSTOM` | 自定义 |
| `OFFLINE_TASK` / `DATA_ASSET` / `REALTIME_TASK` | 其他 |

## 2.5 事件状态机

| 状态 | 显示按钮 |
| --- | --- |
| `FIRING`（触发中） | 认领 / 屏蔽 / 误报 / 解决 |
| `PROCESSING`（处理中，已认领） | 解决 / 误报 |
| `SILENCED`（已屏蔽） | 解决 / 误报 |
| `TRANSFERRED`（已转交） | 认领 / 解决 |
| `RESOLVED`（已解决） | 显示解决类型（MANUAL / AUTO）与恢复时间 |
| `FALSE_POSITIVE`（误报） | 认领 |

## 2.6 批量操作条

底部固定栏，选中至少 1 条事件后显示（上滑动画）：
- 批量认领 / 批量屏蔽 / 批量误报 / 批量解决
- 分页或筛选变化会清空选中

## 2.7 事件详情 `event/modal/detail.vue`（1082 行）

- 完整时间线（触发 → 认领 → 屏蔽 → 转交 → 解决）
- DQ 规则详情（`detailInfo.qualityRuleDetailsJson` 是内联 JSON 字符串，parse 后展开）
- 日志 Tab

---

# 三、Landing（告警详情公开页）`landing/index.vue`（1122 行 🔴）

### 3.1 用途

**外链可分享的单事件详情页**，通过 `hideLayout: true` 去掉主导航，供飞书 / 邮件告警里的"查看详情"链接直接打开。

### 3.2 入参 Query

| 参数 | 作用 |
| --- | --- |
| `eventId`（必填） | 事件 ID |
| `projectId`（可选） | 设置 `fintopia-project-id` 请求头 |
| `swimlaneId`（可选） | 设置 `fintopia-swim-lane-id` 请求头 |

### 3.3 布局 & 内容

- 移动端友好（也兼容桌面）
- 状态 + 严重度徽标、事件 ID
- 持续时长（d/h/m/s 自定义格式）
- 项目、来源、监控事件、级别、Owner
- DQ 元数据（若来源是 DATA_QUALITY）
- 跳转监控规则的链接（新 Tab 打开 event 列表并带筛选）
- 底部**sticky 操作条**，按 status 呈现：
  - FIRING：屏蔽 1h / 屏蔽 24h / 误报 / 认领 / 解决
  - PROCESSING：误报 / 解决
  - SILENCED：误报 / 解决
  - TRANSFERRED：解决 / 认领
  - FALSE_POSITIVE：认领

### 3.4 安全性

- 无前端鉴权，完全靠后端 JWT + 请求头校验
- projectId / swimlaneId 都以 query → header 的方式附带
- **不要在这里加敏感信息**（会作为外链发给用户）

---

# 四、Policy（通知策略）

## 4.1 列表 `policy/index.vue`（444 行）

- 过滤：名称（防抖搜索）+ 创建人
- 表格：名称（带"内置"/"默认"tag）、描述、更新时间、创建人、频控间隔、最大发送次数、开关、操作
- 操作：编辑 / 查看 / 复制 / 删除
  - **内置策略**：只读，禁止删除
  - 关闭开关：确认弹窗提示"告警可能缺失"

## 4.2 策略详情 Modal `policy/modal/detail.vue`（666 行）⭐ 跨模块核心

**只读展示**，重要性在于：

- 被 **DQC / SQL quality-drawer / SQL monitor-drawer / Matrix monitor-drawer** 四个地方引用
- DQC 使用 `defineAsyncComponent(() => import('@/pages/alert/center/policy/modal/detail.vue'))` 懒加载
- 其他模块直接 import
- 调用方式：**命令式** `ref.value?.showModal(policyId)`（不暴露 props）
- Modal 内部调 `getPolicyDetail(policyId)` 拉数据

**对接手的影响**：改这个 Modal 的对外接口（`showModal` 签名、内部 API 结构）必须同步 4 个上游引用点。

## 4.3 策略编辑 Modal `policy/modal/edit.vue`（1366 行 🔴）

三步向导：

### Step 1 - 基础信息
- 名称（必填，中英文/数字/下划线，≤128）
- 描述

### Step 2 - 告警通知规则（核心）

按严重度（ERROR / WARN）× 接收人类型（taskOwner / specified / onCall）× 通道（WECOM_GROUP / PHONE）矩阵配置：

- **taskOwner**（任务 Owner 自动通知）：enabled + channels
- **specified**（手动指定人）：enabled + ldaps[] + channels
- **onCall**（值班组）：enabled + onCallGroups[] + channels

**强制通道规则** `FORCED_CHANNEL_RULES`（硬编码）：
- ERROR + onCall：WECOM_GROUP 强制开、PHONE 强制开
- WARN + onCall：WECOM_GROUP 强制开、PHONE 强制关

通过 `applyForcedChannelRules()` / `getChannelState()` 应用与校验。

### Step 3 - 发送策略

- **频控**：`enableFrequencyControl` + `frequencyIntervalMinutes`（1-1440）+ `maxSendTimes`（1-100）
- **静默窗口**：`enableSilentWindow` + `silentStartTime` / `silentEndTime`（HH:mm），`end < start` 自动识别为"次日"
- **通知升级**：`enableEscalation` + `escalationConfig[]`（最多 3 级），每级 `delayMinutes` / `receiverLdaps[]` / 可选 `channels[]`

## 4.4 策略 Schema

```ts
interface Policy {
  id: number;
  name: string;
  description: string;
  projectId: number;
  isDefault: boolean;
  isBuiltin: boolean;
  enabled?: boolean;

  severityLevelConfig: {
    _v: 2;                      // schema 版本
    ERROR: LevelConfig;
    WARN: LevelConfig;
  };

  // 发送策略
  enableFrequencyControl: boolean;
  frequencyIntervalMinutes: number;
  maxSendTimes: number;
  enableSilentWindow: boolean;
  silentStartTime: string;
  silentEndTime: string;

  // 通知升级
  enableEscalation: boolean;
  escalationConfig: Array<{
    level: number;
    delayMinutes: number;
    receiverLdaps: string[];
    channels?: string[];
  }>;
}

interface LevelConfig {
  taskOwner: { enabled: boolean; channels: string[] };
  specified: { enabled: boolean; ldaps: string[]; channels: string[] };
  onCall: { enabled: boolean; onCallGroups: any[]; channels: string[] };
}
```

提交前会经 `normalizeSeverityLevelConfig()` 填默认 + `buildSeverityLevelPayload()` 清理掉被禁用的接收人配置。

---

# 五、跨模块集成

## 5.1 共享 Hook：`src/hooks/use-policy-options.ts`

```ts
export function usePolicyOptions() {
  const policyOptions = ref<NotifyPolicyOption[]>([]);
  const defaultPolicyId = ref<number | null>(null);

  async fetchPolicyOptions() {
    // GET /api/v1/alert-policies?enabledOnly=false
    // 返回 { id, name, isDefault, enabled }
  }
}
```

**消费方**：
- DQC `monitor/rule-config/add-monitor/index.vue`
- SQL `sql-main/modal/quality-drawer/index.vue`
- SQL `sql-main/modal/monitor-drawer/index.vue`
- Matrix `monitor-drawer/index.vue`

## 5.2 共享组件：`src/components/notify-policy-select/index.vue`

- 自定义 Select，显示 name + "默认"/"内置"/"启用" tag
- v-model 策略 id，props 接受 `policyOptions`

## 5.3 使用模式（供接手人对照）

```vue
<script setup>
import { defineAsyncComponent, ref, onMounted } from 'vue';
import { usePolicyOptions } from '@/hooks/use-policy-options';
import NotifyPolicySelect from '@/components/notify-policy-select/index.vue';

const PolicyDetailModal = defineAsyncComponent(
  () => import('@/pages/alert/center/policy/modal/detail.vue')
);

const policyDetailModalRef = ref();
const { policyOptions, defaultPolicyId, fetchPolicyOptions } = usePolicyOptions();

onMounted(() => fetchPolicyOptions());

const viewDetail = (id: number) => policyDetailModalRef.value?.showModal(id);
</script>
```

## 5.4 与 schedule / data-develop 的关系

- 事件来源包含了 schedule（DOLPHIN_PROCESS）、data-develop（OFFLINE_TASK）、matrix（INTEGRATION_*）、dqc（DATA_QUALITY）
- 这些模块并不直接调 alert 接口，都是后端数据链路：各模块产生的失败/违反规则 → 走后端事件流 → Alert 中心承接展示

---

# 六、常量与核心逻辑文件

## 6.1 `policy/constant/severity-level.ts`（288 行）

模块最重要的策略配置逻辑：

- `FORCED_CHANNEL_RULES` — 强制通道矩阵
- `normalizeSeverityLevelConfig()` — 填充默认值，防止 undefined
- `applyForcedChannelRules()` — 按矩阵强制勾选/禁用
- `getChannelState()` — 给 UI 返回 `{ checked, disabled }`
- `buildSeverityLevelPayload()` — 提交前清理禁用的接收人配置

改策略结构务必改这一份，避免 detail 和 edit modal 之间漂移。

## 6.2 `policy/constant/options.ts`（78 行）

表格列定义、渠道 Map（WECOM_GROUP / PHONE）、静默时长预设（1h / 24h 等）

## 6.3 `event/constant/options.ts`（48 行）

Overview 卡片枚举、执行类型常量

---

# 七、⚠️ 重点风险与陷阱

## 7.1 大文件集中 🔴

| 文件 | 行数 |
| --- | --- |
| `event/index.vue` | **1696** |
| `policy/modal/edit.vue` | **1366** |
| `landing/index.vue` | **1122** |
| `event/modal/detail.vue` | 1082 |
| `policy/modal/detail.vue` | 666 |
| `policy/index.vue` | 444 |
| `event/modal/batch-resolve.vue` | 405 |
| `event/modal/log.vue` | 297 |
| `policy/constant/severity-level.ts` | 288 |
| `landing/modal/resolve.vue` | 285 |
| `event/modal/resolve.vue` | 280 |
| `event/modal/batch-silence.vue` | 210 |
| `event/modal/data-quality-log-modal.vue` | 198 |

## 7.2 策略详情 Modal 的命令式 API

- `ref.showModal(policyId)` 是契约入口，无 props 暴露
- 4 个上游引用点，任意变更必须同步
- 建议：加 TS 类型 export（`defineExpose({ showModal })`）并标注版本

## 7.3 Event 列表无实时刷新

- Overview + 列表都是手动查询
- 没有 polling / WebSocket
- 高频告警场景用户会看到过期数据
- 建议：至少加 30s/1min polling，或 SSE 增量推送

## 7.4 策略缓存不一致

- 4 个上游各自调 `usePolicyOptions` 拉一次
- 策略编辑后不通知上游刷新
- 表现：上游下拉显示被删 / 改名的旧策略
- 建议：`usePolicyOptions` 换成全局 store + 变更广播

## 7.5 强制通道规则硬编码

- `FORCED_CHANNEL_RULES` 写在前端
- 后端规则调整后前端没同步会出现"前端勾选不到、实际却发了"的错觉
- 建议：改成后端下发（`getPolicyTemplate` 里带规则）

## 7.6 Landing 外链安全

- 无前端鉴权，完全靠后端 header（projectId / swimlaneId）
- **严禁**把权限数据 / 敏感业务字段塞进 landing
- 点击跳转监控规则的链接会在新 Tab 带筛选，链接本身可能泄露 DQ 指标名，评估是否接受

## 7.7 DQ 规则 JSON 大体积

- `detailInfo.qualityRuleDetailsJson` 是字符串化 JSON，单条可能很大
- 列表页不拉全，详情页 parse 时可能卡
- 建议：server-side 分段返回 + 前端懒展开

## 7.8 告警状态 / 枚举与后端耦合

- `FIRING / PROCESSING / SILENCED / TRANSFERRED / RESOLVED / FALSE_POSITIVE` 硬编码
- `WECOM_GROUP / PHONE` 渠道硬编码
- resourceType 9 种硬编码
- 后端加枚举不同步前端会走默认分支
- 建议：所有 switch 加 default 容错 + 上线前做 enum 对齐 checklist

## 7.9 升级文案来自后端

- 事件卡片显示的"20 分钟未认领升级至 XXX"是后端下发的
- 前端只 render，没有解析
- 改升级规则时注意后端文案格式

## 7.10 策略字段 `_v: 2`

- `severityLevelConfig._v` 是 schema 版本号，当前 = 2
- 老版本策略（`channelConfig + receiverConfig`）已通过 `normalizeSeverityLevelConfig` 兼容
- 未来版本升级需要在这里补充版本变更说明

## 7.11 批量操作选中态

- 分页或筛选改变自动清空选中，但**切换 tab / 刷新 overview** 时不清空
- 容易误操作
- 建议：重要操作前再确认选中集合

## 7.12 静默窗口跨日

- `silentEndTime < silentStartTime` 自动标"次日"
- 没有显式时区
- 跨时区团队可能误解
- 建议：在 UI 加时区提示

---

# 八、给接手人的建议优先级

## 第一周：上手
1. 跑完一次事件全生命周期：触发（由下游产生）→ 认领 / 屏蔽 / 转交 / 解决 / 误报
2. 在 Policy 列表上完成创建 / 编辑 / 复制 / 删除策略
3. DQC 侧挂一个监控，选刚建的策略，打开详情 Modal，看懂跨模块调用
4. 通读 `severity-level.ts` 和 `use-policy-options.ts`
5. 用浏览器在 /alert/center/landing?eventId=... 直接访问看效果

## 第一月：止血
1. 详情 Modal 暴露 `defineExpose` 的类型签名（防 4 处上游漂移）
2. `usePolicyOptions` 改为 store + 变更广播
3. Event 列表加 30s polling
4. 强制通道规则从 `FORCED_CHANNEL_RULES` 改由后端 `getPolicyTemplate` 下发
5. `event/index.vue` 拆：筛选 / 卡片渲染 / 状态动作 / 批量条 四块

## 第二季：结构性重构
1. 拆 `policy/modal/edit.vue`（1366 行）：Basic / Severity / Delivery 三步各为子组件
2. 拆 `event/modal/detail.vue`（1082 行）：Timeline / DQ 规则详情 / 日志 Tab
3. `landing/index.vue` 移端/桌面拆 viewport 适配
4. 事件 schema 引入版本化（参考 policy 的 `_v`）
5. 考虑引入 SSE / WebSocket 承载实时事件流

---

# 九、关键联系人

- **产品**：王蕊 / 袁超琪 / 赵一鸣
- **后端**：
  - 盛思宇 — **alert 监控运维 / 三方调度平台**（主负责）
- **上游事件源**：
  - 陈伟（dqc 监控）
  - 韩帅（schedule / data-develop）
  - 李仟姗（matrix 数据集成）
- **测试**：彭丽娅 / 杨天雅

（对齐交接主文档的"关键联系人"。事件源相关问题按来源找人，策略/通道/升级机制找盛思宇）
