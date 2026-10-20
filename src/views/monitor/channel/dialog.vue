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
                            <el-select v-model="state.ruleForm.type" placeholder="请选择类型" class="w100" @change="onTypeChange">
                                <el-option v-for="item in CHANNEL_TYPES" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <!-- Webhook / 机器人 -->
                    <el-col v-if="!isEmail" :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item :label="isRobot ? '机器人地址' : '回调地址'" prop="url">
                            <el-input v-model="state.ruleForm.url" :placeholder="urlPlaceholder" maxlength="512" class="w100"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col v-if="showSecret" :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item :label="isRobot ? '加签密钥' : '签名密钥'" prop="secret">
                            <el-input v-model="state.ruleForm.secret" type="password" show-password :placeholder="secretPlaceholder" class="w100"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col v-if="state.ruleForm.type === 1" :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="自定义请求头" prop="headers">
                            <el-input v-model="state.ruleForm.headers" type="textarea" :rows="2" placeholder='JSON 对象，如 {"X-Token": "abc"}，可留空'></el-input>
                        </el-form-item>
                    </el-col>

                    <!-- 邮件 -->
                    <template v-if="isEmail">
                        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                            <el-form-item label="收件人" prop="mailTo">
                                <el-input v-model="state.ruleForm.mailTo" placeholder="多个邮箱用逗号分隔，如 ops1@example.com,ops2@example.com" maxlength="512" class="w100"></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                            <el-form-item label="SMTP 主机" prop="smtpHost">
                                <el-input v-model="state.ruleForm.smtpHost" placeholder="如 smtp.example.com" class="w100"></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                            <el-form-item label="SMTP 端口" prop="smtpPort">
                                <el-input-number v-model="state.ruleForm.smtpPort" :min="1" :max="65535" class="w100" controls-position="right"></el-input-number>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                            <el-form-item label="加密方式" prop="smtpSecurity">
                                <el-select v-model="state.ruleForm.smtpSecurity" class="w100">
                                    <el-option label="SSL（常用 465）" value="ssl" />
                                    <el-option label="STARTTLS（常用 587）" value="starttls" />
                                    <el-option label="无加密" value="none" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                            <el-form-item label="认证方式" prop="smtpAuth">
                                <el-select v-model="state.ruleForm.smtpAuth" class="w100">
                                    <el-option label="PLAIN" value="plain" />
                                    <el-option label="LOGIN" value="login" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                            <el-form-item label="SMTP 账号" prop="smtpUsername">
                                <el-input v-model="state.ruleForm.smtpUsername" placeholder="留空表示服务器免认证" class="w100"></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                            <el-form-item label="SMTP 密码" prop="smtpPassword">
                                <el-input v-model="state.ruleForm.smtpPassword" type="password" show-password :placeholder="state.dialog.type === 'edit' ? '不修改请留空' : '邮箱密码或授权码'" class="w100"></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                            <el-form-item label="发件人地址" prop="smtpFrom">
                                <el-input v-model="state.ruleForm.smtpFrom" placeholder="如 ops@example.com，通常与账号相同" class="w100"></el-input>
                            </el-form-item>
                        </el-col>
                    </template>

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
import { computed, ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useMonitorApi } from '/@/api/monitor';
import { RowMonitorChannelType } from '/@/types/views';
import { CHANNEL_TYPES, isRobotChannel } from './dict';

const monitorApi = useMonitorApi();

const emit = defineEmits(['refresh']);

const channelDialogFormRef = ref();

const initState = {
    id: 0,
    name: '',
    type: 1 as number,
    url: '',
    secret: '',
    headers: '',
    enabled: '1',
    remark: '',
    mailTo: '',
    smtpHost: '',
    smtpPort: 465 as number,
    smtpUsername: '',
    smtpPassword: '',
    smtpFrom: '',
    smtpAuth: 'plain',
    smtpSecurity: 'ssl',
};

const state = reactive({
    ruleForm: { ...initState },
    dialog: {
        visible: false,
        title: '',
        type: '',
    },
});

const isEmail = computed(() => state.ruleForm.type === 2);
const isRobot = computed(() => isRobotChannel(state.ruleForm.type));

const urlPlaceholder = computed(() => {
    switch (state.ruleForm.type) {
        case 3:
            return 'https://oapi.dingtalk.com/robot/send?access_token=...';
        case 4:
            return 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...';
        case 5:
            return 'https://open.feishu.cn/open-apis/bot/v2/hook/...';
        default:
            return 'https://...';
    }
});

const showSecret = computed(() => state.ruleForm.type === 1 || state.ruleForm.type === 3 || state.ruleForm.type === 5);

const secretPlaceholder = computed(() => {
    if (state.dialog.type === 'edit') {
        return '不修改请留空';
    }
    switch (state.ruleForm.type) {
        case 3:
            return '钉钉加签密钥（SEC 开头），未开启加签可留空';
        case 5:
            return '飞书签名密钥（安全设置-签名校验），可留空';
        default:
            return 'HMAC-SHA256 签名密钥，可留空';
    }
});

const robotHosts: Record<number, string> = { 3: 'oapi.dingtalk.com', 4: 'qyapi.weixin.qq.com', 5: 'open.feishu.cn' };

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

const validateUrl = (_rule: any, value: string, callback: (err?: Error) => void) => {
    const type = state.ruleForm.type;
    if (isEmail.value) {
        callback();
        return;
    }
    const trimmed = (value || '').trim();
    if (!trimmed) {
        callback(new Error(type === 1 ? '请输入回调地址' : '请输入机器人地址'));
        return;
    }
    if (type === 1) {
        if (!/^https?:\/\/.+/.test(trimmed)) {
            callback(new Error('请输入 http/https 开头的地址'));
        }
        return;
    }
    if (!/^https:\/\/.+/.test(trimmed)) {
        callback(new Error('机器人地址仅支持 https'));
        return;
    }
    try {
        const host = new URL(trimmed).hostname;
        if (host !== robotHosts[type] && !host.endsWith('.' + robotHosts[type])) {
            callback(new Error(`机器人地址必须为 ${robotHosts[type]} 官方域名`));
        }
    } catch {
        callback(new Error('地址格式非法'));
    }
};

const validateRecipients = (_rule: any, value: string, callback: (err?: Error) => void) => {
    const list = (value || '').split(/[,;，；\s]+/).filter(Boolean);
    if (list.length === 0) {
        callback(new Error('请输入收件人邮箱'));
        return;
    }
    const bad = list.find((item) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(item));
    if (bad) {
        callback(new Error(`邮箱格式不合法: ${bad}`));
    }
};

// 填写了账号但未填密码时拦截（掩码代表沿用原密码，放行）
const validateSmtpPassword = (_rule: any, value: string, callback: (err?: Error) => void) => {
    if (state.ruleForm.smtpUsername && !value) {
        callback(new Error('请输入 SMTP 密码；编辑时留空表示必须填写，不想修改请保持掩码'));
        return;
    }
    callback();
};

const rules = reactive({
    name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择渠道类型', trigger: 'change' }],
    url: [{ validator: validateUrl, trigger: 'blur' }],
    headers: [{ validator: validateHeaders, trigger: 'blur' }],
    mailTo: [{ required: true, validator: validateRecipients, trigger: 'blur' }],
    smtpHost: [{ required: true, message: '请输入 SMTP 主机', trigger: 'blur' }],
    smtpPort: [{ required: true, message: '请输入 SMTP 端口', trigger: 'blur' }],
    smtpFrom: [{ required: true, message: '请输入发件人地址', trigger: 'blur' }],
    smtpPassword: [{ validator: validateSmtpPassword, trigger: 'blur' }],
});

// 类型切换时清空类型专属字段
const onTypeChange = () => {
    const name = state.ruleForm.name;
    state.ruleForm = { ...initState, name, type: state.ruleForm.type };
    channelDialogFormRef.value?.clearValidate();
};

const openDialog = (type: string, row?: RowMonitorChannelType) => {
    if (type === 'edit' && row) {
        const form = { ...initState, ...row, secret: row.secret === '******' ? '' : row.secret || '', headers: row.headers || '', mailTo: '', smtpPassword: '' };
        if (row.type === 2) {
            form.mailTo = row.url || '';
            try {
                const cfg = JSON.parse(row.headers || '{}');
                form.smtpHost = cfg.host || '';
                form.smtpPort = cfg.port || 465;
                form.smtpUsername = cfg.username || '';
                form.smtpFrom = cfg.from || '';
                form.smtpAuth = cfg.auth || 'plain';
                form.smtpSecurity = cfg.security || 'ssl';
                // 密码回显为掩码，置空表示不修改（提交掩码由后端还原原值）
                form.smtpPassword = cfg.password && cfg.password !== '******' ? cfg.password : '******';
            } catch {
                // headers 非法 JSON 时保持默认
            }
            form.url = '';
        }
        state.ruleForm = form;
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

// 组装提交数据：邮件把收件人写入 url、SMTP 参数写入 headers
const buildSubmitData = () => {
    const { mailTo, smtpHost, smtpPort, smtpUsername, smtpPassword, smtpFrom, smtpAuth, smtpSecurity, ...rest } = state.ruleForm as any;
    const submitData: Record<string, any> = { ...rest };
    if (submitData.type === 2) {
        const hasAccount = !!(smtpUsername || '').trim();
        let password = (smtpPassword || '').trim();
        // 编辑态掩码原样提交由后端还原；无账号（免认证）时不带密码
        if (!hasAccount) {
            password = '';
        }
        submitData.url = mailTo.replace(/[；，]/g, ',');
        submitData.headers = JSON.stringify({
            host: smtpHost.trim(),
            port: Number(smtpPort),
            username: (smtpUsername || '').trim(),
            password,
            from: (smtpFrom || '').trim(),
            auth: smtpAuth,
            security: smtpSecurity,
        });
        submitData.secret = '';
    } else {
        if (submitData.type === 4) {
            submitData.secret = '';
        }
        submitData.headers = submitData.type === 1 ? submitData.headers : '';
    }
    return submitData;
};

const onSubmit = async () => {
    try {
        await channelDialogFormRef.value?.validate();
        const submitData = buildSubmitData();
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
