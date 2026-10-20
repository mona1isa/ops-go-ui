<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view logs-query">
            <el-alert v-if="!status.available" class="mb15" type="error" show-icon :closable="false" :title="`日志数据源不可用：${status.url || '未配置 Loki'}`" description="请检查后端 LOKI_URL 配置或 Loki 服务状态，检索功能暂时不可用。" />

            <!-- 检索条件 -->
            <el-card shadow="hover" class="mb15">
                <div class="query-form">
                    <el-form :model="state.param" label-width="90px">
                        <el-row :gutter="15">
                            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                                <el-form-item label="日志来源">
                                    <el-select v-model="state.param.job" placeholder="请选择 job" filterable clearable class="w100" @change="onJobChange">
                                        <el-option v-for="item in jobOptions" :key="item" :label="item" :value="item" />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                                <el-form-item label="主机">
                                    <el-select v-model="state.param.host" placeholder="全部主机" filterable clearable class="w100">
                                        <el-option v-for="item in hostOptions" :key="item" :label="item" :value="item" />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                                <el-form-item label="业务标签">
                                    <el-select v-model="state.param.source" placeholder="全部来源" filterable clearable class="w100">
                                        <el-option v-for="item in sourceOptions" :key="item" :label="item" :value="item" />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                                <el-form-item label="级别">
                                    <el-select v-model="state.param.level" placeholder="全部级别" clearable class="w100">
                                        <el-option v-for="lv in levels" :key="lv" :label="lv" :value="lv" />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="15">
                            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                                <el-form-item label="包含关键字">
                                    <el-input v-model="state.param.keyword" placeholder="多个关键字用空格分隔（AND）" clearable @keyup.enter="onSearch" />
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                                <el-form-item label="排除关键字">
                                    <el-input v-model="state.param.exclude" placeholder="命中即过滤，空格分隔" clearable @keyup.enter="onSearch" />
                                </el-form-item>
                            </el-col>
                            <el-col :xs="24" :sm="24" :md="16" :lg="12" :xl="12">
                                <el-form-item label="时间范围">
                                    <el-date-picker
                                        v-model="state.timeRange"
                                        type="datetimerange"
                                        range-separator="至"
                                        start-placeholder="开始时间"
                                        end-placeholder="结束时间"
                                        value-format="YYYY-MM-DD HH:mm:ss"
                                        class="w100"
                                    />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="15">
                            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                                <el-form-item label="LogQL">
                                    <el-input v-model="state.param.selector" placeholder="高级用法：直接指定流选择器，如 {job=&quot;ops_log&quot;}，填写后忽略上方来源/主机筛选" clearable />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <div class="query-actions">
                            <el-button type="primary" plain :loading="state.loading" @click="onSearch">
                                <el-icon><ele-Search /></el-icon>
                                查询
                            </el-button>
                            <el-button type="info" plain @click="onReset">
                                <el-icon><ele-Refresh /></el-icon>
                                重置
                            </el-button>
                            <el-button plain type="success" :disabled="state.lines.length === 0" @click="onExport">
                                <el-icon><ele-Download /></el-icon>
                                导出 CSV
                            </el-button>
                            <span class="ml15">条数上限</span>
                            <el-input-number v-model="state.param.limit" :min="50" :max="5000" :step="100" size="small" controls-position="right" class="ml10" style="width: 130px" />
                            <el-radio-group v-model="state.param.direction" size="small" class="ml15">
                                <el-radio-button value="backward">最新在前</el-radio-button>
                                <el-radio-button value="forward">正序</el-radio-button>
                            </el-radio-group>
                            <el-switch v-model="tailing" inline-prompt active-text="实时" inactive-text="实时" class="ml15" @change="onToggleTail" />
                            <span class="toolbar-label ml10">每 3 秒增量拉取一次，开启后自动滚动到最新</span>
                        </div>
                    </el-form>
                </div>
            </el-card>

            <!-- 时间分布 -->
            <el-card shadow="hover" class="mb15">
                <template #header>
                    <div class="card-header">
                        <span>时间分布</span>
                        <el-radio-group v-model="state.step" size="small" @change="loadHistogram">
                            <el-radio-button value="">自动</el-radio-button>
                            <el-radio-button value="1m">1分钟</el-radio-button>
                            <el-radio-button value="5m">5分钟</el-radio-button>
                            <el-radio-button value="15m">15分钟</el-radio-button>
                            <el-radio-button value="1h">1小时</el-radio-button>
                        </el-radio-group>
                    </div>
                </template>
                <div class="histogram-wrap">
                    <div ref="chartRef" class="histogram-chart"></div>
                    <div v-if="state.histogram.length === 0" class="chart-empty">暂无分布数据</div>
                </div>
            </el-card>

            <!-- 日志明细 -->
            <el-card shadow="hover">
                <template #header>
                    <div class="card-header">
                        <span>日志明细（共 {{ state.lines.length }} 行）</span>
                        <div>
                            <el-tag v-if="tailing" type="success" size="small">实时中</el-tag>
                            <el-button size="small" text type="danger" :disabled="state.lines.length === 0" @click="clearLines">清空</el-button>
                        </div>
                    </div>
                </template>
                <div ref="listRef" v-loading="state.loading" class="log-list">
                    <div v-if="state.lines.length === 0 && !state.loading" class="log-empty">
                        {{ state.searched ? '未检索到日志，请调整筛选条件或时间范围' : '请选择日志来源后点击查询' }}
                    </div>
                    <div v-for="(row, index) in state.lines" :key="`${row.timestamp}-${index}`" class="log-row">
                        <span class="log-time">{{ formatTime(row.timestamp) }}</span>
                        <el-tag v-if="row.labels.level" :type="levelTagType(row.labels.level)" size="small" class="log-level">{{ row.labels.level }}</el-tag>
                        <span class="log-host">{{ row.labels.host || row.labels.instance || '' }}</span>
                        <span class="log-line">
                            <span v-for="(seg, i) in renderLine(row.line)" :key="i" :class="{ 'log-hit': seg.hit }">{{ seg.text }}</span>
                        </span>
                        <span class="log-ops">
                            <el-button size="small" text type="primary" v-auths="['logs:query:context']" @click="onOpenContext(row)">上下文</el-button>
                        </span>
                    </div>
                </div>
            </el-card>

            <!-- 上下文抽屉 -->
            <el-drawer v-model="context.visible" title="日志上下文" size="55%" :destroy-on-close="true">
                <div v-loading="context.loading" class="context-box">
                    <div class="context-tip">
                        流：{{ context.selector }}
                        <el-input-number v-model="context.lines" :min="5" :max="200" :step="5" size="small" controls-position="right" class="ml10" />
                        <el-button size="small" type="primary" plain class="ml10" @click="loadContext">重新加载</el-button>
                    </div>
                    <div class="context-list">
                        <div v-for="(row, index) in context.before" :key="`b${index}`" class="log-row context-row">
                            <span class="log-time">{{ formatTime(row.timestamp) }}</span>
                            <span class="log-line">{{ row.line }}</span>
                        </div>
                        <div class="log-row context-hit">
                            <span class="log-time">{{ formatTime(context.center.timestamp) }}</span>
                            <span class="log-line">{{ context.center.line }}</span>
                        </div>
                        <div v-for="(row, index) in context.after" :key="`a${index}`" class="log-row context-row">
                            <span class="log-time">{{ formatTime(row.timestamp) }}</span>
                            <span class="log-line">{{ row.line }}</span>
                        </div>
                        <div v-if="!context.loading && context.before.length === 0 && context.after.length === 0" class="log-empty">未取到上下文，可能该时间范围内没有其他日志</div>
                    </div>
                </div>
            </el-drawer>
        </div>
    </div>
</template>

<script setup lang="ts" name="logsQueryIndex">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
import * as echarts from 'echarts';
import { dayjs, ElMessage } from 'element-plus';
import { useLogsApi } from '/@/api/logs';
import { LogLineType, LogDatasourceStatusType } from '/@/types/views';

const logsApi = useLogsApi();

const levels = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];

const chartRef = ref<HTMLElement>();
const listRef = ref<HTMLElement>();
const tailing = ref(false);
let tailTimer: ReturnType<typeof setInterval> | null = null;

const status = reactive<LogDatasourceStatusType>({ available: true, url: '' });
const jobOptions = ref<string[]>([]);
const hostOptions = ref<string[]>([]);
const sourceOptions = ref<string[]>([]);

const defaultRange = () => [dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), dayjs().format('YYYY-MM-DD HH:mm:ss')];

const state = reactive({
    loading: false,
    searched: false,
    step: '',
    timeRange: defaultRange() as string[],
    lines: [] as LogLineType[],
    histogram: [] as { timestamp: number; value: number }[],
    param: {
        job: '',
        host: '',
        source: '',
        level: '',
        keyword: '',
        exclude: '',
        selector: '',
        limit: 500,
        direction: 'backward',
    },
});

const context = reactive({
    visible: false,
    loading: false,
    selector: '',
    lines: 20,
    center: { timestamp: '', line: '', labels: {} } as LogLineType,
    before: [] as LogLineType[],
    after: [] as LogLineType[],
});

// 图表实例与宿主 DOM 放在一起：页面缓存后复用节点仍可继续用，节点被移除则丢弃旧实例重建，
// 避免实例残留在脱离文档的元素上导致尺寸错乱
let chartInstance: echarts.ECharts | null = null;
let chartHost: HTMLElement | null = null;
let chartObserver: ResizeObserver | null = null;

const keywords = computed(() =>
    (state.param.keyword || '')
        .split(/\s+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
);

// buildQuery 组装检索参数，时间范围拆分给后端
const buildQuery = () => {
    const query: Record<string, any> = {
        job: state.param.job,
        host: state.param.host,
        source: state.param.source,
        level: state.param.level,
        keyword: state.param.keyword,
        exclude: state.param.exclude,
        selector: state.param.selector,
        limit: state.param.limit,
        direction: state.param.direction,
    };
    if (state.timeRange && state.timeRange.length === 2) {
        query.startAt = state.timeRange[0];
        query.endAt = state.timeRange[1];
    }
    return query;
};

const validateParam = () => {
    if (!state.param.selector && !state.param.job) {
        ElMessage.warning('请先选择日志来源（job），或在 LogQL 中填写流选择器');
        return false;
    }
    return true;
};

const formatTime = (timestamp: string) => (timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS') : '—');

const levelTagType = (level: string) => {
    switch (level) {
        case 'FATAL':
            return 'danger';
        case 'ERROR':
            return 'danger';
        case 'WARN':
            return 'warning';
        case 'INFO':
            return 'success';
        default:
            return 'info';
    }
};

// renderLine 按关键字切分日志内容用于高亮。返回文本片段而非 HTML，避免日志内容注入标签
const renderLine = (line: string) => {
    const text = line ?? '';
    const kws = keywords.value;
    if (kws.length === 0) return [{ text, hit: false }];

    const lower = text.toLowerCase();
    // toLowerCase 在个别字符上会改变长度，长度不一致时放弃高亮，保证下标对齐
    if (lower.length !== text.length) return [{ text, hit: false }];

    const segments: { text: string; hit: boolean }[] = [];
    let cursor = 0;
    while (cursor < text.length) {
        let matchIndex = -1;
        let matchWord = '';
        for (const word of kws) {
            const idx = lower.indexOf(word, cursor);
            if (idx >= 0 && (matchIndex === -1 || idx < matchIndex)) {
                matchIndex = idx;
                matchWord = word;
            }
        }
        if (matchIndex === -1) {
            segments.push({ text: text.slice(cursor), hit: false });
            break;
        }
        if (matchIndex > cursor) segments.push({ text: text.slice(cursor, matchIndex), hit: false });
        segments.push({ text: text.slice(matchIndex, matchIndex + matchWord.length), hit: true });
        cursor = matchIndex + matchWord.length;
    }
    return segments;
};

const loadStatus = async () => {
    try {
        const res = await logsApi.getStatus();
        if (res && res.code == 200) {
            status.available = res.data?.available ?? false;
            status.url = res.data?.url ?? '';
        }
    } catch (error) {
        status.available = false;
    }
};

const loadLabelValues = async (label: string, target: { value: string[] }) => {
    try {
        const res = await logsApi.getLabelValues({ label });
        if (res && res.code == 200) target.value = res.data || [];
    } catch (error) {
        // 标签取值加载失败时保持为空，仍可手工输入选择器
    }
};

// 采集源下拉用于快速填充 job，未接入 Loki 标签时也能筛选
const loadJobs = async () => {
    try {
        const res = await logsApi.getSourceOptions();
        if (res && res.code == 200) {
            const jobs = (res.data || []).map((item: any) => item.job).filter(Boolean);
            jobOptions.value = Array.from(new Set<string>([...jobs, ...jobOptions.value]));
        }
    } catch (error) {
        // 忽略采集源下拉失败
    }
    loadLabelValues('job', jobOptions);
};

const onJobChange = () => {
    loadLabelValues('host', hostOptions);
};

const initOptions = async () => {
    if (jobOptions.value.length === 0) {
        try {
            const res = await logsApi.getLabels();
            if (res && res.code == 200 && (res.data || []).includes('host')) {
                loadLabelValues('host', hostOptions);
                loadLabelValues('source', sourceOptions);
            }
        } catch (error) {
            // 数据源不可用时下拉为空
        }
    }
};

const getTableData = async () => {
    state.loading = true;
    try {
        const res = await logsApi.queryLogs(buildQuery());
        if (res && res.code == 200) {
            state.lines = res.data || [];
            state.searched = true;
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '日志检索失败');
    } finally {
        state.loading = false;
    }
};

const loadHistogram = async () => {
    if (!validateParam()) return;
    try {
        const res = await logsApi.getHistogram({ ...buildQuery(), step: state.step });
        if (res && res.code == 200) {
            state.histogram = res.data || [];
            renderChart();
        }
    } catch (error: any) {
        // 分布图失败不影响明细展示
    }
};

const renderChart = async () => {
    await nextTick();
    const el = chartRef.value;
    if (!el) return;

    if (!chartInstance || chartHost !== el) {
        if (el.clientWidth === 0 || el.clientHeight === 0) return;
        chartInstance = echarts.init(el);
        chartHost = el;
    }

    // 无数据时彻底清空画布，只保留「暂无分布数据」占位；
    // 否则空坐标系仍会渲染 0/1 刻度与残留轴标签
    if (state.histogram.length === 0) {
        chartInstance.clear();
        return;
    }

    const points = state.histogram.map((point) => ({
        time: dayjs(point.timestamp * 1000).format('MM-DD HH:mm'),
        value: point.value,
    }));
    chartInstance.setOption(
        {
            grid: { left: 50, right: 20, top: 30, bottom: 40 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: points.map((item) => item.time), axisLabel: { fontSize: 10 } },
            yAxis: { type: 'value', name: '条数', minInterval: 1 },
            series: [
                {
                    type: 'bar',
                    name: '日志条数',
                    barMaxWidth: 24,
                    itemStyle: { color: '#409EFF' },
                    data: points.map((item) => item.value),
                },
            ],
        },
        true
    );
    chartInstance.resize();
};

const onSearch = () => {
    if (!validateParam()) return;
    getTableData();
    loadHistogram();
};

const onReset = () => {
    state.param = { job: '', host: '', source: '', level: '', keyword: '', exclude: '', selector: '', limit: 500, direction: 'backward' };
    state.timeRange = defaultRange();
    state.step = '';
    clearLines();
};

const clearLines = () => {
    state.lines = [];
    state.histogram = [];
    state.searched = false;
    renderChart();
};

// 实时 tail：沿用同一条件轮询增量，用「时间戳+内容」去重，避免边界漏行或重复
const startTail = () => {
    stopTail();
    tailTimer = setInterval(async () => {
        if (state.loading || !validateParam()) return;
        try {
            const res = await logsApi.queryLogs({ ...buildQuery(), direction: 'forward', limit: 200 });
            if (!res || res.code != 200) return;
            const incoming: LogLineType[] = res.data || [];
            if (incoming.length === 0) return;

            const seen = new Set(state.lines.map((row) => `${row.timestamp}#${row.line}`));
            const added = incoming.filter((row) => !seen.has(`${row.timestamp}#${row.line}`));
            if (added.length === 0) return;
            state.lines = state.lines.concat(added).slice(-state.param.limit);
            await nextTick();
            if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
        } catch (error) {
            // 轮询失败等待下一轮
        }
    }, 3000);
};

const stopTail = () => {
    if (tailTimer) {
        clearInterval(tailTimer);
        tailTimer = null;
    }
};

const onToggleTail = (val: boolean) => {
    if (val) {
        if (!validateParam()) {
            tailing.value = false;
            return;
        }
        startTail();
    } else {
        stopTail();
    }
};

// selectorOf 由命中行的标签还原流选择器，用于定位同一文件的上下文
const selectorOf = (row: LogLineType) => {
    const entries = Object.entries(row.labels || {}).filter(
        ([key, value]) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && value !== '' && !/["\\\n]/.test(String(value))
    );
    if (entries.length === 0) return '';
    return '{' + entries.map(([key, value]) => `${key}="${value}"`).join(',') + '}';
};

const onOpenContext = (row: LogLineType) => {
    context.center = row;
    context.selector = selectorOf(row);
    context.visible = true;
    loadContext();
};

const loadContext = async () => {
    if (!context.selector) {
        ElMessage.warning('该日志缺少标签信息，无法定位上下文');
        return;
    }
    context.loading = true;
    try {
        const res = await logsApi.getLogContext({ selector: context.selector, timestamp: context.center.timestamp, lines: context.lines });
        if (res && res.code == 200) {
            context.before = res.data?.before || [];
            context.after = res.data?.after || [];
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '上下文加载失败');
    } finally {
        context.loading = false;
    }
};

// onExport 导出当前检索结果为 CSV，含 BOM 以便 Excel 正确识别中文
const onExport = () => {
    const escape = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['时间', '主机', 'job', 'source', '级别', '内容'];
    const rows = state.lines.map((row) =>
        [formatTime(row.timestamp), row.labels.host || '', row.labels.job || '', row.labels.source || '', row.labels.level || '', row.line].map(escape).join(',')
    );
    const csv = '\uFEFF' + [header.map(escape).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs-${dayjs().format('YYYYMMDDHHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    ElMessage.success(`已导出 ${state.lines.length} 行`);
};

// 容器尺寸变化（窗口缩放、侧边栏折叠、标签页切换回来、字体缩放）都由 ResizeObserver 覆盖，
// 比 window.resize 更全面；宽度从 0 变为可见时也会借它补渲染一次
const observeChart = (el: HTMLElement) => {
    if (chartObserver || typeof ResizeObserver === 'undefined') return;
    chartObserver = new ResizeObserver(() => {
        if (!chartRef.value) return;
        if (!chartInstance) {
            renderChart();
        } else {
            chartInstance.resize();
        }
    });
    chartObserver.observe(el);
};

onMounted(() => {
    loadStatus();
    loadJobs();
    initOptions();
    renderChart();
    if (chartRef.value) observeChart(chartRef.value);
});

onUnmounted(() => {
    stopTail();
    chartObserver?.disconnect();
    chartObserver = null;
    chartInstance?.dispose();
    chartInstance = null;
    chartHost = null;
});
</script>

<style scoped lang="scss">
.layout-padding-view {
    overflow-y: auto;
}

// 外层是定高的弹性列容器，el-card 自带 overflow:hidden 会让 min-height:auto 失效，
// 卡片被压缩后筛选区底部的按钮被裁掉，看起来像被下方卡片挡住
.logs-query {
    > * {
        flex-shrink: 0;
    }
}

.query-form {
    // 竖向间距统一由 row-gap 与行间 margin 提供：写在 el-form-item 上的 margin-bottom
    // 在窄屏折行时会和行本身的间距叠加，导致换行后忽紧忽松
    :deep(.el-form-item) {
        margin-bottom: 0;
    }

    // 标签统一占位且禁止折行：长标签（如「包含关键字」）一旦撑成两行，同排输入框的起点就会错位
    :deep(.el-form-item__label) {
        white-space: nowrap;
    }

    // 下拉与输入框默认高度不同，顶对齐保证同行标签处于同一基线
    :deep(.el-form-item) {
        align-items: flex-start;
    }

    :deep(.el-row) {
        row-gap: 10px;
    }

    :deep(.el-row + .el-row) {
        margin-top: 10px;
    }
}

.query-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    row-gap: 10px;
}

.toolbar-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.histogram-wrap {
    position: relative;
}

.histogram-chart {
    height: 180px;
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

.log-list {
    height: min(520px, 60vh);
    overflow-y: auto;
    font-family: Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 4px;
    padding: 6px 0;
}

.log-empty {
    text-align: center;
    color: var(--el-text-color-secondary);
    padding: 40px 0;
    font-size: 13px;
}

.log-row {
    display: flex;
    align-items: flex-start;
    padding: 2px 10px;
    white-space: nowrap;

    &:hover {
        background: var(--el-fill-color-light);

        .log-ops {
            visibility: visible;
        }
    }
}

.context-row {
    opacity: 0.75;
}

.context-hit {
    background: var(--el-color-warning-light-9);
    font-weight: 600;
}

.log-time {
    color: var(--el-text-color-secondary);
    flex: none;
    margin-right: 8px;
}

.log-level {
    flex: none;
    margin-right: 8px;
}

.log-host {
    flex: none;
    margin-right: 8px;
    color: var(--el-color-primary);
}

.log-line {
    white-space: pre-wrap;
    word-break: break-all;
    flex: 1;
}

.log-hit {
    background: var(--el-color-warning);
    color: var(--el-color-primary);
    border-radius: 2px;
}

.log-ops {
    flex: none;
    visibility: hidden;
}

.context-box {
    font-family: Menlo, Consolas, monospace;
    font-size: 12px;
}

.context-tip {
    margin-bottom: 10px;
    font-family: inherit;
    color: var(--el-text-color-secondary);
}

.context-list {
    max-height: 70vh;
    overflow-y: auto;
    background: var(--el-fill-color-lighter);
    border-radius: 4px;
    padding: 6px 0;
}
</style>
