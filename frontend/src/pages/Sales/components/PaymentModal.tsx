import { useState, useEffect } from 'react'
import { Modal, Form, Select, InputNumber, Button, Space, Divider, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { salesApi } from '../../../services/salesApi'
import { PAYMENT_METHODS } from '../../../types/sales'

interface PaymentItem {
  payment_method: string
  amount: number
  remark?: string
}

interface PaymentModalProps {
  open: boolean
  orderId: number
  finalAmount: number
  onSuccess: () => void
  onCancel: () => void
}

export default function PaymentModal({ open, orderId, finalAmount, onSuccess, onCancel }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<PaymentItem[]>([{ payment_method: '现金', amount: 0, remark: '' }])
  const [existingPayments, setExistingPayments] = useState<{ id: number; payment_method: string; amount: number; remark?: string; created_at: string; created_by_name?: string }[]>([])
  const [existingTotal, setExistingTotal] = useState(0)

  useEffect(() => {
    if (open) {
      loadExistingPayments()
      setPayments([{ payment_method: '现金', amount: 0, remark: '' }])
    }
  }, [open, orderId])

  const loadExistingPayments = async () => {
    try {
      const res = await salesApi.getPayments(orderId)
      if (res.data) {
        setExistingPayments(res.data.payments || [])
        setExistingTotal(res.data.total_paid || 0)
      }
    } catch {
      // 忽略错误
    }
  }

  const totalNew = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const remaining = finalAmount - existingTotal
  const isValid = totalNew > 0 && totalNew <= remaining

  const addPayment = () => {
    setPayments([...payments, { payment_method: '现金', amount: 0, remark: '' }])
  }

  const removePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index))
    }
  }

  const updatePayment = (index: number, field: keyof PaymentItem, value: string | number) => {
    const updated = [...payments]
    updated[index] = { ...updated[index], [field]: value }
    setPayments(updated)
  }

  const handleSubmit = async () => {
    if (!isValid) {
      message.error('请检查付款金额')
      return
    }

    const validPayments = payments.filter(p => p.amount > 0)
    if (validPayments.length === 0) {
      message.error('请输入付款金额')
      return
    }

    setLoading(true)
    try {
      await salesApi.addPayment(orderId, validPayments)
      message.success('付款成功')
      onSuccess()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err?.response?.data?.detail || '付款失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="收款"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="确认收款"
      okButtonProps={{ loading, disabled: !isValid }}
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>订单金额：</span>
          <strong>¥{finalAmount.toFixed(2)}</strong>
        </div>
        {existingTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#52c41a' }}>
            <span>已收款：</span>
            <span>¥{existingTotal.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 'bold' }}>
          <span>待收款：</span>
          <span style={{ color: remaining > 0 ? '#cf1322' : '#52c41a' }}>
            ¥{remaining.toFixed(2)}
          </span>
        </div>
      </div>

      {existingPayments.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <strong>已收款项：</strong>
            {existingPayments.map(p => (
              <div key={p.id} style={{ padding: '4px 0', borderBottom: '1px dashed #eee' }}>
                <span style={{ marginRight: 8 }}>{p.payment_method}</span>
                <strong>¥{p.amount.toFixed(2)}</strong>
                {p.created_by_name && <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>({p.created_by_name})</span>}
              </div>
            ))}
          </div>
          <Divider />
        </>
      )}

      <div>
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>新增收款：</div>
        {payments.map((payment, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <Select
              value={payment.payment_method}
              onChange={(v) => updatePayment(index, 'payment_method', v)}
              style={{ width: 120 }}
              options={PAYMENT_METHODS.map(m => ({ value: m.value, label: m.label }))}
            />
            <InputNumber
              value={payment.amount}
              onChange={(v) => updatePayment(index, 'amount', v || 0)}
              min={0}
              max={remaining}
              precision={2}
              style={{ width: 120 }}
              placeholder="金额"
            />
            <input
              type="text"
              value={payment.remark || ''}
              onChange={(e) => updatePayment(index, 'remark', e.target.value)}
              placeholder="备注（可选）"
              style={{ flex: 1, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4 }}
            />
            {payments.length > 1 && (
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removePayment(index)} />
            )}
          </div>
        ))}
        <Button type="dashed" icon={<PlusOutlined />} onClick={addPayment} style={{ width: '100%' }}>
          添加支付方式
        </Button>
      </div>

      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
        <span>本次收款：</span>
        <strong style={{ color: totalNew > remaining ? '#cf1322' : '#1890ff' }}>
          ¥{totalNew.toFixed(2)}
        </strong>
      </div>
      {totalNew > remaining && (
        <div style={{ color: '#cf1322', marginTop: 8 }}>
          收款金额超出待收金额 ¥{(totalNew - remaining).toFixed(2)}
        </div>
      )}
    </Modal>
  )
}