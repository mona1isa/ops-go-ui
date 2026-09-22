<template>
	<div class="sftp-wrapper" :class="{ collapsed: !sftpState.visible }">
		<!-- 切换按钮 -->
		<div class="sftp-toggle" @click="toggleSftp">
			<el-icon size="14">
				<ele-ArrowRight v-if="!sftpState.visible" />
				<ele-ArrowLeft v-else />
			</el-icon>
			<span class="toggle-text">{{ sftpState.visible ? '收起' : '文件' }}</span>
		</div>

		<!-- SFTP 面板 -->
		<div class="sftp-panel">
			<div class="sftp-content" v-show="sftpState.visible">
				<!-- 空状态 -->
				<div v-if="!props.connected || !props.instanceId" class="sftp-empty">
					<el-empty description="请先连接主机" :image-size="60" />
				</div>

				<template v-else>
					<!-- SFTP 标题栏 -->
					<div class="sftp-header">
						<span class="sftp-title">SFTP 文件管理</span>
						<span class="sftp-host">{{ hostLabel }}</span>
					</div>

					<!-- 工具栏 -->
					<div class="sftp-toolbar">
						<el-button size="small" plain @click="goBack" :disabled="sftpState.currentPath === '/'">
							<el-icon><ele-Back /></el-icon>
						</el-button>
						<el-button size="small" plain @click="refreshSftp">
							<el-icon><ele-Refresh /></el-icon>
						</el-button>
						<el-button size="small" plain type="primary" @click="showMkdirDialog">
							<el-icon><ele-FolderAdd /></el-icon>
						</el-button>
						<el-upload
							class="upload-inline"
							action="#"
							:auto-upload="false"
							:show-file-list="false"
							:on-change="handleUploadChange"
							:multiple="false"
						>
							<el-button size="small" plain type="success">
								<el-icon><ele-Upload /></el-icon>
							</el-button>
						</el-upload>
						<el-popover placement="bottom-end" :width="420" trigger="click">
							<template #reference>
								<el-badge :value="uploadTasks.length" :hidden="!uploadTasks.length">
									<el-button ref="taskButtonRef" size="small" plain title="上传任务">
										<el-icon><ele-Clock /></el-icon>
									</el-button>
								</el-badge>
							</template>
							<div class="upload-tasks-popover">
								<div class="tasks-header">上传任务</div>
								<el-empty v-if="uploadTasks.length === 0" description="暂无上传任务" :image-size="60" />
								<div v-else class="tasks-list">
									<div v-for="task in uploadTasks" :key="task.id" class="task-item">
										<div class="task-info">
											<el-icon size="16"><ele-Document /></el-icon>
											<span class="task-name" :title="task.fileName">{{ task.fileName }}</span>
											<el-tag v-if="task.status === 'uploading'" size="small" type="warning">上传中</el-tag>
											<el-tag v-else-if="task.status === 'completed'" size="small" type="success">已完成</el-tag>
											<el-tag v-else-if="task.status === 'failed'" size="small" type="danger">失败</el-tag>
											<el-tag v-else-if="task.status === 'canceled'" size="small" type="info">已取消</el-tag>
											<el-icon v-if="task.status !== 'uploading'" size="14" class="task-remove" @click="removeUploadTask(task.id)">
												<ele-Close />
											</el-icon>
										</div>
										<el-progress
											:percentage="task.percentage"
											:stroke-width="6"
											:status="task.status === 'failed' ? 'exception' : task.status === 'completed' ? 'success' : ''"
										/>
										<div class="task-stats">
											<span>{{ formatSize(task.transferred) }} / {{ formatSize(task.fileSize) }}</span>
											<span v-if="task.errorMsg" class="task-error">{{ task.errorMsg }}</span>
										</div>
									</div>
								</div>
							</div>
						</el-popover>
					</div>

					<!-- 面包屑 -->
					<div class="sftp-breadcrumb">
						<el-breadcrumb separator="/">
							<el-breadcrumb-item
								v-for="(item, index) in sftpState.breadcrumbs"
								:key="index"
								@click="jumpToBreadcrumb(index)"
								:class="{ clickable: index < sftpState.breadcrumbs.length - 1 }"
							>
								{{ item === '' ? '根目录' : item }}
							</el-breadcrumb-item>
						</el-breadcrumb>
					</div>

					<!-- 文件列表 -->
					<el-table :data="sftpState.fileList" size="small" class="sftp-table" height="100%" v-loading="sftpState.loading">
						<el-table-column label="名称" min-width="140" show-overflow-tooltip>
							<template #default="scope">
								<div
									class="file-name-cell"
									:class="{ 'folder-link': scope.row.isDir }"
									@click="scope.row.isDir && enterDirectory(scope.row)"
								>
									<el-icon size="16" class="file-icon">
										<ele-Folder v-if="scope.row.isDir" />
										<ele-Document v-else />
									</el-icon>
									<span>{{ scope.row.name }}</span>
								</div>
							</template>
						</el-table-column>
						<el-table-column label="大小" width="80">
							<template #default="scope">
								<span v-if="!scope.row.isDir">{{ formatSize(scope.row.size) }}</span>
								<span v-else>-</span>
							</template>
						</el-table-column>
						<el-table-column label="操作" width="90">
							<template #default="scope">
								<el-icon
									v-if="!scope.row.isDir"
									size="16"
									class="action-icon"
									@click="showDownloadConfirm(scope.row)"
								>
									<ele-Download />
								</el-icon>
								<el-icon size="16" class="action-icon" @click="showRenameDialog(scope.row)">
									<ele-Edit />
								</el-icon>
								<el-icon size="16" class="action-icon action-delete" @click="removeFile(scope.row)">
									<ele-Delete />
								</el-icon>
							</template>
						</el-table-column>
					</el-table>

					<!-- 状态栏 -->
					<div class="sftp-status">
						<span>{{ sftpState.fileList.length }} 个项目</span>
						<span class="sftp-path" :title="sftpState.currentPath">{{ sftpState.currentPath }}</span>
					</div>
				</template>
			</div>
		</div>

		<!-- 新建文件夹对话框 -->
		<el-dialog v-model="sftpState.showMkdirDialog" title="新建文件夹" width="400px" append-to-body>
			<el-input v-model="sftpState.newDirName" placeholder="请输入文件夹名称" />
			<template #footer>
				<el-button @click="sftpState.showMkdirDialog = false">取消</el-button>
				<el-button type="primary" @click="doMkdir">确定</el-button>
			</template>
		</el-dialog>

		<!-- 重命名对话框 -->
		<el-dialog v-model="sftpState.showRenameDialog" title="重命名" width="400px" append-to-body>
			<el-input v-model="sftpState.newFileName" placeholder="请输入新名称" />
			<template #footer>
				<el-button @click="sftpState.showRenameDialog = false">取消</el-button>
				<el-button type="primary" @click="doRename">确定</el-button>
			</template>
		</el-dialog>

		<!-- 下载确认对话框 -->
		<el-dialog v-model="downloadDialog.visible" title="文件下载" width="400px" :close-on-click-modal="false" append-to-body>
			<div class="download-confirm">
				<el-icon size="32" class="download-icon"><ele-Download /></el-icon>
				<div class="download-info">
					<p class="download-filename">{{ downloadDialog.fileName }}</p>
					<p class="download-filesize">{{ formatSize(downloadDialog.fileSize) }}</p>
				</div>
			</div>
			<template #footer>
				<el-button @click="downloadDialog.visible = false">取消</el-button>
				<el-button type="primary" @click="doDownloadFile">确定下载</el-button>
			</template>
		</el-dialog>

		<!-- 文件传输进度对话框 -->
		<el-dialog
			v-model="transferProgress.visible"
			:title="transferProgress.type === 'upload' ? '文件上传中' : '文件下载中'"
			width="420px"
			:close-on-click-modal="false"
			:show-close="false"
			:close-on-press-escape="false"
			append-to-body
		>
			<div class="transfer-progress">
				<div class="transfer-file-info">
					<el-icon size="18" class="file-type-icon"><ele-Document /></el-icon>
					<span class="file-name" :title="transferProgress.fileName">{{ transferProgress.fileName }}</span>
				</div>
				<el-progress
					:percentage="transferProgress.percentage"
					:stroke-width="14"
					:status="transferProgress.status === 'exception' ? 'exception' : ''"
				/>
				<div class="transfer-stats">
					<span>{{ formatSize(transferProgress.transferred) }} / {{ formatSize(transferProgress.fileSize) }}</span>
					<span>{{ transferProgress.percentage }}%</span>
				</div>
				<div class="transfer-actions">
					<el-button size="small" @click="runInBackground" type="warning" plain v-if="transferProgress.type === 'upload' && transferProgress.status === 'uploading'">后台运行</el-button>
					<el-button size="small" @click="cancelTransfer" type="danger" plain v-if="transferProgress.status === 'uploading' || transferProgress.status === 'downloading'">取消</el-button>
					<el-button size="small" @click="confirmTransfer" type="primary" plain v-else>确定</el-button>
				</div>
			</div>
		</el-dialog>

		<!-- 飞入动画元素 -->
		<div v-if="flyStyle.show" class="fly-dot" :style="{ left: flyStyle.left, top: flyStyle.top }"></div>
	</div>
</template>

<script setup lang="ts" name="sftpPanel">
import { reactive, ref, watch, onBeforeUnmount, PropType } from 'vue';
import { useSftpApi } from '/@/api/sftp';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps({
	// 当前主机 ID
	instanceId: { type: Number as PropType<number | null>, default: null },
	// 当前选中的登录凭证 ID
	keyId: { type: Number as PropType<number | null>, default: null },
	// 是否已建立 SSH 连接（连接成功后才加载文件列表）
	connected: { type: Boolean, default: false },
	// 主机展示名（用于标题栏）
	hostLabel: { type: String, default: '' },
});

const emit = defineEmits<{ (e: 'toggle'): void }>();

const sftpApi = useSftpApi();

// SFTP 面板状态
const sftpState = reactive({
	visible: true,
	loading: false,
	currentPath: '/',
	fileList: [] as any[],
	breadcrumbs: [''] as string[],
	showMkdirDialog: false,
	newDirName: '',
	showRenameDialog: false,
	newFileName: '',
	renameTarget: null as any,
});

// 文件传输进度状态
const transferProgress = reactive({
	visible: false,
	type: 'upload' as 'upload' | 'download',
	fileName: '',
	fileSize: 0,
	transferred: 0,
	percentage: 0,
	status: '' as '' | 'uploading' | 'downloading' | 'exception',
});

// 文件下载确认对话框状态
const downloadDialog = reactive({
	visible: false,
	fileName: '',
	fileSize: 0,
	row: null as any,
});

let abortController: AbortController | null = null;

// 后台上传任务
interface UploadTask {
	id: number;
	fileName: string;
	fileSize: number;
	transferred: number;
	percentage: number;
	status: 'uploading' | 'completed' | 'failed' | 'canceled';
	abortController: AbortController | null;
	errorMsg?: string;
}
let taskIdCounter = 0;
const uploadTasks = reactive<UploadTask[]>([]);
const taskButtonRef = ref<any>(null);
const flyStyle = reactive({ left: '0px', top: '0px', show: false });

// 上传会话 ID，用于将 pendingBgSwitch 绑定到特定上传调用，避免并发上传互相干扰
let uploadSessionCounter = 0;
const currentUploadSession = ref(0);

// 待切换后台上传的任务
const pendingBgSwitch = ref<{ task: UploadTask; sessionId: number } | null>(null);

const cancelTransfer = () => {
	if (abortController) {
		abortController.abort();
		abortController = null;
	}
	if (pendingBgSwitch.value) {
		const task = uploadTasks.find((t) => t.id === pendingBgSwitch.value!.task.id);
		if (task && task.status === 'uploading') task.status = 'canceled';
		pendingBgSwitch.value = null;
	}
	transferProgress.visible = false;
	transferProgress.status = '';
};

const confirmTransfer = () => {
	transferProgress.visible = false;
	transferProgress.status = '';
};

const runInBackground = () => {
	if (!abortController || pendingBgSwitch.value) return;
	const task: UploadTask = {
		id: ++taskIdCounter,
		fileName: transferProgress.fileName,
		fileSize: transferProgress.fileSize,
		transferred: transferProgress.transferred,
		percentage: transferProgress.percentage,
		status: 'uploading',
		abortController: abortController,
	};
	uploadTasks.push(task);
	pendingBgSwitch.value = { task, sessionId: currentUploadSession.value };
	abortController = null; // 后台任务接管 AbortController 所有权
	triggerFlyAnimation();
	transferProgress.visible = false;
	transferProgress.status = '';
};

// 飞入动画
const triggerFlyAnimation = () => {
	const btnEl = taskButtonRef.value?.$el || taskButtonRef.value;
	if (!btnEl || typeof btnEl.getBoundingClientRect !== 'function') return;
	const btnRect = btnEl.getBoundingClientRect();
	const targetX = btnRect.left + btnRect.width / 2;
	const targetY = btnRect.top + btnRect.height / 2;
	const startX = window.innerWidth / 2;
	const startY = window.innerHeight / 2;

	flyStyle.left = `${startX}px`;
	flyStyle.top = `${startY}px`;
	flyStyle.show = true;

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			flyStyle.left = `${targetX}px`;
			flyStyle.top = `${targetY}px`;
		});
	});

	setTimeout(() => {
		flyStyle.show = false;
	}, 600);
};

// 移除后台上传任务
const removeUploadTask = (taskId: number) => {
	const idx = uploadTasks.findIndex((t) => t.id === taskId);
	if (idx >= 0) {
		const task = uploadTasks[idx];
		if (task.abortController && task.status === 'uploading') {
			task.abortController.abort();
		}
		uploadTasks.splice(idx, 1);
	}
};

// ========== SFTP 相关方法 ==========

const toggleSftp = () => {
	sftpState.visible = !sftpState.visible;
	emit('toggle');
};

const loadSftpFileList = async (path: string) => {
	if (!props.instanceId || !props.keyId) return;
	sftpState.loading = true;
	try {
		const res = await sftpApi.listFiles({
			instanceId: props.instanceId,
			keyId: props.keyId,
			path: path,
		});
		sftpState.currentPath = res.data?.path || path;
		sftpState.fileList = res.data?.files || [];
		sftpState.fileList.sort((a: any, b: any) => {
			if (a.isDir === b.isDir) {
				return a.name.localeCompare(b.name);
			}
			return a.isDir ? -1 : 1;
		});
		updateBreadcrumbs(sftpState.currentPath);
		if (props.instanceId) {
			sftpCache.set(props.instanceId, {
				currentPath: sftpState.currentPath,
				fileList: sftpState.fileList,
				breadcrumbs: sftpState.breadcrumbs,
			});
		}
	} catch (error: any) {
		ElMessage.error(error.message || '加载文件列表失败');
	} finally {
		sftpState.loading = false;
	}
};

const updateBreadcrumbs = (path: string) => {
	if (path === '/') {
		sftpState.breadcrumbs = [''];
	} else {
		const parts = path.split('/').filter(Boolean);
		sftpState.breadcrumbs = ['', ...parts];
	}
};

const jumpToBreadcrumb = (index: number) => {
	if (index === sftpState.breadcrumbs.length - 1) return;
	if (index === 0) {
		loadSftpFileList('/');
	} else {
		const path = '/' + sftpState.breadcrumbs.slice(1, index + 1).join('/');
		loadSftpFileList(path);
	}
};

const goBack = () => {
	if (sftpState.currentPath === '/') return;
	const parentPath = sftpState.currentPath.substring(0, sftpState.currentPath.lastIndexOf('/'));
	loadSftpFileList(parentPath || '/');
};

const refreshSftp = () => {
	loadSftpFileList(sftpState.currentPath);
};

const enterDirectory = (row: any) => {
	const newPath = sftpState.currentPath === '/' ? `/${row.name}` : `${sftpState.currentPath}/${row.name}`;
	loadSftpFileList(newPath);
};

const formatSize = (size: number) => {
	if (size < 1024) return size + ' B';
	if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
	if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(2) + ' MB';
	return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
};

const showDownloadConfirm = (row: any) => {
	downloadDialog.fileName = row.name;
	downloadDialog.fileSize = row.size || 0;
	downloadDialog.row = row;
	downloadDialog.visible = true;
};

const doDownloadFile = () => {
	if (downloadDialog.row) {
		downloadFile(downloadDialog.row);
	}
	downloadDialog.visible = false;
};

const downloadFile = async (row: any) => {
	if (!props.instanceId || !props.keyId) return;

	let writableStream: any = null;
	let useFilePicker = false;

	if ('showSaveFilePicker' in window) {
		try {
			const handle = await (window as any).showSaveFilePicker({
				suggestedName: row.name,
			});
			writableStream = await handle.createWritable();
			useFilePicker = true;
		} catch (err: any) {
			if (err.name === 'AbortError') {
				return;
			}
			ElMessage.error(err.message || '打开保存对话框失败');
			return;
		}
	}

	transferProgress.visible = true;
	transferProgress.type = 'download';
	transferProgress.fileName = row.name;
	transferProgress.fileSize = row.size || 0;
	transferProgress.transferred = 0;
	transferProgress.percentage = 0;
	transferProgress.status = 'downloading';

	abortController = new AbortController();
	const remotePath = sftpState.currentPath === '/' ? `/${row.name}` : `${sftpState.currentPath}/${row.name}`;

	try {
		if (useFilePicker && writableStream) {
			const fileWritable = {
				write: async (chunk: Uint8Array) => {
					await writableStream.write(chunk);
				},
				close: async () => {
					await writableStream.close();
				},
			};
			await sftpApi.downloadStream(
				{
					instanceId: props.instanceId,
					keyId: props.keyId,
					remotePath: remotePath,
					fileSize: row.size || 0,
				},
				fileWritable,
				(received, total) => {
					transferProgress.transferred = received;
					transferProgress.percentage = total > 0 ? Math.round((received * 100) / total) : 0;
				},
				abortController.signal
			);
		} else {
			const chunks: Uint8Array[] = [];
			const blobWritable = {
				write: async (chunk: Uint8Array) => {
					chunks.push(chunk);
				},
				close: async () => {
					return new Blob(chunks as BlobPart[]);
				},
			};
			const blob = await sftpApi.downloadStream(
				{
					instanceId: props.instanceId,
					keyId: props.keyId,
					remotePath: remotePath,
					fileSize: row.size || 0,
				},
				blobWritable,
				(received, total) => {
					transferProgress.transferred = received;
					transferProgress.percentage = total > 0 ? Math.round((received * 100) / total) : 0;
				},
				abortController.signal
			);
			const url = window.URL.createObjectURL(blob as Blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = row.name;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		}
		transferProgress.status = '';
		ElMessage.success('下载成功');
	} catch (error: any) {
		if (error.name === 'AbortError') {
			ElMessage.info('下载已取消');
			transferProgress.visible = false;
			transferProgress.status = '';
		} else {
			transferProgress.status = 'exception';
			ElMessage.error(error.message || '下载失败');
		}
		if (useFilePicker && writableStream) {
			try {
				await writableStream.abort();
			} catch (e) {
				// 忽略中止错误
			}
		}
	} finally {
		abortController = null;
	}
};

const removeFile = async (row: any) => {
	if (!props.instanceId || !props.keyId) return;
	try {
		await ElMessageBox.confirm(`确定要删除 ${row.isDir ? '文件夹' : '文件'} "${row.name}" 吗？`, '确认删除', {
			confirmButtonText: '确定',
			cancelButtonText: '取消',
			type: 'warning',
		});
	} catch {
		return;
	}
	sftpState.loading = true;
	try {
		const remotePath = sftpState.currentPath === '/' ? `/${row.name}` : `${sftpState.currentPath}/${row.name}`;
		await sftpApi.removeFile({
			instanceId: props.instanceId,
			keyId: props.keyId,
			remotePath: remotePath,
			isDir: row.isDir,
		});
		ElMessage.success('删除成功');
		await refreshSftp();
	} catch (error: any) {
		ElMessage.error(error.message || '删除失败');
	} finally {
		sftpState.loading = false;
	}
};

const showMkdirDialog = () => {
	sftpState.newDirName = '';
	sftpState.showMkdirDialog = true;
};

const doMkdir = async () => {
	if (!props.instanceId || !props.keyId || !sftpState.newDirName.trim()) {
		ElMessage.warning('请输入文件夹名称');
		return;
	}
	sftpState.loading = true;
	try {
		const remotePath = sftpState.currentPath === '/' ? `/${sftpState.newDirName}` : `${sftpState.currentPath}/${sftpState.newDirName}`;
		await sftpApi.mkdir({
			instanceId: props.instanceId,
			keyId: props.keyId,
			remotePath: remotePath,
		});
		ElMessage.success('创建成功');
		sftpState.showMkdirDialog = false;
		await refreshSftp();
	} catch (error: any) {
		ElMessage.error(error.message || '创建失败');
	} finally {
		sftpState.loading = false;
	}
};

const showRenameDialog = (row?: any) => {
	if (row) {
		sftpState.renameTarget = row;
		sftpState.newFileName = row.name;
	} else {
		sftpState.newFileName = '';
	}
	sftpState.showRenameDialog = true;
};

const doRename = async () => {
	if (!props.instanceId || !props.keyId || !sftpState.newFileName.trim() || !sftpState.renameTarget) {
		ElMessage.warning('请输入新名称');
		return;
	}
	sftpState.loading = true;
	try {
		const oldPath = sftpState.currentPath === '/' ? `/${sftpState.renameTarget.name}` : `${sftpState.currentPath}/${sftpState.renameTarget.name}`;
		const newPath = sftpState.currentPath === '/' ? `/${sftpState.newFileName}` : `${sftpState.currentPath}/${sftpState.newFileName}`;
		await sftpApi.renameFile({
			instanceId: props.instanceId,
			keyId: props.keyId,
			oldPath: oldPath,
			newPath: newPath,
		});
		ElMessage.success('重命名成功');
		sftpState.showRenameDialog = false;
		await refreshSftp();
	} catch (error: any) {
		ElMessage.error(error.message || '重命名失败');
	} finally {
		sftpState.loading = false;
	}
};

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

const handleUploadChange = async (uploadFile: any) => {
	if (!props.instanceId || !props.keyId) return;
	const file = uploadFile.raw;
	if (!file) return;

	if (file.size <= CHUNK_SIZE) {
		await uploadSingleFile(file, props.instanceId, props.keyId);
		return;
	}
	await uploadChunkedFile(file, props.instanceId, props.keyId);
};

const uploadSingleFile = async (file: File, instanceId: number, keyId: number) => {
	const mySessionId = ++uploadSessionCounter;
	currentUploadSession.value = mySessionId;

	transferProgress.visible = true;
	transferProgress.type = 'upload';
	transferProgress.fileName = file.name;
	transferProgress.fileSize = file.size || 0;
	transferProgress.transferred = 0;
	transferProgress.percentage = 0;
	transferProgress.status = 'uploading';

	let myBgTaskId: number | null = null;

	const updateProgress = (loaded: number, total: number) => {
		if (pendingBgSwitch.value && pendingBgSwitch.value.sessionId === mySessionId && myBgTaskId === null) {
			myBgTaskId = pendingBgSwitch.value.task.id;
			pendingBgSwitch.value = null;
		}
		const bgTask = myBgTaskId !== null ? uploadTasks.find((t) => t.id === myBgTaskId) : undefined;
		if (bgTask) {
			bgTask.transferred = loaded;
			bgTask.percentage = total > 0 ? Math.round((loaded * 100) / total) : 0;
		} else {
			transferProgress.transferred = loaded;
			transferProgress.percentage = total > 0 ? Math.round((loaded * 100) / total) : 0;
		}
	};

	const formData = new FormData();
	formData.append('file', file);
	formData.append('instanceId', String(instanceId));
	formData.append('keyId', String(keyId));
	formData.append('remotePath', sftpState.currentPath);

	abortController = new AbortController();
	try {
		await sftpApi.uploadFile(
			formData,
			(progressEvent: any) => {
				const loaded = progressEvent.loaded || 0;
				const total = progressEvent.total || file.size || 0;
				updateProgress(loaded, total);
			},
			abortController.signal
		);
		const bgTask = myBgTaskId !== null ? uploadTasks.find((t) => t.id === myBgTaskId) : undefined;
		if (bgTask) {
			bgTask.status = 'completed';
			bgTask.percentage = 100;
			ElMessage.success(`后台上传完成: ${file.name}`);
		} else {
			transferProgress.status = '';
			ElMessage.success('上传成功');
		}
		await refreshSftp();
	} catch (error: any) {
		const bgTask = myBgTaskId !== null ? uploadTasks.find((t) => t.id === myBgTaskId) : undefined;
		if (error.name === 'AbortError' || error.message === 'canceled') {
			if (bgTask) {
				if (bgTask.status === 'uploading') bgTask.status = 'canceled';
			} else {
				ElMessage.info('上传已取消');
				transferProgress.visible = false;
				transferProgress.status = '';
			}
		} else {
			if (bgTask) {
				bgTask.status = 'failed';
				bgTask.errorMsg = error.message || '上传失败';
			} else {
				transferProgress.status = 'exception';
				ElMessage.error(error.message || '上传失败');
			}
		}
	} finally {
		abortController = null;
	}
};

const uploadChunkedFile = async (file: File, instanceId: number, keyId: number) => {
	const mySessionId = ++uploadSessionCounter;
	currentUploadSession.value = mySessionId;

	const chunkTotal = Math.ceil(file.size / CHUNK_SIZE);

	let uploadedSize = 0;
	try {
		const checkRes = await sftpApi.uploadCheck({
			instanceId,
			keyId,
			remotePath: sftpState.currentPath,
			fileName: file.name,
		});
		uploadedSize = checkRes.data?.uploadedSize || 0;
	} catch (e: any) {
		// 查询失败继续从 0 开始
	}

	const startChunk = Math.floor(uploadedSize / CHUNK_SIZE);

	let myBgTaskId: number | null = null;

	const updateProgress = (loaded: number, total: number) => {
		if (pendingBgSwitch.value && pendingBgSwitch.value.sessionId === mySessionId && myBgTaskId === null) {
			myBgTaskId = pendingBgSwitch.value.task.id;
			pendingBgSwitch.value = null;
		}
		const bgTask = myBgTaskId !== null ? uploadTasks.find((t) => t.id === myBgTaskId) : undefined;
		if (bgTask) {
			bgTask.transferred = loaded;
			bgTask.percentage = total > 0 ? Math.round((loaded * 100) / total) : 0;
		} else {
			transferProgress.transferred = loaded;
			transferProgress.percentage = total > 0 ? Math.round((loaded * 100) / total) : 0;
		}
	};

	transferProgress.visible = true;
	transferProgress.type = 'upload';
	transferProgress.fileName = file.name;
	transferProgress.fileSize = file.size || 0;
	transferProgress.transferred = uploadedSize;
	transferProgress.percentage = file.size > 0 ? Math.round((uploadedSize * 100) / file.size) : 0;
	transferProgress.status = 'uploading';

	abortController = new AbortController();
	const localAbort = abortController;

	try {
		for (let i = startChunk; i < chunkTotal; i++) {
			if (localAbort.signal.aborted) {
				throw new Error('canceled');
			}

			const start = i * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);

			const formData = new FormData();
			formData.append('file', chunk, file.name);
			formData.append('instanceId', String(instanceId));
			formData.append('keyId', String(keyId));
			formData.append('remotePath', sftpState.currentPath);
			formData.append('chunkIndex', String(i));
			formData.append('chunkTotal', String(chunkTotal));
			formData.append('fileSize', String(file.size));
			formData.append('fileName', file.name);

			let lastError: any = null;
			let success = false;
			for (let retry = 0; retry < 3; retry++) {
				if (localAbort.signal.aborted) {
					throw new Error('canceled');
				}
				try {
					await sftpApi.uploadChunk(formData);
					success = true;
					break;
				} catch (err: any) {
					lastError = err;
					if (err.message === 'canceled') throw err;
					await new Promise((r) => setTimeout(r, 500 * (retry + 1)));
				}
			}
			if (!success) {
				throw lastError || new Error('分片上传失败');
			}

			updateProgress(end, file.size);
		}

		const bgTask = myBgTaskId !== null ? uploadTasks.find((t) => t.id === myBgTaskId) : undefined;
		if (bgTask) {
			bgTask.status = 'completed';
			bgTask.percentage = 100;
			ElMessage.success(`后台上传完成: ${file.name}`);
		} else {
			transferProgress.status = '';
			ElMessage.success('上传成功');
		}
		await refreshSftp();
	} catch (error: any) {
		const bgTask = myBgTaskId !== null ? uploadTasks.find((t) => t.id === myBgTaskId) : undefined;
		if (error.name === 'AbortError' || error.message === 'canceled') {
			if (bgTask) {
				if (bgTask.status === 'uploading') bgTask.status = 'canceled';
			} else {
				ElMessage.info('上传已取消');
				transferProgress.visible = false;
				transferProgress.status = '';
			}
		} else {
			if (bgTask) {
				bgTask.status = 'failed';
				bgTask.errorMsg = error.message || '上传失败';
			} else {
				transferProgress.status = 'exception';
				ElMessage.error(error.message || '上传失败');
			}
		}
	} finally {
		abortController = null;
	}
};

// 连接成功（或切换主机/凭证）后加载文件列表
// 按主机缓存 SFTP 浏览状态，切换标签页时还原各自的文件视图
const sftpCache = new Map<number, { currentPath: string; fileList: any[]; breadcrumbs: string[] }>();
const lastInstance = ref<number | null>(null);
const lastKey = ref<number | null>(null);
watch(
	() => [props.instanceId, props.keyId, props.connected],
	() => {
		if (!props.connected || !props.instanceId || !props.keyId) return;
		if (props.instanceId === lastInstance.value && props.keyId === lastKey.value) return;
		lastInstance.value = props.instanceId;
		lastKey.value = props.keyId;
		const cached = sftpCache.get(props.instanceId);
		if (cached) {
			sftpState.currentPath = cached.currentPath;
			sftpState.fileList = cached.fileList;
			sftpState.breadcrumbs = cached.breadcrumbs;
		} else {
			sftpState.currentPath = '/';
			sftpState.breadcrumbs = [''];
			sftpState.fileList = [];
			loadSftpFileList('/');
		}
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	if (abortController) {
		abortController.abort();
		abortController = null;
	}
	uploadTasks.forEach((t) => {
		if (t.abortController && t.status === 'uploading') t.abortController.abort();
	});
	uploadTasks.splice(0, uploadTasks.length);
});
</script>

<style scoped lang="scss">
// ===== SFTP 面板 =====
.sftp-wrapper {
	position: relative;
	display: flex;
	flex-shrink: 0;
	transition: width 0.3s ease, min-width 0.3s ease;
	background-color: #fff;

	&:not(.collapsed) {
		width: 420px;
		min-width: 420px;
	}

	&.collapsed {
		width: 0;
		min-width: 0;
	}
}

.sftp-toggle {
	position: absolute;
	left: -28px;
	top: 50%;
	transform: translateY(-50%);
	width: 28px;
	height: 64px;
	background: #409eff;
	color: #fff;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-radius: 4px 0 0 4px;
	cursor: pointer;
	z-index: 200;
	gap: 4px;
	transition: background 0.2s;

	&:hover {
		background: #66b1ff;
	}

	.toggle-text {
		font-size: 10px;
		writing-mode: vertical-lr;
		letter-spacing: 2px;
	}
}

.sftp-panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	background: #ffffff;
	border-left: 1px solid #dcdfe6;
	overflow: hidden;
}

.sftp-content {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 10px;
	overflow: hidden;
	min-width: 0;
}

.sftp-empty {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.sftp-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
	padding-bottom: 8px;
	border-bottom: 1px solid #ebeef5;

	.sftp-title {
		font-size: 14px;
		font-weight: 600;
		color: #303133;
	}

	.sftp-host {
		font-size: 12px;
		color: #909399;
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.sftp-toolbar {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 8px;
}

.upload-inline {
	display: inline-block;
}

.sftp-breadcrumb {
	margin-bottom: 8px;
	padding: 6px 8px;
	background: #f5f7fa;
	border-radius: 4px;
	font-size: 12px;

	:deep(.el-breadcrumb__item) {
		cursor: pointer;

		&.clickable .el-breadcrumb__inner {
			color: #409eff;

			&:hover {
				text-decoration: underline;
			}
		}
	}
}

.sftp-table {
	flex: 1;
	min-width: 0;

	:deep(.el-table__body-wrapper) {
		overflow-y: auto;
	}

	:deep(.el-table__body-wrapper),
	:deep(.el-table__header-wrapper) {
		overflow-x: hidden;
	}
}

.file-name-cell {
	display: flex;
	align-items: center;
	gap: 6px;

	&.folder-link {
		cursor: pointer;
		color: #409eff;

		&:hover {
			text-decoration: underline;
		}
	}
}

.file-icon {
	color: #409eff;
	flex-shrink: 0;
}

.action-icon {
	cursor: pointer;
	margin-right: 8px;
	color: #409eff;
	transition: color 0.2s;

	&:hover {
		color: #66b1ff;
	}

	&.action-delete {
		color: #f56c6c;

		&:hover {
			color: #f89898;
		}
	}
}

.sftp-status {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 6px 0;
	margin-top: 6px;
	font-size: 12px;
	color: #909399;
}

.sftp-path {
	max-width: 220px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.download-confirm {
	display: flex;
	align-items: center;
	gap: 12px;

	.download-icon {
		color: #409eff;
	}
}

.transfer-progress {
	.transfer-file-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;

		.file-type-icon {
			color: #409eff;
		}

		.file-name {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.transfer-stats {
		display: flex;
		justify-content: space-between;
		margin-top: 6px;
		font-size: 12px;
		color: #909399;
	}
}

.upload-tasks-popover {
	.tasks-header {
		font-weight: 600;
		margin-bottom: 8px;
	}

	.tasks-list {
		max-height: 240px;
		overflow-y: auto;
	}

	.task-item {
		padding: 6px 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.task-info {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;

		.task-name {
			flex: 1;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.task-remove {
			cursor: pointer;
			color: #f56c6c;
		}
	}

	.task-stats {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: #909399;

		.task-error {
			color: #f56c6c;
		}
	}
}

.fly-dot {
	position: fixed;
	width: 12px;
	height: 12px;
	background: #409eff;
	border-radius: 50%;
	z-index: 9999;
	pointer-events: none;
	transition: left 0.5s ease, top 0.5s ease;
}
</style>
