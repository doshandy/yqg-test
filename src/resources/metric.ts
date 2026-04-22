/**
 * 指标目录接口。
 */

import { httpGet } from '@/utils/request';
import type { MetricItem } from '@/mocks/data/metric';

export interface PageResult<T> {
  items: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface MetricQuery {
  keyword?: string;
  status?: string;
  pageNo?: number;
  pageSize?: number;
}

const MetricApi = {
  fetchList: (params: MetricQuery) =>
    httpGet<PageResult<MetricItem>>('/api/metric/list', { params }),
  fetchDetail: (id: string) => httpGet<MetricItem>(`/api/metric/detail/${id}`),
};

export type { MetricItem };
export default MetricApi;
