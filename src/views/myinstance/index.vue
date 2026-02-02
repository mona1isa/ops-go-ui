<template>
    <div class="myinstance">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="app-search mb15">
                <el-input v-model="state.tableData.param.name" size="default" placeholder="请输入主机名称" style="max-width: 180px" clearable> </el-input>
                
                <el-button size="default" plain type="primary" class="ml10" @click="getTableData()">
                    <el-icon>
                        <ele-Search />
                    </el-icon>
                    查询
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="主机名称" show-overflow-tooltip />
                <el-table-column prop="cpu" label="CPU" >
                    <template #default="scope">
                        {{ scope.row.cpu }}核
                    </template>
                </el-table-column>
                <el-table-column prop="mem" label="内存" >
                    <template #default="scope">
                        {{ getMemory(scope.row.memMb) }}
                    </template>
                </el-table-column>
                <el-table-column prop="disk" label="磁盘" >
                    <template #default="scope">
                        {{ getDisk(scope.row.diskGb)}}
                    </template>
                </el-table-column>
                <el-table-column prop="ip" label="主机IP" show-overflow-tooltip></el-table-column>
                <el-table-column prop="bindingKeys" label="登录凭证" show-overflow-tooltip>
                    <template #default="scope">
                        <span v-if="scope.row.bindingKeys && scope.row.bindingKeys.length > 0">{{ getbindingKeys(scope.row.bindingKeys) }}</span>
                    </template>
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

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useMyInstanceApi } from '/@/api/myinstance'
import { InstanceState } from '/@/types/views';


// 定义接口
const myInstanceApi = useMyInstanceApi();

const state = reactive<InstanceState>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: {
            pageNum: 1,
            pageSize: 10,
            name: ''
        }
    }
});

// 获取表格数据
const getTableData = async () => {
    state.tableData.loading = true;
    const res = await myInstanceApi.getMyInstanceList(state.tableData.param);
    if (res && res.code == 200) {
        let data = res.data;
        state.tableData.data = data.data;
        state.tableData.total = data.total;
    }
    state.tableData.loading = false;
};

// 处理分页变化
const onHandleSizeChange = (pageSize: number) => {
    state.tableData.param.pageSize = pageSize;
    getTableData();
};

const onHandleCurrentChange = (pageNum: number) => {
    state.tableData.param.pageNum = pageNum;
    getTableData();
};

// 获取内存信息
const getMemory = (memory: number) => {
    console.log('memory', memory);
    if (memory === null || memory === undefined) {
        return '';
    }
    if (memory < 1024) {
        return memory + 'MB';
    } else if (memory >= 1024 && memory < 1024 * 1024) {
        return (memory / 1024).toFixed(0) + 'GB';
    } else if (memory >= 1024 * 1024) {
        return (memory / (1024 * 1024)).toFixed(0) + 'TB';
    }
};

// 获取磁盘信息
const getDisk = (disk: any) => {
    if (disk === null || disk === undefined) {
        return '';
    }
    if (disk < 1024) {
        return disk + 'GB';
    } else if (disk >= 1024 && disk < 1024 * 1024) {
        return (disk / 1024).toFixed(0) + 'TB';
    } else if (disk >= 1024 * 1024) {
        return (disk / (1024 * 1024)).toFixed(0) + 'PB';
    }
};

// 获取登录凭证
const getbindingKeys = (bindingKeys: any) => {
    return bindingKeys.map((item: any) => {
        return `${item.name}`;
    }).join('; ');
};



// 打开页面时
onMounted(() => {
    getTableData();
});
</script>

<style lang="scss" scoped>

</style>

<style lang="scss" scoped>

</style>