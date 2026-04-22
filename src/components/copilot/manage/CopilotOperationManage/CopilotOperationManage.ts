// actionmanage.ts - Copilot 动作与执行管理

export { COPILOT_TRIGGER_EDITOR_EDIT } from './targets'

export interface CopilotAction {
  id: string
  type: 'revert-code' | 'replace-code'
  target: string
  payload: any
}

export type ActionHandler = (action: CopilotAction) => void | Promise<void>

export class CopilotActionManager {
  /** 同一个 target 可以注册多个 handler（多 tab 场景），handler 内部通过 payload.taskCode 自行过滤 */
  private handlers: Map<string, Set<ActionHandler>> = new Map()

  register(target: string, handler: ActionHandler) {
    if (!this.handlers.has(target)) {
      this.handlers.set(target, new Set())
    }

    this.handlers.get(target)!.add(handler)
  }

  unregister(target: string, handler?: ActionHandler) {
    if (handler) {
      const set = this.handlers.get(target)
      if (set) {
        set.delete(handler)
        if (set.size === 0) this.handlers.delete(target)
      }
    } else {
      this.handlers.delete(target)
    }
  }

  async execute(action: CopilotAction) {
    const set = this.handlers.get(action.target)
    if (!set || set.size === 0) {
      console.warn(`No handler registered for target: ${action.target}`)

      return
    }

    for (const handler of set) {
      try {
        await handler(action)
      } catch (err) {
        console.error(`Error executing action on target ${action.target}`, err)
      }
    }
  }

  async executeAll(actions: CopilotAction[]) {
    for (const action of actions) {
      await this.execute(action)
    }
  }
}

export const copilotActionManager = new CopilotActionManager()
