<template>
    <div class="instance-auth">
        <div v-if="!currentUserId" class="empty-tip">
            <el-empty description="请选择用户进行主机授权" />
        </div>
        <div v-else>
            <el-table :data="state.tableData.data" style="width: 100%" @selection-change="onSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="id" label="ID"/>
                <el-table-column prop="name" label="主机名"/>
                <el-table-column prop="ip" label="IP地址"/>
                <el-table-column prop="spec" label="规格"/>
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
                :total="state.tableData.total">
            </el-pagination>
        </div>
    </div>
</template>

<script lang="ts" setup name="instanceAuth">
import { reactive, onMounted, ref} from 'vue';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';
import { Connection } from '@element-plus/icons-vue';

// 定义接口
const instanceAuthApi = useUserInstanceAuthApi();

const state = reactive({
    tableData: {
        selection: [] as any[],
        data: [],
        total: 0,
        param: {
            pageNum: 1,
            pageSize: 10,
        }
    }
});

const onSelectionChange = (selection: any) => {
    state.tableData.selection = selection;
};

const currentUserId = ref<number | null>(null);
// 接收从父组件传递的用户ID
const loadInstance = (userId: number) => {
    currentUserId.value = userId;
    getTableData();
};

// 初始化表格数据
const getTableData = async () => {
    if (!currentUserId) {
        return;
    }
    let data = {
        ...state.tableData.param,
        userId: currentUserId.value
    };
    const res = await instanceAuthApi.availableInstances(data);
    if (res && res.code == 200) {
        let data = res.data;
        state.tableData.data = data.instances;
        state.tableData.total = data.total;
    }
};


// 页码改变
const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};
// 每页条数改变
const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

// 主机授权
const handleAuth = async (row: any) => {
    let data = {
        userId: currentUserId.value,
        instanceIds: [row.id],
        authType: 1 // 主机授权
    };
    const res = await instanceAuthApi.addUserInstanceAuth(data);
    if (res && res.code === 200) {
        getTableData();
    }
};

onMounted(() => {
    getTableData();
});

defineExpose({
    loadInstance,
});
</script>
<style lang="scss" scoped>

</style>