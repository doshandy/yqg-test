export interface DqcSummary {
  templateCount: number;
  ruleCount: number;
  alertCount: number;
  successRate: number;
}

export interface DqcTemplateItem {
  id: string;
  type: 'TABLE' | 'FIELD' | 'SQL' | 'CUSTOM';
  name: string;
  scope: 'TABLE' | 'FIELD';
  ruleCount: number;
  description: string;
  owner: string;
  status: 'ENABLED' | 'DISABLED';
  updateTime: string;
}

export interface DqcRuleConfigItem {
  id: string;
  dataSourceType: 'HIVE' | 'STARROCKS';
  dataSourceId: string;
  dataSourceName: string;
  databaseName: string;
  tableName: string;
  ownerUser: string;
  dataAssetLevelNameEn: 'S1' | 'S2' | 'S3';
  tableStatus: 'ONLINE' | 'OFFLINE';
  ruleGroupCnt: number;
  enabledRuleCnt: number;
  monitorCnt: number;
  ruleCnt: number;
  totalRuleCnt: number;
  tableCreateTime: string;
  updateTime: string;
  partitionType?: 'PARTITION' | 'NONE';
  columnCount?: number;
}

export interface DqcRuleMonitorItem {
  id: string;
  tableId: string;
  name: string;
  ruleGroupName: string;
  triggerType: 'SCHEDULED' | 'CRON';
  dataRange: string;
  status: 'RUNNING' | 'PAUSED' | 'DRAFT';
  rulePassRate: number;
  totalRuleCnt: number;
  enabledRuleCnt: number;
  ownerUser: string;
  createUser: string;
  createTime: string;
  updateTime: string;
  alreadyRun?: boolean;
  notifyPolicyId?: string;
  notifyPolicyName?: string;
}

export interface DqcRuleDetailItem {
  id: string;
  tableId: string;
  ruleGroupId?: string;
  ruleGroupName?: string;
  ruleId?: string;
  ruleName: string;
  ruleTemplateName: string;
  ruleScope: 'TABLE' | 'FIELD' | 'CUSTOM_SQL';
  ruleTemplateType?: 'TABLE' | 'FIELD' | 'SQL' | 'CUSTOM';
  ruleTemplateScope?: 'TABLE' | 'FIELD';
  showUseScope?: string;
  fieldsName?: string;
  ruleLevel: 'P0' | 'P1' | 'P2';
  generateMethod: 'SYSTEM' | 'MANUAL';
  runStatus: 'SUCCESS' | 'FAILED' | 'RUNNING';
  alarmStatus: 'NORMAL' | 'ALARM';
  threshold: string;
  status: 'ENABLED' | 'DISABLED';
  isEnabled?: boolean;
  isCanEdit?: boolean;
  alreadyRun?: boolean;
  createUser?: string;
  description?: string;
  thresholdType?: 'NUMBER' | 'PERCENTAGE';
  filterExpr?: Array<Record<string, unknown>>;
  customSql?: string;
  customSqlFields?: {
    logic: 'OR' | 'AND';
    conditions: Array<{ col?: string; operator?: string; value?: string | number }>;
  };
  thresholdConditions?: {
    logic: 'OR' | 'AND';
    conditions: Array<{ operator?: string; value?: string | number }>;
  };
  lastRunTime: string;
}

export interface DqcRuleTreeNode {
  key: string;
  value: string;
  label: string;
  number: number;
  dbSourceType?: string;
  dataSourceId?: string;
  dataSourceName?: string;
  databaseName?: string;
  children?: DqcRuleTreeNode[];
}

export interface DqcRuleFieldOption {
  label: string;
  value: string;
  columnType: string;
}

export interface DqcRuleTemplateCatalogItem {
  id: string;
  ruleTemplateId: string;
  ruleTemplateName: string;
  ruleType: 'TABLE' | 'FIELD' | 'SQL' | 'CUSTOM';
  scopeType: 'TABLE' | 'FIELD' | 'CUSTOM_SQL';
  thresholdType: 'NUMBER' | 'PERCENTAGE';
  hasDefaultThreshold: boolean;
  defaultOperator?: string;
  defaultValue?: string | number;
  allowFilter?: boolean;
  allowMultiFields?: boolean;
  fields?: string[];
}

export interface DqcScheduleNode {
  projectCode: string;
  projectName: string;
  workflowCode: string;
  workflowName: string;
  dsWorkFlowSourceType: 'MANUAL' | 'RECOMMEND';
}

export interface DqcRuleTemplateTreeNode {
  key: string;
  value: string;
  label: string;
  number?: number;
  pl?: number;
  selectable?: boolean;
  allowMultiFields?: boolean;
  children?: DqcRuleTemplateTreeNode[];
}

export interface DqcMonitorEditor {
  id?: string;
  tableId: string;
  name: string;
  description?: string;
  dataRangeType: 'FULL' | 'PARTITION' | 'WHERE';
  filterConditionText?: string;
  triggerType: 'SCHEDULED' | 'CRON';
  scheduleConfig: {
    scheduleFrequency: 'DAY' | 'HOUR';
    expectedTime?: string;
    hourInterval?: number;
    minuteOffset?: number | string;
  };
  notifyPolicyId: string;
  notifyPolicyName: string;
  dsWorkFlows: DqcScheduleNode[];
  rules: DqcRuleDetailItem[];
  isCanNotEdit?: boolean;
}

export interface DqcRunRecordItem {
  id: string;
  tableId?: string;
  ruleGroupId?: string;
  dbTableName: string;
  ruleGroupName: string;
  alarmStatus: 'NORMAL' | 'ALARM';
  runStatus: 'INIT' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  triggerType: 'SCHEDULED' | 'CRON';
  dataRange: string;
  ownerUser: string;
  rulePassCount: number;
  ruleTotalCount: number;
  startExeTime: string;
  endExeTime: string;
}

export interface DqcRunRuleRecordItem {
  id: string;
  runRecordId: string;
  ruleId: string;
  ruleName: string;
  ruleTemplateName: string;
  ruleScope: 'TABLE' | 'FIELD';
  fieldsName?: string;
  ruleLevel: 'P0' | 'P1' | 'P2';
  generateMethod: 'SYSTEM' | 'MANUAL';
  runStatus: 'SUCCESS' | 'FAILED' | 'RUNNING';
  alarmStatus: 'NORMAL' | 'ALARM';
  threshold: string;
  errorMessage?: string;
  sqlText?: string;
  resultSample?: Array<Record<string, string | number>>;
}

export interface DqcDiffItem {
  id: string;
  taskId: string;
  taskName: string;
  compareMode: 'TABLE' | 'SQL';
  sourceTableName: string;
  targetTableName: string;
  taskStatus: 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'STOPPED';
  creator: string;
  createdAt: string;
  compareMethod: 'ROW_BY_ROW' | 'TARGET_CONTAINS_SOURCE';
  diffCount: number;
}

export interface DqcDiffConfig {
  id: string;
  taskName: string;
  compareMode: 'TABLE' | 'SQL';
  compareMethod: 'ROW_BY_ROW' | 'TARGET_CONTAINS_SOURCE';
  primaryKeys: string[];
  sourceConfig: {
    dataSourceType?: string;
    databaseName?: string;
    tableName?: string;
    owner?: string;
    compareRangeType?: 'FULL' | 'PARTITION' | 'WHERE';
    partitionInfo?: string;
    whereCondition?: string;
    sqlText?: string;
  };
  targetConfig: {
    dataSourceType?: string;
    databaseName?: string;
    tableName?: string;
    owner?: string;
    compareRangeType?: 'FULL' | 'PARTITION' | 'WHERE';
    partitionInfo?: string;
    whereCondition?: string;
    sqlText?: string;
  };
}

export interface DqcDiffReportSummary {
  taskId: string;
  sourceTable: string;
  targetTable: string;
  creator: string;
  compareMode: 'TABLE' | 'SQL';
  compareMethod: 'ROW_BY_ROW' | 'TARGET_CONTAINS_SOURCE';
  createdAt: string;
  duration: number;
  sourceWhereCondition?: string;
  targetWhereCondition?: string;
  sourceRowCount: number;
  targetRowCount: number;
  rowDiffPercent: number;
  primaryKeyMatchCount: number;
  sourceMatchPercent: number;
  targetMatchPercent: number;
}

export interface DqcDiffReportDetailItem {
  index: number;
  primaryKey: string;
  fieldName: string;
  sourceValue: string;
  targetValue: string;
  diffCount: number;
  diffRatio: number;
  compareResult: 'EQUAL' | 'DIFF' | 'SOURCE_ONLY' | 'TARGET_ONLY';
}

export interface DqcDiffLogItem {
  id: string;
  taskId: string;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  content: string;
}

export interface DqcTestTaskItem {
  id: string;
  showId: string;
  taskName: string;
  databaseName: string;
  tableName: string;
  createUser: string;
  createUserName: string;
  updateTime: number;
  createTime: number;
  owner: string;
}

export interface DqcTestInstanceItem {
  id: string;
  taskId: string;
  instanceId: string;
  dataTestRunStatus: 'INIT' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'STOPPED';
  executor: string;
  executorName: string;
  runTime: number;
  feedbackStatus?: 'EXPECT_MATCH' | 'EXPECT_NOT_MATCH';
}

export interface DqcTestFieldItem {
  fieldName: string;
  dataType: string;
  isPrimaryKey: boolean;
  tagType?: string;
}

export interface DqcTestRuleItem {
  id: string;
  fieldName?: string;
  ruleTemplateName: string;
  threshold: string;
  expectedResult: 'MATCH' | 'NOT_MATCH';
}

export interface DqcTestTaskDetail {
  id?: string;
  taskName: string;
  datasourceType: string;
  environmentType: string;
  databaseName: string;
  tableName: string;
  partitionType: 'PARTITION' | 'NO_PARTITION';
  dataRangeType: 'PARTITION' | 'WHERE' | 'FULL';
  partitionInfo?: string;
  whereCondition?: string;
  ruleTemplateId?: string;
  owner: string;
  fieldRecords: DqcTestFieldItem[];
  ruleRecords: DqcTestRuleItem[];
}

export interface DqcTestReportOverview {
  instanceId: string;
  databaseName: string;
  tableName: string;
  updateTime: number;
  taskDuration: number;
  executor: string;
  executorName: string;
  rowCount: number;
  fieldCount: number;
  dataRangeFilter: string;
  primaryKeyFields: string[];
  uniqueKeyCount: number;
  duplicateCount: number;
  totalRuleCount: number;
  failRuleCount: number;
}

export interface DqcTestProbeItem {
  key: string;
  fieldName: string;
  tagType?: string;
  profile: Record<string, any>;
}

export interface DqcTestRuleReportItem {
  id: string;
  fieldName?: string;
  ruleTemplateName: string;
  threshold: string;
  actualValue: string;
  result: 'PASS' | 'FAIL';
  sqlPreview?: string;
  filterExpr?: string;
}

export interface DqcPagedResult<T> {
  items: T[];
  total: number;
  pageNo: number;
  pageSize: number;
}

const owners = ['alice', 'bob', 'carol', 'demo_user'] as const;
const ownerNames: Record<string, string> = {
  alice: 'Alice',
  bob: 'Bob',
  carol: 'Carol',
  demo_user: 'Demo User',
};
const tables = [
  { db: 'dwd_user', table: 'user_profile_di' },
  { db: 'ads_growth', table: 'coupon_push_record' },
  { db: 'ods_risk', table: 'loan_base_di' },
  { db: 'dm_finance', table: 'repayment_snapshot' },
] as const;
const dataSources = [
  { id: 'ds_hive_prod', type: 'HIVE', name: 'Hive 生产集群' },
  { id: 'ds_hive_dw', type: 'HIVE', name: 'Hive 数仓集群' },
  { id: 'ds_starrocks_rt', type: 'STARROCKS', name: 'StarRocks 实时集群' },
] as const;
const notifyPolicies = [
  { id: 'policy_dqc_default', name: 'DQC 默认通知策略' },
  { id: 'policy_owner_p1', name: '表负责人升级策略' },
  { id: 'policy_realtime', name: '实时监控通知策略' },
] as const;
const projectCatalog = [
  {
    code: 'growth_dw',
    name: '增长数仓项目',
    workflows: [
      { code: 'wf_profile_di', name: '用户画像日更' },
      { code: 'wf_coupon_record', name: '营销券记录汇总' },
    ],
  },
  {
    code: 'risk_core',
    name: '风控核心项目',
    workflows: [
      { code: 'wf_loan_base', name: '借据基础宽表' },
      { code: 'wf_risk_snapshot', name: '贷后快照同步' },
    ],
  },
] as const;

const makeTime = (day: number, hour: number, minute = 0) =>
  `2026-04-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
const makeTs = (day: number, hour: number, minute = 0) =>
  new Date(`2026-04-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`).getTime();
const ownerLabel = (owner: string) => `${ownerNames[owner as keyof typeof ownerNames] || owner}(${owner})`;
const tableInfoOwner = (tableId: string) => ruleConfigs.find((item) => item.id === tableId)?.ownerUser || 'demo_user';

let templateList: DqcTemplateItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `tpl_${i + 1}`,
  type: (['TABLE', 'FIELD', 'SQL', 'CUSTOM'] as const)[i % 4],
  name: ['空值校验', '唯一性校验', '波动阈值校验', '枚举值校验'][i % 4] + `_${i + 1}`,
  scope: (['TABLE', 'FIELD'] as const)[i % 2],
  ruleCount: 6 + i,
  description: '用于数据质量场景的规则模板，支持按表、按字段或 SQL 监控配置。',
  owner: owners[i % owners.length],
  status: (['ENABLED', 'DISABLED'] as const)[i % 2],
  updateTime: makeTime((i % 9) + 1, 10 + (i % 6)),
}));

let ruleConfigs: DqcRuleConfigItem[] = Array.from({ length: 14 }, (_, i) => {
  const item = tables[i % tables.length];
  const ds = dataSources[i % dataSources.length];
  return {
    id: `table_${i + 1}`,
    dataSourceType: ds.type,
    dataSourceId: ds.id,
    dataSourceName: ds.name,
    databaseName: item.db,
    tableName: item.table,
    ownerUser: owners[i % owners.length],
    dataAssetLevelNameEn: (['S1', 'S2', 'S3'] as const)[i % 3],
    tableStatus: (['ONLINE', 'OFFLINE'] as const)[i % 5 === 0 ? 1 : 0],
    ruleGroupCnt: 2 + (i % 4),
    enabledRuleCnt: 5 + (i % 6),
    monitorCnt: 2 + (i % 4),
    ruleCnt: 8 + i,
    totalRuleCnt: 12 + i,
    tableCreateTime: makeTime((i % 12) + 1, 7 + (i % 5), 20),
    updateTime: makeTime((i % 10) + 1, 9 + (i % 5)),
    partitionType: i % 2 === 0 ? 'PARTITION' : 'NONE',
    columnCount: 16 + (i % 9),
  };
});

let ruleMonitorList: DqcRuleMonitorItem[] = ruleConfigs.flatMap((item, idx) =>
  Array.from({ length: 2 }, (_, i) => ({
    id: `group_${item.id}_${i + 1}`,
    tableId: item.id,
    name: `${item.tableName}_quality_group_${i + 1}`,
    ruleGroupName: `${item.tableName}_quality_group_${i + 1}`,
    triggerType: (['SCHEDULED', 'CRON'] as const)[(idx + i) % 2],
    dataRange: i % 2 === 0 ? 'dt=2026-04-22' : '全表',
    status: (['RUNNING', 'PAUSED', 'DRAFT'] as const)[(idx + i) % 3],
    rulePassRate: 88 + ((idx + i) % 10),
    totalRuleCnt: 4 + ((idx + i) % 5),
    enabledRuleCnt: 2 + ((idx + i) % 4),
    ownerUser: tableInfoOwner(item.id),
    createUser: owners[(idx + i + 1) % owners.length],
    createTime: makeTime((idx % 12) + 1, 8 + i, 15),
    updateTime: makeTime((idx % 12) + 1, 8 + i),
    alreadyRun: (idx + i) % 3 !== 0,
    notifyPolicyId: notifyPolicies[(idx + i) % notifyPolicies.length].id,
    notifyPolicyName: notifyPolicies[(idx + i) % notifyPolicies.length].name,
  })),
);

let ruleDetailList: DqcRuleDetailItem[] = ruleConfigs.flatMap((item, idx) =>
  Array.from({ length: 4 }, (_, i) => {
    const monitor = ruleMonitorList.find((group) => group.tableId === item.id && group.ruleGroupName.endsWith(`${(i % 2) + 1}`))
      || ruleMonitorList.find((group) => group.tableId === item.id)!;
    const ruleScope = (['TABLE', 'FIELD', 'FIELD', 'CUSTOM_SQL'] as const)[i];
    const templateType = (['TABLE', 'FIELD', 'CUSTOM', 'SQL'] as const)[i];
    const threshold = ['<= 0.5%', '<= 2%', '波动 <= 10%', '结果值 > 0'][i];
    const fieldName = ['user_id', 'coupon_id', 'loan_id', 'amount'][idx % 4];
    return {
      id: `rule_${item.id}_${i + 1}`,
      tableId: item.id,
      ruleGroupId: monitor.id,
      ruleGroupName: monitor.ruleGroupName,
      ruleId: `R-${idx + 1}${i + 1}${i}`,
      ruleName: `${item.tableName}_${['空值率', '唯一性', '波动率', '自定义SQL'][i]}监控`,
      ruleTemplateName: templateList[(idx + i) % templateList.length].name,
      ruleScope,
      ruleTemplateType: templateType,
      ruleTemplateScope: ruleScope === 'FIELD' ? 'FIELD' : 'TABLE',
      showUseScope: ruleScope === 'FIELD' ? `${fieldName}(string)` : ruleScope === 'CUSTOM_SQL' ? 'SQL 结果列(metric_value)' : '整表',
      fieldsName: ruleScope === 'FIELD' ? fieldName : undefined,
      ruleLevel: (['P0', 'P1', 'P2'] as const)[(idx + i) % 3],
      generateMethod: (['SYSTEM', 'MANUAL'] as const)[i % 2],
      runStatus: (['SUCCESS', 'FAILED', 'RUNNING'] as const)[(idx + i) % 3],
      alarmStatus: (['NORMAL', 'ALARM'] as const)[(idx + i) % 2],
      threshold,
      status: (['ENABLED', 'DISABLED'] as const)[(idx + i) % 4 === 0 ? 1 : 0],
      isEnabled: (idx + i) % 4 !== 0,
      isCanEdit: (idx + i) % 5 !== 0,
      alreadyRun: (idx + i) % 3 !== 2,
      createUser: owners[(idx + i) % owners.length],
      description: '用于表级/字段级质量监控，支持过滤条件与阈值控制。',
      thresholdType: i === 0 ? 'PERCENTAGE' : 'NUMBER',
      filterExpr: i % 2 === 0 ? [] : [{ col: 'dt', operator: '=', value: '2026-04-22' }],
      customSql: ruleScope === 'CUSTOM_SQL' ? `select count(1) as metric_value from ${item.databaseName}.${item.tableName} where dt = '2026-04-22'` : undefined,
      customSqlFields: ruleScope === 'CUSTOM_SQL' ? { logic: 'OR', conditions: [{ col: 'metric_value', operator: '>', value: 0 }] } : { logic: 'OR', conditions: [{}] },
      thresholdConditions: { logic: 'OR', conditions: [{ operator: i === 0 ? '<=' : '>', value: i === 0 ? 0.5 : 0 }] },
      lastRunTime: makeTime((idx % 14) + 1, 7 + i),
    };
  }),
);

let runRecordList: DqcRunRecordItem[] = ruleMonitorList.map((item, i) => {
  const tableInfo = ruleConfigs.find((rule) => rule.id === item.tableId)!;
  return {
    id: `run_${i + 1}`,
    tableId: item.tableId,
    ruleGroupId: item.id,
    dbTableName: `${tableInfo.databaseName}.${tableInfo.tableName}`,
    ruleGroupName: item.ruleGroupName,
    alarmStatus: (['NORMAL', 'ALARM'] as const)[i % 3 === 0 ? 1 : 0],
    runStatus: (['INIT', 'RUNNING', 'SUCCESS', 'FAILED'] as const)[i % 4],
    triggerType: item.triggerType,
    dataRange: item.dataRange,
    ownerUser: tableInfo.ownerUser,
    rulePassCount: 6 + (i % 5),
    ruleTotalCount: 8 + (i % 6),
    startExeTime: makeTime((i % 12) + 1, 8 + (i % 6)),
    endExeTime: makeTime((i % 12) + 1, 8 + (i % 6), 35),
  };
});

let runRuleRecordList: DqcRunRuleRecordItem[] = runRecordList.flatMap((item, idx) =>
  Array.from({ length: 5 }, (_, i) => ({
    id: `run_rule_${item.id}_${i + 1}`,
    runRecordId: item.id,
    ruleId: `${item.id}_rule_${i + 1}`,
    ruleName: `${item.ruleGroupName}_rule_${i + 1}`,
    ruleTemplateName: templateList[(idx + i) % templateList.length].name,
    ruleScope: (['TABLE', 'FIELD'] as const)[i % 2],
    fieldsName: i % 2 === 1 ? ['user_id', 'coupon_id', 'loan_id'][i % 3] : undefined,
    ruleLevel: (['P0', 'P1', 'P2'] as const)[(idx + i) % 3],
    generateMethod: (['SYSTEM', 'MANUAL'] as const)[i % 2],
    runStatus: (['SUCCESS', 'FAILED', 'RUNNING'] as const)[(idx + i) % 3],
    alarmStatus: (['NORMAL', 'ALARM'] as const)[(idx + i) % 2],
    threshold: ['<= 0.5%', '<= 3%', '波动 <= 10%', '枚举命中'][i % 4],
    errorMessage: (idx + i) % 3 === 1 ? '执行 SQL 后发现空值率超阈值，告警升级。' : '',
    sqlText: `select * from ${item.dbTableName} where dt = '2026-04-22' limit 100`,
    resultSample: [
      { field_name: 'user_id', actual_value: 12, threshold: '<= 3', result: 'PASS' },
      { field_name: 'coupon_id', actual_value: 7, threshold: '<= 1', result: 'FAIL' },
    ],
  })),
);

const fieldMap: Record<string, DqcRuleFieldOption[]> = Object.fromEntries(
  ruleConfigs.map((item, idx) => [
    item.id,
    [
      { label: 'user_id', value: 'user_id', columnType: 'string' },
      { label: 'dt', value: 'dt', columnType: 'string' },
      { label: 'amount', value: 'amount', columnType: 'decimal(18,2)' },
      { label: 'status', value: 'status', columnType: 'string' },
      { label: `metric_${idx + 1}`, value: `metric_${idx + 1}`, columnType: 'bigint' },
    ],
  ]),
);

const templateCatalogMap: Record<string, DqcRuleTemplateCatalogItem[]> = Object.fromEntries(
  ruleConfigs.map((item, idx) => [
    item.id,
    [
      {
        id: `catalog_${item.id}_1`,
        ruleTemplateId: templateList[(idx + 1) % templateList.length].id,
        ruleTemplateName: '表行数波动检测',
        ruleType: 'TABLE',
        scopeType: 'TABLE',
        thresholdType: 'PERCENTAGE',
        hasDefaultThreshold: false,
        allowFilter: true,
      },
      {
        id: `catalog_${item.id}_2`,
        ruleTemplateId: templateList[(idx + 2) % templateList.length].id,
        ruleTemplateName: '字段空值率',
        ruleType: 'FIELD',
        scopeType: 'FIELD',
        thresholdType: 'PERCENTAGE',
        hasDefaultThreshold: false,
        allowFilter: true,
        fields: fieldMap[item.id].map((field) => field.value),
      },
      {
        id: `catalog_${item.id}_3`,
        ruleTemplateId: templateList[(idx + 3) % templateList.length].id,
        ruleTemplateName: '唯一性校验',
        ruleType: 'FIELD',
        scopeType: 'FIELD',
        thresholdType: 'NUMBER',
        hasDefaultThreshold: true,
        defaultOperator: '=',
        defaultValue: 0,
        allowFilter: false,
        allowMultiFields: true,
        fields: fieldMap[item.id].map((field) => field.value),
      },
      {
        id: `catalog_${item.id}_4`,
        ruleTemplateId: templateList[(idx + 4) % templateList.length].id,
        ruleTemplateName: '自定义 SQL 指标检测',
        ruleType: 'SQL',
        scopeType: 'CUSTOM_SQL',
        thresholdType: 'NUMBER',
        hasDefaultThreshold: false,
        allowFilter: false,
      },
    ],
  ]),
);

let monitorEditorMap: Record<string, DqcMonitorEditor> = Object.fromEntries(
  ruleMonitorList.map((group, idx) => {
    const tableInfo = ruleConfigs.find((item) => item.id === group.tableId)!;
    const project = projectCatalog[idx % projectCatalog.length];
    const linkedRules = ruleDetailList
      .filter((rule) => rule.ruleGroupId === group.id)
      .map((rule) => ({ ...rule }));
    return [
      group.id,
      {
        id: group.id,
        tableId: group.tableId,
        name: group.ruleGroupName,
        description: `${tableInfo.tableName} 的质量监控编排，包含阈值规则、运行配置和通知策略。`,
        dataRangeType: group.dataRange === '全表' ? 'FULL' : 'PARTITION',
        filterConditionText: group.dataRange === '全表' ? '' : group.dataRange,
        triggerType: group.triggerType,
        scheduleConfig: group.triggerType === 'CRON'
          ? { scheduleFrequency: idx % 2 === 0 ? 'DAY' : 'HOUR', expectedTime: '09:00:00', hourInterval: 2, minuteOffset: 15 }
          : { scheduleFrequency: 'DAY', expectedTime: '09:00:00', hourInterval: 1, minuteOffset: 0 },
        notifyPolicyId: group.notifyPolicyId || notifyPolicies[0].id,
        notifyPolicyName: group.notifyPolicyName || notifyPolicies[0].name,
        dsWorkFlows: [
          {
            projectCode: project.code,
            projectName: project.name,
            workflowCode: project.workflows[0].code,
            workflowName: project.workflows[0].name,
            dsWorkFlowSourceType: 'MANUAL',
          },
        ],
        rules: linkedRules.length ? linkedRules : [],
        isCanNotEdit: tableInfo.tableStatus === 'OFFLINE',
      },
    ];
  }),
);

function buildDrawerRuleFromTemplate(
  tableId: string,
  template: DqcRuleTemplateCatalogItem,
  overrides: Partial<DqcRuleDetailItem> = {},
) {
  const field = overrides.fieldsName || template.fields?.[0];
  const thresholdOperator = template.defaultOperator || (template.thresholdType === 'PERCENTAGE' ? '<=' : '>');
  const thresholdValue = template.defaultValue ?? (template.thresholdType === 'PERCENTAGE' ? 1 : 0);
  const ruleScope = template.scopeType;
  return {
    id: `draft_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    tableId,
    ruleGroupId: overrides.ruleGroupId,
    ruleGroupName: overrides.ruleGroupName,
    ruleId: `R-DRAFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    ruleName: overrides.ruleName || template.ruleTemplateName,
    ruleTemplateName: template.ruleTemplateName,
    ruleScope,
    ruleTemplateType: template.ruleType,
    ruleTemplateScope: ruleScope === 'FIELD' ? 'FIELD' : 'TABLE',
    showUseScope: ruleScope === 'FIELD' ? `${field || ''}(string)` : ruleScope === 'CUSTOM_SQL' ? 'SQL 结果列(metric_value)' : '整表',
    fieldsName: ruleScope === 'FIELD' ? field : undefined,
    ruleLevel: overrides.ruleLevel || 'P1',
    generateMethod: overrides.generateMethod || 'MANUAL',
    runStatus: 'SUCCESS',
    alarmStatus: 'NORMAL',
    thresholdType: template.thresholdType,
    threshold: `${thresholdOperator} ${thresholdValue}${template.thresholdType === 'PERCENTAGE' ? '%' : ''}`,
    thresholdConditions: { logic: 'OR', conditions: [{ operator: thresholdOperator, value: thresholdValue }] },
    customSqlFields: { logic: 'OR', conditions: [{ col: 'metric_value', operator: '>', value: 0 }] },
    customSql: ruleScope === 'CUSTOM_SQL'
      ? `select count(1) as metric_value from ${ruleConfigs.find((item) => item.id === tableId)?.databaseName}.${ruleConfigs.find((item) => item.id === tableId)?.tableName} where dt = '2026-04-22'`
      : undefined,
    status: 'ENABLED',
    isEnabled: true,
    isCanEdit: true,
    alreadyRun: false,
    createUser: 'demo_user',
    description: '根据模板生成的质量规则。',
    filterExpr: template.allowFilter ? [{ expr: "dt = '2026-04-22'" }] : [],
    lastRunTime: makeTime(23, 18),
    ...overrides,
  } satisfies DqcRuleDetailItem;
}

let diffList: DqcDiffItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `diff_${i + 1}`,
  taskId: `DQC-DIFF-${1000 + i}`,
  taskName: ['用户宽表对比', '营销结果对比', '贷后快照对比'][i % 3] + `_${i + 1}`,
  compareMode: (['TABLE', 'SQL'] as const)[i % 2],
  sourceTableName: `${tables[i % tables.length].db}.${tables[i % tables.length].table}`,
  targetTableName: `backup_${tables[i % tables.length].db}.${tables[i % tables.length].table}`,
  taskStatus: (['CREATED', 'RUNNING', 'SUCCESS', 'FAILED', 'STOPPED'] as const)[i % 5],
  creator: owners[i % owners.length],
  createdAt: makeTime((i % 11) + 1, 9 + (i % 4)),
  compareMethod: (['ROW_BY_ROW', 'TARGET_CONTAINS_SOURCE'] as const)[i % 2],
  diffCount: 8 + i * 3,
}));

const diffConfigMap: Record<string, DqcDiffConfig> = Object.fromEntries(
  diffList.map((item, i) => [
    item.id,
    {
      id: item.id,
      taskName: item.taskName,
      compareMode: item.compareMode,
      compareMethod: item.compareMethod,
      primaryKeys: ['id', 'dt'],
      sourceConfig: {
        dataSourceType: 'HIVE',
        databaseName: tables[i % tables.length].db,
        tableName: tables[i % tables.length].table,
        owner: owners[i % owners.length],
        compareRangeType: i % 3 === 0 ? 'WHERE' : 'PARTITION',
        partitionInfo: 'dt=2026-04-22',
        whereCondition: "dt = '2026-04-22'",
        sqlText: `select * from ${tables[i % tables.length].db}.${tables[i % tables.length].table} where dt = '2026-04-22'`,
      },
      targetConfig: {
        dataSourceType: 'HIVE',
        databaseName: `backup_${tables[i % tables.length].db}`,
        tableName: tables[i % tables.length].table,
        owner: owners[(i + 1) % owners.length],
        compareRangeType: i % 3 === 0 ? 'WHERE' : 'PARTITION',
        partitionInfo: 'dt=2026-04-22',
        whereCondition: "dt = '2026-04-22'",
        sqlText: `select * from backup_${tables[i % tables.length].db}.${tables[i % tables.length].table} where dt = '2026-04-22'`,
      },
    },
  ]),
);

const diffReportMap: Record<string, { summary: DqcDiffReportSummary; detail: DqcDiffReportDetailItem[]; logs: DqcDiffLogItem[] }> =
  Object.fromEntries(
    diffList.map((item, i) => [
      item.id,
      {
        summary: {
          taskId: item.taskId,
          sourceTable: item.sourceTableName,
          targetTable: item.targetTableName,
          creator: item.creator,
          compareMode: item.compareMode,
          compareMethod: item.compareMethod,
          createdAt: item.createdAt,
          duration: 195 + i * 12,
          sourceWhereCondition: "dt = '2026-04-22'",
          targetWhereCondition: "dt = '2026-04-22'",
          sourceRowCount: 250000 + i * 2100,
          targetRowCount: 249000 + i * 2200,
          rowDiffPercent: 0.73 + i * 0.08,
          primaryKeyMatchCount: 245000 + i * 1800,
          sourceMatchPercent: 97.6,
          targetMatchPercent: 98.1,
        },
        detail: Array.from({ length: 8 }, (_, j) => ({
          index: j + 1,
          primaryKey: `pk_${j + 1}`,
          fieldName: ['user_id', 'coupon_id', 'loan_id', 'amount'][j % 4],
          sourceValue: `${100 + j}`,
          targetValue: `${102 + j}`,
          diffCount: 1 + j,
          diffRatio: 0.01 * (j + 1),
          compareResult: (['EQUAL', 'DIFF', 'SOURCE_ONLY', 'TARGET_ONLY'] as const)[j % 4],
        })),
        logs: Array.from({ length: 6 }, (_, j) => ({
          id: `diff_log_${item.id}_${j + 1}`,
          taskId: item.taskId,
          time: makeTime((j % 10) + 1, 10 + j),
          level: (['INFO', 'WARN', 'ERROR'] as const)[j % 3],
          content: ['开始准备任务环境', '加载 A/B 表结构', '执行主键映射', '生成差异抽样', '落库报告明细', '任务结束'][j],
        })),
      },
    ]),
  );

let testTaskList: DqcTestTaskItem[] = Array.from({ length: 9 }, (_, i) => ({
  id: `test_${i + 1}`,
  showId: `DT-${1000 + i}`,
  taskName: ['规则回归验证', '字段空值抽样', '阈值告警压测'][i % 3] + `_${i + 1}`,
  databaseName: tables[i % tables.length].db,
  tableName: tables[i % tables.length].table,
  createUser: owners[i % owners.length],
  createUserName: ownerNames[owners[i % owners.length]],
  updateTime: makeTs((i % 11) + 1, 12 + (i % 4)),
  createTime: makeTs((i % 11) + 1, 8 + (i % 4)),
  owner: owners[i % owners.length],
}));

let testInstanceList: DqcTestInstanceItem[] = testTaskList.flatMap((item, idx) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `instance_${item.id}_${i + 1}`,
    taskId: item.id,
    instanceId: `INST-${idx + 1}${i + 1}0${i}`,
    dataTestRunStatus: (['INIT', 'RUNNING', 'SUCCESS', 'FAILED', 'STOPPED'] as const)[(idx + i) % 5],
    executor: owners[(idx + i) % owners.length],
    executorName: ownerNames[owners[(idx + i) % owners.length]],
    runTime: makeTs((idx % 10) + 1, 10 + i),
    feedbackStatus: (['EXPECT_MATCH', 'EXPECT_NOT_MATCH', undefined] as const)[(idx + i) % 3],
  })),
);

const testDetailMap: Record<string, DqcTestTaskDetail> = Object.fromEntries(
  testTaskList.map((item, i) => [
    item.id,
    {
      id: item.id,
      taskName: item.taskName,
      datasourceType: 'HIVE',
      environmentType: 'PROD',
      databaseName: item.databaseName,
      tableName: item.tableName,
      partitionType: i % 2 === 0 ? 'PARTITION' : 'NO_PARTITION',
      dataRangeType: i % 2 === 0 ? 'PARTITION' : 'WHERE',
      partitionInfo: 'dt=2026-04-22',
      whereCondition: i % 2 === 0 ? '' : "dt >= '2026-04-20'",
      ruleTemplateId: templateList[i % templateList.length].id,
      owner: item.owner,
      fieldRecords: [
        { fieldName: 'user_id', dataType: 'string', isPrimaryKey: true, tagType: '主键' },
        { fieldName: 'gender', dataType: 'string', isPrimaryKey: false, tagType: '枚举' },
        { fieldName: 'amount', dataType: 'decimal(18,2)', isPrimaryKey: false, tagType: '数值' },
        { fieldName: 'dt', dataType: 'string', isPrimaryKey: true, tagType: '分区' },
      ],
      ruleRecords: [
        { id: `task_rule_${item.id}_1`, fieldName: 'user_id', ruleTemplateName: '唯一性校验', threshold: '= 0', expectedResult: 'MATCH' },
        { id: `task_rule_${item.id}_2`, fieldName: 'amount', ruleTemplateName: '空值校验', threshold: '<= 1%', expectedResult: 'MATCH' },
        { id: `task_rule_${item.id}_3`, fieldName: undefined, ruleTemplateName: '行数波动', threshold: '<= 10%', expectedResult: 'MATCH' },
      ],
    },
  ]),
);

const testReportMap: Record<string, {
  overview: DqcTestReportOverview;
  probeRecords: DqcTestProbeItem[];
  ruleRecords: DqcTestRuleReportItem[];
  logs: DqcDiffLogItem[];
  feedbackStatus?: 'EXPECT_MATCH' | 'EXPECT_NOT_MATCH';
  feedbackText?: string;
}> =
  Object.fromEntries(
    testInstanceList.map((item, i) => {
      const task = testTaskList.find((taskItem) => taskItem.id === item.taskId)!;
      return [
        item.id,
        {
          overview: {
            instanceId: item.instanceId,
            databaseName: task.databaseName,
            tableName: task.tableName,
            updateTime: item.runTime + 6 * 60 * 1000,
            taskDuration: 360 + i * 15,
            executor: item.executor,
            executorName: item.executorName,
            rowCount: 360000 + i * 1500,
            fieldCount: 36 + (i % 5),
            dataRangeFilter: "dt = '2026-04-22'",
            primaryKeyFields: ['user_id', 'dt'],
            uniqueKeyCount: 358000 + i * 1200,
            duplicateCount: 15 + i,
            totalRuleCount: 12,
            failRuleCount: i % 3,
          },
          probeRecords: [
            {
              key: `${item.id}_1`,
              fieldName: 'user_id',
              tagType: '主键',
              profile: {
                nullStat: { count: 0, ratio: 0 },
                enumStat: { uniqueCount: 358000, items: ['u1', 'u2', 'u3'] },
              },
            },
            {
              key: `${item.id}_2`,
              fieldName: 'amount',
              tagType: '数值',
              profile: {
                nullStat: { count: 4, ratio: 0.0001 },
                numericStat: { max: 9832.1, min: 0.0, avg: 129.82, stddev: 88.1 },
                zeroStat: { count: 42, ratio: 0.012 },
              },
            },
            {
              key: `${item.id}_3`,
              fieldName: 'gender',
              tagType: '枚举',
              profile: {
                emptyStat: { count: 2, ratio: 0.00005 },
                enumStat: { uniqueCount: 3, items: ['M', 'F', 'U'] },
              },
            },
          ],
          ruleRecords: [
            {
              id: `${item.id}_rr1`,
              fieldName: 'user_id',
              ruleTemplateName: '唯一性校验',
              threshold: '= 0',
              actualValue: '0',
              result: 'PASS',
              filterExpr: "dt = '2026-04-22'",
              sqlPreview: `select user_id, count(1) as cnt from ${task.databaseName}.${task.tableName} where dt = '2026-04-22' group by user_id having count(1) > 1`,
            },
            {
              id: `${item.id}_rr2`,
              fieldName: 'amount',
              ruleTemplateName: '空值校验',
              threshold: '<= 1%',
              actualValue: '0.01%',
              result: 'PASS',
              filterExpr: "dt = '2026-04-22' and amount is null",
              sqlPreview: `select amount from ${task.databaseName}.${task.tableName} where dt = '2026-04-22' and amount is null`,
            },
            {
              id: `${item.id}_rr3`,
              fieldName: undefined,
              ruleTemplateName: '行数波动',
              threshold: '<= 10%',
              actualValue: '12%',
              result: 'FAIL',
              filterExpr: "dt between '2026-04-21' and '2026-04-22'",
              sqlPreview: `select dt, count(1) from ${task.databaseName}.${task.tableName} where dt between '2026-04-21' and '2026-04-22' group by dt`,
            },
          ],
          logs: Array.from({ length: 5 }, (_, j) => ({
            id: `test_log_${item.id}_${j + 1}`,
            taskId: item.instanceId,
            time: makeTime((j % 9) + 1, 9 + j),
            level: (['INFO', 'WARN', 'ERROR'] as const)[j % 3],
            content: ['解析任务配置', '加载样本数据', '执行字段探查', '执行规则校验', '写入测试报告'][j],
          })),
          feedbackStatus: item.feedbackStatus,
          feedbackText: item.feedbackStatus === 'EXPECT_NOT_MATCH' ? 'amount 字段阈值建议再放宽一些。' : '结果符合预期，可继续使用。',
        },
      ];
    }),
  );

function paginate<T>(list: T[], pageNo = 1, pageSize = 10): DqcPagedResult<T> {
  const total = list.length;
  const start = (pageNo - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), total, pageNo, pageSize };
}

function includesKeyword(texts: Array<string | undefined>, keyword?: string) {
  const normalized = keyword?.trim().toLowerCase();
  if (!normalized) return true;
  return texts.some((item) => (item || '').toLowerCase().includes(normalized));
}

export function getDqcSummary(): DqcSummary {
  const successCount = runRecordList.filter((item) => item.runStatus === 'SUCCESS').length;
  return {
    templateCount: templateList.length,
    ruleCount: ruleDetailList.length,
    alertCount: runRecordList.filter((item) => item.alarmStatus === 'ALARM').length,
    successRate: Number(((successCount / runRecordList.length) * 100).toFixed(1)),
  };
}

export function queryDqcTemplates(params: { type?: string; scope?: string; pageNo?: number; pageSize?: number } = {}) {
  const list = templateList.filter((item) => (!params.type || item.type === params.type) && (!params.scope || item.scope === params.scope));
  return paginate(list, params.pageNo, params.pageSize);
}

export function saveDqcTemplate(payload: Partial<DqcTemplateItem>) {
  if (payload.id) {
    templateList = templateList.map((item) => (item.id === payload.id ? { ...item, ...payload, updateTime: makeTime(23, 18) } as DqcTemplateItem : item));
    return templateList.find((item) => item.id === payload.id) || null;
  }
  const next: DqcTemplateItem = {
    id: `tpl_${Date.now()}`,
    type: payload.type || 'TABLE',
    name: payload.name || '新建模板',
    scope: payload.scope || 'TABLE',
    ruleCount: payload.ruleCount || 0,
    description: payload.description || '用于单机版演示的新增规则模板。',
    owner: payload.owner || 'demo_user',
    status: payload.status || 'ENABLED',
    updateTime: makeTime(23, 18),
  };
  templateList = [next, ...templateList];
  return next;
}

export function deleteDqcTemplate(id: string) {
  templateList = templateList.filter((item) => item.id !== id);
  return true;
}

export function getDqcRuleConfigTree() {
  return dataSources.map((ds) => {
    const tableItems = ruleConfigs.filter((item) => item.dataSourceId === ds.id);
    const databaseMap = new Map<string, DqcRuleTreeNode>();
    tableItems.forEach((item) => {
      if (!databaseMap.has(item.databaseName)) {
        databaseMap.set(item.databaseName, {
          key: `${ds.id}_${item.databaseName}`,
          value: item.databaseName,
          label: item.databaseName,
          number: 0,
          dbSourceType: item.dataSourceType,
          dataSourceId: item.dataSourceId,
          dataSourceName: item.dataSourceName,
          databaseName: item.databaseName,
          children: [],
        });
      }
      const databaseNode = databaseMap.get(item.databaseName)!;
      databaseNode.children!.push({
        key: item.id,
        value: item.id,
        label: item.tableName,
        number: item.ruleCnt,
        dbSourceType: item.dataSourceType,
        dataSourceId: item.dataSourceId,
        dataSourceName: item.dataSourceName,
        databaseName: item.databaseName,
      });
      databaseNode.number += 1;
    });

    return {
      key: ds.id,
      value: ds.id,
      label: ds.name,
      number: tableItems.length,
      dbSourceType: ds.type,
      dataSourceId: ds.id,
      dataSourceName: ds.name,
      children: Array.from(databaseMap.values()),
    };
  });
}

export function queryDqcRuleTableSuggestions(keyword?: string) {
  return ruleConfigs
    .filter((item) => includesKeyword([item.tableName, item.databaseName, `${item.databaseName}.${item.tableName}`], keyword))
    .slice(0, 20)
    .map((item) => ({
      label: `${item.databaseName}.${item.tableName}`,
      value: item.tableName,
      tableId: item.id,
    }));
}

export function queryDqcRuleConfigs(params: {
  tableName?: string;
  ownerUser?: string;
  notHasRule?: boolean;
  isSelf?: boolean;
  dbSourceType?: string;
  dataSourceId?: string;
  databaseName?: string;
  pageNo?: number;
  pageSize?: number;
} = {}) {
  const list = ruleConfigs.filter((item) =>
    includesKeyword([item.tableName, item.databaseName], params.tableName)
    && (!params.ownerUser || item.ownerUser === params.ownerUser)
    && (!params.notHasRule || item.ruleCnt === 0)
    && (!params.isSelf || item.ownerUser === 'demo_user'),
  ).filter((item) =>
    (!params.dbSourceType || item.dataSourceType === params.dbSourceType)
    && (!params.dataSourceId || item.dataSourceId === params.dataSourceId)
    && (!params.databaseName || item.databaseName === params.databaseName),
  );
  return paginate(list, params.pageNo, params.pageSize);
}

export function getDqcRuleConfigDetail(tableId: string) {
  const tableInfo = ruleConfigs.find((item) => item.id === tableId);
  if (!tableInfo) return null;
  return {
    tableInfo,
    monitorRecords: ruleMonitorList.filter((item) => item.tableId === tableId),
    ruleRecords: ruleDetailList.filter((item) => item.tableId === tableId),
  };
}

export function getDqcRuleConfigTableInfo(tableId: string) {
  return ruleConfigs.find((item) => item.id === tableId) || null;
}

export function getDqcRuleFieldOptions(tableId: string) {
  return fieldMap[tableId] || [];
}

export function getDqcRuleTemplateCatalog(tableId: string, scopeType?: string) {
  const list = templateCatalogMap[tableId] || [];
  return list.filter((item) => !scopeType || item.scopeType === scopeType);
}

export function getDqcRuleTemplateTree(tableId: string, scopeType?: string) {
  const list = getDqcRuleTemplateCatalog(tableId, scopeType === 'AI' ? undefined : scopeType);
  const groups = new Map<string, DqcRuleTemplateTreeNode>();
  list.forEach((item) => {
    const labelMap: Record<string, string> = {
      TABLE: '表级规则模板',
      FIELD: '字段级规则模板',
      SQL: 'SQL 规则模板',
      CUSTOM: '自定义规则模板',
    };
    const groupKey = item.ruleType;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        value: groupKey,
        label: labelMap[groupKey] || groupKey,
        number: 0,
        selectable: false,
        children: [],
      });
    }
    const group = groups.get(groupKey)!;
    group.children!.push({
      key: item.ruleTemplateId,
      value: item.ruleTemplateId,
      label: item.ruleTemplateName,
      allowMultiFields: item.allowMultiFields,
      number: 1,
      pl: 26,
    });
    group.number = (group.number || 0) + 1;
  });
  return [
    {
      key: 'all',
      value: 'all',
      label: scopeType === 'FIELD' ? '字段级模板' : scopeType === 'CUSTOM_SQL' ? 'SQL 模板' : '全部模板',
      number: list.length,
      selectable: false,
      children: Array.from(groups.values()),
    },
  ] as DqcRuleTemplateTreeNode[];
}

export function getDqcRuleTemplateNames() {
  return Array.from(new Set(templateList.map((item) => item.name)));
}

export function generateDqcRuleCards(params: {
  tableId: string;
  ruleTemplateId: string;
  selectedFields?: string[];
  generateMethod?: 'SYSTEM' | 'MANUAL';
}) {
  const template = Object.values(templateCatalogMap)
    .flat()
    .find((item) => item.ruleTemplateId === params.ruleTemplateId);
  if (!template) return [];
  if (template.scopeType === 'FIELD' && params.selectedFields?.length) {
    return params.selectedFields.map((field) =>
      buildDrawerRuleFromTemplate(params.tableId, template, {
        fieldsName: field,
        ruleName: `${field}_${template.ruleTemplateName}`,
        showUseScope: `${field}(string)`,
        generateMethod: params.generateMethod || 'MANUAL',
      }),
    );
  }
  return [buildDrawerRuleFromTemplate(params.tableId, template, { generateMethod: params.generateMethod || 'MANUAL' })];
}

export function getDqcAiRecommendedRules(tableId: string) {
  const templates = getDqcRuleTemplateCatalog(tableId).slice(0, 6);
  const fields = fieldMap[tableId] || [];
  return templates.map((template, index) =>
    buildDrawerRuleFromTemplate(tableId, template, {
      ruleName: `${['基础质量', '主键唯一性', '分区完整性', '趋势波动', '枚举命中', 'SQL 指标'][index] || template.ruleTemplateName}_建议`,
      fieldsName: template.scopeType === 'FIELD' ? fields[index % Math.max(fields.length, 1)]?.value : undefined,
      showUseScope: template.scopeType === 'FIELD'
        ? `${fields[index % Math.max(fields.length, 1)]?.value || ''}(string)`
        : template.scopeType === 'CUSTOM_SQL'
          ? 'SQL 结果列(metric_value)'
          : '整表',
      generateMethod: 'SYSTEM',
    }),
  );
}

export function parseDqcSqlFields(sql?: string) {
  const aliasMatches = Array.from((sql || '').matchAll(/\bas\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi)).map((item) => item[1]);
  const countMatches = Array.from(new Set(aliasMatches.length ? aliasMatches : ['metric_value']));
  return countMatches.map((item) => ({
    col: item,
    operator: '>',
    value: 0,
  }));
}

export function getDqcMonitorEditor(groupId?: string, tableId?: string) {
  if (groupId && monitorEditorMap[groupId]) {
    return {
      ...monitorEditorMap[groupId],
      rules: monitorEditorMap[groupId].rules.map((item) => ({ ...item })),
    };
  }
  const targetTable = ruleConfigs.find((item) => item.id === tableId) || ruleConfigs[0];
  return {
    tableId: targetTable.id,
    name: `${targetTable.tableName}_quality_group_new`,
    description: '',
    dataRangeType: targetTable.partitionType === 'PARTITION' ? 'PARTITION' : 'FULL',
    filterConditionText: targetTable.partitionType === 'PARTITION' ? 'dt=2026-04-22' : '',
    triggerType: 'SCHEDULED',
    scheduleConfig: {
      scheduleFrequency: 'DAY',
      expectedTime: '09:00:00',
      hourInterval: 1,
      minuteOffset: 0,
    },
    notifyPolicyId: notifyPolicies[0].id,
    notifyPolicyName: notifyPolicies[0].name,
    dsWorkFlows: [],
    rules: [],
    isCanNotEdit: targetTable.tableStatus === 'OFFLINE',
  } as DqcMonitorEditor;
}

export function saveDqcRule(payload: Partial<DqcRuleDetailItem> & { tableId?: string; tableName?: string; ownerUser?: string }) {
  if (payload.id) {
    ruleDetailList = ruleDetailList.map((item) => (item.id === payload.id ? {
      ...item,
      ...payload,
      status: payload.isEnabled === false ? 'DISABLED' : (payload.status || item.status),
      isEnabled: payload.isEnabled ?? item.isEnabled,
      showUseScope: payload.ruleScope === 'FIELD'
        ? `${payload.fieldsName || item.fieldsName || ''}(string)`
        : payload.ruleScope === 'CUSTOM_SQL'
          ? 'SQL 结果列(metric_value)'
          : '整表',
      lastRunTime: makeTime(23, 18),
    } as DqcRuleDetailItem : item));
    return ruleDetailList.find((item) => item.id === payload.id) || null;
  }
  const next: DqcRuleDetailItem = {
    id: `rule_${Date.now()}`,
    tableId: payload.tableId || ruleConfigs[0].id,
    ruleGroupId: payload.ruleGroupId,
    ruleGroupName: payload.ruleGroupName,
    ruleId: payload.ruleId || `R-${Date.now()}`,
    ruleName: payload.ruleName || '新建质量规则',
    ruleTemplateName: payload.ruleTemplateName || templateList[0].name,
    ruleScope: payload.ruleScope || 'TABLE',
    ruleTemplateType: payload.ruleTemplateType || 'TABLE',
    ruleTemplateScope: payload.ruleTemplateScope || 'TABLE',
    showUseScope: payload.ruleScope === 'FIELD' ? `${payload.fieldsName || ''}(string)` : payload.ruleScope === 'CUSTOM_SQL' ? 'SQL 结果列(metric_value)' : '整表',
    fieldsName: payload.fieldsName,
    ruleLevel: payload.ruleLevel || 'P1',
    generateMethod: payload.generateMethod || 'MANUAL',
    runStatus: payload.runStatus || 'SUCCESS',
    alarmStatus: payload.alarmStatus || 'NORMAL',
    threshold: payload.threshold || '<= 1%',
    status: payload.status || 'ENABLED',
    isEnabled: payload.isEnabled ?? true,
    isCanEdit: payload.isCanEdit ?? true,
    alreadyRun: payload.alreadyRun ?? false,
    createUser: payload.createUser || 'demo_user',
    description: payload.description || '',
    thresholdType: payload.thresholdType || 'NUMBER',
    filterExpr: payload.filterExpr || [],
    customSql: payload.customSql,
    customSqlFields: payload.customSqlFields || { logic: 'OR', conditions: [{}] },
    thresholdConditions: payload.thresholdConditions || { logic: 'OR', conditions: [{ operator: '<=', value: 1 }] },
    lastRunTime: makeTime(23, 18),
  };
  ruleDetailList = [next, ...ruleDetailList];
  syncRuleAggregates(next.tableId);
  return next;
}

export function deleteDqcRule(id: string) {
  const found = ruleDetailList.find((item) => item.id === id);
  ruleDetailList = ruleDetailList.filter((item) => item.id !== id);
  if (found?.tableId) syncRuleAggregates(found.tableId);
  return true;
}

export function toggleDqcRule(id: string) {
  ruleDetailList = ruleDetailList.map((item) =>
    item.id === id
      ? {
          ...item,
          status: item.status === 'ENABLED' ? 'DISABLED' : 'ENABLED',
          isEnabled: !(item.isEnabled ?? item.status === 'ENABLED'),
        }
      : item,
  );
  return ruleDetailList.find((item) => item.id === id) || null;
}

export function saveDqcMonitorEditor(payload: DqcMonitorEditor) {
  const tableInfo = ruleConfigs.find((item) => item.id === payload.tableId) || ruleConfigs[0];
  const id = payload.id || `group_${Date.now()}`;
  const existing = ruleMonitorList.find((item) => item.id === id);
  const monitorRecord: DqcRuleMonitorItem = {
    id,
    tableId: payload.tableId,
    name: payload.name,
    ruleGroupName: payload.name,
    triggerType: payload.triggerType,
    dataRange: payload.dataRangeType === 'FULL' ? '全表' : (payload.filterConditionText || 'dt=2026-04-22'),
    status: existing?.status || 'RUNNING',
    rulePassRate: existing?.rulePassRate || 100,
    totalRuleCnt: payload.rules.length,
    enabledRuleCnt: payload.rules.filter((item) => item.isEnabled ?? item.status === 'ENABLED').length,
    ownerUser: tableInfo.ownerUser,
    createUser: existing?.createUser || 'demo_user',
    createTime: existing?.createTime || makeTime(23, 18),
    updateTime: makeTime(23, 18),
    alreadyRun: existing?.alreadyRun ?? false,
    notifyPolicyId: payload.notifyPolicyId,
    notifyPolicyName: payload.notifyPolicyName,
  };
  if (existing) {
    ruleMonitorList = ruleMonitorList.map((item) => (item.id === id ? monitorRecord : item));
  } else {
    ruleMonitorList = [monitorRecord, ...ruleMonitorList];
  }

  const incomingRuleIds = new Set(payload.rules.filter((item) => item.id).map((item) => item.id));
  ruleDetailList = ruleDetailList.filter((item) => item.ruleGroupId !== id || incomingRuleIds.has(item.id));
  payload.rules.forEach((rule, index) => {
    saveDqcRule({
      ...rule,
      id: rule.id || undefined,
      tableId: payload.tableId,
      ruleGroupId: id,
      ruleGroupName: payload.name,
      ruleId: rule.ruleId || `R-${Date.now()}-${index + 1}`,
      status: rule.isEnabled === false ? 'DISABLED' : (rule.status || 'ENABLED'),
      isEnabled: rule.isEnabled ?? true,
    });
  });

  monitorEditorMap[id] = {
    ...payload,
    id,
    rules: payload.rules.map((item) => ({ ...item, ruleGroupId: id, ruleGroupName: payload.name })),
  };
  syncRuleAggregates(payload.tableId);
  return monitorEditorMap[id];
}

export function deleteDqcMonitorEditor(id: string) {
  const found = ruleMonitorList.find((item) => item.id === id);
  ruleMonitorList = ruleMonitorList.filter((item) => item.id !== id);
  ruleDetailList = ruleDetailList.filter((item) => item.ruleGroupId !== id);
  delete monitorEditorMap[id];
  if (found?.tableId) syncRuleAggregates(found.tableId);
  return true;
}

export function runDqcMonitorTest(groupId: string) {
  const group = ruleMonitorList.find((item) => item.id === groupId);
  if (!group) return null;
  const tableInfo = ruleConfigs.find((item) => item.id === group.tableId)!;
  const nextRun: DqcRunRecordItem = {
    id: `run_${Date.now()}`,
    tableId: group.tableId,
    ruleGroupId: group.id,
    dbTableName: `${tableInfo.databaseName}.${tableInfo.tableName}`,
    ruleGroupName: group.ruleGroupName,
    alarmStatus: 'NORMAL',
    runStatus: 'SUCCESS',
    triggerType: group.triggerType,
    dataRange: group.dataRange,
    ownerUser: tableInfo.ownerUser,
    rulePassCount: Math.max(group.enabledRuleCnt - 1, 0),
    ruleTotalCount: group.totalRuleCnt,
    startExeTime: makeTime(23, 20, 5),
    endExeTime: makeTime(23, 20, 35),
  };
  runRecordList = [nextRun, ...runRecordList];
  runRuleRecordList = [
    ...monitorEditorMap[groupId]?.rules.map((item, index) => ({
      id: `run_rule_${nextRun.id}_${index + 1}`,
      runRecordId: nextRun.id,
      ruleId: item.ruleId || item.id,
      ruleName: item.ruleName,
      ruleTemplateName: item.ruleTemplateName,
      ruleScope: item.ruleScope === 'CUSTOM_SQL' ? 'TABLE' : item.ruleScope,
      fieldsName: item.fieldsName,
      ruleLevel: item.ruleLevel,
      generateMethod: item.generateMethod,
      runStatus: index % 3 === 0 ? 'FAILED' : 'SUCCESS',
      alarmStatus: index % 3 === 0 ? 'ALARM' : 'NORMAL',
      threshold: item.threshold,
      errorMessage: index % 3 === 0 ? '监控阈值命中，已产生告警。' : '',
      sqlText: item.customSql || `select * from ${tableInfo.databaseName}.${tableInfo.tableName} limit 100`,
      resultSample: [
        { field_name: item.fieldsName || 'metric_value', actual_value: index % 3 === 0 ? 3 : 0, threshold: item.threshold, result: index % 3 === 0 ? 'FAIL' : 'PASS' },
      ],
    })) || [],
    ...runRuleRecordList,
  ];
  ruleMonitorList = ruleMonitorList.map((item) =>
    item.id === groupId ? { ...item, alreadyRun: true, updateTime: makeTime(23, 20, 40), status: 'RUNNING' } : item,
  );
  return nextRun;
}

export function getDqcPreviewTimes(hourInterval = 1, minuteOffset = 0) {
  const hours = hourInterval === 0 ? [0] : Array.from({ length: Math.ceil(24 / Math.max(hourInterval, 1)) }, (_, idx) => idx * Math.max(hourInterval, 1));
  return hours.slice(0, 8).map((hour) => `${String(hour % 24).padStart(2, '0')}:${String(Number(minuteOffset) || 0).padStart(2, '0')}:00`);
}

export function getDqcProjectWorkflows(projectCode?: string) {
  const project = projectCatalog.find((item) => item.code === projectCode) || projectCatalog[0];
  return project.workflows.map((item) => ({
    label: item.name,
    value: item.code,
    projectCode: project.code,
    projectName: project.name,
  }));
}

export function queryDqcRuns(params: { tableName?: string; ruleGroupName?: string; triggerType?: string; runStatus?: string; alarmStatus?: string; isSelf?: boolean; pageNo?: number; pageSize?: number } = {}) {
  const list = runRecordList.filter((item) =>
    includesKeyword([item.dbTableName], params.tableName)
    && includesKeyword([item.ruleGroupName], params.ruleGroupName)
    && (!params.triggerType || item.triggerType === params.triggerType)
    && (!params.runStatus || item.runStatus === params.runStatus)
    && (!params.alarmStatus || item.alarmStatus === params.alarmStatus)
    && (!params.isSelf || item.ownerUser === 'demo_user'),
  );
  return paginate(list, params.pageNo, params.pageSize);
}

export function getDqcRunDetail(runRecordId: string) {
  const base = runRecordList.find((item) => item.id === runRecordId);
  if (!base) return null;
  return {
    record: base,
    rules: runRuleRecordList.filter((item) => item.runRecordId === runRecordId),
  };
}

export function rerunDqcRecord(id: string) {
  runRecordList = runRecordList.map((item) =>
    item.id === id
      ? { ...item, runStatus: 'RUNNING', alarmStatus: 'NORMAL', startExeTime: makeTime(23, 19), endExeTime: makeTime(23, 19, 20) }
      : item,
  );
  return runRecordList.find((item) => item.id === id) || null;
}

export function queryDqcDiffs(params: {
  taskId?: string;
  taskName?: string;
  compareMode?: string;
  sourceTableName?: string;
  targetTableName?: string;
  taskStatus?: string;
  creator?: string;
  isSelf?: boolean;
  pageNo?: number;
  pageSize?: number;
} = {}) {
  const list = diffList.filter((item) =>
    includesKeyword([item.taskId], params.taskId)
    && includesKeyword([item.taskName], params.taskName)
    && includesKeyword([item.sourceTableName], params.sourceTableName)
    && includesKeyword([item.targetTableName], params.targetTableName)
    && (!params.compareMode || item.compareMode === params.compareMode)
    && (!params.taskStatus || item.taskStatus === params.taskStatus)
    && (!params.creator || item.creator === params.creator)
    && (!params.isSelf || item.creator === 'demo_user'),
  );
  return paginate(list, params.pageNo, params.pageSize);
}

export function getDqcDiffDetail(id: string) {
  return diffConfigMap[id] || null;
}

export function getDqcDiffReport(id: string) {
  return diffReportMap[id] || null;
}

export function saveDqcDiff(payload: Partial<DqcDiffConfig & DqcDiffItem>) {
  if (payload.id) {
    diffList = diffList.map((item) => (
      item.id === payload.id
        ? {
            ...item,
            taskName: payload.taskName || item.taskName,
            compareMode: payload.compareMode || item.compareMode,
            sourceTableName: payload.sourceTableName || payload.sourceConfig?.tableName || item.sourceTableName,
            targetTableName: payload.targetTableName || payload.targetConfig?.tableName || item.targetTableName,
            compareMethod: payload.compareMethod || item.compareMethod,
          }
        : item
    ));
    diffConfigMap[payload.id] = {
      ...(diffConfigMap[payload.id] || diffConfigMap[diffList[0].id]),
      ...payload,
      sourceConfig: { ...(diffConfigMap[payload.id]?.sourceConfig || {}), ...(payload.sourceConfig || {}) },
      targetConfig: { ...(diffConfigMap[payload.id]?.targetConfig || {}), ...(payload.targetConfig || {}) },
    } as DqcDiffConfig;
    return diffList.find((item) => item.id === payload.id) || null;
  }
  const id = `diff_${Date.now()}`;
  const next: DqcDiffItem = {
    id,
    taskId: `DQC-DIFF-${Date.now()}`,
    taskName: payload.taskName || '新建数据对比',
    compareMode: payload.compareMode || 'TABLE',
    sourceTableName: payload.sourceConfig?.tableName || 'dwd_user.user_profile_di',
    targetTableName: payload.targetConfig?.tableName || 'backup.user_profile_di',
    taskStatus: 'CREATED',
    creator: 'demo_user',
    createdAt: makeTime(23, 18),
    compareMethod: payload.compareMethod || 'ROW_BY_ROW',
    diffCount: 0,
  };
  diffList = [next, ...diffList];
  diffConfigMap[id] = {
    id,
    taskName: next.taskName,
    compareMode: next.compareMode,
    compareMethod: next.compareMethod,
    primaryKeys: payload.primaryKeys || ['id'],
    sourceConfig: payload.sourceConfig || {},
    targetConfig: payload.targetConfig || {},
  };
  diffReportMap[id] = {
    summary: {
      taskId: next.taskId,
      sourceTable: next.sourceTableName,
      targetTable: next.targetTableName,
      creator: 'demo_user',
      compareMode: next.compareMode,
      compareMethod: next.compareMethod,
      createdAt: makeTime(23, 18),
      duration: 0,
      sourceWhereCondition: payload.sourceConfig?.whereCondition || '无',
      targetWhereCondition: payload.targetConfig?.whereCondition || '无',
      sourceRowCount: 0,
      targetRowCount: 0,
      rowDiffPercent: 0,
      primaryKeyMatchCount: 0,
      sourceMatchPercent: 0,
      targetMatchPercent: 0,
    },
    detail: [],
    logs: [],
  };
  return next;
}

export function deleteDqcDiff(id: string) {
  diffList = diffList.filter((item) => item.id !== id);
  delete diffConfigMap[id];
  delete diffReportMap[id];
  return true;
}

export function runDqcDiff(id: string) {
  diffList = diffList.map((item) =>
    item.id === id ? { ...item, taskStatus: 'SUCCESS', diffCount: item.diffCount + 5 } : item,
  );
  return diffList.find((item) => item.id === id) || null;
}

export function queryDqcTests(params: { taskName?: string; databaseName?: string; tableName?: string; createUser?: string; isSelf?: boolean; pageNo?: number; pageSize?: number } = {}) {
  const list = testTaskList.filter((item) =>
    includesKeyword([item.taskName], params.taskName)
    && includesKeyword([item.databaseName], params.databaseName)
    && includesKeyword([item.tableName], params.tableName)
    && (!params.createUser || item.createUser === params.createUser)
    && (!params.isSelf || item.createUser === 'demo_user'),
  );
  return paginate(list, params.pageNo, params.pageSize);
}

export function getDqcTestInstances(taskId: string) {
  return testInstanceList.filter((item) => item.taskId === taskId);
}

export function getDqcTestDetail(id: string) {
  return testDetailMap[id] || null;
}

export function getDqcTestReport(instanceId: string) {
  return testReportMap[instanceId] || null;
}

export function saveDqcTestFeedback(instanceId: string, payload: { feedbackStatus: 'EXPECT_MATCH' | 'EXPECT_NOT_MATCH'; feedbackText?: string }) {
  const current = testReportMap[instanceId];
  if (!current) return null;
  testReportMap[instanceId] = {
    ...current,
    feedbackStatus: payload.feedbackStatus,
    feedbackText: payload.feedbackText || '',
  };
  testInstanceList = testInstanceList.map((item) => (
    item.id === instanceId
      ? { ...item, feedbackStatus: payload.feedbackStatus }
      : item
  ));
  return testReportMap[instanceId];
}

export function saveDqcTest(payload: Partial<DqcTestTaskDetail & DqcTestTaskItem>) {
  if (payload.id) {
    testTaskList = testTaskList.map((item) => (
      item.id === payload.id
        ? {
            ...item,
            taskName: payload.taskName || item.taskName,
            databaseName: payload.databaseName || item.databaseName,
            tableName: payload.tableName || item.tableName,
            updateTime: makeTs(23, 18),
          }
        : item
    ));
    testDetailMap[payload.id] = {
      ...(testDetailMap[payload.id] || testDetailMap[testTaskList[0].id]),
      ...payload,
      fieldRecords: payload.fieldRecords || testDetailMap[payload.id]?.fieldRecords || [],
      ruleRecords: payload.ruleRecords || testDetailMap[payload.id]?.ruleRecords || [],
    } as DqcTestTaskDetail;
    return testTaskList.find((item) => item.id === payload.id) || null;
  }
  const id = `test_${Date.now()}`;
  const next: DqcTestTaskItem = {
    id,
    showId: `DT-${Date.now()}`,
    taskName: payload.taskName || '新建测试任务',
    databaseName: payload.databaseName || 'dwd_user',
    tableName: payload.tableName || 'user_profile_di',
    createUser: 'demo_user',
    createUserName: 'Demo User',
    updateTime: makeTs(23, 18),
    createTime: makeTs(23, 18),
    owner: 'demo_user',
  };
  testTaskList = [next, ...testTaskList];
  testDetailMap[id] = {
    id,
    taskName: next.taskName,
    datasourceType: payload.datasourceType || 'HIVE',
    environmentType: payload.environmentType || 'PROD',
    databaseName: next.databaseName,
    tableName: next.tableName,
    partitionType: payload.partitionType || 'PARTITION',
    dataRangeType: payload.dataRangeType || 'PARTITION',
    partitionInfo: payload.partitionInfo || 'dt=2026-04-22',
    whereCondition: payload.whereCondition,
    owner: 'demo_user',
    fieldRecords: payload.fieldRecords || [],
    ruleRecords: payload.ruleRecords || [],
  };
  return next;
}

export function deleteDqcTest(id: string) {
  testTaskList = testTaskList.filter((item) => item.id !== id);
  testInstanceList = testInstanceList.filter((item) => item.taskId !== id);
  delete testDetailMap[id];
  return true;
}

export function runDqcTest(id: string) {
  const next: DqcTestInstanceItem = {
    id: `instance_${Date.now()}`,
    taskId: id,
    instanceId: `INST-${Date.now()}`,
    dataTestRunStatus: 'SUCCESS',
    executor: 'demo_user',
    executorName: 'Demo User',
    runTime: makeTs(23, 19),
    feedbackStatus: 'EXPECT_MATCH',
  };
  testInstanceList = [next, ...testInstanceList];
  testReportMap[next.id] = {
    overview: {
      instanceId: next.instanceId,
      databaseName: testTaskList.find((item) => item.id === id)?.databaseName || 'dwd_user',
      tableName: testTaskList.find((item) => item.id === id)?.tableName || 'user_profile_di',
      updateTime: next.runTime,
      taskDuration: 280,
      executor: 'demo_user',
      executorName: 'Demo User',
      rowCount: 120000,
      fieldCount: 24,
      dataRangeFilter: "dt = '2026-04-22'",
      primaryKeyFields: ['id', 'dt'],
      uniqueKeyCount: 119820,
      duplicateCount: 4,
      totalRuleCount: 8,
      failRuleCount: 1,
    },
    probeRecords: [],
    ruleRecords: [],
    logs: [],
    feedbackStatus: 'EXPECT_MATCH',
    feedbackText: '执行完成，结果符合预期。',
  };
  return next;
}

function syncRuleAggregates(tableId: string) {
  const tableRules = ruleDetailList.filter((item) => item.tableId === tableId);
  const tableGroups = ruleMonitorList.filter((item) => item.tableId === tableId);
  const enabledRuleCnt = tableRules.filter((item) => item.isEnabled ?? item.status === 'ENABLED').length;
  const groupMap = new Map(tableGroups.map((item) => [item.id, item]));
  tableGroups.forEach((group) => {
    const groupRules = tableRules.filter((item) => item.ruleGroupId === group.id);
    const enabledCount = groupRules.filter((item) => item.isEnabled ?? item.status === 'ENABLED').length;
    const nextGroup = { ...group, totalRuleCnt: groupRules.length, enabledRuleCnt: enabledCount, updateTime: makeTime(23, 18) };
    groupMap.set(group.id, nextGroup);
    monitorEditorMap[group.id] = {
      ...(monitorEditorMap[group.id] || getDqcMonitorEditor(group.id, tableId)),
      id: group.id,
      tableId,
      name: nextGroup.ruleGroupName,
      rules: groupRules.map((item) => ({ ...item })),
      notifyPolicyId: nextGroup.notifyPolicyId || notifyPolicies[0].id,
      notifyPolicyName: nextGroup.notifyPolicyName || notifyPolicies[0].name,
    } as DqcMonitorEditor;
  });
  ruleMonitorList = ruleMonitorList.map((item) => groupMap.get(item.id) || item);
  ruleConfigs = ruleConfigs.map((item) =>
    item.id === tableId
      ? {
          ...item,
          monitorCnt: tableGroups.length,
          ruleGroupCnt: tableGroups.length,
          enabledRuleCnt,
          ruleCnt: tableRules.length,
          totalRuleCnt: tableRules.length,
          updateTime: makeTime(23, 18),
        }
      : item,
  );
}

export function getDqcEnums() {
  return {
    templateTypes: [
      { label: '表级规则', value: 'TABLE' },
      { label: '字段级规则', value: 'FIELD' },
      { label: 'SQL 规则', value: 'SQL' },
      { label: '自定义规则', value: 'CUSTOM' },
    ],
    templateScopes: [
      { label: '按表', value: 'TABLE' },
      { label: '按字段', value: 'FIELD' },
    ],
    owners: owners.map((item) => ({ label: ownerNames[item], value: item })),
    tableStatuses: [
      { label: '在线', value: 'ONLINE' },
      { label: '下线', value: 'OFFLINE' },
    ],
    triggerTypes: [
      { label: '生产调度触发', value: 'SCHEDULED' },
      { label: '定时调度触发', value: 'CRON' },
    ],
    runStatuses: [
      { label: '初始化', value: 'INIT' },
      { label: '运行中', value: 'RUNNING' },
      { label: '运行成功', value: 'SUCCESS' },
      { label: '运行失败', value: 'FAILED' },
    ],
    alarmStatuses: [
      { label: '正常', value: 'NORMAL' },
      { label: '告警', value: 'ALARM' },
    ],
    compareModes: [
      { label: '表', value: 'TABLE' },
      { label: 'SQL', value: 'SQL' },
    ],
    compareMethods: [
      { label: '逐行对比', value: 'ROW_BY_ROW' },
      { label: '目标数据包含来源数据', value: 'TARGET_CONTAINS_SOURCE' },
    ],
    diffStatuses: [
      { label: '待运行', value: 'CREATED' },
      { label: '运行中', value: 'RUNNING' },
      { label: '运行成功', value: 'SUCCESS' },
      { label: '运行失败', value: 'FAILED' },
      { label: '已停止', value: 'STOPPED' },
    ],
    compareResults: [
      { label: '一致', value: 'EQUAL' },
      { label: '不一致', value: 'DIFF' },
      { label: '仅来源存在', value: 'SOURCE_ONLY' },
      { label: '仅目标存在', value: 'TARGET_ONLY' },
    ],
    envOptions: [
      { label: '生产', value: 'PROD' },
      { label: '预发', value: 'PRE' },
    ],
    datasourceTypes: [
      { label: 'Hive', value: 'HIVE' },
      { label: 'StarRocks', value: 'STARROCKS' },
    ],
    dataRangeOptions: [
      { label: '分区', value: 'PARTITION' },
      { label: 'WHERE', value: 'WHERE' },
      { label: '全表', value: 'FULL' },
    ],
    tagTypes: [
      { label: '主键', value: '主键' },
      { label: '枚举', value: '枚举' },
      { label: '数值', value: '数值' },
      { label: '分区', value: '分区' },
    ],
    levels: [
      { label: 'P0', value: 'P0' },
      { label: 'P1', value: 'P1' },
      { label: 'P2', value: 'P2' },
    ],
    boolOptions: [
      { label: '启用', value: true },
      { label: '停用', value: false },
    ],
    generateMethods: [
      { label: '系统生成', value: 'SYSTEM' },
      { label: '手工配置', value: 'MANUAL' },
    ],
    ruleTemplateTypeOptions: [
      { label: '表级规则', value: 'TABLE' },
      { label: '字段级规则', value: 'FIELD' },
      { label: 'SQL 规则', value: 'SQL' },
      { label: '自定义规则', value: 'CUSTOM' },
    ],
    notifyPolicies: notifyPolicies.map((item) => ({ label: item.name, value: item.id })),
    projects: projectCatalog.map((item) => ({ label: item.name, value: item.code })),
  };
}
