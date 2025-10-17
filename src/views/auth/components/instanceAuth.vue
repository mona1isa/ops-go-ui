<template>
    <div class="instance-auth">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.isShow" width="state.dialog.width">
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%" @selection-change="onSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="id" label="ID"/>
                <el-table-column prop="name" label="主机名"/>
                <el-table-column prop="spec" label="规格"/>
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

            <template #footer>
                <el-button type="info" size="mini" @click="onClose">关闭</el-button>
                <el-button type="primary" size="mini" @click="submitData">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts" setup name="instanceAuth">
import { reactive, onMounted} from 'vue';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';

// 定义接口
const instanceAuthApi = useUserInstanceAuthApi();

const state = reactive({
    dialog: {
        title: '主机授权',
        isShow: false
    },
    tableData: {
        selection: [] as any[],
        data: [],
        loading: false,
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

// 打开对话框
const openDialog = () => {
    state.dialog.isShow = true;
    getTableData();
};

// 初始化表格数据
const getTableData = async () => {
    state.tableData.loading = true;
    const res = await instanceAuthApi.availableInstances(state.tableData.param);
    if (res && res.code == 200) {
        let data = res.data;
        state.tableData.data = data.instances;
        state.tableData.total = data.total;

        console.log("获取实例数据成功", data);
    }
    state.tableData.loading = false;
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

const onClose = () => {
    state.dialog.isShow = false;
};

const submitData = () => {

};

onMounted(() => {
    getTableData();
});

defineExpose({
    openDialog,
});
</script>
<style lang="scss" scoped>

</style>