<template>
    <div class="cert-alert-dialog-container">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.visible" width="720px">
            <el-form ref="certDialogFormRef" :rules="rules" :model="state.ruleForm" label-width="110px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="规则名称" prop="name">
                            <el-input v-model="state.ruleForm.name" placeholder="如：SSL 证书到期提醒" maxlength="128" class="w100" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="资产模型" prop="modelTypes">
                            <el-select v-model="state.ruleForm.modelTypes" multiple placeholder="全部含到期时间的资产" clearable class="w100">
                                <el-option v-for="item in cmdbModelTypes" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                            <div class="form-tip">留空表示监控所有填写了到期时间的资产</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="预警天数" prop="warningDays">
                            <el-input-number v-model="state.ruleForm.warningDays" :min="1" :max="3650" controls-position="right" class="w100" />
                            <div class="form-tip">到期前 N 天开始告警</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="告警级别" prop="severity">
                            <el-select v-model="state.ruleForm.severity" class="w100">
                                <el-option label="紧急" :value="1" />
                                <el-option label="警告" :value="2" />
                                <el-option label="提醒" :value="3" />
                            </el-select>
                            <div class="form-tip">已过期资产自动升级为紧急</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="重复通知" prop="cooldownSec">
                            <el-input-number v-model="state.ruleForm.cooldownSec" :min="0" :max="604800" :step="3600" controls-position="right" class="w100" />
                            <div class="form-tip">秒，未恢复时再次通知间隔</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="静音" prop="muted">
                            <el-switch v-model="state.ruleForm.muted" inline-prompt active-text="静" inactive-text="常" active-value="1" inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="通知渠道" prop="channelIds">
                            <el-select v-model="state.ruleForm.channelIds" multiple placeholder="请选择通知渠道" class="w100">
                                <el-option
                                    v-for="item in channelList"
                                    :key="item.id"
                                    :label="`${item.name}（${channelTypeName(item.type)}）`"
                                    :value="item.id"
                                />
                            </el-select>
                            <div v-if="channelList.length === 0" class="form-tip">暂无启用的通知渠道，请先到「监控告警 - 通知渠道」页面添加</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="启用状态" prop="enabled">
                            <el-switch v-model="state.ruleForm.enabled" inline-prompt active-text="启" active-value="1" inactive-text="禁" inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="备注" prop="remark">
                            <el-input v-model="state.ruleForm.remark" type="textarea" maxlength="500" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-alert
                    v-if="state.dialog.type === 'add'"
                    class="mb15"
                    type="info"
                    :closable="false"
                    show-icon
                    title="规则保存后由证书到期扫描器定时评估（默认每小时一次，可用 CERT_ALERT_INTERVAL 秒调整），到期或超期资产会按所选渠道通知"
                />
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="onCancel">取 消</el-button>
                    <el-button type="primary" :loading="submitting" @click="onSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="certAlertDialog">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useCmdbApi } from '/@/api/cmdb';
import { useMonitorApi } from '/@/api/monitor';
import { RowCmdbCertRuleType } from '/@/types/views';
import { cmdbModelTypes } from '/@/views/cmdb/asset/schema';
import { channelTypeName } from '/@/views/monitor/channel/dict';

const cmdbApi = useCmdbApi();
const monitorApi = useMonitorApi();

const emit = defineEmits(['refresh']);

const certDialogFormRef = ref();
const channelList = ref<any[]>([]);
const submitting = ref(false);

const rules = reactive({
    name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
    warningDays: [{ required: true, message: '请输入预警天数', trigger: 'blur' }],
    severity: [{ required: true, message: '请选择告警级别', trigger: 'change' }],
});

const initState = {
    id: 0,
    name: '',
    modelTypes: [] as string[],
    warningDays: 30,
    severity: 2,
    cooldownSec: 86400,
    muted: '0',
    channelIds: [] as number[],
    enabled: '1',
    remark: '',
};

const state = reactive({
    ruleForm: { ...initState },
    dialog: { visible: false, title: '', type: '' },
});

const loadOptions = async () => {
    try {
        const res = await monitorApi.getChannelOptions();
        if (res && res.code == 200) channelList.value = res.data || [];
    } catch (error) {
        // 渠道列表加载失败
    }
};

const openDialog = (type: string, row?: RowCmdbCertRuleType) => {
    if (type === 'edit' && row) {
        state.ruleForm = {
            ...row,
            modelTypes: (row.modelTypes || '').split(',').filter(Boolean),
            channelIds: (row.channelIds || '')
                .split(',')
                .filter(Boolean)
                .map((id) => Number(id.trim())),
        } as any;
        state.dialog.title = '编辑证书到期告警规则';
    } else {
        state.ruleForm = { ...initState, modelTypes: [], channelIds: [] };
        state.dialog.title = '添加证书到期告警规则';
    }
    state.dialog.visible = true;
    state.dialog.type = type;
    loadOptions();
};

const onCancel = () => {
    state.dialog.visible = false;
};

const onSubmit = async () => {
    try {
        await certDialogFormRef.value?.validate();
    } catch (error) {
        return;
    }

    const submitData: Record<string, any> = {
        ...state.ruleForm,
        modelTypes: (state.ruleForm.modelTypes || []).join(','),
        channelIds: (state.ruleForm.channelIds || []).join(','),
    };
    submitting.value = true;
    try {
        if (state.dialog.type === 'add') {
            delete submitData.id;
            await cmdbApi.addCertRule(submitData);
            ElMessage.success('添加成功');
        } else {
            await cmdbApi.updateCertRule(submitData);
            ElMessage.success('修改成功');
        }
        state.dialog.visible = false;
        emit('refresh');
    } catch (error: any) {
        ElMessage.error(error?.message || '保存失败');
    } finally {
        submitting.value = false;
    }
};

defineExpose({ openDialog });
</script>

<style scoped lang="scss">
.form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 18px;
}
</style>
