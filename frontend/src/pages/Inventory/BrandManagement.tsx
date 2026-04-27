import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Switch, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { inventoryApi } from '../../services/inventoryApi'
import type { Brand, BrandCreate } from '../../types/inventory'

export default function BrandManagement() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadBrands()
  }, [page, keyword])

  const loadBrands = async () => {
    setLoading(true)
    try {
      const res = await inventoryApi.getBrands(page, 20, keyword || undefined)
      setBrands(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingBrand(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    form.setFieldsValue(brand)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await inventoryApi.deleteBrand(id)
      message.success('删除成功')
      loadBrands()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingBrand) {
        await inventoryApi.updateBrand(editingBrand.id, values)
        message.success('更新成功')
      } else {
        await inventoryApi.createBrand(values as BrandCreate)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadBrands()
    } catch {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '品牌名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '品牌编码', dataIndex: 'code', key: 'code', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: boolean) => status ? '启用' : '禁用'
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 120, ellipsis: true },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: Brand) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    },
  ]

  return (
    <Card
      title="品牌管理"
      extra={
        <Space>
          <Input.Search autoComplete="off"
            placeholder="搜索品牌"
            onSearch={setKeyword}
            allowClear
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增品牌</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={brands}
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
        title={editingBrand ? '编辑品牌' : '新增品牌'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="品牌名称" rules={[{ required: true, message: '请输入品牌名称' }]}>
            <Input placeholder="请输入品牌名称" autoComplete="off" />
          </Form.Item>
          <Form.Item name="code" label="品牌编码" rules={[{ required: true, message: '请输入品牌编码' }]}>
            <Input placeholder="请输入品牌编码" autoComplete="off" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={3} autoComplete="off" />
          </Form.Item>
          {editingBrand && (
            <Form.Item name="status" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  )
}