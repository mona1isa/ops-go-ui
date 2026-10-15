<template>
    <div class="monitor-channel-dialog-container">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.visible" width="620px">
            <el-form ref="channelDialogFormRef" :rules="rules" :model="state.ruleForm" label-width="110px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="渠道名称" prop="name">
                            <el-input v-model="state.ruleForm.name" placeholder="请输入渠道名称" maxlength="128" class="w100"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="渠道类型" prop="type">
                            <el-select v-model="state.ruleForm.type" placeholder="请选择类型" class="w100">
                                <el-option label="Webhook" :value="1" />
                                <el-option label="邮件（暂未开通）" :value="2" />
                                <el-option label="钉钉机器人" :value="3" />
                                <el-option label="企业微信机器人" :value="4" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="回调地址" prop="url">
                            <el-input v-model="state.ruleForm.url" placeholder="https://... 钉钉/企业微信请填写机器人 Webhook 地址" maxlength="512" class="w100"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="签名密钥" prop="secret">
                            <el-input v-model="state.ruleForm.secret" type="password" show-password :placeholder="state.dialog.type === 'edit' ? '不修改请留空' : 'HMAC-SHA256 签名密钥，钉钉加签场景必填，可留空'" class="w100"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="自定义请求头" prop="headers">
                            <el-input v-model="state.ruleForm.headers" type="textarea" :rows="2" placeholder='JSON 对象，如 {"X-Token": "abc"}，可留空'></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="启用状态" prop="enabled">
                            <el-switch v-model="state.ruleForm.enabled" inline-prompt active-text="启" active-value="1" inactive-text="禁" inactive-value="0"></el-switch>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="备注" prop="remark">
                            <el-input v-model="state.ruleForm.remark" type="textarea" maxlength="500"></el-input>
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

<script setup lang="ts" name="monitorChannelDialog">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useMonitorApi } from '/@/api/monitor';
import { RowMonitorChannelType } from '/@/types/views';

const monitorApi = useMonitorApi();

const emit = defineEmits(['refresh']);

const channelDialogFormRef = ref();

// 自定义请求头必须是合法 JSON 对象（空串放行）
const validateHeaders = (_rule: any, value: string, callback: (err?: Error) => void) => {
    if (!value || !value.trim()) {
        callback();
        return;
    }
    try {
        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            callback(new Error('请求头必须是 JSON 对象'));
            return;
        }
        callback();
    } catch {
        callback(new Error('不是合法的 JSON'));
    }
};

const rules = reactive({
    name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择渠道类型', trigger: 'change' }],
    url: [
        { required: true, message: '请输入回调地址', trigger: 'blur' },
        { pattern: /^https?:\/\/.+/, message: '请输入 http/https 开头的地址', trigger: 'blur' },
    ],
    headers: [{ validator: validateHeaders, trigger: 'blur' }],
});

const initState = {
    id: 0,
    name: '',
    type: 1 as number,
    url: '',
    secret: '',
    headers: '',
    enabled: '1',
    remark: '',
};

const state = reactive({
    ruleForm: { ...initState },
    dialog: {
        visible: false,
        title: '',
        type: '',
    },
});

const openDialog = (type: string, row?: RowMonitorChannelType) => {
    if (type === 'edit' && row) {
        state.ruleForm = {
            ...row,
            // 列表返回的是掩码值，编辑时置空表示不修改
            secret: '',
            headers: row.headers || '',
        };
        state.dialog.title = '编辑通知渠道';
    } else {
        state.ruleForm = { ...initState };
        state.dialog.title = '添加通知渠道';
    }
    state.dialog.visible = true;
    state.dialog.type = type;
};

const onCancel = () => {
    state.dialog.visible = false;
};

const onSubmit = async () => {
    try {
        await channelDialogFormRef.value?.validate();
        const submitData: Record<string, any> = { ...state.ruleForm };
        if (state.dialog.type === 'add') {
            delete submitData.id;
            await monitorApi.addChannel(submitData);
            ElMessage.success('添加成功');
        } else {
            await monitorApi.updateChannel(submitData);
            ElMessage.success('修改成功');
        }
        state.dialog.visible = false;
        emit('refresh');
    } catch (error) {
        // 表单校验未通过
    }
};

defineExpose({
    openDialog,
});
</script>
