import { useEffect, useState, useRef } from 'react'
import { Card, Steps, Button, Form, Input, InputNumber, Select, Table, Space, message, Divider, Modal, Descriptions, Row, Col, Statistic, Alert } from 'antd'
import { UserOutlined, ShoppingCartOutlined, CheckOutlined, DeleteOutlined, SwapOutlined, ScanOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { salesApi } from '../../services/salesApi'
import { inventoryApi } from '../../services/inventoryApi'
import type { Customer, OldApplianceCreate, SalesOrderItemCreate, CustomerCreate } from '../../types/sales'
import type { Product, Warehouse, Brand, Category, ProductCreate } from '../../types/inventory'
import RegionSelect from '../../components/RegionSelect'

interface OrderItem {
  key: string
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  unit: string
  subtotal: number
}

export default function SalesOrder() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [discountAmount, setDiscountAmount] = useState(0)
  const [orderRemark, setOrderRemark] = useState('')
  const [oldAppliances, setOldAppliances] = useState<OldApplianceCreate[]>([])
  const [oldApplianceModalOpen, setOldApplianceModalOpen] = useState(false)
  const [oldForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [scanCode, setScanCode] = useState('')
  const [noStockWarning, setNoStockWarning] = useState<string | null>(null)
  const scanInputRef = useRef<any>(null)
  // 快捷添加客户
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [customerForm] = Form.useForm()
  const [customerSearchValue, setCustomerSearchValue] = useState('')
  // 快捷添加商品
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productForm] = Form.useForm()
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [productSearchValue, setProductSearchValue] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  // 扫码输入框自动聚焦
  useEffect(() => {
    if (currentStep === 1 && scanInputRef.current) {
      scanInputRef.current.focus()
    }
  }, [currentStep])

  const loadInitialData = async () => {
    const [custRes, prodRes, whRes, brandRes, categoryRes] = await Promise.all([
      salesApi.getCustomers(1, 100),
      inventoryApi.getProducts(1, 100),
      inventoryApi.getWarehouses(1, 100),
      inventoryApi.getBrands(1, 100),
      inventoryApi.getCategories(1, 100)
    ])
    setCustomers(custRes.items || [])
    setProducts(prodRes.items || [])
    setWarehouses(whRes.items || [])
    setBrands(brandRes.items || [])
    setCategories(categoryRes.items || [])
  }

  const totalAmount = orderItems.reduce((sum, i) => sum + i.subtotal, 0)
  const finalAmount = totalAmount - discountAmount

  // 扫码添加商品
  const handleScanSubmit = async () => {
    const code = scanCode.trim()
    if (!code) return

    try {
      const res = await inventoryApi.scanProduct(code)
      if (res.data) {
        const product = res.data as { id: number; name: string; sale_price: number; unit: string; total_stock: number; has_stock: boolean }

        // 检查库存
        if (!product.has_stock) {
          setNoStockWarning(`"${product.name}" 库存不足，当前库存: 0`)
          setScanCode('')
          return
        }

        // 添加到订单
        const existing = orderItems.find(i => i.product_id === product.id)
        if (existing) {
          setOrderItems(orderItems.map(i =>
            i.product_id === product.id
              ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
              : i
          ))
        } else {
          setOrderItems([...orderItems, {
            key: `item-${product.id}`,
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: product.sale_price,
            unit: product.unit,
            subtotal: product.sale_price,
          }])
        }
        message.success(`已添加: ${product.name}`)
      }
    } catch {
      message.error('未找到该商品')
    }
    setScanCode('')
    // 保持焦点在扫码输入框
    setTimeout(() => scanInputRef.current?.focus(), 100)
  }

  const handleAddProduct = (productId: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const existing = orderItems.find(i => i.product_id === productId)
    if (existing) {
      setOrderItems(orderItems.map(i =>
        i.product_id === productId
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
          : i
      ))
    } else {
      setOrderItems([...orderItems, {
        key: `item-${productId}`,
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.sale_price,
        unit: product.unit,
        subtotal: product.sale_price,
      }])
    }
  }

  const handleRemoveItem = (productId: number) => {
    setOrderItems(orderItems.filter(i => i.product_id !== productId))
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return
    setOrderItems(orderItems.map(i =>
      i.product_id === productId
        ? { ...i, quantity, subtotal: quantity * i.unit_price }
        : i
    ))
  }

  const handleAddOldAppliance = async () => {
    try {
      const values = await oldForm.validateFields()
      const oldWh = warehouses.find(w => w.type === '旧货专用仓')
      setOldAppliances([...oldAppliances, { ...values, warehouse_id: oldWh?.id }])
      setOldApplianceModalOpen(false)
      oldForm.resetFields()
      message.success('已添加旧电器')
    } catch {
      // validation failed
    }
  }

  const handleRemoveOldAppliance = (index: number) => {
    setOldAppliances(oldAppliances.filter((_, i) => i !== index))
  }

  // 快捷添加客户
  const handleAddCustomer = async () => {
    try {
      const values = await customerForm.validateFields()
      const [province, city, district, town] = values.region || ['江苏省', '苏州市', '吴中区', '临湖镇']
      const submitData: CustomerCreate = {
        name: values.name,
        phone: values.phone,
        contact: values.contact,
        province,
        city,
        district,
        town,
        address: values.address,
      }
      await salesApi.createCustomer(submitData)
      message.success('客户添加成功')
      setCustomerModalOpen(false)
      customerForm.resetFields()
      // 刷新客户列表并选中新客户
      const custRes = await salesApi.getCustomers(1, 100)
      setCustomers(custRes.items || [])
      const newCustomer = custRes.items?.find(c => c.name === values.name && c.phone === values.phone)
      if (newCustomer) {
        setSelectedCustomerId(newCustomer.id)
      }
    } catch {
      message.error('添加失败')
    }
  }

  // 快捷添加商品
  const handleAddProductSubmit = async () => {
    try {
      const values = await productForm.validateFields()
      await inventoryApi.createProduct(values as ProductCreate)
      message.success('商品添加成功')
      setProductModalOpen(false)
      productForm.resetFields()
      // 刷新商品列表
      const prodRes = await inventoryApi.getProducts(1, 100)
      setProducts(prodRes.items || [])
    } catch {
      message.error('添加失败')
    }
  }

  const handleSubmitOrder = async () => {
    if (!selectedCustomerId) {
      message.error('请选择客户')
      return
    }
    if (orderItems.length === 0) {
      message.error('请添加商品')
      return
    }

    setSubmitting(true)
    try {
      const items: SalesOrderItemCreate[] = orderItems.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }))
      const result = await salesApi.createOrder({
        customer_id: selectedCustomerId,
        items,
        discount_amount: discountAmount || undefined,
        old_appliances: oldAppliances.length > 0 ? oldAppliances : undefined,
        remark: orderRemark || undefined,
      })
      message.success('开单成功！')
      // 跳转到订单列表并展开刚创建的订单详情
      const orderId = (result.data as { id: number })?.id
      if (orderId) {
        navigate(`/sales/orders?highlight=${orderId}&autoDetail=true`)
      } else {
        navigate('/sales/orders')
      }
    } catch {
      message.error('开单失败')
    } finally {
      setSubmitting(false)
    }
  }

  const itemColumns = [
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    {
      title: '数量', dataIndex: 'quantity', key: 'quantity', width: 120,
      render: (qty: number, record: OrderItem) => (
        <InputNumber min={1} value={qty} onChange={v => handleQuantityChange(record.product_id, v || 1)} size="small" style={{ width: 80 }} />
      )
    },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 90, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 100, render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: '', key: 'action', width: 60,
      render: (_: unknown, record: OrderItem) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record.product_id)} />
      )
    },
  ]

  const oldColumns = [
    { title: '旧电器类型', dataIndex: 'category', key: 'category' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '成色', dataIndex: 'condition', key: 'condition' },
    { title: '回收价', dataIndex: 'recycle_price', key: 'recycle_price', render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
    {
      title: '', key: 'action', width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveOldAppliance(index)} />
      )
    },
  ]

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  return (
    <div>
      <Card title="销售开单" style={{ marginBottom: 16 }}>
        <Steps
          current={currentStep}
          onChange={(step) => {
            // 只允许回退到已完成的步骤，不能跳过步骤向前跳
            if (step < currentStep) {
              setCurrentStep(step)
            }
          }}
          items={[
            { title: '选择客户', icon: <UserOutlined /> },
            { title: '选择商品', icon: <ShoppingCartOutlined /> },
            { title: '确认开单', icon: <CheckOutlined /> },
          ]}
        />
      </Card>

      {currentStep === 0 && (
        <Card title="选择客户">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Select
              showSearch
              style={{ width: '100%' }}
              placeholder="搜索客户姓名或电话"
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              filterOption={false}
              searchValue={customerSearchValue}
              onSearch={async (val) => {
                setCustomerSearchValue(val)
                if (val) {
                  const res = await salesApi.getCustomers(1, 20, val)
                  setCustomers(res.items || [])
                }
              }}
              notFoundContent={
                customerSearchValue ? (
                  <Button type="link" icon={<PlusOutlined />} onClick={() => {
                    customerForm.setFieldsValue({ name: customerSearchValue })
                    setCustomerModalOpen(true)
                  }}>
                    添加客户 "{customerSearchValue}"
                  </Button>
                ) : '输入搜索客户'
              }
              options={customers.map(c => ({
                value: c.id,
                label: `${c.name} - ${c.phone}`,
              }))}
            />
            {selectedCustomer && (
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="姓名">{selectedCustomer.name}</Descriptions.Item>
                <Descriptions.Item label="电话">{selectedCustomer.phone}</Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>
                  {selectedCustomer.province}{selectedCustomer.city}{selectedCustomer.district}{selectedCustomer.town}{selectedCustomer.address || ''}
                </Descriptions.Item>
              </Descriptions>
            )}
            <Button type="primary" disabled={!selectedCustomerId} onClick={() => setCurrentStep(1)}>
              下一步：选择商品
            </Button>
          </Space>
        </Card>
      )}

      {currentStep === 1 && (
        <Card
          title="选择商品"
          extra={
            <Space>
              <Select
                showSearch
                style={{ width: 300 }}
                placeholder="搜索选择商品添加"
                filterOption={false}
                searchValue={productSearchValue}
                onSearch={async (val) => {
                  setProductSearchValue(val)
                  if (val) {
                    const res = await inventoryApi.getProducts(1, 20, { keyword: val })
                    setProducts(res.items || [])
                  }
                }}
                onChange={handleAddProduct}
                notFoundContent={
                  productSearchValue ? (
                    <Button type="link" icon={<PlusOutlined />} onClick={() => {
                      productForm.setFieldsValue({ name: productSearchValue })
                      setProductModalOpen(true)
                    }}>
                      添加商品 "{productSearchValue}"
                    </Button>
                  ) : '输入搜索商品'
                }
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.name} | ${p.brand_name || ''} | ¥${p.sale_price}`,
                }))}
              />
              <Button icon={<SwapOutlined />} onClick={() => setOldApplianceModalOpen(true)}>添加旧电器</Button>
            </Space>
          }
        >
          {/* 扫码输入区 */}
          <div style={{ marginBottom: 16 }}>
            <Input.Search autoComplete="off"
              ref={scanInputRef}
              placeholder="扫码枪扫描录入（支持二维码/条形码）"
              prefix={<ScanOutlined />}
              value={scanCode}
              onChange={e => setScanCode(e.target.value)}
              onSearch={handleScanSubmit}
              onPressEnter={handleScanSubmit}
              enterButton="添加"
              size="large"
              style={{ maxWidth: 500 }}
            />
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
            columns={itemColumns}
            dataSource={orderItems}
            rowKey="key"
            pagination={false}
            size="small"
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}><strong>合计</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={4}><strong>¥{totalAmount.toFixed(2)}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
              </Table.Summary.Row>
            )}
          />

          {oldAppliances.length > 0 && (
            <>
              <Divider orientation="left">以旧换新</Divider>
              <Table
                columns={oldColumns}
                dataSource={oldAppliances.map((o, i) => ({ ...o, key: `old-${i}` }))}
                rowKey="key"
                pagination={false}
                size="small"
              />
            </>
          )}

          <div style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" disabled={orderItems.length === 0} onClick={() => setCurrentStep(2)}>
                下一步：确认开单
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card title="确认开单">
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="客户">{selectedCustomer?.name}</Descriptions.Item>
            <Descriptions.Item label="电话">{selectedCustomer?.phone}</Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>
              {selectedCustomer ? `${selectedCustomer.province}${selectedCustomer.city}${selectedCustomer.district}${selectedCustomer.town}${selectedCustomer.address || ''}` : '-'}
            </Descriptions.Item>
          </Descriptions>

          <Table
            columns={itemColumns.filter(c => c.key !== 'action')}
            dataSource={orderItems}
            rowKey="key"
            pagination={false}
            size="small"
          />

          {oldAppliances.length > 0 && (
            <>
              <Divider orientation="left">以旧换新</Divider>
              <Table
                columns={oldColumns.filter(c => c.key !== 'action')}
                dataSource={oldAppliances.map((o, i) => ({ ...o, key: `old-${i}` }))}
                rowKey="key"
                pagination={false}
                size="small"
              />
            </>
          )}

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Statistic title="商品总额" value={totalAmount} prefix="¥" precision={2} />
            </Col>
            <Col span={8}>
              <div style={{ marginTop: 4 }}>
                <label>优惠金额：</label>
                <InputNumber
                  min={0}
                  max={totalAmount}
                  value={discountAmount}
                  onChange={v => setDiscountAmount(v || 0)}
                  prefix="¥"
                  precision={2}
                  style={{ width: 160 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <Statistic title="实收金额" value={finalAmount} prefix="¥" precision={2} valueStyle={{ color: '#cf1322' }} />
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Input.TextArea autoComplete="off"
              placeholder="备注（可选）"
              value={orderRemark}
              onChange={e => setOrderRemark(e.target.value)}
              rows={2}
              style={{ marginBottom: 16 }}
            />
          </div>

          <Space>
            <Button onClick={() => setCurrentStep(1)}>上一步</Button>
            <Button type="primary" icon={<CheckOutlined />} loading={submitting} onClick={handleSubmitOrder}>
              确认开单
            </Button>
          </Space>
        </Card>
      )}

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

      {/* 快捷添加客户弹窗 */}
      <Modal
        title="快捷添加客户"
        open={customerModalOpen}
        onOk={handleAddCustomer}
        onCancel={() => setCustomerModalOpen(false)}
        okText="添加"
        cancelText="取消"
        width={500}
      >
        <Form form={customerForm} layout="vertical">
          <Form.Item name="name" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}>
            <Input placeholder="请输入客户姓名" autoComplete="off" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="请输入联系电话" autoComplete="off" />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="请输入联系人" autoComplete="off" />
          </Form.Item>
          <Form.Item label="地址" required tooltip="省-市-区-镇四级联动选择">
            <Form.Item name="region" noStyle rules={[{ required: true, message: '请选择地址' }]}>
              <RegionSelect />
            </Form.Item>
          </Form.Item>
          <Form.Item name="address" label="详细地址">
            <Input placeholder="请输入详细地址" autoComplete="off" />
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
            <Select placeholder="请选择品牌" options={brands.map(b => ({ value: b.id, label: b.name }))} />
          </Form.Item>
          <Form.Item name="category_id" label="类型" rules={[{ required: true }]}>
            <Select placeholder="请选择类型" options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="spec" label="规格">
            <Input placeholder="如：200L/1.5匹/8kg" autoComplete="off" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="purchase_price" label="进货价" rules={[{ required: true }]}>
                <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
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
    </div>
  )
}
