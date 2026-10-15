<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
            <div class="app-search mb15">
                <el-input v-model="state.tableData.param.name" size="default" placeholder="请输入主机名称" style="max-width: 180px" clearable> </el-input>
                <el-input v-model="state.tableData.param.instanceIp" size="default" placeholder="请输入主机IP" style="max-width: 160px; margin-left: 10px" clearable> </el-input>
                <el-select v-model="state.tableData.param.lastStatus" size="default" placeholder="采集状态" style="max-width: 130px; margin-left: 10px;" clearable>
                    <el-option label="未采集" :value="0" />
                    <el-option label="成功" :value="1" />
                    <el-option label="失败" :value="2" />
                </el-select>
                <el-select v-model="state.tableData.param.enabled" size="default" placeholder="启用状态" style="max-width: 120px; margin-left: 10px;" clearable>
                    <el-option label="启用" value="1" />
                    <el-option label="停用" value="0" />
                </el-select>

                <el-button size="default" plain type="primary" class="ml10" @click="getTableData()">
                    <el-icon>
                        <ele-Search />
                    </el-icon>
                    查询
                </el-button>
                <el-button size="default" plain type="info" class="ml10" @click="resetTableData()">
                    <el-icon>
                        <ele-Refresh />
                    </el-icon>
                    重置
                </el-button>
                <el-button size="default" plain type="success" class="ml10" v-auths="['monitor:target:add']" @click="onOpenAddTarget('add')">
                    <el-icon>
                        <ele-FolderAdd />
                    </el-icon>
                    新增目标
                </el-button>
                <el-button size="default" plain type="warning" class="ml10" v-auths="['monitor:target:sync']" :loading="syncing" @click="onSyncTarget">
                    <el-icon>
                        <ele-Refresh />
                    </el-icon>
                    同步采集目标
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="instanceName" label="主机名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="instanceIp" label="主机IP" width="140" show-overflow-tooltip></el-table-column>
                <el-table-column prop="keyId" label="采集凭证" width="140" show-overflow-tooltip>
                    <template #default="scope">{{ keyName(scope.row.keyId) }}</template>
                </el-table-column>
                <el-table-column prop="intervalSec" label="采集间隔" width="90">
                    <template #default="scope">{{ scope.row.intervalSec }} 秒</template>
                </el-table-column>
                <el-table-column prop="timeoutSec" label="超时" width="80">
                    <template #default="scope">{{ scope.row.timeoutSec }} 秒</template>
                </el-table-column>
                <el-table-column prop="lastCollectAt" label="最近采集" width="200">
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
                <el-table-column prop="enabled" label="启用状态" width="90">
                    <template #default="scope">
                        <el-switch
                            v-model="scope.row.enabled"
                            inline-prompt active-text="启" active-value="1"
                            inactive-text="禁" inactive-value="0"
                            v-auths="['monitor:target:toggle']"
                            @click="onToggle(scope.row)">
                        </el-switch>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" width="190">
                    <template #default="scope">
                        <el-button size="small" text type="success" v-auths="['monitor:target:collect']" :loading="collectingId === scope.row.id" @click="onCollectOnce(scope.row)">采集</el-button>
                        <el-button size="small" text type="primary" v-auths="['monitor:target:edit']" @click="onOpenEditTarget('edit', scope.row)">修改</el-button>
                        <el-button size="small" text type="danger" v-auths="['monitor:target:delete']" @click="onRowDel(scope.row)">删除</el-button>
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
            >
            </el-pagination>
            </el-card>
            <TargetDialog ref="targetDialogRef" @refresh="getTableData()" />
        </div>
    </div>
</template>

<script setup lang="ts" name="monitorTargetIndex">
import { defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { useMonitorApi } from '/@/api/monitor';
import { useKeyApi } from '/@/api/keys';
import { MonitorTargetState, RowMonitorTargetType } from '/@/types/views';
import { ElMessage, ElMessageBox, dayjs } from 'element-plus';

// 引入组件
const TargetDialog = defineAsyncComponent(() => import('/@/views/monitor/target/dialog.vue'));

const monitorApi = useMonitorApi();
const keyApi = useKeyApi();

const targetDialogRef = ref();
const syncing = ref(false);
// 正在手动采集的目标 ID，用于行级按钮 loading
const collectingId = ref<number | null>(null);

// 凭证名称映射（keyId -> name），拉取失败时降级显示 ID
const keyList = ref<any[]>([]);

const loadKeyList = async () => {
    try {
        const res = await keyApi.getAvailableKeysByOsType({ osType: 'Linux' });
        if (res && res.code == 200) {
            keyList.value = res.data || [];
        }
    } catch (error) {
        // 凭证列表拉取失败时降级显示凭证ID
    }
};

const state = reactive<MonitorTargetState>({
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

const keyName = (keyId: number) => {
    if (!keyId) return '自动选择';
    const found = keyList.value.find((item) => item.id === keyId);
    return found ? found.name : `凭证#${keyId}`;
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
    state.tableData.param.lastStatus = undefined;
    state.tableData.param.enabled = '';
    state.tableData.param.pageNum = 1;
    getTableData();
};

// 初始化表格数据（monitor 分页接口：data 为数组、total 在顶层）
const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const res = await monitorApi.getTargetPage(buildQuery(state.tableData.param));
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
    loadKeyList();
});

const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

// 启停目标
const onToggle = (row: RowMonitorTargetType) => {
    monitorApi.toggleTarget({ id: row.id, enabled: row.enabled }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
            getTableData();
        }
    });
};

// 同步采集目标（按主机列表全量补齐）
const onSyncTarget = () => {
    ElMessageBox.confirm('将按当前主机列表自动补齐未配置的采集目标，是否继续?', '同步采集目标', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            syncing.value = true;
            try {
                const res = await monitorApi.syncTarget();
                if (res && res.code == 200) {
                    ElMessage.success(`同步完成，新增 ${res.data?.created ?? 0} 个采集目标`);
                    getTableData();
                }
            } finally {
                syncing.value = false;
            }
        })
        .catch(() => {});
};

// 手动采集一次：同步执行单台 SSH 采集，即时反馈成败与原因，并刷新采集状态列
const onCollectOnce = async (row: RowMonitorTargetType) => {
    if (collectingId.value !== null) return;
    collectingId.value = row.id;
    try {
        const res = await monitorApi.collectTarget({ id: row.id });
        if (res && res.code == 200) {
            if (res.data?.success) {
                ElMessage.success(res.data?.message ?? '采集成功');
            } else {
                ElMessageBox.alert(res.data?.message ?? '采集失败，未返回原因', '采集失败', {
                    confirmButtonText: '知道了',
                    type: 'error',
                });
            }
        }
    } catch (error: any) {
        // HTTP 错误已由请求拦截器提示，这里补充失败原因
        if (error?.message) {
            ElMessageBox.alert(error.message, '采集失败', {
                confirmButtonText: '知道了',
                type: 'error',
            });
        }
    } finally {
        collectingId.value = null;
        getTableData();
    }
};

const onOpenAddTarget = (type: string) => {
    targetDialogRef.value.openDialog(type);
};

const onOpenEditTarget = (type: string, row: RowMonitorTargetType) => {
    targetDialogRef.value.openDialog(type, row);
};

const onRowDel = (row: RowMonitorTargetType) => {
    ElMessageBox.confirm(`此操作将删除采集目标：“${row.instanceName}(${row.instanceIp})”，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            monitorApi.deleteTarget({ id: row.id }).then((res) => {
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
</style>
