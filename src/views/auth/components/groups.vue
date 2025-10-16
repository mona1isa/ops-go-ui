<template>
  <div class="host-group-info">
    <div v-if="!currentUserId" class="empty-tip">
      <el-empty description="请选择用户查看主机分组" />
    </div>
    <div v-else>
      <el-table :data="state.tableData.data" style="width: 100%">
        <el-table-column prop="name" label="分组名称" />
        <el-table-column prop="count" label="主机数量" />
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
  </div>
</template>

<script setup lang="ts" name="authGroups">
import {  watch, ref, onMounted, reactive } from 'vue';
import { GroupState } from '/@/types/views';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';

// 定义接口
const userInstanceAuthApi = useUserInstanceAuthApi();

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

// 监听用户ID变化，刷新主机列表
watch(currentUserId, () => {
  state.tableData.param.pageNum = 1;
  getTableData();
});

defineExpose({
  loadUserGroup
});

</script>

<style scoped>
.host-group-info {
  flex: 1;
}
</style>