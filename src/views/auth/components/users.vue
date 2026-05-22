<template>
  <div class="user-list">
    <div class="user-list-header">
      <h3 class="user-list-title">用户列表</h3>
      <span class="user-list-count">共 {{ state.tableData.total }} 人</span>
    </div>
    <div class="user-list-search">
      <el-input
        v-model="state.tableData.param.userName"
        placeholder="搜索用户名"
        size="small"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="table-container">
      <el-table
        :data="state.tableData.data"
        @row-click="handleRowClick"
        highlight-current-row
        :current-row-key="currentRowKey"
        row-key="id"
        size="small"
        class="user-table"
      >
        <el-table-column prop="userName" label="用户名" min-width="90" show-overflow-tooltip />
        <el-table-column prop="nickname" label="昵称" min-width="80" show-overflow-tooltip />
      </el-table>
    </div>
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="state.tableData.param.pageNum"
        v-model:page-size="state.tableData.param.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        background
        small
        layout="prev, pager, next"
        :total="state.tableData.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="authUsers">
import { ref, reactive, onMounted } from 'vue';
import { useUserInfoApi } from '/@/api/user';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const userApi = useUserInfoApi();
const currentRowKey = ref<number | null>(null);
const emit = defineEmits(['user-change']);

interface UserListState {
  tableData: {
    data: any[];
    total: number;
    loading: boolean;
    param: {
      pageNum: number;
      pageSize: number;
      userName: string;
    };
  };
}

const state = reactive<UserListState>({
  tableData: {
    data: [],
    total: 0,
    loading: false,
    param: {
      pageNum: 1,
      pageSize: 10,
      userName: '',
    },
  },
});

const fetchUserList = async () => {
  state.tableData.loading = true;
  try {
    const res = await userApi.getUserPage({
      pageNum: state.tableData.param.pageNum,
      pageSize: state.tableData.param.pageSize,
      userName: state.tableData.param.userName,
    });
    if (res && res.code == 200) {
      state.tableData.data = res.data.data || [];
      state.tableData.total = res.data.total || 0;

      // 若当前页无选中用户且数据非空，自动选中第一条（仅在首次加载或无选中时）
      if (currentRowKey.value === null && state.tableData.data.length > 0) {
        const firstUser = state.tableData.data[0];
        currentRowKey.value = firstUser.id;
        emit('user-change', firstUser.id);
      }
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  } finally {
    state.tableData.loading = false;
  }
};

const handleSearch = () => {
  state.tableData.param.pageNum = 1;
  fetchUserList();
};

const handleSizeChange = (val: number) => {
  state.tableData.param.pageSize = val;
  state.tableData.param.pageNum = 1;
  fetchUserList();
};

const handleCurrentChange = (val: number) => {
  state.tableData.param.pageNum = val;
  fetchUserList();
};

const handleRowClick = async (row: any) => {
  currentRowKey.value = row.id;
  emit('user-change', row.id);
};

const refreshUserList = () => {
  fetchUserList();
};

onMounted(() => {
  fetchUserList();
});

defineExpose({
  refreshUserList,
});
</script>

<style scoped lang="scss">
.user-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.user-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.user-list-title {
  font-size: 15px;
  font-weight: 600;
  color: #171717;
  margin: 0;
}

.user-list-count {
  font-size: 12px;
  color: #737373;
}

.user-list-search {
  margin-bottom: 10px;
}

.table-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.user-table {
  :deep(.el-table__row) {
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: #f5f5f5 !important;
    }

    &.current-row {
      background-color: #eef5ff !important;

      td {
        color: #2563eb;
        font-weight: 500;
      }
    }
  }

  :deep(.el-table__cell) {
    padding: 8px 0;
    font-size: 13px;
  }
}

.pagination-wrap {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}
</style>
