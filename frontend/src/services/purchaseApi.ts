import { request } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/common'
import type { PurchaseOrder, PurchaseOrderCreate } from '../types/purchase'

export const purchaseApi = {
  getOrders: async (page = 1, pageSize = 20, filters?: {
    orderNo?: string; status?: string; startDate?: string; endDate?: string
  }): Promise<PaginatedResponse<PurchaseOrder>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (filters?.orderNo) params.append('order_no', filters.orderNo)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)
    return request.get(`/purchase/orders?${params}`)
  },

  getOrder: async (id: number): Promise<ApiResponse<PurchaseOrder>> => {
    return request.get(`/purchase/orders/${id}`)
  },

  createOrder: async (data: PurchaseOrderCreate): Promise<ApiResponse> => {
    return request.post('/purchase/orders', data)
  },

  cancelOrder: async (id: number): Promise<ApiResponse> => {
    return request.post(`/purchase/orders/${id}/cancel`)
  },
}
