<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <div class="app-search mb15">
                    <el-input v-model="state.tableData.param.name" size="default" placeholder="模板名称" style="max-width: 180px" clearable />
                    <el-select v-model="state.tableData.param.type" size="default" placeholder="任务类型" style="max-width: 140px" clearable class="ml10">
                        <el-option label="执行命令" :value="1" />
                        <el-option label="执行脚本" :value="2" />
                        <el-option label="分发文件" :value="3" />
                    </el-select>
                    <el-button size="default" plain type="primary" class="ml10" @click="getTableData()">
                        <el-icon><ele-Search /></el-icon>
                        查询
                    </el-button>
                    <el-button size="default" plain type="info" class="ml10" @click="resetTableData()">
                        <el-icon><ele-Refresh /></el-icon>
                        重置
                    </el-button>
                    <el-button size="default" plain type="success" class="ml10" @click="onOpenAddDialog('add')">
                        <el-icon><ele-FolderAdd /></el-icon>
                        新增模板
                    </el-button>
                </div>

                <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                    <el-table-column prop="id" label="ID" width="60" />
                    <el-table-column prop="name" label="模板名称" show-overflow-tooltip />
                    <el-table-column prop="type" label="类型" width="90">
                        <template #default="scope">
                            <el-tag :type="getTypeTagType(scope.row.type)">{{ getTypeLabel(scope.row.type) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="content" label="内容" show-overflow-tooltip />
                    <el-table-column prop="timeout" label="超时(秒)" width="90" />
                    <el-table-column prop="description" label="描述" show-overflow-tooltip />
                    <el-table-column label="操作" width="150">
                        <template #default="scope">
                            <el-button size="small" text type="primary" @click="onOpenEditDialog('edit', scope.row)">编辑</el-button>
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
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
            <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
                <el-form-item label="模板名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入模板名称" />
                </el-form-item>
                <el-form-item label="任务类型" prop="type">
                    <el-select v-model="formData.type" placeholder="请选择任务类型" style="width: 100%">
                        <el-option label="执行命令" :value="1" />
                        <el-option label="执行脚本" :value="2" />
                        <el-option label="分发文件" :value="3" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="formData.type === 1" label="命令内容" prop="content">
                    <el-input v-model="formData.content" type="textarea" :rows="3" placeholder="请输入要执行的命令" />
                </el-form-item>
                <el-form-item v-if="formData.type === 2" label="选择脚本">
                    <el-select v-model="formData.scriptId" placeholder="选择现有脚本（可选）" clearable style="width: 100%; margin-bottom: 8px" @change="onScriptChange">
                        <el-option v-for="s in scriptList" :key="s.id" :label="s.name" :value="s.id" />
                    </el-select>
                    <el-input v-model="formData.content" type="textarea" :rows="6" placeholder="请输入脚本内容" />
                </el-form-item>
                <template v-if="formData.type === 3">
                    <el-form-item label="选择文件" prop="srcPath">
                        <el-select v-model="formData.srcPath" placeholder="请选择已上传的文件" clearable style="width: 100%; margin-bottom: 8px">
                            <el-option v-for="f in localFileList" :key="f.path" :label="`${f.name} (${formatFileSize(f.size)})`" :value="f.path" />
                        </el-select>
                        <el-upload
                            action="/api/file/local/upload"
                            :headers="{ Authorization: Session.get('token') || '' }"
                            :show-file-list="false"
                            :on-success="onUploadSuccess"
                            :on-error="onUploadError"
                            accept="*"
                        >
                            <el-button type="primary" size="small">
                                <el-icon><ele-Upload /></el-icon>
                                上传新文件到服务器
                            </el-button>
                        </el-upload>
                    </el-form-item>
                    <el-form-item label="目标路径" prop="destPath">
                        <el-input v-model="formData.destPath" placeholder="远程主机的目标路径，如 /opt/app/config.yml" />
                    </el-form-item>
                </template>
                <el-form-item label="超时时间">
                    <el-input-number v-model="formData.timeout" :min="10" :max="3600" :step="30" />
                    <span class="ml10" style="color: #909399">秒</span>
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="模板描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="onSubmit" :loading="submitLoading">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="taskTemplateIndex">
import { reactive, ref, onMounted } from 'vue';
import { useTaskTemplateApi } from '/@/api/taskTemplate';
import { useScriptApi } from '/@/api/script';
import { useFileApi } from '/@/api/file';
import { Session } from '/@/utils/storage';
import { ElMessage, ElMessageBox } from 'element-plus';

const taskTemplateApi = useTaskTemplateApi();
const scriptApi = useScriptApi();
const fileApi = useFileApi();
const dialogVisible = ref(false);
const dialogTitle = ref('新增模板');
const submitLoading = ref(false);
const formRef = ref<any>(null);
const dialogType = ref('add');
const scriptList = ref<any[]>([]);
const localFileList = ref<any[]>([]);

const formData = reactive({
    id: 0,
    name: '',
    type: 1,
    content: '',
    scriptLang: 'shell',
    scriptId: null as number | null,
    srcPath: '',
    destPath: '',
    timeout: 300,
    keyId: 0,
    description: '',
});

const formRules = {
    name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
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
            type: null,
        },
    },
});

const getTypeLabel = (type: number) => {
    const map: Record<number, string> = { 1: '执行命令', 2: '执行脚本', 3: '分发文件' };
    return map[type] || '未知';
};

const getTypeTagType = (type: number): any => {
    const map: Record<number, any> = { 1: 'success', 2: 'warning', 3: 'info' };
    return map[type] || 'info';
};

const getTableData = async () => {
    state.tableData.loading = true;
    const res = await taskTemplateApi.getList(state.tableData.param);
    if (res && res.code === 200) {
        state.tableData.data = res.data;
        state.tableData.total = res.total;
    }
    state.tableData.loading = false;
};

const resetTableData = () => {
    state.tableData.param.name = '';
    state.tableData.param.type = null;
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

const loadScripts = async () => {
    const res = await scriptApi.getScriptPage({ pageNum: 1, pageSize: 999 });
    if (res && res.code === 200) {
        scriptList.value = res.data || [];
    }
};

const loadLocalFiles = async () => {
    const res = await fileApi.getLocalFiles();
    if (res && res.code === 200) {
        localFileList.value = res.data || [];
    }
};

const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
};

const onUploadSuccess = (res: any) => {
    if (res && res.code === 200) {
        ElMessage.success('上传成功');
        formData.srcPath = res.data.path;
        loadLocalFiles();
    } else {
        ElMessage.error(res?.msg || '上传失败');
    }
};

const onUploadError = () => {
    ElMessage.error('上传失败');
};

const onScriptChange = (scriptId: number | null) => {
    if (scriptId) {
        const selected = scriptList.value.find((s: any) => s.id === scriptId);
        if (selected) {
            formData.content = selected.content || '';
        }
    }
};

const onOpenAddDialog = (type: string) => {
    dialogType.value = type;
    dialogTitle.value = '新增模板';
    formData.id = 0;
    formData.name = '';
    formData.type = 1;
    formData.content = '';
    formData.scriptLang = 'shell';
    formData.scriptId = null;
    formData.srcPath = '';
    formData.destPath = '';
    formData.timeout = 300;
    formData.keyId = 0;
    formData.description = '';
    dialogVisible.value = true;
    loadLocalFiles();
};

const onOpenEditDialog = (type: string, row: any) => {
    dialogType.value = type;
    dialogTitle.value = '编辑模板';
    formData.id = row.id;
    formData.name = row.name;
    formData.type = row.type;
    formData.content = row.content || '';
    formData.scriptLang = row.scriptLang || 'shell';
    formData.scriptId = null;
    formData.srcPath = row.srcPath || '';
    formData.destPath = row.destPath || '';
    formData.timeout = row.timeout || 300;
    formData.keyId = row.keyId || 0;
    formData.description = row.description || '';
    dialogVisible.value = true;
    loadLocalFiles();
};

const onSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;

    submitLoading.value = true;
    try {
        let res;
        if (dialogType.value === 'add') {
            res = await taskTemplateApi.addTemplate(formData);
        } else {
            res = await taskTemplateApi.editTemplate(formData);
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
    ElMessageBox.confirm(`确定要删除模板 "${row.name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            const res = await taskTemplateApi.deleteTemplate(row.id);
            if (res && res.code === 200) {
                ElMessage.success('删除成功');
                getTableData();
            } else {
                ElMessage.error(res?.msg || '删除失败');
            }
        })
        .catch(() => {});
};

onMounted(() => {
    loadScripts();
});

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
</style>
