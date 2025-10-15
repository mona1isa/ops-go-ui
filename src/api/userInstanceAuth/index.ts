import request from '/@/utils/request';

export function useUserInstanceAuthApi() {
    return {
        addUserInstanceAuth: (data: object) => {
            return request({
                url: '/api/user/instance/auth/add',
                method: 'POST',
                data
            });
        },

        deleteUserInstanceAuth: (data: object) => {
            return request({
                url: '/api/user/instance/auth/delete',
                method: 'POST',
                data
            });
        },

        getUserInstanceAuthList: (data: object) => {
            return request({
                url: '/api/user/instance/auth/list',
                method: 'POST',
                data
            });
        },

        getUserInstanceList: (data: object) => {
            return request({
                url: '/api/user/instance/auth/listInstance',
                method: 'POST',
                data
            });
        },

        pageUserInstances: (data: object) => {
            return request({
                url: '/api/user/instance/auth/pageUserInstances',
                method: 'POST',
                data
            });
        }
    }
}