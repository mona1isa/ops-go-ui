<template>
	<div class="system-user-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="769px">
			<el-form ref="userDialogFormRef" :rules="rules" :model="state.ruleForm" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="账户名称" prop="userName">
							<el-input v-model="state.ruleForm.userName" placeholder="请输入账户名称" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="用户昵称" prop="nickname">
							<el-input v-model="state.ruleForm.nickname" placeholder="请输入用户昵称" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="关联角色" prop="roleId">
							<el-select v-model="state.ruleForm.roleId" placeholder="请选择" clearable class="w100">
								<el-option
									v-for="role in state.roleData"
									:key="role.id"
									:label="role.name"
									:value="role.id"
								></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="部门" prop="deptId">
							<el-cascader
								:options="state.deptData"
								:props="{ checkStrictly: true, value: 'deptId', label: 'deptName' }"
								placeholder="请选择部门"
								clearable
								class="w100"
								v-model="state.ruleForm.deptId"
							>
								<template #default="{ node, data }">
									<span>{{ data.deptName }}</span>
									<span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
								</template>
							</el-cascader>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="手机号" prop="phone">
							<el-input v-model="state.ruleForm.phone" placeholder="请输入手机号" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="邮箱" prop="email">
							<el-input v-model="state.ruleForm.email" placeholder="请输入" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="性别" prop="sex">
							<el-select v-model="state.ruleForm.sex" placeholder="请选择" clearable class="w100">
								<el-option label="男" value="0"></el-option>
								<el-option label="女" value="1"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="账户密码" prop="password">
							<el-input v-model="state.ruleForm.password" placeholder="请输入" type="password" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="用户状态" prop="status">
							<el-switch v-model="state.ruleForm.status" inline-prompt active-text="启" active-value="1" inactive-text="禁" inactive-value="0"></el-switch>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="用户描述" prop="remark">
							<el-input v-model="state.ruleForm.remark" type="textarea" placeholder="请输入用户描述" maxlength="150"></el-input>
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

<script setup lang="ts" name="systemUserDialog">
import { onMounted, reactive, ref } from 'vue';
import { useDeptApi } from '/@/api/dept';
import { useRoleApi } from '/@/api/role';
import { useUserInfoApi } from '/@/api/user';
import { ElMessage } from 'element-plus';

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 用户接口
const userApi = useUserInfoApi();

// 部门接口
const deptApi = useDeptApi();

// 角色接口
const roleApi = useRoleApi();

// 定义变量内容
const userDialogFormRef = ref();
const rules = reactive({
  deptId: [
	{ required: true, message: '部门不能为空', trigger: 'change' },
  ],
  roleId: [
	{ required: true, message: '关联角色不能为空', trigger: 'change' },
  ],
  userName: [
    { required: true, message: '用户名称不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '用户状态不能为空', trigger: 'change' },
  ],
});

const initState = {
	userName: '', // 账户名称
		nickname: '', // 用户昵称
		roleId: '', // 关联角色ID
		deptId: [] as string[], // 部门
		phone: '', // 手机号
		email: '', // 邮箱
		sex: '', // 性别
		password: '', // 账户密码
		status: true, // 用户状态
		remark: '', // 用户描述
};
const state = reactive({
	ruleForm: {...initState},
	deptData: [] as DeptTreeType[], // 部门数据
	roleData: [] as RowRoleType[], // 角色数据
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 打开弹窗
const openDialog = (type: string, row: RowUserType) => {
	if (type === 'edit') {
		state.ruleForm = row;
		state.dialog.title = '修改用户';
		state.dialog.submitTxt = '修 改';
	} else {
		state.dialog.title = '新增用户';
		state.dialog.submitTxt = '新 增';
		// 清空表单，此项需加表单验证才能使用
		userDialogFormRef.value?.resetFields();
	}
	state.dialog.type = type;
	state.dialog.isShowDialog = true;
	getDeptData();
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
	userDialogFormRef.value?.validate((valid: boolean) => {
		if (valid) {
			const callApi = state.dialog.type === 'add' ? userApi.addUser(state.ruleForm) : userApi.updateUser(state.ruleForm);
			callApi.then((res) => {
				closeDialog();
				emit('refresh'); // 确保接口成功后再触发刷新
				ElMessage.success(res.msg);
			}).catch((error) => {
				ElMessage.error(error.message);
			});
		} else {
			ElMessage.error('请填写完整信息');
		}
	});
};
// 初始化部门数据
const getDeptData = () => {
	deptApi.getDeptList({}).then((res) => {
		state.deptData = res.data;
	});
};

// 初始化角色数据
const getRoleData = () => {
	roleApi.getRoleList({}).then((res) => {
		state.roleData = res.data;
	});
};

onMounted(() => {
	getDeptData();
	getRoleData();
});

// 暴露变量
defineExpose({
	openDialog,
});
</script>
