<template>
	<div class="watermark-container" :style="watermarkStyle"></div>
</template>

<script setup lang="ts" name="watermark">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserInfo } from '/@/stores/userInfo';

const storesUserInfo = useUserInfo();
const { userInfos } = storeToRefs(storesUserInfo);

// 水印配置
const props = defineProps({
	text: {
		type: String,
		default: '',
	},
	fontSize: {
		type: Number,
		default: 16,
	},
	gap: {
		type: Number,
		default: 100,
	},
	color: {
		type: String,
		default: 'rgba(0, 0, 0, 0.15)',
	},
	rotate: {
		type: Number,
		default: -20,
	},
});

// 获取水印文字
const watermarkText = computed(() => {
	return props.text || userInfos.value.username || 'ops-go';
});

// 生成水印背景
const generateWatermark = () => {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) return '';

	const text = watermarkText.value;
	const fontSize = props.fontSize;
	const gap = props.gap;
	const rotate = (props.rotate * Math.PI) / 180;

	// 计算canvas大小
	const textWidth = text.length * fontSize;
	canvas.width = gap + textWidth;
	canvas.height = gap + textWidth;

	// 设置字体样式
	ctx.font = `${fontSize}px Arial, sans-serif`;
	ctx.fillStyle = props.color;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// 旋转并绘制文字
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate(rotate);
	ctx.fillText(text, 0, 0);

	// 返回base64图片
	return canvas.toDataURL('image/png');
};

// 水印样式
const watermarkStyle = ref({});

const updateWatermark = () => {
	const base64Url = generateWatermark();
	watermarkStyle.value = {
		position: 'fixed',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		'pointer-events': 'none',
		'z-index': 9999,
		'background-image': `url(${base64Url})`,
		'background-repeat': 'repeat',
	};
};

// 监听用户信息变化
watch(
	() => userInfos.value.username,
	() => {
		updateWatermark();
	}
);

// 监听属性变化
watch(
	() => props,
	() => {
		updateWatermark();
	},
	{ deep: true }
);

onMounted(() => {
	updateWatermark();
});
</script>

<style scoped lang="scss">
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
