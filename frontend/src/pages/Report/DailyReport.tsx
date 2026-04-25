import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, DatePicker, Space, Button, message } from 'antd'
import { DollarOutlined, ShoppingCartOutlined, TeamOutlined, RiseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { reportApi } from '../../services/reportApi'
import dayjs from 'dayjs'

interface DailySales {
  total_quantity: number
  total_orders: number
  total_amount: number
}

interface ProfitStats {
  total_revenue: number
  total_cost: number
  gross_profit: number
  profit_margin: number
}

interface TopProduct {
  product_id: number
  product_name: string
  total_quantity: number
  total_amount: number
}

export default function DailyReport() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [dailySales, setDailySales] = useState<DailySales | null>(null)
  const [profitStats, setProfitStats] = useState<ProfitStats | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      const [salesRes, profitRes, topRes] = await Promise.all([
        reportApi.getDailySales(dateStr),
        reportApi.getProfit(dateStr, dateStr),
        reportApi.getTopProducts(10, dateStr, dateStr),
      ])

      if (salesRes.data) setDailySales(salesRes.data as DailySales)
      if (profitRes.data) setProfitStats(profitRes.data as ProfitStats)
      if (topRes.data) setTopProducts(topRes.data as TopProduct[])
    } catch {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      const blob = await reportApi.exportReport(dateStr, dateStr, 'sales', 'xlsx')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `销售报表_${dateStr}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const topColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_: unknown, __: unknown, index: number) => index + 1 },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '销售数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 100 },
    {
      title: '销售金额', dataIndex: 'total_amount', key: 'total_amount', width: 120,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
  ]

  return (
    <div>
      <Card title="今日销售报表" style={{ marginBottom: 16 }}
        extra={
          <Space>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              allowClear={false}
            />
            <Button type="primary" onClick={handleExport}>导出报表</Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="今日销售额"
                value={dailySales?.total_amount || 0}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              style={{ cursor: 'pointer' }}
              hoverable
              onClick={() => navigate(`/sales/orders?date=${selectedDate.format('YYYY-MM-DD')}`)}
            >
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
                title="今日毛利"
                value={profitStats?.gross_profit || 0}
                prefix={<RiseOutlined />}
                precision={2}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="利润分析" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title="营业额"
              value={profitStats?.total_revenue || 0}
              prefix="¥"
              precision={2}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="成本"
              value={profitStats?.total_cost || 0}
              prefix="¥"
              precision={2}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="毛利率"
              value={profitStats?.profit_margin || 0}
              suffix="%"
              precision={2}
            />
          </Col>
        </Row>
      </Card>

      <Card title="热销商品 TOP 10">
        <Table
          columns={topColumns}
          dataSource={topProducts}
          rowKey="product_id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}