<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view monitor-dashboard">
            <!-- 数据源状态条 -->
            <el-alert
                v-if="statusMessage"
                :title="statusMessage"
                :type="statusReady ? 'info' : 'error'"
                show-icon
                :closable="false"
                class="mb15"
            >
                <template #default>
                    <div class="status-tags">
                        <el-tag :type="status.prometheusReady ? 'success' : 'danger'" size="small">
                            Prometheus {{ status.prometheusReady ? '正常' : '不可用' }}
                        </el-tag>
                        <el-tag :type="status.pushgatewayReady ? 'success' : 'danger'" size="small" class="ml10">
                            Pushgateway {{ status.pushgatewayReady ? '正常' : '不可用' }}
                        </el-tag>
                        <el-tag type="info" size="small" class="ml10">采集目标 {{ status.enabledTargetCount }}/{{ status.targetCount }}</el-tag>
                        <el-tag type="info" size="small" class="ml10">启用规则 {{ status.ruleCount }}</el-tag>
                        <el-tag :type="status.firingCount > 0 ? 'danger' : 'success'" size="small" class="ml10">告警中 {{ status.firingCount }}</el-tag>
                    </div>
                </template>
            </el-alert>

            <!-- 概览卡片 -->
            <el-row :gutter="15" class="overview-row mb15">
                <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
                    <div class="overview-card" :class="{ 'overview-danger': overview.firing > 0 }">
                        <div class="overview-num">{{ overview.firing }}</div>
                        <div class="overview-label">告警中事件</div>
                    </div>
                </el-col>
                <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
                    <div class="overview-card" :class="{ 'overview-warning': overview.pending > 0 }">
                        <div class="overview-num">{{ overview.pending }}</div>
                        <div class="overview-label">待确认告警</div>
                    </div>
                </el-col>
                <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
                    <div class="overview-card" :class="{ 'overview-warning': overview.collectFailed > 0 }">
                        <div class="overview-num">{{ overview.collectFailed }}</div>
                        <div class="overview-label">采集失败目标</div>
                    </div>
                </el-col>
                <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
                    <div class="overview-card">
                        <div class="overview-num">{{ overview.enabledTargets }}</div>
                        <div class="overview-label">启用的采集目标</div>
                    </div>
                </el-col>
            </el-row>

            <!-- 工具栏 -->
            <el-card shadow="hover" class="mb15">
                <div class="toolbar">
                    <span class="toolbar-label">主机</span>
                    <el-select v-model="selectedHost" placeholder="选择主机" filterable style="width: 220px" :disabled="hosts.length === 0" @change="onHostChange">
                        <el-option v-for="h in hosts" :key="h" :label="h" :value="h" />
                    </el-select>
                    <el-radio-group v-model="rangeHours" class="ml15" @change="loadRange">
                        <el-radio-button :value="0.5">30分钟</el-radio-button>
                        <el-radio-button :value="1">1小时</el-radio-button>
                        <el-radio-button :value="6">6小时</el-radio-button>
                        <el-radio-button :value="24">24小时</el-radio-button>
                        <el-radio-button :value="168">7天</el-radio-button>
                    </el-radio-group>
                    <el-select v-if="subLabelOptions.length > 0" v-model="selectedSubLabel" placeholder="分区/网卡" clearable class="ml15" style="width: 180px" @change="loadRange">
                        <el-option label="全部" value="" />
                        <el-option v-for="opt in subLabelOptions" :key="opt" :label="opt" :value="opt" />
                    </el-select>
                    <div class="toolbar-right">
                        <span class="toolbar-label">自动刷新</span>
                        <el-switch v-model="autoRefresh" class="ml5" />
                        <el-button size="default" plain type="primary" class="ml15" :loading="loading" @click="refreshAll">
                            <el-icon>
                                <ele-Refresh />
                            </el-icon>
                            刷新
                        </el-button>
                    </div>
                </div>
            </el-card>

            <!-- 指标卡片 -->
            <el-row :gutter="15" class="mb15">
                <template v-if="snapshot.series.length > 0">
                    <el-col v-for="card in metricCards" :key="card.metric" :xs="12" :sm="8" :md="8" :lg="4" :xl="4" class="mb15">
                        <div class="metric-card" :class="{ 'metric-card-active': activeMetric === card.metric }" @click="onPickMetric(card.metric)">
                            <div class="metric-name">{{ card.name }}</div>
                            <template v-if="card.kind === 'single'">
                                <div class="metric-value" :style="{ color: card.color }">{{ card.display }}</div>
                                <el-progress v-if="card.isPercent" :percentage="Math.min(card.raw, 100)" :stroke-width="6" :show-text="false" :color="card.color" class="mt5" />
                            </template>
                            <template v-else>
                                <div v-for="row in card.rows" :key="row.label" class="metric-multi-row">
                                    <span class="metric-multi-label">{{ row.label }}</span>
                                    <span class="metric-multi-value">{{ row.display }}</span>
                                </div>
                            </template>
                        </div>
                    </el-col>
                </template>
                <el-col v-else :span="24">
                    <el-empty :description="snapshot.message || '暂无监控数据，请先在“采集目标”中添加主机并等待采集'" />
                </el-col>
            </el-row>

            <!-- 趋势图 -->
            <el-card shadow="hover" v-auths="['monitor:dashboard:range']">
                <div class="chart-title">{{ currentMetricLabel }}趋势（{{ rangeLabel }}）</div>
                <div ref="trendRef" class="trend-chart"></div>
                <div v-if="rangeEmpty" class="chart-empty">所选时间范围内暂无数据</div>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts" name="monitorDashboardIndex">
import { computed, markRaw, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { storeToRefs } from 'pinia';
import { useTagsViewRoutes } from '/@/stores/tagsViewRoutes';
import { useMonitorApi } from '/@/api/monitor';
import { MonitorDatasourceStatusType, MonitorOverviewType, MonitorMetricSeries } from '/@/types/views';

const monitorApi = useMonitorApi();

const trendRef = ref();
const storesTagsViewRoutes = useTagsViewRoutes();
const { isTagsViewCurrenFull } = storeToRefs(storesTagsViewRoutes);

// 指标中文名与展示规则（与后端 datasource/selector.go 白名单一致）
const METRIC_META: Record<string, { name: string; unit: string; kind: 'percent' | 'number' | 'duration' | 'rate'; labelKey?: string }> = {
    ops_cpu_usage_percent: { name: 'CPU使用率', unit: '%', kind: 'percent' },
    ops_mem_usage_percent: { name: '内存使用率', unit: '%', kind: 'percent' },
    ops_load1: { name: '1分钟负载', unit: '', kind: 'number' },
    ops_uptime_seconds: { name: '运行时长', unit: '', kind: 'duration' },
    ops_disk_usage_percent: { name: '磁盘使用率', unit: '%', kind: 'percent', labelKey: 'mountpoint' },
    ops_net_receive_bytes_per_second: { name: '网络接收', unit: 'B/s', kind: 'rate', labelKey: 'device' },
    ops_net_transmit_bytes_per_second: { name: '网络发送', unit: 'B/s', kind: 'rate', labelKey: 'device' },
};

const CARD_ORDER = ['ops_cpu_usage_percent', 'ops_mem_usage_percent', 'ops_load1', 'ops_uptime_seconds', 'ops_disk_usage_percent', 'ops_net_receive_bytes_per_second', 'ops_net_transmit_bytes_per_second'];

const state = reactive({
    global: {
        trendChart: null,
        dispose: [null, '', undefined],
    } as any,
});

const status = reactive<MonitorDatasourceStatusType>({
    prometheusUrl: '',
    pushgatewayUrl: '',
    prometheusReady: false,
    pushgatewayReady: false,
    targetCount: 0,
    enabledTargetCount: 0,
    ruleCount: 0,
    firingCount: 0,
    metricNames: [],
    message: '',
});

const overview = reactive<MonitorOverviewType>({
    firing: 0,
    pending: 0,
    collectFailed: 0,
    enabledTargets: 0,
});

const hosts = ref<string[]>([]);
const selectedHost = ref('');
const rangeHours = ref(1);
const autoRefresh = ref(true);
const loading = ref(false);
const activeMetric = ref('ops_cpu_usage_percent');
const selectedSubLabel = ref('');
const rangeEmpty = ref(false);

const snapshot = reactive({
    series: [] as MonitorMetricSeries[],
    message: '',
});

let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 从 503 等错误中提取后端中文诊断
const extractErrorMsg = (error: any, fallback: string) => error?.response?.data?.msg || fallback;

const statusMessage = computed(() => status.message || (status.prometheusReady ? '' : '监控数据源状态获取失败'));

const statusReady = computed(() => status.prometheusReady && status.pushgatewayReady);

const rangeLabel = computed(() => {
    const map: Record<number, string> = { 0.5: '最近30分钟', 1: '最近1小时', 6: '最近6小时', 24: '最近24小时', 168: '最近7天' };
    return map[rangeHours.value] || '';
});

// 指标卡片：单值类一张卡，磁盘/网络按标签聚合成多行卡片
type MetricCard = {
    metric: string;
    name: string;
    kind: 'single' | 'multi';
    isPercent: boolean;
    display: string;
    raw: number;
    color: string;
    rows: { label: string; display: string }[];
};

const formatValue = (metric: string, value: number): string => {
    const meta = METRIC_META[metric];
    if (!meta) return String(value);
    if (meta.kind === 'duration') {
        const days = Math.floor(value / 86400);
        const hours = Math.floor((value % 86400) / 3600);
        return days > 0 ? `${days}天${hours}小时` : `${hours}小时`;
    }
    if (meta.kind === 'rate') {
        if (value >= 1048576) return (value / 1048576).toFixed(2) + ' MB/s';
        if (value >= 1024) return (value / 1024).toFixed(2) + ' KB/s';
        return value.toFixed(0) + ' B/s';
    }
    if (meta.kind === 'percent') return value.toFixed(1) + ' %';
    return value.toFixed(2);
};

const percentColor = (metric: string, value: number) => {
    if (metric.includes('cpu') || metric.includes('mem') || metric.includes('disk')) {
        if (value >= 90) return 'var(--el-color-danger)';
        if (value >= 75) return 'var(--el-color-warning)';
    }
    return 'var(--el-color-success)';
};

const metricCards = computed<MetricCard[]>(() => {
    const byMetric: Record<string, MonitorMetricSeries[]> = {};
    snapshot.series.forEach((s) => {
        (byMetric[s.metric] = byMetric[s.metric] || []).push(s);
    });
    return CARD_ORDER.filter((m) => byMetric[m]).map((metric) => {
        const meta = METRIC_META[metric];
        const seriesList = byMetric[metric];
        if (meta.labelKey) {
            return {
                metric,
                name: meta.name,
                kind: 'multi' as const,
                isPercent: meta.kind === 'percent',
                display: '',
                raw: 0,
                color: '',
                rows: seriesList.map((s) => ({
                    label: s.labels?.[meta.labelKey!] || '未知',
                    display: formatValue(metric, s.points[0]?.value ?? 0),
                })),
            };
        }
        const raw = seriesList[0].points[0]?.value ?? 0;
        return {
            metric,
            name: meta.name,
            kind: 'single' as const,
            isPercent: meta.kind === 'percent',
            display: formatValue(metric, raw),
            raw,
            color: meta.kind === 'percent' ? percentColor(metric, raw) : 'var(--el-color-primary)',
            rows: [],
        };
    });
});

const currentMetricLabel = computed(() => METRIC_META[activeMetric.value]?.name || activeMetric.value);

// 磁盘/网络指标提供分区/网卡次级筛选
const subLabelOptions = computed(() => {
    const meta = METRIC_META[activeMetric.value];
    if (!meta?.labelKey) return [];
    const set = new Set<string>();
    snapshot.series.filter((s) => s.metric === activeMetric.value).forEach((s) => {
        const label = s.labels?.[meta.labelKey!];
        if (label) set.add(label);
    });
    return Array.from(set);
});

const onPickMetric = (metric: string) => {
    activeMetric.value = metric;
    selectedSubLabel.value = '';
    loadRange();
};

const onHostChange = () => {
    loadInstant();
    loadRange();
};

const loadStatus = async () => {
    try {
        const res = await monitorApi.getMetricsStatus();
        if (res && res.code == 200) {
            Object.assign(status, res.data);
        }
    } catch (error) {
        status.message = extractErrorMsg(error, '监控数据源状态获取失败');
        status.prometheusReady = false;
    }
};

const loadOverview = async () => {
    try {
        const res = await monitorApi.getMetricsOverview();
        if (res && res.code == 200) {
            Object.assign(overview, res.data);
        }
    } catch (error) {
        // 概览数字静默失败，状态条已呈现异常
    }
};

const loadHosts = async () => {
    try {
        const res = await monitorApi.getMetricsHosts();
        if (res && res.code == 200) {
            hosts.value = res.data || [];
            if (hosts.value.length > 0 && !hosts.value.includes(selectedHost.value)) {
                selectedHost.value = hosts.value[0];
            }
        }
    } catch (error) {
        hosts.value = [];
        snapshot.message = extractErrorMsg(error, '主机列表获取失败');
    }
};

const loadInstant = async () => {
    snapshot.message = '';
    if (!selectedHost.value) {
        snapshot.series = [];
        return;
    }
    try {
        const res = await monitorApi.getMetricsInstant({ instance: selectedHost.value });
        if (res && res.code == 200) {
            snapshot.series = res.data?.metrics || [];
            snapshot.message = res.data?.missing ? res.data.message : '';
        }
    } catch (error) {
        snapshot.series = [];
        snapshot.message = extractErrorMsg(error, '指标快照获取失败');
    }
};

const loadRange = async () => {
    rangeEmpty.value = false;
    if (!selectedHost.value) return initTrendChart([]);
    const end = Math.floor(Date.now() / 1000);
    const start = end - Math.floor(rangeHours.value * 3600);
    const param: Record<string, any> = {
        metric: activeMetric.value,
        instance: selectedHost.value,
        startAt: start,
        endAt: end,
    };
    const meta = METRIC_META[activeMetric.value];
    if (meta?.labelKey && selectedSubLabel.value) {
        if (meta.labelKey === 'mountpoint') param.mountpoint = selectedSubLabel.value;
        if (meta.labelKey === 'device') param.device = selectedSubLabel.value;
    }
    try {
        const res = await monitorApi.getMetricsRange(param);
        if (res && res.code == 200) {
            const series = res.data || [];
            rangeEmpty.value = series.length === 0 || series.every((s: MonitorMetricSeries) => !s.points || s.points.length === 0);
            initTrendChart(series);
        }
    } catch (error) {
        rangeEmpty.value = true;
        initTrendChart([]);
    }
};

// 趋势图（生命周期处理与 home 页一致）
const initTrendChart = (series: MonitorMetricSeries[]) => {
    nextTick(() => {
        if (!trendRef.value) return;
        if (!state.global.dispose.some((b: any) => b === state.global.trendChart)) state.global.trendChart.dispose();
        state.global.trendChart = markRaw(echarts.init(trendRef.value));

        const chartSeries = (series || []).map((s) => ({
            name: s.labels?.[METRIC_META[s.metric]?.labelKey ?? ''] || s.name,
            type: 'line',
            smooth: true,
            showSymbol: false,
            areaStyle: { opacity: 0.15 },
            data: (s.points || []).map((p) => [p.timestamp * 1000, p.value]),
        }));

        state.global.trendChart.setOption({
            grid: { top: 40, right: 20, bottom: 30, left: 60 },
            tooltip: { trigger: 'axis' },
            legend: { data: chartSeries.map((s) => s.name), top: 5 },
            xAxis: { type: 'time', axisLabel: { fontSize: 11 } },
            yAxis: {
                type: 'value',
                name: METRIC_META[activeMetric.value]?.unit || '',
                splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f5f5f5' } },
                axisLabel: {
                    formatter: (val: number) => {
                        const meta = METRIC_META[activeMetric.value];
                        if (meta?.kind === 'rate') {
                            if (val >= 1048576) return (val / 1048576).toFixed(1) + 'M';
                            if (val >= 1024) return (val / 1024).toFixed(1) + 'K';
                        }
                        return String(val);
                    },
                },
            },
            series: chartSeries,
        });
    });
};

const handleChartResize = () => {
    state.global.trendChart?.resize();
};

watch(isTagsViewCurrenFull, () => {
    setTimeout(handleChartResize, 300);
});

// 自动刷新：只刷快照与统计，趋势图仅在手动刷新/切换条件时重绘
const tick = () => {
    if (!autoRefresh.value) return;
    loadStatus();
    loadOverview();
    loadInstant();
};

const refreshAll = async () => {
    loading.value = true;
    try {
        await Promise.all([loadStatus(), loadOverview(), loadHosts(), loadInstant()]);
        await loadRange();
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    window.addEventListener('resize', handleChartResize);
    await loadStatus();
    await loadOverview();
    await loadHosts();
    if (selectedHost.value) {
        await loadInstant();
    }
    await loadRange();
    refreshTimer = setInterval(tick, 30000);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleChartResize);
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
    if (state.global.trendChart) {
        state.global.trendChart.dispose();
        state.global.trendChart = null;
    }
});
</script>

<style scoped lang="scss">
.monitor-dashboard {
    overflow-y: auto;
}

.status-tags {
    margin-top: 6px;
}

.overview-row {
    .overview-card {
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 6px;
        padding: 16px;
        text-align: center;

        .overview-num {
            font-size: 28px;
            font-weight: 600;
            color: var(--el-color-primary);
        }

        .overview-label {
            margin-top: 4px;
            font-size: 13px;
            color: var(--el-text-color-secondary);
        }

        &.overview-danger .overview-num {
            color: var(--el-color-danger);
        }

        &.overview-warning .overview-num {
            color: var(--el-color-warning);
        }
    }
}

.toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;

    .toolbar-label {
        font-size: 13px;
        color: var(--el-text-color-regular);
    }

    .toolbar-right {
        margin-left: auto;
        display: flex;
        align-items: center;
    }
}

.metric-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 12px;
    cursor: pointer;
    background: var(--el-bg-color);
    transition: box-shadow 0.2s;
    min-height: 96px;

    &:hover {
        box-shadow: var(--el-box-shadow-light);
    }

    &.metric-card-active {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }

    .metric-name {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
    }

    .metric-value {
        font-size: 22px;
        font-weight: 600;
    }

    .metric-multi-row {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        line-height: 20px;

        .metric-multi-label {
            color: var(--el-text-color-secondary);
            max-width: 60%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .metric-multi-value {
            font-weight: 600;
        }
    }
}

.chart-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
}

.trend-chart {
    height: 320px;
    width: 100%;
}

.chart-empty {
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: -320px;
    line-height: 320px;
    pointer-events: none;
}
</style>
