<template>
    <div class="keys-index">
        <el-card shadow="hover" class="layout-padding-auto">
            <div class="keys-search mb20">
				<el-input v-model="state.tableData.param.name" size="default" placeholder="请输入密钥名称" style="max-width: 180px; margin-right: 20px;" clearable> </el-input>
				<el-select v-model="state.tableData.param.protocol" size="default" placeholder="请选择协议" style="max-width: 180px; margin-right: 20px;" clearable>
                    <el-option label="SSH" value="ssh"></el-option>
                    <el-option label="RDP" value="rdp"></el-option>
                    <el-option label="VNC" value="vnc"></el-option>
                </el-select>
                <el-select v-model="state.tableData.param.status" size="default" placeholder="请选择状态" style="max-width: 180px; margin-right: 20px;" clearable>
                    <el-option label="启用" value="1"></el-option>
                    <el-option label="禁用" value="0"></el-option>
                </el-select>
                <el-button size="default" plain type="primary" class="ml10" @click="getTableData()">
					<el-icon>
						<ele-Search />
					</el-icon>
					查询
				</el-button>
				<el-button size="default" plain type="success" class="ml10" @click="onOpenAddKey('add')" >
					<el-icon>
						<ele-FolderAdd />
					</el-icon>
					新增凭证
				</el-button>
			</div>
            <el-row :gutter="20">
                <el-col :span="4" v-for="(item, index) in state.tableData.data" :key="index">
                    <el-card class="key-card">
                        <div class="key-card-header">
                            <el-dropdown trigger="hover" placement="bottom-end" class="key-actions-dropdown">
                                <el-icon class="key-actions">
                                    <ele-MoreFilled />
                                </el-icon>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item v-if="item.status === '0'" @click="onStatusChange(item, '1')">启用</el-dropdown-item>
                                        <el-dropdown-item v-if="item.status === '1'" @click="onStatusChange(item, '0')">禁用</el-dropdown-item>
                                        <el-dropdown-item @click="onOpenEditKey('edit', item)">修改</el-dropdown-item>
                                        <el-dropdown-item @click="onDeleteKey(item)">删除</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                        <div class="key-id"><span class="key-label">ID:</span> {{ item.id }}</div>
                        <div class="key-name"><span class="key-label">名称:</span> {{ item.name }}</div>
                        <div class="key-name"><span class="key-label">用户名:</span> {{ item.user }}</div>
                        <div class="key-name"><span class="key-label">类型:</span> {{ item.type === 1 ? '密码' : '密钥'}}</div>
                        <div class="key-value"><span class="key-label">协议:</span> {{ item.protocol }}</div>
                        <div class="key-value"><span class="key-label">端口号:</span> {{ item.port }}</div>
                        <div class="key-status">
                            <span class="key-label">状态:</span>
                            <el-tag :type="item.status === '1' ? 'success' : 'danger'">
                                {{ item.status === '1' ? '启用' : '禁用' }}
                            </el-tag>
                        </div>
                        <div class="key-name"><span class="key-label">备注:</span>
                            <el-tooltip v-if="item.remark && item.remark.length > 15" :content="item.remark" placement="top">
                                <span>{{ item.remark.substring(0, 15) + '...' }}</span>
                            </el-tooltip>
                            <span v-else>{{ item.remark }}</span>
                        </div>
                        <div class="key-created"><span class="key-label">创建时间:</span> {{ dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</div>
                    </el-card>
                </el-col>
            </el-row>
        </el-card>
        <el-row :gutter="20" class="mt20">
            <el-col :span="24">
                <el-pagination
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    :current-page="state.tableData.param.pageNum"
                    :page-sizes="[6, 12, 18, 24]"
                    :page-size="state.tableData.param.pageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="state.tableData.total"
                />
            </el-col>
        </el-row>
        <KeyDialog ref="keysDialogRef" @refresh="getTableData()"/>
    </div>
</template>

<script setup lang="ts" name="keys">
import { reactive, onMounted, defineAsyncComponent, ref } from 'vue';
import { useKeyApi } from '/@/api/keys';
import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { KeyState, RowKeyType } from '/@/types/views';

// 定义组件
const KeyDialog = defineAsyncComponent(() => import('/@/views/keys/dialog.vue'));

// 定义接口
const keyApi = useKeyApi();

// 定义变量内容
const keysDialogRef = ref();

const state = reactive<KeyState>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: {
            pageNum: 1,
            pageSize: 6, // 每页显示6条数据
        },
    },
});

// 获取密钥分页列表
const getTableData = async () => {
    const params = {
        ...state.tableData.param,
    };
    const res = await keyApi.getKeyPage(params);
    if (res && res.code === 200) {
        let data = res.data;
        state.tableData.data = data.data;
        state.tableData.total = data.total;
    }
};

// 修改密钥状态
const onStatusChange = async (row: RowKeyType, status: string) => {
    const res = await keyApi.updateKeyStatus({
        id: row.id,
        status: status,
    });
    if (res.code === 200) {
        ElMessage.success("修改成功");
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
    ElMessageBox.confirm('确定删除该密钥吗？', '提示', {
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
    }).catch(() => {
        ElMessage.info('已取消删除');
    });
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

<style lang="scss" scoped>
.keys-index {
    padding: 20px;
}
.mt20 {
    margin-top: 20px;
}
.key-card {
    margin-bottom: 20px;
    padding: 10px;
    position: relative;
    .key-id, .key-name, .key-value, .key-status {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        .key-label {
            min-width: 60px;
            margin-right: 5px;
            font-weight: bold;
        }
    }
    .key-created {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        white-space: nowrap;
        .key-label {
            min-width: 60px;
            margin-right: 5px;
            font-weight: bold;
        }
    }
    .key-actions-dropdown {
        position: absolute;
        top: 10px;
        right: 10px;
    }
}
.demo-form-inline {
    .el-form-item {
        margin-right: 20px;
    }
}
</style>