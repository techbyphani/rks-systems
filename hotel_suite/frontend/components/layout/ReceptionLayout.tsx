import { ReactNode, useState } from 'react'
import { useRouter } from 'next/router'
import { Layout, Button, Space, Typography } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import ReceptionSidebar from './ReceptionSidebar'

const { Header, Content } = Layout
const { Title, Text } = Typography

interface ReceptionLayoutProps {
  children: ReactNode
}

export default function ReceptionLayout({ children }: ReceptionLayoutProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    router.push('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ReceptionSidebar collapsed={collapsed} />
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 16px', 
          borderBottom: '1px solid #f0f0f0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Title level={4} style={{ margin: 0 }}>Reception Desk</Title>
          </Space>
          <Space wrap>
            <Text type="secondary">Welcome, Reception</Text>
            <Button type="primary" danger onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ 
          margin: '16px', 
          padding: '16px', 
          background: '#f0f2f5', 
          minHeight: 280 
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}