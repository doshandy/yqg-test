/**
 * 数据地图（Data Map）接口。
 */

import { httpGet } from '@/utils/request';
import type { DataAssetItem } from '@/mocks/data/datamap';
import type { PageResult } from './metric';

export interface AssetQuery {
  keyword?: string;
  layer?: string;
  pageNo?: number;
  pageSize?: number;
}

const DataMapApi = {
  fetchAssetList: (params: AssetQuery) =>
    httpGet<PageResult<DataAssetItem>>('/api/datamap/asset/list', { params }),
  fetchAssetDetail: (id: string) =>
    httpGet<DataAssetItem>(`/api/datamap/asset/detail/${id}`),
};

export type { DataAssetItem };
export default DataMapApi;
