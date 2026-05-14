import request from '/@/utils/request';
import { Session } from '/@/utils/storage';

export interface TransferWritable {
	write: (chunk: Uint8Array) => Promise<void>;
	close: () => Promise<any>;
}

export function useSftpApi() {
	return {
		listFiles: (data: object) => {
			return request({
				url: '/api/instance/sftp/list',
				method: 'post',
				data,
			});
		},
		downloadFile: (data: object, onDownloadProgress?: (progressEvent: any) => void) => {
			return request({
				url: '/api/instance/sftp/download',
				method: 'post',
				data,
				responseType: 'blob',
				onDownloadProgress,
			});
		},
		uploadFile: (data: FormData, onUploadProgress?: (progressEvent: any) => void, signal?: AbortSignal) => {
			return request({
				url: '/api/instance/sftp/upload',
				method: 'post',
				data,
				headers: { 'Content-Type': 'multipart/form-data' },
				onUploadProgress,
				signal,
				timeout: 0,
			});
		},
		uploadChunk: (data: FormData, onUploadProgress?: (progressEvent: any) => void, signal?: AbortSignal) => {
			return request({
				url: '/api/instance/sftp/upload/chunk',
				method: 'post',
				data,
				headers: { 'Content-Type': 'multipart/form-data' },
				onUploadProgress,
				signal,
				timeout: 0,
			});
		},
		uploadCheck: (data: object) => {
			return request({
				url: '/api/instance/sftp/upload/check',
				method: 'post',
				data,
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
		// 流式下载，支持进度回调和自定义 writable（用于 showSaveFilePicker 或 blob 收集）
		async downloadStream(
			params: { instanceId: number; keyId: number; remotePath: string; fileSize: number },
			writable: TransferWritable,
			onProgress: (received: number, total: number) => void,
			signal?: AbortSignal
		): Promise<any> {
			const token = Session.get('token') || '';
			const baseURL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
			const response = await fetch(`${baseURL}/api/instance/sftp/download`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `${token}`,
				},
				body: JSON.stringify({
					instanceId: params.instanceId,
					keyId: params.keyId,
					remotePath: params.remotePath,
				}),
				signal,
			});

			if (!response.ok) {
				const text = await response.text().catch(() => '下载失败');
				throw new Error(text);
			}

			const contentType = response.headers.get('Content-Type') || '';
			if (contentType.includes('application/json')) {
				const json = await response.json();
				throw new Error(json.msg || json.message || '下载失败');
			}

			const contentLength = +(response.headers.get('Content-Length') || params.fileSize);
			const reader = response.body!.getReader();
			let received = 0;

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					await writable.write(value);
					received += value.length;
					onProgress(received, contentLength);
				}
			} catch (e) {
				try {
					await writable.close();
				} catch (closeErr) {
					// 忽略关闭错误
				}
				throw e;
			}
			return await writable.close();
		},
	};
}
