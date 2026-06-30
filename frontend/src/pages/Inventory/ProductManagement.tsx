import { useEffect, useState, useRef } from 'react'
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm, Tag, Tabs, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, BarcodeOutlined } from '@ant-design/icons'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import { inventoryApi } from '../../services/inventoryApi'
import { usePrivacyStore } from '../../stores/privacyStore'
import type { Product, ProductCreate, Brand, Category } from '../../types/inventory'
import { MAX_LEN } from '../../constants/formLimits'

// 条形码显示组件
function BarcodeDisplay({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10,
        })
      } catch {
        // 如果条形码格式不支持，尝试其他格式
        try {
          JsBarcode(canvasRef.current, value, {
            format: 'CODE39',
            width: 2,
            height: 80,
            displayValue: true,
            fontSize: 16,
            margin: 10,
          })
        } catch {
          // 最终使用 EAN13 或显示错误
        }
      }
    }
  }, [value])

  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [codeProduct, setCodeProduct] = useState<Product | null>(null)
  const [form] = Form.useForm()
  const { isPrivacyMode } = usePrivacyStore()

  useEffect(() => {
    loadProducts()
    loadBrands()
    loadCategories()
  }, [page, keyword])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await inventoryApi.getProducts(page, 20, keyword ? { keyword } : undefined)
      setProducts(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const loadBrands = async () => {
    const res = await inventoryApi.getBrands(1, 100)
    setBrands(res.items || [])
  }

  const loadCategories = async () => {
    const res = await inventoryApi.getCategories(1, 100)
    setCategories(res.items || [])
  }

  const handleCreate = () => {
    setEditingProduct(null)
    form.resetFields()
    form.setFieldsValue({ unit: '台' })
    setModalOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    form.setFieldsValue(product)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await inventoryApi.deleteProduct(id)
      message.success('删除成功')
      loadProducts()
    } catch {
      message.error('删除失败')
    }
  }

  const handleShowCode = (product: Product) => {
    setCodeProduct(product)
    setCodeModalOpen(true)
  }

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = !(product.status ?? true)
    try {
      await inventoryApi.updateProduct(product.id, { status: nextStatus })
      message.success(nextStatus ? '已上架' : '已停用')
      loadProducts()
    } catch {
      message.error('操作失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, values)
        message.success('更新成功')
      } else {
        await inventoryApi.createProduct(values as ProductCreate)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadProducts()
    } catch {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '商品名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '品牌', dataIndex: 'brand_name', key: 'brand_name', width: 120, ellipsis: true },
    { title: '类型', dataIndex: 'category_name', key: 'category_name', width: 120, ellipsis: true },
    { title: '规格', dataIndex: 'spec', key: 'spec', ellipsis: true },
    { title: '进货价', dataIndex: 'purchase_price', key: 'purchase_price', render: (v: number) => `¥${v}` },
    { title: '销售价', dataIndex: 'sale_price', key: 'sale_price', render: (v: number) => `¥${v}` },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    {
      title: '二维码', dataIndex: 'qr_code', key: 'qr_code', width: 100,
      render: (qr: string) => qr ? <Tag color="blue">{qr}</Tag> : '-'
    },
    {
      title: '条形码', dataIndex: 'barcode', key: 'barcode', width: 120,
      render: (barcode: string) => barcode ? <Tag color="green">{barcode}</Tag> : '-'
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (status: boolean) => (status ?? true)
        ? <Tag color="success">上架</Tag>
        : <Tag color="default">停用</Tag>
    },
    {
      title: '操作', key: 'action', width: 260,
      render: (_: unknown, record: Product) => (
        <Space>
          <Button type="link" size="small" icon={<QrcodeOutlined />} onClick={() => handleShowCode(record)}>码</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" onClick={() => handleToggleStatus(record)}>
            {(record.status ?? true) ? '停用' : '上架'}
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ].filter(col => !(isPrivacyMode && col.key === 'purchase_price'))  // 隐私模式下隐藏进货价列

  return (
    <Card
      title="商品管理"
      extra={
        <Space>
          <Input.Search autoComplete="off"
            placeholder="搜索商品名称/二维码/条形码"
            onSearch={setKeyword}
            allowClear
            style={{ width: 420 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增商品</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`
        }}
      />

      <Modal
        title={editingProduct ? '编辑商品' : '新增商品'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
                <Input placeholder="请输入商品名称" autoComplete="off" maxLength={MAX_LEN.NAME} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand_id" label="品牌" rules={[{ required: true }]}>
                <Select placeholder="请选择品牌" options={brands.map(b => ({ value: b.id, label: b.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category_id" label="类型" rules={[{ required: true }]}>
                <Select placeholder="请选择类型" options={categories.map(c => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="spec" label="规格">
                <Input placeholder="如：200L/1.5匹/8kg" autoComplete="off" maxLength={MAX_LEN.SPEC} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="单位">
                <Select options={[{ value: '台', label: '台' }, { value: '套', label: '套' }, { value: '件', label: '件' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchase_price" label="进货价" rules={[{ required: true, message: '请输入进货价' }]}>
                <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sale_price" label="销售价" rules={[{ required: true }]}>
                <InputNumber prefix="¥" min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="qr_code" label="二维码">
                <Input placeholder="扫码枪扫描录入" autoComplete="off" maxLength={MAX_LEN.BARCODE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="barcode" label="条形码">
                <Input placeholder="扫码枪扫描录入" autoComplete="off" maxLength={MAX_LEN.BARCODE} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} autoComplete="off" maxLength={MAX_LEN.REMARK} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={`商品编码 - ${codeProduct?.name || ''}`}
        open={codeModalOpen}
        onCancel={() => setCodeModalOpen(false)}
        footer={null}
        width={500}
      >
        <Tabs
          items={[
            {
              key: 'barcode',
              label: '条形码',
              icon: <BarcodeOutlined />,
              children: codeProduct?.barcode ? (
                <BarcodeDisplay value={codeProduct.barcode} />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <BarcodeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <p>该商品暂无条形码</p>
                </div>
              ),
            },
            {
              key: 'qrcode',
              label: '二维码',
              icon: <QrcodeOutlined />,
              children: codeProduct?.qr_code ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <QRCodeSVG value={codeProduct.qr_code} size={200} level="H" />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <QrcodeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <p>该商品暂无二维码</p>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </Card>
  )
}