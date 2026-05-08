<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <div class="app-search mb15">
                    <el-input v-model="state.tableData.param.name" size="default" placeholder="编排名称" style="max-width: 180px" clearable />
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
                        新增编排
                    </el-button>
                </div>

                <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                    <el-table-column prop="id" label="ID" width="60" />
                    <el-table-column prop="name" label="编排名称" show-overflow-tooltip />
                    <el-table-column prop="steps" label="步骤数" width="80">
                        <template #default="scope">
                            <el-tag type="info">{{ scope.row.steps ? scope.row.steps.length : 0 }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="description" label="描述" show-overflow-tooltip />
                    <el-table-column label="操作" width="200">
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
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
            <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
                <el-form-item label="编排名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入编排名称" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="编排描述" />
                </el-form-item>
                <el-form-item label="执行步骤">
                    <div style="width: 100%">
                        <div v-for="(step, index) in formData.steps" :key="index" class="step-row">
                            <el-input v-model="step.stepName" placeholder="步骤名称" style="width: 140px" />
                            <el-select v-model="step.templateId" placeholder="选择模板" style="width: 180px; margin-left: 8px">
                                <el-option v-for="t in templateList" :key="t.id" :label="t.name" :value="t.id" />
                            </el-select>
                            <el-input-number v-model="step.stepOrder" :min="1" :max="99" style="width: 100px; margin-left: 8px" />
                            <el-button type="danger" :icon="Delete" circle size="small" style="margin-left: 8px" @click="removeStep(index)" />
                        </div>
                        <el-button type="primary" plain size="small" @click="addStep" style="margin-top: 8px">
                            <el-icon><ele-Plus /></el-icon>
                            添加步骤
                        </el-button>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="onSubmit" :loading="submitLoading">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="taskPipelineIndex">
import { reactive, ref, onMounted } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import { useTaskPipelineApi } from '/@/api/taskPipeline';
import { useTaskTemplateApi } from '/@/api/taskTemplate';
import { ElMessage, ElMessageBox } from 'element-plus';

const taskPipelineApi = useTaskPipelineApi();
const taskTemplateApi = useTaskTemplateApi();
const dialogVisible = ref(false);
const dialogTitle = ref('新增编排');
const submitLoading = ref(false);
const formRef = ref<any>(null);
const dialogType = ref('add');
const templateList = ref<any[]>([]);

const formData = reactive({
    id: 0,
    name: '',
    description: '',
    steps: [] as any[],
});

const formRules = {
    name: [{ required: true, message: '请输入编排名称', trigger: 'blur' }],
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

const loadTemplates = async () => {
    const res = await taskTemplateApi.getList({ pageNum: 1, pageSize: 100 });
    if (res && res.code === 200) {
        templateList.value = res.data || [];
    }
};

const getTableData = async () => {
    state.tableData.loading = true;
    const res = await taskPipelineApi.getList(state.tableData.param);
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

const addStep = () => {
    formData.steps.push({
        stepName: `步骤${formData.steps.length + 1}`,
        templateId: null,
        stepOrder: formData.steps.length + 1,
        parentStepId: 0,
        onFailure: 1,
        retryCount: 0,
    });
};

const removeStep = (index: number) => {
    formData.steps.splice(index, 1);
};

const onOpenAddDialog = (type: string) => {
    dialogType.value = type;
    dialogTitle.value = '新增编排';
    formData.id = 0;
    formData.name = '';
    formData.description = '';
    formData.steps = [];
    addStep();
    dialogVisible.value = true;
    loadTemplates();
};

const onOpenEditDialog = (type: string, row: any) => {
    dialogType.value = type;
    dialogTitle.value = '编辑编排';
    formData.id = row.id;
    formData.name = row.name;
    formData.description = row.description || '';
    formData.steps = (row.steps || []).map((s: any) => ({
        stepName: s.stepName,
        templateId: s.templateId,
        stepOrder: s.stepOrder,
        parentStepId: s.parentStepId || 0,
        onFailure: s.onFailure || 1,
        retryCount: s.retryCount || 0,
    }));
    if (formData.steps.length === 0) addStep();
    dialogVisible.value = true;
    loadTemplates();
};

const onSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    if (formData.steps.length === 0) {
        ElMessage.warning('请至少添加一个步骤');
        return;
    }

    submitLoading.value = true;
    try {
        let res;
        if (dialogType.value === 'add') {
            res = await taskPipelineApi.addPipeline(formData);
        } else {
            res = await taskPipelineApi.editPipeline(formData);
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
    ElMessageBox.confirm(`确定要删除编排 "${row.name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            const res = await taskPipelineApi.deletePipeline(row.id);
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
.step-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

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
