<template>
	<div class="system-user-container layout-padding">
		<el-card shadow="hover" class="layout-padding-auto">
			<div class="system-user-search mb15">
				<el-input v-model="state.tableData.param.userName" size="default" placeholder="请输入用户名称" style="max-width: 180px" clearable> </el-input>
				<el-button size="default" type="primary" class="ml10" @click="getTableData()" v-auths="['system:user:list']">
					<el-icon>
						<ele-Search />
					</el-icon>
					查询
				</el-button>
				<el-button size="default" type="success" class="ml10" @click="onOpenAddUser('add')" v-auths="['system:user:add']">
					<el-icon>
						<ele-FolderAdd />
					</el-icon>
					新增用户
				</el-button>
			</div>
			<el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
				<el-table-column prop="id" label="序号" width="60" />
				<el-table-column prop="userName" label="用户名称" show-overflow-tooltip></el-table-column>
				<el-table-column prop="nickname" label="用户昵称" show-overflow-tooltip></el-table-column>
				<el-table-column prop="roleNames" label="关联角色" show-overflow-tooltip></el-table-column>
				<el-table-column prop="deptName" label="部门" show-overflow-tooltip></el-table-column>
				<el-table-column prop="phone" label="手机号" show-overflow-tooltip></el-table-column>
				<el-table-column prop="email" label="邮箱" show-overflow-tooltip></el-table-column>
				<el-table-column prop="status" label="用户状态" show-overflow-tooltip>
					<template #default="scope">
						<el-switch 
							v-model="scope.row.status" 
							inline-prompt active-text="启" active-value="1" 
							inactive-text="禁" inactive-value="0" 
							@click="onStatusChange(scope.row)">
						</el-switch>
					</template>
				</el-table-column>
				<el-table-column prop="remark" label="用户描述" show-overflow-tooltip></el-table-column>
				<el-table-column prop="createdAt" label="创建时间" show-overflow-tooltip>
					<template #default="scope">{{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</template>
				</el-table-column>
				<el-table-column label="操作" width="100">
					<template #default="scope">
						<el-button :disabled="scope.row.userName === 'admin'" size="small" text type="primary" @click="onOpenEditUser('edit', scope.row)" v-auths="['system:user:edit']">修改</el-button>
						<el-button :disabled="scope.row.userName === 'admin'" size="small" text type="primary" @click="onRowDel(scope.row)" v-auths="['system:user:rm']">删除</el-button>
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
		<UserDialog ref="userDialogRef" @refresh="getTableData()" />
	</div>
</template>

<script setup lang="ts" name="systemUser">
import { defineAsyncComponent, reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { dayjs } from 'element-plus';
import { useUserInfoApi } from '/@/api/user/index';
import { SysUserState, RowUserType } from '/@/types/views';

const userApi = useUserInfoApi();

// 引入组件
const UserDialog = defineAsyncComponent(() => import('/@/views/system/user/dialog.vue'));

// 定义变量内容
const userDialogRef = ref();
const state = reactive<SysUserState>({
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
const getTableData = () => {
	state.tableData.loading = true;
	userApi.getUserPage(state.tableData.param).then((res) => {
		if (!res) return;
		if (res && res.code === 200) {
			const data = res.data;
			state.tableData.data = data.data;
			state.tableData.total = data.total;
		}
		
	});
	setTimeout(() => {
		state.tableData.loading = false;
	}, 500);
};
// 打开新增用户弹窗
const onOpenAddUser = (type: string) => {
	userDialogRef.value.openDialog(type);
};
// 打开修改用户弹窗
const onOpenEditUser = (type: string, row: RowUserType) => {
	userDialogRef.value.openDialog(type, row);
};
// 删除用户
const onRowDel = (row: RowUserType) => {
	ElMessageBox.confirm(`此操作将永久删除账户名称：“${row.userName}”，是否继续?`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(() => {
			userApi.deleteUser(row.id).then((res) => {
				if (res && res.code === 200) {
					ElMessage.success('删除成功');
					getTableData();
				} else {
					ElMessage.error(res.msg);
					return;
				}
			});
			
		})
		.catch(() => {});
};

// 修改用户状态
const onStatusChange = (row: RowUserType) => {
	let data = {
		id: row.id,
		status: row.status,
	};
	userApi.updateUserStatus(data).then((res) => {
		if (res && res.code === 200) {
			ElMessage.success('修改成功');
			getTableData();
		} else {
			ElMessage.error(res.msg);
			return;
		}
	});
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
// 页面加载时
onMounted(() => {
	getTableData();
});
</script>

<style scoped lang="scss">
.system-user-container {
	:deep(.el-card__body) {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: auto;
		.el-table {
			flex: 1;
		}
	}
}
</style>
