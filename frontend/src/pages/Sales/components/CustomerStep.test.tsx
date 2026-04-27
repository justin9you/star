import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { CustomerStep } from './CustomerStep'
import type { SalesOrderState } from '../types'

// Mock APIs
vi.mock('../../../services/salesApi', () => ({
  salesApi: {
    getCustomers: vi.fn().mockResolvedValue({
      items: [
        { id: 1, name: '张三', phone: '13800138001', province: '江苏省', city: '苏州市', district: '吴中区', town: '临湖镇', address: '' },
        { id: 2, name: '李四', phone: '13800138002', province: '江苏省', city: '苏州市', district: '吴中区', town: '临湖镇', address: '' },
      ],
      total: 2,
    }),
    createCustomer: vi.fn().mockResolvedValue({
      success: true,
      data: { id: 3, name: '新客户' },
    }),
  },
}))

describe('CustomerStep', () => {
  const defaultState: SalesOrderState = {
    customers: [
      { id: 1, name: '张三', phone: '13800138001', province: '江苏省', city: '苏州市', district: '吴中区', town: '临湖镇', address: '', contact: '', remark: '', created_at: '' },
      { id: 2, name: '李四', phone: '13800138002', province: '江苏省', city: '苏州市', district: '吴中区', town: '临湖镇', address: '', contact: '', remark: '', created_at: '' },
    ],
    products: [],
    warehouses: [],
    brands: [],
    categories: [],
    selectedCustomerId: null,
    orderItems: [],
    discountAmount: 0,
    orderRemark: '',
    oldAppliances: [],
  }

  const mockOnStateChange = vi.fn()
  const mockOnNext = vi.fn()
  const mockOnPrev = vi.fn()
  const mockOnCustomersUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render customer selection card', () => {
    render(
      <CustomerStep
        state={defaultState}
        onStateChange={mockOnStateChange}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onCustomersUpdate={mockOnCustomersUpdate}
      />
    )

    expect(screen.getByText('选择客户')).toBeInTheDocument()
    // Ant Design Select renders placeholder in a span, not as input placeholder
    expect(screen.getByText('搜索客户姓名或电话')).toBeInTheDocument()
  })

  it('should show next button disabled when no customer selected', () => {
    render(
      <CustomerStep
        state={defaultState}
        onStateChange={mockOnStateChange}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onCustomersUpdate={mockOnCustomersUpdate}
      />
    )

    const nextButton = screen.getByRole('button', { name: /下一步/i })
    expect(nextButton).toBeDisabled()
  })

  it('should enable next button when customer is selected', () => {
    const stateWithSelection = { ...defaultState, selectedCustomerId: 1 }

    render(
      <CustomerStep
        state={stateWithSelection}
        onStateChange={mockOnStateChange}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onCustomersUpdate={mockOnCustomersUpdate}
      />
    )

    const nextButton = screen.getByRole('button', { name: /下一步/i })
    expect(nextButton).not.toBeDisabled()
  })

  it('should show customer details when selected', () => {
    const stateWithSelection = { ...defaultState, selectedCustomerId: 1 }

    render(
      <CustomerStep
        state={stateWithSelection}
        onStateChange={mockOnStateChange}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onCustomersUpdate={mockOnCustomersUpdate}
      />
    )

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('13800138001')).toBeInTheDocument()
  })

  it('should call onNext when next button clicked', async () => {
    const user = userEvent.setup()
    const stateWithSelection = { ...defaultState, selectedCustomerId: 1 }

    render(
      <CustomerStep
        state={stateWithSelection}
        onStateChange={mockOnStateChange}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        onCustomersUpdate={mockOnCustomersUpdate}
      />
    )

    await user.click(screen.getByRole('button', { name: /下一步/i }))
    expect(mockOnNext).toHaveBeenCalled()
  })
})