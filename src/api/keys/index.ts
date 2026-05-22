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

        getAvailableKeysByOsType: (data: object) => {
            return request({
                url: '/api/keys/available/listBy/osType',
                method: 'post',
                data,
            });
        },

        getKeyDetail: (id: number) => {
            return request({
                url: '/api/keys/' + id,
                method: 'get',
            });
        },

        getKeyInstances: (keyId: number, params: { pageNum: number; pageSize: number }) => {
            return request({
                url: '/api/keys/' + keyId + '/instances',
                method: 'get',
                params,
            });
        },

        getAvailableInstances: (keyId: number, params?: { name?: string; ip?: string }) => {
            return request({
                url: '/api/keys/' + keyId + '/available-instances',
                method: 'get',
                params,
            });
        },

        bindInstances: (data: { keyId: number; instanceIds: number[] }) => {
            return request({
                url: '/api/keys/bind-instances',
                method: 'post',
                data,
            });
        },

        unbindInstance: (keyId: number, instanceId: number) => {
            return request({
                url: '/api/keys/' + keyId + '/instances/' + instanceId,
                method: 'delete',
            });
        },
    }
}