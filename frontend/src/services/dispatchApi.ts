import { request } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/common'
import type { DispatchOrder, DispatchOrderCreate } from '../types/dispatch'

export const dispatchApi = {
  getDispatches: async (
    page = 1,
    pageSize = 20,
    filters?: { status?: string; assignedTo?: number }
  ): Promise<PaginatedResponse<DispatchOrder>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (filters?.status) params.append('status', filters.status)
    if (filters?.assignedTo) params.append('assigned_to', String(filters.assignedTo))
    return request.get(`/dispatch?${params}`)
  },

  getDispatch: async (id: number): Promise<ApiResponse<DispatchOrder>> => {
    return request.get(`/dispatch/${id}`)
  },

  createDispatch: async (data: DispatchOrderCreate): Promise<ApiResponse> => {
    return request.post('/dispatch/', data)
  },

  updateStatus: async (id: number, status: string): Promise<ApiResponse> => {
    return request.put(`/dispatch/${id}/status`, { status })
  },

  assignTechnician: async (id: number, technicianId: number): Promise<ApiResponse> => {
    return request.put(`/dispatch/${id}/assign`, { technician_id: technicianId })
  },

  printDispatch: async (id: number): Promise<ApiResponse> => {
    return request.get(`/dispatch/${id}/print`)
  }
}