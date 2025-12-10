import { Link } from 'react-router-dom'
import { Layout, Menu, Button, Typography } from 'antd'
import { HomeOutlined, LoginOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Header: AntHeader } = Layout
const { Title } = Typography

export default function Header() {
  const menuItems: MenuProps['items'] = [
    { key: '/', label: <Link to="/">Home</Link> },
    { key: '/rooms', label: <Link to="/rooms">Rooms</Link> },
    { key: '/gallery', label: <Link to="/gallery">Gallery</Link> },
    { key: '/restaurant', label: <Link to="/restaurant">Restaurant</Link> },
    { key: '/events', label: <Link to="/events">Events</Link> },
    { key: '/contact', label: <Link to="/contact">Contact</Link> },
  ]

  return (
    <AntHeader style={{ 
      background: '#fff', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: 0
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 16px',
        height: '100%'
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            <HomeOutlined /> Hotel Management
          </Title>
        </Link>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, justifyContent: 'flex-end' }}>
          <Menu
            mode="horizontal"
            items={menuItems}
            style={{ border: 'none', background: 'transparent', lineHeight: '64px', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}
          />
          <Button type="primary" icon={<LoginOutlined />}>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Staff Login</Link>
          </Button>
        </div>
      </div>
    </AntHeader>
  )
}
