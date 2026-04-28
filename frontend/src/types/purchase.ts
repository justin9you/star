export interface PurchaseOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  product_spec?: string;
  product_unit?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_gift: boolean;
}

export interface PurchaseOrderItemCreate {
  product_id: number;
  quantity: number;
  unit_price?: number;
  is_gift: boolean;
}

export interface PurchaseOrder {
  id: number;
  order_no: string;
  supplier_name?: string;
  supplier_phone?: string;
  warehouse_id: number;
  warehouse_name?: string;
  total_amount: number;
  total_quantity: number;
  gift_quantity: number;
  status: string;
  remark?: string;
  created_at: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderCreate {
  warehouse_id: number;
  items: PurchaseOrderItemCreate[];
  supplier_name?: string;
  supplier_phone?: string;
  remark?: string;
}
