<template>
    <div class="system-log-container layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="system-log-search mb15">
                <el-input v-model="state.tableData.param.createUser" size="default" placeholder="请输入用户名称" style="max-width: 180px" clearable> </el-input>
                <el-input v-model="state.tableData.param.requestUri" size="default" placeholder="请输入请求地址" style="max-width: 180px" clearable> </el-input>
                <el-input v-model="state.tableData.param.method" size="default" placeholder="请输入请求方法" style="max-width: 180px" clearable> </el-input>
                <el-input v-model="state.tableData.param.statusCode" size="default" placeholder="请输入状态码" style="max-width: 180px" clearable> </el-input>
                <el-button size="default" type="primary" class="ml10" @click="getTableData()" v-auths="['sys:log:page']">
                    <el-icon>
                        <ele-Search />
                    </el-icon>
                    查询
                </el-button>
                <el-button size="default" type="info" class="ml10" @click="resetInput()">
                    <el-icon>
                        <ele-Refresh />
                    </el-icon>
                    重置
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="序号" width="120" align="center" />
                <el-table-column prop="createUser" label="操作人名称" min-width="120" align="center" />
                <el-table-column prop="requestUri" label="请求地址" min-width="220" align="left" />
                <el-table-column prop="statusCode" label="状态码" min-width="100" align="center" />
                <el-table-column prop="costTimeMs" label="耗时(毫秒)" min-width="100" align="center" />
                <el-table-column prop="method" label="请求方法" min-width="150" align="center" />
                <el-table-column prop="params" label="请求参数" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column prop="resp" label="响应数据" min-width="120" align="center" show-overflow-tooltip />
                <el-table-column prop="ipAddr" label="IP地址" min-width="120" align="center" />
                <el-table-column prop="createTime" label="请求时间" min-width="180" align="center">
                    <template #default="scope">{{ dayjs(scope.row.createTime).format('YYYY-MM-DD HH:mm:ss') }}</template>
                </el-table-column>
            </el-table>
            <el-pagination
                @size-change="onHandleSizeChange"
				@current-change="onHandleCurrentChange"
				class="mt15"
				:pager-count="5"
				:page-sizes="[10, 20, 30]"
				v-model:current-page="state.tableData.param.pageNum"
				background
				v-model:page-size="state.tableData.param.pageSize"
				layout="total, sizes, prev, pager, next, jumper"
				:total="state.tableData.total"
            >
            </el-pagination>
        </el-card>
    </div>
</template>

<script setup lang="ts" name="systemLog">
import { reactive, onMounted, ref } from 'vue';
import { SysLogState } from '/@/types/views';
import { dayjs } from 'element-plus';
import { useLogApi } from '/@/api/log/index';

const logApi = useLogApi();

// 定义变量内容
const state = reactive<SysLogState>({
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

// 初始化表格数据
const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const res = await logApi.getPageLog(state.tableData.param).then((res) => {
            if (!res) return;
            if (res && res.code == 200) {
                state.tableData.data = res.data;
                state.tableData.total = res.total;
            }
        });

        setTimeout(() => {
            state.tableData.loading = false;
        }, 500);
    } catch (error) {
        console.error('获取日志列表失败:', error);
    } finally {
        state.tableData.loading = false;
    }
};

// 重置搜索条件
const resetInput = () => {
    state.tableData.param.createUser = '';
    state.tableData.param.requestUri = '';
    state.tableData.param.method = '';
    state.tableData.param.statusCode = '';
    getTableData();
};

// 分页改变
const onHandleSizeChange = (val: number) => {
	state.tableData.param.pageSize = val;
	getTableData();
};

// 当前页改变
const onHandleCurrentChange = (val: number) => {
	state.tableData.param.pageNum = val;
	getTableData();
};

// 页面加载时
onMounted(() => {
    getTableData();
});

</script>

<style lang="scss" scoped>
.system-log-search {
    display: flex; 
    gap: 10px;
}
</style>