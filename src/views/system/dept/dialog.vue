<template>
	<div class="system-dept-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="769px">
			<el-form ref="deptDialogFormRef" :model="state.ruleForm" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="上级部门">
							<el-cascader
								:options="state.deptData"
								:props="{ checkStrictly: true, value: 'id', label: 'name' }"
								placeholder="请选择部门"
								clearable
								class="w100"
								v-model="state.ruleForm.parentId"
							>
								<template #default="{ node, data }">
									<span>{{ data.name }}</span>
									<span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
								</template>
							</el-cascader>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="部门名称">
							<el-input v-model="state.ruleForm.name" placeholder="请输入部门名称" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="排序">
							<el-input-number v-model="state.ruleForm.orderNum" :min="0" :max="999" controls-position="right" placeholder="请输入排序" class="w100" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="部门状态">
							<el-switch v-model="state.ruleForm.status" inline-prompt active-text="启" inactive-text="禁"></el-switch>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="部门描述">
							<el-input v-model="state.ruleForm.remark" type="textarea" placeholder="请输入部门描述" maxlength="150"></el-input>
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

<script setup lang="ts" name="systemDeptDialog">
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { useDeptApi } from '/@/api/dept';

// 部门接口
const deptApi = useDeptApi();

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 定义变量内容
const deptDialogFormRef = ref();
const state = reactive({
	ruleForm: {
		ids: [] as (number | string)[], // 部门ID
		parentId: null as number | string | null, // 上级部门ID
		name: '', // 部门名称
		orderNum: 0, // 排序
		status: true, // 部门状态
		remark: '', // 部门描述
	},
	deptData: [] as DeptTreeType[], // 部门数据
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 打开弹窗
const openDialog = (type: string, row: RowDeptType) => {
	if (type === 'edit') {
		state.ruleForm = row;
		state.dialog.title = '修改部门';
		state.dialog.submitTxt = '修 改';
		state.dialog.type = 'edit';
	} else {
		state.dialog.title = '新增部门';
		state.dialog.submitTxt = '新 增';
		state.dialog.type = 'add';
		// 清空表单，此项需加表单验证才能使用
		deptDialogFormRef.value.resetFields();
	}
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
	console.log("操作：", state.dialog.type);
	console.log("数据：", state.ruleForm);
	if (state.dialog.type === 'add') { 
		deptApi.addDept(state.ruleForm).then((res) => {
			if (res && res.code === 200) {
				ElMessage.success('新增部门成功！');
			}
		});
	} else if (state.dialog.type === 'edit') {
		deptApi.editDept(state.ruleForm).then((res) => {
			if (res && res.code === 200) {
				ElMessage.success('修改部门成功！');
			}
		});
	}
	closeDialog();
	emit('refresh');
};

// 初始化部门数据
const getMenuData = () => {
	deptApi.getDeptList({}).then((res) => {
		const data = res.data;
		state.deptData = data.data;
	});
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>
