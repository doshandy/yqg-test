/**
 * data-map-agent 专用 mock 数据：会话历史 / 收藏表 / 推荐提示词 / 分享。
 * 所有接口遵循 `{ status: { code: 0, detail: 'ok' }, body }` 返回结构。
 */

import type { SessionItem, FavoriteItem } from '@/pages/data-map-agent/constant';

const now = Date.now();
const day = 24 * 3600 * 1000;

const baseSession = (
  id: string,
  title: string,
  offsetDays: number,
): SessionItem => ({
  id,
  title,
  agentType: 'DATA_MAP',
  status: 'ACTIVE',
  summary: '',
  taskCode: '',
  projectId: 'demo',
  createdAt: new Date(now - offsetDays * day).toISOString(),
  lastActiveAt: new Date(now - offsetDays * day + 3600 * 1000).toISOString(),
});

export const dataMapRecentSessions: SessionItem[] = [
  baseSession('dmsess_r1', '近 30 天订单表资产梳理', 0),
  baseSession('dmsess_r2', 'ODS 用户表字段变更影响', 1),
  baseSession('dmsess_r3', '支付主题域血缘排查', 2),
];

export const dataMapEarlierSessions: SessionItem[] = [
  baseSession('dmsess_e1', '维度退化：商品 SKU 规范化', 5),
  baseSession('dmsess_e2', 'DWS 层聚合表健康度评估', 7),
  baseSession('dmsess_e3', 'ADS 看板数据口径对齐', 12),
  baseSession('dmsess_e4', '弃用表清理：最近 90 天未访问', 20),
  baseSession('dmsess_e5', '跨库联邦查询可行性分析', 33),
];

export const dataMapFavoriteTables: FavoriteItem[] = [
  {
    databaseName: 'dw',
    tableName: 'user_order_d',
    owner: 'data_platform',
    description: '订单事实表（按 ds 分区）',
    favorited: true,
    ownerDisplayName: '数据平台团队',
  },
  {
    databaseName: 'dw',
    tableName: 'user_profile_d',
    owner: 'user_team',
    description: '用户画像主表',
    favorited: true,
    ownerDisplayName: '用户中台',
  },
  {
    databaseName: 'ads',
    tableName: 'ads_order_summary',
    owner: 'biz_analysis',
    description: '订单汇总应用层表',
    favorited: true,
    ownerDisplayName: '业务分析',
  },
];

export interface SuggestedPrompt {
  value: string;
  title: string;
  promptTemplate: string;
}

export const dataMapSuggestedPrompts: SuggestedPrompt[] = [
  {
    value: 'find-table',
    title: '找表',
    promptTemplate: '帮我在数据地图里找到订单主题域的核心事实表',
  },
  {
    value: 'lineage',
    title: '查血缘',
    promptTemplate: '分析一下 dw.user_order_d 的上下游血缘',
  },
  {
    value: 'field-change',
    title: '字段变更影响',
    promptTemplate: '如果我要修改 ods.ods_order_raw 的 user_id 字段类型，会影响哪些下游',
  },
  {
    value: 'duplicate-check',
    title: '重复表检测',
    promptTemplate: '帮我找一下 dw 库里是否存在口径重复的订单表',
  },
];

/** 分享详情（mock 用，通过 shareId 取） */
export const dataMapShareDetails: Record<string, unknown> = {};
