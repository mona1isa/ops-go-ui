<template>
    <div class="keys-dialog">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="769px">
            <el-form ref="keysDialogFormRef" :rule="rules" :model="state.ruleForm" size="default" label-width="90px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="密钥名称" prop="name">
                            <el-input v-model="state.ruleForm.name" placeholder="请输入密钥名称" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="登录用户" prop="user">
                            <el-input v-model="state.ruleForm.user" placeholder="请输入登录用户" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="密钥类型" prop="type">
                            <el-select v-model="state.ruleForm.type" placeholder="请选择密钥类型" clearable class="w100">
                                <el-option label="密码" :value=1></el-option>
                                <el-option label="密钥" :value=2></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <template v-if="state.ruleForm.type === 1">
                        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                            <el-form-item label="密码" prop="credentials">
                                <el-input type="password" v-model="state.ruleForm.credentials" placeholder="请输入凭证" clearable></el-input>
                            </el-form-item>
                        </el-col>
                    </template>
                    <template v-if="state.ruleForm.type === 2">
                        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                            <el-form-item label="密钥" prop="credentials">
                                <el-input type="textarea" v-model="state.ruleForm.credentials" placeholder="请输入凭证" clearable></el-input>
                            </el-form-item>
                        </el-col>
                    </template>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="协议" prop="protocol">
                            <el-select v-model="state.ruleForm.protocol" placeholder="请选择协议" clearable class="w100">
                                <el-option label="SSH" value="ssh"></el-option>
                                <el-option label="RDP" value="rdp"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="端口" prop="port">
                            <el-input v-model="state.ruleForm.port" placeholder="请输入端口" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="备注" prop="remark">
                            <el-input type="textarea" v-model="state.ruleForm.remark" placeholder="请输入备注" clearable></el-input>
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

<script setup lang="ts" name="keysDialog">
import { RowKeyType } from '/@/types/views';
import { reactive, ref, watch } from 'vue';
import { useKeyApi } from '/@/api/keys';
import { ElMessage } from 'element-plus';

// 定义接口
const keyApi = useKeyApi()

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

const rules = {
    name: [
        { required: true, message: '请输入密钥名称', trigger: 'blur' }
    ],
    user: [
        { required: true, message: '请输入登录用户', trigger: 'blur' }
    ],
    credentials: [
        { required: true, message: '请输入凭证', trigger: 'blur' }
    ],
    protocol: [
        { required: true, message: '请选择协议', trigger: 'blur' }
    ],
    port: [
        { required: true, message: '请输入端口', trigger: 'blur' }
    ],
}

const initState = {
    name: '',
    user: '',
    type: 1,
    credentials: '',
    protocol: '',
    port: 22,
    remark: ''
};

const state = reactive({
    dialog: {
        isShowDialog: false,
        title: '',
        type: '',
    },
    ruleForm: {...initState},
})

// 监听 protocol 变化，设置默认端口
watch(() => state.ruleForm.protocol, (val) => {
    if (val === 'ssh') {
        state.ruleForm.port = 22;
    } else if (val === 'rdp') {
        state.ruleForm.port = 3389;
    }
})

// 定义变量
const keysDialogFormRef = ref();
const openDialog = (type: string, row: RowKeyType) => {
	if (type === 'edit') {
	    state.ruleForm = {...row, credentials: ''};
		state.dialog.title = "编辑凭证";
	} else {
		state.ruleForm = {...initState};
		state.dialog.title = "添加凭证";
	}
	state.dialog.isShowDialog = true;
	state.dialog.type = type;
};

const onCancel = () => {
    state.dialog.isShowDialog = false;
}

const onSubmit = () => {
    state.dialog.isShowDialog = false;
    keysDialogFormRef.value.validate((valid: boolean) => {
        if (valid) {
            if (state.dialog.type === 'add') {
                keyApi.addKey(state.ruleForm).then(() => {
                    ElMessage.success('添加成功');
                    emit('refresh');
                });
            } else {
                keyApi.updateKey(state.ruleForm).then(() => {
                    ElMessage.success('修改成功');
                    emit('refresh');
                });
            }
        }
    });
}

// 暴露变量
defineExpose({
	openDialog,
});
</script>

<style scoped lang="less">  

</style>