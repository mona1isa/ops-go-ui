<template>
    <div class="cmdb-asset-dialog-container">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.visible" width="680px">
            <el-form ref="assetFormRef" :rules="rules" :model="state.ruleForm" label-width="100px">
                <el-row :gutter="35">
                    <el-col :span="12" class="mb20">
                        <el-form-item label="模型类型" prop="modelType">
                            <el-select v-model="state.ruleForm.modelType" :disabled="state.dialog.type === 'edit'" placeholder="请选择模型" class="w100" @change="onModelChange">
                                <el-option v-for="m in cmdbModelTypes" :key="m.value" :label="m.label" :value="m.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" class="mb20">
                        <el-form-item label="资产名称" prop="name">
                            <el-input v-model="state.ruleForm.name" maxlength="128" placeholder="同类型下不可重名" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" class="mb20">
                        <el-form-item label="IP地址" prop="ip">
                            <el-input v-model="state.ruleForm.ip" maxlength="64" placeholder="域名/证书可留空" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" class="mb20">
                        <el-form-item label="资产编号" prop="sn">
                            <el-input v-model="state.ruleForm.sn" maxlength="128" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" class="mb20">
                        <el-form-item label="负责人" prop="owner">
                            <el-input v-model="state.ruleForm.owner" maxlength="64" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" class="mb20">
                        <el-form-item label="供应商" prop="provider">
                            <el-input v-model="state.ruleForm.provider" maxlength="128" placeholder="供应商/云厂商" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" class="mb20">
                        <el-form-item label="机房/区域" prop="location">
                            <el-input v-model="state.ruleForm.location" maxlength="128" />
                        </el-form-item>
                    </el-col>
                    <el-col v-if="showExpire" :span="12" class="mb20">
                        <el-form-item label="到期时间" prop="expiredAt">
                            <el-date-picker v-model="state.ruleForm.expiredAt" type="date" value-format="YYYY-MM-DDTHH:mm:ssZ" placeholder="选择到期日期" class="w100" />
                        </el-form-item>
                    </el-col>
                    <el-col v-if="state.dialog.type === 'add'" :span="12" class="mb20">
                        <el-form-item label="初始状态" prop="status">
                            <el-select v-model="state.ruleForm.status" class="w100">
                                <el-option v-for="s in cmdbStatusOptions" :key="s.value" :label="s.label" :value="s.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <!-- 模型专属属性字段 -->
                    <el-col v-for="field in attrFields" :key="field.key" :span="12" class="mb20">
                        <el-form-item :label="field.label">
                            <el-input-number v-if="field.type === 'number'" v-model="attrsModel[field.key]" :min="0" controls-position="right" class="w100" />
                            <el-select v-else-if="field.type === 'select'" v-model="attrsModel[field.key]" clearable placeholder="请选择" class="w100">
                                <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
                            </el-select>
                            <el-input v-else v-model="attrsModel[field.key]" :placeholder="field.placeholder" maxlength="128" />
                        </el-form-item>
                    </el-col>

                    <el-col :span="24" class="mb20">
                        <el-form-item label="备注" prop="remark">
                            <el-input v-model="state.ruleForm.remark" type="textarea" maxlength="500" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="onCancel">取 消</el-button>
                    <el-button type="primary" @click="onSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="cmdbAssetDialog">
import { computed, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useCmdbApi } from '/@/api/cmdb';
import { cmdbModelTypes, cmdbStatusOptions, cmdbAttrSchema, parseAttrs } from '/@/views/cmdb/asset/schema';

const cmdbApi = useCmdbApi();
const emit = defineEmits(['refresh']);

const assetFormRef = ref();
const attrsModel = ref<Record<string, any>>({});

const rules = reactive({
    modelType: [{ required: true, message: '请选择模型类型', trigger: 'change' }],
    name: [{ required: true, message: '请输入资产名称', trigger: 'blur' }],
});

const initState = {
    id: 0,
    modelType: 'server',
    name: '',
    ip: '',
    sn: '',
    status: 3,
    owner: '',
    provider: '',
    location: '',
    expiredAt: '' as string,
    remark: '',
};

const state = reactive({
    ruleForm: { ...initState },
    dialog: { visible: false, title: '', type: '' },
});

const attrFields = computed(() => cmdbAttrSchema[state.ruleForm.modelType] ?? []);
// 域名/证书类资产展示到期时间
const showExpire = computed(() => ['domain', 'ssl'].includes(state.ruleForm.modelType));

const onModelChange = () => {
    attrsModel.value = {};
};

const openDialog = (type: string, row?: any) => {
    if (type === 'edit' && row) {
        state.ruleForm = {
            id: row.id,
            modelType: row.modelType,
            name: row.name,
            ip: row.ip ?? '',
            sn: row.sn ?? '',
            status: row.status,
            owner: row.owner ?? '',
            provider: row.provider ?? '',
            location: row.location ?? '',
            expiredAt: row.expiredAt ?? '',
            remark: row.remark ?? '',
        };
        attrsModel.value = parseAttrs(row.attrs);
        state.dialog.title = '编辑资产';
    } else {
        state.ruleForm = { ...initState };
        attrsModel.value = {};
        state.dialog.title = '新增资产';
    }
    state.dialog.visible = true;
    state.dialog.type = type;
};

const onCancel = () => {
    state.dialog.visible = false;
};

const onSubmit = async () => {
    try {
        await assetFormRef.value?.validate();
    } catch {
        return;
    }
    // 过滤空属性字段后序列化
    const cleanAttrs: Record<string, any> = {};
    Object.keys(attrsModel.value).forEach((key) => {
        const val = attrsModel.value[key];
        if (val !== undefined && val !== null && val !== '') {
            cleanAttrs[key] = val;
        }
    });
    const submitData: Record<string, any> = {
        ...state.ruleForm,
        attrs: Object.keys(cleanAttrs).length > 0 ? JSON.stringify(cleanAttrs) : '',
    };
    if (!showExpire.value) {
        submitData.expiredAt = null;
    }
    if (state.dialog.type === 'add') {
        delete submitData.id;
        const res = await cmdbApi.addAsset(submitData);
        if (res && res.code == 200) {
            ElMessage.success('添加成功');
        } else {
            return;
        }
    } else {
        const res = await cmdbApi.updateAsset(submitData);
        if (res && res.code == 200) {
            ElMessage.success('修改成功');
        } else {
            return;
        }
    }
    state.dialog.visible = false;
    emit('refresh');
};

defineExpose({ openDialog });
</script>
