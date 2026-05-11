<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <div class="app-search mb15">
                    <el-input v-model="state.tableData.param.name" size="default" placeholder="脚本名称" style="max-width: 180px" clearable />
                    <el-button size="default" plain type="primary" class="ml10" @click="getTableData()">
                        <el-icon><ele-Search /></el-icon>
                        查询
                    </el-button>
                    <el-button size="default" plain type="info" class="ml10" @click="resetTableData()">
                        <el-icon><ele-Refresh /></el-icon>
                        重置
                    </el-button>
                    <el-button size="default" plain type="success" class="ml10" @click="onOpenDialog('add')">
                        <el-icon><ele-FolderAdd /></el-icon>
                        新增脚本
                    </el-button>
                </div>

                <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                    <el-table-column prop="id" label="ID" width="60" />
                    <el-table-column prop="name" label="脚本名称" show-overflow-tooltip />
                    <el-table-column prop="type" label="类型" width="100" />
                    <el-table-column prop="remark" label="备注" show-overflow-tooltip />
                    <el-table-column prop="createdAt" label="创建时间" width="165" show-overflow-tooltip>
                        <template #default="scope">
                            {{ scope.row.createdAt ? formatDate(new Date(scope.row.createdAt), 'YYYY-mm-dd HH:MM:SS') : '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150">
                        <template #default="scope">
                            <el-button size="small" text type="primary" @click="onOpenDialog('edit', scope.row)">编辑</el-button>
                            <el-button size="small" text type="danger" @click="onRowDel(scope.row)">删除</el-button>
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
                />
            </el-card>
        </div>

        <!-- 新增/编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" top="5vh" :close-on-click-modal="false" class="script-dialog">
            <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
                <el-form-item label="脚本名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入脚本名称" />
                </el-form-item>
                <el-form-item label="脚本类型">
                    <el-select v-model="formData.type" placeholder="脚本类型" style="width: 100%">
                        <el-option label="bash" value="bash" />
                    </el-select>
                </el-form-item>
                <el-form-item label="脚本内容" prop="content">
                    <div class="codemirror-toolbar">
                        <el-radio-group v-model="isDarkTheme" size="small">
                            <el-radio-button :label="true">深色</el-radio-button>
                            <el-radio-button :label="false">浅色</el-radio-button>
                        </el-radio-group>
                    </div>
                    <div class="codemirror-wrapper" :class="{ 'dark': isDarkTheme, 'light': !isDarkTheme }">
                        <codemirror
                            v-model="formData.content"
                            :extensions="extensions"
                            placeholder="请输入 bash 脚本内容..."
                        />
                    </div>
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="备注说明" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="onSubmit" :loading="submitLoading">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="scriptIndex">
import { reactive, ref, computed } from 'vue';
import { useScriptApi } from '/@/api/script';
import { formatDate } from '/@/utils/formatTime';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Codemirror } from 'vue-codemirror';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { StreamLanguage } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

const scriptApi = useScriptApi();
const dialogVisible = ref(false);
const dialogTitle = ref('新增脚本');
const submitLoading = ref(false);
const formRef = ref<any>(null);
const dialogType = ref('add');
const isDarkTheme = ref(true);

const extensions = computed(() => {
    const base = [StreamLanguage.define(shell)];
    if (isDarkTheme.value) {
        base.push(oneDark);
    }
    return base;
});

const formData = reactive({
    id: 0,
    name: '',
    content: '',
    type: 'bash',
    remark: '',
});

const formRules = {
    name: [{ required: true, message: '请输入脚本名称', trigger: 'blur' }],
    content: [{ required: true, message: '请输入脚本内容', trigger: 'blur' }],
};

const state = reactive<any>({
    tableData: {
        data: [],
        total: 0,
        loading: false,
        param: {
            pageNum: 1,
            pageSize: 10,
            name: '',
        },
    },
});

const getTableData = async () => {
    state.tableData.loading = true;
    const res = await scriptApi.getScriptPage(state.tableData.param);
    if (res && res.code === 200) {
        state.tableData.data = res.data;
        state.tableData.total = res.total;
    }
    state.tableData.loading = false;
};

const resetTableData = () => {
    state.tableData.param.name = '';
    state.tableData.param.pageNum = 1;
    getTableData();
};

const onHandleSizeChange = (val: number) => {
    state.tableData.param.pageSize = val;
    getTableData();
};

const onHandleCurrentChange = (val: number) => {
    state.tableData.param.pageNum = val;
    getTableData();
};

const onOpenDialog = (type: string, row?: any) => {
    dialogType.value = type;
    if (type === 'add') {
        dialogTitle.value = '新增脚本';
        formData.id = 0;
        formData.name = '';
        formData.content = '';
        formData.type = 'bash';
        formData.remark = '';
    } else {
        dialogTitle.value = '编辑脚本';
        formData.id = row.id;
        formData.name = row.name;
        formData.content = row.content || '';
        formData.type = row.type || 'bash';
        formData.remark = row.remark || '';
    }
    dialogVisible.value = true;
};

const onSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;

    submitLoading.value = true;
    try {
        let res;
        if (dialogType.value === 'add') {
            res = await scriptApi.addScript(formData);
        } else {
            res = await scriptApi.updateScript(formData);
        }
        if (res && res.code === 200) {
            ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功');
            dialogVisible.value = false;
            getTableData();
        } else {
            ElMessage.error(res?.msg || '操作失败');
        }
    } catch (error) {
        ElMessage.error('请求失败');
    } finally {
        submitLoading.value = false;
    }
};

const onRowDel = (row: any) => {
    ElMessageBox.confirm(`确定要删除脚本 "${row.name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            const res = await scriptApi.deleteScript(row.id);
            if (res && res.code === 200) {
                ElMessage.success('删除成功');
                getTableData();
            } else {
                ElMessage.error(res?.msg || '删除失败');
            }
        })
        .catch(() => {});
};

getTableData();
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

.script-dialog :deep(.el-dialog__body) {
    padding-top: 10px;
    padding-bottom: 10px;
}

.codemirror-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
}

.codemirror-wrapper {
    width: 100%;
    height: 400px;
    border-radius: 4px;
    overflow: hidden;
}

.codemirror-wrapper.dark {
    border: 1px solid #4a4a4a;
}

.codemirror-wrapper.light {
    border: 1px solid #dcdfe6;
}

:deep(.cm-editor) {
    outline: none;
    width: 100%;
    height: 100%;
}

:deep(.cm-content) {
    width: 100%;
}

:deep(.cm-scroller) {
    width: 100%;
}
</style>
