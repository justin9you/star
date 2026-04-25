import { request } from './api'
import type { ApiResponse } from '../types/common'

export const reportApi = {
  getDailySales: async (date?: string): Promise<ApiResponse> => {
    const params = date ? `?target_date=${date}` : ''
    return request.get(`/report/daily-sales${params}`)
  },

  getProfit: async (startDate?: string, endDate?: string): Promise<ApiResponse> => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return request.get(`/report/profit?${params}`)
  },

  getTopProducts: async (limit = 10, startDate?: string, endDate?: string): Promise<ApiResponse> => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return request.get(`/report/top-products?${params}`)
  },

  getInventoryReport: async (warehouseId?: number): Promise<ApiResponse> => {
    const params = warehouseId ? `?warehouse_id=${warehouseId}` : ''
    return request.get(`/report/inventory${params}`)
  },

  getOldApplianceReport: async (startDate?: string, endDate?: string): Promise<ApiResponse> => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return request.get(`/report/old-appliances?${params}`)
  },

  exportReport: async (startDate: string, endDate: string, reportType: string, format = 'xlsx'): Promise<Blob> => {
    const response = await fetch(`/api/v1/report/export?report_type=${reportType}&format=${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    })
    return response.blob()
  }
}