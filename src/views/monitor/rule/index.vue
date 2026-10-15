<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
            <div class="app-search mb15">
                <el-input v-model="state.tableData.param.name" size="default" placeholder="请输入规则名称" style="max-width: 180px" clearable> </el-input>
                <el-select v-model="state.tableData.param.severity" size="default" placeholder="告警级别" style="max-width: 130px; margin-left: 10px;" clearable>
                    <el-option label="紧急" :value="1" />
                    <el-option label="警告" :value="2" />
                    <el-option label="提醒" :value="3" />
                </el-select>
                <el-select v-model="state.tableData.param.muted" size="default" placeholder="静音状态" style="max-width: 120px; margin-left: 10px;" clearable>
                    <el-option label="已静音" value="1" />
                    <el-option label="未静音" value="0" />
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
                <el-button size="default" plain type="success" class="ml10" v-auths="['monitor:rule:add']" @click="onOpenAddRule('add')">
                    <el-icon>
                        <ele-FolderAdd />
                    </el-icon>
                    新增规则
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="规则名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="metric" label="指标" width="140" show-overflow-tooltip>
                    <template #default="scope">{{ scope.row.metric || '—' }}</template>
                </el-table-column>
                <el-table-column prop="promQl" label="PromQL 表达式" min-width="180" show-overflow-tooltip>
                    <template #default="scope"><span class="promql-text">{{ scope.row.promQl }}</span></template>
                </el-table-column>
                <el-table-column prop="threshold" label="触发条件" width="120">
                    <template #default="scope">{{ scope.row.operator }} {{ scope.row.threshold }}</template>
                </el-table-column>
                <el-table-column prop="severity" label="级别" width="80">
                    <template #default="scope">
                        <el-tag :type="severityTag(scope.row.severity)" size="small">{{ severityName(scope.row.severity) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="forSec" label="持续" width="80">
                    <template #default="scope">{{ scope.row.forSec > 0 ? scope.row.forSec + ' 秒' : '即时' }}</template>
                </el-table-column>
                <el-table-column prop="cooldownSec" label="冷却" width="80">
                    <template #default="scope">{{ scope.row.cooldownSec }} 秒</template>
                </el-table-column>
                <el-table-column label="静默" width="130">
                    <template #default="scope">
                        <el-tag v-if="scope.row.silenceUntil * 1000 > Date.now()" type="warning" size="small">静默至 {{ dayjs(scope.row.silenceUntil * 1000).format('MM-DD HH:mm') }}</el-tag>
                        <span v-else>—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="muted" label="静音" width="70">
                    <template #default="scope">
                        <el-tag v-if="scope.row.muted === '1'" type="info" size="small">静音</el-tag>
                        <span v-else>—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="channelIds" label="通知渠道" width="150" show-overflow-tooltip>
                    <template #default="scope">{{ channelNames(scope.row.channelIds) }}</template>
                </el-table-column>
                <el-table-column prop="enabled" label="启用" width="80">
                    <template #default="scope">
                        <el-switch
                            v-model="scope.row.enabled"
                            inline-prompt active-text="启" active-value="1"
                            inactive-text="禁" inactive-value="0"
                            v-auths="['monitor:rule:toggle']"
                            @click="onToggle(scope.row)">
                        </el-switch>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="210" fixed="right">
                    <template #default="scope">
                        <el-button size="small" text type="primary" v-auths="['monitor:rule:edit']" @click="onOpenEditRule('edit', scope.row)">修改</el-button>
                        <el-button size="small" text type="success" v-auths="['monitor:rule:test']" @click="onOpenTestDialog(scope.row)">试算</el-button>
                        <el-button size="small" text type="warning" v-auths="['monitor:rule:silence']" @click="onOpenSilenceDialog(scope.row)">静默</el-button>
                        <el-button size="small" text type="danger" v-auths="['monitor:rule:delete']" @click="onRowDel(scope.row)">删除</el-button>
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
            <RuleDialog ref="ruleDialogRef" @refresh="getTableData()" />

            <!-- 告警静默 -->
            <el-dialog v-model="silenceDialog.visible" title="告警静默" width="420px">
                <div class="mb15">规则：{{ silenceDialog.ruleName }}</div>
                <el-form label-width="90px">
                    <el-form-item label="静默时长" v-if="!silenceDialog.disabled">
                        <el-select v-model="silenceDialog.seconds" class="w100">
                            <el-option label="5 分钟" :value="300" />
                            <el-option label="30 分钟" :value="1800" />
                            <el-option label="1 小时" :value="3600" />
                            <el-option label="6 小时" :value="21600" />
                            <el-option label="24 小时" :value="86400" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="解除静默">
                        <el-switch v-model="silenceDialog.disabled"></el-switch>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="silenceDialog.visible = false">取消</el-button>
                    <el-button type="primary" @click="submitSilence">确定</el-button>
                </template>
            </el-dialog>

            <!-- 规则试算 -->
            <el-dialog v-model="testDialog.visible" title="规则试算" width="560px">
                <el-form label-width="90px" class="mb10">
                    <el-form-item label="PromQL">
                        <el-input v-model="testDialog.form.promQl" type="textarea" :rows="2"></el-input>
                    </el-form-item>
                    <el-form-item label="比较符">
                        <el-select v-model="testDialog.form.operator" style="width: 120px">
                            <el-option v-for="op in operators" :key="op" :label="op" :value="op" />
                        </el-select>
                        <span class="ml10">阈值</span>
                        <el-input-number v-model="testDialog.form.threshold" :precision="2" :step="1" controls-position="right" class="ml10" style="width: 160px" />
                    </el-form-item>
                </el-form>
                <el-button size="default" type="primary" plain :loading="testDialog.loading" @click="runRuleTest">执行试算</el-button>
                <div v-if="testDialog.result" class="test-result mt15">
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="最终表达式">
                            <span class="promql-text">{{ testDialog.result.expression }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="命中情况">
                            <el-tag :type="testDialog.result.hit > 0 ? 'danger' : 'success'" size="small">
                                命中 {{ testDialog.result.hit }} / {{ testDialog.result.matched }} 条序列
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="当前数值">{{ testValuesText }}</el-descriptions-item>
                        <el-descriptions-item label="说明">{{ testDialog.result.message || '—' }}</el-descriptions-item>
                    </el-descriptions>
                    <div class="form-tip mt10">试算仅查询当前数据，不会生成告警事件、不会发送通知。</div>
                </div>
                <template #footer>
                    <el-button @click="testDialog.visible = false">关闭</el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts" name="monitorRuleIndex">
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { useMonitorApi } from '/@/api/monitor';
import { MonitorRuleState, RowMonitorRuleType, MonitorRuleTestResultType } from '/@/types/views';
import { ElMessage, ElMessageBox, dayjs } from 'element-plus';

// 引入组件
const RuleDialog = defineAsyncComponent(() => import('/@/views/monitor/rule/dialog.vue'));

const monitorApi = useMonitorApi();

const ruleDialogRef = ref();

// 渠道 ID -> 名称映射
const channelList = ref<any[]>([]);

const operators = ['>', '>=', '<', '<=', '==', '!='];

const state = reactive<MonitorRuleState>({
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

const silenceDialog = reactive({
    visible: false,
    id: 0,
    ruleName: '',
    seconds: 1800,
    disabled: false,
});

const testDialog = reactive({
    visible: false,
    loading: false,
    form: { promQl: '', operator: '>', threshold: 0 },
    result: null as MonitorRuleTestResultType | null,
});

const testValuesText = computed(() => {
    const values = testDialog.result?.values || [];
    if (values.length === 0) return '无数据';
    return values.slice(0, 20).map((v) => Number(v.toFixed(2))).join('、') + (values.length > 20 ? ` …共 ${values.length} 个` : '');
});

const severityName = (severity: number) => {
    const names: Record<number, string> = { 1: '紧急', 2: '警告', 3: '提醒' };
    return names[severity] || '未知';
};

const severityTag = (severity: number) => {
    const tags: Record<number, string> = { 1: 'danger', 2: 'warning', 3: 'info' };
    return tags[severity] || 'info';
};

const channelNames = (channelIds: string) => {
    if (!channelIds) return '未配置';
    return channelIds
        .split(',')
        .filter(Boolean)
        .map((id) => {
            const found = channelList.value.find((item) => String(item.id) === id.trim());
            return found ? found.name : `#${id.trim()}`;
        })
        .join('、');
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
    state.tableData.param.severity = undefined;
    state.tableData.param.muted = '';
    state.tableData.param.enabled = '';
    state.tableData.param.pageNum = 1;
    getTableData();
};

// 初始化表格数据（monitor 分页接口：data 为数组、total 在顶层）
const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const res = await monitorApi.getRulePage(buildQuery(state.tableData.param));
        if (res && res.code == 200) {
            state.tableData.data = res.data || [];
            state.tableData.total = res.total || 0;
        }
    } finally {
        state.tableData.loading = false;
    }
};

const loadChannelOptions = async () => {
    try {
        const res = await monitorApi.getChannelOptions();
        if (res && res.code == 200) {
            channelList.value = res.data || [];
        }
    } catch (error) {
        // 渠道列表拉取失败时降级显示 ID
    }
};

onMounted(() => {
    getTableData();
    loadChannelOptions();
});

const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

const onToggle = (row: RowMonitorRuleType) => {
    monitorApi.toggleRule({ id: row.id, enabled: row.enabled }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
            getTableData();
        }
    });
};

const onOpenAddRule = (type: string) => {
    ruleDialogRef.value.openDialog(type);
};

const onOpenEditRule = (type: string, row: RowMonitorRuleType) => {
    ruleDialogRef.value.openDialog(type, row);
};

// 静默
const onOpenSilenceDialog = (row: RowMonitorRuleType) => {
    silenceDialog.id = row.id;
    silenceDialog.ruleName = row.name;
    silenceDialog.seconds = 1800;
    silenceDialog.disabled = false;
    silenceDialog.visible = true;
};

const submitSilence = async () => {
    const res = await monitorApi.silenceRule({
        id: silenceDialog.id,
        seconds: silenceDialog.disabled ? 0 : silenceDialog.seconds,
        disabled: silenceDialog.disabled,
    });
    if (res && res.code == 200) {
        ElMessage.success(silenceDialog.disabled ? '已解除静默' : '静默设置成功');
        silenceDialog.visible = false;
        getTableData();
    }
};

// 试算
const onOpenTestDialog = (row: RowMonitorRuleType) => {
    testDialog.form = { promQl: row.promQl, operator: row.operator || '>', threshold: row.threshold ?? 0 };
    testDialog.result = null;
    testDialog.visible = true;
};

const runRuleTest = async () => {
    if (!testDialog.form.promQl) {
        ElMessage.warning('请输入 PromQL 表达式');
        return;
    }
    testDialog.loading = true;
    try {
        const res = await monitorApi.testRule({ ...testDialog.form });
        if (res && res.code == 200) {
            testDialog.result = res.data;
        }
    } finally {
        testDialog.loading = false;
    }
};

const onRowDel = (row: RowMonitorRuleType) => {
    ElMessageBox.confirm(`此操作将删除告警规则：“${row.name}”，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            monitorApi.deleteRule({ id: row.id }).then((res) => {
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

.promql-text {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
}

.form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}
</style>
