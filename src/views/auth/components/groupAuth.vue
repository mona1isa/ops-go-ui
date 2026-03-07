<template>
    <div class="group-auth-container">
        <div v-if="!currentUserId" class="empty-tip">
            <el-empty description="请选择用户进行分组授权" />
        </div>
        <div v-else>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="name" label="名称"></el-table-column>
                <el-table-column label="操作">
                    <template #default="scope">
                        <el-button plain type="primary" size="small" @click="handleAuth(scope.row)" :icon="Connection">授权</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-pagination
                @size-change="onHandleSizeChange"
                @current-change="onHandleCurrentChange"
                class="mt15"
                :current-page="state.tableData.param.pageNum"
                :page-sizes="[10, 20, 30, 40]"
                :page-size="state.tableData.param.pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="state.tableData.total" >
            </el-pagination>
        </div>
    </div>
</template>

<script setup lang="ts" name="authInstances">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';
import { Connection } from '@element-plus/icons-vue';

// 定义接口
const instanceAuthApi = useUserInstanceAuthApi();

const currentUserId = ref<number | null>(null);

const state = reactive({
  tableData: {
    loading: false,
    data: [],
    total: 0,
    param: {
      pageNum: 1,
      pageSize: 10,
    },
  },
});

const loadGroup = (userId: number) => {
  currentUserId.value = userId;
  state.tableData.param.pageNum = 1;
  getTableData();
};

const handleAuth = async (row: any) => {
    if (!currentUserId) {
        return;
    }
    state.tableData.loading = true;
    let data = {
        userId: currentUserId.value,
        groupIds: [row.id],
        authType: 2 // 分组授权
    };
    const res = await instanceAuthApi.addUserInstanceAuth(data);
    if (res && res.code == 200) {
        ElMessage.success('授权成功');
        getTableData();
    } else {
        ElMessage.error('授权失败');
    }
    state.tableData.loading = false;
};

const getTableData = async () => {
    if (!currentUserId) {
        return;
    }
    try {
        let data = {
            ...state.tableData.param,
            userId: currentUserId.value
        };
        const res  = await instanceAuthApi.availableGroups(data);
        if (res && res.code == 200) {
            let data = res.data;
            state.tableData.data = data.groups;
            state.tableData.total = data.total;
        }
    } catch (error) {
        ElMessage.error('获取数据失败');
    }
};

const onHandleSizeChange = (pageSize: number) => {
  state.tableData.param.pageSize = pageSize;
  getTableData();
};

const onHandleCurrentChange = (pageNum: number) => {
  state.tableData.param.pageNum = pageNum;
  getTableData();
};

onMounted(() => {
  getTableData();
});

defineExpose({
    loadGroup
});
</script>

<style scoped lang="scss"></style>
