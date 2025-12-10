import { useRouter } from 'next/router'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  CalendarOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  StarOutlined,
} from '@ant-design/icons'

const { Sider } = Layout

interface ReceptionSidebarProps {
  collapsed?: boolean
}

export default function ReceptionSidebar({ collapsed = false }: ReceptionSidebarProps) {
  const router = useRouter()

  const menuItems = [
    { key: '/reception', label: 'Dashboard', icon: <DashboardOutlined /> },
    { key: '/reception/bookings', label: 'Bookings', icon: <CalendarOutlined /> },
    { key: '/reception/checkin', label: 'Check-In', icon: <LoginOutlined /> },
    { key: '/reception/checkout', label: 'Check-Out', icon: <LogoutOutlined /> },
    { key: '/reception/guests', label: 'Guests', icon: <UserOutlined /> },
    { key: '/reception/rooms', label: 'Room Status', icon: <HomeOutlined /> },
    { key: '/reception/bills', label: 'Bills', icon: <FileTextOutlined /> },
    { key: '/reception/feedback', label: 'Feedback', icon: <StarOutlined /> },
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
    >
      <div style={{ padding: collapsed ? '16px 8px' : '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: collapsed ? 'center' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HomeOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>Reception Desk</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '12px' }}>Front Office</div>
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