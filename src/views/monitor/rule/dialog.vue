<template>
    <div class="monitor-rule-dialog-container">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.visible" width="720px">
            <el-form ref="ruleDialogFormRef" :rules="rules" :model="state.ruleForm" label-width="110px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="规则名称" prop="name">
                            <el-input v-model="state.ruleForm.name" placeholder="请输入规则名称" maxlength="128" class="w100"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="关联指标" prop="metric">
                            <el-select v-model="state.ruleForm.metric" placeholder="展示用，可留空" clearable class="w100">
                                <el-option v-for="m in metricOptions" :key="m.value" :label="m.label" :value="m.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="PromQL" prop="promQl">
                            <el-input v-model="state.ruleForm.promQl" type="textarea" :rows="2" :placeholder="promQlPlaceholder" class="w100"></el-input>
                            <div class="form-tip" v-pre>支持 {{instance}} 占位符，评估时按每台启用主机自动展开；表达式中已写比较符时忽略下方的比较符与阈值。</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="比较符" prop="operator">
                            <el-select v-model="state.ruleForm.operator" class="w100">
                                <el-option v-for="op in operators" :key="op" :label="op" :value="op" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="阈值" prop="threshold">
                            <el-input-number v-model="state.ruleForm.threshold" :precision="2" :step="1" controls-position="right" class="w100" />
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
                        <el-form-item label="持续时长" prop="forSec">
                            <el-input-number v-model="state.ruleForm.forSec" :min="0" :max="86400" controls-position="right" class="w100" />
                            <div class="form-tip">秒，0 表示即时触发</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="告警冷却" prop="cooldownSec">
                            <el-input-number v-model="state.ruleForm.cooldownSec" :min="0" :max="86400" controls-position="right" class="w100" />
                            <div class="form-tip">秒，重复通知间隔</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
                        <el-form-item label="静音" prop="muted">
                            <el-switch v-model="state.ruleForm.muted" inline-prompt active-text="静" inactive-text="常"></el-switch>
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
                            <div v-if="channelList.length === 0" class="form-tip">暂无启用的通知渠道，请先到“通知渠道”页面添加</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8" class="mb20">
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

<script setup lang="ts" name="monitorRuleDialog">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useMonitorApi } from '/@/api/monitor';
import { RowMonitorRuleType } from '/@/types/views';
import { channelTypeName } from '/@/views/monitor/channel/dict';

const monitorApi = useMonitorApi();

const emit = defineEmits(['refresh']);

const ruleDialogFormRef = ref();
const channelList = ref<any[]>([]);

const operators = ['>', '>=', '<', '<=', '==', '!='];

const promQlPlaceholder = '如：ops_cpu_usage_percent{instance="{{instance}}"}';

// 采集面板指标白名单（与后端 datasource/selector.go 保持一致）
const metricOptions = [
    { label: 'CPU使用率(%)', value: 'ops_cpu_usage_percent' },
    { label: '内存使用率(%)', value: 'ops_mem_usage_percent' },
    { label: '1分钟负载', value: 'ops_load1' },
    { label: '运行时长(秒)', value: 'ops_uptime_seconds' },
    { label: '磁盘使用率(%)', value: 'ops_disk_usage_percent' },
    { label: '网络接收(B/s)', value: 'ops_net_receive_bytes_per_second' },
    { label: '网络发送(B/s)', value: 'ops_net_transmit_bytes_per_second' },
];

const rules = reactive({
    name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
    promQl: [{ required: true, message: '请输入 PromQL 表达式', trigger: 'blur' }],
    severity: [{ required: true, message: '请选择告警级别', trigger: 'change' }],
});

const initState = {
    id: 0,
    name: '',
    metric: '',
    promQl: '',
    operator: '>',
    threshold: 90,
    severity: 2,
    forSec: 0,
    cooldownSec: 300,
    muted: '0',
    channelIds: [] as number[],
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

const loadChannelOptions = async () => {
    try {
        const res = await monitorApi.getChannelOptions();
        if (res && res.code == 200) {
            channelList.value = res.data || [];
        }
    } catch (error) {
        // 渠道列表加载失败
    }
};

const openDialog = (type: string, row?: RowMonitorRuleType) => {
    if (type === 'edit' && row) {
        state.ruleForm = {
            ...row,
            channelIds: (row.channelIds || '')
                .split(',')
                .filter(Boolean)
                .map((id) => Number(id.trim())),
        };
        state.dialog.title = '编辑告警规则';
    } else {
        state.ruleForm = { ...initState, channelIds: [] };
        state.dialog.title = '添加告警规则';
    }
    state.dialog.visible = true;
    state.dialog.type = type;
    loadChannelOptions();
};

const onCancel = () => {
    state.dialog.visible = false;
};

const onSubmit = async () => {
    try {
        await ruleDialogFormRef.value?.validate();
        const submitData: Record<string, any> = {
            ...state.ruleForm,
            channelIds: (state.ruleForm.channelIds || []).join(','),
        };
        if (state.dialog.type === 'add') {
            delete submitData.id;
            await monitorApi.addRule(submitData);
            ElMessage.success('添加成功');
        } else {
            await monitorApi.updateRule(submitData);
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

<style scoped lang="scss">
.form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 18px;
}
</style>
