import { de } from "element-plus/es/locale";

/**
 * views personal
 */
type NewInfo = {
	title: string;
	date: string;
	link: string;
};
type Recommend = {
	title: string;
	msg: string;
	icon: string;
	bg: string;
	iconColor: string;
};
declare type PersonalState = {
	personalForm: {
		id: number;
		nickname: string;
		email: string;
		phone: string;
		sex: string;
	};
	passwordForm: {
		oldPassword: string;
		newPassword: string;
		confirmPassword: string;
	};
};

/**
 * views visualizing
 */
declare type Demo2State<T = any> = {
	time: {
		txt: string;
		fun: number;
	};
	dropdownList: T[];
	dropdownActive: string;
	skyList: T[];
	dBtnList: T[];
	chartData4Index: number;
	dBtnActive: number;
	earth3DBtnList: T[];
	chartData4List: T[];
	myCharts: T[];
};

/**
 * views params
 */
declare type ParamsState = {
	value: string;
	tagsViewName: string;
	tagsViewNameIsI18n: boolean;
};

declare type RowLogType = {
	id: number;
	method: string;
	requestUri: string;
	params: string;
	resp: string;
	ipAddr: string;
	statusCode: string;
	costTimeMs: number;
	createAt: string;
	updatedAt: string;
	createBy: string;
	updateBy: string;
	remark: string;
};


declare interface SysLogTableType extends TableType {
	data: RowLogType[];
}

declare interface SysLogState {
	tableData: SysLogTableType;
}

/**
 * views system
 */
// role
declare interface RowRoleType {
	id: number;
	name: string;
	status: string;
	remark: string;
	orderNum: number;
	createdAt: string;
	menuIds: number[];
}

interface SysRoleTableType extends TableType {
	data: RowRoleType[];
}

declare interface SysRoleState {
	tableData: SysRoleTableType;
}

declare type TreeType = {
	id: number;
	label: string;
	children?: TreeType[];
};

declare interface RoleAuthUserState {
	tableData: SysUserTableType;
}

// user
declare type RowUserType<T = any> = {
	id: number;
	userName: string;
	nickname: string;
	roleName: string;
	roleIds: number[];
	deptId: number;
	phone: string;
	email: string;
	sex: number | string;
	password: string;
	status: string;
	remark: string;
	createAt: T;
	deptIds: number[];
};

interface SysUserTableType extends TableType {
	data: RowUserType[];
}

declare interface SysUserState {
	tableData: SysUserTableType;
}

declare type DeptTreeType = {
	id: number; // 部门ID
	name: string;
	parentId: number; // 父部门ID
	orderNum: number;
	createAt: string;
	status: boolean;
	remark: string;
	children?: DeptTreeType[];
};

// dept
declare interface RowDeptType extends DeptTreeType {
	ids: number[], // 部门ID
	name: '', // 部门名称
	orderNum: 0, // 排序
	status: true, // 部门状态
	remark: '', // 部门描述
}

interface SysDeptTableType extends TableType {
	data: DeptTreeType[];
}

declare interface SysDeptState {
	tableData: SysDeptTableType;
}

// dic
type ListType = {
	id: number;
	label: string;
	value: string;
};

declare interface RowDicType {
	dicName: string;
	fieldName: string;
	describe: string;
	status: boolean;
	createTime: string;
	list: ListType[];
}

interface SysDicTableType extends TableType {
	data: RowDicType[];
}

declare interface SysDicState {
	tableData: SysDicTableType;
}

/**
 * views pages
 */
//  filtering
declare type FilteringChilType = {
	id: number | string;
	label: string;
	active: boolean;
};

declare type FilterListType = {
	img: string;
	title: string;
	evaluate: string;
	collection: string;
	price: string;
	monSales: string;
	id: number | string;
	loading?: boolean;
};

declare type FilteringRowType = {
	title: string;
	isMore: boolean;
	isShowMore: boolean;
	id: number | string;
	children: FilteringChilType[];
};

// tableRules
declare type TableRulesHeaderType = {
	prop: string;
	width: string | number;
	label: string;
	isRequired?: boolean;
	isTooltip?: boolean;
	type: string;
};

declare type TableRulesState = {
	tableData: {
		data: EmptyObjectType[];
		header: TableRulesHeaderType[];
		option: SelectOptionType[];
	};
};

declare type TableRulesOneProps = {
	name: string;
	email: string;
	autograph: string;
	occupation: string;
};

// tree
declare type RowTreeType = {
	id: number;
	label: string;
	label1: string;
	label2: string;
	isShow: boolean;
	children?: RowTreeType[];
};

// workflow index
declare type NodeListState = {
	id: string | number;
	nodeId: string | undefined;
	class: HTMLElement | string;
	left: number | string;
	top: number | string;
	icon: string;
	name: string;
};

declare type LineListState = {
	sourceId: string;
	targetId: string;
	label: string;
};

declare type XyState = {
	x: string | number;
	y: string | number;
};

declare type WorkflowState<T = any> = {
	leftNavList: T[];
	dropdownNode: XyState;
	dropdownLine: XyState;
	isShow: boolean;
	jsPlumb: T;
	jsPlumbNodeIndex: null | number;
	jsplumbDefaults: T;
	jsplumbMakeSource: T;
	jsplumbMakeTarget: T;
	jsplumbConnect: T;
	jsplumbData: {
		nodeList: NodeListState[];
		lineList: LineListState[];
	};
};

// workflow drawer
declare type WorkflowDrawerNodeState<T = any> = {
	node: { [key: string]: T };
	nodeRules: T;
	form: T;
	tabsActive: string;
	loading: {
		extend: boolean;
	};
};

declare type WorkflowDrawerLabelType = {
	type: string;
	label: string;
};

declare type WorkflowDrawerState<T = any> = {
	isOpen: boolean;
	nodeData: {
		type: string;
	};
	jsplumbConn: T;
};

/**
 * views make
 */
// tableDemo
declare type TableDemoPageType = {
	pageNum: number;
	pageSize: number;
};

declare type TableHeaderType = {
	key: string;
	width: string;
	title: string;
	type: string | number;
	colWidth: string;
	width?: string | number;
	height?: string | number;
	isCheck: boolean;
};

declare type TableSearchType = {
	label: string;
	prop: string;
	placeholder: string;
	required: boolean;
	type: string;
	options?: SelectOptionType[];
};

declare type TableDemoState = {
	tableData: {
		data: EmptyObjectType[];
		header: TableHeaderType[];
		config: {
			total: number;
			loading: boolean;
			isBorder: boolean;
			isSelection: boolean;
			isSerialNo: boolean;
			isOperate: boolean;
		};
		search: TableSearchType[];
		param: EmptyObjectType;
		printName: string;
	};
};

// instance
declare type RowInstanceType <T = any> = {
	id: number;
	name: string;
	deptId: number;
	deptName: string;
	cpu: number;
	memMb: number;
	diskGb: number;
	spec: string;
	status: string;
	onlineStatus: string;
	os: string;
	ip: string;
	createAt: string;
	updateAt: string;
	createBy: string;
	updateBy: string;
	remark: string;
	bindingKeys: T[];
};

declare type InstanceStatusItem = {
	id: number;
	status: string;
};

declare interface InstanceTableType extends TableType {
	data: RowInstanceType[];
};

declare interface InstanceState {
	tableData: InstanceTableType;
};

// keys
declare type RowKeyType <T = any> = {
	id: number;
	name: string;
	user: string;
	credentials: string;
	protocol: string;
	port: number;
	type: number;
	status: string;
	createdAt: string;
	updatedAt: string;
	createBy: string;
	updateBy: string;
	remark: string;
};

declare type KeyStatusItem = {
	id: number;
	status: string;
};

declare interface KeyTableType extends TableType {
	data: RowKeyType[];
};

declare interface KeyState {
	tableData: KeyTableType;
};

// Groups
declare type RowGroupType <T = any> = {
	id: number;
	name: string;
	parentId: number;
};
declare interface GroupTableType extends TableType {
	data: RowGroupType[];
}

declare interface GroupState {
	tableData: GroupTableType;
}

// Terminal Record
declare type RowRecordType = {
	id: number;
	instanceId: number;
	instanceName: string;
	instanceIp: string;
	keyId: number;
	username: string;
	startTime: string;
	endTime: string;
	duration: number;
	filePath: string;
	fileSize: number;
	createdAt: string;
	createdBy: string;
	remark: string;
};

declare type TerminalRecordFrame = {
	time: number;
	data: string;
};

declare interface RecordTableType extends TableType {
	data: RowRecordType[];
}

declare interface RecordState {
	tableData: RecordTableType;
}

// Monitor 监控告警
declare type RowMonitorTargetType = {
	id: number;
	instanceId: number;
	instanceName: string;
	instanceIp: string;
	keyId: number;
	enabled: string;
	intervalSec: number;
	timeoutSec: number;
	lastCollectAt: string | null;
	lastStatus: number;
	lastError: string;
	createBy: string;
	updateBy: string;
	remark: string;
	createdAt: string;
	updatedAt: string;
};

declare interface MonitorTargetTableType extends TableType {
	data: RowMonitorTargetType[];
}

declare interface MonitorTargetState {
	tableData: MonitorTargetTableType;
}

declare type RowMonitorRuleType = {
	id: number;
	name: string;
	metric: string;
	promQl: string;
	operator: string;
	threshold: number;
	severity: number;
	forSec: number;
	cooldownSec: number;
	silenceUntil: number;
	muted: string;
	channelIds: string;
	enabled: string;
	createBy: string;
	updateBy: string;
	remark: string;
	createdAt: string;
	updatedAt: string;
};

declare interface MonitorRuleTableType extends TableType {
	data: RowMonitorRuleType[];
}

declare interface MonitorRuleState {
	tableData: MonitorRuleTableType;
}

declare type RowMonitorNotifyLogType = {
	id: number;
	eventId: number;
	ruleId: number;
	channelId: number;
	channelName: string;
	recovered: number;
	payload: string;
	statusCode: number;
	responseBody: string;
	attempt: number;
	success: number;
	errorMsg: string;
	createdAt: string;
};

declare type RowMonitorEventType = {
	id: number;
	ruleId: number;
	ruleName: string;
	fingerprint: string;
	instanceIp: string;
	labels: string;
	value: number;
	threshold: number;
	severity: number;
	status: number;
	pendingSince: string | null;
	firedAt: string | null;
	resolvedAt: string | null;
	lastNotifyAt: string | null;
	notifyCount: number;
	suppressed: number;
	summary: string;
	createdAt: string;
	updatedAt: string;
	lastNotify: RowMonitorNotifyLogType | null;
};

declare interface MonitorEventTableType extends TableType {
	data: RowMonitorEventType[];
}

declare interface MonitorEventState {
	tableData: MonitorEventTableType;
}

declare type RowMonitorChannelType = {
	id: number;
	name: string;
	type: number;
	url: string;
	secret: string;
	headers: string;
	enabled: string;
	createBy: string;
	updateBy: string;
	remark: string;
	createdAt: string;
	updatedAt: string;
};

declare interface MonitorChannelTableType extends TableType {
	data: RowMonitorChannelType[];
}

declare interface MonitorChannelState {
	tableData: MonitorChannelTableType;
}

declare type MonitorMetricPoint = {
	timestamp: number;
	value: number;
};

declare type MonitorMetricSeries = {
	metric: string;
	name: string;
	labels: Record<string, string>;
	points: MonitorMetricPoint[];
};

declare type MonitorHostSnapshotType = {
	instance: string;
	metrics: MonitorMetricSeries[];
	missing: boolean;
	message: string;
};

declare type MonitorDatasourceStatusType = {
	prometheusUrl: string;
	pushgatewayUrl: string;
	prometheusReady: boolean;
	pushgatewayReady: boolean;
	targetCount: number;
	enabledTargetCount: number;
	ruleCount: number;
	firingCount: number;
	metricNames: string[];
	message: string;
};

declare type MonitorOverviewType = {
	firing: number;
	pending: number;
	collectFailed: number;
	enabledTargets: number;
};

declare type MonitorRuleTestResultType = {
	expression: string;
	matched: number;
	hit: number;
	values: number[];
	message: string;
};

declare type RowCmdbTagType = {
	id: number;
	name: string;
	color: string;
	remark: string;
	createBy: string;
	createdAt: string;
	updatedAt: string;
};

declare type RowCmdbAssetType = {
	id: number;
	modelType: string;
	name: string;
	sn: string;
	ip: string;
	status: number;
	owner: string;
	provider: string;
	location: string;
	expiredAt: string | null;
	attrs: string;
	source: string;
	instanceId: number;
	remark: string;
	createBy: string;
	createdAt: string;
	updatedAt: string;
	tags?: RowCmdbTagType[];
};

declare type RowCmdbRelationType = {
	id: number;
	sourceId: number;
	sourceName: string;
	targetId: number;
	targetName: string;
	relationType: string;
	remark: string;
};

declare type RowCmdbChangeLogType = {
	id: number;
	assetId: number;
	action: string;
	detail: string;
	createBy: string;
	createdAt: string;
};

declare type CmdbGraphNode = {
	id: number;
	name: string;
	modelType: string;
	status: number;
};

declare type CmdbGraphEdge = {
	source: number;
	target: number;
	type: string;
	sourceName?: string;
	targetName?: string;
};

declare type CmdbGraphDataType = {
	nodes: CmdbGraphNode[];
	edges: CmdbGraphEdge[];
	truncated: boolean;
};

declare type RowCmdbSubnetType = {
	id: number;
	name: string;
	cidr: string;
	gateway: string;
	vlan: string;
	remark: string;
	createBy: string;
	createdAt: string;
	updatedAt: string;
};

declare type CmdbSubnetUsageType = {
	ip: string;
	kind: string;
	id: number;
	name: string;
	owner: string;
	status: string;
	location: string;
};

declare type CmdbUsageResultType = {
	capacity: number;
	used: number;
	usage: CmdbSubnetUsageType[];
};

// Logs 日志中心
declare type RowLogSourceType = {
	id: number;
	name: string;
	instanceId: number;
	instanceName: string;
	instanceIp: string;
	keyId: number;
	path: string;
	job: string;
	source: string;
	labels: string;
	levelRegex: string;
	enabled: string;
	intervalSec: number;
	timeoutSec: number;
	maxBytes: number;
	backBytes: number;
	lastInode: number;
	lastPos: number;
	lastFile: string;
	lastLines: number;
	lastDrop: number;
	lastCollectAt: string | null;
	lastStatus: number;
	lastError: string;
	createBy: string;
	updateBy: string;
	remark: string;
	createdAt: string;
	updatedAt: string;
};

declare interface LogSourceTableType extends TableType {
	data: RowLogSourceType[];
}

declare interface LogSourceState {
	tableData: LogSourceTableType;
}

declare type RowLogAlertRuleType = {
	id: number;
	name: string;
	selector: string;
	host: string;
	source: string;
	keyword: string;
	level: string;
	windowSec: number;
	threshold: number;
	severity: number;
	cooldownSec: number;
	silenceUntil: number;
	muted: string;
	channelIds: string;
	groupByHost: string;
	enabled: string;
	createBy: string;
	updateBy: string;
	remark: string;
	createdAt: string;
	updatedAt: string;
};

declare interface LogAlertRuleTableType extends TableType {
	data: RowLogAlertRuleType[];
}

declare interface LogAlertRuleState {
	tableData: LogAlertRuleTableType;
}

declare type LogLineType = {
	timestamp: string;
	line: string;
	labels: Record<string, string>;
};

declare type LogHistogramPointType = {
	timestamp: number;
	value: number;
};

declare type LogDatasourceStatusType = {
	available: boolean;
	url: string;
};

declare type LogAlertTestSampleType = {
	labels: Record<string, string>;
	value: number;
	timestamp: string;
};

declare type LogAlertTestResultType = {
	logql: string;
	samples: LogAlertTestSampleType[];
	hit: boolean;
};

declare type RowLoginLogType = {
	id: number;
	userName: string;
	userId: number;
	result: number;
	reason: string;
	ipAddr: string;
	location: string;
	userAgent: string;
	browser: string;
	os: string;
	platform: string;
	deptId: number;
	createdAt: string;
};

declare interface LoginLogTableType extends TableType {
	data: RowLoginLogType[];
}

declare interface LoginLogState {
	tableData: LoginLogTableType;
}

declare type LogTopItemType = {
	name: string;
	count: number;
};

declare type LoginTrendPointType = {
	date: string;
	success: number;
	fail: number;
};

declare type LoginOverviewType = {
	days: number;
	total: number;
	success: number;
	fail: number;
	successRate: number;
	trend: LoginTrendPointType[];
	failUsers: LogTopItemType[];
	failIps: LogTopItemType[];
	activeUsers: LogTopItemType[];
	suspicious: LogTopItemType[];
};

declare type RowAuditLogType = {
	id: number;
	deptId: number;
	createUser: string;
	method: string;
	requestUri: string;
	params: string;
	resp: string;
	ipAddr: string;
	statusCode: string;
	costTimeMs: number;
	operModule: string;
	operType: string;
	sensitive: string;
	bizCode: string;
	bizMsg: string;
	userAgent: string;
	operateAt: string;
	remark: string;
	createdAt: string;
};

declare interface AuditLogTableType extends TableType {
	data: RowAuditLogType[];
}

declare interface AuditLogState {
	tableData: AuditLogTableType;
}

declare type AuditSlowApiType = {
	requestUri: string;
	cnt: number;
	avgCostMs: number;
	maxCostMs: number;
};

declare type AuditOverviewType = {
	hours: number;
	total: number;
	fail: number;
	sensitive: number;
	modules: LogTopItemType[];
	operators: LogTopItemType[];
	sensitiveOps: LogTopItemType[];
	slowApis: AuditSlowApiType[];
};