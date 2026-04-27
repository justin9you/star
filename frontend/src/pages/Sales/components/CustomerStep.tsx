import { useState } from 'react'
import { Card, Select, Button, Descriptions, Space, Modal, Form, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { salesApi } from '../../../services/salesApi'
import RegionSelect from '../../../components/RegionSelect'
import type { StepProps, SalesOrderState } from '../types'
import type { CustomerCreate } from '../../../types/sales'

interface CustomerStepProps extends StepProps {
  onCustomersUpdate: (customers: SalesOrderState['customers']) => void
}

export function CustomerStep({ state, onStateChange, onNext, onCustomersUpdate }: CustomerStepProps) {
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [customerForm] = Form.useForm()
  const [customerSearchValue, setCustomerSearchValue] = useState('')

  const selectedCustomer = state.customers.find(c => c.id === state.selectedCustomerId)

  const handleSearch = async (val: string) => {
    setCustomerSearchValue(val)
    if (val) {
      const res = await salesApi.getCustomers(1, 20, val)
      onCustomersUpdate(res.items || [])
    }
  }

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
      onCustomersUpdate(custRes.items || [])
      const newCustomer = custRes.items?.find(c => c.name === values.name && c.phone === values.phone)
      if (newCustomer) {
        onStateChange({ selectedCustomerId: newCustomer.id })
      }
    } catch {
      message.error('添加失败')
    }
  }

  return (
    <Card title="选择客户">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Select
          showSearch
          style={{ width: '100%' }}
          placeholder="搜索客户姓名或电话"
          value={state.selectedCustomerId}
          onChange={(val) => onStateChange({ selectedCustomerId: val })}
          filterOption={false}
          searchValue={customerSearchValue}
          onSearch={handleSearch}
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
          options={state.customers.map(c => ({
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
        <Button type="primary" disabled={!state.selectedCustomerId} onClick={onNext}>
          下一步：选择商品
        </Button>
      </Space>

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
    </Card>
  )
}