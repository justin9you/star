import { useEffect, useState, useRef } from 'react'
import { Card, Table, Button, Input, InputNumber, Space, Select, AutoComplete, Tag, Divider, message, Row, Col, Statistic } from 'antd'
import { PlusOutlined, DeleteOutlined, ScanOutlined, SearchOutlined } from '@ant-design/icons'
import { purchaseApi } from '../../services/purchaseApi'
import { inventoryApi } from '../../services/inventoryApi'
import { usePrivacyStore } from '../../stores/privacyStore'
import type { Warehouse, Product } from '../../types/inventory'
import type { PurchaseOrderItemCreate } from '../../types/purchase'

interface OrderItem {
  key: string
  product_id: number
  product_name: string
  product_spec?: string
  product_unit: string
  purchase_price: number
  quantity: number
  unit_price: number
  subtotal: number
  is_gift: boolean
}

export default function PurchaseOrder() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<any>(null)
  const { isPrivacyMode } = usePrivacyStore()

  useEffect(() => {
    loadWarehouses()
  }, [])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const loadWarehouses = async () => {
    const res = await inventoryApi.getWarehouses(1, 100)
    setWarehouses(res.items || [])
    if (res.items && res.items.length > 0) {
      setSelectedWarehouse(res.items[0].id)
    }
  }

  const searchProducts = async (keyword: string) => {
    if (!keyword.trim()) {
      setProducts([])
      return
    }
    setSearchLoading(true)
    try {
      const res = await inventoryApi.getProducts(1, 20, { keyword })
      setProducts(res.items || [])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleInputChange = (val: string) => {
    setInputValue(val)
    searchProducts(val)
  }

  const tryScanAdd = async (code: string): Promise<boolean> => {
    try {
      const res = await inventoryApi.scanProduct(code)
      if (res.data) {
        const product = res.data as Product
        addItem(product)
        message.success(`已添加: ${product.name}`)
        return true
      }
    } catch {
      // 扫码失败
    }
    return false
  }

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      setItems(items.map(i =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
          : i
      ))
    } else {
      setItems([...items, {
        key: `item-${product.id}`,
        product_id: product.id,
        product_name: product.name,
        product_spec: product.spec,
        product_unit: product.unit,
        purchase_price: product.purchase_price,
        quantity: 1,
        unit_price: product.purchase_price,
        subtotal: product.purchase_price,
        is_gift: false,
      }])
    }
  }

  const handleSearch = async () => {
    const val = inputValue.trim()
    if (!val) return

    const scanned = await tryScanAdd(val)
    if (scanned) {
      setInputValue('')
      setProducts([])
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }

    if (products.length === 1) {
      addItem(products[0])
      message.success(`已添加: ${products[0].name}`)
      setInputValue('')
      setProducts([])
    } else if (products.length === 0) {
      message.info('未找到商品')
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSelect = (productId: number) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      addItem(product)
      message.success(`已添加: ${product.name}`)
    }
    setInputValue('')
    setProducts([])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return
    setItems(items.map(i =>
      i.product_id === productId
        ? { ...i, quantity, subtotal: quantity * i.unit_price }
        : i
    ))
  }

  const handleUnitPriceChange = (productId: number, unitPrice: number) => {
    setItems(items.map(i =>
      i.product_id === productId
        ? { ...i, unit_price: unitPrice, subtotal: i.quantity * unitPrice }
        : i
    ))
  }

  const handleToggleGift = (productId: number) => {
    setItems(items.map(i => {
      if (i.product_id === productId) {
        const newIsGift = !i.is_gift
        return {
          ...i,
          is_gift: newIsGift,
          unit_price: newIsGift ? 0 : i.purchase_price,
          subtotal: newIsGift ? 0 : i.quantity * i.purchase_price,
        }
      }
      return i
    }))
  }

  const handleRemoveItem = (productId: number) => {
    setItems(items.filter(i => i.product_id !== productId))
  }

  const totalAmount = items.reduce((sum, i) => sum + (i.is_gift ? 0 : i.subtotal), 0)
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)
  const giftQuantity = items.filter(i => i.is_gift).reduce((sum, i) => sum + i.quantity, 0)

  const handleSubmit = async () => {
    if (!selectedWarehouse) {
      message.error('请选择入库仓库')
      return
    }
    if (items.length === 0) {
      message.error('请添加商品')
      return
    }

    setSubmitting(true)
    try {
      const orderItems: PurchaseOrderItemCreate[] = items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        is_gift: i.is_gift,
      }))

      await purchaseApi.createOrder({
        warehouse_id: selectedWarehouse,
        items: orderItems,
        supplier_name: supplierName || undefined,
        supplier_phone: supplierPhone || undefined,
        remark: remark || undefined,
      })

      message.success('进货单创建成功')
      setItems([])
      setSupplierName('')
      setSupplierPhone('')
      setRemark('')
    } catch {
      message.error('创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const options = products.map(p => ({
    value: p.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{p.name} {p.brand_name ? `| ${p.brand_name}` : ''}</span>
        <span style={{ color: '#666' }}>进价: ¥{p.purchase_price}</span>
      </div>
    ),
  }))

  const columns = [
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '规格', dataIndex: 'product_spec', key: 'product_spec', width: 100 },
    { title: '单位', dataIndex: 'product_unit', key: 'product_unit', width: 60 },
    {
      title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 120,
      render: (v: number, record: OrderItem) => (
        record.is_gift
          ? <Tag color="orange">搭送</Tag>
          : <InputNumber
              min={0} precision={2} size="small" style={{ width: 90 }}
              value={v}
              onChange={(val) => handleUnitPriceChange(record.product_id, val || 0)}
            />
      ),
    },
    {
      title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100,
      render: (qty: number, record: OrderItem) => (
        <InputNumber min={1} size="small" style={{ width: 70 }}
          value={qty} onChange={v => handleQuantityChange(record.product_id, v || 1)} />
      ),
    },
    {
      title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 100,
      render: (v: number, record: OrderItem) => record.is_gift ? '-' : `¥${v.toFixed(2)}`,
    },
    {
      title: '搭送', dataIndex: 'is_gift', key: 'is_gift', width: 60,
      render: (v: boolean, record: OrderItem) => (
        <Button type="link" size="small"
          style={{ color: v ? '#fa8c16' : undefined }}
          onClick={() => handleToggleGift(record.product_id)}>
          {v ? '是' : '否'}
        </Button>
      ),
    },
    {
      title: '', key: 'action', width: 50,
      render: (_: unknown, record: OrderItem) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.product_id)} />
      ),
    },
  ]

  return (
    <Card title="创建进货单">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Space>
            <span>入库仓库:</span>
            <Select style={{ width: 200 }}
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            />
          </Space>
        </Col>
        <Col span={6}>
          <Space>
            <span>供应商:</span>
            <Input placeholder="名称" style={{ width: 120 }} value={supplierName}
              onChange={e => setSupplierName(e.target.value)} />
            <Input placeholder="电话" style={{ width: 120 }} value={supplierPhone}
              onChange={e => setSupplierPhone(e.target.value)} />
          </Space>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <AutoComplete
          ref={inputRef}
          style={{ width: '100%', maxWidth: 500 }}
          value={inputValue}
          options={options}
          onSearch={handleInputChange}
          onSelect={(val) => handleSelect(Number(val))}
          onChange={(val) => { if (typeof val === 'string') setInputValue(val) }}
        >
          <Input.Search
            placeholder="扫码或搜索商品名称"
            prefix={<ScanOutlined />}
            enterButton={<><SearchOutlined /> 添加</>}
            size="large"
            loading={searchLoading}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
          />
        </AutoComplete>
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          支持扫码枪扫描，或输入商品名称搜索
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={items}
        rowKey="key"
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={5}><strong>合计</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={5}>
              {!isPrivacyMode && <strong>¥{totalAmount.toFixed(2)}</strong>}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} colSpan={2} />
          </Table.Summary.Row>
        )}
      />

      <Divider />

      <Row gutter={24} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="总数量" value={totalQuantity} suffix="件" />
        </Col>
        <Col span={6}>
          <Statistic title="搭送数量" value={giftQuantity} suffix="件" valueStyle={{ color: '#fa8c16' }} />
        </Col>
        <Col span={6}>
          {!isPrivacyMode && (
            <Statistic title="总金额" value={totalAmount} precision={2} prefix="¥" />
          )}
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Input placeholder="备注（可选）" value={remark}
            onChange={e => setRemark(e.target.value)} />
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => {
              setItems([])
              setSupplierName('')
              setSupplierPhone('')
              setRemark('')
            }}>
              清空
            </Button>
            <Button type="primary" size="large" loading={submitting}
              disabled={items.length === 0 || !selectedWarehouse}
              onClick={handleSubmit}>
              确认入库
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  )
}
