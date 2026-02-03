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
			// 存储用户信息到浏览器缓存
			if (Session.get('userInfo')) {
				this.userInfos = Session.get('userInfo');
			} else {
				try {
					const userInfos = <UserInfos>await this.getOpsUserInfo();
					this.userInfos = userInfos;
				} catch (error) {
					console.error('获取用户信息失败:', error);
					throw error;
				}
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
							authBtnList: res.data.perms,
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
