import { useState, useEffect, type CSSProperties } from 'react'
import { Modal, Select, InputNumber, Button, Input, Tag, message } from 'antd'
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
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (open) {
      loadExistingPayments()
      setPayments([{ payment_method: '现金', amount: 0, remark: '' }])
    }
  }, [open, orderId])

  const loadExistingPayments = async () => {
    setLoadFailed(false)
    try {
      const res = await salesApi.getPayments(orderId)
      if (res.data) {
        setExistingPayments(res.data.payments || [])
        setExistingTotal(res.data.total_paid || 0)
      }
    } catch {
      // 加载失败时不能信任已收款金额，禁止本次收款以免重复超收
      setLoadFailed(true)
      message.error('已收款记录加载失败，请重试后再收款')
    }
  }

  const totalNew = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const remaining = finalAmount - existingTotal
  const isValid = !loadFailed && totalNew > 0 && totalNew <= remaining

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

  // 一键收全款：合并为单行并填入剩余待收金额
  const fillRemaining = () => {
    setPayments([{
      payment_method: payments[0]?.payment_method || '现金',
      amount: Number(remaining.toFixed(2)),
      remark: payments[0]?.remark || '',
    }])
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

  const sectionLabel: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#262626',
    marginBottom: 12,
  }
  const isCleared = remaining <= 0

  return (
    <Modal
      title="收款"
      className="payment-modal"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="确认收款"
      okButtonProps={{ loading, disabled: !isValid }}
      width={560}
    >
      {/* 金额概览：待收款为主视觉 */}
      <div
        style={{
          background: isCleared ? '#f6ffed' : '#fff7f6',
          border: `1px solid ${isCleared ? '#d9f7be' : '#ffd8d3'}`,
          borderRadius: 10,
          padding: '18px 20px',
          margin: '4px 0 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: '#8c8c8c', fontSize: 13 }}>待收款</span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.1,
              color: isCleared ? '#52c41a' : '#cf1322',
            }}
          >
            ¥{remaining.toFixed(2)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 28,
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px dashed rgba(0,0,0,0.08)',
            fontSize: 13,
            color: '#595959',
          }}
        >
          <span>
            订单金额 <strong style={{ color: '#262626', marginLeft: 4 }}>¥{finalAmount.toFixed(2)}</strong>
          </span>
          <span>
            已收款 <strong style={{ color: '#52c41a', marginLeft: 4 }}>¥{existingTotal.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      {existingPayments.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={sectionLabel}>已收款项</div>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
            {existingPayments.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: i % 2 ? '#fafafa' : '#fff',
                }}
              >
                <span>
                  <Tag color="blue" style={{ marginRight: 8 }}>{p.payment_method}</Tag>
                  {p.created_by_name && (
                    <span style={{ color: '#999', fontSize: 12 }}>{p.created_by_name}</span>
                  )}
                </span>
                <strong style={{ color: '#262626' }}>¥{p.amount.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ ...sectionLabel, marginBottom: 0 }}>新增收款</span>
          {!isCleared && (
            <Button type="link" size="small" style={{ padding: 0 }} onClick={fillRemaining}>
              收全款
            </Button>
          )}
        </div>
        {payments.map((payment, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
            <Select
              value={payment.payment_method}
              onChange={(v) => updatePayment(index, 'payment_method', v)}
              style={{ width: 110 }}
              options={PAYMENT_METHODS.map(m => ({ value: m.value, label: m.label }))}
            />
            <InputNumber
              value={payment.amount}
              onChange={(v) => updatePayment(index, 'amount', v || 0)}
              min={0}
              max={remaining}
              precision={2}
              prefix="¥"
              style={{ width: 140 }}
              placeholder="金额"
            />
            <Input
              value={payment.remark || ''}
              onChange={(e) => updatePayment(index, 'remark', e.target.value)}
              placeholder="备注（可选）"
              style={{ flex: 1 }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={payments.length <= 1}
              onClick={() => removePayment(index)}
            />
          </div>
        ))}
        <Button type="dashed" icon={<PlusOutlined />} onClick={addPayment} style={{ width: '100%' }}>
          添加支付方式
        </Button>
      </div>

      {/* 本次收款合计 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 20,
          padding: '14px 16px',
          background: '#fafafa',
          borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 14, color: '#595959' }}>本次收款</span>
        <strong style={{ fontSize: 20, color: totalNew > remaining ? '#cf1322' : '#1677ff' }}>
          ¥{totalNew.toFixed(2)}
        </strong>
      </div>
      {totalNew > remaining && (
        <div style={{ color: '#cf1322', marginTop: 8, fontSize: 13 }}>
          收款金额超出待收金额 ¥{(totalNew - remaining).toFixed(2)}
        </div>
      )}
    </Modal>
  )
}