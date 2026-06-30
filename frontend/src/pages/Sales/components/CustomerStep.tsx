import { useState } from 'react'
import { Select, Button, Avatar, Modal, Form, Input, message } from 'antd'
import { PlusOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { salesApi } from '../../../services/salesApi'
import RegionSelect from '../../../components/RegionSelect'
import { StepFooter } from './StepFooter'
import { useElderModeStore } from '../../../stores/elderModeStore'
import { DEFAULT_REGION } from '../../../data/regions'
import type { StepProps, SalesOrderState } from '../types'
import type { CustomerCreate } from '../../../types/sales'
import { MAX_LEN } from '../../../constants/formLimits'

interface CustomerStepProps extends StepProps {
  onCustomersUpdate: (customers: SalesOrderState['customers']) => void
}

export function CustomerStep({ state, onStateChange, onNext, onCustomersUpdate }: CustomerStepProps) {
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [customerForm] = Form.useForm()
  const [customerSearchValue, setCustomerSearchValue] = useState('')
  const { isElderMode } = useElderModeStore()

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
    <>
      {/* 搜索/选择客户：底部悬浮「新增」入口（在滚动区之外，始终可见），处理同名不同人/不同地址 */}
      <div style={{ marginBottom: 16 }}>
        <Select
          showSearch
          size="large"
          style={{ width: '100%' }}
          placeholder="搜索客户姓名或电话"
          value={state.selectedCustomerId}
          onChange={(val) => onStateChange({ selectedCustomerId: val })}
          filterOption={false}
          searchValue={customerSearchValue}
          onSearch={handleSearch}
          notFoundContent={customerSearchValue ? '未找到匹配客户' : '输入姓名或电话搜索'}
          options={state.customers.map(c => ({
            value: c.id,
            label: `${c.name} - ${c.phone}`,
            addr: `${c.province}${c.city}${c.district}${c.town}${c.address || ''}`,
          }))}
          optionRender={(oriOption) => (
            <div style={{ lineHeight: 1.35, padding: '2px 0' }}>
              <div style={{ fontSize: isElderMode ? 18 : 14 }}>{oriOption.label}</div>
              <div style={{ fontSize: isElderMode ? 16 : 12, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(oriOption.data as { addr?: string }).addr || '—'}
              </div>
            </div>
          )}
          dropdownRender={(menu) => (
            <>
              {menu}
              <div
                className="customer-add-footer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  customerForm.resetFields()
                  if (customerSearchValue) customerForm.setFieldsValue({ name: customerSearchValue })
                  setCustomerModalOpen(true)
                }}
              >
                <PlusOutlined />
                新增客户{customerSearchValue ? `「${customerSearchValue}」` : ''}
              </div>
            </>
          )}
        />
      </div>

      {/* 选中客户：高亮信息卡 */}
      {selectedCustomer ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '18px 20px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #eef5ff 0%, #f7faff 100%)',
            border: '1px solid #dbe8ff',
            marginBottom: 20,
          }}
        >
          <Avatar
            size={54}
            style={{
              background: 'linear-gradient(135deg, #1677ff, #4096ff)',
              fontSize: 22,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {selectedCustomer.name?.[0] || <UserOutlined />}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isElderMode ? 24 : 17, fontWeight: 600, color: '#1f2937' }}>
              {selectedCustomer.name}
            </div>
            <div style={{ marginTop: 6, fontSize: isElderMode ? 19 : 14, color: '#5b6472', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PhoneOutlined style={{ color: '#1677ff' }} />
              {selectedCustomer.phone}
            </div>
            <div style={{ marginTop: 4, fontSize: isElderMode ? 19 : 14, color: '#5b6472', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <EnvironmentOutlined style={{ color: '#1677ff', marginTop: isElderMode ? 5 : 4 }} />
              <span>
                {selectedCustomer.province}{selectedCustomer.city}{selectedCustomer.district}{selectedCustomer.town}{selectedCustomer.address || ''}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            color: '#9aa3b5',
            background: '#fafbfc',
            border: '1px dashed #e3e7ee',
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <UserOutlined style={{ fontSize: 28, marginBottom: 8, display: 'block' }} />
          请先搜索选择客户，或点击「新增客户」
        </div>
      )}

      <StepFooter>
        <Button
          type="primary"
          size="large"
          disabled={!state.selectedCustomerId}
          onClick={onNext}
          icon={<ArrowRightOutlined />}
        >
          下一步：选择商品
        </Button>
      </StepFooter>

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
            <Input placeholder="请输入客户姓名" autoComplete="off" maxLength={MAX_LEN.NAME} />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="请输入联系电话" autoComplete="off" maxLength={MAX_LEN.PHONE} />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="请输入联系人" autoComplete="off" maxLength={MAX_LEN.NAME} />
          </Form.Item>
          <Form.Item label="地址" required tooltip="省-市-区-镇四级联动选择">
            <Form.Item name="region" noStyle initialValue={DEFAULT_REGION} rules={[{ required: true, message: '请选择地址' }]}>
              <RegionSelect />
            </Form.Item>
          </Form.Item>
          <Form.Item name="address" label="详细地址">
            <Input placeholder="请输入详细地址" autoComplete="off" maxLength={MAX_LEN.ADDRESS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}