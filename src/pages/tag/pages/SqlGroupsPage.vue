<template>
  <div class="tag-page">
    <a-form :model="filters" layout="inline" class="tag-search-card">
      <a-form-item label="人群编码">
        <a-input v-model:value="filters.sqlGroupCode" allow-clear placeholder="请输入 SQL 人群编码" style="width: 180px" />
      </a-form-item>
      <a-form-item label="人群名称">
        <a-input v-model:value="filters.name" allow-clear placeholder="请输入 SQL 人群名称" style="width: 180px" />
      </a-form-item>
      <a-form-item label="负责人">
        <a-input v-model:value="filters.ownerName" allow-clear placeholder="请输入负责人" style="width: 160px" />
      </a-form-item>
      <a-form-item label="状态">
        <a-select v-model:value="filters.status" allow-clear :options="statusOptions" style="width: 140px" />
      </a-form-item>
      <a-form-item label="推送系统">
        <a-select v-model:value="filters.application" allow-clear :options="applicationOptions" style="width: 150px" />
      </a-form-item>
      <a-form-item label="创建人">
        <a-input v-model:value="filters.creatorName" allow-clear placeholder="请输入创建人" style="width: 160px" />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button @click="handleReset">重置</a-button>
          <a-button type="primary" @click="fetchData">搜索</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <div class="tag-page__toolbar">
      <a-space>
        <a-button type="primary" @click="openEditDrawer()">新建</a-button>
        <a-button @click="fetchData">刷新</a-button>
      </a-space>
    </div>

    <a-table
      :data-source="list"
      :columns="columns"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1680 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-space direction="vertical" :size="4">
            <a-tag :color="record.status === 'ENABLE' ? 'green' : 'default'">
              {{ statusLabelMap[record.status] }}
            </a-tag>
            <span class="runtime-label" :class="`runtime-label--${(record.runtimeStatus || 'IDLE').toLowerCase()}`">
              {{ runtimeStatusLabelMap[record.runtimeStatus || 'IDLE'] }}
            </span>
          </a-space>
        </template>
        <template v-else-if="column.key === 'maxExecuteTime'">
          {{ record.maxExecuteTime }} 小时
        </template>
        <template v-else-if="column.key === 'permission'">
          <a-space wrap>
            <a-tag v-for="item in record.permission" :key="item">{{ permissionLabelMap[item] || item }}</a-tag>
          </a-space>
        </template>
        <template v-else-if="column.key === 'op'">
          <a-space wrap>
            <a-button size="small" @click="openDetail(record)">查看详情</a-button>
            <a-button size="small" type="primary" :disabled="!record.permission.includes('edit')" @click="openEditDrawer(record)">编辑</a-button>
            <a-button
              v-if="record.status !== 'ENABLE'"
              size="small"
              :disabled="!record.permission.includes('push')"
              @click="openStatusModal(record, 'startPush')"
            >
              启用推送
            </a-button>
            <a-button
              v-else
              size="small"
              :disabled="!record.permission.includes('push')"
              @click="openStatusModal(record, 'stopPush')"
            >
              停止推送
            </a-button>
            <a-button
              size="small"
              :disabled="record.status !== 'ENABLE' || !record.permission.includes('execute')"
              @click="openExecute(record)"
            >
              立即推送
            </a-button>
            <a-button size="small" @click="openSample(record)">抽样检查</a-button>
            <a-dropdown>
              <a-button size="small">
                更多
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="transfer" @click="openTransfer(record)">转让负责人</a-menu-item>
                  <a-menu-item key="copy" @click="copyRecord(record)">复制</a-menu-item>
                  <a-menu-item key="export" @click="openExport(record)">导出</a-menu-item>
                  <a-menu-item key="delete" :disabled="!record.permission.includes('delete')" @click="openDelete(record)">删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-drawer v-model:open="editOpen" :title="editTitle" placement="right" width="100%" :closable="false" class="sql-edit-drawer">
      <div class="fullscreen-page">
        <div class="fullscreen-page__header">
          <div class="fullscreen-page__titlebar">
            <a-button type="link" class="fullscreen-page__back" @click="handleCancelEdit">{{ form.id ? '编辑人群' : '新建人群' }}</a-button>
            <span class="fullscreen-page__subtitle">按基础信息、SQL 校验和推送规则三步完成配置</span>
          </div>
        </div>

        <div class="fullscreen-page__steps card-shell">
          <a-steps :current="editStep">
            <a-step title="输入人群信息" />
            <a-step title="编写SQL代码" />
            <a-step title="设置计算及推送规则" />
          </a-steps>
        </div>

        <div class="fullscreen-page__body">
          <section v-show="editStep === 0" class="step-panel">
            <div class="form-card card-shell">
              <div class="card-title">基础信息</div>
              <a-form layout="vertical">
                <div class="edit-grid">
                  <a-form-item label="人群ID" required>
                    <a-input v-model:value="form.sqlGroupCode" placeholder="请输入人群ID" />
                  </a-form-item>
                  <a-form-item label="人群名称" required>
                    <a-input v-model:value="form.name" placeholder="请输入人群名称" />
                  </a-form-item>
                  <a-form-item label="人群包类型">
                    <a-select v-model:value="form.groupType" :options="groupTypeOptions" />
                  </a-form-item>
                  <a-form-item label="负责人">
                    <a-input v-model:value="form.ownerName" placeholder="请输入负责人" />
                  </a-form-item>
                  <a-form-item label="组织架构">
                    <a-cascader
                      v-model:value="form.parentIdPath"
                      :options="categoryOptions"
                      :field-names="{ label: 'label', value: 'value', children: 'children' }"
                      change-on-select
                      allow-clear
                    />
                  </a-form-item>
                  <a-form-item label="标签ID">
                    <a-select v-model:value="form.ruleCodes" mode="multiple" :options="ruleOptions" placeholder="可多选标签 ID" />
                  </a-form-item>
                  <a-form-item label="人群描述" class="grid-span-2">
                    <a-textarea v-model:value="form.desc" :rows="4" placeholder="请输入人群描述" />
                  </a-form-item>
                </div>
              </a-form>
            </div>

            <div class="form-card card-shell">
              <div class="card-title">权限范围</div>
              <a-form layout="vertical">
                <a-form-item label="员工可见范围">
                  <a-table :data-source="shareUserRows" :columns="shareColumns" :pagination="false" row-key="key" size="small">
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'user'">
                        <a-select v-model:value="record.user" show-search :options="transferOwnerOptions" style="width: 180px" />
                      </template>
                      <template v-else-if="column.key === 'editable'">
                        <a-checkbox v-model:checked="record.editable" />
                      </template>
                      <template v-else-if="column.key === 'push'">
                        <a-checkbox v-model:checked="record.push" />
                      </template>
                      <template v-else-if="column.key === 'execute'">
                        <a-checkbox v-model:checked="record.execute" />
                      </template>
                      <template v-else-if="column.key === 'notify'">
                        <a-checkbox v-model:checked="record.notify" />
                      </template>
                      <template v-else-if="column.key === 'op'">
                        <a-button danger type="link" @click="removeShareUserRow(record.key)">删除</a-button>
                      </template>
                    </template>
                  </a-table>
                  <a-button type="link" class="inline-link" @click="appendShareUserRow">+ 添加可见人员</a-button>
                </a-form-item>
                <a-form-item label="系统可见范围">
                  <a-select v-model:value="form.shareePlat" mode="multiple" :options="applicationOptions" placeholder="请选择可访问系统" />
                  <div class="field-hint">注：此处添加的系统，后续可以通过 API 接口查询到该 SQL 人群。</div>
                </a-form-item>
              </a-form>
            </div>
          </section>

          <section v-show="editStep === 1" class="step-panel step-panel--sql">
            <div class="sql-reminder card-shell">
              <div class="sql-reminder__item"><span class="sql-reminder__label">SQL人群使用手册：</span><span class="sql-reminder__link">SQL人群</span></div>
              <div class="sql-reminder__item"><span class="sql-reminder__label">提醒1：</span>建议先在探索分析中完成 SQL 调试，确认无误后再复制到当前工作区。</div>
              <div class="sql-reminder__item"><span class="sql-reminder__label">提醒2：</span>当前通道仅支持接收当前区域下游系统，请注意 SQL 结果表产出范围。</div>
              <div class="sql-reminder__item"><span class="sql-reminder__label">提醒3：</span>SQL 代码仅支持引用白名单范围内的数据表，如需新增请先申请白名单。</div>
            </div>
            <div class="sql-layout">
              <div class="sql-layout__left card-shell">
                <div class="editor-shell__header">
                  <div class="panel-title">白名单库表查询</div>
                  <a-button type="link" class="inline-link" @click="databaseRangeOpen = true">可用数据库范围</a-button>
                </div>
                <div class="search-box">
                  <a-input v-model:value="databaseKeyword" placeholder="输入库名或表名查询" />
                </div>
                <div class="scope-list">
                  <div
                    v-for="item in filteredDatabaseScopeList"
                    :key="item"
                    class="scope-list__item"
                    @click="insertDatabase(item)"
                  >
                    {{ item }}
                  </div>
                </div>
              </div>
              <div class="sql-layout__editor">
                <div class="editor-shell card-shell">
                  <div class="editor-shell__header">
                    <div class="panel-title">编写代码</div>
                    <a-space>
                      <a-button @click="insertSqlTemplate('where')">插入 WHERE 模板</a-button>
                      <a-button @click="insertSqlTemplate('join')">插入 JOIN 模板</a-button>
                      <a-button type="primary" ghost @click="formatSql">格式化</a-button>
                      <a-button type="primary" @click="checkSql">校验</a-button>
                    </a-space>
                  </div>
                  <CodeEditor v-model="sqlText" language="sql" :height="430" />
                </div>
                <div class="result-shell card-shell">
                  <div class="panel-title">校验查询</div>
                  <div class="result-summary">
                    <a-tag :color="sqlCheckPassed ? 'green' : 'orange'">{{ sqlCheckPassed ? '校验通过' : '待校验' }}</a-tag>
                    <span>识别到 {{ sqlValidation.tableCount }} 个库表引用</span>
                    <span>识别到 {{ sqlValidation.selectFieldCount }} 个输出字段</span>
                  </div>
                  <div class="sql-check-tip" :class="{ 'is-success': sqlCheckPassed }">
                    {{ sqlCheckMessage }}
                  </div>
                  <a-table
                    :data-source="sqlValidation.rows"
                    :pagination="false"
                    :columns="validationColumns"
                    size="small"
                    row-key="key"
                  />
                </div>
              </div>
              <div class="sql-layout__side">
                <div class="form-card card-shell side-card">
                  <div class="panel-title">结果表配置</div>
                  <a-form layout="vertical">
                    <a-form-item label="库名">
                      <a-select v-model:value="form.dbName" :options="dbOptions" />
                    </a-form-item>
                    <a-form-item label="表名">
                      <a-input v-model:value="form.tableName" placeholder="请输入结果表名" />
                    </a-form-item>
                    <a-form-item label="推送属性">
                      <a-select v-model:value="form.metricsCode" mode="multiple" :options="metricOptions" placeholder="请选择推送属性" />
                    </a-form-item>
                  </a-form>
                </div>
              </div>
            </div>
          </section>

          <section v-show="editStep === 2" class="step-panel">
            <div class="rule-box card-shell">
              <div class="card-title">计算规则</div>
              <a-form layout="vertical">
                <div class="edit-grid">
                  <a-form-item label="推送时间" required>
                    <a-select v-model:value="form.timing" :options="timingOptions" />
                  </a-form-item>
                  <a-form-item label="开始计算时间" required>
                    <a-select v-model:value="form.execTime" :options="execTimeOptions" />
                  </a-form-item>
                  <a-form-item label="最大计算时长（小时）">
                    <a-input-number v-model:value="form.maxExecuteTime" :min="1" :max="24" style="width: 100%" />
                  </a-form-item>
                  <a-form-item label="状态">
                    <a-select v-model:value="form.status" :options="statusOptions" />
                  </a-form-item>
                </div>
                <a-alert
                  type="warning"
                  show-icon
                  :message="`计算完成后会${form.status === 'ENABLE' ? '立即推送' : '暂不推送'}，请结合业务时效设置开始计算时间和最大计算时长。`"
                />
                <div v-if="form.status !== 'ENABLE'" class="rule-box__tip">注：未启用推送时，“开始计算时间”仅作为预设计划展示，实际下游不会收到推送。</div>
                <div class="rule-box__tip">注：计算完成后会立即推送，建议根据业务时效灵活设置开始计算时间和最大计算时长。</div>
              </a-form>
            </div>
            <div class="rule-box card-shell">
              <div class="card-title">DQC规则</div>
              <div class="dqc-box">
                <a-checkbox checked disabled>
                  唯一性校验
                  <span class="dqc-box__hint">（即用户ID唯一性校验，避免出现重复ID）</span>
                </a-checkbox>
                <div class="dqc-box__row">
                  <a-checkbox v-model:checked="countCheck.enabled">
                    数量校验
                    <span class="dqc-box__hint">（统计人群数量是否在预期范围内）</span>
                  </a-checkbox>
                  <div v-if="countCheck.enabled" class="dqc-box__inline">
                    <span>最小值</span>
                    <a-input v-model:value="countCheck.min" style="width: 120px" />
                    <span>最大值</span>
                    <a-input v-model:value="countCheck.max" style="width: 120px" />
                  </div>
                </div>
                <div class="dqc-box__row">
                  <a-checkbox v-model:checked="specialIdCheck.enabled">
                    特殊ID校验
                    <span class="dqc-box__hint">（某些ID必须出现或必须不出现）</span>
                  </a-checkbox>
                  <div v-if="specialIdCheck.enabled" class="dqc-box__textarea">
                    <a-radio-group v-model:value="specialIdCheck.mode">
                      <a-radio :value="'include'">下述ID必须有</a-radio>
                      <a-radio :value="'exclude'">下述ID必须没有</a-radio>
                    </a-radio-group>
                    <a-textarea v-model:value="specialIdCheck.userIds" :rows="3" placeholder="请输入ID，多个ID之间用英文逗号分隔" />
                  </div>
                </div>
              </div>
            </div>
            <div class="rule-box card-shell">
              <div class="card-title">消息通知</div>
              <a-form layout="vertical">
                <a-form-item label="通知人">
                  <a-select v-model:value="notifyUsers" mode="tags" :options="transferOwnerOptions" placeholder="请输入通知人" />
                </a-form-item>
              </a-form>
            </div>
            <div class="rule-box card-shell">
              <div class="card-title">推送规则</div>
              <a-form layout="vertical">
                <div class="edit-grid">
                  <a-form-item label="推送系统" required>
                    <a-select v-model:value="form.application" :options="applicationOptions" />
                  </a-form-item>
                  <a-form-item label="系统可见范围">
                    <a-select v-model:value="form.shareePlat" mode="multiple" :options="applicationOptions" />
                  </a-form-item>
                </div>
              </a-form>
            </div>
          </section>
        </div>

        <div class="fullscreen-page__footer">
          <a-space>
            <a-button v-if="editStep < 2" type="primary" @click="handleNextStep">下一步</a-button>
            <a-button v-if="editStep > 0" @click="editStep -= 1">上一步</a-button>
            <a-button v-else type="primary" :loading="saving" @click="handleSave">保存</a-button>
            <a-button @click="handleCancelEdit">取消</a-button>
          </a-space>
        </div>
      </div>
    </a-drawer>

    <a-modal v-model:open="cancelConfirmOpen" :title="form.id ? '取消编辑人群' : '取消新建人群'" @ok="confirmCancelEdit">
      <p>人群{{ form.id ? '编辑' : '新建' }}未完成，取消后所有配置信息不会保存。</p>
    </a-modal>

    <a-modal v-model:open="databaseRangeOpen" title="可用数据库范围" :footer="null" width="700px">
      <div class="database-range">
        <a-tag v-for="item in databaseScopeList" :key="item" color="blue">{{ item }}</a-tag>
      </div>
    </a-modal>

    <a-modal v-model:open="statusConfirmOpen" :title="statusAction === 'startPush' ? '启用推送' : '停止推送'" @ok="handleStatusConfirm">
      <p v-if="statusAction === 'startPush'">该人群启用推送后，下游推送系统将定期接收到该人群。</p>
      <p v-else>该人群停止推送任务后，下游推送系统将不再接收到该人群。</p>
    </a-modal>

    <a-modal v-model:open="executeOpen" title="立即推送" width="720px" @ok="handleExecuteConfirm">
      <a-radio-group v-model:value="executeMode">
        <a-space direction="vertical">
          <a-radio value="EXECUTE">仅计算（重新计算生成人群，但不向下游系统推送）</a-radio>
          <a-radio value="PUSH" :disabled="!currentRecord?.pushStatus">仅推送（将当前人群向下游系统推送）</a-radio>
          <a-radio value="ALL" :disabled="!currentRecord?.pushStatus">计算及推送（重新计算生成人群，并向下游系统推送）</a-radio>
        </a-space>
      </a-radio-group>
      <a-alert type="warning" show-icon style="margin-top: 16px" message="请尽量避开 0 点到 7 点执行立即推送，以免与依赖数据计算冲突。" />
    </a-modal>

    <a-modal v-model:open="sampleOpen" title="抽样检查" width="720px" ok-text="查询" @ok="handleSampleConfirm">
      <a-descriptions :column="2" bordered size="small" style="margin-bottom: 12px">
        <a-descriptions-item label="人群名称">{{ currentRecord?.name }}</a-descriptions-item>
        <a-descriptions-item label="当前人数">{{ currentRecord?.cnt }}</a-descriptions-item>
      </a-descriptions>
      <a-textarea v-model:value="sampleIds" placeholder="请输入ID，多个ID之间用英文逗号分隔" :rows="4" />
      <a-textarea v-model:value="sampleResult" style="margin-top: 16px" :rows="6" disabled />
    </a-modal>

    <a-modal v-model:open="transferOpen" title="转让负责人" @ok="handleTransferConfirm">
      <a-form layout="vertical">
        <a-form-item label="当前负责人">
          <a-input :value="currentRecord?.ownerName" disabled />
        </a-form-item>
        <a-form-item label="新负责人">
          <a-select v-model:value="transferOwner" show-search :options="transferOwnerOptions" placeholder="请选择负责人" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="exportOpen" title="导出 SQL 人群" width="760px" @ok="handleExportConfirm">
      <a-form layout="vertical">
        <div class="edit-grid">
          <a-form-item label="导出格式">
            <a-select v-model:value="exportForm.format" :options="exportFormatOptions" />
          </a-form-item>
          <a-form-item label="导出条数">
            <a-select v-model:value="exportForm.limit" :options="exportLimitOptions" />
          </a-form-item>
          <a-form-item label="包含 SQL">
            <a-switch v-model:checked="exportForm.includeSql" checked-children="是" un-checked-children="否" />
          </a-form-item>
        </div>
      </a-form>
      <a-alert type="info" show-icon message="已生成当前 SQL 人群导出内容，可直接查看结果预览。" style="margin-bottom: 16px" />
      <a-descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
        <a-descriptions-item label="导出格式">{{ exportForm.format }}</a-descriptions-item>
        <a-descriptions-item label="导出条数">{{ exportForm.limit === 0 ? '全部' : exportForm.limit }}</a-descriptions-item>
      </a-descriptions>
      <pre class="export-preview">{{ exportContent }}</pre>
    </a-modal>

    <a-modal v-model:open="deleteOpen" title="删除人群" @ok="handleDeleteConfirm">
      <p>删除后当前人群配置将不可恢复。</p>
      <p>当前人群：{{ currentRecord?.name }}</p>
    </a-modal>

    <a-modal v-model:open="historyCompareOpen" title="历史版本对比" width="860px" :footer="null">
      <a-table :data-source="historyCompareRows" :columns="historyCompareColumns" :pagination="false" row-key="field" size="small" />
    </a-modal>

    <a-modal v-model:open="taskDetailOpen" title="任务详情" :footer="null" width="760px">
      <template v-if="currentTaskDetail">
        <div class="sql-task-overview">
          <div class="sql-task-overview__item">
            <span>任务类型</span>
            <strong>{{ currentTaskDetail.taskType || '-' }}</strong>
          </div>
          <div class="sql-task-overview__item">
            <span>任务状态</span>
            <strong>
              <a-tag :color="taskStatusColor(currentTaskDetail.status)">
                {{ taskStatusLabelMap[currentTaskDetail.status || 'PENDING'] || currentTaskDetail.status || '-' }}
              </a-tag>
            </strong>
          </div>
          <div class="sql-task-overview__item">
            <span>执行时间</span>
            <strong>{{ currentTaskDetail.executeTime || '-' }}</strong>
          </div>
          <div class="sql-task-overview__item">
            <span>操作人</span>
            <strong>{{ currentTaskDetail.operator || '-' }}</strong>
          </div>
        </div>
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="人群编码">{{ currentTaskDetail.sqlGroupCode || '-' }}</a-descriptions-item>
          <a-descriptions-item label="执行模式">{{ currentTaskDetail.mode || '-' }}</a-descriptions-item>
          <a-descriptions-item label="推送时间">{{ currentTaskDetail.timing || '-' }}</a-descriptions-item>
          <a-descriptions-item label="开始计算时间">{{ currentTaskDetail.execTime || '-' }}</a-descriptions-item>
          <a-descriptions-item label="推送系统">{{ currentTaskDetail.application || '-' }}</a-descriptions-item>
          <a-descriptions-item label="推送开关">{{ currentTaskDetail.pushStatus ? '已开启' : '未开启' }}</a-descriptions-item>
          <a-descriptions-item label="推送属性" :span="2">{{ Array.isArray(currentTaskDetail.metricsCode) ? currentTaskDetail.metricsCode.join(', ') : '-' }}</a-descriptions-item>
          <a-descriptions-item label="通知人" :span="2">{{ Array.isArray(currentTaskDetail.notifyUsers) ? currentTaskDetail.notifyUsers.join(', ') : '-' }}</a-descriptions-item>
        </a-descriptions>
      </template>
    </a-modal>

    <a-drawer v-model:open="detailOpen" title="SQL人群详情" width="980px">
      <a-tabs v-model:activeKey="detailTab">
        <a-tab-pane key="base" tab="基本信息">
            <a-descriptions :column="2" bordered size="small">
              <a-descriptions-item label="编码">{{ currentRecord?.sqlGroupCode }}</a-descriptions-item>
              <a-descriptions-item label="名称">{{ currentRecord?.name }}</a-descriptions-item>
              <a-descriptions-item label="状态">{{ statusLabelMap[currentRecord?.status || 'DISABLE'] }}</a-descriptions-item>
              <a-descriptions-item label="运行态">{{ runtimeStatusLabelMap[currentRecord?.runtimeStatus || 'IDLE'] }}</a-descriptions-item>
              <a-descriptions-item label="人群包类型">{{ currentRecord?.groupType || '-' }}</a-descriptions-item>
            <a-descriptions-item label="负责人">{{ currentRecord?.ownerName }}</a-descriptions-item>
            <a-descriptions-item label="当前人数">{{ currentRecord?.cnt }}</a-descriptions-item>
            <a-descriptions-item label="标签ID">{{ currentRecord?.ruleCodes?.join(', ') || '/' }}</a-descriptions-item>
            <a-descriptions-item label="推送系统">{{ currentRecord?.application }}</a-descriptions-item>
            <a-descriptions-item label="人群描述" :span="2">{{ currentRecord?.desc || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="history" tab="历史记录">
          <div class="detail-history__toolbar">
            <a-button type="primary" :disabled="selectedHistoryKeys.length !== 2" @click="openHistoryCompare">对比</a-button>
            <span class="detail-history__tip">请选择两项作为对比</span>
          </div>
          <a-table
            :data-source="historyRows"
            :columns="historyColumns"
            :pagination="false"
            row-key="id"
            size="small"
            :row-selection="{ selectedRowKeys: selectedHistoryKeys, onChange: onHistorySelectChange }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'ENABLE' ? 'green' : 'default'">
                  {{ statusLabelMap[record.status] }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="task" tab="任务记录">
          <a-table :data-source="taskRows" :columns="taskColumns" :pagination="false" row-key="id" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="taskStatusColor(record.status)">
                  {{ taskStatusLabelMap[record.status] || record.status }}
                </a-tag>
              </template>
              <template v-if="column.key === 'detail'">
                <a-button size="small" @click="openTaskDetail(record)">查看细节</a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="other" tab="其他信息">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="员工可见范围">{{ currentRecord?.shareeUsers?.join(', ') || '/' }}</a-descriptions-item>
            <a-descriptions-item label="系统可见范围">{{ currentRecord?.shareePlat?.join(', ') || '/' }}</a-descriptions-item>
            <a-descriptions-item label="推送属性">{{ currentRecord?.metricsCode?.join(', ') || '/' }}</a-descriptions-item>
            <a-descriptions-item label="最大执行时长">{{ currentRecord?.maxExecuteTime }} 小时</a-descriptions-item>
            <a-descriptions-item label="创建人">{{ currentRecord?.creatorName }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ currentRecord?.createTime }}</a-descriptions-item>
            <a-descriptions-item label="更新时间">{{ currentRecord?.updateTime }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="sql" tab="SQL详情">
          <CodeEditor :model-value="currentRecord?.sqlText || ''" language="sql" :height="380" readonly />
        </a-tab-pane>
      </a-tabs>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { message } from 'ant-design-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import TagApi, { type CategoryNode, type MetricItem, type RuleTagItem, type SqlGroupItem } from '@/resources/tag';
import { safeClone } from '@/utils/safe-clone';
import CodeEditor from '@/components/CodeEditor.vue';

type EditFormState = Partial<SqlGroupItem> & {
  parentIdPath?: string[];
};

type ShareUserRow = {
  key: string;
  user: string;
  editable: boolean;
  push: boolean;
  execute: boolean;
  notify: boolean;
};

type HistoryRow = {
  id: string;
  version: string;
  updateTime: string;
  operator: string;
  status: SqlGroupItem['status'];
  timing: string;
  cnt: number;
};

type TaskRow = {
  id: string;
  taskType: string;
  status: string;
  executeTime: string;
  operator: string;
  detail: TaskDetailState;
};

type TaskDetailState = {
  taskType?: string;
  status?: string;
  executeTime?: string;
  operator?: string;
  sqlGroupCode?: string;
  mode?: string;
  timing?: string;
  execTime?: string;
  metricsCode?: string[];
  application?: string;
  pushStatus?: boolean;
  notifyUsers?: string[];
};

const loading = ref(false);
const saving = ref(false);
const editOpen = ref(false);
const cancelConfirmOpen = ref(false);
const detailOpen = ref(false);
const statusConfirmOpen = ref(false);
const executeOpen = ref(false);
const sampleOpen = ref(false);
const transferOpen = ref(false);
const exportOpen = ref(false);
const deleteOpen = ref(false);
const historyCompareOpen = ref(false);
const taskDetailOpen = ref(false);
const databaseRangeOpen = ref(false);
const editStep = ref(0);
const detailTab = ref('base');
const list = ref<SqlGroupItem[]>([]);
const currentRecord = ref<SqlGroupItem | null>(null);
const metricsList = ref<MetricItem[]>([]);
const rulesList = ref<RuleTagItem[]>([]);
const categoryTree = ref<CategoryNode | null>(null);
const shareUserRows = ref<ShareUserRow[]>([]);
const notifyUsers = ref<string[]>([]);
const sqlText = ref('');
const databaseKeyword = ref('');
const exportContent = ref('');
const sampleIds = ref('');
const sampleResult = ref('');
const transferOwner = ref('');
const selectedHistoryKeys = ref<string[]>([]);
const historyRows = ref<HistoryRow[]>([]);
const taskRows = ref<TaskRow[]>([]);
const currentTaskDetail = ref<TaskDetailState | null>(null);
const executeMode = ref<'EXECUTE' | 'PUSH' | 'ALL'>('EXECUTE');
const statusAction = ref<'startPush' | 'stopPush'>('startPush');
const sqlCheckPassed = ref(false);
const sqlCheckMessage = ref('请先执行 SQL 校验，校验通过后才可继续下一步。');

const filters = reactive({
  sqlGroupCode: '',
  name: '',
  ownerName: '',
  status: undefined as string | undefined,
  application: undefined as string | undefined,
  creatorName: '',
});

const form = reactive<EditFormState>({
  sqlGroupCode: '',
  name: '',
  desc: '',
  groupType: '动态人群',
  ownerName: 'demo_user',
  creatorName: 'demo_user',
  status: 'DISABLE',
  maxExecuteTime: 4,
  application: 'barrett',
  shareePlat: ['barrett'],
  shareeUsers: ['demo_user'],
  ruleCodes: [],
  metricsCode: [],
  timing: '每天',
  execTime: '07:00',
  dbName: 'ec_user_tag',
  tableName: 'user_profile_di',
  parentIdPath: [],
});

const exportForm = reactive({
  format: 'CSV',
  limit: 100,
  includeSql: true,
});

const countCheck = reactive({
  enabled: false,
  min: '',
  max: '',
});

const specialIdCheck = reactive({
  enabled: false,
  mode: 'include' as 'include' | 'exclude',
  userIds: '',
});

const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

const columns = [
  { title: '编码', dataIndex: 'sqlGroupCode', key: 'sqlGroupCode', width: 150 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '状态', key: 'status', width: 110 },
  { title: '最大执行时长', key: 'maxExecuteTime', width: 130 },
  { title: '人数', dataIndex: 'cnt', key: 'cnt', width: 100 },
  { title: '推送系统', dataIndex: 'application', key: 'application', width: 120 },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '负责人', dataIndex: 'ownerName', key: 'ownerName', width: 120 },
  { title: '创建人', dataIndex: 'creatorName', key: 'creatorName', width: 120 },
  { title: '权限', key: 'permission', width: 260 },
  { title: '操作', key: 'op', width: 430, fixed: 'right' as const },
];

const shareColumns = [
  { title: '用户', key: 'user', width: 220 },
  { title: '可编辑', key: 'editable', width: 90 },
  { title: '可推送', key: 'push', width: 90 },
  { title: '可执行', key: 'execute', width: 90 },
  { title: '通知', key: 'notify', width: 90 },
  { title: '操作', key: 'op', width: 80 },
];

const historyColumns = [
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
  { title: '更新人', dataIndex: 'operator', key: 'operator' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '推送时间', dataIndex: 'timing', key: 'timing' },
  { title: '人数', dataIndex: 'cnt', key: 'cnt' },
];

const historyCompareColumns = [
  { title: '字段', dataIndex: 'field', key: 'field' },
  { title: '版本 A', dataIndex: 'left', key: 'left' },
  { title: '版本 B', dataIndex: 'right', key: 'right' },
];

const taskColumns = [
  { title: '任务类型', dataIndex: 'taskType', key: 'taskType' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '执行时间', dataIndex: 'executeTime', key: 'executeTime' },
  { title: '操作人', dataIndex: 'operator', key: 'operator' },
  { title: '细节', key: 'detail', width: 120 },
];

const statusLabelMap: Record<string, string> = {
  ENABLE: '有效',
  DISABLE: '无效',
};

const runtimeStatusLabelMap: Record<string, string> = {
  IDLE: '空闲',
  RUNNING: '计算中',
  WAITING: '等待执行',
  PUSHING: '推送中',
};

const taskStatusLabelMap: Record<string, string> = {
  SUCCESS: '成功',
  SKIPPED: '跳过',
  PENDING: '等待中',
  RUNNING: '运行中',
};

const permissionLabelMap: Record<string, string> = {
  edit: '编辑',
  push: '推送',
  execute: '执行',
  delete: '删除',
};

const applicationOptions = ['barrett', 'apollo', 'odin'].map((value) => ({ label: value, value }));
const groupTypeOptions = ['静态人群', '动态人群'].map((value) => ({ label: value, value }));
const timingOptions = ['每天', '每周一', '每周三', '每月1日', '每小时'].map((value) => ({ label: value, value }));
const execTimeOptions = ['06:00', '07:00', '08:00', '08:30', '09:00', '12:00'].map((value) => ({ label: value, value }));
const statusOptions = Object.entries(statusLabelMap).map(([value, label]) => ({ value, label }));
const exportFormatOptions = [
  { label: 'CSV', value: 'CSV' },
  { label: 'TXT', value: 'TXT' },
];
const exportLimitOptions = [
  { label: '100 条', value: 100 },
  { label: '1000 条', value: 1000 },
  { label: '全部', value: 0 },
];
const transferOwnerOptions = ['alice', 'bob', 'carol', 'demo_user', 'risk_bot', 'growth_bot', 'ops_bot'].map((value) => ({
  label: value,
  value,
}));
const databaseScopeList = ['ec_dwt', 'ec_dwd', 'ec_dim', 'ec_dm', 'id_market_operation', 'ec_user_tag'];
const dbOptions = databaseScopeList.map((value) => ({ label: value, value }));
const validationColumns = [
  { title: '检查项', dataIndex: 'label', key: 'label', width: 180 },
  { title: '结果', dataIndex: 'value', key: 'value' },
];

const metricOptions = computed(() =>
  metricsList.value.map((item) => ({
    label: `${item.metricsCode || item.code} / ${item.metricsName || item.name}`,
    value: item.metricsCode || item.code,
  })),
);

const ruleOptions = computed(() =>
  rulesList.value.map((item) => ({
    label: `${item.ruleCode || item.code} / ${item.ruleName || item.name}`,
    value: item.ruleCode || item.code,
  })),
);

const categoryOptions = computed(() => {
  const convert = (node: CategoryNode): { label: string; value: string; children?: ReturnType<typeof convert>[] } => ({
    label: node.metricsName,
    value: node.id,
    children: node.children?.map(convert),
  });
  return categoryTree.value ? [convert(categoryTree.value)] : [];
});

const historyCompareRows = computed(() => {
  const [leftId, rightId] = selectedHistoryKeys.value;
  const left = historyRows.value.find((item) => item.id === leftId);
  const right = historyRows.value.find((item) => item.id === rightId);
  if (!left || !right) return [];
  return [
    { field: '状态', left: statusLabelMap[left.status], right: statusLabelMap[right.status] },
    { field: '推送时间', left: left.timing, right: right.timing },
    { field: '人数', left: `${left.cnt}`, right: `${right.cnt}` },
    { field: '更新人', left: left.operator, right: right.operator },
  ];
});

const filteredDatabaseScopeList = computed(() => {
  const keyword = databaseKeyword.value.trim().toLowerCase();
  if (!keyword) return databaseScopeList;
  return databaseScopeList.filter((item) => item.toLowerCase().includes(keyword));
});

const sqlValidation = computed(() => {
  const text = sqlText.value || '';
  const tableMatches = text.match(/\b([a-zA-Z_][\w]*)\.([a-zA-Z_][\w]*)\b/g) || [];
  const selectPart = text.match(/select([\s\S]*?)from/i)?.[1] || '';
  const fieldCount = selectPart
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean).length;
  const rows = [
    { key: 'table', label: '库表引用', value: tableMatches.length ? Array.from(new Set(tableMatches)).join(', ') : '未识别到库表引用' },
    { key: 'field', label: '输出字段', value: fieldCount ? `${fieldCount} 个字段` : '未识别到输出字段' },
    { key: 'result', label: '结果表', value: `${form.dbName || '-'} . ${form.tableName || '-'}` },
  ];
  return {
    passed: tableMatches.length > 0 && fieldCount > 0 && !!form.tableName,
    tableCount: Array.from(new Set(tableMatches)).length,
    selectFieldCount: fieldCount,
    rows,
  };
});

const editTitle = computed(() => (form.id ? '编辑 SQL 人群' : '新建 SQL 人群'));

function buildHistoryRows(record: SqlGroupItem): HistoryRow[] {
  return [
    {
      id: `${record.id}-1`,
      version: 'V3',
      updateTime: record.updateTime,
      operator: record.ownerName,
      status: record.status,
      timing: `${record.timing || '-'} ${record.execTime || ''}`.trim(),
      cnt: record.cnt,
    },
    {
      id: `${record.id}-2`,
      version: 'V2',
      updateTime: record.createTime,
      operator: record.creatorName,
      status: record.status === 'ENABLE' ? 'DISABLE' : 'ENABLE',
      timing: '每天 08:00',
      cnt: Math.max(0, record.cnt - 200),
    },
  ];
}

function buildTaskRows(record: SqlGroupItem): TaskRow[] {
  const executeStatus =
    record.runtimeStatus === 'RUNNING'
      ? 'RUNNING'
      : record.runtimeStatus === 'WAITING'
        ? 'PENDING'
        : 'SUCCESS';
  const pushTaskStatus =
    record.runtimeStatus === 'PUSHING'
      ? 'RUNNING'
      : record.status === 'ENABLE'
        ? 'SUCCESS'
        : 'SKIPPED';
  return [
    {
      id: `${record.id}-execute`,
      taskType: '计算',
      status: executeStatus,
      executeTime: record.updateTime,
      operator: record.ownerName,
      detail: {
        taskType: '计算',
        status: executeStatus,
        executeTime: record.updateTime,
        operator: record.ownerName,
        sqlGroupCode: record.sqlGroupCode,
        mode: 'EXECUTE',
        timing: record.timing,
        execTime: record.execTime,
        metricsCode: record.metricsCode,
      },
    },
    {
      id: `${record.id}-push`,
      taskType: '推送',
      status: pushTaskStatus,
      executeTime: record.updateTime,
      operator: 'sql-engine',
      detail: {
        taskType: '推送',
        status: pushTaskStatus,
        executeTime: record.updateTime,
        operator: 'sql-engine',
        sqlGroupCode: record.sqlGroupCode,
        application: record.application,
        pushStatus: record.pushStatus,
        notifyUsers: record.notifyUsers,
      },
    },
  ];
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    sqlGroupCode: '',
    name: '',
    desc: '',
    groupType: '动态人群',
    ownerName: 'demo_user',
    creatorName: 'demo_user',
    status: 'DISABLE',
    maxExecuteTime: 4,
    application: 'barrett',
    shareePlat: ['barrett'],
    shareeUsers: ['demo_user'],
    ruleCodes: [],
    metricsCode: [],
    timing: '每天',
    execTime: '07:00',
    dbName: 'ec_user_tag',
    tableName: 'user_profile_di',
    parentIdPath: [],
  });
  notifyUsers.value = ['demo_user'];
  sqlText.value = "select user_id\nfrom ec_user_tag.user_profile_di\nwhere active_days_30 > 10";
  sqlCheckPassed.value = false;
  sqlCheckMessage.value = '请先执行 SQL 校验，校验通过后才可继续下一步。';
  countCheck.enabled = false;
  countCheck.min = '';
  countCheck.max = '';
  specialIdCheck.enabled = false;
  specialIdCheck.mode = 'include';
  specialIdCheck.userIds = '';
  shareUserRows.value = [
    { key: crypto.randomUUID(), user: 'demo_user', editable: true, push: true, execute: true, notify: true },
  ];
}

function patchFormFromRecord(record: SqlGroupItem) {
  Object.assign(form, safeClone(record), {
    parentIdPath: record.ruleCodes?.length ? ['cat-root', 'cat-growth'] : ['cat-root', 'cat-risk'],
  });
  notifyUsers.value = [...(record.notifyUsers || [])];
  sqlText.value = record.sqlText || '';
  shareUserRows.value = (record.shareeUsers || [record.ownerName]).map((user) => ({
    key: crypto.randomUUID(),
    user,
    editable: true,
    push: true,
    execute: true,
    notify: (record.notifyUsers || []).includes(user),
  }));
}

async function fetchBaseOptions() {
  const [metricsRes, rulesRes, categoryRes] = await Promise.all([
    TagApi.fetchMetrics({ pageNo: 1, pageSize: 200 }),
    TagApi.fetchRules({ pageNo: 1, pageSize: 200 }),
    TagApi.fetchCategoryTree(),
  ]);
  metricsList.value = metricsRes.items;
  rulesList.value = rulesRes.items;
  categoryTree.value = categoryRes;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await TagApi.fetchSqlGroups({
      sqlGroupCode: filters.sqlGroupCode || undefined,
      name: filters.name || undefined,
      ownerName: filters.ownerName || undefined,
      status: filters.status,
      application: filters.application,
      creatorName: filters.creatorName || undefined,
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    });
    list.value = res.items;
    pagination.total = res.total;
  } catch (error) {
    console.error(error);
    message.error('SQL 人群列表加载失败');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  filters.sqlGroupCode = '';
  filters.name = '';
  filters.ownerName = '';
  filters.status = undefined;
  filters.application = undefined;
  filters.creatorName = '';
  pagination.current = 1;
  fetchData();
}

function handleTableChange(pag: TablePaginationConfig) {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchData();
}

function appendShareUserRow() {
  shareUserRows.value.push({
    key: crypto.randomUUID(),
    user: '',
    editable: true,
    push: false,
    execute: false,
    notify: false,
  });
}

function removeShareUserRow(key: string) {
  shareUserRows.value = shareUserRows.value.filter((item) => item.key !== key);
}

function insertSqlTemplate(type: 'where' | 'join') {
  const template =
    type === 'where'
      ? "\nwhere dt = '${biz_date}'\n  and active_days_30 > 10"
      : '\nleft join ec_dim.user_base_info_di b\n  on a.user_id = b.user_id';
  sqlText.value = `${sqlText.value}${template}`;
}

function insertDatabase(name: string) {
  sqlText.value = `${sqlText.value}${sqlText.value.trim() ? '\n' : ''}${name}.`;
}

function formatSql() {
  sqlText.value = sqlText.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
  message.success('SQL 已完成格式化');
}

function getBlockedActionMessage(record: SqlGroupItem, action: 'edit' | 'execute' | 'delete') {
  const runtime = record.runtimeStatus || 'IDLE';
  if (runtime === 'PUSHING') {
    if (action === 'delete') return '该SQL人群正在推送中，请结束后再进行删除';
    if (action === 'execute') return '该SQL人群正在推送中，请结束后再进行立即推送';
    return '该SQL人群正在推送中，请结束后再进行编辑';
  }
  if (runtime === 'RUNNING') {
    if (action === 'delete') return '该SQL人群正在计算中，请结束后再进行删除';
    if (action === 'execute') return '该SQL人群正在计算中，请结束后再进行立即推送';
    return '该SQL人群正在计算中，请结束后再进行编辑';
  }
  if (runtime === 'WAITING') {
    if (action === 'delete') return '该SQL人群正在等待执行，请结束后再进行删除';
    if (action === 'execute') return '该SQL人群正在等待执行，请结束后再进行立即推送';
    return '该SQL人群正在等待执行，请结束后再进行编辑';
  }
  return '';
}

function guardRuntimeAction(record: SqlGroupItem, action: 'edit' | 'execute' | 'delete') {
  const msg = getBlockedActionMessage(record, action);
  if (!msg) return false;
  message.warning(msg);
  return true;
}

function checkSql() {
  if (!sqlText.value.trim()) {
    sqlCheckPassed.value = false;
    sqlCheckMessage.value = '请先输入 SQL 代码后再进行校验。';
    message.warning('请先输入 SQL 代码');
    return;
  }
  if (!sqlValidation.value.passed) {
    sqlCheckPassed.value = false;
    sqlCheckMessage.value = '当前 SQL 尚未满足校验要求，请补充结果表、输出字段和白名单库表引用。';
    message.warning('SQL 校验未通过');
    return;
  }
  sqlCheckPassed.value = true;
  sqlCheckMessage.value = `校验通过，共识别 ${sqlValidation.value.tableCount} 个库表引用和 ${sqlValidation.value.selectFieldCount} 个输出字段。`;
  message.success('SQL 校验通过');
}

function handleNextStep() {
  if (editStep.value === 1 && !sqlCheckPassed.value) {
    checkSql();
    return;
  }
  editStep.value += 1;
}

function openEditDrawer(record?: SqlGroupItem) {
  if (record && guardRuntimeAction(record, 'edit')) return;
  resetForm();
  databaseKeyword.value = '';
  if (record) {
    patchFormFromRecord(record);
  }
  editStep.value = 0;
  editOpen.value = true;
}

function handleCancelEdit() {
  cancelConfirmOpen.value = true;
}

function confirmCancelEdit() {
  cancelConfirmOpen.value = false;
  editOpen.value = false;
}

async function handleSave() {
  if (!form.sqlGroupCode || !form.name) {
    message.warning('请先填写人群编码和名称');
    return;
  }
  saving.value = true;
  try {
    await TagApi.saveSqlGroup({
      ...form,
      ruleCodes: [...(form.ruleCodes || [])],
      metricsCode: [...(form.metricsCode || [])],
      shareeUsers: shareUserRows.value.map((item) => item.user).filter(Boolean),
      shareePlat: [...(form.shareePlat || [])],
      notifyUsers: notifyUsers.value.filter(Boolean),
      dqcRules: {
        uniqueCheck: true,
        countCheck: safeClone(countCheck),
        specialIdCheck: safeClone(specialIdCheck),
      },
      pushStatus: form.status === 'ENABLE',
      permission: ['edit', 'push', 'execute', 'delete'],
      sqlText: sqlText.value,
      cnt: form.cnt || 0,
    });
    message.success(form.id ? 'SQL 人群更新成功' : 'SQL 人群创建成功');
    editOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('SQL 人群保存失败');
  } finally {
    saving.value = false;
  }
}

function openStatusModal(record: SqlGroupItem, action: 'startPush' | 'stopPush') {
  currentRecord.value = record;
  statusAction.value = action;
  statusConfirmOpen.value = true;
}

async function handleStatusConfirm() {
  if (!currentRecord.value) return;
  try {
    await TagApi.changeSqlGroupStatus(currentRecord.value.id, statusAction.value);
    message.success(statusAction.value === 'startPush' ? '启用推送成功' : '停止推送成功');
    statusConfirmOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('推送状态更新失败');
  }
}

function openExecute(record: SqlGroupItem) {
  if (guardRuntimeAction(record, 'execute')) return;
  currentRecord.value = record;
  executeMode.value = 'EXECUTE';
  executeOpen.value = true;
}

async function handleExecuteConfirm() {
  if (!currentRecord.value) return;
  try {
    const res = await TagApi.executeSqlGroup(currentRecord.value.id, executeMode.value);
    message.success(res.result);
    executeOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('立即推送执行失败');
  }
}

function openSample(record: SqlGroupItem) {
  currentRecord.value = record;
  sampleIds.value = '';
  sampleResult.value = '';
  sampleOpen.value = true;
}

async function handleSampleConfirm() {
  if (!currentRecord.value) return;
  const ids = sampleIds.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!ids.length) {
    message.warning('请输入要检查的用户ID');
    return;
  }
  try {
    const res = await TagApi.sampleSqlGroup(currentRecord.value.id, ids);
    sampleResult.value = res.result;
  } catch (error) {
    console.error(error);
    message.error('抽样检查失败');
  }
}

function openTransfer(record: SqlGroupItem) {
  currentRecord.value = record;
  transferOwner.value = record.ownerName;
  transferOpen.value = true;
}

async function handleTransferConfirm() {
  if (!currentRecord.value || !transferOwner.value) {
    message.warning('请选择新负责人');
    return;
  }
  try {
    await TagApi.transferSqlGroupOwner(currentRecord.value.id, transferOwner.value);
    message.success('负责人转让成功');
    transferOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('负责人转让失败');
  }
}

async function openExport(record: SqlGroupItem) {
  currentRecord.value = record;
  exportForm.format = 'CSV';
  exportForm.limit = 100;
  exportForm.includeSql = true;
  const res = await TagApi.exportSqlGroup(record.id);
  exportContent.value = res.content;
  exportOpen.value = true;
}

function handleExportConfirm() {
  if (!currentRecord.value) return;
  const sqlPart = exportForm.includeSql ? `\nSQL:\n${currentRecord.value.sqlText || ''}` : '';
  exportContent.value = `${exportContent.value}${sqlPart}`;
  message.success(`已生成 ${exportForm.format} 导出内容`);
}

function openDelete(record: SqlGroupItem) {
  if (guardRuntimeAction(record, 'delete')) return;
  currentRecord.value = record;
  deleteOpen.value = true;
}

async function handleDeleteConfirm() {
  if (!currentRecord.value) return;
  try {
    await TagApi.deleteSqlGroup(currentRecord.value.id);
    message.success('SQL 人群删除成功');
    deleteOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error(error);
    message.error('SQL 人群删除失败');
  }
}

function copyRecord(record: SqlGroupItem) {
  openEditDrawer({
    ...record,
    id: undefined as never,
    sqlGroupCode: '',
    name: `${record.name}-副本`,
    status: 'DISABLE',
  });
}

function openDetail(record: SqlGroupItem) {
  currentRecord.value = record;
  detailTab.value = 'base';
  historyRows.value = buildHistoryRows(record);
  taskRows.value = buildTaskRows(record);
  selectedHistoryKeys.value = [];
  detailOpen.value = true;
}

function onHistorySelectChange(keys: (string | number)[]) {
  selectedHistoryKeys.value = keys.map(String);
}

function openHistoryCompare() {
  if (selectedHistoryKeys.value.length !== 2) {
    message.warning('请选择两个版本进行对比');
    return;
  }
  historyCompareOpen.value = true;
}

function openTaskDetail(record: TaskRow) {
  currentTaskDetail.value = record.detail;
  taskDetailOpen.value = true;
}

function taskStatusColor(status?: string) {
  if (status === 'SUCCESS') return 'green';
  if (status === 'SKIPPED') return 'default';
  if (status === 'PENDING') return 'gold';
  return 'processing';
}

onMounted(async () => {
  await Promise.all([fetchBaseOptions(), fetchData()]);
});
</script>

<style lang="less" scoped>
.tag-page {
  padding: 20px;
  background: #fff;
  min-height: 100%;
}

.tag-page__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.grid-span-2 {
  grid-column: span 2;
}

.field-hint {
  margin-top: 6px;
  color: #8c8c8c;
  font-size: 12px;
}

.inline-link {
  padding-left: 0;
}

.sql-reminder__link {
  color: #1677ff;
  cursor: pointer;
}

.fullscreen-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  background:
    linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
}

.fullscreen-page__header {
  flex-shrink: 0;
  padding: 8px 8px 0;
}

.fullscreen-page__titlebar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fullscreen-page__back {
  padding-left: 0;
  font-size: 16px;
  font-weight: 600;
}

.fullscreen-page__subtitle {
  color: #8c8c8c;
  font-size: 12px;
}

.fullscreen-page__steps {
  flex-shrink: 0;
  margin: 12px 8px 20px;
}

.fullscreen-page__body {
  flex: 1;
  overflow: auto;
  padding: 0 8px 24px;
}

.fullscreen-page__footer {
  position: sticky;
  bottom: 0;
  border-top: 1px solid #dbe4f0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  padding: 16px 8px 8px;
}

.step-panel {
  min-height: 520px;
}

.step-panel--sql {
  min-height: 620px;
}

.sql-check-tip {
  margin-bottom: 12px;
  color: #8c8c8c;
  font-size: 12px;
}

.sql-check-tip.is-success {
  color: #389e0d;
}

.runtime-label {
  font-size: 12px;
  color: #8c8c8c;
}

.runtime-label--running,
.runtime-label--pushing {
  color: #d4380d;
}

.runtime-label--waiting {
  color: #d48806;
}

.runtime-label--idle {
  color: #389e0d;
}

.rule-box__tip {
  margin-top: 12px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.6;
}

.dqc-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dqc-box__row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dqc-box__hint {
  margin-left: 6px;
  color: #8c8c8c;
  font-size: 12px;
}

.dqc-box__inline {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 24px;
}

.dqc-box__textarea {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 24px;
}

.sql-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1.5fr) 320px;
  gap: 16px;
}

.sql-layout__left,
.sql-layout__editor,
.sql-layout__side {
  min-width: 0;
}

.panel-title {
  margin-bottom: 12px;
  font-weight: 600;
}

.card-shell {
  border: 1px solid #dce6f2;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.form-card,
.rule-box {
  margin-bottom: 16px;
  padding: 18px 20px 8px;
}

.side-card {
  margin-bottom: 0;
}

.card-title {
  margin-bottom: 16px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.sql-reminder {
  margin-bottom: 16px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #fffdfa 0%, #fff7ed 100%);
  border-color: #fed7aa;
}

.sql-reminder__item + .sql-reminder__item {
  margin-top: 8px;
}

.sql-reminder__label {
  font-weight: 600;
}

.sql-layout__left,
.editor-shell,
.result-shell {
  padding: 16px;
}

.search-box {
  margin-bottom: 12px;
}

.scope-list {
  display: grid;
  gap: 10px;
}

.scope-list__item {
  border: 1px solid #e5edf7;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px 12px;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.scope-list__item:hover {
  border-color: #93c5fd;
  transform: translateY(-1px);
}

.editor-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.result-shell {
  margin-top: 16px;
}

.result-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #64748b;
  font-size: 13px;
}

.detail-history__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-history__tip {
  color: #8c8c8c;
  font-size: 12px;
}

.sql-task-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.sql-task-overview__item {
  padding: 14px 16px;
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 14px;
  background: #fafcff;
}

.sql-task-overview__item span {
  color: #8c8c8c;
  font-size: 12px;
}

.sql-task-overview__item strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 15px;
}

.database-range {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.export-preview {
  margin: 0;
  overflow: auto;
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 14px;
  background: #f8fafc;
  padding: 14px 16px;
  color: #334155;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
