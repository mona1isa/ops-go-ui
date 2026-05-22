<template>
	<el-form size="large" class="login-content-form">
		<el-form-item class="login-animation1">
			<el-input text :placeholder="$t('message.account.accountPlaceholder1')" v-model="state.ruleForm.username" clearable autocomplete="off" aria-label="用户名">
				<template #prefix>
					<el-icon class="el-input__icon"><ele-User /></el-icon>
				</template>
			</el-input>
		</el-form-item>
		<el-form-item class="login-animation2">
			<el-input
				:type="state.isShowPassword ? 'text' : 'password'"
				:placeholder="$t('message.account.accountPlaceholder2')"
				v-model="state.ruleForm.password"
				autocomplete="off"
					aria-label="密码"
			>
				<template #prefix>
					<el-icon class="el-input__icon"><ele-Unlock /></el-icon>
				</template>
				<template #suffix>
					<i
						class="iconfont el-input__icon login-content-password"
						:class="state.isShowPassword ? 'icon-yincangmima' : 'icon-xianshimima'"
						@click="state.isShowPassword = !state.isShowPassword"
					>
					</i>
				</template>
			</el-input>
		</el-form-item>
		<el-form-item class="login-animation3" v-if="captchaEnabled">
			<el-col :span="15">
				<el-input
					text
					maxlength="4"
					:placeholder="$t('message.account.accountPlaceholder3')"
					v-model="state.ruleForm.code"
					clearable
					autocomplete="off"
					aria-label="验证码"
				>
					<template #prefix>
						<el-icon class="el-input__icon"><ele-Position /></el-icon>
					</template>
				</el-input>
			</el-col>
			<el-col :span="1"></el-col>
			<el-col :span="8">
				<el-button class="login-content-code" v-waves @click="getCaptchaCode">
					<img class="login-content-code-img" :src="captcha.img" style="max-width: 100%; height: auto;" />
				</el-button>
			</el-col>
		</el-form-item>
		<el-form-item class="login-animation4">
			<el-button type="primary" class="login-content-submit" round v-waves @click="onSignIn" :loading="state.loading.signIn">
				<span>{{ $t('message.account.accountBtnText') }}</span>
			</el-button>
		</el-form-item>
	</el-form>
</template>

<script setup lang="ts" name="loginAccount">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import Cookies from 'js-cookie';
// import { storeToRefs } from 'pinia';
// import { useThemeConfig } from '/@/stores/themeConfig';
import { initBackEndControlRoutes } from '/@/router/backEnd';
import { Session } from '/@/utils/storage';
import { formatAxis } from '/@/utils/formatTime';
import { NextLoading } from '/@/utils/loading';
import { useCaptchaApi, useLoginApi } from '/@/api/login';

// 定义变量内容
const { t } = useI18n();
// const storesThemeConfig = useThemeConfig();
// const { themeConfig } = storeToRefs(storesThemeConfig);
const route = useRoute();
const router = useRouter();
const state = reactive({
	isShowPassword: false,
	ruleForm: {
		username: 'admin',
		password: '123456',
		code: '',
		uuid: '',
	},
	loading: {
		signIn: false,
	},
});

// 定义验证码
const captcha = reactive({
	code: 0,
	img: '',
	uuid: '',
});

// 验证码开关
const captchaEnabled = ref(false);

const captchaApi = useCaptchaApi();

// 页面加载完毕，获取验证码
onMounted(() => {
	getCaptchaCode();

	// 监听Enter键登录
	window.addEventListener('keydown', handleEnterKey);
});

// 处理 Enter 键事件
const handleEnterKey = (event: KeyboardEvent) => {
	if (event.key === 'Enter') {
		onSignIn();
	}
};

// 页面卸载，移除事件监听
onUnmounted(() => {
	window.removeEventListener('keydown', handleEnterKey);
});

// 时间获取
const currentTime = computed(() => {
	return formatAxis(new Date());
});

// 获取验证码
const getCaptchaCode = async () => {
	const response = await captchaApi.getCaptcha();
	captchaEnabled.value = response.captchaEnabled === true;
	if (captchaEnabled.value) {
		captcha.code = response.code;
		captcha.img = "data:image/png;base64," + response.img;
		state.ruleForm.uuid = response.uuid;
	} else {
		captcha.img = '';
		state.ruleForm.uuid = '';
		state.ruleForm.code = '';
	}
};

// 登录
const onSignIn = async () => {
	state.loading.signIn = true;
	try {
		const loginData: any = {
			username: state.ruleForm.username,
			password: state.ruleForm.password,
		};
		if (captchaEnabled.value) {
			loginData.code = state.ruleForm.code;
			loginData.uuid = state.ruleForm.uuid;
		}
		const response = await useLoginApi().signIn(loginData);
		if (response.code === 200) {
			// 存储 token 到浏览器缓存
			Session.set('token', response.token);
			// 模拟数据，对接接口时，记得删除多余代码及对应依赖的引入。用于 `/src/stores/userInfo.ts` 中不同用户登录判断（模拟数据）
			Cookies.set('username', state.ruleForm.username);
			state.loading.signIn = false;
		}

		// 模拟后端控制路由，isRequestRoutes 为 true，则开启后端控制路由
		// 添加完动态路由，再进行 router 跳转，否则可能报错 No match found for location with path "/"
		const isNoPower = await initBackEndControlRoutes();
		// 执行完 initBackEndControlRoutes，再执行 signInSuccess
		signInSuccess(isNoPower);
	} catch (error: any) {
		// ElMessage.error(error.message || '登录失败，请重试');
		state.loading.signIn = false;
		if (captchaEnabled.value) {
			getCaptchaCode();
		}
	}
};
// 登录成功后的跳转
const signInSuccess = (isNoPower: boolean | undefined) => {
	if (isNoPower) {
		ElMessage.warning('抱歉，您没有登录权限');
		Session.clear();
	} else {
		// 初始化登录成功时间问候语
		let currentTimeInfo = currentTime.value;
		// 登录成功，跳到转首页
		// 如果是复制粘贴的路径，非首页/登录页，那么登录成功后重定向到对应的路径中
		if (route.query?.redirect) {
			router.push({
				path: <string>route.query?.redirect,
				query: Object.keys(<string>route.query?.params).length > 0 ? JSON.parse(<string>route.query?.params) : '',
			});
		} else {
			router.push('/');
		}
		// 登录成功提示
		const signInText = t('message.signInText');
		ElMessage.success(`${currentTimeInfo}，${signInText}`);
		// 添加 loading，防止第一次进入界面时出现短暂空白
		NextLoading.start();
	}
	state.loading.signIn = false;
};
</script>

<style scoped lang="scss">
.login-content-form {
	margin-top: 20px;
	@for $i from 1 through 4 {
		.login-animation#{$i} {
			opacity: 0;
			animation-name: error-num;
			animation-duration: 0.5s;
			animation-fill-mode: forwards;
			animation-delay: calc($i/10) + s;
		}
	}
	.login-content-password {
		display: inline-block;
		width: 20px;
		cursor: pointer;
		&:hover {
			color: #909399;
		}
	}
	.login-content-code {
		width: 100%;
		padding: 0;
		font-weight: bold;
		letter-spacing: 5px;
	}
	.login-content-submit {
		width: 100%;
		letter-spacing: 2px;
		font-weight: 300;
		margin-top: 15px;
	}
}
</style>
