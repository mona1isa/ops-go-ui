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
                            <div class="key-radio">
                                <el-radio :model-value="state.selectedKeyId" :value="key.id" />
                            </div>
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

            <!-- 终端容器 -->
            <div id="terminal" class="terminal"></div>

            <!-- 连接状态提示 -->
            <div class="status-bar" v-if="state.status">
                <el-tag :type="state.statusType">{{ state.status }}</el-tag>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, onBeforeUnmount, nextTick } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Session } from '/@/utils/storage';

const emit = defineEmits(['close']);

// 获取 API 基础 URL
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 获取 token
const getToken = () => {
    return Session.get('token') || '';
};

// WebSocket 接口地址
const getWebSocketUrl = (instanceId: number) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseUrl = apiBaseUrl.replace(/^https?:/, protocol);
    const token = getToken();
    return `${wsBaseUrl}/api/instance/terminal?instanceId=${instanceId}&token=${encodeURIComponent(token)}`;
};

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

// 打开对话框
const openDialog = async (instanceId: number) => {
    state.instanceId = instanceId;
    state.dialogVisible = true;
    state.loading = true;
    state.status = '正在建立连接...';

    try {
        await nextTick();
        // 直接建立 WebSocket 连接
        const wsUrl = getWebSocketUrl(instanceId);
        await initTerminal(wsUrl);
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
        // 发送选择凭证的消息
        state.socket.send(JSON.stringify({
            type: 'connect',
            keyId: state.selectedKeyId,
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
const initTerminal = async (wsUrl: string) => {
    await nextTick();

    const terminalElement = document.getElementById('terminal');
    if (!terminalElement) {
        throw new Error('终端容器不存在');
    }

    // 清空容器
    terminalElement.innerHTML = '';

    // 创建终端实例
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

    // 添加自适应插件
    state.fitAddon = new FitAddon();
    state.terminal.loadAddon(state.fitAddon);

    // 挂载终端
    state.terminal.open(terminalElement);
    state.fitAddon.fit();

    // 创建 WebSocket 连接
    state.socket = new WebSocket(wsUrl);

    state.socket.onopen = () => {
        state.status = '等待连接...';
        state.statusType = 'info';
        // 不在这里显示消息，等待后端返回凭证列表或连接成功
    };

    state.socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);

            switch (msg.type) {
                case 'credentials':
                    // 收到凭证列表
                    state.availableKeys = msg.payload?.keys || [];
                    state.loading = false;

                    if (state.availableKeys.length === 0) {
                        state.status = '该主机没有可用的登录凭证';
                        state.statusType = 'danger';
                    } else if (state.availableKeys.length === 1) {
                        // 只有一个凭证，自动选择并连接
                        state.selectedKeyId = state.availableKeys[0].id;
                        connectSSH();
                    } else {
                        // 多个凭证，显示选择对话框
                        state.showKeySelector = true;
                        state.selectedKeyId = state.availableKeys[0].id;
                        state.status = '请选择登录凭证';
                        state.statusType = 'info';
                    }
                    break;

                case 'success':
                    // 连接成功
                    state.status = '已连接';
                    state.statusType = 'success';
                    state.showKeySelector = false;
                    state.loading = false;
                    state.terminal?.writeln('\x1b[32m' + msg.data + '\x1b[0m\r\n');
                    break;

                case 'data':
                    // 终端输出
                    state.terminal?.write(msg.data);
                    break;

                case 'error':
                    // 错误信息
                    state.status = '错误';
                    state.statusType = 'danger';
                    state.terminal?.writeln('\x1b[31m' + msg.data + '\x1b[0m\r\n');
                    // 如果在选择凭证时出错，重新显示选择对话框
                    if (state.availableKeys.length > 1) {
                        state.showKeySelector = true;
                    }
                    break;

                default:
                    // 其他消息类型，直接写入终端
                    if (msg.data) {
                        state.terminal?.write(msg.data);
                    }
            }
        } catch (e) {
            // 如果解析失败，可能是直接的终端输出
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

    // 监听终端输入
    state.terminal.onData((data) => {
        if (state.socket && state.socket.readyState === WebSocket.OPEN) {
            state.socket.send(JSON.stringify({
                type: 'data',
                data: data,
            }));
        }
    });

    // 监听窗口大小变化
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
    // 关闭 WebSocket 连接
    if (state.socket) {
        try {
            state.socket.send(JSON.stringify({ type: 'close' }));
        } catch (e) {
            // 连接可能已关闭
        }
        state.socket.close();
        state.socket = null;
    }

    // 销毁终端（防止重复销毁）
    if (state.terminal) {
        try {
            state.terminal.dispose();
        } catch (e) {
            // 已经销毁过
        }
        state.terminal = null;
    }

    // fitAddon 会随 terminal 一起销毁，直接置空即可
    state.fitAddon = null;

    // 移除窗口大小监听
    window.removeEventListener('resize', handleResize);

    // 重置状态
    state.instanceId = null;
    state.availableKeys = [];
    state.selectedKeyId = null;
    state.status = '';
    state.dialogVisible = false;
    state.showKeySelector = false;

    emit('close');
};

// 组件卸载时清理
onBeforeUnmount(() => {
    handleClose();
});

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

// 凭证选择对话框样式
:deep(.key-selector-dialog) {
    .el-dialog__body {
        padding: 20px;
    }
}

.key-list {
    max-height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.key-card {
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #ffffff;

    &:hover {
        border-color: #409eff;
        background: #f0f9ff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
        transform: translateY(-2px);
    }

    &.active {
        border-color: #409eff;
        background: #ecf5ff;
        box-shadow: 0 2px 12px rgba(64, 158, 255, 0.25);
    }

    .key-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        gap: 12px;
    }

    .key-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;

        .el-icon {
            font-size: 24px;
            color: #909399;
        }
    }

    &.active .key-icon .el-icon {
        color: #409eff;
    }

    .key-title {
        flex: 1;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
    }

    .key-radio {
        flex-shrink: 0;

        :deep(.el-radio) {
            .el-radio__input {
                width: 20px;
                height: 20px;
            }

            .el-radio__inner {
                width: 20px;
                height: 20px;

                &::after {
                    width: 8px;
                    height: 8px;
                }
            }
        }
    }

    .key-details {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
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
        }

        .detail-value {
            font-size: 13px;
            color: #303133;
            font-weight: 500;
        }
    }
}

// 滚动条美化
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
