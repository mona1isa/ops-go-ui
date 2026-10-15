import request from '/@/utils/request';

export function useMonitorApi() {
    return {
        // 采集目标
        getTargetPage: (data: object) => {
            return request({
                url: '/api/monitor/target/page',
                method: 'post',
                data,
            });
        },
        addTarget: (data: object) => {
            return request({
                url: '/api/monitor/target/add',
                method: 'post',
                data,
            });
        },
        updateTarget: (data: object) => {
            return request({
                url: '/api/monitor/target/edit',
                method: 'post',
                data,
            });
        },
        deleteTarget: (data: object) => {
            return request({
                url: '/api/monitor/target/delete',
                method: 'post',
                data,
            });
        },
        toggleTarget: (data: object) => {
            return request({
                url: '/api/monitor/target/toggle',
                method: 'post',
                data,
            });
        },
        syncTarget: () => {
            return request({
                url: '/api/monitor/target/sync',
                method: 'post',
                data: {},
            });
        },
        collectTarget: (data: object) => {
            return request({
                url: '/api/monitor/target/collect',
                method: 'post',
                data,
            });
        },
        getTargetInstanceKeys: (data: object) => {
            return request({
                url: '/api/monitor/target/instance-keys',
                method: 'post',
                data,
            });
        },

        // 告警规则
        getRulePage: (data: object) => {
            return request({
                url: '/api/monitor/rule/page',
                method: 'post',
                data,
            });
        },
        addRule: (data: object) => {
            return request({
                url: '/api/monitor/rule/add',
                method: 'post',
                data,
            });
        },
        updateRule: (data: object) => {
            return request({
                url: '/api/monitor/rule/edit',
                method: 'post',
                data,
            });
        },
        deleteRule: (data: object) => {
            return request({
                url: '/api/monitor/rule/delete',
                method: 'post',
                data,
            });
        },
        toggleRule: (data: object) => {
            return request({
                url: '/api/monitor/rule/toggle',
                method: 'post',
                data,
            });
        },
        silenceRule: (data: object) => {
            return request({
                url: '/api/monitor/rule/silence',
                method: 'post',
                data,
            });
        },
        testRule: (data: object) => {
            return request({
                url: '/api/monitor/rule/test',
                method: 'post',
                data,
            });
        },

        // 告警事件
        getEventPage: (data: object) => {
            return request({
                url: '/api/monitor/event/page',
                method: 'post',
                data,
            });
        },
        getEventDetail: (data: object) => {
            return request({
                url: '/api/monitor/event/detail',
                method: 'post',
                data,
            });
        },
        ackEvent: (data: object) => {
            return request({
                url: '/api/monitor/event/ack',
                method: 'post',
                data,
            });
        },
        deleteEvent: (data: object) => {
            return request({
                url: '/api/monitor/event/delete',
                method: 'post',
                data,
            });
        },

        // 通知渠道
        getChannelPage: (data: object) => {
            return request({
                url: '/api/monitor/channel/page',
                method: 'post',
                data,
            });
        },
        getChannelOptions: () => {
            return request({
                url: '/api/monitor/channel/options',
                method: 'post',
                data: {},
            });
        },
        addChannel: (data: object) => {
            return request({
                url: '/api/monitor/channel/add',
                method: 'post',
                data,
            });
        },
        updateChannel: (data: object) => {
            return request({
                url: '/api/monitor/channel/edit',
                method: 'post',
                data,
            });
        },
        deleteChannel: (data: object) => {
            return request({
                url: '/api/monitor/channel/delete',
                method: 'post',
                data,
            });
        },
        toggleChannel: (data: object) => {
            return request({
                url: '/api/monitor/channel/toggle',
                method: 'post',
                data,
            });
        },
        testChannel: (data: object) => {
            return request({
                url: '/api/monitor/channel/test',
                method: 'post',
                data,
            });
        },

        // 监控指标
        getMetricsStatus: () => {
            return request({
                url: '/api/monitor/metrics/status',
                method: 'post',
                data: {},
            });
        },
        getMetricsOverview: () => {
            return request({
                url: '/api/monitor/metrics/overview',
                method: 'post',
                data: {},
            });
        },
        getMetricsHosts: () => {
            return request({
                url: '/api/monitor/metrics/hosts',
                method: 'post',
                data: {},
            });
        },
        getMetricsInstant: (data: { instance: string }) => {
            return request({
                url: '/api/monitor/metrics/instant',
                method: 'post',
                data,
            });
        },
        getMetricsRange: (data: object) => {
            return request({
                url: '/api/monitor/metrics/range',
                method: 'post',
                data,
            });
        },
    }
}
