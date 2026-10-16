<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <div class="app-search mb15">
                    <el-input v-model="state.tableData.param.name" size="default" placeholder="请输入采集名称" style="max-width: 180px" clearable />
                    <el-input v-model="state.tableData.param.instanceIp" size="default" placeholder="请输入主机IP" style="max-width: 160px; margin-left: 10px" clearable />
                    <el-input v-model="state.tableData.param.path" size="default" placeholder="请输入日志路径" style="max-width: 200px; margin-left: 10px" clearable />
                    <el-select v-model="state.tableData.param.lastStatus" size="default" placeholder="采集状态" style="max-width: 130px; margin-left: 10px" clearable>
                        <el-option label="未采集" :value="0" />
                        <el-option label="成功" :value="1" />
                        <el-option label="失败" :value="2" />
                    </el-select>
                    <el-select v-model="state.tableData.param.enabled" size="default" placeholder="启用状态" style="max-width: 120px; margin-left: 10px" clearable>
                        <el-option label="启用" value="1" />
                        <el-option label="停用" value="0" />
                    </el-select>

                    <el-button size="default" plain type="primary" class="ml10" @click="getTableData()">
                        <el-icon><ele-Search /></el-icon>
                        查询
                    </el-button>
                    <el-button size="default" plain type="info" class="ml10" @click="resetTableData()">
                        <el-icon><ele-Refresh /></el-icon>
                        重置
                    </el-button>
                    <el-button size="default" plain type="success" class="ml10" v-auths="['logs:source:add']" @click="onOpenAdd('add')">
                        <el-icon><ele-FolderAdd /></el-icon>
                        新增采集源
                    </el-button>
                </div>

                <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                    <el-table-column prop="id" label="ID" width="60" />
                    <el-table-column prop="name" label="采集名称" min-width="140" show-overflow-tooltip />
                    <el-table-column prop="instanceIp" label="主机" width="150" show-overflow-tooltip>
                        <template #default="scope">{{ scope.row.instanceName }}（{{ scope.row.instanceIp }}）</template>
                    </el-table-column>
                    <el-table-column prop="path" label="日志路径" min-width="220" show-overflow-tooltip>
                        <template #default="scope">
                            <div>{{ scope.row.path }}</div>
                            <div v-if="scope.row.lastFile && scope.row.lastFile !== scope.row.path" class="sub-tip">实际读取：{{ scope.row.lastFile }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="job" label="标签" width="150" show-overflow-tooltip>
                        <template #default="scope">
                            <el-tag size="small">{{ scope.row.job }}</el-tag>
                            <el-tag v-if="scope.row.source" size="small" type="info" class="ml5">{{ scope.row.source }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="intervalSec" label="间隔" width="80">
                        <template #default="scope">{{ scope.row.intervalSec }} 秒</template>
                    </el-table-column>
                    <el-table-column prop="lastLines" label="上次行数" width="90" />
                    <el-table-column prop="lastPos" label="读取位点" width="110">
                        <template #default="scope">{{ formatBytes(scope.row.lastPos) }}</template>
                    </el-table-column>
                    <el-table-column prop="lastCollectAt" label="最近采集" width="170">
                        <template #default="scope">{{ scope.row.lastCollectAt ? dayjs(scope.row.lastCollectAt).format('YYYY-MM-DD HH:mm:ss') : '—' }}</template>
                    </el-table-column>
                    <el-table-column prop="lastStatus" label="采集状态" width="100">
                        <template #default="scope">
                            <el-tooltip v-if="scope.row.lastStatus === 2 && scope.row.lastError" :content="scope.row.lastError" placement="top">
                                <el-tag type="danger" size="small">失败</el-tag>
                            </el-tooltip>
                            <el-tag v-else-if="scope.row.lastStatus === 1" type="success" size="small">成功</el-tag>
                            <el-tag v-else-if="scope.row.lastStatus === 2" type="danger" size="small">失败</el-tag>
                            <el-tag v-else type="info" size="small">未采集</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="enabled" label="启用" width="80">
                        <template #default="scope">
                            <el-switch
                                v-model="scope.row.enabled"
                                inline-prompt
                                active-text="启"
                                active-value="1"
                                inactive-text="禁"
                                inactive-value="0"
                                v-auths="['logs:source:toggle']"
                                @click="onToggle(scope.row)"
                            />
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="230" fixed="right">
                        <template #default="scope">
                            <el-button size="small" text type="success" v-auths="['logs:source:collect']" :loading="collectingId === scope.row.id" @click="onCollectOnce(scope.row)">拉取</el-button>
                            <el-button size="small" text type="warning" v-auths="['logs:source:reset']" @click="onResetOffset(scope.row)">重置位点</el-button>
                            <el-button size="small" text type="primary" v-auths="['logs:source:edit']" @click="onOpenEdit('edit', scope.row)">修改</el-button>
                            <el-button size="small" text type="danger" v-auths="['logs:source:delete']" @click="onRowDel(scope.row)">删除</el-button>
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
            <SourceDialog ref="sourceDialogRef" @refresh="getTableData()" />
        </div>
    </div>
</template>

<script setup lang="ts" name="logsSourceIndex">
import { defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { useLogsApi } from '/@/api/logs';
import { LogSourceState, RowLogSourceType } from '/@/types/views';

const SourceDialog = defineAsyncComponent(() => import('/@/views/logs/source/dialog.vue'));

const logsApi = useLogsApi();

const sourceDialogRef = ref();
const collectingId = ref<number | null>(null);

const state = reactive<LogSourceState>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: {
            pageNum: 1,
            pageSize: 10,
        },
    },
});

const formatBytes = (value: number) => {
    if (!value) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

// 剔除空筛选字段（后端指针类型字段传空字符串会 400）
const buildQuery = (param: Record<string, any>) => {
    const query: Record<string, any> = {};
    Object.keys(param).forEach((key) => {
        const val = param[key];
        if (val !== undefined && val !== null && val !== '') {
            query[key] = val;
        }
    });
    return query;
};

const resetTableData = () => {
    state.tableData.param.name = '';
    state.tableData.param.instanceIp = '';
    state.tableData.param.path = '';
    state.tableData.param.lastStatus = undefined;
    state.tableData.param.enabled = '';
    state.tableData.param.pageNum = 1;
    getTableData();
};

const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const res = await logsApi.getSourcePage(buildQuery(state.tableData.param));
        if (res && res.code == 200) {
            state.tableData.data = res.data || [];
            state.tableData.total = res.total || 0;
        }
    } finally {
        state.tableData.loading = false;
    }
};

onMounted(() => {
    getTableData();
});

const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

const onToggle = (row: RowLogSourceType) => {
    logsApi.toggleSource({ id: row.id, enabled: row.enabled }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
            getTableData();
        }
    });
};

// 手动拉取一次：同步执行 SSH 增量读取并写入 Loki，用于验证路径与权限
const onCollectOnce = async (row: RowLogSourceType) => {
    if (collectingId.value !== null) return;
    collectingId.value = row.id;
    try {
        const res = await logsApi.collectSource({ id: row.id });
        if (res && res.code == 200) {
            if (res.data?.success) {
                ElMessage.success(res.data?.message ?? '拉取成功');
            } else {
                ElMessageBox.alert(res.data?.message ?? '拉取失败，未返回原因', '拉取失败', {
                    confirmButtonText: '知道了',
                    type: 'error',
                });
            }
        }
    } catch (error: any) {
        if (error?.message) {
            ElMessageBox.alert(error.message, '拉取失败', { confirmButtonText: '知道了', type: 'error' });
        }
    } finally {
        collectingId.value = null;
        getTableData();
    }
};

const onResetOffset = (row: RowLogSourceType) => {
    ElMessageBox.confirm(
        `重置后将从文件末尾重新读取「${row.name}」，历史内容不会重复入库；如需回溯最近内容，请在编辑中设置首次回溯字节。是否继续?`,
        '重置读取位点',
        { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
        .then(() => {
            logsApi.resetSource({ id: row.id }).then((res) => {
                if (res && res.code == 200) {
                    ElMessage.success('位点已重置');
                    getTableData();
                }
            });
        })
        .catch(() => {});
};

const onOpenAdd = (type: string) => {
    sourceDialogRef.value.openDialog(type);
};

const onOpenEdit = (type: string, row: RowLogSourceType) => {
    sourceDialogRef.value.openDialog(type, row);
};

const onRowDel = (row: RowLogSourceType) => {
    ElMessageBox.confirm(`此操作将删除采集源：“${row.name}”，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            logsApi.deleteSource({ id: row.id }).then((res) => {
                if (res && res.code == 200) {
                    ElMessage.success('删除成功');
                    getTableData();
                }
            });
        })
        .catch(() => {});
};
</script>

<style scoped lang="scss">
.layout-padding-view {
    overflow-y: auto;
}

:deep(.el-card) {
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.el-card__body) {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.sub-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}
</style>
