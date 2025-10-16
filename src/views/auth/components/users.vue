<template>
  <div class="user-list">
    <h3>用户列表</h3>
    <div class="table-container">
      <el-table :data="userList" @row-click="handleRowClick" highlight-current-row :current-row-key="currentRowKey">
        <el-table-column prop="userName" label="用户名" />
        <el-table-column prop="nickname" label="用户昵称" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts" name="authUsers">
import { ref, onMounted} from 'vue';
import { useUserInfoApi } from '/@/api/user';

// 定义接口
const userApi = useUserInfoApi();

const userList = ref([]);
const currentRowKey = ref<number | null>(null);

const emit = defineEmits(['user-change']);

const fetchUserList = async () => {
    const res = await userApi.getUserPage({ pageNum: 1, pageSize: 1000 });
    if (res && res.code == 200) {
        userList.value = res.data.data;
    } 
};

const handleRowClick = async (row: UserInfos) => {
    currentRowKey.value = row.id;
    // 发射用户切换事件，传递用户ID
    emit('user-change', row.id);
};

onMounted(() => {
    fetchUserList();
});
</script>

<style scoped>
.user-list {
  height: 90%;
}
.table-container {
  max-height: 520px;
  overflow-y: auto;
}
</style>