import request from '/@/utils/request';

export function useDangerousCommandApi() {
    return {
        getList: (data: object) => {
            return request({
                url: '/api/dangerousCommand/list',
                method: 'post',
                data,
            });
        },
        addCommand: (data: object) => {
            return request({
                url: '/api/dangerousCommand/add',
                method: 'post',
                data,
            });
        },
        editCommand: (data: object) => {
            return request({
                url: '/api/dangerousCommand/edit',
                method: 'post',
                data,
            });
        },
        deleteCommand: (id: number) => {
            return request({
                url: '/api/dangerousCommand/rm/' + id,
                method: 'delete',
            });
        },
        changeStatus: (data: object) => {
            return request({
                url: '/api/dangerousCommand/changeStatus',
                method: 'post',
                data,
            });
        },
    };
}
