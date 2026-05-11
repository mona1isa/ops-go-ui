<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <!-- 快速执行区域 -->
            <el-card shadow="hover" class="mb15">
                <template #header>
                    <span>快速执行</span>
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

            <!-- 执行记录 -->
            <el-card shadow="hover">
                <template #header>
                    <span>执行记录</span>
                </template>
                <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                    <el-table-column prop="executionNo" label="执行编号" width="200" show-overflow-tooltip />
                    <el-table-column prop="name" label="名称" show-overflow-tooltip />
                    <el-table-column prop="type" label="类型" width="120">
                        <template #default="scope">
                            <el-tag :type="getExecTypeTag(scope.row.type)" type="small">{{ getExecTypeLabel(scope.row.type) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="120">
                        <template #default="scope">
                            <el-tag :type="getStatusTag(scope.row.status)" type="small">{{ getStatusLabel(scope.row.status) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="totalHosts" label="主机数" width="80" />
                    <el-table-column prop="successHosts" label="成功" width="60">
                        <template #default="scope">
                            <span style="color: #67c23a">{{ scope.row.successHosts }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="failHosts" label="失败" width="60">
                        <template #default="scope">
                            <span style="color: #f56c6c">{{ scope.row.failHosts }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="userName" label="执行人" width="90" />
                    <el-table-column prop="createdAt" label="时间" width="165" show-overflow-tooltip>
                        <template #default="scope">
                            {{ scope.row.createdAt ? formatDate(new Date(scope.row.createdAt), 'YYYY-mm-dd HH:MM:SS') : '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120">
                        <template #default="scope">
                            <el-button size="small" text type="primary" @click="onViewDetail(scope.row)">详情</el-button>
                            <el-button size="small" text type="warning" @click="onCancel(scope.row)" v-if="scope.row.status === 1 || scope.row.status === 2">取消</el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <el-pagination
                    @size-change="onHandleSizeChange"
                    @current-change="onHandleCurrentChange"
                    class="mt15"
                    :pager-count="5"
                    :page-sizes="[10, 20, 30]"
                    v-model:current-page="state.tableData.param.pageNum"
                    background
                    v-model:page-size="state.tableData.param.pageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="state.tableData.total"
                />
            </el-card>
        </div>

        <!-- 执行详情对话框 -->
        <el-dialog v-model="detailVisible" title="执行详情" width="900px">
            <el-descriptions :column="3" border class="mb15">
                <el-descriptions-item label="执行编号">{{ detailData.execution?.executionNo }}</el-descriptions-item>
                <el-descriptions-item label="名称">{{ detailData.execution?.name }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="getStatusTag(detailData.execution?.status)">{{ getStatusLabel(detailData.execution?.status) }}</el-tag>
                </el-descriptions-item>
            </el-descriptions>

            <!-- 非编排执行：直接展示主机结果 -->
            <el-table v-if="detailData.execution?.type !== 5" :data="detailData.hosts" style="width: 100%" max-height="400">
                <el-table-column prop="instanceName" label="主机" width="100" />
                <el-table-column prop="instanceIp" label="IP" width="120" />
                <el-table-column prop="status" label="状态" width="70">
                    <template #default="scope">
                        <el-tag :type="getHostStatusTag(scope.row.status)">{{ getHostStatusLabel(scope.row.status) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="duration" label="耗时" width="80">
                    <template #default="scope">
                        {{ scope.row.duration > 0 ? scope.row.duration + 'ms' : '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="结果" min-width="200">
                    <template #default="scope">
                        <div v-if="scope.row.result" class="output-block">
                            <div class="output-header">
                                <el-tag size="small" type="success">输出</el-tag>
                                <el-button size="small" text type="primary" @click="copyText(scope.row.result)">复制</el-button>
                            </div>
                            <pre class="output-pre">{{ scope.row.result }}</pre>
                        </div>
                        <div v-if="scope.row.errorMsg" class="output-block mt5">
                            <div class="output-header">
                                <el-tag size="small" type="danger">错误</el-tag>
                                <el-button size="small" text type="primary" @click="copyText(scope.row.errorMsg)">复制</el-button>
                            </div>
                            <pre class="output-pre error-pre">{{ scope.row.errorMsg }}</pre>
                        </div>
                        <span v-if="!scope.row.result && !scope.row.errorMsg" style="color: #909399">-</span>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 编排执行：按步骤展示 -->
            <div v-else>
                <el-collapse v-model="activeStepNames">
                    <el-collapse-item v-for="(item, index) in detailData.steps" :key="index" :name="index">
                        <template #title>
                            <div class="step-title">
                                <span class="step-name">{{ item.step?.stepName }}</span>
                                <el-tag :type="getStepStatusTag(item.step?.status)" size="small">{{ getStepStatusLabel(item.step?.status) }}</el-tag>
                                <span class="step-time" v-if="item.step?.startedAt">{{ item.step?.startedAt }} ~ {{ item.step?.finishedAt || '执行中' }}</span>
                            </div>
                        </template>
                        <el-table :data="item.hosts" style="width: 100%" max-height="300" size="small">
                            <el-table-column prop="instanceName" label="主机" width="100" />
                            <el-table-column prop="instanceIp" label="IP" width="120" />
                            <el-table-column prop="status" label="状态" width="70">
                                <template #default="scope">
                                    <el-tag :type="getHostStatusTag(scope.row.status)" size="small">{{ getHostStatusLabel(scope.row.status) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="duration" label="耗时" width="80">
                                <template #default="scope">
                                    {{ scope.row.duration > 0 ? scope.row.duration + 'ms' : '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="结果" min-width="200">
                                <template #default="scope">
                                    <div v-if="scope.row.result" class="output-block">
                                        <div class="output-header">
                                            <el-tag size="small" type="success">输出</el-tag>
                                            <el-button size="small" text type="primary" @click="copyText(scope.row.result)">复制</el-button>
                                        </div>
                                        <pre class="output-pre">{{ scope.row.result }}</pre>
                                    </div>
                                    <div v-if="scope.row.errorMsg" class="output-block mt5">
                                        <div class="output-header">
                                            <el-tag size="small" type="danger">错误</el-tag>
                                            <el-button size="small" text type="primary" @click="copyText(scope.row.errorMsg)">复制</el-button>
                                        </div>
                                        <pre class="output-pre error-pre">{{ scope.row.errorMsg }}</pre>
                                    </div>
                                    <span v-if="!scope.row.result && !scope.row.errorMsg" style="color: #909399">-</span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-collapse-item>
                </el-collapse>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="taskExecutionIndex">
import { reactive, ref, onMounted } from 'vue';
import { useTaskExecutionApi } from '/@/api/taskExecution';
import { useInstanceApi } from '/@/api/instance';
import { useScriptApi } from '/@/api/script';
import { useFileApi } from '/@/api/file';
import { useTaskPipelineApi } from '/@/api/taskPipeline';
import { Session } from '/@/utils/storage';
import { formatDate } from '/@/utils/formatTime';
import { ElMessage, ElMessageBox } from 'element-plus';

const taskExecutionApi = useTaskExecutionApi();
const instanceApi = useInstanceApi();
const scriptApi = useScriptApi();
const fileApi = useFileApi();
const pipelineApi = useTaskPipelineApi();
const execLoading = ref(false);
const detailVisible = ref(false);
const activeStepNames = ref<number[]>([]);
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

const detailData = reactive({
    execution: null as any,
    hosts: [] as any[],
    steps: [] as any[],
});

const state = reactive<any>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: {
            pageNum: 1,
            pageSize: 10,
            status: null,
            type: null,
        },
    },
});

const getExecTypeLabel = (type: number) => {
    const map: Record<number, string> = { 1: '快速命令', 2: '快速脚本', 3: '快速文件', 4: '模板执行', 5: '编排执行' };
    return map[type] || '未知';
};

const getExecTypeTag = (type: number): any => {
    const map: Record<number, any> = { 1: 'success', 2: 'warning', 3: 'info', 4: '', 5: 'danger' };
    return map[type] || 'info';
};

const getStatusLabel = (status: number) => {
    const map: Record<number, string> = { 1: '待执行', 2: '执行中', 3: '已完成', 4: '部分失败', 5: '全部失败', 6: '已取消' };
    return map[status] || '未知';
};

const getStatusTag = (status: number): any => {
    const map: Record<number, any> = { 1: 'info', 2: 'warning', 3: 'success', 4: 'danger', 5: 'danger', 6: 'info' };
    return map[status] || 'info';
};

const getHostStatusLabel = (status: number) => {
    const map: Record<number, string> = { 1: '待执行', 2: '执行中', 3: '成功', 4: '失败', 5: '超时', 6: '跳过' };
    return map[status] || '未知';
};

const getHostStatusTag = (status: number): any => {
    const map: Record<number, any> = { 1: 'info', 2: 'warning', 3: 'success', 4: 'danger', 5: 'danger', 6: 'info' };
    return map[status] || 'info';
};

const getStepStatusLabel = (status: number) => {
    const map: Record<number, string> = { 1: '待执行', 2: '执行中', 3: '成功', 4: '失败', 5: '跳过' };
    return map[status] || '未知';
};

const getStepStatusTag = (status: number): any => {
    const map: Record<number, any> = { 1: 'info', 2: 'warning', 3: 'success', 4: 'danger', 5: 'info' };
    return map[status] || 'info';
};

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

const getTableData = async () => {
    state.tableData.loading = true;
    const res = await taskExecutionApi.getList(state.tableData.param);
    if (res && res.code === 200) {
        state.tableData.data = res.data;
        state.tableData.total = res.total;
    }
    state.tableData.loading = false;
};

const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
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
            ElMessage.success('任务已创建');
            getTableData();
        } else {
            ElMessage.error(res?.msg || '执行失败');
        }
    } catch (error) {
        ElMessage.error('请求失败');
    } finally {
        execLoading.value = false;
    }
};

const onViewDetail = async (row: any) => {
    const res = await taskExecutionApi.getDetail({ executionId: row.id });
    if (res && res.code === 200) {
        detailData.execution = res.data.execution;
        detailData.hosts = res.data.hosts || [];
        detailData.steps = res.data.steps || [];
        detailVisible.value = true;
    }
};

const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        ElMessage.success('已复制到剪贴板');
    }).catch(() => {
        ElMessage.error('复制失败');
    });
};

const onCancel = async (row: any) => {
    try {
        await ElMessageBox.confirm('确定要取消该执行任务吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        });
        const res = await taskExecutionApi.cancelExecution({ executionId: row.id });
        if (res && res.code === 200) {
            ElMessage.success('已取消');
            getTableData();
        } else {
            ElMessage.error(res?.msg || '取消失败');
        }
    } catch {
        // 用户取消
    }
};

onMounted(() => {
    loadInstances();
    loadScripts();
    loadLocalFiles();
    loadPipelines();
    getTableData();
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

.output-block {
    background: #f5f7fa;
    border-radius: 4px;
    padding: 8px;
}

.output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.output-pre {
    margin: 0;
    padding: 8px;
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
}

.error-pre {
    color: #f56c6c;
}

.mt5 {
    margin-top: 5px;
}

.step-title {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding-right: 20px;
}

.step-name {
    font-weight: 500;
    min-width: 120px;
}

.step-time {
    color: #909399;
    font-size: 12px;
    margin-left: auto;
}
</style>
