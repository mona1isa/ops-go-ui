import { defineStore } from 'pinia';
import Cookies from 'js-cookie';
import { Session } from '/@/utils/storage';
import { userInfoApi } from '/@/api/login/index';
import { id } from 'element-plus/es/locale';
import { nextTick } from 'process';

const userInfoApiInstance = userInfoApi();
/**
 * 用户信息
 * @methods setUserInfos 设置用户信息
 */
export const useUserInfo = defineStore('userInfo', {
	state: (): UserInfosState => ({
		userInfos: {
			id: 0,
			nickname: '',
			username: '',
			photo: '',
			time: 0,
			role: '',
			ipAddr: '',
			loginDate: '',
			roleNames: '',
			authBtnList: [],
		},
	}),
	actions: {
		async setUserInfos() {
			// 缓存用于兜底：网络异常时仍能渲染出用户名等信息，不至于白屏
			const cached = Session.get('userInfo');
			if (cached) {
				this.userInfos = cached;
			}
			// 每次进入都回源取最新的按钮权限（authBtnList）
			// 之前是「有缓存就不再请求」，导致管理员在角色权限里新授予的按钮要用户清缓存/重开浏览器才生效，
			// 表现为页面能打开但一个按钮都不显示（v-auths 在 mounted 时按过期的权限列表直接把元素移除）
			try {
				const userInfos = <UserInfos>await this.getOpsUserInfo();
				this.userInfos = userInfos;
			} catch (error) {
				if (!cached) {
					console.error('获取用户信息失败:', error);
					throw error;
				}
				console.warn('用户信息接口不可用，沿用缓存的权限：', error);
			}
		},
		
		async getOpsUserInfo() {
			// 真实接口请求用户信息
			return new Promise((resolve, reject) => {
				userInfoApiInstance.getOpsUserInfo().then((res) => {
					if (!res) {
						reject(new Error('响应数据为空'));
						return;
					}
					if (res && res.code === 200) {
						const userInfos = {
							id: res.data.id,
							nickname: res.data.nickname,
							username: res.data.username,
							photo: res.data.avatar,
							role: res.data.roleName,
							ipAddr: res.data.ipAddr,
							loginDate: res.data.loginDate,
							roleNames: res.data.roleNames,
							authBtnList: res.data.perms || [],
						};
						Session.set('userInfo', userInfos);
						resolve(userInfos);
					} else {
						reject(new Error(res.msg || '获取用户信息失败'));
					}
				}).catch((error) => {
					reject(error);
				});
			});
		},
	},
});
