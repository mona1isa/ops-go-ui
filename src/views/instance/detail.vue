<template>
    <el-drawer v-model="drawerVisible" title="主机详情" size="30%" :before-close="handleClose">
        <el-descriptions :column="1" border>
            <el-descriptions-item label="主机名称">{{ detailData.name }}</el-descriptions-item>
            <el-descriptions-item label="规格">{{ detailData.spec }}</el-descriptions-item>
            <el-descriptions-item label="主机IP">{{ detailData.ip }}</el-descriptions-item>
            <el-descriptions-item label="登录凭证">
                {{ getbindingKeys(detailData.bindingKeys) }}
            </el-descriptions-item>
            <el-descriptions-item label="主机状态">
                <el-tag :type="detailData.status === '1' ? 'success' : 'danger'">
                    {{ detailData.status === '1' ? '启用' : '禁用' }}
                </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="主机描述">{{ detailData.remark }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ dayjs(detailData.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</el-descriptions-item>
        </el-descriptions>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { dayjs } from 'element-plus';

const drawerVisible = ref(false);
const detailData = ref<any>({});

const handleClose = (done: () => void) => {
    done();
};

const openDrawer = (data: any) => {
    detailData.value = data;
    drawerVisible.value = true;
};

// 获取绑定凭证
const getbindingKeys = (bindingKeys: any) => {
    if (!bindingKeys || bindingKeys.length === 0) return '未绑定任何凭证';
    return bindingKeys.map((item: any) => {
        let type = '';
        if (item.type === 1) {
            type = '密码';
        } else if (item.type === 2) {
            type = '密钥';
        }
        return `${item.name} (类型: ${type || '未知'})`;
    }).join('; ');
};

defineExpose({
    openDrawer,
});
</script>

<style scoped lang="scss">
</style>