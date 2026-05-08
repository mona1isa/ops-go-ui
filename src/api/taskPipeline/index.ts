import request from '/@/utils/request';

export function useTaskPipelineApi() {
	return {
		getList: (data: object) => {
			return request({
				url: '/api/task-pipeline/page',
				method: 'post',
				data,
			});
		},
		addPipeline: (data: object) => {
			return request({
				url: '/api/task-pipeline/add',
				method: 'post',
				data,
			});
		},
		editPipeline: (data: object) => {
			return request({
				url: '/api/task-pipeline/edit',
				method: 'post',
				data,
			});
		},
		deletePipeline: (id: number) => {
			return request({
				url: '/api/task-pipeline/rm/' + id,
				method: 'delete',
			});
		},
		getDetail: (data: object) => {
			return request({
				url: '/api/task-pipeline/detail',
				method: 'post',
				data,
			});
		},
	};
}
