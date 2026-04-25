<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
            <div class="app-search mb15">
                <el-input v-model="state.tableData.param.name" size="default" placeholder="请输入主机名称" style="max-width: 180px" clearable> </el-input>
                
                <el-button size="default" plain type="primary" class="ml10" @click="getTableData()">
                    <el-icon>
                        <ele-Search />
                    </el-icon>
                    查询
                </el-button>
                
                <el-button size="default" plain type="success" class="ml10" @click="onOpenAddInstance('add')">
                    <el-icon>
                        <ele-FolderAdd />
                    </el-icon>
                    新增主机
                </el-button>
                <el-button size="default" plain type="warning" class="ml10" @click="showSyncHostDialog">
                    <el-icon>
                        <ele-Refresh />
                    </el-icon>
                    同步主机
                </el-button>
            </div>
            <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="主机名称" show-overflow-tooltip>
                    <template #default="scope">
                        <el-link type="primary" @click="onOpenSSH(scope.row)">{{ scope.row.name }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column prop="spec" label="规格" show-overflow-tooltip></el-table-column>
                <el-table-column prop="ip" label="主机IP" show-overflow-tooltip></el-table-column>
                <el-table-column prop="bindingKeys" label="登录凭证" show-overflow-tooltip>
                    <template #default="scope">
                        <el-link v-if="scope.row.bindingKeys.length > 0" type="primary" @click="onOpenUnbindKey(scope.row)">{{ getbindingKeys(scope.row.bindingKeys) }}</el-link>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="主机状态" show-overflow-tooltip>
                    <template #default="scope">
                        <el-switch 
                            v-model="scope.row.status" 
                            inline-prompt active-text="启" active-value="1" 
                            inactive-text="禁" inactive-value="0" 
                            @click="onStatusChange(scope.row)">
                        </el-switch>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="主机描述" show-overflow-tooltip></el-table-column>
                <el-table-column prop="createdAt" label="创建时间" show-overflow-tooltip>
                    <template #default="scope">{{ dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="scope">
                        <el-dropdown>
                            <el-button size="small" text type="primary">
                                操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="onOpenSSH(scope.row)">SSH 连接</el-dropdown-item>
                                    <el-dropdown-item @click="onOpenDetail(scope.row)">查看详情</el-dropdown-item>
                                    <el-dropdown-item @click="onOpenEditInstance('edit', scope.row)">修改</el-dropdown-item>
                                    <el-dropdown-item @click="onRowDel(scope.row)">删除</el-dropdown-item>
                                    <el-dropdown-item @click="onOpenBindKey(scope.row)">绑定凭证</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
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
        <InstanceDialog ref="instanceDialogRef" @refresh="getTableData()" />
        <DetailDrawer ref="detailDrawerRef" />
        <BindKeyDialog ref="bindKeyDialogRef" @refresh="getTableData()"/>
        <UnbindingKeyDialog ref="unbindingKeyDialogRef" @refresh="getTableData()"/>
        <TerminalDialog ref="terminalDialogRef" @close="handleTerminalClose"/>
        
        <!-- 同步主机对话框 -->
        <el-dialog v-model="syncHostDialogVisible" title="同步主机" width="500px">
            <el-form>
                <el-form-item label="IP网段">
                    <el-input v-model="ipRangeInput" placeholder="请输入IP网段，如：192.168.1.0/24 或 192.168.1.1-100" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="syncHostDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="startScanHosts" :loading="scanning">开始扫描</el-button>
            </template>
        </el-dialog>

        <!-- 扫描结果对话框 -->
        <el-dialog v-model="scanResultDialogVisible" title="扫描结果" width="800px">
            <el-table :data="scanResultList" style="width: 100%" @selection-change="handleScanResultSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="ip" label="主机IP" />
                <el-table-column prop="port" label="端口" width="80" />
                <el-table-column prop="osType" label="系统类型" width="120">
                    <template #default="scope">
                        <el-tag :type="scope.row.osType === 'Linux' ? 'success' : 'primary'">{{ scope.row.osType }}</el-tag>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination
                @size-change="handleScanResultSizeChange"
                @current-change="handleScanResultCurrentChange"
                :current-page="scanResultPageNum"
                :page-sizes="[10, 20, 30, 50]"
                :page-size="scanResultPageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="scanResultTotal"
                style="margin-top: 10px;"
            />
            <template #footer>
                <el-button @click="scanResultDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveScanHosts" :disabled="selectedScanHosts.length === 0">确定保存</el-button>
            </template>
        </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts" name="instanceIndex">
import { defineAsyncComponent, onMounted, reactive, ref } from 'vue';
import { useInstanceApi } from '/@/api/instance';
import { InstanceStatusItem, InstanceState, RowInstanceType } from '/@/types/views';
import { ElMessage, ElMessageBox } from 'element-plus';
import { dayjs } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { useKeyApi } from '/@/api/keys';
import { Session } from '/@/utils/storage';

// 引入组件
const InstanceDialog = defineAsyncComponent(() => import('/@/views/instance/dialog.vue'));

// 引入抽屉组件
const DetailDrawer = defineAsyncComponent(() => import('/@/views/instance/detail.vue'));

// 引入绑定凭证对话框
const BindKeyDialog = defineAsyncComponent(() => import('/@/views/instance/bingkey.vue'));

// 引入解绑凭证对话框
const UnbindingKeyDialog = defineAsyncComponent(() => import('/@/views/instance/unbindingkey.vue'));

// 引入 SSH 终端对话框
const TerminalDialog = defineAsyncComponent(() => import('/@/views/instance/terminal.vue'));

// 定义接口
const instanceApi = useInstanceApi();

// 凭证接口
const keyApi = useKeyApi();

// 定义变量
const instanceDialogRef = ref();
const detailDrawerRef = ref();
const bindKeyDialogRef = ref();
const unbindingKeyDialogRef = ref();
const terminalDialogRef = ref();

// 同步主机相关变量
const syncHostDialogVisible = ref(false);
const ipRangeInput = ref('');
const scanning = ref(false);
const scanResultDialogVisible = ref(false);
const scanResultList = ref<any[]>([]);
const scanResultPageNum = ref(1);
const scanResultPageSize = ref(10);
const scanResultTotal = ref(0);
const selectedScanHosts = ref<any[]>([]);

const state = reactive<InstanceState>({
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

// 初始化表格数据
const getTableData = async () => {
    state.tableData.loading = true;
    const res = await instanceApi.getInstancePage(state.tableData.param);
    if (res && res.code == 200) {
        let data = res.data;
        state.tableData.data = data.data;
        state.tableData.total = data.total;
    }
    setTimeout(() => {
        state.tableData.loading = false;
    }, 500);
};

onMounted(() => {
    getTableData();
});
// 页码改变
const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};
// 每页条数改变
const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

// 修改主机状态
const onStatusChange = (row: InstanceStatusItem) => {
    instanceApi.updateInstanceStatus({ id: row.id, status: row.status }).then((res) => {
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
            getTableData();
        }
    });
};

// 打开修改窗口
const onOpenEditInstance = (type: string, row: RowInstanceType) => {
    instanceDialogRef.value.openDialog(type, row);
};

// 打开新增窗口
const onOpenAddInstance = (type: string) => {
    instanceDialogRef.value.openDialog(type);
};

// 主机详情
const onOpenDetail = (row: RowInstanceType) => {
    detailDrawerRef.value.openDrawer(row);
};

// 获取绑定凭证
const getbindingKeys = (bindingKeys: any) => {
    if (!bindingKeys || bindingKeys.length === 0) return '未绑定任何凭证';
    return bindingKeys.map((item: any) => {
        return `${item.name}`;
    }).join('; ');
};

// 打开绑定凭证对话框
const onOpenBindKey = (row: RowInstanceType) => {
    bindKeyDialogRef.value.openDialog(row.id);
};

// 打开解绑凭证对话框
const onOpenUnbindKey = (row: RowInstanceType) => {
    if (row.bindingKeys && row.bindingKeys.length > 0) {
        unbindingKeyDialogRef.value.openDialog(row.id, row.bindingKeys);
    }
};

// 打开 SSH 终端对话框（保留原有功能）
const onOpenSSH = (row: RowInstanceType) => {
    terminalDialogRef.value?.openDialog(row.id);
};

// SSH 终端关闭回调
const handleTerminalClose = () => {
    // 可以在这里处理终端关闭后的逻辑
};

// 删除操作
const onRowDel = (row: RowInstanceType) => {
    ElMessageBox.confirm(`此操作将永久删除主机名称：“${row.name}”，是否继续?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            instanceApi.deleteInstance(row.id).then((res) => {
                if (res && res.code == 200) {
                    ElMessage.success('删除成功');
                    getTableData();
                }
            });
        })
        .catch(() => {});
};

// 显示同步主机对话框
const showSyncHostDialog = () => {
    ipRangeInput.value = '';
    syncHostDialogVisible.value = true;
};

// 开始扫描主机
const startScanHosts = async () => {
    if (!ipRangeInput.value) {
        ElMessage.warning('请输入IP网段');
        return;
    }
    scanning.value = true;
    try {
        const res = await instanceApi.scanHosts({ ipRange: ipRangeInput.value });
        if (res && res.code === 200) {
            scanResultList.value = res.data.hosts || [];
            scanResultTotal.value = scanResultList.value.length;
            syncHostDialogVisible.value = false;
            scanResultDialogVisible.value = true;
            scanResultPageNum.value = 1;
            ElMessage.success(`扫描完成，发现 ${scanResultList.value.length} 台主机`);
        } else {
            ElMessage.error(res?.msg || '扫描失败');
        }
    } catch (error) {
        ElMessage.error('扫描请求失败');
    } finally {
        scanning.value = false;
    }
};

// 扫描结果分页处理
const handleScanResultSizeChange = (val: number) => {
    scanResultPageSize.value = val;
    scanResultPageNum.value = 1;
};

const handleScanResultCurrentChange = (val: number) => {
    scanResultPageNum.value = val;
};

// 处理扫描结果选中
const handleScanResultSelectionChange = (selection: any[]) => {
    selectedScanHosts.value = selection;
};

// 保存扫描到的主机
const saveScanHosts = async () => {
    if (selectedScanHosts.value.length === 0) {
        ElMessage.warning('请选择要保存的主机');
        return;
    }
    try {
        const res = await instanceApi.saveScannedHosts({
            hosts: selectedScanHosts.value,
        });
        if (res && res.code === 200) {
            ElMessage.success(`成功保存 ${selectedScanHosts.value.length} 台主机`);
            scanResultDialogVisible.value = false;
            getTableData();
        } else {
            ElMessage.error(res?.msg || '保存失败');
        }
    } catch (error) {
        ElMessage.error('保存请求失败');
    }
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