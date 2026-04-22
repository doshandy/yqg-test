/**
 * 单机 mock 版本的 TaskTypeEnum 存根
 * 原版走 `@yqg/enum` 的 Enum.query 封装；单机下我们直接自行拉一次并缓存
 */
import Sql from '@/resources/sql';

interface TaskTypeOption {
  label: string;
  value: string;
}

class TaskTypeEnumImpl {
  LIST: TaskTypeOption[] = [];
  private loaded = false;
  private pending: Promise<void> | null = null;

  async query() {
    if (this.loaded) return;
    if (this.pending) {
      await this.pending;
      return;
    }

    this.pending = (async () => {
      try {
        const { data } = await Sql.getTaskTypeList({
          params: { taskModule: 'DATA_DEVELOPMENT' },
          hideLoading: true,
        });
        this.LIST = (data?.body || []).map((item: any) => ({
          label: item.label,
          value: item.value,
        }));
        this.loaded = true;
      } catch (e) {
        console.error('[TaskTypeEnum] query failed', e);
      } finally {
        this.pending = null;
      }
    })();
    await this.pending;
  }
}

export const TaskTypeEnum = new TaskTypeEnumImpl();
