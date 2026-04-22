/**
 * 单机 mock 版本：替代原版 @/store/sql 中与 sider 相关的少量状态
 * 仅保留 sql-sider / sql-query 真正用到的字段
 */
import { ref } from 'vue';

const siderFolded = ref(false);
const activeTabKey = ref<string | number>('');
const sqlExpandedKeys = ref<(string | number)[]>([]);
const sqlSelectedKeys = ref<(string | number)[]>([]);

export const useSqlSiderState = () => {
  return {
    siderFolded,
    activeTabKey,
    sqlExpandedKeys,
    sqlSelectedKeys,
    setSiderFolded(v: boolean) {
      siderFolded.value = v;
    },
    setActiveTabKey(v: string | number) {
      activeTabKey.value = v;
    },
    setSqlExpandedKeys(v: (string | number)[]) {
      sqlExpandedKeys.value = [...v];
    },
    setSqlSelectedKeys(v: (string | number)[]) {
      sqlSelectedKeys.value = [...v];
    },
  };
};
