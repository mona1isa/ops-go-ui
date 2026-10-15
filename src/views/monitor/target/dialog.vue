<template>
    <div class="monitor-target-dialog-container">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.visible" width="620px">
            <el-form ref="targetDialogFormRef" :rules="rules" :model="state.ruleForm" label-width="110px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="监控主机" prop="instanceId">
                            <el-select
                                v-model="state.ruleForm.instanceId"
                                :disabled="state.dialog.type === 'edit'"
                                placeholder="请选择主机"
                                filterable
                                class="w100"
                                @change="onInstanceChange">
                                <el-option
                                    v-for="item in instanceList"
                                    :key="item.id"
                                    :label="`${item.name} (${item.ip})`"
                                    :value="item.id"
                                />
                            </el-select>
                            <div v-if="state.dialog.type === 'edit'" class="form-tip">如需更换主机，请删除该目标后重新添加</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="采集凭证" prop="keyId">
                            <el-select
                                v-model="state.ruleForm.keyId"
                                :disabled="!state.ruleForm.instanceId"
                                :loading="keysLoading"
                                :placeholder="state.ruleForm.instanceId ? '请选择凭证' : '请先选择监控主机'"
                                class="w100">
                                <el-option label="自动选择" :value="0" />
                                <el-option
                                    v-for="item in keyList"
                                    :key="item.id"
                                    :label="`${item.name}（${item.user}）`"
                                    :value="item.id"
                                />
                            </el-select>
                            <div v-if="state.ruleForm.instanceId && !keysLoading && keyList.length === 0" class="form-tip">该主机暂未绑定可用凭证，请选择“自动选择”或先到主机管理绑定凭证</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="采集间隔" prop="intervalSec">
                            <el-input-number v-model="state.ruleForm.intervalSec" :min="15" :max="3600" controls-position="right" class="w100" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="采集超时" prop="timeoutSec">
                            <el-input-number v-model="state.ruleForm.timeoutSec" :min="1" :max="300" controls-position="right" class="w100" />
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

<script setup lang="ts" name="monitorTargetDialog">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useMonitorApi } from '/@/api/monitor';
import { useInstanceApi } from '/@/api/instance';
import { RowMonitorTargetType } from '/@/types/views';

const monitorApi = useMonitorApi();
const instanceApi = useInstanceApi();

const emit = defineEmits(['refresh']);

const targetDialogFormRef = ref();
const instanceList = ref<any[]>([]);
// 凭证列表随所选主机联动，仅展示该主机已绑定的可用凭证
const keyList = ref<any[]>([]);
const keysLoading = ref(false);

const rules = reactive({
    instanceId: [{ required: true, message: '请选择监控主机', trigger: 'change' }],
    intervalSec: [{ required: true, message: '请输入采集间隔', trigger: 'blur' }],
    timeoutSec: [{ required: true, message: '请输入采集超时', trigger: 'blur' }],
});

const initState = {
    id: 0,
    instanceId: undefined as number | undefined,
    keyId: 0,
    intervalSec: 60,
    timeoutSec: 15,
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

// 加载所选主机已绑定的凭证；keepKey 用于编辑场景保留主机已解绑的原凭证展示
const loadInstanceKeys = async (instanceId?: number, keepKey?: number) => {
    if (!instanceId) {
        keyList.value = [];
        return;
    }
    keysLoading.value = true;
    try {
        const res = await monitorApi.getTargetInstanceKeys({ instanceId });
        if (res && res.code == 200) {
            keyList.value = res.data || [];
        }
    } catch (error) {
        // 凭证列表加载失败时保持为空，仍可提交“自动选择”
    } finally {
        keysLoading.value = false;
    }
    if (keepKey && !keyList.value.some((item) => item.id === keepKey)) {
        keyList.value = [...keyList.value, { id: keepKey, name: `原凭证（已不绑定该主机）`, user: `#${keepKey}` }];
    }
};

// 切换主机后原凭证选择失效，重置为自动选择并按新主机拉取凭证
const onInstanceChange = () => {
    state.ruleForm.keyId = 0;
    loadInstanceKeys(state.ruleForm.instanceId);
};

const initOptions = async () => {
    try {
        const res = await instanceApi.getInstanceList({});
        if (res && res.code == 200) {
            instanceList.value = res.data || [];
        }
    } catch (error) {
        // 主机列表加载失败
    }
};

const openDialog = (type: string, row?: RowMonitorTargetType) => {
    if (type === 'edit' && row) {
        state.ruleForm = {
            id: row.id,
            instanceId: row.instanceId,
            keyId: row.keyId ?? 0,
            intervalSec: row.intervalSec,
            timeoutSec: row.timeoutSec,
            enabled: row.enabled,
            remark: row.remark,
        };
        state.dialog.title = '编辑采集目标';
    } else {
        state.ruleForm = { ...initState };
        state.dialog.title = '添加采集目标';
    }
    state.dialog.visible = true;
    state.dialog.type = type;
    initOptions();
    loadInstanceKeys(state.ruleForm.instanceId, type === 'edit' ? state.ruleForm.keyId : undefined);
};

const onCancel = () => {
    state.dialog.visible = false;
};

const onSubmit = async () => {
    try {
        await targetDialogFormRef.value?.validate();
        const submitData: Record<string, any> = { ...state.ruleForm };
        if (state.dialog.type === 'add') {
            delete submitData.id;
            await monitorApi.addTarget(submitData);
            ElMessage.success('添加成功');
        } else {
            await monitorApi.updateTarget(submitData);
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
