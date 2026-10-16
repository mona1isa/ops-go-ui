<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="登录记录" name="list">
                        <div class="app-search mb15">
                            <el-input v-model="state.tableData.param.userName" size="default" placeholder="请输入用户名" style="max-width: 160px" clearable />
                            <el-input v-model="state.tableData.param.ipAddr" size="default" placeholder="请输入来源IP" style="max-width: 160px; margin-left: 10px" clearable />
                            <el-select v-model="state.tableData.param.result" size="default" placeholder="登录结果" style="max-width: 120px; margin-left: 10px" clearable>
                                <el-option label="失败" :value="0" />
                                <el-option label="成功" :value="1" />
                                <el-option label="登出" :value="2" />
                            </el-select>
                            <el-select v-model="state.tableData.param.platform" size="default" placeholder="登录端" style="max-width: 120px; margin-left: 10px" clearable>
                                <el-option label="Web 管理端" value="web" />
                                <el-option label="SSH 堡垒机" value="bastion" />
                            </el-select>
                            <el-date-picker
                                v-model="timeRange"
                                type="datetimerange"
                                range-separator="至"
                                start-placeholder="开始时间"
                                end-placeholder="结束时间"
                                value-format="YYYY-MM-DD HH:mm:ss"
                                style="width: 340px; margin-left: 10px"
                            />
                            <el-button size="default" plain type="primary" class="ml10" @click="onSearch">
                                <el-icon><ele-Search /></el-icon>
                                查询
                            </el-button>
                            <el-button size="default" plain type="info" class="ml10" @click="resetTableData">
                                <el-icon><ele-Refresh /></el-icon>
                                重置
                            </el-button>
                        </div>

                        <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                            <el-table-column prop="id" label="ID" width="70" />
                            <el-table-column prop="createdAt" label="时间" width="165">
                                <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
                            </el-table-column>
                            <el-table-column prop="userName" label="用户名" min-width="120" show-overflow-tooltip />
                            <el-table-column prop="result" label="结果" width="90">
                                <template #default="scope">
                                    <el-tag :type="resultTag(scope.row.result)" size="small">{{ resultName(scope.row.result) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="reason" label="失败原因" min-width="170" show-overflow-tooltip>
                                <template #default="scope">{{ scope.row.reason || '—' }}</template>
                            </el-table-column>
                            <el-table-column prop="ipAddr" label="来源IP" width="135" show-overflow-tooltip />
                            <el-table-column prop="location" label="归属" width="140" show-overflow-tooltip>
                                <template #default="scope">{{ scope.row.location || '—' }}</template>
                            </el-table-column>
                            <el-table-column prop="platform" label="登录端" width="100">
                                <template #default="scope">
                                    <el-tag :type="scope.row.platform === 'bastion' ? 'warning' : 'info'" size="small">{{ platformName(scope.row.platform) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="browser" label="客户端" min-width="150" show-overflow-tooltip>
                                <template #default="scope">
                                    <el-tooltip v-if="scope.row.userAgent" :content="scope.row.userAgent" placement="top">
                                        <span>{{ [scope.row.browser, scope.row.os].filter(Boolean).join(' / ') || '—' }}</span>
                                    </el-tooltip>
                                    <span v-else>—</span>
                                </template>
                            </el-table-column>
                        </el-table>

                        <el-pagination
                            @size-change="onHandleSizeChange"
                            @current-change="onHandleCurrentChange"
                            class="mt15"
                            :pager-count="5"
                            :page-sizes="[10, 20, 30, 50]"
                            v-model:current-page="state.tableData.param.pageNum"
                            background
                            v-model:page-size="state.tableData.param.pageSize"
                            layout="total, sizes, prev, pager, next, jumper"
                            :total="state.tableData.total"
                        />
                    </el-tab-pane>

                    <el-tab-pane label="行为分析" name="analyze">
                        <div class="app-search mb15">
                            <span class="toolbar-label">统计窗口</span>
                            <el-radio-group v-model="overview.days" size="small" class="ml10" @change="loadOverview">
                                <el-radio-button :value="1">今天</el-radio-button>
                                <el-radio-button :value="7">近 7 天</el-radio-button>
                                <el-radio-button :value="30">近 30 天</el-radio-button>
                            </el-radio-group>
                            <el-button size="default" plain type="primary" class="ml10" :loading="overviewLoading" @click="loadOverview">
                                <el-icon><ele-Refresh /></el-icon>
                                刷新
                            </el-button>
                        </div>

                        <el-row :gutter="15" class="mb15">
                            <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
                                <div class="overview-card"><div class="overview-num">{{ overview.total }}</div><div class="overview-label">登录次数</div></div>
                            </el-col>
                            <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
                                <div class="overview-card"><div class="overview-num">{{ overview.success }}</div><div class="overview-label">成功</div></div>
                            </el-col>
                            <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
                                <div class="overview-card" :class="{ 'overview-danger': overview.fail > 0 }"><div class="overview-num">{{ overview.fail }}</div><div class="overview-label">失败</div></div>
                            </el-col>
                            <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
                                <div class="overview-card"><div class="overview-num">{{ overview.successRate.toFixed(1) }}%</div><div class="overview-label">成功率</div></div>
                            </el-col>
                        </el-row>

                        <el-alert v-if="overview.suspicious.length > 0" class="mb15" type="warning" show-icon :closable="false" :title="`以下账号失败次数偏多，建议核查是否被撞库或密码泄露`" :description="overview.suspicious.map((i) => `${i.name}(${i.count}次)`).join('、')" />

                        <div class="chart-block mb15">
                            <div class="block-title">成功 / 失败趋势</div>
                            <div class="chart-wrap">
                                <div ref="trendRef" class="trend-chart"></div>
                                <div v-if="overview.trend.length === 0" class="chart-empty">暂无数据</div>
                            </div>
                        </div>

                        <el-row :gutter="15">
                            <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
                                <div class="chart-block">
                                    <div class="block-title">失败次数 Top 账号</div>
                                    <TopList :items="overview.failUsers" />
                                </div>
                            </el-col>
                            <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
                                <div class="chart-block">
                                    <div class="block-title">失败次数 Top 来源IP</div>
                                    <TopList :items="overview.failIps" />
                                </div>
                            </el-col>
                            <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
                                <div class="chart-block">
                                    <div class="block-title">活跃账号 Top</div>
                                    <TopList :items="overview.activeUsers" />
                                </div>
                            </el-col>
                        </el-row>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts" name="logsLoginIndex">
import { defineAsyncComponent, markRaw, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { dayjs, ElMessage } from 'element-plus';
import { useLogsApi } from '/@/api/logs';
import { LoginLogState, LoginOverviewType } from '/@/types/views';

const TopList = defineAsyncComponent(() => import('/@/views/logs/components/top-list.vue'));

const logsApi = useLogsApi();

const activeTab = ref('list');
const timeRange = ref<string[]>([]);
const overviewLoading = ref(false);
const trendRef = ref<HTMLElement>();
const global = reactive<{ trendChart: any }>({ trendChart: null });

const state = reactive<LoginLogState>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: { pageNum: 1, pageSize: 10 },
    },
});

const overview = reactive<LoginOverviewType>({
    days: 7,
    total: 0,
    success: 0,
    fail: 0,
    successRate: 0,
    trend: [],
    failUsers: [],
    failIps: [],
    activeUsers: [],
    suspicious: [],
});

const formatTime = (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—');

const resultName = (result: number) => ({ 0: '失败', 1: '成功', 2: '登出' }[result] || '未知');
const resultTag = (result: number) => (({ 0: 'danger', 1: 'success', 2: 'info' } as any)[result] || 'info');
const platformName = (platform: string) => (platform === 'bastion' ? '堡垒机' : platform === 'web' ? 'Web' : platform || '—');

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

const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const query = buildQuery(state.tableData.param);
        if (timeRange.value && timeRange.value.length === 2) {
            query.startAt = timeRange.value[0];
            query.endAt = timeRange.value[1];
        }
        const res = await logsApi.getLoginLogPage(query);
        if (res && res.code == 200) {
            state.tableData.data = res.data || [];
            state.tableData.total = res.total || 0;
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '登录日志加载失败');
    } finally {
        state.tableData.loading = false;
    }
};

const onSearch = () => {
    state.tableData.param.pageNum = 1;
    getTableData();
};

const resetTableData = () => {
    state.tableData.param.userName = '';
    state.tableData.param.ipAddr = '';
    state.tableData.param.result = undefined;
    state.tableData.param.platform = '';
    timeRange.value = [];
    state.tableData.param.pageNum = 1;
    getTableData();
};

const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

const loadOverview = async () => {
    overviewLoading.value = true;
    try {
        const res = await logsApi.analyzeLogin({ days: overview.days });
        if (res && res.code == 200) {
            Object.assign(overview, res.data || {});
            renderTrend();
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '行为分析加载失败');
    } finally {
        overviewLoading.value = false;
    }
};

const renderTrend = async () => {
    await nextTick();
    if (!trendRef.value) return;
    if (!global.trendChart) global.trendChart = markRaw(echarts.init(trendRef.value));

    global.trendChart.setOption(
        {
            grid: { left: 50, right: 20, top: 30, bottom: 30 },
            tooltip: { trigger: 'axis' },
            legend: { data: ['成功', '失败'], top: 0 },
            xAxis: { type: 'category', data: overview.trend.map((item) => item.date) },
            yAxis: { type: 'value', minInterval: 1 },
            series: [
                { name: '成功', type: 'line', smooth: true, itemStyle: { color: '#67C23A' }, data: overview.trend.map((item) => item.success) },
                { name: '失败', type: 'line', smooth: true, itemStyle: { color: '#F56C6C' }, data: overview.trend.map((item) => item.fail) },
            ],
        },
        true
    );
    global.trendChart.resize();
};

watch(activeTab, (tab) => {
    if (tab === 'analyze') {
        loadOverview();
    }
});

const handleResize = () => global.trendChart?.resize();

onMounted(() => {
    getTableData();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    global.trendChart?.dispose();
    global.trendChart = null;
});
</script>

<style scoped lang="scss">
.layout-padding-view {
    overflow-y: auto;
}

.toolbar-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.overview-card {
    background: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 16px;
    text-align: center;
}

.overview-num {
    font-size: 24px;
    font-weight: 600;
}

.overview-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
}

.overview-danger {
    background: var(--el-color-danger-light-9);

    .overview-num {
        color: var(--el-color-danger);
    }
}

.chart-block {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 15px;
}

.block-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 10px;
}

.chart-wrap {
    position: relative;
}

.trend-chart {
    height: 220px;
    width: 100%;
}

.chart-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    pointer-events: none;
}
</style>
