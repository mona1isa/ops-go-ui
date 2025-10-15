<template>
  <div class="instance-list">
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
</template>

<script setup lang="ts" name="authInstances">
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

const handleSizeChange = (val: number) => {
  pageSize.value = val;
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};
</script>

<style scoped>
.instance-list {
  margin-top: 20px;
  overflow-y: auto;
}
</style>