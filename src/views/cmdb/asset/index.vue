<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
            <div class="app-search mb15">
                <el-input v-model="state.tableData.param.keyword" size="default" placeholder="名称/IP/资产编号" style="max-width: 180px" clearable> </el-input>
                <el-select v-model="state.tableData.param.modelType" size="default" placeholder="模型类型" style="max-width: 130px; margin-left: 10px;" clearable>
                    <el-option v-for="m in cmdbModelTypes" :key="m.value" :label="m.label" :value="m.value" />
                </el-select>
                <el-select v-model="state.tableData.param.status" size="default" placeholder="生命周期" style="max-width: 120px; margin-left: 10px;" clearable>
                    <el-option v-for="s in cmdbStatusOptions" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
                <el-select v-model="state.tableData.param.tagId" size="default" placeholder="标签" style="max-width: 130px; margin-left: 10px;" clearable>
                    <el-option v-for="t in tagList" :key="t.id" :label="t.name" :value="t.id" />
                </el-select>
                <el-button size="default" class="ml10" :type="state.tableData.param.expireWithin ? 'danger' : 'default'" plain @click="toggleExpireFilter">
                    7天内到期
                </el-button>

                <el-button size="default" plain type="primary" class="ml10" @click="getTableData()">
                    <el-icon><ele-Search /></el-icon>
                    查询
                </el-button>
                <el-button size="default" plain type="info" class="ml10" @click="resetTableData()">
                    <el-icon><ele-Refresh /></el-icon>
                    重置
                </el-button>
                <el-button size="default" plain type="success" class="ml10" v-auths="['cmdb:asset:add']" @click="onOpenAdd('add')">
                    <el-icon><ele-FolderAdd /></el-icon>
                    新增资产
                </el-button>
                <el-button size="default" plain type="warning" class="ml10" v-auths="['cmdb:asset:import']" :loading="importing" @click="onImportInstances">
                    <el-icon><ele-Upload /></el-icon>
                    导入纳管主机
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="资产名称" min-width="140" show-overflow-tooltip>
                    <template #default="scope">
                        <el-link type="primary" :underline="false" @click="onOpenDetail(scope.row)">{{ scope.row.name }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column prop="modelType" label="模型" width="100">
                    <template #default="scope">
                        <el-tag :color="modelColor(scope.row.modelType)" effect="dark" size="small" style="border: none; color: #fff">
                            {{ modelLabel(scope.row.modelType) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="ip" label="IP地址" width="130" show-overflow-tooltip>
                    <template #default="scope">{{ scope.row.ip || '—' }}</template>
                </el-table-column>
                <el-table-column prop="sn" label="资产编号" width="120" show-overflow-tooltip>
                    <template #default="scope">{{ scope.row.sn || '—' }}</template>
                </el-table-column>
                <el-table-column prop="status" label="生命周期" width="90">
                    <template #default="scope">
                        <el-tag :type="statusOption(scope.row.status)?.type ?? 'info'" size="small">{{ statusOption(scope.row.status)?.label ?? scope.row.status }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="tags" label="标签" min-width="140">
                    <template #default="scope">
                        <el-tag v-for="t in scope.row.tags" :key="t.id" size="small" class="mr5" :color="t.color || undefined" :style="t.color ? 'color:#fff;border:none' : ''">{{ t.name }}</el-tag>
                        <span v-if="!scope.row.tags || scope.row.tags.length === 0">—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="owner" label="负责人" width="90" show-overflow-tooltip />
                <el-table-column prop="expiredAt" label="到期时间" width="120">
                    <template #default="scope">
                        <span :class="{ 'expire-danger': isExpiringSoon(scope.row.expiredAt) }">
                            {{ scope.row.expiredAt ? dayjs(scope.row.expiredAt).format('YYYY-MM-DD') : '—' }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="230" fixed="right">
                    <template #default="scope">
                        <el-button size="small" text type="primary" v-auths="['cmdb:asset:edit']" @click="onOpenAdd('edit', scope.row)">编辑</el-button>
                        <el-button size="small" text type="warning" v-auths="['cmdb:asset:transition']" @click="onTransition(scope.row)">流转</el-button>
                        <el-button size="small" text type="danger" v-auths="['cmdb:asset:delete']" @click="onRowDel(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-pagination
                @size-change="onHandleSizeChange"
                @current-change="onHandleCurrentChange"
                class="mt15"
                :pager-count="5"
                :page-sizes="[10, 20, 50]"
                v-model:current-page="state.tableData.param.pageNum"
                background
                v-model:page-size="state.tableData.param.pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="state.tableData.total"
            >
            </el-pagination>
            </el-card>
            <AssetDialog ref="assetDialogRef" @refresh="getTableData()" />
            <AssetDetail ref="assetDetailRef" />
            <el-dialog v-model="transitionVisible" :title="`状态流转 - ${transitionRow?.name ?? ''}`" width="420px">
                <el-form label-width="90px">
                    <el-form-item label="当前状态">
                        <el-tag :type="statusOption(transitionRow?.status)?.type ?? 'info'" size="small">{{ statusOption(transitionRow?.status)?.label ?? '—' }}</el-tag>
                    </el-form-item>
                    <el-form-item label="目标状态">
                        <el-select v-model="transitionForm.status" placeholder="请选择目标状态" class="w100">
                            <el-option v-for="s in cmdbStatusOptions.filter((o) => o.value !== transitionRow?.status)" :key="s.value" :label="s.label" :value="s.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="备注">
                        <el-input v-model="transitionForm.remark" type="textarea" maxlength="200" :rows="2" placeholder="流转原因（写入变更记录，可选）" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="transitionVisible = false">取消</el-button>
                    <el-button type="primary" :loading="transitioning" @click="onTransitionSubmit">确认流转</el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts" name="cmdbAssetIndex">
import { defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { useCmdbApi } from '/@/api/cmdb';
import { cmdbModelTypes, cmdbStatusOptions, modelLabel, modelColor, statusOption } from '/@/views/cmdb/asset/schema';
import { ElMessage, ElMessageBox, dayjs } from 'element-plus';

const AssetDialog = defineAsyncComponent(() => import('/@/views/cmdb/asset/dialog.vue'));
const AssetDetail = defineAsyncComponent(() => import('/@/views/cmdb/asset/detail.vue'));

const cmdbApi = useCmdbApi();

const assetDialogRef = ref();
const assetDetailRef = ref();
const importing = ref(false);
const tagList = ref<any[]>([]);

const state = reactive({
    tableData: {
        data: [] as any[],
        total: 0,
        loading: false,
        param: {
            pageNum: 1,
            pageSize: 10,
            keyword: '',
            modelType: '',
            status: undefined as number | undefined,
            tagId: undefined as number | undefined,
            expireWithin: 0,
        },
    },
});

const loadTags = async () => {
    try {
        const res = await cmdbApi.getTagList();
        if (res && res.code == 200) {
            tagList.value = res.data || [];
        }
    } catch (error) {
        // 标签列表加载失败不影响主表
    }
};

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

const isExpiringSoon = (expiredAt?: string) => {
    if (!expiredAt) return false;
    const diff = dayjs(expiredAt).diff(dayjs(), 'day');
    return diff <= 7;
};

const toggleExpireFilter = () => {
    state.tableData.param.expireWithin = state.tableData.param.expireWithin ? 0 : 7;
    getTableData();
};

const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const res = await cmdbApi.getAssetPage(buildQuery(state.tableData.param));
        if (res && res.code == 200) {
            state.tableData.data = res.data || [];
            state.tableData.total = res.total || 0;
        }
    } finally {
        state.tableData.loading = false;
    }
};

onMounted(() => {
    getTableData();
    loadTags();
});

const resetTableData = () => {
    state.tableData.param.keyword = '';
    state.tableData.param.modelType = '';
    state.tableData.param.status = undefined;
    state.tableData.param.tagId = undefined;
    state.tableData.param.expireWithin = 0;
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

const onOpenAdd = (type: string, row?: any) => {
    assetDialogRef.value.openDialog(type, row);
};

const onOpenDetail = (row: any) => {
    assetDetailRef.value.openDrawer(row.id);
};

// 生命周期流转
const transitionVisible = ref(false);
const transitioning = ref(false);
const transitionRow = ref<any>(null);
const transitionForm = reactive<{ status: number | undefined; remark: string }>({ status: undefined, remark: '' });

const onTransition = (row: any) => {
    transitionRow.value = row;
    transitionForm.status = undefined;
    transitionForm.remark = '';
    transitionVisible.value = true;
};

const onTransitionSubmit = async () => {
    if (!transitionForm.status) {
        ElMessage.warning('请选择目标状态');
        return;
    }
    transitioning.value = true;
    try {
        const res = await cmdbApi.transitionAsset({ id: transitionRow.value.id, status: transitionForm.status, remark: transitionForm.remark });
        if (res && res.code == 200) {
            ElMessage.success('状态流转成功');
            transitionVisible.value = false;
            getTableData();
        }
    } finally {
        transitioning.value = false;
    }
};

// 从纳管主机导入服务器资产
const onImportInstances = () => {
    ElMessageBox.confirm('将把主机管理中未入库的主机批量导入为「服务器」资产，是否继续?', '导入纳管主机', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            importing.value = true;
            try {
                const res = await cmdbApi.importInstances();
                if (res && res.code == 200) {
                    ElMessage.success(`导入完成，新增 ${res.data?.created ?? 0} 台服务器资产`);
                    getTableData();
                }
            } finally {
                importing.value = false;
            }
        })
        .catch(() => {});
};

const onRowDel = (row: any) => {
    ElMessageBox.confirm(`此操作将删除资产「${row.name}」及其标签与关联关系，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            cmdbApi.deleteAsset({ id: row.id }).then((res) => {
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
.expire-danger {
    color: var(--el-color-danger);
    font-weight: 600;
}
.mr5 {
    margin-right: 5px;
}
</style>
