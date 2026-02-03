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
                width="500px"
                :close-on-click-modal="false"
            >
                <el-radio-group v-model="state.selectedKeyId">
                    <el-space direction="vertical" :size="10" style="width: 100%">
                        <el-radio
                            v-for="key in state.availableKeys"
                            :key="key.id"
                            :label="key.id"
                            style="width: 100%"
                        >
                            <div class="key-item">
                                <div class="key-name">{{ key.name }}</div>
                                <div class="key-info" v-if="key.user">用户名: {{ key.user }}</div>
                                <div class="key-info">协议: {{ key.protocol }}</div>
                                <div class="key-info">类型: {{ key.type === 1 ? '密码' : '密钥' }}</div>
                                <div class="key-info">端口: {{ key.port || 22 }}</div>
                            </div>
                        </el-radio>
                    </el-space>
                </el-radio-group>
                <template #footer>
                    <el-button @click="state.showKeySelector = false">取消</el-button>
                    <el-button type="primary" @click="connectSSH" :loading="state.connecting">
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
        console.log("连接URL: ", wsUrl)
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
            console.log('终端已销毁，忽略错误:', e);
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

.key-item {
    width: 100%;

    .key-name {
        font-weight: bold;
        font-size: 14px;
    }

    .key-info {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
    }
}

:deep(.el-radio) {
    display: flex;
    align-items: flex-start;
    padding: 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    margin-bottom: 8px;

    &:hover {
        border-color: #409eff;
    }

    .el-radio__label {
        flex: 1;
    }
}
</style>
