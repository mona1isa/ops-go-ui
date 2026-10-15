<template>
    <div class="cmdb-asset-detail-container">
        <el-drawer v-model="state.visible" title="资产详情" size="640px" @open="onOpen">
            <div v-loading="state.loading">
                <el-descriptions :column="2" border size="small" class="mb15">
                    <el-descriptions-item label="资产名称">{{ detail?.name }}</el-descriptions-item>
                    <el-descriptions-item label="模型">
                        <el-tag :color="modelColor(detail?.modelType)" effect="dark" size="small" style="border: none; color: #fff">{{ modelLabel(detail?.modelType) }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="IP地址">{{ detail?.ip || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="资产编号">{{ detail?.sn || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="生命周期">
                        <el-tag :type="statusOption(detail?.status ?? 0)?.type ?? 'info'" size="small">{{ statusOption(detail?.status ?? 0)?.label ?? '—' }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="负责人">{{ detail?.owner || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="供应商">{{ detail?.provider || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="机房/区域">{{ detail?.location || '—' }}</el-descriptions-item>
                    <el-descriptions-item label="到期时间">{{ detail?.expiredAt ? dayjs(detail.expiredAt).format('YYYY-MM-DD') : '—' }}</el-descriptions-item>
                    <el-descriptions-item label="来源">{{ detail?.source === 'import' ? `主机导入（#${detail?.instanceId}）` : '手动录入' }}</el-descriptions-item>
                    <el-descriptions-item label="备注" :span="2">{{ detail?.remark || '—' }}</el-descriptions-item>
                </el-descriptions>

                <el-tabs v-model="state.activeTab">
                    <el-tab-pane label="属性" name="attrs">
                        <el-descriptions :column="2" border size="small">
                            <el-descriptions-item v-for="field in attrFields" :key="field.key" :label="field.label">
                                {{ attrValue(field) }}
                            </el-descriptions-item>
                            <div v-if="attrFields.length === 0" style="padding: 8px; color: #909399">该模型无专属属性</div>
                        </el-descriptions>
                    </el-tab-pane>

                    <el-tab-pane :label="`标签（${(detail?.tags ?? []).length}）`" name="tags">
                        <div class="mb15">
                            <el-tag v-for="t in detail?.tags ?? []" :key="t.id" class="mr5" size="small" :color="t.color || undefined" :style="t.color ? 'color:#fff;border:none' : ''">{{ t.name }}</el-tag>
                            <span v-if="(detail?.tags ?? []).length === 0" style="color: #909399">暂无标签</span>
                        </div>
                        <el-select v-model="selectedTagIds" multiple filterable placeholder="选择标签（全量替换）" class="w100 mb15" v-auths="['cmdb:tag:set']">
                            <el-option v-for="t in allTags" :key="t.id" :label="t.name" :value="t.id" />
                        </el-select>
                        <div>
                            <el-button size="small" type="primary" v-auths="['cmdb:tag:set']" :loading="savingTags" @click="onSaveTags">保存标签</el-button>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane :label="`关联关系（${relations.length}）`" name="relations">
                        <el-table :data="relations" size="small" class="mb15">
                            <el-table-column label="方向" width="110">
                                <template #default="scope">
                                    <span>{{ scope.row.sourceId === state.assetId ? '本资产 →' : '← 本资产' }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="关系" width="90">
                                <template #default="scope">{{ relationLabel(scope.row.relationType) }}</template>
                            </el-table-column>
                            <el-table-column label="对端资产" show-overflow-tooltip>
                                <template #default="scope">{{ scope.row.sourceId === state.assetId ? scope.row.targetName : scope.row.sourceName }}</template>
                            </el-table-column>
                            <el-table-column label="操作" width="70">
                                <template #default="scope">
                                    <el-button size="small" text type="danger" v-auths="['cmdb:relation:delete']" @click="onDeleteRelation(scope.row)">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <div v-auths="['cmdb:relation:add']" style="display: flex; gap: 8px">
                            <el-select v-model="relForm.relationType" placeholder="关系" style="width: 110px">
                                <el-option v-for="r in cmdbRelationTypes" :key="r.value" :label="r.label" :value="r.value" />
                            </el-select>
                            <el-select
                                v-model="relForm.targetId"
                                filterable remote :remote-method="searchAssets" :loading="searching"
                                placeholder="选择对端资产（可搜索）" style="flex: 1">
                                <el-option v-for="opt in assetOptions" :key="opt.id" :label="opt.ip ? `${opt.name} (${opt.ip})` : opt.name" :value="opt.id" />
                            </el-select>
                            <el-button type="primary" size="default" :loading="savingRel" @click="onAddRelation">添加</el-button>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane label="变更记录" name="logs">
                        <el-timeline>
                            <el-timeline-item v-for="log in logs" :key="log.id" :timestamp="dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')" placement="top">
                                <el-tag size="small" class="mr5">{{ actionText(log.action) }}</el-tag>
                                <span>{{ log.detail }}</span>
                            </el-timeline-item>
                            <div v-if="logs.length === 0" style="color: #909399">暂无变更记录</div>
                        </el-timeline>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts" name="cmdbAssetDetail">
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, dayjs } from 'element-plus';
import { useCmdbApi } from '/@/api/cmdb';
import { cmdbAttrSchema, cmdbRelationTypes, modelLabel, modelColor, statusOption, relationLabel, parseAttrs } from '/@/views/cmdb/asset/schema';

const cmdbApi = useCmdbApi();

const state = reactive({ visible: false, loading: false, activeTab: 'attrs', assetId: 0 });
const detail = ref<any>(null);
const attrs = ref<Record<string, any>>({});

const allTags = ref<any[]>([]);
const selectedTagIds = ref<number[]>([]);
const savingTags = ref(false);

const relations = ref<any[]>([]);
const relForm = reactive<{ relationType: string; targetId: number | undefined }>({ relationType: 'runs_on', targetId: undefined });
const assetOptions = ref<any[]>([]);
const searching = ref(false);
const savingRel = ref(false);

const logs = ref<any[]>([]);

const attrFields = computed(() => cmdbAttrSchema[detail.value?.modelType] ?? []);
const attrValue = (field: any) => {
    const val = attrs.value[field.key];
    if (val === undefined || val === null || val === '') return '—';
    if (field.type === 'select') return field.options?.find((o: any) => o.value === val)?.label ?? val;
    return val;
};

const actionText = (action: string) =>
    (({ create: '创建', update: '编辑', status: '流转', import: '导入', relation: '关联', tag: '标签', delete: '删除' } as Record<string, string>)[action] ?? action);

const loadDetail = async () => {
    state.loading = true;
    try {
        const res = await cmdbApi.getAssetDetail({ id: state.assetId });
        if (res && res.code == 200) {
            detail.value = res.data;
            attrs.value = parseAttrs(res.data?.attrs);
            selectedTagIds.value = (res.data?.tags ?? []).map((t: any) => t.id);
        }
    } finally {
        state.loading = false;
    }
};

const loadTags = async () => {
    const res = await cmdbApi.getTagList();
    if (res && res.code == 200) allTags.value = res.data || [];
};

const loadRelations = async () => {
    const res = await cmdbApi.getRelationList({ assetId: state.assetId });
    if (res && res.code == 200) relations.value = res.data || [];
};

const loadLogs = async () => {
    const res = await cmdbApi.getChangeLog({ assetId: state.assetId, pageNum: 1, pageSize: 50 });
    if (res && res.code == 200) logs.value = res.data || [];
};

const onOpen = () => {
    detail.value = null;
    relations.value = [];
    logs.value = [];
    loadDetail();
    loadTags();
};

const openDrawer = (assetId: number) => {
    state.assetId = assetId;
    state.activeTab = 'attrs';
    state.visible = true;
};

const onSaveTags = async () => {
    savingTags.value = true;
    try {
        const res = await cmdbApi.setAssetTags({ assetId: state.assetId, tagIds: selectedTagIds.value });
        if (res && res.code == 200) {
            ElMessage.success('标签已更新');
            loadDetail();
        }
    } finally {
        savingTags.value = false;
    }
};

const searchAssets = async (keyword: string) => {
    searching.value = true;
    try {
        const res = await cmdbApi.getAssetOptions({ keyword });
        if (res && res.code == 200) assetOptions.value = res.data || [];
    } finally {
        searching.value = false;
    }
};

const onAddRelation = async () => {
    if (!relForm.targetId) {
        ElMessage.warning('请选择对端资产');
        return;
    }
    savingRel.value = true;
    try {
        const res = await cmdbApi.addRelation({ sourceId: state.assetId, targetId: relForm.targetId, relationType: relForm.relationType });
        if (res && res.code == 200) {
            ElMessage.success('关联已添加');
            relForm.targetId = undefined;
            loadRelations();
        }
    } finally {
        savingRel.value = false;
    }
};

const onDeleteRelation = (row: any) => {
    ElMessageBox.confirm('确定删除该关联关系吗?', '提示', { type: 'warning' })
        .then(async () => {
            const res = await cmdbApi.deleteRelation({ id: row.id });
            if (res && res.code == 200) {
                ElMessage.success('已删除');
                loadRelations();
            }
        })
        .catch(() => {});
};

// Tab 切换时按需加载
const onTabChange = () => {};
import { watch } from 'vue';
watch(() => state.activeTab, (tab) => {
    if (tab === 'relations' && relations.value.length === 0) {
        loadRelations();
        searchAssets('');
    }
    if (tab === 'logs' && logs.value.length === 0) loadLogs();
});

defineExpose({ openDrawer });
</script>

<style scoped lang="scss">
.mb15 { margin-bottom: 15px; }
.mr5 { margin-right: 5px; }
.w100 { width: 100%; }
</style>
