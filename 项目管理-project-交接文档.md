> 本文档面向 **项目管理（project）** 模块的接手人。当前模块非常轻量，只有一个页面（成员管理），但它是**项目级 RBAC 的唯一入口**，且被 cerebro 用户组（"数据开发"类型组）的管理链路外链依赖。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/C5i5wIBWFiuYvSk3WMLcuU98nqg

# 一、模块概览

Project（项目管理）是 `cn-data-pilot` 下的 **项目级成员 / 角色管理** 子系统，路由前缀 `/project`。目前只有一个页面（成员管理），单文件 851 行。

**Owner**：韩帅（data-develop / schedule / publish / **project** / note 后端主负责）

业务主线：
1. **成员管理** — 管理员专属页面；通过 Transfer 穿梭框添加成员、按角色批量增删、角色编辑、移出项目
2. **跨模块外链** — cerebro "数据开发" 类型的用户组会提示用户跳转到 `/project/memberTeam` 管理成员（见 cerebro 交接文档 6.2 节）

## 1.1 一级路由（`src/routers/module/project.ts`）

| 路径 | 路由名 | 页面 | 说明 |
| --- | --- | --- | --- |
| `/project` | Project | `pages/index.vue` | 壳，redirect → MemberTeam |
| `/project/memberTeam` | MemberTeam | `pages/project/member/index.vue` | 成员管理（默认 & 目前唯一子页） |

MemberTeam 启用 `runtimeLayoutConfig: { contentStyle: { margin: 0 }, showBreadcrumb: false }`。

## 1.2 目录结构

```
src/pages/project/
└── member/
    └── index.vue   # 成员管理（851 行）
```

## 1.3 后端接口

资源文件：`src/resources/member.ts`（≈18 行，两套 prefix 混用）

| 接口 | 说明 |
| --- | --- |
| `GET  /api/matrix/common/departments` | 部门下拉 |
| `GET  /api/matrix/common/departmentMembers` | 部门全体成员（加成员弹窗用） |
| `GET  /api/jarvis/admin/project/user/isAdmin` | **当前用户是否管理员** |
| `GET  /api/jarvis/admin/roles` | 角色全量（多选下拉用） |
| `POST /api/jarvis/admin/project/users` | 项目成员列表查询（按 roleCodes / userEmails 过滤） |
| `POST /api/jarvis/admin/project/users/add` | 添加成员（无角色） |
| `POST /api/jarvis/admin/project/users/remove` | 移出项目 |
| `POST /api/jarvis/admin/project/users/role/add` | 批量新增角色（对指定邮箱） |
| `POST /api/jarvis/admin/project/users/roles/remove` | 批量删除角色 |
| `POST /api/jarvis/admin/project/user/roles/edit` | 单用户角色编辑（覆盖式） |

> **混用两套 prefix**：部门数据走 `matrix/common/*`，其他走 `jarvis/admin/*`。加新接口时注意别放错。

---

# 二、页面实现 `project/member/index.vue`（851 行）

## 2.1 三态渲染

组件顶层 `v-if / v-else-if / v-else` 三态：

- `isAdmin === null`：加载中，显示 `Spin` 大号 loader（"加载中..."）
- `isAdmin === false`：`Result status="403"`，提示"无权限访问"
- `isAdmin === true`：正常渲染搜索栏 + 表格 + 5 个 Modal

## 2.2 projectID 来源

```
routeProjectId = route.query.projectId
storageProjectId = ProjectStorage.get()
projectID = routeProjectId || storageProjectId || ''
```

优先 URL 参数，其次本地 storage，最后空字符串。**所有接口调用都带 projectId**。

## 2.3 搜索

两个多选筛选：
- **用户角色**：`roleEnum`（从 `getRole` 拉取）
- **用户名**：`userEnum`（从当前表格数据动态生成，空搜索先触发一次才有选项）

按钮：查询 / 重置（重置只清 searchForm 再刷新列表）。

## 2.4 表格

3 列：
- 用户名
- 用户角色（flex tag 列表，按 `roles[].name` 渲染 Tag）
- 操作（编辑角色 / 移出项目；固定在右侧）

分页：`[10, 20, 50, 100]`，带总数提示 `"${range[0]}-${range[1]}行，共 ${total} 行"`。

行选择：`selectedRowKeys`（email 作 key）。

## 2.5 工具栏

- "+ 添加成员" 按钮（固定左边）
- 批量动作（选中 ≥ 1 条时激活）：
  - 批量新增角色（`handleBatchAddRole`）
  - 批量删除角色（`handleBatchDeleteRole`）
  - 批量移除项目（`handleBatchRemove`）
  - 选中计数提示："已经选中 N 条"

## 2.6 5 个 Modal

### 2.6.1 批量新增角色 `groupAddMemberVis`

- 用户多选（来自当前项目已有成员）
- 新增角色多选（来自全量角色）
- Alert："对以下用户批量新增角色，不影响用户已有角色"
- 提交走 `groupAddMember`

### 2.6.2 编辑角色 `editMemberVis`

- 用户**只读**（单个 email）
- 角色多选（覆盖式，用户当前所有角色会被替换）
- 提交走 `editUser({ emails: [email], roleCodes })`

### 2.6.3 批量删除角色 `groupDeleteMemberVis`

- 用户多选
- 删除角色多选
- Alert："批量删除以下用户的角色，不影响用户已有的其他角色"
- 提交走 `groupDeleteUser`

### 2.6.4 添加成员 `addMemberVis`（1400px 宽）

**最复杂的一个**，基于 Ant Design Vue `Transfer` + 自定义 Table 渲染：

- 左：全部用户（`getDepartmentMembers` 拉全部门人）
- 右：空间用户（当前项目已有）
- 自定义 row：整行点击切换勾选（排除已禁用）
- 禁用：已经在当前项目里的用户（`currentUserList.includes(item.key)`）
- 两侧独立分页：`leftPagination` / `rightPagination`（各自 10 条 / 页）
- 搜索：走 `filterTransferOption`（`option.name.indexOf(inputValue) > -1`，**区分大小写**）
- 确定：把最终 targetKeys 发 `addMember({ emails, projectId })`
- 关闭：清空 targetKeys + realSelectedKeys + transferKey 自增强制重建

### 2.6.5 移出项目 `removeVis`

- Alert（warning）："确定要将以下用户移出项目吗？"
- 用户列表：按 12 列栅格展示标签
- 提示："用户可以申请空间权限再次加入项目，管理员也可手动添加该用户"
- 入口：单用户行"移出项目"按钮 / 批量"批量移除项目"
- 提交走 `removeUser({ projectId, emails })`

---

# 三、跨模块集成

## 3.1 cerebro 外链

`cerebro/group-detail`（用户组详情）如果 `groupType === '数据开发'`：
- 成员明细 Tab 会禁用"删除成员"按钮
- 显示提示 "管理成员请前往项目中心进行添加"
- 链接到 `/project/memberTeam`

## 3.2 ProjectStorage 依赖

与 data-map、cerebro、alert、dqc 等多模块相同，`ProjectStorage.get()` 提供项目上下文。

## 3.3 无其他跨模块依赖

本页仅承担纯粹的成员/角色 CRUD，不涉及数据发布、任务、告警等。

---

# 四、⚠️ 重点风险与陷阱

## 4.1 `isAdmin` 异步校验 UX

- 进入页面先 fetch，期间显示大号 Spin
- 非管理员会直接显示 403 Result
- 首屏短暂白屏 + spin → 403，**切换感略突兀**
- 建议：用 skeleton 或 layout 内置校验

## 4.2 角色编辑是**覆盖式**

- `editUser` 传的 `roleCodes` 是完整角色列表
- 用户原有角色会被**整个替换**
- 如果 UI 上漏勾一个旧角色就会静默丢
- 建议：编辑时预填"当前角色"已经做了（`handleEditUser` 拉 `record.roles[].code`），但仍要小心不要误操作

## 4.3 "用户名"搜索依赖表格数据

- `userEnum` 由当前 `tableData` 动态生成
- 首次进入没有 tableData 时下拉为空
- 管理员进入会默认调 `fetchTableData` 解决这个问题
- **如果 fetchTableData 失败，userEnum 会一直空**，搜索不可用

## 4.4 Transfer 搜索区分大小写

- `filterTransferOption` 用 `option.name.indexOf(inputValue) > -1`
- 英文名搜索要精确大小写
- 建议：改成 `toLowerCase` 比较（与 `filterUser` 一致）

## 4.5 两套 API prefix 混用

- `/api/matrix/common/*`（部门）
- `/api/jarvis/admin/*`（项目 RBAC 主体）
- 加新接口别放错 prefix，对应的后端团队也不同：部门走陈伟（matrix common），角色走韩帅（jarvis admin）

## 4.6 `projectId` fallback 顺序

```
route.query.projectId || ProjectStorage.get() || ''
```

- URL 不带、storage 没值时会以空字符串发请求
- 后端需要容错（否则 400 或返回全局数据）
- 建议：进页前校验一下 projectID，没值直接提示用户切项目

## 4.7 表格 row-key 是 email

- 选择 / 编辑依赖 email 唯一
- 理论上 email 不会重，但如果后端数据有残留（如重复账号）会串数据
- 建议：并入 userId 做双保险

## 4.8 Transfer 的 transferKey 自增重建

- `handleCancelAdd` 里 `transferKey.value += 1` 强制重建 Transfer 组件
- 用 `:key` 强制组件实例刷新
- 好处：解决左右分页/选中态残留问题
- 副作用：用户误关后再打开，所有状态完全丢失
- 当前体验可接受，但要知道这个"重建"存在

## 4.9 无乐观更新 / 本地缓存

- 每次操作后 `fetchTableData()` 全量刷
- 大项目（几千成员）搜索体验会卡
- 建议：改增量 / 乐观更新

## 4.10 批量操作选中态不跨页

- Ant Design Table 默认 `preserveSelectedRowKeys: false`
- 翻页会清空选中
- 当前没问题，但大项目批量时需注意文案提示

## 4.11 成员操作无确认（除移出）

- 批量新增角色 / 批量删除角色 / 编辑角色都是一次 OK 就提交
- 误操作成本不低（角色变动会影响权限、调度）
- 建议：加 "请确认：以下用户的角色将被改为 X" 的二次确认

## 4.12 `allUserList` 拉全部门成员

- `getDepartmentMembers` 一次性全拉
- 大公司可能几千 - 上万人，Transfer 搜索 + 分页压力不小
- 建议：服务端搜索 / 分页（后端若不支持，需要推动）

---

# 五、给接手人的建议优先级

## 第一周：上手
1. 用 管理员 + 非管理员 两个账号进 `/project/memberTeam`，熟悉 403 行为
2. 完整走一遍：查询 / 添加成员（Transfer）/ 编辑角色 / 批量新增角色 / 批量删除角色 / 单移除 / 批量移除
3. 和 cerebro 的"数据开发"用户组联动走一遍（从 group-detail 跳过来）
4. 通读 `resources/member.ts` 10 个接口 + `member/index.vue` 851 行
5. 和韩帅对齐角色体系（`roleCode` 全量）与权限粒度

## 第一月：止血
1. Transfer 搜索改 `toLowerCase`
2. 角色编辑弹窗加二次确认
3. projectID 空值显式拦截 + 引导切项目
4. Department Members 改为服务端搜索 / 分页
5. isAdmin 校验用骨架屏

## 第二季：结构性重构
1. 成员管理拆为：搜索组件 / 表格组件 / 5 个 Modal 子组件
2. 抽 `useMemberApi()` composable 承接 CRUD
3. 考虑引入角色组、数据权限组等二级抽象（与 cerebro 用户组联动）
4. 加成员变更审计日志
5. 支持多 Tab：成员管理 / 角色管理 / 权限审计（目前只有成员一个子页）

---

# 六、关键联系人

- **产品**：王蕊 / 袁超琪
- **后端**：
  - **韩帅 — data-develop / schedule / publish / project / note 主负责**
- **关联链路**：
  - 宋晓峰（cerebro 用户组，"数据开发"类型组与本页联动）
  - 陈伟（matrix common 部门数据）
- **测试**：彭丽娅 / 杨天雅

（对齐交接主文档"关键联系人"。项目成员 / 角色相关问题首选韩帅；"数据开发"类型组策略交叉问题找宋晓峰）
