<template>
    <div class="instance-import-container">
        <el-dialog title="批量导入主机" v-model="state.visible" width="720px">
            <el-alert type="info" :closable="false" class="mb15">
                <template #title>导入步骤</template>
                <div class="import-steps">
                    1. 下载导入模板，按列填写主机信息；<br />
                    2. 将填写好的文件拖到下方区域（或点击选择）；<br />
                    3. 导入后展示每行的处理结果，失败行会给出原因，其余合法行正常入库。
                </div>
            </el-alert>

            <div class="import-toolbar">
                <el-button type="primary" plain :loading="state.templateLoading" @click="downloadTemplate">
                    <el-icon><ele-Download /></el-icon>
                    下载导入模板
                </el-button>
                <span class="import-tip">支持 .xlsx / .csv，文件不超过 5MB，单次最多 1000 行</span>
            </div>

            <el-upload
                drag
                :auto-upload="false"
                :show-file-list="false"
                accept=".xlsx,.csv"
                :limit="1"
                :on-change="onFileChange"
                :on-exceed="onFileExceed"
            >
                <el-icon class="el-icon--upload"><ele-UploadFilled /></el-icon>
                <div class="el-upload__text">将模板文件拖到此处，或<em>点击选择文件</em></div>
            </el-upload>

            <div v-if="state.file" class="picked-file">
                已选择：{{ state.file.name }}（{{ formatSize(state.file.size) }}）
                <el-button text type="primary" size="small" @click="clearFile">重新选择</el-button>
            </div>

            <div v-if="state.result" class="import-result">
                <div class="result-summary">
                    共 {{ state.result.total }} 行，
                    <span class="text-success">成功 {{ state.result.success }} 行</span>，
                    <span :class="state.result.failed > 0 ? 'text-danger' : ''">失败 {{ state.result.failed }} 行</span>
                </div>
                <el-table v-if="state.result.errors && state.result.errors.length > 0" :data="state.result.errors" size="small" max-height="220" class="mt10">
                    <el-table-column prop="row" label="行号" width="70" />
                    <el-table-column prop="name" label="主机名称" width="160" show-overflow-tooltip />
                    <el-table-column prop="reason" label="失败原因" show-overflow-tooltip />
                </el-table>
            </div>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="state.visible = false">关 闭</el-button>
                    <el-button type="primary" :disabled="!state.file" :loading="state.importing" @click="submitImport">开始导入</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="instanceImportDialog">
import { reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useInstanceApi } from '/@/api/instance';

interface ImportRowError {
    row: number;
    name: string;
    reason: string;
}

interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: ImportRowError[];
}

const instanceApi = useInstanceApi();
const emit = defineEmits(['refresh']);

const maxSize = 5 * 1024 * 1024;

const state = reactive({
    visible: false,
    templateLoading: false,
    importing: false,
    file: null as File | null,
    result: null as ImportResult | null,
});

// 打开弹窗
const openDialog = () => {
    state.file = null;
    state.result = null;
    state.visible = true;
};

const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

// 下载模板，后端以 base64 返回文件内容
const downloadTemplate = async () => {
    state.templateLoading = true;
    try {
        const res = await instanceApi.getImportTemplate();
        if (res && res.code === 200 && res.data?.content) {
            const bytes = Uint8Array.from(atob(res.data.content), (c) => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = res.data.fileName || '主机批量导入模板.xlsx';
            link.click();
            URL.revokeObjectURL(link.href);
        }
    } catch (error) {
        ElMessage.error('模板下载失败');
    } finally {
        state.templateLoading = false;
    }
};

// 选择/拖入文件后先做基本校验
const onFileChange = (uploadFile: any) => {
    const file: File | null = uploadFile?.raw ?? null;
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
        ElMessage.warning('仅支持 .xlsx 与 .csv 文件');
        return;
    }
    if (file.size > maxSize) {
        ElMessage.warning('文件超过 5MB，请拆分后重试');
        return;
    }
    state.file = file;
    state.result = null;
};

// 组件限制单次一个文件，重新选择时直接替换
const onFileExceed = (files: any) => {
    onFileChange({ raw: files[0] });
};

const clearFile = () => {
    state.file = null;
    state.result = null;
};

// 提交导入
const submitImport = async () => {
    if (!state.file) {
        ElMessage.warning('请先选择要导入的文件');
        return;
    }
    const formData = new FormData();
    formData.append('file', state.file);

    state.importing = true;
    try {
        const res = await instanceApi.batchImportInstance(formData);
        if (res && res.code === 200) {
            state.result = res.data as ImportResult;
            if (state.result.failed === 0) {
                ElMessage.success(`导入完成，成功导入 ${state.result.success} 台主机`);
            } else {
                ElMessage.warning(`导入完成，成功 ${state.result.success} 台，失败 ${state.result.failed} 台`);
            }
            if (state.result.success > 0) {
                emit('refresh');
            }
            state.file = null;
        }
    } catch (error: any) {
        ElMessage.error(error?.message || '导入失败');
    } finally {
        state.importing = false;
    }
};

// 暴露变量
defineExpose({
    openDialog,
});
</script>

<style scoped lang="scss">
.import-steps {
    line-height: 20px;
}

.import-toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .import-tip {
        margin-left: 12px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }
}

.picked-file {
    margin-top: 10px;
    font-size: 13px;
}

.import-result {
    margin-top: 16px;

    .result-summary {
        font-size: 13px;
    }
}

.text-success {
    color: var(--el-color-success);
}

.text-danger {
    color: var(--el-color-danger);
}

.mt10 {
    margin-top: 10px;
}
</style>
