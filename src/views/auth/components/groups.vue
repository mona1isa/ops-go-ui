<template>
  <div class="host-group-info">
    <h3>主机分组信息</h3>
    <el-table :data="hostGroupList" border style="width: 100%">
      <el-table-column prop="name" label="分组名称" />
      <el-table-column prop="count" label="主机数量" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';

const hostGroupList = ref([]);

const fetchHostGroupList = async () => {
  let data = {
    pageNum: 1,
    pageSize: 1000
  };
  const res = await useUserInstanceAuthApi.getUserInstanceAuthList(data);
  hostGroupList.value = res.data;
};

onMounted(() => {
  fetchHostGroupList();
});
</script>

<style scoped>
.host-group-info {
  flex: 1;
}
</style>