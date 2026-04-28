import { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Select, DatePicker, Tag, Modal, Descriptions, message } from 'antd'
import { purchaseApi } from '../../services/purchaseApi'
import type { PurchaseOrder, PurchaseOrderItem } from '../../types/purchase'

const { RangePicker } = DatePicker

export default function PurchaseOrderList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()

  const [detailOpen, setDetailOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<PurchaseOrder | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [page, statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (statusFilter) filters.status = statusFilter
      if (dateRange) {
        filters.startDate = dateRange[0]
        filters.endDate = dateRange[1]
      }
      const res = await purchaseApi.getOrders(page, 20, filters)
      setOrders(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (orderId: number) => {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await purchaseApi.getOrder(orderId)
      setCurrentOrder(res.data as PurchaseOrder)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCancel = async (orderId: number) => {
    Modal.confirm({
      title: '确认作废',
      content: '作废后库存将反向扣减，确定要作废该进货单吗？',
      okText: '确认作废',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await purchaseApi.cancelOrder(orderId)
          message.success('进货单已作废')
          loadOrders()
        } catch {
          message.error('作废失败')
        }
      },
    })
  }

  const statusColor = (status: string) => {
    switch (status) {
      case '已入库': return 'green'
      case '已作废': return 'red'
      default: return 'default'
    }
  }

  const columns = [
    { title: '单号', dataIndex: 'order_no', key: 'order_no', width: 180 },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name', width: 120,
      render: (v: string) => v || '-',
    },
    { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse_name', width: 100 },
    { title: '总数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 80 },
    { title: '搭送', dataIndex: 'gift_quantity', key: 'gift_quantity', width: 70,
      render: (v: number) => v > 0 ? <Tag color="orange">{v}</Tag> : '-',
    },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 100,
      render: (v: number) => v ? `¥${Number(v).toFixed(2)}` : '-',
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: string) => <Tag color={statusColor(v)}>{v}</Tag>,
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action', width: 140,
      render: (_: unknown, record: PurchaseOrder) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>详情</Button>
          {record.status === '已入库' && (
            <Button type="link" size="small" danger onClick={() => handleCancel(record.id)}>作废</Button>
          )}
        </Space>
      ),
    },
  ]

  const itemColumns = [
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '规格', dataIndex: 'product_spec', key: 'product_spec', width: 100,
      render: (v: string) => v || '-',
    },
    { title: '单位', dataIndex: 'product_unit', key: 'product_unit', width: 60 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 90,
      render: (v: number, record: PurchaseOrderItem) =>
        record.is_gift ? <Tag color="orange">搭送</Tag> : `¥${Number(v).toFixed(2)}`,
    },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 90,
      render: (v: number, record: PurchaseOrderItem) =>
        record.is_gift ? '-' : `¥${Number(v).toFixed(2)}`,
    },
    { title: '搭送', dataIndex: 'is_gift', key: 'is_gift', width: 60,
      render: (v: boolean) => v ? <Tag color="orange">是</Tag> : '否',
    },
  ]

  return (
    <Card
      title="进货单列表"
      extra={
        <Space>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1) }}
            options={[
              { value: '已入库', label: '已入库' },
              { value: '已作废', label: '已作废' },
            ]}
          />
          <RangePicker
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setDateRange([dateStrings[0], dateStrings[1]])
              } else {
                setDateRange(undefined)
              }
              setPage(1)
              setTimeout(loadOrders, 0)
            }}
          />
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      <Modal
        title={currentOrder ? `进货单 ${currentOrder.order_no}` : '进货单详情'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
        loading={detailLoading}
      >
        {currentOrder && (
          <>
            <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="供应商">{currentOrder.supplier_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{currentOrder.supplier_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="仓库">{currentOrder.warehouse_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColor(currentOrder.status)}>{currentOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {currentOrder.created_at ? new Date(currentOrder.created_at).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="总数量">{currentOrder.total_quantity}</Descriptions.Item>
              <Descriptions.Item label="搭送数量">
                {currentOrder.gift_quantity > 0 ? <Tag color="orange">{currentOrder.gift_quantity}</Tag> : 0}
              </Descriptions.Item>
              <Descriptions.Item label="总金额">¥{Number(currentOrder.total_amount).toFixed(2)}</Descriptions.Item>
              {currentOrder.remark && (
                <Descriptions.Item label="备注" span={3}>{currentOrder.remark}</Descriptions.Item>
              )}
            </Descriptions>
            <Table
              columns={itemColumns}
              dataSource={currentOrder.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </>
        )}
      </Modal>
    </Card>
  )
}
