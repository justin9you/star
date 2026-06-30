import { useEffect, useState } from 'react'
import { Card, Table, Alert, Spin } from 'antd'
import { inventoryApi } from '../services/inventoryApi'
import WeatherForecast from '../components/WeatherForecast'
import type { Inventory } from '../types/inventory'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [lowStockList, setLowStockList] = useState<Inventory[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const lowStockRes = await inventoryApi.getLowStockList()
      if (lowStockRes.success && lowStockRes.data) {
        setLowStockList(lowStockRes.data as Inventory[])
      }
    } finally {
      setLoading(false)
    }
  }

  const lowStockColumns = [
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse_name' },
    { title: '当前库存', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: '最低库存', dataIndex: 'min_quantity', key: 'min_quantity', width: 100 },
  ]

  return (
    <div>
      <WeatherForecast />

      {!loading && lowStockList.length > 0 && (
        <Alert
          message={`库存预警：${lowStockList.length} 个商品库存不足`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        lowStockList.length > 0 && (
          <Card title="库存预警列表">
            <Table
              columns={lowStockColumns}
              dataSource={lowStockList}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        )
      )}
    </div>
  )
}
