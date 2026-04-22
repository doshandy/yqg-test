<template>
  <Modal
    v-model:open="open"
    class="create-menu"
    :title="title"
    width="50%"
    destroy-on-close
    :footer="null"
    @cancel="onCancel"
  >
  <Form
    ref="formRef"
    layout="horizontal"
    :model="editing"
    :colon="false"
    v-bind="formLayout"
    @cancel="onCancel"
  >

  <Form.Item
      v-if="!edit"
       :label="remove ? '当前路径' : '保存路径'"
      name="route"
      required
      :rules="[
        {
          required: true,
          message: '请选择本次新建子目录的保存路径',
        },
      ]"
    >
    
      <Cascader
        v-model:value="editing.route"
        change-on-select
        :options="routeOptions"
        allow-clear
        style="width: 100%"
        placeholder="请选择本次新建子目录的保存路径"
       :disabled="remove"
        :show-search="{ filter }"
      />
    </Form.Item>

    <Form.Item
      v-if="remove"
       label="目标路径"
      name="route"
      required
      :rules="[
        {
          required: true,
          message: '请选择目标路径，任务写入的数据库需要和该路径一致',
        },
      ]"
    >
    
      <Cascader
        v-model:value="editing.removeRoute"
        change-on-select
        :options="routeOptions"
        allow-clear
        style="width: 100%"
        placeholder="请选择目标路径，任务写入的数据库需要和该路径一致"
       
        :show-search="{ filter }"
      />
    </Form.Item>

    <Form.Item
    v-if="!remove"
      :label="name"
      name="taskName"
      required
      :rules="[
        {
          required: true,
          message: '请输入子目录名称，支持中英文、数字、下划线(_)',
        },
        {
          pattern: /^[0-9_a-zA-Z\u4e00-\u9fa5]+$/,
          message: '请输入子目录名称，支持中英文、数字、下划线(_)',
        },
        { max: 50, message: '目录名称不能超过50个字符' },
      ]"
    >
      <Input
        v-model:value="editing.taskName"
        placeholder="请输入子目录名称，支持中英文、数字、下划线(_)"
      />
    </Form.Item>
    <Form.Item
      v-if="edit"
      label="当前目录"
    >
      {{ route.join('/') }}
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
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import {
  Modal,
  Row,
  Button,
  message,
  Form,
  Input,
  Cascader
} from 'ant-design-vue';
import type { ShowSearchType } from 'ant-design-vue/es/vc-cascader';
import Sql from '@/resources/sql';
const emit = defineEmits(['on-refresh']);
const open = ref<boolean>(false);
const formRef = ref(null);
const editing = ref({
  taskName: undefined,
  route: [],
  removeRoute: []
});
const routeOptions = ref([]);
const title = ref('');
const name = ref('目录名称');
const edit = ref(false);
const remove = ref(false)
const route = ref([]);
const parentId = ref(-1);
const formLayout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 20,
  },
};


const filter: ShowSearchType['filter'] = (inputValue, path) => {
  return path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
};

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

function transformTree(list) {
  return list.map((item) => {
    const node = {
      label: item.taskDirectory.taskName,
      value: item.taskDirectory.id || item.taskDirectory.taskName,
      children: item.children ? transformTree(item.children) : undefined,
      key: item.taskDirectory.id + item.taskDirectory.taskName
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

const showModal = (data) => {
  open.value = true;
  edit.value = data.edit || false;
  remove.value = data.remove || false
  route.value =  data.route || [];
   getDatabaseList();
  
  title.value = data.edit ? `${data.title}重命名` : (data.remove ? data.title  : `新建${data.title}`);
  name.value = `${data.title}名称`;
  if (data.data) {
    editing.value = JSON.parse(JSON.stringify(data.data || {}));
  }

  editing.value.route = data.route || [];
  parentId.value = data.parentId || -1;
};

const onCancel = () => {
  open.value = false;
  edit.value = false;
  title.value = '';
  route.value = []
  editing.value = {
    taskName: undefined,
    route: [],
    removeRoute: []
  };
  parentId.value = -1;
};

function findKeyByValue(tree, targetValue) {
  for (const node of tree) {
    if (node.value === targetValue) {
      return node.key
    }

    if (node.children && node.children.length) {
      const result = findKeyByValue(node.children, targetValue)
      if (result !== undefined) {
        return result
      }
    }
  }

  return undefined
}

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

const onConfirm = () => {
  formRef.value
    .validate()
    .then(async () => {
      if(remove.value) {
        const targetParentId = editing.value.removeRoute.length > 1 ? editing.value.removeRoute[editing.value.removeRoute.length - 1] : undefined
        await Sql.moveTaskDirectory({
          id: editing.value.id,
          targetParentId,
          databaseName: editing.value.removeRoute[0],
        })
        const removeRouteKey = editing.value.removeRoute.map(i => findKeyByValue(routeOptions.value,i))
        emit('on-refresh', removeRouteKey.filter(o => o), {
          taskId: editing.value.taskId,
          parentId: targetParentId,
          databaseName: editing.value.removeRoute[0],
        });
      } else {
        const save =
        edit.value
          ? Sql.updateDirectory
          :  Sql.createDirectory;
      // 使用用户选择的路径的最后一个值作为 parentId
      // 如果只选择了数据库（route.length === 1），parentId 应该是 null 或 -1
      // 如果选择了数据库下的目录（route.length > 1），parentId 应该是最后一个元素（数字ID）
      // const selectedParentId = editing.value.route && editing.value.route.length > 1 
      //   ? editing.value.route[editing.value.route.length - 1] 
      //   : null;

        const path = Array.isArray(editing.value.route) ? editing.value.route : [];

        // 从 routeOptions 中获取对应的 ID 数组
        const routeIds = getRouteIds(path, routeOptions.value);
        // 根据 ID 数组计算 parentId
        // 如果路径长度 >= 1 且成功获取到 IDs，parentId 是 ID 数组的最后一个元素
        // 否则使用当前的 parentId 值
        const currentParentId = routeIds.length >= 1 ? routeIds[routeIds.length - 1] : -1;

        const databaseName = path[0];
        if (databaseName === undefined) {
          message.warning('请选择保存路径');

          return;
        }

      await save({
        ...editing.value,
        itemType: 'DIRECTORY',
        parentId: currentParentId,
        databaseName,
      });
      emit('on-refresh');
      }
    
      message.success('提交成功');
      
      onCancel();
    })
    .catch((error) => {
      console.log('error', error);
    });
};

defineExpose({
  showModal,
  getDatabaseList,
});
</script>
