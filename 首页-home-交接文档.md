> 本文档面向 **首页（home）** 模块的接手人。home 是纯展示性模块（DataPilot 欢迎页 + 404/无项目页），没有业务逻辑与 API 调用，但承担了 **应用入口 `/` 与 `/not-found` 兜底** 两个关键路由。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/RCKdwnO63iY5b4kAhjIcOWTMnvf

# 一、模块概览

Home 是 `cn-data-pilot` 下的 **展示性入口页** 子系统，仅承担"DataPilot 品牌欢迎页"与"无项目 / 404 兜底页"两个纯静态体验页。总量 ≈ 1220 行（包含大量 CSS 与粒子动画），**0 后端接口**。

## 1.1 一级路由（`src/routers/module/home.ts`）

| 路径 | 路由名 | 页面 | 说明 |
| --- | --- | --- | --- |
| `/` | Home | `pages/home/index.vue` | **应用默认入口**（hidden，无 breadcrumb） |
| `/not-found` | NotFound | `pages/home/not-found.vue` | 404 / 无项目兜底页（hidden） |

两者都启用 `runtimeLayoutConfig: { contentStyle: { margin: 0 } }` 但 **保留了项目外壳（导航 Header）**，没有 `hideLayout`。

## 1.2 目录结构

```
src/pages/home/
├── index.vue       # DataPilot 欢迎页（875 行，大部分为 CSS 动画）
└── not-found.vue   # 兜底页（346 行，"您现在尚未参与任何项目"）
```

## 1.3 后端接口

**无**。整个模块不访问任何 API。

---

# 二、欢迎页 `home/index.vue`（875 行）

## 2.1 视觉结构

```
<GlobalNotice />                   # 全局通知（来自 store/global-notice）
<canvas id="bg-canvas" />          # Canvas 粒子背景
<div class="grid-background" />    # CSS 网格背景
<div class="gradient-overlay" />   # 渐变叠加层
<div class="content-wrapper">
  <div class="slogan-box">
    <div class="logo-wrapper">     # 旋转环 + SVG Logo（含脉冲 / 能量微粒动画）
    <h1 class="title">DataPilot 数智工场</h1>
    <p class="slogan">             # 打字机效果 + 光标闪烁
    <div class="features">          # 三个特性卡片（智能数据 / 高效处理 / AI 驱动）
  </div>
</div>
<div class="mouse-light" />         # 鼠标跟随光晕
```

## 2.2 动效实现

### 2.2.1 Canvas 粒子背景

- 60 个粒子（3 种颜色：蓝 / 紫 / 白，随机分布）
- 每个粒子有基础位置、速度、尺寸
- **鼠标引力**：粒子离鼠标 < 300px 时，按反比位移朝鼠标靠近（`force = (300 - dist) / 300`）
- **粒子连线**：两粒子鼠标位移后距离 < 140px 时绘线
- 循环：`requestAnimationFrame` 驱动 `animateCanvas`
- 尺寸：`window.innerWidth × innerHeight`
- **重入坑**：窗口 resize 时防抖 150ms 再重新 `initCanvas`

### 2.2.2 打字机效果

- `typingTextContent` = `"Say hello to DataPilot! Discover the limitless potential of AI+Data."`
- 120ms/char 逐字填入 `typingText` ref
- 启动延迟：600ms
- 无循环、不会擦除重写

### 2.2.3 鼠标跟随光晕

- `mouseLight` ref 通过 CSS `top/left` 跟随
- 事件高频，用 `requestAnimationFrame` 合并（`isUpdating` + `rafId` 防并发）

### 2.2.4 鼠标点击波纹

- 每次 click 在 body 动态插入 `.ripple-effect` div
- 1s 后 `remove()` 清理自身

### 2.2.5 SVG Logo 动画

- 旋转描边 `.logo-dash`
- 脉冲核心 `.logo-pulse`
- 4 条能量轨道上各一个微粒 `<animateMotion>` 1.5s 循环

## 2.3 副作用管理

onMounted 里做 6 件事：
1. `document.body.style.overflow = 'hidden'` 禁止全局滚动
2. 监听 `mousemove`、`click`
3. `initCanvas()` + `animateCanvas()`
4. 监听 `resize`（防抖 150ms）
5. 延迟 600ms 启动打字机
6. 延迟 500ms 弹出 GlobalNotice "欢迎光临"（`duration: 0`，不自动关闭）

onUnmounted 里 **严格清理**：
- `cancelAnimationFrame(animationFrameId)` / `cancelAnimationFrame(rafId)`
- 清 typingTimer / noticeTimer / resizeTimer
- `document.body.style.overflow = ''` 恢复滚动
- 移除 mousemove / click / resize 监听

## 2.4 全局通知

```typescript
import { useGlobalNoticeStore } from '@/store/global-notice';
noticeStore.show({
  title: '',
  message: '欢迎光临',
  closable: true,
  duration: 0, // 不自动关闭
});
```

- Home 进入时触发一次
- 这是全站 GlobalNotice 组件的典型用例，**home 可能是唯一主动 show 它的页面**

---

# 三、兜底页 `home/not-found.vue`（346 行）

## 3.1 用途

- 默认展示"**您现在尚未参与任何项目**"（中性文案，非典型 404）
- 提示"请联系管理员获取项目访问权限 或 等待项目邀请通知"

## 3.2 结构

```
<div class="not-found-container">
  <div class="background-decoration">  # 3 个动画圆圈装饰
  <div class="content-wrapper">
    <h1 class="title">
      <span class="title-main">DataPilot</span>
      <span class="title-divider">·</span>
      <span class="title-sub">数智工场</span>
    </h1>
    <div class="message-card">          # ⓘ 图标 + 文案卡
    <div class="description">
    <div class="floating-elements">     # 3 个浮动元素
  </div>
</div>
```

## 3.3 视觉特征

- 绿色渐变背景（`#7FD8BE → #6CC9A9 → #5AB896`）— 与首页深蓝紫风格差异大
- 无动效逻辑，纯 CSS 动画（背景圆圈慢速浮动、装饰元素飘浮）
- `defineOptions({ name: 'NotFound' })`
- onMounted 空函数（占位）

## 3.4 进入条件

- 直接访问 `/not-found`
- 或项目路由守卫在检测到"用户无任何项目空间"时 redirect 进来（具体守卫逻辑在 `@@/plugin-layout/router` 或 `@/app.ts` 里，非本模块代码）

---

# 四、跨模块依赖

- `@/components/global-notice` — 全局通知组件（仅 home/index 用它的 `show`；其他页面大多只是 `<GlobalNotice />` 展示）
- `@/store/global-notice` — 对应 Pinia store
- **无其他跨模块依赖**

---

# 五、⚠️ 重点风险与陷阱

## 5.1 `document.body.style.overflow = 'hidden'` 全局副作用

- 欢迎页进入时禁止全局滚动
- 非常规做法：直接改 body 而不是 container
- **风险**：若 onUnmounted 没触发（比如 SPA 路由异常、热更新）会导致**其他页面也无法滚动**
- 建议：改用页面内 CSS `overflow: hidden` 或 scoped class

## 5.2 Canvas 粒子性能

- 60 粒子 + N² 连线计算 + requestAnimationFrame 满帧
- 高分辨率屏 + 低端 GPU 会占 CPU
- 没有设备性能降级（比如触屏禁用或降频）
- 建议：`prefers-reduced-motion` 媒体查询时跳过动画

## 5.3 波纹效果 DOM 泄漏风险

- 每次点击 `document.createElement('div')` + 1s 后 `remove()`
- 高频点击可能积累
- 当前 setTimeout 1000ms 相对安全，但没有上限
- 建议：max ripple count 限制（如 20）

## 5.4 打字机不可循环

- 进入页面打完一次就停
- 用户看到最后一屏只有静态文案 + 光标
- 若产品想要循环需要加 reset + 重启逻辑

## 5.5 GlobalNotice `duration: 0` 不自动关闭

- 用户不手动关会一直显示
- 跳到其他页面通知不消失（全局挂载）
- 这是预期行为（欢迎光临需要用户 acknowledge），但要注意业务新加 notice 时别滥用 duration: 0

## 5.6 resize 防抖只针对 canvas

- `handleResize` 只 reinit canvas
- 其他响应式尺寸（如 logo / feature cards）依赖 CSS viewport 单位 / flex
- 常规视口切换没问题，但超小窗口（<360px）布局会挤

## 5.7 not-found 与 home 风格迥异

- 欢迎页深蓝紫 + 粒子
- 无项目页纯绿色渐变
- 两套完全独立的 CSS，无共享 token
- 建议：引入共享色板 / design token

## 5.8 not-found 文案偏"无项目"语义

- 严格意义上它不是通用 404
- 如果要做真正的 404（路径错误）页，需要再加一页或复用此页改文案
- 目前全站 404 都会落到这个"无项目"页，**容易误解**

## 5.9 多处魔法字符串

- 粒子颜色、阈值（300 / 140 / 60）、定时器毫秒都硬编码
- 建议：顶部 constant 聚合

## 5.10 `canvas` id 硬编码

- `<canvas id="bg-canvas">` 全局 id
- 若多实例挂载会冲突（当前 home 单页无虞，但别在其他地方复用这个 id）

---

# 六、给接手人的建议优先级

## 第一周：上手
1. 直接访问 `/` 和 `/not-found` 体验视觉效果
2. 通读 `index.vue` 的 `onMounted` / `onUnmounted` 副作用清单
3. 检查 `@/store/global-notice` 的行为（home 是它的典型消费者）
4. 了解路由守卫何时 redirect 到 `/not-found`

## 第一月：止血（如果有产品排期）
1. `document.body.style.overflow` 副作用改 container scoped
2. 加 `prefers-reduced-motion` 支持，低端设备禁用粒子
3. not-found 页支持区分"无项目" vs "路径错误"两种语义
4. 粒子 / 波纹等"感官参数"抽 constant

## 第二季：结构性重构
1. 若产品希望首页承载更多入口（常用功能 / 最近访问），可把粒子动效保留为背景，在 content-wrapper 内拆组件化 widgets
2. 与 not-found 共用 design token

---

# 七、关键联系人

- **产品**：王蕊 / 袁超琪
- **前端**：
  - 该模块是纯展示，历史作者 weisun，**与业务模块负责人关联弱**
  - 通知组件（GlobalNotice）任何改动前和同事评估影响面
- **测试**：彭丽娅 / 杨天雅

（对齐交接主文档"关键联系人"。home 相关一般不会有后端联调，视觉修改可找原作者 weisun 对齐意图）
