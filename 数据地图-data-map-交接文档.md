> 本文档面向 **数据地图（data-map）** 模块的接手人。数据地图是一个基于 AI Agent 的**对话式数据探索**工具（Copilot 形态），承担找表、看详情、查血缘、解释 SQL 等场景。本文档重点覆盖聊天 / 会话 / 流式 / 分享 / 权限跳转等主线，并标注已知风险。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/S2EywEDv0ilpQ2keniHcopcvnig

# 一、模块概览

数据地图（DataMap）是 `cn-data-pilot` 下的 **AI Copilot 数据探索** 子系统，路由 `/data-map` 和 `/data-map/share`。总量 ≈ 6500 行，核心文件 `index.vue` 1453 行 + `copilot-main` 721 行 + `copilot-sidebar` 632 行 + `associate-table-modal` 556 行。

**维护人**：
- **后端**：陈伟（dataMap 后端主负责）
- **前端**：shengzhitong@fintopia.tech（路由 2026-04-15 近期修改，目前在迭代）

业务主线：
1. **Copilot 对话**：主页 `index.vue`，左侧会话历史 + 收藏，右侧消息流 + 底部输入，SSE 流式返回（流 phase：执行步骤 / 输出文本 / 交互卡片 / 后续建议）
2. **分享对话**：`share.vue`，hideLayout 的只读外链页，供跨用户分享 AI 回答
3. **联想/权限卡片**：AI 检测无权限时下发 `SHOW_PERMISSION_CARD` → 跳 `/cerebro/auth/detail`；收藏卡片 `SHOW_DATAMAP_FAVORITE_CARD` 切换收藏状态

## 1.1 一级路由（`src/routers/module/dataMap.ts`）

| 路径 | 路由名 | 页面 | 说明 |
| --- | --- | --- | --- |
| `/data-map` | DataMap | `pages/data-map/index.vue` | Copilot 对话主页 |
| `/data-map/share` | DataMapShare | `pages/data-map/share.vue` | 分享对话（hidden） |

两页都 `runtimeLayoutConfig: { contentStyle: { margin: 0 } }`。**share 没有设 hideLayout，但路由 hidden**。

## 1.2 目录结构

```
src/pages/data-map/
├── index.vue                         # ⭐ 主页（1453 行）
├── share.vue                         # 分享只读页（427 行）
├── constant.ts                       # 类型与枚举（187 行）
├── resources/
│   ├── copilot.ts                    # ⭐ Copilot API（/api/agentic/agent，48 行）
│   └── favorites.ts                  # 收藏 API（/api/agentic/platform，9 行）
├── utils/
│   └── message-parser.ts             # ⭐ SSE 流式消息装配 / Markdown 渲染（217 行）
├── components/
│   ├── copilot-main/index.vue        # ⭐ 消息列表 + 分享模式（721 行）
│   ├── copilot-main/ai-message-feedback.vue  # 点赞/点踩 + 反馈原因（472 行）
│   ├── copilot-sidebar/index.vue     # 会话历史 + 收藏侧边栏（632 行）
│   ├── copilot-footer/index.vue      # 输入 + 快捷 Action（432 行）
│   ├── think-card/index.vue          # 执行步骤折叠卡（310 行）
│   ├── generating-card/index.vue     # Markdown 渲染卡（211 行）
│   ├── done-card/index.vue           # DONE 阶段的交互卡片容器（97 行）
│   ├── user-chat-msg/index.vue       # 用户消息 + 覆盖重写 / 仅回退（243 行）
│   ├── show-permission-card/index.vue# 缺权限提示卡（184 行）
│   ├── datamap-favorite-card/index.vue# 收藏 toggle（93 行）
│   └── share-action-bar/index.vue    # 分享模式底部条（151 行）
└── modal/
    ├── associate-table-modal/index.vue  # ⭐ @ 关联表选择（556 行）
    └── share-config-modal/index.vue     # 分享链接配置（236 行）
```

## 1.3 后端接口

两份资源：

### `resources/copilot.ts`（前缀 `/api/agentic/agent`）

- **会话**：`getSessions` / `postSessions` / `getRecentSessions` / `getEarlierSessions` / `deleteSession` / `updateSession`
- **消息**：`getRecentMessages` / `postChat`（SSE）/ `cancelChat`（SSE）
- **编辑/回退（checkpoint）**：`getCheckpoint` / `acceptCheckpoint` — 用于"覆盖重写 / 仅回退"语义
- **UI 辅助**：`getQuickIntents` / `getSuggestedPrompts` / `getFeatureStatus`
- **反馈**：`feedback`（LIKE / DISLIKE + 原因）
- **分享**：`createShare`（走 `/api/agentic/session/share`）/ `getShareDetail`

### `resources/favorites.ts`（前缀 `/api/agentic/platform`）

- `listFavorites` / `toggleFavorite`

### 通用约定

- 所有请求都带自定义 header `datapilot_project_id: {ProjectStorage.get()}`
- 响应体：`res.data.body` 承载业务数据
- 三个 SSE 端点：`chat` / `action` / `chat/cancel`

---

# 二、主页 `index.vue`（1453 行 🔴）

> 整个模块最核心、也是唯一一个大型页。接手人的首要阅读对象。

## 2.1 页面布局

三列布局：**Sidebar（220-420px 可拖拽）+ 消息列表 + 输入 Footer**

- 侧边栏：
  - "新建对话"按钮
  - 最近 3 天 / 更早（分页 20/页）
  - 我的收藏（表级）
  - 每条会话右键：重命名 / 分享 / 删除
  - 拖拽条（4px，容易错过）控制宽度

- 消息列表区（`copilot-main`）：
  - 空态：欢迎页 + 建议 Prompts（`getSuggestedPrompts`）
  - 加载态：覆盖 Spin + 会话标题
  - 分享模式：Group checkbox + 底部 ShareActionBar

- 输入 Footer（`copilot-footer`）：
  - auto-size Textarea（1-5 行）
  - @ 按钮 → 打开 AssociateTableModal
  - 快速意图按钮：**找表 / 看详情 / 查血缘**
  - Stop / Send 切换

## 2.2 关键状态

```typescript
sessionId: string | undefined      // 当前会话 ID
messages: ChatMessage[]            // 消息流
inputValue: string                 // 输入框值
aiReplyLoading: boolean            // 流式中
createSessionLoading: boolean      // 建会话中
abortController: AbortController   // SSE 取消
curAiMessage: AiMessage | null     // 当前正在构建的 AI 消息
```

## 2.3 聊天链路

```
welcome 页 → 用户输入 → postSessions（未建会话时）
  → 追加 UserMessage + 空 AiMessage 骨架
  → fetch('/api/agentic/agent/chat', SSE)
  → readStream: 按 \n 切 + JSON.parse
  → 每帧走 fillAiMessageFromDelta() 填充 AiMessage
  → phase === DONE/ERROR 时终止
```

## 2.4 SSE 实现（原生 Fetch + ReadableStream）

```typescript
const response = await fetch('/api/agentic/agent/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    datapilot_project_id: getProjectId(),
  },
  signal: abortController.value.signal,
  body: JSON.stringify(postChatParams),
});
const reader = response.body.getReader();
await readStream(reader, userMessage, currentAiMessage);
```

**与项目内其他两种 SSE 模式对比**：

| 模块 | 模式 |
| --- | --- |
| data-develop/sql-ai.vue | axios `onDownloadProgress` + 正则从 `data:` 行拼 JSON |
| data-develop/submit-validate-drawer.vue | 同上，正则脆弱 |
| **data-map/index.vue** | **原生 Fetch + reader + \\n 分割 + JSON.parse + phase 终止**（**这是项目内最干净的 SSE 实现**） |

## 2.5 编辑用户消息（覆盖重写 / 仅回退）

用户消息上悬浮显示两个按钮：
- **覆盖重写**：截断后续 AI 回复 → 拉 `getCheckpoint(sessionId, requestId)` 取该 request 时代码快照 → 走 `action` SSE 重跑
- **仅回退**：只回滚到那个 checkpoint，不重新生成

两者都会**把该 user message 之后的 AI 消息从本地 messages 里剔除**，然后重新走 SSE。

## 2.6 分享

- 消息列表进入"分享模式"，用户勾选若干 message group（每 group = 一条 user + 后续 assistant）
- 底部条点"分享"→ 打开 ShareConfigModal → 选择有效期（7 / 30 / 永久）
- `createShare({ sessionId, requestIds[], title, expireDays, shareType })`
- 返回 `shareUrl`，用 Clipboard API 复制（降级 execCommand）

## 2.7 UI 细节

- 自动滚底：MutationObserver 监听 DOM 变化触发 `scrollToBottom`；用户向上滚过会关闭 `shouldAutoScroll`
- 加载历史："加载更多"按 `scrollTop <= 80px` 显现；load-more 期间 `preserveScrollForLoadMore` 置位，避免抖动
- 滚动锚点：load 前记 `scrollHeight + scrollTop`，load 后 `el.scrollTop = newHeight - oldHeight + oldTop` 还原

---

# 三、分享页 `share.vue`（427 行）

## 3.1 路由入参

- `?token=<shareToken>` 或 `?shareId=<shareId>`
- 路由虽 `hidden: true` 但**未设 hideLayout**，所以会带项目 Layout 外壳

## 3.2 流程

```
mount → getShareDetail({ token }) → 校验 status:
  'ACTIVE'  → parseFlatItems(events) 展示
  'EXPIRED' → 过期提示
  'REVOKED' → 已撤销提示
  'NOT_FOUND' → 链接不存在
```

`parseFlatItems()` 把扁平的 events 重组回 user/ai 消息，供复用 copilot-main 的卡片渲染。

## 3.3 UI

- 头部：标题 + 分享人 + 分享时间 + 有效期
- 消息流：只读，卡片复用（`readonly: true` 禁掉反馈 / 收藏 / 编辑）
- 底栏免责："内容由 AI 生成，仅供参考"

## 3.4 安全风险（重点 🔴）

- **hidden 路由不等于免鉴权**，URL 可被爬取 / 缓存
- **token 走 query string**，会进浏览器历史、服务器日志、代理日志
- 没有前端做 **iframe 检测**（可能被外站嵌入）
- 文案"分享链接仅公司内网环境可访问"，但前端零校验，全靠后端
- 建议后端：
  - token 单向短效 + 请求头带当前用户 + 校验其属于同一团队
  - 限频防暴力枚举
  - 支持 revoke 即时失效

---

# 四、消息装配 & Markdown 渲染 `utils/message-parser.ts`（217 行）

整个模块的"数据骨骼"文件，必读。

## 4.1 AiMessage 结构

```ts
listItems: [
  { renderCategory: THOUGHT_CHAIN,        content: [{ type: EXECUTION_STEP, steps: [] }] },
  { renderCategory: OUTPUT_CONTENT,       content: '', markdownContent: '' },
  { renderCategory: INTERACTIVE_CARD,     content: [] },
  { renderCategory: FOLLOW_UP_SUGGESTION, content: '', suggestions: [] }
]
```

对应四种卡片：
- **THOUGHT_CHAIN** → `think-card`
- **OUTPUT_CONTENT** → `generating-card`（Markdown）
- **INTERACTIVE_CARD** → `done-card`（内部再路由到 `show-permission-card` / `datamap-favorite-card` 等）
- **FOLLOW_UP_SUGGESTION** → 后续建议芯片

## 4.2 核心函数

| 函数 | 作用 |
| --- | --- |
| `createAiMessageSkeleton()` | 初始化空 AiMessage，四种 slot 齐备 |
| `fillAiMessageFromDelta(data, aiMessage, options)` | **按 delta 更新** aiMessage；四种 slot 分别处理；可选 `onFrontendAction` 回调处理 FRONTEND_ACTION |
| `createUserMessage(text, opts)` | 生成 UserMessage + UUID |
| `parseRawMessages(rawItems, opts)` | 从 `getRecentMessages` 的响应反解析历史消息 |
| `parseFlatItems(flatItems)` | 从 share 的扁平 events 反解析（没有 grouping） |

## 4.3 Markdown 渲染

- `marked.parse()` + 自定义 Renderer
- 代码块包一层 `.code-block-wrapper` + 语言标签 + 复制按钮
- 表格包 `.table-wrapper`
- DOMPurify 防 XSS
- 复制按钮走事件委托：`generating-card` 上 `@click="onMarkdownClick"` 检测 `.code-copy-btn`

---

# 五、常量与类型 `constant.ts`（187 行）

### 主要枚举（字符串硬编码）

```
Roles:               USER / ASSISTANT
Render Categories:   THOUGHT_CHAIN / OUTPUT_CONTENT / INTERACTIVE_CARD / FOLLOW_UP_SUGGESTION
Thought Types:       INTENT_RECOGNITION / EXECUTION_STEP / CONTEXT_READ / THOUGHT_DETAIL / ERROR
Interactive Types:   SHOW_PERMISSION_CARD / SHOW_DATAMAP_FAVORITE_CARD
Phase:               DONE / ERROR（stream 终止）
AiCardType:          think / intent-clarification / no-access / missing-context
Quick Intents:       CODE_GENERATE / CODE_EXPLAIN / CODE_FIX / CODE_COMMENT / CODE_REWRITE / CODE_OPTIMIZE
```

### 分享有效期

```
EXPIRE_OPTIONS = [
  { value: 7,    label: '7 天' },
  { value: 30,   label: '30 天' },
  { value: null, label: '永久有效' }
]
```

---

# 六、关键子组件

| 组件 | 行数 | 关键点 |
| --- | --- | --- |
| `copilot-main/index.vue` | 721 | 消息 grouping（user + 连续 ai）、分享模式勾选、Load More 滚动锚点、MutationObserver 自动滚底 |
| `copilot-main/ai-message-feedback.vue` | 472 | 点赞/点踩 + 原因收集 + 详情 textarea |
| `copilot-sidebar/index.vue` | 632 | 会话历史分组 + 分页 + 收藏区 + 右键菜单（重命名 / 分享 / 删除） |
| `copilot-footer/index.vue` | 432 | 输入 auto-size 1-5 行、快速意图、@ 触发 AssociateTableModal、Send/Stop 切换 |
| `think-card/index.vue` | 310 | 执行步骤分四类（INTENT / EXECUTION / CONTEXT / THOUGHT），生成中展开、完成后默认折叠 |
| `generating-card/index.vue` | 211 | 渲染 Markdown，含代码复制按钮事件委托 |
| `done-card/index.vue` | 97 | `INTERACTIVE_CARD` 路由到具体子卡（permission / favorite） |
| `user-chat-msg/index.vue` | 243 | 编辑模式 textarea + "覆盖重写 / 仅回退 / 取消"三按钮 |
| `show-permission-card/index.vue` | 184 | 缺权限提示 + 跳 `/cerebro/auth/detail?applyType=group`（新 Tab） |
| `datamap-favorite-card/index.vue` | 93 | 星标 toggle |
| `share-action-bar/index.vue` | 151 | 分享模式底部条：全选 / 已选计数 / 分享按钮 |
| `associate-table-modal/index.vue` | 556 | @ 关联表弹窗：库+表层级 + 搜索 + 多选 |
| `share-config-modal/index.vue` | 236 | 分享有效期选择 + 生成 URL + Clipboard 复制 |

---

# 七、跨模块集成

## 7.1 cerebro 深链

`show-permission-card` → `/cerebro/auth/detail?applyType=group`（新 Tab）

- **当前只传 `applyType=group`**，没有把库/表列表预填到 cerebro 的申请表
- 与 cerebro 交接文档中提到的"DQC 深链未接完"是同一类问题
- 建议后续打通：把缺权限的 database/table 列表带过去

## 7.2 与其他 AI 子系统的独立性

- **不**依赖 `data-develop/sql-ai`（那是 SQL 内嵌 AI）
- **不**依赖 `src/components/copilot/`（那是 lumina 对齐的 copilot 子应用）
- **不**依赖 `alert` / `cerebro` 组件
- 本模块是自成一体的 Agentic Copilot（后端 `/api/agentic/agent`）

## 7.3 storage 依赖

- `@/storage/project` — `ProjectStorage.get()` 作为请求头 `datapilot_project_id`

---

# 八、⚠️ 重点风险与陷阱

## 8.1 分享链接安全 🔴

- `hidden: true` ≠ 鉴权保护
- token 走 query string，泄露面广
- 没有 iframe 检测
- 前端对过期 / 撤销只做展示，无限频
- **建议**：后端 token 短效 + 请求头用户校验 + 限频 + 审计日志

## 8.2 SSE 健壮性（相对最好但仍有空白）

- 本模块 SSE 是项目最干净实现（Fetch + reader + JSON.parse），**但仍缺**：
  - 超时机制（后端挂起用户只能手动 Stop）
  - 心跳 / ping（连接静默断开无感）
  - buffer 无上限（理论可无限增长）
- 建议：加 max duration + 心跳 + buffer 阈值

## 8.3 大文件集中

| 文件 | 行数 |
| --- | --- |
| `index.vue` | **1453** 🔴 |
| `components/copilot-main/index.vue` | 721 |
| `components/copilot-sidebar/index.vue` | 632 |
| `modal/associate-table-modal/index.vue` | 556 |
| `components/ai-message-feedback.vue` | 472 |
| `components/copilot-footer/index.vue` | 432 |
| `share.vue` | 427 |
| `components/think-card/index.vue` | 310 |
| `modal/share-config-modal/index.vue` | 236 |

## 8.4 消息 / 性能

- 无虚拟滚动：消息多了（100+）滚动和首屏会慢
- Markdown 每次 delta 都完整 parse，大消息期间 CPU 偏高
- MutationObserver 粒度大，任何子孙变更都触发

## 8.5 状态同步

- 消息数组无去重：会话重复加载可能出现同一 requestId 两次
- `requestId` 前端生成 `uuid+timestamp`，理论冲突概率低但不绝对
- 历史分页的 page ref 切会话时手动 reset，容易漏

## 8.6 编辑/回退

- 覆盖重写先删后端（截断 checkpoint）再 SSE 重新生成
- 如果网络中断在"删除已完成但生成未开始"之间，用户看到空白消息，体验差
- 建议：加乐观回滚 + 服务端事务

## 8.7 魔法字符串

- `THOUGHT_CHAIN` / `OUTPUT_CONTENT` / `INTERACTIVE_CARD` / `FOLLOW_UP_SUGGESTION` / `FRONTEND_ACTION` / `DONE` / `ERROR` 等遍布
- 有 constant.ts 但未所有地方都 import
- 建议：全模块统一从 constant.ts 导入

## 8.8 分享的 share.vue 未设 hideLayout

- 路由只设了 `hidden: true`，页面仍然会被项目壳包住（Layout / Header）
- 如果期望外链极简视图（类似 landing），应加 `meta.hideLayout: true`
- 当前这样外部同事访问会看到 pilot 壳的导航，跳进其他模块后困惑

## 8.9 收藏接口 prefix 不同

- `copilot.ts` 走 `/api/agentic/agent`
- `favorites.ts` 走 `/api/agentic/platform`
- 两个 prefix 属于不同后端服务，加新接口时别搞混

## 8.10 @ 关联表路径仅 Hive

- `associate-table-modal` 当前默认数据源类型 HiveTable
- StarRocks 等其他源未接入
- 用户想 @ 非 Hive 表会找不到

## 8.11 feedback 反馈无频控

- 用户可反复点赞/点踩
- 后端如果做幂等校验 OK，否则可能污染统计
- 建议：节流 + 本地状态记一次

## 8.12 项目活跃变更

- 2026-04-15 shengzhitong 改了路由，**项目在快速迭代**
- 接手前建议和 shengzhitong + 陈伟 同步最新 roadmap
- 特别关注即将上线的新卡片类型 / 新 phase / 新分享能力

---

# 九、给接手人的建议优先级

## 第一周：上手
1. 跑完完整流程：
   - 新建对话 → 找表 / 看详情 / 查血缘 三个快捷意图
   - @ 关联表后再提问
   - 编辑用户消息 "覆盖重写"
   - 分享模式选几条消息 → 生成分享链接 → 打开 share.vue
   - 点赞 / 点踩 + 反馈原因
2. 通读 `index.vue` + `utils/message-parser.ts` + `resources/copilot.ts`
3. 理清 4 种 `renderCategory` × 2 种 Role × 3 种 SSE 端点的组合
4. 和 shengzhitong / 陈伟对齐近期迭代（近一周有提交）

## 第一月：止血
1. 给 share.vue 加 `meta.hideLayout: true`
2. SSE 加超时 + 心跳
3. constant.ts 常量全员对齐使用
4. `associate-table-modal` 支持 StarRocks 数据源
5. cerebro 深链补库/表预填

## 第二季：结构性重构
1. 拆 `index.vue`（1453 行）：会话管理 / SSE handler / 分享逻辑 / 路由 query 处理 各自独立成 composable
2. 消息渲染引入虚拟滚动
3. Markdown 渲染加缓存（按 output 内容哈希）
4. 分享链接安全加固：后端 token 短效 + 前端 iframe 检测 + 限频
5. 消息 store 化（Pinia）承接 `messages` / `curAiMessage` / `sessionId`

---

# 十、关键联系人

- **产品**：王蕊 / 袁超琪 / 赵一鸣（AI 场景相关）
- **后端**：
  - **陈伟 — dataMap 主负责（数据地图后端 / Agentic）**
- **前端**：
  - **shengzhitong@fintopia.tech — Copilot UI 当前活跃维护者**
- **跨模块**：
  - 宋晓峰（cerebro 权限跳转链路）
- **测试**：彭丽娅 / 杨天雅

（对齐交接主文档"关键联系人"。dataMap 产品功能变更找陈伟 / shengzhitong，权限申请链路找宋晓峰）
