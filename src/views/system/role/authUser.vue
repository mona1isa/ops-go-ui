<template>
	<div class="system-role-container layout-padding">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog">
            <div class="system-role-padding layout-padding-auto layout-padding-view">
                <el-table 
                    ref="userTableRef"
                    :data="state.tableData.data" 
                    v-loading="state.tableData.loading" 
                    style="width: 100%"
                    @selection-change="handleSelectionChange"
                >
                    <el-table-column type="selection" width="55" align="center" />
                    <el-table-column prop="id" label="序号" width="60" align="center" />
                    <el-table-column prop="userName" label="用户名称" show-overflow-tooltip />
                    <el-table-column prop="remark" label="备注" show-overflow-tooltip />
                </el-table>
                <el-pagination
                    @size-change="onHandleSizeChange"
                    @current-change="onHandleCurrentChange"
                    class="mt15 auth-user-pagination"
                    :pager-count="5"
                    :page-sizes="[10, 20, 30]"
                    v-model:current-page="state.tableData.param.pageNum"
                    background
                    v-model:page-size="state.tableData.param.pageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="state.tableData.total"
                >
                </el-pagination>
            </div>
            <template #footer>
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
				</span>
			</template>
        </el-dialog>
	</div>
</template>

<script setup lang="ts" name="systemRoleDialog">
import { reactive, ref, nextTick } from 'vue';
import { useRoleApi } from '/@/api/role';
import { useUserInfoApi } from '/@/api/user';
import { ElMessage } from 'element-plus';
import { number } from 'echarts';


// 角色接口
const roleApi = useRoleApi();

// 用户接口
const userApi = useUserInfoApi();

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// Define userTableRef
const userTableRef = ref();

const initialState = {
  id: 0,
  name: '',
  status: '1',
  remark: '',
  selectedUserIds: [] as number[],
};

const state = reactive({
	tableData: {
	    data: [],
	    total: 0,
	    loading: false,
	    param: {
	        pageNum: 1,
	        pageSize: 10,
	    },
	} as any,
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
	form: {
	    id: 0, // 角色ID
	    selectedUserIds: [] as number[],
	},
});

// 获取用户列表并回显选中已经被分配角色的用户ID
const getTableData = () => {
	state.tableData.loading = true;
    let selectedUserIds = [] as number[];
    roleApi.getUserIds(state.form.id).then((res) => {
        const data = res.data;
        selectedUserIds = data;
        userApi.getUserPage(state.tableData.param).then((res) => {
            const data = res.data;
            state.tableData.data = data.data;
            state.tableData.total = data.total;
            state.form.selectedUserIds = selectedUserIds;
            setTimeout(() => {
                state.tableData.loading = false;
                nextTick(() => {
                    if (userTableRef.value) {
                        state.tableData.data.forEach((row: any) => {
                            if (selectedUserIds.includes(row.id)) {
                                userTableRef.value.toggleRowSelection(row, true);
                            }
                        });
                    }
                });
            }, 500);
        });
    });
}

// 打开弹窗
const openDialog = (row: any) => {
	state.dialog.title = '分配用户';
    state.dialog.submitTxt = '分 配';
	state.dialog.isShowDialog = true;
    state.form.id = row.id;
    getTableData();
};
// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
};
// 取消
const onCancel = () => {
	closeDialog();
};

const handleSelectionChange = (val: any[]) => {
    state.form.selectedUserIds = val.map(item => item.id);
};

const onSubmit = async () => {
    // if (state.form.selectedUserIds.length === 0) {
    //     ElMessage.warning('请至少选择一个用户');
    //     return;
    // }
    
    try {
        await roleApi.assignUsers({
            roleId: state.form.id,
            userIds: state.form.selectedUserIds
        });
        ElMessage.success('分配成功');
        closeDialog();
        emit('refresh');
    } catch (error) {
        ElMessage.error('分配失败');
    }
};

// 分页改变
const onHandleSizeChange = (val: number) => {
	state.tableData.param.pageSize = val;
	getTableData();
};
// 分页改变
const onHandleCurrentChange = (val: number) => {
	state.tableData.param.pageNum = val;
	getTableData();
};

// 暴露变量
defineExpose({
	openDialog,
	getTableData,
});
</script>

<style scoped lang="scss">
.system-role-dialog-container {
	.menu-data-tree {
		width: 100%;
		border: 1px solid var(--el-border-color);
		border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
		padding: 5px;
	}
}

.auth-user-pagination {
    margin-left: 5px;
    margin-bottom: 5px;
}
</style>
