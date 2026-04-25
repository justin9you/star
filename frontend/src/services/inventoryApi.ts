import { request } from './api'
import type { ApiResponse, PaginatedResponse } from '../types/common'
import type { Brand, BrandCreate, BrandUpdate, Category, CategoryCreate, CategoryUpdate, Product, ProductCreate, ProductUpdate, Warehouse, WarehouseCreate, WarehouseUpdate, Inventory, StockInRequest } from '../types/inventory'

export const inventoryApi = {
  // 品牌管理
  getBrands: async (page = 1, pageSize = 20, keyword?: string): Promise<PaginatedResponse<Brand>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (keyword) params.append('keyword', keyword)
    return request.get(`/inventory/brands?${params}`)
  },

  getBrand: async (id: number): Promise<ApiResponse<Brand>> => {
    return request.get(`/inventory/brands/${id}`)
  },

  createBrand: async (data: BrandCreate): Promise<ApiResponse> => {
    return request.post('/inventory/brands', data)
  },

  updateBrand: async (id: number, data: BrandUpdate): Promise<ApiResponse> => {
    return request.put(`/inventory/brands/${id}`, data)
  },

  deleteBrand: async (id: number): Promise<ApiResponse> => {
    return request.delete(`/inventory/brands/${id}`)
  },

  // 类型管理
  getCategories: async (page = 1, pageSize = 100, parentId?: number): Promise<PaginatedResponse<Category>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (parentId !== undefined) params.append('parent_id', String(parentId))
    return request.get(`/inventory/categories?${params}`)
  },

  getCategoryTree: async (): Promise<ApiResponse<Category[]>> => {
    return request.get('/inventory/categories/tree')
  },

  getCategory: async (id: number): Promise<ApiResponse<Category>> => {
    return request.get(`/inventory/categories/${id}`)
  },

  createCategory: async (data: CategoryCreate): Promise<ApiResponse> => {
    return request.post('/inventory/categories', data)
  },

  updateCategory: async (id: number, data: CategoryUpdate): Promise<ApiResponse> => {
    return request.put(`/inventory/categories/${id}`, data)
  },

  deleteCategory: async (id: number): Promise<ApiResponse> => {
    return request.delete(`/inventory/categories/${id}`)
  },

  // 仓库管理
  getWarehouses: async (page = 1, pageSize = 20, type?: string): Promise<PaginatedResponse<Warehouse>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (type) params.append('warehouse_type', type)
    return request.get(`/inventory/warehouses?${params}`)
  },

  getWarehouse: async (id: number): Promise<ApiResponse<Warehouse>> => {
    return request.get(`/inventory/warehouses/${id}`)
  },

  createWarehouse: async (data: WarehouseCreate): Promise<ApiResponse> => {
    return request.post('/inventory/warehouses', data)
  },

  updateWarehouse: async (id: number, data: WarehouseUpdate): Promise<ApiResponse> => {
    return request.put(`/inventory/warehouses/${id}`, data)
  },

  deleteWarehouse: async (id: number): Promise<ApiResponse> => {
    return request.delete(`/inventory/warehouses/${id}`)
  },

  // 商品管理
  getProducts: async (page = 1, pageSize = 20, filters?: { brandId?: number; categoryId?: number; keyword?: string }): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (filters?.brandId) params.append('brand_id', String(filters.brandId))
    if (filters?.categoryId) params.append('category_id', String(filters.categoryId))
    if (filters?.keyword) params.append('keyword', filters.keyword)
    return request.get(`/inventory/products?${params}`)
  },

  getProduct: async (id: number): Promise<ApiResponse<Product>> => {
    return request.get(`/inventory/products/${id}`)
  },

  getProductByQr: async (qrCode: string): Promise<ApiResponse<Product>> => {
    return request.get(`/inventory/products/qr/${qrCode}`)
  },

  scanProduct: async (code: string): Promise<ApiResponse<{ id: number; name: string; sale_price: number; unit: string; total_stock: number; has_stock: boolean }>> => {
    return request.get(`/inventory/products/scan/${code}`)
  },

  createProduct: async (data: ProductCreate): Promise<ApiResponse> => {
    return request.post('/inventory/products', data)
  },

  updateProduct: async (id: number, data: ProductUpdate): Promise<ApiResponse> => {
    return request.put(`/inventory/products/${id}`, data)
  },

  deleteProduct: async (id: number): Promise<ApiResponse> => {
    return request.delete(`/inventory/products/${id}`)
  },

  // 库存管理
  getInventory: async (page = 1, pageSize = 20, filters?: { productId?: number; warehouseId?: number; keyword?: string; lowStockOnly?: boolean }): Promise<PaginatedResponse<Inventory>> => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (filters?.productId) params.append('product_id', String(filters.productId))
    if (filters?.warehouseId) params.append('warehouse_id', String(filters.warehouseId))
    if (filters?.keyword) params.append('keyword', filters.keyword)
    if (filters?.lowStockOnly) params.append('low_stock_only', 'true')
    return request.get(`/inventory/inventory?${params}`)
  },

  stockIn: async (data: StockInRequest): Promise<ApiResponse> => {
    return request.post('/inventory/inventory/stock-in', data)
  },

  getLowStockList: async (): Promise<ApiResponse<Inventory[]>> => {
    return request.get('/inventory/inventory/low-stock')
  }
}