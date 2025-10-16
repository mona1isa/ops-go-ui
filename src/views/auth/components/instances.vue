<template>
  <div class="instance-list">
    <div v-if="!currentUserId" class="empty-tip">
      <el-empty description="请选择用户查看主机信息" />
    </div>
    <div v-else>
      <el-table :data="state.tableData.data" style="width: 100%">
        <el-table-column prop="name" label="主机名" />
        <el-table-column prop="ip" label="IP地址" />
        <el-table-column prop="status" label="状态" >
          <template #default="scope">
            <el-tag type="success" v-if="scope.row.status === '1'">启用</el-tag>
            <el-tag type="info" v-else>禁用</el-tag>
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
    
  </div>
</template>

<script setup lang="ts" name="authInstances">
import { ref, watch, reactive } from 'vue';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';
import { InstanceState } from '/@/types/views';

// 定义接口
const instanceAuthApi = useUserInstanceAuthApi();

const state = reactive<InstanceState>({
  tableData: {
    data: [],
    param: {
      pageNum: 1,
      pageSize: 10
    },
    total: 0,
    loading: false
  }
});

// 当前用户ID
const currentUserId = ref<number | null>(null);

// 接收从父组件传递的用户ID
const loadUserInstance = (userId: number) => {
  currentUserId.value = userId;
  state.tableData.param.pageNum = 1;
  getTableData();
};

const getTableData = () => {
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
  instanceAuthApi.pageUserInstances(data).then(res => {
    if (res && res.code === 200) {
      state.tableData.data = res.data.instances;
      state.tableData.total = res.data.total;
    }
  });
};

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

defineExpose({
  loadUserInstance
});

// 监听用户ID变化，刷新主机列表
watch(currentUserId, () => {
  state.tableData.param.pageNum = 1;
  getTableData();
});

</script>


<style scoped lang="scss">
.instance-list {
  margin-top: 20px;
  overflow-y: auto;
}
</style>