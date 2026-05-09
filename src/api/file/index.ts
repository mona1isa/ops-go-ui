import request from '/@/utils/request';

export function useFileApi() {
	return {
		uploadLocalFile: (data: FormData) => {
			return request({
				url: '/api/file/local/upload',
				method: 'post',
				data,
				headers: { 'Content-Type': 'multipart/form-data' },
			});
		},
		getLocalFiles: () => {
			return request({
				url: '/api/file/local/list',
				method: 'post',
			});
		},
		deleteLocalFile: (data: object) => {
			return request({
				url: '/api/file/local/delete',
				method: 'post',
				data,
			});
		},
	};
}
