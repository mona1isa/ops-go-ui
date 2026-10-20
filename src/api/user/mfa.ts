import request from '/@/utils/request';

/**
 * MFA（TOTP 双因素）绑定管理接口集合
 */
export function useMfaApi() {
	return {
		// 当前用户 MFA 状态：{ enabled, required }
		getStatus: () => {
			return request({
				url: '/api/user/mfa/status',
				method: 'get',
			});
		},
		// 发起绑定：返回 { secret, otpauthUrl }
		bindStart: () => {
			return request({
				url: '/api/user/mfa/bind/start',
				method: 'post',
			});
		},
		// 确认绑定：校验动态码，返回一次性恢复码 { recoveryCodes }
		bindConfirm: (data: object) => {
			return request({
				url: '/api/user/mfa/bind/confirm',
				method: 'post',
				data,
			});
		},
		// 解绑：需当前密码（RSA 加密）
		unbind: (data: object) => {
			return request({
				url: '/api/user/mfa/unbind',
				method: 'post',
				data,
			});
		},
	};
}
