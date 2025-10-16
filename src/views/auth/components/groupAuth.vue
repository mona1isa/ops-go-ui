<template>
  <div class="group-auth">
    <el-table
      :data="state.tableData.data"
      style="width: 100%"
      v-loading="state.tableData.loading"
      element-loading-text="拼命加载中..."
      element-loading-spinner="el-icon-loading"
      element-loading-background="rgba(0, 0, 0, 0.3)"
    >
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
</template>

<script setup lang="ts" name="groupAuth">
import { reactive, ref } from 'vue';

const state = reactive({
  tableData: {
    data: [],
    loading: false,
    total: 0,
    param: {
      pageNum: 1,
      pageSize: 10
    }
  }
});

const handleSizeChange = (pageSize: number) => {
  state.tableData.param.pageSize = pageSize;
  fetchTableData();
};

const handleCurrentChange = (pageNum: number) => {
  state.tableData.param.pageNum = pageNum;
  fetchTableData();
};

const fetchTableData = async () => {
  state.tableData.loading = true;
  try {
    // TODO: 实现获取分组数据的逻辑
    // 例如：const response = await fetchGroupData(state.tableData.param);
    // state.tableData.data = response.data;
    // state.tableData.total = response.total;
  } catch (error) {
    console.error('获取分组数据失败', error);
  } finally {
    state.tableData.loading = false;
  }
};

fetchTableData();

</script>
<style scoped lang="scss">  

</style>