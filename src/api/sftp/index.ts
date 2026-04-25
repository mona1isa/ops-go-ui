import request from '/@/utils/request';

export function useSftpApi() {
    return {
        listFiles: (data: object) => {
            return request({
                url: '/api/instance/sftp/list',
                method: 'post',
                data,
            });
        },
        downloadFile: (data: object) => {
            return request({
                url: '/api/instance/sftp/download',
                method: 'post',
                data,
                responseType: 'blob',
            });
        },
        uploadFile: (data: FormData) => {
            return request({
                url: '/api/instance/sftp/upload',
                method: 'post',
                data,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
        removeFile: (data: object) => {
            return request({
                url: '/api/instance/sftp/remove',
                method: 'post',
                data,
            });
        },
        renameFile: (data: object) => {
            return request({
                url: '/api/instance/sftp/rename',
                method: 'post',
                data,
            });
        },
        mkdir: (data: object) => {
            return request({
                url: '/api/instance/sftp/mkdir',
                method: 'post',
                data,
            });
        },
    };
}
