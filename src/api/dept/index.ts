import { get } from 'sortablejs';
import request from '/@/utils/request';

export function useDeptApi() {
    return {
        addDept: (data: object) => {
            return request({
                url: '/api/dept/add',
                method: 'post',
                data,
            });
        },
        editDept: (data: object) => {
            return request({
                url: '/api/dept/edit',
                method: 'post',
                data,
            });
        },

        delDept: (id: string | number) => {
            return request({
                url: '/api/dept/' + id,
                method: 'delete',
            });
        },
        getDeptList: (data: object) => {
            return request({
                url: '/api/dept/list',
                method: 'post',
                data,
            });
        },

        getDeptTree: () => {
            return request({
                url: '/api/dept/tree',
                method: 'get',
            });
        }
    }
}