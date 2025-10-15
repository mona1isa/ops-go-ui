<template>
  <div class="user-list">
    <h5>用户列表</h5>
    <div class="table-container">
      <el-table :data="userList" style="width: 100%" @row-click="handleRowClick">
        <el-table-column prop="userName" label="用户名" />
        <el-table-column prop="nickname" label="用户昵称" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserInfoApi } from '/@/api/user';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';

// 定义接口
const userApi = useUserInfoApi();
const userInstanceAuthApi = useUserInstanceAuthApi();

const userList = ref([]);
const hostList = ref([]);

const fetchUserList = async () => {
    const res = await userApi.getUserPage({ pageNum: 1, pageSize: 1000 });
    if (res && res.code == 200) {
        userList.value = res.data.data;
    } 
};

const handleRowClick = async (row) => {
  let data = {
    userId: row.id,
    pageNum: 1,
    pageSize: 1000
  };
    const res = await userInstanceAuthApi.pageUserInstances(data);
    if (res && res.code == 200) {
        hostList.value = res.data.instances;
    }
};

onMounted(() => {
    fetchUserList();
});
</script>

<style scoped>
.user-list {
  height: 100%;
}
.table-container {
  max-height: 400px;
  overflow-y: auto;
}
</style>