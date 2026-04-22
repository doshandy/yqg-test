/**
 * 数据地图（Data Map）mock 数据
 * 模拟 cn-data-pilot 中 /data-map 的数据资产目录。
 */

export interface DataAssetItem {
  id: string;
  tableName: string;
  database: string;
  layer: 'ods' | 'dwd' | 'dws' | 'ads';
  owner: string;
  description: string;
  rowCount: number;
  storageGb: number;
  lastVisit: string;
  cnName: string;
}

const layers: DataAssetItem['layer'][] = ['ods', 'dwd', 'dws', 'ads'];
const databases = ['finance_dw', 'user_center', 'risk_control', 'marketing'];
const owners = ['alice', 'bob', 'carol', 'dave'];

export const assetList: DataAssetItem[] = Array.from({ length: 60 }, (_, i) => {
  const layer = layers[i % layers.length];
  return {
    id: `t_${String(i + 1).padStart(5, '0')}`,
    tableName: `${layer}_${databases[i % databases.length]}_table_${i + 1}`,
    cnName: `${databases[i % databases.length]}业务数据表_${i + 1}`,
    database: databases[i % databases.length],
    layer,
    owner: owners[i % owners.length],
    description: `${layer.toUpperCase()} 层数据表，承载核心业务明细与轻度汇总数据。`,
    rowCount: Math.floor(Math.random() * 10_000_000),
    storageGb: Number((Math.random() * 100).toFixed(2)),
    lastVisit: `2026-04-${String(((i % 22) + 1)).padStart(2, '0')} 14:30:00`,
  };
});
