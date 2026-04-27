import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Tag, Alert } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { inventoryApi } from '../../services/inventoryApi'
import type { Inventory, Warehouse, Product, StockInRequest } from '../../types/inventory'

export default function InventoryList() {
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>()
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [stockInOpen, setStockInOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadInventory()
    loadWarehouses()
  }, [page, keyword, warehouseFilter, lowStockOnly])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const res = await inventoryApi.getInventory(page, 20, {
        keyword: keyword || undefined,
        warehouseId: warehouseFilter,
        lowStockOnly
      })
      setInventory(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const loadWarehouses = async () => {
    const res = await inventoryApi.getWarehouses(1, 100)
    setWarehouses(res.items || [])
  }

  const handleStockIn = () => {
    form.resetFields()
    setStockInOpen(true)
  }

  const handleStockInSubmit = async () => {
    try {
      const values = await form.validateFields()
      await inventoryApi.stockIn(values as StockInRequest)
      message.success('入库成功')
      setStockInOpen(false)
      loadInventory()
    } catch {
      message.error('入库失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse_name' },
    {
      title: '当前库存', dataIndex: 'quantity', key: 'quantity', width: 100, sorter: (a: Inventory, b: Inventory) => a.quantity - b.quantity,
      render: (qty: number, record: Inventory) => {
        const isLow = record.is_low_stock || qty <= record.min_quantity
        return isLow ? <Tag color="red">{qty}</Tag> : qty
      }
    },
    {
      title: '最低库存', dataIndex: 'min_quantity', key: 'min_quantity', width: 100,
    },
    {
      title: '状态', key: 'status', width: 100,
      render: (_: unknown, record: Inventory) => {
        const isLow = record.is_low_stock || record.quantity <= record.min_quantity
        return isLow ? <Tag color="red">库存不足</Tag> : <Tag color="green">正常</Tag>
      }
    },
  ]

  return (
    <Card
      title="库存查询"
      extra={
        <Space>
          <Input.Search autoComplete="off"
            placeholder="搜索商品名称"
            onSearch={setKeyword}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            placeholder="选择仓库"
            allowClear
            style={{ width: 160 }}
            value={warehouseFilter}
            onChange={setWarehouseFilter}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
          />
          <Button
            type={lowStockOnly ? 'primary' : 'default'}
            danger={lowStockOnly}
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            仅看库存不足
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleStockIn}>采购入库</Button>
        </Space>
      }
    >
      {lowStockOnly && (
        <Alert
          message="正在显示库存不足的商品"
          type="warning"
          showIcon
          closable
          onClose={() => setLowStockOnly(false)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={inventory}
        rowKey="id"
        loading={loading}
        scroll={{ x: 600 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`
        }}
      />

      <Modal
        title="采购入库"
        open={stockInOpen}
        onOk={handleStockInSubmit}
        onCancel={() => setStockInOpen(false)}
        okText="确认入库"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="product_id" label="商品" rules={[{ required: true, message: '请选择商品' }]}>
            <Select
              showSearch
              placeholder="搜索选择商品"
              filterOption={false}
              onSearch={async (val) => {
                if (val) {
                  const res = await inventoryApi.getProducts(1, 20, { keyword: val })
                  setProducts(res.items || [])
                }
              }}
              options={products.map(p => ({ value: p.id, label: `${p.name} (${p.brand_name || ''}) ¥${p.sale_price}` }))}
            />
          </Form.Item>
          <Form.Item name="warehouse_id" label="入库仓库" rules={[{ required: true, message: '请选择仓库' }]}>
            <Select placeholder="请选择仓库" options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
          </Form.Item>
          <Form.Item name="quantity" label="入库数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入入库数量" />
          </Form.Item>
          <Form.Item name="purchase_price" label="进货价">
            <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} placeholder="可选，留空使用商品默认进货价" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
