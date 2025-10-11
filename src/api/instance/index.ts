import request from '/@/utils/request';

export function useInstanceApi() {
    return {
        addInstance: (data: object) => {
            return request({
                url: '/api/instance/add',
                method: 'post',
                data,
            });
        },
        updateInstance: (data: object) => {
            return request({
                url: '/api/instance/edit',
                method: 'post',
                data,
            });
        },
        getInstanceList: (data: object) => {
            return request({
                url: '/api/instance/list',
                method: 'post',
                data,
            });
        },
        getInstanceInfo: (id: number) => {
            return request({
                url: '/api/instance/info/'+ id,
                method: 'get',
            });
        },
        getInstancePage: (data: object) => {
            return request({
                url: '/api/instance/page',
                method: 'post',
                data,
            });
        },
        updateInstanceStatus: (data: object) => {
            return request({
                url: '/api/instance/changeStatus',
                method: 'post',
                data,
            });
        },
        deleteInstance: (id: number) => {
            return request({    
                url: '/api/instance/rm/' + id,
                method: 'delete',
            });
        },

        instanceBindingKey: (data: object) => {
            return request({
                url: '/api/instance/keys/binding',
                method: 'post',
                data,
            });
        },  
    }
}