<template>
    <div class="record-page layout-pd">
        <!-- 统计卡片 -->
        <el-row :gutter="15" class="mb15">
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
                <div class="stat-card stat-card-primary">
                    <div class="stat-card-content">
                        <div class="stat-card-num">{{ state.stats.totalSessions }}</div>
                        <div class="stat-card-label">总会话数</div>
                    </div>
                    <div class="stat-card-icon">
                        <el-icon :size="40"><ele-Document /></el-icon>
                    </div>
                </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
                <div class="stat-card stat-card-success">
                    <div class="stat-card-content">
                        <div class="stat-card-num">{{ state.stats.activeSessions }}</div>
                        <div class="stat-card-label">进行中</div>
                    </div>
                    <div class="stat-card-icon">
                        <el-icon :size="40"><ele-Connection /></el-icon>
                    </div>
                </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
                <div class="stat-card stat-card-warning">
                    <div class="stat-card-content">
                        <div class="stat-card-num">{{ formatDuration(state.stats.totalDuration) }}</div>
                        <div class="stat-card-label">总会话时长</div>
                    </div>
                    <div class="stat-card-icon">
                        <el-icon :size="40"><ele-Clock /></el-icon>
                    </div>
                </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
                <div class="stat-card stat-card-info">
                    <div class="stat-card-content">
                        <div class="stat-card-num">{{ formatDuration(state.stats.averageDuration) }}</div>
                        <div class="stat-card-label">平均时长</div>
                    </div>
                    <div class="stat-card-icon">
                        <el-icon :size="40"><ele-Timer /></el-icon>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- 筛选区域 -->
        <div class="filter-section mb15">
            <el-input
                v-model="state.queryForm.instanceName"
                placeholder="主机名称"
                clearable
                style="width: 150px"
                @keyup.enter="handleQuery"
            />
            <el-input
                v-model="state.queryForm.instanceIp"
                placeholder="主机 IP"
                clearable
                style="width: 150px"
                class="ml10"
                @keyup.enter="handleQuery"
            />
            <el-input
                v-model="state.queryForm.keyUser"
                placeholder="用户名"
                clearable
                style="width: 120px"
                class="ml10"
                @keyup.enter="handleQuery"
            />
            <el-date-picker
                v-model="state.dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 340px"
                class="ml10"
            />
            <el-button type="primary" class="ml10" @click="handleQuery">
                <el-icon><ele-Search /></el-icon>
                查询
            </el-button>
            <el-button @click="handleReset">
                <el-icon><ele-Refresh /></el-icon>
                重置
            </el-button>
        </div>

        <!-- 录像卡片列表 -->
        <div class="record-cards" v-loading="state.loading">
            <el-row :gutter="15">
                <el-col
                    :xs="24"
                    :sm="12"
                    :md="8"
                    :lg="6"
                    v-for="record in state.tableData"
                    :key="record.id"
                    class="mb15"
                >
                    <div class="record-card" :class="`record-card-${getStatusType(record.status)}`">
                        <div class="record-card-header">
                            <div class="record-card-title">
                                <el-icon><ele-Monitor /></el-icon>
                                <span class="ml5">{{ record.instanceName }}</span>
                            </div>
                            <el-tag :type="getStatusTagType(record.status)" size="small">
                                {{ getStatusText(record.status) }}
                            </el-tag>
                        </div>
                        <div class="record-card-body">
                            <div class="record-card-info">
                                <div class="info-item">
                                    <el-icon><ele-Location /></el-icon>
                                    <span>{{ record.instanceIp }}</span>
                                </div>
                                <div class="info-item">
                                    <el-icon><ele-User /></el-icon>
                                    <span>{{ record.keyUser }}</span>
                                </div>
                            </div>
                            <div class="record-card-time">
                                <div class="time-item">
                                    <span class="time-label">开始:</span>
                                    <span>{{ formatTime(record.startTime) }}</span>
                                </div>
                                <div class="time-item">
                                    <span class="time-label">时长:</span>
                                    <span class="duration">{{ formatDuration(record.duration) }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="record-card-footer">
                            <el-button type="primary" size="small" text @click="handlePlayback(record)">
                                <el-icon><ele-VideoPlay /></el-icon>
                                回放
                            </el-button>
                            <el-button type="success" size="small" text @click="handleDownload(record)">
                                <el-icon><ele-Download /></el-icon>
                                下载
                            </el-button>
                            <el-button type="danger" size="small" text @click="handleDelete(record)">
                                <el-icon><ele-Delete /></el-icon>
                                删除
                            </el-button>
                        </div>
                    </div>
                </el-col>
            </el-row>

            <!-- 空状态 -->
            <el-empty v-if="!state.loading && state.tableData.length === 0" description="暂无会话录像" />
        </div>

        <!-- 分页 -->
        <el-pagination
            v-model:current-page="state.pageNum"
            v-model:page-size="state.pageSize"
            :page-sizes="[12, 24, 48, 96]"
            :total="state.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleQuery"
            @current-change="handleQuery"
            class="pagination"
            background
        />

        <!-- 回放对话框 -->
        <PlaybackDialog
            :visible="state.showPlaybackDialog"
            :record-id="state.selectedRecordId"
            @close="handleClosePlayback"
        />
    </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTerminalRecordApi } from '/@/api/terminal/record';
import PlaybackDialog from './playback.vue';

const recordApi = useTerminalRecordApi();

const state = reactive({
    loading: false,
    tableData: [] as any[],
    queryForm: {
        instanceName: '',
        instanceIp: '',
        keyUser: '',
    },
    dateRange: [] as string[],
    pageNum: 1,
    pageSize: 12,
    total: 0,
    showPlaybackDialog: false,
    selectedRecordId: undefined as number | undefined,
    stats: {
        totalSessions: 0,
        activeSessions: 0,
        totalDuration: 0,
        averageDuration: 0,
    },
});

// 获取统计数据
const getStatistics = async () => {
    try {
        const res = await recordApi.getStatistics();
        if (res && res.code === 200) {
            state.stats = res.data || state.stats;
        }
    } catch (error) {
        console.error('获取统计数据失败', error);
    }
};

// 查询录像列表
const handleQuery = async () => {
    state.loading = true;
    try {
        const params = {
            ...state.queryForm,
            startTime: state.dateRange[0] || '',
            endTime: state.dateRange[1] || '',
            page: state.pageNum,
            pageSize: state.pageSize,
        };
        const res = await recordApi.getRecordPage(params);
        if (res && res.code === 200) {
            state.tableData = res.data.list || [];
            state.total = res.data.total || 0;
        }
    } catch (error) {
        ElMessage.error('获取录像列表失败');
    } finally {
        state.loading = false;
    }
};

// 重置查询条件
const handleReset = () => {
    state.queryForm = {
        instanceName: '',
        instanceIp: '',
        keyUser: '',
    };
    state.dateRange = [];
    state.pageNum = 1;
    handleQuery();
};

// 回放
const handlePlayback = (row: any) => {
    state.selectedRecordId = row.id;
    state.showPlaybackDialog = true;
};

// 关闭回放
const handleClosePlayback = () => {
    state.showPlaybackDialog = false;
    state.selectedRecordId = undefined;
};

// 下载
const handleDownload = async (row: any) => {
    try {
        ElMessage.info('正在下载录像文件...');
        const res = await recordApi.getRecordDownloadUrl(row.id);
        const blob = new Blob([res.data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `session-${row.sessionId || row.id}.cast`;
        link.click();
        URL.revokeObjectURL(url);
        ElMessage.success('下载成功');
    } catch (error) {
        ElMessage.error('下载失败');
    }
};

// 删除
const handleDelete = (row: any) => {
    ElMessageBox.confirm(`确定要删除该录像吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        try {
            const res = await recordApi.deleteRecord(row.id);
            if (res && res.code === 200) {
                ElMessage.success('删除成功');
                handleQuery();
                getStatistics();
            } else {
                ElMessage.error(res?.message || '删除失败');
            }
        } catch (error) {
            ElMessage.error('删除失败');
        }
    }).catch(() => {});
};

// 格式化时间
const formatTime = (time: string) => {
    if (!time) return '-';
    return time.substring(0, 16).replace('T', ' ');
};

// 格式化时长
const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0秒';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}时${minutes}分${secs}秒`;
    } else if (minutes > 0) {
        return `${minutes}分${secs}秒`;
    } else {
        return `${secs}秒`;
    }
};

// 获取状态类型
const getStatusType = (status: number) => {
    switch (status) {
        case 1: return 'active';
        case 2: return 'completed';
        default: return 'error';
    }
};

// 获取状态标签类型
const getStatusTagType = (status: number) => {
    switch (status) {
        case 1: return 'success';
        case 2: return 'info';
        default: return 'danger';
    }
};

// 获取状态文本
const getStatusText = (status: number) => {
    switch (status) {
        case 1: return '进行中';
        case 2: return '已结束';
        default: return '异常';
    }
};

// 页面加载时查询数据
onMounted(() => {
    handleQuery();
    getStatistics();
});
</script>

<style scoped lang="scss">
.record-page {
    .stat-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-radius: 8px;
        background: var(--el-color-white);
        border: 1px solid var(--next-border-color-light);
        transition: all 0.3s;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &-content {
            .stat-card-num {
                font-size: 28px;
                font-weight: bold;
                color: var(--el-text-color-primary);
            }
            .stat-card-label {
                font-size: 14px;
                color: var(--el-text-color-secondary);
                margin-top: 5px;
            }
        }

        &-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        &.stat-card-primary .stat-card-icon {
            background: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
        }
        &.stat-card-success .stat-card-icon {
            background: var(--el-color-success-light-9);
            color: var(--el-color-success);
        }
        &.stat-card-warning .stat-card-icon {
            background: var(--el-color-warning-light-9);
            color: var(--el-color-warning);
        }
        &.stat-card-info .stat-card-icon {
            background: var(--el-color-info-light-9);
            color: var(--el-color-info);
        }
    }

    .filter-section {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: 15px;
        background: var(--el-color-white);
        border-radius: 8px;
        border: 1px solid var(--next-border-color-light);
    }

    .record-cards {
        min-height: 300px;
    }

    .record-card {
        background: var(--el-color-white);
        border-radius: 8px;
        border: 1px solid var(--next-border-color-light);
        overflow: hidden;
        transition: all 0.3s;

        &:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }

        &-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            border-bottom: 1px solid var(--next-border-color-light);

            .record-card-title {
                display: flex;
                align-items: center;
                font-weight: 500;
                font-size: 15px;
                color: var(--el-text-color-primary);
            }
        }

        &-body {
            padding: 15px;

            .record-card-info {
                display: flex;
                gap: 20px;
                margin-bottom: 12px;

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 13px;
                    color: var(--el-text-color-secondary);

                    .el-icon {
                        color: var(--el-text-color-placeholder);
                    }
                }
            }

            .record-card-time {
                .time-item {
                    display: flex;
                    align-items: center;
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                    margin-bottom: 5px;

                    .time-label {
                        width: 40px;
                        color: var(--el-text-color-placeholder);
                    }

                    .duration {
                        color: var(--el-color-primary);
                        font-weight: 500;
                    }
                }
            }
        }

        &-footer {
            display: flex;
            justify-content: flex-end;
            padding: 10px 15px;
            border-top: 1px solid var(--next-border-color-light);
            background: var(--next-bg-color);
        }

        // 状态颜色
        &.record-card-active {
            border-left: 3px solid var(--el-color-success);
        }
        &.record-card-completed {
            border-left: 3px solid var(--el-color-info);
        }
        &.record-card-error {
            border-left: 3px solid var(--el-color-danger);
        }
    }

    .pagination {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }
}
</style>
