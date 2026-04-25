import { useState } from 'react'
import { Card, Tabs, Descriptions, Button, Modal, Form, Input, message, Space, Divider, Alert } from 'antd'
import { KeyOutlined, DatabaseOutlined, DownloadOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'

export default function Settings() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordForm] = Form.useForm()
  const { logout } = useAuthStore()

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次密码不一致')
        return
      }
      setPasswordLoading(true)
      // TODO: 调用修改密码 API
      message.success('密码修改成功，请重新登录')
      setPasswordModalOpen(false)
      logout()
    } catch {
      message.error('操作失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleBackup = async () => {
    try {
      // TODO: 调用备份 API
      message.success('备份成功')
    } catch {
      message.error('备份失败')
    }
  }

  const handleRestore = () => {
    Modal.confirm({
      title: '数据恢复',
      content: '选择备份文件恢复数据，当前数据将被覆盖。确定继续？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: 调用恢复 API
          message.success('恢复成功')
        } catch {
          message.error('恢复失败')
        }
      }
    })
  }

  return (
    <div>
      <Card title="系统设置">
        <Tabs
          items={[
            {
              key: 'account',
              label: '账户管理',
              icon: <KeyOutlined />,
              children: (
                <Card>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="用户名">admin</Descriptions.Item>
                    <Descriptions.Item label="创建时间">2026-04-24</Descriptions.Item>
                  </Descriptions>
                  <Divider />
                  <Button type="primary" icon={<KeyOutlined />} onClick={() => setPasswordModalOpen(true)}>
                    修改密码
                  </Button>
                </Card>
              )
            },
            {
              key: 'backup',
              label: '数据备份',
              icon: <DatabaseOutlined />,
              children: (
                <Card>
                  <Alert
                    message="数据安全提示"
                    description="建议定期备份数据，备份文件保存在本地。恢复数据将覆盖当前数据，请谨慎操作。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Space>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleBackup}>
                      手动备份
                    </Button>
                    <Button icon={<UploadOutlined />} onClick={handleRestore}>
                      数据恢复
                    </Button>
                  </Space>
                  <Divider />
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="自动备份">每日自动备份一次</Descriptions.Item>
                    <Descriptions.Item label="保留策略">保留最近 30 天备份</Descriptions.Item>
                  </Descriptions>
                </Card>
              )
            },
            {
              key: 'about',
              label: '关于系统',
              icon: <ReloadOutlined />,
              children: (
                <Card>
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="系统名称">亚星电子销售管理系统</Descriptions.Item>
                    <Descriptions.Item label="版本">v1.0.0</Descriptions.Item>
                    <Descriptions.Item label="适用场景">小型家电门店/经销商本地使用</Descriptions.Item>
                    <Descriptions.Item label="技术栈">React + TypeScript + Python + SQLite</Descriptions.Item>
                    <Descriptions.Item label="运行环境">本地单机版，支持离线运行</Descriptions.Item>
                  </Descriptions>
                  <Divider />
                  <Alert
                    message="使用提示"
                    description="如遇问题请联系系统管理员。建议定期备份数据，确保数据安全。"
                    type="info"
                    showIcon
                  />
                </Card>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => setPasswordModalOpen(false)}
        okText="确定"
        cancelText="取消"
        confirmLoading={passwordLoading}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="oldPassword" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password placeholder="请输入原密码" autoComplete="off" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password placeholder="请输入新密码" autoComplete="off" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请确认密码' }]}>
            <Input.Password placeholder="请再次输入新密码" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}