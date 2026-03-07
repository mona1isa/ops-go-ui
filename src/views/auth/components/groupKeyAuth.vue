<template>
    <el-dialog v-model="state.dialogVisible" title="授权凭证" width="50%">
        <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
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
                    <el-button size="small" plain type="primary" @click="onBindKey(scope.row)" :icon="Connection">授权</el-button>
                </template>
            </el-table-column>
        </el-table>
        <div class="hint-text">提示：请选择需要授权的凭证，授权后，该分组下的所有主机均可使用该凭证进行连接。</div>
    </el-dialog>
</template>

<script setup lang="ts" name="authGroupKey">
import { ref, reactive } from 'vue';
import { useUserInstanceAuthApi } from '/@/api/userInstanceAuth';
import { ElMessage } from 'element-plus';
import { Connection } from '@element-plus/icons-vue'
import { get } from 'sortablejs';

const emit = defineEmits(['refresh']);

// 定义接口
const instanceAuthApi = useUserInstanceAuthApi();

const state = reactive({
    dialogVisible: false,
    tableData: {
        data: [],
        loading: false
    }
});

const currentGroupId = ref<number>(0);
const currentUserId = ref<number>(0);

// 打开对话框
const openDialog = (groupId: number, userId: number)=> {
    state.dialogVisible = true;
    currentGroupId.value = groupId;
    currentUserId.value = userId;
    getTableData(groupId, userId);
};

const onBindKey = async (row: any) => {
    let data = {
        groupId: currentGroupId.value,
        userId: currentUserId.value,
        keyId: row.id
    };
    try {
        const response = await instanceAuthApi.groupAuthKey(data);
        if (response && response.code === 200) {
            ElMessage.success('授权成功');
            emit('refresh');
            getTableData(currentGroupId.value, currentUserId.value);
        }
    } catch (error) {
        ElMessage.error('授权失败');
    }
    
};

// 获取可绑定凭证列表
const getTableData = async (instanceId: number, userId: number) => {
    state.tableData.loading = true;
    let data = {
        groupId: currentGroupId.value,
        userId: currentUserId.value
    };
    try {
        const response = await instanceAuthApi.groupAvailableKeys(data);
        if (response && response.code === 200) {
            state.tableData.data = response.data;
        }
    } catch (error) {
        ElMessage.error('获取可绑定凭证失败');
    }
    state.tableData.loading = false;
};

defineExpose({
    openDialog
});
</script>
<style scoped lang="scss">  </style>