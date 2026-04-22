/**
 * sql-sider 目录树 mock 数据。
 *
 * 原版返回结构：
 *   - /api/sql/directory-list：分页返回「某 parentId 下的直接子节点」，每个元素含
 *     { task?, taskDirectory, children? } 组合。
 *   - /api/sql/search-directory-list：一次性返回所有命中节点，嵌套完整树（用于搜索/筛选态）。
 *   - /api/sql/task：返回 { task, taskDirectory } 的完整详情。
 *
 * 为了在单机 mock 下让 sql-query.vue 走得通，本文件维护一颗「内存中的任务目录树」，
 * 支持基础 CRUD（新建/更新/删除/移动 目录&任务），以驱动 UI 正确刷新。
 */

/**
 * taskDirectory 字段按真实接口 /api/jarvis/tasks/task/{id} 的 body.taskDirectory 对齐
 */
export interface MockTaskDirectory {
  id: number;
  projectId: number;
  parentId: number | null;
  parentIdsPath: string | null;
  itemType: 'DATABASE' | 'DIRECTORY' | 'TASK';
  taskCode?: string;
  taskName: string;
  itemPath: string;
  itemLevel: number;
  sortOrder: number;
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
  databaseName: string;
  isDeleted: 0 | 1;
  // 以下是前端筛选/渲染需要，但真实接口在 task 上返回，这里保留以向前兼容
  description?: string;
  owner?: string;
  tableName?: string | null;
  productionTaskStatus?:
    | 'ONLINE_NO_DIFF'
    | 'ONLINE_HAS_DIFF'
    | 'OFFLINE_NO_DIFF'
    | 'OFFLINE_HAS_DIFF'
    | 'NO_PRODUCTION_TASK';
  taskType?: 'SPARK_SQL' | 'PYTHON' | 'SPARK_PYTHON' | 'NOTEBOOK' | 'LLM_SKILLS';
  scheduleConfig?: { scheduleType: string; cronExpression?: string };
}

/**
 * task 字段按真实接口 body.task 对齐；所有业务配置都挂在 task 上
 */
export interface MockTask {
  id: number;
  projectId: number;
  parentId: number;
  itemType: 'TASK';
  taskCode: string;
  taskName: string;
  taskEnv: 'DEV' | 'PROD';
  itemPath: string;
  itemLevel: number;
  sortOrder: number;
  taskType: 'SPARK_SQL' | 'PYTHON' | 'SPARK_PYTHON' | 'NOTEBOOK' | 'LLM_SKILLS';
  taskEngineType: string | null;
  taskCategory: string | null;
  description: string | null;
  scheduleConfig: {
    scheduleType: 'PERIODIC' | 'MANUAL';
    schedulePriority: 'HIGH' | 'MEDIUM' | 'LOW';
    cronExpression: string;
    yarnQueue: string;
    validityDays: number;
    expireAt: number | null;
    scheduleTimezone: string | null;
    scheduleCycle: string | null;
    rerunPermission: string | null;
    enableRerun: boolean | null;
    enableAutoRerun: boolean | null;
    maxRetryCount: number;
    retryIntervalMinutes: number;
    enableFailureAlert: boolean;
    failureAlertStrategy: string | null;
    failureAlertLevel: 'INFO' | 'WARN' | 'ERROR';
    alertLevel: string | null;
    enableTimeoutAlert: boolean;
    timeoutAlertMinutes: number;
    timeoutAlertLevel: 'INFO' | 'WARN' | 'ERROR';
    enableSlaStartAlert: boolean;
    slaCommitStartTime: string;
    enableSlaEndAlert: boolean;
    slaCommitEndTime: string;
    slaAlertLevel: 'INFO' | 'WARN' | 'ERROR';
    notifyPolicyId: number | null;
    nextExecutionTimes: number[] | null;
  };
  resourceConfig: {
    yarnQueue: string | null;
    resourceGroup: string | null;
    sparkParams: Array<{ key: string; value: string }>;
  };
  databaseName: string;
  tableName: string | null;
  itemStatus: string | null;
  taskStatus: 'DRAFT' | 'ONLINE' | 'OFFLINE';
  owner: string;
  scriptContent: string;
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
  versionNumber: number;
  versionDescription: string | null;
  dependencyVO: {
    taskCode: string;
    versionNumber: number;
    taskDolphinRelations: any[];
  };
  productionTaskStatus:
    | 'ONLINE_NO_DIFF'
    | 'ONLINE_HAS_DIFF'
    | 'OFFLINE_NO_DIFF'
    | 'OFFLINE_HAS_DIFF'
    | 'NO_PRODUCTION_TASK';
  windowId: number | null;
  notebookPath: string | null;
  notebookContainerPath: string | null;
  taskTapdRelation: any[] | null;
}

interface NodeRecord {
  directory: MockTaskDirectory;
  task?: MockTask;
}

const PROJECT_DATABASES = ['warehouse', 'ads', 'dim', 'tmp'];
const OWNERS = [
  { username: 'alice', formatedName: 'Alice 张' },
  { username: 'bob', formatedName: 'Bob 李' },
  { username: 'charlie', formatedName: 'Charlie 王' },
  { username: 'david', formatedName: 'David 刘' },
];
const TASK_TYPES = [
  { label: 'Spark SQL', value: 'SPARK_SQL' },
  { label: 'Python', value: 'PYTHON' },
  { label: 'Notebook', value: 'NOTEBOOK' },
  { label: 'LLM 技能', value: 'LLM_SKILLS' },
];

const PRODUCTION_STATUSES: MockTaskDirectory['productionTaskStatus'][] = [
  'ONLINE_NO_DIFF',
  'ONLINE_HAS_DIFF',
  'OFFLINE_NO_DIFF',
  'OFFLINE_HAS_DIFF',
  'NO_PRODUCTION_TASK',
];
const SCHEDULE_TYPES = ['PERIODIC', 'MANUAL'];

/** 单机 mock 的整棵树，用 Map 存，按 id 索引，输出时按 parentId 组装 */
const nodeMap = new Map<number, NodeRecord>();
let idSeq = 10000;

const genId = () => ++idSeq;

const addDirectory = (
  data: Omit<MockTaskDirectory, 'id'> & { id?: number },
  task?: MockTask,
) => {
  const id = data.id ?? genId();
  const directory: MockTaskDirectory = {
    ...data,
    id,
  };
  nodeMap.set(id, { directory, task });
  return directory;
};

/** 生成一个完整的 scheduleConfig（字段按真实接口结构对齐） */
const buildScheduleConfig = (scheduleType: 'PERIODIC' | 'MANUAL' = 'PERIODIC'): MockTask['scheduleConfig'] => ({
  scheduleType,
  schedulePriority: 'MEDIUM',
  cronExpression: scheduleType === 'PERIODIC' ? '0 0 0 * * ? *' : '',
  yarnQueue: 'default',
  validityDays: -1,
  expireAt: null,
  scheduleTimezone: null,
  scheduleCycle: null,
  rerunPermission: null,
  enableRerun: null,
  enableAutoRerun: null,
  maxRetryCount: 3,
  retryIntervalMinutes: 5,
  enableFailureAlert: true,
  failureAlertStrategy: null,
  failureAlertLevel: 'WARN',
  alertLevel: null,
  enableTimeoutAlert: false,
  timeoutAlertMinutes: 60,
  timeoutAlertLevel: 'WARN',
  enableSlaStartAlert: false,
  slaCommitStartTime: '00:30',
  enableSlaEndAlert: false,
  slaCommitEndTime: '09:00',
  slaAlertLevel: 'WARN',
  notifyPolicyId: null,
  nextExecutionTimes: null,
});

const buildResourceConfig = (): MockTask['resourceConfig'] => ({
  yarnQueue: null,
  resourceGroup: null,
  sparkParams: [
    { key: 'spark.executor.cores', value: '2' },
    { key: 'spark.executor.memory', value: '8G' },
  ],
});

const buildTaskCode = (seed: string) =>
  `task_${Date.now()}_${seed.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'mock'}`;

/** 构建初始数据：4 个数据库 × 每个 2 目录 × 每个 2 任务 + 1 个直挂数据库的任务 */
const seed = () => {
  if (nodeMap.size > 0) return;
  const now = Date.now();

  PROJECT_DATABASES.forEach((db, dbIdx) => {
    const dbOwner = OWNERS[dbIdx % OWNERS.length].username;
    const dbNode = addDirectory({
      projectId: 1,
      parentId: null,
      parentIdsPath: null,
      itemType: 'DATABASE',
      itemLevel: 1,
      itemPath: `/${db}`,
      sortOrder: dbIdx,
      taskName: db,
      databaseName: db,
      owner: dbOwner,
      createdBy: dbOwner,
      createdAt: now - 86400000 * (dbIdx + 10),
      updatedBy: dbOwner,
      updatedAt: now - 86400000 * (dbIdx + 1),
      isDeleted: 0,
    });

    for (let dir = 1; dir <= 2; dir++) {
      const dirOwner = OWNERS[(dbIdx + dir) % OWNERS.length].username;
      const dirNode = addDirectory({
        projectId: 1,
        parentId: dbNode.id,
        parentIdsPath: `/${dbNode.id}`,
        itemType: 'DIRECTORY',
        itemLevel: 2,
        itemPath: `/${db}/DIR_${dir}`,
        sortOrder: dir,
        taskName: `DIR_${dir}`,
        databaseName: db,
        owner: dirOwner,
        createdBy: dirOwner,
        createdAt: now - 86400000 * (dbIdx + dir + 5),
        updatedBy: dirOwner,
        updatedAt: now - 86400000 * (dbIdx + dir),
        isDeleted: 0,
      });

      for (let t = 1; t <= 2; t++) {
        const taskId = genId();
        const taskName = `${db}_${dir}_task_${t}`;
        const taskCode = buildTaskCode(taskName);
        const taskType = TASK_TYPES[(dbIdx + dir + t) % TASK_TYPES.length]
          .value as MockTask['taskType'];
        const owner = OWNERS[(dbIdx + dir + t) % OWNERS.length].username;
        const productionStatus =
          PRODUCTION_STATUSES[(dbIdx + dir + t) % PRODUCTION_STATUSES.length]!;
        const scheduleType = SCHEDULE_TYPES[(dbIdx + t) % SCHEDULE_TYPES.length] as
          | 'PERIODIC'
          | 'MANUAL';
        const createdAt = now - 86400000 * (dbIdx + dir + t + 2);
        const updatedAt = now - 3600000 * (dbIdx + dir + t);

        addDirectory(
          {
            projectId: 1,
            parentId: dirNode.id,
            parentIdsPath: `/${dbNode.id}/${dirNode.id}`,
            itemType: 'TASK',
            itemLevel: 3,
            itemPath: `/${db}/DIR_${dir}/${taskName}`,
            sortOrder: t,
            taskCode,
            taskName,
            databaseName: db,
            owner,
            createdBy: owner,
            createdAt,
            updatedBy: owner,
            updatedAt,
            isDeleted: 0,
            description: `示例任务 ${taskName}，用于展示 sql-sider 树结构`,
            tableName: `${db}.${taskName}_result`,
            productionTaskStatus: productionStatus,
            taskType,
            scheduleConfig: {
              scheduleType,
              cronExpression: scheduleType === 'PERIODIC' ? '0 0 2 * * ?' : undefined,
            },
          },
          {
            id: taskId,
            projectId: 1,
            parentId: dirNode.id,
            itemType: 'TASK',
            taskCode,
            taskName,
            taskEnv: 'DEV',
            itemPath: `/${db}/DIR_${dir}/${taskName}`,
            itemLevel: 3,
            sortOrder: t,
            taskType,
            taskEngineType: taskType === 'PYTHON' || taskType === 'SPARK_PYTHON' ? 'PySpark' : 'Spark',
            taskCategory: null,
            description: `示例任务 ${taskName}`,
            scheduleConfig: buildScheduleConfig(scheduleType),
            resourceConfig: buildResourceConfig(),
            databaseName: db,
            tableName: `${db}.${taskName}_result`,
            itemStatus: null,
            taskStatus: productionStatus === 'NO_PRODUCTION_TASK' ? 'DRAFT' : 'ONLINE',
            owner,
            scriptContent:
              taskType === 'PYTHON'
                ? `# ${taskName}\nprint('Hello from ${taskName}')`
                : `-- ${taskName}\nSELECT * FROM ${db}.${taskName}_source LIMIT 100;`,
            createdBy: owner,
            createdAt,
            updatedBy: owner,
            updatedAt,
            versionNumber: 0,
            versionDescription: null,
            dependencyVO: {
              taskCode,
              versionNumber: 0,
              taskDolphinRelations: [],
            },
            productionTaskStatus: productionStatus,
            windowId: null,
            notebookPath: null,
            notebookContainerPath: null,
            taskTapdRelation: null,
          },
        );
      }
    }

    // 数据库直挂一个任务
    const rootTaskId = genId();
    const rootTaskName = `${db}_root_task`;
    const rootTaskCode = buildTaskCode(rootTaskName);
    const rootCreatedAt = now - 86400000 * 2;
    const rootUpdatedAt = now - 1800000;
    addDirectory(
      {
        projectId: 1,
        parentId: dbNode.id,
        parentIdsPath: `/${dbNode.id}`,
        itemType: 'TASK',
        itemLevel: 2,
        itemPath: `/${db}/${rootTaskName}`,
        sortOrder: 999,
        taskCode: rootTaskCode,
        taskName: rootTaskName,
        databaseName: db,
        owner: dbOwner,
        createdBy: dbOwner,
        createdAt: rootCreatedAt,
        updatedBy: dbOwner,
        updatedAt: rootUpdatedAt,
        isDeleted: 0,
        description: `${db} 库根目录直挂任务`,
        productionTaskStatus: 'NO_PRODUCTION_TASK',
        taskType: 'SPARK_SQL',
        scheduleConfig: { scheduleType: 'MANUAL' },
      },
      {
        id: rootTaskId,
        projectId: 1,
        parentId: dbNode.id,
        itemType: 'TASK',
        taskCode: rootTaskCode,
        taskName: rootTaskName,
        taskEnv: 'DEV',
        itemPath: `/${db}/${rootTaskName}`,
        itemLevel: 2,
        sortOrder: 999,
        taskType: 'SPARK_SQL',
        taskEngineType: 'Spark',
        taskCategory: null,
        description: `${db} 库根目录直挂任务`,
        scheduleConfig: buildScheduleConfig('MANUAL'),
        resourceConfig: buildResourceConfig(),
        databaseName: db,
        tableName: null,
        itemStatus: null,
        taskStatus: 'DRAFT',
        owner: dbOwner,
        scriptContent: `-- 根任务 ${rootTaskName}\nSELECT 1;`,
        createdBy: dbOwner,
        createdAt: rootCreatedAt,
        updatedBy: dbOwner,
        updatedAt: rootUpdatedAt,
        versionNumber: 0,
        versionDescription: null,
        dependencyVO: {
          taskCode: rootTaskCode,
          versionNumber: 0,
          taskDolphinRelations: [],
        },
        productionTaskStatus: 'NO_PRODUCTION_TASK',
        windowId: null,
        notebookPath: null,
        notebookContainerPath: null,
        taskTapdRelation: null,
      },
    );
  });
};

seed();

const pickChildren = (parentId: number | null) =>
  [...nodeMap.values()]
    .filter((r) => r.directory.parentId === parentId)
    .sort((a, b) => {
      // 数据库 > 目录 > 任务
      const rank = { DATABASE: 0, DIRECTORY: 1, TASK: 2 } as const;
      if (rank[a.directory.itemType] !== rank[b.directory.itemType]) {
        return rank[a.directory.itemType] - rank[b.directory.itemType];
      }
      return a.directory.taskName.localeCompare(b.directory.taskName);
    });

/**
 * 列表/树返回结构：按真实接口，task 字段全量返回（包含 scheduleConfig / resourceConfig 等）
 */
const buildNode = (record: NodeRecord) => ({
  task: record.task ? { ...record.task } : undefined,
  taskDirectory: { ...record.directory },
});

const buildNodeWithChildren = (record: NodeRecord): any => {
  const node: any = buildNode(record);
  const children = pickChildren(record.directory.id);
  if (children.length) {
    node.children = children.map(buildNodeWithChildren);
  }
  return node;
};

export const getDirectoryList = (params: {
  parentId?: number | string;
  pageNum?: number;
  pageSize?: number;
  databaseName?: string;
}) => {
  const parentId =
    params.parentId === undefined ||
    params.parentId === -1 ||
    params.parentId === '-1'
      ? null
      : Number(params.parentId);
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 100);

  let all = pickChildren(parentId);
  if (params.databaseName) {
    all = all.filter((r) => r.directory.databaseName === params.databaseName);
  }

  const start = (pageNum - 1) * pageSize;
  const slice = all.slice(start, start + pageSize);
  return {
    hasNextPage: start + pageSize < all.length,
    list: slice.map(buildNode),
  };
};

export const searchDirectoryList = (params: {
  itemType?: string;
  name?: string;
  databaseNames?: string;
  owners?: string;
  taskTypes?: string;
}) => {
  // 对 itemType=DATABASE 或 itemType=DIRECTORY 的特殊调用：原版用于「新建任务/目录」弹窗里的 Cascader
  // 这两种调用应该按层级返回一颗裸树（DATABASE -> DIRECTORY -> ...）
  if (params.itemType === 'DATABASE') {
    return pickChildren(null).map(buildNodeWithChildren);
  }
  if (params.itemType === 'DIRECTORY') {
    // 原版行为：返回所有数据库 + 其子目录（不含 TASK）
    const buildWithoutTask = (record: NodeRecord): any => {
      const node = buildNode(record);
      const children = pickChildren(record.directory.id).filter(
        (c) => c.directory.itemType !== 'TASK',
      );
      if (children.length) {
        (node as any).children = children.map(buildWithoutTask);
      }
      return node;
    };
    return pickChildren(null).map(buildWithoutTask);
  }

  // itemType=TASK：按筛选条件返回命中的任务，并向上回填其路径节点
  const dbs = params.databaseNames?.split(',').filter(Boolean) || [];
  const owners = params.owners?.split(',').filter(Boolean) || [];
  const types = params.taskTypes?.split(',').filter(Boolean) || [];
  const name = params.name?.trim() || '';

  const hitTasks = [...nodeMap.values()].filter((r) => {
    if (r.directory.itemType !== 'TASK') return false;
    if (dbs.length && !dbs.includes(r.directory.databaseName)) return false;
    if (owners.length && !owners.includes(r.directory.owner ?? '')) return false;
    if (types.length && !types.includes(r.directory.taskType ?? '')) return false;
    if (name && !r.directory.taskName.toLowerCase().includes(name.toLowerCase()))
      return false;
    return true;
  });

  // 回填祖先节点形成嵌套树
  const neededIds = new Set<number>();
  hitTasks.forEach((task) => {
    let cur: NodeRecord | undefined = task;
    while (cur) {
      neededIds.add(cur.directory.id);
      cur = cur.directory.parentId ? nodeMap.get(cur.directory.parentId) : undefined;
    }
  });

  const buildTree = (parentId: number | null): any[] => {
    return [...nodeMap.values()]
      .filter(
        (r) =>
          r.directory.parentId === parentId && neededIds.has(r.directory.id),
      )
      .sort((a, b) =>
        a.directory.taskName.localeCompare(b.directory.taskName),
      )
      .map((r) => {
        const node = buildNode(r);
        const children = buildTree(r.directory.id);
        if (children.length) (node as any).children = children;
        return node;
      });
  };

  return buildTree(null);
};

/**
 * /api/sql/task?id=xxx —— 返回结构与真实接口 /api/jarvis/tasks/task/{id} 的 body 对齐：
 *
 *   { task, taskDirectory, releasePackage, children, projectName, crossSpace, isOnline,
 *     description, releaseDescription, releaseVersion, updateUserName, updateDate }
 *
 * 前端 sql-query.vue 解构 `data.body` 时只用到 task / taskDirectory / taskTapdRelation，
 * 但后续详情抽屉（调度/资源/版本/提交等）以及日志弹窗等会读 body.task 的完整字段，
 * 这里统一按真实接口结构吐出，避免各处 undefined。
 */
export const getTask = (id: number) => {
  const numId = Number(id);
  // 优先按 taskDirectory.id 查（原版 folderKey 语义）
  let record = nodeMap.get(numId);
  // 兜底：按 task.id 查。seed() 阶段 task.id 与 directory.id 是独立 genId 分配，
  // 前端 transformTree 以 task.id 作为 taskId 传给 setNewEditor。
  if (!record) {
    record = [...nodeMap.values()].find((r) => r.task?.id === numId);
  }
  if (!record) return null;

  const owner = record.task?.owner || record.directory.owner || 'mock-user';
  const ownerMeta = OWNERS.find((o) => o.username === owner);
  const updateUserName = ownerMeta
    ? `${ownerMeta.formatedName}(${ownerMeta.username})`
    : owner;
  const updatedAt = record.task?.updatedAt || record.directory.updatedAt || Date.now();

  return {
    task: record.task ? { ...record.task } : null,
    taskDirectory: { ...record.directory },
    releasePackage: null,
    children: null,
    projectName: '国内',
    crossSpace: false,
    isOnline:
      record.directory.productionTaskStatus === 'ONLINE_NO_DIFF' ||
      record.directory.productionTaskStatus === 'ONLINE_HAS_DIFF',
    description: record.task?.description || record.directory.description || '',
    releaseDescription: null,
    releaseVersion: null,
    updateUserName,
    updateDate: new Date(updatedAt).toISOString().slice(0, 10),
  };
};

export const createTask = (payload: any) => {
  const parentId =
    payload.parentId === undefined || payload.parentId === -1
      ? null
      : Number(payload.parentId);
  const parent = parentId ? nodeMap.get(parentId) : null;
  const itemPath = parent
    ? `${parent.directory.itemPath}/${payload.taskName}`
    : `/${payload.taskName}`;
  const parentIdsPath = parent
    ? `${parent.directory.parentIdsPath ?? ''}/${parent.directory.id}`
    : null;
  const now = Date.now();
  // directory 复用 task 的 id（保持 seed 中根任务的单 id 风格，便于 folderKey 与 taskId 对齐）
  const dirId = genId();
  const taskId = genId();
  const owner = payload.owner ?? 'alice';
  const taskType = (payload.taskType ?? 'SPARK_SQL') as MockTask['taskType'];
  const taskCode = payload.taskCode ?? buildTaskCode(payload.taskName);
  const scriptContent =
    payload.scriptContent ??
    (taskType === 'PYTHON' || taskType === 'SPARK_PYTHON'
      ? `# ${payload.taskName}\nprint('hello ${payload.taskName}')`
      : `-- ${payload.taskName}\nSELECT 1;`);
  const itemLevel = (parent?.directory.itemLevel ?? 0) + 1;

  const task: MockTask = {
    id: taskId,
    projectId: 1,
    parentId: parent?.directory.id ?? -1,
    itemType: 'TASK',
    taskCode,
    taskName: payload.taskName,
    taskEnv: 'DEV',
    itemPath,
    itemLevel,
    sortOrder: 0,
    taskType,
    taskEngineType:
      taskType === 'PYTHON' || taskType === 'SPARK_PYTHON' ? 'PySpark' : 'Spark',
    taskCategory: null,
    description: payload.description ?? null,
    scheduleConfig: buildScheduleConfig(
      payload.scheduleConfig?.scheduleType ?? 'MANUAL',
    ),
    resourceConfig: buildResourceConfig(),
    databaseName: payload.databaseName,
    tableName: null,
    itemStatus: null,
    taskStatus: 'DRAFT',
    owner,
    scriptContent,
    createdBy: owner,
    createdAt: now,
    updatedBy: owner,
    updatedAt: now,
    versionNumber: 0,
    versionDescription: null,
    dependencyVO: {
      taskCode,
      versionNumber: 0,
      taskDolphinRelations: [],
    },
    productionTaskStatus: 'NO_PRODUCTION_TASK',
    windowId: null,
    notebookPath: null,
    notebookContainerPath: null,
    taskTapdRelation: payload.taskTapdRelation || [],
  };

  addDirectory(
    {
      id: dirId,
      projectId: 1,
      parentId,
      parentIdsPath,
      itemType: 'TASK',
      itemLevel,
      itemPath,
      sortOrder: 0,
      taskCode,
      taskName: payload.taskName,
      databaseName: payload.databaseName,
      owner,
      createdBy: owner,
      createdAt: now,
      updatedBy: owner,
      updatedAt: now,
      isDeleted: 0,
      description: payload.description ?? '',
      productionTaskStatus: 'NO_PRODUCTION_TASK',
      taskType,
      scheduleConfig: { scheduleType: 'MANUAL' },
    },
    task,
  );
  return { task: { id: taskId } };
};

export const updateTask = (payload: any) => {
  const record = nodeMap.get(Number(payload.id));
  if (!record) return { task: { id: payload.id } };
  const now = Date.now();
  record.directory.taskName = payload.taskName ?? record.directory.taskName;
  record.directory.description =
    payload.description ?? record.directory.description;
  record.directory.updatedAt = now;
  if (record.task) {
    record.task.taskName = payload.taskName ?? record.task.taskName;
    record.task.description = payload.description ?? record.task.description;
    record.task.updatedAt = now;
    if (payload.taskTapdRelation) {
      record.task.taskTapdRelation = payload.taskTapdRelation;
    }
    if (payload.scheduleConfig) {
      record.task.scheduleConfig = {
        ...record.task.scheduleConfig,
        ...payload.scheduleConfig,
      };
    }
    if (payload.resourceConfig) {
      record.task.resourceConfig = {
        ...record.task.resourceConfig,
        ...payload.resourceConfig,
      };
    }
    if (payload.scriptContent !== undefined) {
      record.task.scriptContent = payload.scriptContent;
    }
  }
  return { task: { id: record.task?.id ?? record.directory.id } };
};

export const deleteTask = (id: number) => {
  nodeMap.delete(Number(id));
  return { success: true };
};

export const createDirectory = (payload: any) => {
  const parentId =
    payload.parentId === undefined || payload.parentId === -1
      ? null
      : Number(payload.parentId);
  const parent = parentId ? nodeMap.get(parentId) : null;
  const newId = genId();
  const itemPath = parent
    ? `${parent.directory.itemPath}/${payload.taskName}`
    : `/${payload.taskName}`;
  const parentIdsPath = parent
    ? `${parent.directory.parentIdsPath ?? ''}/${parent.directory.id}`
    : null;
  const now = Date.now();
  const owner = payload.owner ?? 'alice';
  addDirectory({
    id: newId,
    projectId: 1,
    parentId,
    parentIdsPath,
    itemType: parent ? 'DIRECTORY' : 'DATABASE',
    itemLevel: (parent?.directory.itemLevel ?? 0) + 1,
    itemPath,
    sortOrder: 0,
    taskName: payload.taskName,
    databaseName: payload.databaseName ?? payload.taskName,
    owner,
    createdBy: owner,
    createdAt: now,
    updatedBy: owner,
    updatedAt: now,
    isDeleted: 0,
  });
  return { id: newId };
};

export const updateDirectory = (payload: any) => {
  const record = nodeMap.get(Number(payload.id));
  if (record) {
    record.directory.taskName = payload.taskName ?? record.directory.taskName;
    record.directory.updatedAt = Date.now();
  }
  return { id: payload.id };
};

export const deleteDirectory = (id: number) => {
  // 递归删掉自己和子节点
  const queue = [Number(id)];
  while (queue.length) {
    const cur = queue.shift()!;
    [...nodeMap.values()]
      .filter((r) => r.directory.parentId === cur)
      .forEach((r) => queue.push(r.directory.id));
    nodeMap.delete(cur);
  }
  return { success: true };
};

export const moveTaskDirectory = (payload: any) => {
  const record = nodeMap.get(Number(payload.id));
  if (!record) return { success: false };
  const targetParent = payload.targetParentId
    ? nodeMap.get(Number(payload.targetParentId))
    : null;
  record.directory.parentId = targetParent ? targetParent.directory.id : null;
  record.directory.databaseName =
    payload.databaseName ?? record.directory.databaseName;
  record.directory.parentIdsPath = targetParent
    ? `${targetParent.directory.parentIdsPath ?? ''}/${targetParent.directory.id}`
    : '';
  record.directory.itemLevel = (targetParent?.directory.itemLevel ?? 0) + 1;
  record.directory.itemPath = targetParent
    ? `${targetParent.directory.itemPath}/${record.directory.taskName}`
    : `/${record.directory.taskName}`;
  record.directory.updatedAt = Date.now();
  if (record.task) {
    record.task.databaseName =
      payload.databaseName ?? record.task.databaseName;
  }
  return { success: true };
};

export const getProjectDatabases = () => PROJECT_DATABASES;
export const getProjectUsers = () =>
  OWNERS.map((u) => ({ user: u }));
export const getTaskTypeList = () => TASK_TYPES;
