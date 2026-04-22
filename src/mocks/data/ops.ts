/**
 * 任务运维（Ops）mock 数据
 */

export type TaskStatus = 'ONLINE' | 'OFFLINE';
export type RunStatus = 'SUCCESS' | 'RUNNING' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export interface OpsTask {
  taskId: string;
  taskInstanceId?: string;
  processInstanceId?: string;
  taskName: string;
  taskDescription?: string;
  taskType: string;
  taskStatus: TaskStatus;
  owner: string;
  releaseDate: string;
  scheduleType: 'NORMAL' | 'MATRIX';
  scheduleCycle: 'MINUTE' | 'HOUR' | 'DAY' | 'MONTH';
  lastScheduleBatch?: string;
  lastRunStatus: RunStatus;
  lastRunStartTime?: string;
  lastRunEndTime?: string;
  lastRunDurationMs?: number;
}

const TASK_TYPES = ['HIVE_SQL', 'SPARK_SQL', 'SPARK_PYTHON', 'DATA_INTEGRATION', 'NOTEBOOK'];
const OWNERS = ['alice', 'bob', 'carol', 'david', 'ellen', 'frank'];

function d(offsetHours: number) {
  const ts = Date.now() - offsetHours * 3600 * 1000;
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19);
}

export const buildTaskTypeOptions = () =>
  TASK_TYPES.map((t) => ({ label: t, value: t }));

export const buildOwnerOptions = () =>
  OWNERS.map((o) => ({ label: o, value: o }));

export const buildOpsTasks = (): OpsTask[] => {
  const list: OpsTask[] = [];
  for (let i = 0; i < 85; i++) {
    const statusPick = i % 7;
    const runStatus: RunStatus =
      statusPick === 0 ? 'RUNNING'
      : statusPick === 1 ? 'FAILED'
      : statusPick === 2 ? 'PENDING'
      : statusPick === 6 ? 'NOT_RUN'
      : 'SUCCESS';
    const startOffset = 1 + i * 2;
    list.push({
      taskId: `T${100000 + i}`,
      taskInstanceId: runStatus === 'NOT_RUN' ? undefined : `TI${100000 + i}`,
      processInstanceId: runStatus === 'NOT_RUN' ? undefined : `PI${100000 + i}`,
      taskName: `任务 ${i + 1} · 数据开发`,
      taskDescription: i % 3 === 0 ? `负责 ${TASK_TYPES[i % TASK_TYPES.length]} 的日常作业` : '',
      taskType: TASK_TYPES[i % TASK_TYPES.length],
      taskStatus: i % 5 === 4 ? 'OFFLINE' : 'ONLINE',
      owner: OWNERS[i % OWNERS.length],
      releaseDate: d(24 * (30 + (i % 90))).slice(0, 10),
      scheduleType: i % 8 === 0 ? 'MATRIX' : 'NORMAL',
      scheduleCycle: (['MINUTE', 'HOUR', 'DAY', 'MONTH'] as const)[i % 4],
      lastScheduleBatch: d(24 * (i % 10)).slice(0, 10),
      lastRunStatus: runStatus,
      lastRunStartTime: runStatus === 'NOT_RUN' ? undefined : d(startOffset),
      lastRunEndTime:
        runStatus === 'RUNNING' || runStatus === 'PENDING' || runStatus === 'NOT_RUN'
          ? undefined
          : d(startOffset - (0.1 + Math.random() * 0.4)),
      lastRunDurationMs:
        runStatus === 'RUNNING' || runStatus === 'PENDING' || runStatus === 'NOT_RUN'
          ? undefined
          : Math.floor(1000 * (30 + Math.random() * 600)),
    });
  }
  return list;
};

/** 构建一整份日志（每次请求返回一段） */
export function buildLogChunk(offset: number, lines = 80): { log: string; lineCount: number } {
  const now = Date.now();
  const rows: string[] = [];
  for (let i = 0; i < lines; i++) {
    const lineIdx = offset + i + 1;
    const ts = new Date(now - (lines - i) * 500).toISOString().replace('T', ' ').slice(0, 19);
    const level = i % 23 === 0 ? '[ERROR]' : i % 9 === 0 ? '[WARN]' : '[INFO]';
    const seg = [
      `${ts} ${level} Process line #${lineIdx}`,
      i % 15 === 0 ? `taskAppId=application_1734522${lineIdx}_001` : '',
      i % 11 === 0 ? `stage=shuffleRead partitions=${Math.floor(Math.random() * 200)}` : '',
      i % 8 === 0 ? `bytesRead=${(Math.random() * 1024 * 1024 * 512).toFixed(0)}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    rows.push(seg);
  }
  return { log: rows.join('\n') + '\n', lineCount: lines };
}

export function buildLogTabs(offset: number) {
  // 两个 tab：stdout、stderr
  const stdout = buildLogChunk(offset, 80);
  const stderr = {
    log: offset === 0 ? '[INFO] YARN container launched\n[INFO] Executor registered\n' : '',
    lineCount: offset === 0 ? 2 : 0,
  };
  return [
    {
      name: 'stdout',
      log: stdout.log,
      lineCount: stdout.lineCount,
      appLink: { 'application_17345000001_001': 'https://example.com/yarn/app/1' },
    },
    {
      name: 'stderr',
      log: stderr.log,
      lineCount: stderr.lineCount,
      appLink: {},
    },
  ];
}
