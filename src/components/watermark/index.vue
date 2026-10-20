<template>
	<div v-if="enabled" class="watermark-container" :style="watermarkStyle"></div>
</template>

<script setup lang="ts" name="watermark">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserInfo } from '/@/stores/userInfo';
import { useThemeConfig } from '/@/stores/themeConfig';
import legacyWatermark from '/@/utils/watermark';

const storesUserInfo = useUserInfo();
const { userInfos } = storeToRefs(storesUserInfo);
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);

// 水印配置
const props = defineProps({
	text: {
		type: String,
		default: '',
	},
	fontSize: {
		type: Number,
		default: 14,
	},
	gap: {
		type: Number,
		default: 60,
	},
	color: {
		type: String,
		default: 'rgba(0, 0, 0, 0.08)',
	},
	rotate: {
		type: Number,
		default: -20,
	},
});

// 开关与文案跟随「布局设置」中的主题配置
const enabled = computed(() => themeConfig.value.isWartermark);

const watermarkText = computed(() => props.text || themeConfig.value.wartermarkText || 'OPS-GO');

// 副行显示当前用户名，与主文案相同时不重复
const subText = computed(() => {
	const name = userInfos.value.username || '';
	return name && name !== watermarkText.value ? name : '';
});

// 生成水印背景：平铺块按实际文字尺寸计算，避免块过大导致水印稀疏、斜排错位
const generateWatermark = () => {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) return '';

	const text = watermarkText.value;
	const fontSize = props.fontSize;
	const rotate = (props.rotate * Math.PI) / 180;

	ctx.font = `${fontSize}px Arial, sans-serif`;
	const textWidth = Math.max(ctx.measureText(text).width, subText.value ? ctx.measureText(subText.value).width : 0);

	// 旋转后文字占用的外接框尺寸，加间距作为平铺块
	const cos = Math.abs(Math.cos(rotate));
	const sin = Math.abs(Math.sin(rotate));
	const contentWidth = textWidth * cos + fontSize * 2 * sin;
	const contentHeight = textWidth * sin + fontSize * 2 * cos;
	canvas.width = Math.ceil(contentWidth + props.gap);
	canvas.height = Math.ceil(contentHeight + props.gap);

	ctx.font = `${fontSize}px Arial, sans-serif`;
	ctx.fillStyle = props.color;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate(rotate);
	ctx.fillText(text, 0, 0);
	if (subText.value) ctx.fillText(subText.value, 0, fontSize * 1.5);

	return canvas.toDataURL('image/png');
};

const watermarkStyle = ref({});

const updateWatermark = () => {
	if (!enabled.value) return;
	const base64Url = generateWatermark();
	watermarkStyle.value = {
		'background-image': `url(${base64Url})`,
		'background-repeat': 'repeat',
	};
};

watch([enabled, watermarkText, subText], () => {
	updateWatermark();
});

onMounted(() => {
	// 清理旧版 utils/watermark 直接注入 body 的节点，避免与本组件叠加成双层水印
	legacyWatermark.del();
	updateWatermark();
});
</script>

<style scoped lang="scss">
// 盖住内容但不拦截任何点击
.watermark-container {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 9999;
}
</style>
