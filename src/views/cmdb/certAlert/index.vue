<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto cert-alert">
            <el-card shadow="hover">
                <el-tabs v-model="activeTab">
                    <!-- 到期概览 -->
                    <el-tab-pane label="到期概览" name="overview">
                        <div class="app-search mb15">
                            <el-select v-model="overviewParam.modelTypes" size="default" placeholder="资产模型" style="max-width: 220px" multiple clearable collapse-tags>
                                <el-option v-for="item in cmdbModelTypes" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                            <el-input-number v-model="overviewParam.warningDays" :min="1" :max="3650" :step="7" controls-position="right" size="default" style="margin-left: 10px; width: 160px" />
                            <span class="sub-tip ml10">天（含已过期）</span>
                            <el-button size="default" plain type="primary" class="ml10" @click="loadOverview">
                                <el-icon><ele-Search /></el-icon>
                                查询
                            </el-button>
                            <el-button size="default" plain type="info" class="ml10" @click="resetOverviewQuery">
                                <el-icon><ele-Refresh /></el-icon>
                                重置
                            </el-button>
                            <span class="sub-tip ml10">展示预警窗口内（含已过期）且未退役的资产，按到期时间升序</span>
                        </div>

                        <el-table :data="state.overviewData.data" v-loading="state.overviewData.loading" style="width: 100%">
                            <template #empty>
                                <el-empty :image-size="80" description="暂无临期资产">
                                    <div class="empty-desc">
                                        <p>此处展示在 CMDB「资产台账」中填写了到期时间、且落在预警窗口内的域名/证书等资产。</p>
                                        <p>为空的常见原因：① 尚未在资产上填写到期时间 → ② 到期时间超出当前查询窗口。调整上方「天」可扩大范围。</p>
                                    </div>
                                </el-empty>
                            </template>
                            <el-table-column prop="name" label="资产名称" min-width="160" show-overflow-tooltip />
                            <el-table-column prop="modelType" label="模型" width="110">
                                <template #default="scope">
                                    <el-tag :color="modelColor(scope.row.modelType)" effect="dark" size="small" style="border: none; color: #fff">{{ modelText(scope.row.modelType) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="sn" label="编号" min-width="120" show-overflow-tooltip />
                            <el-table-column prop="ip" label="IP" width="140" show-overflow-tooltip />
                            <el-table-column prop="owner" label="负责人" width="110" show-overflow-tooltip />
                            <el-table-column prop="expiredAt" label="到期时间" width="170">
                                <template #default="scope">{{ scope.row.expiredAt ? dayjs(scope.row.expiredAt).format('YYYY-MM-DD HH:mm') : '—' }}</template>
                            </el-table-column>
                            <el-table-column prop="remaining" label="剩余" width="110" sortable :sort-method="(a, b) => a.remaining - b.remaining">
                                <template #default="scope">{{ remainingText(scope.row.remaining) }}</template>
                            </el-table-column>
                            <el-table-column prop="levelText" label="状态" width="100">
                                <template #default="scope">
                                    <el-tag :type="severityTag(scope.row.level)" size="small">{{ scope.row.levelText }}</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>

                    <!-- 告警规则 -->
                    <el-tab-pane label="告警规则" name="rule">
                        <div class="app-search mb15">
                            <el-input v-model="ruleParam.name" size="default" placeholder="请输入规则名称" style="max-width: 180px" clearable />
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
                            <el-button size="default" plain type="success" class="ml10" v-auths="['cmdb:cert:rule:add']" @click="onOpenAddRule('add')">
                                <el-icon><ele-FolderAdd /></el-icon>
                                新增规则
                            </el-button>
                        </div>

                        <el-table :data="state.ruleData.data" v-loading="state.ruleData.loading" style="width: 100%">
                            <template #empty>
                                <el-empty :image-size="80" description="暂无证书到期告警规则">
                                    <div class="empty-desc">
                                        <p>规则按「资产模型 + 到期前 N 天」扫描 CMDB 资产，命中后写入告警事件并按所选渠道通知。</p>
                                        <p>建议顺序：①「资产台账」为域名/证书填写到期时间 → ②「监控告警 - 通知渠道」配置渠道 → ③ 回到这里新增规则。</p>
                                    </div>
                                    <el-button type="primary" plain v-auths="['cmdb:cert:rule:add']" @click="onOpenAddRule('add')">新增规则</el-button>
                                </el-empty>
                            </template>
                            <el-table-column prop="id" label="ID" width="60" />
                            <el-table-column prop="name" label="规则名称" min-width="150" show-overflow-tooltip />
                            <el-table-column label="资产模型" min-width="160" show-overflow-tooltip>
                                <template #default="scope">{{ modelTypesText(scope.row.modelTypes) }}</template>
                            </el-table-column>
                            <el-table-column prop="warningDays" label="预警" width="100">
                                <template #default="scope">到期前 {{ scope.row.warningDays }} 天</template>
                            </el-table-column>
                            <el-table-column prop="severity" label="级别" width="80">
                                <template #default="scope">
                                    <el-tag :type="severityTag(scope.row.severity)" size="small">{{ severityName(scope.row.severity) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="cooldownSec" label="重复通知" width="110">
                                <template #default="scope">{{ cooldownText(scope.row.cooldownSec) }}</template>
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
                                        v-auths="['cmdb:cert:rule:toggle']"
                                        @click="onToggleRule(scope.row)"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="200" fixed="right">
                                <template #default="scope">
                                    <el-button size="small" text type="warning" v-auths="['cmdb:cert:rule:silence']" @click="onOpenSilence(scope.row)">静默</el-button>
                                    <el-button size="small" text type="primary" v-auths="['cmdb:cert:rule:edit']" @click="onOpenEditRule('edit', scope.row)">修改</el-button>
                                    <el-button size="small" text type="danger" v-auths="['cmdb:cert:rule:delete']" @click="onRuleDel(scope.row)">删除</el-button>
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

                    <!-- 告警事件 -->
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
                            <el-button size="default" plain type="primary" class="ml10" @click="getEventData">
                                <el-icon><ele-Search /></el-icon>
                                查询
                            </el-button>
                            <el-button size="default" plain class="ml10" @click="loadEvents">
                                <el-icon><ele-Refresh /></el-icon>
                                刷新
                            </el-button>
                            <span class="sub-tip ml10">事件处理（确认/备注）可到「监控告警 - 告警事件」页面统一操作，证书到期与指标/日志告警共用同一事件表</span>
                        </div>

                        <el-table :data="state.eventData.data" v-loading="state.eventData.loading" style="width: 100%">
                            <template #empty>
                                <el-empty :image-size="80" description="暂无证书到期告警事件">
                                    <div class="empty-desc">
                                        <p>规则命中到期/超期资产后事件写入这里，与「监控告警 - 告警事件」共用同一张事件表，按来源 cert 区分。</p>
                                    </div>
                                </el-empty>
                            </template>
                            <el-table-column prop="id" label="ID" width="70" />
                            <el-table-column prop="ruleName" label="规则名称" min-width="140" show-overflow-tooltip />
                            <el-table-column prop="instanceIp" label="资产" width="150" show-overflow-tooltip />
                            <el-table-column prop="severity" label="级别" width="80">
                                <template #default="scope">
                                    <el-tag :type="severityTag(scope.row.severity)" size="small">{{ severityName(scope.row.severity) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="剩余/阈值" width="120">
                                <template #default="scope">{{ remainingText(Number(scope.row.value)) }} / {{ scope.row.threshold }} 天</template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="90">
                                <template #default="scope">
                                    <el-tag :type="statusTag(scope.row.status)" size="small">{{ statusName(scope.row.status) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="summary" label="告警摘要" min-width="240" show-overflow-tooltip />
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
        </div>
    </div>
</template>

<script setup lang="ts" name="cmdbCertAlertIndex">
import { defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue';
import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { useCmdbApi } from '/@/api/cmdb';
import { RowCmdbCertExpiringType, RowMonitorEventType } from '/@/types/views';
import { cmdbModelTypes } from '/@/views/cmdb/asset/schema';

const AlertDialog = defineAsyncComponent(() => import('/@/views/cmdb/certAlert/dialog.vue'));

const cmdbApi = useCmdbApi();

const activeTab = ref('overview');
const alertDialogRef = ref();

const overviewParam = reactive<Record<string, any>>({
    modelTypes: [] as string[],
    warningDays: 30,
});

const ruleParam = reactive<Record<string, any>>({
    pageNum: 1,
    pageSize: 10,
    name: '',
    enabled: '',
    muted: '',
});

const eventParam = reactive<Record<string, any>>({
    pageNum: 1,
    pageSize: 10,
    ruleId: undefined,
    severity: undefined,
    status: undefined,
});

const state = reactive({
    overviewData: { data: [] as RowCmdbCertExpiringType[], loading: false },
    ruleData: { data: [] as any[], total: 0, loading: false, param: { pageNum: 1, pageSize: 10 } },
    eventData: { data: [] as RowMonitorEventType[], total: 0, loading: false },
});

const silenceDialog = reactive({ visible: false, id: 0, name: '', minute: 1440 });

// 剔除空筛选字段（后端指针类型字段传空字符串会 400）
const buildQuery = (param: Record<string, any>) => {
    const query: Record<string, any> = {};
    Object.keys(param).forEach((key) => {
        const val = param[key];
        if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
            query[key] = val;
        }
    });
    return query;
};

const severityName = (severity: number) => (({ 1: '紧急', 2: '警告', 3: '提醒' } as any)[severity] || '未知');
const severityTag = (severity: number) => (({ 1: 'danger', 2: 'warning', 3: 'info' } as any)[severity] || 'info');
const statusName = (status: number) => (({ 1: '待确认', 2: '告警中', 3: '已恢复' } as any)[status] || '未知');
const statusTag = (status: number) => (({ 1: 'warning', 2: 'danger', 3: 'success' } as any)[status] || 'info');

const modelText = (value: string) => cmdbModelTypes.find((m) => m.value === value)?.label || value;
const modelColor = (value: string) => cmdbModelTypes.find((m) => m.value === value)?.color || '#909399';
const modelTypesText = (value: string) => {
    if (!value) return '全部资产';
    return value
        .split(',')
        .filter(Boolean)
        .map((t) => modelText(t))
        .join('、');
};

const remainingText = (remaining: number) => {
    if (remaining === undefined || remaining === null) return '—';
    if (remaining < 0) return `已过期 ${-remaining} 天`;
    if (remaining === 0) return '今天到期';
    return `剩余 ${remaining} 天`;
};

const cooldownText = (sec: number) => {
    if (!sec) return '每天';
    if (sec % 3600 === 0) return `${sec / 3600} 小时`;
    if (sec % 60 === 0) return `${sec / 60} 分钟`;
    return `${sec} 秒`;
};

const isSilenced = (until: number) => until > dayjs().valueOf() / 1000;
const silenceText = (until: number) => dayjs(until * 1000).format('MM-DD HH:mm');

const loadOverview = async () => {
    state.overviewData.loading = true;
    try {
        const query: Record<string, any> = { warningDays: overviewParam.warningDays || 30 };
        if (overviewParam.modelTypes && overviewParam.modelTypes.length > 0) {
            query.modelTypes = overviewParam.modelTypes.join(',');
        }
        const res = await cmdbApi.getCertExpiring(query);
        if (res && res.code == 200) {
            state.overviewData.data = res.data || [];
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '到期概览加载失败');
    } finally {
        state.overviewData.loading = false;
    }
};

const resetOverviewQuery = () => {
    overviewParam.modelTypes = [];
    overviewParam.warningDays = 30;
    loadOverview();
};

const getRuleData = async () => {
    state.ruleData.loading = true;
    try {
        const res = await cmdbApi.getCertRulePage(buildQuery(ruleParam));
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
        const res = await cmdbApi.getCertEvents(buildQuery(eventParam));
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
    if (tab === 'rule' && state.ruleData.data.length === 0) getRuleData();
});

onMounted(() => {
    loadOverview();
    getRuleData();
});

const resetRuleQuery = () => {
    ruleParam.name = '';
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
    cmdbApi.toggleCertRule({ id: row.id, enabled: row.enabled }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
            getRuleData();
        }
    });
};

const onOpenSilence = (row: any) => {
    silenceDialog.id = row.id;
    silenceDialog.name = row.name;
    silenceDialog.minute = 1440;
    silenceDialog.visible = true;
};

const onSubmitSilence = () => {
    cmdbApi.silenceCertRule({ id: silenceDialog.id, minute: silenceDialog.minute }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success(silenceDialog.minute > 0 ? `已静默 ${silenceDialog.minute} 分钟` : '已解除静默');
            silenceDialog.visible = false;
            getRuleData();
        }
    });
};

const onOpenAddRule = (type: string) => {
    alertDialogRef.value.openDialog(type);
};

const onOpenEditRule = (type: string, row: any) => {
    alertDialogRef.value.openDialog(type, row);
};

const onRuleDel = (row: any) => {
    ElMessageBox.confirm(`此操作将删除告警规则：“${row.name}”，并关闭其未恢复的事件，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            cmdbApi.deleteCertRule({ id: row.id }).then((res) => {
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

.cert-alert {
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
