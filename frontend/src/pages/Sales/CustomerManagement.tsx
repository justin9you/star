import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined } from '@ant-design/icons'
import { salesApi } from '../../services/salesApi'
import type { Customer, CustomerCreate } from '../../types/sales'
import RegionSelect from '../../components/RegionSelect'
import { MAX_LEN } from '../../constants/formLimits'

const DEFAULT_REGION: [string, string, string, string] = ['江苏省', '苏州市', '吴中区', '临湖镇']

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCustomers()
  }, [page, keyword])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const res = await salesApi.getCustomers(page, 20, keyword || undefined)
      setCustomers(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCustomer(null)
    form.resetFields()
    form.setFieldsValue({ region: DEFAULT_REGION })
    setModalOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    // 将四个字段转换为 region 数组
    const region: [string, string, string, string] = [
      customer.province || DEFAULT_REGION[0],
      customer.city || DEFAULT_REGION[1],
      customer.district || DEFAULT_REGION[2],
      customer.town || DEFAULT_REGION[3],
    ]
    form.setFieldsValue({ ...customer, region })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await salesApi.deleteCustomer(id)
      message.success('删除成功')
      loadCustomers()
    } catch {
      message.error('删除失败')
    }
  }

  // 监听表单字段变化，实现客户姓名→联系人联动（仅新建时）
  const handleValuesChange = (changedValues: Partial<Customer>) => {
    // 仅新建模式下联动
    if (!editingCustomer && 'name' in changedValues && changedValues.name !== undefined) {
      const currentContact = form.getFieldValue('contact')
      // 只有联系人为空或等于之前的客户姓名时才自动填充
      if (!currentContact) {
        form.setFieldsValue({ contact: changedValues.name })
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // 将 region 数组转换为四个字段
      const [province, city, district, town] = values.region || DEFAULT_REGION
      const submitData = {
        ...values,
        province,
        city,
        district,
        town,
        region: undefined, // 移除 region 字段
      }

      if (editingCustomer) {
        await salesApi.updateCustomer(editingCustomer.id, submitData)
        message.success('更新成功')
      } else {
        await salesApi.createCustomer(submitData as CustomerCreate)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadCustomers()
    } catch {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '客户姓名', dataIndex: 'name', key: 'name', width: 90, ellipsis: true },
    {
      title: '联系电话', dataIndex: 'phone', key: 'phone', width: 150, ellipsis: true,
      render: (phone: string) => <span style={{ whiteSpace: 'nowrap' }}><PhoneOutlined /> {phone}</span>
    },
    {
      title: '地址', key: 'address', width: 280, ellipsis: true,
      render: (_: unknown, record: Customer) => {
        const parts = [record.province, record.city, record.district, record.town, record.address].filter(Boolean)
        return parts.join('') || '-'
      }
    },
    { title: '联系人', dataIndex: 'contact', key: 'contact', width: 100, ellipsis: true },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 120, ellipsis: true },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v?.replace('T', ' ').slice(0, 19) || '-'}</span>
    },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: Customer) => (
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
      title="客户管理"
      extra={
        <Space>
          <Input.Search autoComplete="off"
            placeholder="搜索姓名/电话"
            onSearch={setKeyword}
            allowClear
            style={{ width: 420 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增客户</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={customers}
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
        title={editingCustomer ? '编辑客户' : '新增客户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          <Form.Item name="name" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}>
            <Input placeholder="请输入客户姓名" autoComplete="off" maxLength={MAX_LEN.NAME} />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="请输入联系电话" autoComplete="off" maxLength={MAX_LEN.PHONE} />
          </Form.Item>
          <Form.Item label="地址" required tooltip="省-市-区-镇四级联动选择">
            <Form.Item name="region" noStyle rules={[{ required: true, message: '请选择地址' }]}>
              <RegionSelect />
            </Form.Item>
          </Form.Item>
          <Form.Item name="address" label="详细地址">
            <Input placeholder="请输入详细地址" autoComplete="off" maxLength={MAX_LEN.ADDRESS} />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="请输入联系人" autoComplete="off" maxLength={MAX_LEN.NAME} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" autoComplete="off" maxLength={MAX_LEN.REMARK} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
