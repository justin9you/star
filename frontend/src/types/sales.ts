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
  warehouses?: { warehouse_id: number; warehouse_name: string; quantity: number }[];
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
  subsidy_amount?: number;
  final_amount: number;
  payment_status: string;
  paid_amount?: number;
  status: string;
  remark?: string;
  created_by?: number;
  created_by_name?: string;
  cancel_reason?: string;
  cancelled_at?: string;
  cancelled_by_name?: string;
  created_at: string;
  items: SalesOrderItem[];
  old_appliances: OldAppliance[];
  payments?: OrderPayment[];
}

export interface SalesOrderCreate {
  customer_id: number;
  items: SalesOrderItemCreate[];
  discount_amount?: number;
  subsidy_amount?: number;
  old_appliances?: OldApplianceCreate[];
  remark?: string;
}

export interface SalesOrderUpdate {
  customer_id?: number;
  items?: SalesOrderItemCreate[];
  discount_amount?: number;
  subsidy_amount?: number;
  payment_status?: string;
  remark?: string;
}

// 支付方式
export const PAYMENT_METHODS = [
  { value: '现金', label: '现金' },
  { value: '数字人民币', label: '数字人民币' },
  { value: '微信', label: '微信' },
  { value: '支付宝', label: '支付宝' },
  { value: '信用卡', label: '信用卡' },
  { value: '银行转账', label: '银行转账' },
  { value: '其他', label: '其他' },
] as const

export interface OrderPayment {
  id: number
  order_id: number
  payment_method: string
  amount: number
  remark?: string
  created_at: string
  created_by_name?: string
}

export interface OrderPaymentCreate {
  payment_method: string
  amount: number
  remark?: string
}