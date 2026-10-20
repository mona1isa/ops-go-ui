<template>
    <div class="logs-alert-dialog-container">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.visible" width="720px">
            <el-form ref="alertDialogFormRef" :rules="rules" :model="state.ruleForm" label-width="110px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="规则名称" prop="name">
                            <el-input v-model="state.ruleForm.name" placeholder="如：nginx 5xx 突增" maxlength="128" class="w100" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="主机" prop="host">
                            <el-select v-model="state.ruleForm.host" placeholder="全部主机" filterable clearable allow-create class="w100">
                                <el-option v-for="item in hostOptions" :key="item" :label="item" :value="item" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="业务标签" prop="source">
                            <el-select v-model="state.ruleForm.source" placeholder="全部来源" filterable clearable allow-create class="w100">
                                <el-option v-for="item in sourceOptions" :key="item" :label="item" :value="item" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="日志级别" prop="level">
                            <el-select v-model="state.ruleForm.level" placeholder="全部级别" clearable class="w100">
                                <el-option v-for="lv in levels" :key="lv" :label="lv" :value="lv" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="关键字" prop="keyword">
                            <el-input v-model="state.ruleForm.keyword" placeholder="如 502，单个关键字" class="w100" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="流选择器" prop="selector">
                            <el-input v-model="state.ruleForm.selector" placeholder="高级用法，留空则按上方条件自动生成" clearable class="w100" />
                            <div class="form-tip" v-pre>填写后忽略主机/业务标签/级别/关键字四项条件，形如 {job="ops_log",host="10.0.0.1"}</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="统计时间窗" prop="windowSec">
                            <el-input-number v-model="state.ruleForm.windowSec" :min="30" :max="3600" :step="30" controls-position="right" class="w100" />
                            <div class="form-tip">秒</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="条数阈值" prop="threshold">
                            <el-input-number v-model="state.ruleForm.threshold" :min="1" :max="100000" controls-position="right" class="w100" />
                            <div class="form-tip">窗口内命中条数</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="告警级别" prop="severity">
                            <el-select v-model="state.ruleForm.severity" class="w100">
                                <el-option label="紧急" :value="1" />
                                <el-option label="警告" :value="2" />
                                <el-option label="提醒" :value="3" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="告警冷却" prop="cooldownSec">
                            <el-input-number v-model="state.ruleForm.cooldownSec" :min="0" :max="86400" controls-position="right" class="w100" />
                            <div class="form-tip">秒，重复通知间隔</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="按主机告警" prop="groupByHost">
                            <el-switch v-model="state.ruleForm.groupByHost" inline-prompt active-text="分别" inactive-text="汇总" active-value="1" inactive-value="0" />
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
                    title="规则保存后由日志告警评估器每分钟评估一次，可在列表页「试算」立即验证当前条件"
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

<script setup lang="ts" name="logsAlertDialog">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useLogsApi } from '/@/api/logs';
import { useMonitorApi } from '/@/api/monitor';
import { RowLogAlertRuleType } from '/@/types/views';
import { channelTypeName } from '/@/views/monitor/channel/dict';

const logsApi = useLogsApi();
const monitorApi = useMonitorApi();

const emit = defineEmits(['refresh']);

const alertDialogFormRef = ref();
const channelList = ref<any[]>([]);
const hostOptions = ref<string[]>([]);
const sourceOptions = ref<string[]>([]);
const submitting = ref(false);

const levels = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];

const rules = reactive({
    name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
    windowSec: [{ required: true, message: '请输入统计时间窗', trigger: 'blur' }],
    threshold: [{ required: true, message: '请输入条数阈值', trigger: 'blur' }],
    severity: [{ required: true, message: '请选择告警级别', trigger: 'change' }],
});

const initState = {
    id: 0,
    name: '',
    selector: '',
    host: '',
    source: '',
    keyword: '',
    level: 'ERROR',
    windowSec: 300,
    threshold: 10,
    severity: 2,
    cooldownSec: 300,
    muted: '0',
    channelIds: [] as number[],
    groupByHost: '1',
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
    // 标签取值依赖 Loki 已有数据，取不到时仍可手工输入
    ['host', 'source'].forEach(async (label) => {
        try {
            const res = await logsApi.getLabelValues({ label });
            if (res && res.code == 200) {
                if (label === 'host') hostOptions.value = res.data || [];
                else sourceOptions.value = res.data || [];
            }
        } catch (error) {
            // 忽略
        }
    });
};

const openDialog = (type: string, row?: RowLogAlertRuleType) => {
    if (type === 'edit' && row) {
        state.ruleForm = {
            ...row,
            channelIds: (row.channelIds || '')
                .split(',')
                .filter(Boolean)
                .map((id) => Number(id.trim())),
        } as any;
        state.dialog.title = '编辑日志告警规则';
    } else {
        state.ruleForm = { ...initState, channelIds: [] };
        state.dialog.title = '添加日志告警规则';
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
        await alertDialogFormRef.value?.validate();
    } catch (error) {
        return;
    }

    const submitData: Record<string, any> = {
        ...state.ruleForm,
        channelIds: (state.ruleForm.channelIds || []).join(','),
    };
    submitting.value = true;
    try {
        if (state.dialog.type === 'add') {
            delete submitData.id;
            await logsApi.addAlert(submitData);
            ElMessage.success('添加成功');
        } else {
            await logsApi.updateAlert(submitData);
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
