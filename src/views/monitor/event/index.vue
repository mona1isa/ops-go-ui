<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
            <div class="app-search mb15">
                <el-select v-model="state.tableData.param.ruleId" size="default" placeholder="告警规则" style="max-width: 200px" clearable filterable>
                    <el-option v-for="item in ruleList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
                <el-select v-model="state.tableData.param.severity" size="default" placeholder="级别" style="max-width: 110px; margin-left: 10px;" clearable>
                    <el-option label="紧急" :value="1" />
                    <el-option label="警告" :value="2" />
                    <el-option label="提醒" :value="3" />
                </el-select>
                <el-select v-model="state.tableData.param.status" size="default" placeholder="事件状态" style="max-width: 130px; margin-left: 10px;" clearable>
                    <el-option label="待确认" :value="1" />
                    <el-option label="告警中" :value="2" />
                    <el-option label="已恢复" :value="3" />
                </el-select>
                <el-input v-model="state.tableData.param.instanceIp" size="default" placeholder="主机IP" style="max-width: 150px; margin-left: 10px" clearable></el-input>
                <el-date-picker
                    v-model="timeRange"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 340px; margin-left: 10px"
                />

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
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="70" />
                <el-table-column prop="ruleName" label="规则名称" min-width="140" show-overflow-tooltip></el-table-column>
                <el-table-column prop="instanceIp" label="主机IP" width="120"></el-table-column>
                <el-table-column prop="severity" label="级别" width="80">
                    <template #default="scope">
                        <el-tag :type="severityTag(scope.row.severity)" size="small">{{ severityName(scope.row.severity) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="触发值/阈值" width="120">
                    <template #default="scope">{{ formatNum(scope.row.value) }} / {{ formatNum(scope.row.threshold) }}</template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="90">
                    <template #default="scope">
                        <el-tag :type="statusTag(scope.row.status)" size="small">{{ statusName(scope.row.status) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="summary" label="告警摘要" min-width="180" show-overflow-tooltip></el-table-column>
                <el-table-column prop="firedAt" label="触发时间" width="160">
                    <template #default="scope">{{ scope.row.firedAt ? dayjs(scope.row.firedAt).format('YYYY-MM-DD HH:mm:ss') : '—' }}</template>
                </el-table-column>
                <el-table-column prop="resolvedAt" label="恢复时间" width="160">
                    <template #default="scope">{{ scope.row.resolvedAt ? dayjs(scope.row.resolvedAt).format('YYYY-MM-DD HH:mm:ss') : '—' }}</template>
                </el-table-column>
                <el-table-column prop="notifyCount" label="通知" width="70">
                    <template #default="scope">{{ scope.row.notifyCount }}</template>
                </el-table-column>
                <el-table-column prop="suppressed" label="抑制" width="70">
                    <template #default="scope">
                        <el-tag v-if="scope.row.suppressed > 0" type="info" size="small">{{ scope.row.suppressed }}</el-tag>
                        <span v-else>0</span>
                    </template>
                </el-table-column>
                <el-table-column label="最近通知" width="110">
                    <template #default="scope">
                        <el-tooltip v-if="scope.row.lastNotify" :content="notifyTooltip(scope.row.lastNotify)" placement="top">
                            <el-tag :type="scope.row.lastNotify.success === 1 ? 'success' : 'danger'" size="small">
                                {{ scope.row.lastNotify.channelName }} {{ scope.row.lastNotify.success === 1 ? '成功' : '失败' }}
                            </el-tag>
                        </el-tooltip>
                        <span v-else>—</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="170" fixed="right">
                    <template #default="scope">
                        <el-button size="small" text type="primary" v-auths="['monitor:event:detail']" @click="onOpenDetail(scope.row)">详情</el-button>
                        <el-button size="small" text type="warning" v-auths="['monitor:event:ack']" @click="onOpenAck(scope.row)">处理</el-button>
                        <el-button size="small" text type="danger" v-auths="['monitor:event:delete']" @click="onRowDel(scope.row)">删除</el-button>
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
            <EventDetail ref="eventDetailRef" />

            <!-- 事件处理 -->
            <el-dialog v-model="ackDialog.visible" title="处理告警事件" width="460px">
                <div class="mb15">{{ ackDialog.summary }}</div>
                <el-form label-width="90px">
                    <el-form-item label="处理动作">
                        <el-select v-model="ackDialog.action" class="w100">
                            <el-option label="确认" value="确认" />
                            <el-option label="已处理" value="已处理" />
                            <el-option label="误报忽略" value="误报忽略" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="处理备注">
                        <el-input v-model="ackDialog.remark" type="textarea" :rows="3" maxlength="500" placeholder="可留空"></el-input>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="ackDialog.visible = false">取消</el-button>
                    <el-button type="primary" @click="submitAck">确定</el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts" name="monitorEventIndex">
import { defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { useMonitorApi } from '/@/api/monitor';
import { MonitorEventState, RowMonitorEventType, RowMonitorNotifyLogType } from '/@/types/views';
import { ElMessage, ElMessageBox, dayjs } from 'element-plus';

// 引入组件
const EventDetail = defineAsyncComponent(() => import('/@/views/monitor/event/detail.vue'));

const monitorApi = useMonitorApi();

const eventDetailRef = ref();
const ruleList = ref<any[]>([]);
const timeRange = ref<[string, string] | null>(null);

const ackDialog = reactive({
    visible: false,
    id: 0,
    summary: '',
    action: '确认',
    remark: '',
});

const state = reactive<MonitorEventState>({
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

const severityName = (severity: number) => {
    const names: Record<number, string> = { 1: '紧急', 2: '警告', 3: '提醒' };
    return names[severity] || '未知';
};

const severityTag = (severity: number) => {
    const tags: Record<number, string> = { 1: 'danger', 2: 'warning', 3: 'info' };
    return tags[severity] || 'info';
};

const statusName = (status: number) => {
    const names: Record<number, string> = { 1: '待确认', 2: '告警中', 3: '已恢复' };
    return names[status] || '未知';
};

const statusTag = (status: number) => {
    const tags: Record<number, string> = { 1: 'warning', 2: 'danger', 3: 'success' };
    return tags[status] || 'info';
};

const formatNum = (val: number) => (val === null || val === undefined ? '—' : Number(val.toFixed(2)));

const notifyTooltip = (log: RowMonitorNotifyLogType) => {
    const base = `${log.channelName} · ${dayjs(log.createdAt).format('MM-DD HH:mm:ss')}`;
    return log.success === 1 ? `${base} · HTTP ${log.statusCode}` : `${base} · ${log.errorMsg || 'HTTP ' + log.statusCode}`;
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
    state.tableData.param.ruleId = undefined;
    state.tableData.param.severity = undefined;
    state.tableData.param.status = undefined;
    state.tableData.param.instanceIp = '';
    timeRange.value = null;
    state.tableData.param.pageNum = 1;
    getTableData();
};

// 初始化表格数据（monitor 分页接口：data 为数组、total 在顶层）
const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const param: Record<string, any> = { ...buildQuery(state.tableData.param) };
        if (timeRange.value && timeRange.value.length === 2) {
            param.startAt = timeRange.value[0];
            param.endAt = timeRange.value[1];
        }
        const res = await monitorApi.getEventPage(param);
        if (res && res.code == 200) {
            state.tableData.data = res.data || [];
            state.tableData.total = res.total || 0;
        }
    } finally {
        state.tableData.loading = false;
    }
};

// 规则下拉（用于按规则筛选）
const loadRuleList = async () => {
    try {
        const res = await monitorApi.getRulePage({ pageNum: 1, pageSize: 200 });
        if (res && res.code == 200) {
            ruleList.value = res.data || [];
        }
    } catch (error) {
        // 无规则列表权限时隐藏该筛选项
    }
};

onMounted(() => {
    getTableData();
    loadRuleList();
});

const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

const onOpenDetail = (row: RowMonitorEventType) => {
    eventDetailRef.value.openDrawer(row);
};

const onOpenAck = (row: RowMonitorEventType) => {
    ackDialog.id = row.id;
    ackDialog.summary = row.summary || `事件 #${row.id}`;
    ackDialog.action = '确认';
    ackDialog.remark = '';
    ackDialog.visible = true;
};

const submitAck = async () => {
    const res = await monitorApi.ackEvent({
        id: ackDialog.id,
        action: ackDialog.action,
        remark: ackDialog.remark,
    });
    if (res && res.code == 200) {
        ElMessage.success('处理成功');
        ackDialog.visible = false;
        getTableData();
    }
};

const onRowDel = (row: RowMonitorEventType) => {
    ElMessageBox.confirm(`此操作将删除告警事件 #${row.id}（${row.ruleName}），是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            monitorApi.deleteEvent({ id: row.id }).then((res) => {
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
