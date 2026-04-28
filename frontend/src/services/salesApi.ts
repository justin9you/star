import { request } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/common'
import type { Customer, CustomerCreate, CustomerUpdate, SalesOrder, SalesOrderCreate, OrderPaymentCreate } from '../types/sales'

export const salesApi = {
  // 客户管理
  getCustomers: async (page = 1, pageSize = 20, keyword?: string): Promise<PaginatedResponse<Customer>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (keyword) params.append('keyword', keyword)
    return request.get(`/sales/customers?${params}`)
  },

  getCustomer: async (id: number): Promise<ApiResponse<Customer>> => {
    return request.get(`/sales/customers/${id}`)
  },

  createCustomer: async (data: CustomerCreate): Promise<ApiResponse> => {
    return request.post('/sales/customers', data)
  },

  updateCustomer: async (id: number, data: CustomerUpdate): Promise<ApiResponse> => {
    return request.put(`/sales/customers/${id}`, data)
  },

  deleteCustomer: async (id: number): Promise<ApiResponse> => {
    return request.delete(`/sales/customers/${id}`)
  },

  // 销售订单
  getOrders: async (page = 1, pageSize = 20, filters?: { customerId?: number; orderNo?: string; paymentStatus?: string; status?: string; date?: string }): Promise<PaginatedResponse<SalesOrder>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (filters?.customerId) params.append('customer_id', String(filters.customerId))
    if (filters?.orderNo) params.append('order_no', filters.orderNo)
    if (filters?.paymentStatus) params.append('payment_status', filters.paymentStatus)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.date) params.append('date', filters.date)
    return request.get(`/sales/orders?${params}`)
  },

  getOrder: async (id: number): Promise<ApiResponse<SalesOrder>> => {
    return request.get(`/sales/orders/${id}`)
  },

  createOrder: async (data: SalesOrderCreate): Promise<ApiResponse> => {
    return request.post('/sales/orders', data)
  },

  cancelOrder: async (id: number): Promise<ApiResponse> => {
    return request.post(`/sales/orders/${id}/cancel`)
  },

  markPaid: async (id: number): Promise<ApiResponse> => {
    return request.post(`/sales/orders/${id}/pay`)
  },

  printOrder: async (id: number): Promise<ApiResponse> => {
    return request.get(`/sales/orders/${id}/print`)
  },

  // 付款记录
  addPayment: async (orderId: number, payments: OrderPaymentCreate[]): Promise<ApiResponse> => {
    return request.post(`/sales/orders/${orderId}/payments`, payments)
  },

  getPayments: async (orderId: number): Promise<ApiResponse<{ payments: { id: number; payment_method: string; amount: number; remark?: string; created_at: string; created_by_name?: string }[]; total_paid: number }>> => {
    return request.get(`/sales/orders/${orderId}/payments`)
  }
}