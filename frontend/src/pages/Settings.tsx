import { useState, useEffect } from 'react'
import { Card, Tabs, Descriptions, Button, Modal, Form, Input, message, Space, Divider, Alert, Table, Popconfirm } from 'antd'
import { KeyOutlined, DatabaseOutlined, DownloadOutlined, ReloadOutlined, DeleteOutlined, CloudUploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { backupApi, type BackupItem } from '../services/backupApi'

const fmtSize = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`

// 恢复为高危操作，需输入此词二次确认
const RESTORE_WORD = '恢复'

export default function Settings() {
  const navigate = useNavigate()
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordForm] = Form.useForm()
  const { logout } = useAuthStore()

  const [backups, setBackups] = useState<BackupItem[]>([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  // 恢复确认弹窗
  const [restoreFile, setRestoreFile] = useState<string | null>(null)
  const [restoreText, setRestoreText] = useState('')
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    setBackupLoading(true)
    try {
      const res = await backupApi.list()
      setBackups(res.data || [])
    } catch {
      message.error('获取备份列表失败')
    } finally {
      setBackupLoading(false)
    }
  }

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
    setCreating(true)
    try {
      await backupApi.create()
      message.success('备份成功')
      loadBackups()
    } catch {
      message.error('备份失败')
    } finally {
      setCreating(false)
    }
  }

  const openRestore = (filename: string) => {
    setRestoreFile(filename)
    setRestoreText('')
  }

  const confirmRestore = async () => {
    if (!restoreFile || restoreText.trim() !== RESTORE_WORD) return
    setRestoring(true)
    try {
      await backupApi.restore(restoreFile)
      setRestoreFile(null)
      message.success('数据已恢复，请重新登录')
      // 恢复后强制重新登录：整个应用从恢复后的数据库重新加载
      logout()
      navigate('/login')
    } catch {
      message.error('恢复失败')
    } finally {
      setRestoring(false)
    }
  }

  const handleDelete = async (backupId: number) => {
    try {
      await backupApi.remove(backupId)
      message.success('已删除')
      loadBackups()
    } catch {
      message.error('删除失败')
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      const blob = await backupApi.download(filename)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('下载失败')
    }
  }

  const backupColumns = [
    { title: '备份文件', dataIndex: 'filename', key: 'filename' },
    {
      title: '大小', dataIndex: 'size', key: 'size', width: 110,
      render: (v: number) => fmtSize(v),
    },
    {
      title: '备份时间', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v?.replace('T', ' ').slice(0, 19) || '-'}</span>,
    },
    {
      title: '操作', key: 'action', width: 220,
      render: (_: unknown, record: BackupItem, index: number) => (
        <Space size="small">
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record.filename)}>下载</Button>
          <Button type="link" size="small" icon={<CloudUploadOutlined />} onClick={() => openRestore(record.filename)}>恢复</Button>
          <Popconfirm title="确定删除该备份？" onConfirm={() => handleDelete(index + 1)} okText="删除" okButtonProps={{ danger: true }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

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
                    description="建议定期备份数据，备份文件保存在服务器本地。恢复数据将覆盖当前数据，请谨慎操作（恢复前会自动备份当前数据）。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Space style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<DownloadOutlined />} loading={creating} onClick={handleBackup}>
                      手动备份
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={loadBackups}>
                      刷新列表
                    </Button>
                  </Space>

                  <Table
                    columns={backupColumns}
                    dataSource={backups}
                    rowKey="filename"
                    loading={backupLoading}
                    size="small"
                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 个备份` }}
                  />

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
        title="确认恢复数据"
        open={!!restoreFile}
        onOk={confirmRestore}
        onCancel={() => setRestoreFile(null)}
        okText="确认恢复"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: restoring, disabled: restoreText.trim() !== RESTORE_WORD }}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="高危操作：将用所选备份覆盖当前全部数据"
          description={
            <span>
              备份文件：<b>{restoreFile}</b><br />
              恢复前系统会自动备份当前数据；恢复后需<b>重新登录</b>。
            </span>
          }
        />
        <div style={{ marginBottom: 8 }}>请输入「<b>{RESTORE_WORD}</b>」以确认：</div>
        <Input
          value={restoreText}
          onChange={e => setRestoreText(e.target.value)}
          placeholder={`输入 ${RESTORE_WORD}`}
          onPressEnter={confirmRestore}
          autoComplete="off"
        />
      </Modal>

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
