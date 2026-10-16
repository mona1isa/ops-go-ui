<template>
    <div class="logs-source-dialog-container">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.visible" width="720px">
            <el-form ref="sourceDialogFormRef" :rules="rules" :model="state.ruleForm" label-width="110px">
                <el-row :gutter="35">
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="采集名称" prop="name">
                            <el-input v-model="state.ruleForm.name" placeholder="如：nginx 访问日志" maxlength="128" class="w100" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="采集主机" prop="instanceId">
                            <el-select v-model="state.ruleForm.instanceId" placeholder="请选择主机" filterable class="w100" @change="onInstanceChange">
                                <el-option v-for="item in instanceList" :key="item.id" :label="`${item.name} (${item.ip})`" :value="item.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="采集凭证" prop="keyId">
                            <el-select
                                v-model="state.ruleForm.keyId"
                                :disabled="!state.ruleForm.instanceId"
                                :loading="keysLoading"
                                :placeholder="state.ruleForm.instanceId ? '请选择凭证' : '请先选择采集主机'"
                                class="w100"
                            >
                                <el-option label="自动选择" :value="0" />
                                <el-option v-for="item in keyList" :key="item.id" :label="`${item.name}（${item.user}）`" :value="item.id" />
                            </el-select>
                            <div v-if="state.ruleForm.instanceId && !keysLoading && keyList.length === 0" class="form-tip">该主机暂未绑定可用凭证，请选择“自动选择”或先到主机管理绑定凭证</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="日志路径" prop="path">
                            <el-input v-model="state.ruleForm.path" placeholder="绝对路径，支持通配符，如 /var/log/nginx/access.log 或 /app/logs/*.log" class="w100" />
                            <div class="form-tip">通配符场景下每轮读取最近修改的文件，日志轮转自动跟随；读取需要目标账号对文件有读权限（root 或 adm 组）</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="job 标签" prop="job">
                            <el-input v-model="state.ruleForm.job" placeholder="默认 ops_log" class="w100" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="业务标签" prop="source">
                            <el-input v-model="state.ruleForm.source" placeholder="如 nginx/access，可留空" class="w100" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="附加标签">
                            <div class="label-rows">
                                <div v-for="(item, index) in labelRows" :key="index" class="label-row">
                                    <el-input v-model="item.key" placeholder="标签名" style="width: 160px" />
                                    <el-input v-model="item.value" placeholder="标签值" style="width: 200px" class="ml10" />
                                    <el-button size="small" text type="danger" class="ml10" @click="labelRows.splice(index, 1)">删除</el-button>
                                </div>
                                <el-button size="small" text type="primary" @click="labelRows.push({ key: '', value: '' })">+ 添加标签</el-button>
                            </div>
                            <div class="form-tip">标签名仅允许字母数字下划线；含空格、引号或非 ASCII 的值会被后端丢弃</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
                        <el-form-item label="级别正则" prop="levelRegex">
                            <el-input v-model="state.ruleForm.levelRegex" placeholder='可留空，需含捕获组，如 \[([A-Z]+)\]' class="w100" />
                            <div class="form-tip" v-pre>留空时按内置 ERROR/WARN/INFO 关键字识别；正则首个捕获组的取值会归一化为 FATAL/ERROR/WARN/INFO/DEBUG</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="采集间隔" prop="intervalSec">
                            <el-input-number v-model="state.ruleForm.intervalSec" :min="5" :max="3600" controls-position="right" class="w100" />
                            <div class="form-tip">秒，0 表示使用全局默认</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="拉取超时" prop="timeoutSec">
                            <el-input-number v-model="state.ruleForm.timeoutSec" :min="0" :max="300" controls-position="right" class="w100" />
                            <div class="form-tip">秒，0 表示使用全局默认</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="单轮上限" prop="maxBytes">
                            <el-input-number v-model="state.ruleForm.maxBytes" :min="0" :step="65536" controls-position="right" class="w100" />
                            <div class="form-tip">字节，积压时丢弃最旧内容，0 用全局默认</div>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
                        <el-form-item label="首次回溯" prop="backBytes">
                            <el-input-number v-model="state.ruleForm.backBytes" :min="0" :step="65536" controls-position="right" class="w100" />
                            <div class="form-tip">字节，首次接入只回溯尾部内容，0 用全局默认</div>
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

<script setup lang="ts" name="logsSourceDialog">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useLogsApi } from '/@/api/logs';
import { useInstanceApi } from '/@/api/instance';
import { RowLogSourceType } from '/@/types/views';

const logsApi = useLogsApi();
const instanceApi = useInstanceApi();

const emit = defineEmits(['refresh']);

const sourceDialogFormRef = ref();
const instanceList = ref<any[]>([]);
const keyList = ref<any[]>([]);
const keysLoading = ref(false);
const labelRows = ref<{ key: string; value: string }[]>([]);

const rules = reactive({
    name: [{ required: true, message: '请输入采集名称', trigger: 'blur' }],
    instanceId: [{ required: true, message: '请选择采集主机', trigger: 'change' }],
    path: [{ required: true, message: '请输入日志文件绝对路径', trigger: 'blur' }],
});

const initState = {
    id: 0,
    name: '',
    instanceId: undefined as number | undefined,
    keyId: 0,
    path: '',
    job: 'ops_log',
    source: '',
    levelRegex: '',
    intervalSec: 15,
    timeoutSec: 20,
    maxBytes: 0,
    backBytes: 0,
    enabled: '1',
    remark: '',
};

const state = reactive({
    ruleForm: { ...initState },
    dialog: { visible: false, title: '', type: '' },
});

const loadInstanceKeys = async (instanceId?: number, keepKey?: number) => {
    if (!instanceId) {
        keyList.value = [];
        return;
    }
    keysLoading.value = true;
    try {
        const res = await logsApi.getSourceInstanceKeys({ instanceId });
        if (res && res.code == 200) {
            keyList.value = res.data || [];
        }
    } catch (error) {
        // 凭证列表加载失败时保持为空，仍可提交“自动选择”
    } finally {
        keysLoading.value = false;
    }
    if (keepKey && !keyList.value.some((item) => item.id === keepKey)) {
        keyList.value = [...keyList.value, { id: keepKey, name: '原凭证（已不绑定该主机）', user: `#${keepKey}` }];
    }
};

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

// parseLabels 把后端存储的 JSON 字符串还原成键值行
const parseLabels = (raw: string) => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            return Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
        }
    } catch (error) {
        // 历史数据非法 JSON 时忽略
    }
    return [];
};

const openDialog = (type: string, row?: RowLogSourceType) => {
    if (type === 'edit' && row) {
        state.ruleForm = {
            id: row.id,
            name: row.name,
            instanceId: row.instanceId,
            keyId: row.keyId ?? 0,
            path: row.path,
            job: row.job,
            source: row.source,
            levelRegex: row.levelRegex,
            intervalSec: row.intervalSec,
            timeoutSec: row.timeoutSec,
            maxBytes: row.maxBytes,
            backBytes: row.backBytes,
            enabled: row.enabled,
            remark: row.remark,
        };
        labelRows.value = parseLabels(row.labels);
        state.dialog.title = '编辑采集源';
    } else {
        state.ruleForm = { ...initState };
        labelRows.value = [];
        state.dialog.title = '添加采集源';
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
        await sourceDialogFormRef.value?.validate();
        const labels: Record<string, string> = {};
        labelRows.value.forEach((item) => {
            if (item.key.trim() && item.value.trim()) labels[item.key.trim()] = item.value.trim();
        });
        const submitData: Record<string, any> = { ...state.ruleForm, labels: JSON.stringify(labels) };
        if (state.dialog.type === 'add') {
            delete submitData.id;
            await logsApi.addSource(submitData);
            ElMessage.success('添加成功');
        } else {
            await logsApi.updateSource(submitData);
            ElMessage.success('修改成功');
        }
        state.dialog.visible = false;
        emit('refresh');
    } catch (error) {
        // 表单校验未通过或后端返回错误（拦截器已提示）
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

.label-rows {
    width: 100%;
}

.label-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}
</style>
