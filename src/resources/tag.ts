/**
 * 标签管理接口（骨架版）
 */

import { httpGet, type YqgResponse } from '@/utils/request';
import type {
  TagMenuNode,
  MetricItem,
  RuleTagItem,
  GroupItem,
  QueryStatItem,
  SystemAuthItem,
  CategoryItem,
} from '@/mocks/data/tag';

const unwrap = <T>(res: YqgResponse<T>): T => res.data.body;

export type {
  TagMenuNode,
  MetricItem,
  RuleTagItem,
  GroupItem,
  QueryStatItem,
  SystemAuthItem,
  CategoryItem,
};

export interface OptionVO {
  label: string;
  value: string;
}

interface PageResult<T> {
  items: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

const TagApi = {
  fetchMenu: () => httpGet<TagMenuNode[]>('/api/tag/menu').then(unwrap),
  fetchAreas: () => httpGet<OptionVO[]>('/api/tag/areas').then(unwrap),
  fetchMetrics: (params: { keyword?: string; pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PageResult<MetricItem>>('/api/tag/metrics', { params }).then(unwrap),
  fetchRules: (params: { pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PageResult<RuleTagItem>>('/api/tag/rules', { params }).then(unwrap),
  fetchGroups: (params: { pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PageResult<GroupItem>>('/api/tag/groups', { params }).then(unwrap),
  fetchQueryStat: (params: { pageNo?: number; pageSize?: number } = {}) =>
    httpGet<PageResult<QueryStatItem>>('/api/tag/query-stat', { params }).then(unwrap),
  fetchSystemAuth: () => httpGet<SystemAuthItem[]>('/api/tag/system-auth').then(unwrap),
  fetchCategory: () => httpGet<CategoryItem[]>('/api/tag/category').then(unwrap),
};

export default TagApi;
