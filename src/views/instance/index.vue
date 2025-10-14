<template>
    <div class="layout-padding">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="app-search mb15">
                <el-input v-model="state.tableData.param.name" size="default" placeholder="请输入主机名称" style="max-width: 180px" clearable> </el-input>
                
                <el-button size="default" type="primary" class="ml10" @click="getTableData()">
                    <el-icon>
                        <ele-Search />
                    </el-icon>
                    查询
                </el-button>
                
                <el-button size="default" type="success" class="ml10" @click="onOpenAddInstance('add')">
                    <el-icon>
                        <ele-FolderAdd />
                    </el-icon>
                    新增主机
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="主机名称" show-overflow-tooltip>
                    <template #default="scope">
                        <el-link type="primary" @click="onOpenDetail(scope.row)">{{ scope.row.name }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column prop="spec" label="规格" show-overflow-tooltip></el-table-column>
                <el-table-column prop="ip" label="主机IP" show-overflow-tooltip></el-table-column>
                <el-table-column prop="bindingKeys" label="登录凭证" show-overflow-tooltip>
                    <template #default="scope">
                        <el-link v-if="scope.row.bindingKeys.length > 0" type="primary" @click="onOpenUnbindKey(scope.row)">{{ getbindingKeys(scope.row.bindingKeys) }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="主机状态" show-overflow-tooltip>
                    <template #default="scope">
                        <el-switch 
                            v-model="scope.row.status" 
                            inline-prompt active-text="启" active-value="1" 
                            inactive-text="禁" inactive-value="0" 
                            @click="onStatusChange(scope.row)">
                        </el-switch>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="主机描述" show-overflow-tooltip></el-table-column>
                <el-table-column prop="createdAt" label="创建时间" show-overflow-tooltip>
                    <template #default="scope">{{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="scope">
                        <el-dropdown>
                            <el-button size="small" text type="primary">
                                操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="onOpenEditInstance('edit', scope.row)">修改</el-dropdown-item>
                                    <el-dropdown-item @click="onRowDel(scope.row)">删除</el-dropdown-item>
                                    <el-dropdown-item @click="onOpenBindKey(scope.row)">绑定凭证</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
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
        <InstanceDialog ref="instanceDialogRef" @refresh="getTableData()" />
        <DetailDrawer ref="detailDrawerRef" />
        <BindKeyDialog ref="bindKeyDialogRef" @refresh="getTableData()"/>
        <UnbindingKeyDialog ref="unbindingKeyDialogRef" @refresh="getTableData()"/>
    </div>
</template>

<script setup lang="ts" name="instanceIndex">
import { defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { useInstanceApi } from '/@/api/instance';
import { InstanceStatusItem, InstanceState, RowInstanceType } from '/@/types/views';
import { ElMessage, ElMessageBox } from 'element-plus';
import { dayjs } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { useKeyApi } from '/@/api/keys';

// 引入组件
const InstanceDialog = defineAsyncComponent(() => import('/@/views/instance/dialog.vue'));

// 引入抽屉组件
const DetailDrawer = defineAsyncComponent(() => import('/@/views/instance/detail.vue'));

// 引入绑定凭证对话框
const BindKeyDialog = defineAsyncComponent(() => import('/@/views/instance/bingkey.vue'));

// 引入解绑凭证对话框
const UnbindingKeyDialog = defineAsyncComponent(() => import('/@/views/instance/unbindingkey.vue'));

// 定义接口
const instanceApi = useInstanceApi();

// 凭证接口
const keyApi = useKeyApi();

// 定义变量
const instanceDialogRef = ref();
const detailDrawerRef = ref();
const bindKeyDialogRef = ref();
const unbindingKeyDialogRef = ref();

const state = reactive<InstanceState>({
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
    const res = await instanceApi.getInstancePage(state.tableData.param);
    if (res && res.code == 200) {
        let data = res.data;
        state.tableData.data = data.data;
        state.tableData.total = data.total;
    }
    setTimeout(() => {
        state.tableData.loading = false;
    }, 500);
};

onMounted(() => {
    getTableData();
});
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

// 修改主机状态
const onStatusChange = (row: InstanceStatusItem) => {
    instanceApi.updateInstanceStatus({ id: row.id, status: row.status }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
            getTableData();
        }
    });
};

// 打开修改窗口
const onOpenEditInstance = (type: string, row: RowInstanceType) => {
    instanceDialogRef.value.openDialog(type, row);
};

// 打开新增窗口
const onOpenAddInstance = (type: string) => {
    instanceDialogRef.value.openDialog(type);
};

// 主机详情
const onOpenDetail = (row: RowInstanceType) => {
    detailDrawerRef.value.openDrawer(row);
};

// 获取绑定凭证
const getbindingKeys = (bindingKeys: any) => {
    if (!bindingKeys || bindingKeys.length === 0) return '未绑定任何凭证';
    return bindingKeys.map((item: any) => {
        return `${item.name}`;
    }).join('; ');
};

// 打开绑定凭证对话框
const onOpenBindKey = (row: RowInstanceType) => {
    bindKeyDialogRef.value.openDialog(row.id);
};

// 打开解绑凭证对话框
const onOpenUnbindKey = (row: RowInstanceType) => {
    if (row.bindingKeys && row.bindingKeys.length > 0) {
        unbindingKeyDialogRef.value.openDialog(row.id, row.bindingKeys);
    }
};

// 删除操作
const onRowDel = (row: RowInstanceType) => {
    ElMessageBox.confirm(`此操作将永久删除主机名称：“${row.name}”，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            instanceApi.deleteInstance(row.id).then((res) => {
                if (res && res.code == 200) {
                    ElMessage.success('删除成功');
                    getTableData();
                }
            });
        })
        .catch(() => {});
};

</script>

<style scoped lang="scss">

</style>