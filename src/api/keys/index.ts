import request from '/@/utils/request';

export function useKeyApi() {
    return {
        getKeyList: (data: object) => {
            return request({
                url: '/api/keys/list',
                method: 'post',
                data,
            });
        },
        getKeyPage: (data: object) => {
            return request({
                url: '/api/keys/page',
                method: 'post',
                data,
            });
        },
        addKey: (data: object) => {
            return request({
                url: '/api/keys/add',
                method: 'post',
                data,
            });
        },
        updateKey: (data: object) => {
            return request({
                url: '/api/keys/edit',
                method: 'post',
                data,
            });
        },
        updateKeyStatus: (data: object) => {
            return request({
                url: '/api/keys/changeStatus',
                method: 'post',
                data,
            });
        },
        deleteKey: (id: number) => {
            return request({
                url: '/api/keys/rm/' + id,
                method: 'delete',
            });
        },

        getAvailableKeyList: (instanceId: number) => {
            return request({
                url: '/api/keys/available/list/' + instanceId,
                method: 'get',
            });
        },
    }
}