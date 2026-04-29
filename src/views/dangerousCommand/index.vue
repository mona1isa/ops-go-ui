<template>
    <div class="layout-padding">
        <div class="layout-padding-view layout-padding-auto">
            <el-card shadow="hover">
                <div class="app-search mb15">
                    <el-input v-model="state.tableData.param.name" size="default" placeholder="请输入规则名称" style="max-width: 180px" clearable />
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
                        新增规则
                    </el-button>
                </div>

                <el-table :data="state.tableData.data" v-loading="state.tableData.loading" style="width: 100%">
                    <el-table-column prop="id" label="ID" width="60" />
                    <el-table-column prop="name" label="规则名称" show-overflow-tooltip />
                    <el-table-column prop="pattern" label="匹配模式" show-overflow-tooltip />
                    <el-table-column prop="matchType" label="匹配类型" width="100">
                        <template #default="scope">
                            <el-tag :type="getMatchTypeTagType(scope.row.matchType)">
                                {{ getMatchTypeLabel(scope.row.matchType) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="description" label="描述" show-overflow-tooltip />
                    <el-table-column prop="isEnabled" label="状态" width="80">
                        <template #default="scope">
                            <el-switch
                                v-model="scope.row.isEnabled"
                                :active-value="1"
                                :inactive-value="0"
                                :disabled="scope.row.isBuiltin === 1"
                                @change="(val: any) => onStatusChange(scope.row, val)"
                            />
                        </template>
                    </el-table-column>
                    <el-table-column prop="isBuiltin" label="类型" width="80">
                        <template #default="scope">
                            <el-tag :type="scope.row.isBuiltin === 1 ? 'warning' : 'info'">
                                {{ scope.row.isBuiltin === 1 ? '内置' : '自定义' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150">
                        <template #default="scope">
                            <el-button size="small" text type="primary" @click="onOpenEditDialog('edit', scope.row)">编辑</el-button>
                            <el-button size="small" text type="danger" @click="onRowDel(scope.row)" :disabled="scope.row.isBuiltin === 1">删除</el-button>
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
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
            <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
                <el-form-item label="规则名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入规则名称" />
                </el-form-item>
                <el-form-item label="匹配类型" prop="matchType">
                    <el-select v-model="formData.matchType" placeholder="请选择匹配类型" style="width: 100%">
                        <el-option label="精确匹配" :value="1" />
                        <el-option label="前缀匹配" :value="2" />
                        <el-option label="正则匹配" :value="3" />
                    </el-select>
                </el-form-item>
                <el-form-item label="匹配模式" prop="pattern">
                    <el-input v-model="formData.pattern" :placeholder="getPatternPlaceholder()" />
                    <div class="pattern-tip">{{ getPatternTip() }}</div>
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述说明" />
                </el-form-item>
                <el-form-item label="启用状态">
                    <el-switch v-model="formData.isEnabled" :active-value="1" :inactive-value="0" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="onSubmit" :loading="submitLoading">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="dangerousCommandIndex">
import { reactive, ref } from 'vue';
import { useDangerousCommandApi } from '/@/api/dangerousCommand';
import { ElMessage, ElMessageBox } from 'element-plus';

const dangerousCommandApi = useDangerousCommandApi();
const dialogVisible = ref(false);
const dialogTitle = ref('新增规则');
const submitLoading = ref(false);
const formRef = ref<any>(null);
const dialogType = ref('add');

const formData = reactive({
    id: 0,
    name: '',
    pattern: '',
    matchType: 1,
    description: '',
    isEnabled: 1,
});

const formRules = {
    name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
    pattern: [{ required: true, message: '请输入匹配模式', trigger: 'blur' }],
    matchType: [{ required: true, message: '请选择匹配类型', trigger: 'change' }],
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
    const res = await dangerousCommandApi.getList(state.tableData.param);
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

const getMatchTypeLabel = (type: number) => {
    const map: Record<number, string> = { 1: '精确匹配', 2: '前缀匹配', 3: '正则匹配' };
    return map[type] || '未知';
};

const getMatchTypeTagType = (type: number): any => {
    const map: Record<number, any> = { 1: 'success', 2: 'info', 3: 'warning' };
    return map[type] || 'info';
};

const getPatternPlaceholder = () => {
    const map: Record<number, string> = {
        1: '例如：rm -rf /',
        2: '例如：shutdown',
        3: '例如：rm\\s+-rf\\s+/',
    };
    return map[formData.matchType] || '请输入匹配模式';
};

const getPatternTip = () => {
    const map: Record<number, string> = {
        1: '精确匹配：用户输入的命令必须完全等于该模式',
        2: '前缀匹配：用户输入的命令以该模式开头即命中',
        3: '正则匹配：使用正则表达式匹配，\\s 表示空白，.* 表示任意字符',
    };
    return map[formData.matchType] || '';
};

const onOpenAddDialog = (type: string) => {
    dialogType.value = type;
    dialogTitle.value = '新增规则';
    formData.id = 0;
    formData.name = '';
    formData.pattern = '';
    formData.matchType = 1;
    formData.description = '';
    formData.isEnabled = 1;
    dialogVisible.value = true;
};

const onOpenEditDialog = (type: string, row: any) => {
    dialogType.value = type;
    dialogTitle.value = '编辑规则';
    formData.id = row.id;
    formData.name = row.name;
    formData.pattern = row.pattern;
    formData.matchType = row.matchType;
    formData.description = row.description;
    formData.isEnabled = row.isEnabled;
    dialogVisible.value = true;
};

const onSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;

    submitLoading.value = true;
    try {
        let res;
        if (dialogType.value === 'add') {
            res = await dangerousCommandApi.addCommand(formData);
        } else {
            res = await dangerousCommandApi.editCommand(formData);
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

const onStatusChange = async (row: any, val: any) => {
    try {
        const res = await dangerousCommandApi.changeStatus({
            id: row.id,
            isEnabled: val,
        });
        if (res && res.code === 200) {
            ElMessage.success('状态更新成功');
        } else {
            ElMessage.error(res?.msg || '状态更新失败');
            row.isEnabled = val === 1 ? 0 : 1;
        }
    } catch (error) {
        ElMessage.error('请求失败');
        row.isEnabled = val === 1 ? 0 : 1;
    }
};

const onRowDel = (row: any) => {
    ElMessageBox.confirm(`确定要删除规则 "${row.name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            const res = await dangerousCommandApi.deleteCommand(row.id);
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
.pattern-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 6px;
    line-height: 1.4;
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
