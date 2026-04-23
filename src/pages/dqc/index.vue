<template>
  <div class="dqc-page">
    <section class="dqc-page__hero">
      <div>
        <p class="dqc-page__eyebrow">数据质量治理</p>
        <h2>数据质量</h2>
        <p class="dqc-page__desc">查看规则模板、规则配置、质量运维、数据对比和数据测试结果。</p>
      </div>
      <a-space wrap>
        <a-button @click="reloadCurrent">刷新当前视图</a-button>
        <a-button v-if="showCreateButton" type="primary" @click="handlePrimaryCreate">{{ primaryCreateLabel }}</a-button>
      </a-space>
    </section>

    <section v-if="pageMode === 'list'" class="dqc-page__stats">
      <article class="stat-card">
        <span>规则模板</span>
        <strong>{{ summary.templateCount }}</strong>
        <small>模板库总数</small>
      </article>
      <article class="stat-card">
        <span>质量规则</span>
        <strong>{{ summary.ruleCount }}</strong>
        <small>已配置规则数</small>
      </article>
      <article class="stat-card">
        <span>异常告警</span>
        <strong>{{ summary.alertCount }}</strong>
        <small>近期运行异常</small>
      </article>
      <article class="stat-card">
        <span>成功率</span>
        <strong>{{ summary.successRate }}%</strong>
        <small>运行记录成功率</small>
      </article>
    </section>

    <section v-if="pageMode === 'list'" class="workspace">
      <aside class="workspace__sider">
        <div
          v-for="item in sections"
          :key="item.key"
          :class="['section-card', { 'is-active': activeSection === item.key }]"
          @click="switchSection(item.key)"
        >
          <div class="section-card__title">{{ item.label }}</div>
          <div class="section-card__desc">{{ item.desc }}</div>
        </div>
      </aside>

      <div class="workspace__content">
        <section :class="['panel', { 'panel--rule-config': activeSection === 'rule' }]">
          <div class="panel__header">
            <div>
              <h3>{{ currentSection.label }}</h3>
              <p>{{ currentSection.longDesc }}</p>
            </div>
          </div>

          <template v-if="activeSection === 'template'">
            <div class="filter-grid filter-grid--3">
              <a-select v-model:value="templateFilters.type" allow-clear placeholder="规则类型" :options="enumOptions.templateTypes" />
              <a-select v-model:value="templateFilters.scope" allow-clear placeholder="规则范围" :options="enumOptions.templateScopes" />
              <div class="filter-actions">
                <a-button @click="resetTemplateFilters">重置</a-button>
                <a-button type="primary" @click="loadTemplates">查询</a-button>
              </div>
            </div>
          </template>

          <template v-else-if="activeSection === 'rule'">
            <div class="rule-shell">
              <aside :class="['rule-tree-card', { 'is-collapsed': ruleTreeCollapsed }]">
                <div class="rule-tree-card__header">
                  <div>
                    <h4>数据源树</h4>
                    <p>按数据源和库表定位监控配置范围</p>
                  </div>
                </div>
                <a-tree
                  v-if="!ruleTreeCollapsed"
                  :tree-data="ruleTreeData"
                  :selected-keys="selectedRuleTreeKeys"
                  default-expand-all
                  block-node
                  @select="handleRuleTreeSelect"
                >
                  <template #title="{ label, number, databaseName }">
                    <div class="rule-tree-node">
                      <span class="rule-tree-node__label">
                        <ClusterOutlined v-if="!databaseName" />
                        <DatabaseOutlined v-else />
                        <span>{{ label }}</span>
                      </span>
                      <a-tag>{{ number }}</a-tag>
                    </div>
                  </template>
                </a-tree>
                <div class="rule-tree-card__shrink" @click="ruleTreeCollapsed = !ruleTreeCollapsed">
                  <LeftOutlined v-if="!ruleTreeCollapsed" />
                  <RightOutlined v-else />
                </div>
              </aside>

              <div class="rule-shell__main">
                <div class="rule-shell__card">
                  <div class="filter-grid filter-grid--3">
                    <a-auto-complete
                      v-model:value="ruleFilters.tableName"
                      :options="ruleTableSuggestions"
                      allow-clear
                      placeholder="请输入指标关键字查询"
                      @search="searchRuleTables"
                    />
                    <a-select v-model:value="ruleFilters.ownerUser" allow-clear placeholder="表负责人" :options="enumOptions.owners" show-search />
                    <div class="filter-actions">
                      <a-button @click="resetRuleFilters">重置</a-button>
                      <a-button type="primary" @click="loadRuleConfigs">查询</a-button>
                    </div>
                  </div>
                  <div class="rule-context-tags">
                    <a-tag>数据库类型: {{ ruleContext.dbSourceType || '/' }}</a-tag>
                    <a-tag>实例: {{ ruleContext.dataSourceName || ruleContext.dataSourceId || '/' }}</a-tag>
                    <a-tag>数据库: {{ ruleContext.databaseName || '/' }}</a-tag>
                  </div>
                </div>

                <div class="rule-shell__card">
                  <div class="rule-result-header">
                    <div>
                      <h4>按表配置结果</h4>
                      <p>按当前数据源、数据库和筛选条件展示质量监控配置情况。</p>
                    </div>
                  </div>
                  <div class="toolbar toolbar--between">
                    <a-space>
                      <a-checkbox v-model:checked="ruleFilters.notHasRule" @change="loadRuleConfigs">未配置规则</a-checkbox>
                      <a-checkbox v-model:checked="ruleFilters.isSelf" @change="loadRuleConfigs">我负责的</a-checkbox>
                    </a-space>
                    <a-tag color="blue">{{ pagination.total || 0 }} 条</a-tag>
                  </div>
                  <a-table
                    :data-source="ruleConfigRecords"
                    :columns="ruleColumns"
                    :pagination="pagination"
                    :loading="loading"
                    row-key="id"
                    size="small"
                    bordered
                    :scroll="{ x: 1280, y: 520 }"
                    @change="handleTableChange"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'tableName'">
                        <div class="stack-cell">
                          <strong>{{ record.databaseName }}.{{ record.tableName }}</strong>
                          <span>{{ record.dataSourceName }}</span>
                        </div>
                      </template>
                      <template v-else-if="column.key === 'ownerUser'">
                        {{ ownerLabel(record.ownerUser) }}
                      </template>
                      <template v-else-if="column.key === 'ruleGroupCnt'">
                        {{ record.ruleGroupCnt }}
                      </template>
                      <template v-else-if="column.key === 'enabledRuleCnt'">
                        <a-tag color="green">{{ record.enabledRuleCnt }}</a-tag>
                      </template>
                      <template v-else-if="column.key === 'tableCreateTime' || column.key === 'updateTime'">
                        {{ formatDateTime(record[column.key]) }}
                      </template>
                      <template v-else-if="column.key === 'action'">
                        <a-space>
                          <a-button size="small" :disabled="record.tableStatus === 'OFFLINE' && record.ruleGroupCnt === 0" type="primary" @click="openRuleDetail(record.id)">查看监控</a-button>
                          <a-button size="small" :disabled="record.tableStatus === 'OFFLINE'" @click="openMonitorEditor({ tableId: record.id, mode: 'create' })">新建监控</a-button>
                        </a-space>
                      </template>
                    </template>
                  </a-table>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="activeSection === 'run'">
            <div class="filter-grid filter-grid--3">
              <a-input v-model:value="runFilters.tableName" allow-clear placeholder="数据表" />
              <a-input v-model:value="runFilters.ruleGroupName" allow-clear placeholder="质量监控" />
              <a-select v-model:value="runFilters.triggerType" allow-clear placeholder="触发方式" :options="enumOptions.triggerTypes" />
              <a-select v-model:value="runFilters.runStatus" allow-clear placeholder="运行状态" :options="enumOptions.runStatuses" />
              <a-select v-model:value="runFilters.alarmStatus" allow-clear placeholder="告警状态" :options="enumOptions.alarmStatuses" />
              <div class="filter-actions">
                <a-button @click="resetRunFilters">重置</a-button>
                <a-button type="primary" @click="loadRuns">查询</a-button>
              </div>
            </div>
            <div class="toolbar">
              <a-checkbox v-model:checked="runFilters.isSelf" @change="loadRuns">我负责的</a-checkbox>
            </div>
          </template>

          <template v-else-if="activeSection === 'diff'">
            <div class="filter-grid filter-grid--4">
              <a-input v-model:value="diffFilters.taskId" allow-clear placeholder="对比ID" />
              <a-input v-model:value="diffFilters.taskName" allow-clear placeholder="任务名称" />
              <a-select v-model:value="diffFilters.compareMode" allow-clear placeholder="对比模式" :options="enumOptions.compareModes" />
              <a-input v-model:value="diffFilters.sourceTableName" allow-clear placeholder="A数据表名称" />
              <a-input v-model:value="diffFilters.targetTableName" allow-clear placeholder="B数据表名称" />
              <a-select v-model:value="diffFilters.taskStatus" allow-clear placeholder="运行状态" :options="enumOptions.diffStatuses" />
              <a-select v-model:value="diffFilters.creator" allow-clear placeholder="创建人" :options="enumOptions.owners" />
              <div class="filter-actions">
                <a-button @click="resetDiffFilters">重置</a-button>
                <a-button type="primary" @click="loadDiffs">查询</a-button>
              </div>
            </div>
            <div class="toolbar">
              <a-checkbox v-model:checked="diffFilters.isSelf" @change="loadDiffs">我创建的</a-checkbox>
            </div>
          </template>

          <template v-else>
            <div class="filter-grid filter-grid--4">
              <a-input v-model:value="testFilters.taskName" allow-clear placeholder="任务名称" />
              <a-input v-model:value="testFilters.databaseName" allow-clear placeholder="库名" />
              <a-input v-model:value="testFilters.tableName" allow-clear placeholder="表名" />
              <a-select v-model:value="testFilters.createUser" allow-clear placeholder="创建人" :options="enumOptions.owners" />
              <div class="filter-actions">
                <a-button @click="resetTestFilters">重置</a-button>
                <a-button type="primary" @click="loadTests">查询</a-button>
              </div>
            </div>
            <div class="toolbar">
              <a-checkbox v-model:checked="testFilters.isSelf" @change="loadTests">我创建的</a-checkbox>
            </div>
          </template>
        </section>

        <section v-if="activeSection !== 'rule'" class="panel">
          <div class="panel__header">
            <div>
              <h3>{{ currentSection.label }}列表</h3>
              <p>{{ currentSection.tableDesc }}</p>
            </div>
            <a-tag color="blue">{{ pagination.total || 0 }} 条</a-tag>
          </div>

          <template v-if="activeSection === 'template'">
            <a-table
              :data-source="templateRecords"
              :columns="templateColumns"
              :pagination="pagination"
              :loading="loading"
              row-key="id"
              :scroll="{ x: 1280 }"
              @change="handleTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status === 'ENABLED' ? 'green' : 'default'">{{ record.status }}</a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button size="small" type="primary" @click="openTemplateModal(record)">编辑</a-button>
                    <a-popconfirm title="确认删除模板？" @confirm="removeTemplate(record.id)">
                      <a-button size="small" danger>删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </template>

          <template v-else-if="activeSection === 'rule'">
            <a-table
              :data-source="ruleConfigRecords"
              :columns="ruleColumns"
              :pagination="pagination"
              :loading="loading"
              row-key="id"
              :scroll="{ x: 1280 }"
              @change="handleTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'tableName'">
                  <div class="stack-cell">
                    <strong>{{ record.databaseName }}.{{ record.tableName }}</strong>
                    <span>{{ record.dataSourceName }}</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'ownerUser'">
                  {{ ownerLabel(record.ownerUser) }}
                </template>
                <template v-else-if="column.key === 'ruleGroupCnt'">
                  {{ record.ruleGroupCnt }}
                </template>
                <template v-else-if="column.key === 'enabledRuleCnt'">
                  <a-tag color="green">{{ record.enabledRuleCnt }}</a-tag>
                </template>
                <template v-else-if="column.key === 'tableCreateTime' || column.key === 'updateTime'">
                  {{ formatDateTime(record[column.key]) }}
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button size="small" :disabled="record.tableStatus === 'OFFLINE' && record.ruleGroupCnt === 0" type="primary" @click="openRuleDetail(record.id)">查看监控</a-button>
                    <a-button size="small" :disabled="record.tableStatus === 'OFFLINE'" @click="openMonitorEditor({ tableId: record.id, mode: 'create' })">新建监控</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </template>

          <template v-else-if="activeSection === 'run'">
            <a-table
              :data-source="runRecords"
              :columns="runColumns"
              :pagination="pagination"
              :loading="loading"
              row-key="id"
              :scroll="{ x: 1600 }"
              @change="handleTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'alarmStatus'">
                  <div class="alarm-cell">
                    <a-tag v-if="record.runStatus === 'SUCCESS' || record.runStatus === 'FAILED'" :color="record.alarmStatus === 'NORMAL' ? 'green' : 'red'">
                      {{ record.alarmStatus === 'NORMAL' ? '正常' : '告警' }}
                    </a-tag>
                    <span>{{ record.rulePassCount }}/{{ record.ruleTotalCount }} 规则通过</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'runStatus'">
                  <a-tag :color="runStatusColor(record.runStatus)">{{ runStatusLabel(record.runStatus) }}</a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button size="small" type="primary" @click="openRunDetail(record.id)">运行详情</a-button>
                    <a-button size="small" @click="rerunRecord(record.id)">重跑</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </template>

          <template v-else-if="activeSection === 'diff'">
            <a-table
              :data-source="diffRecords"
              :columns="diffColumns"
              :pagination="pagination"
              :loading="loading"
              row-key="id"
              :scroll="{ x: 1780 }"
              @change="handleTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'compareMode'">
                  {{ record.compareMode === 'TABLE' ? '表' : 'SQL' }}
                </template>
                <template v-else-if="column.key === 'taskStatus'">
                  <a-tag :color="diffStatusColor(record.taskStatus)">{{ diffStatusLabel(record.taskStatus) }}</a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space wrap>
                    <a-button size="small" :disabled="record.taskStatus !== 'SUCCESS'" @click="openDiffReport(record.id)">对比报告</a-button>
                    <a-button size="small" @click="runDiff(record.id)">{{ record.taskStatus === 'RUNNING' ? '停止' : '运行' }}</a-button>
                    <a-button size="small" type="primary" @click="openDiffEditor(record.id, 'edit')">编辑</a-button>
                    <a-button size="small" @click="openDiffEditor(record.id, 'copy')">复制</a-button>
                    <a-dropdown>
                      <a class="link-more">更多</a>
                      <template #overlay>
                        <a-menu>
                          <a-menu-item key="view" @click="openDiffEditor(record.id, 'view')">查看</a-menu-item>
                          <a-menu-item key="log" @click="openDiffLog(record.id)">日志</a-menu-item>
                          <a-menu-item key="delete" @click="removeDiff(record.id)">删除</a-menu-item>
                        </a-menu>
                      </template>
                    </a-dropdown>
                  </a-space>
                </template>
              </template>
            </a-table>
          </template>

          <template v-else>
            <a-table
              :data-source="testRecords"
              :columns="testColumns"
              :pagination="pagination"
              :loading="loading"
              row-key="id"
              :expanded-row-keys="expandedTestRowKeys"
              :scroll="{ x: 1600 }"
              @change="handleTableChange"
              @expand="handleTestExpand"
            >
              <template #expandedRowRender="{ record }">
                <a-table
                  size="small"
                  :pagination="false"
                  :data-source="testInstanceMap[record.id] || []"
                  :columns="testInstanceColumns"
                  row-key="id"
                >
                  <template #bodyCell="{ column, record: instance }">
                    <template v-if="column.key === 'dataTestRunStatus'">
                      <a-tag :color="testInstanceStatusColor(instance.dataTestRunStatus)">{{ testInstanceStatusLabel(instance.dataTestRunStatus) }}</a-tag>
                    </template>
                    <template v-else-if="column.key === 'feedbackStatus'">
                      {{ feedbackLabel(instance.feedbackStatus) }}
                    </template>
                    <template v-else-if="column.key === 'runTime'">
                      {{ formatDateTime(instance.runTime) }}
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-space wrap>
                        <a-button size="small" :disabled="instance.dataTestRunStatus !== 'SUCCESS'" @click="openTestReport(instance.id)">报告</a-button>
                        <a-button size="small" @click="openInstanceDetail(instance)">查看</a-button>
                        <a-button size="small" :disabled="instance.dataTestRunStatus !== 'SUCCESS'" @click="openShareModal(instance)">分享</a-button>
                        <a-button size="small" @click="openTestLog(instance.id)">日志</a-button>
                      </a-space>
                    </template>
                  </template>
                </a-table>
              </template>
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'taskName'">
                  <a-space>
                    <a-tag color="blue">测试</a-tag>
                    <span>{{ record.taskName }}</span>
                  </a-space>
                </template>
                <template v-else-if="column.key === 'createUser'">
                  {{ record.createUserName }}({{ record.createUser }})
                </template>
                <template v-else-if="column.key === 'databaseName'">
                  {{ record.databaseName }}.{{ record.tableName }}
                </template>
                <template v-else-if="column.key === 'createTime' || column.key === 'updateTime'">
                  {{ formatDateTime(record[column.key]) }}
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space wrap>
                    <a-button size="small" @click="openTestEditor(record.id, 'view')">查看</a-button>
                    <a-button size="small" type="primary" @click="openTestEditor(record.id, 'edit')">编辑</a-button>
                    <a-button size="small" @click="runTest(record.id)">运行</a-button>
                    <a-button size="small" @click="openTestEditor(record.id, 'copy')">复制</a-button>
                    <a-popconfirm title="确定删除测试任务？" @confirm="removeTest(record.id)">
                      <a-button size="small" danger>删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </template>
        </section>
      </div>
    </section>

    <section v-else-if="pageMode === 'rule-detail'" class="detail-page">
      <div class="detail-breadcrumb">
        <span>DQC-数据质量</span>
        <span>/</span>
        <span class="detail-breadcrumb__link" @click="backToList">按表配置</span>
        <span>/</span>
        <span>表质量详情</span>
      </div>
      <div class="detail-page__header">
        <div>
          <a-button type="link" class="back-link" @click="backToList">返回按表配置</a-button>
          <h3>{{ ruleDetail?.tableInfo.databaseName }}.{{ ruleDetail?.tableInfo.tableName }}</h3>
          <p>按表查看质量监控与规则明细，支持编辑、测试、复制、删除和最近运行结果追踪。</p>
        </div>
        <a-space>
          <a-tag>{{ ruleDetail?.tableInfo.dataSourceType }}</a-tag>
          <a-tag>{{ ruleDetail?.tableInfo.dataAssetLevelNameEn }}</a-tag>
          <a-tag>{{ ruleDetail?.tableInfo.partitionType === 'PARTITION' ? '分区表' : '非分区表' }}</a-tag>
        </a-space>
      </div>

      <section class="panel">
        <a-tabs v-model:activeKey="ruleDetailTab">
          <a-tab-pane key="monitor" tab="质量监控">
            <div class="detail-tab-toolbar">
              <div>
                <h4>质量监控列表</h4>
                <p>查看当前数据表下的质量监控配置、触发方式和最近运行入口。</p>
              </div>
              <a-space wrap>
                <a-tag color="blue">{{ filteredMonitorRecords.length }} 个监控</a-tag>
                <a-tag color="green">{{ monitorEnabledRuleCount }} 条启用规则</a-tag>
              </a-space>
            </div>
            <div class="detail-inline-filters">
              <a-input v-model:value="monitorFilters.ruleGroupName" allow-clear placeholder="质量监控名称" />
              <div class="filter-actions detail-inline-filters__actions">
                <a-button @click="resetMonitorFilters">重置</a-button>
                <a-button type="primary" @click="applyRuleDetailFilters">查询</a-button>
              </div>
            </div>
            <a-table
              :data-source="filteredMonitorRecords"
              :columns="ruleMonitorColumns"
              row-key="id"
              :pagination="false"
              size="middle"
              bordered
              :scroll="{ x: 1900 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'ruleGroupName'">
                  <div class="stack-cell">
                    <span>{{ record.id }}</span>
                    <strong>{{ record.ruleGroupName }}</strong>
                  </div>
                </template>
                <template v-else-if="column.key === 'triggerType'">
                  {{ monitorTriggerLabel(record.triggerType) }}
                </template>
                <template v-else-if="column.key === 'totalRuleCnt'">
                  {{ record.enabledRuleCnt }}/{{ record.totalRuleCnt }}
                </template>
                <template v-else-if="column.key === 'ownerUser' || column.key === 'createUser'">
                  {{ ownerLabel(record[column.key]) }}
                </template>
                <template v-else-if="column.key === 'createTime' || column.key === 'updateTime'">
                  {{ formatDateTime(record[column.key]) }}
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space wrap>
                    <a-button size="small" @click="openMonitorEditor({ groupId: record.id, mode: 'view' })">查看</a-button>
                    <a-button size="small" type="primary" :disabled="ruleDetail?.tableInfo.tableStatus === 'OFFLINE'" @click="openMonitorEditor({ groupId: record.id, mode: 'edit' })">编辑</a-button>
                    <a-button size="small" :disabled="ruleDetail?.tableInfo.tableStatus === 'OFFLINE' || !record.enabledRuleCnt" @click="openRunTestModal(record)">测试</a-button>
                    <a-button size="small" :disabled="ruleDetail?.tableInfo.tableStatus === 'OFFLINE' || !record.alreadyRun" @click="openLatestRunRecord(record)">最近一次运行记录</a-button>
                    <a-button size="small" :disabled="ruleDetail?.tableInfo.tableStatus === 'OFFLINE'" @click="openMonitorEditor({ groupId: record.id, mode: 'copy' })">复制</a-button>
                    <a-popconfirm title="确认删除该质量监控？" @confirm="removeMonitor(record.id)">
                      <a-button size="small" danger :disabled="ruleDetail?.tableInfo.tableStatus === 'OFFLINE'">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-tab-pane>
          <a-tab-pane key="rule" tab="规则管理">
            <div class="detail-tab-toolbar">
              <div>
                <h4>规则管理列表</h4>
                <p>查看规则范围、模板、启用状态和运行入口，保持和质量监控配置同步。</p>
              </div>
              <a-space wrap>
                <a-tag color="blue">{{ filteredRuleRecords.length }} 条规则</a-tag>
                <a-tag color="green">{{ enabledRuleCount }} 条启用</a-tag>
                <a-tag>{{ filteredRuleRecords.length - enabledRuleCount }} 条停用</a-tag>
              </a-space>
            </div>
            <div class="filter-grid filter-grid--3 detail-filter-grid">
              <a-input v-model:value="ruleDetailFilters.ruleGroupName" allow-clear placeholder="质量监控名称" />
              <a-select v-model:value="ruleDetailFilters.ruleId" allow-clear show-search placeholder="规则ID" :options="ruleIdOptions" />
              <a-input v-model:value="ruleDetailFilters.ruleName" allow-clear placeholder="规则名称" />
              <a-select v-model:value="ruleDetailFilters.ruleTemplateType" allow-clear placeholder="规则类型" :options="enumOptions.ruleTemplateTypeOptions" />
              <a-select v-model:value="ruleDetailFilters.ruleTemplateName" allow-clear show-search placeholder="规则模板" :options="ruleTemplateNameOptions" />
              <a-select v-model:value="ruleDetailFilters.ruleTemplateScope" allow-clear placeholder="规则范围" :options="enumOptions.templateScopes" />
              <a-select v-model:value="ruleDetailFilters.ruleLevel" allow-clear placeholder="重要程度" :options="enumOptions.levels" />
              <a-select v-model:value="ruleDetailFilters.isEnabled" allow-clear placeholder="启用状态" :options="enumOptions.boolOptions" />
              <a-select v-model:value="ruleDetailFilters.generateMethod" allow-clear placeholder="生成方式" :options="enumOptions.generateMethods" />
              <div class="filter-actions rule-filter-actions--full">
                <a-button @click="resetRuleDetailFilters">重置</a-button>
                <a-button type="primary" @click="applyRuleDetailFilters">查询</a-button>
              </div>
            </div>
            <div class="detail-summary-strip">
              <div class="detail-summary-chip">
                <span>规则模板</span>
                <strong>{{ distinctRuleTemplateCount }}</strong>
              </div>
              <div class="detail-summary-chip">
                <span>规则范围</span>
                <strong>{{ distinctRuleScopeCount }}</strong>
              </div>
              <div class="detail-summary-chip">
                <span>生成方式</span>
                <strong>{{ distinctGenerateMethodCount }}</strong>
              </div>
            </div>
            <a-table
              :data-source="pagedRuleRecords"
              :columns="ruleDetailColumns"
              row-key="id"
              size="middle"
              bordered
              :pagination="ruleDetailPaginationConfig"
              :scroll="{ x: 1840 }"
              @change="handleRuleDetailTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'ruleGroupName'">
                  <div class="stack-cell">
                    <span>{{ record.ruleGroupId }}</span>
                    <strong>{{ record.ruleGroupName }}</strong>
                  </div>
                </template>
                <template v-else-if="column.key === 'ruleName'">
                  <div class="stack-cell">
                    <span>{{ record.ruleId }}</span>
                    <strong>{{ record.ruleName }}</strong>
                  </div>
                </template>
                <template v-else-if="column.key === 'generateMethod'">
                  {{ generateMethodLabel(record.generateMethod) }}
                </template>
                <template v-else-if="column.key === 'ruleTemplateType'">
                  {{ templateTypeLabel(record.ruleTemplateType) }}
                </template>
                <template v-else-if="column.key === 'ruleLevel'">
                  {{ record.ruleLevel }}
                </template>
                <template v-else-if="column.key === 'status'">
                  <span class="status-inline" :class="{ 'is-enabled': record.isEnabled ?? record.status === 'ENABLED' }">
                    <CheckCircleFilled v-if="record.isEnabled ?? record.status === 'ENABLED'" />
                    <MinusCircleFilled v-else />
                    {{ record.isEnabled ?? record.status === 'ENABLED' ? '启用' : '停用' }}
                  </span>
                </template>
                <template v-else-if="column.key === 'runStatus'">
                  <a-tag :color="runStatusColor(record.runStatus)">{{ runStatusLabel(record.runStatus) }}</a-tag>
                </template>
                <template v-else-if="column.key === 'createUser'">
                  {{ ownerLabel(record.createUser) }}
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-space>
                    <a-button size="small" @click="openRuleModal(record, true)">查看</a-button>
                    <a-button size="small" type="primary" :disabled="ruleDetail?.tableInfo.tableStatus === 'OFFLINE' || !record.isCanEdit" @click="openRuleModal(record)">编辑</a-button>
                    <a-button size="small" :disabled="ruleDetail?.tableInfo.tableStatus === 'OFFLINE' || !record.alreadyRun" @click="openRuleRunResult(record)">运行结果</a-button>
                    <a-popconfirm title="确认删除规则？" @confirm="removeRule(record.id)">
                      <a-button size="small" danger :disabled="ruleDetail?.tableInfo.tableStatus === 'OFFLINE'">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </section>
    </section>

    <section v-else-if="pageMode === 'rule-monitor-editor'" class="detail-page">
      <div class="detail-breadcrumb">
        <span>DQC-数据质量</span>
        <span>/</span>
        <span class="detail-breadcrumb__link" @click="backToList">按表配置</span>
        <span>/</span>
        <span>
          {{
            monitorEditorMode === 'view'
              ? '查看质量监控'
              : monitorEditorMode === 'edit'
                ? '编辑质量监控'
                : monitorEditorMode === 'copy'
                  ? '复制质量监控'
                  : '新建质量监控'
          }}
        </span>
      </div>
      <div class="detail-page__header">
        <div>
          <a-button type="link" class="back-link" @click="backToRuleDetail">返回表质量详情</a-button>
          <h3>
            {{
              monitorEditorMode === 'view'
                ? '查看质量监控'
                : monitorEditorMode === 'edit'
                  ? '编辑质量监控'
                  : monitorEditorMode === 'copy'
                    ? '复制质量监控'
                    : '新建质量监控'
            }}
          </h3>
          <p>{{ monitorEditor.tableNameDisplay }} · 可统一配置质量规则、执行方式与告警通知策略。</p>
        </div>
      </div>

      <div class="detail-cards detail-cards--editor">
        <article class="detail-card">
          <span>监控对象</span>
          <strong>{{ monitorEditor.tableNameDisplay || '/' }}</strong>
        </article>
        <article class="detail-card">
          <span>质量规则</span>
          <strong>{{ monitorEditor.rules.length }}</strong>
        </article>
        <article class="detail-card">
          <span>启用规则</span>
          <strong>{{ monitorEditorEnabledRuleCount }}</strong>
        </article>
        <article class="detail-card">
          <span>触发方式</span>
          <strong>{{ monitorEditor.triggerType === 'CRON' ? '定时调度触发' : '生产调度触发' }}</strong>
        </article>
      </div>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>1</span> 基础信息</div>
        <div class="form-grid form-grid--2">
          <a-form-item label="质量监控名称">
            <a-input v-model:value="monitorEditor.name" :disabled="monitorEditorReadonly || monitorEditor.isCanNotEdit" />
          </a-form-item>
          <a-form-item label="监控对象">
            <div class="plain-value">
              {{ monitorEditor.tableNameDisplay }}
              <a-tag style="margin-left: 8px">{{ monitorEditor.partitionType === 'PARTITION' ? '分区表' : '非分区表' }}</a-tag>
            </div>
          </a-form-item>
          <a-form-item label="数据范围">
            <a-radio-group
              v-model:value="monitorEditor.dataRangeType"
              :disabled="monitorEditorReadonly || monitorEditor.partitionType === 'NONE'"
              :options="[
                { label: '全表', value: 'FULL' },
                { label: '分区', value: 'PARTITION' },
                { label: 'WHERE', value: 'WHERE' },
              ]"
            />
          </a-form-item>
          <a-form-item label="过滤条件">
            <a-input
              v-model:value="monitorEditor.filterConditionText"
              :disabled="monitorEditorReadonly || monitorEditor.dataRangeType === 'FULL'"
              :placeholder="monitorEditor.dataRangeType === 'PARTITION' ? '例如 dt=2026-04-22' : '例如 dt >= 2026-04-22 and region = CN'"
            />
          </a-form-item>
          <a-form-item label="描述" class="grid-full">
            <a-textarea v-model:value="monitorEditor.description" :disabled="monitorEditorReadonly" :rows="4" />
          </a-form-item>
        </div>
      </section>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>2</span> 质量规则</div>
        <div class="detail-summary-strip editor-summary-strip">
          <div class="detail-summary-chip">
            <span>表级规则</span>
            <strong>{{ monitorEditorTableRuleCount }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>字段级规则</span>
            <strong>{{ monitorEditorFieldRuleCount }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>SQL 规则</span>
            <strong>{{ monitorEditorSqlRuleCount }}</strong>
          </div>
        </div>
        <div class="detail-toolbar detail-toolbar--split">
          <a-space wrap>
            <a-button dashed :disabled="monitorEditorReadonly || monitorEditor.isCanNotEdit" @click="openAiRuleDrawer">
              <template #icon><PlusOutlined /></template>
              生成规则
            </a-button>
            <a-button dashed :disabled="monitorEditorReadonly || monitorEditor.isCanNotEdit" @click="openTableRuleDrawer">
              <template #icon><PlusOutlined /></template>
              表级模板配置
            </a-button>
            <a-button dashed :disabled="monitorEditorReadonly || monitorEditor.isCanNotEdit" @click="openFieldRuleDrawer">
              <template #icon><PlusOutlined /></template>
              字段级模板配置
            </a-button>
            <a-button dashed :disabled="monitorEditorReadonly || monitorEditor.isCanNotEdit" @click="openSqlRuleDrawer">
              <template #icon><PlusOutlined /></template>
              自定义SQL规则
            </a-button>
          </a-space>
          <a-space wrap>
            <a-tag color="blue">共 {{ monitorEditor.rules.length }} 条规则</a-tag>
            <a-tag color="green">{{ monitorEditorEnabledRuleCount }} 条启用</a-tag>
            <a-tag v-if="monitorEditorIssueRuleCount" color="orange">{{ monitorEditorIssueRuleCount }} 条待处理</a-tag>
          </a-space>
        </div>
        <a-alert
          v-if="monitorEditorIssueRuleCount"
          class="editor-inline-alert"
          type="warning"
          show-icon
          :message="`当前有 ${monitorEditorIssueRuleCount} 条规则处于停用或待确认状态，请在提交前检查。`"
        />
        <a-table
          :data-source="monitorEditor.rules"
          :columns="monitorEditorRuleColumns"
          row-key="id"
          :pagination="{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]}行，共 ${total} 行`,
          }"
          size="small"
          bordered
          :row-class-name="monitorRuleRowClass"
          :scroll="{ x: 1480, y: 560 }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'ruleName'">
              <div class="stack-cell">
                <span>{{ record.ruleId || record.id }}</span>
                <strong>{{ record.ruleName }}</strong>
              </div>
            </template>
            <template v-else-if="column.key === 'generateMethod'">
              {{ generateMethodLabel(record.generateMethod) }}
            </template>
            <template v-else-if="column.key === 'ruleType'">
              {{ templateTypeLabel(record.ruleTemplateType) }}
            </template>
            <template v-else-if="column.key === 'showUseScope'">
              {{ record.showUseScope || '/' }}
            </template>
            <template v-else-if="column.key === 'isEnabled'">
              <span class="status-inline" :class="{ 'is-enabled': record.isEnabled ?? record.status === 'ENABLED' }">
                <CheckCircleFilled v-if="record.isEnabled ?? record.status === 'ENABLED'" />
                <MinusCircleFilled v-else />
                {{ record.isEnabled ?? record.status === 'ENABLED' ? '启用' : '停用' }}
              </span>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button size="small" @click="openMonitorRuleEditor(record, true)">查看</a-button>
                <a-button size="small" type="primary" :disabled="monitorEditorReadonly || monitorEditor.isCanNotEdit" @click="openMonitorRuleEditor(record)">修改</a-button>
                <a-popconfirm title="确认删除该规则吗？" @confirm="removeMonitorRule(index)">
                  <a-button size="small" danger :disabled="monitorEditorReadonly || monitorEditor.isCanNotEdit">删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </section>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>3</span> 运行设置</div>
        <div class="editor-inline-alert">
          <a-alert type="info" show-icon :message="monitorEditorConfigTip" />
        </div>
        <div class="form-grid form-grid--2">
          <a-form-item label="触发方式">
            <a-radio-group
              v-model:value="monitorEditor.triggerType"
              :disabled="monitorEditorReadonly"
              :options="[
                { label: '生产调度触发', value: 'SCHEDULED' },
                { label: '定时调度触发', value: 'CRON' },
              ]"
            />
          </a-form-item>
          <a-form-item label="关联节点数">
            <div class="plain-value">
              {{ monitorEditor.triggerType === 'SCHEDULED' ? `${monitorEditor.dsWorkFlows.length} 个节点` : '独立执行计划' }}
            </div>
          </a-form-item>
        </div>

        <template v-if="monitorEditor.triggerType === 'SCHEDULED'">
          <a-table :data-source="monitorEditor.dsWorkFlows" :columns="monitorScheduleColumns" row-key="workflowCode" :pagination="false" size="small" bordered>
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'projectCode'">
                <a-select
                  v-model:value="record.projectCode"
                  :disabled="monitorEditorReadonly"
                  :options="enumOptions.projects"
                  show-search
                  @change="(value) => handleProjectChange(index, String(value))"
                />
              </template>
              <template v-else-if="column.key === 'workflowCode'">
                <a-select
                  v-model:value="record.workflowCode"
                  :disabled="monitorEditorReadonly"
                  :options="record.workflowOptions || []"
                  show-search
                  @change="(value) => handleWorkflowChange(index, String(value))"
                />
              </template>
              <template v-else-if="column.key === 'dsWorkFlowSourceType'">
                <a-tag :color="record.dsWorkFlowSourceType === 'MANUAL' ? 'blue' : 'green'">
                  {{ record.dsWorkFlowSourceType === 'MANUAL' ? '手动添加' : '系统推荐' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button size="small" danger :disabled="monitorEditorReadonly" @click="removeScheduledNode(index)">删除</a-button>
              </template>
            </template>
          </a-table>
          <div class="detail-toolbar detail-toolbar--split">
            <a-space>
              <a-button :disabled="monitorEditorReadonly" @click="addManualNode">手动添加节点</a-button>
            </a-space>
            <span class="subtle-count">未关联调度节点的，不进行强规则阻断。</span>
          </div>
        </template>

        <template v-else>
          <div class="form-grid form-grid--2">
            <a-form-item label="执行频率">
              <a-radio-group
                v-model:value="monitorEditor.scheduleConfig.scheduleFrequency"
                :disabled="monitorEditorReadonly"
                :options="[
                  { label: '天级', value: 'DAY' },
                  { label: '小时级', value: 'HOUR' },
                ]"
              />
            </a-form-item>
            <a-form-item v-if="monitorEditor.scheduleConfig.scheduleFrequency === 'DAY'" label="执行时间">
              <a-input v-model:value="monitorEditor.scheduleConfig.expectedTime" :disabled="monitorEditorReadonly" placeholder="09:00:00" />
            </a-form-item>
          </div>
          <div v-if="monitorEditor.scheduleConfig.scheduleFrequency === 'HOUR'" class="form-grid form-grid--2">
            <a-form-item label="小时间隔">
              <a-select v-model:value="monitorEditor.scheduleConfig.hourInterval" :disabled="monitorEditorReadonly" :options="hourIntervalOptions" @change="refreshPreviewTimes" />
            </a-form-item>
            <a-form-item label="分钟偏移">
              <a-input v-model:value="monitorEditor.scheduleConfig.minuteOffset" :disabled="monitorEditorReadonly" @change="refreshPreviewTimes" />
            </a-form-item>
            <a-form-item label="执行时间预览" class="grid-full">
              <a-space wrap>
                <a-tag v-for="item in previewExecTimes" :key="item" color="blue">{{ item }}</a-tag>
              </a-space>
            </a-form-item>
          </div>
        </template>
      </section>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>4</span> 告警通知策略</div>
        <div class="detail-summary-strip editor-summary-strip">
          <div class="detail-summary-chip">
            <span>通知策略</span>
            <strong>{{ monitorEditor.notifyPolicyName || '未选择' }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>强规则阻断</span>
            <strong>{{ monitorEditor.dsWorkFlows.length ? '已接入' : '未接入' }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>执行计划</span>
            <strong>{{ monitorEditor.triggerType === 'CRON' ? '独立定时' : '依赖调度' }}</strong>
          </div>
        </div>
        <div class="form-grid form-grid--2">
          <a-form-item label="通知策略">
            <a-select v-model:value="monitorEditor.notifyPolicyId" :disabled="monitorEditorReadonly" :options="enumOptions.notifyPolicies" @change="handleNotifyPolicyChange" />
          </a-form-item>
          <a-form-item label="当前策略">
            <div class="plain-value">{{ monitorEditor.notifyPolicyName || '/' }}</div>
          </a-form-item>
        </div>
      </section>

      <div v-if="!monitorEditorReadonly" class="sticky-actions">
        <a-space>
          <a-button @click="backToRuleDetail">取消</a-button>
          <a-button type="primary" @click="saveMonitorEditor">提交</a-button>
        </a-space>
      </div>
    </section>

    <section v-else-if="pageMode === 'run-detail'" class="detail-page">
      <div class="detail-breadcrumb">
        <span>DQC-数据质量</span>
        <span>/</span>
        <span class="detail-breadcrumb__link" @click="backToList">质量运维</span>
        <span>/</span>
        <span>运行详情</span>
      </div>
      <div class="detail-page__header">
        <div>
          <a-button type="link" class="back-link" @click="backToList">返回运行记录</a-button>
          <h3>{{ runDetail?.record.ruleGroupName }}</h3>
          <p>{{ runDetail?.record.dbTableName }} · {{ runDetail?.record.dataRange || '全表' }}</p>
        </div>
        <a-space wrap>
          <a-tag :color="runStatusColor(runDetail?.record.runStatus)">{{ runStatusLabel(runDetail?.record.runStatus) }}</a-tag>
          <a-tag :color="alarmStatusColor(runDetail?.record.alarmStatus)">{{ alarmStatusLabel(runDetail?.record.alarmStatus) }}</a-tag>
          <a-tag>{{ monitorTriggerLabel(runDetail?.record.triggerType) }}</a-tag>
        </a-space>
      </div>

      <div class="detail-cards detail-cards--editor">
        <article class="detail-card"><span>规则通过数</span><strong>{{ runDetail?.record.rulePassCount ?? 0 }}</strong></article>
        <article class="detail-card"><span>规则总数</span><strong>{{ runDetail?.record.ruleTotalCount ?? 0 }}</strong></article>
        <article class="detail-card"><span>开始时间</span><strong>{{ formatDateTime(runDetail?.record.startExeTime) }}</strong></article>
        <article class="detail-card"><span>结束时间</span><strong>{{ formatDateTime(runDetail?.record.endExeTime) }}</strong></article>
      </div>

      <section class="panel">
        <div class="detail-tab-toolbar">
          <div>
            <h4>规则运行筛选</h4>
            <p>按规则名称、告警状态、规则范围、规则类型、运行状态和生成方式筛选当前运行详情。</p>
          </div>
        </div>
        <div class="filter-grid filter-grid--4">
          <a-input v-model:value="runDetailFilters.ruleName" allow-clear placeholder="规则名称" />
          <a-select v-model:value="runDetailFilters.alarmStatus" allow-clear placeholder="告警状态" :options="enumOptions.alarmStatuses" />
          <a-select v-model:value="runDetailFilters.ruleScope" allow-clear placeholder="规则范围" :options="runDetailRuleScopeOptions" />
          <a-select v-model:value="runDetailFilters.fieldsName" allow-clear placeholder="规则字段" :options="runDetailFieldOptions" :disabled="runDetailFilters.ruleScope !== 'FIELD'" />
          <a-select v-model:value="runDetailFilters.ruleTemplateType" allow-clear placeholder="规则类型" :options="enumOptions.ruleTemplateTypeOptions" />
          <a-select v-model:value="runDetailFilters.runStatus" allow-clear placeholder="运行状态" :options="enumOptions.runStatuses" />
          <a-select v-model:value="runDetailFilters.generateMethod" allow-clear placeholder="生成方式" :options="enumOptions.generateMethods" />
          <div class="filter-actions">
            <a-button @click="resetRunDetailFilters">重置</a-button>
            <a-button type="primary" @click="applyRunDetailFilters">查询</a-button>
          </div>
        </div>
      </section>

      <div class="run-detail">
        <aside class="run-detail__sider">
          <div
            v-for="item in filteredRunDetailRules"
            :key="item.id"
            :class="['run-rule-card', { 'is-active': activeRunRuleId === item.id }]"
            @click="activeRunRuleId = item.id"
          >
            <div class="run-rule-card__meta">
              <span>{{ item.ruleId }}</span>
              <a-tag :color="item.runStatus === 'SUCCESS' ? alarmStatusColor(item.alarmStatus) : runStatusColor(item.runStatus)">
                {{ item.runStatus === 'SUCCESS' ? alarmStatusLabel(item.alarmStatus) : runStatusLabel(item.runStatus) }}
              </a-tag>
            </div>
            <div class="run-rule-card__title">{{ item.ruleName }}</div>
            <div class="run-rule-card__desc">{{ ruleLevelLabel(item.ruleLevel) }} · {{ ruleScopeLabel(item.ruleScope, item.fieldsName) }}</div>
            <div class="run-rule-card__desc">{{ item.ruleTemplateName }}</div>
          </div>
          <a-empty v-if="!filteredRunDetailRules.length" description="暂无匹配规则" />
        </aside>
        <section class="panel run-detail__content">
          <template v-if="activeRunRule">
            <div class="panel__header">
              <div>
                <h3>{{ activeRunRule.ruleName }}</h3>
                <p>{{ activeRunRule.ruleTemplateName }} · {{ ruleScopeLabel(activeRunRule.ruleScope, activeRunRule.fieldsName) }}</p>
              </div>
              <a-space>
                <a-tag :color="runStatusColor(activeRunRule.runStatus)">{{ runStatusLabel(activeRunRule.runStatus) }}</a-tag>
                <a-tag :color="alarmStatusColor(activeRunRule.alarmStatus)">{{ alarmStatusLabel(activeRunRule.alarmStatus) }}</a-tag>
                <a-button size="small" @click="openRuleModal(activeRunRule as any, true)">规则详情</a-button>
              </a-space>
            </div>
            <div class="detail-cards">
              <article class="detail-card"><span>重要程度</span><strong>{{ ruleLevelLabel(activeRunRule.ruleLevel) }}</strong></article>
              <article class="detail-card"><span>生成方式</span><strong>{{ generateMethodLabel(activeRunRule.generateMethod) }}</strong></article>
              <article class="detail-card"><span>阈值</span><strong>{{ activeRunRule.threshold }}</strong></article>
              <article class="detail-card"><span>规则范围</span><strong>{{ ruleScopeLabel(activeRunRule.ruleScope, activeRunRule.fieldsName) }}</strong></article>
            </div>
            <section class="sub-panel">
              <div class="detail-summary-strip">
                <div class="detail-summary-chip">
                  <span>运行状态</span>
                  <strong>{{ runStatusLabel(activeRunRule.runStatus) }}</strong>
                </div>
                <div class="detail-summary-chip">
                  <span>告警状态</span>
                  <strong>{{ alarmStatusLabel(activeRunRule.alarmStatus) }}</strong>
                </div>
                <div class="detail-summary-chip">
                  <span>规则模板</span>
                  <strong>{{ activeRunRule.ruleTemplateName || '/' }}</strong>
                </div>
              </div>
            </section>
            <section class="sub-panel">
              <h4>规则信息</h4>
              <div class="run-info-grid">
                <div class="run-info-item">
                  <span>规则 ID</span>
                  <strong>{{ activeRunRule.ruleId || '/' }}</strong>
                </div>
                <div class="run-info-item">
                  <span>规则类型</span>
                  <strong>{{ templateTypeLabel((activeRunRule as any).ruleTemplateType) }}</strong>
                </div>
                <div class="run-info-item">
                  <span>规则范围</span>
                  <strong>{{ ruleScopeLabel(activeRunRule.ruleScope, activeRunRule.fieldsName) }}</strong>
                </div>
                <div class="run-info-item">
                  <span>生成方式</span>
                  <strong>{{ generateMethodLabel(activeRunRule.generateMethod) }}</strong>
                </div>
              </div>
            </section>
            <section class="sub-panel">
              <h4>执行 SQL</h4>
              <pre class="code-block">{{ activeRunRule.sqlText }}</pre>
            </section>
            <section class="sub-panel">
              <h4>校验状态</h4>
              <div class="run-info-grid">
                <div class="run-info-item">
                  <span>告警状态</span>
                  <strong>{{ alarmStatusLabel(activeRunRule.alarmStatus) }}</strong>
                </div>
                <div class="run-info-item">
                  <span>采样结果</span>
                  <strong>{{ activeRunRule.resultSample?.[0]?.actual_value ?? '/' }}</strong>
                </div>
                <div class="run-info-item">
                  <span>阈值</span>
                  <strong>{{ activeRunRule.resultSample?.[0]?.threshold ?? activeRunRule.threshold }}</strong>
                </div>
                <div class="run-info-item">
                  <span>校验结论</span>
                  <strong>{{ activeRunRule.resultSample?.[0]?.result || '/' }}</strong>
                </div>
              </div>
            </section>
            <section class="sub-panel">
              <h4>结果样本</h4>
              <a-table :data-source="activeRunRule.resultSample || []" :pagination="false" size="small" bordered>
                <a-table-column title="字段" data-index="field_name" key="field_name" />
                <a-table-column title="实际值" data-index="actual_value" key="actual_value" />
                <a-table-column title="阈值" data-index="threshold" key="threshold" />
                <a-table-column title="结果" data-index="result" key="result" />
              </a-table>
            </section>
            <section v-if="activeRunRule.errorMessage" class="sub-panel">
              <h4>错误信息</h4>
              <a-alert type="error" show-icon :message="activeRunRule.errorMessage" />
            </section>
          </template>
        </section>
      </div>
    </section>

    <section v-else-if="pageMode === 'diff-editor'" class="detail-page">
      <div class="detail-page__header">
        <div>
          <a-button type="link" class="back-link" @click="backToList">返回数据对比</a-button>
          <h3>{{ diffEditorMode === 'view' ? '查看对比任务' : diffEditorMode === 'edit' ? '编辑对比任务' : diffEditorMode === 'copy' ? '复制对比任务' : '新建对比任务' }}</h3>
          <p>按“配置对比表信息 / 主键与对比方式”两段完成对比任务设置。</p>
        </div>
      </div>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>1</span> 配置对比表信息</div>
        <div class="form-grid form-grid--2">
          <a-form-item label="任务名称">
            <a-input v-model:value="diffEditing.taskName" :disabled="diffEditorMode === 'view'" />
          </a-form-item>
          <a-form-item label="对比模式">
            <a-radio-group v-model:value="diffEditing.compareMode" :disabled="diffEditorMode === 'view'" :options="enumOptions.compareModes" />
          </a-form-item>
        </div>
        <div class="dual-panel">
          <section class="compare-card">
            <h4>A表</h4>
            <div class="form-grid">
              <a-form-item label="数据源">
                <a-select v-model:value="diffEditing.sourceConfig.dataSourceType" :disabled="diffEditorMode === 'view'" :options="enumOptions.datasourceTypes" />
              </a-form-item>
              <a-form-item label="库名">
                <a-input v-model:value="diffEditing.sourceConfig.databaseName" :disabled="diffEditorMode === 'view'" />
              </a-form-item>
              <a-form-item label="表名">
                <a-input v-model:value="diffEditing.sourceConfig.tableName" :disabled="diffEditorMode === 'view'" />
              </a-form-item>
              <a-form-item label="对比范围">
                <a-radio-group v-model:value="diffEditing.sourceConfig.compareRangeType" :disabled="diffEditorMode === 'view'" :options="enumOptions.dataRangeOptions" />
              </a-form-item>
              <a-form-item label="分区">
                <a-input v-model:value="diffEditing.sourceConfig.partitionInfo" :disabled="diffEditorMode === 'view'" />
              </a-form-item>
              <a-form-item label="WHERE筛选">
                <a-textarea v-model:value="diffEditing.sourceConfig.whereCondition" :disabled="diffEditorMode === 'view'" :rows="3" />
              </a-form-item>
              <a-form-item v-if="diffEditing.compareMode === 'SQL'" label="SQL">
                <a-textarea v-model:value="diffEditing.sourceConfig.sqlText" :disabled="diffEditorMode === 'view'" :rows="6" />
              </a-form-item>
            </div>
          </section>
          <section class="compare-card">
            <h4>B表</h4>
            <div class="form-grid">
              <a-form-item label="数据源">
                <a-select v-model:value="diffEditing.targetConfig.dataSourceType" :disabled="diffEditorMode === 'view'" :options="enumOptions.datasourceTypes" />
              </a-form-item>
              <a-form-item label="库名">
                <a-input v-model:value="diffEditing.targetConfig.databaseName" :disabled="diffEditorMode === 'view'" />
              </a-form-item>
              <a-form-item label="表名">
                <a-input v-model:value="diffEditing.targetConfig.tableName" :disabled="diffEditorMode === 'view'" />
              </a-form-item>
              <a-form-item label="对比范围">
                <a-radio-group v-model:value="diffEditing.targetConfig.compareRangeType" :disabled="diffEditorMode === 'view'" :options="enumOptions.dataRangeOptions" />
              </a-form-item>
              <a-form-item label="分区">
                <a-input v-model:value="diffEditing.targetConfig.partitionInfo" :disabled="diffEditorMode === 'view'" />
              </a-form-item>
              <a-form-item label="WHERE筛选">
                <a-textarea v-model:value="diffEditing.targetConfig.whereCondition" :disabled="diffEditorMode === 'view'" :rows="3" />
              </a-form-item>
              <a-form-item v-if="diffEditing.compareMode === 'SQL'" label="SQL">
                <a-textarea v-model:value="diffEditing.targetConfig.sqlText" :disabled="diffEditorMode === 'view'" :rows="6" />
              </a-form-item>
            </div>
          </section>
        </div>
      </section>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>2</span> 配置主键与对比方式</div>
        <div class="form-grid form-grid--2">
          <a-form-item label="主键字段">
            <a-select v-model:value="diffEditing.primaryKeys" mode="tags" :disabled="diffEditorMode === 'view'" />
          </a-form-item>
          <a-form-item label="对比方式">
            <a-radio-group v-model:value="diffEditing.compareMethod" :disabled="diffEditorMode === 'view'" :options="enumOptions.compareMethods" />
          </a-form-item>
        </div>
      </section>

      <div v-if="diffEditorMode !== 'view'" class="sticky-actions">
        <a-space>
          <a-button @click="backToList">取消</a-button>
          <a-button type="primary" @click="saveDiffEditor">保存任务</a-button>
        </a-space>
      </div>
    </section>

    <section v-else-if="pageMode === 'diff-report'" class="detail-page">
      <div class="detail-breadcrumb">
        <span>DQC-数据质量</span>
        <span>/</span>
        <span class="detail-breadcrumb__link" @click="backToList">数据对比</span>
        <span>/</span>
        <span>对比报告</span>
      </div>
      <div class="detail-page__header">
        <div>
          <a-button type="link" class="back-link" @click="backToList">返回数据对比</a-button>
          <h3>对比报告</h3>
          <p>A表【{{ diffReport?.summary.sourceTable }}】 VS B表【{{ diffReport?.summary.targetTable }}】</p>
        </div>
      </div>
      <section class="panel">
        <div class="detail-cards">
          <article class="detail-card"><span>创建人</span><strong>{{ diffReport?.summary.creator || '/' }}</strong></article>
          <article class="detail-card"><span>对比模式</span><strong>{{ diffReport?.summary.compareMode === 'SQL' ? 'SQL模式' : '表模式' }}</strong></article>
          <article class="detail-card"><span>对比方式</span><strong>{{ diffReport?.summary.compareMethod === 'ROW_BY_ROW' ? '逐行对比' : '目标数据包含来源数据' }}</strong></article>
          <article class="detail-card"><span>创建时间</span><strong>{{ diffReport?.summary.createdAt || '/' }}</strong></article>
          <article class="detail-card"><span>对比耗时</span><strong>{{ formatDuration(diffReport?.summary.duration) }}</strong></article>
          <article class="detail-card"><span>主键匹配行数</span><strong>{{ formatNumber(diffReport?.summary.primaryKeyMatchCount) }}</strong></article>
        </div>
        <div class="run-info-grid">
          <div class="run-info-item">
            <span>A表过滤条件</span>
            <strong>{{ diffReport?.summary.sourceWhereCondition || '无' }}</strong>
          </div>
          <div class="run-info-item">
            <span>B表过滤条件</span>
            <strong>{{ diffReport?.summary.targetWhereCondition || '无' }}</strong>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>对比总体概况</h3>
            <p>展示来源与目标的数据规模、匹配率和整体差异百分比。</p>
          </div>
        </div>
        <div class="detail-summary-strip diff-overview-strip">
          <div class="detail-summary-chip">
            <span>A表行数</span>
            <strong>{{ formatNumber(diffReport?.summary.sourceRowCount) }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>B表行数</span>
            <strong>{{ formatNumber(diffReport?.summary.targetRowCount) }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>行数差值百分比(基于A表)</span>
            <strong>{{ formatPercentValue(diffReport?.summary.rowDiffPercent) }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>A表匹配占比</span>
            <strong>{{ formatPercentValue(diffReport?.summary.sourceMatchPercent) }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>B表匹配占比</span>
            <strong>{{ formatPercentValue(diffReport?.summary.targetMatchPercent) }}</strong>
          </div>
          <div class="detail-summary-chip">
            <span>明细条数</span>
            <strong>{{ filteredDiffReportDetail.length }}</strong>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>对比明细</h3>
            <p>展示报告概况、差异明细和执行日志，便于核对对比结果。</p>
          </div>
        </div>
        <div class="detail-inline-filters">
          <a-select
            v-model:value="diffReportCompareResult"
            allow-clear
            placeholder="对比结果"
            :options="enumOptions.compareResults"
          />
          <div class="filter-actions detail-inline-filters__actions">
            <a-button @click="diffReportCompareResult = undefined">重置</a-button>
          </div>
        </div>
        <a-tag color="orange" style="margin-bottom: 12px">全量数据对比，不一致的数据抽样 1000 条进行 diff。</a-tag>
        <a-table :data-source="filteredDiffReportDetail" :columns="diffReportColumns" row-key="index" :pagination="false" :scroll="{ x: 1100, y: 420 }" size="small" bordered>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'diffCount'">
              <span>不等行数：</span>
              <span style="color: #1677ff">{{ record.diffCount }}</span>
            </template>
            <template v-else-if="column.key === 'diffRatio'">
              {{ formatRatio(record.diffRatio) }}
            </template>
            <template v-else-if="column.key === 'compareResult'">
              <a-tag :color="compareResultColor(record.compareResult)">{{ compareResultLabel(record.compareResult) }}</a-tag>
            </template>
          </template>
        </a-table>
      </section>
      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>执行日志</h3>
            <p>保持日志入口与时间线结构，便于排查运行过程。</p>
          </div>
        </div>
        <a-timeline>
          <a-timeline-item v-for="item in diffReport?.logs || []" :key="item.id">
            <strong>{{ item.level }}</strong> {{ item.time }} - {{ item.content }}
          </a-timeline-item>
        </a-timeline>
      </section>
    </section>

    <section v-else-if="pageMode === 'test-editor'" class="detail-page">
      <div class="detail-page__header">
        <div>
          <a-button type="link" class="back-link" @click="backToList">返回数据测试</a-button>
          <h3>{{ testEditorMode === 'view' ? '查看测试任务' : testEditorMode === 'edit' ? '编辑测试任务' : testEditorMode === 'copy' ? '复制测试任务' : '创建测试任务' }}</h3>
          <p>按“目标数据 / 字段打标 / 规则配置”三段组织测试任务。</p>
        </div>
      </div>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>1</span> 目标数据</div>
        <div class="form-grid form-grid--2">
          <a-form-item label="数据源">
            <a-select v-model:value="testEditing.datasourceType" :disabled="testEditorMode === 'view'" :options="enumOptions.datasourceTypes" />
          </a-form-item>
          <a-form-item label="所属环境">
            <a-radio-group v-model:value="testEditing.environmentType" :disabled="testEditorMode === 'view'" :options="enumOptions.envOptions" />
          </a-form-item>
          <a-form-item label="数据库">
            <a-input v-model:value="testEditing.databaseName" :disabled="testEditorMode === 'view'" />
          </a-form-item>
          <a-form-item label="数据表">
            <a-input v-model:value="testEditing.tableName" :disabled="testEditorMode === 'view'" />
          </a-form-item>
          <a-form-item label="数据范围">
            <a-radio-group v-model:value="testEditing.dataRangeType" :disabled="testEditorMode === 'view'" :options="enumOptions.dataRangeOptions" />
          </a-form-item>
          <a-form-item label="WHERE筛选">
            <a-textarea v-model:value="testEditing.whereCondition" :disabled="testEditorMode === 'view'" :rows="3" />
          </a-form-item>
        </div>
      </section>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>2</span> 字段打标</div>
        <a-table :data-source="testEditing.fieldRecords" :columns="testFieldColumns" row-key="fieldName" :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'isPrimaryKey'">
              <a-checkbox v-model:checked="record.isPrimaryKey" :disabled="testEditorMode === 'view'" />
            </template>
            <template v-else-if="column.key === 'tagType'">
              <a-select v-model:value="record.tagType" :disabled="testEditorMode === 'view'" :options="enumOptions.tagTypes" />
            </template>
          </template>
        </a-table>
      </section>

      <section class="panel step-panel">
        <div class="step-panel__title"><span>3</span> 规则配置</div>
        <a-table :data-source="testEditing.ruleRecords" :columns="testRuleColumns" row-key="id" :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'expectedResult'">
              <a-select
                v-model:value="record.expectedResult"
                :disabled="testEditorMode === 'view'"
                :options="[
                  { label: '符合预期', value: 'MATCH' },
                  { label: '不符合预期', value: 'NOT_MATCH' },
                ]"
              />
            </template>
          </template>
        </a-table>
      </section>

      <div v-if="testEditorMode !== 'view'" class="sticky-actions">
        <a-space>
          <a-button @click="backToList">取消</a-button>
          <a-button type="primary" @click="saveTestEditor">保存任务</a-button>
        </a-space>
      </div>
    </section>

    <section v-else-if="pageMode === 'test-report'" class="detail-page">
      <div class="detail-breadcrumb">
        <span>DQC-数据质量</span>
        <span>/</span>
        <span class="detail-breadcrumb__link" @click="backToList">数据测试</span>
        <span>/</span>
        <span>测试报告</span>
      </div>
      <div class="detail-page__header">
        <div>
          <a-button type="link" class="back-link" @click="backToList">返回数据测试</a-button>
          <h3>测试报告</h3>
          <p>{{ testReport?.overview.databaseName }}.{{ testReport?.overview.tableName }}</p>
        </div>
      </div>

      <section class="panel">
        <div class="detail-cards">
          <article class="detail-card"><span>实例ID</span><strong>{{ testReport?.overview.instanceId }}</strong></article>
          <article class="detail-card"><span>测试完成时间</span><strong>{{ formatDateTime(testReport?.overview.updateTime) }}</strong></article>
          <article class="detail-card"><span>对比耗时</span><strong>{{ testReport?.overview.taskDuration }} 秒</strong></article>
          <article class="detail-card"><span>创建人</span><strong>{{ testReport?.overview.executorName }}</strong></article>
          <article class="detail-card"><span>表行数</span><strong>{{ testReport?.overview.rowCount }}</strong></article>
          <article class="detail-card"><span>字段个数</span><strong>{{ testReport?.overview.fieldCount }}</strong></article>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>探查明细</h3>
            <p>展示字段画像、数值统计、空值统计等探查信息。</p>
          </div>
        </div>
        <div class="detail-inline-filters">
          <a-select v-model:value="testReportProbeField" allow-clear show-search placeholder="字段名" :options="testReportFieldOptions" />
          <div class="filter-actions detail-inline-filters__actions">
            <a-button @click="testReportProbeField = undefined">重置</a-button>
          </div>
        </div>
        <a-table :data-source="filteredTestProbeRecords" :columns="testProbeColumns" row-key="key" :pagination="false" :scroll="{ x: 1200 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'profile'">
              <div class="probe-cell">
                <div v-if="record.profile.nullStat">Null数量：{{ record.profile.nullStat.count }} / 占比：{{ record.profile.nullStat.ratio }}</div>
                <div v-if="record.profile.emptyStat">空串数量：{{ record.profile.emptyStat.count }} / 占比：{{ record.profile.emptyStat.ratio }}</div>
                <div v-if="record.profile.enumStat">唯一值数量：{{ record.profile.enumStat.uniqueCount }}</div>
                <div v-if="record.profile.numericStat">最大值：{{ record.profile.numericStat.max }} / 最小值：{{ record.profile.numericStat.min }} / 平均值：{{ record.profile.numericStat.avg }}</div>
                <div v-if="record.profile.zeroStat">0值数量：{{ record.profile.zeroStat.count }} / 占比：{{ record.profile.zeroStat.ratio }}</div>
              </div>
            </template>
          </template>
        </a-table>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>规则明细</h3>
            <p>展示规则阈值、实际值和校验结果状态。</p>
          </div>
        </div>
        <div class="filter-grid filter-grid--3 detail-filter-grid">
          <a-select v-model:value="testReportRuleField" allow-clear show-search placeholder="字段" :options="testReportRuleFieldOptions" />
          <a-select
            v-model:value="testReportRuleResult"
            allow-clear
            placeholder="测试结果"
            :options="[
              { label: '正常', value: 'PASS' },
              { label: '异常', value: 'FAIL' },
            ]"
          />
          <div class="filter-actions">
            <a-button @click="testReportRuleField = undefined; testReportRuleResult = undefined">重置</a-button>
          </div>
        </div>
        <a-table :data-source="filteredTestRuleRecords" :columns="testRuleReportColumns" row-key="id" :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'result'">
              <a-tag :color="record.result === 'PASS' ? 'green' : 'red'">{{ record.result === 'PASS' ? '正常' : '异常' }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" size="small" @click="openSqlPreview(record.sqlPreview)">SQL预览</a-button>
            </template>
          </template>
        </a-table>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <h3>反馈收集</h3>
            <p>保存对本次测试结果的结论和备注，和实例状态一起保留在当前页面。</p>
          </div>
        </div>
        <div class="form-grid form-grid--2">
          <a-form-item label="结论">
            <a-radio-group
              v-model:value="testReportFeedback.feedbackStatus"
              :options="[
                { label: '符合预期', value: 'EXPECT_MATCH' },
                { label: '不符合预期', value: 'EXPECT_NOT_MATCH' },
              ]"
            />
          </a-form-item>
          <a-form-item label="当前反馈">
            <div class="plain-value">
              {{ testReport?.feedbackStatus === 'EXPECT_MATCH' ? '符合预期' : testReport?.feedbackStatus === 'EXPECT_NOT_MATCH' ? '不符合预期' : '未反馈' }}
            </div>
          </a-form-item>
          <a-form-item label="备注" class="grid-full">
            <a-textarea
              v-model:value="testReportFeedback.feedbackText"
              :rows="4"
              placeholder="请描述测试结果是否符合预期，或记录发现的数据问题。"
            />
          </a-form-item>
        </div>
        <div class="detail-toolbar">
          <a-button type="primary" @click="saveTestReportFeedback">保存反馈</a-button>
        </div>
      </section>
    </section>

    <a-modal v-model:open="templateModalOpen" :title="templateEditing.id ? '编辑规则模板' : '新建规则模板'" width="720px" @ok="saveTemplate">
      <div class="form-grid form-grid--2">
        <a-form-item label="规则类型"><a-select v-model:value="templateEditing.type" :options="enumOptions.templateTypes" /></a-form-item>
        <a-form-item label="规则范围"><a-select v-model:value="templateEditing.scope" :options="enumOptions.templateScopes" /></a-form-item>
        <a-form-item label="模板名称"><a-input v-model:value="templateEditing.name" /></a-form-item>
        <a-form-item label="负责人"><a-select v-model:value="templateEditing.owner" :options="enumOptions.owners" /></a-form-item>
        <a-form-item label="描述" class="grid-full"><a-textarea v-model:value="templateEditing.description" :rows="4" /></a-form-item>
      </div>
    </a-modal>

    <a-modal
      v-model:open="ruleModalOpen"
      :title="ruleModalReadonly ? '查看规则' : ruleEditing.id ? '编辑规则' : '新建规则'"
      width="900px"
      @ok="saveRule"
    >
      <div class="form-grid form-grid--2">
        <a-form-item label="规则名称"><a-input v-model:value="ruleEditing.ruleName" :disabled="ruleModalReadonly" /></a-form-item>
        <a-form-item label="规则模板"><a-input v-model:value="ruleEditing.ruleTemplateName" disabled /></a-form-item>
        <a-form-item label="规则类型">
          <a-select v-model:value="ruleEditing.ruleTemplateType" :disabled="ruleModalReadonly || ruleEditing.ruleScope !== 'CUSTOM_SQL'" :options="enumOptions.ruleTemplateTypeOptions" />
        </a-form-item>
        <a-form-item label="规则范围">
          <template v-if="ruleEditing.ruleScope === 'FIELD' && !ruleModalReadonly">
            <a-select v-model:value="ruleEditing.fieldsName" :options="monitorFieldOptions" show-search />
          </template>
          <template v-else>
            <a-space wrap>
              <a-tag>{{ ruleEditing.ruleScope === 'FIELD' ? `${ruleEditing.fieldsName || '-' }(string)` : ruleEditing.ruleScope === 'CUSTOM_SQL' ? 'SQL 结果列(metric_value)' : '整表' }}</a-tag>
            </a-space>
          </template>
        </a-form-item>
        <a-form-item label="过滤条件" class="grid-full">
          <a-textarea v-model:value="ruleEditing.filterConditionText" :disabled="ruleModalReadonly" :rows="3" placeholder="例如 dt = 2026-04-22 and region = CN" />
        </a-form-item>
        <a-form-item v-if="ruleEditing.ruleScope === 'CUSTOM_SQL'" label="SQL" class="grid-full">
          <a-textarea v-model:value="ruleEditing.customSql" :disabled="ruleModalReadonly" :rows="8" />
        </a-form-item>
        <a-form-item label="监控阈值" class="grid-full">
          <div class="threshold-editor">
            <span class="threshold-editor__label">异常阈值</span>
            <a-select v-model:value="ruleEditing.thresholdOperator" :disabled="ruleModalReadonly" :options="conditionOperatorOptions" style="width: 140px" />
            <a-input v-model:value="ruleEditing.thresholdValue" :disabled="ruleModalReadonly" style="width: 220px" />
            <a-tag v-if="ruleEditing.thresholdType === 'PERCENTAGE'">%</a-tag>
          </div>
        </a-form-item>
        <a-form-item label="启用状态">
          <a-switch v-model:checked="ruleEditing.isEnabled" :disabled="ruleModalReadonly" />
        </a-form-item>
        <a-form-item label="重要程度">
          <a-radio-group v-model:value="ruleEditing.ruleLevel" :disabled="ruleModalReadonly" :options="enumOptions.levels" />
        </a-form-item>
        <a-form-item label="描述" class="grid-full">
          <a-textarea v-model:value="ruleEditing.description" :disabled="ruleModalReadonly" :rows="4" />
        </a-form-item>
      </div>
    </a-modal>

    <a-modal v-model:open="runTestModalOpen" title="测试运行" width="520px" :footer="null" @cancel="closeRunTestModal">
      <div class="run-test-modal">
        <p>质量监控：{{ activeRunTestGroup?.ruleGroupName || activeRunTestGroup?.name || '/' }}</p>
        <p>数据范围：{{ activeRunTestGroup?.dataRange || '全表' }}</p>
        <p>已启用规则数：{{ activeRunTestGroup?.enabledRuleCnt || '/' }}</p>
        <div class="run-test-modal__actions">
          <a-button type="primary" :disabled="runTestSubmitting || runTestSuccess" @click="confirmRunTest">测试运行</a-button>
        </div>
        <div v-if="runTestSuccess" class="run-test-modal__footer">
          <CheckCircleFilled />
          <span>启动执行</span>
          <a-button type="link" @click="openLatestRunRecord(activeRunTestGroup)">查看详情</a-button>
        </div>
      </div>
    </a-modal>

    <AiRuleDrawer ref="aiRuleDrawerRef" @accept="appendGeneratedRules" />
    <TableRuleDrawer ref="tableRuleDrawerRef" @accept="appendGeneratedRules" />
    <FieldRuleDrawer ref="fieldRuleDrawerRef" @accept="appendGeneratedRules" />
    <SqlRuleDrawer ref="sqlRuleDrawerRef" @accept="appendGeneratedRules" />

    <a-drawer v-model:open="logDrawerOpen" :title="logDrawerTitle" width="620">
      <a-timeline>
        <a-timeline-item v-for="item in currentLogs" :key="item.id">
          <strong>{{ item.level }}</strong> {{ item.time }} - {{ item.content }}
        </a-timeline-item>
      </a-timeline>
    </a-drawer>

    <a-drawer v-model:open="instanceDetailOpen" title="运行实例详情" width="520">
      <template v-if="currentInstance">
        <div class="detail-cards">
          <article class="detail-card"><span>实例ID</span><strong>{{ currentInstance.instanceId }}</strong></article>
          <article class="detail-card"><span>执行状态</span><strong>{{ testInstanceStatusLabel(currentInstance.dataTestRunStatus) }}</strong></article>
          <article class="detail-card"><span>执行人</span><strong>{{ currentInstance.executorName }}</strong></article>
          <article class="detail-card"><span>执行时间</span><strong>{{ formatDateTime(currentInstance.runTime) }}</strong></article>
        </div>
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="测试任务ID">{{ currentInstance.taskId }}</a-descriptions-item>
          <a-descriptions-item label="执行账号">{{ currentInstance.executor }}</a-descriptions-item>
          <a-descriptions-item label="反馈结论">{{ feedbackLabel(currentInstance.feedbackStatus) }}</a-descriptions-item>
          <a-descriptions-item label="运行说明">
            {{
              currentInstance.dataTestRunStatus === 'SUCCESS'
                ? '当前实例已完成测试运行，可以继续查看测试报告、探查明细和规则明细。'
                : currentInstance.dataTestRunStatus === 'RUNNING'
                  ? '当前实例仍在执行中，请稍后刷新查看最新状态。'
                  : currentInstance.dataTestRunStatus === 'FAILED'
                    ? '当前实例执行失败，建议优先查看日志定位异常。'
                    : '当前实例尚未完成执行。'
            }}
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>

    <a-modal v-model:open="shareModalOpen" title="分享测试报告" @ok="shareModalOpen = false">
      <a-form layout="vertical">
        <a-form-item label="分享对象">
          <a-select v-model:value="shareTargets" mode="multiple" :options="enumOptions.owners" />
        </a-form-item>
        <a-form-item label="附言">
          <a-textarea v-model:value="shareMessage" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer v-model:open="sqlPreviewOpen" title="SQL预览" width="760">
      <pre class="code-block">{{ currentSqlPreview }}</pre>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { CheckCircleFilled, ClusterOutlined, DatabaseOutlined, LeftOutlined, MinusCircleFilled, PlusOutlined, RightOutlined } from '@ant-design/icons-vue';
import DqcApi, {
  type DqcTemplateItem,
  type DqcRuleConfigItem,
  type DqcRuleDetailItem,
  type DqcRuleMonitorItem,
  type DqcRunRecordItem,
  type DqcRunRuleRecordItem,
  type DqcDiffItem,
  type DqcDiffConfig,
  type DqcTestTaskItem,
  type DqcTestTaskDetail,
  type DqcTestInstanceItem,
  type DqcDiffLogItem,
  type DqcRuleTreeNode,
  type DqcRuleFieldOption,
  type DqcMonitorEditor,
  type DqcScheduleNode,
} from '@/resources/dqc';
import { safeClone } from '@/utils/safe-clone';
import AiRuleDrawer from '@/pages/dqc/components/AiRuleDrawer.vue';
import TableRuleDrawer from '@/pages/dqc/components/TableRuleDrawer.vue';
import FieldRuleDrawer from '@/pages/dqc/components/FieldRuleDrawer.vue';
import SqlRuleDrawer from '@/pages/dqc/components/SqlRuleDrawer.vue';

const sections = [
  { key: 'template', label: '规则模板库', desc: '模板定义', longDesc: '维护规则类型、规则范围和模板描述。', tableDesc: '支持查看规则类型、规则范围、关联规则数和描述。', createLabel: '新建规则模板' },
  { key: 'rule', label: '规则配置', desc: '按表配置', longDesc: '按数据表进入质量监控和规则明细配置。', tableDesc: '按数据表展示负责人、监控数和规则数，支持进入表质量详情。', createLabel: '新建监控' },
  { key: 'run', label: '质量运维', desc: '运行记录', longDesc: '查看运行记录、运行详情和规则执行结果。', tableDesc: '包含告警状态、运行状态、触发方式与运行详情。', createLabel: '' },
  { key: 'diff', label: '数据对比', desc: '对比任务', longDesc: '查看数据对比任务、对比报告和执行日志。', tableDesc: '可查看报告、编辑、复制、日志与删除。', createLabel: '新建对比' },
  { key: 'test', label: '数据测试', desc: '测试任务', longDesc: '查看测试任务、运行实例和测试报告。', tableDesc: '支持展开查看实例，并继续进入报告和日志。', createLabel: '创建测试任务' },
] as const;

type SectionKey = (typeof sections)[number]['key'];
type PageMode = 'list' | 'rule-detail' | 'rule-monitor-editor' | 'run-detail' | 'diff-editor' | 'diff-report' | 'test-editor' | 'test-report';

const activeSection = ref<SectionKey>('template');
const pageMode = ref<PageMode>('list');
const loading = ref(false);

const summary = reactive({
  templateCount: 0,
  ruleCount: 0,
  alertCount: 0,
  successRate: 0,
});
const enumOptions = reactive<Record<string, Array<{ label: string; value: string }>>>({
  templateTypes: [],
  templateScopes: [],
  owners: [],
  triggerTypes: [],
  runStatuses: [],
  alarmStatuses: [],
  compareModes: [],
  compareMethods: [],
  diffStatuses: [],
  datasourceTypes: [],
  envOptions: [],
  dataRangeOptions: [],
  tagTypes: [],
  levels: [],
});

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
});

const templateFilters = reactive({ type: undefined as string | undefined, scope: undefined as string | undefined });
const ruleFilters = reactive({
  tableName: '',
  ownerUser: undefined as string | undefined,
  notHasRule: false,
  isSelf: false,
  dbSourceType: undefined as string | undefined,
  dataSourceId: undefined as string | undefined,
  databaseName: undefined as string | undefined,
});
const runFilters = reactive({ tableName: '', ruleGroupName: '', triggerType: undefined as string | undefined, runStatus: undefined as string | undefined, alarmStatus: undefined as string | undefined, isSelf: false });
const diffFilters = reactive({ taskId: '', taskName: '', compareMode: undefined as string | undefined, sourceTableName: '', targetTableName: '', taskStatus: undefined as string | undefined, creator: undefined as string | undefined, isSelf: false });
const testFilters = reactive({ taskName: '', databaseName: '', tableName: '', createUser: undefined as string | undefined, isSelf: false });

const templateRecords = ref<DqcTemplateItem[]>([]);
const ruleConfigRecords = ref<DqcRuleConfigItem[]>([]);
const runRecords = ref<DqcRunRecordItem[]>([]);
const diffRecords = ref<DqcDiffItem[]>([]);
const testRecords = ref<DqcTestTaskItem[]>([]);

const ruleDetail = ref<{ tableInfo: DqcRuleConfigItem; monitorRecords: any[]; ruleRecords: DqcRuleDetailItem[] } | null>(null);
const ruleDetailTab = ref('monitor');
const activeRunTestGroup = ref<any | null>(null);
const ruleTreeData = ref<DqcRuleTreeNode[]>([]);
const selectedRuleTreeKeys = ref<string[]>([]);
const ruleTreeCollapsed = ref(false);
const ruleTableSuggestions = ref<Array<{ label: string; value: string; tableId: string }>>([]);
const ruleContext = reactive({
  dbSourceType: '',
  dataSourceId: '',
  dataSourceName: '',
  databaseName: '',
});
const monitorFilters = reactive({ ruleGroupName: '' });
const ruleDetailFilters = reactive({
  ruleGroupName: '',
  ruleId: undefined as string | undefined,
  ruleName: '',
  ruleTemplateType: undefined as string | undefined,
  ruleTemplateName: undefined as string | undefined,
  ruleTemplateScope: undefined as string | undefined,
  ruleLevel: undefined as string | undefined,
  isEnabled: undefined as boolean | undefined,
  generateMethod: undefined as string | undefined,
});
const monitorEditorMode = ref<'create' | 'edit' | 'view' | 'copy'>('create');
const monitorEditor = reactive<any>({
  tableId: '',
  tableNameDisplay: '',
  partitionType: 'PARTITION',
  name: '',
  description: '',
  dataRangeType: 'FULL',
  filterConditionText: '',
  triggerType: 'SCHEDULED',
  scheduleConfig: {
    scheduleFrequency: 'DAY',
    expectedTime: '09:00:00',
    hourInterval: 1,
    minuteOffset: 0,
  },
  notifyPolicyId: '',
  notifyPolicyName: '',
  dsWorkFlows: [] as Array<DqcScheduleNode & { workflowOptions?: Array<{ label: string; value: string; projectCode: string; projectName: string }> }>,
  rules: [] as DqcRuleDetailItem[],
  isCanNotEdit: false,
});
const monitorFieldOptions = ref<Array<{ label: string; value: string }>>([]);
const previewExecTimes = ref<string[]>([]);
const aiRuleDrawerRef = ref<InstanceType<typeof AiRuleDrawer>>();
const tableRuleDrawerRef = ref<InstanceType<typeof TableRuleDrawer>>();
const fieldRuleDrawerRef = ref<InstanceType<typeof FieldRuleDrawer>>();
const sqlRuleDrawerRef = ref<InstanceType<typeof SqlRuleDrawer>>();

const runDetail = ref<{ record: DqcRunRecordItem; rules: DqcRunRuleRecordItem[] } | null>(null);
const activeRunRuleId = ref<string>('');
const runDetailFilters = reactive({
  ruleName: '',
  alarmStatus: undefined as string | undefined,
  ruleScope: undefined as string | undefined,
  fieldsName: undefined as string | undefined,
  ruleTemplateType: undefined as string | undefined,
  runStatus: undefined as string | undefined,
  generateMethod: undefined as string | undefined,
});

const diffEditing = reactive<any>({ sourceConfig: {}, targetConfig: {}, primaryKeys: [] });
const diffEditorMode = ref<'create' | 'edit' | 'view' | 'copy'>('create');
const diffReport = ref<any | null>(null);
const diffReportCompareResult = ref<string | undefined>(undefined);

const testEditing = reactive<any>({ fieldRecords: [], ruleRecords: [] });
const testEditorMode = ref<'create' | 'edit' | 'view' | 'copy'>('create');
const testReport = ref<any | null>(null);
const activeTestReportInstanceId = ref('');
const testReportProbeField = ref<string | undefined>(undefined);
const testReportRuleField = ref<string | undefined>(undefined);
const testReportRuleResult = ref<string | undefined>(undefined);
const testReportFeedback = reactive({
  feedbackStatus: 'EXPECT_MATCH' as 'EXPECT_MATCH' | 'EXPECT_NOT_MATCH',
  feedbackText: '',
});
const sqlPreviewOpen = ref(false);
const currentSqlPreview = ref('');
const testInstanceMap = reactive<Record<string, DqcTestInstanceItem[]>>({});
const expandedTestRowKeys = ref<string[]>([]);

const templateModalOpen = ref(false);
const ruleModalOpen = ref(false);
const ruleModalReadonly = ref(false);
const ruleEditingContext = ref<'detail' | 'monitor'>('detail');
const runTestModalOpen = ref(false);
const runTestSubmitting = ref(false);
const runTestSuccess = ref(false);
const logDrawerOpen = ref(false);
const logDrawerTitle = ref('日志');
const currentLogs = ref<DqcDiffLogItem[]>([]);
const instanceDetailOpen = ref(false);
const currentInstance = ref<DqcTestInstanceItem | null>(null);
const shareModalOpen = ref(false);
const shareTargets = ref<string[]>([]);
const shareMessage = ref('请查收这份 DQC 测试报告。');

const templateEditing = reactive<Partial<DqcTemplateItem>>({});
const ruleEditing = reactive<Partial<DqcRuleDetailItem>>({});

const currentSection = computed(() => sections.find((item) => item.key === activeSection.value)!);
const showCreateButton = computed(() => pageMode.value === 'list' && !!currentSection.value.createLabel);
const primaryCreateLabel = computed(() => currentSection.value.createLabel);
const activeRunRule = computed(() => runDetail.value?.rules.find((item) => item.id === activeRunRuleId.value));
const runDetailRuleScopeOptions = computed(() => [
  { label: '按表', value: 'TABLE' },
  { label: '按字段', value: 'FIELD' },
]);
const runDetailFieldOptions = computed(() =>
  Array.from(
    new Set(
      (runDetail.value?.rules || [])
        .filter((item) => item.ruleScope === 'FIELD' && item.fieldsName)
        .map((item) => item.fieldsName as string),
    ),
  ).map((item) => ({ label: item, value: item })),
);
const filteredRunDetailRules = computed(() =>
  (runDetail.value?.rules || []).filter((item) => {
    if (runDetailFilters.ruleName && !item.ruleName.toLowerCase().includes(runDetailFilters.ruleName.toLowerCase())) return false;
    if (runDetailFilters.alarmStatus && item.alarmStatus !== runDetailFilters.alarmStatus) return false;
    if (runDetailFilters.ruleScope && item.ruleScope !== runDetailFilters.ruleScope) return false;
    if (runDetailFilters.fieldsName && item.fieldsName !== runDetailFilters.fieldsName) return false;
    if (runDetailFilters.ruleTemplateType && (item as any).ruleTemplateType !== runDetailFilters.ruleTemplateType) return false;
    if (runDetailFilters.runStatus && item.runStatus !== runDetailFilters.runStatus) return false;
    if (runDetailFilters.generateMethod && item.generateMethod !== runDetailFilters.generateMethod) return false;
    return true;
  }),
);
const monitorEditorReadonly = computed(() => monitorEditorMode.value === 'view');
const ruleIdOptions = computed(() =>
  (ruleDetail.value?.ruleRecords || []).map((item) => ({ label: item.ruleId || item.id, value: item.ruleId || item.id })),
);
const ruleTemplateNameOptions = computed(() =>
  Array.from(new Set((ruleDetail.value?.ruleRecords || []).map((item) => item.ruleTemplateName))).map((item) => ({ label: item, value: item })),
);
const filteredMonitorRecords = computed(() => {
  const keyword = monitorFilters.ruleGroupName.trim().toLowerCase();
  return (ruleDetail.value?.monitorRecords || []).filter((item) =>
    !keyword || item.ruleGroupName.toLowerCase().includes(keyword) || item.id.toLowerCase().includes(keyword),
  );
});
const filteredRuleRecords = computed(() => {
  return (ruleDetail.value?.ruleRecords || []).filter((item) => {
    if (ruleDetailFilters.ruleGroupName && !(item.ruleGroupName || '').toLowerCase().includes(ruleDetailFilters.ruleGroupName.toLowerCase())) return false;
    if (ruleDetailFilters.ruleId && (item.ruleId || item.id) !== ruleDetailFilters.ruleId) return false;
    if (ruleDetailFilters.ruleName && !item.ruleName.toLowerCase().includes(ruleDetailFilters.ruleName.toLowerCase())) return false;
    if (ruleDetailFilters.ruleTemplateType && item.ruleTemplateType !== ruleDetailFilters.ruleTemplateType) return false;
    if (ruleDetailFilters.ruleTemplateName && item.ruleTemplateName !== ruleDetailFilters.ruleTemplateName) return false;
    if (ruleDetailFilters.ruleTemplateScope && item.ruleTemplateScope !== ruleDetailFilters.ruleTemplateScope) return false;
    if (ruleDetailFilters.ruleLevel && item.ruleLevel !== ruleDetailFilters.ruleLevel) return false;
    if (ruleDetailFilters.isEnabled !== undefined && (item.isEnabled ?? item.status === 'ENABLED') !== ruleDetailFilters.isEnabled) return false;
    if (ruleDetailFilters.generateMethod && item.generateMethod !== ruleDetailFilters.generateMethod) return false;
    return true;
  });
});
const monitorEnabledRuleCount = computed(() =>
  filteredMonitorRecords.value.reduce((sum, item) => sum + Number(item.enabledRuleCnt || 0), 0),
);
const monitorEditorEnabledRuleCount = computed(() =>
  monitorEditor.rules.filter((item: DqcRuleDetailItem) => item.isEnabled ?? item.status === 'ENABLED').length,
);
const monitorEditorIssueRuleCount = computed(() =>
  monitorEditor.rules.filter((item: DqcRuleDetailItem & { isError?: boolean }) => item.isError || !(item.isEnabled ?? item.status === 'ENABLED')).length,
);
const monitorEditorTableRuleCount = computed(() =>
  monitorEditor.rules.filter((item: DqcRuleDetailItem) => item.ruleScope === 'TABLE').length,
);
const monitorEditorFieldRuleCount = computed(() =>
  monitorEditor.rules.filter((item: DqcRuleDetailItem) => item.ruleScope === 'FIELD').length,
);
const monitorEditorSqlRuleCount = computed(() =>
  monitorEditor.rules.filter((item: DqcRuleDetailItem) => item.ruleScope === 'CUSTOM_SQL').length,
);
const monitorEditorConfigTip = computed(() =>
  monitorEditor.triggerType === 'CRON'
    ? '定时调度由当前质量监控独立控制执行时间，可按小时或天级生成执行计划。'
    : '关联指定的周期调度任务，节点运行完成后自动触发质量监控，并参与强规则阻断。',
);
const enabledRuleCount = computed(() =>
  filteredRuleRecords.value.filter((item) => item.isEnabled ?? item.status === 'ENABLED').length,
);
const distinctRuleTemplateCount = computed(() => new Set(filteredRuleRecords.value.map((item) => item.ruleTemplateName).filter(Boolean)).size);
const distinctRuleScopeCount = computed(() => new Set(filteredRuleRecords.value.map((item) => item.showUseScope || item.ruleTemplateScope).filter(Boolean)).size);
const distinctGenerateMethodCount = computed(() => new Set(filteredRuleRecords.value.map((item) => item.generateMethod).filter(Boolean)).size);
const ruleDetailPagination = reactive({
  current: 1,
  pageSize: 10,
});
const pagedRuleRecords = computed(() => {
  const start = (ruleDetailPagination.current - 1) * ruleDetailPagination.pageSize;
  const end = start + ruleDetailPagination.pageSize;
  return filteredRuleRecords.value.slice(start, end);
});
const ruleDetailPaginationConfig = computed(() => ({
  current: ruleDetailPagination.current,
  pageSize: ruleDetailPagination.pageSize,
  total: filteredRuleRecords.value.length,
  showSizeChanger: true,
  showTotal: (total: number, range: number[]) => `${range[0]}-${range[1]} 条，共 ${total} 条`,
}));
const testReportFieldOptions = computed(() =>
  Array.from(new Set((testReport.value?.probeRecords || []).map((item: any) => item.fieldName).filter(Boolean))).map((item) => ({ label: item, value: item })),
);
const testReportRuleFieldOptions = computed(() =>
  Array.from(new Set((testReport.value?.ruleRecords || []).map((item: any) => item.fieldName).filter(Boolean))).map((item) => ({ label: item, value: item })),
);
const filteredTestProbeRecords = computed(() =>
  (testReport.value?.probeRecords || []).filter((item: any) => !testReportProbeField.value || item.fieldName === testReportProbeField.value),
);
const filteredTestRuleRecords = computed(() =>
  (testReport.value?.ruleRecords || []).filter((item: any) => {
    if (testReportRuleField.value && item.fieldName !== testReportRuleField.value) return false;
    if (testReportRuleResult.value && item.result !== testReportRuleResult.value) return false;
    return true;
  }),
);
const filteredDiffReportDetail = computed(() =>
  (diffReport.value?.detail || []).filter((item: any) => !diffReportCompareResult.value || item.compareResult === diffReportCompareResult.value),
);
const templateColumns = [
  { title: '规则类型', dataIndex: 'type', key: 'type', width: 110 },
  { title: '模板名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '规则范围', dataIndex: 'scope', key: 'scope', width: 120 },
  { title: '关联规则数', dataIndex: 'ruleCount', key: 'ruleCount', width: 120 },
  { title: '模板描述', dataIndex: 'description', key: 'description', width: 360 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' as const },
];

const ruleColumns = [
  { title: '数据表', dataIndex: 'tableName', key: 'tableName', width: 240 },
  { title: '表负责人', dataIndex: 'ownerUser', key: 'ownerUser', width: 180 },
  { title: '质量监控数量', dataIndex: 'ruleGroupCnt', key: 'ruleGroupCnt', width: 130 },
  { title: '启用规则数', dataIndex: 'enabledRuleCnt', key: 'enabledRuleCnt', width: 120 },
  { title: '配置规则数', dataIndex: 'totalRuleCnt', key: 'totalRuleCnt', width: 120 },
  { title: '表创建时间', dataIndex: 'tableCreateTime', key: 'tableCreateTime', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
];

const runColumns = [
  { title: '表名', dataIndex: 'dbTableName', key: 'dbTableName', width: 220 },
  { title: '质量监控', dataIndex: 'ruleGroupName', key: 'ruleGroupName', width: 220 },
  { title: '告警状态(通过数/总数)', dataIndex: 'alarmStatus', key: 'alarmStatus', width: 180 },
  { title: '运行状态', dataIndex: 'runStatus', key: 'runStatus', width: 110 },
  { title: '触发方式', dataIndex: 'triggerType', key: 'triggerType', width: 110 },
  { title: '数据范围', dataIndex: 'dataRange', key: 'dataRange', width: 140 },
  { title: '表负责人', dataIndex: 'ownerUser', key: 'ownerUser', width: 100 },
  { title: '运行开始时间', dataIndex: 'startExeTime', key: 'startExeTime', width: 180 },
  { title: '运行结束时间', dataIndex: 'endExeTime', key: 'endExeTime', width: 180 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' as const },
];

const diffColumns = [
  { title: '对比ID', dataIndex: 'taskId', key: 'taskId', width: 140 },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 180 },
  { title: '对比模式', dataIndex: 'compareMode', key: 'compareMode', width: 100 },
  { title: 'A数据表名称', dataIndex: 'sourceTableName', key: 'sourceTableName', width: 220 },
  { title: 'B数据表名称', dataIndex: 'targetTableName', key: 'targetTableName', width: 220 },
  { title: '运行状态', dataIndex: 'taskStatus', key: 'taskStatus', width: 120 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 320, fixed: 'right' as const },
];

const diffReportColumns = [
  { title: '#', dataIndex: 'index', key: 'index', width: 60 },
  { title: '主键', dataIndex: 'primaryKey', key: 'primaryKey', width: 120 },
  { title: '字段名', dataIndex: 'fieldName', key: 'fieldName', width: 140 },
  { title: 'A值', dataIndex: 'sourceValue', key: 'sourceValue', width: 140 },
  { title: 'B值', dataIndex: 'targetValue', key: 'targetValue', width: 140 },
  { title: '差异数', dataIndex: 'diffCount', key: 'diffCount', width: 100 },
  { title: '差异比例', dataIndex: 'diffRatio', key: 'diffRatio', width: 100 },
  { title: '对比结果', dataIndex: 'compareResult', key: 'compareResult', width: 120 },
];

const ruleMonitorColumns = [
  { title: '质量监控名称', dataIndex: 'ruleGroupName', key: 'ruleGroupName', width: 240 },
  { title: '触发方式', dataIndex: 'triggerType', key: 'triggerType', width: 140 },
  { title: '已启用/总规则数', dataIndex: 'totalRuleCnt', key: 'totalRuleCnt', width: 150 },
  { title: '表负责人', dataIndex: 'ownerUser', key: 'ownerUser', width: 180 },
  { title: '创建人', dataIndex: 'createUser', key: 'createUser', width: 180 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'action', width: 540, fixed: 'right' as const },
];

const ruleDetailColumns = [
  { title: '质量监控名称', dataIndex: 'ruleGroupName', key: 'ruleGroupName', width: 220 },
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName', width: 220 },
  { title: '生成方式', dataIndex: 'generateMethod', key: 'generateMethod', width: 120 },
  { title: '规则类型', dataIndex: 'ruleTemplateType', key: 'ruleTemplateType', width: 120 },
  { title: '规则范围', dataIndex: 'showUseScope', key: 'showUseScope', width: 200 },
  { title: '规则模板', dataIndex: 'ruleTemplateName', key: 'ruleTemplateName', width: 180 },
  { title: '重要程度', dataIndex: 'ruleLevel', key: 'ruleLevel', width: 100 },
  { title: '规则状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建人', dataIndex: 'createUser', key: 'createUser', width: 180 },
  { title: '运行状态', dataIndex: 'runStatus', key: 'runStatus', width: 110 },
  { title: '操作', key: 'action', width: 320, fixed: 'right' as const },
];

const monitorEditorRuleColumns = [
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName', width: 220 },
  { title: '生成方式', dataIndex: 'generateMethod', key: 'generateMethod', width: 120 },
  { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType', width: 120 },
  { title: '规则范围', dataIndex: 'showUseScope', key: 'showUseScope', width: 220 },
  { title: '规则模板', dataIndex: 'ruleTemplateName', key: 'ruleTemplateName', width: 180 },
  { title: '重要程度', dataIndex: 'ruleLevel', key: 'ruleLevel', width: 100 },
  { title: '启用状态', dataIndex: 'isEnabled', key: 'isEnabled', width: 100 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
];

const monitorScheduleColumns = [
  { title: '项目名称', dataIndex: 'projectCode', key: 'projectCode', width: 220 },
  { title: '任务名称', dataIndex: 'workflowCode', key: 'workflowCode', width: 260 },
  { title: '类型', dataIndex: 'dsWorkFlowSourceType', key: 'dsWorkFlowSourceType', width: 100 },
  { title: '操作', key: 'action', width: 100 },
];
const hourIntervalOptions = [0, 1, 2, 3, 4, 6, 8, 12].map((item) => ({ label: String(item), value: item }));
const conditionOperatorOptions = ['>', '>=', '<=', '<', '=', '!='].map((item) => ({ label: item, value: item }));

const testColumns = [
  { title: '任务编号', dataIndex: 'showId', key: 'showId', width: 120 },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 180 },
  { title: '数据表', dataIndex: 'databaseName', key: 'databaseName', width: 220 },
  { title: '创建人', dataIndex: 'createUser', key: 'createUser', width: 160 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const },
];

const testInstanceColumns = [
  { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 180 },
  { title: '运行状态', dataIndex: 'dataTestRunStatus', key: 'dataTestRunStatus', width: 110 },
  { title: '执行人', dataIndex: 'executorName', key: 'executorName', width: 120 },
  { title: '执行时间', dataIndex: 'runTime', key: 'runTime', width: 180 },
  { title: '反馈', dataIndex: 'feedbackStatus', key: 'feedbackStatus', width: 120 },
  { title: '操作', key: 'action', width: 280 },
];

const testFieldColumns = [
  { title: '字段名', dataIndex: 'fieldName', key: 'fieldName' },
  { title: '字段类型', dataIndex: 'dataType', key: 'dataType' },
  { title: '主键', dataIndex: 'isPrimaryKey', key: 'isPrimaryKey', width: 80 },
  { title: '字段类型打标', dataIndex: 'tagType', key: 'tagType', width: 180 },
];

const testRuleColumns = [
  { title: '字段', dataIndex: 'fieldName', key: 'fieldName', width: 140 },
  { title: '规则模板', dataIndex: 'ruleTemplateName', key: 'ruleTemplateName', width: 180 },
  { title: '阈值', dataIndex: 'threshold', key: 'threshold', width: 140 },
  { title: '预期结果', dataIndex: 'expectedResult', key: 'expectedResult', width: 150 },
];

const testProbeColumns = [
  { title: '字段名', dataIndex: 'fieldName', key: 'fieldName', width: 180 },
  { title: '字段类型打标', dataIndex: 'tagType', key: 'tagType', width: 140 },
  { title: '画像概况', key: 'profile', width: 700 },
];

const testRuleReportColumns = [
  { title: '字段', dataIndex: 'fieldName', key: 'fieldName', width: 120 },
  { title: '规则模板', dataIndex: 'ruleTemplateName', key: 'ruleTemplateName', width: 180 },
  { title: '阈值', dataIndex: 'threshold', key: 'threshold', width: 120 },
  { title: '实际值', dataIndex: 'actualValue', key: 'actualValue', width: 120 },
  { title: '结果', dataIndex: 'result', key: 'result', width: 100 },
  { title: '操作', key: 'action', width: 120 },
];

function resetPagination() {
  pagination.current = 1;
}

function clearObject(target: Record<string, any>, next: Record<string, any>) {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, next);
}

function formatDateTime(value?: number | string) {
  if (!value) return '/';
  if (typeof value === 'number') {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  }
  return value;
}

function formatDuration(seconds?: number) {
  if (seconds === undefined || seconds === null) return '/';
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remain = seconds % 60;
    return remain ? `${minutes} 分钟 ${remain} 秒` : `${minutes} 分钟`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
}

function formatPercentValue(value?: number) {
  if (value === undefined || value === null) return '/';
  return `${value.toFixed(2)}%`;
}

function formatRatio(value?: number) {
  if (value === undefined || value === null) return '/';
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value?: number) {
  if (value === undefined || value === null) return '/';
  return value.toLocaleString('en-US');
}

function ownerLabel(owner?: string) {
  if (!owner) return '/';
  const matched = enumOptions.owners.find((item) => item.value === owner);
  return matched ? `${matched.label}(${owner})` : owner;
}

function templateTypeLabel(type?: string) {
  const matched = enumOptions.ruleTemplateTypeOptions?.find((item) => item.value === type);
  return matched?.label || type || '/';
}

function monitorTriggerLabel(type?: string) {
  const matched = enumOptions.triggerTypes.find((item) => item.value === type);
  return matched?.label || type || '/';
}

function generateMethodLabel(method?: string) {
  const matched = enumOptions.generateMethods?.find((item) => item.value === method);
  return matched?.label || method || '/';
}

function alarmStatusLabel(status?: string) {
  const matched = enumOptions.alarmStatuses?.find((item) => item.value === status);
  return matched?.label || status || '/';
}

function alarmStatusColor(status?: string) {
  return { NORMAL: 'green', ALARM: 'red' }[status || ''] || 'default';
}

function ruleScopeLabel(scope?: string, fieldsName?: string) {
  const label = { TABLE: '按表', FIELD: '按字段', CUSTOM_SQL: '自定义 SQL' }[scope || ''] || scope || '/';
  return scope === 'FIELD' && fieldsName ? `${label}(${fieldsName})` : label;
}

function ruleLevelLabel(level?: string) {
  const matched = enumOptions.levels?.find((item) => item.value === level);
  return matched?.label || level || '/';
}

function runStatusLabel(status?: string) {
  return { INIT: '初始化', RUNNING: '运行中', SUCCESS: '运行成功', FAILED: '运行失败' }[status || ''] || status;
}

function runStatusColor(status?: string) {
  return { INIT: 'default', RUNNING: 'processing', SUCCESS: 'green', FAILED: 'red' }[status || ''] || 'default';
}

function diffStatusLabel(status?: string) {
  return { CREATED: '待运行', RUNNING: '运行中', SUCCESS: '运行成功', FAILED: '运行失败', STOPPED: '已停止' }[status || ''] || status;
}

function diffStatusColor(status?: string) {
  return { CREATED: 'default', RUNNING: 'processing', SUCCESS: 'green', FAILED: 'red', STOPPED: 'gold' }[status || ''] || 'default';
}

function compareResultLabel(result?: string) {
  return { EQUAL: '一致', DIFF: '不一致', SOURCE_ONLY: '仅来源存在', TARGET_ONLY: '仅目标存在' }[result || ''] || result;
}

function compareResultColor(result?: string) {
  return { EQUAL: 'green', DIFF: 'red', SOURCE_ONLY: 'gold', TARGET_ONLY: 'blue' }[result || ''] || 'default';
}

function testInstanceStatusLabel(status?: string) {
  return { INIT: '初始化', RUNNING: '运行中', SUCCESS: '成功', FAILED: '失败', STOPPED: '已停止' }[status || ''] || status;
}

function testInstanceStatusColor(status?: string) {
  return { INIT: 'default', RUNNING: 'processing', SUCCESS: 'green', FAILED: 'red', STOPPED: 'gold' }[status || ''] || 'default';
}

function feedbackLabel(status?: string) {
  return { EXPECT_MATCH: '符合', EXPECT_NOT_MATCH: '不符合' }[status || ''] || '待反馈';
}

function ruleConfigsFallbackId() {
  return ruleConfigRecords.value[0]?.id || '';
}

function splitThreshold(threshold?: string, thresholdType?: string) {
  const matched = String(threshold || '').match(/(>=|<=|!=|=|>|<)\s*(.+)/);
  return {
    thresholdOperator: matched?.[1] || '<=',
    thresholdValue: matched?.[2] || (thresholdType === 'PERCENTAGE' ? '1' : '0'),
  };
}

function buildRulePayload(source: any) {
  const thresholdOperator = source.thresholdOperator || source.thresholdConditions?.conditions?.[0]?.operator || '<=';
  const thresholdValue = source.thresholdValue ?? source.thresholdConditions?.conditions?.[0]?.value ?? '1';
  const thresholdType = source.thresholdType || 'NUMBER';
  const ruleScope = source.ruleScope || 'TABLE';
  return {
    ...safeClone(source),
    ruleScope,
    thresholdType,
    threshold: `${thresholdOperator} ${thresholdValue}${thresholdType === 'PERCENTAGE' ? '%' : ''}`.trim(),
    status: source.isEnabled === false ? 'DISABLED' : 'ENABLED',
    isEnabled: source.isEnabled ?? true,
    showUseScope: ruleScope === 'FIELD'
      ? `${source.fieldsName || ''}(string)`
      : ruleScope === 'CUSTOM_SQL'
        ? 'SQL 结果列(metric_value)'
        : '整表',
    ruleTemplateScope: ruleScope === 'FIELD' ? 'FIELD' : 'TABLE',
    filterExpr: source.filterConditionText ? [{ expr: source.filterConditionText }] : [],
    thresholdConditions: { logic: 'OR', conditions: [{ operator: thresholdOperator, value: thresholdValue }] },
  } as DqcRuleDetailItem;
}

function upsertMonitorRule(payload: DqcRuleDetailItem) {
  const idx = monitorEditor.rules.findIndex((item: DqcRuleDetailItem) => item.id === payload.id);
  if (idx >= 0) {
    monitorEditor.rules.splice(idx, 1, payload);
  } else {
    monitorEditor.rules.unshift({
      ...payload,
      id: payload.id || `draft_${Date.now()}`,
      ruleId: payload.ruleId || `R-DRAFT-${monitorEditor.rules.length + 1}`,
      generateMethod: payload.generateMethod || 'MANUAL',
      runStatus: payload.runStatus || 'SUCCESS',
      alarmStatus: payload.alarmStatus || 'NORMAL',
    });
  }
}

function monitorRuleRowClass(record: DqcRuleDetailItem) {
  if ((record as DqcRuleDetailItem & { isError?: boolean }).isError) return 'monitor-rule-row--error';
  return record.isEnabled ?? record.status === 'ENABLED' ? '' : 'monitor-rule-row--warning';
}

async function loadSummary() {
  Object.assign(summary, await DqcApi.fetchSummary());
}

async function loadEnums() {
  Object.assign(enumOptions, await DqcApi.fetchEnums());
}

async function loadTemplates() {
  loading.value = true;
  try {
    const res = await DqcApi.fetchTemplates({ ...templateFilters, pageNo: pagination.current, pageSize: pagination.pageSize });
    templateRecords.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

async function loadRuleConfigs() {
  loading.value = true;
  try {
    const res = await DqcApi.fetchRuleConfigs({ ...ruleFilters, pageNo: pagination.current, pageSize: pagination.pageSize });
    ruleConfigRecords.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

async function loadRuleTrees() {
  ruleTreeData.value = await DqcApi.fetchRuleConfigTree();
  if (!selectedRuleTreeKeys.value.length && ruleTreeData.value.length) {
    applyRuleTreeSelection(ruleTreeData.value[0]);
  }
}

async function searchRuleTables(keyword?: string) {
  ruleTableSuggestions.value = await DqcApi.fetchRuleTableSuggestions(keyword);
}

async function loadRuns() {
  loading.value = true;
  try {
    const res = await DqcApi.fetchRuns({ ...runFilters, pageNo: pagination.current, pageSize: pagination.pageSize });
    runRecords.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

async function loadDiffs() {
  loading.value = true;
  try {
    const res = await DqcApi.fetchDiffs({ ...diffFilters, pageNo: pagination.current, pageSize: pagination.pageSize });
    diffRecords.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

async function loadTests() {
  loading.value = true;
  try {
    const res = await DqcApi.fetchTests({ ...testFilters, pageNo: pagination.current, pageSize: pagination.pageSize });
    testRecords.value = res.items;
    pagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

async function loadCurrentSection() {
  if (pageMode.value !== 'list') return;
  if (activeSection.value === 'template') return loadTemplates();
  if (activeSection.value === 'rule') return loadRuleConfigs();
  if (activeSection.value === 'run') return loadRuns();
  if (activeSection.value === 'diff') return loadDiffs();
  return loadTests();
}

function switchSection(key: SectionKey) {
  activeSection.value = key;
  pageMode.value = 'list';
  resetPagination();
  if (key === 'rule' && !ruleTreeData.value.length) {
    loadRuleTrees().then(loadCurrentSection);
    return;
  }
  loadCurrentSection();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  loadCurrentSection();
}

function handleRuleDetailTableChange(pag: TablePaginationConfig) {
  ruleDetailPagination.current = pag.current || 1;
  ruleDetailPagination.pageSize = pag.pageSize || 10;
}

function resetTemplateFilters() {
  templateFilters.type = undefined;
  templateFilters.scope = undefined;
  resetPagination();
  loadTemplates();
}

function resetRuleFilters() {
  ruleFilters.tableName = '';
  ruleFilters.ownerUser = undefined;
  ruleFilters.notHasRule = false;
  ruleFilters.isSelf = false;
  ruleFilters.dbSourceType = ruleContext.dbSourceType || undefined;
  ruleFilters.dataSourceId = ruleContext.dataSourceId || undefined;
  ruleFilters.databaseName = ruleContext.databaseName || undefined;
  resetPagination();
  loadRuleConfigs();
}

function resetRunFilters() {
  runFilters.tableName = '';
  runFilters.ruleGroupName = '';
  runFilters.triggerType = undefined;
  runFilters.runStatus = undefined;
  runFilters.alarmStatus = undefined;
  runFilters.isSelf = false;
  resetPagination();
  loadRuns();
}

function syncActiveRunRule() {
  const current = filteredRunDetailRules.value.find((item) => item.id === activeRunRuleId.value);
  if (current) return;
  activeRunRuleId.value = filteredRunDetailRules.value[0]?.id || '';
}

function resetRunDetailFilters() {
  runDetailFilters.ruleName = '';
  runDetailFilters.alarmStatus = undefined;
  runDetailFilters.ruleScope = undefined;
  runDetailFilters.fieldsName = undefined;
  runDetailFilters.ruleTemplateType = undefined;
  runDetailFilters.runStatus = undefined;
  runDetailFilters.generateMethod = undefined;
  syncActiveRunRule();
}

function applyRunDetailFilters() {
  if (runDetailFilters.ruleScope !== 'FIELD') {
    runDetailFilters.fieldsName = undefined;
  }
  syncActiveRunRule();
}

function resolveRuleSelectableNode(node: any) {
  if (!node) return null;
  if (node.databaseName) return node;
  if (node.children?.length) {
    return resolveRuleSelectableNode(node.children[0]);
  }
  return null;
}

function applyRuleTreeSelection(node: any) {
  const target = resolveRuleSelectableNode(node);
  if (!target) return;
  selectedRuleTreeKeys.value = [String(target.key)];
  Object.assign(ruleContext, {
    dbSourceType: target.dbSourceType || '',
    dataSourceId: target.dataSourceId || '',
    dataSourceName: target.dataSourceName || '',
    databaseName: target.databaseName || '',
  });
  ruleFilters.dbSourceType = target.dbSourceType;
  ruleFilters.dataSourceId = target.dataSourceId;
  ruleFilters.databaseName = target.databaseName;
  ruleFilters.tableName = target.children?.length ? '' : target.label || '';
  resetPagination();
  loadRuleConfigs();
}

function handleRuleTreeSelect(keys: Array<string | number>, info: any) {
  if (!keys.length || !info?.node) return;
  applyRuleTreeSelection(info.node);
}

function resetMonitorFilters() {
  monitorFilters.ruleGroupName = '';
}

function resetRuleDetailFilters() {
  ruleDetailFilters.ruleGroupName = '';
  ruleDetailFilters.ruleId = undefined;
  ruleDetailFilters.ruleName = '';
  ruleDetailFilters.ruleTemplateType = undefined;
  ruleDetailFilters.ruleTemplateName = undefined;
  ruleDetailFilters.ruleTemplateScope = undefined;
  ruleDetailFilters.ruleLevel = undefined;
  ruleDetailFilters.isEnabled = undefined;
  ruleDetailFilters.generateMethod = undefined;
  ruleDetailPagination.current = 1;
}

function applyRuleDetailFilters() {
  ruleDetailPagination.current = 1;
}

function resetDiffFilters() {
  diffFilters.taskId = '';
  diffFilters.taskName = '';
  diffFilters.compareMode = undefined;
  diffFilters.sourceTableName = '';
  diffFilters.targetTableName = '';
  diffFilters.taskStatus = undefined;
  diffFilters.creator = undefined;
  diffFilters.isSelf = false;
  resetPagination();
  loadDiffs();
}

function resetTestFilters() {
  testFilters.taskName = '';
  testFilters.databaseName = '';
  testFilters.tableName = '';
  testFilters.createUser = undefined;
  testFilters.isSelf = false;
  resetPagination();
  loadTests();
}

function handlePrimaryCreate() {
  if (activeSection.value === 'template') return openTemplateModal();
  if (activeSection.value === 'rule') return openMonitorEditor({ tableId: ruleConfigRecords.value[0]?.id || ruleConfigsFallbackId(), mode: 'create' });
  if (activeSection.value === 'diff') return openDiffEditor(undefined, 'create');
  if (activeSection.value === 'test') return openTestEditor(undefined, 'create');
}

function openTemplateModal(record?: DqcTemplateItem) {
  clearObject(templateEditing, record ? safeClone(record) : { type: 'TABLE', scope: 'TABLE', owner: 'demo_user', description: '' });
  templateModalOpen.value = true;
}

async function saveTemplate() {
  await DqcApi.saveTemplate(templateEditing);
  templateModalOpen.value = false;
  message.success('规则模板已保存');
  await Promise.all([loadSummary(), loadTemplates()]);
}

async function removeTemplate(id: string) {
  await DqcApi.deleteTemplate(id);
  message.success('规则模板已删除');
  await Promise.all([loadSummary(), loadTemplates()]);
}

async function openRuleDetail(tableId: string, createNew = false) {
  if (!tableId) {
    message.warning('请先选择一个数据表');
    return;
  }
  ruleDetail.value = await DqcApi.fetchRuleConfigDetail(tableId);
  pageMode.value = 'rule-detail';
  ruleDetailTab.value = 'monitor';
  ruleDetailPagination.current = 1;
  ruleDetailPagination.pageSize = 10;
  resetMonitorFilters();
  resetRuleDetailFilters();
  if (createNew) openMonitorEditor({ tableId, mode: 'create' });
}

function openRuleModal(record?: DqcRuleDetailItem, readonly = false) {
  const source = record
    ? safeClone(record)
    : {
        tableId: ruleDetail.value?.tableInfo.id,
        ruleScope: 'TABLE',
        ruleLevel: 'P1',
        threshold: '<= 1%',
        thresholdType: 'PERCENTAGE',
        isEnabled: true,
        ruleTemplateType: 'TABLE',
      };
  clearObject(ruleEditing, source);
  Object.assign(ruleEditing, splitThreshold(ruleEditing.threshold as string, ruleEditing.thresholdType as string), {
    filterConditionText: Array.isArray((ruleEditing as any).filterExpr) && (ruleEditing as any).filterExpr.length
      ? JSON.stringify((ruleEditing as any).filterExpr)
      : '',
  });
  ruleModalReadonly.value = readonly;
  ruleEditingContext.value = 'detail';
  ruleModalOpen.value = true;
}

async function saveRule() {
  if (ruleModalReadonly.value) {
    ruleModalOpen.value = false;
    return;
  }
  const payload = buildRulePayload(ruleEditing as any);
  if (ruleEditingContext.value === 'monitor') {
    upsertMonitorRule(payload);
    ruleModalOpen.value = false;
    message.success('规则已更新');
    return;
  }
  await DqcApi.saveRule(payload as any);
  ruleModalOpen.value = false;
  message.success('质量规则已保存');
  if (ruleDetail.value?.tableInfo.id) {
    ruleDetail.value = await DqcApi.fetchRuleConfigDetail(ruleDetail.value.tableInfo.id);
  }
  await loadSummary();
}

async function openMonitorEditor({
  groupId,
  tableId,
  mode,
}: {
  groupId?: string;
  tableId?: string;
  mode: 'create' | 'edit' | 'view' | 'copy';
}) {
  const base = await DqcApi.fetchMonitorEditor({ groupId, tableId });
  const tableInfo = await DqcApi.fetchRuleTableInfo(base?.tableId || tableId || '');
  clearObject(monitorEditor, {
    ...(safeClone(base || {}) as any),
    dsWorkFlows: (safeClone(base?.dsWorkFlows || []) as any[]).map((item) => ({ ...item, workflowOptions: [] })),
    tableNameDisplay: tableInfo ? `${tableInfo.databaseName}.${tableInfo.tableName}` : '/',
    partitionType: tableInfo?.partitionType || 'PARTITION',
  });
  if (mode === 'copy') {
    monitorEditor.id = undefined;
    monitorEditor.name = `${monitorEditor.name}-副本`;
  }
  monitorEditorMode.value = mode;
  monitorFieldOptions.value = (await DqcApi.fetchRuleFieldOptions(monitorEditor.tableId)).map((item) => ({
    label: `${item.label}(${item.columnType})`,
    value: item.value,
  }));
  for (let index = 0; index < monitorEditor.dsWorkFlows.length; index += 1) {
    const row = monitorEditor.dsWorkFlows[index];
    row.workflowOptions = await DqcApi.fetchProjectWorkflows(row.projectCode);
  }
  await refreshPreviewTimes();
  pageMode.value = 'rule-monitor-editor';
}

function backToRuleDetail() {
  pageMode.value = 'rule-detail';
}

async function saveMonitorEditor() {
  const payload = safeClone(monitorEditor) as DqcMonitorEditor;
  payload.notifyPolicyName = enumOptions.notifyPolicies.find((item) => item.value === payload.notifyPolicyId)?.label || payload.notifyPolicyName;
  payload.rules = monitorEditor.rules.map((item: DqcRuleDetailItem) => buildRulePayload(item as any));
  const saved = await DqcApi.saveMonitorEditor(payload);
  message.success('质量监控已保存');
  pageMode.value = 'rule-detail';
  if (saved?.tableId) {
    await Promise.all([openRuleDetail(saved.tableId), loadSummary()]);
  }
}

function openMonitorRuleEditor(record?: DqcRuleDetailItem, readonly = false) {
  const source = record
    ? safeClone(record)
    : {
        ruleScope: 'TABLE',
        ruleLevel: 'P1',
        thresholdType: 'PERCENTAGE',
        ruleTemplateType: 'TABLE',
        isEnabled: true,
      };
  clearObject(ruleEditing, source);
  Object.assign(ruleEditing, splitThreshold((ruleEditing as any).threshold, (ruleEditing as any).thresholdType), {
    filterConditionText: Array.isArray((ruleEditing as any).filterExpr) && (ruleEditing as any).filterExpr.length
      ? JSON.stringify((ruleEditing as any).filterExpr)
      : '',
  });
  ruleModalReadonly.value = readonly;
  ruleEditingContext.value = 'monitor';
  ruleModalOpen.value = true;
}

function removeMonitorRule(index: number) {
  monitorEditor.rules.splice(index, 1);
}

function appendGeneratedRules(rules: DqcRuleDetailItem[]) {
  rules.forEach((rule) => upsertMonitorRule(buildRulePayload({ ...rule, isEnabled: rule.isEnabled ?? true } as any)));
  message.success(`已加入 ${rules.length} 条规则`);
}

function openAiRuleDrawer() {
  aiRuleDrawerRef.value?.showDrawer({
    tableId: monitorEditor.tableId,
    tableNameDisplay: monitorEditor.tableNameDisplay,
  });
}

function openTableRuleDrawer() {
  tableRuleDrawerRef.value?.showDrawer({ tableId: monitorEditor.tableId });
}

function openFieldRuleDrawer() {
  fieldRuleDrawerRef.value?.showDrawer({
    tableId: monitorEditor.tableId,
    existingRules: monitorEditor.rules,
  });
}

function openSqlRuleDrawer() {
  sqlRuleDrawerRef.value?.showDrawer({ tableId: monitorEditor.tableId });
}

async function refreshPreviewTimes() {
  if (monitorEditor.triggerType !== 'CRON' || monitorEditor.scheduleConfig.scheduleFrequency !== 'HOUR') {
    previewExecTimes.value = [];
    return;
  }
  previewExecTimes.value = await DqcApi.fetchPreviewTimes(monitorEditor.scheduleConfig.hourInterval, monitorEditor.scheduleConfig.minuteOffset);
}

async function handleProjectChange(index: number, projectCode: string) {
  const row = monitorEditor.dsWorkFlows[index];
  const options = await DqcApi.fetchProjectWorkflows(projectCode);
  row.workflowOptions = options;
  row.projectCode = projectCode;
  row.projectName = options[0]?.projectName || row.projectName;
  row.workflowCode = options[0]?.value || '';
  row.workflowName = options[0]?.label || '';
}

function handleWorkflowChange(index: number, workflowCode: string) {
  const row = monitorEditor.dsWorkFlows[index];
  const matched = (row.workflowOptions || []).find((item: any) => item.value === workflowCode);
  row.workflowCode = workflowCode;
  row.workflowName = matched?.label || row.workflowName;
}

async function addManualNode() {
  const options = await DqcApi.fetchProjectWorkflows(enumOptions.projects?.[0]?.value);
  monitorEditor.dsWorkFlows.push({
    projectCode: options[0]?.projectCode || enumOptions.projects?.[0]?.value || '',
    projectName: options[0]?.projectName || enumOptions.projects?.[0]?.label || '',
    workflowCode: options[0]?.value || '',
    workflowName: options[0]?.label || '',
    dsWorkFlowSourceType: 'MANUAL',
    workflowOptions: options,
  });
}

function removeScheduledNode(index: number) {
  monitorEditor.dsWorkFlows.splice(index, 1);
}

function handleNotifyPolicyChange(value: string) {
  monitorEditor.notifyPolicyName = enumOptions.notifyPolicies.find((item) => item.value === value)?.label || '';
}

async function removeRule(id: string) {
  await DqcApi.deleteRule(id);
  message.success('质量规则已删除');
  if (ruleDetail.value?.tableInfo.id) {
    ruleDetail.value = await DqcApi.fetchRuleConfigDetail(ruleDetail.value.tableInfo.id);
  }
  await loadSummary();
}

async function toggleRule(id: string) {
  await DqcApi.toggleRule(id);
  message.success('规则状态已更新');
  if (ruleDetail.value?.tableInfo.id) {
    ruleDetail.value = await DqcApi.fetchRuleConfigDetail(ruleDetail.value.tableInfo.id);
  }
}

function openRunTestModal(record: any) {
  activeRunTestGroup.value = record;
  runTestModalOpen.value = true;
  runTestSubmitting.value = false;
  runTestSuccess.value = false;
}

function closeRunTestModal() {
  runTestModalOpen.value = false;
  runTestSubmitting.value = false;
  runTestSuccess.value = false;
}

async function confirmRunTest() {
  if (!activeRunTestGroup.value?.id) return;
  runTestSubmitting.value = true;
  try {
    await DqcApi.runMonitorTest(activeRunTestGroup.value.id);
    runTestSuccess.value = true;
    message.success(`已触发 ${activeRunTestGroup.value?.ruleGroupName || '质量监控'} 的测试运行`);
    if (ruleDetail.value?.tableInfo.id) {
      await Promise.all([openRuleDetail(ruleDetail.value.tableInfo.id), loadSummary()]);
    }
  } finally {
    runTestSubmitting.value = false;
  }
}

async function removeMonitor(id: string) {
  await DqcApi.deleteMonitorEditor(id);
  message.success('质量监控已删除');
  if (ruleDetail.value?.tableInfo.id) {
    await Promise.all([openRuleDetail(ruleDetail.value.tableInfo.id), loadSummary()]);
  }
}

async function openLatestRunRecord(record: DqcRuleMonitorItem) {
  const res = await DqcApi.fetchRuns({ ruleGroupName: record.ruleGroupName, pageNo: 1, pageSize: 20 });
  const matched = res.items.find((item) => item.ruleGroupName === record.ruleGroupName);
  if (!matched) {
    message.warning('当前质量监控还没有运行记录');
    return;
  }
  closeRunTestModal();
  await openRunDetail(matched.id);
}

async function openRuleRunResult(record: DqcRuleDetailItem) {
  const res = await DqcApi.fetchRuns({ ruleGroupName: record.ruleGroupName, pageNo: 1, pageSize: 20 });
  const matched = res.items.find((item) => item.ruleGroupName === record.ruleGroupName);
  if (!matched) {
    message.warning('当前规则暂未产出运行结果');
    return;
  }
  await openRunDetail(matched.id);
}

async function openRunDetail(runRecordId: string) {
  runDetail.value = await DqcApi.fetchRunDetail(runRecordId);
  resetRunDetailFilters();
  activeRunRuleId.value = runDetail.value?.rules[0]?.id || '';
  pageMode.value = 'run-detail';
}

async function rerunRecord(id: string) {
  await DqcApi.rerunRecord(id);
  message.success('运行记录已重跑');
  await Promise.all([loadSummary(), loadRuns()]);
}

async function openDiffEditor(id?: string, mode: 'create' | 'edit' | 'view' | 'copy' = 'create') {
  diffEditorMode.value = mode;
  if (!id) {
    clearObject(diffEditing, {
      taskName: '',
      compareMode: 'TABLE',
      compareMethod: 'ROW_BY_ROW',
      primaryKeys: ['id'],
      sourceConfig: { dataSourceType: 'HIVE', compareRangeType: 'PARTITION', partitionInfo: 'dt=2026-04-22' },
      targetConfig: { dataSourceType: 'HIVE', compareRangeType: 'PARTITION', partitionInfo: 'dt=2026-04-22' },
    });
  } else {
    const detail = await DqcApi.fetchDiffDetail(id);
    clearObject(diffEditing, safeClone(detail || { sourceConfig: {}, targetConfig: {}, primaryKeys: [] }));
    if (mode === 'copy') {
      diffEditing.id = undefined;
      diffEditing.taskName = `${diffEditing.taskName}-副本`;
    }
  }
  pageMode.value = 'diff-editor';
}

async function saveDiffEditor() {
  await DqcApi.saveDiff(diffEditing);
  message.success('对比任务已保存');
  pageMode.value = 'list';
  await loadDiffs();
}

async function openDiffReport(id: string) {
  diffReport.value = await DqcApi.fetchDiffReport(id);
  diffReportCompareResult.value = undefined;
  pageMode.value = 'diff-report';
}

async function openDiffLog(id: string) {
  const report = await DqcApi.fetchDiffReport(id);
  currentLogs.value = report?.logs || [];
  logDrawerTitle.value = '对比任务日志';
  logDrawerOpen.value = true;
}

async function runDiff(id: string) {
  await DqcApi.runDiff(id);
  message.success('数据对比已执行');
  await Promise.all([loadSummary(), loadDiffs()]);
}

async function removeDiff(id: string) {
  await DqcApi.deleteDiff(id);
  message.success('对比任务已删除');
  await loadDiffs();
}

async function handleTestExpand(expanded: boolean, record: DqcTestTaskItem) {
  if (expanded) {
    expandedTestRowKeys.value = Array.from(new Set([...expandedTestRowKeys.value, record.id]));
    testInstanceMap[record.id] = await DqcApi.fetchTestInstances(record.id);
  } else {
    expandedTestRowKeys.value = expandedTestRowKeys.value.filter((item) => item !== record.id);
  }
}

async function openTestEditor(id?: string, mode: 'create' | 'edit' | 'view' | 'copy' = 'create') {
  testEditorMode.value = mode;
  if (!id) {
    clearObject(testEditing, {
      taskName: '',
      datasourceType: 'HIVE',
      environmentType: 'PROD',
      databaseName: '',
      tableName: '',
      dataRangeType: 'PARTITION',
      whereCondition: '',
      fieldRecords: [
        { fieldName: 'id', dataType: 'string', isPrimaryKey: true, tagType: '主键' },
        { fieldName: 'dt', dataType: 'string', isPrimaryKey: true, tagType: '分区' },
      ],
      ruleRecords: [
        { id: 'tmp_rule_1', fieldName: 'id', ruleTemplateName: '唯一性校验', threshold: '= 0', expectedResult: 'MATCH' },
      ],
    });
  } else {
    const detail = await DqcApi.fetchTestDetail(id);
    clearObject(testEditing, safeClone(detail || { fieldRecords: [], ruleRecords: [] }));
    if (mode === 'copy') {
      testEditing.id = undefined;
      testEditing.taskName = `${testEditing.taskName}-副本`;
    }
  }
  pageMode.value = 'test-editor';
}

async function saveTestEditor() {
  await DqcApi.saveTest(testEditing);
  message.success('测试任务已保存');
  pageMode.value = 'list';
  await loadTests();
}

async function runTest(id: string) {
  await DqcApi.runTest(id);
  message.success('测试任务已执行');
  if (expandedTestRowKeys.value.includes(id)) {
    testInstanceMap[id] = await DqcApi.fetchTestInstances(id);
  }
}

async function openTestReport(instanceId: string) {
  activeTestReportInstanceId.value = instanceId;
  testReport.value = await DqcApi.fetchTestReport(instanceId);
  testReportProbeField.value = undefined;
  testReportRuleField.value = undefined;
  testReportRuleResult.value = undefined;
  testReportFeedback.feedbackStatus = testReport.value?.feedbackStatus || 'EXPECT_MATCH';
  testReportFeedback.feedbackText = testReport.value?.feedbackText || '';
  pageMode.value = 'test-report';
}

async function openTestLog(instanceId: string) {
  const report = await DqcApi.fetchTestReport(instanceId);
  currentLogs.value = report?.logs || [];
  logDrawerTitle.value = '测试实例日志';
  logDrawerOpen.value = true;
}

function openInstanceDetail(instance: DqcTestInstanceItem) {
  currentInstance.value = instance;
  instanceDetailOpen.value = true;
}

function openShareModal(instance: DqcTestInstanceItem) {
  currentInstance.value = instance;
  shareTargets.value = ['demo_user'];
  shareModalOpen.value = true;
}

async function removeTest(id: string) {
  await DqcApi.deleteTest(id);
  message.success('测试任务已删除');
  await loadTests();
}

function openSqlPreview(sql?: string) {
  currentSqlPreview.value = sql || '-- 当前规则暂无 SQL 预览内容';
  sqlPreviewOpen.value = true;
}

async function saveTestReportFeedback() {
  if (!activeTestReportInstanceId.value) return;
  await DqcApi.saveTestFeedback({
    instanceId: activeTestReportInstanceId.value,
    feedbackStatus: testReportFeedback.feedbackStatus,
    feedbackText: testReportFeedback.feedbackText,
  });
  message.success('反馈已保存');
  testReport.value = await DqcApi.fetchTestReport(activeTestReportInstanceId.value);
}

function backToList() {
  pageMode.value = 'list';
}

function reloadCurrent() {
  if (pageMode.value === 'list') return loadCurrentSection();
  if (pageMode.value === 'rule-detail' && ruleDetail.value?.tableInfo.id) return openRuleDetail(ruleDetail.value.tableInfo.id);
  if (pageMode.value === 'rule-monitor-editor') return openMonitorEditor({ groupId: monitorEditor.id, tableId: monitorEditor.tableId, mode: monitorEditorMode.value });
  if (pageMode.value === 'run-detail' && runDetail.value?.record.id) return openRunDetail(runDetail.value.record.id);
}

onMounted(async () => {
  await Promise.all([loadSummary(), loadEnums(), loadTemplates(), loadRuleTrees(), searchRuleTables()]);
});
</script>

<style lang="less" scoped>
.dqc-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 24%),
    linear-gradient(180deg, #f6fbff 0%, #edf5ff 100%);
}

.dqc-page__hero,
.panel,
.stat-card,
.section-card,
.detail-card,
.run-rule-card,
.compare-card,
.sub-panel,
.step-panel,
.detail-page__header {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.dqc-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.dqc-page__eyebrow {
  margin: 0 0 8px;
  color: #0369a1;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dqc-page__hero h2,
.panel__header h3,
.detail-page__header h3 {
  margin: 0;
}

.dqc-page__desc,
.panel__header p,
.detail-page__header p {
  margin: 8px 0 0;
  color: #667085;
}

.dqc-page__stats,
.detail-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card,
.detail-card {
  padding: 20px;
}

.stat-card span,
.detail-card span {
  color: #667085;
  font-size: 13px;
}

.stat-card strong,
.detail-card strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 28px;
}

.workspace {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
}

.workspace__sider {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-card {
  padding: 18px;
  cursor: pointer;
}

.section-card.is-active {
  border-color: rgba(14, 165, 233, 0.28);
  box-shadow: 0 18px 40px rgba(14, 165, 233, 0.12);
}

.section-card__title {
  color: #101828;
  font-size: 15px;
  font-weight: 600;
}

.section-card__desc {
  margin-top: 6px;
  color: #667085;
  font-size: 13px;
}

.workspace__content,
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #667085;
  font-size: 13px;
}

.detail-breadcrumb__link {
  color: #1677ff;
  cursor: pointer;
}

.panel,
.detail-page__header {
  padding: 20px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-grid {
  display: grid;
  gap: 12px;
}

.filter-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.filter-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.detail-inline-filters {
  display: grid;
  grid-template-columns: minmax(320px, 420px) auto;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-inline-filters__actions {
  justify-content: flex-start;
}

.detail-tab-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.detail-tab-toolbar h4 {
  margin: 0;
  color: #101828;
  font-size: 15px;
}

.detail-tab-toolbar p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 12px;
}

.detail-filter-grid {
  margin-bottom: 16px;
}

.detail-summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.detail-summary-chip {
  padding: 14px 16px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.92);
}

.detail-summary-chip span {
  color: #667085;
  font-size: 12px;
}

.detail-summary-chip strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 20px;
}

.editor-summary-strip {
  margin-bottom: 16px;
}

.toolbar,
.detail-toolbar {
  margin-bottom: 16px;
}

.toolbar--between,
.detail-toolbar--split {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.rule-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.rule-tree-card {
  position: relative;
  padding: 18px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 18px;
  background: #fff;
  max-height: 560px;
  overflow: hidden;
}

.rule-tree-card.is-collapsed {
  padding-bottom: 8px;
}

.rule-tree-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.rule-tree-card__header h4 {
  margin: 0;
}

.rule-tree-card__header p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 12px;
}

.rule-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rule-tree-node__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.rule-tree-node__label > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-shell__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.rule-shell__card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 18px;
  background: #fff;
  padding: 16px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.rule-result-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.rule-result-header h4 {
  margin: 0;
  color: #101828;
  font-size: 15px;
}

.rule-result-header p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 12px;
}

.panel--rule-config {
  position: relative;
}

.rule-tree-card :deep(.ant-tree) {
  max-height: 470px;
  overflow: auto;
  padding-right: 6px;
}

.rule-tree-card__shrink {
  position: absolute;
  top: 40%;
  right: -14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 40px;
  border-radius: 0 12px 12px 0;
  background: rgba(24, 43, 80, 0.24);
  color: #fff;
  cursor: pointer;
  z-index: 2;
}

.rule-context-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.back-link {
  padding-left: 0;
}

.run-detail {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
}

.run-detail__sider {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.run-rule-card {
  padding: 14px;
  cursor: pointer;
}

.run-rule-card.is-active {
  border-color: rgba(14, 165, 233, 0.28);
}

.run-rule-card__meta,
.run-rule-card__desc {
  color: #667085;
  font-size: 12px;
}

.run-rule-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.run-rule-card__title {
  margin: 6px 0;
  color: #101828;
  font-weight: 600;
}

.run-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.run-info-item {
  padding: 12px 14px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.92);
}

.run-info-item span {
  display: block;
  color: #667085;
  font-size: 12px;
}

.run-info-item strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 14px;
  line-height: 1.5;
}

.alarm-cell,
.probe-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stack-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stack-cell span {
  color: #667085;
  font-size: 12px;
}

.stack-cell strong {
  color: #101828;
  font-size: 14px;
}

.status-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #667085;
}

.status-inline.is-enabled {
  color: #389e0d;
}

.sub-panel {
  margin-top: 16px;
  padding: 16px;
}

.sub-panel h4 {
  margin: 0 0 12px;
}

.step-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #101828;
  font-size: 15px;
  font-weight: 600;
}

.step-panel__title span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #1677ff;
  color: #fff;
  font-size: 13px;
}

.plain-value {
  min-height: 32px;
  padding: 4px 0;
  color: #101828;
}

.subtle-count {
  color: #667085;
  font-size: 13px;
}

.editor-inline-alert {
  margin-bottom: 16px;
}

.threshold-editor {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.threshold-editor__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #475467;
}

.threshold-editor__label::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #cd201f;
}

.run-test-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.run-test-modal p {
  margin: 0;
  color: #101828;
}

.run-test-modal__actions {
  display: flex;
  justify-content: flex-end;
}

.run-test-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
  color: #101828;
}

.run-test-modal__footer :deep(.anticon) {
  color: #52c41a;
}

.rule-template-drawer {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  min-height: 540px;
}

.rule-template-drawer__sider,
.rule-template-drawer__content {
  padding: 16px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.template-card {
  padding: 14px;
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 14px;
  cursor: pointer;
}

.template-card.is-active {
  border-color: rgba(14, 165, 233, 0.3);
  box-shadow: 0 12px 24px rgba(14, 165, 233, 0.12);
}

.template-card strong,
.template-card span {
  display: block;
}

.template-card span {
  margin-top: 6px;
  color: #667085;
  font-size: 12px;
}

.detail-cards--template {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.rule-filter-actions--full {
  grid-column: 1 / -1;
}

.grid-full {
  grid-column: 1 / -1;
}

.monitor-rule-row--warning {
  background: rgba(255, 244, 229, 0.58);
}

.monitor-rule-row--error {
  background: rgba(254, 242, 242, 0.9);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.form-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dual-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.compare-card {
  padding: 16px;
}

.compare-card h4 {
  margin: 0 0 12px;
}

.sticky-actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -10px 28px rgba(15, 23, 42, 0.08);
}

.link-more {
  color: #1677ff;
}

.code-block {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

@media (max-width: 960px) {
  .dqc-page {
    padding: 16px;
  }

  .dqc-page__hero,
  .workspace,
  .rule-shell,
  .rule-template-drawer,
  .run-detail,
  .dual-panel,
  .detail-page__header,
  .detail-inline-filters,
  .detail-summary-strip,
  .run-info-grid,
  .dqc-page__stats,
  .detail-cards,
  .filter-grid--3,
  .filter-grid--4,
  .form-grid--2 {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
