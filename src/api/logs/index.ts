import request from '/@/utils/request';

export function useLogsApi() {
    return {
        // 日志检索
        getStatus: () => {
            return request({
                url: '/api/logs/status',
                method: 'post',
                data: {},
            });
        },
        queryLogs: (data: object) => {
            return request({
                url: '/api/logs/query',
                method: 'post',
                data,
            });
        },
        getHistogram: (data: object) => {
            return request({
                url: '/api/logs/histogram',
                method: 'post',
                data,
            });
        },
        getLogContext: (data: object) => {
            return request({
                url: '/api/logs/context',
                method: 'post',
                data,
            });
        },
        getLabels: () => {
            return request({
                url: '/api/logs/labels',
                method: 'post',
                data: {},
            });
        },
        getLabelValues: (data: object) => {
            return request({
                url: '/api/logs/label-values',
                method: 'post',
                data,
            });
        },

        // 采集源
        getSourcePage: (data: object) => {
            return request({
                url: '/api/logs/source/page',
                method: 'post',
                data,
            });
        },
        addSource: (data: object) => {
            return request({
                url: '/api/logs/source/add',
                method: 'post',
                data,
            });
        },
        updateSource: (data: object) => {
            return request({
                url: '/api/logs/source/edit',
                method: 'post',
                data,
            });
        },
        deleteSource: (data: object) => {
            return request({
                url: '/api/logs/source/delete',
                method: 'post',
                data,
            });
        },
        toggleSource: (data: object) => {
            return request({
                url: '/api/logs/source/toggle',
                method: 'post',
                data,
            });
        },
        collectSource: (data: object) => {
            return request({
                url: '/api/logs/source/collect',
                method: 'post',
                data,
            });
        },
        resetSource: (data: object) => {
            return request({
                url: '/api/logs/source/reset',
                method: 'post',
                data,
            });
        },
        getSourceOptions: () => {
            return request({
                url: '/api/logs/source/options',
                method: 'post',
                data: {},
            });
        },
        getSourceInstanceKeys: (data: object) => {
            return request({
                url: '/api/logs/source/instance-keys',
                method: 'post',
                data,
            });
        },

        // 日志告警规则
        getAlertPage: (data: object) => {
            return request({
                url: '/api/logs/alert/page',
                method: 'post',
                data,
            });
        },
        addAlert: (data: object) => {
            return request({
                url: '/api/logs/alert/add',
                method: 'post',
                data,
            });
        },
        updateAlert: (data: object) => {
            return request({
                url: '/api/logs/alert/edit',
                method: 'post',
                data,
            });
        },
        deleteAlert: (data: object) => {
            return request({
                url: '/api/logs/alert/delete',
                method: 'post',
                data,
            });
        },
        toggleAlert: (data: object) => {
            return request({
                url: '/api/logs/alert/toggle',
                method: 'post',
                data,
            });
        },
        silenceAlert: (data: object) => {
            return request({
                url: '/api/logs/alert/silence',
                method: 'post',
                data,
            });
        },
        testAlert: (data: object) => {
            return request({
                url: '/api/logs/alert/test',
                method: 'post',
                data,
            });
        },
        getAlertEvents: (data: object) => {
            return request({
                url: '/api/logs/alert/events',
                method: 'post',
                data,
            });
        },

        // 登录日志
        getLoginLogPage: (data: object) => {
            return request({
                url: '/api/logs/login/page',
                method: 'post',
                data,
            });
        },
        analyzeLogin: (data: object) => {
            return request({
                url: '/api/logs/login/analyze',
                method: 'post',
                data,
            });
        },

        // 操作审计
        getAuditPage: (data: object) => {
            return request({
                url: '/api/logs/audit/page',
                method: 'post',
                data,
            });
        },
        analyzeAudit: (data: object) => {
            return request({
                url: '/api/logs/audit/analyze',
                method: 'post',
                data,
            });
        },
    };
}
