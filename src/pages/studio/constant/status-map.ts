export const ColorMap: Record<string, string> = {
  FINISHED: '#52c41a',
  ABORTED: '#ff4d4f',
  FAILED: '#ff4d4f',
  INIT: '#1677ff',
  ANALYZING: '#fa8c16',
  RUNNING: '#1677ff',
  SUCCESS: '#F3D320',
  ERROR_ABORTED: '#ff4d4f',
  COMMIT: '#d9d9d9',
};

const StatusMap: Record<string, string> = {
  COMMIT: '提交中',
  INIT: '初始化',
  ANALYZING: '解析中',
  RUNNING: '运行中',
  ABORTED: '中止',
  FAILED: '失败',
  FINISHED: '成功',
  SUCCESS: '数据获取中',
  ERROR_ABORTED: '异常终止',
};

export default StatusMap;
