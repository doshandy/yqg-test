/**
 * 单机 mock 版本：替代原版 useEditorStore().setNewPane
 * 通过轻量 pub/sub 将 sql-sider 点击任务事件传递给 /studio/index.vue 的 paneList
 */
type Listener = (payload: any) => void;

const listeners: Listener[] = [];

export const subscribeNewPane = (fn: Listener) => {
  listeners.push(fn);

  return () => {
    const i = listeners.indexOf(fn);
    if (i > -1) listeners.splice(i, 1);
  };
};

export const setNewPane = (payload: any) => {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error('[editor-bridge] setNewPane error', e);
    }
  });
};

/**
 * 暴露 useEditorStore 同名 API，让原版 sql-query.vue 能无侵入使用
 */
export const useEditorStore = () => ({ setNewPane });
