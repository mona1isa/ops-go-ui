<template>
   <el-dialog v-model="state.tableData.dialogVisible" title="解除凭证授权" width="50%" :before-close="handleClose" >
    <el-table :data="state.tableData.bindingKeys" v-loading="state.tableData.loading" height="400" @selection-change="handleSelectionChange">
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
      <el-button @click="state.tableData.dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmUnbind">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="authGroupKeyAuthCancel">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';

const emit = defineEmits(['refresh']);

const state = reactive({
    tableData: {
        dialogVisible: false,
        bindingKeys: [] as any[],
        loading: false,
    }
});

// 定义接口
const userIsntanceAuthApi = useUserInstanceAuthApi();

const currentGroupId = ref<number>(0);
const currentUserId = ref<number>(0);
const selectedKeys = ref<any[]>([]);

// 打开对话框
const openDialog = (instanceId: number, userId: number, keys: any[]) => {
  state.tableData.dialogVisible = true;
  state.tableData.bindingKeys = keys;
  currentGroupId.value = instanceId;
  currentUserId.value = userId;
};

// 关闭对话框
const handleClose = () => {
  state.tableData.dialogVisible = false;
};

// 解绑单个凭证
const unbindSingle = async (key: any) => {
  try {
    state.tableData.loading = true;
    // 调用解绑接口
    let data = {
      groupId: currentGroupId.value,
      keyId: key.id,
      userId: currentUserId.value,
    }
    const res = await userIsntanceAuthApi.groupAuthKeyCancel(data);
    if (res && res.code === 200) {
      emit('refresh');
      ElMessage.success('解除成功');
      // 刷新凭证列表
      let data = {
        userId: currentUserId.value,
        groupId: currentGroupId.value,
      }
      const res = await userIsntanceAuthApi.groupAuthKeyList(data);
      if (res && res.code === 200) {
          state.tableData.bindingKeys = res.data;
      }
    }
  } catch (error) {
    ElMessage.error('解除失败');
  }
  state.tableData.loading = false;
};

// 选择框变化
const handleSelectionChange = (selection: any[]) => {
  selectedKeys.value = selection.map(item => item.id);
};

// 批量解绑
const confirmUnbind = async () => {
    state.tableData.loading = true;
    try {
      // 调用批量解绑接口
      let data = {
        userId: currentUserId.value,
        groupId: currentGroupId.value,
        keyIds: selectedKeys.value,
      }
      const res = await userIsntanceAuthApi.groupAuthKeyCancelMulti(data);
      if (res && res.code === 200) {
        emit('refresh');
        ElMessage.success('解除成功');
        selectedKeys.value = [];
      }
      state.tableData.dialogVisible = false;
    } catch (error) {
      ElMessage.error('解除失败');
    }
    state.tableData.loading = false;
};

// 向外暴露方法
defineExpose({
  openDialog,
});

</script>

<style scoped lang="scss">

</style>