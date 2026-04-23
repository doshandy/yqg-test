<template>
  <div class="alert-page">
    <section class="alert-page__hero">
      <div>
        <p class="alert-page__eyebrow">告警与通知中心</p>
        <h2>监控运维</h2>
        <p class="alert-page__desc">按事件卡片查看告警状态、处理记录和通知策略。</p>
      </div>
      <a-space wrap>
        <a-button @click="reloadCurrent">刷新当前视图</a-button>
        <a-button v-if="activeTab === 'policy'" type="primary" @click="openPolicyModal()">新建策略</a-button>
      </a-space>
    </section>

    <section class="panel">
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <a-tab-pane key="event" tab="告警事件" />
        <a-tab-pane key="policy" tab="通知策略" />
      </a-tabs>

      <template v-if="activeTab === 'event'">
        <div class="overview-grid">
          <article
            v-for="item in overviewCards"
            :key="item.key"
            :class="['overview-card', { active: selectedCard === item.key }]"
            @click="handleCardClick(item.key)"
          >
            <div class="overview-card__title">{{ item.label }}</div>
            <div class="overview-card__count">{{ item.count }}</div>
          </article>
        </div>

        <div class="search-card">
          <a-form layout="inline" @finish="loadEvents">
            <a-form-item label="来源">
              <a-select
                v-model:value="eventFilters.resourceType"
                allow-clear
                style="width: 220px"
                placeholder="请选择"
                :options="alertEnums.resourceTypes"
              />
            </a-form-item>
            <a-form-item :label="eventFilters.resourceType === 'DATA_QUALITY' ? '数据表名' : '任务名'">
              <a-input
                v-model:value="eventFilters.keyword"
                style="width: 200px"
                :placeholder="eventFilters.resourceType === 'DATA_QUALITY' ? '支持搜索数据表名' : '支持搜索任务名'"
                allow-clear
              />
            </a-form-item>
            <a-form-item label="事件ID">
              <a-input v-model:value="eventFilters.eventId" style="width: 150px" placeholder="支持搜索事件Id" allow-clear />
            </a-form-item>
            <a-form-item label="监控事件">
              <a-select
                v-model:value="eventFilters.eventTypes"
                mode="multiple"
                allow-clear
                :max-tag-count="1"
                style="width: 220px"
                placeholder="请选择"
                :options="alertEnums.eventTypes"
              />
            </a-form-item>
            <a-form-item label="事件状态">
              <a-select
                v-model:value="eventFilters.statuses"
                mode="multiple"
                allow-clear
                :max-tag-count="1"
                style="width: 220px"
                placeholder="请选择"
                :options="alertEnums.statuses"
              />
            </a-form-item>
            <template v-if="expanded">
              <a-form-item label="告警等级">
                <a-select
                  v-model:value="eventFilters.severities"
                  mode="multiple"
                  allow-clear
                  :max-tag-count="2"
                  style="width: 200px"
                  placeholder="请选择"
                  :options="alertEnums.severities"
                />
              </a-form-item>
              <a-form-item v-if="eventFilters.resourceType !== 'DATA_QUALITY'" label="调度批次">
                <a-range-picker v-model:value="batchRange" show-time style="width: 415px" />
              </a-form-item>
              <a-form-item label="负责人">
                <a-select
                  v-model:value="eventFilters.owners"
                  mode="multiple"
                  allow-clear
                  style="width: 200px"
                  placeholder="请选择"
                  :options="alertEnums.owners"
                />
              </a-form-item>
              <a-form-item label="操作人">
                <a-select
                  v-model:value="eventFilters.lastOperators"
                  mode="multiple"
                  allow-clear
                  style="width: 200px"
                  placeholder="请选择"
                  :options="alertEnums.owners"
                />
              </a-form-item>
            </template>
            <a-form-item>
              <a-space>
                <a-button @click="resetEventFilters">重置</a-button>
                <a-button type="primary" html-type="submit">查询</a-button>
                <a-button type="link" @click="expanded = !expanded">{{ expanded ? '收起' : '展开' }}</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </div>

        <div class="list-card">
          <div class="list-toolbar">
            <a-checkbox v-model:checked="selectAll" @change="toggleSelectAll">全选本页</a-checkbox>
            <a-checkbox v-model:checked="eventFilters.isSelf" class="self-check" @change="loadEvents">我负责的</a-checkbox>
          </div>

          <a-spin :spinning="loading">
            <div class="alert-list-container">
              <div
                v-for="record in formattedEvents"
                :key="record.id"
                :class="['alert-row', { selected: selectedRowKeys.includes(record.id) }]"
              >
                <div class="row-check-wrap">
                  <a-checkbox
                    :checked="selectedRowKeys.includes(record.id)"
                    @change="onRowChecked(record.id, $event.target.checked)"
                  />
                </div>

                <div :class="['alert-card', `st-${record.statusClass}`]">
                  <div :class="['alert-card__status-strip', `strip-${record.statusClass}`]" />
                  <div class="card-header">
                    <div class="header-left">
                      <a-tag :class="record.severityClass" :bordered="false">{{ record.severity }}</a-tag>
                      <a-tooltip :title="record.resourceName">
                        <a class="alert-title" @click="openDetail(record)">{{ record.resourceName }}</a>
                      </a-tooltip>
                      <a-tag :class="record.statusBadgeClass" :bordered="false">{{ record.statusLabel }}</a-tag>
                      <a-tag v-if="record.status === 'RESOLVED' && record.resolvedType === 'MANUAL'" color="blue">人工恢复</a-tag>
                      <a-tag v-else-if="record.status === 'RESOLVED' && record.resolvedType === 'AUTO'" color="green">自动恢复</a-tag>
                      <template v-if="record.resourceType !== 'DATA_QUALITY'">
                        <span class="count-tag">调度批次：{{ record.executionBatch || '-' }}</span>
                      </template>
                    </div>
                    <div class="card-actions">
                      <template v-if="record.status === 'FIRING'">
                        <a-button type="primary" size="small" @click="handleAction(record.id, 'acknowledge')">认领</a-button>
                        <a-button size="small" @click="openActionModal('silence', [record.id])">屏蔽</a-button>
                        <a-dropdown>
                          <a-button size="small">···</a-button>
                          <template #overlay>
                            <a-menu>
                              <a-menu-item key="fp" @click="openActionModal('falsePositive', [record.id])">误报</a-menu-item>
                              <a-menu-item key="resolve" @click="openActionModal('resolve', [record.id])">已解决</a-menu-item>
                            </a-menu>
                          </template>
                        </a-dropdown>
                      </template>
                      <template v-else-if="record.status === 'PROCESSING' || record.status === 'SILENCED'">
                        <a-button type="primary" size="small" @click="openActionModal('resolve', [record.id])">已解决</a-button>
                        <a-button size="small" @click="openActionModal('falsePositive', [record.id])">误报</a-button>
                      </template>
                      <template v-else-if="record.status === 'TRANSFERRED'">
                        <a-button type="primary" size="small" @click="handleAction(record.id, 'acknowledge')">认领</a-button>
                        <a-button size="small" @click="openActionModal('resolve', [record.id])">已解决</a-button>
                      </template>
                      <template v-else-if="record.status === 'RESOLVED'">
                        <span class="muted-text">恢复完成</span>
                      </template>
                      <template v-else-if="record.status === 'FALSE_POSITIVE'">
                        <a-button type="primary" size="small" @click="handleAction(record.id, 'acknowledge')">认领</a-button>
                      </template>
                    </div>
                  </div>

                  <div class="meta-row">
                    <div class="meta-item">首次触发时间：{{ record.triggerTime }}</div>
                    <div class="meta-item">来源：{{ resourceTypeLabel(record.resourceType) }}</div>
                    <div class="meta-item">监控事件：{{ record.monitorEvent }}</div>
                    <template v-if="record.resourceType === 'DATA_QUALITY'">
                      <div class="meta-item">质量监控名称：{{ record.qualityGroupName || record.resourceName }}</div>
                      <div class="meta-item">数据范围：{{ record.qualityDataRange || '-' }}</div>
                      <a-tag v-if="record.qualityTriggerType" color="blue">{{ record.qualityTriggerType }}</a-tag>
                    </template>
                    <template v-else>
                      <div class="meta-item">
                        任务实例ID：
                        <a v-if="record.executionId" class="execution-id-link" @click="jumpToSchedule(record)">
                          {{ record.executionId }}
                        </a>
                        <span v-else>-</span>
                      </div>
                    </template>
                    <a-tag class="count-tag" :bordered="false">通知{{ record.notifyCount }}次</a-tag>
                    <a-tag v-if="record.escalationDesc" color="error" :bordered="false">{{ record.escalationDesc }}</a-tag>
                    <template v-if="record.status === 'SILENCED'">
                      <div class="meta-item emphasis">屏蔽至：{{ record.silencedUntil }}</div>
                    </template>
                    <template v-else-if="record.status === 'RESOLVED'">
                      <div class="meta-item">持续时长：{{ formatDurationMinutes(record.durationMinutes) }}</div>
                      <div class="meta-item">恢复时间：{{ record.resolvedTime || '-' }}</div>
                      <div v-if="record.rootCause" class="meta-item success-text">故障根因：{{ record.rootCause }}</div>
                    </template>
                    <template v-else-if="record.status === 'FALSE_POSITIVE' && record.falsePositiveRemark">
                      <div class="meta-item">备注：{{ record.falsePositiveRemark }}</div>
                    </template>
                  </div>

                  <div v-if="record.logSlice" class="log-section">
                    <div class="log-header-row">
                      <div class="log-label">告警片段：</div>
                      <a-button type="link" size="small" @click="openLog(record.id)">查看完整日志</a-button>
                    </div>
                    <div class="log-box">{{ record.logSlice }}</div>
                  </div>

                  <div class="card-footer">
                    <div>
                      <span class="label">事件ID：</span>
                      <span class="val">{{ record.eventId }}</span>
                      <span class="divider">|</span>
                      <span class="label">负责人：</span>
                      <span class="val">{{ record.owner }}</span>
                      <span class="divider">|</span>
                      <span class="label">操作人：</span>
                      <span class="val">{{ record.lastOperator || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <a-empty
                v-if="!loading && !formattedEvents.length"
                description="当前筛选条件下暂无告警事件"
                :image="simpleImage"
              />
            </div>
          </a-spin>

          <a-row v-if="formattedEvents.length" justify="end" style="margin-top: 16px">
            <a-pagination
              v-model:current="eventPagination.current"
              v-model:page-size="eventPagination.pageSize"
              :total="eventPagination.total"
              :show-size-changer="true"
              :show-total="(total, range) => `${range[0]}-${range[1]}行，共 ${total} 行`"
              @change="loadEvents"
              @show-size-change="handlePageSizeChange"
            />
          </a-row>
        </div>

        <transition name="bulk-bar-slide">
          <div v-if="selectedRowKeys.length > 0" class="bulk-bar">
            <span class="sel-count">已选择 {{ selectedRowKeys.length }} 项</span>
            <div class="bulk-divider" />
            <a-button class="bulk-btn" @click="batchHandle('acknowledge')">批量认领</a-button>
            <a-button class="bulk-btn" @click="openActionModal('falsePositive', selectedRowKeys)">批量误报</a-button>
            <a-button class="bulk-btn" @click="openActionModal('silence', selectedRowKeys)">批量屏蔽</a-button>
            <a-button class="bulk-btn bulk-btn-resolve" @click="openActionModal('resolve', selectedRowKeys)">批量解决</a-button>
            <a-button class="bulk-btn-cancel" type="text" @click="clearSelection">取消</a-button>
          </div>
        </transition>
      </template>

      <template v-else>
        <div class="panel__header">
          <div>
            <h3>通知策略</h3>
            <p>支持创建、编辑、复制、删除、启停和设为默认策略。</p>
          </div>
        </div>

        <div class="policy-stats">
          <article class="mini-stat">
            <span>策略总数</span>
            <strong>{{ policySummary.total }}</strong>
          </article>
          <article class="mini-stat">
            <span>启用中</span>
            <strong>{{ policySummary.enabled }}</strong>
          </article>
          <article class="mini-stat">
            <span>内置策略</span>
            <strong>{{ policySummary.builtin }}</strong>
          </article>
          <article class="mini-stat">
            <span>默认策略</span>
            <strong>{{ policySummary.default }}</strong>
          </article>
        </div>

        <div class="filter-grid filter-grid--policy">
          <a-input v-model:value="policyFilters.keyword" placeholder="搜索策略名称" allow-clear />
          <a-select v-model:value="policyFilters.createdBy" allow-clear placeholder="创建人" :options="alertEnums.owners" />
          <div class="filter-actions">
            <a-button @click="resetPolicyFilters">重置</a-button>
            <a-button type="primary" @click="loadPolicies">查询</a-button>
          </div>
        </div>

        <a-table
          :data-source="policies"
          :columns="policyColumns"
          :pagination="policyPagination"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 1360 }"
          @change="handlePolicyTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a-space>
                <a-button type="link" @click="openPolicyDetail(record)">{{ record.name }}</a-button>
                <a-tag v-if="record.isBuiltin" color="blue">内置</a-tag>
                <a-tag v-if="record.isDefault" color="green">默认</a-tag>
              </a-space>
            </template>
            <template v-else-if="column.key === 'enabled'">
              <a-switch :checked="record.enabled" checked-children="开" un-checked-children="关" @change="togglePolicy(record, $event)" />
            </template>
            <template v-else-if="column.key === 'channels'">
              <a-space wrap>
                <a-tag v-for="item in record.channels" :key="item">{{ item }}</a-tag>
              </a-space>
            </template>
            <template v-else-if="column.key === 'operation'">
              <a-space wrap>
                <a-button size="small" @click="openPolicyDetail(record)">查看</a-button>
                <a-button size="small" type="primary" @click="openPolicyModal(record)">编辑</a-button>
                <a-button size="small" @click="openPolicyModal({ ...safeClone(record), id: undefined, name: `${record.name}-副本`, isDefault: false, isBuiltin: false })">复制</a-button>
                <a-button size="small" :disabled="record.isDefault" @click="setDefault(record.id)">设为默认</a-button>
                <a-popconfirm v-if="!record.isBuiltin" title="确认删除策略？" @confirm="deletePolicy(record.id)">
                  <a-button size="small" danger>删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </template>
    </section>

    <a-drawer v-model:open="detailOpen" title="告警详情" width="760">
      <div v-if="currentEvent" class="detail-grid">
        <div class="detail-hero detail-card detail-card--full">
          <div class="detail-hero__top">
            <a-space wrap>
              <a-tag :class="currentEvent.severity === 'ERROR' ? 'sev-error' : 'sev-warn'" :bordered="false">{{ currentEvent.severity }}</a-tag>
              <a-tag :class="`badge-${currentEvent.status.toLowerCase()}`" :bordered="false">{{ statusLabel(currentEvent.status) }}</a-tag>
              <a-tag v-if="currentEvent.resolvedType === 'MANUAL'" color="blue">人工恢复</a-tag>
              <a-tag v-else-if="currentEvent.resolvedType === 'AUTO'" color="green">自动恢复</a-tag>
            </a-space>
            <strong>{{ currentEvent.resourceName }}</strong>
          </div>
          <div class="detail-hero__meta">
            <span>事件ID：{{ currentEvent.eventId }}</span>
            <span>监控事件：{{ currentEvent.monitorEvent }}</span>
            <span>负责人：{{ currentEvent.owner }}</span>
            <span>通知{{ currentEvent.notifyCount || 0 }}次</span>
          </div>
        </div>
        <div class="detail-card"><span>事件ID</span><strong>{{ currentEvent.eventId }}</strong></div>
        <div class="detail-card"><span>资源类型</span><strong>{{ resourceTypeLabel(currentEvent.resourceType) }}</strong></div>
        <div class="detail-card"><span>资源名称</span><strong>{{ currentEvent.resourceName }}</strong></div>
        <div class="detail-card"><span>监控事件</span><strong>{{ currentEvent.monitorEvent }}</strong></div>
        <div class="detail-card"><span>负责人</span><strong>{{ currentEvent.owner }}</strong></div>
        <div class="detail-card"><span>通知策略</span><strong>{{ currentEvent.notifyPolicyName }}</strong></div>
        <div class="detail-card"><span>告警通道</span><strong>{{ currentEvent.channel }}</strong></div>
        <div class="detail-card"><span>持续时长</span><strong>{{ currentEvent.durationMinutes }} 分钟</strong></div>
        <div class="detail-card"><span>项目</span><strong>{{ currentEvent.projectName }}</strong></div>
        <div class="detail-card"><span>首次触发</span><strong>{{ currentEvent.triggerTime }}</strong></div>
        <div class="detail-card" v-if="currentEvent.resourceType === 'DATA_QUALITY'"><span>数据范围</span><strong>{{ currentEvent.qualityDataRange || '-' }}</strong></div>
        <div class="detail-card" v-else><span>任务实例ID</span><strong>{{ currentEvent.executionId || '-' }}</strong></div>
        <div class="detail-card detail-card--full"><span>说明</span><strong>{{ currentEvent.description }}</strong></div>
        <div class="detail-card detail-card--full"><span>故障根因</span><strong>{{ eventRootCause(currentEvent) }}</strong></div>
      </div>
      <div class="log-section log-section--drawer">
        <div class="log-section__title">事件日志</div>
        <a-timeline>
          <a-timeline-item v-for="item in currentLogs" :key="item.id">
            <div class="timeline-item">
              <strong>{{ item.action }}</strong>
              <span>{{ item.time }} · {{ item.operator }}</span>
              <p>{{ item.detail }}</p>
            </div>
          </a-timeline-item>
        </a-timeline>
      </div>
    </a-drawer>

    <a-drawer v-model:open="logOpen" title="完整日志" width="640">
      <a-timeline>
        <a-timeline-item v-for="item in currentLogs" :key="item.id">
          <div class="timeline-item">
            <strong>{{ item.action }}</strong>
            <span>{{ item.time }} · {{ item.operator }}</span>
            <p>{{ item.detail }}</p>
          </div>
        </a-timeline-item>
      </a-timeline>
    </a-drawer>

    <a-drawer v-model:open="policyDetailOpen" title="策略详情" width="680">
      <div v-if="currentPolicy" class="detail-grid">
        <div class="detail-card detail-card--full">
          <div class="detail-hero__top">
            <a-space wrap>
              <a-tag v-if="currentPolicy.isBuiltin" color="blue">内置</a-tag>
              <a-tag v-if="currentPolicy.isDefault" color="green">默认</a-tag>
              <a-tag :color="currentPolicy.enabled ? 'green' : 'default'">{{ currentPolicy.enabled ? '启用中' : '已停用' }}</a-tag>
            </a-space>
            <strong>{{ currentPolicy.name }}</strong>
          </div>
          <div class="detail-hero__meta">
            <span>创建人：{{ currentPolicy.createdBy }}</span>
            <span>通知{{ currentPolicy.channels.length }}个渠道</span>
            <span>接收{{ currentPolicy.receivers.length }}类对象</span>
          </div>
        </div>
        <div class="detail-card"><span>策略名称</span><strong>{{ currentPolicy.name }}</strong></div>
        <div class="detail-card"><span>创建人</span><strong>{{ currentPolicy.createdBy }}</strong></div>
        <div class="detail-card detail-card--full"><span>描述</span><strong>{{ currentPolicy.description }}</strong></div>
        <div class="detail-card"><span>通知渠道</span><strong>{{ currentPolicy.channels.join(' / ') }}</strong></div>
        <div class="detail-card"><span>接收对象</span><strong>{{ currentPolicy.receivers.join(' / ') }}</strong></div>
        <div class="detail-card"><span>频控间隔</span><strong>{{ currentPolicy.frequencyIntervalMinutes }} 分钟</strong></div>
        <div class="detail-card"><span>最大次数</span><strong>{{ currentPolicy.maxSendTimes }} 次</strong></div>
      </div>
    </a-drawer>

    <a-modal v-model:open="actionOpen" :title="actionTitle" width="640px" @ok="confirmAction">
      <a-form layout="vertical">
        <a-alert type="info" show-icon :message="`本次将处理 ${actionTargetIds.length} 条告警`" style="margin-bottom: 16px" />
        <a-form-item v-if="actionType === 'transfer'" label="新负责人">
          <a-select v-model:value="actionForm.owner" :options="alertEnums.owners" />
        </a-form-item>
        <a-form-item v-if="actionType === 'falsePositive'" label="误报原因">
          <a-select v-model:value="actionForm.reason" :options="alertEnums.falsePositiveReasons" />
        </a-form-item>
        <a-form-item v-if="actionType === 'silence'" label="静默时长（小时）">
          <a-input-number v-model:value="actionForm.silenceHours" :min="1" :max="72" style="width: 100%" />
        </a-form-item>
        <a-form-item v-if="actionType === 'resolve'" label="故障根因">
          <a-textarea v-model:value="actionForm.rootCause" :rows="3" />
        </a-form-item>
        <a-form-item label="处理备注">
          <a-textarea v-model:value="actionForm.remark" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="policyOpen" :title="policyForm.id ? '编辑策略' : '新建策略'" width="840px" @ok="savePolicy">
      <div class="policy-form">
        <section class="policy-form__section">
          <div class="policy-form__title">基本信息</div>
          <a-form layout="vertical">
            <a-form-item label="策略名称"><a-input v-model:value="policyForm.name" /></a-form-item>
            <a-form-item label="描述"><a-textarea v-model:value="policyForm.description" :rows="3" /></a-form-item>
            <a-form-item label="创建人"><a-select v-model:value="policyForm.createdBy" :options="alertEnums.owners" /></a-form-item>
          </a-form>
        </section>
        <section class="policy-form__section">
          <div class="policy-form__title">通知配置</div>
          <a-form layout="vertical">
            <a-form-item label="通知渠道"><a-select v-model:value="policyForm.channels" mode="multiple" :options="alertEnums.channels" /></a-form-item>
            <a-form-item label="接收对象"><a-select v-model:value="policyForm.receivers" mode="tags" /></a-form-item>
          </a-form>
        </section>
        <section class="policy-form__section">
          <div class="policy-form__title">频控规则</div>
          <a-form layout="vertical">
            <a-form-item label="频控间隔（分钟）"><a-input-number v-model:value="policyForm.frequencyIntervalMinutes" :min="1" style="width: 100%" /></a-form-item>
            <a-form-item label="最大连续发送次数"><a-input-number v-model:value="policyForm.maxSendTimes" :min="1" style="width: 100%" /></a-form-item>
            <a-form-item label="状态"><a-switch v-model:checked="policyForm.enabled" checked-children="启用" un-checked-children="停用" /></a-form-item>
          </a-form>
        </section>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { message, Empty } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import type { TablePaginationConfig } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import AlertApi, {
  type AlertEventItem,
  type AlertLogItem,
  type AlertPolicyItem,
} from '@/resources/alert';
import { safeClone } from '@/utils/safe-clone';

type ActionType = 'resolve' | 'silence' | 'falsePositive' | 'transfer';

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
const router = useRouter();
const activeTab = ref<'event' | 'policy'>('event');
const loading = ref(false);
const detailOpen = ref(false);
const logOpen = ref(false);
const policyDetailOpen = ref(false);
const policyOpen = ref(false);
const actionOpen = ref(false);
const expanded = ref(false);
const selectAll = ref(false);
const batchRange = ref<[Dayjs, Dayjs] | undefined>();
const currentEvent = ref<AlertEventItem | null>(null);
const currentPolicy = ref<AlertPolicyItem | null>(null);
const currentLogs = ref<AlertLogItem[]>([]);
const events = ref<AlertEventItem[]>([]);
const policies = ref<AlertPolicyItem[]>([]);
const selectedRowKeys = ref<string[]>([]);
const selectedCard = ref<string>('allPending');
const actionType = ref<ActionType>('resolve');
const actionTargetIds = ref<string[]>([]);

const alertEnums = reactive<Record<string, Array<{ label: string; value: string }>>>({
  resourceTypes: [],
  eventTypes: [],
  severities: [],
  statuses: [],
  owners: [],
  channels: [],
  falsePositiveReasons: [],
});
const overview = reactive({
  firing: 0,
  processing: 0,
  silenced: 0,
  resolved: 0,
});

const eventFilters = reactive({
  resourceType: undefined as string | undefined,
  keyword: '',
  eventId: '',
  eventTypes: [] as string[],
  statuses: ['FIRING', 'PROCESSING', 'SILENCED'] as string[],
  severities: [] as string[],
  owners: [] as string[],
  lastOperators: [] as string[],
  isSelf: false,
  todayOnly: false,
});
const policyFilters = reactive({
  keyword: '',
  createdBy: undefined as string | undefined,
});
const policyForm = reactive<Partial<AlertPolicyItem>>({
  name: '',
  description: '',
  createdBy: 'demo_user',
  channels: ['IM'],
  receivers: ['owner'],
  frequencyIntervalMinutes: 15,
  maxSendTimes: 3,
  enabled: true,
});
const actionForm = reactive({
  owner: undefined as string | undefined,
  reason: undefined as string | undefined,
  rootCause: '',
  remark: '',
  silenceHours: 12,
});

const eventPagination = reactive({ current: 1, pageSize: 10, total: 0 });
const policyPagination = reactive<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0, showSizeChanger: true });

const policyColumns = [
  { title: '策略名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '描述', dataIndex: 'description', key: 'description', width: 240 },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
  { title: '更新于', dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
  { title: '通知渠道', dataIndex: 'channels', key: 'channels', width: 180 },
  { title: '频控间隔', dataIndex: 'frequencyIntervalMinutes', key: 'frequencyIntervalMinutes', width: 110 },
  { title: '最大次数', dataIndex: 'maxSendTimes', key: 'maxSendTimes', width: 100 },
  { title: '开关', dataIndex: 'enabled', key: 'enabled', width: 90 },
  { title: '操作', key: 'operation', width: 280, fixed: 'right' as const },
];

const policySummary = computed(() => ({
  total: policyPagination.total || 0,
  enabled: policies.value.filter((item) => item.enabled).length,
  builtin: policies.value.filter((item) => item.isBuiltin).length,
  default: policies.value.filter((item) => item.isDefault).length,
}));

const overviewCards = computed(() => [
  { key: 'allPending', label: '全部待处理', count: overview.firing + overview.processing + overview.silenced },
  { key: 'myPending', label: '我的待处理', count: events.value.filter((item) => item.owner === 'demo_user' && ['FIRING', 'PROCESSING', 'SILENCED'].includes(item.status)).length },
  { key: 'todayNew', label: '今日新增', count: overview.firing + Math.max(1, Math.floor(overview.processing / 2)) },
  { key: 'myTodayNew', label: '我的新增', count: Math.max(1, events.value.filter((item) => item.owner === 'demo_user').length) },
]);

const actionTitle = computed(() => ({
  resolve: '解决告警',
  silence: '屏蔽告警',
  falsePositive: '标记误报',
  transfer: '转派告警',
}[actionType.value]));

const formattedEvents = computed(() =>
  events.value.map((record) => ({
    ...record,
    severityClass: record.severity === 'ERROR' ? 'sev-error' : 'sev-warn',
    statusClass: record.status.toLowerCase(),
    statusBadgeClass: `badge-${record.status.toLowerCase()}`,
    statusLabel: statusLabel(record.status),
    logSlice: `${record.monitorEvent} | ${record.description}`,
  })),
);

function statusLabel(status: string) {
  return {
    FIRING: '触发中',
    PROCESSING: '处理中',
    SILENCED: '已屏蔽',
    RESOLVED: '已解决',
    FALSE_POSITIVE: '误报',
    TRANSFERRED: '已转派',
  }[status] || status;
}

function resourceTypeLabel(type: string) {
  return {
    TASK: '任务',
    DATA_QUALITY: '数据质量',
    TABLE: '表监控',
  }[type] || type;
}

function formatDurationMinutes(minutes?: number) {
  if (!minutes) return '-';
  const hour = Math.floor(minutes / 60);
  const remain = minutes % 60;
  if (hour > 0) return `${hour}小时${remain}分钟`;
  return `${remain}分钟`;
}

function eventRootCause(event?: AlertEventItem | null) {
  return event?.rootCause || event?.description || '-';
}

async function loadOverview() {
  Object.assign(overview, await AlertApi.fetchOverview());
}

async function loadEnums() {
  Object.assign(alertEnums, await AlertApi.fetchEnums());
}

async function loadEvents() {
  loading.value = true;
  try {
    const res = await AlertApi.fetchEvents({
      ...eventFilters,
      pageNo: eventPagination.current,
      pageSize: eventPagination.pageSize,
    });
    events.value = res.items;
    eventPagination.total = res.total;
    clearSelection();
  } finally {
    loading.value = false;
  }
}

async function loadPolicies() {
  loading.value = true;
  try {
    const res = await AlertApi.fetchPolicies({
      ...policyFilters,
      pageNo: policyPagination.current,
      pageSize: policyPagination.pageSize,
    });
    policies.value = res.items;
    policyPagination.total = res.total;
  } finally {
    loading.value = false;
  }
}

function handleTabChange() {
  if (activeTab.value === 'event') loadEvents();
  else loadPolicies();
}

function handleCardClick(type: string) {
  if (selectedCard.value === type) {
    selectedCard.value = '';
    eventFilters.isSelf = false;
    eventFilters.todayOnly = false;
    eventFilters.statuses = ['FIRING', 'PROCESSING', 'SILENCED'];
  } else {
    selectedCard.value = type;
    switch (type) {
      case 'myPending':
        eventFilters.isSelf = true;
        eventFilters.todayOnly = false;
        eventFilters.statuses = ['FIRING', 'PROCESSING', 'SILENCED'];
        break;
      case 'todayNew':
        eventFilters.isSelf = false;
        eventFilters.todayOnly = true;
        eventFilters.statuses = [];
        break;
      case 'myTodayNew':
        eventFilters.isSelf = true;
        eventFilters.todayOnly = true;
        eventFilters.statuses = [];
        break;
      default:
        eventFilters.isSelf = false;
        eventFilters.todayOnly = false;
        eventFilters.statuses = ['FIRING', 'PROCESSING', 'SILENCED'];
    }
  }
  eventPagination.current = 1;
  loadEvents();
}

function resetEventFilters() {
  eventFilters.resourceType = undefined;
  eventFilters.keyword = '';
  eventFilters.eventId = '';
  eventFilters.eventTypes = [];
  eventFilters.statuses = ['FIRING', 'PROCESSING', 'SILENCED'];
  eventFilters.severities = [];
  eventFilters.owners = [];
  eventFilters.lastOperators = [];
  eventFilters.isSelf = false;
  eventFilters.todayOnly = false;
  selectedCard.value = 'allPending';
  batchRange.value = undefined;
  eventPagination.current = 1;
  loadEvents();
}

function resetPolicyFilters() {
  policyFilters.keyword = '';
  policyFilters.createdBy = undefined;
  policyPagination.current = 1;
  loadPolicies();
}

function onRowChecked(id: string, checked: boolean) {
  selectedRowKeys.value = checked
    ? Array.from(new Set([...selectedRowKeys.value, id]))
    : selectedRowKeys.value.filter((item) => item !== id);
  selectAll.value = selectedRowKeys.value.length === events.value.length && events.value.length > 0;
}

function toggleSelectAll() {
  selectedRowKeys.value = selectAll.value ? events.value.map((item) => item.id) : [];
}

function clearSelection() {
  selectedRowKeys.value = [];
  selectAll.value = false;
}

async function handleAction(
  id: string,
  action: 'acknowledge' | 'resolve' | 'falsePositive' | 'silence' | 'transfer',
  payload?: { owner?: string; remark?: string; reason?: string; rootCause?: string; silenceHours?: number },
) {
  await AlertApi.updateStatus(id, action, payload);
  message.success('告警状态已更新');
  await Promise.all([loadOverview(), loadEvents()]);
}

async function batchHandle(action: 'acknowledge') {
  await AlertApi.batchUpdate(selectedRowKeys.value, action);
  message.success('批量处理成功');
  await Promise.all([loadOverview(), loadEvents()]);
}

async function openDetail(record: AlertEventItem) {
  const [detail, logs] = await Promise.all([
    AlertApi.fetchDetail(record.id),
    AlertApi.fetchLogs(record.id),
  ]);
  currentEvent.value = detail;
  currentLogs.value = logs;
  detailOpen.value = true;
}

async function openLog(id: string) {
  currentLogs.value = await AlertApi.fetchLogs(id);
  logOpen.value = true;
}

function jumpToSchedule(record: AlertEventItem) {
  if (!record.executionId) return;
  router.push({
    path: '/schedule',
    query: {
      source: 'alert',
      executionId: record.executionId,
      resourceName: record.resourceName,
    },
  });
}

function openActionModal(type: ActionType, ids: string[]) {
  actionType.value = type;
  actionTargetIds.value = ids;
  actionForm.owner = undefined;
  actionForm.reason = undefined;
  actionForm.rootCause = '';
  actionForm.remark = '';
  actionForm.silenceHours = 12;
  actionOpen.value = true;
}

async function confirmAction() {
  if (actionType.value === 'transfer' && !actionForm.owner) {
    message.warning('请选择新负责人');
    return;
  }
  if (actionType.value === 'falsePositive' && !actionForm.reason) {
    message.warning('请选择误报原因');
    return;
  }
  if (actionType.value === 'resolve' && !actionForm.rootCause.trim()) {
    message.warning('请填写故障根因');
    return;
  }
  if (actionTargetIds.value.length === 1) {
    await handleAction(actionTargetIds.value[0], actionType.value, actionForm);
  } else {
    await AlertApi.batchUpdate(actionTargetIds.value, actionType.value, actionForm);
    message.success('批量处理成功');
    await Promise.all([loadOverview(), loadEvents()]);
  }
  actionOpen.value = false;
}

function openPolicyDetail(record: AlertPolicyItem) {
  currentPolicy.value = safeClone(record);
  policyDetailOpen.value = true;
}

function openPolicyModal(record?: Partial<AlertPolicyItem>) {
  Object.assign(policyForm, {
    id: undefined,
    name: '',
    description: '',
    createdBy: 'demo_user',
    channels: ['IM'],
    receivers: ['owner'],
    frequencyIntervalMinutes: 15,
    maxSendTimes: 3,
    enabled: true,
  });
  if (record) Object.assign(policyForm, safeClone(record));
  policyOpen.value = true;
}

async function savePolicy() {
  await AlertApi.savePolicy(policyForm);
  policyOpen.value = false;
  message.success('策略已保存');
  await loadPolicies();
}

async function deletePolicy(id: string) {
  await AlertApi.deletePolicy(id);
  message.success('策略已删除');
  await loadPolicies();
}

async function togglePolicy(record: AlertPolicyItem, checked: boolean) {
  await AlertApi.togglePolicy(record.id, checked);
  message.success('策略状态已更新');
  await loadPolicies();
}

async function setDefault(id: string) {
  await AlertApi.setDefaultPolicy(id);
  message.success('默认策略已更新');
  await loadPolicies();
}

function handlePolicyTableChange(pag: TablePaginationConfig) {
  policyPagination.current = pag.current || 1;
  policyPagination.pageSize = pag.pageSize || 10;
  loadPolicies();
}

function handlePageSizeChange(_page: number, pageSize: number) {
  eventPagination.pageSize = pageSize;
  eventPagination.current = 1;
  loadEvents();
}

function reloadCurrent() {
  if (activeTab.value === 'event') loadEvents();
  else loadPolicies();
}

onMounted(async () => {
  await Promise.all([loadEnums(), loadOverview(), loadEvents()]);
});
</script>

<style lang="less" scoped>
.alert-page {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(239, 68, 68, 0.08), transparent 24%),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%);
}

.alert-page__hero,
.panel,
.detail-card,
.mini-stat,
.policy-form__section,
.search-card,
.list-card,
.overview-card,
.alert-card {
  border: 1px solid rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.alert-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px 28px;
}

.alert-page__eyebrow {
  margin: 0 0 8px;
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.alert-page__hero h2,
.panel__header h3 {
  margin: 0;
}

.alert-page__desc,
.panel__header p {
  margin: 8px 0 0;
  color: #667085;
}

.panel {
  padding: 20px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 12px;
}

.overview-card {
  padding: 16px 20px;
  cursor: pointer;
}

.overview-card.active {
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 16px 36px rgba(59, 130, 246, 0.12);
}

.overview-card__title {
  color: #667085;
  font-size: 13px;
}

.overview-card__count {
  margin-top: 8px;
  color: #101828;
  font-size: 30px;
  font-weight: 700;
}

.search-card,
.list-card {
  margin-top: 12px;
  padding: 16px;
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.self-check {
  color: #1677ff;
}

.alert-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 10px;
  align-items: flex-start;
}

.alert-row.selected .alert-card {
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 16px 36px rgba(59, 130, 246, 0.12);
}

.row-check-wrap {
  display: flex;
  justify-content: center;
  padding-top: 18px;
}

.alert-card {
  position: relative;
  padding: 16px 18px;
  padding-left: 24px;
}

.alert-card.st-resolved {
  background: linear-gradient(180deg, #ffffff 0%, #f6fff8 100%);
}

.alert-card.st-firing {
  border-color: rgba(239, 68, 68, 0.2);
}

.alert-card.st-processing,
.alert-card.st-transferred {
  border-color: rgba(59, 130, 246, 0.2);
}

.alert-card__status-strip {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 0 999px 999px 0;
  background: #cbd5e1;
}

.alert-card__status-strip.strip-firing {
  background: linear-gradient(180deg, #ef4444 0%, #f97316 100%);
}

.alert-card__status-strip.strip-processing,
.alert-card__status-strip.strip-transferred {
  background: linear-gradient(180deg, #1677ff 0%, #60a5fa 100%);
}

.alert-card__status-strip.strip-silenced,
.alert-card__status-strip.strip-false_positive {
  background: linear-gradient(180deg, #7c3aed 0%, #a855f7 100%);
}

.alert-card__status-strip.strip-resolved {
  background: linear-gradient(180deg, #16a34a 0%, #4ade80 100%);
}

.card-header,
.card-footer,
.meta-row,
.log-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-header {
  align-items: flex-start;
}

.header-left,
.card-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.alert-title {
  color: #1677ff;
  font-weight: 600;
}

.execution-id-link {
  color: #1677ff;
  cursor: pointer;
}

.sev-error {
  background: #fff1f0;
  color: #cf1322;
}

.sev-warn {
  background: #fffbe6;
  color: #d48806;
}

.badge-firing {
  background: #fff1f0;
  color: #cf1322;
}

.badge-processing,
.badge-transferred {
  background: #e6f4ff;
  color: #0958d9;
}

.badge-silenced {
  background: #faf5ff;
  color: #722ed1;
}

.badge-resolved {
  background: #f6ffed;
  color: #389e0d;
}

.badge-false_positive {
  background: #f9f0ff;
  color: #722ed1;
}

.meta-row {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e5e7eb;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.meta-item,
.count-tag,
.muted-text {
  color: #667085;
  font-size: 12px;
}

.emphasis {
  color: #722ed1;
}

.success-text {
  color: #389e0d;
}

.count-tag {
  padding: 0 10px;
  border-radius: 999px;
  background: #f5f7fb;
}

.log-section {
  margin-top: 14px;
}

.log-header-row {
  justify-content: space-between;
  margin-bottom: 8px;
}

.log-label {
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}

.log-box {
  padding: 12px 14px;
  border-radius: 12px;
  background: #0f172a;
  color: #e5e7eb;
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.card-footer {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #eef2f7;
  justify-content: flex-start;
}

.label,
.divider {
  color: #98a2b3;
  font-size: 12px;
}

.val {
  color: #344054;
  font-size: 12px;
}

.bulk-bar {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.94);
  color: #fff;
  transform: translateX(-50%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
}

.sel-count {
  font-size: 13px;
}

.bulk-divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.18);
}

.bulk-btn {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.bulk-btn-resolve {
  background: #1677ff;
}

.bulk-btn-cancel {
  color: rgba(255, 255, 255, 0.72);
}

.policy-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.mini-stat {
  padding: 16px 18px;
}

.mini-stat span,
.detail-card span {
  color: #667085;
  font-size: 13px;
}

.mini-stat strong {
  display: block;
  margin-top: 8px;
  color: #101828;
  font-size: 26px;
}

.filter-grid--policy {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 18px;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
  color: #101828;
}

.detail-card--full {
  grid-column: 1 / -1;
}

.detail-hero {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
}

.detail-hero__top {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-hero__top strong {
  font-size: 22px;
}

.detail-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #667085;
  font-size: 13px;
}

.log-section--drawer {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(16, 24, 40, 0.06);
}

.log-section__title,
.policy-form__title {
  margin-bottom: 12px;
  color: #101828;
  font-size: 15px;
  font-weight: 600;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-item span,
.timeline-item p {
  color: #667085;
}

.timeline-item p {
  margin: 0;
}

.policy-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.policy-form__section {
  padding: 16px;
}

.bulk-bar-slide-enter-active,
.bulk-bar-slide-leave-active {
  transition: all 0.2s ease;
}

.bulk-bar-slide-enter-from,
.bulk-bar-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}

@media (max-width: 960px) {
  .alert-page {
    padding: 16px;
  }

  .alert-page__hero,
  .overview-grid,
  .filter-grid--policy,
  .detail-grid,
  .policy-stats,
  .policy-form {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .bulk-bar {
    left: 16px;
    right: 16px;
    transform: none;
    border-radius: 20px;
    flex-wrap: wrap;
  }
}
</style>
