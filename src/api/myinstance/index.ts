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


    }
}