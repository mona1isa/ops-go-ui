import axios, { AxiosInstance } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Session } from '/@/utils/storage';
import qs from 'qs';
import router from '../router';

// 配置新建一个 axios 实例
const service: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	timeout: 50000,
	headers: { 'Content-Type': 'application/json' },
	paramsSerializer: {
		serialize(params) {
			return qs.stringify(params, { allowDots: true });
		},
	},
});

// 添加请求拦截器
service.interceptors.request.use(
	(config) => {
		// 在发送请求之前做些什么 token
		if (Session.get('token')) {
			config.headers!['Authorization'] = `${Session.get('token')}`;
		}
		return config;
	},
	(error) => {
		// 对请求错误做些什么
		return Promise.reject(error);
	}
);

// 添加响应拦截器
service.interceptors.response.use(
	(response) => {
		// 对响应数据做点什么
		const res = response.data;
		console.log('API Response:', res); // 调试日志
		if (!res) {
			ElMessage.error('响应数据格式异常');
			return Promise.reject(new Error('Invalid API response format'));
		}
		if (res.code == undefined || res.code === 0) {
			// `token` 过期或者账号已在别处登录
			if (res.code === 401 || res.code === 4001) {
				Session.clear(); // 清除浏览器全部临时缓存
				window.location.href = '/'; // 去登录页
				ElMessageBox.alert('你已被登出，请重新登录', '提示', {})
					.then(() => {})
					.catch(() => {});
			}
			const msg = res.msg || res.message || 'Error' || `Business error with code: ${res.code}`;
			return Promise.reject(new Error(msg));
		} else {
			return res;
		}
	},
	(error) => {
		console.error('API Error:', error); // 调试日志
		console.error('Error Response:', error.response); // 调试日志
		// 对响应错误做点什么
		if (error.response?.status === 400) {
			const msg = error.response.data?.msg || error.response.data?.message || '请求参数错误';
			ElMessage.error(msg);
		} else if (error.response?.status === 403) {
			// 403 Forbidden 权限不足，不跳转登录页，只显示错误
			const msg = error.response.data?.msg || error.response.data?.message || '权限不足';
			ElMessage.error(msg);
		} else if (error.message.indexOf('timeout') != -1) {
			ElMessage.error('网络超时');
		} else if (error.message == 'Network Error') {
			ElMessage.error('网络连接错误');
		} else if (error.message.indexOf('Request failed with status code 401') != -1) {
			Session.clear(); // 清除浏览器全部临时缓存
			router.push('/login'); // 去登录页
		} else if (error.response?.status === 500 || error.response?.data?.code === 500) {
			ElMessage.error(error.response?.data.msg || '服务器错误');
		} else {
			ElMessage.error(error.response?.statusText || '接口路径找不到');
		}
		return Promise.reject(error);
	}
);

// 导出 axios 实例
export default service;
