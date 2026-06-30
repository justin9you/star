import { useState, useRef, useEffect } from 'react'
import { Card, Table, Button, Input, InputNumber, Space, Modal, Form, Row, Col, Divider, Alert, message, AutoComplete, Select } from 'antd'
import { SwapOutlined, ScanOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { inventoryApi } from '../../../services/inventoryApi'
import { usePrivacyStore } from '../../../stores/privacyStore'
import type { StepProps, OrderItem, SalesOrderState } from '../types'
import type { ProductCreate } from '../../../types/inventory'

const ITEM_COLUMNS = [
  { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 70, align: 'center' as const },
  { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 110, align: 'right' as const, render: (v: number) => `¥${v.toFixed(2)}` },
  { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 120, align: 'right' as const, render: (v: number) => `¥${v.toFixed(2)}` },
]

const OLD_COLUMNS = [
  { title: '旧电器类型', dataIndex: 'category', key: 'category' },
  { title: '品牌', dataIndex: 'brand', key: 'brand' },
  { title: '成色', dataIndex: 'condition', key: 'condition' },
  { title: '回收价', dataIndex: 'recycle_price', key: 'recycle_price', render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
]

interface ProductStepProps extends StepProps {
  onProductsUpdate: (products: SalesOrderState['products']) => void
}

export function ProductStep({ state, onStateChange, onNext, onPrev, onProductsUpdate }: ProductStepProps) {
  const [inputValue, setInputValue] = useState('')
  const [noStockWarning, setNoStockWarning] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const inputRef = useRef<any>(null)
  const { isPrivacyMode } = usePrivacyStore()

  // 旧电器弹窗
  const [oldApplianceModalOpen, setOldApplianceModalOpen] = useState(false)
  const [oldForm] = Form.useForm()

  // 快捷添加商品弹窗
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productForm] = Form.useForm()

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const totalAmount = state.orderItems.reduce((sum, i) => sum + i.subtotal, 0)

  const addItem = (product: { id: number; name: string; sale_price: number; unit: string }) => {
    const existing = state.orderItems.find(i => i.product_id === product.id)
    if (existing) {
      onStateChange({
        orderItems: state.orderItems.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
            : i
        ),
      })
    } else {
      onStateChange({
        orderItems: [...state.orderItems, {
          key: `item-${product.id}`,
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.sale_price,
          unit: product.unit,
          subtotal: product.sale_price,
        }],
      })
    }
  }

  // 尝试扫码添加，如果成功返回 true
  const tryScanAdd = async (code: string): Promise<boolean> => {
    try {
      const res = await inventoryApi.scanProduct(code)
      if (res.data) {
        const product = res.data as { id: number; name: string; sale_price: number; unit: string; has_stock: boolean }
        if (!product.has_stock) {
          setNoStockWarning(`"${product.name}" 库存不足`)
          return true
        }
        addItem(product)
        message.success(`已添加: ${product.name}`)
        return true
      }
    } catch {
      // 扫码失败，继续搜索
    }
    return false
  }

  // 搜索商品
  const searchProducts = async (keyword: string) => {
    if (!keyword.trim()) {
      onProductsUpdate([])
      return
    }
    setSearchLoading(true)
    try {
      const res = await inventoryApi.getProducts(1, 20, { keyword })
      onProductsUpdate(res.items || [])
    } finally {
      setSearchLoading(false)
    }
  }

  // 输入变化时
  const handleInputChange = (val: string) => {
    setInputValue(val)
    // 同时搜索商品
    searchProducts(val)
  }

  // 回车或点击搜索按钮
  const handleSearch = async () => {
    const val = inputValue.trim()
    if (!val) return

    // 先尝试扫码
    const scanned = await tryScanAdd(val)
    if (scanned) {
      setInputValue('')
      onProductsUpdate([])
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }

    // 扫码失败，如果搜索结果只有一个，直接添加
    if (state.products.length === 1) {
      const product = state.products[0]
      addItem(product)
      message.success(`已添加: ${product.name}`)
      setInputValue('')
      onProductsUpdate([])
    } else if (state.products.length === 0) {
      message.info('未找到商品，可手动添加')
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // 选择下拉项
  const handleSelect = (productId: number) => {
    const product = state.products.find(p => p.id === productId)
    if (product) {
      addItem(product)
      message.success(`已添加: ${product.name}`)
    }
    setInputValue('')
    onProductsUpdate([])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleRemoveItem = (productId: number) => {
    onStateChange({ orderItems: state.orderItems.filter(i => i.product_id !== productId) })
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return
    onStateChange({
      orderItems: state.orderItems.map(i =>
        i.product_id === productId
          ? { ...i, quantity, subtotal: quantity * i.unit_price }
          : i
      ),
    })
  }

  const handleAddOldAppliance = async () => {
    try {
      const values = await oldForm.validateFields()
      const oldWh = state.warehouses.find(w => w.type === '旧货专用仓')
      onStateChange({ oldAppliances: [...state.oldAppliances, { ...values, warehouse_id: oldWh?.id }] })
      setOldApplianceModalOpen(false)
      oldForm.resetFields()
      message.success('已添加旧电器')
    } catch {
      // validation failed
    }
  }

  const handleRemoveOldAppliance = (index: number) => {
    onStateChange({ oldAppliances: state.oldAppliances.filter((_, i) => i !== index) })
  }

  const handleAddProductSubmit = async () => {
    try {
      const values = await productForm.validateFields()
      // 隐私模式下，进货价默认设为0
      if (isPrivacyMode && values.purchase_price === undefined) {
        values.purchase_price = 0
      }
      await inventoryApi.createProduct(values as ProductCreate)
      message.success('商品添加成功')
      setProductModalOpen(false)
      productForm.resetFields()
      const prodRes = await inventoryApi.getProducts(1, 100)
      onProductsUpdate(prodRes.items || [])
    } catch {
      message.error('添加失败')
    }
  }

  const columnsWithActions = [
    ...ITEM_COLUMNS,
    {
      title: '数量', dataIndex: 'quantity', key: 'quantity', width: 120,
      render: (qty: number, record: OrderItem) => (
        <InputNumber min={1} value={qty} onChange={v => handleQuantityChange(record.product_id, v || 1)} size="small" style={{ width: 80 }} />
      ),
    },
    {
      title: '', key: 'action', width: 60,
      render: (_: unknown, record: OrderItem) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record.product_id)} />
      ),
    },
  ]

  const oldColumnsWithActions = [
    ...OLD_COLUMNS,
    {
      title: '', key: 'action', width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveOldAppliance(index)} />
      ),
    },
  ]

  // 自动完成选项
  const options = state.products.map(p => ({
    value: p.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{p.name} {p.brand_name ? `| ${p.brand_name}` : ''}</span>
        <span style={{ color: '#cf1322' }}>¥{p.sale_price}</span>
      </div>
    ),
  }))

  // 无结果时添加选项
  if (inputValue.trim() && state.products.length === 0 && !searchLoading) {
    options.push({
      value: 'add_new' as any,
      label: (
        <Button type="link" icon={<PlusOutlined />} style={{ padding: 0 }}>
          添加新商品 "{inputValue}"
        </Button>
      ),
    })
  }

  return (
    <Card
      title="选择商品"
      extra={
        <Button icon={<SwapOutlined />} onClick={() => setOldApplianceModalOpen(true)}>添加旧电器</Button>
      }
    >
      {/* 统一输入区：扫码 + 搜索 */}
      <div style={{ marginBottom: 16 }}>
        <AutoComplete
          ref={inputRef}
          style={{ width: '100%', maxWidth: 500 }}
          value={inputValue}
          options={options}
          onSearch={handleInputChange}
          onSelect={(val) => {
            if (val === 'add_new') {
              productForm.setFieldsValue({ name: inputValue })
              setProductModalOpen(true)
              setInputValue('')
              onProductsUpdate([])
            } else {
              handleSelect(Number(val))
            }
          }}
          onChange={(val) => {
            if (typeof val === 'string') {
              setInputValue(val)
            }
          }}
        >
          <Input.Search
            className="scan-add-search"
            placeholder="扫码或搜索商品名称"
            prefix={<ScanOutlined />}
            enterButton={<><SearchOutlined /> 添加</>}
            size="large"
            loading={searchLoading}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
          />
        </AutoComplete>
        <div className="scan-hint" style={{ marginTop: 8 }}>
          支持扫码枪直接扫描，或输入商品名称搜索选择
        </div>
      </div>

      {/* 无货警告 */}
      {noStockWarning && (
        <Alert
          message={noStockWarning}
          type="warning"
          showIcon
          closable
          onClose={() => setNoStockWarning(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columnsWithActions}
        dataSource={state.orderItems}
        rowKey="key"
        pagination={false}
        size="small"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3}><strong>合计</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={3} align="right"><strong>¥{totalAmount.toFixed(2)}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={4} colSpan={2} />
          </Table.Summary.Row>
        )}
      />

      {state.oldAppliances.length > 0 && (
        <>
          <Divider orientation="left">以旧换新</Divider>
          <Table
            columns={oldColumnsWithActions}
            dataSource={state.oldAppliances.map((o, i) => ({ ...o, key: `old-${i}` }))}
            rowKey="key"
            pagination={false}
            size="small"
          />
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <Space>
          <Button onClick={onPrev}>上一步</Button>
          <Button type="primary" disabled={state.orderItems.length === 0} onClick={onNext}>
            下一步：确认开单
          </Button>
        </Space>
      </div>

      {/* 添加旧电器弹窗 */}
      <Modal
        title="添加旧电器"
        open={oldApplianceModalOpen}
        onOk={handleAddOldAppliance}
        onCancel={() => setOldApplianceModalOpen(false)}
        okText="添加"
        cancelText="取消"
      >
        <Form form={oldForm} layout="vertical">
          <Form.Item name="category" label="旧电器类型" rules={[{ required: true, message: '请输入类型' }]}>
            <Input placeholder="如：旧冰箱、旧空调" autoComplete="off" />
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            <Input placeholder="请输入品牌" autoComplete="off" />
          </Form.Item>
          <Form.Item name="condition" label="成色">
            <Select placeholder="请选择成色" options={[
              { value: '新', label: '新' },
              { value: '旧', label: '旧' },
              { value: '差', label: '差' },
            ]} />
          </Form.Item>
          <Form.Item name="recycle_price" label="回收价">
            <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="请输入备注" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 快捷添加商品弹窗 */}
      <Modal
        title="快捷添加商品"
        open={productModalOpen}
        onOk={handleAddProductSubmit}
        onCancel={() => setProductModalOpen(false)}
        okText="添加"
        cancelText="取消"
        width={500}
      >
        <Form form={productForm} layout="vertical">
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
            <Input placeholder="请输入商品名称" autoComplete="off" />
          </Form.Item>
          <Form.Item name="brand_id" label="品牌" rules={[{ required: true }]}>
            <Select placeholder="请选择品牌" options={state.brands.map(b => ({ value: b.id, label: b.name }))} />
          </Form.Item>
          <Form.Item name="category_id" label="类型" rules={[{ required: true }]}>
            <Select placeholder="请选择类型" options={state.categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="spec" label="规格">
            <Input placeholder="如：200L/1.5匹/8kg" autoComplete="off" />
          </Form.Item>
          <Row gutter={16}>
            {!isPrivacyMode && (
              <Col span={12}>
                <Form.Item name="purchase_price" label="进货价" rules={[{ required: !isPrivacyMode }]}>
                  <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            )}
            <Col span={isPrivacyMode ? 24 : 12}>
              <Form.Item name="sale_price" label="销售价" rules={[{ required: true }]}>
                <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="unit" label="单位" initialValue="台">
            <Select options={[{ value: '台', label: '台' }, { value: '套', label: '套' }, { value: '件', label: '件' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}