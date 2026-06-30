// 品牌相关类型
export interface Brand {
  id: number;
  name: string;
  code: string;
  status: boolean;
  remark?: string;
  created_at: string;
}

export interface BrandCreate {
  name: string;
  code: string;
  remark?: string;
}

export interface BrandUpdate {
  name?: string;
  code?: string;
  status?: boolean;
  remark?: string;
}

// 电器类型相关类型
export interface Category {
  id: number;
  name: string;
  code: string;
  parent_id?: number;
  sort: number;
  status: boolean;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  code: string;
  parent_id?: number;
  sort?: number;
}

export interface CategoryUpdate {
  name?: string;
  code?: string;
  parent_id?: number;
  sort?: number;
  status?: boolean;
}

// 商品相关类型
export interface Product {
  id: number;
  name: string;
  brand_id: number;
  category_id: number;
  spec?: string;
  purchase_price: number;
  sale_price: number;
  unit: string;
  qr_code?: string;
  barcode?: string;
  status?: boolean;
  remark?: string;
  created_at: string;
  brand_name?: string;
  category_name?: string;
}

export interface ProductCreate {
  name: string;
  brand_id: number;
  category_id: number;
  spec?: string;
  purchase_price: number;
  sale_price: number;
  unit?: string;
  qr_code?: string;
  barcode?: string;
  remark?: string;
}

export interface ProductUpdate {
  name?: string;
  brand_id?: number;
  category_id?: number;
  spec?: string;
  purchase_price?: number;
  sale_price?: number;
  unit?: string;
  qr_code?: string;
  barcode?: string;
  status?: boolean;
  remark?: string;
}

// 仓库相关类型
export interface Warehouse {
  id: number;
  name: string;
  type: string;
  address?: string;
  manager?: string;
  phone?: string;
  status: boolean;
  created_at: string;
}

export interface WarehouseCreate {
  name: string;
  type?: string;
  address?: string;
  manager?: string;
  phone?: string;
}

export interface WarehouseUpdate {
  name?: string;
  type?: string;
  address?: string;
  manager?: string;
  phone?: string;
  status?: boolean;
}

// 库存相关类型
export interface Inventory {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  gift_quantity: number;
  min_quantity: number;
  product_name?: string;
  warehouse_name?: string;
  is_low_stock?: boolean;
}

export interface StockInRequest {
  product_id: number;
  warehouse_id: number;
  quantity: number;
  purchase_price?: number;
}