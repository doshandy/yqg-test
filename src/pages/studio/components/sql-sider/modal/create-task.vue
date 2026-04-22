<template>
  <div>
    <Modal
      v-model:open="open"
      class="create-task"
      :title="title"
      width="900px"
      destroy-on-close
      :footer="null"
      @cancel="onCancel"
    >
      <Form
        ref="formRef"
        layout="vertical"
        class="create-task-form"
        :model="editing"
        :colon="false"
        @cancel="onCancel"
      >
        <Form.Item
          label="任务类型"
          name="taskType"
          required
        >
          <Select
            v-model:value="editing.taskType"
            :options="taskTypeOptions"
            style="width: 100%"
            :disabled="edit"
          />
        </Form.Item>
        <Form.Item
          label="任务名称"
          name="taskName"
          required
          :rules="[
            {
              required: true,
              message: '请输入任务名称，支持英文、数字、下划线(_)',
            },
            {
              pattern: /^[a-zA-Z0-9_]+$/,
              message: '请输入任务名称，支持英文、数字、下划线(_)',
            },
            { max: 100, message: '任务名称不能超过100个字符' },
          ]"
        >
          <Input
            v-model:value="editing.taskName"
            placeholder="请输入任务名称，支持英文、数字、下划线(_)"
          />
        </Form.Item>
        <Form.Item
          label="保存路径"
          name="route"
          required
          :rules="[
            {
              required: true,
              message: '请选择保存路径，任务写入的数据库需要和该路径一致',
            },
          ]"
        >
          <div class="path">
            <Cascader
              v-model:value="editing.route"
              change-on-select
              :options="routeOptions"
              allow-clear
              style="flex: 1"
              placeholder="请选择保存路径，任务写入的数据库需要和该路径一致"
              :disabled="edit"
              :show-search="{ filter }"
            />
            <Button style="width: 20%;" type="primary" @click="addPath">+ 新建</Button>
          </div>
        </Form.Item>
        <Form.Item
          label="任务描述"
          name="description"
          required
          :rules="[
            {
              required: true,
              message: '请填写描述',
            },
            { max: 200, message: '描述内容不得超过 200 字' }
          ]"
        >
          <Textarea v-model:value="editing.description" placeholder="请输入任务描述" :maxlength="200" show-count allow-clear />
        </Form.Item>
        <Form.Item label="关联Tapd">
          <TapdCardSection v-model="tapdList" :show-title="false" />
        </Form.Item>

        <Row
          style="margin-top: 10px"
          align="middle"
          justify="end"
        >
          <Button style="margin-right: 10px" @click="onCancel">取消</Button>
          <Button type="primary" @click="onConfirm">确定</Button>
        </Row>
      </Form>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import {
  Modal,
  Row,
  Button,
  message,
  Form,
  Cascader,
  Select,
  Input,
  Textarea,
} from 'ant-design-vue';
import type { ShowSearchType } from 'ant-design-vue/es/vc-cascader';
import Sql from '@/resources/sql';
import TapdCardSection from './tapd-card-section.vue';
import { TaskTypeEnum } from '../../../common/task-type-enum';

const emit = defineEmits(['on-close','on-refresh','createMenu']);

const open = ref<boolean>(false);
const tableInfo = ref({});
const formRef = ref(null);
const editing = ref(
  {
    taskType: 'SPARK_SQL',
    taskName: undefined,
    route: [],
    description: ''
  }
);
const taskTypeOptions = ref([]);
const routeOptions = ref([]);
const title = ref('');
const edit = ref(false);
const parentId = ref(-1);
const tapdList = ref<any[]>([]);

// 从 route 值数组获取对应的 ID 数组
// 支持 value 为数字（ID）或字符串（名称）的情况
function getRouteIds(route: any[], routeOptionsTree: any[]): number[] {
  if (!route || route.length === 0 || !routeOptionsTree || routeOptionsTree.length === 0) {
    return [];
  }
  
  const ids: number[] = [];
  let currentTree = routeOptionsTree;
  
  for (let i = 0; i < route.length; i++) {
    const value = route[i];
    // 如果 value 本身就是数字（ID），直接使用
    if (typeof value === 'number') {
      ids.push(value);
      // 继续查找下一层
      const node = currentTree.find(n => n.value === value);
      if (node && node.children) {
        currentTree = node.children;
      } else {
        break;
      }
    } else {
      // 如果是字符串（名称），需要在当前树中查找对应的节点
      // 优先通过 value 匹配
      let node = currentTree.find(n => n.value === value);
      
      // 如果通过 value 找不到，尝试通过 label 匹配（兼容性处理）
      if (!node) {
        node = currentTree.find(n => n.label === value);
      }
      
      if (node) {
        // 如果节点的 value 是数字，那就是 ID，直接使用
        if (typeof node.value === 'number') {
          ids.push(node.value);
          if (node.children) {
            currentTree = node.children;
          } else {
            break;
          }
        } else {
          // 如果 value 是字符串，优先使用节点的 id 字段（如果存在）
          if (node.id && typeof node.id === 'number') {
            ids.push(node.id);
            if (node.children) {
              currentTree = node.children;
            } else {
              break;
            }
          } else if (node.key && typeof node.key === 'string') {
            // 如果没有 id 字段，尝试从 key 中提取 ID（key 格式为 "id + taskName"）
            const keyMatch = node.key.match(/^(\d+)/);
            if (keyMatch) {
              const extractedId = parseInt(keyMatch[1], 10);
              if (!isNaN(extractedId)) {
                ids.push(extractedId);
                if (node.children) {
                  currentTree = node.children;
                } else {
                  break;
                }
              } else {
                // 无法提取 ID，跳过这个节点，继续处理后续路径
                if (node.children) {
                  currentTree = node.children;
                  // 不添加 ID，继续处理下一层
                } else {
                  break;
                }
              }
            } else {
              // key 格式不符合预期，跳过这个节点
              if (node.children) {
                currentTree = node.children;
                // 不添加 ID，继续处理下一层
              } else {
                // 没有子节点且无法获取 ID，停止解析
                break;
              }
            }
          } else {
            // 无法获取 ID，跳过这个节点
            if (node.children) {
              currentTree = node.children;
              // 不添加 ID，继续处理下一层
            } else {
              // 没有子节点且无法获取 ID，停止解析
              break;
            }
          }
        }
      } else {
        // 找不到节点，中断解析
        break;
      }
    }
  }
  
  return ids;
}

const addPath = () => {
  const path = editing.value.route || [];
  
  // 从 routeOptions 中获取对应的 ID 数组
  const routeIds = getRouteIds(path, routeOptions.value);
  
  // 根据 ID 数组计算 parentId
  // 如果路径长度 >= 1 且成功获取到 IDs，parentId 是 ID 数组的最后一个元素
  // 否则使用当前的 parentId 值
  const currentParentId = routeIds.length >= 1 ? routeIds[routeIds.length - 1] : parentId.value;
  
  // 传递包含 id、route 和 routeIds 的对象
  emit('createMenu', false, '子目录', {
    id: currentParentId,
    route: path.length > 0 ? path : undefined,
    routeIds: routeIds.length > 0 ? routeIds : undefined
  });
}



const showModal = async (data) => {
  open.value = true;
  getDatabaseList();
  await TaskTypeEnum.query();
  taskTypeOptions.value = [...TaskTypeEnum.LIST];
  edit.value = data.edit || false;
  title.value = data.edit ? '重命名任务' : '新建任务'; // 新建任务、重命名任务
  if (data.data) {
    editing.value = JSON.parse(JSON.stringify(data.data || {}));
    if (data.data.taskId) {
      const { data: { body } } = await Sql.getTask({
        params: {
          id: data.data.taskId,
        },
        hideLoading: true,
      });
      
      editing.value = {
        ...editing.value,
        ...body.taskDirectory,
        ...body.task,
        taskId: body.task.id,
        id: body.taskDirectory.id,
      };
      getInitTapdList()
    }
  }

  parentId.value = data.parentId || -1;
  editing.value.route = data.route || [];
};

const getInitTapdList = () => {
  if (!editing.value.taskTapdRelation) return;
  tapdList.value = editing.value.taskTapdRelation;
}

const filter: ShowSearchType['filter'] = (inputValue, path) => {
  return path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
};

function transformTree(list) {
  return list.map((item) => {
    const node = {
      label: item.taskDirectory.taskName,
      value: item.taskDirectory.id || item.taskDirectory.taskName,
      children: item.children ? transformTree(item.children) : undefined,
      // 添加 key 字段，包含 id 信息，便于后续从字符串 value 中提取 ID
      key: item.taskDirectory.id ? `${item.taskDirectory.id}${item.taskDirectory.taskName}` : item.taskDirectory.taskName,
      // 添加原始 id 字段，便于直接访问
      id: item.taskDirectory.id,
    }

    return node
  });
}

const getDatabaseList = async () => {
  try {
    const { data: { body } } = await Sql.searchDirectoryList({
      params: {
        itemType: 'DATABASE',
      },
    });
    if (body) {
      const databaseList = transformTree(body || []);
      getMenuList(databaseList);
    }
  } catch (error) {
    console.error('获取目录列表失败', error);
  }
}


const getMenuList = async (databaseList: any) => {
  try {
    const { data: { body } } = await Sql.searchDirectoryList({
      params: {
        itemType: 'DIRECTORY',
      },
    });
    if (body) {
      const menuList = transformTree(body || []);
      databaseList.forEach(item => {
        const menu = menuList.find(menu => menu.value === item.value);
        if (menu) {
          item.children = menu.children;
        }
      })
      routeOptions.value = databaseList;
    }
  } catch (error) {
    console.error('获取目录列表失败', error);
  }
};

const onCancel = () => {
  tableInfo.value = {};
  open.value = false;
  edit.value = false;
  editing.value = {
    taskType: 'SPARK_SQL',
    taskName: undefined,
    route: [],
  };
  parentId.value = -1;
  tapdList.value = [];
};

const onConfirm = () => {
  formRef.value
    .validate()
    .then(async () => {
    const save =
        edit.value
          ? Sql.updateTasks
          : Sql.createTasks;
      const path = editing.value.route;
      
      // 从 routeOptions 中获取对应的 ID 数组
      const routeIds = getRouteIds(path, routeOptions.value);
      
      // 根据 ID 数组计算 parentId
      // 如果路径长度 >= 1 且成功获取到 IDs，parentId 是 ID 数组的最后一个元素
      // 否则使用当前的 parentId 值
      const calculatedParentId = routeIds.length >= 1 ? routeIds[routeIds.length - 1] : -1;
      
      const params = {
        ...editing.value,
        itemType: 'TASK',
        taskTapdRelation: tapdList.value,
        parentId: calculatedParentId,
        databaseName: path[0],
      };
      if (!edit.value) {
        params.taskCode = editing.value.taskName;
      }
 
      delete params.route;
      const res = await save(params);
      const { body } = res.data;
      message.success('提交成功');
      emit('on-close', body.task.id, edit.value);
      onCancel();
    })
    .catch((error) => {
      console.log('error', error);
    });
};

defineExpose({
  showModal,
  getDatabaseList
});
</script>
<style lang="less">
.create-task {
  .ant-modal-body {
    .create-task-form {
      margin-top: 20px;

      .ant-form-item {
        margin-bottom: 16px;
      }
    }
  }
}
</style>

<style lang="less" scoped>
.path {
  width: 100%;
  display: flex;
  flex-direction: row;
}

:deep(.path .ant-select-selector) {
  border-radius: 6px 0 0 6px;
}

:deep(.path .ant-btn) {
  border-radius: 0 6px 6px 0;
}
</style>
