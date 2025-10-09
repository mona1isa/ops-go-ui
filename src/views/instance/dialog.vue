<template>
    <div class="instance-dialog">
        <el-dialog :visible="state.dialog.visible" :title="state.dialog.title" width="769px">
            <div class="dialog-content">
                <el-form ref="instanceDialogRef" :rule="rules" :model="state.dialog" label-width="120px">
                    <el-form-item label="实例名称">
                        <el-input v-model="state.ruleForm.name"></el-input>
                    </el-form-item>

					<el-form-item label="CPU核数">
						<el-input-number v-model="state.ruleForm.cpu" controls-position="right" class="w100" />
					</el-form-item>

					<el-form-item label="内存大小">
						<el-input-number v-model="state.ruleForm.mem" controls-position="right" class="w100" />
					</el-form-item>

					<el-form-item label="磁盘大小">
						<el-input-number v-model="state.ruleForm.disk" controls-position="right" class="w100" />
					</el-form-item>

					<el-form-item label="IP地址">
						<el-input v-model="state.ruleForm.ip"></el-input>
					</el-form-item>

					<el-form-item label="端口号">
						<el-input v-model="state.ruleForm.port"></el-input>
					</el-form-item>

                    <el-form-item label="实例状态">
                        <el-select v-model="state.ruleForm.status" placeholder="请选择实例状态">
                            <el-switch v-model="state.ruleForm.status" inline-prompt active-text="启" active-value="1" inactive-text="禁" inactive-value="0"></el-switch>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="实例描述">
						<el-input v-model="state.ruleForm.remark" type="textarea"></el-input>
					</el-form-item>
				</el-form>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="state.dialog.visible = false">取 消</el-button>
                    <el-button type="primary" @click="state.dialog.visible = false">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="instanceDialog">
import { ref, reactive } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useInstanceApi } from '/@/api/instance';
import { RowInstanceType } from '/@/types/views';

// 定义接口
const instanceApi = useInstanceApi();

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

const rules = reactive({
	name: [
		{ required: true, message: '请输入实例名称', trigger: 'blur' },
	],
	cpu: [
		{ required: true, message: '请输入CPU数量', trigger: 'blur' },
	],
	mem: [
		{ required: true, message: '请输入内存大小', trigger: 'blur' },
	],
	disk: [
		{ required: true, message: '请输入磁盘大小', trigger: 'blur' },
	],
	ip: [
		{ required: true, message: '请输入IP地址', trigger: 'blur' },
	],
	port: [
		{ required: true, message: '请输入端口号', trigger: 'blur' },
	],
	status: [
	],
});

// 定义变量
const instanceDialogRef = ref(null);
const openDialog = (type: string, row?: RowInstanceType) => {
	if (type === 'edit') {
	    // state.ruleForm = { ...row };
		state.dialog.title = "编辑实例";
	} else {
		state.ruleForm = {...initState};
		state.dialog.title = "添加实例";
	}
	state.dialog.visible = true;
};

const initState = {
	name: '',
	cpu: 0,
	mem: 0,
	disk: 0,
	ip: '',
	os: '',
	port: 22,
	status: '',
	remark: '',
};
const state = reactive({
	ruleForm: {...initState},
	dialog: {
		visible: false,
		title: '',
	},
	
});

// 暴露变量
defineExpose({
	openDialog,
});
</script>