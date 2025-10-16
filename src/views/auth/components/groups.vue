<template>
  <div class="host-group-info">
    <el-table :data="hostGroupList" border style="width: 100%">
      <el-table-column prop="name" label="分组名称" />
      <el-table-column prop="count" label="主机数量" />
    </el-table>
  </div>
</template>

<script setup lang="ts" name="authGroups">
import { ref, onMounted } from 'vue';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';

// 定义接口
const userInstanceAuthApi = useUserInstanceAuthApi();

const hostGroupList = ref([]);

const fetchHostGroupList = async () => {
  let data = {
    pageNum: 1,
    pageSize: 1000
  };
  const res = await userInstanceAuthApi.getUserInstanceAuthList(data);
  hostGroupList.value = res.data;
};

onMounted(() => {

});
</script>

<style scoped>
.host-group-info {
  flex: 1;
}
</style>