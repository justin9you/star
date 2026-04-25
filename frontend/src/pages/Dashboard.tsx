import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Alert, Spin } from 'antd'
import { ShoppingCartOutlined, DollarOutlined, TeamOutlined, AlertOutlined } from '@ant-design/icons'
import { reportApi } from '../services/reportApi'
import { inventoryApi } from '../services/inventoryApi'
import type { Inventory } from '../types/inventory'

interface DailySales {
  total_quantity: number
  total_orders: number
  total_amount: number
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dailySales, setDailySales] = useState<DailySales | null>(null)
  const [lowStockList, setLowStockList] = useState<Inventory[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [salesRes, lowStockRes] = await Promise.all([
        reportApi.getDailySales(),
        inventoryApi.getLowStockList()
      ])
      if (salesRes.success && salesRes.data) {
        setDailySales(salesRes.data as DailySales)
      }
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
    { title: '当前库存', dataIndex: 'quantity', key: 'quantity' },
    { title: '最低库存', dataIndex: 'min_quantity', key: 'min_quantity' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>首页仪表盘</h2>

      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          {lowStockList.length > 0 && (
            <Alert
              message={`库存预警：${lowStockList.length} 个商品库存不足`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日销售额"
                  value={dailySales?.total_amount || 0}
                  prefix={<DollarOutlined />}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日订单"
                  value={dailySales?.total_orders || 0}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日销售商品"
                  value={dailySales?.total_quantity || 0}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="库存预警"
                  value={lowStockList.length}
                  prefix={<AlertOutlined />}
                  valueStyle={{ color: lowStockList.length > 0 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>

          {lowStockList.length > 0 && (
            <Card title="库存预警列表" style={{ marginTop: 24 }}>
              <Table
                columns={lowStockColumns}
                dataSource={lowStockList}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </>
      )}
    </div>
  )
}