/**
 * 指标目录（Metric Catalog）mock 数据
 * 模拟 cn-data-lumina 中 /metric/catalog 的指标列表。
 */

export interface MetricItem {
  id: string;
  name: string;
  englishName: string;
  owner: string;
  domain: string;
  tag: string[];
  status: 'online' | 'offline' | 'draft';
  description: string;
  updatedAt: string;
  usage: number;
}

const domains = ['用户', '交易', '风控', '营销', '资金'];
const owners = ['alice', 'bob', 'carol', 'dave', 'eve'];
const statuses: MetricItem['status'][] = ['online', 'offline', 'draft'];

export const metricList: MetricItem[] = Array.from({ length: 42 }, (_, i) => ({
  id: `m_${String(i + 1).padStart(4, '0')}`,
  name: `${domains[i % domains.length]}指标_${i + 1}`,
  englishName: `metric_${domains[i % domains.length].toLowerCase()}_${i + 1}`,
  owner: owners[i % owners.length],
  domain: domains[i % domains.length],
  tag: i % 2 === 0 ? ['核心指标'] : ['常规指标'],
  status: statuses[i % statuses.length],
  description: `这是第 ${i + 1} 个指标的描述，展示了该指标的业务含义和计算口径。`,
  updatedAt: `2026-0${(i % 4) + 1}-${String((i % 28) + 1).padStart(2, '0')} 10:00:00`,
  usage: Math.floor(Math.random() * 10000),
}));
