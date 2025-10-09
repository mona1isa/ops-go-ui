<template>
    <div>
        <el-dialog :visible="state.dialog.visible" :title="state.dialog.title" :width="state.dialog.width">

        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="instanceDialog">
import { defineAsyncComponent, ref, reactive } from 'vue';
import { RowInstanceType } from '/@/types/views'; // Ensure this path is correct
import { ElMessageBox, ElMessage } from 'element-plus';
import { useInstanceApi } from '/@/api/instance';
import { InstanceStatusItem } from '/@/types/views';


const instanceApi = useInstanceApi();

// 定义变量
const openInstanceDialog = (type: string, row: RowInstanceType) => {};
const state = reactive({
	dialog: {
		visible: false,
		title: '',
		width: '50%',
	},
	
});

// 暴露变量
defineExpose({
	openInstanceDialog,
});
</script>