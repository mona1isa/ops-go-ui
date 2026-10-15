<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view">
            <el-row :gutter="15" class="ipam-row">
                <el-col :xs="24" :sm="10" :md="8" :lg="7" :xl="6">
                    <el-card shadow="hover" class="subnet-card">
                        <template #header>
                            <div class="card-header">
                                <span>网段列表</span>
                                <el-button size="small" plain type="primary" v-auths="['cmdb:subnet:add']" @click="onOpenAdd">新增</el-button>
                            </div>
                        </template>
                        <div class="subnet-search mb10">
                            <el-input v-model="state.subnetParam.keyword" size="small" placeholder="名称/CIDR" clearable @keyup.enter="loadSubnets" @clear="loadSubnets">
                                <template #append>
                                    <el-button size="small" @click="loadSubnets"><el-icon><ele-Search /></el-icon></el-button>
                                </template>
                            </el-input>
                        </div>
                        <el-scrollbar height="calc(100vh - 320px)">
                            <div
                                v-for="row in state.subnets"
                                :key="row.id"
                                class="subnet-item"
                                :class="{ 'subnet-item-active': state.current?.id === row.id }"
                                @click="onSelect(row)"
                            >
                                <div class="subnet-name">{{ row.name }}</div>
                                <div class="subnet-cidr">{{ row.cidr }}<span v-if="row.vlan" class="ml10">VLAN {{ row.vlan }}</span></div>
                            </div>
                            <el-empty v-if="!state.subnetLoading && state.subnets.length === 0" description="暂无网段" :image-size="60" />
                        </el-scrollbar>
                        <el-pagination
                            class="mt10"
                            small
                            background
                            layout="prev, pager, next"
                            :pager-count="5"
                            v-model:current-page="state.subnetParam.pageNum"
                            :page-size="state.subnetParam.pageSize"
                            :total="state.subnetTotal"
                            @current-change="loadSubnets"
                        />
                    </el-card>
                </el-col>

                <el-col :xs="24" :sm="14" :md="16" :lg="17" :xl="18">
                    <el-card shadow="hover" v-loading="state.usageLoading">
                        <template #header>
                            <div class="card-header">
                                <span>{{ state.current ? `${state.current.name}（${state.current.cidr}）` : '网段使用情况' }}</span>
                                <el-button v-if="state.current" size="small" text type="primary" @click="loadUsage">刷新</el-button>
                            </div>
                        </template>
                        <el-empty v-if="!state.current" description="请选择左侧网段查看 IP 占用" />
                        <template v-else>
                            <div class="usage-summary mb15">
                                <div class="usage-nums">
                                    <span>容量 <b>{{ state.usage.capacity }}</b></span>
                                    <span class="ml15">已占用 <b>{{ state.usage.used }}</b></span>
                                    <span class="ml15">空闲 <b>{{ Math.max(state.usage.capacity - state.usage.used, 0) }}</b></span>
                                    <el-tag v-if="state.current.gateway" size="small" type="info" class="ml15">网关 {{ state.current.gateway }}</el-tag>
                                </div>
                                <el-progress :percentage="usagePercent" :status="usagePercent >= 90 ? 'exception' : usagePercent >= 70 ? 'warning' : 'success'" :stroke-width="14" class="mt10" />
                            </div>
                            <el-table :data="state.usage.usage" size="small" style="width: 100%" max-height="480">
                                <el-table-column prop="ip" label="IP 地址" width="140" />
                                <el-table-column prop="kind" label="来源" width="100">
                                    <template #default="scope">
                                        <el-tag :type="scope.row.kind === 'asset' ? 'primary' : 'success'" size="small">{{ scope.row.kind === 'asset' ? '资产' : '纳管主机' }}</el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
                                <el-table-column prop="status" label="状态" width="120">
                                    <template #default="scope">
                                        <span>{{ scope.row.status || '—' }}</span>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="owner" label="负责人" width="110" show-overflow-tooltip>
                                    <template #default="scope">{{ scope.row.owner || '—' }}</template>
                                </el-table-column>
                                <el-table-column prop="location" label="位置" min-width="120" show-overflow-tooltip>
                                    <template #default="scope">{{ scope.row.location || '—' }}</template>
                                </el-table-column>
                            </el-table>
                            <div class="ops-row mt10" v-if="state.current">
                                <el-button size="small" plain type="primary" v-auths="['cmdb:subnet:edit']" @click="onEdit(state.current)">编辑网段</el-button>
                                <el-button size="small" plain type="danger" v-auths="['cmdb:subnet:delete']" @click="onDel(state.current)">删除网段</el-button>
                            </div>
                        </template>
                    </el-card>
                </el-col>
            </el-row>

            <el-dialog v-model="dialogVisible" :title="dialogForm.id ? '编辑网段' : '新增网段'" width="460px">
                <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="80px">
                    <el-form-item label="名称" prop="name">
                        <el-input v-model="dialogForm.name" maxlength="64" placeholder="如 办公区网段" />
                    </el-form-item>
                    <el-form-item label="CIDR" prop="cidr">
                        <el-input v-model="dialogForm.cidr" placeholder="如 10.0.1.0/24" />
                    </el-form-item>
                    <el-form-item label="网关">
                        <el-input v-model="dialogForm.gateway" placeholder="如 10.0.1.1（可选）" />
                    </el-form-item>
                    <el-form-item label="VLAN">
                        <el-input v-model="dialogForm.vlan" maxlength="32" placeholder="可选" />
                    </el-form-item>
                    <el-form-item label="备注">
                        <el-input v-model="dialogForm.remark" type="textarea" :rows="2" maxlength="200" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts" name="cmdbIpamIndex">
import { computed, onMounted, reactive, ref } from 'vue';
import { useCmdbApi } from '/@/api/cmdb';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';

const cmdbApi = useCmdbApi();

const state = reactive({
    subnets: [] as any[],
    subnetTotal: 0,
    subnetLoading: false,
    subnetParam: { pageNum: 1, pageSize: 20, keyword: '' },
    current: null as any,
    usageLoading: false,
    usage: { capacity: 0, used: 0, usage: [] as any[] },
});

const dialogVisible = ref(false);
const submitting = ref(false);
const dialogFormRef = ref<FormInstance>();
const dialogForm = reactive({ id: 0, name: '', cidr: '', gateway: '', vlan: '', remark: '' });

const dialogRules: FormRules = {
    name: [{ required: true, message: '请输入网段名称', trigger: 'blur' }],
    cidr: [
        { required: true, message: '请输入 CIDR', trigger: 'blur' },
        { pattern: /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/, message: 'CIDR 格式不合法，示例：10.0.1.0/24', trigger: 'blur' },
    ],
};

const usagePercent = computed(() => {
    if (!state.usage.capacity) return 0;
    return Math.min(Math.round((state.usage.used / state.usage.capacity) * 100), 100);
});

const loadSubnets = async () => {
    state.subnetLoading = true;
    try {
        const query: Record<string, any> = { pageNum: state.subnetParam.pageNum, pageSize: state.subnetParam.pageSize };
        if (state.subnetParam.keyword) query.keyword = state.subnetParam.keyword;
        const res = await cmdbApi.getSubnetPage(query);
        if (res && res.code == 200) {
            state.subnets = res.data || [];
            state.subnetTotal = res.total || 0;
            if (state.subnets.length > 0 && !state.subnets.some((s) => s.id === state.current?.id)) {
                onSelect(state.subnets[0]);
            } else if (state.subnets.length === 0) {
                state.current = null;
                state.usage = { capacity: 0, used: 0, usage: [] };
            }
        }
    } finally {
        state.subnetLoading = false;
    }
};

const loadUsage = async () => {
    if (!state.current) return;
    state.usageLoading = true;
    try {
        const res = await cmdbApi.getSubnetUsage({ id: state.current.id });
        if (res && res.code == 200) {
            state.usage = res.data || { capacity: 0, used: 0, usage: [] };
        }
    } finally {
        state.usageLoading = false;
    }
};

const onSelect = (row: any) => {
    state.current = row;
    loadUsage();
};

onMounted(() => {
    loadSubnets();
});

const onOpenAdd = () => {
    Object.assign(dialogForm, { id: 0, name: '', cidr: '', gateway: '', vlan: '', remark: '' });
    dialogVisible.value = true;
};

const onEdit = (row: any) => {
    Object.assign(dialogForm, { id: row.id, name: row.name, cidr: row.cidr, gateway: row.gateway || '', vlan: row.vlan || '', remark: row.remark || '' });
    dialogVisible.value = true;
};

const onSubmit = async () => {
    const valid = await dialogFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    submitting.value = true;
    try {
        const payload = { ...dialogForm };
        const res = dialogForm.id ? await cmdbApi.updateSubnet(payload) : await cmdbApi.addSubnet(payload);
        if (res && res.code == 200) {
            ElMessage.success(dialogForm.id ? '网段已更新' : '网段已创建');
            dialogVisible.value = false;
            loadSubnets();
        }
    } finally {
        submitting.value = false;
    }
};

const onDel = (row: any) => {
    ElMessageBox.confirm(`确认删除网段「${row.name}」？不会影响已录入的资产 IP。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            const res = await cmdbApi.deleteSubnet({ id: row.id });
            if (res && res.code == 200) {
                ElMessage.success('删除成功');
                if (state.current?.id === row.id) state.current = null;
                loadSubnets();
            }
        })
        .catch(() => {});
};
</script>

<style scoped>
.ipam-row {
    height: 100%;
}
.subnet-card {
    height: 100%;
}
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.subnet-item {
    padding: 8px 10px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid transparent;
}
.subnet-item:hover {
    background: var(--el-fill-color-light);
}
.subnet-item-active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
}
.subnet-name {
    font-size: 14px;
}
.subnet-cidr {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
}
.ml10 {
    margin-left: 10px;
}
.ml15 {
    margin-left: 15px;
}
.usage-nums b {
    font-size: 16px;
    color: var(--el-color-primary);
}
</style>
