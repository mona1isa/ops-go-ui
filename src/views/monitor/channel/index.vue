<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
            <div class="app-search mb15">
                <el-input v-model="state.tableData.param.name" size="default" placeholder="请输入渠道名称" style="max-width: 180px" clearable> </el-input>
                <el-select v-model="state.tableData.param.type" size="default" placeholder="渠道类型" style="max-width: 140px; margin-left: 10px;" clearable>
                    <el-option label="Webhook" :value="1" />
                    <el-option label="邮件" :value="2" />
                    <el-option label="钉钉" :value="3" />
                    <el-option label="企业微信" :value="4" />
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
                <el-button size="default" plain type="success" class="ml10" v-auths="['monitor:channel:add']" @click="onOpenAddChannel('add')">
                    <el-icon>
                        <ele-FolderAdd />
                    </el-icon>
                    新增渠道
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="渠道名称" show-overflow-tooltip></el-table-column>
                <el-table-column prop="type" label="类型" width="110">
                    <template #default="scope">
                        <el-tag :type="channelTypeTag(scope.row.type)" size="small">{{ channelTypeName(scope.row.type) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="url" label="回调地址" show-overflow-tooltip></el-table-column>
                <el-table-column prop="secret" label="签名密钥" width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.secret" type="success" size="small" effect="plain">已配置</el-tag>
                        <span v-else>—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="headers" label="自定义请求头" show-overflow-tooltip></el-table-column>
                <el-table-column prop="enabled" label="启用状态" width="90">
                    <template #default="scope">
                        <el-switch
                            v-model="scope.row.enabled"
                            inline-prompt active-text="启" active-value="1"
                            inactive-text="禁" inactive-value="0"
                            v-auths="['monitor:channel:toggle']"
                            @click="onToggle(scope.row)">
                        </el-switch>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip></el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="160">
                    <template #default="scope">{{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</template>
                </el-table-column>
                <el-table-column label="操作" width="180">
                    <template #default="scope">
                        <el-button size="small" text type="primary" v-auths="['monitor:channel:edit']" @click="onOpenEditChannel('edit', scope.row)">修改</el-button>
                        <el-button size="small" text type="warning" v-auths="['monitor:channel:test']" :loading="testingId === scope.row.id" @click="onTestChannel(scope.row)">测试</el-button>
                        <el-button size="small" text type="danger" v-auths="['monitor:channel:delete']" @click="onRowDel(scope.row)">删除</el-button>
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
            <ChannelDialog ref="channelDialogRef" @refresh="getTableData()" />
        </div>
    </div>
</template>

<script setup lang="ts" name="monitorChannelIndex">
import { defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { useMonitorApi } from '/@/api/monitor';
import { MonitorChannelState, RowMonitorChannelType } from '/@/types/views';
import { ElMessage, ElMessageBox, dayjs } from 'element-plus';

// 引入组件
const ChannelDialog = defineAsyncComponent(() => import('/@/views/monitor/channel/dialog.vue'));

const monitorApi = useMonitorApi();

const channelDialogRef = ref();
const testingId = ref<number | null>(null);

const state = reactive<MonitorChannelState>({
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

// 渠道类型名称
const channelTypeName = (type: number) => {
    const names: Record<number, string> = { 1: 'Webhook', 2: '邮件', 3: '钉钉', 4: '企业微信' };
    return names[type] || '未知';
};

const channelTypeTag = (type: number) => {
    const tags: Record<number, string> = { 1: 'primary', 2: 'info', 3: 'warning', 4: 'success' };
    return tags[type] || 'info';
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

// 重置搜索条件
const resetTableData = () => {
    state.tableData.param.name = '';
    state.tableData.param.type = undefined;
    state.tableData.param.enabled = '';
    state.tableData.param.pageNum = 1;
    getTableData();
};

// 初始化表格数据（monitor 分页接口：data 为数组、total 在顶层）
const getTableData = async () => {
    state.tableData.loading = true;
    try {
        const res = await monitorApi.getChannelPage(buildQuery(state.tableData.param));
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
});

const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

// 启停渠道
const onToggle = (row: RowMonitorChannelType) => {
    monitorApi.toggleChannel({ id: row.id, enabled: row.enabled }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
            getTableData();
        }
    });
};

// 测试发送
const onTestChannel = (row: RowMonitorChannelType) => {
    ElMessageBox.confirm(`将通过渠道“${row.name}”发送一条测试消息，是否继续?`, '测试发送', {
        confirmButtonText: '发送',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            testingId.value = row.id;
            try {
                const res = await monitorApi.testChannel({ id: row.id });
                if (res && res.code == 200) {
                    if (res.data && res.data.success) {
                        ElMessage.success(res.data.message || '测试发送成功');
                    } else {
                        ElMessageBox.alert(res.data?.message || '测试发送失败', '发送结果', { type: 'error' });
                    }
                }
            } finally {
                testingId.value = null;
            }
        })
        .catch(() => {});
};

// 打开新增窗口
const onOpenAddChannel = (type: string) => {
    channelDialogRef.value.openDialog(type);
};

// 打开修改窗口
const onOpenEditChannel = (type: string, row: RowMonitorChannelType) => {
    channelDialogRef.value.openDialog(type, row);
};

// 删除
const onRowDel = (row: RowMonitorChannelType) => {
    ElMessageBox.confirm(`此操作将删除通知渠道：“${row.name}”，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            monitorApi.deleteChannel({ id: row.id }).then((res) => {
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
</style>
