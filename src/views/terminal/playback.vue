<template>
    <el-dialog
        v-model="state.dialogVisible"
        title="录像回放"
        width="95%"
        fullscreen
        @close="handleClose"
        :close-on-click-modal="false"
    >
        <div class="playback-container" v-loading="state.loading">
            <!-- 控制栏 -->
            <div class="control-bar">
                <div class="control-info">
                    <span class="info-item">
                        <strong>主机:</strong> {{ state.recordInfo.instanceName }} ({{ state.recordInfo.instanceIp }})
                    </span>
                    <span class="info-item">
                        <strong>用户:</strong> {{ state.recordInfo.keyUser }}
                    </span>
                    <span class="info-item">
                        <strong>时间:</strong> {{ state.recordInfo.startTime }}
                    </span>
                </div>
                <div class="control-buttons">
                    <el-button-group>
                        <el-button
                            :disabled="state.playbackState === 'playing'"
                            @click="handlePlay"
                            size="small"
                        >
                            <el-icon><ele-VideoPlay /></el-icon>
                            播放
                        </el-button>
                        <el-button
                            :disabled="state.playbackState !== 'playing'"
                            @click="handlePause"
                            size="small"
                        >
                            <el-icon><ele-VideoPause /></el-icon>
                            暂停
                        </el-button>
                        <el-button
                            @click="handleStop"
                            size="small"
                        >
                            <el-icon><ele-VideoCamera /></el-icon>
                            停止
                        </el-button>
                    </el-button-group>

                    <div class="speed-control">
                        <span>播放速度:</span>
                        <el-select
                            v-model="state.playbackSpeed"
                            @change="handleSpeedChange"
                            size="small"
                            style="width: 100px; margin-left: 8px;"
                        >
                            <el-option label="0.5x" :value="0.5" />
                            <el-option label="1x" :value="1" />
                            <el-option label="2x" :value="2" />
                            <el-option label="4x" :value="4" />
                            <el-option label="8x" :value="8" />
                        </el-select>
                    </div>

                    <div class="progress-control">
                        <el-slider
                            v-model="state.progress"
                            :max="state.duration"
                            :format-tooltip="formatTime"
                            @change="handleSeek"
                            :disabled="!state.recordData || state.recordData.length === 0"
                            style="width: 200px;"
                        />
                        <span class="progress-text">
                            {{ formatTime(state.progress) }} / {{ formatTime(state.duration) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- 终端回放区域 -->
            <div class="terminal-playback">
                <div id="playback-terminal" class="playback-terminal"></div>
            </div>

            <!-- 状态栏 -->
            <div class="status-bar">
                <el-tag :type="state.statusType">{{ state.status }}</el-tag>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, onBeforeUnmount, nextTick, watch } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useTerminalRecordApi } from '/@/api/terminal/record';

interface TerminalRecordFrame {
    time: number;
    data: string;
}

interface AsciinemaHeader {
    version: number;
    width: number;
    height: number;
    timestamp?: number;
    title?: string;
}

// 解析 asciinema v2 格式的录像头部
const parseAsciinemaHeader = (content: string): AsciinemaHeader | null => {
    const lines = content.split('\n');
    if (lines.length > 0) {
        try {
            return JSON.parse(lines[0]);
        } catch (e) {
            return null;
        }
    }
    return null;
};

// 解析 asciinema v2 格式的录像数据
const parseAsciinemaData = (content: string): TerminalRecordFrame[] => {
    const frames: TerminalRecordFrame[] = [];
    const lines = content.split('\n');

    console.log('parseAsciinemaData - total lines:', lines.length);
    console.log('parseAsciinemaData - first line (header):', lines[0]?.substring(0, 100));

    for (let i = 1; i < lines.length; i++) { // 跳过第一行（头部）
        const line = lines[i].trim();
        if (!line) continue;

        try {
            const frame = JSON.parse(line);
            // asciinema v2 格式: [time, event_type, data]
            // event_type: "o" = output, "i" = input
            // 只处理输出事件，因为用户看到的都是输出
            if (Array.isArray(frame) && frame.length >= 3 && frame[1] === 'o') {
                frames.push({
                    time: frame[0],
                    data: frame[2],
                });
            }
        } catch (e) {
            console.warn('Failed to parse line', i, ':', line.substring(0, 50), e);
        }
    }
    
    console.log('parseAsciinemaData - parsed frames:', frames.length);
    if (frames.length > 0) {
        console.log('parseAsciinemaData - first frame:', frames[0]);
        console.log('parseAsciinemaData - last frame:', frames[frames.length - 1]);
    }

    return frames;
};

const props = defineProps({
    visible: Boolean,
    recordId: Number,
});

const emit = defineEmits(['close']);

const recordApi = useTerminalRecordApi();

const state = reactive({
    dialogVisible: false,
    loading: false,
    recordInfo: {
        instanceName: '',
        instanceIp: '',
        keyUser: '',
        startTime: '',
    },
    recordData: [] as TerminalRecordFrame[],
    terminal: null as Terminal | null,
    fitAddon: null as FitAddon | null,
    playbackState: 'idle' as 'idle' | 'playing' | 'paused',
    playbackSpeed: 1,
    progress: 0,
    duration: 0,
    timer: null as ReturnType<typeof setTimeout> | null,
    currentFrame: 0,
    status: '',
    statusType: 'info' as 'success' | 'warning' | 'danger' | 'info',
    terminalCols: 80,
    terminalRows: 24,
});

// 监听 visible 变化
watch(
    () => props.visible,
    (newVal) => {
        state.dialogVisible = newVal;
        if (newVal && props.recordId) {
            loadRecordData(props.recordId);
        }
    }
);

// 加载录像数据
const loadRecordData = async (recordId: number) => {
    state.loading = true;
    state.status = '正在加载录像...';
    state.statusType = 'info';

    try {
        // 获取录像信息
        const infoRes = await recordApi.getRecordInfo(recordId);
        if (infoRes && infoRes.code === 200) {
            state.recordInfo = infoRes.data;
        }

        // 获取录像数据（asciinema v2 格式的文本）
        const res = await recordApi.getPlaybackData(recordId);
        console.log('Playback API Response:', res); // 调试日志
        if (res && res.code === 200) {
            // 后端返回格式: { code: 200, data: { content: "..." }, msg: "..." }
            let content = '';
            if (res.data) {
                if (typeof res.data === 'string') {
                    content = res.data;
                } else if (res.data.content) {
                    content = res.data.content;
                }
            }
            
            console.log('Content preview (first 300 chars):', content.substring(0, 300));
            console.log('Parsed content length:', content.length);
            
            // 解析录像头部，获取终端尺寸
            const header = parseAsciinemaHeader(content);
            if (header) {
                state.terminalCols = header.width || 80;
                state.terminalRows = header.height || 24;
                console.log('Terminal size from header:', state.terminalCols, 'x', state.terminalRows);
            }
            
            // 解析 asciinema v2 格式
            state.recordData = parseAsciinemaData(content);
            
            console.log('Parsed frames count:', state.recordData.length);
            if (state.recordData.length > 0) {
                console.log('First 3 frames:', state.recordData.slice(0, 3));
            }
            
            if (state.recordData.length > 0) {
                state.duration = state.recordData[state.recordData.length - 1].time;
            }

            // 初始化终端
            await nextTick();
            await initTerminal();

            // 显示初始状态
            state.status = '准备就绪';
            state.statusType = 'success';

            // 自动开始播放
            if (state.recordData.length > 0) {
                handlePlay();
            }
        } else {
            throw new Error(res?.message || '获取录像数据失败');
        }
    } catch (error: any) {
        state.status = `加载失败: ${error.message || '未知错误'}`;
        state.statusType = 'danger';
    } finally {
        state.loading = false;
    }
};

// 初始化终端
const initTerminal = async () => {
    const terminalElement = document.getElementById('playback-terminal');
    if (!terminalElement) {
        throw new Error('终端容器不存在');
    }

    // 清空容器
    terminalElement.innerHTML = '';

    // 创建终端实例，使用录像中的终端尺寸
    state.terminal = new Terminal({
        cursorBlink: false,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#ffffff',
        },
        rows: state.terminalRows,
        cols: state.terminalCols,
        allowProposedApi: true,
    });

    // 添加自适应插件
    state.fitAddon = new FitAddon();
    state.terminal.loadAddon(state.fitAddon);

    // 挂载终端
    state.terminal.open(terminalElement);
    
    // 尝试自适应，但保持录像的宽高比
    try {
        state.fitAddon.fit();
    } catch (e) {
        console.warn('Fit addon failed:', e);
    }

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
};

// 播放
const handlePlay = () => {
    if (state.playbackState === 'playing') return;

    state.playbackState = 'playing';
    state.status = '播放中...';
    state.statusType = 'success';

    // 如果已经到末尾，从头开始
    if (state.currentFrame >= state.recordData.length) {
        state.currentFrame = 0;
        state.progress = 0;
        state.terminal?.clear();
    }

    // 开始播放
    playNextFrame();
};

// 播放下一帧
const playNextFrame = () => {
    if (state.playbackState !== 'playing' || state.currentFrame >= state.recordData.length) {
        if (state.currentFrame >= state.recordData.length) {
            console.log('Playback completed');
            handleStop();
        }
        return;
    }

    const frame = state.recordData[state.currentFrame];
    if (frame) {
        // 调试：每10帧打印一次
        if (state.currentFrame % 10 === 0) {
            console.log(`Playing frame ${state.currentFrame}/${state.recordData.length}, time: ${frame.time.toFixed(3)}s, data length: ${frame.data.length}`);
        }
        state.terminal?.write(frame.data);
        state.progress = frame.time;
        state.currentFrame++;

        // 计算下一帧的延迟
        let delay = 100; // 默认 100ms
        if (state.currentFrame < state.recordData.length) {
            const nextFrame = state.recordData[state.currentFrame];
            delay = (nextFrame.time - frame.time) * 1000 / state.playbackSpeed;
        }

        state.timer = setTimeout(() => {
            requestAnimationFrame(playNextFrame);
        }, Math.max(10, delay));
    }
};

// 暂停
const handlePause = () => {
    state.playbackState = 'paused';
    state.status = '已暂停';
    state.statusType = 'warning';

    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }
};

// 停止
const handleStop = () => {
    state.playbackState = 'idle';
    state.status = '已停止';
    state.statusType = 'info';

    if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
    }

    // 重置到开始
    state.currentFrame = 0;
    state.progress = 0;
    state.terminal?.clear();
};

// 调整播放速度
const handleSpeedChange = () => {
    // 播放速度变化时，不需要特别处理，下一帧会自动应用新速度
};

// 跳转
const handleSeek = (value: number) => {
    // 暂停当前播放
    if (state.playbackState === 'playing') {
        handlePause();
    }

    // 清空终端
    state.terminal?.clear();

    // 查找最近的帧
    let targetIndex = 0;
    for (let i = 0; i < state.recordData.length; i++) {
        if (state.recordData[i].time >= value) {
            targetIndex = i;
            break;
        }
    }

    // 重新显示到目标帧
    for (let i = 0; i < targetIndex; i++) {
        state.terminal?.write(state.recordData[i].data);
    }

    state.currentFrame = targetIndex;
    state.progress = value;
};

// 处理窗口大小变化
const handleResize = () => {
    if (state.fitAddon) {
        state.fitAddon.fit();
    }
};

// 格式化时间
const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 关闭对话框
const handleClose = () => {
    // 停止播放
    handleStop();

    // 销毁终端
    if (state.terminal) {
        try {
            state.terminal.dispose();
        } catch (e) {
            // 已经销毁过
        }
        state.terminal = null;
    }

    state.fitAddon = null;

    // 移除窗口大小监听
    window.removeEventListener('resize', handleResize);

    // 清空数据
    state.recordData = [];
    state.recordInfo = {
        instanceName: '',
        instanceIp: '',
        keyUser: '',
        startTime: '',
    };
    state.progress = 0;
    state.duration = 0;
    state.currentFrame = 0;
    state.status = '';

    emit('close');
};

// 组件卸载时清理
onBeforeUnmount(() => {
    handleClose();
});
</script>

<style scoped lang="scss">
.playback-container {
    position: relative;
    height: calc(90vh - 120px);
    display: flex;
    flex-direction: column;
    background-color: #1e1e1e;
    border-radius: 4px;
    overflow: hidden;
}

.control-bar {
    background-color: #2d2d2d;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    border-bottom: 1px solid #3e3e3e;

    .control-info {
        display: flex;
        gap: 24px;
        color: #d4d4d4;
        font-size: 14px;

        .info-item {
            strong {
                color: #909399;
            }
        }
    }

    .control-buttons {
        display: flex;
        align-items: center;
        gap: 16px;

        .speed-control {
            display: flex;
            align-items: center;
            color: #d4d4d4;
            font-size: 14px;
        }

        .progress-control {
            display: flex;
            align-items: center;
            gap: 12px;

            .progress-text {
                color: #d4d4d4;
                font-size: 14px;
                white-space: nowrap;
                min-width: 100px;
                text-align: right;
            }
        }
    }
}

.terminal-playback {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.playback-terminal {
    width: 100%;
    height: 100%;
}

.status-bar {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 100;
}
</style>
