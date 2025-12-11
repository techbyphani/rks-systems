import { Layout, Menu, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DashboardOutlined, TeamOutlined, ApartmentOutlined } from '@ant-design/icons'
import PageTransition from '@/components/layout/PageTransition'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const operatorLinks = [
  { key: '/operator/overview', label: 'Overview', icon: <DashboardOutlined /> },
  { key: '/operator/tenants', label: 'Hotels', icon: <ApartmentOutlined /> },
  { key: '/operator/users', label: 'User Templates', icon: <TeamOutlined /> },
]

export default function OperatorLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220} style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            Suite Operator
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={operatorLinks.map((link) => ({ ...link, onClick: () => navigate(link.key) }))}
        />
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
