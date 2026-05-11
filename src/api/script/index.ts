import request from '/@/utils/request';

export function useScriptApi() {
    return {
        getScriptPage: (data: object) => {
            return request({ url: '/api/script/page', method: 'post', data });
        },
        addScript: (data: object) => {
            return request({ url: '/api/script/add', method: 'post', data });
        },
        updateScript: (data: object) => {
            return request({ url: '/api/script/edit', method: 'post', data });
        },
        deleteScript: (id: number) => {
            return request({ url: '/api/script/rm/' + id, method: 'delete' });
        },
        getScriptInfo: (id: number) => {
            return request({ url: '/api/script/info/' + id, method: 'get' });
        },
    };
}
