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

        <!-- 添加连接按钮 -->
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

        <!-- 添加连接对话框 -->
        <el-dialog
            v-model="state.showAddDialog"
            title="添加 SSH 连接"
            width="500px"
            :close-on-click-modal="false"
        >
            <el-form :model="state.addForm" label-width="100px">
                <el-form-item label="主机 ID">
                    <el-input-number v-model="state.addForm.instanceId" :min="1" placeholder="请输入主机 ID" />
                </el-form-item>
                <el-form-item label="主机名称">
                    <el-input v-model="state.addForm.instanceName" placeholder="请输入主机名称" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="state.showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="addConnection" :loading="state.connecting">连接</el-button>
            </template>
        </el-dialog>

        <!-- 空状态 -->
        <el-empty
            v-if="state.tabs.length === 0"
            description="暂无 SSH 连接，点击右上角按钮添加连接"
        />
    </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useInstanceApi } from '/@/api/instance';
import { Session } from '/@/utils/storage';

const route = useRoute();
const router = useRouter();
const instanceApi = useInstanceApi();

// 获取 API 基础 URL
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 获取 token
const getToken = () => {
    const token = Session.get('token') || '';
    return token;
};

// WebSocket 接口地址
const getWebSocketUrl = (instanceId: number) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseUrl = apiBaseUrl.replace(/^https?:/, protocol);
    const token = getToken();
    return `${wsBaseUrl}/api/instance/terminal?instanceId=${instanceId}&token=${encodeURIComponent(token)}`;
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
    resizeHandler: (() => void) | null;
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
});

// 初始化页面
onMounted(async () => {
    // 检查 URL 参数中是否有 instanceId
    const instanceId = route.params.id as string;
    if (instanceId) {
        console
        const id = parseInt(instanceId);
        // 先获取主机信息
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

// 添加终端标签
const addTerminalTab = async (instanceId: number, instanceName?: string) => {
    // 检查是否已存在
    const existingTab = state.terminalMap.get(instanceId);
    if (existingTab) {
        state.activeTab = instanceId.toString();
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
        resizeHandler: null,
    };

    state.tabs.push(tab);
    state.terminalMap.set(instanceId, tab);
    state.activeTab = instanceId.toString();

    // 等待 DOM 更新后初始化终端
    await nextTick();
    await initTerminal(tab);
};

// 添加连接
const addConnection = async () => {
    if (!state.addForm.instanceId) {
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
    tab.fitAddon.fit();

    // 建立 WebSocket 连接
    const wsUrl = getWebSocketUrl(tab.instanceId);
    tab.socket = new WebSocket(wsUrl);

    tab.socket.onopen = () => {
        tab.terminal?.writeln('\x1b[32m正在建立连接...\x1b[0m');
    };

    tab.socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);

            switch (msg.type) {
                case 'credentials':
                    // 收到凭证列表
                    tab.availableKeys = msg.payload?.keys || [];

                    if (tab.availableKeys.length === 0) {
                        tab.terminal?.writeln('\x1b[31m该主机没有可用的登录凭证\x1b[0m\r\n');
                    } else if (tab.availableKeys.length === 1) {
                        // 只有一个凭证，自动选择并连接
                        tab.selectedKeyId = tab.availableKeys[0].id;
                        sendConnectMessage(tab);
                    } else {
                        // 多个凭证，显示选择对话框（这里简化处理，选择第一个）
                        tab.terminal?.writeln('\x1b[33m选择第一个凭证连接...\x1b[0m\r\n');
                        tab.selectedKeyId = tab.availableKeys[0].id;
                        sendConnectMessage(tab);
                    }
                    break;

                case 'success':
                    // 连接成功
                    tab.terminal?.writeln('\x1b[32m' + msg.data + '\x1b[0m\r\n');
                    break;

                case 'data':
                    // 终端输出
                    tab.terminal?.write(msg.data);
                    break;

                case 'error':
                    // 错误信息
                    tab.terminal?.writeln('\x1b[31m' + msg.data + '\x1b[0m\r\n');
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
    };

    tab.socket.onclose = () => {
        tab.terminal?.writeln('\x1b[33m连接已断开\x1b[0m\r\n');
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
        }));
    }
};

// 处理窗口大小变化
const handleResize = (tab: TerminalTab) => {
    if (tab.fitAddon) {
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

        // 销毁终端（防止重复销毁）
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
    } else if (state.tabs.length === 0) {
        state.activeTab = '';
    }
};

// 标签切换
const handleTabChange = (tabName: string) => {
    // 可以在这里添加标签切换的逻辑
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

    // 关闭浏览器标签页
    window.close();
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
</script>

<style scoped lang="scss">
.terminal-page {
    position: relative;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #000;
}

.terminal-tabs {
    flex-shrink: 0;
    background-color: #1e1e1e;

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
    flex: 1;
    height: calc(100vh - 80px);
    background-color: #000;
    overflow: hidden;

    .xterm {
        height: 100%;
    }
}

:deep(.el-empty) {
    background-color: #1e1e1e;
    color: #d4d4d4;
    padding: 100px 0;
}
</style>
