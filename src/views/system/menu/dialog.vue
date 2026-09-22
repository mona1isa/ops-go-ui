<template>
	<div class="system-menu-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="769px">
			<el-form ref="menuDialogFormRef" :model="state.ruleForm" size="default" label-width="80px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="上级菜单" prop="parentId">
							<el-cascader
								:options="state.menuData"
								:props="{ checkStrictly: true, value: 'id', label: 'title' }"
								placeholder="请选择上级菜单"
								clearable
								class="w100"
								v-model="state.ruleForm.ids"
							>
								<template #default="{ node, data }">
									<span>{{ data.title }}</span>
									<span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
								</template>
							</el-cascader>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="菜单类型" prop="type">
							<el-radio-group v-model="state.ruleForm.type">
								<el-radio label="C">目录</el-radio>
								<el-radio label="M">菜单</el-radio>
								<el-radio label="F">按钮</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="菜单名称" prop="name">
							<el-input v-model="state.ruleForm.name" clearable></el-input>
						</el-form-item>
					</el-col>
					<template v-if="state.ruleForm.type !== 'F'">
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="路由路径" prop="path">
								<el-input v-model="state.ruleForm.path" placeholder="路由中的 path 值" clearable></el-input>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="菜单图标" prop="icon">
								<IconSelector placeholder="请输入菜单图标" v-model="state.ruleForm.icon" />
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="组件路径" prop="component">
								<el-input v-model="state.ruleForm.component" placeholder="组件路径" clearable></el-input>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="链接地址" prop="url">
								<el-input
									v-model="state.ruleForm.url"
									placeholder="外链/内嵌时链接地址（http:xxx.com）"
									clearable
									:disabled="!state.ruleForm.isLink"
								>
								</el-input>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="权限标识" prop="perms">
								<el-input v-model="state.ruleForm.perms" placeholder="请输入权限标识" clearable></el-input>
							</el-form-item>
						</el-col>
					</template>
					<template v-if="state.ruleForm.type === 'F'">
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="权限标识" prop="perms">
								<el-input v-model="state.ruleForm.perms" placeholder="请输入权限标识" clearable></el-input>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="接口地址" prop="requestUrl">
								<el-input v-model="state.ruleForm.requestUrl" placeholder="接口请求地址" clearable></el-input>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="请求方式" prop="requestMethod">
								<el-select v-model="state.ruleForm.requestMethod" placeholder="请求方式" clearable class="w100">
									<el-option label="GET" value="GET"></el-option>
									<el-option label="POST" value="POST"></el-option>
									<el-option label="PUT" value="PUT"></el-option>
									<el-option label="DELETE" value="DELETE"></el-option>
								</el-select>
							</el-form-item>
						</el-col>
					</template>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="菜单排序" prop="orderNum">
							<el-input-number v-model="state.ruleForm.orderNum" controls-position="right" placeholder="请输入排序" class="w100" />
						</el-form-item>
					</el-col>
					<template v-if="state.ruleForm.type === 'M'">
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="是否隐藏" prop="isHide">
								<el-radio-group v-model="state.ruleForm.isHide">
									<el-radio :label="true">隐藏</el-radio>
									<el-radio :label="false">不隐藏</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="页面缓存" prop="keepAlive">
								<el-radio-group v-model="state.ruleForm.keepAlive">
									<el-radio :label="true">缓存</el-radio>
									<el-radio :label="false">不缓存</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="是否固定" prop="isAffix">
								<el-radio-group v-model="state.ruleForm.isAffix">
									<el-radio :label="true">固定</el-radio>
									<el-radio :label="false">不固定</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="是否外链" prop="isLink">
								<el-radio-group v-model="state.ruleForm.isLink" :disabled="state.ruleForm.isLink">
									<el-radio :label="true">是</el-radio>
									<el-radio :label="false">否</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="是否内嵌" prop="isIframe">
								<el-radio-group v-model="state.ruleForm.isIframe" @change="onSelectIframeChange">
									<el-radio :label="true">是</el-radio>
									<el-radio :label="false">否</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
					</template>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">	
						<el-form-item label="状态" prop="status">
							<el-radio-group v-model="state.ruleForm.status">
								<el-radio :label="true">启用</el-radio>
								<el-radio :label="false">禁用</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button plain type="info" @click="onCancel" size="default">取 消</el-button>
					<el-button plain type="primary" @click="onSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="systemMenuDialog">
import { defineAsyncComponent, reactive, onMounted, ref, computed, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoutesList } from '/@/stores/routesList';
import { i18n } from '/@/i18n/index';
import { setBackEndControlRefreshRoutes } from "/@/router/backEnd";
import { useMenuApi } from '/@/api/menu';
import { ElMessage } from 'element-plus';

// 菜单API接口
const menuApi = useMenuApi();

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 引入组件
const IconSelector = defineAsyncComponent(() => import('/@/components/iconSelector/index.vue'));

// 定义变量内容
const menuDialogFormRef = ref();
const stores = useRoutesList();
const { routesList } = storeToRefs(stores);
const state = reactive({
	// 参数请参考 `/src/router/route.ts` 中的 `dynamicRoutes` 路由菜单格式
	ruleForm: {
		ids: [] as number[], // 仅添加/编辑时使用,用户接收级联选择的父级菜单ID列表
		parentId: 0, // 上级菜单Id
		type: 'menu', // 菜单类型
		name: '', // 菜单名称
		component: '', // 组件路径
		componentAlias: '', // 组件路径别名
		isLink: false, // 是否外链 外链/内嵌时链接地址（http:xxx.com），开启外链条件，`1、isLink: 链接地址不为空`
		orderNum: 0, // 菜单排序
		path: '', // 路由路径
		title: '', // 菜单名称
		icon: '', // 菜单图标
		isHide: false, // 是否隐藏
		keepAlive: true, // 是否缓存
		isAffix: false, // 是否固定
		isIframe: false, // 是否内嵌，开启条件，`1、isIframe:true 2、isLink：链接地址不为空`
		roles: '', // 权限标识，取角色管理
		perms: '', // 菜单类型为按钮时，权限标识
		url: '', // 外链/内嵌时链接地址（http:xxx.com）
		status: true, // 状态: true 启用  false 禁用
		requestUrl: '',  // 接口请求地址
		requestMethod: '', // 请求方式
	},
	menuData: [] as RouteItems, // 上级菜单数据
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 获取 pinia 中的路由
const getMenuData = (routes: RouteItems) => {
	const arr: RouteItems = [];
	routes.map((val: RouteItem) => {
		val['title'] = i18n.global.t(val.meta?.title as string);
		arr.push({ ...val });
		if (val.children) getMenuData(val.children);
	});
	return arr;
};
// 打开弹窗
const openDialog = (type: string, row?: any) => {
	
	if (type === 'edit') {
		state.ruleForm = JSON.parse(JSON.stringify(row));

		// 设置上级菜单路径
        state.ruleForm.ids = getParentIds(state.menuData, state.ruleForm.parentId);

		state.dialog.title = '修改菜单';
		state.dialog.submitTxt = '修 改';
	} else {
		state.dialog.title = '新增菜单';
		state.dialog.submitTxt = '新 增';
		// 清空表单，此项需加表单验证才能使用
		nextTick(() => {
			menuDialogFormRef.value.resetFields();
		});
		// 如果传入了当前行，默认上级菜单设为当前行
		if (row && row.id) {
			state.ruleForm.parentId = row.id;
			state.ruleForm.ids = getParentIds(state.menuData, row.id);
		} else {
			state.ruleForm.parentId = 0;
			state.ruleForm.ids = [];
		}
	}
	state.dialog.type = type;
	state.dialog.isShowDialog = true;
};
// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
};
// 是否内嵌下拉改变
const onSelectIframeChange = () => {
	if (state.ruleForm.isIframe) {
		state.ruleForm.isLink = true;
	} else {
		state.ruleForm.isLink = false;
	}
};
// 取消
const onCancel = () => {
	closeDialog();
};
// 提交
const parentId = computed(() => {
  const ids: number[] = state.ruleForm.ids; // 明确类型为数组
  return ids[ids.length - 1]; // 取最后一级
});

// 修改菜单回显上级菜单
// 获取从根到当前节点的 ID 数组
const getParentIds = (menuData: RouteItems, parentId: number): number[] => {
    for (const item of menuData) {
        if (item.id === parentId) {
            return [item.id];
        }
        if (item.children) {
            const childPath = getParentIds(item.children, parentId);
            if (childPath.length) {
                return [item.id, ...childPath];
            }
        }
    }
    return [];
};

const onSubmit = () => {
	if (state.dialog.type === 'add') { // 新增菜单
		menuApi.addMenu({
			...state.ruleForm,
			parentId: parentId.value
		}).then((res) => {
			if (res && res.code === 200) {
				ElMessage.success('新增成功');
				emit('refresh');
			}
		});
	 } else if (state.dialog.type === 'edit') { // 修改菜单
		menuApi.editMenu({
			...state.ruleForm,
			parentId: parentId.value
		}).then((res) => {
			if (res && res.code === 200) {
				ElMessage.success('修改成功');
				emit('refresh');
			}
		});
	} 
	closeDialog(); // 关闭弹窗
	setBackEndControlRefreshRoutes() // 刷新菜单，未进行后端接口测试
	
};
// 页面加载时
onMounted(() => {
	state.menuData = getMenuData(routesList.value);
});

// 暴露变量
defineExpose({
	openDialog,
});
</script>
