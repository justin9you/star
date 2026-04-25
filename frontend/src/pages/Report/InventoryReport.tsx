import { useEffect, useState } from 'react'
import { Card, Table, Select, Space, Button, message, Tag } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { reportApi } from '../../services/reportApi'
import { inventoryApi } from '../../services/inventoryApi'
import type { Warehouse } from '../../types/inventory'

interface InventoryReportItem {
  product_id: number
  product_name: string
  brand_name: string
  category_name: string
  warehouse_name: string
  quantity: number
  min_quantity: number
  is_low_stock: boolean
}

export default function InventoryReport() {
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>()
  const [reportData, setReportData] = useState<InventoryReportItem[]>([])

  useEffect(() => {
    loadWarehouses()
    loadReport()
  }, [])

  const loadWarehouses = async () => {
    const res = await inventoryApi.getWarehouses(1, 100)
    setWarehouses(res.items || [])
  }

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await reportApi.getInventoryReport(selectedWarehouse)
      if (res.data) setReportData(res.data as InventoryReportItem[])
    } catch {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const blob = await reportApi.exportReport(today, today, 'inventory', 'xlsx')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `库存报表_${today}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const handleWarehouseChange = (warehouseId: number | undefined) => {
    setSelectedWarehouse(warehouseId)
    loadReport()
  }

  const columns = [
    { title: 'ID', dataIndex: 'product_id', key: 'product_id', width: 60 },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '品牌', dataIndex: 'brand_name', key: 'brand_name', width: 100 },
    { title: '类型', dataIndex: 'category_name', key: 'category_name', width: 100 },
    { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse_name', width: 120 },
    {
      title: '当前库存', dataIndex: 'quantity', key: 'quantity', width: 100,
      render: (qty: number, record: InventoryReportItem) => {
        const isLow = record.is_low_stock || qty <= record.min_quantity
        return isLow ? <Tag color="red">{qty}</Tag> : qty
      }
    },
    { title: '最低库存', dataIndex: 'min_quantity', key: 'min_quantity', width: 100 },
    {
      title: '状态', key: 'status', width: 100,
      render: (_: unknown, record: InventoryReportItem) => {
        const isLow = record.is_low_stock || record.quantity <= record.min_quantity
        return isLow ? <Tag color="red">库存不足</Tag> : <Tag color="green">正常</Tag>
      }
    },
  ]

  const totalQuantity = reportData.reduce((sum, i) => sum + i.quantity, 0)
  const lowStockCount = reportData.filter(i => i.is_low_stock || i.quantity <= i.min_quantity).length

  return (
    <Card
      title="库存报表"
      extra={
        <Space>
          <Select
            placeholder="全部仓库"
            allowClear
            style={{ width: 160 }}
            value={selectedWarehouse}
            onChange={handleWarehouseChange}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
          />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>导出报表</Button>
        </Space>
      }
    >
      <Space style={{ marginBottom: 16 }} size="large">
        <span>总商品数：<strong>{reportData.length}</strong></span>
        <span>总库存量：<strong>{totalQuantity}</strong></span>
        <span>库存不足：<strong style={{ color: '#cf1322' }}>{lowStockCount}</strong></span>
      </Space>

      <Table
        columns={columns}
        dataSource={reportData}
        rowKey={(record) => `${record.product_id}-${record.warehouse_name}`}
        loading={loading}
        pagination={{
          pageSize: 20,
          showTotal: (t) => `共 ${t} 条`
        }}
        scroll={{ x: 1000 }}
      />
    </Card>
  )
}