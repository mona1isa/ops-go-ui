import request from '/@/utils/request';

export function useDashboardApi() {
    return {
        getStats: () => {
            return request({
                url: '/api/dashboard/stats',
                method: 'get',
            });
        },
    };
}
