import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, ShopOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useElderModeStore } from '../stores/elderModeStore'
import { authApi } from '../services/authApi'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { setToken } = useAuthStore()
  const { isElderMode, toggleElderMode } = useElderModeStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('elder-mode', isElderMode)
    return () => {
      document.body.classList.remove('elder-mode')
    }
  }, [isElderMode])

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const result = await authApi.login(values)
      setToken(result.access_token)
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error: unknown) {
      if (!error || typeof error !== 'object' || !('response' in error)) {
        message.error('网络连接失败，请检查服务器是否启动')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* 中老年版切换按钮 */}
      <div className={styles.elderToggle} onClick={toggleElderMode}>
        {isElderMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        {isElderMode ? '标准版' : '关爱版'}
      </div>

      {/* 浮动装饰圆点 */}
      <div className={styles.decorDots}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>

      <Card className={styles.card} title="亚星电子销售管理系统">
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>
            <ShopOutlined />
          </div>
        </div>

        <Form
          name="login"
          className={styles.form}
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          initialValues={{ username: 'admin', password: 'changeme' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" autoComplete="off" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className={styles.submitBtn}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          小型家电门店销售管理系统 v1.0
        </div>
      </Card>
    </div>
  )
}