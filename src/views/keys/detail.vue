<template>
    <div class="key-detail-container layout-pd">
        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="mb15">
            <el-breadcrumb-item :to="{ path: '/keys' }">凭证管理</el-breadcrumb-item>
            <el-breadcrumb-item>凭证详情</el-breadcrumb-item>
        </el-breadcrumb>

        <!-- 基本信息卡片 -->
        <el-card shadow="never" class="detail-card">
            <template #header>
                <div class="card-header">
                    <span class="card-title">
                        <el-icon><ele-Key /></el-icon>
                        基本信息
                    </span>
                    <el-tag :type="keyDetail.status === '1' ? 'success' : 'danger'" size="large">
                        {{ keyDetail.status === '1' ? '启用' : '禁用' }}
                    </el-tag>
                </div>
            </template>
            <el-descriptions :column="2" border v-loading="detailLoading" class="key-descriptions">
                <el-descriptions-item label="凭证名称" min-width="200">
                    <span class="desc-value">{{ keyDetail.name || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="登录用户" min-width="200">
                    <span class="desc-value">{{ keyDetail.user || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="凭证类型">
                    <el-tag :type="keyDetail.type === 1 ? 'warning' : 'success'" size="small">
                        {{ keyDetail.type === 1 ? '密码' : '密钥' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="协议端口">
                    <span class="desc-value">{{ (keyDetail.protocol || '').toUpperCase() }}:{{ keyDetail.port }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">
                    <span class="desc-value">{{ keyDetail.remark || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                    <span class="desc-value">{{ dayjs(keyDetail.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="更新时间">
                    <span class="desc-value">{{ dayjs(keyDetail.updatedAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
                </el-descriptions-item>
            </el-descriptions>
        </el-card>

        <!-- 已绑定主机卡片 -->
        <el-card shadow="never" class="bound-hosts-card mt15">
            <template #header>
                <div class="card-header">
                    <span class="card-title">
                        <el-icon><ele-Monitor /></el-icon>
                        已绑定主机
                    </span>
                    <el-button type="primary" @click="bindDialogVisible = true">
                        <el-icon><ele-Plus /></el-icon>
                        绑定主机
                    </el-button>
                </div>
            </template>

            <el-table
                :data="boundInstances"
                v-loading="tableLoading"
                stripe
                style="width: 100%"
                empty-text="暂无绑定主机"
            >
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="主机名称" min-width="150" show-overflow-tooltip />
                <el-table-column prop="ip" label="IP地址" width="150" />
                <el-table-column prop="os" label="操作系统" width="100">
                    <template #default="scope">
                        {{ scope.row.os || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="规格" width="150">
                    <template #default="scope">
                        <template v-if="scope.row.cpu || scope.row.memMb || scope.row.diskGb">
                            {{ scope.row.cpu }}c / {{ scope.row.memMb }}M / {{ scope.row.diskGb }}G
                        </template>
                        <template v-else>-</template>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="90">
                    <template #default="scope">
                        <el-tag :type="scope.row.status === '1' ? 'success' : 'danger'" size="small">
                            {{ scope.row.status === '1' ? '正常' : '禁用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="在线状态" width="100">
                    <template #default="scope">
                        <el-tag :type="scope.row.onlineStatus === '1' ? 'success' : 'info'" size="small">
                            {{ scope.row.onlineStatus === '1' ? '在线' : '离线' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="scope">
                        <el-button type="danger" link size="small" @click="handleUnbind(scope.row)">
                            <el-icon><ele-Close /></el-icon>
                            解绑
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper" v-if="pageResult.total > 0">
                <el-pagination
                    v-model:current-page="pageNum"
                    v-model:page-size="pageSize"
                    :total="pageResult.total"
                    :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next"
                    @size-change="fetchBoundInstances"
                    @current-change="fetchBoundInstances"
                    background
                />
            </div>
        </el-card>

        <!-- 绑定主机对话框 -->
        <BindHostDialog
            v-model:visible="bindDialogVisible"
            :key-id="keyId"
            @success="onBindSuccess"
        />
    </div>
</template>

<script setup lang="ts" name="keysDetail">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, dayjs } from 'element-plus';
import { useKeyApi } from '/@/api/keys';
import type { RowKeyType, RowInstanceType } from '/@/types/views';
import BindHostDialog from './components/bindHost.vue';

const route = useRoute();
const keyApi = useKeyApi();

const keyId = Number(route.params.id);

const keyDetail = ref<Partial<RowKeyType>>({});
const boundInstances = ref<RowInstanceType[]>([]);
const pageResult = ref({ total: 0, pageNum: 1, pageSize: 10, totalPage: 0 });
const detailLoading = ref(false);
const tableLoading = ref(false);
const pageNum = ref(1);
const pageSize = ref(10);
const bindDialogVisible = ref(false);

const fetchKeyDetail = async () => {
    detailLoading.value = true;
    try {
        const res = await keyApi.getKeyDetail(keyId);
        keyDetail.value = res.data || {};
    } catch (err) {
        ElMessage.error('获取凭证详情失败');
    } finally {
        detailLoading.value = false;
    }
};

const fetchBoundInstances = async () => {
    tableLoading.value = true;
    try {
        const res = await keyApi.getKeyInstances(keyId, {
            pageNum: pageNum.value,
            pageSize: pageSize.value,
        });
        const data = res.data || {};
        boundInstances.value = data.data || [];
        pageResult.value = {
            total: data.total || 0,
            pageNum: data.pageNum || 1,
            pageSize: data.pageSize || 10,
            totalPage: data.totalPage || 0,
        };
    } catch (err) {
        boundInstances.value = [];
    } finally {
        tableLoading.value = false;
    }
};

const handleUnbind = async (row: RowInstanceType) => {
    try {
        await ElMessageBox.confirm(
            `确定要解绑主机 "${row.name}" (${row.ip}) 吗？解除绑定后该主机将无法使用此凭证登录。`,
            '确认解绑',
            {
                type: 'warning',
                confirmButtonText: '确定解绑',
                cancelButtonText: '取消',
                confirmButtonClass: 'el-button--danger',
            }
        );
        await keyApi.unbindInstance(keyId, row.id!);
        ElMessage.success('解绑成功');
        await fetchBoundInstances();
    } catch (err) {
        // cancelled or error (error handled by request interceptor)
    }
};

const onBindSuccess = () => {
    bindDialogVisible.value = false;
    fetchBoundInstances();
};

onMounted(() => {
    fetchKeyDetail();
    fetchBoundInstances();
});
</script>

<style scoped>
.key-detail-container {
    max-width: 1200px;
}

.detail-card,
.bound-hosts-card {
    border-radius: 8px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 15px;
    color: var(--el-text-color-primary);
}

.key-descriptions {
    margin-top: 4px;
}

.desc-value {
    color: var(--el-text-color-regular);
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}
</style>
