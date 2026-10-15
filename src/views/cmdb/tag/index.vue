<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view">
            <el-card shadow="hover">
            <div class="app-search mb15">
                <el-button size="default" plain type="primary" v-auths="['cmdb:tag:add']" @click="onOpenAdd()">
                    <el-icon><ele-FolderAdd /></el-icon>
                    新增标签
                </el-button>
                <el-button size="default" plain type="info" class="ml10" @click="getTableData">
                    <el-icon><ele-Refresh /></el-icon>
                    刷新
                </el-button>
            </div>
            <el-table :data="state.tableData" v-loading="state.loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="70" />
                <el-table-column prop="name" label="标签名称" min-width="160">
                    <template #default="scope">
                        <el-tag size="small" :color="scope.row.color || undefined" :style="scope.row.color ? 'color:#fff;border:none' : ''">{{ scope.row.name }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="color" label="颜色" width="120">
                    <template #default="scope">
                        <span v-if="scope.row.color" class="color-block" :style="{ background: scope.row.color }"></span>
                        <span>{{ scope.row.color || '默认' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip>
                    <template #default="scope">{{ scope.row.remark || '—' }}</template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="170">
                    <template #default="scope">{{ scope.row.createdAt ? dayjs(scope.row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '—' }}</template>
                </el-table-column>
                <el-table-column label="操作" width="140" fixed="right">
                    <template #default="scope">
                        <el-button size="small" text type="primary" v-auths="['cmdb:tag:edit']" @click="onEdit(scope.row)">编辑</el-button>
                        <el-button size="small" text type="danger" v-auths="['cmdb:tag:delete']" @click="onDel(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            </el-card>

            <el-dialog v-model="dialogVisible" :title="dialogForm.id ? '编辑标签' : '新增标签'" width="420px">
                <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="80px">
                    <el-form-item label="名称" prop="name">
                        <el-input v-model="dialogForm.name" maxlength="64" placeholder="标签名称，如 生产环境" />
                    </el-form-item>
                    <el-form-item label="颜色">
                        <el-color-picker v-model="dialogForm.color" />
                        <el-tag v-if="dialogForm.color" size="small" :color="dialogForm.color" style="margin-left: 10px; color: #fff; border: none">{{ dialogForm.name || '预览' }}</el-tag>
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

<script setup lang="ts" name="cmdbTagIndex">
import { onMounted, reactive, ref } from 'vue';
import { useCmdbApi } from '/@/api/cmdb';
import { ElMessage, ElMessageBox, dayjs, type FormInstance, type FormRules } from 'element-plus';

const cmdbApi = useCmdbApi();

const state = reactive({
    tableData: [] as any[],
    loading: false,
});

const dialogVisible = ref(false);
const submitting = ref(false);
const dialogFormRef = ref<FormInstance>();
const dialogForm = reactive({
    id: 0,
    name: '',
    color: '',
    remark: '',
});

const dialogRules: FormRules = {
    name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
};

const getTableData = async () => {
    state.loading = true;
    try {
        const res = await cmdbApi.getTagList();
        if (res && res.code == 200) {
            state.tableData = res.data || [];
        }
    } finally {
        state.loading = false;
    }
};

onMounted(() => {
    getTableData();
});

const onOpenAdd = () => {
    dialogForm.id = 0;
    dialogForm.name = '';
    dialogForm.color = '';
    dialogForm.remark = '';
    dialogVisible.value = true;
};

const onEdit = (row: any) => {
    dialogForm.id = row.id;
    dialogForm.name = row.name;
    dialogForm.color = row.color || '';
    dialogForm.remark = row.remark || '';
    dialogVisible.value = true;
};

const onSubmit = async () => {
    const valid = await dialogFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    submitting.value = true;
    try {
        const payload = { id: dialogForm.id, name: dialogForm.name, color: dialogForm.color, remark: dialogForm.remark };
        const res = dialogForm.id ? await cmdbApi.updateTag(payload) : await cmdbApi.addTag(payload);
        if (res && res.code == 200) {
            ElMessage.success(dialogForm.id ? '标签已更新' : '标签已创建');
            dialogVisible.value = false;
            getTableData();
        }
    } finally {
        submitting.value = false;
    }
};

const onDel = (row: any) => {
    ElMessageBox.confirm(`删除标签「${row.name}」将同时移除资产上的该标签，是否继续？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            const res = await cmdbApi.deleteTag({ id: row.id });
            if (res && res.code == 200) {
                ElMessage.success('删除成功');
                getTableData();
            }
        })
        .catch(() => {});
};
</script>

<style scoped>
.color-block {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    margin-right: 6px;
    vertical-align: middle;
}
</style>
