import request from '/@/utils/request';

export function useRoleApi() {
    return {
        addRole: (data: object) => {
            return request({
                url: '/api/role/add',
                method: 'post',
                data,
            });
        },
        editRole: (data: object) => {
            return request({
                url: '/api/role/edit',
                method: 'post',
                data,
            });
        },  
        pageRole: (data: object) => {
            return request({
                url: '/api/role/page',
                method: 'post',
                data,
            });
        },
        delRole: (id: string | number) => {
            return request({
                url: '/api/role/' + id,
                method: 'delete',
            });
        },
        getRoleList: (data: object) => {
            return request({
                url: '/api/role/list',
                method: 'post',
                data,
            });
        },

        getMenuIds: (roleId: string | number) => {
            return request({
                url: '/api/role/menu/' + roleId,
                method: 'get',
            });
        },

        getUserIds: (roleId: string | number) => {
            return request({
                url: '/api/role/user/' + roleId,
                method: 'get',
            });
        },

        assignUsers: (data: object) => {
            return request({
                url: '/api/role/assignUsers',
                method: 'post',
                data,
            });
        },

        getAssignUserInfo: (roleId: string | number) => {
            return request({
                url: '/api/role/assignUserInfo/' + roleId,
            });
        },
    }
}