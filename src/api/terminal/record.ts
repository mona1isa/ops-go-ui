import request from '/@/utils/request';

export function useTerminalRecordApi() {
    return {
        // 获取录像列表
        getRecordList: (params: object) => {
            return request({
                url: '/api/session-record/list',
                method: 'get',
                params,
            });
        },

        // 获取录像分页数据
        getRecordPage: (params: object) => {
            return request({
                url: '/api/session-record/list',
                method: 'get',
                params,
            });
        },

        // 获取录像详情
        getRecordInfo: (id: number) => {
            return request({
                url: '/api/session-record/' + id,
                method: 'get',
            });
        },

        // 删除录像
        deleteRecord: (id: number) => {
            return request({
                url: '/api/session-record/' + id,
                method: 'delete',
            });
        },

        // 批量删除录像
        batchDeleteRecord: (ids: number[]) => {
            // 注意：后端暂未实现批量删除，这里逐个删除
            return Promise.all(ids.map(id => 
                request({
                    url: '/api/session-record/' + id,
                    method: 'delete',
                })
            ));
        },

        // 获取录像下载地址
        getRecordDownloadUrl: (id: number) => {
            return request({
                url: '/api/session-record/download/' + id,
                method: 'get',
                responseType: 'blob',
            });
        },

        // 获取录像回放数据
        getPlaybackData: (id: number) => {
            return request({
                url: '/api/session-record/playback/' + id,
                method: 'get',
            });
        },

        // 获取统计数据
        getStatistics: (userId?: number) => {
            return request({
                url: '/api/session-record/statistics',
                method: 'get',
                params: userId ? { userId } : {},
            });
        },
    };
}
