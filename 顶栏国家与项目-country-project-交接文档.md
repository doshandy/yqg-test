> 本文档为 **跨模块专题**：整理 cn-data-pilot 顶栏的 **国家（Country）+ 项目（Project）+ 泳道（SwimLane）** 三件套的存储、状态、请求头注入、路由守卫、跨模块消费等细节，面向接手本"多租户前端框架"的开发。
>
> 飞书原文：https://fintopia.feishu.cn/wiki/XSgcwZJbLiSlRYkeKHvc3Z8Nn7b

# 一、总览

顶栏上国家 / 项目 / 泳道的切换是整个 pilot 的 **多租户基础设施**。它决定：
- 所有 API 请求的 `datapilot_project_id` / `country` / `fintopia-swim-lane-id` / `datapilot_window_id` 四个请求头
- 当前用户能看到的数据范围（项目空间）
- 当前页面的时区标注（"国内时间" / "印尼时间" 等）
- 是否需要跨域跳转（不同国家对应不同域名）
- 是否重定向到 `/not-found`（无项目场景）

涉及到的代码散落在 storage / store / components / pages/index.vue / app.ts / resources 多个目录，**总量 ≈ 1100 行**。

## 核心文件一览

| 文件 | 行数 | 角色 |
| --- | --- | --- |
| `src/storage/index.js` | 50 | 基础 Storage 类（localStorage + sessionStorage 封装 + storage event） |
| `src/storage/project.ts` | 11 | 项目 id（localStorage，key `Project`） |
| `src/storage/country.ts` | 11 | 国家 code（localStorage，key `Country`） |
| `src/storage/swim-lane.ts` | 11 | 泳道 id（sessionStorage，key `SwimLane`） |
| `src/store/project.ts` | 29 | Pinia（project + projectEnum） |
| `src/store/country.ts` | 23 | Pinia（country） |
| `src/app.ts` | 189 | 启动埋点读取国家/项目 |
| `src/pages/index.vue` | 114 | **应用壳 + 路由守卫替身**，负责首屏注入 header |
| `src/components/HeaderOtherComp.vue` | 110 | 顶栏右侧区块组装（SwimLane + Country + Project + Help） |
| `src/components/header-country/index.vue` | 107 | 国家切换（触发全页跨域 reload） |
| `src/components/header-project/index.vue` | 213 | 项目切换（拉项目列表 + 跨域跳转 + 写 header） |
| `src/components/swim-lane-input/index.vue` | 134 | 泳道输入（仅 dev / feat 阶段可见） |
| `src/hooks/use-interceptor.ts` | 91 | axios 拦截器（loading + 错误码处理，**不负责 header**） |
| `src/resources/common.ts` | 26 | `fetchProjects`（/api/jarvis/project_space/my_projects）等 |
| `src/constant/common.ts` | 24 | `COUNTRY_OPTIONS`（CN/EC/MEX/ESP + timeZone） |
| `src/pages/schedule/utils/schedule-batch.ts` | 22 | CountryStorage → 时区后缀（"国内时间" / "印尼时间"） |

---

# 二、存储层（Storage）

## 2.1 基类 `src/storage/index.js`

```javascript
export default class Storage {
  constructor(key, useSessionStorage = false) {
    this.key = key;
    this.useSessionStorage = useSessionStorage;
    this.storage = useSessionStorage ? sessionStorage : localStorage;
  }

  set(cache) { this.storage.setItem(this.key, JSON.stringify(cache)); }
  get()      { try { return JSON.parse(this.storage.getItem(this.key)); } catch { return null; } }
  remove()   { this.storage.removeItem(this.key); }

  // 跨 Tab 同步：storage 事件
  on(fn) { ... window.addEventListener('storage', cb); }
  off()  { window.removeEventListener('storage', cb); }
}
```

- 统一封装 localStorage / sessionStorage
- JSON 解析失败兜底返回 null
- **`on/off` 的 storage event 机制定义了但全项目**几乎没人调用

## 2.2 三个 Storage 实例

| Storage Key | Type | 默认 | 用途 |
| --- | --- | --- | --- |
| `Project` | localStorage | `''` | 当前项目 id（数字，由后端 `/my_projects` 返回） |
| `Country` | localStorage | `''` | 当前国家 code：`CN` / `EC` / `ESP` / `MEX` / `PHI` |
| `SwimLane` | **sessionStorage** | `''` | 泳道 id（浏览器关闭即丢失；通常仅 dev/feat 使用） |

> **注意**：SwimLane 用 sessionStorage，跨 Tab 不同步、重启浏览器丢失。

---

# 三、全局 Store（Pinia）

## 3.1 `store/project.ts`

```ts
export const useProjectStore = defineStore('project', () => {
  const project = ref('');
  const projectEnum = ref({});  // 项目下拉选项（含 id / name / domain / region）

  const setProject = (value) => project.value = value;
  const setProjectEnum = (value) => projectEnum.value = value;

  return { setProject, setProjectEnum,
           project: computed(() => project.value),
           projectEnum: computed(() => projectEnum.value) };
});
```

## 3.2 `store/country.ts`

```ts
export const useCountryStore = defineStore('country', () => {
  const country = ref('');
  const setCountry = (value) => country.value = value;
  return { setCountry, country: computed(() => country.value) };
});
```

> **现状**：Store 只存值，没有 action 副作用。很多模块绕开 Store，直接读 `ProjectStorage.get()` / `CountryStorage.get()`。**两套真相存在，需要主动保持同步**。

---

# 四、初始化链路（App 启动）

## 4.1 `src/app.ts`（190 行）

启动时做埋点参数准备：

```ts
const defaultProject = ProjectStorage.get() || '';
const defaultCountry = CountryStorage.get() || '';
const params = new URL(window.location.href).searchParams;
const project = params.get('projectId') || defaultProject;
const country = params.get('country') || defaultCountry;

// 作为上报数据发给 FMP
const data = { ...res, userName, mail, country: country || '-1', project: project || -1 };
```

**结论**：URL query > localStorage。app.ts 只负责埋点，不负责 header 注入。

## 4.2 `src/pages/index.vue`（114 行）— 应用壳 + 守卫替身

这是所有业务路由的父级壳组件（除 home / 外链页）。它承担了 **"路由守卫"的职责**（但并不是 Vue Router 的 beforeEach）。

### setupCountryHeader 流程（首次进入必走）

```ts
// 1. 优先级：URL > localStorage > 域名推断
const projectValue = route.query.projectId || ProjectStorage.get();
const countryValue = route.query.country || CountryStorage.get() || inferFromDomain();

// 2. 域名推断映射
const countryMap = {
  'datapilot.fintopia.tech':   'CN',
  'datapilot.easycash.id':     'EC',
  'datapilot.creditoya.com.es':'ESP',
  'datapilot-mex.fintopia.tech':'MEX',
};

// 3. 设置 header 并决定渲染
if (projectValue && countryValue)             render();
else if (projectValue && isHideLayoutPage)    render();    // alert/landing 等
else if (!isLoggedIn)                          ChidoriWeb.goLogin();
else                                           router.replace({ name: 'NotFound' });
```

**几个关键约定**：
- `/alert/center/landing` 等 `hideLayout` 页面允许只传 projectId 不传 country
- 没登录 → 跳登录
- 登录了但无项目 → `/not-found`（即 home 模块的 not-found.vue，"您现在尚未参与任何项目"）

---

# 五、顶栏组件（Header）

## 5.1 `components/HeaderOtherComp.vue`（110 行）

顶栏右侧区块组装，固定顺序：

```
[SwimLaneInput]   仅 !isProdStage && !isFeatStage 展示（实际 = dev 才显示）
[HeaderCountry]   始终展示
[HeaderProject]   除 Cerebro 路由外都展示
[Help 按钮]
```

> Cerebro 全家桶（/cerebro/**）**不渲染 HeaderProject**。Cerebro 权限对象跨项目，不该随项目切换。

## 5.2 国家切换 `components/header-country/index.vue`（107 行）

```ts
const onSelect = (value: string) => {
  const { pathname } = window.location;
  window.location.replace(
    `${value === 'EC' ? IndoUrl :
       value === 'ESP' ? EspUrl :
       value === 'MEX' ? MexUrl : CnUrl}${pathname}`
  );
};
```

### 硬编码域名

```ts
const CnUrl   = 'https://datapilot.fintopia.tech';
const IndoUrl = 'https://datapilot.easycash.id';
const EspUrl  = 'https://datapilot.creditoya.com.es';
const MexUrl  = 'https://datapilot-mex.fintopia.tech';
```

**切国家 = 跨域整页 reload**，状态、未保存表单、滚动位置都会丢。

## 5.3 项目切换 `components/header-project/index.vue`（213 行）🔴 核心

### 进入加载

```ts
const fetchOptions = async () => {
  const { data: { body } } = await CommonApi.fetchProjects();   // GET /api/jarvis/project_space/my_projects
  projectOptions.value = body.map(item => ({
    value:   item.id,
    label:   item.projectName,
    url:     item.domain,     // ⚠️ 可能是不同国家的域名
    country: item.region,     // ⚠️ 字段名 region 但语义当 country 用
  }));
};
```

### Header / Store / Storage 同步写入

```ts
const setProjectHeader = (value) => {
  http.defaults.headers.common['datapilot_project_id'] = String(value);
  setProject(value);           // Pinia
  ProjectStorage.set(value);   // localStorage
};

const setCountryHeader = (value) => {
  const country = projectOptions.value.find(i => i.value === value).country || '';
  http.defaults.headers.common['country'] = country;
  setCountry(country);
  CountryStorage.set(country);
};
```

### `datapilot_window_id`（窗口级唯一标识）

```ts
const setWindowId = () => {
  let uniqueFlag = sessionStorage.getItem('uniqueFlag');
  if (!uniqueFlag) {
    uniqueFlag = uuidv4() + dayjs().valueOf();
    sessionStorage.setItem('uniqueFlag', uniqueFlag);
  }
  http.defaults.headers.common['datapilot_window_id'] = String(uniqueFlag);
};
```

**被 data-develop 的任务锁机制用作"窗口身份"**，在 sql 模块交接文档里已提到相关坑点（刷新会丢 uniqueFlag）。

### 切换项目的跨域跳转

```ts
const onSelect = (value) => {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  const targetProject = projectOptions.value.find(item => item.value === numericValue);
  const path = targetProject?.url || '';
  setTimeout(() => {
    window.location.href = `${path}${currentPath}?projectId=${numericValue}&country=${country}`;
  }, 100);
};
```

- 切项目可能需要跨域（不同项目属于不同 region 的子域）
- URL 带 `?projectId=&country=` 给目标域 pages/index.vue 第一时间读取
- 同域项目切换也是 `window.location.href` 全页刷新

### Query 清理

```ts
const newQuery = cloneDeep(query);
delete newQuery.projectId;
delete newQuery.country;
router.replace({ query: newQuery });  // 拿到值后把 query 清理掉，保持 URL 干净
```

## 5.4 泳道 `components/swim-lane-input/index.vue`（134 行）

- 显示条件：`!isProdStage && !isFeatStage`（即仅 dev 可见）
- 输入框 → `setSwimLane()` → `http.defaults.headers.common['fintopia-swim-lane-id']` + SwimLaneStorage 写入 + `router.go(0)` 整页刷新
- **用途**：路由到后端特定泳道（灰度 / 测试 / canary）

---

# 六、4 个核心请求头

所有业务请求都会带：

| Header | 来源 | 设置位置 |
| --- | --- | --- |
| `datapilot_project_id` | 项目 id（数字字符串） | `header-project/index.vue` 的 `setProjectHeader` |
| `country` | 国家 code（CN / EC / ESP / MEX） | 同上 `setCountryHeader` |
| `datapilot_window_id` | sessionStorage 的 `uniqueFlag`（UUID + timestamp） | 同上 `setWindowId` |
| `fintopia-swim-lane-id` | 泳道 id | `swim-lane-input/index.vue` 的 `setSwimLane` |

特殊页面额外头（hideLayout / 外链）：
- `alert/center/landing` 读 `route.query.projectId` / `route.query.swimlaneId` → 直接覆盖
- `data-map/share.vue` 类似，通过 token 让后端校验
- 这些是"用户不在本应用内打开链接"的场景，可能没走 header-project 那套 setup

## 6.1 `hooks/use-interceptor.ts`（91 行）

**重要事实**：axios 拦截器 **只负责 loading 和错误码**，**不负责 header**。Header 由 `header-project` / `swim-lane-input` / `pages/index.vue` / `alert/landing` 等各自直接改 `http.defaults.headers.common`。

```ts
// 请求：reqCount++ loading 计数
axios.interceptors.request.use((req) => { if (!req.hideLoading) state.reqCount += 1; return req; });

// 响应：按 statusCode 分支处理
// - YQG_STATUS_CODE_CHIDORI_SESSION_EXPIRED → 登录
// - ...
```

**影响**：没有"一个地方追溯 header 来源"。Debug 时找某个请求为什么带/不带某 header，要手动 grep 所有 `http.defaults.headers.common`。

---

# 七、常量与工具

## 7.1 `src/constant/common.ts`

```ts
export const COUNTRY_OPTIONS = [
  { value: 'CN',  label: '国内',   timeZone: 'Asia/Shanghai' },
  { value: 'EC',  label: '印尼',   timeZone: 'Asia/Jakarta' },
  { value: 'MEX', label: '墨西哥', timeZone: 'America/Mexico_City' },
  { value: 'ESP', label: '西班牙', timeZone: 'Europe/Madrid' },
];
```

## 7.2 `src/pages/schedule/utils/schedule-batch.ts`

```ts
export const SCHEDULE_BATCH_COUNTRY_MAP = {
  CN: '国内', EC: '印尼', ESP: '西班牙', MEX: '国内', PHI: '国内',
};

export const getScheduleBatchTooltipTitle = () => {
  const countryValue = CountryStorage.get() || DEFAULT_COUNTRY;
  const result = SCHEDULE_BATCH_COUNTRY_MAP[countryValue] || countryValue || '-';
  return `${result}时间`;   // "国内时间" / "印尼时间" / ...
};
```

> **脆弱点**：两张映射表（`COUNTRY_OPTIONS` 与 `SCHEDULE_BATCH_COUNTRY_MAP`）独立维护，新加国家要同时改；`MEX` / `PHI` 目前被映射成"国内"属于**历史兼容**，逻辑上可疑。

---

# 八、跨模块消费模式（盘点）

## 8.1 模式一：直接读 Storage（最常见）

```ts
import ProjectStorage from '@/storage/project';
const defaultProject = ProjectStorage.get() || '';
```

代表：
- `matrix/access/index.vue`（初始化过滤）
- `data-map/index.vue`（请求头和会话参数）
- `schedule/utils/schedule-batch.ts`（时区文案）
- 多处默认过滤条件

## 8.2 模式二：读 Pinia Store（少数）

```ts
import { useProjectStore } from '@/store/project';
const projectStore = useProjectStore();
const currentProjectId = Number(projectStore.project);
```

代表：
- `dqc/monitor/rule-config/add-monitor`（`isPolicyCrossProject` 跨项目 policy 校验）

## 8.3 模式三：从 URL Query 读（外链 / hideLayout 页）

```ts
const projectId = route.query.projectId as string;
const swimlaneId = route.query.swimlaneId as string;

if (projectId)  http.defaults.headers.common['datapilot_project_id'] = projectId;
if (swimlaneId) http.defaults.headers.common['fintopia-swim-lane-id'] = swimlaneId;
```

代表：
- `alert/center/landing`（告警外链）
- `data-map/share`（分享对话，但主要靠 token）

## 8.4 模式四：隐式继承（走 `http.defaults.headers.common`）

大多数模块 **不显式读 project**，直接发请求靠 axios 默认 header 继承。这依赖 `header-project` 在首次加载时设好 header。一旦首屏 header 没设好就会全链路丢失（比如外链页但没去 pages/index.vue 那层初始化）。

## 8.5 冲突风险

- **同一页面 Query + Storage 不一致** 时，以 Query 为准（见 pages/index.vue）
- **切项目后模块局部状态没刷新**（header 变了但页面组件状态还是老的），因为多数模块是 mount 时读一次；但项目切换是 `window.location.href` 全页刷新，**实操下不太会出问题**
- 当 header 通过 axios 默认头设置，**新打开的 window.open 到外链** 不会继承 axios 实例（因为是新页），必须依赖 URL query 传递

---

# 九、路由守卫与重定向

**Vue Router 层没有守卫**。守卫的职责落在 `pages/index.vue`（见第 4.2 节）。

流程：

```
进入 /xxx
  ↓
pages/index.vue 挂载 → setupCountryHeader()
  ↓
    有 project + country                → render <router-view />
    有 project + hideLayout 页           → render
    没登录                                → ChidoriWeb.goLogin()
    登录但无项目                          → router.replace({ name: 'NotFound' })
                                            ↑
                                            home 模块的 not-found.vue
                                            （"您现在尚未参与任何项目"）
```

---

# 十、⚠️ 重点风险与陷阱

## 10.1 跨域整页 reload 🔴

- 切国家 / 切项目 / 切泳道 都是 `window.location.href` 或 `window.location.replace`
- 完全丢失：未保存表单、Tab 顺序、滚动位置、AI 会话、SQL 编辑内容
- **影响面最大**的风险点
- 建议：针对同域内项目切换，改用 `router.replace` + 组件级重新拉数据；跨域无解

## 10.2 双真相（Storage vs Store）

- `ProjectStorage` / `CountryStorage` / `SwimLaneStorage` + Pinia `useProjectStore` / `useCountryStore`
- 写入时由 `header-project` 同步写三处（Pinia + localStorage + axios header）
- 各模块读取策略不统一（有的读 storage、有的读 store、有的读 query）
- **如果有人只更新一处，三者就会漂移**
- 建议：单一入口 `useProjectContext()` 封装"读写 + 通知"，禁止各模块直接改 storage / store

## 10.3 header 注入分散

- axios 拦截器不管 header
- 真实注入点至少 4 处：header-project、swim-lane-input、pages/index.vue、alert/landing、data-map/index.vue（fetch 自己拼）
- 新人看请求带了某个 header 找源头相当于大海捞针
- 建议：所有 header 注入走 **单一服务 / interceptor**，便于追踪

## 10.4 cross-tab 同步未启用

- `Storage.on()` 机制写了但全项目基本无人用
- 用户在 Tab A 切项目，Tab B 不感知；Tab B 发请求会带老 project
- 建议：用 `BroadcastChannel` + storage event 双保险

## 10.5 `region` 当 `country` 使

```ts
country: item.region,     // 来自 /my_projects 接口
```

- 语义 mismatch（region 可以含多国；也可以不含国家信息）
- 如果后端有一天区分 country / region，前端会全盘踩坑
- 建议：推动后端明确返回 `country` + `region` 双字段；前端也按双字段模型改

## 10.6 域名硬编码

- `header-country/index.vue` 里 4 个 URL（CN/EC/ESP/MEX）直接字符串
- 项目切换还依赖后端返回的 `domain` 字段（见 `header-project`）
- **多套数据来源并存**：一部分前端写死、一部分后端下发
- 建议：全部由后端下发

## 10.7 泳道可见性条件

```html
<SwimLaneInput v-if="!isProdStage && !isFeatStage" />
```

- 隐藏逻辑是"非 prod 且非 feat"，实操 = 仅 dev 可见
- 若 stage 命名未来变更（例如加 staging），泳道会静默消失
- 建议：显式白名单，只在白名单 stage 显示

## 10.8 `not-found` 文案偏"无项目"

- 交接文档 home 章节也提过：`/not-found` 目前承担了"无项目空间"的语义
- 实际 404 场景（路径错误）用户也会看到"您现在尚未参与任何项目"，造成误导
- 建议：拆两页或按 query / props 切换文案

## 10.9 泳道 sessionStorage + window id 重复逻辑

- `fintopia-swim-lane-id`（泳道） + `datapilot_window_id`（窗口唯一） 都写 sessionStorage
- window_id 在 data-develop 的任务锁机制里用（文档里已提）
- 一个页面 sessionStorage 里同时有 swim-lane + window 标识，**清缓存会全部重置**，影响任务锁与泳道行为

## 10.10 切国家的数据安全

- 切国家等于跳到另一个域名，然而 URL path 保持原样（`${url}${pathname}`）
- 如果目标国家没有对应路由 / 没有对应项目空间，用户会看到 404 / 无项目页
- 建议：切国家前预检该国家是否有有效项目

## 10.11 登录态拦截

- `ChidoriWeb.goLogin()` 依赖第三方 SDK
- 若 SDK 行为变化，可能陷入"无项目 + 未登录"死循环
- 建议：登录态和项目态加超时兜底

## 10.12 Timezone 处理不精细

- `schedule-batch.ts` 只做文案（"国内时间"/"印尼时间"）
- 实际批次时间可能跨日 / DST / UTC 混用
- 调度模块交接文档已单独列出
- 建议：统一用 Intl / dayjs 本地化

## 10.13 Cerebro 不渲染 HeaderProject

- `HeaderOtherComp.vue` 对 cerebro 路由过滤掉 HeaderProject
- 原因：cerebro 权限对象跨项目（用户组 / 权限审批 / OA 流程）
- **但 cerebro 请求仍需要 `datapilot_project_id`**，继承自切换前的 header
- 如果用户直接从外部链接打开 cerebro 页（没经过项目选择），header 可能为空
- 建议：cerebro 入口加 header 兜底校验

---

# 十一、给接手人的建议优先级

## 第一周：上手
1. 读通 `pages/index.vue` 的 setupCountryHeader 分支逻辑
2. 浏览器 DevTools 观察切项目 / 切国家时的请求头变化
3. 手动构造以下场景复现：
   - 直链打开 `/matrix/access?projectId=X`
   - 直链打开 `/alert/center/landing?eventId=&projectId=&swimlaneId=`
   - localStorage 手动清 `Project` 再进首页
4. 通读 4 个 header 的所有赋值点（grep `http.defaults.headers.common`）

## 第一月：止血
1. 封装 `useProjectContext()` composable，收敛读写
2. Header 注入迁移到 axios 请求 interceptor（request use），从 store 读
3. Storage / Store / Header 做原子写入工具
4. cerebro 路由入口加 header 兜底
5. 域名 / 国家映射改由后端下发

## 第二季：结构性重构
1. 切项目改成 SPA 内部切换（同域场景）
2. 跨 Tab BroadcastChannel 同步项目
3. region / country 前后端语义对齐
4. NotFound 区分"无项目" / "路径错误" 两种文案
5. 泳道机制文档化 + 非 dev 阶段的开放策略

---

# 十二、关键联系人

- **后端**：
  - 韩帅 — project / space 后端（jarvis/project_space）
  - 宋晓峰 — cerebro 数据安全（权限与 project_id 语义）
- **基础设施 / 框架**：
  - 路由守卫 / pages/index.vue / 通用 header 约定：任何改动前与负责 lumina 的同学（李荣谦）对齐（lumina 的多租户机制与 pilot 对齐）
- **测试**：彭丽娅 / 杨天雅
