<template>
    <div class="terminal-page">
        <!-- 顶部标签栏 -->
        <div class="terminal-tabs">
            <el-tabs
                v-model="state.activeTab"
                type="card"
                closable
                @tab-remove="removeTab"
                @tab-change="handleTabChange"
            >
                <el-tab-pane
                    v-for="tab in state.tabs"
                    :key="tab.instanceId"
                    :label="tab.label"
                    :name="tab.instanceId.toString()"
                >
                    <div class="terminal-container" :id="`terminal-${tab.instanceId}`"></div>
                </el-tab-pane>
            </el-tabs>
        </div>

        <!-- 操作按钮 -->
        <div class="terminal-actions">
            <el-button type="danger" size="small" @click="closePage" plain>
                <el-icon><ele-Close /></el-icon>
                关闭页面
            </el-button>
            <el-button type="primary" size="small" @click="state.showAddDialog = true">
                <el-icon><ele-Plus /></el-icon>
                添加连接
            </el-button>
        </div>

        <!-- 凭证选择对话框 -->
        <el-dialog
            v-model="activeTabState.showKeySelector"
            title="选择登录凭证"
            width="600px"
            :close-on-click-modal="false"
            class="key-selector-dialog"
        >
            <div class="key-list">
                <div
                    v-for="key in activeTabState.availableKeys"
                    :key="key.id"
                    class="key-card"
                    :class="{ active: activeTabState.selectedKeyId === key.id }"
                    @click="activeTabState.selectedKeyId = key.id"
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
                <el-button size="large" @click="activeTabState.showKeySelector = false">取消</el-button>
                <el-button type="primary" size="large" @click="connectSSH" :loading="activeTabState.connecting">
                    连接
                </el-button>
            </template>
        </el-dialog>

        <!-- 添加连接对话框 -->
        <el-dialog
            v-model="state.showAddDialog"
            title="添加 SSH 连接"
            width="500px"
            :close-on-click-modal="false"
        >
            <el-form :model="state.addForm" label-width="100px">
                <el-form-item label="选择主机">
                    <el-select
                        v-model="state.addForm.instanceId"
                        placeholder="请选择主机"
                        filterable
                        clearable
                        style="width: 100%"
                        @change="onHostSelectChange"
                    >
                        <el-option
                            v-for="host in state.hostList"
                            :key="host.id"
                            :label="`${host.name} (${host.ip})`"
                            :value="host.id"
                        />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="state.showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="addConnection" :loading="state.connecting">连接</el-button>
            </template>
        </el-dialog>

        <!-- 新建文件夹对话框 -->
        <el-dialog v-model="sftpState.showMkdirDialog" title="新建文件夹" width="400px">
            <el-input v-model="sftpState.newDirName" placeholder="请输入文件夹名称" />
            <template #footer>
                <el-button @click="sftpState.showMkdirDialog = false">取消</el-button>
                <el-button type="primary" @click="doMkdir">确定</el-button>
            </template>
        </el-dialog>

        <!-- 重命名对话框 -->
        <el-dialog v-model="sftpState.showRenameDialog" title="重命名" width="400px">
            <el-input v-model="sftpState.newFileName" placeholder="请输入新名称" />
            <template #footer>
                <el-button @click="sftpState.showRenameDialog = false">取消</el-button>
                <el-button type="primary" @click="doRename">确定</el-button>
            </template>
        </el-dialog>

        <!-- 下载确认对话框 -->
        <el-dialog v-model="downloadDialog.visible" title="文件下载" width="400px" :close-on-click-modal="false">
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
        >
            <div class="transfer-progress">
                <div class="transfer-file-info">
                    <el-icon size="18" class="file-type-icon">
                        <ele-Document />
                    </el-icon>
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
                    <el-button size="small" @click="cancelTransfer" type="danger" plain v-if="transferProgress.status === 'uploading' || transferProgress.status === 'downloading'">取消</el-button>
                    <el-button size="small" @click="confirmTransfer" type="primary" plain v-else>确定</el-button>
                </div>
            </div>
        </el-dialog>

        <!-- SFTP 抽屉（当前激活标签的 SFTP） -->
        <div v-if="state.tabs.length > 0" class="sftp-wrapper" :class="{ collapsed: !sftpState.visible }">
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
                        <span class="sftp-host">{{ activeTabState.label }}</span>
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
                        height="100%"
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
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <el-empty
            v-if="state.tabs.length === 0"
            description="暂无 SSH 连接，点击右上角按钮添加连接"
        />
    </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount, onActivated, onDeactivated, nextTick, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useInstanceApi } from '/@/api/instance';
import { useMyInstanceApi } from '/@/api/myinstance';
import { useSftpApi } from '/@/api/sftp';
import { Session } from '/@/utils/storage';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();
const instanceApi = useInstanceApi();
const myInstanceApi = useMyInstanceApi();
const sftpApi = useSftpApi();

// 获取 token
const getToken = () => {
    const token = Session.get('token') || '';
    return token;
};

// WebSocket 接口地址
const getWebSocketUrl = (instanceId: number, terminal?: Terminal | null) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = getToken();
    const cols = terminal?.cols || 100;
    const rows = terminal?.rows || 30;
    return `${protocol}//${host}/api/instance/terminal?instanceId=${instanceId}&token=${encodeURIComponent(token)}&cols=${cols}&rows=${rows}`;
};

interface TerminalTab {
    instanceId: number;
    label: string;
    terminal: Terminal | null;
    fitAddon: FitAddon | null;
    socket: WebSocket | null;
    selectedKeyId: number | null;
    availableKeys: any[];
    showKeySelector: boolean;
    connecting: boolean;
    resizeHandler: (() => void) | null;
    status: string;
    statusType: 'success' | 'warning' | 'danger' | 'info';
    // SFTP 状态
    sftpVisible: boolean;
    sftpCurrentPath: string;
    sftpFileList: any[];
    sftpBreadcrumbs: string[];
    sftpLoading: boolean;
}

const state = reactive({
    activeTab: '',
    tabs: [] as TerminalTab[],
    showAddDialog: false,
    connecting: false,
    addForm: {
        instanceId: null as number | null,
        instanceName: '',
    },
    terminalMap: new Map<number, TerminalTab>(),
    hostList: [] as any[],
});

// 当前激活标签的引用
const activeTabRef = computed(() => {
    const activeId = parseInt(state.activeTab);
    return state.terminalMap.get(activeId);
});

// 用于模板绑定的激活标签状态
const activeTabState = reactive({
    showKeySelector: false,
    selectedKeyId: null as number | null,
    availableKeys: [] as any[],
    connecting: false,
    label: '',
});

// SFTP 面板状态（始终绑定到当前激活标签）
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

let abortController: AbortController | null = null;

const cancelTransfer = () => {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    transferProgress.visible = false;
    transferProgress.status = '';
};

const confirmTransfer = () => {
    transferProgress.visible = false;
    transferProgress.status = '';
};

// 同步 activeTabState 到当前激活标签
const syncActiveTabState = () => {
    const tab = activeTabRef.value;
    if (tab) {
        activeTabState.showKeySelector = tab.showKeySelector;
        activeTabState.selectedKeyId = tab.selectedKeyId;
        activeTabState.availableKeys = tab.availableKeys;
        activeTabState.connecting = tab.connecting;
        activeTabState.label = tab.label;
        // 同步 SFTP 状态
        sftpState.visible = tab.sftpVisible;
        sftpState.currentPath = tab.sftpCurrentPath;
        sftpState.fileList = tab.sftpFileList;
        sftpState.breadcrumbs = tab.sftpBreadcrumbs;
        sftpState.loading = tab.sftpLoading;
    } else {
        activeTabState.showKeySelector = false;
        activeTabState.selectedKeyId = null;
        activeTabState.availableKeys = [];
        activeTabState.connecting = false;
        activeTabState.label = '';
    }
};

// 同步当前激活标签的变更
const syncBackToTab = () => {
    const tab = activeTabRef.value;
    if (tab) {
        tab.showKeySelector = activeTabState.showKeySelector;
        tab.selectedKeyId = activeTabState.selectedKeyId;
        tab.availableKeys = activeTabState.availableKeys;
        tab.connecting = activeTabState.connecting;
        // SFTP
        tab.sftpVisible = sftpState.visible;
        tab.sftpCurrentPath = sftpState.currentPath;
        tab.sftpFileList = sftpState.fileList;
        tab.sftpBreadcrumbs = sftpState.breadcrumbs;
        tab.sftpLoading = sftpState.loading;
    }
};

// 初始化页面
onMounted(async () => {
    await loadHostList();
    // 检查 URL 参数中是否有 instanceId
    const instanceId = route.params.id as string;
    if (instanceId) {
        const id = parseInt(instanceId);
        try {
            const res = await instanceApi.getInstanceInfo(id);
            if (res && res.code === 200) {
                await addTerminalTab(id, res.data.name);
            }
        } catch (error) {
            // 获取主机信息失败
        }
    }
});

// 页面激活时（keep-alive 缓存后切回）
onActivated(() => {
    // 延迟执行，确保 DOM 从缓存恢复后尺寸已稳定
    setTimeout(() => {
        const activeTab = activeTabRef.value;
        // 只处理当前激活的标签
        if (activeTab?.fitAddon && activeTab.terminal) {
            try {
                activeTab.fitAddon.fit();
                activeTab.terminal.refresh(0, activeTab.terminal.rows - 1);
            } catch (e) {}
        }
        if (activeTab?.socket && activeTab.socket.readyState === WebSocket.OPEN && activeTab.terminal) {
            try {
                activeTab.socket.send(JSON.stringify({
                    type: 'resize',
                    cols: activeTab.terminal.cols,
                    rows: activeTab.terminal.rows,
                }));
            } catch (e) {}
        }
    }, 150);
});

// 页面失活时（keep-alive 缓存前切走）
onDeactivated(() => {
    // keep-alive 保持连接，不需要清理
});

// 添加终端标签
const addTerminalTab = async (instanceId: number, instanceName?: string) => {
    // 检查是否已存在
    const existingTab = state.terminalMap.get(instanceId);
    if (existingTab) {
        state.activeTab = instanceId.toString();
        syncActiveTabState();
        return;
    }

    const tab: TerminalTab = {
        instanceId,
        label: instanceName || `主机 ${instanceId}`,
        terminal: null,
        fitAddon: null,
        socket: null,
        selectedKeyId: null,
        availableKeys: [],
        showKeySelector: false,
        connecting: false,
        resizeHandler: null,
        status: '正在建立连接...',
        statusType: 'info',
        sftpVisible: true,
        sftpCurrentPath: '/',
        sftpFileList: [],
        sftpBreadcrumbs: [''],
        sftpLoading: false,
    };

    state.tabs.push(tab);
    state.terminalMap.set(instanceId, tab);
    state.activeTab = instanceId.toString();
    syncActiveTabState();

    // 等待 DOM 更新后初始化终端
    await nextTick();
    await initTerminal(tab);
};

// 选择主机变化时
const onHostSelectChange = (val: number) => {
    const host = state.hostList.find((h: any) => h.id === val);
    if (host) {
        state.addForm.instanceName = host.name;
    }
};

// 加载主机列表
const loadHostList = async () => {
    try {
        const res = await myInstanceApi.getMyInstanceList({ pageNum: 1, pageSize: 9999 });
        if (res && res.code === 200) {
            state.hostList = res.data.data || [];
        }
    } catch (error) {
        // 加载失败
    }
};

// 添加连接
const addConnection = async () => {
    if (!state.addForm.instanceId) {
        ElMessage.warning('请选择主机');
        return;
    }

    state.connecting = true;
    try {
        const instanceId = state.addForm.instanceId;
        const instanceName = state.addForm.instanceName || `主机 ${instanceId}`;
        await addTerminalTab(instanceId, instanceName);
        state.showAddDialog = false;
        state.addForm.instanceId = null;
        state.addForm.instanceName = '';
    } catch (error: any) {
        // 添加连接失败
    } finally {
        state.connecting = false;
    }
};

// 连接 SSH
const connectSSH = async () => {
    const tab = activeTabRef.value;
    if (!tab || !activeTabState.selectedKeyId || !tab.socket) {
        return;
    }
    activeTabState.connecting = true;
    tab.connecting = true;
    tab.status = '正在建立连接...';
    tab.statusType = 'info';
    try {
        tab.socket.send(JSON.stringify({
            type: 'connect',
            keyId: activeTabState.selectedKeyId,
            cols: tab.terminal?.cols || 100,
            rows: tab.terminal?.rows || 30,
        }));
    } catch (error: any) {
        tab.status = `连接失败: ${error.message || '未知错误'}`;
        tab.statusType = 'danger';
        if (tab.availableKeys.length > 1) {
            activeTabState.showKeySelector = true;
            tab.showKeySelector = true;
        }
    } finally {
        activeTabState.connecting = false;
        tab.connecting = false;
    }
};

// 初始化终端
const initTerminal = async (tab: TerminalTab) => {
    const terminalElement = document.getElementById(`terminal-${tab.instanceId}`);
    if (!terminalElement) {
        throw new Error(`终端容器不存在: terminal-${tab.instanceId}`);
    }

    // 创建终端实例
    tab.terminal = new Terminal({
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

    // 添加自适应插件
    tab.fitAddon = new FitAddon();
    tab.terminal.loadAddon(tab.fitAddon);

    // 挂载终端
    tab.terminal.open(terminalElement);

    // 建立 WebSocket 连接（先使用默认尺寸）
    const wsUrl = getWebSocketUrl(tab.instanceId, tab.terminal);
    tab.socket = new WebSocket(wsUrl);

    // 延迟 fit，确保 el-tabs DOM 完全渲染且尺寸正确
    setTimeout(() => {
        if (tab.fitAddon && tab.terminal) {
            tab.fitAddon.fit();
            if (tab.socket && tab.socket.readyState === WebSocket.OPEN) {
                tab.socket.send(JSON.stringify({
                    type: 'resize',
                    cols: tab.terminal.cols,
                    rows: tab.terminal.rows,
                }));
            }
        }
    }, 150);

    tab.socket.onopen = () => {
        tab.status = '等待连接...';
        tab.statusType = 'info';
        tab.terminal?.writeln('\x1b[32m正在建立连接...\x1b[0m');
    };

    tab.socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);

            switch (msg.type) {
                case 'credentials':
                    // 收到凭证列表
                    tab.availableKeys = msg.payload?.keys || [];
                    activeTabState.availableKeys = tab.availableKeys;

                    if (tab.availableKeys.length === 0) {
                        tab.terminal?.writeln('\x1b[31m该主机没有可用的登录凭证\x1b[0m\r\n');
                        tab.status = '该主机没有可用的登录凭证';
                        tab.statusType = 'danger';
                    } else if (tab.availableKeys.length === 1) {
                        // 只有一个凭证，自动选择并连接
                        tab.selectedKeyId = tab.availableKeys[0].id;
                        activeTabState.selectedKeyId = tab.selectedKeyId;
                        sendConnectMessage(tab);
                    } else {
                        // 多个凭证，显示选择对话框
                        tab.showKeySelector = true;
                        activeTabState.showKeySelector = true;
                        tab.selectedKeyId = tab.availableKeys[0].id;
                        activeTabState.selectedKeyId = tab.selectedKeyId;
                        tab.status = '请选择登录凭证';
                        tab.statusType = 'info';
                    }
                    break;

                case 'success':
                    // 连接成功
                    tab.status = '已连接';
                    tab.statusType = 'success';
                    tab.showKeySelector = false;
                    activeTabState.showKeySelector = false;
                    tab.terminal?.writeln('\x1b[32m' + msg.data + '\x1b[0m\r\n');
                    // 发送终端尺寸给后端
                    if (tab.socket && tab.terminal) {
                        tab.socket.send(JSON.stringify({
                            type: 'resize',
                            cols: tab.terminal.cols,
                            rows: tab.terminal.rows,
                        }));
                    }
                    // SSH 连接成功后，自动加载 SFTP home 目录
                    if (tab.selectedKeyId) {
                        loadSftpFileList(tab, '');
                    }
                    break;

                case 'data':
                    // 终端输出
                    tab.terminal?.write(msg.data);
                    break;

                case 'blocked':
                    tab.terminal?.write(msg.data);
                    break;

                case 'terminated':
                    tab.status = '会话已终止';
                    tab.statusType = 'danger';
                    tab.terminal?.writeln('\x1b[31m' + msg.data + '\x1b[0m');
                    break;

                case 'error':
                    tab.status = '错误';
                    tab.statusType = 'danger';
                    tab.terminal?.writeln('\x1b[31m' + msg.data + '\x1b[0m\r\n');
                    if (tab.availableKeys.length > 1) {
                        tab.showKeySelector = true;
                        activeTabState.showKeySelector = true;
                    }
                    break;

                default:
                    // 其他消息类型，直接写入终端
                    if (msg.data) {
                        tab.terminal?.write(msg.data);
                    }
            }
        } catch (e) {
            // 如果解析失败，可能是直接的终端输出
            tab.terminal?.write(event.data);
        }
    };

    tab.socket.onerror = (error) => {
        tab.terminal?.writeln('\x1b[31m连接发生错误\x1b[0m\r\n');
        tab.status = '连接错误';
        tab.statusType = 'danger';
    };

    tab.socket.onclose = () => {
        tab.terminal?.writeln('\x1b[33m连接已断开\x1b[0m\r\n');
        tab.status = '连接已断开';
        tab.statusType = 'warning';
    };

    // 监听终端输入
    tab.terminal.onData((data) => {
        if (tab.socket && tab.socket.readyState === WebSocket.OPEN) {
            tab.socket.send(JSON.stringify({
                type: 'data',
                data: data,
            }));
        }
    });

    // 监听窗口大小变化
    tab.resizeHandler = () => handleResize(tab);
    window.addEventListener('resize', tab.resizeHandler);
};

// 发送连接消息
const sendConnectMessage = (tab: TerminalTab) => {
    if (tab.socket && tab.selectedKeyId) {
        tab.socket.send(JSON.stringify({
            type: 'connect',
            keyId: tab.selectedKeyId,
            cols: tab.terminal?.cols || 100,
            rows: tab.terminal?.rows || 30,
        }));
    }
};

// 处理窗口大小变化
const handleResize = (tab: TerminalTab) => {
    // 只处理当前激活的标签，非激活标签的 DOM 可能被隐藏（display: none）
    if (state.activeTab !== tab.instanceId.toString()) return;
    if (tab.fitAddon && tab.terminal) {
        tab.fitAddon.fit();
    }
    if (tab.socket && tab.socket.readyState === WebSocket.OPEN && tab.terminal) {
        tab.socket.send(JSON.stringify({
            type: 'resize',
            cols: tab.terminal.cols,
            rows: tab.terminal.rows,
        }));
    }
};

// 移除标签
const removeTab = (targetName: string) => {
    const targetInstanceId = parseInt(targetName);
    const tabs = state.tabs;
    const targetTab = state.terminalMap.get(targetInstanceId);

    if (targetTab) {
        // 关闭 WebSocket 连接
        if (targetTab.socket) {
            try {
                targetTab.socket.send(JSON.stringify({ type: 'close' }));
            } catch (error) {
                // 连接可能已关闭
            }
            try {
                targetTab.socket.close();
            } catch (error) {
                // 关闭 WebSocket 失败
            }
        }

        // 销毁终端
        if (targetTab.terminal) {
            try {
                targetTab.terminal.dispose();
            } catch (error) {
                // 已经销毁过
            }
        }

        // 移除窗口大小监听
        if (targetTab.resizeHandler) {
            window.removeEventListener('resize', targetTab.resizeHandler);
        }
    }

    // 从 Map 中移除
    state.terminalMap.delete(targetInstanceId);

    // 从数组中移除
    state.tabs = tabs.filter(tab => tab.instanceId !== targetInstanceId);

    // 如果删除的是当前激活的标签，切换到最后一个标签
    if (state.activeTab === targetName && state.tabs.length > 0) {
        state.activeTab = state.tabs[state.tabs.length - 1].instanceId.toString();
        syncActiveTabState();
    } else if (state.tabs.length === 0) {
        state.activeTab = '';
        syncActiveTabState();
    }
};

// 标签切换
const handleTabChange = (tabName: string) => {
    syncBackToTab(); // 先保存之前标签的状态
    state.activeTab = tabName;
    syncActiveTabState(); // 加载新标签的状态
    // 切换后触发当前标签终端自适应并发送尺寸给后端
    nextTick(() => {
        setTimeout(() => {
            const tab = activeTabRef.value;
            if (tab?.fitAddon && tab.terminal) {
                tab.fitAddon.fit();
            }
            if (tab?.socket && tab.socket.readyState === WebSocket.OPEN && tab.terminal) {
                tab.socket.send(JSON.stringify({
                    type: 'resize',
                    cols: tab.terminal.cols,
                    rows: tab.terminal.rows,
                }));
            }
        }, 50);
    });
};

// 关闭整个页面
const closePage = () => {
    // 关闭所有连接
    state.terminalMap.forEach((tab) => {
        if (tab.socket) {
            try {
                tab.socket.send(JSON.stringify({ type: 'close' }));
            } catch (error) {
                // 连接可能已关闭
            }
            try {
                tab.socket.close();
            } catch (error) {
                // 关闭 WebSocket 失败
            }
        }
        if (tab.terminal) {
            try {
                tab.terminal.dispose();
            } catch (error) {
                // 已经销毁过
            }
        }
        if (tab.resizeHandler) {
            window.removeEventListener('resize', tab.resizeHandler);
        }
    });
    state.terminalMap.clear();
    state.tabs = [];

    // 返回首页
    router.push('/home');
};

// 组件卸载时清理
onBeforeUnmount(() => {
    // 关闭所有连接
    state.terminalMap.forEach((tab) => {
        if (tab.socket) {
            try {
                tab.socket.send(JSON.stringify({ type: 'close' }));
            } catch (error) {
                // 连接可能已关闭
            }
            try {
                tab.socket.close();
            } catch (error) {
                // 关闭 WebSocket 失败
            }
        }
        if (tab.terminal) {
            try {
                tab.terminal.dispose();
            } catch (error) {
                // 已经销毁过
            }
        }
        if (tab.resizeHandler) {
            window.removeEventListener('resize', tab.resizeHandler);
        }
    });
    state.terminalMap.clear();
    state.tabs = [];
});

// ========== SFTP 相关方法 ==========

const toggleSftp = () => {
    sftpState.visible = !sftpState.visible;
    syncBackToTab();
    // 切换后触发终端自适应
    setTimeout(() => {
        const tab = activeTabRef.value;
        if (tab?.fitAddon) {
            tab.fitAddon.fit();
        }
        if (tab?.socket && tab.socket.readyState === WebSocket.OPEN && tab.terminal) {
            tab.socket.send(JSON.stringify({
                type: 'resize',
                cols: tab.terminal.cols,
                rows: tab.terminal.rows,
            }));
        }
    }, 350);
};

const loadSftpFileList = async (tab: TerminalTab | null, path: string) => {
    if (!tab || !tab.selectedKeyId) return;
    sftpState.loading = true;
    tab.sftpLoading = true;
    try {
        const res = await sftpApi.listFiles({
            instanceId: tab.instanceId,
            keyId: tab.selectedKeyId,
            path: path,
        });
        sftpState.currentPath = res.data?.path || path;
        tab.sftpCurrentPath = sftpState.currentPath;
        sftpState.fileList = res.data?.files || [];
        tab.sftpFileList = sftpState.fileList;
        sftpState.fileList.sort((a: any, b: any) => {
            if (a.isDir === b.isDir) {
                return a.name.localeCompare(b.name);
            }
            return a.isDir ? -1 : 1;
        });
        updateBreadcrumbs(sftpState.currentPath);
        tab.sftpBreadcrumbs = sftpState.breadcrumbs;
    } catch (error: any) {
        ElMessage.error(error.message || '加载文件列表失败');
    } finally {
        sftpState.loading = false;
        tab.sftpLoading = false;
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
    const tab = activeTabRef.value;
    if (!tab) return;
    if (index === 0) {
        loadSftpFileList(tab, '/');
    } else {
        const path = '/' + sftpState.breadcrumbs.slice(1, index + 1).join('/');
        loadSftpFileList(tab, path);
    }
};

const goBack = () => {
    if (sftpState.currentPath === '/') return;
    const tab = activeTabRef.value;
    if (!tab) return;
    const parentPath = sftpState.currentPath.substring(0, sftpState.currentPath.lastIndexOf('/'));
    loadSftpFileList(tab, parentPath || '/');
};

const refreshSftp = () => {
    const tab = activeTabRef.value;
    if (!tab) return;
    loadSftpFileList(tab, sftpState.currentPath);
};

const enterDirectory = (row: any) => {
    const tab = activeTabRef.value;
    if (!tab) return;
    const newPath = sftpState.currentPath === '/' ? `/${row.name}` : `${sftpState.currentPath}/${row.name}`;
    loadSftpFileList(tab, newPath);
};

const formatSize = (size: number) => {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
    if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(2) + ' MB';
    return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
};

const downloadFile = async (row: any) => {
    const tab = activeTabRef.value;
    if (!tab || !tab.selectedKeyId) return;

    let writableStream: any = null;
    let useFilePicker = false;

    // 优先使用文件系统访问 API 弹出另存为窗口
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

    // 初始化进度状态
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
            // 流式写入本地文件
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
                    instanceId: tab.instanceId,
                    keyId: tab.selectedKeyId,
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
            // 浏览器不支持 showSaveFilePicker，使用 blob 收集后自动下载
            const chunks: Uint8Array[] = [];
            const blobWritable = {
                write: async (chunk: Uint8Array) => {
                    chunks.push(chunk);
                },
                close: async () => {
                    return new Blob(chunks);
                },
            };
            const blob = await sftpApi.downloadStream(
                {
                    instanceId: tab.instanceId,
                    keyId: tab.selectedKeyId,
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
            const url = window.URL.createObjectURL(blob);
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
        // 如果使用了文件系统访问 API 且出错了，尝试中止写入
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
    const tab = activeTabRef.value;
    if (!tab || !tab.selectedKeyId) return;
    try {
        await ElMessageBox.confirm(
            `确定要删除 ${row.isDir ? '文件夹' : '文件'} "${row.name}" 吗？`,
            '确认删除',
            { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
        );
    } catch { return; }
    sftpState.loading = true;
    tab.sftpLoading = true;
    try {
        const remotePath = sftpState.currentPath === '/' ? `/${row.name}` : `${sftpState.currentPath}/${row.name}`;
        await sftpApi.removeFile({
            instanceId: tab.instanceId,
            keyId: tab.selectedKeyId,
            remotePath: remotePath,
            isDir: row.isDir,
        });
        ElMessage.success('删除成功');
        await refreshSftp();
    } catch (error: any) {
        ElMessage.error(error.message || '删除失败');
    } finally {
        sftpState.loading = false;
        tab.sftpLoading = false;
    }
};

const showMkdirDialog = () => {
    sftpState.newDirName = '';
    sftpState.showMkdirDialog = true;
};

const doMkdir = async () => {
    const tab = activeTabRef.value;
    if (!tab || !tab.selectedKeyId || !sftpState.newDirName.trim()) {
        ElMessage.warning('请输入文件夹名称');
        return;
    }
    sftpState.loading = true;
    tab.sftpLoading = true;
    try {
        const remotePath = sftpState.currentPath === '/' ? `/${sftpState.newDirName}` : `${sftpState.currentPath}/${sftpState.newDirName}`;
        await sftpApi.mkdir({
            instanceId: tab.instanceId,
            keyId: tab.selectedKeyId,
            remotePath: remotePath,
        });
        ElMessage.success('创建成功');
        sftpState.showMkdirDialog = false;
        await refreshSftp();
    } catch (error: any) {
        ElMessage.error(error.message || '创建失败');
    } finally {
        sftpState.loading = false;
        tab.sftpLoading = false;
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
    const tab = activeTabRef.value;
    if (!tab || !tab.selectedKeyId || !sftpState.newFileName.trim() || !sftpState.renameTarget) {
        ElMessage.warning('请输入新名称');
        return;
    }
    sftpState.loading = true;
    tab.sftpLoading = true;
    try {
        const oldPath = sftpState.currentPath === '/' ? `/${sftpState.renameTarget.name}` : `${sftpState.currentPath}/${sftpState.renameTarget.name}`;
        const newPath = sftpState.currentPath === '/' ? `/${sftpState.newFileName}` : `${sftpState.currentPath}/${sftpState.newFileName}`;
        await sftpApi.renameFile({
            instanceId: tab.instanceId,
            keyId: tab.selectedKeyId,
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
        tab.sftpLoading = false;
    }
};

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

const handleUploadChange = async (uploadFile: any) => {
    const tab = activeTabRef.value;
    if (!tab || !tab.selectedKeyId) return;
    const file = uploadFile.raw;
    if (!file) return;

    // 小文件直接走原逻辑
    if (file.size <= CHUNK_SIZE) {
        await uploadSingleFile(file, tab.instanceId, tab.selectedKeyId);
        return;
    }

    // 大文件切片上传
    await uploadChunkedFile(file, tab.instanceId, tab.selectedKeyId);
};

const uploadSingleFile = async (file: File, instanceId: number, keyId: number) => {
    transferProgress.visible = true;
    transferProgress.type = 'upload';
    transferProgress.fileName = file.name;
    transferProgress.fileSize = file.size || 0;
    transferProgress.transferred = 0;
    transferProgress.percentage = 0;
    transferProgress.status = 'uploading';

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
                transferProgress.transferred = loaded;
                transferProgress.percentage = total > 0 ? Math.round((loaded * 100) / total) : 0;
            },
            abortController.signal
        );
        transferProgress.status = '';
        ElMessage.success('上传成功');
        await refreshSftp();
    } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'canceled') {
            ElMessage.info('上传已取消');
            transferProgress.visible = false;
            transferProgress.status = '';
        } else {
            transferProgress.status = 'exception';
            ElMessage.error(error.message || '上传失败');
        }
    } finally {
        abortController = null;
    }
};

const uploadChunkedFile = async (file: File, instanceId: number, keyId: number) => {
    const chunkTotal = Math.ceil(file.size / CHUNK_SIZE);

    // 查询已上传进度
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

    // 初始化进度
    transferProgress.visible = true;
    transferProgress.type = 'upload';
    transferProgress.fileName = file.name;
    transferProgress.fileSize = file.size || 0;
    transferProgress.transferred = uploadedSize;
    transferProgress.percentage = file.size > 0 ? Math.round((uploadedSize * 100) / file.size) : 0;
    transferProgress.status = 'uploading';

    abortController = new AbortController();

    try {
        for (let i = startChunk; i < chunkTotal; i++) {
            if (abortController.signal.aborted) {
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

            // 每片重试 3 次
            let lastError: any = null;
            let success = false;
            for (let retry = 0; retry < 3; retry++) {
                if (abortController.signal.aborted) {
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

            transferProgress.transferred = end;
            transferProgress.percentage = file.size > 0 ? Math.round((end * 100) / file.size) : 0;
        }

        transferProgress.status = '';
        ElMessage.success('上传成功');
        await refreshSftp();
    } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'canceled') {
            ElMessage.info('上传已取消');
            transferProgress.visible = false;
            transferProgress.status = '';
        } else {
            transferProgress.status = 'exception';
            ElMessage.error(error.message || '上传失败');
        }
    } finally {
        abortController = null;
    }
};
</script>

<style scoped lang="scss">
.terminal-page {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    background-color: #000;
    overflow: hidden;
}

.terminal-tabs {
    flex: 1;
    min-height: 0;
    background-color: #1e1e1e;
    display: flex;
    flex-direction: column;
    margin-right: 0;
    transition: margin-right 0.3s ease;

    :deep(.el-tabs) {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    :deep(.el-tabs__content) {
        flex: 1;
        overflow: hidden;
    }

    :deep(.el-tab-pane) {
        height: 100%;
    }

    :deep(.el-tabs__header) {
        margin: 0;
        background-color: #2d2d2d;
    }

    :deep(.el-tabs__nav) {
        border: none;
    }

    :deep(.el-tabs__item) {
        background-color: #1e1e1e;
        color: #d4d4d4;
        border: 1px solid #3e3e3e;
        border-bottom: none;
        margin-right: 4px;

        &.is-active {
            background-color: #000;
            border-bottom: 1px solid #000;
        }

        &:hover {
            background-color: #2d2d2d;
        }
    }

    :deep(.el-icon-close) {
        color: #d4d4d4;

        &:hover {
            color: #409eff;
        }
    }
}

.terminal-actions {
    position: absolute;
    top: 10px;
    right: 20px;
    z-index: 1000;
    display: flex;
    gap: 10px;
}

.terminal-container {
    width: 100%;
    height: 100%;
    background-color: #000;
    overflow: hidden;

    :deep(.xterm) {
        height: 100%;
    }
}

:deep(.el-empty) {
    background-color: #1e1e1e;
    color: #d4d4d4;
    padding: 100px 0;
}

// ===== SFTP 抽屉面板 =====
.sftp-wrapper {
    position: absolute;
    right: 0;
    top: 40px;
    bottom: 0;
    display: flex;
    flex-shrink: 0;
    transition: width 0.3s ease, min-width 0.3s ease;
    z-index: 500;

    &:not(.collapsed) {
        width: 320px;
        min-width: 320px;
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

    .sftp-host {
        font-size: 12px;
        color: #909399;
        max-width: 120px;
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

// ===== 文件传输进度样式 =====
.transfer-progress {
    padding: 10px 0;

    .transfer-file-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;

        .file-type-icon {
            color: #409eff;
            flex-shrink: 0;
        }

        .file-name {
            font-size: 14px;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .transfer-stats {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 12px;
        color: #606266;
    }

    .transfer-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
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
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
    }

    .detail-label {
        color: #909399;
    }

    .detail-value {
        color: #606266;
        font-weight: 500;
    }
}
</style>
