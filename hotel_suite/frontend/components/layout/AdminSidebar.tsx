import { useRouter } from 'next/router'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  BarChartOutlined,
  CalendarOutlined,
  HomeOutlined,
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  StarOutlined,
  PictureOutlined,
  GiftOutlined,
  TeamOutlined,
} from '@ant-design/icons'

const { Sider } = Layout

interface AdminSidebarProps {
  collapsed?: boolean
}

export default function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  const router = useRouter()

  const menuItems = [
    { key: '/admin', label: 'Dashboard', icon: <DashboardOutlined /> },
    { key: '/admin/analytics', label: 'Analytics', icon: <BarChartOutlined /> },
    { key: '/admin/bookings', label: 'Bookings', icon: <CalendarOutlined /> },
    { key: '/admin/rooms', label: 'Rooms', icon: <HomeOutlined /> },
    { key: '/admin/pricing', label: 'Pricing', icon: <DollarOutlined /> },
    { key: '/admin/guests', label: 'Guests', icon: <UserOutlined /> },
    { key: '/admin/bills', label: 'Bills', icon: <FileTextOutlined /> },
    { key: '/admin/feedback', label: 'Feedback', icon: <StarOutlined /> },
    { key: '/admin/gallery', label: 'Gallery', icon: <PictureOutlined /> },
    { key: '/admin/offers', label: 'Offers', icon: <GiftOutlined /> },
    { key: '/admin/users', label: 'Users', icon: <TeamOutlined /> },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key)
  }

  return (
    <Sider 
      collapsible
      collapsed={collapsed}
      width={250}
      collapsedWidth={80}
      theme="dark" 
      style={{ 
        height: '100vh', 
        position: 'fixed', 
        left: 0, 
        top: 0,
        overflow: 'auto'
      }}
      breakpoint="lg"
      onBreakpoint={(broken) => {
        // Auto-collapse on mobile
      }}
    >
      <div style={{ padding: collapsed ? '16px 8px' : '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: collapsed ? 'center' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HomeOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>Hotel Admin</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}>Management System</div>
            </div>
          )}
        </div>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[router.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
        inlineCollapsed={collapsed}
      />
    </Sider>
  )
}