import { useEffect, useState, useMemo } from 'react'
import { Card, Row, Col, Table, DatePicker, Space, Button, message } from 'antd'
import {
  DollarOutlined, ShoppingCartOutlined, AppstoreOutlined,
  RiseOutlined, PayCircleOutlined, GiftOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { reportApi } from '../../services/reportApi'
import { usePrivacyStore } from '../../stores/privacyStore'
import { KpiCard } from '../../components/KpiCard'
import EChart from '../../components/charts/EChart'
import dayjs, { type Dayjs } from 'dayjs'
import styles from './DailyReport.module.css'

const { RangePicker } = DatePicker

interface DailySales {
  total_quantity: number
  total_orders: number
  total_amount: number
  subsidy_amount: number
  paid_amount: number
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

const fmtMoney = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function DailyReport() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [dailySales, setDailySales] = useState<DailySales | null>(null)
  const [profitStats, setProfitStats] = useState<ProfitStats | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topLoading, setTopLoading] = useState(false)
  // 热销商品默认统计：今天往前近一个月
  const [topRange, setTopRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(1, 'month'), dayjs()])
  const { isPrivacyMode } = usePrivacyStore()

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  useEffect(() => {
    loadTopProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topRange])

  const loadData = async () => {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      const [salesRes, profitRes] = await Promise.all([
        reportApi.getDailySales(dateStr),
        reportApi.getProfit(dateStr, dateStr),
      ])

      if (salesRes.data) setDailySales(salesRes.data as DailySales)
      if (profitRes.data) setProfitStats(profitRes.data as ProfitStats)
    } catch {
      message.error('加载数据失败')
    }
  }

  const loadTopProducts = async () => {
    setTopLoading(true)
    try {
      const start = topRange[0].format('YYYY-MM-DD')
      const end = topRange[1].format('YYYY-MM-DD')
      const topRes = await reportApi.getTopProducts(10, start, end)
      if (topRes.data) setTopProducts(topRes.data as TopProduct[])
    } catch {
      message.error('加载热销商品失败')
    } finally {
      setTopLoading(false)
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

  // 利润对比柱状图
  const profitOption = useMemo(() => {
    const revenue = profitStats?.total_revenue || 0
    const cost = profitStats?.total_cost || 0
    const profit = profitStats?.gross_profit || 0
    return {
      grid: { left: 12, right: 16, top: 36, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: number) => `¥${fmtMoney(v)}`,
      },
      xAxis: {
        type: 'category',
        data: ['营业额', '成本', '毛利'],
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 13 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f2f5' } },
        axisLabel: { color: '#9aa3b5' },
      },
      series: [
        {
          type: 'bar',
          barWidth: '46%',
          itemStyle: { borderRadius: [8, 8, 0, 0] },
          label: { show: true, position: 'top', color: '#374151', formatter: (p: { value: number }) => `¥${fmtMoney(p.value)}` },
          data: [
            { value: revenue, itemStyle: { color: '#1677ff' } },
            { value: cost, itemStyle: { color: '#f7971e' } },
            { value: profit, itemStyle: { color: '#11998e' } },
          ],
          animationDelay: (idx: number) => idx * 120,
          animationEasing: 'elasticOut',
        },
      ],
    }
  }, [profitStats])

  // 毛利率仪表盘
  const gaugeOption = useMemo(() => {
    const margin = profitStats?.profit_margin || 0
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          radius: '92%',
          progress: {
            show: true,
            width: 16,
            roundCap: true,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#4096ff' },
                  { offset: 1, color: '#11998e' },
                ],
              },
            },
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 16,
              color: [[1, '#eef1f6']],
            },
          },
          pointer: { width: 5, length: '62%', itemStyle: { color: '#1677ff' } },
          axisTick: { distance: -20, splitNumber: 5, lineStyle: { color: '#cdd3de' } },
          splitLine: { distance: -24, length: 10, lineStyle: { color: '#cdd3de' } },
          axisLabel: { distance: -8, color: '#9aa3b5', fontSize: 11 },
          anchor: { show: true, size: 14, itemStyle: { color: '#1677ff' } },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: '#1f2937',
            fontSize: 30,
            fontWeight: 700,
            offsetCenter: [0, '38%'],
          },
          title: { offsetCenter: [0, '68%'], color: '#9aa3b5', fontSize: 13 },
          data: [{ value: Number(margin.toFixed(2)), name: '毛利率' }],
        },
      ],
    }
  }, [profitStats])

  // 热销商品横向柱状图（按销量，隐私模式下仍可展示）
  const topOption = useMemo(() => {
    const sorted = [...topProducts].sort((a, b) => a.total_quantity - b.total_quantity)
    return {
      grid: { left: 12, right: 28, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: { name: string; value: number }[]) => {
          const p = params[0]
          const item = topProducts.find(t => t.product_name === p.name)
          const amountLine = isPrivacyMode || !item ? '' : `<br/>金额：¥${fmtMoney(item.total_amount)}`
          return `${p.name}<br/>销量：${p.value}${amountLine}`
        },
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f2f5' } },
        axisLabel: { color: '#9aa3b5' },
      },
      yAxis: {
        type: 'category',
        data: sorted.map(p => p.product_name),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#4b5563', fontSize: 13 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 14,
          itemStyle: {
            borderRadius: [0, 7, 7, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#4096ff' },
                { offset: 1, color: '#11998e' },
              ],
            },
          },
          label: { show: true, position: 'right', color: '#6b7280' },
          data: sorted.map(p => p.total_quantity),
          animationDelay: (idx: number) => idx * 80,
        },
      ],
    }
  }, [topProducts, isPrivacyMode])

  const topColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_: unknown, __: unknown, index: number) => index + 1 },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '销售数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 100 },
    {
      title: '销售金额', dataIndex: 'total_amount', key: 'total_amount', width: 120,
      render: (v: number) => isPrivacyMode ? '***' : `¥${fmtMoney(v)}`,
    },
  ]

  const hasTop = topProducts.length > 0

  return (
    <div>
      <Card title="销售报表" style={{ marginBottom: 16 }}
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
          <Col xs={24} sm={12} md={8} lg={8}>
            <KpiCard label="今日销售额" value={dailySales?.total_amount || 0} money masked={isPrivacyMode}
              color="green" icon={<DollarOutlined />} delay={0} />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <KpiCard label="今日实收" value={dailySales?.paid_amount || 0} money masked={isPrivacyMode}
              color="blue" icon={<PayCircleOutlined />} delay={1} />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <KpiCard label="今日订单" value={dailySales?.total_orders || 0}
              color="cyan" icon={<ShoppingCartOutlined />} delay={2}
              onClick={() => navigate(`/sales/orders?date=${selectedDate.format('YYYY-MM-DD')}`)} />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <KpiCard label="今日销售商品" value={dailySales?.total_quantity || 0}
              color="orange" icon={<AppstoreOutlined />} delay={3} />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <KpiCard label="今日毛利" value={profitStats?.gross_profit || 0} money masked={isPrivacyMode}
              color="red" icon={<RiseOutlined />} delay={4} />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <KpiCard label="今日国补" value={dailySales?.subsidy_amount || 0} money masked={isPrivacyMode}
              color="purple" icon={<GiftOutlined />} delay={5} />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="利润分析" className={styles.chartCard}>
            {isPrivacyMode
              ? <div className={styles.maskedTip}>隐私模式下已隐藏金额数据</div>
              : <EChart option={profitOption} height={300} />}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="毛利率" className={styles.chartCard}>
            {isPrivacyMode
              ? <div className={styles.maskedTip}>隐私模式下已隐藏金额数据</div>
              : <EChart option={gaugeOption} height={300} />}
          </Card>
        </Col>
      </Row>

      <Card
        title="热销商品 TOP 10"
        className={styles.chartCard}
        extra={
          <RangePicker
            allowClear={false}
            value={topRange}
            onChange={(v) => { if (v && v[0] && v[1]) setTopRange([v[0], v[1]]) }}
            presets={[
              { label: '近一周', value: [dayjs().subtract(7, 'day'), dayjs()] },
              { label: '近一个月', value: [dayjs().subtract(1, 'month'), dayjs()] },
              { label: '近三个月', value: [dayjs().subtract(3, 'month'), dayjs()] },
            ]}
          />
        }
      >
        {hasTop && <EChart option={topOption} height={Math.max(220, topProducts.length * 34)} />}
        <Table
          style={{ marginTop: hasTop ? 16 : 0 }}
          columns={topColumns}
          dataSource={topProducts}
          rowKey="product_id"
          loading={topLoading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}
