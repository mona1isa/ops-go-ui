<template>
	<div class="login-container">
		<!-- 背景装饰色块 -->
		<div class="login-blob login-blob-top" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="1337" width="1337">
				<defs>
					<path
						id="login-path-top"
						opacity="1"
						fill-rule="evenodd"
						d="M1337,668.5 C1337,1037.455193874239 1037.455193874239,1337 668.5,1337 C523.6725684305388,1337 337,1236 370.50000000000006,1094 C434.03835568300906,824.6732385973953 6.906089672974592e-14,892.6277623047779 0,668.5000000000001 C0,299.5448061257611 299.5448061257609,1.1368683772161603e-13 668.4999999999999,0 C1037.455193874239,0 1337,299.544806125761 1337,668.5Z"
					/>
					<linearGradient id="login-grad-top" x1="0.79" y1="0.62" x2="0.21" y2="0.86">
						<stop offset="0" stop-color="rgb(88,62,213)" stop-opacity="1" />
						<stop offset="1" stop-color="rgb(23,215,250)" stop-opacity="1" />
					</linearGradient>
				</defs>
				<g opacity="1">
					<use xlink:href="#login-path-top" fill="url(#login-grad-top)" fill-opacity="1" />
				</g>
			</svg>
		</div>
		<div class="login-blob login-blob-bottom" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="896" width="967.8852157128662">
				<defs>
					<path
						id="login-path-bottom"
						opacity="1"
						fill-rule="evenodd"
						d="M896,448 C1142.6325445712241,465.5747656464056 695.2579309733121,896 448,896 C200.74206902668806,896 5.684341886080802e-14,695.2579309733121 0,448.0000000000001 C0,200.74206902668806 200.74206902668791,5.684341886080802e-14 447.99999999999994,0 C695.2579309733121,0 475,418 896,448Z"
					/>
					<linearGradient id="login-grad-bottom" x1="0.5" y1="0" x2="0.5" y2="1">
						<stop offset="0" stop-color="rgb(40,175,240)" stop-opacity="1" />
						<stop offset="1" stop-color="rgb(18,15,196)" stop-opacity="1" />
					</linearGradient>
				</defs>
				<g opacity="1">
					<use xlink:href="#login-path-bottom" fill="url(#login-grad-bottom)" fill-opacity="1" />
				</g>
			</svg>
		</div>

		<div class="login-main">
			<div class="login-card">
				<header class="login-card-header">
					<div class="login-card-logo">
						<img :src="logoMini" alt="logo" />
					</div>
					<h1>欢迎回来！</h1>
					<p>{{ getThemeConfig.globalTitle }} · {{ getThemeConfig.globalViceTitleMsg }}</p>
				</header>
				<section class="login-card-content">
					<Account />
				</section>
				<footer class="login-card-footer">
					<p class="login-card-footer-tip">忘记密码请联系系统管理员</p>
				</footer>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="loginIndex">
import { defineAsyncComponent, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { NextLoading } from '/@/utils/loading';
import logoMini from '/@/assets/logo.png';

// 引入组件
const Account = defineAsyncComponent(() => import('/@/views/login/component/account.vue'));

// 定义变量内容
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);

// 获取布局配置信息
const getThemeConfig = computed(() => {
	return themeConfig.value;
});

// 页面加载时
onMounted(() => {
	NextLoading.done();
});
</script>

<style scoped lang="scss">
.login-container {
	position: relative;
	height: 100%;
	overflow: hidden;
	background-color: #dbe0f9;
	font-family: 'Roboto', 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
	.login-blob {
		position: absolute;
		pointer-events: none;
		svg {
			display: block;
		}
	}
	.login-blob-top {
		top: -900px;
		right: -300px;
	}
	.login-blob-bottom {
		bottom: -500px;
		left: -200px;
	}
	.login-main {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		position: relative;
		z-index: 1;
	}
	.login-card {
		width: 400px;
		padding: 40px;
		background-color: #fff;
		border-radius: 20px;
		box-shadow: 0 20px 60px rgba(63, 74, 148, 0.18);
		animation: loginCardIn 0.6s ease;
		.login-card-header {
			margin-bottom: 40px;
			.login-card-logo {
				width: 70px;
				height: 70px;
				border-radius: 50px;
				background-color: #6065d9;
				display: flex;
				align-items: center;
				justify-content: center;
				img {
					width: 40px;
					height: 40px;
					border-radius: 50%;
				}
			}
			h1 {
				margin: 40px 0 0;
				color: #6065d9;
				font-size: 35px;
				font-weight: 500;
				line-height: 1.2;
			}
			p {
				margin: 5px 0 0;
				color: #6065d9;
				font-size: 18px;
				font-weight: 300;
			}
		}
		.login-card-content {
			min-height: 190px;
		}
		.login-card-footer {
			display: flex;
			justify-content: center;
			align-items: flex-end;
			margin-top: 40px;
			p {
				margin: 0;
				font-size: 14px;
				font-weight: 100;
				color: #6065d9;
			}
			.login-card-footer-tip {
				color: #9aa0bd;
			}
		}
	}
}

@keyframes loginCardIn {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
