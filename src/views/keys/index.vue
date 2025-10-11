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
                <el-button size="default" type="primary" class="ml10" @click="getTableData()">
					<el-icon>
						<ele-Search />
					</el-icon>
					查询
				</el-button>
				<el-button size="default" type="success" class="ml10" @click="onOpenAddKey('add')" >
					<el-icon>
						<ele-FolderAdd />
					</el-icon>
					新增凭证
				</el-button>
			</div>
            <el-row :gutter="20">
                <el-col :span="4" v-for="(item, index) in state.tableData.data" :key="index">
                    <el-card class="key-card">
                        <div class="key-id">ID: {{ item.id }}</div>
                        <div class="key-name">名称: {{ item.name }}</div>
                        <div class="key-name">用户名: {{ item.user }}</div>
                        <div class="key-name">类型: {{ item.type === 1 ? '密码' : '密钥'}}</div>
                        <div class="key-value">协议: {{ item.protocol }}</div>
                        <div class="key-value">端口号: {{ item.port }}</div>
                        <div class="key-status">
                            状态: 
                            <el-switch 
                                v-model="item.status" 
                                inline-prompt active-text="启" active-value="1" 
                                inactive-text="禁" inactive-value="0" 
                                @click="onStatusChange(item)">
                            </el-switch>
                        </div>
                        <div class="key-created">创建时间: {{ dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</div>
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
import { dayjs, ElMessage } from 'element-plus';
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
const onStatusChange = async (row: RowKeyType) => {
    const res = await keyApi.updateKeyStatus({
        id: row.id,
        status: row.status,
    });
    if (res.code === 200) {
        ElMessage.success(res.msg);
        getTableData();
    }
};

// 打开新增密钥弹窗
const onOpenAddKey = (type: string) => {
    keysDialogRef.value.openDialog(type);
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
    margin-right: 20px;
    margin-bottom: 20px;
    padding: auto;
    .key-id, .key-name, .key-value, .key-status, .key-created {
        margin-bottom: 10px;
    }
}
.demo-form-inline {
    .el-form-item {
        margin-right: 20px;
    }
}
</style>