import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Descriptions, Tag, Space, Input, Select, DatePicker, App } from 'antd'
import { EyeOutlined, PrinterOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { salesApi } from '../../services/salesApi'
import type { SalesOrder, SalesOrderItem } from '../../types/sales'
import PaymentModal from './components/PaymentModal'
// 派工单暂时隐藏（仅需销售功能），代码保留
// import DispatchPrintModal from './components/DispatchPrintModal'

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
  // 派工单暂时隐藏（仅需销售功能），代码保留
  // const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  // const [dispatchOrder, setDispatchOrder] = useState<SalesOrder | null>(null)

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
    let reason = ''
    modal.confirm({
      title: '确认作废',
      content: (
        <div>
          <p>确定要作废该订单吗？作废后不可恢复，库存将自动回滚。</p>
          <Input.TextArea
            placeholder="请填写作废原因（如：客户退货、开错单等）"
            rows={2}
            onChange={e => { reason = e.target.value }}
          />
        </div>
      ),
      okText: '作废',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => handleCancel(orderId, reason.trim()),
    })
  }

  const handleCancel = async (orderId: number, cancelReason?: string) => {
    try {
      await salesApi.cancelOrder(orderId, cancelReason || undefined)
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

  // 派工单暂时隐藏（仅需销售功能），代码保留
  // const openDispatchModal = async (order: SalesOrder) => {
  //   try {
  //     const res = await salesApi.getOrder(order.id)
  //     if (res.data) {
  //       setDispatchOrder(res.data as SalesOrder)
  //       setDispatchModalOpen(true)
  //     }
  //   } catch {
  //     message.error('获取订单详情失败')
  //   }
  // }

  const confirmPrint = (orderId: number) => {
    handlePrint(orderId)
  }

  const buildReceiptHtml = (d: Record<string, unknown>) => {
    const items = (d.items as Array<{ product_name: string; product_spec?: string; product_unit?: string; quantity: number; unit_price: number; subtotal: number }>) || []
    const oldItems = (d.old_appliances as Array<{ category: string; recycle_price: number; remark?: string }>) || []
    const shopMeta = [d.shop_address, d.shop_phone ? '电话 ' + d.shop_phone : '']
      .filter(Boolean).join('　·　')
    return `<!DOCTYPE html>
<html><head><title>销售单 - ${d.order_no || ''}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    font-size: 13px; color: #1a1a1a; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .receipt { width: 100%; max-width: 720px; margin: 0 auto; }
  .r-head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #1a1a1a; }
  .r-shop .name { font-size: 24px; font-weight: 800; letter-spacing: 2px; }
  .r-shop .meta { margin-top: 6px; font-size: 12px; color: #777; }
  .r-doc { text-align: right; flex-shrink: 0; padding-left: 24px; }
  .r-doc .doc-title { font-size: 20px; font-weight: 700; letter-spacing: 6px; }
  .r-doc .doc-no { margin-top: 8px; font-size: 12px; color: #555; }
  .r-doc .doc-no b { color: #1a1a1a; font-weight: 700; }
  .r-info { display: flex; flex-wrap: wrap; gap: 6px 36px; padding: 14px 2px; border-bottom: 1px solid #e2e2e2; font-size: 13px; }
  .r-info .cell { min-width: 38%; }
  .r-info .full { width: 100%; }
  .r-info .k { color: #999; margin-right: 10px; }
  .sec-title { font-size: 13px; font-weight: 700; margin: 18px 0 8px; padding-left: 10px; position: relative; }
  .sec-title::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 3px; background: #1a1a1a; }
  table.items, table.old { width: 100%; border-collapse: collapse; }
  .items { font-size: 13px; }
  .items thead th { text-align: left; padding: 9px 10px; border-bottom: 1.5px solid #1a1a1a; font-weight: 700; }
  .items tbody td { padding: 9px 10px; border-bottom: 1px solid #eee; }
  .items tbody tr:last-child td { border-bottom: 1.5px solid #1a1a1a; }
  .spec { color: #999; font-size: 12px; }
  .c { text-align: center; } .r { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { display: flex; justify-content: flex-end; margin-top: 16px; }
  .totals .box { width: 320px; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 2px; font-size: 13px; color: #555; }
  .totals .row .v { font-variant-numeric: tabular-nums; color: #1a1a1a; }
  .totals .grand { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 12px 16px; border: 2px solid #1a1a1a; }
  .totals .grand .lbl { font-weight: 700; font-size: 14px; }
  .totals .grand .amt { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .cn { margin-top: 10px; text-align: right; font-size: 12px; color: #777; }
  .cn b { color: #1a1a1a; font-weight: 600; }
  .old th { text-align: left; padding: 7px 10px; border-bottom: 1px solid #1a1a1a; background: #f6f6f6; font-weight: 700; font-size: 12.5px; }
  .old td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 12.5px; }
  .remark { margin-top: 16px; font-size: 12.5px; color: #444; }
  .remark .k { color: #999; }
  .sign { margin-top: 40px; display: flex; gap: 56px; font-size: 13px; }
  .sign .item { flex: 1; display: flex; align-items: flex-end; color: #555; }
  .sign .line { flex: 1; border-bottom: 1px solid #1a1a1a; margin-left: 10px; }
  .note { margin-top: 18px; font-size: 12px; color: #555; letter-spacing: 1px; }
  .foot { margin-top: 14px; padding-top: 10px; border-top: 1px dashed #ccc; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
</style>
</head><body>
<div class="receipt">
  <div class="r-head">
    <div class="r-shop">
      <div class="name">${d.shop_name || '亚星电子经营部'}</div>
      ${shopMeta ? `<div class="meta">${shopMeta}</div>` : ''}
    </div>
    <div class="r-doc">
      <div class="doc-title">销 售 单</div>
      <div class="doc-no">单号 <b>${d.order_no || ''}</b></div>
      <div class="doc-no">日期 ${String(d.created_at || '').slice(0, 10)}</div>
    </div>
  </div>

  <div class="r-info">
    <div class="cell"><span class="k">客户</span>${d.customer_name || ''}</div>
    <div class="cell"><span class="k">电话</span>${d.customer_phone || ''}</div>
    <div class="full"><span class="k">地址</span>${d.customer_address || ''}</div>
  </div>

  <div class="sec-title">商品明细</div>
  <table class="items">
    <thead><tr>
      <th>品名</th>
      <th class="r" style="width:14%">数量</th>
      <th class="r" style="width:18%">单价</th>
      <th class="r" style="width:18%">小计</th>
    </tr></thead>
    <tbody>
    ${items.map(i => `<tr>
      <td>${i.product_name}${i.product_spec ? ' <span class="spec">' + i.product_spec + '</span>' : ''}</td>
      <td class="r">${i.quantity}${i.product_unit || ''}</td>
      <td class="r">¥${Number(i.unit_price).toFixed(2)}</td>
      <td class="r">¥${Number(i.subtotal).toFixed(2)}</td>
    </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="box">
      <div class="row"><span>商品总额</span><span class="v">¥${Number(d.total_amount).toFixed(2)}</span></div>
      ${Number(d.discount_amount) > 0 ? `<div class="row"><span>优惠金额</span><span class="v">-¥${Number(d.discount_amount).toFixed(2)}</span></div>` : ''}
      ${Number(d.subsidy_amount) > 0 ? `<div class="row"><span>国补金额</span><span class="v">-¥${Number(d.subsidy_amount).toFixed(2)}</span></div>` : ''}
      <div class="grand"><span class="lbl">客户实付</span><span class="amt">¥${Number(d.final_amount).toFixed(2)}</span></div>
    </div>
  </div>
  <div class="cn">大写金额：<b>${numberToChinese(Number(d.final_amount) || 0)}</b></div>

  ${oldItems.length > 0 ? `
  <div class="sec-title">以旧换新</div>
  <table class="old">
    <thead><tr><th>类型</th><th class="r" style="width:22%">抵扣价</th><th class="r" style="width:34%">备注</th></tr></thead>
    <tbody>
    ${oldItems.map(o => `<tr><td>${o.category}</td><td class="r">¥${Number(o.recycle_price).toFixed(2)}</td><td class="r">${o.remark || '-'}</td></tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  ${d.remark ? `<div class="remark"><span class="k">备注：</span>${d.remark}</div>` : ''}

  <div class="sign">
    <div class="item">收款人<span class="line"></span></div>
    <div class="item">客户签字<span class="line"></span></div>
  </div>

  <div class="note">注：本收据经盖章有效。</div>

  <div class="foot">
    <span>开单时间 ${d.created_at || ''}</span>
    <span>打印时间 ${new Date().toLocaleString('zh-CN')}</span>
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
      title: '国补', dataIndex: 'subsidy_amount', key: 'subsidy_amount', width: 80,
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
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => confirmPrint(record.id)}>打印</Button>
          {(record.payment_status === '未付款' || record.payment_status === '部分付款') && record.status === '有效' && (
            <Button type="link" size="small" onClick={() => confirmMarkPaid(record.id, record.final_amount)}>收款</Button>
          )}
          {/* 派工单暂时隐藏（仅需销售功能），代码保留
          {record.status === '有效' && (
            <Button type="link" size="small" icon={<ToolOutlined />} onClick={() => openDispatchModal(record)}>派工</Button>
          )} */}
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
            style={{ width: 420 }}
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
        width={960}
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
              <Descriptions.Item label="国补">¥{(detailOrder.subsidy_amount || 0).toFixed(2)}</Descriptions.Item>
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
              <Descriptions.Item label="开单人">{detailOrder.created_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detailOrder.created_at?.replace('T', ' ').slice(0, 19)}</Descriptions.Item>
              {detailOrder.status === '已作废' && (
                <Descriptions.Item label="作废原因" span={2}>
                  {detailOrder.cancel_reason || '未填写'}
                  {detailOrder.cancelled_at && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
                      （{detailOrder.cancelled_by_name || ''} {detailOrder.cancelled_at.replace('T', ' ').slice(0, 19)}）
                    </span>
                  )}
                </Descriptions.Item>
              )}
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
                    { title: '抵扣价', dataIndex: 'recycle_price', key: 'recycle_price', width: 120, render: (v: number) => `¥${v.toFixed(2)}` },
                    { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string) => v || '-' },
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
                    { title: '支付方式', dataIndex: 'payment_method', key: 'payment_method', width: 130, render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v || '-'}</span> },
                    { title: '金额', dataIndex: 'amount', key: 'amount', width: 100, render: (v: number) => `¥${v.toFixed(2)}` },
                    { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string) => v || '-' },
                    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 170, render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v?.replace('T', ' ').slice(0, 16) || '-'}</span> },
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

      {/* 派工单暂时隐藏（仅需销售功能），代码保留
      <DispatchPrintModal
        open={dispatchModalOpen}
        orderNo={dispatchOrder?.order_no || ''}
        customerName={dispatchOrder?.customer_name}
        customerPhone={dispatchOrder?.customer_phone}
        customerAddress={dispatchOrder?.customer_address}
        paymentStatus={dispatchOrder?.payment_status}
        items={dispatchOrder?.items || []}
        onCancel={() => setDispatchModalOpen(false)}
      /> */}
    </Card>
  )
}
