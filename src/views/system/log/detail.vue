<template>
	<div class="system-log-detail-container">
		<el-dialog title="日志详情" v-model="state.dialog.isShowDialog" width="800px" @close="onClose">
			<el-descriptions :column="1" border>
				<el-descriptions-item label="ID">{{ state.logDetail.id }}</el-descriptions-item>
				<el-descriptions-item label="操作人">{{ state.logDetail.createUser || '-' }}</el-descriptions-item>
				<el-descriptions-item label="请求地址">{{ state.logDetail.requestUri || '-' }}</el-descriptions-item>
				<el-descriptions-item label="请求方法">
					<el-tag :type="getMethodTagType(state.logDetail.method)">{{ state.logDetail.method || '-' }}</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="状态码">
					<el-tag :type="getStatusTagType(state.logDetail.statusCode)">{{ state.logDetail.statusCode || '-' }}</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="耗时">{{ state.logDetail.costTimeMs }} 毫秒</el-descriptions-item>
				<el-descriptions-item label="IP地址">{{ state.logDetail.ipAddr || '-' }}</el-descriptions-item>
				<el-descriptions-item label="请求时间">
					{{ state.logDetail.createTime ? dayjs(state.logDetail.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
				</el-descriptions-item>
			</el-descriptions>

			<div class="log-detail-section">
				<div class="log-detail-label">请求参数：</div>
				<el-input
					v-model="state.logDetail.params"
					type="textarea"
					:rows="4"
					readonly
					placeholder="无请求参数"
					class="log-detail-textarea"
				/>
			</div>

			<div class="log-detail-section">
				<div class="log-detail-label">响应数据：</div>
				<el-input
					v-model="state.logDetail.resp"
					type="textarea"
					:rows="8"
					readonly
					placeholder="无响应数据"
					class="log-detail-textarea"
				/>
			</div>

			<template #footer>
				<span class="dialog-footer">
					<el-button type="primary" @click="onClose">关 闭</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="systemLogDetail">
import { reactive } from 'vue';
import { dayjs } from 'element-plus';

// 定义类型
interface LogDetailType {
	id: number;
	createUser?: string;
	requestUri?: string;
	method?: string;
	statusCode?: string;
	costTimeMs?: number;
	ipAddr?: string;
	createTime?: string;
	params?: string;
	resp?: string;
}

// 定义变量内容
const state = reactive({
	dialog: {
		isShowDialog: false,
	},
	logDetail: {} as LogDetailType,
});

// 打开弹窗
const openDialog = (row: any) => {
	state.logDetail = {
		id: row.id || 0,
		createUser: row.createUser || row.createBy || '',
		requestUri: row.requestUri || '',
		method: row.method || '',
		statusCode: row.statusCode || '',
		costTimeMs: row.costTimeMs || 0,
		ipAddr: row.ipAddr || '',
		createTime: row.createTime || row.createAt || '',
		params: row.params || '',
		resp: row.resp || '',
	};
	state.dialog.isShowDialog = true;
};

// 关闭弹窗
const onClose = () => {
	state.dialog.isShowDialog = false;
};

// 获取请求方法标签类型
const getMethodTagType = (method?: string) => {
	if (!method) return 'info';
	const methodUpper = method.toUpperCase();
	switch (methodUpper) {
		case 'GET':
			return 'success';
		case 'POST':
			return 'primary';
		case 'PUT':
			return 'warning';
		case 'DELETE':
			return 'danger';
		case 'PATCH':
			return 'warning';
		default:
			return 'info';
	}
};

// 获取状态码标签类型
const getStatusTagType = (statusCode?: string) => {
	if (!statusCode) return 'info';
	const code = parseInt(statusCode);
	if (code >= 200 && code < 300) {
		return 'success';
	} else if (code >= 300 && code < 400) {
		return 'info';
	} else if (code >= 400 && code < 500) {
		return 'warning';
	} else if (code >= 500) {
		return 'danger';
	}
	return 'info';
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>

<style scoped lang="scss">
.system-log-detail-container {
	.log-detail-section {
		margin-top: 20px;

		.log-detail-label {
			font-weight: 500;
			margin-bottom: 8px;
			color: var(--el-text-color-primary);
		}

		.log-detail-textarea {
			width: 100%;
		}
	}
}
</style>
