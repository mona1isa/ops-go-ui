import request from '/@/utils/request';

export function useCmdbApi() {
    return {
        // 资产台账
        getAssetPage: (data: object) => {
            return request({
                url: '/api/cmdb/asset/page',
                method: 'post',
                data,
            });
        },
        addAsset: (data: object) => {
            return request({
                url: '/api/cmdb/asset/add',
                method: 'post',
                data,
            });
        },
        updateAsset: (data: object) => {
            return request({
                url: '/api/cmdb/asset/edit',
                method: 'post',
                data,
            });
        },
        getAssetDetail: (data: object) => {
            return request({
                url: '/api/cmdb/asset/detail',
                method: 'post',
                data,
            });
        },
        deleteAsset: (data: object) => {
            return request({
                url: '/api/cmdb/asset/delete',
                method: 'post',
                data,
            });
        },
        transitionAsset: (data: object) => {
            return request({
                url: '/api/cmdb/asset/transition',
                method: 'post',
                data,
            });
        },
        importInstances: () => {
            return request({
                url: '/api/cmdb/asset/import',
                method: 'post',
                data: {},
            });
        },
        getAssetOptions: (data: object) => {
            return request({
                url: '/api/cmdb/asset/options',
                method: 'post',
                data,
            });
        },
        getChangeLog: (data: object) => {
            return request({
                url: '/api/cmdb/asset/change-log',
                method: 'post',
                data,
            });
        },

        // 标签
        getTagList: () => {
            return request({
                url: '/api/cmdb/tag/list',
                method: 'post',
                data: {},
            });
        },
        addTag: (data: object) => {
            return request({
                url: '/api/cmdb/tag/add',
                method: 'post',
                data,
            });
        },
        updateTag: (data: object) => {
            return request({
                url: '/api/cmdb/tag/edit',
                method: 'post',
                data,
            });
        },
        deleteTag: (data: object) => {
            return request({
                url: '/api/cmdb/tag/delete',
                method: 'post',
                data,
            });
        },
        setAssetTags: (data: object) => {
            return request({
                url: '/api/cmdb/tag/set',
                method: 'post',
                data,
            });
        },

        // 关联关系与拓扑
        addRelation: (data: object) => {
            return request({
                url: '/api/cmdb/relation/add',
                method: 'post',
                data,
            });
        },
        deleteRelation: (data: object) => {
            return request({
                url: '/api/cmdb/relation/delete',
                method: 'post',
                data,
            });
        },
        getRelationList: (data: object) => {
            return request({
                url: '/api/cmdb/relation/list',
                method: 'post',
                data,
            });
        },
        getGraphAll: (data: object) => {
            return request({
                url: '/api/cmdb/relation/graph-all',
                method: 'post',
                data,
            });
        },
        getGraph: (data: object) => {
            return request({
                url: '/api/cmdb/relation/graph',
                method: 'post',
                data,
            });
        },

        // IPAM 网段
        getSubnetPage: (data: object) => {
            return request({
                url: '/api/cmdb/subnet/page',
                method: 'post',
                data,
            });
        },
        addSubnet: (data: object) => {
            return request({
                url: '/api/cmdb/subnet/add',
                method: 'post',
                data,
            });
        },
        updateSubnet: (data: object) => {
            return request({
                url: '/api/cmdb/subnet/edit',
                method: 'post',
                data,
            });
        },
        deleteSubnet: (data: object) => {
            return request({
                url: '/api/cmdb/subnet/delete',
                method: 'post',
                data,
            });
        },
        getSubnetUsage: (data: object) => {
            return request({
                url: '/api/cmdb/subnet/usage',
                method: 'post',
                data,
            });
        },
    };
}
