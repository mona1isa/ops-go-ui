<template>
	<div class="ssh-workbench">
		<!-- 左侧：当前用户有权限的主机分组 -->
		<div class="wb-side">
			<div class="wb-panel-title">
				<span>主机分组</span>
				<el-button link type="primary" size="small" title="刷新" @click="loadGroupTree">
					<el-icon><ele-Refresh /></el-icon>
				</el-button>
			</div>
			<el-input v-model="state.groupKeyword" size="small" placeholder="搜索分组/主机" clearable class="wb-search" />
			<el-scrollbar class="wb-side-body">
				<el-tree
					ref="treeRef"
					:data="state.displayTree"
					:props="{ children: 'children', label: 'name' }"
					node-key="key"
					highlight-current
					:expand-on-click-node="true"
					:filter-node-method="filterNode"
					@node-click="onNodeClick"
				>
					<template #default="{ data }">
						<span class="wb-tree-node">
							<template v-if="data.nodeType === 'host'">
								<el-icon class="wb-host-icon"><ele-Monitor /></el-icon>
								<span class="wb-tree-name" :title="`${data.name} (${data.ip})`">{{ data.name }}</span>
								<el-tag size="small" :type="data.onlineStatus === '1' ? 'success' : 'info'" class="wb-tree-tag">
									{{ data.onlineStatus === '1' ? '在线' : '离线' }}
								</el-tag>
							</template>
							<template v-else>
								<el-icon><ele-Folder /></el-icon>
								<span class="wb-tree-name">{{ data.name }}</span>
								<span v-if="data.hostCount" class="wb-tree-count">{{ data.hostCount }}</span>
							</template>
						</span>
					</template>
				</el-tree>
			</el-scrollbar>
		</div>

		<!-- 中间：多主机终端（标签页） -->
		<div class="wb-terminal">
			<div class="wb-terminal-tabs">
				<div
					v-for="tab in state.tabs"
					:key="tab.instance.id"
					class="wb-tab"
					:class="{ active: tab.instance.id === state.activeInstanceId }"
					@click="switchTab(tab.instance.id)"
				>
					<span class="wb-tab-name" :title="`${tab.instance.name} (${tab.instance.ip})`">{{ tab.instance.name }}</span>
					<el-tag size="small" :type="tab.statusType" class="wb-tab-status">{{ tab.status || '未连接' }}</el-tag>
					<el-icon class="wb-tab-close" @click.stop="closeTab(tab.instance.id)"><ele-Close /></el-icon>
				</div>
				<div v-if="state.tabs.length === 0" class="wb-tab-empty">未打开主机</div>
			</div>
			<div class="wb-terminal-header">
				<div class="wb-terminal-title">
					<span v-if="activeTab">{{ activeTab.instance.name }}（{{ activeTab.instance.ip }}）</span>
					<span v-else>未选择主机</span>
					<el-tag v-if="activeTab && activeTab.status" :type="activeTab.statusType" size="small" class="ml10">{{ activeTab.status }}</el-tag>
				</div>
				<div class="wb-terminal-ops">
					<el-select
						v-if="activeTab && activeTab.instance.keys.length > 1"
						v-model="activeTab.keyId"
						size="small"
						class="wb-key-select"
						@change="onSwitchKey"
					>
						<el-option v-for="key in activeTab.instance.keys" :key="key.id" :label="key.name" :value="key.id" />
					</el-select>
					<el-button size="small" type="primary" plain :disabled="!activeTab" @click="onReconnect">重新连接</el-button>
					<el-button size="small" type="danger" plain :disabled="!activeTab" @click="onDisconnect">断开</el-button>
				</div>
			</div>
			<div class="wb-terminal-body">
				<div v-if="!activeTab" class="wb-empty">请选择左侧分组下的主机</div>
			<template v-for="tab in state.tabs" :key="tab.instance.id">
				<div v-show="tab.instance.id === state.activeInstanceId" :id="`terminal-${tab.instance.id}`" class="wb-terminal-container"></div>
			</template>
			</div>
		</div>

		<!-- 最右侧：SFTP 文件管理（跟随当前激活主机） -->
		<sftp-panel
			:instance-id="activeTab ? activeTab.instance.id : null"
			:key-id="activeTab ? activeTab.keyId : null"
			:connected="activeTab ? activeTab.status === '已连接' : false"
			:host-label="activeTab ? `${activeTab.instance.name}（${activeTab.instance.ip}）` : ''"
			@toggle="onSftpToggle"
		/>

		<!-- 凭证选择框：服务端返回多个凭证时让用户选择 -->
		<el-dialog v-model="state.keyDialogVisible" title="选择登录凭证" width="560px" :close-on-click-modal="false" append-to-body>
			<div class="wb-key-list">
				<div
					v-for="key in state.keyOptions"
					:key="key.id"
					class="wb-key-card"
					:class="{ active: state.selectedKeyId === key.id }"
					@click="state.selectedKeyId = key.id"
				>
					<div class="wb-key-title">{{ key.name }}</div>
					<div class="wb-key-detail">
						<span>用户名：{{ key.user || '-' }}</span>
						<span>协议：{{ key.protocol || 'SSH' }}</span>
						<span>端口：{{ key.port || 22 }}</span>
						<el-tag size="small" :type="key.type === 1 ? 'warning' : 'success'">{{ key.type === 1 ? '密码' : '密钥' }}</el-tag>
					</div>
				</div>
			</div>
			<template #footer>
				<el-button @click="onCancelKey">取消</el-button>
				<el-button type="primary" :loading="activeTab && activeTab.connecting" @click="onConfirmKey">连接</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ElMessage } from 'element-plus';
import 'xterm/css/xterm.css';
import { useMyInstanceApi } from '/@/api/myinstance';
import { Session } from '/@/utils/storage';
import { NextLoading } from '/@/utils/loading';
import SftpPanel from '/@/components/sftpPanel/index.vue';

// 凭证
interface SshKey {
	id: number;
	name: string;
	user: string;
	protocol: string;
	port: number;
	type: number;
}

// 主机
interface SshInstance {
	id: number;
	name: string;
	ip: string;
	os: string;
	spec: string;
	status: string;
	onlineStatus: string;
	keys: SshKey[];
}

// 主机分组
interface SshGroup {
	id: number;
	name: string;
	parentId: number;
	children?: SshGroup[];
	instances: SshInstance[];
}

// 主机标签页
interface Tab {
	instance: SshInstance;
	keyId: number | null;
	status: string;
	statusType: 'info' | 'success' | 'warning' | 'danger';
	connecting: boolean;
}

// 终端会话（非响应式，存放 xterm 与 socket 实例）
interface TermSession {
	terminal: Terminal;
	fitAddon: FitAddon;
	socket: WebSocket | null;
	opened: boolean;
	presetKeyId?: number; // 重连/切换凭证时预设的凭证ID，连接建立后自动连接
	ro?: ResizeObserver; // 监听容器尺寸变化以自适应终端（容器在弹窗关闭/面板展开后才获得真实尺寸）
}

const route = useRoute();
const myInstanceApi = useMyInstanceApi();

const treeRef = ref();

// 终端会话：每个主机一个，独立于响应式 state
const sessions = new Map<number, TermSession>();

const state = reactive({
	groupTree: [] as SshGroup[],
	displayTree: [] as any[],
	groupKeyword: '',
	tabs: [] as Tab[],
	activeInstanceId: null as number | null,
	selectedKeyId: null as number | null,
	pendingInstanceId: null as number | null,
	keyOptions: [] as SshKey[], // 服务端返回的可选登录凭证
	keyDialogVisible: false,
});

const activeTab = computed<Tab | null>(() => state.tabs.find((t) => t.instance.id === state.activeInstanceId) || null);

const getTab = (id: number): Tab | undefined => state.tabs.find((t) => t.instance.id === id);

// 分组搜索过滤（同时匹配分组名与主机名）
const filterNode = (value: string, data: any) => {
	if (!value) return true;
	return data.name.indexOf(value) !== -1;
};
watch(
	() => state.groupKeyword,
	(val: string) => {
		treeRef.value?.filter(val);
	}
);

// 将后端分组树转换为左侧展示树：分组下直接挂载主机节点
const buildDisplayTree = (groups: SshGroup[]) => {
	return (groups || []).map((g: SshGroup) => {
		const children: any[] = [];
		if (g.children && g.children.length) {
			children.push(...buildDisplayTree(g.children));
		}
		if (g.instances && g.instances.length) {
			for (const inst of g.instances) {
				children.push({
					key: `h-${inst.id}`,
					nodeType: 'host',
					name: inst.name,
					ip: inst.ip,
					onlineStatus: inst.onlineStatus,
					raw: inst,
				});
			}
		}
		return {
			key: `g-${g.id}`,
			nodeType: 'group',
			name: g.name,
			hostCount: g.instances ? g.instances.length : 0,
			children,
		};
	});
};

// 获取用户有权限的主机分组树
const loadGroupTree = async () => {
	const res = await myInstanceApi.getMyGroupTree();
	if (res && res.code === 200) {
		state.groupTree = res.data || [];
		state.displayTree = buildDisplayTree(state.groupTree);
	}
};

// 点击树节点：主机节点打开连接，分组节点由 el-tree 展开/折叠
const onNodeClick = (data: any) => {
	if (data.nodeType === 'host') {
		openHost(data.raw);
	}
};

// 从分组树中查找主机所在的「分组路径」（从根到包含该主机的分组）
const findGroupPath = (groups: SshGroup[], instanceId: number, trail: number[] = []): number[] | null => {
	for (const group of groups) {
		const t = [...trail, group.id];
		if (group.instances && group.instances.some((item: SshInstance) => item.id === instanceId)) {
			return t;
		}
		if (group.children && group.children.length) {
			const found = findGroupPath(group.children, instanceId, t);
			if (found) return found;
		}
	}
	return null;
};

// 从分组树中查找指定主机
const findInstance = (groups: SshGroup[], instanceId: number): SshInstance | null => {
	for (const group of groups) {
		const instance = group.instances.find((item: SshInstance) => item.id === instanceId);
		if (instance) return instance;
		if (group.children && group.children.length) {
			const found = findInstance(group.children, instanceId);
			if (found) return found;
		}
	}
	return null;
};

// 打开一台主机：已打开则切换，否则新建标签页并立即建立 SSH 连接
const openHost = async (instance: SshInstance) => {
	const existing = getTab(instance.id);
	if (existing) {
		switchTab(instance.id);
		return;
	}
	state.tabs.push({ instance, keyId: null, status: '', statusType: 'info', connecting: false });
	state.activeInstanceId = instance.id;

	if (instance.keys.length === 0) {
		const tab = getTab(instance.id);
		if (tab) {
			tab.status = '该主机没有可用的登录凭证';
			tab.statusType = 'warning';
		}
		return;
	}
	// 立即建立终端与 SSH WebSocket 连接；若服务端返回多个凭证会再弹出选择框
	await nextTick();
	openConnection(instance);
};

// 切换激活的标签页
const switchTab = (id: number) => {
	state.activeInstanceId = id;
	nextTick(() => fitTerminal(id));
};

// 关闭标签页：断开该主机的 SSH 与 SFTP 连接
const closeTab = (id: number) => {
	const sess = sessions.get(id);
	if (sess) {
		if (sess.socket) {
			try {
				sess.socket.send(JSON.stringify({ type: 'close' }));
			} catch (e) {
				// 忽略
			}
			sess.socket.close();
		}
		try {
			sess.ro?.disconnect();
		} catch (e) {
			// 忽略
		}
		try {
			sess.terminal.dispose();
		} catch (e) {
			// 忽略
		}
		sessions.delete(id);
	}
	const idx = state.tabs.findIndex((t) => t.instance.id === id);
	if (idx > -1) state.tabs.splice(idx, 1);
	if (state.activeInstanceId === id) {
		const next = state.tabs[state.tabs.length - 1];
		state.activeInstanceId = next ? next.instance.id : null;
	}
	if (state.pendingInstanceId === id) {
		state.pendingInstanceId = null;
		state.keyDialogVisible = false;
	}
};

// 确认选择的凭证：通过已建立的 WebSocket 发送 connect 消息
const onConfirmKey = () => {
	if (state.pendingInstanceId == null) return;
	const id = state.pendingInstanceId;
	const sess = sessions.get(id);
	const keyId = state.selectedKeyId ?? null;
	if (!sess || !sess.socket || keyId == null) return;
	state.keyDialogVisible = false;
	const tab = getTab(id);
	if (tab) {
		tab.keyId = keyId;
		tab.connecting = true;
		tab.status = '连接中...';
		tab.statusType = 'info';
	}
	sendConnect(id, keyId);
};

// 取消凭证选择：关闭已建立的 WebSocket 并移除该标签页，便于重新选择主机时再次弹出
const onCancelKey = () => {
	const id = state.pendingInstanceId;
	state.keyDialogVisible = false;
	if (id != null) {
		const sess = sessions.get(id);
		if (sess && sess.socket) {
			try {
				sess.socket.send(JSON.stringify({ type: 'close' }));
			} catch (e) {
				// 忽略
			}
			sess.socket.close();
			sess.socket = null;
		}
		closeTab(id);
	}
};

// 切换凭证（已连接主机存在多个凭证时重新连接）
const onSwitchKey = () => {
	const tab = activeTab.value;
	if (!tab || tab.keyId == null) return;
	openConnection(tab.instance, tab.keyId);
};

// 重新连接当前主机
const onReconnect = () => {
	const tab = activeTab.value;
	if (!tab) return;
	const keyId = tab.keyId || (tab.instance.keys[0]?.id ?? null);
	if (!keyId) {
		ElMessage.warning('该主机没有可用的登录凭证');
		return;
	}
	tab.keyId = keyId;
	openConnection(tab.instance, keyId);
};

// 断开当前连接
const onDisconnect = () => {
	const id = state.activeInstanceId;
	if (id == null) return;
	const sess = sessions.get(id);
	if (sess && sess.socket) {
		try {
			sess.socket.send(JSON.stringify({ type: 'close' }));
		} catch (e) {
			// 忽略
		}
		sess.socket.close();
		sess.socket = null;
	}
	const tab = getTab(id);
	if (tab) {
		tab.status = '已断开';
		tab.statusType = 'info';
	}
};

// SFTP 面板展开/收起时，终端需要重新自适应宽度
const onSftpToggle = () => {
	setTimeout(() => {
		if (state.activeInstanceId != null) fitTerminal(state.activeInstanceId);
	}, 350);
};

// WebSocket 地址
const getWebSocketUrl = (instanceId: number, cols: number, rows: number) => {
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	const wsUrl = import.meta.env.VITE_WS_URL;
	const host = wsUrl ? new URL(wsUrl).host : window.location.host;
	const token = Session.get('token') || '';
	return `${protocol}//${host}/api/instance/terminal?instanceId=${instanceId}&token=${encodeURIComponent(token)}&cols=${cols}&rows=${rows}`;
};

// 建立/重建某主机的 SSH 连接
// presetKeyId：若传入，则连接建立（或收到凭证列表）后直接以该凭证连接（用于重连/切换凭证）；
// 若不传，则由服务端返回的凭证列表决定是否弹出选择框
const openConnection = async (instance: SshInstance, presetKeyId?: number) => {
	const id = instance.id;
	let sess = sessions.get(id);
	if (!sess) {
		const terminal = new Terminal({
			cursorBlink: true,
			fontSize: 14,
			fontFamily: 'Consolas, "Courier New", monospace',
			theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#ffffff' },
			rows: 30,
			cols: 100,
		});
		const fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		sess = { terminal, fitAddon, socket: null, opened: false, presetKeyId };
		sessions.set(id, sess);
	} else {
		if (sess.socket) {
			try {
				sess.socket.send(JSON.stringify({ type: 'close' }));
			} catch (e) {
				// 忽略
			}
			sess.socket.close();
			sess.socket = null;
		}
		try {
			sess.terminal.clear();
		} catch (e) {
			// 忽略
		}
		sess.presetKeyId = presetKeyId;
	}

	await nextTick();
	const container = document.getElementById(`terminal-${id}`);
	if (container && !sess.opened) {
		sess.terminal.open(container);
		sess.opened = true;
		// 容器刚挂载，做几次自适应以确保尺寸正确（避免终端空白）
		nextTick(() => safeFit(id));
		requestAnimationFrame(() => safeFit(id));
		setTimeout(() => safeFit(id), 60);
		// 监听容器尺寸变化：当凭证弹窗关闭、SFTP 面板展开/收起、切换标签页等
		// 导致容器尺寸变化（或从无尺寸变为有尺寸）时，自动重新自适应，避免终端空白/不可见
		try {
			const ro = new ResizeObserver(() => safeFit(id));
			ro.observe(container);
			sess.ro = ro;
		} catch (e) {
			// 不支持 ResizeObserver 时忽略，依赖上面的定时自适应
		}
	} else if (container && sess.opened) {
		// 已打开过（例如重连），容器可能刚切换为可见，立即自适应一次
		safeFit(id);
	}
	sess.terminal.writeln(`正在连接 ${instance.name}(${instance.ip}) ...`);

	const tab = getTab(id);
	if (tab) {
		tab.keyId = presetKeyId ?? tab.keyId;
		// 仅重连/切换凭证（已预选 keyId）时立即进入“连接中”；
		// 初始打开需等待用户在凭证框中确认，避免确认按钮被 loading 锁死
		if (presetKeyId) {
			tab.connecting = true;
			tab.status = '连接中...';
			tab.statusType = 'info';
		}
	}

	const socket = new WebSocket(getWebSocketUrl(id, sess.terminal.cols || 100, sess.terminal.rows || 30));
	sess.socket = socket;

	socket.onopen = () => {
		if (id === state.activeInstanceId) safeFit(id);
	};

	socket.onmessage = (event: MessageEvent) => {
		try {
			const msg = JSON.parse(event.data);
			switch (msg.type) {
				case 'credentials': {
					const keys: SshKey[] = (msg.payload && msg.payload.keys) || [];
					state.keyOptions = keys;
					if (sess!.presetKeyId) {
						// 重连/切换凭证：直接连接
						sendConnect(id, sess!.presetKeyId);
					} else {
						// 多个凭证：弹出选择框
						state.pendingInstanceId = id;
						state.selectedKeyId = keys[0]?.id ?? null;
						state.keyDialogVisible = true;
					}
					break;
				}
				case 'success': {
					const t = getTab(id);
					if (t) {
						t.connecting = false;
						t.status = '已连接';
						t.statusType = 'success';
					}
					state.keyDialogVisible = false;
					if (id === state.activeInstanceId) safeFit(id);
					break;
				}
				case 'data':
				case 'blocked':
					sess!.terminal.write(msg.data);
					break;
				case 'terminated': {
					const t = getTab(id);
					if (t) {
						t.connecting = false;
						t.status = '会话已终止';
						t.statusType = 'warning';
					}
					sess!.terminal.write(msg.data || '');
					break;
				}
				case 'error': {
					const t = getTab(id);
					if (t) {
						t.connecting = false;
						t.status = '连接失败';
						t.statusType = 'danger';
					}
					state.keyDialogVisible = false;
					sess!.terminal.writeln(`\r\n\x1b[31m${msg.data || msg.msg || '连接失败'}\x1b[0m`);
					break;
				}
			}
		} catch (e) {
			sess!.terminal.write(event.data);
		}
	};

	socket.onerror = () => {
		const t = getTab(id);
		if (t) {
			t.connecting = false;
			t.status = '连接异常';
			t.statusType = 'danger';
		}
	};

	socket.onclose = () => {
		const t = getTab(id);
		if (t) t.connecting = false;
	};

	sess.terminal.onData((data: string) => {
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'data', data }));
		}
	});
};

// 发送连接消息（携带选择的凭证ID）
const sendConnect = (id: number, keyId: number) => {
	const sess = sessions.get(id);
	if (sess && sess.socket && sess.socket.readyState === WebSocket.OPEN && keyId) {
		sess.socket.send(
			JSON.stringify({
				type: 'connect',
				keyId,
				cols: sess.terminal.cols || 100,
				rows: sess.terminal.rows || 30,
			})
		);
	}
};

// 终端自适应尺寸并同步给服务端
const fitTerminal = (id: number) => {
	if (id !== state.activeInstanceId) return; // 仅对当前可见终端做自适应
	const sess = sessions.get(id);
	if (!sess || !sess.opened) return;
	sess.fitAddon.fit();
	if (sess.socket && sess.socket.readyState === WebSocket.OPEN) {
		sess.socket.send(JSON.stringify({ type: 'resize', cols: sess.terminal.cols, rows: sess.terminal.rows }));
	}
};

// 带异常保护的终端自适应（容器尺寸异常时静默忽略）
const safeFit = (id: number) => {
	try {
		fitTerminal(id);
	} catch (e) {
		// 忽略尺寸异常
	}
};

// 窗口大小变化时同步当前终端尺寸
const onWindowResize = () => {
	if (state.activeInstanceId != null) fitTerminal(state.activeInstanceId);
};
window.addEventListener('resize', onWindowResize);

onMounted(async () => {
	// 本页为全屏静态路由（不经过 layout），layout 中的 NextLoading.done 不会执行，
	// 需在此处主动移除全局 loading 遮罩，否则其占满一屏会把 #app 顶出视口导致页面空白
	NextLoading.done();
	await loadGroupTree();
	// 支持从主机列表页跳转时自动选中并连接指定主机
	const instanceId = Number(route.query.instanceId);
	if (instanceId) {
		const instance = findInstance(state.groupTree, instanceId);
		if (instance) {
			await nextTick();
			// 展开包含该主机的所有祖先分组，并高亮该主机节点
			const path = findGroupPath(state.groupTree, instanceId);
			if (path) {
				for (const gid of path) {
					treeRef.value?.getNode(`g-${gid}`)?.expand();
				}
			}
			treeRef.value?.setCurrentKey(`h-${instanceId}`);
			openHost(instance);
		}
	}
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', onWindowResize);
	sessions.forEach((s) => {
		if (s.socket) {
			try {
				s.socket.send(JSON.stringify({ type: 'close' }));
			} catch (e) {
				// 忽略
			}
			s.socket.close();
		}
		try {
			s.terminal.dispose();
		} catch (e) {
			// 忽略
		}
	});
	sessions.clear();
});
</script>

<style scoped lang="scss">
.ssh-workbench {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	overflow: hidden;
	background-color: #1e1e1e;
}
.wb-side {
	width: 280px;
	display: flex;
	flex-direction: column;
	background-color: #1e1e1e;
	border-right: 1px solid #333;
}
.wb-panel-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 40px;
	padding: 0 10px;
	font-size: 14px;
	font-weight: bold;
	color: #d4d4d4;
	border-bottom: 1px solid #333;
}
.wb-search {
	padding: 8px 10px;

	:deep(.el-input__wrapper) {
		background-color: #252526;
		box-shadow: 0 0 0 1px #3c3c3c inset;
	}

	:deep(.el-input__inner) {
		color: #d4d4d4;

		&::placeholder {
			color: #7a7a7a;
		}
	}
}
.wb-side-body {
	flex: 1;
	overflow: hidden;
}
// 左侧主机分组树深色主题
.wb-side {
	:deep(.el-tree) {
		background-color: transparent;
		color: #d4d4d4;
	}

	:deep(.el-tree-node__content) {
		height: 30px;
		background-color: transparent;

		&:hover {
			background-color: #2a2d2e;
		}
	}

	:deep(.el-tree-node.is-current > .el-tree-node__content) {
		background-color: #094771;
	}

	:deep(.el-tree-node__expand-icon) {
		color: #909399;
	}

	:deep(.el-tree-node__expand-icon.is-leaf) {
		color: transparent;
	}
}
.wb-tree-node {
	display: flex;
	align-items: center;
	width: 100%;
	font-size: 13px;
}
.wb-tree-name {
	margin-left: 4px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.wb-tree-count {
	margin-left: auto;
	padding-right: 8px;
	font-size: 12px;
	color: #909399;
}
.wb-host-icon {
	margin-right: 6px;
}
.wb-tree-tag {
	margin-left: auto;
	margin-right: 8px;
}

/* 终端区 */
.wb-terminal {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	background-color: #1e1e1e;
}
.wb-terminal-tabs {
	display: flex;
	align-items: stretch;
	height: 36px;
	background-color: #2d2d2d;
	border-bottom: 1px solid #111;
	overflow-x: auto;
}
.wb-tab {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0 8px;
	max-width: 200px;
	cursor: pointer;
	color: #bdbdbd;
	border-right: 1px solid #111;
	position: relative;
	white-space: nowrap;
}
.wb-tab.active {
	background-color: #1e1e1e;
	color: #fff;
}
.wb-tab-name {
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 13px;
}
.wb-tab-status {
	transform: scale(0.85);
	transform-origin: center;
}
.wb-tab-close {
	font-size: 13px;
	border-radius: 50%;
	padding: 1px;
}
.wb-tab-close:hover {
	background-color: rgba(255, 255, 255, 0.15);
	color: #fff;
}
.wb-tab-empty {
	display: flex;
	align-items: center;
	padding: 0 12px;
	color: #777;
	font-size: 12px;
}
.wb-terminal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 44px;
	padding: 0 12px;
	color: #d4d4d4;
	background-color: #252526;
	border-bottom: 1px solid #333;
}
.wb-terminal-title {
	display: flex;
	align-items: center;
	font-size: 13px;
}
.wb-terminal-ops {
	display: flex;
	align-items: center;
	gap: 8px;
}
.wb-key-select {
	width: 140px;
}
.wb-terminal-body {
	flex: 1;
	min-height: 0;
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}
.wb-terminal-container {
	flex: 1;
	min-height: 0;
	width: 100%;
	position: relative;
	overflow: hidden;
	:deep(.xterm) {
		height: 100%;
	}
}
.wb-empty {
	padding: 20px 10px;
	text-align: center;
	font-size: 13px;
	color: #7a7a7a;
}
.wb-key-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.wb-key-card {
	padding: 10px 12px;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 6px;
	cursor: pointer;
}
.wb-key-card.active {
	border-color: var(--el-color-primary);
	background-color: var(--el-color-primary-light-9);
}
.wb-key-title {
	font-size: 14px;
	font-weight: bold;
	margin-bottom: 6px;
}
.wb-key-detail {
	display: flex;
	align-items: center;
	gap: 14px;
	font-size: 12px;
	color: var(--el-text-color-secondary);
}
</style>
