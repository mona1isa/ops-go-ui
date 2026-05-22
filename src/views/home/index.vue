<template>
	<div class="home-container layout-pd">
		<el-row :gutter="15" class="home-card-one mb15">
			<el-col
				:xs="24"
				:sm="12"
				:md="12"
				:lg="6"
				:xl="6"
				v-for="(v, k) in state.homeOne"
				:key="k"
				:class="{ 'home-media home-media-lg': k > 1, 'home-media-sm': k === 1 }"
			>
				<div class="home-card-item flex">
					<div class="flex-margin flex w100" :class="` home-one-animation${k}`">
						<div class="flex-auto">
							<span class="font30">{{ v.num1 }}</span>
							<span class="ml5 font16" :style="{ color: v.color1 }">{{ v.num2 }}</span>
							<div class="mt10">{{ v.num3 }}</div>
						</div>
						<div class="home-card-item-icon flex" :style="{ background: `var(${v.color2})` }">
							<i class="flex-margin font32" :class="v.num4" :style="{ color: `var(${v.color3})` }"></i>
						</div>
					</div>
				</div>
			</el-col>
		</el-row>
		<el-row :gutter="15" class="home-card-two mb15">
			<el-col :xs="24" :sm="14" :md="14" :lg="16" :xl="16">
				<div class="home-card-item">
					<div style="height: 100%" ref="homeLineRef"></div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="10" :md="10" :lg="8" :xl="8" class="home-media">
				<div class="home-card-item">
					<div style="height: 100%" ref="homePieRef"></div>
				</div>
			</el-col>
		</el-row>
		<el-row :gutter="15" class="home-card-three">
			<el-col :xs="24" :sm="10" :md="10" :lg="8" :xl="8">
				<div class="home-card-item">
					<div class="home-card-item-title">快捷导航工具</div>
					<div class="home-monitor">
						<div class="flex-warp">
							<div class="flex-warp-item" v-for="(v, k) in state.homeThree" :key="k">
								<div class="flex-warp-item-box" :class="`home-animation${k}`">
									<div class="flex-margin">
										<i :class="v.icon" :style="{ color: v.iconColor }"></i>
										<span class="pl5">{{ v.label }}</span>
										<div class="mt10">{{ v.value }}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="14" :md="14" :lg="16" :xl="16" class="home-media">
				<div class="home-card-item">
					<div style="height: 100%" ref="homeBarRef"></div>
				</div>
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts" name="home">
import { reactive, onMounted, ref, watch, nextTick, onActivated, markRaw } from 'vue';
import * as echarts from 'echarts';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { useTagsViewRoutes } from '/@/stores/tagsViewRoutes';
import { useDashboardApi } from '/@/api/dashboard';
import { ElMessage } from 'element-plus';

const dashboardApi = useDashboardApi();

// 定义变量内容
const homeLineRef = ref();
const homePieRef = ref();
const homeBarRef = ref();
const storesTagsViewRoutes = useTagsViewRoutes();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const { isTagsViewCurrenFull } = storeToRefs(storesTagsViewRoutes);

const formatNumber = (num: number): string => {
	if (num >= 10000) {
		return (num / 10000).toFixed(1) + '万';
	}
	return num.toLocaleString();
};

const state = reactive({
	global: {
		homeChartOne: null,
		homeChartTwo: null,
		homeCharThree: null,
		dispose: [null, '', undefined],
	} as any,
	homeOne: [
		{
			num1: '0',
			num2: '',
			num3: '服务器实例',
			num4: 'iconfont icon-diannao1',
			color1: '#6690F9',
			color2: '--next-color-primary-lighter',
			color3: '--el-color-primary',
		},
		{
			num1: '0',
			num2: '',
			num3: '在线会话',
			num4: 'iconfont icon-yonghu',
			color1: '#36C78B',
			color2: '--next-color-success-lighter',
			color3: '--el-color-success',
		},
		{
			num1: '0',
			num2: '',
			num3: '本月会话',
			num4: 'iconfont icon-renwu',
			color1: '#FF8000',
			color2: '--next-color-warning-lighter',
			color3: '--el-color-warning',
		},
		{
			num1: '0',
			num2: '',
			num3: '危险命令规则',
			num4: 'iconfont icon-gaojing',
			color1: '#FF6462',
			color2: '--next-color-danger-lighter',
			color3: '--el-color-danger',
		},
	],
	homeThree: [
		{ icon: 'iconfont icon-diannao1', label: '服务器管理', value: '0 台', iconColor: '#6690F9' },
		{ icon: 'iconfont icon-yonghu', label: '在线用户', value: '0 人', iconColor: '#36C78B' },
		{ icon: 'iconfont icon-renwu', label: '任务模板', value: '0 个', iconColor: '#FF8000' },
		{ icon: 'iconfont icon-jiaoben', label: '脚本仓库', value: '0 个', iconColor: '#9E87FF' },
		{ icon: 'iconfont icon-gaojing', label: '告警事件', value: '0 条', iconColor: '#FF6462' },
		{ icon: 'iconfont icon-anquan', label: '安全审计', value: '0 条', iconColor: '#FBD4A0' },
		{ icon: 'iconfont icon-wendang', label: '执行记录', value: '0 条', iconColor: '#3BBC86' },
		{ icon: 'iconfont icon-shuju', label: '密钥管理', value: '0 个', iconColor: '#51A3FC' },
		{ icon: 'iconfont icon-xitong', label: '系统健康', value: '正常', iconColor: '#36C78B' },
	],
	myCharts: [] as EmptyArrayType,
	charts: {
		theme: '',
		bgColor: '',
		color: '#303133',
	},
	// 用于存储从后端获取的原始数据
	sessionTrend: [] as { date: string; count: number }[],
	groupDistribution: [] as { name: string; value: number }[],
});

// 加载仪表盘统计数据
const loadDashboardStats = async () => {
	try {
		const res = await dashboardApi.getStats();
		if (res && res.code === 200) {
			const data = res.data;

			// 更新顶部统计卡片
			state.homeOne[0].num1 = formatNumber(data.instanceCount || 0);
			state.homeOne[1].num1 = formatNumber(data.activeSessionCount || 0);
			state.homeOne[2].num1 = formatNumber(data.monthSessionCount || 0);
			state.homeOne[3].num1 = formatNumber(data.dangerousRuleCount || 0);

			// 更新快捷导航
			state.homeThree[0].value = formatNumber(data.instanceCount || 0) + ' 台';
			state.homeThree[1].value = formatNumber(data.activeSessionCount || 0) + ' 人';
			state.homeThree[2].value = formatNumber(data.taskTemplateCount || 0) + ' 个';
			state.homeThree[3].value = formatNumber(data.scriptCount || 0) + ' 个';
			state.homeThree[4].value = formatNumber(data.dangerousRuleCount || 0) + ' 条';
			state.homeThree[5].value = formatNumber(data.totalSessionCount || 0) + ' 条';
			state.homeThree[6].value = formatNumber(data.monthSessionCount || 0) + ' 条';
			state.homeThree[7].value = formatNumber(data.keyCount || 0) + ' 个';

			// 系统健康：在线主机比例
			const instanceCount = data.instanceCount || 0;
			const onlineCount = data.onlineInstanceCount || 0;
			if (instanceCount > 0) {
				const healthRate = ((onlineCount / instanceCount) * 100).toFixed(1);
				state.homeThree[8].value = healthRate + '%';
			} else {
				state.homeThree[8].value = '100%';
			}

			// 存储图表数据
			state.sessionTrend = (data.sessionTrend || []).map((item: any) => ({
				date: item.date,
				count: item.count,
			}));
			state.groupDistribution = (data.groupDistribution || []).map((item: any) => ({
				name: item.name,
				value: item.value,
			}));

			// 重新渲染图表
			nextTick(() => {
				setTimeout(() => initLineChart(), 300);
				setTimeout(() => initPieChart(), 500);
				setTimeout(() => initBarChart(), 700);
			});
		}
	} catch (error) {
		ElMessage.error('加载仪表盘数据失败');
	}
};

// 折线图 - 会话趋势
const initLineChart = () => {
	if (!state.global.dispose.some((b: any) => b === state.global.homeChartOne)) state.global.homeChartOne.dispose();
	state.global.homeChartOne = markRaw(echarts.init(homeLineRef.value, state.charts.theme));

	const dates = state.sessionTrend.length > 0
		? state.sessionTrend.map((item: any) => item.date)
		: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
	const values = state.sessionTrend.length > 0
		? state.sessionTrend.map((item: any) => item.count)
		: [0, 41, 30, 65, 53, 53, 53, 41, 30, 65, 53, 10];

	const option = {
		backgroundColor: state.charts.bgColor,
		title: {
			text: '会话连接趋势（最近30天）',
			x: 'left',
			textStyle: { fontSize: '15', color: state.charts.color },
		},
		grid: { top: 70, right: 20, bottom: 30, left: 50 },
		tooltip: { trigger: 'axis' },
		legend: { data: ['会话数量'], right: 0 },
		xAxis: {
			data: dates,
			axisLabel: { rotate: 45, fontSize: 11 },
		},
		yAxis: [
			{
				type: 'value',
				name: '会话数',
				splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f5f5f5' } },
			},
		],
		series: [
			{
				name: '会话数量',
				type: 'line',
				symbolSize: 6,
				symbol: 'circle',
				smooth: true,
				data: values,
				lineStyle: { color: '#fe9a8b' },
				itemStyle: { color: '#fe9a8b', borderColor: '#fe9a8b' },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: '#fe9a8bb3' },
						{ offset: 1, color: '#fe9a8b03' },
					]),
				},
			},
		],
	};
	state.global.homeChartOne.setOption(option);
	state.myCharts.push(state.global.homeChartOne);
};

// 饼图 - 主机分组分布
const initPieChart = () => {
	if (!state.global.dispose.some((b: any) => b === state.global.homeChartTwo)) state.global.homeChartTwo.dispose();
	state.global.homeChartTwo = markRaw(echarts.init(homePieRef.value, state.charts.theme));

	let data: any[] = [];
	let getname: string[] = [];

	if (state.groupDistribution.length > 0) {
		data = state.groupDistribution.map((item: any) => ({ name: item.name, value: item.value }));
		getname = state.groupDistribution.map((item: any) => item.name);
	} else {
		getname = ['默认分组'];
		data = [{ name: '默认分组', value: 0 }];
	}

	const colorList = ['#51A3FC', '#36C78B', '#FEC279', '#968AF5', '#E790E8', '#FF6462', '#6690F9', '#3BBC86'];
	const option = {
		backgroundColor: state.charts.bgColor,
		title: {
			text: '主机分组分布',
			x: 'left',
			textStyle: { fontSize: '15', color: state.charts.color },
		},
		tooltip: { trigger: 'item', formatter: '{b} <br/> {c} 台' },
		legend: {
			type: 'scroll',
			orient: 'vertical',
			right: '0%',
			left: '65%',
			top: 'center',
			itemWidth: 14,
			itemHeight: 14,
			data: getname,
			textStyle: {
				rich: {
					name: {
						fontSize: 14,
						fontWeight: 400,
						width: 200,
						height: 35,
						padding: [0, 0, 0, 60],
						color: state.charts.color,
					},
					rate: {
						fontSize: 15,
						fontWeight: 500,
						height: 35,
						width: 40,
						padding: [0, 0, 0, 30],
						color: state.charts.color,
					},
				},
			},
		},
		series: [
			{
				type: 'pie',
				radius: ['82', themeConfig.value.isIsDark ? '50' : '102'],
				center: ['32%', '50%'],
				itemStyle: {
					color: function (params: any) {
						return colorList[params.dataIndex % colorList.length];
					},
				},
				label: { show: false },
				labelLine: { show: false },
				data: data,
			},
		],
	};
	state.global.homeChartTwo.setOption(option);
	state.myCharts.push(state.global.homeChartTwo);
};

// 柱状图 - 系统资源概览（静态演示数据，无真实数据源）
const initBarChart = () => {
	if (!state.global.dispose.some((b: any) => b === state.global.homeCharThree)) state.global.homeCharThree.dispose();
	state.global.homeCharThree = markRaw(echarts.init(homeBarRef.value, state.charts.theme));
	const option = {
		backgroundColor: state.charts.bgColor,
		title: {
			text: '系统资源概览（TOP6 主机）',
			x: 'left',
			textStyle: { fontSize: '15', color: state.charts.color },
		},
		tooltip: { trigger: 'axis' },
		legend: { data: ['CPU 核数', '内存 (GB)', '磁盘 (GB)'], right: 0 },
		grid: { top: 70, right: 80, bottom: 30, left: 80 },
		xAxis: [
			{
				type: 'category',
				data: ['主机1', '主机2', '主机3', '主机4', '主机5', '主机6'],
				boundaryGap: true,
				axisTick: { show: false },
			},
		],
		yAxis: [
			{
				name: '数量',
				nameLocation: 'middle',
				nameTextStyle: { padding: [3, 4, 50, 6] },
				splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f5f5f5' } },
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: { color: state.charts.color, formatter: '{value} ' },
			},
		],
		series: [
			{
				name: 'CPU 核数',
				type: 'bar',
				barWidth: 20,
				itemStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: 'rgba(250,180,101,0.8)' },
						{ offset: 1, color: 'rgba(250,180,101,0.2)' },
					]),
					borderRadius: [4, 4, 0, 0],
				},
				data: [4, 8, 16, 32, 8, 4],
			},
			{
				name: '内存 (GB)',
				type: 'bar',
				barWidth: 20,
				itemStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: 'rgba(59, 188, 134, 0.8)' },
						{ offset: 1, color: 'rgba(59, 188, 134, 0.2)' },
					]),
					borderRadius: [4, 4, 0, 0],
				},
				data: [8, 16, 32, 64, 16, 8],
			},
			{
				name: '磁盘 (GB)',
				type: 'bar',
				barWidth: 20,
				itemStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: 'rgba(81, 163, 252, 0.8)' },
						{ offset: 1, color: 'rgba(81, 163, 252, 0.2)' },
					]),
					borderRadius: [4, 4, 0, 0],
				},
				data: [100, 200, 500, 1000, 200, 100],
			},
		],
	};
	state.global.homeCharThree.setOption(option);
	state.myCharts.push(state.global.homeCharThree);
};

// 批量设置 echarts resize
const initEchartsResizeFun = () => {
	nextTick(() => {
		for (let i = 0; i < state.myCharts.length; i++) {
			setTimeout(() => {
				state.myCharts[i].resize();
			}, i * 1000);
		}
	});
};

// 批量设置 echarts resize
const initEchartsResize = () => {
	window.addEventListener('resize', initEchartsResizeFun);
};

// 页面加载时
onMounted(() => {
	initEchartsResize();
	loadDashboardStats();
});

// 由于页面缓存原因，keep-alive
onActivated(() => {
	initEchartsResizeFun();
});

// 监听 pinia 中的 tagsview 开启全屏变化，重新 resize 图表，防止不出现/大小不变等
watch(
	() => isTagsViewCurrenFull.value,
	() => {
		initEchartsResizeFun();
	}
);

// 监听 pinia 中是否开启深色主题
watch(
	() => themeConfig.value.isIsDark,
	(isIsDark) => {
		nextTick(() => {
			state.charts.theme = isIsDark ? 'dark' : '';
			state.charts.bgColor = isIsDark ? 'transparent' : '';
			state.charts.color = isIsDark ? '#dadada' : '#303133';
			setTimeout(() => {
				initLineChart();
			}, 500);
			setTimeout(() => {
				initPieChart();
			}, 700);
			setTimeout(() => {
				initBarChart();
			}, 1000);
		});
	},
	{
		deep: true,
		immediate: true,
	}
);
</script>

<style scoped lang="scss">
$homeNavLengh: 8;
.home-container {
	overflow: hidden;
	.home-card-one,
	.home-card-two,
	.home-card-three {
		.home-card-item {
			width: 100%;
			height: 130px;
			border-radius: 4px;
			transition: all ease 0.3s;
			padding: 20px;
			overflow: hidden;
			background: var(--el-color-white);
			color: var(--el-text-color-primary);
			border: 1px solid var(--next-border-color-light);
			&:hover {
				box-shadow: 0 2px 12px var(--next-color-dark-hover);
				transition: all ease 0.3s;
			}
			&-icon {
				width: 70px;
				height: 70px;
				border-radius: 100%;
				flex-shrink: 1;
				i {
					color: var(--el-text-color-placeholder);
				}
			}
			&-title {
				font-size: 15px;
				font-weight: bold;
				height: 30px;
			}
		}
	}
	.home-card-one {
		@for $i from 0 through 3 {
			.home-one-animation#{$i} {
				opacity: 0;
				animation-name: error-num;
				animation-duration: 0.5s;
				animation-fill-mode: forwards;
				animation-delay: calc($i/4) + s;
			}
		}
	}
	.home-card-two,
	.home-card-three {
		.home-card-item {
			height: 400px;
			width: 100%;
			overflow: hidden;
			.home-monitor {
				height: 100%;
				.flex-warp-item {
					width: 25%;
					height: 111px;
					display: flex;
					.flex-warp-item-box {
						margin: auto;
						text-align: center;
						color: var(--el-text-color-primary);
						display: flex;
						border-radius: 5px;
						background: var(--next-bg-color);
						cursor: pointer;
						transition: all 0.3s ease;
						&:hover {
							background: var(--el-color-primary-light-9);
							transition: all 0.3s ease;
						}
					}
					@for $i from 0 through $homeNavLengh {
						.home-animation#{$i} {
							opacity: 0;
							animation-name: error-num;
							animation-duration: 0.5s;
							animation-fill-mode: forwards;
							animation-delay: calc($i/10) + s;
						}
					}
				}
			}
		}
	}
}
</style>
