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
    }
}