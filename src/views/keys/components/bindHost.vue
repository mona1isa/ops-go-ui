<template>
    <el-dialog
        v-model="dialogVisible"
        title="绑定主机"
        width="650px"
        :close-on-click-modal="false"
        @open="fetchAvailableInstances"
    >
        <div class="bind-host-search">
            <el-input
                v-model="searchName"
                placeholder="搜索主机名称或IP"
                clearable
                :prefix-icon="Search"
                style="width: 260px"
                @input="onSearch"
            />
        </div>

        <el-table
            :data="availableInstances"
            v-loading="loading"
            ref="tableRef"
            @selection-change="onSelectionChange"
            stripe
            style="width: 100%"
            max-height="400"
        >
            <el-table-column type="selection" width="50" />
            <el-table-column prop="name" label="主机名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="ip" label="IP地址" width="150" />
            <el-table-column prop="os" label="操作系统" width="100">
                <template #default="scope">
                    {{ scope.row.os || '-' }}
                </template>
            </el-table-column>
            <el-table-column label="规格" width="120">
                <template #default="scope">
                    <template v-if="scope.row.cpu || scope.row.memMb || scope.row.diskGb">
                        {{ scope.row.cpu }}c / {{ scope.row.memMb }}M / {{ scope.row.diskGb }}G
                    </template>
                    <template v-else>-</template>
                </template>
            </el-table-column>
        </el-table>

        <el-empty v-if="!loading && availableInstances.length === 0" description="没有可绑定的主机" />

        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :disabled="selectedIds.length === 0" :loading="submitting" @click="handleBind">
                确认绑定 {{ selectedIds.length > 0 ? `(${selectedIds.length})` : '' }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts" name="bindHost">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { useKeyApi } from '/@/api/keys';
import type { RowInstanceType } from '/@/types/views';

const props = defineProps<{
    visible: boolean;
    keyId: number;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'success'): void;
}>();

const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val),
});

const keyApi = useKeyApi();

const availableInstances = ref<RowInstanceType[]>([]);
const selectedIds = ref<number[]>([]);
const loading = ref(false);
const submitting = ref(false);
const searchName = ref('');
const tableRef = ref();
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const fetchAvailableInstances = async () => {
    loading.value = true;
    try {
        const res = await keyApi.getAvailableInstances(props.keyId, {
            name: searchName.value || undefined,
        });
        availableInstances.value = res.data || [];
        selectedIds.value = [];
    } catch (err) {
        availableInstances.value = [];
    } finally {
        loading.value = false;
    }
};

const onSearch = () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        fetchAvailableInstances();
    }, 300);
};

const onSelectionChange = (selection: RowInstanceType[]) => {
    selectedIds.value = selection.map((item) => item.id!);
};

const handleBind = async () => {
    if (selectedIds.value.length === 0) return;
    submitting.value = true;
    try {
        await keyApi.bindInstances({ keyId: props.keyId, instanceIds: selectedIds.value });
        ElMessage.success(`成功绑定 ${selectedIds.value.length} 台主机`);
        emit('success');
    } catch (err) {
        // error handled by request interceptor
    } finally {
        submitting.value = false;
    }
};
</script>

<style scoped>
.bind-host-search {
    margin-bottom: 16px;
}
</style>
