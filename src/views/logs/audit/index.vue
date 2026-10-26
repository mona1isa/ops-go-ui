<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="操作留痕" name="list">
                        <div class="app-search mb15">
                            <el-input v-model="state.tableData.param.createUser" size="default" placeholder="操作人（精确）" style="max-width: 140px" clearable />
                            <el-input v-model="state.tableData.param.requestUri" size="default" placeholder="请求地址" style="max-width: 200px; margin-left: 10px" clearable />
                            <el-select v-model="state.tableData.param.operModule" size="default" placeholder="操作模块" style="max-width: 130px; margin-left: 10px" clearable filterable allow-create>
                                <el-option v-for="item in moduleOptions" :key="item.name" :label="item.name" :value="item.name" />
                            </el-select>
                            <el-select v-model="state.tableData.param.operType" size="default" placeholder="操作类型" style="max-width: 120px; margin-left: 10px" clearable>
                                <el-option v-for="item in operTypes" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                            <el-select v-model="state.tableData.param.sensitive" size="default" placeholder="敏感操作" style="max-width: 120px; margin-left: 10px" clearable>
                                <el-option label="仅敏感" value="1" />
                            </el-select>
                            <el-select v-model="state.tableData.param.bizFail" size="default" placeholder="业务结果" style="max-width: 130px; margin-left: 10px" clearable>
                                <el-option label="仅失败" value="1" />
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
                            <el-table-column prop="id" label="ID" width="85" />
                            <el-table-column prop="createdAt" label="操作时间" width="165">
                                <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
                            </el-table-column>
                            <el-table-column prop="createUser" label="操作人" min-width="110" show-overflow-tooltip />
                            <el-table-column prop="operModule" label="模块" width="110" show-overflow-tooltip>
                                <template #default="scope">{{ scope.row.operModule || '—' }}</template>
                            </el-table-column>
                            <el-table-column prop="operType" label="动作" width="90">
                                <template #default="scope">
                                    <el-tag :type="operTag(scope.row.operType)" size="small">{{ operName(scope.row.operType) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="sensitive" label="敏感" width="80">
                                <template #default="scope">
                                    <el-tag v-if="scope.row.sensitive === '1'" type="danger" size="small">敏感</el-tag>
                                    <span v-else>—</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="method" label="方法" width="85">
                                <template #default="scope">
                                    <el-tag :type="methodTag(scope.row.method)" size="small">{{ scope.row.method }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="requestUri" label="请求地址" min-width="220" show-overflow-tooltip />
                            <el-table-column prop="statusCode" label="状态码" width="90">
                                <template #default="scope">
                                    <el-tag :type="httpTag(scope.row.statusCode)" size="small">{{ scope.row.statusCode || '—' }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="bizCode" label="业务码" width="90" show-overflow-tooltip>
                                <template #default="scope">{{ scope.row.bizCode || '—' }}</template>
                            </el-table-column>
                            <el-table-column prop="costTimeMs" label="耗时" width="90">
                                <template #default="scope">{{ scope.row.costTimeMs }} ms</template>
                            </el-table-column>
                            <el-table-column prop="ipAddr" label="来源IP" width="150" show-overflow-tooltip />
                            <el-table-column label="操作" width="80" fixed="right">
                                <template #default="scope">
                                    <el-button size="small" text type="primary" @click="onOpenDetail(scope.row)">详情</el-button>
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
                            <el-radio-group v-model="overview.hours" size="small" class="ml10" @change="loadOverview">
                                <el-radio-button :value="1">近 1 小时</el-radio-button>
                                <el-radio-button :value="24">近 24 小时</el-radio-button>
                                <el-radio-button :value="168">近 7 天</el-radio-button>
                            </el-radio-group>
                            <el-button size="default" plain type="primary" class="ml10" :loading="overviewLoading" @click="loadOverview">
                                <el-icon><ele-Refresh /></el-icon>
                                刷新
                            </el-button>
                        </div>

                        <el-row :gutter="15" class="mb15">
                            <el-col :xs="12" :sm="8" :md="8" :lg="8" :xl="8">
                                <div class="overview-card"><div class="overview-num">{{ overview.total }}</div><div class="overview-label">操作次数</div></div>
                            </el-col>
                            <el-col :xs="12" :sm="8" :md="8" :lg="8" :xl="8">
                                <div class="overview-card" :class="{ 'overview-danger': overview.fail > 0 }"><div class="overview-num">{{ overview.fail }}</div><div class="overview-label">失败操作</div></div>
                            </el-col>
                            <el-col :xs="12" :sm="8" :md="8" :lg="8" :xl="8">
                                <div class="overview-card" :class="{ 'overview-warning': overview.sensitive > 0 }"><div class="overview-num">{{ overview.sensitive }}</div><div class="overview-label">敏感操作</div></div>
                            </el-col>
                        </el-row>

                        <el-row :gutter="15">
                            <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
                                <div class="chart-block">
                                    <div class="block-title">操作模块分布</div>
                                    <TopList :items="overview.modules" />
                                </div>
                            </el-col>
                            <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
                                <div class="chart-block">
                                    <div class="block-title">操作人活跃 Top</div>
                                    <TopList :items="overview.operators" />
                                </div>
                            </el-col>
                            <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                                <div class="chart-block">
                                    <div class="block-title">敏感操作 Top</div>
                                    <TopList :items="overview.sensitiveOps" />
                                </div>
                            </el-col>
                        </el-row>

                        <div class="chart-block">
                            <div class="block-title">慢接口 Top</div>
                            <el-table :data="overview.slowApis" size="small" style="width: 100%">
                                <el-table-column prop="requestUri" label="接口" min-width="260" show-overflow-tooltip />
                                <el-table-column prop="cnt" label="调用次数" width="110" />
                                <el-table-column prop="avgCostMs" label="平均耗时" width="110">
                                    <template #default="scope">{{ Math.round(scope.row.avgCostMs) }} ms</template>
                                </el-table-column>
                                <el-table-column prop="maxCostMs" label="最大耗时" width="110">
                                    <template #default="scope">{{ scope.row.maxCostMs }} ms</template>
                                </el-table-column>
                            </el-table>
                            <div v-if="overview.slowApis.length === 0" class="top-empty">窗口内暂无数据</div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </el-card>

            <!-- 操作详情 -->
            <el-dialog v-model="detail.visible" title="操作详情" width="720px">
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="操作人">{{ detail.row.createUser || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="操作时间">{{ formatTime(detail.row.createdAt) }}</el-descriptions-item>
                    <el-descriptions-item label="模块/动作">{{ detail.row.operModule || '—' }} / {{ operName(detail.row.operType) }}</el-descriptions-item>
                    <el-descriptions-item label="敏感操作">{{ detail.row.sensitive === '1' ? '是' : '否' }}</el-descriptions-item>
                    <el-descriptions-item label="请求">{{ detail.row.method }} {{ detail.row.requestUri }}</el-descriptions-item>
                    <el-descriptions-item label="来源IP">{{ detail.row.ipAddr || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="状态码">{{ detail.row.statusCode || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="耗时">{{ detail.row.costTimeMs }} ms</el-descriptions-item>
                    <el-descriptions-item label="业务码">{{ detail.row.bizCode || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="业务信息">{{ detail.row.bizMsg || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="请求参数" :span="2">
                        <pre class="detail-pre">{{ detail.row.params || '—' }}</pre>
                    </el-descriptions-item>
                    <el-descriptions-item label="响应数据" :span="2">
                        <pre class="detail-pre">{{ detail.row.resp || '—' }}</pre>
                    </el-descriptions-item>
                    <el-descriptions-item label="客户端" :span="2">
                        <pre class="detail-pre">{{ detail.row.userAgent || '—' }}</pre>
                    </el-descriptions-item>
                </el-descriptions>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts" name="logsAuditIndex">
import { defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue';
import { dayjs, ElMessage } from 'element-plus';
import { useLogsApi } from '/@/api/logs';
import { AuditLogState, AuditOverviewType, LogTopItemType } from '/@/types/views';

const TopList = defineAsyncComponent(() => import('/@/views/logs/components/top-list.vue'));

const logsApi = useLogsApi();

const activeTab = ref('list');
const timeRange = ref<string[]>([]);
const overviewLoading = ref(false);
const moduleOptions = ref<LogTopItemType[]>([]);

const operTypes = [
    { label: '查询', value: 'query' },
    { label: '新增', value: 'add' },
    { label: '修改', value: 'edit' },
    { label: '删除', value: 'delete' },
    { label: '授权', value: 'grant' },
    { label: '其他', value: 'other' },
];

const state = reactive<AuditLogState>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: { pageNum: 1, pageSize: 10 },
    },
});

const overview = reactive<AuditOverviewType>({
    hours: 24,
    total: 0,
    fail: 0,
    sensitive: 0,
    modules: [],
    operators: [],
    sensitiveOps: [],
    slowApis: [],
});

const detail = reactive({ visible: false, row: {} as any });

const formatTime = (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—');

const operName = (type: string) => (operTypes.find((item) => item.value === type)?.label) || type || '其他';
const operTag = (type: string) => (({ add: 'success', edit: 'warning', delete: 'danger', grant: 'danger', query: 'info' } as any)[type] || 'info');
const methodTag = (method: string) => (({ GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' } as any)[method] || 'info');
const httpTag = (code: string) => {
    if (!code) return 'info';
    const num = parseInt(code);
    if (num >= 200 && num < 300) return 'success';
    if (num >= 400 && num < 500) return 'warning';
    if (num >= 500) return 'danger';
    return 'info';
};

// 剔除空筛选字段
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
        const res = await logsApi.getAuditPage(query);
        if (res && res.code == 200) {
            state.tableData.data = res.data || [];
            state.tableData.total = res.total || 0;
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '操作日志加载失败');
    } finally {
        state.tableData.loading = false;
    }
};

const onSearch = () => {
    state.tableData.param.pageNum = 1;
    getTableData();
};

const resetTableData = () => {
    state.tableData.param.createUser = '';
    state.tableData.param.requestUri = '';
    state.tableData.param.operModule = '';
    state.tableData.param.operType = '';
    state.tableData.param.sensitive = '';
    state.tableData.param.bizFail = '';
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

const onOpenDetail = (row: any) => {
    detail.row = row;
    detail.visible = true;
};

const loadOverview = async () => {
    overviewLoading.value = true;
    try {
        const res = await logsApi.analyzeAudit({ hours: overview.hours });
        if (res && res.code == 200) {
            Object.assign(overview, res.data || {});
            moduleOptions.value = overview.modules || [];
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '行为分析加载失败');
    } finally {
        overviewLoading.value = false;
    }
};

watch(activeTab, (tab) => {
    if (tab === 'analyze') loadOverview();
});

onMounted(() => {
    getTableData();
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
    margin-bottom: 10px;
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

.overview-warning {
    background: var(--el-color-warning-light-9);

    .overview-num {
        color: var(--el-color-warning);
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

.top-empty {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    padding: 16px 0;
    text-align: center;
}

.detail-pre {
    margin: 0;
    max-height: 180px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 12px;
}
</style>
