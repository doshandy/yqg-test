> 本文档面向 **安全中心（cerebro）** 模块的接手人。覆盖权限申请 / 查询 / 回收 / 续期 / 用户组 / 审批记录的完整链路，以及与 OA 审批流联动的外部只读页（auth-outer / renewal-outer）。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/DmcNwJ4nNikdvikPzVYcLk1En7f

# 一、模块概览

Cerebro（安全中心）是 `cn-data-pilot` 下的 **数据资产权限系统**，路由前缀 `/cerebro`。模块总量 ≈ 4900 行，最大单文件 `auth-detail/index.vue`（951 行）与 `auth/index.vue`（759 行）。

**Owner**：宋晓峰(后端 / 数据安全)

业务上分五大块：
1. **我的权限（self）** — 普通用户查看自己当前 / 历史权限、发起续期
2. **权限管理（auth）** — 管理员按"资源"或"获权方"两种视角管理全量权限，支持批量回收
3. **申请权限（auth-detail）** — 权限申请三步向导（**DQC test-detail 无权限时会跳到这里**）
4. **用户组（user-group + group-detail）** — 组 CRUD + 成员管理 + 组级权限
5. **审批记录（audit）** — 查看自己发起的 OA 工单
6. **外部链接（auth-outer / renewal-outer）** — `hideLayout: true` 的只读页，**供 OA 审批人从飞书/邮件跳进来看详情**

## 1.1 一级路由（`src/routers/module/cerebro.ts`）

| 路径 | 路由名 | 说明 |
| --- | --- | --- |
| `/cerebro` | Cerebro | 壳，redirect → self |
| `/cerebro/self` | self | 我的权限（默认页） |
| `/cerebro/auth` | auth | 权限管理（管理员） |
| `/cerebro/auth/detail-resource` | authDetailResource | 资源权限详情（hidden） |
| `/cerebro/auth/detail` | authDetail | 申请权限（hidden） |
| `/cerebro/user-group` | userGroup | 用户组管理 |
| `/cerebro/group-detail` | groupDetail | 用户组详情（hidden） |
| `/cerebro/audit` | audit | 审批记录 |
| `/cerebro/auth/auth-outer/:id` | cerebroAuditOuter | 外部审批只读页（hideLayout） |
| `/cerebro/auth/renewal-outer/:id` | cerebroRenewalOuter | 外部续期只读页（hideLayout） |

## 1.2 目录结构

```
src/pages/cerebro/
├── index.vue                 # 壳（37 行）+ 欢迎 notice
├── self/                     # 我的权限（469 行）
├── auth/                     # ⭐ 权限管理 双视角（759 行）
├── auth-detail/              # ⭐ 申请权限（951 行，3 步向导）
│   └── constant/options.ts
├── detail-resource/          # 资源权限详情（425 行）
├── user-group/               # 用户组管理（353 行）
│   └── modal/add.vue
├── group-detail/             # 用户组详情（224 行）
│   └── components/
│       ├── member-detail.vue  # 成员明细（150）
│       ├── auth-detail.vue    # 组权限明细（267）
│       └── renew-modal.vue    # 续期弹窗（187）
├── audit/                    # 审批记录（222 行）
│   └── modal/detail.vue      # 详情弹窗（134）
├── auth-outer/               # 外部审批页（179 行）
└── renewal-outer/            # 外部续期页（177 行）
```

## 1.3 后端接口

资源文件：`src/resources/cerebro.ts`（≈52 行，前缀 `/api/security`）

21 个接口，分组如下：

### 权限查询
- `get_my_permissions` — 我的权限
- `get_tables_by_resource` — 按资源查所有授权
- `get_tables_by_operation_object` — 按获权方查
- `get_databases` / `get_tables` — 下拉选项

### 权限动作
- `apply_permissions` — 提交申请（POST）
- `prolong_permissions` — 续期（POST，支持批量）
- `revoke_permissions` — 回收（POST，支持批量）

### 用户组
- `user_group/get_all` — 全部组（下拉）
- `user_group/get_by_member_name` — 我加入的组
- `user_group/query` — 组列表查询
- `user_group/create` — 创建
- `user_group/delete_by_group_id` — 删除
- `user_group/get_members` — 成员列表
- `user_group/remove_member` — 移除成员
- `user_group/get_all_users` — 全部用户（下拉）

### 审批 / OA
- `get_oa_records` — 我的工单列表
- `get_oa_record` — 单个工单详情

### 其他
- `is_admin` — 是否管理员
- `getInfoByCompanyEmail` — 按邮箱查用户

---

# 二、我的权限 `self/index.vue`（469 行）

## 2.1 功能

- 表格列：资源名、类型（HiveTable / StarrocksTable）、访问类型（Read / ReadWrite）、Owner、申请时间、到期时间、获权方类型 / 名称
- 切换 Tab：**当前权限 / 历史权限**（历史模式无续期 / 回收）
- 过滤：资源类型、资源名、获权方类型
- 顶部按钮："申请权限" → 跳 `/cerebro/auth/detail`
- 行操作：续期
- 批量：批量续期

## 2.2 续期规则（重要）

**续期按钮禁用条件**：
- 获权方类型是 Project（永久权限，不续期）
- 状态不是 `InUsing`
- **到期时间距今 > 14 天**（硬编码）

续期弹窗：时长 30/90/180/270/360 天 + 申请原因（必填） → `prolongAuth({ ids, applyReason, proLongDays })`

## 2.3 注意事项

- Project 权限显示"永久"，不要默认给续期入口
- "到期距今 > 14 天"按钮禁用但**没有提示**，用户容易困惑

---

# 三、权限管理 `auth/index.vue`（759 行 🔴）

## 3.1 管理员校验

页面加载时调 `authUser()`。非管理员渲染 `Result status="403"`；检查期间显示 `Spin`。

## 3.2 双视角（Radio 切换）

### 模式 1：按资源查看
- 筛选：资源类型（必填）+ 数据库 + 资源名
- 表格列：序号、资源类型、资源名、Owner、操作
- 操作："查看详情" → `/cerebro/auth/detail-resource?database=&tableName=&resourceType=`
- API：`getTablesByResource`

### 模式 2：按获权方查看
- 筛选：获权方类型（User / Project / Group）+ 获权方（User 是输入框，其他是下拉）+ 资源类型 + 资源名
- 表格列：序号、资源类型、资源名、访问类型、获权方、到期时间、操作
- 批量勾选 + **批量回收**（`revokePermissions({ ids, revokeReason, endTime })`）
- 行回收按钮：Project 或 非 InUsing 禁用
- API：`getGroupAuth`

---

# 四、申请权限 `auth-detail/index.vue`（951 行 🔴）

> 三步向导，DQC test-detail 无权限时会跳进来。**整个模块最复杂的页面**。

## 4.1 Step 1 — 选择获权方

- **获权方类型**（至少选一个）：
  - `User` ✓ 个人：private，不支持任务调度
  - `Project` ✗（**目前 UI 上被 disabled**）：项目空间，生产调度
  - `Group` ✓ 用户组：组继承，部门级共享
- **获权方**（按类型）：
  - User：自动填当前用户（`Name(email_prefix)` 格式），不可改
  - Project：多选（`CommonApi.fetchProjects`）
  - Group：多选（`CerebroApi.getUserGroup`）

## 4.2 Step 2 — 选择资源（三列布局）

- 资源类型：Radio，**仅 HiveTable 可选**（其他 disabled）
- 数据库：下拉（`fetchDatabaseOptions`），默认第一项，切换时清空搜索 + 重取表
- **左列（1/3 宽）**：
  - 待添加表列表，可按关键字搜索（**500ms 防抖**，lodash.debounce）
  - max-height 450 / min-height 300，溢出滚动
  - Checkbox 多选
- **右列（2/3 宽）**：
  - 已选表 × 权限表格
  - 列：表名、Owner、描述、只读、读写
  - 批量表头 Checkbox：勾 ReadWrite 时自动勾上 Read 且 Read 禁用；取消 ReadWrite 才能取消 Read
  - 校验错误的表行：红色显示 + Tooltip 错误信息（来自 `errorTables` / `errorTablesDetail`，key: `{database}.{tableName}_{permission}`）

## 4.3 Step 3 — 申请信息

- **申请时长**：30 / 90 / 180 / 270 / 360 天（默认 90），**全局生效**，会同步到每个表的 `duration`（当前版本没有单独设置每个表时长的 UI）
- **申请原因**：TextArea（必填，不允许纯空白），auto-size 3-5 行

## 4.4 提交

```
validate(applyForm) + validate(resourceForm) + validate(reasonForm)
→ 至少 1 张表 + 至少 1 个权限勾选
→ 组装 payload：
   {
     resource: 'Hive',
     resourceType: 'HiveTable',
     duration, applyReason,
     operationObjectType,
     applyTables: [{ applyDatabase, applyTable, applyPermissions, duration }],
     applyUser / users / projects / groups
   }
→ CerebroApi.apply(postData)
→ 成功：跳 /cerebro/self
→ 部分失败：把错误表写入 errorTables，滚到顶部，高亮展示
```

## 4.5 URL Query 参数

- `?applyType=group` → 预选 Group 获权方类型
- **注意**：DQC 当前的 `openCerebroPage()` 传的是空 `query: {}`（没做 resource 预填）

---

# 五、资源权限详情 `detail-resource/index.vue`（425 行）

从 `auth`（按资源）的"查看详情"进入。

- Route query：`database` + `tableName` + `resourceType`
- Breadcrumb：按资源查看 > 数据表：{database}.{tableName} 数据表 详情
- 筛选：获权方类型 + 获权方
- 表格：序号、获权方类型、获权方名称、访问类型、到期时间、操作
- 操作：回收（Project 或非 InUsing 禁用）
- 批量回收：与 auth 相同（reason + endTime）
- API：`getGroupAuth`

---

# 六、用户组管理 `user-group/index.vue`（353 行）+ `group-detail/index.vue`（224 行）

## 6.1 用户组列表

- 筛选：组名、"我管理的"、"我加入的"（**默认勾选**）
- "新建用户组"按钮 **目前被 disabled**
- 表格：组ID、组名、组类型、管理员（超过 3 个显示"..."）、创建时间、操作
- 行操作：
  - 查看详情 → `/cerebro/group-detail?groupId={groupId}`
  - 删除（Popconfirm，警告"删除后可能影响任务运行"，**组类型 ≠ 数据安全 时禁用**）
- 添加组弹窗（`modal/add.vue` 208 行）：
  - 名称（regex `^[一-龥a-zA-Z0-9_-]+$`，≤128）
  - 组类型（**当前仅"数据开发"可用**）
  - 管理员（多选）
  - 描述（可选）
  - API：`createUserGroup({ groupName, groupType, adminNames, description })`

> **矛盾点**：新增只能建"数据开发"组，删除只能删"数据安全"组 — 这是历史遗留。接手可能需要和后端确认策略。

## 6.2 用户组详情

- Route query：`groupId` + 可选 `resourceName`（预填权限 tab 的搜索）+ 可选 `queryType`（决定初始 tab）
- Basic Info：组类型 / 组名 / 管理员（通过 `getAllUser` 拉 email→姓名 映射再展示）/ 创建时间
- 两个 Tab（Radio）：
  - **成员明细**：搜索 + 表格（成员名 / 加入时间 / 删除）。**数据开发类型组**禁止删除，显示"请到项目中心管理"
  - **获权明细**：搜索（防抖）+ 表格（资源 / 类型 / 访问类型 / Owner / 申请时间 / 到期时间 / 续期）+ 批量续期
- 续期弹窗（`renew-modal.vue` 187 行）：30/90/180/270/360 天 + 原因（必填，≤500，带字数）

---

# 七、审批记录 `audit/index.vue`（222 行）

## 7.1 功能

- 只显示当前用户的申请（从 user store 拿 `currentUserMail`）
- 表格列：工单ID、工单内容（逗号拼接表名）、申请人、发起时间、审批状态、申请原因、驳回原因、操作
- 状态 `APPLY_STATUS_MAP`：
  - `OAApproving` → 审批中（蓝）
  - `OAAccept` → 审批完成（绿）
  - `OARejected` → 审批驳回（红）

## 7.2 跳转 OA

**工单ID 是外部链接**：
- Prod：`https://oa.fintopia.tech/oa/flow/detail?flowId={flowId}`
- Test：`https://oa-test.yangqianguan.com/oa/flow/detail?flowId={flowId}`
- 通过 `__STAGE__` 全局变量判断环境

## 7.3 详情弹窗（`audit/modal/detail.vue` 134 行）

- 调 `getOaDetail({ applyId })`
- 解析 `content`（JSON 字符串），渲染表格：获权方类型 / 获权方 / 库 / 表 / 访问类型 / 时长（Project 显示"永久"，否则"{days}天"）

---

# 八、外部链接页（安全重点）🔴

## 8.1 `auth-outer/index.vue`（179 行）

- Route：`/cerebro/auth/auth-outer/:id`，`hideLayout: true`
- 用途：**OA 审批人从飞书/邮件点进来看权限申请详情**
- 入参：`:id` = applyId
- 显示：
  - 申请人信息（申请人 + 状态 + 申请时间）
  - 申请权限明细（原因 + 嵌套表格：获权方/库/表/访问类型/时长）
- 数据：`CerebroApi.getOaDetail({ params: { applyId } })`
- `content` 是 JSON 字符串，直接 `JSON.parse`

## 8.2 `renewal-outer/index.vue`（177 行）

- Route：`/cerebro/auth/renewal-outer/:id`，`hideLayout: true`
- 和 auth-outer 几乎完全一样，**面向续期工单**

## 8.3 安全风险 🔴

- **前端无鉴权**：任何拿到 URL 的人都能看到完整申请详情（申请人、库/表、时长、原因）
- 依赖后端基于 applyId + 登录态校验
- `JSON.parse` 未 try-catch，content 异常会 white-screen
- `renewal-outer` 的 `getAuditInfo` 没有 try-catch，网络错误会静默失败
- **建议**：
  - 后端务必校验"当前登录用户是否属于该工单的审批链"
  - 前端加 try-catch 兜底 + 错误 UI
  - 未来引入短时 token 做链接防篡改

---

# 九、常量与工具

## 9.1 `auth-detail/constant/options.ts`（45 行）

- `ApplyTableOptions` — 申请表格列（表名 / Owner / 描述 / 只读 / 读写；申请时长列已被注释掉）

## 9.2 `group-detail/constant/options.ts`（89 行）

- 成员表格、权限表格列定义

## 9.3 `user-group/constant/options.ts`（59 行）

- 列表字段、组类型枚举

## 9.4 无集中枚举

- `'Hive' / 'HiveTable' / 'StarrocksTable'`、`'User' / 'Project' / 'Group'`、`'数据安全' / '数据开发'`、`'InUsing'`、`'OAApproving' / 'OAAccept' / 'OARejected'` 全部靠字符串
- 无 cerebro 专用 store / hook，状态散在组件里

---

# 十、跨模块集成

## 10.1 DQC 深链

- 文件：`src/pages/dqc/test/test-detail/index.vue`
- 函数：`openCerebroPage()` → 打开 `/cerebro/auth/detail`
- **当前传的是空 query `{}`**，没有把数据源/库/表预填过去
- **留给接手的优化**：把 DQC 当前选中的库/表预填到 auth-detail 的资源选择里

## 10.2 与其他模块

- 没有其他模块显式深链到 cerebro
- group-detail 页对"数据开发"组有一个 link 指向 `/project/memberTeam`

---

# 十一、⚠️ 重点风险与陷阱

## 11.1 大文件集中 🔴

| 文件 | 行数 |
| --- | --- |
| `auth-detail/index.vue` | **951** |
| `auth/index.vue` | **759** |
| `self/index.vue` | 469 |
| `detail-resource/index.vue` | 425 |
| `user-group/index.vue` | 353 |
| `group-detail/components/auth-detail.vue` | 267 |
| `group-detail/index.vue` | 224 |
| `audit/index.vue` | 222 |
| `user-group/modal/add.vue` | 208 |
| `group-detail/components/renew-modal.vue` | 187 |
| `auth-outer/index.vue` | 179 |
| `renewal-outer/index.vue` | 177 |
| `group-detail/components/member-detail.vue` | 150 |
| `audit/modal/detail.vue` | 134 |

## 11.2 外部页面安全 🔴

- auth-outer / renewal-outer 完全是"deep link + hideLayout"
- 前端零校验，一旦后端接口校验有漏洞，申请内容泄露
- `JSON.parse(content)` 未兜底，非法 JSON 白屏

## 11.3 申请链路坑点

- **Project 类型 disabled** — 用户看到选项却不能选，没有明确说明"为什么"
- **14 天续期窗口** — 距到期 > 14 天的权限不可续期但没有 Tooltip 提示
- **部分失败回显**：`errorTables` 改动后 `errorTablesDetail` key 格式是 `{db}.{table}_{permission}`，改字段名要同步
- **表权限状态跨库污染**：用户切库后再回来，`tablePermissions` 缓存还在，容易显示不该显示的勾选

## 11.4 组管理策略矛盾

- 新建仅"数据开发"
- 删除仅"数据安全"
- UI 上没有明显说明，接手前建议和宋晓峰确认业务预期

## 11.5 OA 工单 URL 环境硬编码

- Prod / Test 两套写死
- 如果 OA 系统切子域 / 新增多云环境，需要改这里
- 建议挪到 env 配置

## 11.6 审批记录 JSON 解析无兜底

- `content` / `getOaDetail` 返回的 `content` 都用 `JSON.parse`，失败直接抛
- 建议统一 try-catch + 友好降级

## 11.7 时间戳类型混乱

- 接口有时 `number`，有时字符串
- `dayjs(timestamp)` 两种都能跑但格式化可能出 "Invalid Date"
- 建议统一由后端 normalize

## 11.8 分页内选中不跨页

- `preserveSelectedRowKeys: false`（隐式）
- 批量回收 / 批量续期只能在当前页操作
- 建议：要么明确文案告知，要么开启跨页选中

## 11.9 管理员校验是异步

- `auth` 页进入先 loading，拿到 authUser 再决定渲染列表 or 403
- 大约 500ms 空窗，用户可能以为页面卡了
- 建议：骨架屏替换 spin

## 11.10 DQC 深链未接完

- 现状：DQC 调 `openCerebroPage({})` 空跳
- 理想：DQC 传 `?database=X&tableName=Y&applyType=User`，auth-detail 预填 Step 2 的表
- 接手后可考虑打通

## 11.11 续期固定 5 档

- 30/90/180/270/360 硬编码在多个组件
- 如果调整策略需要改 4+ 处
- 建议：集中到 constant

## 11.12 组管理员展示的"..."截断

- 超过 3 个管理员显示 "..." + Tooltip 完整列表
- Tooltip 文案长时可能超出可视区域
- 不严重，但要注意跨端显示

---

# 十二、给接手人的建议优先级

## 第一周：上手
1. 分别用普通用户 + 管理员账号跑完：
   - self：查看当前/历史权限、发起续期、批量续期
   - auth：按资源/按获权方两种查询，批量回收
   - auth-detail：User 模式 + Group 模式两次申请（User 尝试多表）
   - user-group + group-detail：查看 / 搜索 / 删除成员 / 组续期
   - audit：发起申请后审批前 / 审批后两个状态
2. 用浏览器直接访问 `/cerebro/auth/auth-outer/:id` 和 `/cerebro/auth/renewal-outer/:id`，理解外部页的呈现
3. 通读 `src/resources/cerebro.ts` 21 个接口 + `auth-detail/index.vue`
4. 和宋晓峰对齐：Project 禁用的原因、数据安全/数据开发组类型策略矛盾、OA 审批链规则

## 第一月：止血
1. 外部页安全加固：try-catch 兜底 + 后端授权校验 review
2. DQC 深链打通：DQC 传库表参数，auth-detail 预填
3. 集中 cerebro 相关枚举到 `src/pages/cerebro/constant/`（资源类型、获权方类型、状态、组类型、续期档位）
4. 管理员异步校验换骨架屏
5. OA URL 挪到环境变量

## 第二季：结构性重构
1. 拆 `auth-detail/index.vue`（951 行）：Step1/Step2/Step3 各独立组件 + 一个协调器
2. 拆 `auth/index.vue`（759 行）：按资源 / 按获权方两个视角独立组件 + 一个壳
3. 用户组"新建仅数据开发 / 删除仅数据安全"的历史矛盾清理
4. 考虑 Pinia store 承接 `policyOptions` / `groupOptions` / `projectOptions` 等通用选项（减少各页重复 fetch）
5. 外部页补错误态 + 加权限校验指示

---

# 十三、关键联系人

- **产品**：王蕊 / 袁超琪 / 赵一鸣
- **后端**：
  - **宋晓峰 — cerebro 数据安全（主负责）**
- **上游联动**：
  - 陈伟（dqc 无权限跳转）
- **OA 工单流程**：找 宋晓峰 对齐
- **测试**：彭丽娅 / 杨天雅

（对齐交接主文档的"关键联系人"。安全相关问题首选宋晓峰，OA 流程变更一并）
