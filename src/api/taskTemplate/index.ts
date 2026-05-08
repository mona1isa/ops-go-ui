import request from '/@/utils/request';

export function useTaskTemplateApi() {
	return {
		getList: (data: object) => {
			return request({
				url: '/api/task-template/page',
				method: 'post',
				data,
			});
		},
		addTemplate: (data: object) => {
			return request({
				url: '/api/task-template/add',
				method: 'post',
				data,
			});
		},
		editTemplate: (data: object) => {
			return request({
				url: '/api/task-template/edit',
				method: 'post',
				data,
			});
		},
		deleteTemplate: (id: number) => {
			return request({
				url: '/api/task-template/rm/' + id,
				method: 'delete',
			});
		},
		getDetail: (data: object) => {
			return request({
				url: '/api/task-template/detail',
				method: 'post',
				data,
			});
		},
	};
}
