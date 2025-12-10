import { Layout, Menu, Typography, Select, Tag } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MODULES } from '@/config/modules'
import { TENANTS } from '@/config/tenants'
import { USERS } from '@/config/users'
import { useAppContext } from '@/context/AppContext'
import PageTransition from './PageTransition'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

export default function SuiteLayout() {
  const { tenant, user, allowedModules, switchTenant, switchUser } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()

  const moduleMenu = MODULES.filter((module) => allowedModules.includes(module.id)).map(
    (module) => ({
      key: module.path,
      icon: module.icon,
      label: module.shortName,
    })
  )

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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text type="secondary" style={{ marginBottom: 4 }}>
              Active User
            </Text>
            <Select
              value={user.id}
              onChange={switchUser}
              style={{ width: 240 }}
              options={USERS.filter((u) => u.tenantId === tenant.id).map((u) => ({
                label: `${u.name} · ${u.role}`,
                value: u.id,
              }))}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Text type="secondary" style={{ marginBottom: 4 }}>
              Tenant / Plan
            </Text>
            <Select
              value={tenant.id}
              onChange={switchTenant}
              style={{ width: 240 }}
              options={TENANTS.map((t) => ({ label: t.name, value: t.id }))}
            />
          </div>
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
