<template>
	<div class="system-role-container layout-padding">
		<div class="system-role-padding layout-padding-auto layout-padding-view">
			<div class="system-user-search mb15">
				<el-input v-model="state.tableData.param.name" size="default" placeholder="请输入角色名称" style="max-width: 180px" clearable> </el-input>
				<el-button size="default" type="primary" class="ml10" @click="getTableData()">
					<el-icon>
						<ele-Search />
					</el-icon>
					查询
				</el-button>
				<el-button size="default" type="success" class="ml10" @click="onOpenAddRole('add')">
					<el-icon>
						<ele-FolderAdd />
					</el-icon>
					新增角色
				</el-button>
			</div>
			<el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
				<el-table-column prop="id" label="序号" width="60" align="center" />
				<el-table-column prop="name" label="角色名称" show-overflow-tooltip></el-table-column>
				<el-table-column prop="orderNum" label="排序" show-overflow-tooltip></el-table-column>
				<el-table-column prop="status" label="角色状态" show-overflow-tooltip>
					<template #default="scope">
						<el-tag type="success" v-if="scope.row.status === '1'">启用</el-tag>
						<el-tag type="info" v-else>禁用</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="remark" label="角色描述" show-overflow-tooltip></el-table-column>
				<el-table-column prop="createdAt" label="创建时间" show-overflow-tooltip>
					<template #default="scope">{{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</template>
				</el-table-column>
				<el-table-column label="操作" width="180">
					<template #default="scope">
						<el-button :disabled="scope.row.name === 'Admin'" size="small" text type="primary" @click="onOpenEditRole('edit', scope.row)">修改</el-button>
						<el-button v-if="scope.row.name !== 'Admin'" size="small" text type="primary" @click="onOpenAuthUser(scope.row)">分配用户</el-button>
						<el-button :disabled="scope.row.name === 'Admin'" size="small" text type="primary" @click="onRowDel(scope.row)">删除</el-button>
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
		</div>
		<RoleDialog ref="roleDialogRef" @refresh="getTableData()" />
		<RoleAuthUser ref="roleAuthUserRef" @refresh="getUserTableData()" />
	</div>
</template>

<script setup lang="ts" name="systemRole">
import { dayjs } from 'element-plus';
import { defineAsyncComponent, reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useRoleApi } from '/@/api/role';

// 角色接口
const roleApi = useRoleApi();

// 引入组件
const RoleDialog = defineAsyncComponent(() => import('/@/views/system/role/dialog.vue'));
const RoleAuthUser = defineAsyncComponent(() => import('/@/views/system/role/authUser.vue'));

// 定义变量内容
const roleDialogRef = ref();
const state = reactive<SysRoleState>({
	tableData: {
		data: [],
		total: 0,
		loading: false,
		param: {
			name: '',
			pageNum: 1,
			pageSize: 10,
		},
	},
});
// 初始化表格数据
const getTableData = () => {
	state.tableData.loading = true;
	roleApi.pageRole(state.tableData.param).then((res) => {
		state.tableData.data = res.data;
		state.tableData.total = res.total;
		setTimeout(() => {
			state.tableData.loading = false;
		}, 500);
	});
}

// 定义用户数据变量
const roleAuthUserRef = ref();
// 获取用户数据
const getUserTableData = () => {
	roleAuthUserRef.value.getTableData();
}

// 打开新增角色弹窗
const onOpenAddRole = (type: string) => {
	roleDialogRef.value.openDialog(type);
};
// 打开修改角色弹窗
const onOpenEditRole = (type: string, row: Object) => {
	roleDialogRef.value.openDialog(type, row);
};
// 打开用户授权窗口
const onOpenAuthUser = (row: Object) => {
	roleAuthUserRef.value.openDialog(row);
}
// 删除角色
const onRowDel = (row: RowRoleType) => {
	ElMessageBox.confirm(`此操作将永久删除角色名称：“${row.name}”，是否继续?`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(() => {
			roleApi.delRole(row.id).then((res) => {
				ElMessage.success('删除成功');
				getTableData();
			});
		})
		.catch(() => {});
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
.system-role-container {
	.system-role-padding {
		padding: 15px;
		.el-table {
			flex: 1;
		}
	}
}
</style>
