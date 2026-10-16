<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto logs-alert">
            <el-card shadow="hover">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="告警规则" name="rule">
                        <div class="app-search mb15">
                            <el-input v-model="ruleParam.name" size="default" placeholder="请输入规则名称" style="max-width: 180px" clearable />
                            <el-select v-model="ruleParam.level" size="default" placeholder="日志级别" style="max-width: 130px; margin-left: 10px" clearable>
                                <el-option v-for="lv in levels" :key="lv" :label="lv" :value="lv" />
                            </el-select>
                            <el-select v-model="ruleParam.enabled" size="default" placeholder="启用状态" style="max-width: 120px; margin-left: 10px" clearable>
                                <el-option label="启用" value="1" />
                                <el-option label="停用" value="0" />
                            </el-select>
                            <el-select v-model="ruleParam.muted" size="default" placeholder="静音状态" style="max-width: 120px; margin-left: 10px" clearable>
                                <el-option label="静音" value="1" />
                                <el-option label="正常" value="0" />
                            </el-select>

                            <el-button size="default" plain type="primary" class="ml10" @click="getRuleData">
                                <el-icon><ele-Search /></el-icon>
                                查询
                            </el-button>
                            <el-button size="default" plain type="info" class="ml10" @click="resetRuleQuery">
                                <el-icon><ele-Refresh /></el-icon>
                                重置
                            </el-button>
                            <el-button size="default" plain type="success" class="ml10" v-auths="['logs:alert:add']" @click="onOpenAddRule('add')">
                                <el-icon><ele-FolderAdd /></el-icon>
                                新增规则
                            </el-button>
                        </div>

                        <el-table :data="state.ruleData.data" v-loading="state.ruleData.loading" style="width: 100%">
                            <template #empty>
                                <el-empty :image-size="80" description="暂无告警规则">
                                    <div class="empty-desc">
                                        <p>日志告警按「时间窗内命中条数 ≥ 阈值」触发，需要先创建规则才会进入评估队列。</p>
                                        <p>建议顺序：①「采集源」确认主机与日志路径已拉到数据 → ②「日志检索」用同样条件能查到日志 → ③ 回到这里新增规则并用「试算」验证。</p>
                                    </div>
                                    <el-button type="primary" plain v-auths="['logs:alert:add']" @click="onOpenAddRule('add')">新增规则</el-button>
                                </el-empty>
                            </template>
                            <el-table-column prop="id" label="ID" width="60" />
                            <el-table-column prop="name" label="规则名称" min-width="150" show-overflow-tooltip />
                            <el-table-column label="触发条件" min-width="260" show-overflow-tooltip>
                                <template #default="scope">
                                    <div class="cond-line">{{ conditionText(scope.row) }}</div>
                                    <div class="sub-tip">{{ scope.row.selector || '按上方条件自动生成 LogQL' }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="windowSec" label="时间窗" width="90">
                                <template #default="scope">{{ scope.row.windowSec }} 秒</template>
                            </el-table-column>
                            <el-table-column prop="threshold" label="阈值" width="80" />
                            <el-table-column prop="severity" label="级别" width="80">
                                <template #default="scope">
                                    <el-tag :type="severityTag(scope.row.severity)" size="small">{{ severityName(scope.row.severity) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="groupByHost" label="按主机" width="80">
                                <template #default="scope">
                                    <el-tag :type="scope.row.groupByHost === '1' ? 'success' : 'info'" size="small">{{ scope.row.groupByHost === '1' ? '分别' : '汇总' }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="cooldownSec" label="冷却" width="90">
                                <template #default="scope">{{ scope.row.cooldownSec }} 秒</template>
                            </el-table-column>
                            <el-table-column prop="silenceUntil" label="静默" width="110">
                                <template #default="scope">
                                    <el-tag v-if="isSilenced(scope.row.silenceUntil)" type="warning" size="small">{{ silenceText(scope.row.silenceUntil) }}</el-tag>
                                    <span v-else>—</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="muted" label="静音" width="80">
                                <template #default="scope">
                                    <el-tag v-if="scope.row.muted === '1'" type="info" size="small">静音</el-tag>
                                    <span v-else>—</span>
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
                                        v-auths="['logs:alert:toggle']"
                                        @click="onToggleRule(scope.row)"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="230" fixed="right">
                                <template #default="scope">
                                    <el-button size="small" text type="info" v-auths="['logs:alert:test']" :loading="testingId === scope.row.id" @click="onTestRule(scope.row)">试算</el-button>
                                    <el-button size="small" text type="warning" v-auths="['logs:alert:silence']" @click="onOpenSilence(scope.row)">静默</el-button>
                                    <el-button size="small" text type="primary" v-auths="['logs:alert:edit']" @click="onOpenEditRule('edit', scope.row)">修改</el-button>
                                    <el-button size="small" text type="danger" v-auths="['logs:alert:delete']" @click="onRuleDel(scope.row)">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>

                        <el-pagination
                            @size-change="onRuleSizeChange"
                            @current-change="onRuleCurrentChange"
                            class="mt15"
                            :pager-count="5"
                            :page-sizes="[10, 20, 30]"
                            v-model:current-page="state.ruleData.param.pageNum"
                            background
                            v-model:page-size="state.ruleData.param.pageSize"
                            layout="total, sizes, prev, pager, next, jumper"
                            :total="state.ruleData.total"
                        />
                    </el-tab-pane>

                    <el-tab-pane label="告警事件" name="event">
                        <div class="app-search mb15">
                            <el-select v-model="eventParam.ruleId" size="default" placeholder="告警规则" style="max-width: 200px" clearable filterable>
                                <el-option v-for="item in state.ruleData.data" :key="item.id" :label="item.name" :value="item.id" />
                            </el-select>
                            <el-select v-model="eventParam.severity" size="default" placeholder="级别" style="max-width: 110px; margin-left: 10px" clearable>
                                <el-option label="紧急" :value="1" />
                                <el-option label="警告" :value="2" />
                                <el-option label="提醒" :value="3" />
                            </el-select>
                            <el-select v-model="eventParam.status" size="default" placeholder="事件状态" style="max-width: 130px; margin-left: 10px" clearable>
                                <el-option label="待确认" :value="1" />
                                <el-option label="告警中" :value="2" />
                                <el-option label="已恢复" :value="3" />
                            </el-select>
                            <el-input v-model="eventParam.instanceIp" size="default" placeholder="主机IP" style="max-width: 150px; margin-left: 10px" clearable />
                            <el-date-picker
                                v-model="eventTimeRange"
                                type="datetimerange"
                                range-separator="至"
                                start-placeholder="开始时间"
                                end-placeholder="结束时间"
                                value-format="YYYY-MM-DD HH:mm:ss"
                                style="width: 340px; margin-left: 10px"
                            />
                            <el-button size="default" plain type="primary" class="ml10" @click="getEventData">
                                <el-icon><ele-Search /></el-icon>
                                查询
                            </el-button>

                            <el-button size="default" plain class="ml10" @click="loadEvents">
                                <el-icon><ele-Refresh /></el-icon>
                                刷新
                            </el-button>
                            <span class="sub-tip ml10">事件处理（确认/备注）请到「监控告警 - 告警事件」页面操作，日志告警与指标告警共用同一事件表</span>
                        </div>

                        <el-table :data="state.eventData.data" v-loading="state.eventData.loading" style="width: 100%">
                            <template #empty>
                                <el-empty :image-size="80" description="暂无日志告警事件">
                                    <div class="empty-desc">
                                        <p>规则命中后事件写入这里，与「监控告警 - 告警事件」共用同一张事件表，按来源区分。</p>
                                        <p>从未触发过告警时此处为空，可在「告警规则」页签用「试算」立即验证某个条件是否会命中。</p>
                                    </div>
                                </el-empty>
                            </template>
                            <el-table-column prop="id" label="ID" width="70" />
                            <el-table-column prop="ruleName" label="规则名称" min-width="140" show-overflow-tooltip />
                            <el-table-column prop="instanceIp" label="主机" width="130" />
                            <el-table-column prop="severity" label="级别" width="80">
                                <template #default="scope">
                                    <el-tag :type="severityTag(scope.row.severity)" size="small">{{ severityName(scope.row.severity) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="命中/阈值" width="110">
                                <template #default="scope">{{ formatNum(scope.row.value) }} / {{ formatNum(scope.row.threshold) }}</template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="90">
                                <template #default="scope">
                                    <el-tag :type="statusTag(scope.row.status)" size="small">{{ statusName(scope.row.status) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="summary" label="告警摘要" min-width="220" show-overflow-tooltip />
                            <el-table-column prop="firedAt" label="触发时间" width="160">
                                <template #default="scope">{{ scope.row.firedAt ? dayjs(scope.row.firedAt).format('YYYY-MM-DD HH:mm:ss') : '—' }}</template>
                            </el-table-column>
                            <el-table-column prop="resolvedAt" label="恢复时间" width="160">
                                <template #default="scope">{{ scope.row.resolvedAt ? dayjs(scope.row.resolvedAt).format('YYYY-MM-DD HH:mm:ss') : '—' }}</template>
                            </el-table-column>
                            <el-table-column prop="notifyCount" label="通知" width="70" />
                        </el-table>

                        <el-pagination
                            @size-change="onEventSizeChange"
                            @current-change="onEventCurrentChange"
                            class="mt15"
                            :pager-count="5"
                            :page-sizes="[10, 20, 30]"
                            v-model:current-page="state.eventData.param.pageNum"
                            background
                            v-model:page-size="state.eventData.param.pageSize"
                            layout="total, sizes, prev, pager, next, jumper"
                            :total="state.eventData.total"
                        />
                    </el-tab-pane>
                </el-tabs>
            </el-card>

            <AlertDialog ref="alertDialogRef" @refresh="getRuleData" />

            <!-- 静默设置 -->
            <el-dialog v-model="silenceDialog.visible" title="静默告警规则" width="420px">
                <div class="mb15">规则：{{ silenceDialog.name }}</div>
                <el-form label-width="90px">
                    <el-form-item label="静默时长">
                        <el-input-number v-model="silenceDialog.minute" :min="0" :max="10080" controls-position="right" class="w100" />
                        <div class="form-tip">分钟，0 表示立即解除静默</div>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="silenceDialog.visible = false">取 消</el-button>
                    <el-button type="primary" @click="onSubmitSilence">确 定</el-button>
                </template>
            </el-dialog>

            <!-- 试算结果 -->
            <el-dialog v-model="testDialog.visible" title="规则试算结果" width="720px">
                <el-alert :type="testDialog.hit ? 'warning' : 'success'" :closable="false" show-icon :title="testDialog.hit ? '当前窗口内已有序列达到阈值，按此规则会触发告警' : '当前窗口内未达到阈值，不会触发告警'" class="mb15" />
                <div class="mb15">
                    <span class="sub-tip">LogQL：</span>
                    <code>{{ testDialog.logql }}</code>
                </div>
                <el-table :data="testDialog.samples" max-height="320">
                    <el-table-column label="标签" min-width="240" show-overflow-tooltip>
                        <template #default="scope">{{ labelText(scope.row.labels) }}</template>
                    </el-table-column>
                    <el-table-column prop="value" label="窗口条数" width="110" />
                    <el-table-column prop="timestamp" label="采样时间" width="180">
                        <template #default="scope">{{ scope.row.timestamp ? dayjs(scope.row.timestamp).format('YYYY-MM-DD HH:mm:ss') : '—' }}</template>
                    </el-table-column>
                </el-table>
                <div v-if="testDialog.samples.length === 0" class="form-tip">未取到任何序列，请确认采集源是否在运行、时间窗内是否有日志</div>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts" name="logsAlertIndex">
import { defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue';
import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { useLogsApi } from '/@/api/logs';
import { RowMonitorEventType } from '/@/types/views';

const AlertDialog = defineAsyncComponent(() => import('/@/views/logs/alert/dialog.vue'));

const logsApi = useLogsApi();

const levels = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
const activeTab = ref('rule');
const alertDialogRef = ref();
const testingId = ref<number | null>(null);

const ruleParam = reactive<Record<string, any>>({
    pageNum: 1,
    pageSize: 10,
    name: '',
    level: '',
    enabled: '',
    muted: '',
});

const eventParam = reactive<Record<string, any>>({
    pageNum: 1,
    pageSize: 10,
    ruleId: undefined,
    severity: undefined,
    status: undefined,
    instanceIp: '',
});

const eventTimeRange = ref<string[]>([]);

const state = reactive({
    ruleData: { data: [] as any[], total: 0, loading: false },
    eventData: { data: [] as RowMonitorEventType[], total: 0, loading: false },
});

const silenceDialog = reactive({ visible: false, id: 0, name: '', minute: 30 });
const testDialog = reactive({ visible: false, hit: false, logql: '', samples: [] as any[] });

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

const severityName = (severity: number) => ({ 1: '紧急', 2: '警告', 3: '提醒' }[severity] || '未知');
const severityTag = (severity: number) => (({ 1: 'danger', 2: 'warning', 3: 'info' } as any)[severity] || 'info');
const statusName = (status: number) => ({ 1: '待确认', 2: '告警中', 3: '已恢复' }[status] || '未知');
const statusTag = (status: number) => (({ 1: 'warning', 2: 'danger', 3: 'success' } as any)[status] || 'info');
const formatNum = (value: number) => (value === undefined || value === null ? '—' : Number(value).toFixed(2));

const conditionText = (row: any) => {
    const parts: string[] = [];
    if (row.host) parts.push(`主机 ${row.host}`);
    if (row.source) parts.push(`来源 ${row.source}`);
    if (row.level) parts.push(`级别 ${row.level}`);
    if (row.keyword) parts.push(`关键字 ${row.keyword}`);
    if (parts.length === 0) parts.push('全部日志');
    return `${parts.join('、')} ${row.windowSec} 秒内 ≥ ${row.threshold} 条`;
};

const isSilenced = (until: number) => until > dayjs().valueOf() / 1000;
const silenceText = (until: number) => dayjs(until * 1000).format('MM-DD HH:mm');

const labelText = (labels: Record<string, string>) => Object.entries(labels || {}).map(([k, v]) => `${k}=${v}`).join(', ');

const getRuleData = async () => {
    state.ruleData.loading = true;
    try {
        const res = await logsApi.getAlertPage(buildQuery(ruleParam));
        if (res && res.code == 200) {
            state.ruleData.data = res.data || [];
            state.ruleData.total = res.total || 0;
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '告警规则加载失败');
    } finally {
        state.ruleData.loading = false;
    }
};

const loadEvents = async () => {
    state.eventData.loading = true;
    try {
        const query = buildQuery(eventParam);
        if (eventTimeRange.value && eventTimeRange.value.length === 2) {
            query.startAt = eventTimeRange.value[0];
            query.endAt = eventTimeRange.value[1];
        }
        const res = await logsApi.getAlertEvents(query);
        if (res && res.code == 200) {
            state.eventData.data = res.data || [];
            state.eventData.total = res.total || 0;
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '事件加载失败');
    } finally {
        state.eventData.loading = false;
    }
};

const getEventData = () => {
    eventParam.pageNum = 1;
    loadEvents();
};

watch(activeTab, (tab) => {
    if (tab === 'event' && state.eventData.data.length === 0) loadEvents();
});

onMounted(() => {
    getRuleData();
});

const resetRuleQuery = () => {
    ruleParam.name = '';
    ruleParam.level = '';
    ruleParam.enabled = '';
    ruleParam.muted = '';
    ruleParam.pageNum = 1;
    getRuleData();
};

const onRuleCurrentChange = (val: number) => {
    ruleParam.pageNum = val;
    getRuleData();
};

const onRuleSizeChange = (val: number) => {
    ruleParam.pageSize = val;
    getRuleData();
};

const onEventCurrentChange = (val: number) => {
    eventParam.pageNum = val;
    loadEvents();
};

const onEventSizeChange = (val: number) => {
    eventParam.pageSize = val;
    loadEvents();
};

const onToggleRule = (row: any) => {
    logsApi.toggleAlert({ id: row.id, enabled: row.enabled }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
            getRuleData();
        }
    });
};

const onOpenSilence = (row: any) => {
    silenceDialog.id = row.id;
    silenceDialog.name = row.name;
    silenceDialog.minute = 30;
    silenceDialog.visible = true;
};

const onSubmitSilence = () => {
    logsApi.silenceAlert({ id: silenceDialog.id, minute: silenceDialog.minute }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success(silenceDialog.minute > 0 ? `已静默 ${silenceDialog.minute} 分钟` : '已解除静默');
            silenceDialog.visible = false;
            getRuleData();
        }
    });
};

// 试算：用规则当前条件立即查一次窗口计数，不落库也不通知
const onTestRule = async (row: any) => {
    if (testingId.value !== null) return;
    testingId.value = row.id;
    try {
        const res = await logsApi.testAlert({
            name: row.name,
            selector: row.selector,
            host: row.host,
            source: row.source,
            keyword: row.keyword,
            level: row.level,
            windowSec: row.windowSec,
            threshold: row.threshold,
            severity: row.severity,
            cooldownSec: row.cooldownSec,
            groupByHost: row.groupByHost,
            enabled: row.enabled,
        });
        if (res && res.code == 200) {
            testDialog.hit = !!res.data?.hit;
            testDialog.logql = res.data?.logql || '';
            testDialog.samples = res.data?.samples || [];
            testDialog.visible = true;
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '试算失败');
    } finally {
        testingId.value = null;
    }
};

const onOpenAddRule = (type: string) => {
    alertDialogRef.value.openDialog(type);
};

const onOpenEditRule = (type: string, row: any) => {
    alertDialogRef.value.openDialog(type, row);
};

const onRuleDel = (row: any) => {
    ElMessageBox.confirm(`此操作将删除告警规则：“${row.name}”，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            logsApi.deleteAlert({ id: row.id }).then((res) => {
                if (res && res.code == 200) {
                    ElMessage.success('删除成功');
                    getRuleData();
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

// 与日志检索页同样问题：外层是定高弹性列，el-card 自带 overflow:hidden 会让 min-height:auto 失效，
// 卡片被压缩后表格底部与分页被裁掉，这里禁止卡片收缩，改由外层滚动
.logs-alert {
    > * {
        flex-shrink: 0;
    }
}

.empty-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 20px;
    max-width: 560px;
    margin: 0 auto 10px;
    text-align: left;
}

.cond-line {
    font-size: 13px;
}

.sub-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 18px;
}
</style>
