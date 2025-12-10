import { useRouter } from '@/shims/router'
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

  // Functional grouping menu structure
  const menuItems = [
    {
      key: '/admin',
      label: 'Dashboard',
      icon: <DashboardOutlined />,
      type: 'item' as const,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'operations',
      label: 'Operations',
      type: 'group' as const,
      children: [
        { 
          key: '/admin/bookings', 
          label: 'Bookings Overview', 
          icon: <CalendarOutlined />,
        },
        { 
          key: '/admin/rooms', 
          label: 'Room Management', 
          icon: <HomeOutlined />,
        },
        { 
          key: '/admin/guests', 
          label: 'Guest Management', 
          icon: <UserOutlined />,
        },
      ],
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'business-intelligence',
      label: 'Business Intelligence',
      type: 'group' as const,
      children: [
        { 
          key: '/admin/analytics', 
          label: 'Analytics Dashboard', 
          icon: <BarChartOutlined />,
        },
        { 
          key: '/admin/bills', 
          label: 'Revenue Reports', 
          icon: <DollarOutlined />,
        },
        { 
          key: '/admin/feedback', 
          label: 'Performance Metrics', 
          icon: <StarOutlined />,
        },
      ],
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'configuration',
      label: 'Configuration',
      type: 'group' as const,
      children: [
        { 
          key: '/admin/pricing', 
          label: 'Pricing Management', 
          icon: <DollarOutlined />,
        },
        { 
          key: '/admin/offers', 
          label: 'Offers & Promotions', 
          icon: <GiftOutlined />,
        },
        { 
          key: '/admin/gallery', 
          label: 'Content (Gallery)', 
          icon: <PictureOutlined />,
        },
      ],
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'administration',
      label: 'Administration',
      type: 'group' as const,
      children: [
        { 
          key: '/admin/users', 
          label: 'User Management', 
          icon: <TeamOutlined />,
        },
      ],
    },
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
