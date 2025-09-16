import request from '/@/utils/request';

export function useUserInfoApi() {
    return {
        addUser: (data: object) => {
            return request({
                url: '/api/user/add',
                method: 'post',
                data,
            });
        },
        getUserPage: (data: object) => {
            return request({
                url: '/api/user/page',
                method: 'post',
                data,
            });
        },
        getUserInfo: (data: object) => {
            return request({
                url: '/api/user/info',
                method: 'get',
                data,
            });
        },
        updateUser: (data: object) => {
            return request({
                url: '/api/user/edit',
                method: 'post',
                data,
            });
        },
        updateUserStatus: (data: object) => {
            return request({
                url: '/api/user/changeStatus',
                method: 'post',
                data,
            });
        },
        deleteUser: (id: number) => {
            return request({
                url: '/api/user/rm/'+ id,
                method: 'delete',
            });
        },
    }
}