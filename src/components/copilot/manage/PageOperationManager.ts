// PageOperationManager.ts

export interface PageOperation {
  id?: string
  type: string
  source: string
  payload?: any
  timestamp?: number
}

/** Copilot 面板显示/隐藏：payload 为 { visible: boolean; intentTag?: string } */
export const PAGE_OP_COPILOT_VISIBILITY = 'copilot-visibility'

/**
 * Copilot 要求宿主页用生成的 SQL 覆盖当前编辑器。
 * payload: { sessionId?: string; requestId?: string; sqlEdits: unknown[] }
 */
export const PAGE_OP_COPILOT_REPLACE_CODE = 'copilot-replace-code'

/**
 * Copilot 要求宿主页回退上一次 replace-code 产生的改动。
 * payload: { code: string }
 */
export const PAGE_OP_COPILOT_REVERT_CODE = 'copilot-revert-code'

/**
 * Copilot 要求 data-map 页定位到某张表：搜索框填入 tableName 并触发查询。
 * payload: { tableName: string; layer?: string }
 */
export const PAGE_OP_DATA_MAP_LOCATE_TABLE = 'data-map-locate-table'

export type PageOperationHandler = (operation: PageOperation) => void | Promise<void>

class PageOperationManager {

  private handlers: Map<string, PageOperationHandler[]> = new Map()

  register(type: string, handler: PageOperationHandler) {

    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }

    this.handlers.get(type)!.push(handler)
  }

  unregister(type: string, handler?: PageOperationHandler) {

    if (!handler) {
      this.handlers.delete(type)

      return
    }

    const list = this.handlers.get(type)

    if (!list) return

    this.handlers.set(
      type,
      list.filter(h => h !== handler)
    )
  }

  async notify(operation: PageOperation) {

    const list = this.handlers.get(operation.type) || []

    for (const handler of list) {
      await handler(operation)
    }

  }
}

export const pageOperationManager = new PageOperationManager();
