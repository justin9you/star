import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Switch, Space, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { inventoryApi } from '../../services/inventoryApi'
import type { Warehouse, WarehouseCreate } from '../../types/inventory'

const WAREHOUSE_TYPES = [
  { value: '主仓', label: '主仓' },
  { value: '分店仓', label: '分店仓' },
  { value: '旧货专用仓', label: '旧货专用仓' },
]

export default function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadWarehouses()
  }, [page])

  const loadWarehouses = async () => {
    setLoading(true)
    try {
      const res = await inventoryApi.getWarehouses(page, 20)
      setWarehouses(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingWarehouse(null)
    form.resetFields()
    form.setFieldsValue({ type: '主仓' })
    setModalOpen(true)
  }

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    form.setFieldsValue(warehouse)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await inventoryApi.deleteWarehouse(id)
      message.success('删除成功')
      loadWarehouses()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingWarehouse) {
        await inventoryApi.updateWarehouse(editingWarehouse.id, values)
        message.success('更新成功')
      } else {
        await inventoryApi.createWarehouse(values as WarehouseCreate)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadWarehouses()
    } catch {
      message.error('操作失败')
    }
  }

  const typeColorMap: Record<string, string> = {
    '主仓': 'blue',
    '分店仓': 'green',
    '旧货专用仓': 'orange',
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '仓库名称', dataIndex: 'name', key: 'name', width: 120 },
    {
      title: '仓库类型', dataIndex: 'type', key: 'type', width: 120,
      render: (type: string) => <Tag color={typeColorMap[type] || 'default'}>{type}</Tag>
    },
    { title: '地址', dataIndex: 'address', key: 'address', width: 180, ellipsis: true },
    { title: '负责人', dataIndex: 'manager', key: 'manager', width: 100 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (status: boolean) => status ? '启用' : '禁用'
    },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: Warehouse) => (
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
      title="仓库管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增仓库</Button>
      }
    >
      <Table
        columns={columns}
        dataSource={warehouses}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`
        }}
      />

      <Modal
        title={editingWarehouse ? '编辑仓库' : '新增仓库'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="仓库名称" rules={[{ required: true, message: '请输入仓库名称' }]}>
            <Input placeholder="请输入仓库名称" autoComplete="off" />
          </Form.Item>
          <Form.Item name="type" label="仓库类型">
            <Select options={WAREHOUSE_TYPES} placeholder="请选择仓库类型" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入仓库地址" autoComplete="off" />
          </Form.Item>
          <Form.Item name="manager" label="负责人">
            <Input placeholder="请输入负责人" autoComplete="off" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" autoComplete="off" />
          </Form.Item>
          {editingWarehouse && (
            <Form.Item name="status" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  )
}
