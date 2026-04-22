/**
 * 发布订阅：通知 sql-query 刷新任务树并打开/切换对应任务
 * 复刻自 cn-data-pilot/pages/data-develop/sql/common/sql-query-event.ts
 */
type Listener = (payload: { taskId: string | number }) => void;

const listeners: Listener[] = [];

export function subscribeSqlQueryRefresh(fn: Listener) {
  listeners.push(fn);

  return () => {
    const i = listeners.indexOf(fn);
    if (i > -1) listeners.splice(i, 1);
  };
}

export function publishSqlQueryRefresh(payload: {
  taskId: string | number;
}) {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error('[sql-query-event]', e);
    }
  });
}
