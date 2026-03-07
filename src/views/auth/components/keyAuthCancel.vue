<template>
  <el-dialog v-model="dialogVisible" title="解除凭证授权" width="50%" :before-close="handleClose" >
    <el-table :data="bindingKeys" v-loading="tableData.loading" height="400" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="凭证名称" />
      <el-table-column prop="protocol" label="协议类型" />
      <el-table-column prop="type" label="类型" >
        <template #default="scope">
          {{ scope.row.type === 1 ? '密码' : '密钥' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button type="primary" link size="small" @click="unbindSingle(scope.row)">取消授权</el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmUnbind">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive} from 'vue';
import { ElMessage } from 'element-plus';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';

const emit = defineEmits(['refresh']);

const dialogVisible = ref(false);
const bindingKeys = ref<any[]>([]);
const selectedKeys = ref<any[]>([]);

// 存储当前实例ID，用于解绑凭证时使用
const currentInstanceId = ref<number>(0);
// 存储当前用户ID，用于解绑凭证时使用
const currentUserId = ref<number>(0);

const tableData = reactive({
    loading: false,
});

// 定义接口
const userIsntanceAuthApi = useUserInstanceAuthApi();

// 打开对话框
const openDialog = (instanceId: number, userId: number, keys: any[]) => {
  dialogVisible.value = true;
  bindingKeys.value = keys;
  currentInstanceId.value = instanceId;
  currentUserId.value = userId;
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 解绑单个凭证
const unbindSingle = async (key: any) => {
  try {
    tableData.loading = true;
    // 调用解绑接口
    let data = {
      instanceId: currentInstanceId.value,
      keyId: key.id,
      userId: currentUserId.value,
    }
    const res = await userIsntanceAuthApi.userInstanceKeyAuthDelete(data);
    if (res && res.code === 200) {
      emit('refresh');
      ElMessage.success('解绑成功');
      // 刷新凭证列表
      let data = {
        userId: currentUserId.value,
        instanceId: currentInstanceId.value,
      }
      const res = await userIsntanceAuthApi.userInstanceKeyAuthList(data);
      if (res && res.code === 200) {
          bindingKeys.value = res.data;
      }
    }
  } catch (error) {
    ElMessage.error('解绑失败');
  }
  tableData.loading = false;
};

// 选择框变化
const handleSelectionChange = (selection: any[]) => {
  selectedKeys.value = selection.map(item => item.id);
};

// 批量解绑
const confirmUnbind = async () => {
    tableData.loading = true;
    try {
      // 调用批量解绑接口
      let data = {
        userId: currentUserId.value,
        instanceId: currentInstanceId.value,
        keyIds: selectedKeys.value,
      }
      const res = await userIsntanceAuthApi.userInstanceKeyAuthDeleteBatch(data);
      if (res && res.code === 200) {
        emit('refresh');
        ElMessage.success('解绑成功');
        selectedKeys.value = [];
      }
      dialogVisible.value = false;
    } catch (error) {
      ElMessage.error('解绑失败');
    }
    tableData.loading = false;
};

// 向外暴露方法
defineExpose({
  openDialog,
});
</script>

<style scoped>
/* 可根据需要添加样式 */
</style>