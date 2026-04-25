// 客户相关类型
export interface Customer {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  town: string;
  address?: string;
  contact?: string;
  remark?: string;
  created_at: string;
}

export interface CustomerCreate {
  name: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  town?: string;
  address?: string;
  contact?: string;
  remark?: string;
}

export interface CustomerUpdate {
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  town?: string;
  address?: string;
  contact?: string;
  remark?: string;
}

// 销售单明细
export interface SalesOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  product_spec?: string;
  product_unit?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SalesOrderItemCreate {
  product_id: number;
  quantity: number;
  unit_price: number;
}

// 旧电器（以旧换新）
export interface OldAppliance {
  id: number;
  category: string;
  brand?: string;
  condition: string;
  recycle_price: number;
  warehouse_id?: number;
  recycle_date: string;
  remark?: string;
}

export interface OldApplianceCreate {
  category: string;
  brand?: string;
  condition?: string;
  recycle_price?: number;
  warehouse_id?: number;
  remark?: string;
}

// 销售单
export interface SalesOrder {
  id: number;
  order_no: string;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: string;
  status: string;
  remark?: string;
  created_at: string;
  items: SalesOrderItem[];
  old_appliances: OldAppliance[];
}

export interface SalesOrderCreate {
  customer_id: number;
  items: SalesOrderItemCreate[];
  discount_amount?: number;
  old_appliances?: OldApplianceCreate[];
  remark?: string;
}

export interface SalesOrderUpdate {
  customer_id?: number;
  items?: SalesOrderItemCreate[];
  discount_amount?: number;
  payment_status?: string;
  remark?: string;
}