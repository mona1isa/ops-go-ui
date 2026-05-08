import request from '/@/utils/request';

export function useTaskExecutionApi() {
	return {
		quickExecute: (data: object) => {
			return request({
				url: '/api/task-execution/execute',
				method: 'post',
				data,
			});
		},
		templateExecute: (data: object) => {
			return request({
				url: '/api/task-execution/execute-template',
				method: 'post',
				data,
			});
		},
		pipelineExecute: (data: object) => {
			return request({
				url: '/api/task-execution/execute-pipeline',
				method: 'post',
				data,
			});
		},
		cancelExecution: (data: object) => {
			return request({
				url: '/api/task-execution/cancel',
				method: 'post',
				data,
			});
		},
		getList: (data: object) => {
			return request({
				url: '/api/task-execution/page',
				method: 'post',
				data,
			});
		},
		getDetail: (data: object) => {
			return request({
				url: '/api/task-execution/detail',
				method: 'post',
				data,
			});
		},
		getHostResult: (data: object) => {
			return request({
				url: '/api/task-execution/host-result',
				method: 'post',
				data,
			});
		},
	};
}
