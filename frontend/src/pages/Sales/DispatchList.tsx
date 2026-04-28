import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Descriptions, Tag, Space, Select, App } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { dispatchApi } from '../../services/dispatchApi'
import { DISPATCH_STATUS_MAP, type DispatchOrder } from '../../types/dispatch'

export default function DispatchList() {
  const { message } = App.useApp()
  const [dispatches, setDispatches] = useState<DispatchOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailDispatch, setDetailDispatch] = useState<DispatchOrder | null>(null)

  useEffect(() => {
    loadDispatches()
  }, [page, statusFilter])

  const loadDispatches = async () => {
    setLoading(true)
    try {
      const res = await dispatchApi.getDispatches(page, 20, { status: statusFilter })
      setDispatches(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (dispatchId: number) => {
    try {
      const res = await dispatchApi.getDispatch(dispatchId)
      if (res.data) {
        setDetailDispatch(res.data as DispatchOrder)
        setDetailOpen(true)
      }
    } catch {
      message.error('获取详情失败')
    }
  }

  const handleStatusChange = async (dispatchId: number, newStatus: string) => {
    try {
      await dispatchApi.updateStatus(dispatchId, newStatus)
      message.success('状态已更新')
      loadDispatches()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      message.error(err?.response?.data?.detail || '操作失败')
    }
  }

  const handlePrint = async (dispatchId: number) => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    try {
      const res = await dispatchApi.printDispatch(dispatchId)
      if (res.data) {
        const d = res.data as Record<string, unknown>
        const items = (d.items as Array<{ product_name: string; product_spec?: string; quantity: number; warehouse_name?: string; install_remark?: string }>) || []
        const html = `<!DOCTYPE html>
<html><head><title>派工单 - ${d.dispatch_no || ''}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "SimSun", "Microsoft YaHei", serif; font-size: 14px; color: #000; }
  .dispatch { width: 100%; max-width: 680px; margin: 0 auto; border: 2px solid #000; padding: 0; }
  .title-bar { text-align: center; padding: 16px 20px 12px; border-bottom: 2px solid #000; }
  .title-bar h1 { font-size: 22px; font-weight: bold; letter-spacing: 8px; }
  .title-bar .sub { font-size: 12px; margin-top: 4px; color: #333; }
  .body { padding: 12px 20px; }
  .info-row { display: flex; line-height: 2; font-size: 14px; }
  .info-row .label { width: 80px; text-align: justify; text-align-last: justify; flex-shrink: 0; }
  .info-row .value { flex: 1; border-bottom: 1px solid #000; margin-left: 4px; padding: 0 4px; min-width: 0; }
  .info-row .value-half { width: 48%; border-bottom: 1px solid #000; margin-left: 4px; padding: 0 4px; }
  .info-group { display: flex; gap: 24px; }
  .items-title { font-size: 14px; font-weight: bold; margin: 12px 0 6px; }
  .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .items-table th, .items-table td { border: 1px solid #000; padding: 5px 8px; text-align: center; }
  .items-table th { background: #f5f5f5; font-weight: bold; }
  .items-table .name-col { text-align: left; width: 30%; }
  .sign-section { margin-top: 40px; display: flex; justify-content: space-between; font-size: 14px; }
  .sign-section .sign-item { width: 45%; }
  .sign-section .sign-line { border-bottom: 1px solid #000; display: inline-block; width: 120px; margin-left: 8px; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #000; display: flex; justify-content: space-between; font-size: 12px; color: #333; }
</style>
</head><body>
<div class="dispatch">
  <div class="title-bar">
    <h1>派 工 单</h1>
    <div class="sub">${d.shop_name || ''}${d.shop_address ? '　|　' + d.shop_address : ''}${d.shop_phone ? '　|　' + d.shop_phone : ''}</div>
  </div>
  <div class="body">
    <div class="info-group">
      <div class="info-row" style="width:48%">
        <span class="label">派工单号</span>
        <span class="value-half">${d.dispatch_no || ''}</span>
      </div>
      <div class="info-row" style="width:48%">
        <span class="label">订单号</span>
        <span class="value-half">${d.sales_order_no || ''}</span>
      </div>
    </div>
    <div class="info-group" style="margin-top:4px">
      <div class="info-row" style="width:48%">
        <span class="label">联系人</span>
        <span class="value-half">${d.contact_name || ''}</span>
      </div>
      <div class="info-row" style="width:48%">
        <span class="label">电话</span>
        <span class="value-half">${d.contact_phone || ''}</span>
      </div>
    </div>
    <div class="info-row" style="margin-top:4px">
      <span class="label">地址</span>
      <span class="value">${d.contact_address || ''}</span>
    </div>
    <div class="info-row" style="margin-top:4px">
      <span class="label">指派师傅</span>
      <span class="value">${d.assigned_to_name || '未指派'}</span>
    </div>

    <div class="items-title">商品明细</div>
    <table class="items-table">
      <thead><tr>
        <th class="name-col">品名</th>
        <th>规格</th>
        <th>数量</th>
        <th>出库仓库</th>
        <th>安装备注</th>
      </tr></thead>
      <tbody>
      ${items.map(i => `<tr>
        <td class="name-col">${i.product_name}</td>
        <td>${i.product_spec || '-'}</td>
        <td>${i.quantity}</td>
        <td>${i.warehouse_name || '-'}</td>
        <td>${i.install_remark || '-'}</td>
      </tr>`).join('')}
      </tbody>
    </table>

    ${d.remark ? `<div class="info-row" style="margin-top:12px"><span class="label">备注</span><span class="value">${d.remark}</span></div>` : ''}

    <div class="sign-section">
      <div class="sign-item">师傅签字：<span class="sign-line"></span></div>
      <div class="sign-item">客户签字：<span class="sign-line"></span></div>
    </div>

    <div class="footer">
      <span>创建时间：${d.created_at || ''}</span>
      <span>打印时间：${new Date().toLocaleString('zh-CN')}</span>
    </div>
  </div>
</div>
</body></html>`
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (!doc) { message.error('打印失败'); return }
        doc.open()
        doc.write(html)
        doc.close()
        setTimeout(() => {
          iframe.contentWindow?.print()
          setTimeout(() => document.body.removeChild(iframe), 1000)
        }, 300)
      }
    } catch {
      document.body.removeChild(iframe)
      message.error('打印失败')
    }
  }

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case '待派工': return '已派工'
      case '已派工': return '进行中'
      case '进行中': return '已完成'
      default: return null
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '派工单号', dataIndex: 'dispatch_no', key: 'dispatch_no', width: 160 },
    { title: '订单号', dataIndex: 'sales_order_no', key: 'sales_order_no', width: 160 },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', width: 90 },
    { title: '电话', dataIndex: 'contact_phone', key: 'contact_phone', width: 120 },
    { title: '师傅', dataIndex: 'assigned_to_name', key: 'assigned_to_name', width: 80, render: (v: string) => v || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => {
        const m = DISPATCH_STATUS_MAP[s] || { color: 'default', text: s }
        return <Tag color={m.color}>{m.text}</Tag>
      }
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v?.replace('T', ' ').slice(0, 19) || '-'}</span>
    },
    {
      title: '操作', key: 'action', width: 240, fixed: 'right' as const,
      render: (_: unknown, record: DispatchOrder) => {
        const nextStatus = getNextStatus(record.status)
        return (
          <Space size="small" wrap>
            <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>详情</Button>
            <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(record.id)}>打印</Button>
            {nextStatus && record.status !== '已取消' && (
              <Button type="link" size="small" onClick={() => handleStatusChange(record.id, nextStatus)}>
                {nextStatus}
              </Button>
            )}
            {(record.status === '待派工' || record.status === '已派工') && (
              <Button type="link" size="small" danger onClick={() => handleStatusChange(record.id, '已取消')}>
                取消
              </Button>
            )}
          </Space>
        )
      }
    },
  ]

  return (
    <Card
      title="派工单"
      extra={
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 120 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={Object.entries(DISPATCH_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.text }))}
        />
      }
    >
      <Table
        columns={columns}
        dataSource={dispatches}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`
        }}
      />

      <Modal
        title={`派工单详情 - ${detailDispatch?.dispatch_no || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {detailDispatch && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="派工单号">{detailDispatch.dispatch_no}</Descriptions.Item>
              <Descriptions.Item label="订单号">{detailDispatch.sales_order_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系人">{detailDispatch.contact_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{detailDispatch.contact_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{detailDispatch.contact_address || '-'}</Descriptions.Item>
              <Descriptions.Item label="师傅">{detailDispatch.assigned_to_name || '未指派'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={DISPATCH_STATUS_MAP[detailDispatch.status]?.color}>
                  {DISPATCH_STATUS_MAP[detailDispatch.status]?.text || detailDispatch.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {detailDispatch.created_at?.replace('T', ' ').slice(0, 19)}
              </Descriptions.Item>
            </Descriptions>

            {detailDispatch.items && detailDispatch.items.length > 0 && (
              <>
                <h4 style={{ marginTop: 16 }}>商品明细</h4>
                <Table
                  columns={[
                    { title: '商品', dataIndex: 'product_name', key: 'product_name' },
                    { title: '规格', dataIndex: 'product_spec', key: 'product_spec', render: (v: string) => v || '-' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '出库仓库', dataIndex: 'warehouse_name', key: 'warehouse_name', render: (v: string) => v || '-' },
                    { title: '安装备注', dataIndex: 'install_remark', key: 'install_remark', render: (v: string) => v || '-' },
                  ]}
                  dataSource={detailDispatch.items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </>
            )}

            {detailDispatch.remark && (
              <p style={{ marginTop: 16 }}><strong>备注：</strong>{detailDispatch.remark}</p>
            )}
          </>
        )}
      </Modal>
    </Card>
  )
}