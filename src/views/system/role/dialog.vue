<template>
	<div class="system-role-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="769px">
			<el-form ref="roleDialogFormRef" :model="state.ruleForm" :rules="rules" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="角色名称" prop="name">
							<el-input v-model="state.ruleForm.name" placeholder="请输入角色名称" clearable></el-input>
						</el-form-item>
					</el-col>
					
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="排序" prop="orderNum">
							<el-input-number v-model="state.ruleForm.orderNum" :min="0" :max="999" controls-position="right" placeholder="请输入排序" class="w100" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="角色状态" prop="status">
							<el-switch v-model="state.ruleForm.status" inline-prompt active-text="启" inactive-text="禁" active-value="1" inactive-value="0"></el-switch>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="角色描述">
							<el-input v-model="state.ruleForm.remark" type="textarea" placeholder="请输入角色描述" maxlength="150"></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="菜单权限">
							<el-tree
							ref="menuTreeRef"
							:data="state.menuData"
							:props="state.menuProps"
							show-checkbox
							class="menu-data-tree"
							node-key="id"
							:default-checked-keys="state.ruleForm.menuIds"
							@check="handleMenuCheck" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button plain type="info" @click="onCancel" size="default">取 消</el-button>
					<el-button plain type="primary" @click="onSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="systemRoleDialog">
import { reactive, ref, nextTick } from 'vue';
import { useRoleApi } from '/@/api/role';
import { useMenuApi } from '/@/api/menu';
import { ElMessage } from 'element-plus';

// 角色接口
const roleApi = useRoleApi();

// 菜单接口
const menuApi = useMenuApi();

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 定义变量内容
const roleDialogFormRef = ref();
const rules = reactive({
  name: [
	{ required: true, message: '角色名称不能为空', trigger: 'blur' },
	{ min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  orderNum: [
	{ required: true, message: '排序不能为空', trigger: 'blur' },
  ],
  status: [
	{ required: true, message: '角色状态不能为空', trigger: 'change' },
  ],
});

// Define menuTreeRef
const menuTreeRef = ref();

const initialState = {
  id: 0,
  name: '',
  orderNum: 1,
  status: '1',
  remark: '',
  createdAt: '',
  menuIds: [] as number[], // 确保初始化为数组
};

const state = reactive({
	ruleForm: { ...initialState },
	menuData: [] as TreeType[],
	menuProps: {
		children: 'children',
		label: 'name',
		id: 'id',
	},
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 打开弹窗
const openDialog = (type: string, row: RowRoleType) => {
	if (type === 'edit') {
		roleApi.getMenuIds(row.id).then((res) => {
			state.ruleForm.menuIds = res.data || [];
		});
		state.ruleForm = {
			...row,
		};
		state.dialog.title = '修改角色';
		state.dialog.submitTxt = '修 改';
	} else if (type === 'add') {
		state.dialog.title = '新增角色';
		state.dialog.submitTxt = '新 增';
		// 重置表单数据和验证状态
		state.ruleForm = { ...initialState };
		nextTick(() => {
		  roleDialogFormRef.value?.resetFields();
		});
	} else if (type === 'authUser') {
		state.ruleForm = {
			...row,
		};
		state.dialog.title = '分配用户';
		state.dialog.submitTxt = '分 配';

	}
	state.dialog.type = type;
	state.dialog.isShowDialog = true;
	getMenuData();
};
// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
};
// 取消
const onCancel = () => {
	closeDialog();
};
// 提交
const onSubmit = () => {
	const checkedKeys = menuTreeRef.value.getCheckedKeys();

	state.ruleForm.menuIds = checkedKeys;
	roleDialogFormRef.value.validate((valid: boolean) => {
		if (valid) {
			const apiCall = state.dialog.type === 'add' 
				? roleApi.addRole(state.ruleForm) 
				: roleApi.editRole(state.ruleForm);
		
			apiCall.then(() => {
				closeDialog();
				emit('refresh'); // 确保接口成功后再触发刷新
			}).catch((error) => {
				ElMessage.error(error.message);
			});
		} else {
		ElMessage.error('请填写完整表单');
		}
	});
};

// 获取菜单结构数据
const getMenuData = () => {
	menuApi.getMenuList({}).then((res) => {
		state.menuData = res.data;
	});
};

// 处理菜单勾选事件，实现父子菜单联动
const handleMenuCheck = (data: any, checked: any) => {
	const menuTree = menuTreeRef.value;

	// 如果勾选了父节点，勾选所有子节点
	if (checked.checkedKeys.includes(data.id)) {
		const allChildrenIds = getAllChildrenIds(state.menuData, data.id);
		allChildrenIds.forEach((childId: number) => {
			if (!checked.checkedKeys.includes(childId)) {
				menuTree.setChecked(childId, true, false);
			}
		});
	}

	// 如果取消勾选了节点，检查是否需要取消勾选父节点
	if (!checked.checkedKeys.includes(data.id)) {
		uncheckParentNode(data.id);
	}
};

// 获取指定节点的所有子节点ID
const getAllChildrenIds = (menuList: any[], parentId: number): number[] => {
	let ids: number[] = [];
	menuList.forEach((menu) => {
		if (menu.id === parentId) {
			// 找到父节点，递归获取所有子节点
			if (menu.children && menu.children.length > 0) {
				menu.children.forEach((child: any) => {
					ids.push(child.id);
					ids = ids.concat(getAllChildrenIds([], child.id));
				});
			}
		} else if (menu.children && menu.children.length > 0) {
			// 递归查找
			ids = ids.concat(getAllChildrenIds(menu.children, parentId));
		}
	});
	return ids;
};

// 递归取消勾选父节点（如果父节点的所有子节点都未勾选）
const uncheckParentNode = (nodeId: number) => {
	const parentNode = findParentNode(state.menuData, nodeId);
	if (parentNode) {
		const menuTree = menuTreeRef.value;
		const checkedKeys = menuTree.getCheckedKeys();
		const hasCheckedChild = parentNode.children.some((child: any) => checkedKeys.includes(child.id));

		// 如果父节点的所有子节点都未勾选，取消勾选父节点
		if (!hasCheckedChild && checkedKeys.includes(parentNode.id)) {
			menuTree.setChecked(parentNode.id, false, false);
			// 递归向上检查
			uncheckParentNode(parentNode.id);
		}
	}
};

// 查找指定节点的父节点
const findParentNode = (menuList: any[], childId: number): any => {
	for (const menu of menuList) {
		if (menu.children && menu.children.length > 0) {
			const child = menu.children.find((c: any) => c.id === childId);
			if (child) {
				return menu;
			}
			const found = findParentNode(menu.children, childId);
			if (found) {
				return found;
			}
		}
	}
	return null;
};

const extractIds = (nodes: RouteItem[]): number[] => {
	const ids: number[] = [];
	nodes.forEach((node) => {
		ids.push(Number(node.id));
		if (node.children && node.children.length > 0) {
			ids.push(...extractIds(node.children));
		}
	});
	return ids;
};

// 暴露变量
defineExpose({
	openDialog,
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
</style>
