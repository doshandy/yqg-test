/**
 * 公共接口：国家/项目/当前用户/全局通知。
 */

import { httpGet, httpPost } from '@/utils/request';

export interface OptionVO {
  label: string;
  value: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  mail: string;
  roles: string[];
  avatar: string;
}

export interface GlobalNoticeVO {
  enabled: boolean;
  level: 'info' | 'warn' | 'error' | 'success';
  title: string;
  content: string;
}

const CommonApi = {
  fetchCurrentUser: () => httpGet<CurrentUser>('/api/user/current'),
  logout: () => httpPost<{ success: boolean }>('/api/user/logout'),
  fetchCountryOptions: () => httpGet<OptionVO[]>('/api/common/country-options'),
  fetchProjectOptions: () => httpGet<OptionVO[]>('/api/common/project-options'),
  fetchGlobalNotice: () => httpGet<GlobalNoticeVO>('/api/common/global-notice'),
};

export default CommonApi;
