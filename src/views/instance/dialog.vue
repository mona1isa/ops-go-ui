<template>
    <div class="instance-dialog-container">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.visible" width="769px">
			<el-form ref="instanceDialogFormRef" :rule="rules" :model="state.ruleForm" label-width="120px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="实例名称" prop="name">
							<el-input v-model="state.ruleForm.name" placeholder="请输入实例名称" maxlength="20" class="w100"></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="CPU核数" prop="cpu">
							<el-input-number v-model="state.ruleForm.cpu" controls-position="right" class="w100" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="内存大小(MB)" prop="memMb">
							<el-input-number v-model="state.ruleForm.memMb" controls-position="right" class="w100" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="磁盘大小(GB)" prop="diskGb">
							<el-input-number v-model="state.ruleForm.diskGb" controls-position="right" class="w100" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="IP地址" prop="ip">
							<el-input v-model="state.ruleForm.ip" placeholder="请输入IP地址" maxlength="15" class="w100"></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">	
						<el-form-item label="系统类型" prop="os">
							<el-select v-model="state.ruleForm.os" placeholder="请选择" clearable class="w100" @change="initKeyList">
								<el-option label="Linux" :value="'Linux'" />
								<el-option label="Windows" :value="'Windows'" />
								<el-option label="MacOS" :value="'MacOS'"/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="实例状态" prop="status" class="switch-container">
							<el-switch v-model="state.ruleForm.status" inline-prompt active-text="启" active-value="1" inactive-text="禁" inactive-value="0" class="custom-switch"></el-switch>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="登录凭证" prop="bindingKeys">
							<el-select v-model="state.ruleForm.bindingKeys" multiple placeholder="请选择登录凭证" clearable class="w100">
								<el-option
									v-for="item in state.keyData"
									:key="item.id"
									:label="item.name"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="实例描述" prop="remark">
							<el-input v-model="state.ruleForm.remark" type="textarea"></el-input>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
          
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="onCancel">取 消</el-button>
                    <el-button type="primary" @click="onSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="instanceDialog">
import { ref, reactive, onMounted} from 'vue';
import { ElMessage } from 'element-plus';
import { useInstanceApi } from '/@/api/instance';
import { useKeyApi } from '/@/api/keys';
import { RowInstanceType } from '/@/types/views';

// 定义接口
const instanceApi = useInstanceApi();

// 凭证接口
const keyApi = useKeyApi();

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

const rules = reactive({
	name: [
		{ required: true, message: '请输入实例名称', trigger: 'blur' },
	],
	cpu: [
		{ required: true, message: '请输入CPU数量', trigger: 'blur' },
		{ type: 'number', min: 1, message: 'CPU数量不能小于1', trigger: 'blur' },
	],
	mem: [
		{ required: true, message: '请输入内存大小', trigger: 'blur' },
		{ type: 'number', min: 1, message: '内存大小不能小于1', trigger: 'blur' },
	],
	disk: [
		{ required: true, message: '请输入磁盘大小', trigger: 'blur' },
		{ type: 'number', min: 1, message: '磁盘大小不能小于1', trigger: 'blur' },
	],
	ip: [
		{ required: true, message: '请输入IP地址', trigger: 'blur' },
		{ pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入有效的IP地址', trigger: 'blur' },
	],
	os: [
		{ required: true, message: "请选择系统", trigger: 'blur' }, 
	],
});

// 定义变量
const instanceDialogFormRef = ref();
const openDialog = (type: string, row: RowInstanceType) => {
	if (type === 'edit') {
	    state.ruleForm = row;
		state.dialog.title = "编辑实例";
	} else {
		state.ruleForm = {...initState};
		state.dialog.title = "添加实例";
	}
	state.dialog.visible = true;
	state.dialog.type = type;
};

// 初始化凭证列表
const initKeyList = async (osType?: string) => {
	try {
		let data = {
			osType: osType || "",
		};
		const res = await keyApi.getAvailableKeysByOsType(data);
        state.keyData = res.data;
	} catch (error) {
		console.error("获取凭证列表失败:", error);
	}
};

const initState = {
	name: '',
	cpu: 1,
	memMb: 1024,
	diskGb: 10,
	status: '1',
	bindingKeys: [] as number[],
	os: '',
	ip: '',
	remark: '',
};
const state = reactive({
	ruleForm: {...initState},
	keyData: [] as any[], // 凭证数据
	dialog: {
		visible: false,
		title: '',
		type: '',
	},
	
});

// 关闭弹窗
const onCancel = () => {
	state.dialog.visible = false;
};

// 提交数据
const onSubmit = () => {
	instanceDialogFormRef.value.validate((valid: boolean) => {
		if (valid) {
			if (state.dialog.type === 'add') {
				instanceApi.addInstance(state.ruleForm).then(() => {
					ElMessage.success('添加成功');
					state.dialog.visible = false;
					emit('refresh');
				});
			} else {
				instanceApi.updateInstance(state.ruleForm).then(() => {
					ElMessage.success('修改成功');
					state.dialog.visible = false;
					emit('refresh');
				});
			}
		}
	});
};

onMounted(() => {
	initKeyList();
});

// 暴露变量
defineExpose({
	openDialog,
});
</script>

<style scoped lang="scss">
.switch-container {
    pointer-events: none;
}

.custom-switch {
    pointer-events: auto;
}
</style>