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
				const userInfos = <UserInfos>await this.getOpsUserInfo();
				this.userInfos = userInfos;
			}
		},
		
		async getOpsUserInfo() {
			// 真实接口请求用户信息
			return new Promise((resolve) => {
				userInfoApiInstance.getOpsUserInfo().then((res) => { 
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
					}
				});
			});
		},
	},
});
