<template>
    <el-dialog v-model="dialogVisible" title="授权凭证" width="50%">
        <el-table :data="tableData.data" v-loading="tableData.loading" style="width: 100%">
            <el-table-column prop="id" label="凭证ID" show-overflow-tooltip />
            <el-table-column prop="name" label="凭证名称" show-overflow-tooltip />
            <el-table-column prop="protocol" label="协议" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" show-overflow-tooltip >
                <template #default="scope">
                    {{ scope.row.type === 1 ? '密码' : '密钥' }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="280">
                <template #default="scope">
                    <el-button size="small" plain type="success" @click="onTestConnectivity(scope.row)" :icon="Link">测试连通性</el-button>
                    <el-button size="small" plain type="primary" @click="onBindKey(scope.row)" :icon="Connection">授权</el-button>
                </template>
            </el-table-column>
        </el-table>
        
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';
import { useInstanceApi } from '/@/api/instance';
import { ElMessage } from 'element-plus';
import { Connection, Link } from '@element-plus/icons-vue';

const emit = defineEmits(['refresh']);

const dialogVisible = ref(false);
const instanceAuthApi = useUserInstanceAuthApi();
const instanceApi = useInstanceApi();

// 监听关闭对话框，刷新实例列表
watch(dialogVisible, (newVal) => {
    if (!newVal) {
        emit('refresh');
    }
});

// 存储当前实例ID，用于绑定凭证时使用
const currentInstanceId = ref<number>(0);
// 存储当前用户ID，用于绑定凭证时使用
const currentUserId = ref<number>(0);

const tableData = reactive({
    data: [],
    loading: false,
});

// 打开对话框
const openDialog = (instanceId: number, userId: number)=> {
    dialogVisible.value = true;
    currentInstanceId.value = instanceId;
    currentUserId.value = userId;
    getTableData(instanceId, userId);
};

// 获取可绑定的凭证列表
const getTableData = async (instanceId: number, userId: number) => {
    tableData.loading = true;
    let data = {
        instanceId: instanceId,
        userId: userId
    };
    const res = await instanceAuthApi.availableKeysForInstance(data);
    if (res && res.code === 200) {
        tableData.data = res.data.keys;
    }
    tableData.loading = false;
};

// 绑定凭证
const onBindKey = async (row: any) => {
    const res = await instanceAuthApi.userInstanceKeyAuthAdd({
        instanceId: currentInstanceId.value,
        UserId: currentUserId.value,
        keyId: row.id,
    });
    if (res && res.code === 200) {
        ElMessage.success('授权成功');
        getTableData(currentInstanceId.value, currentUserId.value);
        emit('refresh');
    }
};

// 测试连通性
const onTestConnectivity = async (row: any) => {
    let params = {
        instanceId: currentInstanceId.value,
        keyId: row.id,
    };
    const res = await instanceApi.testConnect(params);
    if (res && res.code === 200) {
        ElMessage.success('测试成功：凭证连通性正常');
    } else {
        ElMessage.error('测试失败：凭证无法连通');
    }
};



defineExpose({
    openDialog,
});
</script>

<style scoped lang="scss"></style>