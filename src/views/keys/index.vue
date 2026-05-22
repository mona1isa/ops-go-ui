<template>
    <div class="keys-page layout-pd">
        <!-- 统计卡片 -->
        <el-row :gutter="15" class="mb15">
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
                <div class="stat-card stat-card-primary">
                    <div class="stat-card-content">
                        <div class="stat-card-num">{{ state.stats.total }}</div>
                        <div class="stat-card-label">总凭证数</div>
                    </div>
                    <div class="stat-card-icon">
                        <el-icon :size="40"><ele-Key /></el-icon>
                    </div>
                </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
                <div class="stat-card stat-card-success">
                    <div class="stat-card-content">
                        <div class="stat-card-num">{{ state.stats.enabled }}</div>
                        <div class="stat-card-label">已启用</div>
                    </div>
                    <div class="stat-card-icon">
                        <el-icon :size="40"><ele-CircleCheck /></el-icon>
                    </div>
                </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
                <div class="stat-card stat-card-danger">
                    <div class="stat-card-content">
                        <div class="stat-card-num">{{ state.stats.disabled }}</div>
                        <div class="stat-card-label">已禁用</div>
                    </div>
                    <div class="stat-card-icon">
                        <el-icon :size="40"><ele-CircleClose /></el-icon>
                    </div>
                </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
                <div class="stat-card stat-card-info">
                    <div class="stat-card-content">
                        <div class="stat-card-num">{{ state.stats.sshCount }}</div>
                        <div class="stat-card-label">SSH 凭证</div>
                    </div>
                    <div class="stat-card-icon">
                        <el-icon :size="40"><ele-Monitor /></el-icon>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- 筛选区域 -->
        <div class="filter-section mb15">
            <el-input
                v-model="state.tableData.param.name"
                placeholder="凭证名称"
                clearable
                style="width: 150px"
                @keyup.enter="getTableData()"
            />
            <el-select v-model="state.tableData.param.protocol" placeholder="协议" clearable style="width: 120px" class="ml10">
                <el-option label="SSH" value="ssh"></el-option>
                <el-option label="RDP" value="rdp"></el-option>
                <el-option label="VNC" value="vnc"></el-option>
            </el-select>
            <el-select v-model="state.tableData.param.status" placeholder="状态" clearable style="width: 120px" class="ml10">
                <el-option label="启用" value="1"></el-option>
                <el-option label="禁用" value="0"></el-option>
            </el-select>
            <el-button type="primary" class="ml10" @click="getTableData()">
                <el-icon><ele-Search /></el-icon>
                查询
            </el-button>
            <el-button @click="handleReset">
                <el-icon><ele-Refresh /></el-icon>
                重置
            </el-button>
            <el-button type="success" class="ml10" @click="onOpenAddKey('add')">
                <el-icon><ele-Plus /></el-icon>
                新增凭证
            </el-button>
        </div>

        <!-- 凭证卡片列表 -->
        <div class="key-cards" v-loading="state.tableData.loading">
            <el-row :gutter="15">
                <el-col
                    :xs="24"
                    :sm="12"
                    :md="8"
                    :lg="6"
                    v-for="item in state.tableData.data"
                    :key="item.id"
                    class="mb15"
                >
                    <div class="key-card" :class="item.status === '1' ? 'key-card-enabled' : 'key-card-disabled'">
                        <div class="key-card-header">
                            <div class="key-card-title">
                                <el-icon><ele-Key /></el-icon>
                                <el-link type="primary" :underline="false" @click="goToDetail(item)">{{ item.name }}</el-link>
                            </div>
                            <el-dropdown trigger="click" placement="bottom-end">
                                <el-icon class="key-card-more"><ele-MoreFilled /></el-icon>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item v-if="item.status === '0'" @click="onStatusChange(item, '1')">
                                            <el-icon><ele-CircleCheck /></el-icon>启用
                                        </el-dropdown-item>
                                        <el-dropdown-item v-if="item.status === '1'" @click="onStatusChange(item, '0')">
                                            <el-icon><ele-CircleClose /></el-icon>禁用
                                        </el-dropdown-item>
                                        <el-dropdown-item @click="onOpenEditKey('edit', item)">
                                            <el-icon><ele-Edit /></el-icon>修改
                                        </el-dropdown-item>
                                        <el-dropdown-item @click="onDeleteKey(item)" divided>
                                            <el-icon><ele-Delete /></el-icon>删除
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                        <div class="key-card-body">
                            <div class="key-card-info">
                                <div class="info-item">
                                    <el-icon><ele-User /></el-icon>
                                    <span>{{ item.user }}</span>
                                </div>
                                <div class="info-item">
                                    <el-icon :class="getProtocolIconClass(item.protocol)"><ele-Monitor /></el-icon>
                                    <span>{{ item.protocol?.toUpperCase() }}:{{ item.port }}</span>
                                </div>
                            </div>
                            <div class="key-card-meta">
                                <div class="meta-item">
                                    <span class="meta-label">类型:</span>
                                    <el-tag size="small" :type="item.type === 1 ? 'warning' : 'success'">
                                        {{ item.type === 1 ? '密码' : '密钥' }}
                                    </el-tag>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">状态:</span>
                                    <el-tag size="small" :type="item.status === '1' ? 'success' : 'danger'">
                                        {{ item.status === '1' ? '启用' : '禁用' }}
                                    </el-tag>
                                </div>
                            </div>
                            <div class="key-card-remark" v-if="item.remark">
                                <el-icon><ele-Document /></el-icon>
                                <el-tooltip :content="item.remark" placement="top" :disabled="item.remark.length <= 20">
                                    <span>{{ item.remark.length > 20 ? item.remark.substring(0, 20) + '...' : item.remark }}</span>
                                </el-tooltip>
                            </div>
                        </div>
                        <div class="key-card-footer">
                            <span class="create-time">
                                <el-icon><ele-Clock /></el-icon>
                                {{ dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') }}
                            </span>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </div>

        <!-- 空状态 -->
        <el-empty v-if="!state.tableData.loading && state.tableData.data.length === 0" description="暂无凭证数据" />

        <!-- 分页 -->
        <div class="pagination mt15" v-if="state.tableData.total > 0">
            <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="state.tableData.param.pageNum"
                :page-sizes="[8, 16, 24, 32]"
                :page-size="state.tableData.param.pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="state.tableData.total"
                background
            />
        </div>

        <KeyDialog ref="keysDialogRef" @refresh="getTableData()"/>
    </div>
</template>

<script setup lang="ts" name="keys">
import { reactive, onMounted, defineAsyncComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useKeyApi } from '/@/api/keys';
import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { KeyState, RowKeyType } from '/@/types/views';

// 定义组件
const KeyDialog = defineAsyncComponent(() => import('/@/views/keys/dialog.vue'));

const keyApi = useKeyApi();
const router = useRouter();
// 定义变量内容
const keysDialogRef = ref();

const state = reactive<KeyState>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: {
            name: '',
            protocol: '',
            status: '',
            pageNum: 1,
            pageSize: 8,
        },
    },
    stats: {
        total: 0,
        enabled: 0,
        disabled: 0,
        sshCount: 0,
    },
});

// 获取统计信息
const getStatistics = () => {
    const data = state.tableData.data;
    state.stats.total = state.tableData.total;
    state.stats.enabled = data.filter((item: RowKeyType) => item.status === '1').length;
    state.stats.disabled = data.filter((item: RowKeyType) => item.status === '0').length;
    state.stats.sshCount = data.filter((item: RowKeyType) => item.protocol?.toLowerCase() === 'ssh').length;
};

// 获取密钥分页列表
const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const params = { ...state.tableData.param };
        const res = await keyApi.getKeyPage(params);
        if (res && res.code === 200) {
            state.tableData.data = res.data.data;
            state.tableData.total = res.data.total;
            getStatistics();
        }
    } finally {
        state.tableData.loading = false;
    }
};

// 重置查询
const handleReset = () => {
    state.tableData.param = {
        name: '',
        protocol: '',
        status: '',
        pageNum: 1,
        pageSize: 8,
    };
    getTableData();
};


// 跳转到凭证详情页
const goToDetail = (row: RowKeyType) => {
	router.push({ name: 'keysDetail', params: { id: row.id } });
};
// 获取协议图标样式
const getProtocolIconClass = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
        case 'ssh': return 'protocol-ssh';
        case 'rdp': return 'protocol-rdp';
        case 'vnc': return 'protocol-vnc';
        default: return '';
    }
};

// 修改密钥状态
const onStatusChange = async (row: RowKeyType, status: string) => {
    const res = await keyApi.updateKeyStatus({
        id: row.id,
        status: status,
    });
    if (res.code === 200) {
        ElMessage.success(status === '1' ? '启用成功' : '禁用成功');
        getTableData();
    }
};

// 打开新增密钥弹窗
const onOpenAddKey = (type: string) => {
    keysDialogRef.value.openDialog(type);
};

// 修改密钥
const onOpenEditKey = (type: string, row: RowKeyType) => {
    keysDialogRef.value.openDialog(type, row);
};

// 删除密钥
const onDeleteKey = (row: RowKeyType) => {
    ElMessageBox.confirm(`确定删除凭证「${row.name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(() => {
        keyApi.deleteKey(row.id).then((res) => {
            if (res && res.code === 200) {
                ElMessage.success('删除成功');
                getTableData();
            }
        });
    }).catch(() => {});
};

// 分页大小变化
const handleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

// 当前页变化
const handleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

onMounted(() => {
    getTableData();
});
</script>

<style scoped lang="scss">
.keys-page {
    .stat-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-radius: 8px;
        background: var(--el-color-white);
        border: 1px solid var(--next-border-color-light);
        transition: all 0.3s;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &-content {
            .stat-card-num {
                font-size: 28px;
                font-weight: bold;
                color: var(--el-text-color-primary);
            }
            .stat-card-label {
                font-size: 14px;
                color: var(--el-text-color-secondary);
                margin-top: 5px;
            }
        }

        &-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        &.stat-card-primary .stat-card-icon {
            background: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
        }
        &.stat-card-success .stat-card-icon {
            background: var(--el-color-success-light-9);
            color: var(--el-color-success);
        }
        &.stat-card-danger .stat-card-icon {
            background: var(--el-color-danger-light-9);
            color: var(--el-color-danger);
        }
        &.stat-card-info .stat-card-icon {
            background: var(--el-color-info-light-9);
            color: var(--el-color-info);
        }
    }

    .filter-section {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: 15px;
        background: var(--el-color-white);
        border-radius: 8px;
        border: 1px solid var(--next-border-color-light);
    }

    .key-cards {
        min-height: 300px;
    }

    .key-card {
        background: var(--el-color-white);
        border-radius: 8px;
        border: 1px solid var(--next-border-color-light);
        overflow: hidden;
        transition: all 0.3s;

        &:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);

            .key-card-more {
                color: var(--el-color-primary);
            }
        }

        &-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            border-bottom: 1px solid var(--next-border-color-light);

            .key-card-title {
                display: flex;
                align-items: center;
                font-weight: 500;
                font-size: 15px;
                color: var(--el-text-color-primary);
                overflow: hidden;

                span {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .key-card-more {
                cursor: pointer;
                color: var(--el-text-color-placeholder);
                transition: color 0.3s;
            }
        }

        &-body {
            padding: 15px;

            .key-card-info {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: var(--el-text-color-regular);

                    .el-icon {
                        color: var(--el-text-color-placeholder);
                    }

                    .protocol-ssh {
                        color: var(--el-color-success);
                    }
                    .protocol-rdp {
                        color: var(--el-color-primary);
                    }
                    .protocol-vnc {
                        color: var(--el-color-warning);
                    }
                }
            }

            .key-card-meta {
                display: flex;
                gap: 15px;
                margin-bottom: 10px;

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 12px;

                    .meta-label {
                        color: var(--el-text-color-placeholder);
                    }
                }
            }

            .key-card-remark {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                color: var(--el-text-color-secondary);
                background: var(--next-bg-color);
                padding: 6px 10px;
                border-radius: 4px;

                .el-icon {
                    color: var(--el-text-color-placeholder);
                    flex-shrink: 0;
                }

                span {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }

        &-footer {
            display: flex;
            justify-content: flex-end;
            padding: 10px 15px;
            border-top: 1px solid var(--next-border-color-light);
            background: var(--next-bg-color);

            .create-time {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                color: var(--el-text-color-placeholder);

                .el-icon {
                    font-size: 14px;
                }
            }
        }

        // 状态颜色
        &.key-card-enabled {
            border-left: 3px solid var(--el-color-success);
        }
        &.key-card-disabled {
            border-left: 3px solid var(--el-color-danger);
            opacity: 0.7;
        }
    }

    .pagination {
        display: flex;
        justify-content: flex-end;
        padding: 15px;
        background: var(--el-color-white);
        border-radius: 8px;
        border: 1px solid var(--next-border-color-light);
    }
}
</style>
