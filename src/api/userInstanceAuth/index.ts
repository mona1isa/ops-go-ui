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
        },

        pageUserGroups: (data: object) => {
            return request({
                url: '/api/user/instance/auth/pageUserGroups',
                method: 'POST',
                data
            });
        },

        availableInstances: (data: object) => {
            return request({
                url: '/api/user/instance/auth/available/instances',
                method: 'POST',
                data
            });
        },

        availableGroups: (data: object) => {
            return request({
                url: '/api/user/instance/auth/available/groups',
                method: 'POST',
                data
            });
        },

        availableKeysForInstance: (data: object) => {
            return request({
                url: '/api/user/instance/auth/available/keys',
                method: 'POST',
                data
            });
        },

        userInstanceKeyAuthAdd: (data: object) => {
            return request({
                url: '/api/user/instance/auth/instance/key/auth',
                method: 'POST',
                data
            });
        },

        userInstanceKeyAuthDelete: (data: object) => {
            return request({
                url: '/api/user/instance/auth/instance/key/rm',
                method: 'POST',
                data
            });
        },
        userInstanceKeyAuthList: (data: object) => {
            return request({
                url: '/api/user/instance/auth/instance/key/list',
                method: 'POST',
                data
            });
        },
        userInstanceKeyAuthDeleteBatch: (data: object) => {
            return request({
                url: '/api/user/instance/auth/instance/key/rm/multi',
                method: 'POST',
                data
            });
        },

        groupAvailableKeys: (data: object) => {
            return request({
                url: '/api/user/instance/auth/group/available/keys',
                method: 'POST',
                data
            });
        },
        groupAuthKey: (data: object) => {
            return request({
                url: '/api/user/instance/auth/group/auth/key',
                method: 'POST',
                data
            });
        },
        groupAuthKeyCancel: (data: object) => {
            return request({
                url: '/api/user/instance/auth/group/auth/key/cancel',
                method: 'POST',
                data
            });
        },
        groupAuthKeyCancelMulti: (data: object) => {
            return request({
                url: '/api/user/instance/auth/group/auth/key/cancel/multi',
                method: 'POST',
                data
            });
        },
        groupAuthKeyList: (data: object) => {
            return request({
                url: '/api/user/instance/auth/group/auth/key/list',
                method: 'POST',
                data
            });
        },
    }   
}