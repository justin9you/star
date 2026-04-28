import { useState, useEffect } from 'react'
import { Modal, Descriptions, Table, Input, Button, Tag, App } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import type { SalesOrderItem } from '../../../types/sales'

interface DispatchPrintModalProps {
  open: boolean
  orderNo: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  paymentStatus?: string
  items: SalesOrderItem[]
  onCancel: () => void
}

export default function DispatchPrintModal({
  open,
  orderNo,
  customerName,
  customerPhone,
  customerAddress,
  paymentStatus,
  items,
  onCancel
}: DispatchPrintModalProps) {
  const { message } = App.useApp()
  const [remark, setRemark] = useState('')

  useEffect(() => {
    if (open) {
      setRemark('')
    }
  }, [open])

  const handlePrint = () => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const today = new Date().toLocaleDateString('zh-CN')

    const printItems = items.map(item => ({
      product_name: item.product_name || '',
      product_spec: item.product_spec || '',
      quantity: item.quantity,
      product_unit: item.product_unit || '',
      warehouse_info: item.warehouses?.map(w => `${w.warehouse_name}(${w.quantity})`).join('、') || '-'
    }))

    const html = `<!DOCTYPE html>
<html><head><title>派工单 - ${orderNo}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "SimSun", "Microsoft YaHei", serif; font-size: 14px; color: #000; }
  .dispatch { width: 100%; max-width: 680px; margin: 0 auto; border: 2px solid #000; padding: 0; }
  .title-bar { text-align: center; padding: 16px 20px 12px; border-bottom: 2px solid #000; }
  .title-bar h1 { font-size: 22px; font-weight: bold; letter-spacing: 8px; }
  .body { padding: 12px 20px; }
  .info-row { display: flex; line-height: 2; font-size: 14px; }
  .info-row .label { width: 70px; text-align: justify; text-align-last: justify; flex-shrink: 0; }
  .info-row .value { flex: 1; border-bottom: 1px solid #000; margin-left: 4px; padding: 0 4px; min-width: 0; }
  .info-row .value-half { width: 48%; border-bottom: 1px solid #000; margin-left: 4px; padding: 0 4px; }
  .info-group { display: flex; gap: 24px; }
  .items-title { font-size: 14px; font-weight: bold; margin: 12px 0 6px; }
  .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .items-table th, .items-table td { border: 1px solid #000; padding: 6px 8px; text-align: center; }
  .items-table th { background: #f5f5f5; font-weight: bold; }
  .items-table .name-col { text-align: left; }
  .sign-section { margin-top: 40px; display: flex; justify-content: space-between; font-size: 14px; }
  .sign-section .sign-item { width: 45%; }
  .sign-section .sign-line { border-bottom: 1px solid #000; display: inline-block; width: 120px; margin-left: 8px; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #000; display: flex; justify-content: space-between; font-size: 12px; color: #333; }
</style>
</head><body>
<div class="dispatch">
  <div class="title-bar">
    <h1>派 工 单</h1>
  </div>
  <div class="body">
    <div class="info-group">
      <div class="info-row" style="width:48%">
        <span class="label">订单号</span>
        <span class="value-half">${orderNo}</span>
      </div>
      <div class="info-row" style="width:48%">
        <span class="label">日期</span>
        <span class="value-half">${today}</span>
      </div>
    </div>
    <div class="info-group" style="margin-top:4px">
      <div class="info-row" style="width:48%">
        <span class="label">联系人</span>
        <span class="value-half">${customerName || ''}</span>
      </div>
      <div class="info-row" style="width:48%">
        <span class="label">电话</span>
        <span class="value-half">${customerPhone || ''}</span>
      </div>
    </div>
    <div class="info-row" style="margin-top:4px">
      <span class="label">地址</span>
      <span class="value">${customerAddress || ''}</span>
    </div>
    <div class="info-row" style="margin-top:4px">
      <span class="label">付款</span>
      <span class="value" style="${paymentStatus === '已付款' ? 'color:#52c41a;font-weight:bold' : 'color:#cf1322;font-weight:bold'}">${paymentStatus || '未付款'}</span>
    </div>

    <div class="items-title">商品明细</div>
    <table class="items-table">
      <thead><tr>
        <th class="name-col">品名</th>
        <th>规格</th>
        <th>数量</th>
        <th>出库仓库</th>
      </tr></thead>
      <tbody>
      ${printItems.map(i => `<tr>
        <td class="name-col">${i.product_name}</td>
        <td>${i.product_spec || '-'}</td>
        <td>${i.quantity}${i.product_unit}</td>
        <td>${i.warehouse_info}</td>
      </tr>`).join('')}
      </tbody>
    </table>

    ${remark ? `<div class="info-row" style="margin-top:12px"><span class="label">备注</span><span class="value">${remark}</span></div>` : ''}

    <div class="sign-section">
      <div class="sign-item">师傅签字：<span class="sign-line"></span></div>
      <div class="sign-item">客户签字：<span class="sign-line"></span></div>
    </div>

    <div class="footer">
      <span>打印时间：${new Date().toLocaleString('zh-CN')}</span>
    </div>
  </div>
</div>
</body></html>`

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) {
      message.error('打印失败')
      return
    }
    doc.open()
    doc.write(html)
    doc.close()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 300)
  }

  const columns = [
    { title: '品名', dataIndex: 'product_name', key: 'product_name' },
    { title: '规格', dataIndex: 'product_spec', key: 'product_spec', render: (v: string) => v || '-' },
    { title: '数量', key: 'quantity', render: (_: unknown, record: SalesOrderItem) => `${record.quantity}${record.product_unit || ''}` },
    {
      title: '出库仓库', key: 'warehouse', render: (_: unknown, record: SalesOrderItem) => {
        if (!record.warehouses || record.warehouses.length === 0) return '-'
        return record.warehouses.map(w => `${w.warehouse_name}(${w.quantity})`).join('、')
      }
    },
  ]

  return (
    <Modal
      title={`派工单 - ${orderNo}`}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印
        </Button>
      ]}
      width={800}
    >
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="订单号">{orderNo}</Descriptions.Item>
        <Descriptions.Item label="联系人">{customerName || '-'}</Descriptions.Item>
        <Descriptions.Item label="电话">{customerPhone || '-'}</Descriptions.Item>
        <Descriptions.Item label="地址">{customerAddress || '-'}</Descriptions.Item>
        <Descriptions.Item label="付款状态">
          <Tag color={paymentStatus === '已付款' ? 'green' : 'red'}>{paymentStatus || '未付款'}</Tag>
        </Descriptions.Item>
      </Descriptions>

      <h4 style={{ marginBottom: 8 }}>商品明细</h4>
      <Table
        columns={columns}
        dataSource={items}
        rowKey="id"
        pagination={false}
        size="small"
        bordered
      />

      <div style={{ marginTop: 16 }}>
        <span style={{ marginRight: 8 }}>备注：</span>
        <Input
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="可选"
          style={{ width: 300 }}
        />
      </div>
    </Modal>
  )
}