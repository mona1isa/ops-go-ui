<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <template #header>
                    <div class="card-header">
                        <span>快速执行</span>
                        <el-button text type="primary" @click="router.push({ path: '/taskOrchestration/taskExecution/record' })">
                            <el-icon><ele-Document /></el-icon>
                            查看执行记录
                        </el-button>
                    </div>
                </template>
                <el-form label-width="100px">
                    <el-form-item label="执行类型">
                        <el-radio-group v-model="execForm.type">
                            <el-radio :label="1">执行命令</el-radio>
                            <el-radio :label="2">执行脚本</el-radio>
                            <el-radio :label="3">分发文件</el-radio>
                            <el-radio :label="5">任务编排</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-if="execForm.type === 1" label="命令内容">
                        <el-input v-model="execForm.content" type="textarea" :rows="3" placeholder="请输入要执行的命令" />
                    </el-form-item>
                    <el-form-item v-if="execForm.type === 2" label="选择脚本">
                        <el-select v-model="execForm.scriptId" placeholder="选择现有脚本（可选）" clearable style="width: 100%; margin-bottom: 8px" @change="onScriptChange">
                            <el-option v-for="s in scriptList" :key="s.id" :label="s.name" :value="s.id" />
                        </el-select>
                        <el-input v-model="execForm.content" type="textarea" :rows="5" placeholder="请输入脚本内容" />
                    </el-form-item>
                    <template v-if="execForm.type === 3">
                        <el-form-item label="选择文件">
                            <el-select v-model="execForm.srcPath" placeholder="请选择已上传的文件" clearable style="width: 100%; margin-bottom: 8px">
                                <el-option v-for="f in localFileList" :key="f.path" :label="`${f.name} (${formatFileSize(f.size)})`" :value="f.path" />
                            </el-select>
                            <el-upload
                                action="/api/file/local/upload"
                                :headers="{ Authorization: Session.get('token') || '' }"
                                :show-file-list="false"
                                :on-success="onUploadSuccess"
                                :on-error="onUploadError"
                                accept="*"
                            >
                                <el-button type="primary" size="small">
                                    <el-icon><ele-Upload /></el-icon>
                                    上传新文件到服务器
                                </el-button>
                            </el-upload>
                        </el-form-item>
                        <el-form-item label="目标路径">
                            <el-input v-model="execForm.destPath" placeholder="远程主机的目标路径，如 /opt/app/config.yml" />
                        </el-form-item>
                    </template>
                    <el-form-item v-if="execForm.type === 5" label="选择编排">
                        <el-select v-model="execForm.pipelineId" placeholder="请选择任务编排" clearable style="width: 100%">
                            <el-option v-for="p in pipelineList" :key="p.id" :label="p.name" :value="p.id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="选择主机">
                        <el-select v-model="execForm.instanceIds" multiple placeholder="选择目标主机" style="width: 100%">
                            <el-option v-for="ins in instanceList" :key="ins.id" :label="`${ins.name} (${ins.ip})`" :value="ins.id" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="超时时间">
                        <el-input-number v-model="execForm.timeout" :min="10" :max="3600" :step="30" />
                        <span class="ml10" style="color: #909399">秒</span>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="onQuickExecute" :loading="execLoading">
                            <el-icon><ele-VideoPlay /></el-icon>
                            执行
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts" name="taskExecutionIndex">
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTaskExecutionApi } from '/@/api/taskExecution';
import { useInstanceApi } from '/@/api/instance';
import { useScriptApi } from '/@/api/script';
import { useFileApi } from '/@/api/file';
import { useTaskPipelineApi } from '/@/api/taskPipeline';
import { Session } from '/@/utils/storage';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const taskExecutionApi = useTaskExecutionApi();
const instanceApi = useInstanceApi();
const scriptApi = useScriptApi();
const fileApi = useFileApi();
const pipelineApi = useTaskPipelineApi();
const execLoading = ref(false);
const instanceList = ref<any[]>([]);
const scriptList = ref<any[]>([]);
const localFileList = ref<any[]>([]);
const pipelineList = ref<any[]>([]);

const execForm = reactive({
    type: 1,
    content: '',
    scriptLang: 'shell',
    scriptId: null as number | null,
    srcPath: '',
    destPath: '',
    instanceIds: [] as number[],
    keyId: 0,
    timeout: 300,
    name: '',
    pipelineId: null as number | null,
});

const loadInstances = async () => {
    const res = await instanceApi.getInstanceList({});
    if (res && res.code === 200) {
        instanceList.value = res.data || [];
    }
};

const loadScripts = async () => {
    const res = await scriptApi.getScriptPage({ pageNum: 1, pageSize: 999 });
    if (res && res.code === 200) {
        scriptList.value = res.data || [];
    }
};

const loadLocalFiles = async () => {
    const res = await fileApi.getLocalFiles();
    if (res && res.code === 200) {
        localFileList.value = res.data || [];
    }
};

const loadPipelines = async () => {
    const res = await pipelineApi.getList({ pageNum: 1, pageSize: 999 });
    if (res && res.code === 200) {
        pipelineList.value = res.data || [];
    }
};

const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
};

const onUploadSuccess = (res: any) => {
    if (res && res.code === 200) {
        ElMessage.success('上传成功');
        execForm.srcPath = res.data.path;
        loadLocalFiles();
    } else {
        ElMessage.error(res?.msg || '上传失败');
    }
};

const onUploadError = () => {
    ElMessage.error('上传失败');
};

const onScriptChange = (scriptId: number | null) => {
    if (scriptId) {
        const selected = scriptList.value.find((s: any) => s.id === scriptId);
        if (selected) {
            execForm.content = selected.content || '';
        }
    }
};

const onQuickExecute = async () => {
    if (execForm.instanceIds.length === 0) {
        ElMessage.warning('请选择目标主机');
        return;
    }
    if (execForm.type === 1 && !execForm.content) {
        ElMessage.warning('请输入命令内容');
        return;
    }
    if (execForm.type === 2 && !execForm.content) {
        ElMessage.warning('请输入脚本内容');
        return;
    }
    if (execForm.type === 3 && (!execForm.srcPath || !execForm.destPath)) {
        ElMessage.warning('请输入文件路径');
        return;
    }
    if (execForm.type === 5 && !execForm.pipelineId) {
        ElMessage.warning('请选择任务编排');
        return;
    }

    try {
        await ElMessageBox.confirm(`确定要在 ${execForm.instanceIds.length} 台主机上执行吗？`, '确认执行', {
            confirmButtonText: '执行',
            cancelButtonText: '取消',
            type: 'warning',
        });
    } catch {
        return;
    }

    execLoading.value = true;
    try {
        let res;
        if (execForm.type === 5) {
            res = await taskExecutionApi.pipelineExecute({
                pipelineId: execForm.pipelineId,
                instanceIds: execForm.instanceIds,
                keyId: execForm.keyId,
            });
        } else {
            res = await taskExecutionApi.quickExecute(execForm);
        }
        if (res && res.code === 200) {
            ElMessage.success('任务已创建，跳转到执行记录');
            router.push({ path: '/taskOrchestration/taskExecution/record', query: { autoRefresh: 'true', timeout: String(execForm.timeout) } });
        } else {
            ElMessage.error(res?.msg || '执行失败');
        }
    } catch (error) {
        ElMessage.error('请求失败');
    } finally {
        execLoading.value = false;
    }
};

onMounted(() => {
    loadInstances();
    loadScripts();
    loadLocalFiles();
    loadPipelines();
});
</script>

<style scoped lang="scss">
.layout-padding-view {
    overflow-y: auto;
}

:deep(.el-card) {
    display: flex;
    flex-direction: column;
}

:deep(.el-card__body) {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
