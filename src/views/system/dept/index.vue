<template>
	<div class="system-dept-container layout-padding">
		<el-card shadow="hover" class="layout-padding-auto">
			<div class="system-dept-search mb15">
				<el-input v-model="state.tableData.param.name" size="default" placeholder="请输入部门名称" style="max-width: 180px"> </el-input>
				<el-button size="default" type="primary" class="ml10" @click="getTableData()">
					<el-icon>
						<ele-Search />
					</el-icon>
					查询
				</el-button>
				<el-button size="default" type="success" class="ml10" @click="onOpenAddDept('add')">
					<el-icon>
						<ele-FolderAdd />
					</el-icon>
					新增部门
				</el-button>
			</div>
			<el-table
				:data="state.tableData.data"
				v-loading="state.tableData.loading"
				style="width: 100%"
				row-key="id"
				default-expand-all
				:tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
			>
				<el-table-column prop="name" label="部门名称" show-overflow-tooltip> </el-table-column>
				<el-table-column prop="status" label="部门状态" show-overflow-tooltip>
					<template #default="scope">
						<el-switch v-model="scope.row.status" inline-prompt active-text="启" inactive-text="禁" @click="onStatusChange(scope.row)"></el-switch>
					</template>
				</el-table-column>
				<el-table-column prop="remark" label="部门描述" show-overflow-tooltip></el-table-column>
				<el-table-column prop="createdAt" label="创建时间" show-overflow-tooltip>
					<template #default="scope">{{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</template>
				</el-table-column>
				<el-table-column label="操作" show-overflow-tooltip width="140">
					<template #default="scope">
						<el-button size="small" text type="primary" @click="onOpenAddDept('add')">新增</el-button>
						<el-button size="small" text type="primary" @click="onOpenEditDept('edit', scope.row)">修改</el-button>
						<el-button size="small" text type="primary" @click="onTabelRowDel(scope.row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>
		<DeptDialog ref="deptDialogRef" @refresh="getTableData()" />
	</div>
</template>

<script setup lang="ts" name="systemDept">
import { defineAsyncComponent, ref, reactive, onMounted } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { dayjs } from 'element-plus';
import { useDeptApi } from '/@/api/dept';

// 部门接口
const deptApi = useDeptApi(); 

// 引入组件
const DeptDialog = defineAsyncComponent(() => import('/@/views/system/dept/dialog.vue'));

// 定义变量内容
const deptDialogRef = ref();
const state = reactive<SysDeptState>({
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
	deptApi.getDeptTree().then((res) => {
		state.tableData.data = res.data;
	});

	setTimeout(() => {
		state.tableData.loading = false;
	}, 500);
};
// 打开新增菜单弹窗
const onOpenAddDept = (type: string) => {
	deptDialogRef.value.openDialog(type);
};
// 打开编辑菜单弹窗
const onOpenEditDept = (type: string, row: DeptTreeType) => {
	deptDialogRef.value.openDialog(type, row);
};
// 删除当前行
const onTabelRowDel = (row: DeptTreeType) => {
	ElMessageBox.confirm(`此操作将永久删除部门：${row.name}, 是否继续?`, '提示', {
		confirmButtonText: '删除',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(() => {
			deptApi.delDept(row.id).then((res) => {
				// 删除成功后
				if (res && res.code === 200) {
					getTableData();
					ElMessage.success('删除成功');
				} else {
					getTableData();
					ElMessage.error(res.msg);
				}
			});
			
		})
		.catch(() => {});
};

const onStatusChange = (row: DeptTreeType) => {
	const newStatus = row.status ? 1 : 0; // 将布尔值转换为数字
	const data = {
		id: row.id,
		status: row.status,
	};
	deptApi.updateDeptStatus(data).then((res) => {
		if (res && res.code === 200) {
			getTableData
			ElMessage.success('状态更新成功');
		} else {
			// 如果更新失败，恢复原状态
			row.status = !row.status;
			ElMessage.error(res.msg);
		}
	}).catch(() => {
		// 如果请求失败，恢复原状态
		row.status = !row.status;
		ElMessage.error('网络错误，状态更新失败');
	});
};
// 页面加载时
onMounted(() => {
	getTableData();
});
</script>
