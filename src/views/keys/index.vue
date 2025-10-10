<template>
    <div class="keys-index">
        <el-card>
            <el-row :gutter="20">
                <el-col :span="24">
                    <el-row :gutter="20">
                        <el-col :span="4" v-for="(item, index) in state.tableData.data" :key="index">
                            <el-card class="key-card">
                                <div class="key-id">ID: {{ item.id }}</div>
                                <div class="key-name">用户名: {{ item.name }}</div>
                                <div class="key-value">凭证: {{ item.credentials }}</div>
                                <div class="key-value">协议: {{ item.protocol }}</div>
                                <div class="key-value">端口号: {{ item.port }}</div>
                                <div class="key-status">
                                    状态: 
                                    <el-switch 
                                        v-model="item.status" 
                                        inline-prompt active-text="启" active-value="1" 
                                        inactive-text="禁" inactive-value="0" 
                                        @click="onStatusChange(item)">
                                    </el-switch>
                                </div>
                                <div class="key-created">创建时间: {{ dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</div>
                            </el-card>
                        </el-col>
                    </el-row>
                </el-col>
            </el-row>
            <el-row :gutter="20" class="mt20">
                <el-col :span="24">
                    <el-pagination
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                        :current-page="state.tableData.param.pageNum"
                        :page-sizes="[6, 12, 18, 24]"
                        :page-size="state.tableData.param.pageSize"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="state.tableData.total"
                    />
                </el-col>
            </el-row>
        </el-card>
    </div>
</template>

<script setup lang="ts" name="keys">
import { reactive, onMounted } from 'vue';
import { useKeyApi } from '/@/api/keys';
import { dayjs, ElMessage } from 'element-plus';
import { KeyState, RowKeyType } from '/@/types/views';

// 定义变量内容
const keyApi = useKeyApi();
const state = reactive<KeyState>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: {
            pageNum: 1,
            pageSize: 10,
        },
    },
});

// 获取密钥分页列表
const getTableData = async () => {
    const res = await keyApi.getKeyPage(state.tableData.param);
    if (res && res.code === 200) {
        let data = res.data;
        state.tableData.data = data.list;
        state.tableData.total = data.total;
    }
};

// 修改密钥状态
const onStatusChange = async (row: RowKeyType) => {
    const res = await keyApi.updateKeyStatus({
        id: row.id,
        status: row.status === "1" ? "0" : "1",
    });
    if (res.code === 0) {
        ElMessage.success(res.msg);
        getTableData();
    }
};

// 分页大小变化
const handleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

// 当前页变化
const handleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

onMounted(() => {
    getTableData();
});
</script>

<style lang="scss" scoped>
.keys-index {
    padding: 20px;
}
.mt20 {
    margin-top: 20px;
}
.key-card {
    margin-bottom: 20px;
    .key-id, .key-name, .key-value, .key-status, .key-created {
        margin-bottom: 10px;
    }
}
</style>