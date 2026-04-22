/**
 * Copilot SSE Mock —— 供 /api/agentic/agent/chat 与 /api/agentic/agent/action 流式接口使用。
 *
 * 数据结构要求（copilot.vue 的 handleStreamData 消费）：
 *   data: { sessionId, requestId, messageSeqNo, phase, delta: { items: [...] } }
 *
 * delta.items 里每个 item：
 *   - renderCategory === 'THOUGHT_CHAIN' —— 思考链，按 type 分：
 *       INTENT_RECOGNITION / EXECUTION_STEP / CONTEXT_READ / THOUGHT_DETAIL
 *   - renderCategory === 'OUTPUT_CONTENT' —— 正文增量文本，合并为 markdown
 *   - renderCategory === 'INTERACTIVE_CARD' —— 卡片（DONE / SQL_DIFF / ...）
 *   - renderCategory === 'FRONTEND_ACTION' —— 前端动作（例如插入 SQL 到编辑器）
 *
 * 最后发一条 phase === 'DONE' 结束流。
 */

export type SseEvent = Record<string, unknown>;

export interface MockChatRequest {
  requestId?: string;
  sessionId?: string | null;
  message?: string;
  taskCode?: string;
  intentTag?: string;
  contextReferences?: Array<{
    type: 'TABLE' | 'CODE_SNIPPET';
    tableName?: string;
    taskName?: string;
    selection?: { startLine?: number; endLine?: number; selectedText?: string };
  }>;
  context?: { currentScriptContent?: string };
}

interface ScriptedChunk {
  /** 距离上一条事件的延迟（毫秒） */
  delay: number;
  payload: SseEvent;
}

/** 简单的会话状态机：记录 sessionId 上次发出的卡片类型，用于后续回复联动 */
const sessionLastCard = new Map<string, 'INTENT_CLARIFY' | 'CONTEXT_REQUIRED' | 'NO_ACCESS' | 'SQL_DIFF' | 'TABLE_CLARIFY' | 'NORMAL'>();

/** 生成一次 mock 会话的 SSE 分片序列 —— 依据用户问的内容挑不同剧本 */
export const buildChatScript = (req: MockChatRequest): ScriptedChunk[] => {
  const sessionId = req.sessionId || `sess_${Date.now()}`;
  const requestId = req.requestId || `req_${Date.now()}`;
  const messageSeqNo = Math.floor(Date.now() / 1000);
  const base = { sessionId, requestId, messageSeqNo };
  const question = (req.message ?? '').trim();
  const intent = (req.intentTag ?? '').toUpperCase();
  const lastCard = sessionLastCard.get(sessionId);

  // 0. 用户在前一轮做了「澄清选择」/「补充上下文」/「表澄清」后，本轮直接产出 SQL diff
  if (lastCard === 'INTENT_CLARIFY' || lastCard === 'CONTEXT_REQUIRED') {
    sessionLastCard.set(sessionId, 'SQL_DIFF');
    return buildSqlDiffFollowupScript(base, req);
  }
  if (lastCard === 'TABLE_CLARIFY') {
    sessionLastCard.set(sessionId, 'SQL_DIFF');
    return buildCreateTableFollowupScript(base, req);
  }

  // 0.5. 触发「建表/关联表澄清」：包含「建表 / 新建表 / create table」等关键字
  if (/建表|新建表|建一张|建张|create\s+table/i.test(question)) {
    sessionLastCard.set(sessionId, 'TABLE_CLARIFY');
    return buildTableClarifyScript(base, req);
  }

  // 0.6. 触发「定位表」：data-map 页专属，抛 LOCATE_TABLE FRONTEND_ACTION
  if (/定位|找表|在图谱|跳转到|定位到/i.test(question)) {
    sessionLastCard.set(sessionId, 'NORMAL');
    return buildLocateTableScript(base, req);
  }

  // 1. 触发「无权限」剧本：问题里包含特定敏感表
  if (/risk_event|user_pii|sensitive|风控明细/i.test(question)) {
    sessionLastCard.set(sessionId, 'NO_ACCESS');
    return buildNoAccessScript(base, req);
  }

  // 2. 触发「缺上下文」剧本：纯模糊问题，没有任何表线索
  if (/^(查一下|看看|分析一下|了解|怎么样|多少|有什么)/.test(question)
      && !/订单|用户|order|user|表|table/i.test(question)) {
    sessionLastCard.set(sessionId, 'CONTEXT_REQUIRED');
    return buildContextRequiredScript(base, req);
  }

  // 3. 触发「意图澄清」剧本：包含「哪个/哪种/哪张」等含糊词
  if (/哪个|哪种|哪张|哪些表|不太确定|有歧义|歧义/i.test(question)) {
    sessionLastCard.set(sessionId, 'INTENT_CLARIFY');
    return buildIntentClarifyScript(base, req);
  }

  // 4. 代码生成 / 解释 / 默认 —— 复用原有剧本
  const wantsCodeGen =
    intent === 'CODE_GENERATE' ||
    /写.*SQL|生成.*SQL|查询|统计|select|帮我写|create|insert|update|帮我生成|帮我查/i.test(
      question,
    );
  const wantsExplain =
    intent === 'CODE_EXPLAIN' || /解释|什么意思|explain|是什么|作用/i.test(question);

  sessionLastCard.set(sessionId, 'NORMAL');
  if (wantsCodeGen) {
    return buildCodeGenScript(base, req);
  }
  if (wantsExplain) {
    return buildExplainScript(base, req);
  }
  return buildDefaultScript(base, req);
};

/** 剧本 A：代码生成（含 SQL diff 卡 + 前端动作） */
const buildCodeGenScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];

  // 1. 先发意图识别
  chunks.push({
    delay: 80,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '代码生成 (CODE_GENERATE)',
          },
        ],
      },
    },
  });

  // 2. 执行步骤 —— 分两步发出，并更新状态
  chunks.push({
    delay: 150,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'EXECUTION_STEP',
            steps: [
              { index: 1, title: '分析上下文与字段信息', status: 'RUNNING' },
            ],
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 600,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'EXECUTION_STEP',
            steps: [
              { index: 1, title: '分析上下文与字段信息', status: 'DONE' },
              { index: 2, title: '基于业务目标生成 SQL', status: 'RUNNING' },
            ],
          },
        ],
      },
    },
  });

  // 3. 上下文读取
  chunks.push({
    delay: 300,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'CONTEXT_READ',
            contextReads: [
              { type: 'TABLE', tableName: 'dw.user_order_d' },
              { type: 'TABLE', tableName: 'dim.user_info' },
            ],
          },
        ],
      },
    },
  });

  // 4. 思考详情
  const thoughtPieces = [
    '根据你的问题，需要统计近 7 天的订单数据；',
    '订单事实表为 `dw.user_order_d`，按 `ds` 分区；',
    '维度表 `dim.user_info` 提供用户基础信息，按 `user_id` 关联。',
  ];
  for (const piece of thoughtPieces) {
    chunks.push({
      delay: 260,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [
            {
              renderCategory: 'THOUGHT_CHAIN',
              type: 'THOUGHT_DETAIL',
              thought: piece + '\n',
            },
          ],
        },
      },
    });
  }

  // 5. OUTPUT_CONTENT —— 正文分片推送
  const reply =
    '已为你生成查询最近 7 天订单并按城市聚合的 SQL：\n\n' +
    '```sql\n' +
    '-- 最近 7 天城市维度订单量统计\n' +
    'SELECT\n' +
    '    u.city,\n' +
    '    COUNT(o.order_id)         AS order_cnt,\n' +
    '    SUM(o.order_amount)       AS order_amount,\n' +
    '    COUNT(DISTINCT o.user_id) AS user_cnt\n' +
    'FROM dw.user_order_d o\n' +
    'JOIN dim.user_info  u ON u.user_id = o.user_id\n' +
    "WHERE o.ds >= date_sub(current_date, 7)\n" +
    '  AND o.status = 1\n' +
    'GROUP BY u.city\n' +
    'ORDER BY order_cnt DESC\n' +
    'LIMIT 100;\n' +
    '```\n\n' +
    '你可以点击下方「采纳」按钮，将该 SQL 插入到编辑器。';
  for (const piece of splitForStream(reply, 24)) {
    chunks.push({
      delay: 55,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }

  // 6. 执行步骤收尾
  chunks.push({
    delay: 200,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'EXECUTION_STEP',
            steps: [
              { index: 1, title: '分析上下文与字段信息', status: 'DONE' },
              { index: 2, title: '基于业务目标生成 SQL', status: 'DONE' },
            ],
          },
        ],
      },
    },
  });

  // 7. DONE 卡
  chunks.push({
    delay: 200,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'INTERACTIVE_CARD',
            type: 'DONE_CARD',
            title: '已为你生成 SQL 代码',
            summary: '点击右上角「采纳」可一键插入，或点击「回退」恢复原代码。',
          },
        ],
      },
    },
  });

  // 8. 结束
  chunks.push({
    delay: 120,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });

  return chunks;
};

/** 剧本 B：解释代码 */
const buildExplainScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  chunks.push({
    delay: 80,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '代码解释 (CODE_EXPLAIN)',
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 120,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'EXECUTION_STEP',
            steps: [
              { index: 1, title: '解析 SQL 语法树', status: 'DONE' },
              { index: 2, title: '提炼逻辑并翻译', status: 'RUNNING' },
            ],
          },
        ],
      },
    },
  });

  const hasSnippet = (req.contextReferences ?? []).some(
    (c) => c.type === 'CODE_SNIPPET',
  );
  const replyBody =
    '这段 SQL 的主要作用是：\n\n' +
    '1. **来源**：从事实表 `dw.user_order_d` 读取最近 7 天的订单。\n' +
    '2. **关联**：通过 `user_id` 与 `dim.user_info` 关联，取得城市维度。\n' +
    '3. **聚合**：按城市分组统计订单数、金额、去重用户数。\n' +
    '4. **过滤**：只统计 `status = 1` 有效订单。\n' +
    '5. **排序**：按订单数倒序，展示 Top 100。\n\n' +
    (hasSnippet
      ? '> 已基于你选中的代码片段进行解释。'
      : '> 未选中具体代码片段，以上为示例解释。');
  for (const piece of splitForStream(replyBody, 18)) {
    chunks.push({
      delay: 50,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }

  chunks.push({
    delay: 120,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 剧本 C：默认 —— 简单思考 + 回复 */
const buildDefaultScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  chunks.push({
    delay: 60,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '对话交流 (CHIT_CHAT)',
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 120,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'THOUGHT_DETAIL',
            thought: '理解用户意图，准备通用回复。\n',
          },
        ],
      },
    },
  });

  const reply =
    '你好，我是 **DataPilot Copilot**（单机 Mock 模式）。\n\n' +
    '我可以帮你：\n\n' +
    '- 写 SQL（输入「帮我写一段 …… 的 SQL」）\n' +
    '- 解释代码（输入「解释这段 SQL」）\n' +
    '- 代码优化、注释、改写\n\n' +
    '当前问题：**' +
    (req.message ?? '') +
    '**\n\n' +
    '以上回复为前端示例数据，真实部署后会由后端模型生成。';
  for (const piece of splitForStream(reply, 20)) {
    chunks.push({
      delay: 50,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }
  chunks.push({
    delay: 120,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 剧本 D：意图澄清 —— SHOW_INTENT_CLARIFY_CARD */
const buildIntentClarifyScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  chunks.push({
    delay: 60,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '需要进一步澄清意图',
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 200,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'THOUGHT_DETAIL',
            thought:
              '问题中提到的目标对象在仓库里存在多张候选表，需要你帮我确认。\n',
          },
        ],
      },
    },
  });
  for (const piece of splitForStream(
    '我在仓库里找到了几张可能匹配的表，请帮我选择你最想分析的那一张：',
    16,
  )) {
    chunks.push({
      delay: 50,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }
  // 卡片：意图澄清
  chunks.push({
    delay: 250,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'INTERACTIVE_CARD',
            type: 'FRONTEND_ACTION',
            actionCode: 'SHOW_INTENT_CLARIFY_CARD',
            actionData: {
              clarifyType: 'TABLE_DISAMBIGUATION',
              message: `您提到的「${(req.message ?? '').slice(0, 18)}…」匹配到以下候选表，请选择目标表：`,
              multiSelect: false,
              options: [
                {
                  value: 'dw.user_order_d',
                  label: 'dw.user_order_d',
                  description: '订单事实表（按 ds 分区）',
                },
                {
                  value: 'ods.ods_order_raw',
                  label: 'ods.ods_order_raw',
                  description: '原始订单贴源表',
                },
                {
                  value: 'ads.ads_order_summary',
                  label: 'ads.ads_order_summary',
                  description: '订单汇总应用层表',
                },
              ],
            },
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 100,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 剧本 E：缺上下文 —— REQUIRE_CONTEXT */
const buildContextRequiredScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  _req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  chunks.push({
    delay: 80,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '上下文不足，请补充数据源',
          },
        ],
      },
    },
  });
  for (const piece of splitForStream(
    '你的问题比较开放，我无法直接定位到具体的数据源。请关联一下你想分析的数据表，我会基于这些表给你生成可执行的 SQL。',
    18,
  )) {
    chunks.push({
      delay: 45,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }
  chunks.push({
    delay: 250,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'INTERACTIVE_CARD',
            type: 'FRONTEND_ACTION',
            actionCode: 'REQUIRE_CONTEXT',
            actionData: {
              contextType: 'TABLE',
              message:
                '您的问题较为模糊，且系统未能自动检索到相关的数据源。为了生成准确的代码，请协助补充信息：',
              multiSelect: true,
              options: [
                { value: 'associate_table', label: '关联数据表' },
              ],
            },
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 100,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 剧本 F：无访问权限 —— SHOW_PERMISSION_CARD */
const buildNoAccessScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  _req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  chunks.push({
    delay: 60,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '检测到未授权表访问',
          },
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'CONTEXT_READ',
            contextReads: [
              { type: 'TABLE', tableName: 'dw.risk_event_d' },
              { type: 'TABLE', tableName: 'ods.user_pii_raw' },
            ],
          },
        ],
      },
    },
  });
  for (const piece of splitForStream(
    '检测到目标查询涉及敏感表，但你没有相关访问权限。请先申请权限再发起查询：',
    18,
  )) {
    chunks.push({
      delay: 45,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }
  chunks.push({
    delay: 250,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'INTERACTIVE_CARD',
            type: 'FRONTEND_ACTION',
            actionCode: 'SHOW_PERMISSION_CARD',
            actionData: {
              message: '以下数据表暂无访问权限，请先申请权限后再继续：',
              tables: [
                { tableName: 'dw.risk_event_d', permissionType: 'READ' },
                { tableName: 'ods.user_pii_raw', permissionType: 'WRITE' },
              ],
            },
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 100,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 剧本 G：澄清后续 —— SHOW_SQL_DIFF_CARD + scriptEdits 注入编辑器 */
const buildSqlDiffFollowupScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  _req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  chunks.push({
    delay: 80,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '基于澄清结果生成 SQL',
          },
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'EXECUTION_STEP',
            steps: [
              { index: 1, title: '收集字段信息', status: 'DONE' },
              { index: 2, title: '生成可执行 SQL', status: 'DONE' },
            ],
          },
        ],
      },
    },
  });
  const reply =
    '已根据你的选择生成 SQL，并在编辑器中替换了原有内容。点击「采纳」可保留，点击「回退」可恢复。';
  for (const piece of splitForStream(reply, 16)) {
    chunks.push({
      delay: 45,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }
  const generatedSql =
    '-- 基于你选定的目标表生成的查询\n' +
    'SELECT\n' +
    '    ds,\n' +
    '    COUNT(order_id) AS order_cnt,\n' +
    '    SUM(order_amount) AS amount\n' +
    'FROM dw.user_order_d\n' +
    "WHERE ds >= date_sub(current_date, 7)\n" +
    'GROUP BY ds\n' +
    'ORDER BY ds;\n';
  chunks.push({
    delay: 250,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'INTERACTIVE_CARD',
            type: 'FRONTEND_ACTION',
            actionCode: 'SHOW_SQL_DIFF_CARD',
            actionData: {
              checkpointId: `cp_${Date.now()}`,
              language: 'hive_sql',
              commandType: 'REPLACE',
              message: '已生成新 SQL，已写入编辑器（mock 单机演示）',
              sql: generatedSql,
              scriptEdits: [
                {
                  id: `edit_${Date.now()}`,
                  type: 'REPLACE',
                  startLine: 1,
                  endLine: 1,
                  content: generatedSql,
                  newText: generatedSql,
                },
              ],
            },
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 100,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 剧本 H：建表/关联表澄清 —— SHOW_TABLE_CLARIFY_CARD，给出几张候选母表让用户选一张作为新表的参照 */
const buildTableClarifyScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  chunks.push({
    delay: 60,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '检测到建表意图，需要澄清参照母表',
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 180,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'THOUGHT_DETAIL',
            thought: '检索近 30 天高频访问的同域表，筛出 3 张最可能作为母表的候选。\n',
          },
        ],
      },
    },
  });
  for (const piece of splitForStream(
    '为了生成准确的建表语句，请选择要关联/继承字段的母表：',
    16,
  )) {
    chunks.push({
      delay: 45,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }
  chunks.push({
    delay: 240,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'INTERACTIVE_CARD',
            type: 'FRONTEND_ACTION',
            actionCode: 'SHOW_TABLE_CLARIFY_CARD',
            actionData: {
              clarifyType: 'TABLE_CLARIFY',
              message: `你要新建的表「${(req.message ?? '').slice(0, 16)}…」缺少字段定义，请选择一张作为字段模板的母表：`,
              multiSelect: false,
              options: [
                { value: 'dw.user_order_d', label: 'dw.user_order_d（订单事实表）' },
                { value: 'dw.user_profile_d', label: 'dw.user_profile_d（用户画像表）' },
                { value: 'ods.ods_order_raw', label: 'ods.ods_order_raw（订单贴源表）' },
              ],
            },
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 100,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 剧本 I：建表澄清后续 —— 根据选中的母表产出 CREATE TABLE 语句并插入编辑器 */
const buildCreateTableFollowupScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  const referenceTable =
    req.contextReferences?.find((r) => r.type === 'TABLE')?.tableName ?? 'dw.user_order_d';
  chunks.push({
    delay: 80,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: `基于母表 ${referenceTable} 生成建表语句`,
          },
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'EXECUTION_STEP',
            steps: [
              { index: 1, title: '读取母表字段信息', status: 'DONE' },
              { index: 2, title: '生成 CREATE TABLE 语句', status: 'DONE' },
            ],
          },
        ],
      },
    },
  });
  for (const piece of splitForStream(
    `已基于母表 ${referenceTable} 的字段生成建表 SQL，写入编辑器。`,
    16,
  )) {
    chunks.push({
      delay: 45,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }
  const newTable = `dw.${referenceTable.split('.').pop() ?? 'tbl'}_new_d`;
  const createSql =
    `-- 新建表（参照 ${referenceTable} 的字段结构）\n` +
    `CREATE TABLE IF NOT EXISTS ${newTable} (\n` +
    '    ds              STRING    COMMENT \'分区键 yyyymmdd\',\n' +
    '    user_id         BIGINT    COMMENT \'用户 ID\',\n' +
    '    order_id        BIGINT    COMMENT \'订单 ID\',\n' +
    '    order_amount    DECIMAL(18, 2) COMMENT \'订单金额\',\n' +
    '    created_at      TIMESTAMP COMMENT \'创建时间\'\n' +
    ')\n' +
    `COMMENT '参照 ${referenceTable} 新建的事实表'\n` +
    'PARTITIONED BY (ds)\n' +
    'STORED AS PARQUET;\n';
  chunks.push({
    delay: 240,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'INTERACTIVE_CARD',
            type: 'FRONTEND_ACTION',
            actionCode: 'SHOW_SQL_DIFF_CARD',
            actionData: {
              checkpointId: `cp_${Date.now()}`,
              language: 'hive_sql',
              commandType: 'REPLACE',
              message: `已基于母表 ${referenceTable} 生成 CREATE TABLE 语句`,
              sql: createSql,
              scriptEdits: [
                {
                  id: `edit_${Date.now()}`,
                  type: 'REPLACE',
                  startLine: 1,
                  endLine: 1,
                  content: createSql,
                  newText: createSql,
                },
              ],
            },
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 100,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 剧本 J：data-map 定位表 —— LOCATE_TABLE，由宿主页（data-map）消费，把表名回填到搜索框 */
const buildLocateTableScript = (
  base: { sessionId: string; requestId: string; messageSeqNo: number },
  req: MockChatRequest,
): ScriptedChunk[] => {
  const chunks: ScriptedChunk[] = [];
  const question = (req.message ?? '').trim();
  // 简单从问题中抠出一个候选表名，抠不到就给个默认值
  const match = question.match(/([a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*)/i);
  const tableName = match?.[1] ?? 'dw.user_order_d';
  const layer = tableName.split('.')[0]?.toLowerCase() ?? '';

  chunks.push({
    delay: 60,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'THOUGHT_CHAIN',
            type: 'INTENT_RECOGNITION',
            intent: '在数据地图中定位表',
          },
        ],
      },
    },
  });
  for (const piece of splitForStream(
    `已为你在数据地图中定位到 ${tableName}，搜索条件已同步更新。`,
    16,
  )) {
    chunks.push({
      delay: 45,
      payload: {
        ...base,
        phase: 'STREAMING',
        delta: {
          items: [{ renderCategory: 'OUTPUT_CONTENT', content: piece }],
        },
      },
    });
  }
  chunks.push({
    delay: 200,
    payload: {
      ...base,
      phase: 'STREAMING',
      delta: {
        items: [
          {
            renderCategory: 'INTERACTIVE_CARD',
            type: 'FRONTEND_ACTION',
            actionCode: 'LOCATE_TABLE',
            actionData: {
              tableName,
              layer: ['ods', 'dwd', 'dws', 'ads'].includes(layer) ? layer : undefined,
            },
          },
        ],
      },
    },
  });
  chunks.push({
    delay: 100,
    payload: { ...base, phase: 'DONE', delta: { items: [] } },
  });
  return chunks;
};

/** 按 chunkSize 切分字符串 —— 支持在中英文/符号处粗粒度截断 */
const splitForStream = (text: string, chunkSize: number): string[] => {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    out.push(text.slice(i, i + chunkSize));
  }
  return out;
};

// ---------- 其它 Copilot 接口的 mock 数据 ----------

/** 与线上 /api/agentic/agent/quick-intents 返回 body 结构一致 */
export const mockQuickIntents = [
  { value: 'CODE_GENERATE', label: '代码生成', code: null },
  { value: 'CODE_EXPLAIN', label: '代码解释', code: null },
  { value: 'CODE_FIX', label: '代码纠错', code: null },
  { value: 'CODE_COMMENT', label: '代码注释', code: null },
  { value: 'CODE_REWRITE', label: '代码改写', code: null },
  { value: 'CODE_OPTIMIZE', label: '代码优化', code: null },
];

export const mockSessionList = () => ({
  items: [
    {
      sessionId: 'sess_demo_1',
      title: '最近 7 天订单分析',
      lastActiveTime: Date.now() - 1000 * 60 * 60 * 2,
      taskCode: 'task_demo_1',
    },
    {
      sessionId: 'sess_demo_2',
      title: '用户留存表优化',
      lastActiveTime: Date.now() - 1000 * 60 * 60 * 24,
      taskCode: 'task_demo_2',
    },
  ],
  total: 2,
  pageNo: 1,
  pageSize: 20,
});

export const mockFeatureStatus = {
  chatEnabled: true,
  diffEnabled: true,
  mcpEnabled: false,
};

export const mockDatabases = [
  { name: 'dw', description: '数据仓库' },
  { name: 'dim', description: '维度层' },
  { name: 'ods', description: '源贴近层' },
  { name: 'ads', description: '应用层' },
];

const MOCK_TABLES_BY_DB: Record<string, string[]> = {
  dw: ['user_order_d', 'user_behavior_d', 'payment_flow_d', 'risk_event_d'],
  dim: ['user_info', 'city_info', 'product_info'],
  ods: ['ods_order_raw', 'ods_user_register'],
  ads: ['ads_user_portrait', 'ads_retention_trend'],
};

export const mockTablesByDatabase = (
  databaseName: string,
  keyword?: string,
) => {
  const list = MOCK_TABLES_BY_DB[databaseName] ?? [];
  const filtered = keyword
    ? list.filter((t) => t.includes(keyword.toLowerCase()))
    : list;
  return {
    items: filtered.map((tableName) => ({
      databaseName,
      tableName,
      owner: 'alice',
      description: `${databaseName}.${tableName} 示例表`,
    })),
    total: filtered.length,
  };
};

export type EnumOptionItem = {
  value: string;
  label: string;
  code: string | null;
};

/** /api/agentic/enums/:name 通用 mock（body 项含 code，可为 null） */
export const mockEnum = (name: string): EnumOptionItem[] => {
  const map: Record<string, EnumOptionItem[]> = {
    IntentType: [
      { value: 'CODE_GENERATE', label: '代码生成', code: null },
      { value: 'SQL_REFINE', label: 'SQL修改', code: null },
      { value: 'CODE_REWRITE', label: '代码改写', code: null },
      { value: 'CODE_EXPLAIN', label: '代码解释', code: null },
      { value: 'CODE_FIX', label: '代码纠错', code: null },
      { value: 'CODE_COMMENT', label: '代码注释', code: null },
      { value: 'CODE_OPTIMIZE', label: '代码优化', code: null },
      { value: 'OUT_OF_SCOPE', label: '超出范围', code: null },
    ],
    AGENT_TYPE: [
      { value: 'TEXT2SQL', label: 'SQL 生成', code: null },
      { value: 'ANALYST', label: '数据分析', code: null },
    ],
    FEEDBACK_REASON: [
      { value: 'INACCURATE', label: '结果不准确', code: null },
      { value: 'INCOMPLETE', label: '结果不完整', code: null },
      { value: 'OFF_TOPIC', label: '偏离问题', code: null },
    ],
  };
  return map[name] ?? [];
};

export const mockRecentMessages = () => ({
  items: [],
  hasMore: false,
  pageNo: 1,
  pageSize: 20,
});

export const mockCheckpoint = () => ({
  previousCode: '',
  userMessageContent: '',
});
