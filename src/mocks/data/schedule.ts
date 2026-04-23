export type ScheduleTaskStatus = 'ONLINE' | 'OFFLINE';
export type ScheduleType = 'PERIODIC' | 'MANUAL';
export type ScheduleCycle = 'MINUTE' | 'HOUR' | 'DAY' | 'MONTH';
export type ScheduleExecuteType = 'AUTO' | 'MANUAL' | 'BACKFILL';
export type RunStatus =
  | 'SUCCESS'
  | 'RUNNING'
  | 'FAILURE'
  | 'PENDING'
  | 'STOP'
  | 'NEVER_RUN'
  | 'BLOCK'
  | 'WAIT_TO_RUN';

export interface ScheduleTaskItem {
  taskId: string;
  taskName: string;
  taskDescription: string;
  taskType: string;
  taskStatus: ScheduleTaskStatus;
  owner: string;
  releaseDate: string;
  scheduleType: ScheduleType;
  scheduleCycle: ScheduleCycle;
  taskModule: 'DATA_DEVELOPMENT' | 'DATA_INTEGRATION';
  releaseVersion: string;
  lastScheduleBatch?: string;
  lastRunStatus: RunStatus;
  lastRunStartTime?: string;
  lastRunEndTime?: string;
  lastRunDurationMs?: number;
  taskInstanceId?: string;
  processInstanceId?: string;
}

export interface ScheduleInstanceItem {
  taskInstanceId: string;
  processInstanceId: string;
  taskId: string;
  taskName: string;
  taskDescription: string;
  taskType: string;
  taskStatus: ScheduleTaskStatus;
  scheduleType: ScheduleType;
  scheduleCycle: ScheduleCycle;
  scheduleExecuteType: ScheduleExecuteType;
  scheduleUser: string;
  owner: string;
  scheduleBatch: string;
  scheduleTime?: string;
  runStartTime?: string;
  runEndTime?: string;
  runDurationMs?: number;
  runStatus: RunStatus;
  taskModule: 'DATA_DEVELOPMENT' | 'DATA_INTEGRATION';
  releaseVersion: string;
}

export interface ScheduleSummary {
  onlineTaskCount: number;
  myTaskCount: number;
  runningInstanceCount: number;
  blockedInstanceCount: number;
}

export interface ScheduleLogTab {
  name: string;
  log: string;
  lineCount: number;
  appLink?: Record<string, string>;
}

export interface ScheduleTaskDetail {
  task: {
    taskId: string;
    taskName: string;
    taskType: string;
    owner: string;
    taskModule: string;
    description: string;
    isOnline: boolean;
    releaseVersion: string;
    releaseDate: string;
    taskStatus: ScheduleTaskStatus;
  };
  codeView: {
    language: 'sql' | 'python';
    content: string;
    outputTable: string;
    sourceTables: string[];
  };
  scheduleConfig: {
    scheduleType: ScheduleType;
    scheduleCycle: ScheduleCycle;
    cronExpression: string;
    nextExecutionTimes: string[];
    enableTimeoutAlert: boolean;
    timeoutAlertMinutes?: number;
    maxRetryCount: number;
    retryIntervalMinutes: number;
    yarnQueue: string;
    dependencies: Array<{
      taskId: string;
      taskName: string;
      cycle: ScheduleCycle;
      dependencyCycleOffset: number;
      averageStartTime: string;
      averageEndTime: string;
      sinkTables: string[];
    }>;
  };
  runMonitor: {
    owner: string;
    runStatus: RunStatus;
    successRate: string;
    avgDuration: string;
    lastFiveBatches: Array<{ batch: string; status: RunStatus; duration: string }>;
  };
  resourceParams: {
    cpu: string;
    memory: string;
    engine: string;
    params: Array<{ key: string; value: string }>;
  };
  crossSpace?: boolean;
}

export interface ScheduleNodeItem {
  id: string;
  taskId: string;
  taskName: string;
  owner: string;
  workspaceName: string;
  crossProject: boolean;
  taskType: string;
  taskModule: 'DATA_DEVELOPMENT' | 'DATA_INTEGRATION';
  direction: 'up' | 'current' | 'down';
  level: number;
  scheduleCycle: ScheduleCycle;
  taskStatus: ScheduleTaskStatus;
  runStatus: RunStatus;
  batch: string;
  cronExpression: string;
  expectedStartTime?: string;
  runtimeStartTime?: string;
  runtimeEndTime?: string;
  runtimeDuration?: string;
  avgStartTime?: string;
  avgEndTime?: string;
  avgDuration?: string;
  instanceId?: string;
  processInstanceId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScheduleEdgeItem {
  source: string;
  target: string;
}

export interface ScheduleGraphPayload {
  task: ScheduleTaskItem;
  nodes: ScheduleNodeItem[];
  edges: ScheduleEdgeItem[];
}

interface PageResult<T> {
  items: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

const TASK_TYPES = ['SPARK_SQL', 'HIVE_SQL', 'SPARK_PYTHON', 'DATA_INTEGRATION', 'SHELL', 'NOTEBOOK'];
const OWNERS = ['alice', 'bob', 'carol', 'david', 'ellen', 'frank'];
const SCHEDULE_TYPE_OPTIONS = [
  { label: '周期调度', value: 'PERIODIC' },
  { label: '手动调度', value: 'MANUAL' },
];
const SCHEDULE_CYCLE_OPTIONS = [
  { label: '分钟', value: 'MINUTE' },
  { label: '小时', value: 'HOUR' },
  { label: '天', value: 'DAY' },
  { label: '月', value: 'MONTH' },
];
const SCHEDULE_EXECUTE_OPTIONS = [
  { label: '系统调度', value: 'AUTO' },
  { label: '人工触发', value: 'MANUAL' },
  { label: '补数据', value: 'BACKFILL' },
];
const RUN_STATUS_OPTIONS = [
  { label: '成功', value: 'SUCCESS' },
  { label: '运行中', value: 'RUNNING' },
  { label: '失败', value: 'FAILURE' },
  { label: '排队中', value: 'PENDING' },
  { label: '已停止', value: 'STOP' },
  { label: '未运行', value: 'NEVER_RUN' },
  { label: '阻塞', value: 'BLOCK' },
  { label: '待运行', value: 'WAIT_TO_RUN' },
];
const TASK_STATUS_OPTIONS = [
  { label: '已上线', value: 'ONLINE' },
  { label: '已下线', value: 'OFFLINE' },
];

const now = new Date();

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTime(date: Date) {
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function addHours(base: Date, hours: number) {
  const next = new Date(base);
  next.setHours(next.getHours() + hours);
  return next;
}

function paginate<T>(list: T[], pageNo = 1, pageSize = 10): PageResult<T> {
  const total = list.length;
  const start = (pageNo - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    total,
    pageNo,
    pageSize,
  };
}

function includesText(value: string | undefined, keyword: string | undefined) {
  if (!keyword) return true;
  return (value ?? '').toLowerCase().includes(keyword.trim().toLowerCase());
}

function inRange(value: string | undefined, range?: { startTime?: string; endTime?: string }) {
  if (!range?.startTime || !range?.endTime || !value) return true;
  return value >= range.startTime && value <= range.endTime;
}

function buildTaskLogs(processInstanceId: string, taskName: string): ScheduleLogTab[] {
  const stdout: string[] = [];
  const stderr: string[] = [];
  for (let i = 0; i < 120; i += 1) {
    const ts = formatDateTime(addHours(now, -(12 - i / 10)));
    stdout.push(`${ts} [INFO] ${taskName} executing step_${i + 1} process=${processInstanceId}`);
    if (i % 17 === 0) {
      stderr.push(`${ts} [WARN] ${taskName} shuffle skew detected in partition_${i + 3}`);
    }
  }
  return [
    {
      name: 'stdout',
      log: `${stdout.join('\n')}\n`,
      lineCount: stdout.length,
      appLink: {
        [`application_${processInstanceId}`]: `https://example.com/yarn/${processInstanceId}`,
      },
    },
    {
      name: 'stderr',
      log: `${stderr.join('\n')}\n`,
      lineCount: stderr.length,
      appLink: {},
    },
  ];
}

function buildTaskDetail(task: ScheduleTaskItem): ScheduleTaskDetail {
  const index = Number(task.taskId.replace('task_', '')) || 0;
  const language = task.taskType.includes('PYTHON') ? 'python' : 'sql';
  return {
    task: {
      taskId: task.taskId,
      taskName: task.taskName,
      taskType: task.taskType,
      owner: task.owner,
      taskModule: task.taskModule,
      description: task.taskDescription,
      isOnline: task.taskStatus === 'ONLINE',
      releaseVersion: task.releaseVersion,
      releaseDate: task.releaseDate,
      taskStatus: task.taskStatus,
    },
    codeView: {
      language,
      outputTable: `dm.scheduler_result_${pad((index % 12) + 1)}`,
      sourceTables: [
        `ods.order_base_${pad((index % 9) + 1)}`,
        `dim.user_profile_${pad((index % 7) + 1)}`,
      ],
      content:
        language === 'python'
          ? [
              'from pyspark.sql import functions as F',
              '',
              "df = spark.table('ods.order_base')",
              "result = df.groupBy('dt').agg(F.count('*').alias('cnt'))",
              "result.write.mode('overwrite').saveAsTable('dm.scheduler_result')",
            ].join('\n')
          : [
              'INSERT OVERWRITE TABLE dm.scheduler_result',
              'SELECT dt,',
              '       COUNT(1) AS cnt,',
              '       SUM(order_amount) AS gmv',
              'FROM ods.order_base',
              'WHERE dt = ${bizdate}',
              'GROUP BY dt;',
            ].join('\n'),
    },
    scheduleConfig: {
      scheduleType: task.scheduleType,
      scheduleCycle: task.scheduleCycle,
      cronExpression:
        task.scheduleType === 'MANUAL'
          ? '手动触发'
          : task.scheduleCycle === 'DAY'
            ? '0 0 8 * * ?'
            : task.scheduleCycle === 'HOUR'
              ? '0 0 * * * ?'
              : task.scheduleCycle === 'MONTH'
                ? '0 0 4 1 * ?'
                : '0 */30 * * * ?',
      nextExecutionTimes: [
        formatDateTime(addHours(now, 1)),
        formatDateTime(addHours(now, 5)),
        formatDateTime(addHours(now, 13)),
        formatDateTime(addHours(now, 25)),
        formatDateTime(addHours(now, 49)),
      ],
      enableTimeoutAlert: index % 3 !== 0,
      timeoutAlertMinutes: index % 3 !== 0 ? 90 : undefined,
      maxRetryCount: (index % 3) + 1,
      retryIntervalMinutes: (index % 4 + 1) * 10,
      yarnQueue: ['root.dw.high', 'root.dw.normal', 'root.dw.adhoc'][index % 3],
      dependencies: [1, 2, 3].map((offset) => ({
        taskId: `dep_${task.taskId}_${offset}`,
        taskName: `${task.taskName} 上游${offset}`,
        cycle: (['HOUR', 'DAY', 'DAY'] as ScheduleCycle[])[offset - 1],
        dependencyCycleOffset: offset - 1,
        averageStartTime: `${pad(2 + offset)}:${pad(10 + offset)}:00`,
        averageEndTime: `${pad(2 + offset)}:${pad(38 + offset)}:00`,
        sinkTables: [`dm.upstream_${offset}`, `dm.upstream_${offset}_detail`],
      })),
    },
    runMonitor: {
      owner: task.owner,
      runStatus: task.lastRunStatus,
      successRate: `${92 - (index % 7)}%`,
      avgDuration: `${18 + (index % 12)} 分钟`,
      lastFiveBatches: [0, 1, 2, 3, 4].map((offset) => ({
        batch: formatDate(addDays(now, -offset)),
        status: (['SUCCESS', 'SUCCESS', 'RUNNING', 'FAILURE', 'SUCCESS'] as RunStatus[])[(offset + index) % 5],
        duration: `${12 + offset * 3} 分钟`,
      })),
    },
    resourceParams: {
      cpu: `${2 + (index % 3)} Core`,
      memory: `${8 + (index % 3) * 4} GB`,
      engine: task.taskType.includes('SPARK') ? 'Spark on Yarn' : 'DolphinScheduler',
      params: [
        { key: 'bizdate', value: '${yyyy-MM-dd-1}' },
        { key: 'timezone', value: 'Asia/Shanghai' },
        { key: 'owner', value: task.owner },
      ],
    },
    crossSpace: index % 9 === 0,
  };
}

function buildTaskData(): ScheduleTaskItem[] {
  const list: ScheduleTaskItem[] = [];
  for (let i = 1; i <= 24; i += 1) {
    const scheduleCycle = (['DAY', 'HOUR', 'MONTH', 'MINUTE'] as ScheduleCycle[])[i % 4];
    const lastRunStatus = (['SUCCESS', 'RUNNING', 'FAILURE', 'PENDING', 'STOP', 'NEVER_RUN'] as RunStatus[])[i % 6];
    const startTime = lastRunStatus === 'NEVER_RUN' ? undefined : formatDateTime(addHours(now, -(i + 5)));
    const endTime =
      lastRunStatus === 'RUNNING' || lastRunStatus === 'PENDING' || lastRunStatus === 'NEVER_RUN'
        ? undefined
        : formatDateTime(addHours(now, -(i + 4)));
    list.push({
      taskId: `task_${i}`,
      taskName: `${['订单同步', '用户画像', '客群圈选', '标签宽表', '质量校验', '画像回流'][i % 6]}_${pad(i)}`,
      taskDescription: `负责 ${TASK_TYPES[i % TASK_TYPES.length]} 作业在 ${scheduleCycle} 维度的调度处理`,
      taskType: TASK_TYPES[i % TASK_TYPES.length],
      taskStatus: i % 5 === 0 ? 'OFFLINE' : 'ONLINE',
      owner: OWNERS[i % OWNERS.length],
      releaseDate: formatDate(addDays(now, -(i * 3 + 18))),
      scheduleType: i % 7 === 0 ? 'MANUAL' : 'PERIODIC',
      scheduleCycle,
      taskModule: i % 4 === 0 ? 'DATA_INTEGRATION' : 'DATA_DEVELOPMENT',
      releaseVersion: `${1 + (i % 4)}.${i % 10}`,
      lastScheduleBatch: formatDate(addDays(now, -(i % 6))),
      lastRunStatus,
      lastRunStartTime: startTime,
      lastRunEndTime: endTime,
      lastRunDurationMs: endTime ? (12 + (i % 10) * 4) * 60 * 1000 : undefined,
      taskInstanceId: lastRunStatus === 'NEVER_RUN' ? undefined : `inst_${i}_latest`,
      processInstanceId: lastRunStatus === 'NEVER_RUN' ? undefined : `proc_${i}_latest`,
    });
  }
  return list;
}

function buildInstanceData(tasks: ScheduleTaskItem[]): ScheduleInstanceItem[] {
  const items: ScheduleInstanceItem[] = [];
  tasks.forEach((task, taskIdx) => {
    for (let j = 0; j < 2; j += 1) {
      const status = (['SUCCESS', 'RUNNING', 'FAILURE', 'BLOCK', 'STOP', 'WAIT_TO_RUN'] as RunStatus[])[(taskIdx + j) % 6];
      const batchDate = formatDate(addDays(now, -(taskIdx % 7) - j));
      items.push({
        taskInstanceId: `${task.taskId}_instance_${j + 1}`,
        processInstanceId: `${task.taskId}_proc_${j + 1}`,
        taskId: task.taskId,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        taskType: task.taskType,
        taskStatus: task.taskStatus,
        scheduleType: task.scheduleType,
        scheduleCycle: task.scheduleCycle,
        scheduleExecuteType: (['AUTO', 'MANUAL', 'BACKFILL'] as ScheduleExecuteType[])[(taskIdx + j) % 3],
        scheduleUser: OWNERS[(taskIdx + j + 1) % OWNERS.length],
        owner: task.owner,
        scheduleBatch: batchDate,
        scheduleTime: `${batchDate} ${pad(6 + (taskIdx % 8))}:00:00`,
        runStartTime: status === 'WAIT_TO_RUN' ? undefined : `${batchDate} ${pad(6 + (j % 3))}:05:00`,
        runEndTime: status === 'RUNNING' || status === 'WAIT_TO_RUN' ? undefined : `${batchDate} ${pad(6 + (j % 3))}:28:00`,
        runDurationMs: status === 'RUNNING' || status === 'WAIT_TO_RUN' ? undefined : (18 + j * 7 + (taskIdx % 5)) * 60 * 1000,
        runStatus: status,
        taskModule: task.taskModule,
        releaseVersion: task.releaseVersion,
      });
    }
  });
  return items.sort((a, b) => `${b.scheduleBatch}${b.runStartTime}`.localeCompare(`${a.scheduleBatch}${a.runStartTime}`));
}

function syncTasksWithLatestInstances(tasks: ScheduleTaskItem[], instances: ScheduleInstanceItem[]) {
  tasks.forEach((task) => {
    const latestInstance = instances.find((instance) => instance.taskId === task.taskId);
    if (!latestInstance) {
      if (task.processInstanceId && !logStore.has(task.processInstanceId)) {
        logStore.set(task.processInstanceId, buildTaskLogs(task.processInstanceId, task.taskName));
      }
      return;
    }
    task.taskInstanceId = latestInstance.taskInstanceId;
    task.processInstanceId = latestInstance.processInstanceId;
    task.lastScheduleBatch = latestInstance.scheduleBatch;
    task.lastRunStatus = latestInstance.runStatus;
    task.lastRunStartTime = latestInstance.runStartTime;
    task.lastRunEndTime = latestInstance.runEndTime;
    task.lastRunDurationMs = latestInstance.runDurationMs;
    if (!logStore.has(latestInstance.processInstanceId)) {
      logStore.set(latestInstance.processInstanceId, buildTaskLogs(latestInstance.processInstanceId, latestInstance.taskName));
    }
  });
}

const scheduleTasks = buildTaskData();
let scheduleInstances = buildInstanceData(scheduleTasks);
const taskDetails = new Map(scheduleTasks.map((item) => [item.taskId, buildTaskDetail(item)]));
const logStore = new Map<string, ScheduleLogTab[]>();

scheduleInstances.forEach((instance) => {
  logStore.set(instance.processInstanceId, buildTaskLogs(instance.processInstanceId, instance.taskName));
});

syncTasksWithLatestInstances(scheduleTasks, scheduleInstances);

function getTask(taskId: string) {
  return scheduleTasks.find((item) => item.taskId === taskId) ?? null;
}

function getInstance(taskInstanceId: string) {
  return scheduleInstances.find((item) => item.taskInstanceId === taskInstanceId) ?? null;
}

function createFreshInstance(task: ScheduleTaskItem, executeType: ScheduleExecuteType, scheduleTime?: string) {
  const stamp = Date.now().toString(36);
  const scheduleBatch = (scheduleTime ?? formatDateTime(now)).slice(0, 10);
  const instance: ScheduleInstanceItem = {
    taskInstanceId: `${task.taskId}_${stamp}`,
    processInstanceId: `${task.taskId}_proc_${stamp}`,
    taskId: task.taskId,
    taskName: task.taskName,
    taskDescription: task.taskDescription,
    taskType: task.taskType,
    taskStatus: task.taskStatus,
    scheduleType: task.scheduleType,
    scheduleCycle: task.scheduleCycle,
    scheduleExecuteType: executeType,
    scheduleUser: task.owner,
    owner: task.owner,
    scheduleBatch,
    scheduleTime: scheduleTime ?? `${scheduleBatch} 08:00:00`,
    runStartTime: formatDateTime(now),
    runEndTime: undefined,
    runDurationMs: undefined,
    runStatus: 'RUNNING',
    taskModule: task.taskModule,
    releaseVersion: task.releaseVersion,
  };
  scheduleInstances = [instance, ...scheduleInstances];
  task.lastRunStatus = 'RUNNING';
  task.lastRunStartTime = instance.runStartTime;
  task.lastRunEndTime = undefined;
  task.lastRunDurationMs = undefined;
  task.lastScheduleBatch = scheduleBatch;
  task.taskInstanceId = instance.taskInstanceId;
  task.processInstanceId = instance.processInstanceId;
  logStore.set(instance.processInstanceId, buildTaskLogs(instance.processInstanceId, task.taskName));
  syncTasksWithLatestInstances(scheduleTasks, scheduleInstances);
  return instance;
}

function updateTaskFromInstance(instance: ScheduleInstanceItem) {
  const task = getTask(instance.taskId);
  if (!task) return;
  task.lastRunStatus = instance.runStatus;
  task.lastRunStartTime = instance.runStartTime;
  task.lastRunEndTime = instance.runEndTime;
  task.lastRunDurationMs = instance.runDurationMs;
  task.lastScheduleBatch = instance.scheduleBatch;
  task.taskInstanceId = instance.taskInstanceId;
  task.processInstanceId = instance.processInstanceId;
}

export function getScheduleSummary(): ScheduleSummary {
  return {
    onlineTaskCount: scheduleTasks.filter((item) => item.taskStatus === 'ONLINE').length,
    myTaskCount: scheduleTasks.filter((item) => item.owner === 'alice').length,
    runningInstanceCount: scheduleInstances.filter((item) => item.runStatus === 'RUNNING').length,
    blockedInstanceCount: scheduleInstances.filter((item) => item.runStatus === 'BLOCK').length,
  };
}

export function getScheduleEnums() {
  return {
    taskTypes: TASK_TYPES.map((item) => ({ label: item, value: item })),
    taskStatuses: TASK_STATUS_OPTIONS,
    scheduleTypes: SCHEDULE_TYPE_OPTIONS,
    scheduleCycles: SCHEDULE_CYCLE_OPTIONS,
    runStatuses: RUN_STATUS_OPTIONS,
    scheduleExecuteTypes: SCHEDULE_EXECUTE_OPTIONS,
    owners: OWNERS.map((item) => ({ label: item, value: item })),
    taskModules: [
      { label: '数据开发', value: 'DATA_DEVELOPMENT' },
      { label: '数据集成', value: 'DATA_INTEGRATION' },
    ],
  };
}

export function queryScheduleTasks(params: Record<string, any> = {}): PageResult<ScheduleTaskItem> {
  const pageNo = Number(params.pageNo ?? params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const list = scheduleTasks.filter((item) => {
    if (!includesText(item.taskName, params.taskName)) return false;
    if (params.taskType && item.taskType !== params.taskType) return false;
    if (params.taskStatus && item.taskStatus !== params.taskStatus) return false;
    if (params.owner && item.owner !== params.owner) return false;
    if (params.scheduleType && item.scheduleType !== params.scheduleType) return false;
    if (params.lastRunStatus && item.lastRunStatus !== params.lastRunStatus) return false;
    if (params.onlyMyTasks || params.myResponsibility) {
      if (item.owner !== 'alice') return false;
    }
    if (!inRange(item.releaseDate, params.releaseDate)) return false;
    if (!inRange(item.lastScheduleBatch, params.lastScheduleBatch)) return false;
    return true;
  });
  return paginate(list, pageNo, pageSize);
}

export function queryScheduleInstances(params: Record<string, any> = {}): PageResult<ScheduleInstanceItem> {
  const pageNo = Number(params.pageNo ?? params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const list = scheduleInstances.filter((item) => {
    if (!includesText(item.taskName, params.taskName)) return false;
    if (!includesText(item.processInstanceId, params.executionId) && !includesText(item.taskInstanceId, params.executionId)) return false;
    if (params.taskType && item.taskType !== params.taskType) return false;
    if (params.runStatus && item.runStatus !== params.runStatus) return false;
    if (params.scheduleType && item.scheduleType !== params.scheduleType) return false;
    if (params.scheduleExecuteType && item.scheduleExecuteType !== params.scheduleExecuteType) return false;
    if (params.scheduleUser && item.scheduleUser !== params.scheduleUser) return false;
    if (!inRange(item.scheduleBatch, params.scheduleBatch)) return false;
    return true;
  });
  return paginate(list, pageNo, pageSize);
}

export function checkScheduleNeedDate(taskId: string) {
  const task = getTask(taskId);
  if (!task) return false;
  return task.scheduleType === 'PERIODIC' && ['HOUR', 'DAY', 'MONTH'].includes(task.scheduleCycle);
}

export function runScheduleTask(payload: { taskId: string; scheduleTime?: string }) {
  const task = getTask(payload.taskId);
  if (!task) return null;
  return createFreshInstance(task, 'MANUAL', payload.scheduleTime);
}

export function rerunScheduleInstance(payload: { taskInstanceId: string }) {
  const current = getInstance(payload.taskInstanceId);
  if (!current) return null;
  const task = getTask(current.taskId);
  if (!task) return null;
  return createFreshInstance(task, current.scheduleExecuteType, current.scheduleTime);
}

export function stopScheduleInstance(payload: { taskInstanceId: string }) {
  const current = getInstance(payload.taskInstanceId);
  if (!current) return null;
  current.runStatus = 'STOP';
  current.runEndTime = formatDateTime(now);
  current.runDurationMs = 7 * 60 * 1000;
  updateTaskFromInstance(current);
  return current;
}

export function forceSuccessInstance(payload: { taskInstanceId: string }) {
  const current = getInstance(payload.taskInstanceId);
  if (!current) return null;
  current.runStatus = 'SUCCESS';
  current.runEndTime = formatDateTime(now);
  current.runDurationMs = current.runDurationMs ?? 14 * 60 * 1000;
  updateTaskFromInstance(current);
  return current;
}

export function getScheduleLogs(params: { processInstanceId?: string; skipLineNum?: number }) {
  const tabs = logStore.get(params.processInstanceId ?? '') ?? [];
  const skipLineNum = Number(params.skipLineNum ?? 0);
  return tabs.map((tab) => {
    const rows = tab.log.trimEnd().split('\n');
    const sliced = rows.slice(skipLineNum, skipLineNum + 80);
    return {
      name: tab.name,
      log: sliced.length ? `${sliced.join('\n')}\n` : '',
      lineCount: sliced.length,
      appLink: tab.appLink,
    };
  });
}

export function getScheduleTaskDetail(taskId: string) {
  return taskDetails.get(taskId) ?? null;
}

function buildGraph(taskId: string, mode: 'view' | 'diagnosis'): ScheduleGraphPayload | null {
  const task = getTask(taskId);
  if (!task) return null;
  const seed = Number(taskId.replace('task_', '')) || 1;
  const width = 204;
  const height = 88;
  const allTaskIds = scheduleTasks.map((item) => item.taskId);
  const centerIndex = Math.max(0, allTaskIds.indexOf(taskId));
  const pick = (offset: number) => scheduleTasks[(centerIndex + offset + scheduleTasks.length) % scheduleTasks.length];
  const upstream = [pick(-3), pick(-2), pick(-1)];
  const downstream = [pick(1), pick(2), pick(3), pick(4)];
  const nodes: ScheduleNodeItem[] = [];
  upstream.forEach((item, index) => {
    const linkedInstance = scheduleInstances.find((instance) => instance.taskId === item.taskId);
    nodes.push({
      id: `node_up_${index + 1}`,
      taskId: item.taskId,
      taskName: item.taskName,
      owner: item.owner,
      workspaceName: item.taskModule === 'DATA_INTEGRATION' ? '集成空间' : '开发空间',
      crossProject: (seed + index) % 3 === 0,
      taskType: item.taskType,
      taskModule: item.taskModule,
      direction: 'up',
      level: upstream.length - index,
      scheduleCycle: item.scheduleCycle,
      taskStatus: item.taskStatus,
      runStatus: mode === 'diagnosis' ? (linkedInstance?.runStatus ?? item.lastRunStatus) : item.lastRunStatus,
      batch: formatDate(addDays(now, -(index + 1))),
      cronExpression: item.scheduleType === 'MANUAL' ? '手动触发' : item.scheduleCycle === 'DAY' ? '0 0 8 * * ?' : '0 0 * * * ?',
      expectedStartTime: `${formatDate(addDays(now, -(index + 1)))} ${pad(5 + index)}:00:00`,
      runtimeStartTime: linkedInstance?.runStartTime,
      runtimeEndTime: linkedInstance?.runEndTime,
      runtimeDuration: linkedInstance?.runDurationMs ? `${Math.floor(linkedInstance.runDurationMs / 60000)}分钟` : undefined,
      avgStartTime: `${pad(5 + index)}:${pad(10 + index)}:00`,
      avgEndTime: `${pad(5 + index)}:${pad(36 + index)}:00`,
      avgDuration: `${16 + index * 4}分钟`,
      instanceId: linkedInstance?.taskInstanceId,
      processInstanceId: linkedInstance?.processInstanceId,
      x: 40 + index * 70,
      y: 50 + index * 110,
      width,
      height,
    });
  });
  const currentInstance = scheduleInstances.find((instance) => instance.taskId === task.taskId);
  nodes.push({
    id: 'node_current',
    taskId: task.taskId,
    taskName: task.taskName,
    owner: task.owner,
    workspaceName: task.taskModule === 'DATA_INTEGRATION' ? '集成空间' : '开发空间',
    crossProject: false,
    taskType: task.taskType,
    taskModule: task.taskModule,
    direction: 'current',
    level: 0,
    scheduleCycle: task.scheduleCycle,
    taskStatus: task.taskStatus,
    runStatus: mode === 'diagnosis' ? (currentInstance?.runStatus ?? task.lastRunStatus) : task.lastRunStatus,
    batch: formatDate(now),
    cronExpression: task.scheduleType === 'MANUAL' ? '手动触发' : task.scheduleCycle === 'DAY' ? '0 0 8 * * ?' : '0 0 * * * ?',
    expectedStartTime: `${formatDate(now)} 08:00:00`,
    runtimeStartTime: currentInstance?.runStartTime,
    runtimeEndTime: currentInstance?.runEndTime,
    runtimeDuration: currentInstance?.runDurationMs ? `${Math.floor(currentInstance.runDurationMs / 60000)}分钟` : undefined,
    avgStartTime: '08:06:00',
    avgEndTime: '08:31:00',
    avgDuration: '25分钟',
    instanceId: currentInstance?.taskInstanceId,
    processInstanceId: currentInstance?.processInstanceId,
    x: 330,
    y: 190,
    width,
    height,
  });
  downstream.forEach((item, index) => {
    const linkedInstance = scheduleInstances.find((instance) => instance.taskId === item.taskId);
    nodes.push({
      id: `node_down_${index + 1}`,
      taskId: item.taskId,
      taskName: item.taskName,
      owner: item.owner,
      workspaceName: item.taskModule === 'DATA_INTEGRATION' ? '集成空间' : '开发空间',
      crossProject: (seed + index + 1) % 4 === 0,
      taskType: item.taskType,
      taskModule: item.taskModule,
      direction: 'down',
      level: index + 1,
      scheduleCycle: item.scheduleCycle,
      taskStatus: item.taskStatus,
      runStatus: mode === 'diagnosis' ? (linkedInstance?.runStatus ?? item.lastRunStatus) : item.lastRunStatus,
      batch: formatDate(addDays(now, index + 1)),
      cronExpression: item.scheduleType === 'MANUAL' ? '手动触发' : item.scheduleCycle === 'DAY' ? '0 0 8 * * ?' : '0 0 * * * ?',
      expectedStartTime: `${formatDate(addDays(now, index + 1))} ${pad(7 + index)}:00:00`,
      runtimeStartTime: linkedInstance?.runStartTime,
      runtimeEndTime: linkedInstance?.runEndTime,
      runtimeDuration: linkedInstance?.runDurationMs ? `${Math.floor(linkedInstance.runDurationMs / 60000)}分钟` : undefined,
      avgStartTime: `${pad(7 + index)}:${pad(8 + index)}:00`,
      avgEndTime: `${pad(7 + index)}:${pad(34 + index)}:00`,
      avgDuration: `${14 + index * 5}分钟`,
      instanceId: linkedInstance?.taskInstanceId,
      processInstanceId: linkedInstance?.processInstanceId,
      x: 620 + (index % 2) * 70,
      y: 30 + index * 95,
      width,
      height,
    });
  });
  const edges: ScheduleEdgeItem[] = [];
  upstream.forEach((_item, index) => {
    edges.push({ source: `node_up_${index + 1}`, target: 'node_current' });
  });
  downstream.forEach((_item, index) => {
    edges.push({ source: 'node_current', target: `node_down_${index + 1}` });
  });
  if (seed % 2 === 0) {
    edges.push({ source: 'node_up_2', target: 'node_up_3' });
    edges.push({ source: 'node_down_1', target: 'node_down_3' });
  }
  return { task, nodes, edges };
}

export function getDependencyView(taskId: string) {
  return buildGraph(taskId, 'view');
}

export function getDependencyDiagnosis(taskId: string) {
  return buildGraph(taskId, 'diagnosis');
}
