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
	os: string;
	ip: string;
	createAt: string;
	updateAt: string;
	createBy: string;
	updateBy: string;
	remark: string;
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