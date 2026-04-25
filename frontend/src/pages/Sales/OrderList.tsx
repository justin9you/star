import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Descriptions, Tag, Space, Input, Select, message, Popconfirm, DatePicker } from 'antd'
import { EyeOutlined, PrinterOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { salesApi } from '../../services/salesApi'
import type { SalesOrder, SalesOrderItem } from '../../types/sales'

const PAYMENT_STATUS_MAP: Record<string, { color: string; text: string }> = {
  unpaid: { color: 'red', text: '未付款' },
  paid: { color: 'green', text: '已付款' },
}

const ORDER_STATUS_MAP: Record<string, { color: string; text: string }> = {
  normal: { color: 'blue', text: '正常' },
  cancelled: { color: 'default', text: '已作废' },
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [dateFilter, setDateFilter] = useState<string | undefined>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null)
  const [highlightId, setHighlightId] = useState<number | null>(null)

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

  const handleCancel = async (orderId: number) => {
    try {
      await salesApi.cancelOrder(orderId)
      message.success('已作废')
      loadOrders()
    } catch {
      message.error('作废失败')
    }
  }

  const handleMarkPaid = async (orderId: number) => {
    try {
      await salesApi.markPaid(orderId)
      message.success('已标记为已付款')
      loadOrders()
    } catch {
      message.error('操作失败')
    }
  }

  const handlePrint = async (orderId: number) => {
    try {
      const res = await salesApi.printOrder(orderId)
      if (res.data) {
        const printData = res.data as Record<string, unknown>
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          const items = (printData.items as Array<{ product_name: string; quantity: number; unit_price: number; subtotal: number }>) || []
          printWindow.document.write(`
            <html><head><title>销售单</title><style>
              body { font-family: SimSun; font-size: 14px; max-width: 400px; margin: 0 auto; padding: 20px; }
              h2 { text-align: center; } table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; font-size: 12px; }
              .total { text-align: right; margin-top: 10px; } .footer { margin-top: 20px; font-size: 12px; }
            </style></head><body>
            <h2>${printData.shop_name || ''}</h2>
            <p>地址：${printData.shop_address || ''}</p>
            <p>电话：${printData.shop_phone || ''}</p>
            <hr/>
            <p>单号：${printData.order_no || ''}</p>
            <p>客户：${printData.customer_name || ''}</p>
            <p>电话：${printData.customer_phone || ''}</p>
            <p>地址：${printData.customer_address || ''}</p>
            <table><tr><th>商品</th><th>数量</th><th>单价</th><th>小计</th></tr>
            ${items.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>¥${i.unit_price}</td><td>¥${i.subtotal}</td></tr>`).join('')}
            </table>
            <p class="total">商品总额：¥${printData.total_amount}</p>
            <p class="total">优惠：¥${printData.discount_amount}</p>
            <p class="total"><strong>实收：¥${printData.final_amount}</strong></p>
            <p class="total"><strong>大写：${numberToChinese(Number(printData.final_amount) || 0)}</strong></p>
            <p class="footer">开单时间：${printData.created_at}</p>
            </body></html>
          `)
          printWindow.document.close()
          printWindow.print()
        }
      }
    } catch {
      message.error('打印失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name' },
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
      title: '付款状态', dataIndex: 'payment_status', key: 'payment_status', width: 100,
      render: (s: string) => {
        const m = PAYMENT_STATUS_MAP[s] || { color: 'default', text: s }
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
      render: (v: string) => v?.replace('T', ' ').slice(0, 19) || '-'
    },
    {
      title: '操作', key: 'action', width: 220,
      render: (_: unknown, record: SalesOrder) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(record.id)}>打印</Button>
          {record.payment_status === 'unpaid' && record.status === 'normal' && (
            <Button type="link" size="small" onClick={() => handleMarkPaid(record.id)}>收款</Button>
          )}
          {record.status === 'normal' && (
            <Popconfirm title="确定作废？作废后不可恢复" onConfirm={() => handleCancel(record.id)}>
              <Button type="link" size="small" danger>作废</Button>
            </Popconfirm>
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
            value={dateFilter ? dayjs(dateFilter) : undefined}
            onChange={(date) => setDateFilter(date ? date.format('YYYY-MM-DD') : undefined)}
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
              { value: 'unpaid', label: '未付款' },
              { value: 'paid', label: '已付款' },
            ]}
          />
          <Select
            placeholder="订单状态"
            allowClear
            style={{ width: 120 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: 'normal', label: '正常' },
              { value: 'cancelled', label: '已作废' },
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
        scroll={{ x: 1300 }}
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

            {detailOrder.remark && (
              <p style={{ marginTop: 16 }}><strong>备注：</strong>{detailOrder.remark}</p>
            )}
          </>
        )}
      </Modal>
    </Card>
  )
}
