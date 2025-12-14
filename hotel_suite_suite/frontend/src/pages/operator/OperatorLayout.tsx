import { useEffect } from 'react'
import { Layout, Menu, Typography, Button, Space, Dropdown, Avatar } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  DashboardOutlined, 
  TeamOutlined, 
  ApartmentOutlined, 
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAppContext } from '@/context/AppContext'
import PageTransition from '@/components/layout/PageTransition'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

const operatorLinks = [
  { key: '/operator/overview', label: 'Overview', icon: <DashboardOutlined /> },
  { key: '/operator/tenants', label: 'Hotels', icon: <ApartmentOutlined /> },
  { key: '/operator/users', label: 'User Templates', icon: <TeamOutlined /> },
]

export default function OperatorLayout() {
  const { logout, isAuthenticated, isOperator } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()

  // Redirect to operator login if not authenticated as operator
  useEffect(() => {
    if (!isAuthenticated || !isOperator) {
      navigate('/operator/login', { replace: true })
    }
  }, [isAuthenticated, isOperator, navigate])

  // Don't render if not authenticated
  if (!isAuthenticated || !isOperator) {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220} style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
            🏨 Suite Operator
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            SaaS Admin Panel
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={operatorLinks.map((link) => ({ ...link, onClick: () => navigate(link.key) }))}
          style={{ borderRight: 0 }}
        />
        
        {/* Logout at bottom of sidebar */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: 16,
          borderTop: '1px solid #f0f0f0',
        }}>
          <Button 
            type="text" 
            danger 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            block
          >
            Logout
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            SaaS Control Room
          </Title>
          
          <Space size="middle">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  style={{ backgroundColor: '#722ed1' }}
                  icon={<SettingOutlined />}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ display: 'block' }}>Operator</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>Admin</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f8f9fb' }}>
          <PageTransition premium>
            <Outlet />
          </PageTransition>
        </Content>
      </Layout>
    </Layout>
  )
}
