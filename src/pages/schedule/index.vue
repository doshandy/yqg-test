<template>
  <div class="schedule-page">
    <section class="schedule-page__hero">
      <div>
        <p class="schedule-page__eyebrow">任务与实例运维</p>
        <h2>调度管理</h2>
        <p class="schedule-page__desc">查看任务运行、实例状态、依赖关系和诊断处理记录。</p>
      </div>
      <a-space wrap>
        <a-button @click="reloadCurrent">刷新当前视图</a-button>
        <a-button type="primary" @click="jumpToPrimaryAction">{{ primaryActionLabel }}</a-button>
      </a-space>
    </section>

    <section class="schedule-page__stats">
      <article class="stat-card">
        <span>在线任务</span>
        <strong>{{ summary.onlineTaskCount }}</strong>
        <small>已上线作业数量</small>
      </article>
      <article class="stat-card">
        <span>我负责的</span>
        <strong>{{ summary.myTaskCount }}</strong>
        <small>当前负责人为 alice</small>
      </article>
      <article class="stat-card">
        <span>运行中实例</span>
        <strong>{{ summary.runningInstanceCount }}</strong>
        <small>仍在执行的调度实例</small>
      </article>
      <article class="stat-card">
        <span>阻塞实例</span>
        <strong>{{ summary.blockedInstanceCount }}</strong>
        <small>待人工介入的任务</small>
      </article>
    </section>

    <section class="workspace">
      <aside class="workspace__sider">
        <div
          v-for="item in viewOptions"
          :key="item.key"
          :class="['view-card', { 'is-active': activeView === item.key }]"
          @click="switchView(item.key)"
        >
          <div class="view-card__title">{{ item.label }}</div>
          <div class="view-card__desc">{{ item.desc }}</div>
        </div>
      </aside>

      <div class="workspace__content">
        <section v-if="activeView === 'taskOps'" class="panel">
          <div class="schedule-filter">
            <div class="panel__header">
              <div>
                <h3>任务运维</h3>
                <p>按任务维度查看调度状态、运行记录和依赖入口。</p>
              </div>
            </div>

            <div class="filter-grid filter-grid--4">
              <a-input v-model:value="taskFilters.taskName" allow-clear placeholder="任务名称" />
              <a-select v-model:value="taskFilters.taskType" allow-clear placeholder="任务类型" :options="enumOptions.taskTypes" />
              <a-select v-model:value="taskFilters.taskStatus" allow-clear placeholder="任务状态" :options="enumOptions.taskStatuses" />
              <a-select v-model:value="taskFilters.owner" allow-clear placeholder="负责人" :options="enumOptions.owners" />
              <template v-if="taskFilterExpanded">
                <a-range-picker v-model:value="taskFilters.releaseDate" />
                <a-select v-model:value="taskFilters.scheduleType" allow-clear placeholder="调度类型" :options="enumOptions.scheduleTypes" />
                <a-range-picker v-model:value="taskFilters.lastScheduleBatch" />
                <a-select v-model:value="taskFilters.lastRunStatus" allow-clear placeholder="最近一次运行状态" :options="enumOptions.runStatuses" />
              </template>
              <div class="filter-actions">
                <a-button @click="resetTaskFilters">重置</a-button>
                <a-button type="primary" @click="loadTasks">查询</a-button>
                <a class="filter-toggle" @click="taskFilterExpanded = !taskFilterExpanded">
                  {{ taskFilterExpanded ? '收起' : '展开' }}
                  <UpOutlined v-if="taskFilterExpanded" class="filter-toggle__icon" />
                  <DownOutlined v-else class="filter-toggle__icon" />
                </a>
              </div>
            </div>
          </div>

          <div class="quick-stats">
            <div
              v-for="item in taskQuickStats"
              :key="item.key"
              :class="['quick-stat-card', { active: activeTaskQuickFilter === item.key }]"
              @click="applyTaskQuickFilter(item.key)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
              <small>{{ item.desc }}</small>
            </div>
          </div>

          <div class="schedule-table">
            <div class="schedule-table__header">
              <a-checkbox v-model:checked="taskFilters.myResponsibility" @change="loadTasks">我负责的</a-checkbox>
              <span class="schedule-table__hint">可进入详情、运行记录、日志和依赖视图</span>
            </div>

            <a-table
              :data-source="tasks"
              :columns="taskColumns"
              :loading="taskLoading"
              :pagination="taskPagination"
              :scroll="{ x: 1700 }"
              row-key="taskId"
              size="small"
              bordered
              @change="handleTaskTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'taskName'">
                  <div class="name-cell">
                    <div class="name-cell__row">
                      <a-tooltip :title="record.taskName">
                        <a class="name-cell__main" @click="openTaskDetail(record.taskId)">{{ record.taskName }}</a>
                      </a-tooltip>
                      <CopyOutlined class="copy-icon" @click.stop="copyTaskName(record.taskName)" />
                    </div>
                    <a-tooltip :title="record.taskDescription || '/'">
                      <div class="name-cell__sub">{{ record.taskDescription || '/' }}</div>
                    </a-tooltip>
                  </div>
                </template>
                <template v-else-if="column.key === 'taskStatus'">
                  <a-tag :color="record.taskStatus === 'ONLINE' ? 'green' : 'default'">{{ record.taskStatus === 'ONLINE' ? '已上线' : '已下线' }}</a-tag>
                </template>
                <template v-else-if="column.key === 'taskType'">
                  {{ labelOf(enumOptions.taskTypes, record.taskType) }}
                </template>
                <template v-else-if="column.key === 'scheduleType'">
                  {{ labelOf(enumOptions.scheduleTypes, record.scheduleType) }}
                </template>
                <template v-else-if="column.key === 'scheduleCycle'">
                  {{ labelOf(enumOptions.scheduleCycles, record.scheduleCycle) }}
                </template>
                <template v-else-if="column.key === 'lastScheduleBatch'">
                  <a-tooltip :title="batchTooltipTitle(record.lastScheduleBatch, record.lastRunStartTime, record.lastRunEndTime)">
                    <div class="batch-cell">
                      <span>{{ record.lastScheduleBatch || '/' }}</span>
                      <small>{{ record.lastRunStartTime || record.lastScheduleBatch || '/' }}</small>
                    </div>
                  </a-tooltip>
                </template>
                <template v-else-if="column.key === 'lastRunStatus'">
                  <a-badge :status="runStatusBadge(record.lastRunStatus)" :text="runStatusLabel(record.lastRunStatus)" />
                </template>
                <template v-else-if="column.key === 'lastRunTime'">
                  <div class="time-stack">
                    <span>开始时间：{{ record.lastRunStartTime || '/' }}</span>
                    <span>结束时间：{{ record.lastRunEndTime || '/' }}</span>
                  </div>
                </template>
                <template v-else-if="column.key === 'lastRunDurationMs'">
                  {{ formatDuration(record.lastRunDurationMs) }}
                </template>
                <template v-else-if="column.key === 'operation'">
                  <a-space size="small" :wrap="false" class="operation-actions">
                    <a-button size="small" type="link" :disabled="!canRunTask(record)" @click="openRunModal('task', record)">运行</a-button>
                    <a-button size="small" type="link" :disabled="!record.processInstanceId" @click="openLogs('task', record)">日志</a-button>
                    <a-button size="small" type="link" :disabled="!record.taskInstanceId" @click="openHistory(record)">查看历史</a-button>
                    <a-button size="small" type="link" :disabled="record.taskStatus !== 'ONLINE'" @click="openDependency(record, 'dependencyView')">查看依赖</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </section>

        <section v-else-if="activeView === 'instanceOps'" class="panel">
          <div class="schedule-filter">
            <div class="panel__header">
              <div>
                <h3>实例运维</h3>
                <p>按实例批次查看运行过程，支持停止、重跑、置成功和依赖诊断。</p>
              </div>
            </div>

            <div class="filter-grid filter-grid--4">
              <a-range-picker v-model:value="instanceFilters.scheduleBatch" />
              <a-input v-model:value="instanceFilters.taskName" allow-clear placeholder="任务名称" />
              <a-input v-model:value="instanceFilters.executionId" allow-clear placeholder="实例ID / 进程ID" />
              <a-select v-model:value="instanceFilters.taskType" allow-clear placeholder="任务类型" :options="enumOptions.taskTypes" />
              <template v-if="instanceFilterExpanded">
                <a-select v-model:value="instanceFilters.runStatus" allow-clear placeholder="运行状态" :options="enumOptions.runStatuses" />
                <a-select v-model:value="instanceFilters.scheduleType" allow-clear placeholder="调度类型" :options="enumOptions.scheduleTypes" />
                <a-select v-model:value="instanceFilters.scheduleExecuteType" allow-clear placeholder="调度方式" :options="enumOptions.scheduleExecuteTypes" />
                <a-select v-model:value="instanceFilters.scheduleUser" allow-clear placeholder="调度人" :options="enumOptions.owners" />
              </template>
              <div class="filter-actions">
                <a-button @click="resetInstanceFilters">重置</a-button>
                <a-button type="primary" @click="loadInstances">查询</a-button>
                <a class="filter-toggle" @click="instanceFilterExpanded = !instanceFilterExpanded">
                  {{ instanceFilterExpanded ? '收起' : '展开' }}
                  <UpOutlined v-if="instanceFilterExpanded" class="filter-toggle__icon" />
                  <DownOutlined v-else class="filter-toggle__icon" />
                </a>
              </div>
            </div>
          </div>

          <a-alert
            v-if="instanceContextTaskName"
            class="instance-context-banner"
            type="info"
            show-icon
            :message="`当前正在查看 ${instanceContextTaskName} 的实例记录`"
          >
            <template #action>
              <a-button size="small" @click="clearInstanceContext">清除</a-button>
            </template>
          </a-alert>

          <div class="quick-stats">
            <div
              v-for="item in instanceQuickStats"
              :key="item.key"
              :class="['quick-stat-card', { active: activeInstanceQuickFilter === item.key }]"
              @click="applyInstanceQuickFilter(item.key)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
              <small>{{ item.desc }}</small>
            </div>
          </div>

          <div class="schedule-table">
            <div class="schedule-table__header">
              <span class="schedule-table__title">实例列表</span>
              <span class="schedule-table__hint">支持日志查看、依赖诊断和实例状态处理</span>
            </div>

            <a-table
              :data-source="instances"
              :columns="instanceColumns"
              :loading="instanceLoading"
              :pagination="instancePagination"
              :scroll="{ x: 1750 }"
              row-key="taskInstanceId"
              size="small"
              bordered
              @change="handleInstanceTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'scheduleBatch'">
                  <a-tooltip :title="batchTooltipTitle(record.scheduleBatch, record.runStartTime, record.runEndTime)">
                    <div class="batch-cell">
                      <span>{{ record.scheduleBatch || '/' }}</span>
                      <small>{{ record.scheduleExecuteType === 'BACKFILL' ? '补数据触发' : '常规调度批次' }}</small>
                    </div>
                  </a-tooltip>
                </template>
                <template v-else-if="column.key === 'taskName'">
                  <div class="name-cell">
                    <div class="name-cell__row">
                      <a-tooltip :title="record.taskName">
                        <a class="name-cell__main" @click="openTaskDetail(record.taskId)">{{ record.taskName }}</a>
                      </a-tooltip>
                      <CopyOutlined class="copy-icon" @click.stop="copyTaskName(record.taskName)" />
                    </div>
                    <a-tooltip :title="record.taskDescription || '/'">
                      <div class="name-cell__sub">{{ record.taskDescription || '/' }}</div>
                    </a-tooltip>
                  </div>
                </template>
                <template v-else-if="column.key === 'taskType'">
                  {{ labelOf(enumOptions.taskTypes, record.taskType) }}
                </template>
                <template v-else-if="column.key === 'scheduleType'">
                  {{ labelOf(enumOptions.scheduleTypes, record.scheduleType) }}
                </template>
                <template v-else-if="column.key === 'scheduleCycle'">
                  {{ labelOf(enumOptions.scheduleCycles, record.scheduleCycle) }}
                </template>
                <template v-else-if="column.key === 'scheduleExecuteType'">
                  {{ labelOf(enumOptions.scheduleExecuteTypes, record.scheduleExecuteType) }}
                </template>
                <template v-else-if="column.key === 'runStartTime'">
                  <div class="time-stack">
                    <span>{{ record.runStartTime || '/' }}</span>
                    <small>{{ record.scheduleUser || 'system' }}</small>
                  </div>
                </template>
                <template v-else-if="column.key === 'runEndTime'">
                  <div class="time-stack">
                    <span>{{ record.runEndTime || '/' }}</span>
                    <small>{{ record.owner || '/' }}</small>
                  </div>
                </template>
                <template v-else-if="column.key === 'runDurationMs'">
                  {{ formatDuration(record.runDurationMs) }}
                </template>
                <template v-else-if="column.key === 'runStatus'">
                  <a-badge :status="runStatusBadge(record.runStatus)" :text="runStatusLabel(record.runStatus)" />
                </template>
                <template v-else-if="column.key === 'operation'">
                  <a-space size="small" :wrap="false" class="operation-actions">
                    <a-button size="small" type="link" :disabled="!canStopInstance(record)" @click="stopInstance(record)">停止</a-button>
                    <a-button size="small" type="link" :disabled="!canRerunInstance(record)" @click="openRunModal('instance', record)">重跑</a-button>
                    <a-button size="small" type="link" :disabled="!canForceSuccess(record)" @click="forceSuccess(record)">置成功</a-button>
                    <a-button size="small" type="link" :disabled="!record.processInstanceId" @click="openLogs('instance', record)">日志</a-button>
                    <a-button size="small" type="link" @click="openDependency(record, 'dependencyDiagnosis')">依赖诊断</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </section>

        <section v-else class="panel panel--graph">
          <template v-if="graphData">
            <div class="graph-header">
              <div class="graph-header__left">
                <div class="graph-header__title-wrap">
                  <a-tooltip :title="graphData.task.taskName">
                    <div class="graph-header__title">{{ graphData.task.taskName }}</div>
                  </a-tooltip>
                  <a-button type="text" size="small" @click="copyTaskName(graphData.task.taskName)">复制</a-button>
                </div>
                <div class="graph-header__meta">
                  <a-tag :color="graphData.task.taskStatus === 'ONLINE' ? 'green' : 'default'">{{ graphData.task.taskStatus === 'ONLINE' ? '已上线' : '已下线' }}</a-tag>
                  <a-tag color="blue">{{ taskModuleLabel(graphData.task.taskModule) }}</a-tag>
                  <span>负责人：{{ graphData.task.owner }}</span>
                  <span>最近批次：{{ graphData.task.lastScheduleBatch || '-' }}</span>
                  <span>上游 {{ upstreamNodes.length }} 个</span>
                  <span>下游 {{ downstreamNodes.length }} 个</span>
                </div>
              </div>
              <div class="graph-header__right">
                <a-button @click="switchView(activeView === 'dependencyView' ? 'taskOps' : 'instanceOps')">返回列表</a-button>
                <a-tooltip title="重新加载当前依赖画布">
                  <a-button @click="reloadCurrent">
                    <template #icon><ReloadOutlined /></template>
                    刷新
                  </a-button>
                </a-tooltip>
              </div>
            </div>

            <div class="graph-layout" :style="{ gridTemplateColumns: graphSidebarCollapsed ? '22px minmax(0,1fr)' : '240px minmax(0,1fr)' }">
              <aside :class="['graph-node-list', { collapsed: graphSidebarCollapsed }]">
                <template v-if="!graphSidebarCollapsed">
                  <div class="graph-task-head">
                    <div class="graph-task-head__title">节点列表（{{ filteredGraphNodes.length }}）</div>
                    <div class="graph-task-head__meta">
                      <span>支持按名称快速定位</span>
                    </div>
                  </div>
                  <div class="graph-node-search">
                    <a-input v-model:value="graphSearchKeyword" allow-clear placeholder="搜索节点...">
                      <template #prefix><SearchOutlined /></template>
                    </a-input>
                  </div>
                  <div class="graph-node-scroll">
                    <div class="graph-node-group">
                      <div class="graph-node-group__title">上游依赖</div>
                      <div
                        v-for="node in filteredUpstreamNodes"
                        :key="node.id"
                        :class="['graph-node-item', { active: node.id === selectedNodeId }]"
                        @click="selectNode(node.id)"
                      >
                        <div class="graph-node-item__title">{{ node.taskName }}</div>
                        <div class="graph-node-item__sub">
                          <span>{{ labelOf(enumOptions.taskTypes, node.taskType) }}</span>
                          <span>{{ node.crossProject ? '跨空间' : '本空间' }}</span>
                        </div>
                        <div class="graph-node-item__tags">
                          <span :class="['graph-node-badge', node.crossProject ? 'is-cross' : 'is-local']">
                            {{ node.crossProject ? '跨空间' : '本空间' }}
                          </span>
                          <a-tag :bordered="false">{{ directionLabel(node.direction) }}</a-tag>
                        </div>
                      </div>
                    </div>
                    <div class="graph-node-group">
                      <div class="graph-node-group__title">当前节点</div>
                      <div
                        v-for="node in filteredCurrentNodes"
                        :key="node.id"
                        :class="['graph-node-item', { active: node.id === selectedNodeId }]"
                        @click="selectNode(node.id)"
                      >
                        <div class="graph-node-item__title">{{ node.taskName }}</div>
                        <div class="graph-node-item__sub">
                          <span>{{ runStatusLabel(node.runStatus) }}</span>
                          <span>{{ node.owner }}</span>
                        </div>
                        <div class="graph-node-item__tags">
                          <span :class="['graph-node-badge', node.crossProject ? 'is-cross' : 'is-local']">
                            {{ node.crossProject ? '跨空间' : '本空间' }}
                          </span>
                          <a-tag color="blue" :bordered="false">{{ labelOf(enumOptions.taskTypes, node.taskType) }}</a-tag>
                        </div>
                      </div>
                    </div>
                    <div class="graph-node-group">
                      <div class="graph-node-group__title">下游依赖</div>
                      <div
                        v-for="node in filteredDownstreamNodes"
                        :key="node.id"
                        :class="['graph-node-item', { active: node.id === selectedNodeId }]"
                        @click="selectNode(node.id)"
                      >
                        <div class="graph-node-item__title">{{ node.taskName }}</div>
                        <div class="graph-node-item__sub">
                          <span>{{ labelOf(enumOptions.taskTypes, node.taskType) }}</span>
                          <span>{{ node.crossProject ? '跨空间' : '本空间' }}</span>
                        </div>
                        <div class="graph-node-item__tags">
                          <span :class="['graph-node-badge', node.crossProject ? 'is-cross' : 'is-local']">
                            {{ node.crossProject ? '跨空间' : '本空间' }}
                          </span>
                          <a-tag :bordered="false">{{ directionLabel(node.direction) }}</a-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <div class="graph-sidebar-toggle" :title="graphSidebarCollapsed ? '展开节点列表' : '收起节点列表'" @click="graphSidebarCollapsed = !graphSidebarCollapsed">
                  <RightOutlined v-if="graphSidebarCollapsed" />
                  <LeftOutlined v-else />
                </div>
              </aside>

              <div class="graph-main">
                <div class="graph-toolbar">
                  <div class="graph-toolbar__tip">滚轮缩放、点击节点查看详情，可将当前节点重新置中查看。</div>
                  <div class="graph-toolbar__right">
                    <div class="graph-toolbar__legend">
                      <span><i class="dot dot--local" />本空间</span>
                      <span><i class="dot dot--cross" />跨空间</span>
                    </div>
                    <a-space size="small">
                      <a-button size="small" @click="zoomOutGraph">缩小</a-button>
                      <a-button size="small" @click="fitGraphView">适应画布</a-button>
                      <a-button size="small" @click="zoomInGraph">放大</a-button>
                    </a-space>
                  </div>
                </div>

                <div ref="graphCanvasRef" class="graph-canvas" @click="hideGraphContextMenu">
                  <div class="graph-stage" :style="{ zoom: graphScale }">
                    <svg class="graph-lines" viewBox="0 0 920 520" preserveAspectRatio="none">
                      <path
                        v-for="line in graphLines"
                        :key="line.key"
                        :d="line.d"
                        :stroke="line.active ? '#1677ff' : '#94a3b8'"
                        stroke-width="2.5"
                        fill="none"
                        stroke-linecap="round"
                      />
                    </svg>
                    <div
                      v-for="node in graphData.nodes"
                      :key="node.id"
                      :class="[
                        'graph-card',
                        `graph-card--${node.direction}`,
                        { active: node.id === selectedNodeId, danger: node.runStatus === 'FAILURE' || node.runStatus === 'BLOCK', cross: node.crossProject },
                      ]"
                      :style="nodeStyle(node)"
                      @click="selectNode(node.id)"
                      @contextmenu.prevent.stop="openGraphContextMenu($event, node.id)"
                    >
                      <button
                        v-if="shouldShowBranchToggle(node, 'left')"
                        class="graph-card__toggle graph-card__toggle--left"
                        :title="graphBranchState.leftCollapsed ? '展开上游分支' : '收起上游分支'"
                        @click.stop="toggleGraphBranch('left')"
                      >
                        {{ graphBranchState.leftCollapsed ? '+' : '−' }}
                      </button>
                      <button
                        v-if="shouldShowBranchToggle(node, 'right')"
                        class="graph-card__toggle graph-card__toggle--right"
                        :title="graphBranchState.rightCollapsed ? '展开下游分支' : '收起下游分支'"
                        @click.stop="toggleGraphBranch('right')"
                      >
                        {{ graphBranchState.rightCollapsed ? '+' : '−' }}
                      </button>
                      <div class="graph-card__title">{{ node.taskName }}</div>
                      <div class="graph-card__meta">{{ node.owner }} · {{ labelOf(enumOptions.scheduleCycles, node.scheduleCycle) }}</div>
                      <div class="graph-card__footer">
                        <a-tag :bordered="false" color="blue">{{ labelOf(enumOptions.taskTypes, node.taskType) }}</a-tag>
                        <a-badge :status="runStatusBadge(node.runStatus)" :text="runStatusLabel(node.runStatus)" />
                      </div>
                      <div class="graph-card__badge">{{ node.crossProject ? '跨空间' : '本空间' }}</div>
                    </div>
                  </div>
                  <div
                    v-if="graphContextMenu.open"
                    class="graph-context-menu"
                    :style="{ left: `${graphContextMenu.x}px`, top: `${graphContextMenu.y}px` }"
                  >
                    <button class="graph-context-menu__item" @click.stop="handleContextMenuFocus">
                      以此节点为中心打开新画布
                    </button>
                  </div>
                </div>

                <div class="graph-detail-card">
                  <template v-if="selectedNode">
                    <div class="graph-detail-card__header">
                      <div>
                        <h4>{{ selectedNode.taskName }}</h4>
                        <p>{{ directionLabel(selectedNode.direction) }} · {{ selectedNode.workspaceName }} · {{ selectedNode.batch }}</p>
                      </div>
                      <a-space>
                        <a-tag :color="selectedNode.taskStatus === 'ONLINE' ? 'green' : 'default'">{{ selectedNode.taskStatus === 'ONLINE' ? '已上线' : '已下线' }}</a-tag>
                        <a-tag :color="selectedNode.crossProject ? 'orange' : 'blue'">{{ selectedNode.crossProject ? '跨空间' : '本空间' }}</a-tag>
                      </a-space>
                    </div>
                    <div class="graph-detail-section">
                      <div class="graph-detail-section__title">基础属性</div>
                      <div class="graph-detail-grid">
                        <div><span>任务类型</span><strong>{{ labelOf(enumOptions.taskTypes, selectedNode.taskType) }}</strong></div>
                        <div><span>运行状态</span><strong>{{ runStatusLabel(selectedNode.runStatus) }}</strong></div>
                        <div><span>任务模块</span><strong>{{ taskModuleLabel(selectedNode.taskModule) }}</strong></div>
                        <div><span>实例编号</span><strong>{{ selectedNode.instanceId || '-' }}</strong></div>
                        <div><span>责任人</span><strong>{{ selectedNode.owner }}</strong></div>
                        <div><span>所属空间</span><strong>{{ selectedNode.workspaceName }}</strong></div>
                        <div><span>Cron 表达式</span><strong>{{ selectedNode.cronExpression || '-' }}</strong></div>
                        <div><span>调度周期</span><strong>{{ labelOf(enumOptions.scheduleCycles, selectedNode.scheduleCycle) }}</strong></div>
                      </div>
                    </div>
                    <div class="graph-detail-section">
                      <div class="graph-detail-section__title">本实例情况</div>
                      <div class="graph-detail-grid">
                        <div><span>计划开始</span><strong>{{ selectedNode.expectedStartTime || '-' }}</strong></div>
                        <div><span>实际开始</span><strong>{{ selectedNode.runtimeStartTime || '-' }}</strong></div>
                        <div><span>实际结束</span><strong>{{ selectedNode.runtimeEndTime || '-' }}</strong></div>
                        <div><span>本次耗时</span><strong>{{ selectedNode.runtimeDuration || '-' }}</strong></div>
                        <div><span>近30天平均开始</span><strong>{{ selectedNode.avgStartTime || '-' }}</strong></div>
                        <div><span>近30天平均结束</span><strong>{{ selectedNode.avgEndTime || '-' }}</strong></div>
                        <div><span>近30天平均时长</span><strong>{{ selectedNode.avgDuration || '-' }}</strong></div>
                        <div><span>调度批次</span><strong>{{ selectedNode.batch }}</strong></div>
                      </div>
                    </div>
                    <div class="graph-detail-note">
                      <span v-if="selectedNode.crossProject">跨空间节点仅支持查看，不支持运维操作。</span>
                      <span v-else>当前节点支持继续查看实例、日志和诊断动作。</span>
                    </div>
                    <div class="graph-detail-actions">
                      <a-button size="small" type="primary" @click="openTaskDetail(selectedNode.taskId)">查看详情</a-button>
                      <a-button size="small" :disabled="!selectedNode.processInstanceId" @click="openLogs(activeView === 'dependencyDiagnosis' ? 'instance' : 'task', selectedNode)">查看日志</a-button>
                      <a-button size="small" :disabled="selectedNode.crossProject" @click="openNodeInstanceView(selectedNode)">查看实例</a-button>
                      <a-button size="small" @click="focusNodeTask(selectedNode.taskId, activeView)">以此节点为中心</a-button>
                      <a-button
                        v-if="activeView === 'dependencyDiagnosis'"
                        size="small"
                        :disabled="!selectedNode.instanceId || !canRerunNode(selectedNode) || selectedNode.crossProject || selectedNode.taskStatus !== 'ONLINE'"
                        @click="rerunNode(selectedNode)"
                      >
                        重跑
                      </a-button>
                      <a-button
                        v-if="activeView === 'dependencyDiagnosis'"
                        size="small"
                        :disabled="!selectedNode.instanceId || !canStopNode(selectedNode) || selectedNode.crossProject || selectedNode.taskStatus !== 'ONLINE'"
                        @click="stopNode(selectedNode)"
                      >
                        停止
                      </a-button>
                      <a-button
                        v-if="activeView === 'dependencyDiagnosis'"
                        size="small"
                        :disabled="!selectedNode.instanceId || !canForceNode(selectedNode) || selectedNode.crossProject || selectedNode.taskStatus !== 'ONLINE'"
                        @click="forceSuccessNode(selectedNode)"
                      >
                        置成功
                      </a-button>
                    </div>
                  </template>
                  <a-empty v-else description="请选择一个节点查看详情" />
                </div>
              </div>
            </div>
          </template>
          <a-empty v-else description="请选择任务进入依赖视图" />
        </section>
      </div>
    </section>

    <a-modal v-model:open="runModal.open" :title="runModal.mode === 'task' ? '运行任务' : '重跑实例'" width="720px" @ok="submitRunModal">
      <a-form layout="vertical">
        <a-form-item label="任务名称">
          <a-input :value="runModal.record?.taskName" disabled />
        </a-form-item>
        <a-form-item v-if="runModal.needDate" label="调度批次">
          <a-date-picker
            v-if="runModal.dateMode === 'date'"
            v-model:value="runModal.day"
            style="width: 100%"
            format="YYYY-MM-DD"
          />
          <a-date-picker
            v-else
            v-model:value="runModal.day"
            show-time
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
          />
        </a-form-item>
        <a-alert type="info" show-icon message="运行请求提交后，列表、实例和日志内容会同步刷新。" />
      </a-form>
    </a-modal>

    <LogModal
      v-model:open="logDrawer.open"
      :tab-list="logDrawer.tabs"
      :loading="logDrawer.loading"
      :has-more="logDrawer.hasMore"
      @refresh="reloadLogs"
      @load-more="loadMoreLogs"
    />

    <a-drawer v-model:open="detailDrawer.open" title="任务详情" width="980px">
      <template v-if="detailDrawer.detail">
        <div class="detail-head">
          <div>
            <h3>{{ detailDrawer.detail.task.taskName }}</h3>
            <p>{{ detailTaskDescription(detailDrawer.detail.task) }}</p>
          </div>
          <a-tag :color="detailDrawer.detail.task.isOnline ? 'green' : 'default'">
            {{ detailDrawer.detail.task.isOnline ? `已上线(V${detailDrawer.detail.task.releaseVersion})` : '已下线(草稿)' }}
          </a-tag>
        </div>

        <a-tabs v-model:activeKey="detailDrawer.activeTab">
          <a-tab-pane key="base" tab="任务信息">
            <div class="detail-grid">
              <div><span>任务ID</span><strong>{{ detailDrawer.detail.task.taskId }}</strong></div>
              <div><span>任务类型</span><strong>{{ detailDrawer.detail.task.taskType }}</strong></div>
              <div><span>负责人</span><strong>{{ detailDrawer.detail.task.owner }}</strong></div>
              <div><span>任务模块</span><strong>{{ taskModuleLabel(detailDrawer.detail.task.taskModule) }}</strong></div>
              <div><span>发布时间</span><strong>{{ detailDrawer.detail.task.releaseDate }}</strong></div>
              <div><span>当前状态</span><strong>{{ detailDrawer.detail.task.taskStatus === 'ONLINE' ? '已上线' : '已下线' }}</strong></div>
            </div>
          </a-tab-pane>
          <a-tab-pane key="code" tab="代码查看">
            <div class="code-view">
              <div class="code-meta">
                <a-tag color="blue">{{ detailDrawer.detail.codeView.language }}</a-tag>
                <span>输出表：{{ detailDrawer.detail.codeView.outputTable }}</span>
              </div>
              <pre>{{ detailDrawer.detail.codeView.content }}</pre>
            </div>
          </a-tab-pane>
          <a-tab-pane key="schedule" tab="调度配置">
            <div class="detail-grid">
              <div><span>调度类型</span><strong>{{ labelOf(enumOptions.scheduleTypes, detailDrawer.detail.scheduleConfig.scheduleType) }}</strong></div>
              <div><span>调度周期</span><strong>{{ labelOf(enumOptions.scheduleCycles, detailDrawer.detail.scheduleConfig.scheduleCycle) }}</strong></div>
              <div><span>Cron</span><strong>{{ detailDrawer.detail.scheduleConfig.cronExpression }}</strong></div>
              <div><span>资源组</span><strong>{{ detailDrawer.detail.scheduleConfig.yarnQueue }}</strong></div>
              <div><span>失败重试次数</span><strong>{{ detailDrawer.detail.scheduleConfig.maxRetryCount }}</strong></div>
              <div><span>失败重试间隔</span><strong>{{ detailDrawer.detail.scheduleConfig.retryIntervalMinutes }} 分钟</strong></div>
            </div>
            <div class="sub-panel">
              <h4>接下来五次执行时间</h4>
              <ul class="simple-list">
                <li v-for="item in detailDrawer.detail.scheduleConfig.nextExecutionTimes" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div class="sub-panel">
              <h4>上游依赖</h4>
              <a-table
                :data-source="detailDrawer.detail.scheduleConfig.dependencies"
                :pagination="false"
                :columns="detailDependencyColumns"
                row-key="taskId"
                size="small"
              />
            </div>
          </a-tab-pane>
          <a-tab-pane key="monitor" tab="运行状态监控">
            <div class="detail-grid">
              <div><span>负责人</span><strong>{{ detailDrawer.detail.runMonitor.owner }}</strong></div>
              <div><span>运行状态</span><strong>{{ runStatusLabel(detailDrawer.detail.runMonitor.runStatus) }}</strong></div>
              <div><span>成功率</span><strong>{{ detailDrawer.detail.runMonitor.successRate }}</strong></div>
              <div><span>平均耗时</span><strong>{{ detailDrawer.detail.runMonitor.avgDuration }}</strong></div>
            </div>
            <div class="sub-panel">
              <h4>最近五个批次</h4>
              <a-timeline>
                <a-timeline-item v-for="item in detailDrawer.detail.runMonitor.lastFiveBatches" :key="item.batch" :color="runStatusColor(item.status)">
                  {{ item.batch }} · {{ runStatusLabel(item.status) }} · {{ item.duration }}
                </a-timeline-item>
              </a-timeline>
            </div>
          </a-tab-pane>
          <a-tab-pane key="params" tab="资源参数">
            <div class="detail-grid">
              <div><span>引擎</span><strong>{{ detailDrawer.detail.resourceParams.engine }}</strong></div>
              <div><span>CPU</span><strong>{{ detailDrawer.detail.resourceParams.cpu }}</strong></div>
              <div><span>内存</span><strong>{{ detailDrawer.detail.resourceParams.memory }}</strong></div>
            </div>
            <div class="sub-panel">
              <h4>运行参数</h4>
              <a-table
                :data-source="detailDrawer.detail.resourceParams.params"
                :pagination="false"
                :columns="detailParamColumns"
                row-key="key"
                size="small"
              />
            </div>
          </a-tab-pane>
        </a-tabs>
      </template>
      <a-empty v-else description="未获取到任务详情" />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { CopyOutlined, DownOutlined, LeftOutlined, ReloadOutlined, RightOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import { useRoute } from 'vue-router';
import ScheduleApi, {
  type ScheduleSummary,
  type ScheduleTaskItem,
  type ScheduleInstanceItem,
  type ScheduleTaskDetail,
  type ScheduleGraphPayload,
} from '@/resources/schedule';
import LogModal from '@/pages/ops/components/LogModal.vue';

type ViewKey = 'taskOps' | 'instanceOps' | 'dependencyView' | 'dependencyDiagnosis';

const viewOptions = [
  { key: 'taskOps' as ViewKey, label: '任务运维', desc: '任务维度的调度筛选、运行和依赖入口。' },
  { key: 'instanceOps' as ViewKey, label: '实例运维', desc: '实例批次、运行状态和重跑处理。' },
  { key: 'dependencyView' as ViewKey, label: '依赖查看', desc: '查看任务上下游链路和节点信息。' },
  { key: 'dependencyDiagnosis' as ViewKey, label: '依赖诊断', desc: '结合实例状态诊断并处理异常节点。' },
];
const route = useRoute();

const summary = ref<ScheduleSummary>({
  onlineTaskCount: 0,
  myTaskCount: 0,
  runningInstanceCount: 0,
  blockedInstanceCount: 0,
});
const enumOptions = reactive<Record<string, Array<{ label: string; value: string }>>>({
  taskTypes: [],
  taskStatuses: [],
  scheduleTypes: [],
  scheduleCycles: [],
  runStatuses: [],
  scheduleExecuteTypes: [],
  owners: [],
  taskModules: [],
});
const activeView = ref<ViewKey>('taskOps');

const taskFilterExpanded = ref(false);
const activeTaskQuickFilter = ref<'all' | 'running' | 'failed' | 'mine'>('all');
const taskFilters = reactive<{
  taskName?: string;
  taskType?: string;
  taskStatus?: string;
  owner?: string;
  releaseDate?: [Dayjs, Dayjs];
  scheduleType?: string;
  lastScheduleBatch?: [Dayjs, Dayjs];
  lastRunStatus?: string;
  myResponsibility: boolean;
}>({
  taskName: undefined,
  taskType: undefined,
  taskStatus: undefined,
  owner: undefined,
  releaseDate: undefined,
  scheduleType: undefined,
  lastScheduleBatch: undefined,
  lastRunStatus: undefined,
  myResponsibility: false,
});
const tasks = ref<ScheduleTaskItem[]>([]);
const taskLoading = ref(false);
const taskPagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
});

const instanceFilterExpanded = ref(false);
const activeInstanceQuickFilter = ref<'all' | 'success' | 'running' | 'blocked' | 'wait'>('all');
const instanceContextTaskName = ref('');
const instanceFilters = reactive<{
  scheduleBatch?: [Dayjs, Dayjs];
  taskName?: string;
  executionId?: string;
  taskType?: string;
  runStatus?: string;
  scheduleType?: string;
  scheduleExecuteType?: string;
  scheduleUser?: string;
}>({
  scheduleBatch: [dayjs().subtract(7, 'day'), dayjs()],
  taskName: undefined,
  executionId: undefined,
  taskType: undefined,
  runStatus: undefined,
  scheduleType: undefined,
  scheduleExecuteType: undefined,
  scheduleUser: undefined,
});
const instances = ref<ScheduleInstanceItem[]>([]);
const instanceLoading = ref(false);
const instancePagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
});

const graphData = ref<ScheduleGraphPayload | null>(null);
const graphFullData = ref<ScheduleGraphPayload | null>(null);
const selectedNodeId = ref<string>('');
const graphSidebarCollapsed = ref(false);
const graphSearchKeyword = ref('');
const graphScale = ref(1);
const graphCanvasRef = ref<HTMLElement | null>(null);
const graphBranchState = reactive({
  leftCollapsed: false,
  rightCollapsed: false,
});
const graphContextMenu = reactive({
  open: false,
  x: 0,
  y: 0,
  nodeId: '',
});

const runModal = reactive<{
  open: boolean;
  mode: 'task' | 'instance';
  record: ScheduleTaskItem | ScheduleInstanceItem | null;
  needDate: boolean;
  dateMode: 'date' | 'datetime';
  day?: Dayjs;
}>({
  open: false,
  mode: 'task',
  record: null,
  needDate: false,
  dateMode: 'date',
  day: undefined,
});

const logDrawer = reactive<{
  open: boolean;
  source: 'task' | 'instance';
  record: any;
  tabs: Array<{ key: string; name: string; log: string; lineCount: number; appLink?: Record<string, string> }>;
  loading: boolean;
  hasMore: boolean;
  lineCount: number;
}>({
  open: false,
  source: 'task',
  record: null,
  tabs: [],
  loading: false,
  hasMore: true,
  lineCount: 0,
});

const detailDrawer = reactive<{
  open: boolean;
  detail: ScheduleTaskDetail | null;
  activeTab: string;
}>({
  open: false,
  detail: null,
  activeTab: 'base',
});

const taskColumns = [
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 220, fixed: 'left' },
  { title: '任务类型', dataIndex: 'taskType', key: 'taskType', width: 120 },
  { title: '任务状态', dataIndex: 'taskStatus', key: 'taskStatus', width: 110 },
  { title: '负责人', dataIndex: 'owner', key: 'owner', width: 120 },
  { title: '发布日期', dataIndex: 'releaseDate', key: 'releaseDate', width: 140 },
  { title: '调度类型', dataIndex: 'scheduleType', key: 'scheduleType', width: 110 },
  { title: '调度周期', dataIndex: 'scheduleCycle', key: 'scheduleCycle', width: 100 },
  { title: '最近一次调度批次', dataIndex: 'lastScheduleBatch', key: 'lastScheduleBatch', width: 150 },
  { title: '最近一次运行状态', dataIndex: 'lastRunStatus', key: 'lastRunStatus', width: 150 },
  { title: '最近一次运行时间', dataIndex: 'lastRunTime', key: 'lastRunTime', width: 220 },
  { title: '最近一次运行时长', dataIndex: 'lastRunDurationMs', key: 'lastRunDurationMs', width: 140 },
  { title: '操作', key: 'operation', width: 240, fixed: 'right' },
];

const instanceColumns = [
  { title: '调度批次', dataIndex: 'scheduleBatch', key: 'scheduleBatch', width: 130, fixed: 'left' },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 220, fixed: 'left' },
  { title: '任务类型', dataIndex: 'taskType', key: 'taskType', width: 120 },
  { title: '调度类型', dataIndex: 'scheduleType', key: 'scheduleType', width: 110 },
  { title: '调度周期', dataIndex: 'scheduleCycle', key: 'scheduleCycle', width: 100 },
  { title: '调度方式', dataIndex: 'scheduleExecuteType', key: 'scheduleExecuteType', width: 110 },
  { title: '调度人', dataIndex: 'scheduleUser', key: 'scheduleUser', width: 120 },
  { title: '运行开始时间', dataIndex: 'runStartTime', key: 'runStartTime', width: 170 },
  { title: '运行结束时间', dataIndex: 'runEndTime', key: 'runEndTime', width: 170 },
  { title: '运行时长', dataIndex: 'runDurationMs', key: 'runDurationMs', width: 120 },
  { title: '运行状态', dataIndex: 'runStatus', key: 'runStatus', width: 120 },
  { title: '操作', key: 'operation', width: 260, fixed: 'right' },
];

const taskQuickStats = computed(() => {
  const records = tasks.value;
  return [
    { key: 'all', label: '全部任务', count: records.length, desc: '当前页任务数' },
    { key: 'running', label: '运行中', count: records.filter((item) => item.lastRunStatus === 'RUNNING').length, desc: '最近一次仍在执行' },
    { key: 'failed', label: '失败', count: records.filter((item) => item.lastRunStatus === 'FAILURE').length, desc: '最近一次运行失败' },
    { key: 'mine', label: '我负责的', count: records.filter((item) => item.owner === 'alice').length, desc: '负责人为 alice' },
  ];
});

const instanceQuickStats = computed(() => {
  const records = instances.value;
  return [
    { key: 'all', label: '全部实例', count: records.length, desc: '当前页实例数' },
    { key: 'success', label: '成功', count: records.filter((item) => item.runStatus === 'SUCCESS').length, desc: '运行成功实例' },
    { key: 'running', label: '运行中', count: records.filter((item) => item.runStatus === 'RUNNING').length, desc: '仍在执行的实例' },
    { key: 'blocked', label: '阻塞', count: records.filter((item) => item.runStatus === 'BLOCK').length, desc: '待人工处理' },
    { key: 'wait', label: '待运行', count: records.filter((item) => item.runStatus === 'WAIT_TO_RUN').length, desc: '等待调度资源' },
  ];
});

const detailDependencyColumns = [
  { title: '依赖任务', dataIndex: 'taskName', key: 'taskName' },
  { title: '调度周期', dataIndex: 'cycle', key: 'cycle' },
  { title: '周期偏移', dataIndex: 'dependencyCycleOffset', key: 'dependencyCycleOffset' },
  { title: '平均开始时间', dataIndex: 'averageStartTime', key: 'averageStartTime' },
  { title: '平均结束时间', dataIndex: 'averageEndTime', key: 'averageEndTime' },
];

const detailParamColumns = [
  { title: '参数名', dataIndex: 'key', key: 'key' },
  { title: '参数值', dataIndex: 'value', key: 'value' },
];

const sortedGraphNodes = computed(() => {
  if (!graphData.value) return [];
  return [...graphData.value.nodes].sort((a, b) => {
    const weight = (node: any) => {
      if (node.direction === 'up') return -node.level;
      if (node.direction === 'current') return 0;
      return node.level;
    };
    return weight(a) - weight(b);
  });
});

const filteredGraphNodes = computed(() => {
  if (!graphSearchKeyword.value) return sortedGraphNodes.value;
  const keyword = graphSearchKeyword.value.trim().toLowerCase();
  return sortedGraphNodes.value.filter((node) => node.taskName.toLowerCase().includes(keyword));
});

const upstreamNodes = computed(() => sortedGraphNodes.value.filter((node) => node.direction === 'up'));
const downstreamNodes = computed(() => sortedGraphNodes.value.filter((node) => node.direction === 'down'));
const filteredUpstreamNodes = computed(() => filteredGraphNodes.value.filter((node) => node.direction === 'up'));
const filteredCurrentNodes = computed(() => filteredGraphNodes.value.filter((node) => node.direction === 'current'));
const filteredDownstreamNodes = computed(() => filteredGraphNodes.value.filter((node) => node.direction === 'down'));

const selectedNode = computed(() => graphData.value?.nodes.find((item) => item.id === selectedNodeId.value) ?? null);

const graphLines = computed(() => {
  if (!graphData.value) return [];
  return graphData.value.edges.map((edge) => {
    const source = graphData.value?.nodes.find((node) => node.id === edge.source);
    const target = graphData.value?.nodes.find((node) => node.id === edge.target);
    if (!source || !target) return { key: `${edge.source}-${edge.target}`, d: '', active: false };
    const x1 = source.x + source.width;
    const y1 = source.y + source.height / 2;
    const x2 = target.x;
    const y2 = target.y + target.height / 2;
    const c1 = x1 + Math.max((x2 - x1) / 2, 40);
    const c2 = x2 - Math.max((x2 - x1) / 2, 40);
    const active = selectedNodeId.value ? [edge.source, edge.target].includes(selectedNodeId.value) : false;
    return {
      key: `${edge.source}-${edge.target}`,
      d: `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`,
      active,
    };
  });
});

const primaryActionLabel = computed(() => {
  if (activeView.value === 'taskOps') return '查看实例运维';
  if (activeView.value === 'instanceOps') return '查看依赖诊断';
  return '返回任务运维';
});

function labelOf(list: Array<{ label: string; value: string }>, value?: string) {
  if (!value) return '/';
  return list.find((item) => item.value === value)?.label ?? value;
}

function taskModuleLabel(value?: string) {
  return value === 'DATA_INTEGRATION' ? '数据集成' : value === 'DATA_DEVELOPMENT' ? '数据开发' : value || '/';
}

function directionLabel(direction?: string) {
  if (direction === 'up') return '上游节点';
  if (direction === 'down') return '下游节点';
  return '当前节点';
}

function runStatusLabel(status?: string) {
  return labelOf(enumOptions.runStatuses, status);
}

function runStatusColor(status?: string) {
  const map: Record<string, string> = {
    SUCCESS: 'green',
    RUNNING: 'blue',
    FAILURE: 'red',
    PENDING: 'gold',
    STOP: 'default',
    NEVER_RUN: 'default',
    BLOCK: 'orange',
    WAIT_TO_RUN: 'cyan',
  };
  return map[status ?? ''] ?? 'default';
}

function runStatusBadge(status?: string) {
  const map: Record<string, 'success' | 'processing' | 'error' | 'warning' | 'default'> = {
    SUCCESS: 'success',
    RUNNING: 'processing',
    FAILURE: 'error',
    PENDING: 'warning',
    STOP: 'default',
    NEVER_RUN: 'default',
    BLOCK: 'warning',
    WAIT_TO_RUN: 'processing',
  };
  return map[status ?? ''] ?? 'default';
}

function formatDuration(ms?: number) {
  if (!ms) return '/';
  const totalMinutes = Math.floor(ms / 60000);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  if (hour > 0) return `${hour}小时${minute}分钟`;
  return `${minute}分钟`;
}

function detailTaskDescription(task?: ScheduleTaskDetail['task']) {
  if (!task) return '/';
  if (task.description) return task.description;
  const moduleName = taskModuleLabel(task.taskModule);
  return `${moduleName} · ${task.taskStatus === 'ONLINE' ? '已上线任务' : '待发布任务'}`;
}

function batchTooltipTitle(batch?: string, start?: string, end?: string) {
  return [
    `调度批次：${batch || '/'}`,
    `开始时间：${start || '/'}`,
    `结束时间：${end || '/'}`,
  ].join('\n');
}

function nodeStyle(node: any) {
  return {
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.width}px`,
    height: `${node.height}px`,
  };
}

function shouldShowBranchToggle(node: { direction: string }, direction: 'left' | 'right') {
  if (!graphFullData.value) return false;
  if (direction === 'left') {
    return node.direction === 'current' && graphFullData.value.nodes.some((item) => item.direction === 'up');
  }
  return node.direction === 'current' && graphFullData.value.nodes.some((item) => item.direction === 'down');
}

function applyGraphBranchState() {
  if (!graphFullData.value) {
    graphData.value = null;
    return;
  }
  const visibleNodes = graphFullData.value.nodes.filter((node) => {
    if (node.direction === 'up' && graphBranchState.leftCollapsed) return false;
    if (node.direction === 'down' && graphBranchState.rightCollapsed) return false;
    return true;
  });
  const visibleNodeIds = new Set(visibleNodes.map((item) => item.id));
  const visibleEdges = graphFullData.value.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
  graphData.value = {
    task: graphFullData.value.task,
    nodes: visibleNodes,
    edges: visibleEdges,
  };
  if (!visibleNodeIds.has(selectedNodeId.value)) {
    selectedNodeId.value = visibleNodes.find((item) => item.direction === 'current')?.id ?? visibleNodes[0]?.id ?? '';
  }
}

function toggleGraphBranch(direction: 'left' | 'right') {
  if (!graphFullData.value) return;
  if (direction === 'left') {
    graphBranchState.leftCollapsed = !graphBranchState.leftCollapsed;
    message.success(graphBranchState.leftCollapsed ? '已收起上游分支' : '已展开上游分支');
  } else {
    graphBranchState.rightCollapsed = !graphBranchState.rightCollapsed;
    message.success(graphBranchState.rightCollapsed ? '已收起下游分支' : '已展开下游分支');
  }
  applyGraphBranchState();
  nextTick(() => centerGraphNode(selectedNodeId.value));
}

function openGraphContextMenu(event: MouseEvent, nodeId: string) {
  graphContextMenu.open = true;
  graphContextMenu.x = event.offsetX + 12;
  graphContextMenu.y = event.offsetY + 12;
  graphContextMenu.nodeId = nodeId;
}

function hideGraphContextMenu() {
  graphContextMenu.open = false;
  graphContextMenu.nodeId = '';
}

function handleContextMenuFocus() {
  const target = graphData.value?.nodes.find((item) => item.id === graphContextMenu.nodeId);
  hideGraphContextMenu();
  if (!target) return;
  focusNodeTask(target.taskId, activeView.value);
}

async function copyTaskName(taskName: string) {
  try {
    await navigator.clipboard.writeText(taskName);
    message.success('已复制任务名称');
  } catch {
    message.error('复制失败');
  }
}

function centerGraphNode(nodeId?: string) {
  const container = graphCanvasRef.value;
  const node = graphData.value?.nodes.find((item) => item.id === nodeId);
  if (!container || !node) return;
  const targetLeft = Math.max(node.x * graphScale.value - container.clientWidth / 2 + (node.width * graphScale.value) / 2, 0);
  const targetTop = Math.max(node.y * graphScale.value - container.clientHeight / 2 + (node.height * graphScale.value) / 2, 0);
  container.scrollTo({ left: targetLeft, top: targetTop, behavior: 'smooth' });
}

function zoomInGraph() {
  graphScale.value = Math.min(Number((graphScale.value + 0.1).toFixed(2)), 1.6);
}

function zoomOutGraph() {
  graphScale.value = Math.max(Number((graphScale.value - 0.1).toFixed(2)), 0.7);
}

function fitGraphView() {
  graphScale.value = 1;
  nextTick(() => centerGraphNode(selectedNodeId.value));
}

async function loadSummary() {
  summary.value = await ScheduleApi.fetchSummary();
}

async function loadEnums() {
  const body = await ScheduleApi.fetchEnums();
  Object.keys(enumOptions).forEach((key) => {
    enumOptions[key] = body[key] ?? [];
  });
}

async function loadTasks() {
  taskLoading.value = true;
  try {
    const res = await ScheduleApi.fetchTasks({
      pageNo: taskPagination.current,
      pageSize: taskPagination.pageSize,
      taskName: taskFilters.taskName,
      taskType: taskFilters.taskType,
      taskStatus: taskFilters.taskStatus,
      owner: taskFilters.owner,
      scheduleType: taskFilters.scheduleType,
      lastRunStatus: taskFilters.lastRunStatus,
      myResponsibility: taskFilters.myResponsibility,
      releaseDateStart: taskFilters.releaseDate?.[0]?.format('YYYY-MM-DD'),
      releaseDateEnd: taskFilters.releaseDate?.[1]?.format('YYYY-MM-DD'),
      lastScheduleBatchStart: taskFilters.lastScheduleBatch?.[0]?.format('YYYY-MM-DD'),
      lastScheduleBatchEnd: taskFilters.lastScheduleBatch?.[1]?.format('YYYY-MM-DD'),
    });
    tasks.value = res.items;
    taskPagination.total = res.total;
  } finally {
    taskLoading.value = false;
  }
}

async function loadInstances() {
  instanceLoading.value = true;
  try {
    const res = await ScheduleApi.fetchInstances({
      pageNo: instancePagination.current,
      pageSize: instancePagination.pageSize,
      taskName: instanceFilters.taskName,
      executionId: instanceFilters.executionId,
      taskType: instanceFilters.taskType,
      runStatus: instanceFilters.runStatus,
      scheduleType: instanceFilters.scheduleType,
      scheduleExecuteType: instanceFilters.scheduleExecuteType,
      scheduleUser: instanceFilters.scheduleUser,
      scheduleBatchStart: instanceFilters.scheduleBatch?.[0]?.format('YYYY-MM-DD'),
      scheduleBatchEnd: instanceFilters.scheduleBatch?.[1]?.format('YYYY-MM-DD'),
    });
    instances.value = res.items;
    instancePagination.total = res.total;
  } finally {
    instanceLoading.value = false;
  }
}

async function loadGraph(view: 'dependencyView' | 'dependencyDiagnosis', taskId?: string) {
  if (!taskId) {
    graphFullData.value = null;
    graphData.value = null;
    hideGraphContextMenu();
    return;
  }
  graphSearchKeyword.value = '';
  graphScale.value = 1;
  graphBranchState.leftCollapsed = false;
  graphBranchState.rightCollapsed = false;
  hideGraphContextMenu();
  graphFullData.value = view === 'dependencyView'
    ? await ScheduleApi.fetchDependencyView(taskId)
    : await ScheduleApi.fetchDependencyDiagnosis(taskId);
  applyGraphBranchState();
  selectedNodeId.value = graphData.value?.nodes.find((item) => item.direction === 'current')?.id ?? '';
  await nextTick();
  centerGraphNode(selectedNodeId.value);
}

function selectNode(nodeId: string) {
  selectedNodeId.value = nodeId;
  nextTick(() => centerGraphNode(nodeId));
}

function switchView(view: ViewKey) {
  activeView.value = view;
  if (view === 'taskOps') {
    void loadTasks();
    return;
  }
  if (view === 'instanceOps') {
    void loadInstances();
    return;
  }
  const fallbackTaskId = selectedNode.value?.taskId ?? tasks.value[0]?.taskId ?? instances.value[0]?.taskId;
  void loadGraph(view, fallbackTaskId);
}

function jumpToPrimaryAction() {
  if (activeView.value === 'taskOps') {
    switchView('instanceOps');
    return;
  }
  if (activeView.value === 'instanceOps') {
    const target = instances.value[0]?.taskId ?? tasks.value[0]?.taskId;
    activeView.value = 'dependencyDiagnosis';
    void loadGraph('dependencyDiagnosis', target);
    return;
  }
  switchView('taskOps');
}

async function reloadCurrent() {
  await loadSummary();
  if (activeView.value === 'taskOps') {
    await loadTasks();
    return;
  }
  if (activeView.value === 'instanceOps') {
    await loadInstances();
    return;
  }
  await loadGraph(activeView.value, graphData.value?.task.taskId);
}

function resetTaskFilters() {
  taskFilters.taskName = undefined;
  taskFilters.taskType = undefined;
  taskFilters.taskStatus = undefined;
  taskFilters.owner = undefined;
  taskFilters.releaseDate = undefined;
  taskFilters.scheduleType = undefined;
  taskFilters.lastScheduleBatch = undefined;
  taskFilters.lastRunStatus = undefined;
  taskFilters.myResponsibility = false;
  activeTaskQuickFilter.value = 'all';
  taskPagination.current = 1;
  void loadTasks();
}

function resetInstanceFilters() {
  instanceFilters.scheduleBatch = [dayjs().subtract(7, 'day'), dayjs()];
  instanceFilters.taskName = undefined;
  instanceFilters.executionId = undefined;
  instanceFilters.taskType = undefined;
  instanceFilters.runStatus = undefined;
  instanceFilters.scheduleType = undefined;
  instanceFilters.scheduleExecuteType = undefined;
  instanceFilters.scheduleUser = undefined;
  activeInstanceQuickFilter.value = 'all';
  instancePagination.current = 1;
  void loadInstances();
}

function applyTaskQuickFilter(key: 'all' | 'running' | 'failed' | 'mine') {
  activeTaskQuickFilter.value = key;
  if (key === 'all') {
    taskFilters.lastRunStatus = undefined;
    taskFilters.myResponsibility = false;
  } else if (key === 'running') {
    taskFilters.lastRunStatus = 'RUNNING';
    taskFilters.myResponsibility = false;
  } else if (key === 'failed') {
    taskFilters.lastRunStatus = 'FAILURE';
    taskFilters.myResponsibility = false;
  } else {
    taskFilters.lastRunStatus = undefined;
    taskFilters.myResponsibility = true;
  }
  taskPagination.current = 1;
  void loadTasks();
}

function applyInstanceQuickFilter(key: 'all' | 'success' | 'running' | 'blocked' | 'wait') {
  activeInstanceQuickFilter.value = key;
  if (key === 'all') {
    instanceFilters.runStatus = undefined;
  } else if (key === 'success') {
    instanceFilters.runStatus = 'SUCCESS';
  } else if (key === 'running') {
    instanceFilters.runStatus = 'RUNNING';
  } else if (key === 'blocked') {
    instanceFilters.runStatus = 'BLOCK';
  } else {
    instanceFilters.runStatus = 'WAIT_TO_RUN';
  }
  instancePagination.current = 1;
  void loadInstances();
}

function clearInstanceContext() {
  instanceContextTaskName.value = '';
  instanceFilters.taskName = undefined;
  instanceFilters.executionId = undefined;
  instancePagination.current = 1;
  void loadInstances();
}

function handleTaskTableChange(pagination: TablePaginationConfig) {
  taskPagination.current = pagination.current ?? 1;
  taskPagination.pageSize = pagination.pageSize ?? 10;
  void loadTasks();
}

function handleInstanceTableChange(pagination: TablePaginationConfig) {
  instancePagination.current = pagination.current ?? 1;
  instancePagination.pageSize = pagination.pageSize ?? 10;
  void loadInstances();
}

function canRunTask(record: ScheduleTaskItem) {
  return record.taskStatus === 'ONLINE' && ['SUCCESS', 'STOP', 'FAILURE', 'NEVER_RUN'].includes(record.lastRunStatus);
}

function canRerunInstance(record: ScheduleInstanceItem) {
  return ['SUCCESS', 'STOP', 'FAILURE', 'NEVER_RUN', 'BLOCK'].includes(record.runStatus);
}

function canStopInstance(record: ScheduleInstanceItem) {
  return ['RUNNING', 'PENDING', 'WAIT_TO_RUN'].includes(record.runStatus);
}

function canForceSuccess(record: ScheduleInstanceItem) {
  return ['FAILURE', 'STOP', 'BLOCK'].includes(record.runStatus);
}

function canRerunNode(node: any) {
  return ['SUCCESS', 'STOP', 'FAILURE', 'BLOCK'].includes(node.runStatus);
}

function canStopNode(node: any) {
  return ['RUNNING', 'PENDING', 'WAIT_TO_RUN'].includes(node.runStatus);
}

function canForceNode(node: any) {
  return ['FAILURE', 'STOP', 'BLOCK'].includes(node.runStatus);
}

async function openRunModal(mode: 'task' | 'instance', record: any) {
  runModal.open = true;
  runModal.mode = mode;
  runModal.record = record;
  runModal.day = record.scheduleTime ? dayjs(record.scheduleTime) : undefined;
  if (mode === 'task') {
    runModal.needDate = await ScheduleApi.checkNeedDate(record.taskId);
    runModal.dateMode = record.scheduleCycle === 'HOUR' ? 'datetime' : 'date';
  } else {
    runModal.needDate = Boolean(record.scheduleTime);
    runModal.dateMode = record.scheduleCycle === 'HOUR' ? 'datetime' : 'date';
  }
}

async function submitRunModal() {
  if (!runModal.record) return;
  if (runModal.mode === 'task') {
    await ScheduleApi.runTask({
      taskId: runModal.record.taskId,
      scheduleTime: runModal.needDate && runModal.day
        ? runModal.day.format(runModal.dateMode === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD 00:00:00')
        : undefined,
    });
    message.success('运行请求已提交');
    await loadTasks();
  } else {
    await ScheduleApi.rerunInstance({ taskInstanceId: runModal.record.taskInstanceId });
    message.success('重跑请求已提交');
    await loadInstances();
  }
  await loadSummary();
  if (graphData.value?.task.taskId === runModal.record.taskId) {
    await loadGraph(activeView.value as 'dependencyView' | 'dependencyDiagnosis', runModal.record.taskId);
  }
  runModal.open = false;
  runModal.record = null;
  runModal.day = undefined;
}

async function openLogs(source: 'task' | 'instance', record: any) {
  if (!record.processInstanceId) {
    message.error('当前记录没有可查看的日志');
    return;
  }
  logDrawer.open = true;
  logDrawer.source = source;
  logDrawer.record = record;
  logDrawer.tabs = [];
  logDrawer.hasMore = true;
  logDrawer.lineCount = 0;
  await fetchLogs();
}

async function fetchLogs(loadMore = false) {
  if (!logDrawer.record?.processInstanceId) return;
  logDrawer.loading = true;
  try {
    const tabs = logDrawer.source === 'task'
      ? await ScheduleApi.fetchTaskLogs({
          processInstanceId: logDrawer.record.processInstanceId,
          skipLineNum: loadMore ? logDrawer.lineCount : 0,
        })
      : await ScheduleApi.fetchInstanceLogs({
          processInstanceId: logDrawer.record.processInstanceId,
          skipLineNum: loadMore ? logDrawer.lineCount : 0,
        });
    if (loadMore) {
      let appended = 0;
      logDrawer.tabs = logDrawer.tabs.map((tab) => {
        const next = tabs.find((item) => item.name === tab.name);
        appended = Math.max(appended, next?.lineCount ?? 0);
        return next ? { ...tab, log: `${tab.log}${next.log}`, appLink: next.appLink ?? tab.appLink } : tab;
      });
      logDrawer.lineCount += appended;
      logDrawer.hasMore = appended > 0;
      return;
    }
    logDrawer.tabs = tabs.map((item) => ({
      ...item,
      key: item.name,
    }));
    logDrawer.lineCount = Math.max(...tabs.map((item) => item.lineCount), 0);
    logDrawer.hasMore = logDrawer.lineCount > 0;
  } finally {
    logDrawer.loading = false;
  }
}

function loadMoreLogs() {
  if (logDrawer.loading || !logDrawer.hasMore) return;
  void fetchLogs(true);
}

function reloadLogs() {
  if (!logDrawer.record) return;
  logDrawer.tabs = [];
  logDrawer.hasMore = true;
  logDrawer.lineCount = 0;
  void fetchLogs();
}

async function openTaskDetail(taskId: string) {
  detailDrawer.detail = await ScheduleApi.fetchTaskDetail(taskId);
  detailDrawer.activeTab = 'base';
  detailDrawer.open = true;
}

function openHistory(record: ScheduleTaskItem) {
  activeView.value = 'instanceOps';
  instanceContextTaskName.value = record.taskName;
  instanceFilters.taskName = record.taskName;
  instancePagination.current = 1;
  void loadInstances();
}

function openNodeInstanceView(node: { taskName: string; batch?: string }) {
  activeView.value = 'instanceOps';
  instanceContextTaskName.value = node.taskName;
  instanceFilters.taskName = node.taskName;
  if (node.batch) {
    instanceFilters.scheduleBatch = [dayjs(node.batch), dayjs(node.batch)];
  }
  instancePagination.current = 1;
  void loadInstances();
}

function openDependency(record: { taskId: string }, view: 'dependencyView' | 'dependencyDiagnosis') {
  activeView.value = view;
  void loadGraph(view, record.taskId);
}

function focusNodeTask(taskId: string, view: ViewKey) {
  if (view !== 'dependencyView' && view !== 'dependencyDiagnosis') return;
  void loadGraph(view, taskId);
}

async function stopInstance(record: ScheduleInstanceItem) {
  Modal.confirm({
    title: '确认停止该实例？',
    onOk: async () => {
      await ScheduleApi.stopInstance({ taskInstanceId: record.taskInstanceId });
      message.success('实例已停止');
      await afterInstanceMutation(record.taskId);
    },
  });
}

async function forceSuccess(record: ScheduleInstanceItem) {
  await ScheduleApi.forceSuccess({ taskInstanceId: record.taskInstanceId });
  message.success('实例已置为成功');
  await afterInstanceMutation(record.taskId);
}

async function rerunNode(node: any) {
  if (!node.instanceId) return;
  await ScheduleApi.rerunInstance({ taskInstanceId: node.instanceId });
  message.success('节点重跑请求已提交');
  await afterInstanceMutation(node.taskId);
}

async function stopNode(node: any) {
  if (!node.instanceId) return;
  await ScheduleApi.stopInstance({ taskInstanceId: node.instanceId });
  message.success('节点已停止');
  await afterInstanceMutation(node.taskId);
}

async function forceSuccessNode(node: any) {
  if (!node.instanceId) return;
  await ScheduleApi.forceSuccess({ taskInstanceId: node.instanceId });
  message.success('节点已置为成功');
  await afterInstanceMutation(node.taskId);
}

async function afterInstanceMutation(taskId?: string) {
  await loadSummary();
  await loadTasks();
  await loadInstances();
  if (activeView.value === 'dependencyDiagnosis' || activeView.value === 'dependencyView') {
    await loadGraph(activeView.value, taskId ?? graphData.value?.task.taskId);
  }
}

onMounted(async () => {
  await Promise.all([loadSummary(), loadEnums(), loadTasks(), loadInstances()]);
});

watch(
  () => route.query,
  (query) => {
    const executionId = typeof query.executionId === 'string' ? query.executionId : '';
    const resourceName = typeof query.resourceName === 'string' ? query.resourceName : '';
    if (!executionId) return;
    activeView.value = 'instanceOps';
    instanceFilters.executionId = executionId;
    instanceFilters.taskName = resourceName || undefined;
    instanceContextTaskName.value = resourceName || executionId;
    instancePagination.current = 1;
    void loadInstances();
  },
  { immediate: true },
);
</script>

<style lang="less" scoped>
.schedule-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(22, 119, 255, 0.12), transparent 26%),
    linear-gradient(180deg, #f6f9ff 0%, #edf4ff 100%);
}

.schedule-page__hero,
.panel,
.view-card,
.stat-card,
.graph-detail-card,
.graph-node-item,
.graph-task-head {
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
}

.schedule-page__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 24px 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 62%, #38bdf8 100%);
  color: #fff;

  h2 {
    margin: 8px 0 6px;
    font-size: 30px;
  }
}

.schedule-page__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.72;
}

.schedule-page__desc {
  max-width: 720px;
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
}

.schedule-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);

  span,
  small {
    display: block;
    color: #64748b;
  }

  strong {
    display: block;
    margin: 8px 0 6px;
    font-size: 32px;
    line-height: 1;
    color: #0f172a;
  }
}

.workspace {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;
}

.workspace__sider {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-card {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &.is-active {
    border-color: rgba(22, 119, 255, 0.28);
    background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
    box-shadow: 0 22px 50px rgba(22, 119, 255, 0.14);
  }
}

.view-card__title {
  font-weight: 700;
  color: #0f172a;
}

.view-card__desc {
  margin-top: 8px;
  line-height: 1.6;
  color: #64748b;
  font-size: 13px;
}

.workspace__content {
  min-width: 0;
}

.panel {
  padding: 20px 22px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
}

.panel--graph {
  min-height: 760px;
}

.schedule-filter,
.schedule-table {
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;

  h3 {
    margin: 0 0 6px;
    font-size: 22px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
  }
}

.schedule-filter {
  padding: 18px 18px 4px;
  margin-bottom: 18px;
}

.schedule-table {
  overflow: hidden;
}

.schedule-table__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.schedule-table__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.schedule-table__hint {
  font-size: 12px;
  color: #64748b;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.filter-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #1677ff;
  cursor: pointer;
}

.filter-toggle__icon {
  font-size: 12px;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.quick-stat-card {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
  }

  &.active {
    border-color: rgba(22, 119, 255, 0.28);
    box-shadow: 0 16px 36px rgba(22, 119, 255, 0.12);
  }

  span,
  small {
    display: block;
    color: #64748b;
  }

  strong {
    display: block;
    margin: 8px 0 6px;
    font-size: 26px;
    line-height: 1;
    color: #0f172a;
  }
}

.instance-context-banner {
  margin-bottom: 14px;
}

.name-cell {
  min-width: 0;
}

.name-cell__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.name-cell__main {
  display: inline-block;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name-cell__sub {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-icon {
  flex: none;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #1677ff;
  }
}

.batch-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  small {
    color: #64748b;
  }
}

.time-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;

  small {
    color: #64748b;
  }
}

.operation-actions {
  white-space: nowrap;
}

.graph-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 16px;
}

.graph-node-list {
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 760px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fafcff 0%, #f3f7ff 100%);
  overflow: hidden;

  &.collapsed {
    width: 22px;
    min-width: 22px;
  }
}

.graph-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
  padding: 16px 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%);
  border: 1px solid rgba(59, 130, 246, 0.12);
}

.graph-header__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.graph-header__title {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.graph-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  color: #64748b;
  font-size: 13px;
}

.graph-header__right {
  display: flex;
  gap: 8px;
}

.graph-task-head,
.graph-node-item,
.graph-detail-card,
.graph-node-search {
  margin: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
}

.graph-task-head__title {
  font-weight: 700;
  color: #0f172a;
}

.graph-task-head__meta {
  margin-top: 10px;
  color: #64748b;
  font-size: 12px;
}

.graph-node-search {
  padding: 0 12px 12px;
  background: transparent;
  box-shadow: none;
  border: 0;
}

.graph-node-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 18px;
}

.graph-node-group + .graph-node-group {
  margin-top: 8px;
}

.graph-node-group__title {
  margin: 0 12px 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
  text-transform: uppercase;
}

.graph-sidebar-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 96px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  font-size: 14px;
  color: #475569;

  &:hover {
    color: #1677ff;
    border-color: rgba(22, 119, 255, 0.28);
  }
}

.graph-node-item {
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    border-color: rgba(22, 119, 255, 0.28);
    box-shadow: 0 16px 40px rgba(22, 119, 255, 0.12);
  }
}

.graph-node-item__title {
  font-weight: 600;
  color: #0f172a;
}

.graph-node-item__sub {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.graph-node-item__tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.graph-node-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;

  &.is-local {
    background: rgba(22, 119, 255, 0.12);
    color: #1677ff;
  }

  &.is-cross {
    background: rgba(250, 140, 22, 0.14);
    color: #d97706;
  }
}

.graph-main {
  min-width: 0;
}

.graph-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: #f8fafc;
}

.graph-toolbar__tip {
  color: #64748b;
  font-size: 12px;
}

.graph-toolbar__right,
.graph-toolbar__legend {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
}

.dot--local {
  background: #1677ff;
}

.dot--cross {
  background: #fa8c16;
}

.graph-canvas {
  position: relative;
  height: 560px;
  overflow: auto;
  border-radius: 20px;
  background:
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(180deg, #f8fbff 0%, #f1f6ff 100%);
  background-size: 32px 32px, 32px 32px, auto;
}

.graph-context-menu {
  position: absolute;
  z-index: 6;
  min-width: 188px;
  padding: 6px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
}

.graph-context-menu__item {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #0f172a;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #eff6ff;
    color: #1677ff;
  }
}

.graph-stage {
  position: relative;
  width: 920px;
  height: 520px;
  transform-origin: top left;
}

.graph-lines {
  position: absolute;
  inset: 0;
  width: 920px;
  height: 520px;
  pointer-events: none;
}

.graph-card {
  position: absolute;
  z-index: 1;
  padding: 12px 14px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.28);
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &.active {
    border-color: rgba(22, 119, 255, 0.38);
    box-shadow: 0 18px 42px rgba(22, 119, 255, 0.14);
  }

  &.danger {
    border-color: rgba(239, 68, 68, 0.28);
  }

  &.cross {
    box-shadow: inset 0 0 0 1px rgba(250, 140, 22, 0.18);
  }
}

.graph-card__toggle {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  transform: translateY(-50%);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);

  &:hover {
    color: #1677ff;
    border-color: rgba(22, 119, 255, 0.4);
  }
}

.graph-card__toggle--left {
  left: -11px;
}

.graph-card__toggle--right {
  right: -11px;
}

.graph-card--current {
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.graph-card__title {
  font-weight: 700;
  color: #0f172a;
}

.graph-card__meta {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.graph-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.graph-card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #64748b;
  font-size: 11px;
}

.graph-detail-card {
  margin-top: 16px;
}

.graph-detail-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;

  h4 {
    margin: 0 0 4px;
    font-size: 20px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
  }
}

.graph-detail-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;

  div {
    padding: 12px 14px;
    border-radius: 16px;
    background: #f8fafc;
  }

  span {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #64748b;
  }

  strong {
    color: #0f172a;
  }
}

.graph-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.graph-detail-note {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 14px;
  color: #64748b;
}

.graph-detail-section + .graph-detail-section {
  margin-top: 14px;
}

.graph-detail-section__title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
  text-transform: uppercase;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  h3 {
    margin: 0 0 6px;
    font-size: 24px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
  }
}

.code-view,
.sub-panel,
.log-toolbar {
  margin-top: 16px;
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
}

.code-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: #475569;
}

.code-view pre,
.log-content {
  margin: 0;
  padding: 16px;
  overflow: auto;
  border-radius: 16px;
  background: #0f172a;
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.7;
}

.simple-list {
  margin: 0;
  padding-left: 18px;

  li + li {
    margin-top: 8px;
  }
}

.muted-text {
  color: #64748b;
}

@media (max-width: 1280px) {
  .schedule-page__stats,
  .workspace,
  .graph-layout,
  .filter-grid,
  .quick-stats,
  .detail-grid,
  .graph-detail-grid {
    grid-template-columns: 1fr;
  }

  .graph-canvas {
    height: 640px;
  }

  .graph-header,
  .graph-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .schedule-table__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
