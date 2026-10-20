<template>
	<div class="personal layout-pd">
		<el-row :gutter="20">
			<!-- 个人信息 -->
			<el-col :xs="24" :sm="12">
				<el-card shadow="hover" header="个人信息">
					<div class="personal-user">
						<div class="personal-user-left">
							<el-upload class="h100 personal-user-left-upload" action="https://jsonplaceholder.typicode.com/posts/" multiple :limit="1">
								<img :src="defaultAvator" />
							</el-upload>
						</div>
						<div class="personal-user-right">
							<el-row>
								<el-col :span="24" class="personal-title mb18">{{ currentTime }}，{{ state.personalForm.nickname }}，生活变的再糟糕，也不妨碍我变得更好！ </el-col>
								<el-col :span="24">
									<el-row>
										<el-col :xs="24" :sm="8" class="personal-item mb6">
											<div class="personal-item-label">昵称：</div>
											<div class="personal-item-value">{{ state.personalForm.nickname }}</div>
										</el-col>
										<el-col :xs="24" :sm="16" class="personal-item mb6">
											<div class="personal-item-label">身份：</div>
											<div class="personal-item-value">{{ userInfos.roleNames  }}</div>
										</el-col>
									</el-row>
								</el-col>
								<el-col :span="24">
									<el-row>
										<el-col :xs="24" :sm="8" class="personal-item mb6">
											<div class="personal-item-label">登录IP：</div>
											<div class="personal-item-value">{{ userInfos.ipAddr }}</div>
										</el-col>
										<el-col :xs="24" :sm="16" class="personal-item mb6">
											<div class="personal-item-label">登录时间：</div>
											<div class="personal-item-value">{{ userInfos.loginDate }}</div>
										</el-col>
									</el-row>
								</el-col>
							</el-row>
						</div>
					</div>
				</el-card>
			</el-col>

			<!-- 更新信息 -->
			<el-col :xs="24" :sm="12">
				<el-card shadow="hover" class="personal-edit" header="更新信息">
					<el-tabs v-model="activeTab">
						<el-tab-pane label="基本信息" name="baseInfo">
							<el-form :model="state.personalForm" size="default" label-width="100px">
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item label="昵称" :rules="[{ required: true, message: '请输入昵称', trigger: 'blur' }]">
										<el-input v-model="state.personalForm.nickname" placeholder="请输入昵称" clearable></el-input>
									</el-form-item>
								</el-row>
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item label="邮箱" :rules="[{ required: true, message: '请输入邮箱', trigger: 'blur' }, { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: '请输入正确的邮箱', trigger: 'blur' }]">
										<el-input v-model="state.personalForm.email" placeholder="请输入邮箱" clearable></el-input>
									</el-form-item>
								</el-row>
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item label="手机" :rules="[{ required: true, message: '请输入手机号', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]">
										<el-input v-model="state.personalForm.phone" placeholder="请输入手机" clearable></el-input>
									</el-form-item>
								</el-row>
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item label="性别">
										<el-select v-model="state.personalForm.sex" placeholder="请选择性别" clearable class="w100">
											<el-option label="男" :value="0"></el-option>
											<el-option label="女" :value="1"></el-option>
										</el-select>
									</el-form-item>
								</el-row>
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item>
										<el-button plain type="primary" @click="handleUpdateInfo" v-waves>
											<el-icon>
												<ele-Position />
											</el-icon>
											更新个人信息
										</el-button>
									</el-form-item>
								</el-row>
							</el-form>
						</el-tab-pane>

						<el-tab-pane label="修改密码" name="password">
							<el-form :model="state.passwordForm" size="default" label-width="100px">
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item label="旧密码" :rules="[{ required: true, message: '请输入旧密码', trigger: 'blur' }]">
										<el-input v-model="state.passwordForm.oldPassword" placeholder="请输入旧密码" type="password" show-password clearable></el-input>
									</el-form-item>
								</el-row>
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item label="新密码" :rules="[{ required: true, message: '请输入新密码', trigger: 'blur' }]">
										<el-input v-model="state.passwordForm.newPassword" placeholder="请输入新密码" type="password" show-password clearable></el-input>
									</el-form-item>
								</el-row>
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item label="确认密码" :rules="[{ required: true, message: '请确认新密码', trigger: 'blur' }, { validator: validatePassword, trigger: 'blur' }]">
										<el-input v-model="state.passwordForm.confirmPassword" placeholder="请确认新密码" type="password" show-password clearable></el-input>
									</el-form-item>
								</el-row>
								<el-row :gutter="20" class="update-info-gutter">
									<el-form-item>
										<el-button plain type="primary" @click="handleUpdatePassword" v-waves>
											<el-icon>
												<ele-Position />
											</el-icon>
											更新密码
										</el-button>
									</el-form-item>
								</el-row>
							</el-form>
						</el-tab-pane>

						<el-tab-pane label="MFA 设置" name="mfa">
							<div class="mfa-box">
								<el-alert
									v-if="mfa.required && !mfa.enabled"
									type="warning"
									:closable="false"
									show-icon
									class="mb15"
									title="系统已强制要求开启 MFA 双因素登录，请尽快完成绑定"
								/>
								<template v-if="mfa.enabled && !mfa.binding">
									<el-result icon="success" title="已启用双因素认证" sub-title="登录将在密码校验后要求输入认证器动态验证码">
										<template #extra>
											<el-button type="danger" plain @click="mfa.unbindVisible = true">解绑 MFA</el-button>
										</template>
									</el-result>
								</template>
								<template v-else-if="!mfa.binding">
									<div class="mfa-tip">使用 Google Authenticator、FreeOTP 或Microsoft Authenticator 等应用扫码绑定后，登录时需要额外输入 6 位动态验证码。</div>
									<el-button type="primary" plain :loading="mfa.loading" @click="onMfaBindStart">
										<el-icon><ele-Key /></el-icon>
										绑定认证器
									</el-button>
								</template>
								<template v-else>
									<div class="mfa-bind">
										<div ref="qrRef" class="mfa-qr"></div>
										<div class="mfa-secret">
											<div class="mfa-secret-label">无法扫码？手动输入密钥：</div>
											<el-text type="primary" size="small" class="mfa-secret-value">{{ mfa.secret }}</el-text>
										</div>
										<el-input v-model="mfa.code" maxlength="6" placeholder="输入认证器上的 6 位动态码" class="mfa-code-input" @keyup.enter="onMfaBindConfirm" />
										<div class="mfa-actions">
											<el-button type="primary" :loading="mfa.loading" @click="onMfaBindConfirm">确认绑定</el-button>
											<el-button @click="onMfaBindCancel">取消</el-button>
										</div>
									</div>
								</template>
							</div>

							<!-- 恢复码展示（仅绑定成功时展示一次） -->
							<el-dialog v-model="mfa.recoveryVisible" title="请妥善保存恢复码" width="420px" :close-on-click-modal="false">
								<div class="mfa-tip mb15">每个恢复码仅可使用一次，手机丢失时可用其登录。关闭本窗口后不再展示，可解绑后重新绑定生成。</div>
								<div class="mfa-codes">
									<div v-for="(code, i) in mfa.recoveryCodes" :key="code" class="mfa-code">{{ code }}</div>
								</div>
								<template #footer>
									<el-button @click="copyRecoveryCodes">复制到剪贴板</el-button>
									<el-button type="primary" @click="mfa.recoveryVisible = false">我已保存</el-button>
								</template>
							</el-dialog>

							<!-- 解绑确认 -->
							<el-dialog v-model="mfa.unbindVisible" title="解绑 MFA" width="380px">
								<div class="mfa-tip mb15">解绑后登录将不再要求动态验证码，请输入当前密码确认身份。</div>
								<el-input v-model="mfa.unbindPassword" type="password" show-password placeholder="当前密码" />
								<template #footer>
									<el-button @click="mfa.unbindVisible = false">取消</el-button>
									<el-button type="danger" :loading="mfa.loading" @click="onMfaUnbind">确认解绑</el-button>
								</template>
							</el-dialog>
						</el-tab-pane>
					</el-tabs>
				</el-card>
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts" name="personal">
import { reactive, computed, onMounted, ref, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { formatAxis } from '/@/utils/formatTime';
import QRCode from 'qrcodejs2-fixes';

const activeTab = ref('baseInfo');
const route = useRoute();
import defaultAvator from '/@/assets/default.png';
import { useUserInfo } from '/@/stores/userInfo';
import { useUserInfoApi } from '/@/api/user';
import { useMfaApi } from '/@/api/user/mfa';
import { ElMessage } from 'element-plus';
import { encrypt } from '/@/utils/cryptoUtil';
import { PersonalState } from '/@/types/views';

// 用户接口
const userApi = useUserInfoApi();
const mfaApi = useMfaApi();


const storesUserInfo = useUserInfo();
const { userInfos } = storeToRefs(storesUserInfo);
// 定义变量内容
const state = reactive<PersonalState>({
	personalForm: {
		id: 0,
		nickname: '', 
		email: '',
		phone: '',
		sex: '',
	},
	passwordForm: {
		oldPassword: '',
		newPassword: '',
		confirmPassword: '',
	},
});

// MFA 绑定状态
const qrRef = ref();
const mfa = reactive({
	enabled: false,
	required: false,
	binding: false,
	loading: false,
	secret: '',
	otpauthUrl: '',
	code: '',
	recoveryCodes: [] as string[],
	recoveryVisible: false,
	unbindVisible: false,
	unbindPassword: '',
});

// 加载 MFA 状态
const loadMfaStatus = () => {
	mfaApi.getStatus().then((res: any) => {
		if (res && res.code === 200) {
			mfa.enabled = !!res.data.enabled;
			mfa.required = !!res.data.required;
		}
	});
};

// 发起绑定：获取密钥并本地渲染二维码
const onMfaBindStart = () => {
	mfa.loading = true;
	mfaApi
		.bindStart()
		.then((res: any) => {
			if (res && res.code === 200) {
				mfa.secret = res.data.secret;
				mfa.otpauthUrl = res.data.otpauthUrl;
				mfa.code = '';
				mfa.binding = true;
				nextTick(() => {
					if (qrRef.value) {
						qrRef.value.innerHTML = '';
						new QRCode(qrRef.value, {
							text: mfa.otpauthUrl,
							width: 160,
							height: 160,
							colorDark: '#000000',
							colorLight: '#ffffff',
						});
					}
				});
			} else {
				ElMessage.error(res?.msg || '发起绑定失败');
			}
		})
		.finally(() => {
			mfa.loading = false;
		});
};

// 确认绑定：校验动态码，展示一次性恢复码
const onMfaBindConfirm = () => {
	if (!mfa.code) {
		ElMessage.warning('请输入 6 位动态码');
		return;
	}
	mfa.loading = true;
	mfaApi
		.bindConfirm({ code: mfa.code })
		.then((res: any) => {
			if (res && res.code === 200) {
				mfa.recoveryCodes = res.data.recoveryCodes || [];
				mfa.enabled = true;
				mfa.binding = false;
				mfa.secret = '';
				mfa.code = '';
				mfa.recoveryVisible = true;
				ElMessage.success('绑定成功');
			} else {
				ElMessage.error(res?.msg || '动态码校验失败');
			}
		})
		.finally(() => {
			mfa.loading = false;
		});
};

// 取消绑定
const onMfaBindCancel = () => {
	mfa.binding = false;
	mfa.secret = '';
	mfa.code = '';
	if (qrRef.value) qrRef.value.innerHTML = '';
};

// 复制恢复码
const copyRecoveryCodes = async () => {
	try {
		await navigator.clipboard.writeText(mfa.recoveryCodes.join('\n'));
		ElMessage.success('已复制到剪贴板');
	} catch {
		ElMessage.error('复制失败，请手动记录');
	}
};

// 解绑 MFA
const onMfaUnbind = () => {
	if (!mfa.unbindPassword) {
		ElMessage.warning('请输入当前密码');
		return;
	}
	mfa.loading = true;
	mfaApi
		.unbind({ password: encrypt(mfa.unbindPassword) })
		.then((res: any) => {
			if (res && res.code === 200) {
				ElMessage.success('已解绑');
				mfa.enabled = false;
				mfa.binding = false;
				mfa.unbindVisible = false;
				mfa.unbindPassword = '';
			} else {
				ElMessage.error(res?.msg || '解绑失败');
			}
		})
		.finally(() => {
			mfa.loading = false;
		});
};

// 获取用户信息
const getUserData = async () => {
	userApi.getUserInfo({}).then((res) => {
		state.personalForm.nickname = res.data.nickname;
		state.personalForm.email = res.data.email;
		state.personalForm.sex = res.data.sex;
		state.personalForm.phone = res.data.phone;
		state.personalForm.id = res.data.id;
	});
};

// 更新用户信息
const handleUpdateInfo = async () => {
	let data = state.personalForm
	userApi.updatePersonalInfo(data).then((res) => {
		if (res && res.code === 200) {
			getUserData();
			ElMessage.success('更新成功');
		} else {
			ElMessage.error(res.msg||'更新失败');
		}
	});
};

const validatePassword = (rule: any, value: string, callback: any) => {
	if (value !== state.passwordForm.newPassword) {
		callback(new Error('两次输入的密码不一致'));
	} else {
		callback();
	}
};

const handleUpdatePassword = () => {
	// 密码更新逻辑
	let data = {
		"id": state.personalForm.id,
		"oldPassword": encrypt(state.passwordForm.oldPassword),
		"newPassword": encrypt(state.passwordForm.newPassword),
		"confirmPassword": encrypt(state.passwordForm.confirmPassword),
	}
	userApi.updateUserPassword(data).then((res) => {
		if (res && res.code === 200) {
			ElMessage.success('更新成功');
		} else {
			ElMessage.error(res.msg||'更新失败');
		}
	});
};

// 当前时间提示语
const currentTime = computed(() => {
	return formatAxis(new Date());
});

onMounted(() => {
	document.title = '个人中心';
	getUserData();
	if (route.query?.tab) {
		activeTab.value = String(route.query.tab);
	}
	loadMfaStatus();
});
</script>

<style scoped lang="scss">
.update-info-gutter {
  margin-bottom: 10px;
}
@import '../../theme/mixins/index.scss';
.personal {
	.personal-user {
		height: 130px;
		display: flex;
		align-items: center;
		.personal-user-left {
			width: 100px;
			height: 130px;
			border-radius: 3px;
			:deep(.el-upload) {
				height: 100%;
			}
			.personal-user-left-upload {
				img {
					width: 100%;
					height: 100%;
					border-radius: 3px;
				}
				&:hover {
					img {
						animation: logoAnimation 0.3s ease-in-out;
					}
				}
			}
		}
		.personal-user-right {
			flex: 1;
			padding: 0 15px;
			.personal-title {
				font-size: 18px;
				@include text-ellipsis(1);
			}
			.personal-item {
				display: flex;
				align-items: center;
				font-size: 13px;
				.personal-item-label {
					color: var(--el-text-color-secondary);
					@include text-ellipsis(1);
				}
				.personal-item-value {
					@include text-ellipsis(1);
				}
			}
		}
	}
	.personal-info {
		.personal-info-more {
			float: right;
			color: var(--el-text-color-secondary);
			font-size: 13px;
			&:hover {
				color: var(--el-color-primary);
				cursor: pointer;
			}
		}
		.personal-info-box {
			height: 130px;
			overflow: hidden;
			.personal-info-ul {
				list-style: none;
				.personal-info-li {
					font-size: 13px;
					padding-bottom: 10px;
					.personal-info-li-title {
						display: inline-block;
						@include text-ellipsis(1);
						color: var(--el-text-color-secondary);
						text-decoration: none;
					}
					& a:hover {
						color: var(--el-color-primary);
						cursor: pointer;
					}
				}
			}
		}
	}
	.personal-recommend-row {
		.personal-recommend-col {
			.personal-recommend {
				position: relative;
				height: 100px;
				border-radius: 3px;
				overflow: hidden;
				cursor: pointer;
				&:hover {
					i {
						right: 0px !important;
						bottom: 0px !important;
						transition: all ease 0.3s;
					}
				}
				i {
					position: absolute;
					right: -10px;
					bottom: -10px;
					font-size: 70px;
					transform: rotate(-30deg);
					transition: all ease 0.3s;
				}
				.personal-recommend-auto {
					padding: 15px;
					position: absolute;
					left: 0;
					top: 5%;
					color: var(--next-color-white);
					.personal-recommend-msg {
						font-size: 12px;
						margin-top: 10px;
					}
				}
			}
		}
	}
	.personal-edit {
		.personal-form {
            text-align: left; // 确保表单内容左对齐
            .el-form-item {
                margin-bottom: 20px; // 设置每行的间距
                label {
                    text-align: left; // 确保标签左对齐
                }
            }
        }
	}
	.mfa-box {
		text-align: center;
		.mfa-tip {
			font-size: 13px;
			color: var(--el-text-color-secondary);
			line-height: 1.6;
			text-align: left;
			margin-bottom: 15px;
		}
		.mfa-bind {
			display: flex;
			flex-direction: column;
			align-items: center;
			.mfa-qr {
				width: 160px;
				height: 160px;
				margin-bottom: 12px;
			}
			.mfa-secret {
				margin-bottom: 12px;
				.mfa-secret-label {
					font-size: 12px;
					color: var(--el-text-color-secondary);
					margin-bottom: 4px;
				}
				.mfa-secret-value {
					user-select: all;
					word-break: break-all;
					letter-spacing: 1px;
				}
			}
			.mfa-code-input {
				width: 220px;
				margin-bottom: 12px;
			}
			.mfa-actions {
				display: flex;
				gap: 10px;
			}
		}
	}
	.mfa-codes {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		.mfa-code {
			font-family: monospace;
			letter-spacing: 1px;
			background: var(--el-fill-color-light);
			border-radius: 3px;
			padding: 6px 8px;
			text-align: center;
			user-select: all;
		}
	}
}
</style>
