import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Descriptions, Tag, Space, Input, Select, DatePicker, App } from 'antd'
import { EyeOutlined, PrinterOutlined, ToolOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { salesApi } from '../../services/salesApi'
import type { SalesOrder, SalesOrderItem } from '../../types/sales'
import PaymentModal from './components/PaymentModal'
import DispatchPrintModal from './components/DispatchPrintModal'

const PAYMENT_STATUS_MAP: Record<string, { color: string; text: string }> = {
  '未付款': { color: 'red', text: '未付款' },
  '部分付款': { color: 'orange', text: '部分付款' },
  '已付款': { color: 'green', text: '已付款' },
}

const ORDER_STATUS_MAP: Record<string, { color: string; text: string }> = {
  '有效': { color: 'blue', text: '正常' },
  '已作废': { color: 'default', text: '已作废' },
}

// 数字转大写金额
function numberToChinese(n: number): string {
  const fraction = ['角', '分']
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']]

  n = Math.abs(n)

  // 处理小数部分
  let s = ''
  for (let i = 0; i < fraction.length; i++) {
    const decimalPart = Math.floor(n * 10 * Math.pow(10, i)) % 10
    if (decimalPart > 0) {
      s += digit[decimalPart] + fraction[i]
    }
  }

  // 处理整数部分
  let integerPart = Math.floor(n)
  if (integerPart === 0) {
    return s ? '零' + s : '零元整'
  }

  let p = ''
  for (let i = 0; i < unit[0].length && integerPart > 0; i++) {
    let str = ''
    for (let j = 0; j < unit[1].length && integerPart > 0; j++) {
      str = digit[integerPart % 10] + unit[1][j] + str
      integerPart = Math.floor(integerPart / 10)
    }
    str = str.replace(/零./g, '').replace(/零+/g, '零')
    if (str.indexOf('零') === 0) {
      str = str.substring(1)
    }
    p = str + unit[0][i] + p
  }

  p = p.replace(/零+/g, '零').replace(/零元/g, '元').replace(/零$/, '')
  if (s) {
    p += s
  } else {
    p += '整'
  }

  return p
}

export default function OrderList() {
  const { message, modal } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [dateFilter, setDateFilter] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null)
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null)
  const [paymentFinalAmount, setPaymentFinalAmount] = useState(0)
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [dispatchOrder, setDispatchOrder] = useState<SalesOrder | null>(null)

  useEffect(() => {
    loadOrders()
  }, [page, keyword, paymentStatus, status, dateFilter])

  // 处理从开单页面或报表页面跳转过来的情况
  useEffect(() => {
    const highlight = searchParams.get('highlight')
    const autoDetail = searchParams.get('autoDetail')
    const date = searchParams.get('date')
    if (date) {
      setDateFilter(date)
    }
    if (highlight && autoDetail) {
      const orderId = parseInt(highlight, 10)
      setHighlightId(orderId)
      handleViewDetail(orderId)
    }
    if (highlight || autoDetail || date) {
      setSearchParams({})
    }
  }, [searchParams])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await salesApi.getOrders(page, 20, {
        orderNo: keyword || undefined,
        paymentStatus,
        status,
        date: dateFilter,
      })
      setOrders(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (orderId: number) => {
    try {
      const res = await salesApi.getOrder(orderId)
      if (res.data) {
        setDetailOrder(res.data as SalesOrder)
        setDetailOpen(true)
      }
    } catch {
      message.error('获取订单详情失败')
    }
  }

  const confirmCancel = (orderId: number) => {
    modal.confirm({
      title: '确认作废',
      content: '确定要作废该订单吗？作废后不可恢复。',
      okText: '作废',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => handleCancel(orderId),
    })
  }

  const handleCancel = async (orderId: number) => {
    try {
      await salesApi.cancelOrder(orderId)
      message.success('已作废')
      loadOrders()
    } catch {
      message.error('作废失败')
    }
  }

  const confirmMarkPaid = (orderId: number, finalAmount: number) => {
    setPaymentOrderId(orderId)
    setPaymentFinalAmount(finalAmount)
    setPaymentModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false)
    message.success('收款成功')
    loadOrders()
  }

  const openDispatchModal = async (order: SalesOrder) => {
    try {
      const res = await salesApi.getOrder(order.id)
      if (res.data) {
        setDispatchOrder(res.data as SalesOrder)
        setDispatchModalOpen(true)
      }
    } catch {
      message.error('获取订单详情失败')
    }
  }

  const handleDispatchSuccess = () => {
    setDispatchModalOpen(false)
  }

  const confirmPrint = (orderId: number) => {
    handlePrint(orderId)
  }

  const buildReceiptHtml = (d: Record<string, unknown>) => {
    const items = (d.items as Array<{ product_name: string; product_spec?: string; product_unit?: string; quantity: number; unit_price: number; subtotal: number }>) || []
    const oldItems = (d.old_appliances as Array<{ category: string; brand?: string; condition?: string; recycle_price: number }>) || []
    return `<!DOCTYPE html>
<html><head><title>收据 - ${d.order_no || ''}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "SimSun", "Microsoft YaHei", serif; font-size: 14px; color: #000; }
  .receipt { width: 100%; max-width: 680px; margin: 0 auto; border: 2px solid #000; padding: 0; }
  .title-bar { text-align: center; padding: 16px 20px 12px; border-bottom: 2px solid #000; }
  .title-bar h1 { font-size: 22px; font-weight: bold; letter-spacing: 8px; }
  .title-bar .sub { font-size: 12px; margin-top: 4px; color: #333; }
  .body { padding: 12px 20px; }
  .info-row { display: flex; line-height: 2; font-size: 14px; }
  .info-row .label { width: 70px; text-align: justify; text-align-last: justify; flex-shrink: 0; }
  .info-row .value { flex: 1; border-bottom: 1px solid #000; margin-left: 4px; padding: 0 4px; min-width: 0; }
  .info-row .value-half { width: 48%; border-bottom: 1px solid #000; margin-left: 4px; padding: 0 4px; }
  .info-group { display: flex; gap: 24px; }
  .items-title { font-size: 14px; font-weight: bold; margin: 12px 0 6px; }
  .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .items-table th, .items-table td { border: 1px solid #000; padding: 5px 8px; text-align: center; }
  .items-table th { background: #f5f5f5; font-weight: bold; }
  .items-table .name-col { text-align: left; width: 35%; }
  .items-table .num-col { width: 12%; }
  .items-table .price-col { width: 16%; text-align: right; }
  .items-table .sub-col { width: 16%; text-align: right; }
  .amount-section { margin-top: 12px; border: 1px solid #000; }
  .amount-row { display: flex; border-bottom: 1px solid #000; line-height: 2.2; font-size: 14px; }
  .amount-row:last-child { border-bottom: none; }
  .amount-row .a-label { width: 100px; text-align: center; border-right: 1px solid #000; flex-shrink: 0; font-weight: bold; }
  .amount-row .a-value { flex: 1; padding: 0 12px; text-align: right; }
  .amount-row.highlight { background: #f5f5f5; }
  .amount-row.highlight .a-value { font-size: 16px; font-weight: bold; }
  .cn-amount-row { display: flex; line-height: 2.2; font-size: 14px; border: 1px solid #000; border-top: none; }
  .cn-amount-row .a-label { width: 100px; text-align: center; border-right: 1px solid #000; flex-shrink: 0; font-weight: bold; }
  .cn-amount-row .a-value { flex: 1; padding: 0 12px; }
  .old-section { margin-top: 12px; }
  .old-section .section-title { font-size: 14px; font-weight: bold; margin-bottom: 6px; }
  .old-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .old-table th, .old-table td { border: 1px solid #000; padding: 4px 8px; text-align: center; }
  .old-table th { background: #f5f5f5; font-weight: bold; }
  .old-table .price-col { text-align: right; }
  .remark-row { display: flex; margin-top: 12px; line-height: 2; font-size: 14px; }
  .remark-row .label { width: 70px; text-align: justify; text-align-last: justify; flex-shrink: 0; }
  .remark-row .value { flex: 1; border-bottom: 1px solid #000; margin-left: 4px; padding: 0 4px; }
  .sign-section { margin-top: 32px; display: flex; justify-content: space-between; font-size: 14px; }
  .sign-section .sign-item { width: 45%; }
  .sign-section .sign-line { border-bottom: 1px solid #000; display: inline-block; width: 120px; margin-left: 8px; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #000; display: flex; justify-content: space-between; font-size: 12px; color: #333; }
  @media print { body { width: 100%; } .receipt { border: 2px solid #000; } }
</style>
</head><body>
<div class="receipt">
  <div class="title-bar">
    <h1>收 据</h1>
    <div class="sub">${d.shop_name || '亚星电子经营部'}${d.shop_address ? '　|　' + d.shop_address : ''}${d.shop_phone ? '　|　' + d.shop_phone : ''}</div>
  </div>
  <div class="body">
    <div class="info-group">
      <div class="info-row" style="width:48%">
        <span class="label">客户</span>
        <span class="value-half">${d.customer_name || ''}</span>
      </div>
      <div class="info-row" style="width:48%">
        <span class="label">单号</span>
        <span class="value-half">${d.order_no || ''}</span>
      </div>
    </div>
    <div class="info-group" style="margin-top:4px">
      <div class="info-row" style="width:48%">
        <span class="label">电话</span>
        <span class="value-half">${d.customer_phone || ''}</span>
      </div>
      <div class="info-row" style="width:48%">
        <span class="label">日期</span>
        <span class="value-half">${d.created_at || ''}</span>
      </div>
    </div>
    <div class="info-row" style="margin-top:4px">
      <span class="label">地址</span>
      <span class="value">${d.customer_address || ''}</span>
    </div>

    <div class="items-title">商品明细</div>
    <table class="items-table">
      <thead><tr>
        <th class="name-col">品名</th>
        <th class="num-col">数量</th>
        <th class="price-col">单价</th>
        <th class="sub-col">小计</th>
      </tr></thead>
      <tbody>
      ${items.map(i => `<tr>
        <td class="name-col">${i.product_name}${i.product_spec ? '（' + i.product_spec + '）' : ''}</td>
        <td class="num-col">${i.quantity}${i.product_unit || ''}</td>
        <td class="price-col">${Number(i.unit_price).toFixed(2)}</td>
        <td class="sub-col">${Number(i.subtotal).toFixed(2)}</td>
      </tr>`).join('')}
      </tbody>
    </table>

    <div class="amount-section">
      <div class="amount-row"><span class="a-label">商品总额</span><span class="a-value">¥${Number(d.total_amount).toFixed(2)}</span></div>
      ${Number(d.discount_amount) > 0 ? `<div class="amount-row"><span class="a-label">优惠金额</span><span class="a-value">-¥${Number(d.discount_amount).toFixed(2)}</span></div>` : ''}
      <div class="amount-row highlight"><span class="a-label">实收金额</span><span class="a-value">¥${Number(d.final_amount).toFixed(2)}</span></div>
    </div>
    <div class="cn-amount-row"><span class="a-label">大写金额</span><span class="a-value">${numberToChinese(Number(d.final_amount) || 0)}</span></div>

    ${oldItems.length > 0 ? `
    <div class="old-section">
      <div class="section-title">以旧换新</div>
      <table class="old-table">
        <thead><tr><th>类型</th><th>品牌</th><th>成色</th><th class="price-col">回收价</th></tr></thead>
        <tbody>
        ${oldItems.map(o => `<tr><td>${o.category}</td><td>${o.brand || '-'}</td><td>${o.condition || '-'}</td><td class="price-col">¥${Number(o.recycle_price).toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${d.remark ? `
    <div class="remark-row"><span class="label">备注</span><span class="value">${d.remark}</span></div>
    ` : ''}

    <div class="sign-section">
      <div class="sign-item">收款人：<span class="sign-line"></span></div>
      <div class="sign-item">客户签字：<span class="sign-line"></span></div>
    </div>

    <div class="footer">
      <span>开单时间：${d.created_at || ''}</span>
      <span>打印时间：${new Date().toLocaleString('zh-CN')}</span>
    </div>
  </div>
</div>
</body></html>`
  }

  const handlePrint = async (orderId: number) => {
    // 用隐藏 iframe 打印，跳过预览窗口直接弹出打印对话框
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    try {
      const res = await salesApi.printOrder(orderId)
      if (res.data) {
        const d = res.data as Record<string, unknown>
        const html = buildReceiptHtml(d)
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (!doc) {
          message.error('打印失败')
          return
        }
        doc.open()
        doc.write(html)
        doc.close()
        // 等待内容渲染后打印
        setTimeout(() => {
          iframe.contentWindow?.print()
          // 打印对话框关闭后移除 iframe
          setTimeout(() => document.body.removeChild(iframe), 1000)
        }, 300)
      }
    } catch {
      document.body.removeChild(iframe)
      message.error('打印失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name', width: 90 },
    {
      title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    {
      title: '优惠', dataIndex: 'discount_amount', key: 'discount_amount', width: 80,
      render: (v: number) => v ? `¥${v.toFixed(2)}` : '-'
    },
    {
      title: '实收', dataIndex: 'final_amount', key: 'final_amount', width: 100,
      render: (v: number) => <strong>¥{v.toFixed(2)}</strong>
    },
    {
      title: '付款状态', dataIndex: 'payment_status', key: 'payment_status', width: 120,
      render: (s: string, record: SalesOrder) => {
        const m = PAYMENT_STATUS_MAP[s] || { color: 'default', text: s }
        const paid = record.paid_amount || 0
        if (s === '部分付款') {
          return <Tag color={m.color}>已付 ¥{paid.toFixed(0)}</Tag>
        }
        return <Tag color={m.color}>{m.text}</Tag>
      }
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => {
        const m = ORDER_STATUS_MAP[s] || { color: 'default', text: s }
        return <Tag color={m.color}>{m.text}</Tag>
      }
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v?.replace('T', ' ').slice(0, 19) || '-'}</span>
    },
    {
      title: '操作', key: 'action', width: 320, fixed: 'right' as const,
      render: (_: unknown, record: SalesOrder) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => confirmPrint(record.id)}>打印</Button>
          {(record.payment_status === '未付款' || record.payment_status === '部分付款') && record.status === '有效' && (
            <Button type="link" size="small" onClick={() => confirmMarkPaid(record.id, record.final_amount)}>收款</Button>
          )}
          {record.status === '有效' && (
            <Button type="link" size="small" icon={<ToolOutlined />} onClick={() => openDispatchModal(record)}>派工</Button>
          )}
          {record.status === '有效' && (
            <Button type="link" size="small" danger onClick={() => confirmCancel(record.id)}>作废</Button>
          )}
        </Space>
      )
    },
  ]

  return (
    <Card
      title="订单列表"
      extra={
        <Space wrap>
          <DatePicker
            placeholder="选择日期"
            allowClear
            value={dateFilter ? dayjs(dateFilter) : null}
            onChange={(date) => setDateFilter(date ? date.format('YYYY-MM-DD') : '')}
          />
          <Input.Search autoComplete="off"
            placeholder="搜索订单号"
            onSearch={setKeyword}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            placeholder="付款状态"
            allowClear
            style={{ width: 120 }}
            value={paymentStatus}
            onChange={setPaymentStatus}
            options={[
              { value: '未付款', label: '未付款' },
              { value: '部分付款', label: '部分付款' },
              { value: '已付款', label: '已付款' },
            ]}
          />
          <Select
            placeholder="订单状态"
            allowClear
            style={{ width: 120 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: '有效', label: '正常' },
              { value: '已作废', label: '已作废' },
            ]}
          />
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        rowClassName={(record) => record.id === highlightId ? 'highlight-row' : ''}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`
        }}
      />

      <Modal
        title={`订单详情 - ${detailOrder?.order_no || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {detailOrder && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单号">{detailOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailOrder.customer_name}</Descriptions.Item>
              <Descriptions.Item label="电话">{detailOrder.customer_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{detailOrder.customer_address || '-'}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{detailOrder.total_amount?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="优惠">¥{detailOrder.discount_amount?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="实收"><strong>¥{detailOrder.final_amount?.toFixed(2)}</strong></Descriptions.Item>
              <Descriptions.Item label="付款状态">
                <Tag color={PAYMENT_STATUS_MAP[detailOrder.payment_status]?.color}>
                  {PAYMENT_STATUS_MAP[detailOrder.payment_status]?.text || detailOrder.payment_status}
                </Tag>
                {detailOrder.paid_amount != null && detailOrder.paid_amount > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                    已付 ¥{detailOrder.paid_amount.toFixed(2)} / ¥{detailOrder.final_amount?.toFixed(2)}
                  </span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={ORDER_STATUS_MAP[detailOrder.status]?.color}>
                  {ORDER_STATUS_MAP[detailOrder.status]?.text || detailOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{detailOrder.created_at?.replace('T', ' ').slice(0, 19)}</Descriptions.Item>
            </Descriptions>

            {detailOrder.items && detailOrder.items.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>商品明细</h4>
                <Table
                  columns={[
                    { title: '商品', dataIndex: 'product_name', key: 'product_name' },
                    { title: '规格', dataIndex: 'product_spec', key: 'product_spec', render: (v: string) => v || '-' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v: number, record: SalesOrderItem) => `${v}${record.product_unit || ''}` },
                    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', render: (v: number) => `¥${v.toFixed(2)}` },
                    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `¥${v.toFixed(2)}` },
                  ]}
                  dataSource={detailOrder.items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </>
            )}

            {detailOrder.old_appliances && detailOrder.old_appliances.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>以旧换新</h4>
                <Table
                  columns={[
                    { title: '类型', dataIndex: 'category', key: 'category' },
                    { title: '品牌', dataIndex: 'brand', key: 'brand' },
                    { title: '成色', dataIndex: 'condition', key: 'condition' },
                    { title: '回收价', dataIndex: 'recycle_price', key: 'recycle_price', render: (v: number) => `¥${v.toFixed(2)}` },
                  ]}
                  dataSource={detailOrder.old_appliances}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </>
            )}

            {detailOrder.payments && detailOrder.payments.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>付款记录</h4>
                <Table
                  columns={[
                    { title: '支付方式', dataIndex: 'payment_method', key: 'payment_method', width: 100 },
                    { title: '金额', dataIndex: 'amount', key: 'amount', width: 100, render: (v: number) => `¥${v.toFixed(2)}` },
                    { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string) => v || '-' },
                    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 140, render: (v: string) => v?.replace('T', ' ').slice(0, 16) },
                  ]}
                  dataSource={detailOrder.payments}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </>
            )}

            {detailOrder.remark && (
              <p style={{ marginTop: 16 }}><strong>备注：</strong>{detailOrder.remark}</p>
            )}
          </>
        )}
      </Modal>

      <PaymentModal
        open={paymentModalOpen}
        orderId={paymentOrderId || 0}
        finalAmount={paymentFinalAmount}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setPaymentModalOpen(false)}
      />

      <DispatchPrintModal
        open={dispatchModalOpen}
        orderNo={dispatchOrder?.order_no || ''}
        customerName={dispatchOrder?.customer_name}
        customerPhone={dispatchOrder?.customer_phone}
        customerAddress={dispatchOrder?.customer_address}
        paymentStatus={dispatchOrder?.payment_status}
        items={dispatchOrder?.items || []}
        onCancel={() => setDispatchModalOpen(false)}
      />
    </Card>
  )
}
