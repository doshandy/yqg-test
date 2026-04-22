<!-- @Author: weisun -->
<!-- @Date: 2024/4/23 14:32 -->
<!-- @Last Modified by: weisun -->
<!-- @Last Modified time: 2024/4/23 14:32 -->

<template>
  <div class="sql-query">
    <div class="ttp-header">
      <div class="ttp-tabs">
        <span class="ttp-tab active">任务开发</span>
      </div>
      <Button type="primary" size="small" @click="createTask(false)">+ 新建</Button>
    </div>
    <div class="ttp-search-bar">
      <Input
        v-model:value="searchValue"
        placeholder="搜索任务名"
        allow-clear
        size="small"
        @pressEnter="onSearchData"
        @change="onSearchInputChange"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </Input>
      <Popover
        trigger="click"
        placement="bottomRight"
        v-model:open="filterOpen"
        :arrow="false"
        overlay-class-name="ttp-filter-popover"
      >
        <template #content>
          <div class="ttp-filter-panel">
            <div class="ttp-filter-panel-title">筛选条件</div>
            <div class="ttp-filter-panel-body">
              <div class="ttp-filter-field ttp-filter-field-select">
                <div class="ttp-filter-label">数据库</div>
                <Select
                  v-model:value="draftFilters.databases"
                  mode="multiple"
                  size="small"
                  placeholder="全部数据库"
                  :options="databaseOptions"
                  :max-tag-count="2"
                  allow-clear
                />
              </div>
              <div class="ttp-filter-field ttp-filter-field-select">
                <div class="ttp-filter-label">负责人</div>
                <Select
                  v-model:value="draftFilters.owners"
                  mode="multiple"
                  size="small"
                  placeholder="全部负责人"
                  :options="ownerOptions"
                  :max-tag-count="1"
                  allow-clear
                />
              </div>
              <div class="ttp-filter-field ttp-filter-field-checkbox">
                <div class="ttp-filter-label">任务类型</div>
                <CheckboxGroup
                  v-model:value="draftFilters.types"
                  :options="taskTypeOptions"
                />
              </div>
            </div>
            <div class="ttp-filter-panel-footer">
              <a @click="handleResetFilter">重置</a>
              <Button type="primary" size="small" @click="handleApplyFilter">确定</Button>
            </div>
          </div>
        </template>
        <div :class="['ttp-filter-btn', hasActiveFilter ? 'active' : '']">
          <FilterOutlined />
          <span v-if="hasActiveFilter" class="ttp-filter-badge" />
        </div>
      </Popover>
    </div>
    <div class="ttp-tree-toolbar">
      <div class="ttp-tree-toolbar-left">
        <AppstoreOutlined :style="{ fontSize: '14px' }" />
        <span v-if="hasActiveSearch">筛选结果 <span class="ttp-filter-count">({{ filteredCount }})</span></span>
        <span v-else>全部</span>
      </div>
      <div class="ttp-tree-toolbar-right">
        <Tooltip title="刷新">
          <RedoOutlined @click="onRedo" />
        </Tooltip>
        <Tooltip title="重置筛选">
          <ClearOutlined
            :class="hasActiveSearch ? 'ttp-toolbar-reset-active' : 'ttp-toolbar-reset-inactive'"
            @click="onResetAllClick"
          />
        </Tooltip>
      </div>
    </div>
    <div class="ttp-tree-area">
      <Spin :spinning="loading">
      <div class="tree" v-if="treeData && treeData.length">
        <Tree
          v-model:selectedKeys="selectedKeys"
          :autoExpandParent="autoExpandParent"
          v-model:expandedKeys="expandedKeys"
          v-model:tree-data="treeData"
          show-icon
          @select="selectTreeNode"
          class="query-tree"
          :load-data="searchValue ? undefined : onLoadData"
          @expand="onExpand"
          :fieldNames="{children:'children', title:'taskName', key: 'key' }"
        >
          <template #icon="{ dataRef }">
            <DatabaseOutlined v-if="dataRef.itemType === 'DATABASE'" style="display: inline-block;" />
            <FolderOpenOutlined v-if="dataRef.itemType === 'DIRECTORY'" style="display: inline-block;color: #1677ff" />
            <Tooltip
              placement="top"
              title="未提交"
            >
              <UploadOutlined v-if="dataRef.itemType === 'TASK' && ['ONLINE_HAS_DIFF','OFFLINE_HAS_DIFF','NO_PRODUCTION_TASK'].includes(dataRef.productionTaskStatus)" style="display: inline-block;color: #1677ff"/>
            </Tooltip>
          </template>

          <template #title="{ id, taskName, dataRef }">
            <Button type="text" v-if="id === 'opt'" size="small" @click="onLoadMore(dataRef)"><DownCircleOutlined /></Button>
            <div v-else style="width: 100%" :class="dataRef.itemType === 'TASK' ? 'task-item' : ''">
                <Typography.Paragraph
                  v-if="dataRef.itemType === 'DIRECTORY' || dataRef.itemType === 'DATABASE'"
                  :style="{ width: '100%', marginBottom: 0 }"
                  :ellipsis="{ tooltip: taskName }"
                  :content="taskName"
                />
                <Tooltip
                  placement="rightTop"
                  color="#fff"
                  :overlayInnerStyle="{ width: '420px', maxWidth: 'none', padding: 0 }"
                  style="width: 100%"
                >
                  <template #title>

                    <Card size="small" :bordered="false" style="width: 100%">
                      <template #title>
                        <div class="card-title">
                          <Typography.Paragraph
                            :style="{ maxWidth: '330px', marginBottom: 0 }"
                            :ellipsis="{ tooltip: dataRef.taskName }"
                            :content="dataRef.taskName"
                            :copyable="{ tooltip: false }"
                          />
                          <span v-if="['ONLINE_NO_DIFF','ONLINE_HAS_DIFF'].includes(dataRef.productionTaskStatus)" style="color: #52c41a; margin-left: 8px;">已上线</span>
                          <span v-else-if="['OFFLINE_NO_DIFF','OFFLINE_HAS_DIFF'].includes(dataRef.productionTaskStatus)" style="color: #ff4d4f; margin-left: 8px;">已下线</span>
                          <span v-else style=" margin-left: 8px;">未上线</span>
                        </div>
                      </template>
                      <p><b>任务描述：</b>{{dataRef.description || '-'}}</p>
                      <p v-if="dataRef.productionTaskStatus !== 'NO_PRODUCTION_TASK'"><b>目标表：</b><a @click="openTable(dataRef)">{{dataRef.tableName || '-'}}</a></p>
                      <p><b>负责人：</b>{{dataRef.owner || '-' }}</p>
                      <p><b>调度类型：</b>{{dataRef.scheduleConfig?.scheduleType ? scheduleTypeMap[dataRef.scheduleConfig.scheduleType]  : '-'}}</p>
                      <p><b>调度时间：</b>{{dataRef.scheduleConfig?.cronExpression || '-' }}</p>
                      <p><b>最近发布时间：</b>{{dataRef.updatedAt ? dayjs(dataRef.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-' }}</p>
                    </Card>
                  </template>
                  <ExperimentOutlined
                    v-if="dataRef.itemType === 'TASK' && dataRef.taskType === 'LLM_SKILLS'"
                    style="margin-right: 5px; font-size: 14px; color: #6366f1; vertical-align: middle;"
                  />
                  <DeploymentUnitOutlined
                    v-else-if="dataRef.itemType === 'TASK' && dataRef.taskType === 'NOTEBOOK'"
                    style="margin-right: 5px; font-size: 14px; color: #1677ff; vertical-align: middle;"
                  />
                  <img
                    v-else-if="dataRef.itemType === 'TASK'"
                    :src="dataRef.taskType === 'SPARK_SQL' ? sqlIcon : pythonIcon"
                    style="margin-right: 5px; width: 14px; height: 14px; vertical-align: middle;"
                    alt=""
                  />
                  <Typography.Paragraph
                    v-if="dataRef.itemType === 'TASK'"
                    :style="{ width: '100%', display: 'inline-block', marginBottom: 0, color: colorMap[dataRef.productionTaskStatus] }"
                    :ellipsis="{ tooltip: taskName }"
                    :content="taskName"
                  />
                </Tooltip>
                <Dropdown :arrow="{ pointAtCenter: true }" placement="bottom" v-if="dataRef.itemType === 'DATABASE'">
                  <MoreOutlined class="more-btn" @click.stop.prevent />
                  <template #overlay>
                    <Menu>
                      <Menu.Item key="1" @click="createTask(false, dataRef)">
                        新建任务
                      </Menu.Item>
                      <Menu.Item key="2" @click="createMenu(false, '子目录', dataRef)">
                        新建子目录
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
                <Dropdown :arrow="{ pointAtCenter: true }" placement="bottom" v-if="dataRef.itemType === 'DIRECTORY'">
                  <MoreOutlined class="more-btn" @click.stop.prevent />

                  <template #overlay>
                    <Menu>
                      <Menu.Item key="1" @click="createTask(false, dataRef)">
                        新建任务
                      </Menu.Item>

                      <Menu.Item v-if="dataRef.itemLevel <= 2" key="2" @click="createMenu(false, '子目录', dataRef)">
                        新建子目录
                      </Menu.Item>

                      <Menu.Item key="3" @click="createMenu(true, '目录', dataRef)">
                        重命名
                      </Menu.Item>



                      <Menu.Item key="4" @click="deleteTree('menu', dataRef)">
                        删除
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
                <Dropdown :arrow="{ pointAtCenter: true }" placement="bottom" v-if="dataRef.itemType === 'TASK'">
                  <MoreOutlined class="more-btn" @click.stop.prevent />
                  <template #overlay>
                    <Menu>
                      <Menu.Item key="1" @click="createTask(true, dataRef)">
                        重命名
                      </Menu.Item>
                      <Menu.Item key="2" @click="createMenu(false, '修改任务保存路径', dataRef,true)">
                        移动至
                      </Menu.Item>
                      <Menu.Item key="3" @click="onlineTask(true, dataRef)" v-if="['OFFLINE_NO_DIFF','OFFLINE_HAS_DIFF'].includes(dataRef.productionTaskStatus)">
                        上线
                      </Menu.Item>
                      <Menu.Item key="4" @click="onlineTask(false, dataRef)" v-if="['ONLINE_NO_DIFF','ONLINE_HAS_DIFF'].includes(dataRef.productionTaskStatus)">
                        下线
                      </Menu.Item>
                      <Menu.Item key="5" @click="deleteTree('task', dataRef)" v-if="['OFFLINE_NO_DIFF','OFFLINE_HAS_DIFF', 'NO_PRODUCTION_TASK'].includes(dataRef.productionTaskStatus)">
                        删除
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
            </div>
          </template>
        </Tree>
      </div>
      <Empty v-else :image="simpleImage">
        <template #description>
          <span>暂无数据</span>
        </template>
      </Empty>
      </Spin>
    </div>
    <CreateTaskModal ref="createTaskModal" @on-close="onTaskModalClose"  @createMenu="createMenu"/>
    <CreateMenuModal ref="createMenuModal" @on-refresh="onMenuRefresh"/>
    <DeleteTaskMdal ref="deleteTaskModal" @on-refresh="onDeleteModalClose"/>
    <SubmitPaneModal ref="submitPaneModal"/>
    <SubmitValidateDrawer ref="submitValidateDrawer" @on-close="onSubmitValidate"/>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import {
  MoreOutlined,
  RedoOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  DownCircleOutlined,
  DatabaseOutlined,
  UploadOutlined,
  ExperimentOutlined,
  DeploymentUnitOutlined,
  FilterOutlined,
  AppstoreOutlined,
  ClearOutlined,
} from '@ant-design/icons-vue';
// @ts-ignore
import sqlIcon from '@/assets/data-develop/sql.svg?url';
// @ts-ignore
import pythonIcon from '@/assets/data-develop/python.svg?url';

import {
  Button,
  Tooltip,
  Dropdown,
  Menu,
  Empty,
  Spin,
  message,
  Input,
  Tree,
  Typography,
  Card,
  Popover,
  Select,
  Checkbox,
} from 'ant-design-vue';

import Sql from '@/resources/sql';
import CreateTaskModal from '../modal/create-task.vue';
import CreateMenuModal from '../modal/create-menu.vue';
import DeleteTaskMdal from '../modal/delete-task.vue';
import { useEditorStore } from '../../../common/editor-bridge';
import { findPath } from '../../../common/utils';
import { scheduleTypeMap } from '../constant/history-table-options';
import dayjs from 'dayjs';
import SubmitPaneModal from '../modal/submit-pane-modal.vue';
import SubmitValidateDrawer from '../modal/submit-validate-drawer.vue';
import { useSqlSiderState } from '../../../common/sql-sider-state';
import { getPaneList } from '../../../common/pane-db';
import { subscribeSqlQueryRefresh } from '../../../common/sql-query-event';

const CheckboxGroup = Checkbox.Group;

const { setNewPane } = useEditorStore();
const sqlStore = useSqlSiderState();
const { activeTabKey, sqlExpandedKeys, sqlSelectedKeys } = sqlStore;

interface MyTreeNode {
  id: number;
  parentId?: number | string;
  itemType?: 'DATABASE' | 'DIRECTORY' | 'TASK';
  itemPath?: string;
  taskName?: string;
  itemLevel?: number;
  children?: MyTreeNode[];
  isLeaf?: boolean;
  selectable?: boolean;
  pageNum?: number;
  pageSize?: number;
  databaseName?: string;
  key?: string | number;
  taskId?: number;
}
const props = defineProps({
  getCurPaneList: {
    type: Function,
    default: () => null,
  },
  taskName: {
    type: String,
    default: '',
  },
  taskId: {
    type: [String, Number],
    default: '',
  },
})
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
const loading = ref(false);
const searchValue = ref('');
const createTaskModal = ref(null);
const createMenuModal = ref(null);
const deleteTaskModal = ref(null);
const selectedKeys = ref<(string | number)[]>(sqlSelectedKeys.value);

const treeData = ref<MyTreeNode[]>([]);
const expandedKeys = ref<(string | number)[]>(sqlExpandedKeys.value);
const autoExpandParent = ref(true);
const submitPaneModal = ref(null);
const submitValidateDrawer = ref(null);
const colorMap = {
  ONLINE_NO_DIFF: 'rgba(0, 0, 0, 0.88)',
  ONLINE_HAS_DIFF: 'rgba(0, 0, 0, 0.88)',
  OFFLINE_NO_DIFF: 'rgba(0, 0, 0, 0.58)',
  OFFLINE_HAS_DIFF: 'rgba(0, 0, 0, 0.58)',
  NO_PRODUCTION_TASK: 'green'
}
const isScroll = ref(false);

interface FilterState {
  databases: string[];
  owners: string[];
  types: string[];
}

const createEmptyFilters = (): FilterState => ({ databases: [], owners: [], types: [] });

const filterOpen = ref(false);
const filters = ref<FilterState>(createEmptyFilters());
const draftFilters = ref<FilterState>(createEmptyFilters());
const taskTypeOptions = ref<{ label: string; value: string }[]>([]);

const databaseOptions = ref<{ label: string; value: string }[]>([]);
const ownerOptions = ref<{ label: string; value: string }[]>([]);

const fetchDatabaseOptions = async () => {
  try {
    const { data: { body } } = await Sql.getProjectDatabases();
    databaseOptions.value = (body || []).map((item: any) => ({
      label: item,
      value: item,
    }));
  } catch (e) {
    console.error('fetch project databases failed', e);
  }
};

const fetchOwnerOptions = async () => {
  try {
    const { data: { body } } = await Sql.getProjectUsersDeduplicated();
    ownerOptions.value = (body || [])
      .filter((item: { user: any }) => item.user?.username)
      .map((item: { user: any }) => ({
        label: item.user?.formatedName || item.user.username,
        value: item.user.username,
      }));
  } catch (e) {
    console.error('fetch project_users_deduplicated failed', e);
  }
};

const fetchTaskTypeOptions = async () => {
  try {
    const { data } = await Sql.getTaskTypeList({ params: { taskModule: 'DATA_DEVELOPMENT' }, hideLoading: true });
    if (data?.body) {
      taskTypeOptions.value = (data.body || []).map((item: any) => ({
        label: item.label,
        value: item.value,
      }));
    }
  } catch {
    // ignore
  }
};

const committedSearchValue = ref('');

const hasActiveFilter = computed(() => {
  const f = filters.value;

  return f.databases.length > 0 || f.owners.length > 0 || f.types.length > 0;
});

const hasActiveSearch = computed(() => hasActiveFilter.value || committedSearchValue.value !== '');

const filteredCount = computed(() => {
  if (!hasActiveSearch.value) return 0;
  let count = 0;
  const walk = (nodes: MyTreeNode[]) => {
    for (const node of nodes) {
      if (node.itemType === 'TASK') count++;
      if (node.children) walk(node.children);
    }
  };

  walk(treeData.value);

  return count;
});

const cloneFilters = (f: FilterState): FilterState => ({
  databases: [...f.databases],
  owners: [...f.owners],
  types: [...f.types],
});

watch(filterOpen, (newVal) => {
  if (newVal) {
    draftFilters.value = cloneFilters(filters.value);
  }
});

watch(() => activeTabKey.value, async (newVal) => {
  if (newVal && treeData.value.length > 0) {
    await locateAndExpandTask(Number(newVal));
  }
});

watch(() => expandedKeys.value, () => {
  sqlStore.setSqlExpandedKeys(expandedKeys.value);
})

watch(() => selectedKeys.value, () => {
  sqlStore.setSqlSelectedKeys(selectedKeys.value);
})

const onExpand = (keys: (string | number)[]) => {
  autoExpandParent.value = false
  expandedKeys.value = keys
}

const locateAndExpandTask = async (folderKey: number) => {
  try {
    const targetNode = findNodeByFolderKey(treeData.value, folderKey);
    if (targetNode) {
      const path = findPath(treeData.value, folderKey, undefined, 'id', 'children');
      if (path.length > 0) {
        const keysToExpand = path.map((node: any) => node.key || node.id).filter((key: any) => key !== folderKey);
        expandedKeys.value = [...new Set([...expandedKeys.value, ...keysToExpand])];
        selectedKeys.value = [folderKey + (targetNode.taskName || '')];
        autoExpandParent.value = true;

        onScrollTo();
      }
    } else {
      await loadTaskPathAndExpand(folderKey);
    }
  } catch (error) {
    console.error('定位任务失败:', error);
  }
}

const findNodeByFolderKey = (nodes: MyTreeNode[], folderKey: number): MyTreeNode | null => {
  for (const node of nodes) {
    if (node.key === folderKey || node.id === folderKey) {
      return node;
    }

    if (node.children) {
      const found = findNodeByFolderKey(node.children, folderKey);
      if (found) {
        return found;
      }
    }
  }

  return null;
}



const loadTaskPathAndExpand = async (folderKey: number) => {
  try {
    const compressedList = await getPaneList();
    const list = JSON.parse(compressedList);
    const task = list?.find((item: any) => item.folderKey === folderKey);
    if (!task?.taskId) {
      // 单机 mock 场景：默认 pane 不在树中，跳过定位
      return;
    }
    const { data: { body } } = await Sql.getTask({
      params: {
        id: task.taskId,
      },
      hideLoading: true,
    });

    if (body && body.taskDirectory) {
      const taskDirectory = body.taskDirectory;
        let path = [];
        if (taskDirectory.parentIdsPath) {
          const nameList = taskDirectory.itemPath.split('/');
          const pathList = taskDirectory.parentIdsPath.split('/').map((id: string) => Number(id));
          nameList.shift();
          pathList.shift();
          path = pathList.map((id: number, index: number) => {
            return id + nameList[index];
          });
        }

        expandedKeys.value = [...new Set([...expandedKeys.value, `null${taskDirectory.databaseName}`, ...path])];
        selectedKeys.value = [folderKey + taskDirectory.taskName];
        autoExpandParent.value = true;
        isScroll.value = true;
        onScrollTo();
    }
  } catch (error) {
    console.error('获取任务信息失败:', error);
  }
}

// 滚动到选中的节点
const scrollToSelectedNode = () => {
  // 查找选中的 DOM 节点
  const treeContainer = document.querySelector('.query-tree');
  if (!treeContainer) return;
  const selectedElement = treeContainer.querySelector('.ant-tree-treenode-selected');
  if (selectedElement) {
    selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    isScroll.value = false;
  }
}

const onScrollTo = async () => {
  // 等待 DOM 更新后滚动到选中的节点
  await nextTick();
  setTimeout(() => {
    scrollToSelectedNode();
  }, 100);
}

// 加载数据
async function onLoadData(treeNode: any) {

  const node = treeNode.dataRef as MyTreeNode;

  if (node.children && node.children.length > 0) {
    return;
  }

  const treeValue = await fetchData(node.id, 1, node.databaseName);

  node.children = (node.children || []).concat(treeValue || []);

  treeData.value = [...treeData.value]; // 触发视图更新
  if (isScroll.value) {
    onScrollTo();
  }
}

const onLoadMore =  async (optNode: any) => {
  if (optNode) {
    const nextPage = (optNode.pageNum || 1) + 1;
    const treeValue = await fetchData(optNode.parentId || -1, nextPage, optNode.databaseName);

    if (!optNode.parentId || optNode.parentId === -1) {
      treeData.value.splice(
        treeData.value.findIndex((item) => item.id === 'opt'),
        1
      );
      treeData.value = [...treeData.value, ...treeValue];
    } else {
      const parentNode = treeData.value.find((item) => item.id === optNode.parentId);
      if (parentNode) {
        parentNode.children?.splice(
          parentNode.children.findIndex((item) => item.id === 'opt'),
          1
        );
        parentNode.children = (parentNode.children || []).concat(treeValue);
        treeData.value = [...treeData.value]; // 触发视图更新
      }
    }
  }
};

const openTable = (data: any) => {
  // 单机 mock 场景：表管理页已在 /data-develop/table 挂载，可直接打开
  if (data.databaseName && data.tableName) {
    window.open(
      `/data-develop/table?databaseName=${data.databaseName}&tableName=${data.tableName}`,
      '_blank',
    );
  } else {
    message.info('该任务尚未关联目标表');
  }
};

const createTask = async (edit: boolean, data?: any) => {
  if (!edit) {
    const compressedList = props.getCurPaneList() || [];
    if (compressedList.length >= 6) {
      // paneList.value.shift();
      message.error('最多显示6个页签，如需新增请先删除不需要的页签');

      return;
    }
  }

  let newPath: any[] = [];
  if (data) {
    const path = findPath(treeData.value, data.id, undefined, 'id', 'children');
    if (edit) {
      path.pop();
    }

    if (!path.length) {
      newPath = [data.taskName];
    } else {
      newPath = path.map((n: any) => n.id || n.taskName);
    }
  }

  createTaskModal.value?.showModal({
    edit,
    route: newPath,
    data: edit ? data: undefined,
    parentId: data ? data.id : -1,
  });
}

const onlineTask = (isOnline: boolean, data?: any) => {
  if (isOnline) {
    submitValidateDrawer.value.showDrawer({
      pane: data,
    });
  } else {
    onSubmitValidate(data, 'OFFLINE');
  }
}

const onSubmitValidate = async (paneItem, releaseAction) => {
  submitPaneModal.value.showModal({
    pane: paneItem,
    title: '下线',
    releaseAction
  });
}

const createMenu = (edit: boolean, title: string, data?: any, remove?:any) => {
  let newPath = '';
  let parentIdValue = -1;

  if (data) {
    // 如果 data 中有 routeIds 属性（ID 数组），优先使用它来计算 parentId
    if (data.routeIds && Array.isArray(data.routeIds) && data.routeIds.length > 0) {
      // 使用 routeIds 的最后一个元素作为 parentId
      parentIdValue = data.routeIds.length >= 1 ? data.routeIds[data.routeIds.length - 1] : (data.id || -1);
      // 如果有 route（名称路径），使用它；否则根据 routeIds 查找名称路径
      if (data.route && Array.isArray(data.route)) {
        newPath = data.route;
      } else {
        // 如果没有名称路径，根据 routeIds 在树中查找
        // 这里简化处理，直接使用 data.route（如果存在）
        newPath = data.route || [];
      }
    } else if (data.route && Array.isArray(data.route)) {
      // 如果只有 route（名称路径），需要从树中查找对应的 ID
      // 但为了简化，先使用 data.id（如果存在）
      newPath = data.route;
      parentIdValue = data.id || -1;
    } else {
      // 否则根据 data.id 在树中查找路径
      const path = findPath(treeData.value, data.id);
      if (edit) {
        path.pop();
      }

      if (!path.length) {
        newPath = [data.taskName];
      } else {
        newPath = path.map(n => n.taskName);
      }

      parentIdValue = data.id;
    }
  }

  createMenuModal.value.showModal({
    edit,
    route: newPath,
    title,
    data: edit || remove  ? data: undefined,
    parentId: parentIdValue,
    remove
  });
}

const deleteTree = (type, data) => {
  deleteTaskModal.value.showModal({
    type,
    data,
  });
}

const onMenuRefresh = async (data?: (string | number)[], moveInfo?: { taskId: number; parentId: number; databaseName: string }) => {
  if (moveInfo?.taskId) {
    const curPaneList = props.getCurPaneList();
    if (curPaneList) {
      const pane = curPaneList.find((p: any) => String(p.taskId) === String(moveInfo.taskId));
      if (pane) {
        if (moveInfo.parentId !== undefined) pane.parentId = moveInfo.parentId;
        if (moveInfo.databaseName !== undefined) pane.databaseName = moveInfo.databaseName;
      }
    }
  }

  await refreshList(data);
  if (moveInfo?.taskId) {
    setNewEditor(moveInfo.taskId, true, false);
  }
}

const onTaskModalClose = async (taskId, edit) => {
  try {
    await refreshList();
  } finally {
    setNewEditor(taskId, edit, false);
  }
}

const onDeleteModalClose = async (type, id) => {
  try {
    await refreshList();
  } finally {
    if (type === 'task') {
      setNewPane({
        isDelete: true,
        id,
      });
    }
  }
}

const handleApplyFilter = () => {
  filters.value = cloneFilters(draftFilters.value);
  filterOpen.value = false;
  onFilterSearch();
};

const handleResetFilter = () => {
  draftFilters.value = createEmptyFilters();
};

const handleResetAll = () => {
  filters.value = createEmptyFilters();
  draftFilters.value = createEmptyFilters();
  searchValue.value = '';
  committedSearchValue.value = '';
  fetchDataList();
};

const onResetAllClick = () => {
  if (hasActiveSearch.value) {
    handleResetAll();
  }
};

const onSearchInputChange = (e: any) => {
  if (!e.target.value) {
    committedSearchValue.value = '';
    if (hasActiveFilter.value) {
      onFilterSearch();
    } else {
      fetchDataList();
    }
  }
};

// data 为任务移动后需要展开的路径 ID 数组，仅在无搜索/过滤态下生效；
// 搜索/过滤态下 doSearch() 已展开全部命中节点，data 不适用。
const refreshList = async (data?: (string | number)[]) => {
  if (hasActiveFilter.value || searchValue.value) {
    await doSearch();
  } else {
    await fetchDataList(data);
  }
};

const onRedo = async () => {
  await refreshList();
};

const fetchDataList = async (data?: (string | number)[]) => {
  // 保存当前展开的 keys
  const currentExpandedKeys = [...expandedKeys.value];

  treeData.value = [];
  autoExpandParent.value = false;
  const treeValue = await fetchData();

  if (treeValue && treeValue.length) {
    treeData.value = [...treeValue];

    // 如果传入了 data（路径ID数组），把这些ID也加入展开列表
    if (data && data.length > 0) {
      // data 是从 Cascader 选择的路径 ID 数组，需要展开这些节点
      expandedKeys.value = [...new Set([...currentExpandedKeys, ...data])];
      autoExpandParent.value = true;
    } else {
      // 恢复之前展开的节点状态
      expandedKeys.value = currentExpandedKeys;
    }
  }

  createTaskModal.value?.getDatabaseList();
}

const selectTreeNode = (selectedKeys, { node }) => {
  // 目录节点没有 taskId，只有任务节点才触发打开编辑器
  const taskId = node?.dataRef?.taskId;
  if (!taskId) return;
  setNewEditor(taskId, false, true);
};

const setNewEditor = async (taskId, edit, isSave) => {
  const { data: { body } } = await Sql.getTask({
    params: {
      id: taskId,
    },
    hideLoading: true,
  });

  if (!body?.task || !body?.taskDirectory) return;

  setNewPane({
    ...body.taskDirectory,
    ...body.task,
    taskId: body.task.id,
    id: body.taskDirectory.id,
    folderKey: body.taskDirectory.id,
    parentId: body.taskDirectory.parentId || -1,
    queryName: body.taskDirectory.taskName,
    isNew: true,
    change: false,
    isEdit: edit,
    isSave
  });
};

const getAllKeys = (data) => {
  let keys = [];
  data.forEach(item => {
    keys.push(item.key || item.id);
    if (item.children) {
      keys = keys.concat(getAllKeys(item.children));
    }
  });

  return keys;
}

function transformTree(list): MyTreeNode[] {
  return list.map((item) => {
    const node: MyTreeNode = {
      ...item.task,
      ...item.taskDirectory,
      selectable: item.taskDirectory.itemType === 'TASK',
      isLeaf: item.taskDirectory.itemType === 'TASK',
      children: item.children ? transformTree(item.children) : undefined,
      taskId: item?.task?.id,
      key: item.taskDirectory.id + item.taskDirectory.taskName
    }

    return node
  })
}

// 根据任务名称和任务ID查找节点
const findNodeByTaskNameAndId = (nodes: MyTreeNode[], taskName: string, taskId: string | number): MyTreeNode | null => {
  for (const node of nodes) {
    if (node.itemType === 'TASK') {
      // 优先使用 taskId 匹配（更精确），如果没有 taskId 则使用 taskName
      if (taskId && node.taskId && String(node.taskId) === String(taskId)) {
        return node;
      }

      if (!taskId && node.taskName === taskName) {
        return node;
      }
    }

    if (node.children) {
      const found = findNodeByTaskNameAndId(node.children, taskName, taskId);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

const buildSearchParams = () => {
  const params: Record<string, any> = { itemType: 'TASK' };
  if (searchValue.value) params.name = searchValue.value;
  const f = filters.value;
  if (f.databases.length > 0) params.databaseNames = f.databases.join(',');
  if (f.owners.length > 0) params.owners = f.owners.join(',');
  if (f.types.length > 0) params.taskTypes = f.types.join(',');

  return params;
};

const doSearch = async () => {
  treeData.value = [];
  loading.value = true;
  try {
    const { data } = await Sql.searchDirectoryList({
      params: buildSearchParams(),
      hideLoading: true,
    });

    if (data?.body) {
      treeData.value = transformTree(data.body || []);
      expandedKeys.value = getAllKeys(treeData.value);
      autoExpandParent.value = true;
      committedSearchValue.value = searchValue.value;
    }
  } catch {
    message.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
};

const onSearchData = async () => {
  if (!searchValue.value && !hasActiveFilter.value) {
    fetchDataList();

    return;
  }

  await doSearch();
};

const onFilterSearch = async () => {
  if (!hasActiveFilter.value && !searchValue.value) {
    fetchDataList();

    return;
  }

  await doSearch();
};

const fetchData = async (parentId?: number, nextPage?: number, databaseName?: string) => {

  loading.value = true;
  let newData = [];
  try {
    const { data } = await Sql.getDirectoryList({
      params: {
          parentId: parentId || -1,
          pageNum: nextPage || 1,
          pageSize: 100,
          databaseName
        },
      hideLoading: true
    });

    if (data?.body) {
      const { hasNextPage, list } = data.body;
      newData = list.map((item) => {
        const v = item.taskDirectory;

        return {
          ...item.task,
          ...v,
          selectable: v.itemType === 'TASK',
          isLeaf: v.itemType === 'TASK',
          children: undefined,
          key: v.id + v.taskName,
          taskId: item?.task?.id
        }
      });
      if (hasNextPage) {
        newData.push({
          id: 'opt',
          taskName: '加载更多',
          pageNum: nextPage ||  1,
          pageSize: 100,
          isLeaf: true,
          selectable: false,
          parentId: parentId || -1,
          databaseName
        });
      }
    }
  } catch {
    message.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }

  return newData || [];
};

const autoSelectTask = async () => {
  if (!props.taskName || !props.taskId) return;

  await nextTick();
  const targetNode = findNodeByTaskNameAndId(treeData.value, props.taskName, props.taskId);
  if (targetNode && targetNode.key) {
    selectedKeys.value = [targetNode.key];
    // 如果节点有 taskId，自动打开任务
    // 使用和手动选中任务相同的参数：edit=false(创建新标签页), isSave=true(保存当前任务)
    if (targetNode.taskId) {
      setNewEditor(targetNode.taskId, false, true);
    }
  }
};

let unsubSqlQueryRefresh: (() => void) | null = null;

onMounted(async () => {
  unsubSqlQueryRefresh = subscribeSqlQueryRefresh(async ({ taskId }) => {
    await refreshList();
    setNewEditor(taskId, true, false);
  });

  fetchDatabaseOptions();
  fetchOwnerOptions();
  fetchTaskTypeOptions();

  if (props.taskName) {
    searchValue.value = props.taskName;
    await onSearchData();
    await autoSelectTask();
  } else {
    await fetchDataList();
  }
});

onBeforeUnmount(() => {
  unsubSqlQueryRefresh?.();
});
</script>

<style lang="less" scoped>
.sql-query {
  display: flex;
  flex-direction: column;
  min-width: 260px;
  height: 100%;

  .tree {
    width: 100%;
  }

  :deep(.query-tree) {
    height: calc(100vh - 193px);
    overflow: scroll;

    .ant-tree-list {
      height: 100%;
    }

    .ant-tree-list-holder {
      max-height: 100% !important;
      height: 100% !important;
    }

    .ant-tree-indent-unit {
      width: 15px;
    }

    .ant-tree-treenode {
      width: 100%;
    }

    .ant-tree-node-content-wrapper {
      width: 100%;
      display: flex;
      align-items: center;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      position: relative;

      .ant-tree-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        flex: 1;
        width: 100%;

        .task-item {
          > span:first-child {
            width: 85%;
            display: inline-block;
          }
        }
      }
    }

    .ant-tree-node-content-wrapper:hover .more-btn {
      opacity: 1;
    }

    .ant-tree-switcher {
      width: 10px;
      align-self: center;
    }

    .more-btn {
      position: absolute;
      right: 5px;
      top: 5px;
      opacity: 0;
    }
  }
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* Header */
.ttp-header {
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.ttp-tabs {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ttp-tab {
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  line-height: 38px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: #1677ff;
  }

  &.active {
    color: #1677ff;
    font-weight: 600;
    border-bottom-color: #1677ff;
  }
}

/* Search bar */
.ttp-search-bar {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ttp-search-bar :deep(.ant-input-affix-wrapper) {
  flex: 1;
  border-radius: 6px;
}

/* Filter button */
.ttp-filter-btn {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: #bfbfbf;
  position: relative;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    background: #f5f5f5;
    color: #666;
  }

  &.active {
    color: #1677ff;
    background: #e6f4ff;
  }
}

.ttp-filter-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  background: #1677ff;
  border-radius: 50%;
}

/* Filter panel */
.ttp-filter-panel {
  width: 360px;
  padding: 12px 16px;
  font-size: 13px;
}

.ttp-filter-panel-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.ttp-filter-panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ttp-filter-field {
  display: flex;
  align-items: center;
}

.ttp-filter-field-select {
  :deep(.ant-select) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ant-select-selector) {
    flex-wrap: nowrap !important;
  }

  :deep(.ant-select-selection-overflow) {
    flex-wrap: nowrap;
  }
}

.ttp-filter-field-checkbox {
  align-items: flex-start;

  :deep(.ant-checkbox-group) {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
  }
}

.ttp-filter-label {
  width: 72px;
  flex-shrink: 0;
  color: #595959;
  font-size: 13px;
  font-weight: 500;
  line-height: 24px;
}

.ttp-filter-panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  margin-top: 12px;

  a {
    color: #999;
    font-size: 13px;

    &:hover {
      color: #1677ff;
    }
  }
}

/* Tree toolbar */
.ttp-tree-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  font-size: 13px;
  color: #333;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
}

.ttp-tree-toolbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.ttp-tree-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #999;

  :deep(.anticon) {
    cursor: pointer;
    transition: color 0.2s;
    font-size: 14px;

    &:hover {
      color: #1677ff;
    }
  }
}

.ttp-filter-count {
  color: #1677ff;
  font-weight: 600;
}

.ttp-toolbar-reset-active {
  color: #1677ff !important;
  cursor: pointer;
}

.ttp-toolbar-reset-inactive {
  color: #d9d9d9 !important;
  cursor: default;

  &:hover {
    color: #d9d9d9 !important;
  }
}

/* Tree area */
.ttp-tree-area {
  padding: 0 4px;
}
</style>

<style lang="less">
.ttp-filter-popover .ant-popover-inner {
  padding: 0 !important;
  border-radius: 8px !important;
}

.ttp-filter-popover .ant-popover-inner-content {
  padding: 0 !important;
}
</style>
