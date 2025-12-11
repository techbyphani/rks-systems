import { Button, Layout, Menu, Space, Tag, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MODULES } from '@/config/modules'
import { useAppContext } from '@/context/AppContext'
import PageTransition from './PageTransition'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

export default function SuiteLayout() {
  const { tenant, user, allowedModules, logout } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()

  if (!tenant || !user) {
    return null
  }

  const moduleMenu = MODULES.filter((module) => allowedModules.includes(module.id)).map((module) => ({
    key: module.path,
    icon: module.icon,
    label: module.shortName,
  }))

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          background: '#001529',
          position: 'sticky',
          left: 0,
          top: 0,
          height: '100vh',
        }}
      >
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
          }}
        >
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Hotel Suite
          </Title>
          <Tag color="blue" style={{ width: 'fit-content' }}>
            {tenant.region}
          </Tag>
          <Text style={{ color: 'rgba(255,255,255,0.65)' }}>{tenant.name}</Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={moduleMenu}
          style={{ marginTop: 8 }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <Space direction="vertical" size={0}>
            <Text type="secondary">Logged in as</Text>
            <Title level={4} style={{ margin: 0 }}>
              {user.name}
            </Title>
            <Tag color="geekblue" style={{ width: 'fit-content' }}>
              {user.role.toUpperCase()}
            </Tag>
          </Space>
          <Space size="large">
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">Property</Text>
              <div>
                <strong>{tenant.name}</strong>
              </div>
            </div>
            <Button
              type="primary"
              danger
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
          <PageTransition premium>
            <Outlet />
          </PageTransition>
        </Content>
      </Layout>
    </Layout>
  )
}
