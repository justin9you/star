import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, InputNumber, Switch, Space, message, Popconfirm, TreeSelect } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { inventoryApi } from '../../services/inventoryApi'
import type { Category, CategoryCreate } from '../../types/inventory'
import { MAX_LEN } from '../../constants/formLimits'

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCategories()
  }, [page])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await inventoryApi.getCategories(page, 100)
      setCategories(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const buildTreeData = (items: Category[]): { value: number; title: string; children?: { value: number; title: string }[] }[] => {
    const roots = items.filter(i => !i.parent_id)
    return roots.map(r => ({
      value: r.id,
      title: r.name,
      children: items.filter(i => i.parent_id === r.id).map(c => ({ value: c.id, title: c.name }))
    }))
  }

  const handleCreate = () => {
    setEditingCategory(null)
    form.resetFields()
    form.setFieldsValue({ sort: 0 })
    setModalOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    form.setFieldsValue(category)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await inventoryApi.deleteCategory(id)
      message.success('删除成功')
      loadCategories()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingCategory) {
        await inventoryApi.updateCategory(editingCategory.id, values)
        message.success('更新成功')
      } else {
        await inventoryApi.createCategory(values as CategoryCreate)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadCategories()
    } catch {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '类型名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '类型编码', dataIndex: 'code', key: 'code', ellipsis: true },
    {
      title: '父级类型', dataIndex: 'parent_id', key: 'parent_id', width: 120,
      render: (parentId: number | null) => {
        if (!parentId) return <span style={{ color: '#999' }}>顶级分类</span>
        const parent = categories.find(c => c.id === parentId)
        return parent?.name || '-'
      }
    },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: boolean) => status ? '启用' : '禁用'
    },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: Category) => (
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
      title="电器类型管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增类型</Button>
      }
    >
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 100,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`
        }}
      />

      <Modal
        title={editingCategory ? '编辑类型' : '新增类型'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="类型名称" rules={[{ required: true, message: '请输入类型名称' }]}>
            <Input placeholder="如：冰箱、空调、洗衣机" autoComplete="off" maxLength={MAX_LEN.NAME} />
          </Form.Item>
          <Form.Item name="code" label="类型编码" rules={[{ required: true, message: '请输入类型编码' }]}>
            <Input placeholder="请输入类型编码" autoComplete="off" maxLength={MAX_LEN.CODE} />
          </Form.Item>
          <Form.Item name="parent_id" label="父级类型">
            <TreeSelect
              placeholder="无（顶级分类）"
              allowClear
              treeData={buildTreeData(categories)}
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          {editingCategory && (
            <Form.Item name="status" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  )
}
