<template>
    <div class="layout-padding">
        <div class="layout-padding-auto layout-padding-view">
            <el-card shadow="hover" class="mb15">
                <div class="app-search">
                    <span class="toolbar-label">模型类型</span>
                    <el-checkbox-group v-model="state.modelTypes" @change="loadGraph" style="margin-left: 10px">
                        <el-checkbox v-for="m in cmdbModelTypes" :key="m.value" :label="m.value">{{ m.label }}</el-checkbox>
                    </el-checkbox-group>
                    <template v-if="state.focusNode">
                        <span class="toolbar-label ml15">邻域深度</span>
                        <el-select v-model="state.depth" size="small" style="width: 90px; margin-left: 8px" @change="loadGraph">
                            <el-option v-for="d in [1, 2, 3]" :key="d" :label="`${d} 层`" :value="d" />
                        </el-select>
                        <el-tag type="warning" size="small" class="ml10">已聚焦：{{ state.focusNode.name }}</el-tag>
                    </template>
                    <el-button size="default" plain type="info" class="ml10" @click="resetFocus">
                        <el-icon><ele-Refresh /></el-icon>
                        {{ state.focusNode ? '返回全量' : '刷新' }}
                    </el-button>
                    <el-button v-if="state.focusNode" size="default" plain type="primary" class="ml10" @click="onOpenDetail(state.focusNode.id)">查看该资产详情</el-button>
                </div>
                <div v-if="state.truncated" class="mt10">
                    <el-alert type="warning" :closable="false" show-icon title="资产关系节点过多，当前仅展示前 300 个节点，请缩小模型类型范围或聚焦单个资产。" />
                </div>
            </el-card>

            <el-card shadow="hover" body-style="padding: 0">
                <div v-loading="state.loading" class="graph-wrap">
                    <div ref="graphRef" class="graph-canvas"></div>
                    <el-empty v-if="!state.loading && state.empty" description="暂无资产关联关系，可在资产详情中添加关联" class="graph-empty" />
                </div>
            </el-card>

            <AssetDetail ref="assetDetailRef" />
        </div>
    </div>
</template>

<script setup lang="ts" name="cmdbTopologyIndex">
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import { useCmdbApi } from '/@/api/cmdb';
import { cmdbModelTypes, modelLabel, modelColor, statusOption, relationLabel } from '/@/views/cmdb/asset/schema';

const AssetDetail = defineAsyncComponent(() => import('/@/views/cmdb/asset/detail.vue'));

const cmdbApi = useCmdbApi();
const graphRef = ref<HTMLDivElement>();
const assetDetailRef = ref();
let chart: echarts.ECharts | null = null;

const state = reactive({
    loading: false,
    modelTypes: cmdbModelTypes.map((m) => m.value) as string[],
    depth: 1,
    focusNode: null as { id: number; name: string } | null,
    truncated: false,
    empty: false,
});

const onResize = () => chart?.resize();

const renderChart = (nodes: any[], edges: any[]) => {
    if (!graphRef.value) return;
    if (!chart) {
        chart = echarts.init(graphRef.value);
        chart.on('click', (params: any) => {
            if (params.dataType === 'node') {
                const id = Number(params.data.assetId);
                if (id) {
                    state.focusNode = { id, name: params.data.name };
                    loadGraph();
                }
            }
        });
        window.addEventListener('resize', onResize);
    }
    const categories = cmdbModelTypes.map((m) => ({ name: m.label, itemStyle: { color: m.color } }));
    chart.setOption(
        {
            tooltip: {
                formatter: (params: any) => {
                    if (params.dataType === 'edge') {
                        return `${params.data.sourceName} ${relationLabel(params.data.relationType)} ${params.data.targetName}`;
                    }
                    const d = params.data;
                    return `<b>${d.name}</b><br/>模型：${modelLabel(d.modelType)}<br/>状态：${statusOption(d.status)?.label ?? d.status}<br/><span style="color:#999">点击节点聚焦邻域</span>`;
                },
            },
            legend: {
                data: categories.map((c) => c.name),
                top: 8,
                selectedMode: 'multiple',
            },
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    roam: true,
                    draggable: true,
                    data: nodes.map((n) => ({
                        id: String(n.id),
                        assetId: n.id,
                        name: n.name,
                        modelType: n.modelType,
                        status: n.status,
                        category: cmdbModelTypes.findIndex((m) => m.value === n.modelType),
                        symbolSize: state.focusNode && state.focusNode.id === n.id ? 46 : 30,
                        itemStyle: { color: modelColor(n.modelType) },
                        label: { show: true, position: 'bottom', fontSize: 11 },
                    })),
                    edges: edges.map((e) => ({
                        source: String(e.source),
                        target: String(e.target),
                        relationType: e.type,
                        sourceName: e.sourceName,
                        targetName: e.targetName,
                        label: { show: true, formatter: relationLabel(e.type), fontSize: 10, color: '#909399' },
                    })),
                    categories,
                    force: { repulsion: 260, edgeLength: [80, 160], gravity: 0.08 },
                    lineStyle: { color: '#b1b1b1', curveness: 0.1, opacity: 0.7 },
                    emphasis: { focus: 'adjacency', lineStyle: { width: 2 } },
                },
            ],
        },
        true,
    );
    chart.resize();
};

const loadGraph = async () => {
    state.loading = true;
    try {
        let res: any;
        if (state.focusNode) {
            res = await cmdbApi.getGraph({ rootId: state.focusNode.id, depth: state.depth });
        } else {
            const types = state.modelTypes.length === cmdbModelTypes.length ? {} : { modelTypes: state.modelTypes };
            res = await cmdbApi.getGraphAll(types);
        }
        if (res && res.code == 200) {
            const graph = res.data || {};
            const nodes = graph.nodes || [];
            const edges = graph.edges || [];
            state.truncated = !!graph.truncated;
            state.empty = nodes.length === 0;
            if (nodes.length === 0) {
                chart?.dispose();
                chart = null;
            } else {
                // 邻域接口不返回名称，从节点表补齐边的展示名称
                const nameMap = new Map(nodes.map((n: any) => [n.id, n.name]));
                edges.forEach((e: any) => {
                    e.sourceName = e.sourceName || nameMap.get(e.source) || e.source;
                    e.targetName = e.targetName || nameMap.get(e.target) || e.target;
                });
                await nextTick();
                renderChart(nodes, edges);
            }
        }
    } catch (error) {
        ElMessage.error('拓扑加载失败');
    } finally {
        state.loading = false;
    }
};

const resetFocus = () => {
    state.focusNode = null;
    loadGraph();
};

const onOpenDetail = (assetId: number) => {
    assetDetailRef.value?.openDrawer(assetId);
};

onMounted(() => {
    loadGraph();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    chart?.dispose();
    chart = null;
});
</script>

<style scoped>
.toolbar-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
}
.ml15 {
    margin-left: 15px;
}
.graph-wrap {
    position: relative;
    height: calc(100vh - 300px);
    min-height: 420px;
}
.graph-canvas {
    width: 100%;
    height: 100%;
}
.graph-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
