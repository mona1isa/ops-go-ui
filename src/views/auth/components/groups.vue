<template>
  <div class="host-group-info">
    <div v-if="!currentUserId" class="empty-tip">
      <el-empty description="请选择用户查看主机分组" />
    </div>
    <div v-else>
      <el-table :data="state.tableData.data" style="width: 100%">
        <el-table-column prop="name" label="分组名称" />
        <el-table-column prop="bindingKeys" label="登录凭证" >
          <template #default="scope">
              <el-link v-if="scope.row.bindingKeys !==null && scope.row.bindingKeys.length > 0" type="primary" @click="onOpenKeyAuthCancel(scope.row)">{{ getbindingKeys(scope.row.bindingKeys) }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="操作" >
          <template #default="scope">
            <el-button plain type="primary" size="small" @click="handleRemoveAuth(scope.row)" :icon="Promotion">解除</el-button>
            <el-button plain type="primary" size="small" @click="onOpenKeyAuth(scope.row)" :icon="Connection">凭证授权</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="mt15"
        v-model:current-page="state.tableData.param.pageNum"
        :page-sizes="[10, 20, 30, 50]"
        background
        v-model:page-size="state.tableData.param.pageSize"
        layout="total, sizes, prev, pager, next"
        :total="state.tableData.total"
      />
    </div>
    <GroupKeyAuthDialog ref="groupKeyAuthDialogRef" @refresh="getTableData()"/>
    <GroupKeyAuthCancelDialog ref="groupKeyAuthCancelDialogRef" @refresh="getTableData()"/>
  </div>
</template>

<script setup lang="ts" name="authGroups">
import {  watch, ref, onMounted, reactive, defineAsyncComponent } from 'vue';
import { GroupState } from '/@/types/views';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';
import { ElMessage } from 'element-plus';
import { Promotion, Connection } from '@element-plus/icons-vue'

// 定义接口
const userInstanceAuthApi = useUserInstanceAuthApi();

const GroupKeyAuthDialog = defineAsyncComponent(() => import('/@/views/auth/components/groupKeyAuth.vue'));
const GroupKeyAuthCancelDialog = defineAsyncComponent(() => import('/@/views/auth/components/groupKeyAuthCancel.vue'));

const groupKeyAuthDialogRef = ref();
const groupKeyAuthCancelDialogRef = ref();

const state = reactive<GroupState>({
  tableData: {
    loading: false,
    param: {
      pageNum: 1,
      pageSize: 10
    },
    total: 0,
    data: []
  }
});

// 当前用户ID
const currentUserId = ref<number | null>(null);

// 接收从父组件传递的用户ID
const loadUserGroup = (userId: number) => {
  currentUserId.value = userId;
  state.tableData.param.pageNum = 1;
  getTableData();
};

const getTableData = async () => {
  if (!currentUserId.value) {
    state.tableData.data = [];
    state.tableData.total = 0;
    return;
  }
 let data = {
    userId: currentUserId.value,
    pageNum: state.tableData.param.pageNum,
    pageSize: state.tableData.param.pageSize
  };
  const res = await userInstanceAuthApi.pageUserGroups(data);
  if (res && res.code === 200) {
    state.tableData.data = res.data.groups;
    state.tableData.total = res.data.total;
  };
};

onMounted(() => {
  getTableData();
});

// 每页条数改变
const handleSizeChange = (val: number) => {
  state.tableData.param.pageSize = val;
  state.tableData.param.pageNum = 1;
  getTableData();
};

// 处理当前页码变化
const handleCurrentChange = (val: number) => {
  state.tableData.param.pageNum = val;
  getTableData();
};

// 解除分组授权
const handleRemoveAuth = async (row: any) => {
    if (!currentUserId.value) {
      return;
    }
    state.tableData.loading = true;
    let data = {
        userId: currentUserId.value,
        groupIds: [row.id],
        authType: 2 // 解除分组授权
    };
    const res = await userInstanceAuthApi.deleteUserInstanceAuth(data);
    if (res && res.code === 200) {
        ElMessage.success('解除授权成功');
        getTableData();
    } else {
        ElMessage.error('解除授权失败');
    }
    state.tableData.loading = false;
};

// 打开凭证授权对话框
const onOpenKeyAuth = (row: any) => {
  // 触发父组件的方法打开凭证授权对话框
  groupKeyAuthDialogRef.value.openDialog(row.id, currentUserId.value);
};

// 获取绑定凭证
const getbindingKeys = (bindingKeys: any) => {
    if (!bindingKeys || bindingKeys.length === 0) return '未授权任何凭证';
    return bindingKeys.map((item: any) => {
        return `${item.name}`;
    }).join('; ');
};

// 打开解除授权对话框
const onOpenKeyAuthCancel = (row: any) => {
  if (row.bindingKeys && row.bindingKeys.length > 0) {
    groupKeyAuthCancelDialogRef.value.openDialog(row.id, currentUserId.value, row.bindingKeys);
  }
};

defineExpose({
  loadUserGroup
});

</script>

<style scoped>
.host-group-info {
  flex: 1;
}
</style>