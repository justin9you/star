import type { Customer, OldApplianceCreate } from '../../types/sales'
import type { Product, Warehouse, Brand, Category } from '../../types/inventory'

// 订单商品项
export interface OrderItem {
  key: string
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  unit: string
  subtotal: number
}

// 共享状态类型
export interface SalesOrderState {
  customers: Customer[]
  products: Product[]
  warehouses: Warehouse[]
  brands: Brand[]
  categories: Category[]
  selectedCustomerId: number | null
  orderItems: OrderItem[]
  discountAmount: number
  orderRemark: string
  oldAppliances: OldApplianceCreate[]
}

// 步骤组件 Props
export interface StepProps {
  state: SalesOrderState
  onStateChange: (updates: Partial<SalesOrderState>) => void
  onNext: () => void
  onPrev: () => void
}