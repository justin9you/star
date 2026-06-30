import { request } from './api'
import type { ApiResponse } from '../types/common'

export interface BackupItem {
  filename: string
  size: number
  created_at: string
  path: string
}

export const backupApi = {
  list: async (): Promise<ApiResponse<BackupItem[]>> => {
    return request.get('/backup/list')
  },

  create: async (): Promise<ApiResponse> => {
    return request.post('/backup/create')
  },

  // backupId 为列表中的 1 基序号（后端按序号映射文件名）
  restore: async (filename: string): Promise<ApiResponse> => {
    return request.post('/backup/restore', null, { params: { filename } })
  },

  remove: async (backupId: number): Promise<ApiResponse> => {
    return request.delete(`/backup/${backupId}`)
  },

  download: async (filename: string): Promise<Blob> => {
    const res = await fetch(`/api/v1/backup/download?filename=${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    if (!res.ok) throw new Error('下载失败')
    return res.blob()
  },
}
