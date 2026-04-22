/**
 * @Author: weisun
 * @Date: 2024/8/7-19:30
 * @Last Modified by: weisun
 * @Last Modified time: 2024/8/7-19:30
 */

export default [
  {
    key: 'num',
    title: '序号',
    dataIndex: 'num',
  },
  {
    key: 'createTime',
    title: '变更时间',
    dataIndex: 'createTime',
  },
  {
    key: 'creator',
    title: '所有者',
    dataIndex: 'creator',
  },
  {
    key: 'op',
    title: '操作',
    dataIndex: 'op',
  },
];

export const scheduleTypeMap = {
  PERIODIC: '周期调度',
  MANUAL: '手动调度',
};