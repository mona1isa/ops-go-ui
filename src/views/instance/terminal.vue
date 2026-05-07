<template>
    <el-dialog
        v-model="state.dialogVisible"
        title="SSH 终端"
        width="90%"
        fullscreen
        @close="handleClose"
        :close-on-click-modal="false"
    >
        <div class="ssh-container" v-loading="state.loading">
            <!-- 凭证选择对话框 -->
            <el-dialog
                v-model="state.showKeySelector"
                title="选择登录凭证"
                width="600px"
                :close-on-click-modal="false"
                class="key-selector-dialog"
                append-to-body
            >
                <div class="key-list">
                    <div
                        v-for="key in state.availableKeys"
                        :key="key.id"
                        class="key-card"
                        :class="{ active: state.selectedKeyId === key.id }"
                        @click="state.selectedKeyId = key.id"
                    >
                        <div class="key-header">
                            <div class="key-icon">
                                <el-icon size="24">
                                    <component :is="key.type === 1 ? 'ele-Lock' : 'ele-Unlock'" />
                                </el-icon>
                            </div>
                            <div class="key-title">{{ key.name }}</div>
                        </div>
                        <div class="key-details">
                            <div class="detail-item">
                                <span class="detail-label">用户名</span>
                                <span class="detail-value">{{ key.user || '-' }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">协议</span>
                                <span class="detail-value">{{ key.protocol || 'SSH' }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">认证方式</span>
                                <el-tag :type="key.type === 1 ? 'warning' : 'success'" size="small">
                                    {{ key.type === 1 ? '密码' : '密钥' }}
                                </el-tag>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">端口</span>
                                <span class="detail-value">{{ key.port || 22 }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <el-button size="large" @click="state.showKeySelector = false">取消</el-button>
                    <el-button type="primary" size="large" @click="connectSSH" :loading="state.connecting">
                        连接
                    </el-button>
                </template>
            </el-dialog>

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

            <!-- 主体布局：终端 + SFTP -->
            <div class="main-layout">
                <!-- 左侧：SSH 终端 -->
                <div class="terminal-wrapper" :class="{ expanded: !sftpState.visible }">
                    <div id="terminal" class="terminal"></div>
                    <div class="status-bar" v-if="state.status">
                        <el-tag :type="state.statusType">{{ state.status }}</el-tag>
                    </div>
                </div>

                <!-- 右侧：SFTP 抽屉 -->
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
                            <!-- SFTP 标题栏 -->
                            <div class="sftp-header">
                                <span class="sftp-title">SFTP 文件管理</span>
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
                            <el-table
                                :data="sftpState.fileList"
                                size="small"
                                class="sftp-table"
                                height="calc(90vh - 280px)"
                                v-loading="sftpState.loading"
                            >
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
                                <el-table-column label="操作" width="90" fixed="right">
                                    <template #default="scope">
                                        <el-icon
                                            v-if="!scope.row.isDir"
                                            size="16"
                                            class="action-icon"
                                            @click="downloadFile(scope.row)"
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, onBeforeUnmount, nextTick, ref } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Session } from '/@/utils/storage';
import { useSftpApi } from '/@/api/sftp';
import { ElMessage, ElMessageBox } from 'element-plus';

const emit = defineEmits(['close']);
const sftpApi = useSftpApi();

// 获取 token
const getToken = () => {
    return Session.get('token') || '';
};

// WebSocket 接口地址
const getWebSocketUrl = (instanceId: number, terminal?: Terminal | null) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = getToken();
    const host = window.location.host;
    const cols = terminal?.cols || 100;
    const rows = terminal?.rows || 30;
    return `${protocol}//${host}/api/instance/terminal?instanceId=${instanceId}&token=${encodeURIComponent(token)}&cols=${cols}&rows=${rows}`;
};

// SSH 终端状态
const state = reactive({
    dialogVisible: false,
    loading: false,
    showKeySelector: false,
    connecting: false,
    availableKeys: [] as any[],
    selectedKeyId: null as number | null,
    instanceId: null as number | null,
    status: '',
    statusType: 'info' as 'success' | 'warning' | 'danger' | 'info',
    terminal: null as Terminal | null,
    fitAddon: null as FitAddon | null,
    socket: null as WebSocket | null,
});

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

// 打开对话框
const openDialog = async (instanceId: number) => {
    state.instanceId = instanceId;
    state.dialogVisible = true;
    state.loading = true;
    state.status = '正在建立连接...';
    // 重置 SFTP 状态
    sftpState.visible = true;
    sftpState.currentPath = '/';
    sftpState.fileList = [];
    sftpState.breadcrumbs = [''];

    try {
        await nextTick();
        await initTerminal(instanceId);
    } catch (error: any) {
        state.status = `连接失败: ${error.message || '未知错误'}`;
        state.statusType = 'danger';
        state.loading = false;
    }
};

// 连接 SSH
const connectSSH = async () => {
    if (!state.selectedKeyId || !state.socket) {
        return;
    }
    state.connecting = true;
    state.status = '正在建立连接...';
    state.statusType = 'info';
    try {
        state.socket.send(JSON.stringify({
            type: 'connect',
            keyId: state.selectedKeyId,
            cols: state.terminal?.cols || 100,
            rows: state.terminal?.rows || 30,
        }));
    } catch (error: any) {
        state.status = `连接失败: ${error.message || '未知错误'}`;
        state.statusType = 'danger';
        if (state.availableKeys.length > 1) {
            state.showKeySelector = true;
        }
    } finally {
        state.connecting = false;
    }
};

// 初始化终端
const initTerminal = async (instanceId: number) => {
    await nextTick();
    const terminalElement = document.getElementById('terminal');
    if (!terminalElement) {
        throw new Error('终端容器不存在');
    }
    terminalElement.innerHTML = '';
    state.terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#ffffff',
        },
        rows: 30,
        cols: 100,
    });
    state.fitAddon = new FitAddon();
    state.terminal.loadAddon(state.fitAddon);
    state.terminal.open(terminalElement);
    state.fitAddon.fit();

    const wsUrl = getWebSocketUrl(instanceId, state.terminal);
    state.socket = new WebSocket(wsUrl);
    state.socket.onopen = () => {
        state.status = '等待连接...';
        state.statusType = 'info';
    };
    state.socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case 'credentials':
                    state.availableKeys = msg.payload?.keys || [];
                    state.loading = false;
                    if (state.availableKeys.length === 0) {
                        state.status = '该主机没有可用的登录凭证';
                        state.statusType = 'danger';
                    } else if (state.availableKeys.length === 1) {
                        state.selectedKeyId = state.availableKeys[0].id;
                        connectSSH();
                    } else {
                        state.showKeySelector = true;
                        state.selectedKeyId = state.availableKeys[0].id;
                        state.status = '请选择登录凭证';
                        state.statusType = 'info';
                    }
                    break;
                case 'success':
                    state.status = '已连接';
                    state.statusType = 'success';
                    state.showKeySelector = false;
                    state.loading = false;
                    state.terminal?.writeln('\x1b[32m' + msg.data + '\x1b[0m\r\n');
                    // SSH 连接成功后，发送终端尺寸给后端
                    if (state.socket && state.terminal) {
                        state.socket.send(JSON.stringify({
                            type: 'resize',
                            cols: state.terminal.cols,
                            rows: state.terminal.rows,
                        }));
                    }
                    // SSH 连接成功后，自动加载 SFTP home 目录
                    if (state.instanceId && state.selectedKeyId) {
                        loadSftpFileList('');
                    }
                    break;
                case 'data':
                    state.terminal?.write(msg.data);
                    break;
                case 'blocked':
                    state.terminal?.write(msg.data);
                    break;
                case 'terminated':
                    state.status = '会话已终止';
                    state.statusType = 'danger';
                    state.terminal?.writeln('\x1b[31m' + msg.data + '\x1b[0m');
                    setTimeout(() => { handleClose(); }, 2000);
                    break;
                case 'error':
                    state.status = '错误';
                    state.statusType = 'danger';
                    state.terminal?.writeln('\x1b[31m' + msg.data + '\x1b[0m\r\n');
                    if (state.availableKeys.length > 1) {
                        state.showKeySelector = true;
                    }
                    break;
                default:
                    if (msg.data) {
                        state.terminal?.write(msg.data);
                    }
            }
        } catch (e) {
            state.terminal?.write(event.data);
        }
    };
    state.socket.onerror = () => {
        state.status = '连接错误';
        state.statusType = 'danger';
        state.terminal?.writeln('\x1b[31m连接发生错误\x1b[0m\r\n');
        state.loading = false;
    };
    state.socket.onclose = () => {
        state.status = '连接已断开';
        state.statusType = 'warning';
        state.terminal?.writeln('\x1b[33m连接已断开\x1b[0m\r\n');
        state.loading = false;
    };
    state.terminal.onData((data) => {
        if (state.socket && state.socket.readyState === WebSocket.OPEN) {
            state.socket.send(JSON.stringify({ type: 'data', data: data }));
        }
    });
    window.addEventListener('resize', handleResize);
};

// 处理窗口大小变化
const handleResize = () => {
    if (state.fitAddon) {
        state.fitAddon.fit();
    }
    if (state.socket && state.socket.readyState === WebSocket.OPEN && state.terminal) {
        state.socket.send(JSON.stringify({
            type: 'resize',
            cols: state.terminal.cols,
            rows: state.terminal.rows,
        }));
    }
};

// 关闭对话框
const handleClose = () => {
    // 关闭 SSH WebSocket 连接
    if (state.socket) {
        try { state.socket.send(JSON.stringify({ type: 'close' })); } catch (e) {}
        state.socket.close();
        state.socket = null;
    }
    // 销毁终端
    if (state.terminal) {
        try { state.terminal.dispose(); } catch (e) {}
        state.terminal = null;
    }
    state.fitAddon = null;
    window.removeEventListener('resize', handleResize);
    // 重置 SSH 状态
    state.instanceId = null;
    state.availableKeys = [];
    state.selectedKeyId = null;
    state.status = '';
    state.dialogVisible = false;
    state.showKeySelector = false;
    // 重置 SFTP 状态
    sftpState.visible = true;
    sftpState.loading = false;
    sftpState.currentPath = '';
    sftpState.fileList = [];
    sftpState.breadcrumbs = [''];
    sftpState.showMkdirDialog = false;
    sftpState.showRenameDialog = false;
    sftpState.renameTarget = null;
    emit('close');
};

onBeforeUnmount(() => {
    handleClose();
});

// ========== SFTP 相关方法 ==========

const toggleSftp = () => {
    sftpState.visible = !sftpState.visible;
    // 切换后触发终端自适应
    setTimeout(() => {
        if (state.fitAddon) {
            state.fitAddon.fit();
        }
        if (state.socket && state.socket.readyState === WebSocket.OPEN && state.terminal) {
            state.socket.send(JSON.stringify({
                type: 'resize',
                cols: state.terminal.cols,
                rows: state.terminal.rows,
            }));
        }
    }, 350);
};

const loadSftpFileList = async (path: string) => {
    if (!state.selectedKeyId || !state.instanceId) return;
    sftpState.loading = true;
    try {
        const res = await sftpApi.listFiles({
            instanceId: state.instanceId,
            keyId: state.selectedKeyId,
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

const downloadFile = async (row: any) => {
    if (!state.selectedKeyId || !state.instanceId) return;
    sftpState.loading = true;
    try {
        const remotePath = sftpState.currentPath === '/' ? `/${row.name}` : `${sftpState.currentPath}/${row.name}`;
        const res = await sftpApi.downloadFile({
            instanceId: state.instanceId,
            keyId: state.selectedKeyId,
            remotePath: remotePath,
        });
        const blob = new Blob([res as any]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = row.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        ElMessage.success('下载成功');
    } catch (error: any) {
        ElMessage.error(error.message || '下载失败');
    } finally {
        sftpState.loading = false;
    }
};

const removeFile = async (row: any) => {
    if (!state.selectedKeyId || !state.instanceId) return;
    try {
        await ElMessageBox.confirm(
            `确定要删除 ${row.isDir ? '文件夹' : '文件'} "${row.name}" 吗？`,
            '确认删除',
            { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
        );
    } catch { return; }
    sftpState.loading = true;
    try {
        const remotePath = sftpState.currentPath === '/' ? `/${row.name}` : `${sftpState.currentPath}/${row.name}`;
        await sftpApi.removeFile({
            instanceId: state.instanceId,
            keyId: state.selectedKeyId,
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
    if (!state.selectedKeyId || !state.instanceId || !sftpState.newDirName.trim()) {
        ElMessage.warning('请输入文件夹名称');
        return;
    }
    sftpState.loading = true;
    try {
        const remotePath = sftpState.currentPath === '/' ? `/${sftpState.newDirName}` : `${sftpState.currentPath}/${sftpState.newDirName}`;
        await sftpApi.mkdir({
            instanceId: state.instanceId,
            keyId: state.selectedKeyId,
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

const showRenameDialog = (row: any) => {
    sftpState.renameTarget = row;
    sftpState.newFileName = row.name;
    sftpState.showRenameDialog = true;
};

const doRename = async () => {
    if (!state.selectedKeyId || !state.instanceId || !sftpState.newFileName.trim() || !sftpState.renameTarget) {
        ElMessage.warning('请输入新名称');
        return;
    }
    sftpState.loading = true;
    try {
        const oldPath = sftpState.currentPath === '/' ? `/${sftpState.renameTarget.name}` : `${sftpState.currentPath}/${sftpState.renameTarget.name}`;
        const newPath = sftpState.currentPath === '/' ? `/${sftpState.newFileName}` : `${sftpState.currentPath}/${sftpState.newFileName}`;
        await sftpApi.renameFile({
            instanceId: state.instanceId,
            keyId: state.selectedKeyId,
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

const handleUploadChange = async (uploadFile: any) => {
    if (!state.selectedKeyId || !state.instanceId) return;
    const file = uploadFile.raw;
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('instanceId', String(state.instanceId));
    formData.append('keyId', String(state.selectedKeyId));
    formData.append('remotePath', sftpState.currentPath);
    sftpState.loading = true;
    try {
        await sftpApi.uploadFile(formData);
        ElMessage.success('上传成功');
        await refreshSftp();
    } catch (error: any) {
        ElMessage.error(error.message || '上传失败');
    } finally {
        sftpState.loading = false;
    }
};

// 暴露方法
defineExpose({
    openDialog,
});
</script>

<style scoped lang="scss">
.ssh-container {
    position: relative;
    height: calc(90vh - 120px);
    background-color: #1e1e1e;
    border-radius: 4px;
    overflow: hidden;
}

.main-layout {
    display: flex;
    height: 100%;
    overflow: hidden;
}

.terminal-wrapper {
    flex: 1;
    position: relative;
    min-width: 0;
    transition: flex 0.3s ease;
}

.terminal {
    width: 100%;
    height: 100%;
}

.status-bar {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 100;
}

// ===== SFTP 抽屉面板 =====
.sftp-wrapper {
    position: relative;
    display: flex;
    flex-shrink: 0;
    transition: width 0.3s ease, min-width 0.3s ease;

    &:not(.collapsed) {
        width: 25%;
        min-width: 300px;
        max-width: 400px;
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

    :deep(.el-table__body-wrapper) {
        overflow-y: auto;
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
    border-top: 1px solid #ebeef5;
    font-size: 12px;
    color: #909399;

    .sftp-path {
        max-width: 60%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

// ===== 凭证选择对话框样式 =====
:deep(.key-selector-dialog) {
    .el-dialog__body {
        padding: 20px;
    }
}

.key-list {
    max-height: 400px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.key-card {
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #ffffff;
    position: relative;

    &:hover {
        border-color: #409eff;
        background: #f0f9ff;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
        transform: translateY(-2px);
    }

    &.active {
        border-color: #409eff;
        background: #ecf5ff;
        box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
    }

    .key-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        gap: 12px;
    }

    .key-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;
        background: #f5f7fa;

        .el-icon {
            font-size: 20px;
            color: #909399;
        }
    }

    &.active .key-icon {
        background: #e6f7ff;

        .el-icon {
            color: #409eff;
        }
    }

    .key-title {
        flex: 1;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
    }

    .key-details {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: #f5f7fa;
        border-radius: 4px;
        transition: background 0.3s ease;

        &:hover {
            background: #e6e9ef;
        }

        .detail-label {
            font-size: 12px;
            color: #909399;
            white-space: nowrap;
            min-width: 50px;
        }

        .detail-value {
            font-size: 13px;
            color: #303133;
            font-weight: 500;
            flex: 1;
        }
    }
}

:deep(.key-list)::-webkit-scrollbar {
    width: 6px;
}

:deep(.key-list)::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

:deep(.key-list)::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;

    &:hover {
        background: #909399;
    }
}
</style>
