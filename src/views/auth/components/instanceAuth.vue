<template>
    <div class="">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" :close-on-click-modal="false" :close-on-press-escape="false">
            <el-table
            :data="state.tableData.data"
            style="width: 100%"
            v-loading="state.tableData.loading"
            element-loading-text="拼命加载中..."
            element-loading-spinner="el-icon-loading"
            element-loading-background="rgba(0, 0, 0, 0.3)">
        
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="instanceAuth">
import { reactive } from 'vue';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';

// 定义接口
const instanceAuthApi = useUserInstanceAuthApi();

const state = reactive({
    dialog: {
        title: '主机授权',
        isShowDialog: false
    },
    tableData: {
        data: [],
        loading: false
    }
});

const getTableData = async () => {
    state.tableData.loading = true;

}

</script>

<style scoped lang="scss">

</style>