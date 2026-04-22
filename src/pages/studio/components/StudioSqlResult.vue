<!-- @Author: weisun -->
<!-- @Date: 2024/4/25 19:37 -->
<!-- @Last Modified by: weisun -->
<!-- @Last Modified time: 2024/4/25 19:37 -->

<template>
  <div
    class="sql-result"
    :class="
      (sqlInfo.rowCount ||
        (isExample && tableOptions && tableOptions.length) ||
        (tableOptions && tableOptions.length)) &&
      !errorMsg
        ? ''
        : 'empty-container'
    "
  >
    <vxe-grid
      v-if="
        (sqlInfo.rowCount ||
          (isExample && tableOptions && tableOptions.length) ||
          (tableOptions && tableOptions.length)) &&
        !errorMsg
      "
      ref="gridRef"
      v-bind="gridOptions"
      class="table-scrollbar"
      v-on="gridEvents"
    >
      <template #toolbar_buttons>
        <div
          v-if="
            (sqlInfo.rowCount ||
              (isExample && tableOptions && tableOptions.length) ||
              (tableOptions && tableOptions.length)) &&
            !errorMsg
          "
          class="footer-content"
        >
          {{ footerContent }}
        </div>
      </template>
      <template #toolbar_tools>
        <template
          v-if="
            sqlInfo &&
            sqlInfo.id &&
            ['FINISHED'].includes(sqlInfo.status) &&
            sqlInfo.isExpired !== 1 &&
            sqlInfo.rowCount
          "
        >
          <Tooltip title="刷新结果">
            <Button
              v-if="sqlInfo.rowCount"
              type="text"
              style="font-size: 12px; color: #1677ff"
              :icon="h(ReloadOutlined)"
              @click="reloadResults"
            />
          </Tooltip>

          <Tooltip title="复制前100条">
            <Button
              v-if="sqlInfo.rowCount"
              type="text"
              style="font-size: 12px; color: #1677ff"
              :icon="h(CopyOutlined)"
              @click="copyAll"
            />
          </Tooltip>

          <Tooltip title="表格设置">
            <Button
              v-if="sqlInfo.rowCount"
              type="text"
              style="font-size: 12px; color: #1677ff"
              :icon="h(UnorderedListOutlined)"
              @click="customTable"
            />
          </Tooltip>

          <Dropdown
            v-model:open="exportVisible"
            trigger="click"
            destroy-popup-on-hide
            placement="bottomRight"
          >
            <LoadingOutlined v-if="downloading" />
            <Button
              v-else
              type="text"
              style="font-size: 12px; color: #1677ff"
              :icon="h(DownloadOutlined)"
            />

            <template #overlay>
              <Menu>
                <Menu.Item key="csv" style="background-color: #e6f4ff;margin: 10px;" @click="onDownload">
                  <div class="download-item">
                    <img src="./imgs/csv.png" class="download-icon" >
                    <div>
                      <div class="download-title">下载 CSV</div>
                      <div class="download-tips">最多支持1万行</div>
                    </div>
                  </div>
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </template>
      </template>

      <template #operation="{ row, rowIndex }">
        <span style="color: #1677ff; cursor: pointer" @click="openDrawer(row)">
          {{ rowIndex + 1 }}
        </span>
      </template>

      <template #default="{ row, column }">
        <div class="cell-with-copy">
          <span class="cell-text">{{ formatCellValue(row[column.field], column.field, column.title) }}</span>
          <CopyOutlined
            class="cell-copy-icon"
            @click.stop="copyCellValue(row, column)"
          />
        </div>
      </template>

      <template #header="{ column }">
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          "
        >
          <div
            style="display: flex; align-items: center; min-width: 0; flex: 1"
          >
            <span
              style="
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              "
            >
              {{ column.title }}
            </span>
            <Tooltip v-if="isTimeField(column.title)" title="切换时间展示">
              <SwapOutlined
                style="margin-left: 10px; cursor: pointer"
                @mousedown.stop.prevent
                @click.stop="swapTimeField(column)"
              />
            </Tooltip>
          </div>
          <div style="display: flex; align-items: center; gap: 2px">
            <Button
              type="text"
              size="small"
              style="margin-left: 12px; padding: 0"
              :data-field="column.field"
              @click.stop="openColumnFilterModal(column.field)"
            >
              <FilterOutlined
                :style="{
                  color: isFilterActive(column.field) ? '#1677ff' : '#bfbfbf',
                }"
              />
            </Button>
          </div>
        </div>
      </template>
    </vxe-grid>



    <Empty
      v-if="
        (!(
          sqlInfo.rowCount ||
          (isExample && tableOptions && tableOptions.length) ||
          (tableOptions && tableOptions.length)
        ) ||
          errorMsg) &&
        !gridOptions.loading
      "
      :image="errorMsg ? false : simpleImage"
    >
      <template #description>
        <template v-if="errorMsg">
          <p
            style="color: #000; white-space: break-spaces"
            :style="{
              paddingTop: sqlInfo.status !== 'FAILED' ? '30px' : '',
            }"
            v-html="errorMsg"
          />
          <Button v-if="errorMsg.includes('请到安全中心申请')" type="link" size="small" @click="openAuth">申请权限</Button>
        </template>
        <template v-else>
          <span v-if="tableOptions && tableOptions.length">
            查询成功，暂无数据
          </span>
          <span v-else>暂无数据</span>
        </template>
      </template>
    </Empty>

    <Drawer
      :open="drawerOpen"
      title="详情"
      width="40vw"
      destroy-on-close
      :root-style="drawerRootStyle"
      @close="closeDrawer"
    >
      <InputSearch
        v-model:value="drawerSearch"
        style="margin-bottom: 10px; width: 300px"
        placeholder="表内搜索"
      />

      <Descriptions bordered :column="4">
        <template v-for="(item, index) in drawerFilterList" :key="index">
          <Descriptions.Item
            :span="4"
            :label="item.key"
            :label-style="{ width: '45%', wordBreak: 'break-all' }"
            :content-style="{ width: '45%', wordBreak: 'break-all' }"
          >
            {{ item.value }}
          </Descriptions.Item>
        </template>
      </Descriptions>
    </Drawer>

    <Modal
      v-model:open="columnSettingVisible"
      title="列设置"
      width="400px"
      :ok-button-props="{ size: 'small' }"
      :cancel-button-props="{ size: 'small' }"
      @ok="handleColumnSettingOk"
      @cancel="handleColumnSettingCancel"
    >
      <InputSearch
        v-model:value="searchColumnValue"
        placeholder="搜索列名"
        style="margin-bottom: 16px"
      />
      <div class="column-list">
        <div class="column-item select-all">
          <Checkbox :checked="selectAll" @change="handleSelectAll">
            全选
          </Checkbox>
          <Button type="link" size="small" @click="resetColumnOrder">
            初始化
          </Button>
        </div>
        <draggable
          v-model="filteredDragColumns"
          item-key="field"
          handle=".drag-handle"
          :disabled="!!searchColumnValue"
        >
          <template #item="{ element: col }">
            <div :key="col.field" class="column-item">
              <span class="drag-handle">
                <MenuOutlined />
              </span>
              <Checkbox
                :checked="!col.hidden"
                @change="(e) => handleColumnChange(e, col)"
              >
                {{ col.title }}
              </Checkbox>
            </div>
          </template>
        </draggable>
      </div>
    </Modal>

    <Modal
      v-if="currentFilterField"
      v-model:open="filterStates[currentFilterField].visible"
      :title="filterStates[currentFilterField]?.title || '列筛选'"
      width="400px"
      :footer="null"
      :ok-button-props="{ size: 'small' }"
      :cancel-button-props="{ size: 'small' }"
      @ok="() => currentFilterField && handleFilterConfirm(currentFilterField)"
      @cancel="closeColumnFilterModal"
    >
      <InputSearch
        v-model:value="filterStates[currentFilterField].searchValue"
        placeholder="搜索可选值"
        style="margin-bottom: 16px"
      />
      <div class="column-list">
        <div class="column-item select-all">
          <Checkbox
            :checked="isAllOptionsSelected(currentFilterField)"
            @change="(e) => handleSelectAllOptions(e, currentFilterField)"
          >
            全选
          </Checkbox>
        </div>
        <div
          v-for="opt in getFilteredOptions(currentFilterField)"
          :key="opt.value"
          class="column-item"
        >
          <Checkbox
            :checked="
              filterStates[currentFilterField].tempSelectedValues.includes(
                opt.value,
              )
            "
            @change="
              (e) => handleOptionChange(e, currentFilterField, opt.value)
            "
          >
            {{ opt.label }}
          </Checkbox>
          <span style="margin-left: 6px; color: #999; font-size: 12px">
            （{{ getOptionCount(currentFilterField, opt.value) }}）
          </span>
        </div>
      </div>
      <div class="modal-footer-flex">
        <Button
          type="link"
          size="small"
          @click="() => handleInitOptions(currentFilterField)"
        >
          初始化
        </Button>
        <div class="footer-btns">
          <Button size="small" @click="closeColumnFilterModal">取消</Button>
          <Button
            type="primary"
            size="small"
            @click="
              () =>
                currentFilterField && handleFilterConfirm(currentFilterField)
            "
          >
            确定
          </Button>
        </div>
      </div>
    </Modal>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';
import _, { throttle } from 'lodash';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import draggable from 'vuedraggable';
import {
  watch,
  ref,
  h,
  reactive,
  computed,
  nextTick,
} from 'vue';

import {
  Empty,
  Tooltip,
  Button,
  Drawer,
  Descriptions,
  InputSearch,
  message,
  Checkbox,
  Modal,
  Dropdown,
  Menu,
} from 'ant-design-vue';

import {
  SwapOutlined,
  CopyOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  MenuOutlined,
  FilterOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue';

import { useRouter } from 'vue-router';
import { useDrawerPosition } from '../common/use-drawer-position';
import Sql from '@/resources/sql';
import { saveFileFromResponse, buildCsvBlob } from '../common/utils';

const props = defineProps<{
  pane: {
    id?: string | number;
    dataSourceId?: string | number;
    database?: string;
    table?: string;
    extraInfo?: {
      errorMsg?: string;
    };
    errorLine?: number | null;
  };
  sqlInfo: SqlInfo;
  rowCount: any;
}>();

const emit = defineEmits(['update:table-length']);

// 使用抽屉位置 hook
const { drawerRootStyle } = useDrawerPosition();

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;

interface SqlInfo {
  id?: string | number;
  status?: string;
  rowCount?: any;
  database?: string;
  engine?: string;
  isExpired?: number;
  aiTab?: boolean;
  extraInfo?: { errorMsg?: string };
}

interface DrawerItem {
  key: string;
  value: any;
}

const router = useRouter();
const drawerSearch = ref('');

const tableOptions = ref<any[]>([]);
const tableData = ref<any[]>([]);
const drawerOpen = ref(false);
const drawerList = ref<DrawerItem[]>([]);
const pageNum = ref(1);
const errorMsg = ref('');
const gridRef = ref();
const headerFields = ref<string[]>([]);
const copyData = ref<string>('');
const finishFetch = ref(false);


const downloadVisible = ref(false);
const exportVisible = ref(false);
const downloading = ref(false);


const searchColumnValue = ref('');
const columnSettingVisible = ref(false);
const selectAll = ref(true);
const dragColumns = ref<any[]>([]);
const initialColumns = ref<any[]>([]);
const isFirstLoad = ref(true);

const filteredDragColumns = ref<any[]>([]);

const selectRow = ref(null);
const selectColumn = ref(null);

const timeFormatMap = reactive<Record<string, boolean>>({});

// 记录滚动位置
const lastScrollTop = ref(0);

const filterStates = reactive<{
  [key: string]: {
    tempSelectedValues: string[];
    appliedValues: string[];
    options: { value: string; label: string }[];
    visible: boolean;
    searchValue: string;
    title: string;
    hasFiltered: boolean;
  };
}>({});

const footerContent = computed(() => {
  const tableDataLength = tableData.value.length || 0;
  const count = `${tableDataLength}${
    tableDataLength < props.rowCount ? '+' : ''
  }`;

  return `总计 ${count} 条数据`;
})

const openAuth = () => {
  // 单机 mock 场景：跳到首页占位
  const { href } = router.resolve({ path: '/' });
  window.open(href, '_blank');
}

const customTable = () => {
  columnSettingVisible.value = true;
  dragColumns.value = JSON.parse(
    JSON.stringify(tableOptions.value.filter((col) => col.type !== 'seq')),
  );
  filteredDragColumns.value = [...dragColumns.value];
  selectAll.value = !tableOptions.value.some(
    (col) => col.type !== 'seq' && col.hidden,
  );
};

const resetColumnOrder = () => {
  dragColumns.value = initialColumns.value
    .filter((col) => col.type !== 'seq')
    .map((col) => ({
      ...col,
      hidden: false,
    }));
  filteredDragColumns.value = [...dragColumns.value];
  selectAll.value = true;
  searchColumnValue.value = '';
};

const handleColumnSettingOk = () => {
  columnSettingVisible.value = false;
  const seqColumn = initialColumns.value.find((col) => col.type === 'seq');
  tableOptions.value = [seqColumn, ...filteredDragColumns.value].filter(
    Boolean,
  );

  tableOptions.value.forEach((col) => {
    if (col.type !== 'seq') {
      const dragCol = filteredDragColumns.value.find(
        (c) => c.field === col.field,
      );
      if (dragCol) col.hidden = dragCol.hidden;
    }
  });

  const visibleColumns = tableOptions.value.filter(
    (col) => col.type === 'seq' || !col.hidden,
  );

  gridRef.value?.reloadColumn(visibleColumns);
  gridRef.value?.reloadData(getFilteredData());
  searchColumnValue.value = '';
};

const handleColumnSettingCancel = () => {
  const updatedColumns = initialColumns.value
    .filter((col) => col.type !== 'seq')
    .map((col) => ({
      ...col,
      hidden: false,
    }));

  filteredDragColumns.value = [...updatedColumns];
  selectAll.value = true;
  columnSettingVisible.value = false;
  searchColumnValue.value = '';
};

const handleSelectAll = (e: any) => {
  const checked = e.target.checked;
  selectAll.value = checked;
  filteredDragColumns.value = filteredDragColumns.value.map((col) => ({
    ...col,
    hidden: !checked,
    filteredAndChecked: !checked,
  }));
  dragColumns.value.forEach((dragCol) => {
    filteredDragColumns.value.forEach((filteredCol) => {
      if (dragCol.field === filteredCol.field) {
        dragCol.hidden = filteredCol.hidden;
      }
    });
  });
};

const handleColumnChange = (e: any, col: any) => {
  col.hidden = !e.target.checked;
  selectAll.value = !filteredDragColumns.value.some((c) => c.hidden);
};

const customConfig = {
  allowFixed: false,
  allowResizable: false,
  beforeOpen: () => {
    columnSettingVisible.value = true;

    return false;
  },
};

const DEFAULT_GRID_OPTIONS = {
  border: true,
  maxHeight: 450,
  showOverflow: 'ellipsis',
  showHeaderOverflow: 'tooltip',
  stripe: true,
  size: 'mini',
  cellClassName: ({ row, column }: { row: any; column: any }) => {
    if (row === selectRow.value && column === selectColumn.value) {
      return 'col-selected custom-cell';
    }

    return 'custom-cell';
  },
  headerCellClassName: ({ row, column }: { row: any; column: any }) => {
    if (row === selectRow.value && column === selectColumn.value) {
      return 'col-selected custom-title-cell';
    }

    return 'custom-title-cell';
  },
  columnConfig: {
    resizable: true,
    minWidth: 150,
  },
  rowConfig: {
    useKey: true,
    isHover: true,
    isCurrent: true,
  },
  sortConfig: {
    multiple: true,
    chronological: true,
    trigger: 'icon',
    iconAsc: 'vxe-icon-caret-up',
    iconDesc: 'vxe-icon-caret-down',
  },
  scrollY: {
    enabled: true,
    gt: 0,
    mode: 'default',
  },
  scrollX: {
    enabled: true,
    gt: 0,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar_buttons',
      tools: 'toolbar_tools',
    },
  },
  customConfig,
};

const gridOptions = reactive({
  ...DEFAULT_GRID_OPTIONS,
  loading: false,
});

const isLoadingMore = ref(false);

const throttledFetchResults = throttle(() => {
  if (isLoadingMore.value) return;
  isLoadingMore.value = true;
  fetchResults().finally(() => {
    // 请求完成后解锁
    setTimeout(() => {
      isLoadingMore.value = false;
    }, 300);
  });
}, 500);

const gridEvents = {
  scroll(params: any) {
    if (isFiltering.value) return;
    if (params.isX) return;
    const { scrollTop, scrollHeight } = params;
    const tableContentHeight = 414;

    lastScrollTop.value = scrollTop;
    const triggerThreshold = tableContentHeight * 1.5;

    if (scrollHeight - scrollTop <= triggerThreshold) {
      if (!isExample.value && !finishFetch.value && !isLoadingMore.value) {
        throttledFetchResults();
      }
    }
  },
  cellClick({ row, column }: { row: any; column: any }) {
    if (column.type === 'seq') return;
    if (row === selectRow.value && column === selectColumn.value) {
      selectRow.value = null;
      selectColumn.value = null;
    } else {
      selectRow.value = row;
      selectColumn.value = column;
    }
  },
  headerCellClick({ row, column }: { row: any; column: any }) {
    if (column.type === 'seq') return;
    if (row === selectRow.value && column === selectColumn.value) {
      selectRow.value = null;
      selectColumn.value = null;
    } else {
      selectRow.value = row;
      selectColumn.value = column;
    }
  },
};

dayjs.extend(utc);
dayjs.extend(timezone);

const IS_INDO_STAGE = false;

const closeDrawer = () => {
  drawerSearch.value = '';
  drawerOpen.value = false;
};

const isTimeField = (field: string) =>
  ['time', 'date'].some((timeField) =>
    field.toLowerCase().includes(timeField),
  ) || field.endsWith('ts');

const formatCellValue = (cellValue: any, field: string, title: string): string => {
  if (!timeFormatMap[field] || !isTimeField(title)) return cellValue;
  const formatted = dayjs(+cellValue).format('YYYY-MM-DD HH:mm:ss');
  if (formatted === 'Invalid Date') return cellValue;
  if (IS_INDO_STAGE) {
    return dayjs(+cellValue).utc().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
  }

  return formatted;
};

const swapTimeField = (column: any) => {
  const field = column.field;
  timeFormatMap[field] = !timeFormatMap[field];
};

const isExample = ref(false);


const handleError = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    if ('error' in error) {
      errorMsg.value = (error as { error: string }).error;
    } else if ('data' in error && typeof (error as any).data === 'object') {
      const { body, status } = (error as any).data;
      if (!body && (status?.detail || status?.type)) {
        errorMsg.value = status.detail || status.type;
      }
    }
  }

  pageNum.value = 1;
  gridOptions.loading = false;
};

const fetchResults = async () => {
  const { dataSourceId, database, table } = props.pane;
  const { id, status } = props.sqlInfo;
  isExample.value = !id;

  if (['INIT', 'ANALYZING', 'RUNNING'].includes(status || '')) return;
  if (isExample.value && !(dataSourceId && database && table)) return;
  if (finishFetch.value || gridOptions.loading) return;
  if (id !== props.sqlInfo.id) return;

  errorMsg.value = '';
  gridOptions.loading = true;
  const query = isExample.value ? Sql.getExample : Sql.getResults;
  const params = isExample.value
    ? { dataSourceId, database, table }
    : { id, pageNum: pageNum.value };
  props.pane.errorLine = null;

  try {
    const {
      data: { body },
    } = await query({ params, hideLoading: true });

    props.pane.errorLine = body.errorLine;

    if (body.header || body.data) {
      const { header: gridHeader, data: gridData, finish } = body;
      finishFetch.value = finish;

      // 使用类型定义避免隐式any
      let uniqFields: string[] = [];
      if (gridHeader && gridHeader.length) {
        // 只处理前100条数据用于复制功能，避免大数据量处理
        const cutData = gridData?.slice(0, 100) || [];
        const cutStrArr = cutData?.map((item: any[]) => {
          item = item.map((i: any) => {
            return (`${i  }`).replace(/\t/g, ' ');
          });

          return item.join('\t');
        });
        copyData.value =
          `${gridHeader.join('\t')}` + '\r\n' + `${cutStrArr.join('\r\n')}`;
        uniqFields = gridHeader.map(
          (field: string, index: number) => `${field}_${index}`,
        );
        headerFields.value = uniqFields;
      }

      if (uniqFields && uniqFields.length) {
        // 所有的 header 后面加上index，以防有重复的 header
        if (pageNum.value === 1) {
          const newColumns = uniqFields.map((field: string, index: number) => {
            const title = gridHeader[index];

            return {
              field,
              title,
              key: field,
              dataIndex: field,
              sortable: true,
              formatter: ({ cellValue, column: col }: { cellValue: any; column: any }) =>
                formatCellValue(cellValue, col.field, col.title),
              slots: { default: 'default', header: 'header' },
            };
          });

          // 使用类型断言解决类型错误
          (newColumns as any[])?.unshift({
            width: 70,
            type: 'seq',
            slots: { default: 'operation' },
            fixed: 'left',
          });

          tableOptions.value = newColumns;

          // 第一次加载时保存原始列顺序
          if (isFirstLoad.value) {
            initialColumns.value = newColumns.map((col) => ({
              ...col,
              hidden: false,
            }));
            isFirstLoad.value = false;
          }
        }
      }

      if (gridHeader && gridHeader.length && pageNum.value > 1) {
        gridOptions.loading = false;
      }

      // 优化大数据处理：使用requestIdleCallback在浏览器空闲时间处理数据
      if (uniqFields && uniqFields.length) {
        if (gridData && gridData.length) {
          // 对于小数据量（小于1000行），使用同步处理避免延迟
          if (gridData.length < 1000) {
            const processedData = gridData.map((value: any[]) =>
              _.zipObject(uniqFields, value),
            );

            if (pageNum.value === 1) {
              tableData.value = processedData;
              nextTick(() => {
                if (gridRef.value) {
                  Promise.all([
                    gridRef.value.reloadColumn(tableOptions.value),
                    gridRef.value.reloadData(tableData.value),
                  ]).then(() => {
                    gridOptions.loading = false;
                  });
                } else {
                  gridOptions.loading = false;
                }
              });
            } else {
              const $grid = gridRef.value;
              if (!$grid) {
                gridOptions.loading = false;

                return;
              }

              const savedScrollTop = lastScrollTop.value;
              tableData.value = tableData.value.concat(processedData);

              $grid.reloadData(tableData.value).then(() => {
                nextTick(() => {
                  const bodyWrapper = $grid.$el.querySelector(
                    '.vxe-table--body-wrapper',
                  );
                  if (bodyWrapper && savedScrollTop > 0) {
                    bodyWrapper.scrollTop = savedScrollTop;
                  }

                  gridOptions.loading = false;
                });
              });
            }

            pageNum.value = body.pageNum + 1;
          } else {
            // 大数据量使用异步批处理
            const batchSize = 1000;
            const batches = Math.ceil(gridData.length / batchSize);
            let batchIndex = 0;

            // 存储新加载的数据
            let newBatchData: any[] = [];

            const processBatch = (deadline: any) => {
              // 当有剩余时间或超时时处理
              while (
                (deadline.timeRemaining() > 0 || deadline.didTimeout) &&
                batchIndex < batches
              ) {
                const start = batchIndex * batchSize;
                const end = Math.min(start + batchSize, gridData.length);
                const batchData = gridData
                  .slice(start, end)
                  .map((value: any[]) => _.zipObject(uniqFields, value));

                newBatchData = newBatchData.concat(batchData);
                batchIndex++;
              }

              // 如果还有批次未处理，继续请求空闲回调
              if (batchIndex < batches) {
                requestIdleCallbackPolyfill(processBatch, { timeout: 500 });
              } else {
                // 所有数据处理完成后更新表格
                if (pageNum.value === 1) {
                  // 第一页时替换所有数据
                  tableData.value = newBatchData;
                  nextTick(() => {
                    if (gridRef.value) {
                      // 首次加载时刷新整个表格
                      Promise.all([
                        gridRef.value.reloadColumn(tableOptions.value),
                        gridRef.value.reloadData(tableData.value),
                      ]).then(() => {
                        gridOptions.loading = false;
                      });
                    } else {
                      gridOptions.loading = false;
                    }
                  });
                } else {
                  // 获取当前滚动位置
                  const $grid = gridRef.value;
                  if (!$grid) {
                    gridOptions.loading = false;

                    return;
                  }

                  const savedScrollTop = lastScrollTop.value;

                  tableData.value = tableData.value.concat(newBatchData);

                  // 使用原生方法更新表格
                  $grid.reloadData(tableData.value).then(() => {
                    // 恢复滚动位置
                    nextTick(() => {
                      const bodyWrapper = $grid.$el.querySelector(
                        '.vxe-table--body-wrapper',
                      );
                      if (bodyWrapper && savedScrollTop > 0) {
                        bodyWrapper.scrollTop = savedScrollTop;
                      }

                      gridOptions.loading = false;
                    });
                  });
                }

                // 更新页码
                pageNum.value = body.pageNum + 1;
              }
            };

            // 启动批处理过程
            requestIdleCallbackPolyfill(processBatch, { timeout: 500 });
          }
        } else {
          if (pageNum.value === 1) {
            // 数据为空的情况，仍然需要设置表格结构
            tableData.value = [];
            nextTick(() => {
              if (gridRef.value) {
                // 首次加载时刷新整个表格
                Promise.all([
                  gridRef.value.reloadColumn(tableOptions.value),
                  gridRef.value.reloadData(tableData.value),
                ]).then(() => {
                  gridOptions.loading = false;
                });
              } else {
                gridOptions.loading = false;
              }
            });
          }

          // 更新页码
          pageNum.value = body.pageNum + 1;
        }
      } else if (gridData && gridData.length) {
          // 同样使用分批处理
          const batchSize = 1000;
          const batches = Math.ceil(gridData.length / batchSize);
          let newData: any[] = [];

          for (let i = 0; i < batches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, gridData.length);
            const batchData = gridData
              .slice(start, end)
              .map((value: any[]) => _.zipObject(headerFields.value, value));

            newData = newData.concat(batchData);

            if (i < batches - 1 && gridData.length > 5000) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }

          if (pageNum.value === 1) {
            tableData.value = newData;
            nextTick(() => {
              if (gridRef.value) {
                // 首次加载时刷新整个表格
                Promise.all([
                  gridRef.value.reloadColumn(tableOptions.value),
                  gridRef.value.reloadData(tableData.value),
                ]).then(() => {
                  gridOptions.loading = false;
                });
              } else {
                gridOptions.loading = false;
              }
            });
          } else {
            // 获取当前滚动位置
            const $grid = gridRef.value;
            if (!$grid) {
              gridOptions.loading = false;

              return;
            }

            const savedScrollTop = lastScrollTop.value;

            // 追加数据
            tableData.value = tableData.value.concat(newData);

            // 使用原生方法更新表格
            $grid.reloadData(tableData.value).then(() => {
              // 恢复滚动位置
              nextTick(() => {
                const bodyWrapper = $grid.$el.querySelector(
                  '.vxe-table--body-wrapper',
                );
                if (bodyWrapper && savedScrollTop > 0) {
                  bodyWrapper.scrollTop = savedScrollTop;
                }

                gridOptions.loading = false;
              });
            });
          }

          // 更新页码
          pageNum.value = body.pageNum + 1;
        } else if (pageNum.value === 1) {
            // 数据为空且没有header的情况
            tableData.value = [];
            nextTick(() => {
              if (gridRef.value) {
                // 首次加载时刷新整个表格
                Promise.all([
                  gridRef.value.reloadColumn(tableOptions.value),
                  gridRef.value.reloadData(tableData.value),
                ]).then(() => {
                  gridOptions.loading = false;
                });
              } else {
                gridOptions.loading = false;
              }
            });
          }
    } else {
      errorMsg.value = body.error || '获取数据失败';
      gridOptions.loading = false;
    }

    Object.keys(filterStates).forEach((field) => {
      filterStates[field].hasFiltered = false;
      filterStates[field].appliedValues = [];
      filterStates[field].tempSelectedValues = [];
    });
  } catch (e) {
    handleError(e);
  }
};

const reloadResults = () => {
  finishFetch.value = false;
  pageNum.value = 1;
  tableOptions.value = [];
  tableData.value = [];
  lastScrollTop.value = 0;
  downloading.value = false;
  isLoadingMore.value = false;

  Object.keys(filterStates).forEach((field) => {
    filterStates[field].tempSelectedValues = [];
    filterStates[field].appliedValues = [];
    filterStates[field].hasFiltered = false;
    filterStates[field].visible = false;
  });
  isFiltering.value = false;

  fetchResults();
};

const copyAll = async () => {
  try {
    // 优先使用现代的 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(copyData.value);
      message.success('已复制到剪贴板');
    } else {
      // 回退到 execCommand（兼容旧浏览器）
      const tempInput = document.createElement('textarea');
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      tempInput.value = copyData.value;
      document.body.appendChild(tempInput);
      tempInput.select();
      const success = document.execCommand('copy');
      document.body.removeChild(tempInput);
      if (success) {
        message.success('已复制到剪贴板');
      } else {
        message.error('复制失败，请重试');
      }
    }
  } catch {
    // Clipboard API 失败时回退到 execCommand
    try {
      const tempInput = document.createElement('textarea');
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      tempInput.value = copyData.value;
      document.body.appendChild(tempInput);
      tempInput.select();
      const success = document.execCommand('copy');
      document.body.removeChild(tempInput);
      if (success) {
        message.success('已复制到剪贴板');
      } else {
        message.error('复制失败，请重试');
      }
    } catch {
      message.error('复制失败，请重试');
    }
  }
};

const onDownload = async () => {
  if (exportVisible.value) exportVisible.value = false;
  if (downloadVisible.value) downloadVisible.value = false;
  downloading.value = true;
  try {
    const { data: { body } } = await Sql.downloadResults({ id: props.sqlInfo.id });
    const blob = buildCsvBlob(body.header, body.data);
    saveFileFromResponse({
      data: blob,
      headers: {
        'content-type': 'text/csv',
        'content-disposition': `attachment;filename=${body.fileName}`,
      },
    });
    message.success('开始下载');
  } catch {
    message.error('下载失败');
  } finally {
    downloading.value = false;
  }
};

const openDrawer = (row: any) => {
  drawerList.value = Object.keys(row)
    .map((key) => {
      const keyName = key.replace(/([_][^_]+)$/, '');

      return {
        key: keyName,
        value: row[key],
      };
    })
    .filter((item) => item.key !== '_X_ROW');
  drawerOpen.value = true;
};


const drawerFilterList = computed(() => {
  const searchText = drawerSearch.value.trim().toLowerCase();
  const list = drawerList.value;

  return searchText
    ? list.filter((item) =>
        _.values(item).some((value) =>
          String(value).toLowerCase().includes(searchText),
        ),
      )
    : list;
});


const copyCellValue = async (row: any, column: any) => {
  const textToCopy = String(formatCellValue(row[column.field], column.field, column.title) ?? '');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      message.success('已复制到剪贴板');
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      tempInput.value = textToCopy;
      document.body.appendChild(tempInput);
      tempInput.select();
      const success = document.execCommand('copy');
      document.body.removeChild(tempInput);
      message[success ? 'success' : 'error'](success ? '已复制到剪贴板' : '复制失败，请重试');
    }
  } catch {
    try {
      const tempInput = document.createElement('textarea');
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      tempInput.value = textToCopy;
      document.body.appendChild(tempInput);
      tempInput.select();
      const success = document.execCommand('copy');
      document.body.removeChild(tempInput);
      message[success ? 'success' : 'error'](success ? '已复制到剪贴板' : '复制失败，请重试');
    } catch {
      message.error('复制失败，请重试');
    }
  }
};

watch(
  () => props.sqlInfo.database,
  (newVal) => {
    if (newVal) {
      finishFetch.value = false;
      pageNum.value = 1;
      tableData.value = [];
    }
  },
  {
    deep: true,
    immediate: true,
  },
);

watch(
  () => props.pane.id,
  (newVal) => {
    // 获取样例数据
    if (!newVal && !props.sqlInfo.id) {
      finishFetch.value = false;
      pageNum.value = 1;
      tableData.value = [];
      fetchResults();
    }
  },
  { deep: true, immediate: true },
);

watch(
  () => props.sqlInfo.status,
  (newVal) => {
    if (newVal === 'COMMIT' || !newVal) {
      finishFetch.value = false;
      pageNum.value = 1;
      tableData.value = [];
      errorMsg.value = '';
    } else if (['ERROR_ABORTED', 'FAILED'].includes(newVal)) {
      errorMsg.value =
        props.pane.extraInfo?.errorMsg ||
        props.sqlInfo?.extraInfo?.errorMsg ||
        '获取数据失败';
    } else {
      fetchResults();
    }
  },
  { immediate: true },
);

watch(
  () => tableData.value,
  (newVal) => {
    if (newVal) {
      emit('update:table-length', newVal.length);
    }

    Object.keys(filterStates).forEach((field) => {
      if (!filterStates[field].appliedValues.length) {
        filterStates[field].hasFiltered = false;
      }
    });
  },
  { immediate: true },
);

// 兼容性处理：requestIdleCallback的polyfill
const requestIdleCallbackPolyfill = (callback: any, options?: any) => {
  if (window.requestIdleCallback) {
    return window.requestIdleCallback(callback, options);
  }

  // 回退到setTimeout
  const timeout = options?.timeout || 50;

  return setTimeout(() => {
    const start = Date.now();
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, timeout);
};

// 初始化 filterStates
watch(
  [tableOptions, tableData],
  ([cols, data]) => {
    cols.forEach((col) => {
      if (col.type !== 'seq') {
        const values = Array.from(new Set(data.map((row) => row[col.field])));
        if (filterStates[col.field]) {
          const exist = filterStates[col.field].options.map((opt) => opt.value);
          values.forEach((v) => {
            if (!exist.includes(v)) {
              filterStates[col.field].options.push({
                value: v,
                label: String(v),
              });
            }
          });
        } else {
          filterStates[col.field] = {
            tempSelectedValues: [],
            appliedValues: [],
            options: values.map((v) => ({ value: v, label: String(v) })),
            visible: false,
            searchValue: '',
            title: col.title,
            hasFiltered: false,
          };
        }
      }
    });
  },
  { immediate: true },
);

const isFiltering = ref(false);

function getFilteredData() {
  let filtered = tableData.value;
  for (const field of Object.keys(filterStates)) {
    const selected = filterStates[field].appliedValues;
    if (Array.isArray(selected) && selected.length > 0) {
      filtered = filtered.filter((row) => selected.includes(row[field]));
    }
  }

  return filtered;
}

function handleFilterConfirm(field: string) {
  const allOptions = filterStates[field].options.map((opt) => opt.value);
  const selected = filterStates[field].tempSelectedValues;
  const applied = filterStates[field].appliedValues || [];
  const filteredOptions = getFilteredOptions(field).map((opt) => opt.value);

  const isNoChange =
    applied.length === 0 &&
    selected.length === filteredOptions.length &&
    selected.every((v, i) => v === filteredOptions[i]);

  if (isNoChange) {
    filterStates[field].appliedValues = [];
    filterStates[field].hasFiltered = false;
    filterStates[field].visible = false;
    isFiltering.value = false;
    gridRef.value?.reloadData(getFilteredData());
    nextTick(() => {
      const bodyWrapper = gridRef.value?.$el.querySelector(
        '.vxe-table--body-wrapper',
      );
      if (bodyWrapper) bodyWrapper.scrollTop = 0;
    });

    return;
  }

  if (selected.length === allOptions.length) {
    filterStates[field].appliedValues = [];
    filterStates[field].hasFiltered = false;
    filterStates[field].visible = false;
    isFiltering.value = false;
    const filtered = getFilteredData();
    gridRef.value?.reloadData(filtered);
  } else if (selected.length === 0) {
    filterStates[field].appliedValues = [];
    filterStates[field].hasFiltered = true;
    filterStates[field].visible = false;
    isFiltering.value = true;
    gridRef.value?.reloadData([]);
  } else {
    filterStates[field].appliedValues = [...selected];
    filterStates[field].hasFiltered = true;
    filterStates[field].visible = false;
    isFiltering.value = true;
    const filtered = getFilteredData();
    gridRef.value?.reloadData(filtered);
  }

  nextTick(() => {
    const bodyWrapper = gridRef.value?.$el.querySelector(
      '.vxe-table--body-wrapper',
    );
    if (bodyWrapper) bodyWrapper.scrollTop = 0;
  });
}

function isFilterActive(field: string) {
  const state = filterStates[field];
  if (!state) return false;
  if (!Array.isArray(state.appliedValues)) return false;
  if (
    state.appliedValues.length === 0 &&
    state.options.length > 0 &&
    state.hasFiltered
  )
    return true;
  if (
    state.appliedValues.length > 0 &&
    state.appliedValues.length < state.options.length
  )
    return true;

  return false;
}

const currentFilterField = ref<string | null>(null);

function openColumnFilterModal(field: string) {
  currentFilterField.value = field;
  filterStates[field].visible = true;
  if (filterStates[field].hasFiltered) {
    // 用户筛选过，直接还原
    filterStates[field].tempSelectedValues = [
      ...filterStates[field].appliedValues,
    ];
  } else {
    // 没有筛选过，默认全选
    const values = getFilteredOptions(field).map((opt) => opt.value);
    filterStates[field].tempSelectedValues = values;
  }
}

function closeColumnFilterModal() {
  if (currentFilterField.value) {
    filterStates[currentFilterField.value].visible = false;
    currentFilterField.value = null;
  }
}

function getFilteredOptions(field) {
  const search = filterStates[field].searchValue?.toLowerCase() || '';
  if (!search) {
    // 只返回数量大于0的选项
    return filterStates[field].options.filter(
      (opt) => getOptionCount(field, opt.value) > 0,
    );
  }

  // 搜索时也只返回数量大于0的选项
  return filterStates[field].options.filter(
    (opt) =>
      String(opt.label).toLowerCase().includes(search) &&
      getOptionCount(field, opt.value) > 0,
  );
}

function isAllOptionsSelected(field) {
  const filtered = getFilteredOptions(field);

  return (
    filtered.length > 0 &&
    filtered.every((opt) =>
      filterStates[field].tempSelectedValues.includes(opt.value),
    )
  );
}

function handleSelectAllOptions(e, field) {
  const checked = e.target.checked;
  const filtered = getFilteredOptions(field);
  if (checked) {
    // 合并去重
    const all = Array.from(
      new Set([
        ...filterStates[field].tempSelectedValues,
        ...filtered.map((opt) => opt.value),
      ]),
    );
    filterStates[field].tempSelectedValues = all;
  } else {
    // 只移除当前筛选出来的
    filterStates[field].tempSelectedValues = filterStates[
      field
    ].tempSelectedValues.filter(
      (v) => !filtered.map((opt) => opt.value).includes(v),
    );
  }
}

function handleInitOptions(field) {
  filterStates[field].tempSelectedValues = filterStates[field].options.map(
    (opt) => opt.value,
  );
  // 只重置当前列，其他列不变
  filterStates[field].appliedValues = [
    ...filterStates[field].tempSelectedValues,
  ];
  filterStates[field].hasFiltered = false;
  filterStates[field].visible = false;
  // 刷新为所有列组合筛选后的数据
  isFiltering.value = Object.values(filterStates).some(
    (state) =>
      state.appliedValues.length > 0 &&
      state.appliedValues.length < state.options.length,
  );
  gridRef.value?.reloadData(getFilteredData());
  nextTick(() => {
    const bodyWrapper = gridRef.value?.$el.querySelector(
      '.vxe-table--body-wrapper',
    );
    if (bodyWrapper) bodyWrapper.scrollTop = 0;
  });
}

function handleOptionChange(e, field, value) {
  const checked = e.target.checked;
  if (checked) {
    if (!filterStates[field].tempSelectedValues.includes(value)) {
      filterStates[field].tempSelectedValues.push(value);
    }
  } else {
    filterStates[field].tempSelectedValues = filterStates[
      field
    ].tempSelectedValues.filter((v) => v !== value);
  }
}

function getOptionCount(field: string, value: string) {
  // 先组合其它列的过滤条件，排除本列
  let filtered = tableData.value;
  Object.keys(filterStates).forEach((f) => {
    if (f !== field) {
      const selected = filterStates[f].appliedValues;
      if (selected && selected.length) {
        filtered = filtered.filter((row) => selected.includes(row[f]));
      }
    }
  });

  return filtered.filter((row) => row[field] === value).length;
}

watch(
  () => searchColumnValue.value,
  (newValue) => {
    if (!newValue) {
      filteredDragColumns.value = [...dragColumns.value];
    } else {
      filteredDragColumns.value = filteredDragColumns.value.filter((col) =>
        (col.title || '').toLowerCase().includes(newValue.toLowerCase()),
      );
    }

    selectAll.value = !filteredDragColumns.value.some((c) => c.hidden);
  },
  { immediate: true, deep: true },
);
</script>

<style lang="less" scoped>
.sql-result {
  display: flex;
  flex-direction: column;
  text-align: center;
  // min-height: 300px;
  height: 100%;
  overflow: hidden;

  &.empty-container {
    padding: 10px;
    height: 100%;
    min-height: 25vh;
    overflow: scroll;
    border: 1px solid #d9d9d9;
    border-radius: 4px;

    :deep(.ant-empty-image) {
      display: none;
    }
  }

  .table-scrollbar ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .table-scrollbar ::-webkit-scrollbar-track {
    background-color: #ffffff;
  }

  /*滚动条里面的小方块，能向上向下移动*/
  .table-scrollbar ::-webkit-scrollbar-thumb {
    background-color: #bfbfbf;
    border-radius: 5px;
    border: 1px solid #f1f1f1;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  }

  .table-scrollbar ::-webkit-scrollbar-thumb:hover {
    background-color: #a8a8a8;
  }

  .table-scrollbar ::-webkit-scrollbar-thumb:active {
    background-color: #787878;
  }

  /*边角，即两个滚动条的交汇处*/
  .table-scrollbar ::-webkit-scrollbar-corner {
    background-color: #ffffff;
  }

  .table-scrollbar {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    :deep(.vxe-toolbar) {
      padding: 0 0 5px;
    }

    :deep(.vxe-grid--table-container) {
      height: calc(100% - 37px);
    }

    :deep(.vxe-table--render-default) {
      height: 100%;

      .vxe-table--body-wrapper {
        max-height: calc(100% - 44px) !important;
      }
    }

    :deep(.vxe-table--render-wrapper) {
      height: 100%;
    }

    :deep(.vxe-table--main-wrapper) {
      min-height: 0;
      height: 100%;
    }

    :deep(.vxe-table--scroll-x-virtual) {
      height: 0 !important;
    }
  }

  // 字体居左
  .footer-content {
    text-align: left;
  }

  :deep(.vxe-cell--title) {
    padding: 5px 0;
    width: max-content !important;
    max-height: unset !important;
    text-overflow: unset !important;
    white-space: break-spaces !important;
  }

  :deep(.custom-cell) {
    padding: 5px 0;
    font-size: 12px;

    .cell-with-copy {
      display: flex;
      align-items: center;
      width: 100%;

      .cell-text {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cell-copy-icon {
        flex-shrink: 0;
        margin-left: 4px;
        color: #1677ff;
        cursor: pointer;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
      }
    }

    &:hover .cell-copy-icon {
      opacity: 1;
    }
  }

  :deep(.col-selected) {
    box-shadow: 0 0 0 2px #1677ff inset !important;
    z-index: 2;
    position: relative;

    &.custom-title-cell {
      box-shadow: none;
      background-image: linear-gradient(#1677ff, #1677ff),
        linear-gradient(#1677ff, #1677ff), linear-gradient(#1677ff, #1677ff),
        linear-gradient(#1677ff, #1677ff);
      background-size: 100% 3px, 2px 100%, 100% 2px, 2px 100%;
    }
  }

  :deep(.vxe-table-custom--body) {
    max-height: 400px !important;
    min-height: 150px !important;
  }

  :deep(.custom-title-cell) {
    padding: 5px 0;
    font-size: 12px;

    .vxe-cell {
      max-height: unset !important;
      text-overflow: unset !important;
      white-space: break-spaces !important;
    }
  }
}

.column-list {
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 8px;

  .column-item {
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    gap: 8px;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #fafafa;
    }

    &.select-all {
      border-bottom: 1px solid #d9d9d9;
      margin-bottom: 8px;
      padding-bottom: 12px;
      justify-content: space-between;
    }

    .drag-handle {
      cursor: move;
      color: #999;
      display: flex;
      align-items: center;
      padding: 4px;

      &:hover {
        color: #666;
      }
    }
  }
}

// 拖拽时的样式
:deep(.sortable-ghost) {
  opacity: 0.5;
  background: #f0f0f0;
}

:deep(.sortable-drag) {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.modal-footer-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  .footer-btns {
    display: flex;
    gap: 8px;
  }
}

.download-item {
  display: flex;
  align-items: center;
  width: 200px;
  .download-icon {
    margin-right: 5px;
    width: 20px;
  }
  .download-title {
    font-size: 14px;
    font-weight: 500;
  }
  .download-tips {
    font-size: 12px;
    color: #8c8c8c;
  }
}
</style>

<style lang="less">
.sql-result-filter-popover {
  z-index: 9999 !important;
  overflow: visible !important;
}

.sql-result-select-dropdown {
  z-index: 10000 !important;
}
</style>
