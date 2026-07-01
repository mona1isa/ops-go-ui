<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <template #header>
                    <div class="card-header">
                        <span>
                            执行记录
                            <el-tag v-if="refreshTimer" size="small" type="warning" class="ml10">自动刷新中</el-tag>
                        </span>
                        <el-button text type="primary" @click="router.push({ path: '/taskOrchestration/taskExecution' })">
                            <el-icon><ele-VideoPlay /></el-icon>
                            快速执行
                        </el-button>
                    </div>
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
                <el-table-column prop="instanceIp" label="IP" width="150" />
                <el-table-column prop="status" label="状态" width="90">
                    <template #default="scope">
                        <el-tag :type="getHostStatusTag(scope.row.status)">{{ getHostStatusLabel(scope.row.status) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="duration" label="耗时" width="100">
                    <template #default="scope">
                        {{ formatDuration(scope.row.duration) }}
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
                            <el-table-column prop="status" label="状态" width="90">
                                <template #default="scope">
                                    <el-tag :type="getHostStatusTag(scope.row.status)" size="small">{{ getHostStatusLabel(scope.row.status) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="duration" label="耗时" width="100">
                                <template #default="scope">
                                    {{ formatDuration(scope.row.duration) }}
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

<script setup lang="ts" name="taskExecutionRecord">
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTaskExecutionApi } from '/@/api/taskExecution';
import { formatDate } from '/@/utils/formatTime';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const taskExecutionApi = useTaskExecutionApi();
const detailVisible = ref(false);
const activeStepNames = ref<number[]>([]);

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

const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '-';
    if (ms < 1000) return ms + 'ms';
    const seconds = ms / 1000;
    if (seconds < 60) return seconds.toFixed(1) + 's';
    const minutes = seconds / 60;
    if (minutes < 60) return minutes.toFixed(1) + 'min';
    const hours = minutes / 60;
    return hours.toFixed(1) + 'h';
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
    if (!navigator.clipboard) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            ElMessage.success('已复制到剪贴板');
        } catch {
            ElMessage.error('复制失败');
        }
        document.body.removeChild(textarea);
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        ElMessage.success('已复制到剪贴板');
    }).catch(() => {
        ElMessage.error('复制失败');
    });
};

// 自动刷新：页面从快速执行跳转过来后自动启动，每30秒刷新直到所有任务结束或超时
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let refreshStartTime: number = 0;
let refreshTimeoutMs: number = 300000; // 默认5分钟（300秒）
const REFRESH_INTERVAL = 30000; // 30秒刷新间隔

const startAutoRefresh = (timeout: number = 300) => {
    if (refreshTimer) return;
    refreshTimeoutMs = timeout * 1000;
    refreshStartTime = Date.now();
    refreshTimer = setInterval(async () => {
        const elapsed = Date.now() - refreshStartTime;
        // 超过超时时间，做最后一次刷新后停止
        if (elapsed >= refreshTimeoutMs) {
            await getTableData();
            stopAutoRefresh();
            return;
        }
        await getTableData();
        // 所有任务已结束（状态非待执行1、执行中2），停止刷新
        const hasRunning = state.tableData.data.some((row: any) => row.status === 1 || row.status === 2);
        if (!hasRunning) {
            stopAutoRefresh();
        }
    }, REFRESH_INTERVAL);
};

const stopAutoRefresh = () => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
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
            // 取消后检查是否还有执行中的任务，没有则停止刷新
            const hasRunning = state.tableData.data.some((r: any) => r.id !== row.id && (r.status === 1 || r.status === 2));
            if (!hasRunning) {
                stopAutoRefresh();
            }
        } else {
            ElMessage.error(res?.msg || '取消失败');
        }
    } catch {
        // 用户取消
    }
};

// 检查是否有执行中的任务，如果有则自动启动刷新
const checkAndStartAutoRefresh = async () => {
    await getTableData();
    const hasRunning = state.tableData.data.some((row: any) => row.status === 1 || row.status === 2);
    if (hasRunning) {
        startAutoRefresh(300);
    }
};

onMounted(() => {
    // 从快速执行页跳转过来时通过 query 传入超时时间
    const timeoutQuery = router.currentRoute.value.query.timeout;
    const timeout = timeoutQuery ? Number(timeoutQuery) : 300;
    const shouldAutoRefresh = router.currentRoute.value.query.autoRefresh === 'true';

    if (shouldAutoRefresh) {
        startAutoRefresh(timeout);
        getTableData();
    } else {
        checkAndStartAutoRefresh();
    }
});

onUnmounted(() => {
    stopAutoRefresh();
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

.ml10 {
    margin-left: 10px;
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
