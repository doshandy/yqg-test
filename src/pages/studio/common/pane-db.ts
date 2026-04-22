/**
 * 单机 mock 版本：替代原版 @/utils/db/paneDB.getPaneList
 * 原版从 IndexedDB 里读取「压缩的 pane list 字符串」；单机场景下我们通过一个
 * 全局 ref + studio/index.vue 的 paneList 保持同步，这里只返回 JSON 字符串。
 */
let compressed = '[]';

export const setPaneListSnapshot = (panes: any[]) => {
  try {
    compressed = JSON.stringify(
      panes.map((p) => ({
        taskId: p.taskId ?? p.id,
        folderKey: p.folderKey ?? p.key,
      })),
    );
  } catch (e) {
    console.error('[pane-db] setPaneListSnapshot', e);
  }
};

export const getPaneList = async (): Promise<string> => compressed;
