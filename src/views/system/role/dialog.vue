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
							<el-tree :data="state.menuData" :props="state.menuProps" show-checkbox class="menu-data-tree" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
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

const initialState = {
  id: 0,
  name: '',
  orderNum: 1,
  status: '1',
  remark: '',
  createdAt: '',
};

const state = reactive({
	ruleForm: { ...initialState },
	menuData: [] as TreeType[],
	menuProps: {
		children: 'children',
		label: 'label',
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
		state.ruleForm = row;
		state.dialog.title = '修改角色';
		state.dialog.submitTxt = '修 改';
	} else {
		state.dialog.title = '新增角色';
		state.dialog.submitTxt = '新 增';
		// 重置表单数据和验证状态
		state.ruleForm = { ...initialState };
		nextTick(() => {
		  roleDialogFormRef.value?.resetFields();
		});
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
