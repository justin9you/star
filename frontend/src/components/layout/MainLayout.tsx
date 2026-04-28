import { Outlet, Navigate } from 'react-router-dom'
import { Layout, Menu, Button, Tooltip } from 'antd'
import {
  DashboardOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  SettingOutlined,
  ShopTwoTone,
  EyeOutlined,
  EyeInvisibleOutlined,
  FormOutlined,
  LockOutlined,
  UnlockOutlined,
  ImportOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useElderModeStore } from '../../stores/elderModeStore'
import { usePrivacyStore } from '../../stores/privacyStore'
import styles from './MainLayout.module.css'

const { Sider, Content, Header } = Layout

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '首页仪表盘',
  },
  {
    key: '/sales/order',
    icon: <FormOutlined />,
    label: '销售开单',
  },
  {
    key: '/inventory',
    icon: <ShopOutlined />,
    label: '库存管理',
    children: [
      { key: '/inventory/brands', label: '品牌管理' },
      { key: '/inventory/categories', label: '电器类型' },
      { key: '/inventory/products', label: '商品管理' },
      { key: '/inventory/warehouses', label: '仓库管理' },
      { key: '/inventory/list', label: '库存查询' },
    ],
  },
  {
    key: '/sales',
    icon: <ShoppingCartOutlined />,
    label: '销售管理',
    children: [
      { key: '/sales/customers', label: '客户管理' },
      { key: '/sales/orders', label: '订单列表' },
      { key: '/sales/dispatch', label: '派工单' },
    ],
  },
  {
    key: '/purchase',
    icon: <ImportOutlined />,
    label: '进货管理',
    children: [
      { key: '/purchase/order', label: '创建进货单' },
      { key: '/purchase/orders', label: '进货单列表' },
    ],
  },
  {
    key: '/report',
    icon: <BarChartOutlined />,
    label: '报表统计',
    children: [
      { key: '/report/daily', label: '今日销售' },
      { key: '/report/inventory', label: '库存报表' },
    ],
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useAuthStore()
  const { isElderMode, toggleElderMode } = useElderModeStore()
  const { isPrivacyMode, togglePrivacyMode } = usePrivacyStore()

  // 同步关爱版类名到 body（Modal 等 Portal 组件渲染在 body 下）
  useEffect(() => {
    if (isElderMode) {
      document.body.classList.add('elder-mode')
    } else {
      document.body.classList.remove('elder-mode')
    }
  }, [isElderMode])

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const getSelectedKeys = () => {
    return [location.pathname]
  }

  const getOpenKeys = () => {
    const path = location.pathname
    const keys: string[] = []
    if (path.startsWith('/inventory')) keys.push('/inventory')
    if (path.startsWith('/sales')) keys.push('/sales')
    if (path.startsWith('/purchase')) keys.push('/purchase')
    if (path.startsWith('/report')) keys.push('/report')
    return keys
  }

  const handleLogout = () => {
    useAuthStore.getState().logout()
    navigate('/login')
  }

  return (
    <Layout className={`${styles.layout} ${isElderMode ? 'elder-mode' : ''}`}>
      <Sider width={220} className={styles.sider}>
        <div className={styles.logo}>
          <ShopTwoTone style={{ fontSize: 24 }} />
          <span>亚星电子</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          className={styles.menu}
        />
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.title}>亚星电子销售管理系统</span>
          </div>
          <div className={styles.headerRight}>
            <Tooltip title={isPrivacyMode ? '显示敏感信息（复盘模式）' : '隐藏敏感信息（客户在场）'}>
              <Button
                type="text"
                icon={isPrivacyMode ? <LockOutlined /> : <UnlockOutlined />}
                onClick={togglePrivacyMode}
                className={styles.elderBtn}
                danger={!isPrivacyMode}
              >
                {isPrivacyMode ? '隐私' : '复盘'}
              </Button>
            </Tooltip>
            <Tooltip title={isElderMode ? '切换标准版' : '切换关爱版（大字体）'}>
              <Button
                type="text"
                icon={isElderMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={toggleElderMode}
                className={styles.elderBtn}
              >
                {isElderMode ? '标准版' : '关爱版'}
              </Button>
            </Tooltip>
            <span className={styles.user}>管理员</span>
            <a onClick={handleLogout}>退出</a>
          </div>
        </Header>
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}