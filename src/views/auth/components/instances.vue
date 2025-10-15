<template>
  <div class="instance-list">
    <h5>已授权主机列表</h5>
    <div class="table-container">
      <el-table :data="currentHostList" style="width: 100%">
        <el-table-column prop="name" label="主机名" />
        <el-table-column prop="ip" label="IP地址" />
        <el-table-column prop="status" label="状态" />
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next"
        :total="hostList.length"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  hostList: {
    type: Array,
    default: () => [],
  },
});

const currentPage = ref(1);
const pageSize = ref(10);

const currentHostList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return props.hostList.slice(start, end);
});

const handleSizeChange = (val) => {
  pageSize.value = val;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};
</script>

<style scoped>
.instance-list {
  margin-top: 20px;
}
.table-container {
  max-height: 400px;
  overflow-y: auto;
}
</style>