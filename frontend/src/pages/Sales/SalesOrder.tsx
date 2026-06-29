import { useEffect, useState } from 'react'
import { Card, Steps } from 'antd'
import { UserOutlined, ShoppingCartOutlined, CheckOutlined } from '@ant-design/icons'
import { salesApi } from '../../services/salesApi'
import { inventoryApi } from '../../services/inventoryApi'
import { CustomerStep, ProductStep, ConfirmStep } from './components'
import type { SalesOrderState } from './types'

const INITIAL_STATE: SalesOrderState = {
  customers: [],
  products: [],
  warehouses: [],
  brands: [],
  categories: [],
  selectedCustomerId: null,
  orderItems: [],
  discountAmount: 0,
  subsidyAmount: 0,
  orderRemark: '',
  oldAppliances: [],
}

export default function SalesOrder() {
  const [currentStep, setCurrentStep] = useState(0)
  const [state, setState] = useState<SalesOrderState>(INITIAL_STATE)

  const updateState = (updates: Partial<SalesOrderState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    const loadInitialData = async () => {
      const [custRes, prodRes, whRes, brandRes, categoryRes] = await Promise.all([
        salesApi.getCustomers(1, 100),
        inventoryApi.getProducts(1, 100),
        inventoryApi.getWarehouses(1, 100),
        inventoryApi.getBrands(1, 100),
        inventoryApi.getCategories(1, 100),
      ])
      setState(prev => ({
        ...prev,
        customers: custRes.items || [],
        products: prodRes.items || [],
        warehouses: whRes.items || [],
        brands: brandRes.items || [],
        categories: categoryRes.items || [],
      }))
    }
    loadInitialData()
  }, [])

  const goNext = () => setCurrentStep(s => Math.min(s + 1, 2))
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 0))

  const stepProps = {
    state,
    onStateChange: updateState,
    onNext: goNext,
    onPrev: goPrev,
  }

  return (
    <div>
      <Card title="销售开单" style={{ marginBottom: 16 }}>
        <Steps
          current={currentStep}
          onChange={(step) => {
            if (step < currentStep) setCurrentStep(step)
          }}
          items={[
            { title: '选择客户', icon: <UserOutlined /> },
            { title: '选择商品', icon: <ShoppingCartOutlined /> },
            { title: '确认开单', icon: <CheckOutlined /> },
          ]}
        />
      </Card>

      {currentStep === 0 && (
        <CustomerStep
          {...stepProps}
          onCustomersUpdate={(customers) => updateState({ customers })}
        />
      )}
      {currentStep === 1 && (
        <ProductStep
          {...stepProps}
          onProductsUpdate={(products) => updateState({ products })}
        />
      )}
      {currentStep === 2 && (
        <ConfirmStep {...stepProps} />
      )}
    </div>
  )
}