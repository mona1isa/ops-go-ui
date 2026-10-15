<template>
    <el-drawer v-model="drawerVisible" title="告警事件详情" size="45%" :before-close="handleClose">
        <div v-loading="loading" class="event-detail">
            <el-descriptions class="description" :column="1" border size="small">
                <el-descriptions-item label="事件ID:">{{ detailData.id }}</el-descriptions-item>
                <el-descriptions-item label="规则名称:">{{ detailData.ruleName }}</el-descriptions-item>
                <el-descriptions-item label="主机IP:">{{ detailData.instanceIp || '—' }}</el-descriptions-item>
                <el-descriptions-item label="级别:">
                    <el-tag :type="severityTag(detailData.severity)" size="small">{{ severityName(detailData.severity) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="状态:">
                    <el-tag :type="statusTag(detailData.status)" size="small">{{ statusName(detailData.status) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="触发值/阈值:">{{ fmt(detailData.value) }} / {{ fmt(detailData.threshold) }}</el-descriptions-item>
                <el-descriptions-item label="告警摘要:">{{ detailData.summary || '—' }}</el-descriptions-item>
                <el-descriptions-item label="标签集:">{{ detailData.labels || '—' }}</el-descriptions-item>
                <el-descriptions-item label="指纹:">{{ detailData.fingerprint }}</el-descriptions-item>
                <el-descriptions-item label="待确认时间:">{{ fmtTime(detailData.pendingSince) }}</el-descriptions-item>
                <el-descriptions-item label="触发时间:">{{ fmtTime(detailData.firedAt) }}</el-descriptions-item>
                <el-descriptions-item label="恢复时间:">{{ fmtTime(detailData.resolvedAt) }}</el-descriptions-item>
                <el-descriptions-item label="最近通知:">{{ fmtTime(detailData.lastNotifyAt) }}</el-descriptions-item>
                <el-descriptions-item label="通知/抑制次数:">{{ detailData.notifyCount }} / {{ detailData.suppressed }}</el-descriptions-item>
            </el-descriptions>

            <div class="notify-title mt20">通知记录（最多 50 条）</div>
            <el-table :data="notifyLogs" size="small" style="width: 100%">
                <el-table-column prop="channelName" label="渠道" min-width="110" show-overflow-tooltip></el-table-column>
                <el-table-column prop="recovered" label="类型" width="80">
                    <template #default="scope">
                        <el-tag :type="scope.row.recovered === 1 ? 'success' : 'danger'" size="small" effect="plain">
                            {{ scope.row.recovered === 1 ? '恢复' : '触发' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="statusCode" label="HTTP" width="70"></el-table-column>
                <el-table-column prop="success" label="结果" width="70">
                    <template #default="scope">
                        <el-tag :type="scope.row.success === 1 ? 'success' : 'danger'" size="small">
                            {{ scope.row.success === 1 ? '成功' : '失败' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="attempt" label="尝试" width="60"></el-table-column>
                <el-table-column prop="errorMsg" label="失败原因" min-width="120" show-overflow-tooltip>
                    <template #default="scope">{{ scope.row.errorMsg || '—' }}</template>
                </el-table-column>
                <el-table-column prop="createdAt" label="时间" width="150">
                    <template #default="scope">{{ fmtTime(scope.row.createdAt) }}</template>
                </el-table-column>
            </el-table>

            <el-collapse v-if="notifyLogs.length > 0" class="mt15">
                <el-collapse-item v-for="log in notifyLogs" :key="log.id" :title="`#${log.id} ${log.channelName} 报文详情`" :name="log.id">
                    <div class="payload-label">请求体</div>
                    <pre class="payload-block">{{ prettyJson(log.payload) }}</pre>
                    <div class="payload-label">响应体</div>
                    <pre class="payload-block">{{ log.responseBody || '—' }}</pre>
                </el-collapse-item>
            </el-collapse>
        </div>
    </el-drawer>
</template>

<script setup lang="ts" name="monitorEventDetail">
import { ref } from 'vue';
import { dayjs } from 'element-plus';
import { useMonitorApi } from '/@/api/monitor';
import { RowMonitorEventType, RowMonitorNotifyLogType } from '/@/types/views';

const monitorApi = useMonitorApi();

const drawerVisible = ref(false);
const loading = ref(false);
const detailData = ref<Partial<RowMonitorEventType>>({});
const notifyLogs = ref<RowMonitorNotifyLogType[]>([]);

const severityName = (severity?: number) => {
    const names: Record<number, string> = { 1: '紧急', 2: '警告', 3: '提醒' };
    return names[severity ?? 0] || '未知';
};

const severityTag = (severity?: number) => {
    const tags: Record<number, string> = { 1: 'danger', 2: 'warning', 3: 'info' };
    return tags[severity ?? 0] || 'info';
};

const statusName = (status?: number) => {
    const names: Record<number, string> = { 1: '待确认', 2: '告警中', 3: '已恢复' };
    return names[status ?? 0] || '未知';
};

const statusTag = (status?: number) => {
    const tags: Record<number, string> = { 1: 'warning', 2: 'danger', 3: 'success' };
    return tags[status ?? 0] || 'info';
};

const fmt = (val?: number) => (val === null || val === undefined ? '—' : Number(val.toFixed(2)));

const fmtTime = (time: string | null | undefined) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '—');

const prettyJson = (raw: string) => {
    if (!raw) return '—';
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw;
    }
};

const handleClose = (done: () => void) => {
    done();
};

const openDrawer = async (row: RowMonitorEventType) => {
    detailData.value = row;
    notifyLogs.value = [];
    drawerVisible.value = true;
    loading.value = true;
    try {
        const res = await monitorApi.getEventDetail({ id: row.id });
        if (res && res.code == 200) {
            detailData.value = res.data?.event || row;
            notifyLogs.value = res.data?.notifyLogs || [];
        }
    } finally {
        loading.value = false;
    }
};

defineExpose({
    openDrawer,
});
</script>

<style scoped lang="scss">
.event-detail {
    padding: 0 4px;
}

.notify-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.payload-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
}

.payload-block {
    background: var(--next-bg-main-color);
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0 0 10px;
}
</style>
