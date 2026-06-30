import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useElderModeStore } from '../stores/elderModeStore'
import { authApi } from '../services/authApi'
import styles from './Login.module.css'

// 门店经营的品牌（public/band 下的 logo，含扩展名）
const BRANDS = [
  'gree.jpeg', 'midea.jpeg', 'haier.jpeg', 'casarte.jpeg', 'changhong.jpeg', 'philips.jpeg',
  'kinghome.jpeg', 'fotile.jpeg', 'tcl.png', 'samsung.png', 'chiq.png',
]

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

      {/* 授权品牌双行滚动 */}
      <div className={styles.brandMarquee}>
        <div className={styles.brandWallTitle}>授权销售品牌</div>
        <div className={`${styles.marqueeRow} ${styles.rowLeft}`}>
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <div key={`a${i}`} className={styles.marqueeTile}>
              <img src={`/band/${b}`} alt={b} />
            </div>
          ))}
        </div>
        <div className={`${styles.marqueeRow} ${styles.rowRight}`}>
          {[...[...BRANDS].reverse(), ...[...BRANDS].reverse()].map((b, i) => (
            <div key={`b${i}`} className={styles.marqueeTile}>
              <img src={`/band/${b}`} alt={b} />
            </div>
          ))}
        </div>
      </div>

      <Card className={styles.card} title="亚星电子销售管理系统">
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>亚</div>
        </div>

        <div className={styles.subtitle}>YAXING&nbsp;·&nbsp;门店销售管理</div>

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