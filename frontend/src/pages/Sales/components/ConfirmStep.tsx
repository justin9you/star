import { useState, type CSSProperties } from 'react'
import { Table, Descriptions, Row, Col, Input, InputNumber, Button, Divider, App } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { salesApi } from '../../../services/salesApi'
import { StepFooter } from './StepFooter'
import type { StepProps } from '../types'
import type { SalesOrderItemCreate } from '../../../types/sales'

const settleRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
}

const ITEM_COLUMNS = [
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
  { title: '单价', dataIndex: 'unit_price', key: 'unit_price', render: (v: number) => `¥${v.toFixed(2)}` },
  { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `¥${v.toFixed(2)}` },
]

const OLD_COLUMNS = [
  { title: '旧电器类型', dataIndex: 'category', key: 'category' },
  { title: '抵扣价', dataIndex: 'recycle_price', key: 'recycle_price', width: 120, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
  { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string) => v || '-' },
]

export function ConfirmStep({ state, onStateChange, onPrev }: StepProps) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  const selectedCustomer = state.customers.find(c => c.id === state.selectedCustomerId)
  const totalAmount = state.orderItems.reduce((sum, i) => sum + i.subtotal, 0)
  const finalAmount = totalAmount - state.discountAmount - state.subsidyAmount

  const handleSubmitOrder = async () => {
    if (!state.selectedCustomerId) {
      message.error('请选择客户')
      return
    }
    if (state.orderItems.length === 0) {
      message.error('请添加商品')
      return
    }

    setSubmitting(true)
    try {
      const items: SalesOrderItemCreate[] = state.orderItems.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }))
      const result = await salesApi.createOrder({
        customer_id: state.selectedCustomerId,
        items,
        discount_amount: state.discountAmount || undefined,
        subsidy_amount: state.subsidyAmount || undefined,
        old_appliances: state.oldAppliances.length > 0 ? state.oldAppliances : undefined,
        remark: state.orderRemark || undefined,
      })
      message.success('开单成功！')
      const orderId = (result.data as { id: number })?.id
      if (orderId) {
        navigate(`/sales/orders?highlight=${orderId}&autoDetail=true`)
      } else {
        navigate('/sales/orders')
      }
    } catch {
      // 错误提示已由 api.ts 拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="客户">{selectedCustomer?.name}</Descriptions.Item>
        <Descriptions.Item label="电话">{selectedCustomer?.phone}</Descriptions.Item>
        <Descriptions.Item label="地址" span={2}>
          {selectedCustomer ? `${selectedCustomer.province}${selectedCustomer.city}${selectedCustomer.district}${selectedCustomer.town}${selectedCustomer.address || ''}` : '-'}
        </Descriptions.Item>
      </Descriptions>

      <Table
        columns={ITEM_COLUMNS}
        dataSource={state.orderItems}
        rowKey="key"
        pagination={false}
        size="small"
      />

      {state.oldAppliances.length > 0 && (
        <>
          <Divider orientation="left">以旧换新</Divider>
          <Table
            columns={OLD_COLUMNS}
            dataSource={state.oldAppliances.map((o, i) => ({ ...o, key: `old-${i}` }))}
            rowKey="key"
            pagination={false}
            size="small"
          />
        </>
      )}

      <Row gutter={20} style={{ marginTop: 20 }} align="bottom">
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 8, color: '#595959', fontWeight: 500 }}>备注</div>
          <Input.TextArea autoComplete="off"
            placeholder="备注（可选）"
            value={state.orderRemark}
            onChange={e => onStateChange({ orderRemark: e.target.value })}
            rows={5}
          />
        </Col>
        <Col xs={24} md={12}>
          {/* 账单式结算面板 */}
          <div style={{ background: '#fafbfc', border: '1px solid #eef0f4', borderRadius: 12, padding: '18px 22px' }}>
            <div style={settleRow}>
              <span style={{ color: '#595959' }}>商品总额</span>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>¥{totalAmount.toFixed(2)}</span>
            </div>
            <div style={settleRow}>
              <span style={{ color: '#595959' }}>优惠金额</span>
              <InputNumber
                min={0}
                max={totalAmount - state.subsidyAmount}
                value={state.discountAmount}
                onChange={v => onStateChange({ discountAmount: v || 0 })}
                prefix="¥"
                precision={2}
                style={{ width: 160 }}
              />
            </div>
            <div style={settleRow}>
              <span style={{ color: '#595959' }}>国补金额</span>
              <InputNumber
                min={0}
                max={totalAmount - state.discountAmount}
                value={state.subsidyAmount}
                onChange={v => onStateChange({ subsidyAmount: v || 0 })}
                prefix="¥"
                precision={2}
                style={{ width: 160 }}
              />
            </div>
            <div style={{ borderTop: '1px dashed #e3e7ee', margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#595959', fontWeight: 500 }}>客户实付</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#cf1322', lineHeight: 1 }}>
                ¥{finalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </Col>
      </Row>

      <StepFooter>
        <Button size="large" onClick={onPrev}>上一步</Button>
        <Button type="primary" size="large" icon={<CheckOutlined />} loading={submitting} onClick={handleSubmitOrder}>
          确认开单
        </Button>
      </StepFooter>
    </>
  )
}