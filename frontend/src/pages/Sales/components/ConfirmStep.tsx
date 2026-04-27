import { useState } from 'react'
import { Card, Table, Descriptions, Row, Col, Statistic, Input, InputNumber, Space, Button, Divider, message } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { salesApi } from '../../../services/salesApi'
import type { StepProps } from '../types'
import type { SalesOrderItemCreate } from '../../../types/sales'

const ITEM_COLUMNS = [
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
  { title: '单价', dataIndex: 'unit_price', key: 'unit_price', render: (v: number) => `¥${v.toFixed(2)}` },
  { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `¥${v.toFixed(2)}` },
]

const OLD_COLUMNS = [
  { title: '旧电器类型', dataIndex: 'category', key: 'category' },
  { title: '品牌', dataIndex: 'brand', key: 'brand' },
  { title: '成色', dataIndex: 'condition', key: 'condition' },
  { title: '回收价', dataIndex: 'recycle_price', key: 'recycle_price', render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
]

export function ConfirmStep({ state, onStateChange, onPrev }: StepProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const selectedCustomer = state.customers.find(c => c.id === state.selectedCustomerId)
  const totalAmount = state.orderItems.reduce((sum, i) => sum + i.subtotal, 0)
  const finalAmount = totalAmount - state.discountAmount

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
      message.error('开单失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="确认开单">
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

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Statistic title="商品总额" value={totalAmount} prefix="¥" precision={2} />
        </Col>
        <Col span={8}>
          <div style={{ marginTop: 4 }}>
            <label>优惠金额：</label>
            <InputNumber
              min={0}
              max={totalAmount}
              value={state.discountAmount}
              onChange={v => onStateChange({ discountAmount: v || 0 })}
              prefix="¥"
              precision={2}
              style={{ width: 160 }}
            />
          </div>
        </Col>
        <Col span={8}>
          <Statistic title="实收金额" value={finalAmount} prefix="¥" precision={2} valueStyle={{ color: '#cf1322' }} />
        </Col>
      </Row>

      <div style={{ marginTop: 16 }}>
        <Input.TextArea autoComplete="off"
          placeholder="备注（可选）"
          value={state.orderRemark}
          onChange={e => onStateChange({ orderRemark: e.target.value })}
          rows={2}
          style={{ marginBottom: 16 }}
        />
      </div>

      <Space>
        <Button onClick={onPrev}>上一步</Button>
        <Button type="primary" icon={<CheckOutlined />} loading={submitting} onClick={handleSubmitOrder}>
          确认开单
        </Button>
      </Space>
    </Card>
  )
}