// 派工单状态
export const DISPATCH_STATUS_MAP: Record<string, { color: string; text: string }> = {
  '待派工': { color: 'orange', text: '待派工' },
  '已派工': { color: 'blue', text: '已派工' },
  '进行中': { color: 'cyan', text: '进行中' },
  '已完成': { color: 'green', text: '已完成' },
  '已取消': { color: 'default', text: '已取消' },
}

// 派工单商品明细
export interface DispatchOrderItem {
  id: number
  product_name: string
  product_spec?: string
  quantity: number
  warehouse_id?: number
  warehouse_name?: string
  install_remark?: string
}

// 派工单
export interface DispatchOrder {
  id: number
  dispatch_no: string
  sales_order_id: number
  sales_order_no?: string
  contact_name?: string
  contact_phone?: string
  contact_address?: string
  assigned_to?: number
  assigned_to_name?: string
  status: string
  started_at?: string
  completed_at?: string
  remark?: string
  created_at: string
  items: DispatchOrderItem[]
}

// 创建派工单
export interface DispatchOrderCreate {
  sales_order_id: number
  contact_name?: string
  contact_phone?: string
  contact_address?: string
  items: {
    sales_order_item_id: number
    quantity: number
    warehouse_id?: number
    install_remark?: string
  }[]
  assigned_to?: number
  remark?: string
}