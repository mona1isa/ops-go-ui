import request from '/@/utils/request';

export function useLogApi() {
    return {
        getPageLog: (data: object) => {
            return request({
                url: '/api/log/page',
                method: 'post',
                data,
            });
        },
    };
}