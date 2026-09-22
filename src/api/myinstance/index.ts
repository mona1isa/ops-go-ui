import request from '/@/utils/request';

export function useMyInstanceApi() {
    return {
        getMyInstanceList: (data: object) => {
            return request({
                url: '/api/instance/myInstance',
                method: 'post',
                data
            });
        },

        // 获取当前用户有权限的主机分组树（含分组下的主机与可用凭证）
        getMyGroupTree: () => {
            return request({
                url: '/api/instance/myGroupTree',
                method: 'post'
            });
        },


    }
}