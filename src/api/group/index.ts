import request from '/@/utils/request';

export function useGroupApi() {
    return {
        addGroup: (data: object) => {
            return request({    
                url: '/api/group/add',
                method: 'post',
                data,
            });
        },
        editGroup: (data: object) => {
            return request({
                url: '/api/group/edit',
                method: 'post',
                data,
            });
        },
        getGroupTree: () => {
            return request({
                url: '/api/group/tree',
                method: 'get',
            });
        },
        deleteGroup: (id: number) => {
            return request({    
                url: '/api/group/rm/' + id,
                method: 'delete',
            });
        },
        groupInstanceOps: (data: object) => {
            return request({
                url: '/api/group/instance/ops',
                method: 'post',
                data,
            });
        },
        pageGroupInstance: (data: object) => {
            return request({
                url: '/api/group/instances/page',
                method: 'post',
                data,
            });             
        },
        pageAvailableGroupInstance: (data: object) => {
            return request({
                url: '/api/group/instances/available',
                method: 'post',
                data,
            });
        },
        // 扫描网段内的主机
        scanHosts: (data: object) => {
            return request({
                url: '/api/group/sync/scan',
                method: 'post',
                data,
            });
        },
        // 保存扫描到的主机
        saveScannedHosts: (data: object) => {
            return request({
                url: '/api/group/sync/save',
                method: 'post',
                data,
            });
        },
    };
}