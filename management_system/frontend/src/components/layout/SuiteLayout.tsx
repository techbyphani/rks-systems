import { useState, useMemo, useEffect } from 'react'
import { Button, Layout, Menu, Space, Tag, Typography, Dropdown, Avatar, Badge } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { MODULES } from '@/config/modules'
import { useAppContext, useIsHotelAdmin } from '@/context/AppContext'
import NotificationCenter from '@/components/shared/NotificationCenter'
import QuickActions from '@/components/shared/QuickActions'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

const ROLE_LABELS: Record<string, string> = {
  hotel_admin: 'Hotel Admin',
  manager: 'Manager',
  supervisor: 'Supervisor',
  staff: 'Staff',
}

export default function SuiteLayout() {
  const { tenant, user, allowedModules, logout } = useAppContext()
  const isHotelAdmin = useIsHotelAdmin()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>([])

  if (!tenant || !user) {
    return null
  }

  // Build menu items with sub-menus
  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        key: '/suite/overview',
        icon: <DashboardOutlined />,
        label: 'Overview',
        onClick: () => navigate('/suite/overview'),
      },
      {
        type: 'divider',
      },
    ]

    // Add module items
    MODULES.filter((module) => allowedModules.includes(module.id)).forEach((module) => {
      if (module.subMenu && module.subMenu.length > 0) {
        items.push({
          key: module.path,
          icon: module.icon,
          label: module.shortName,
          children: module.subMenu.map((sub) => ({
            key: sub.path,
            icon: sub.icon,
            label: sub.label,
            onClick: () => navigate(sub.path),
          })),
        })
      } else {
        items.push({
          key: module.path,
          icon: module.icon,
          label: module.shortName,
          onClick: () => navigate(module.path),
        })
      }
    })

    // Add admin section for hotel admins
    if (isHotelAdmin) {
      items.push({ type: 'divider' })
      items.push({
        key: '/suite/admin',
        icon: <SettingOutlined />,
        label: 'Administration',
        children: [
          {
            key: '/suite/admin/users',
            icon: <TeamOutlined />,
            label: 'User Management',
            onClick: () => navigate('/suite/admin/users'),
          },
          {
            key: '/suite/admin/settings',
            icon: <SettingOutlined />,
            label: 'Hotel Settings',
            onClick: () => navigate('/suite/admin/settings'),
          },
        ],
      })
    }

    return items
  }, [allowedModules, isHotelAdmin, navigate])

  // Get selected keys based on current path
  const selectedKeys = useMemo(() => {
    const path = location.pathname
    
    // Check for exact match first
    if (path === '/suite/overview') return ['/suite/overview']
    
    // Check admin paths
    if (path.startsWith('/suite/admin')) {
      return [path]
    }
    
    // IMPORTANT: Check sub-menu paths FIRST (before checking module paths)
    // This ensures submenu items are selected, not the parent module
    for (const module of MODULES) {
      if (module.subMenu) {
        // Check all submenu items first - they should take priority
        for (const sub of module.subMenu) {
          // Exact match
          if (path === sub.path) {
            return [sub.path]
          }
          // Path starts with submenu path (for detail pages like /suite/crs/guests/123)
          // But exclude the module path itself to avoid matching dashboard
          if (sub.path !== module.path && path.startsWith(sub.path + '/')) {
            return [sub.path]
          }
        }
        // Only if no submenu matches, check if it's the module dashboard (exact match)
        if (path === module.path) {
          // Return the dashboard submenu item if it exists
          const dashboardSub = module.subMenu.find(sub => sub.path === module.path)
          return dashboardSub ? [dashboardSub.path] : [module.path]
        }
      } else {
        // Module without submenu - check if path matches
        if (path === module.path || path.startsWith(module.path + '/')) {
          return [module.path]
        }
      }
    }
    
    return []
  }, [location.pathname])

  // Get open keys for sub-menus
  const openKeys = useMemo(() => {
    const path = location.pathname
    
    if (path.startsWith('/suite/admin')) {
      return ['/suite/admin']
    }
    
    for (const module of MODULES) {
      if (path.startsWith(module.path)) {
        return [module.path]
      }
    }
    return []
  }, [location.pathname])

  // Update open keys when path changes or sidebar expands
  useEffect(() => {
    if (!collapsed) {
      setMenuOpenKeys(openKeys)
    } else {
      setMenuOpenKeys([])
    }
  }, [openKeys, collapsed])

  // Current module info
  const currentModule = useMemo(() => {
    const path = location.pathname
    for (const module of MODULES) {
      if (path.startsWith(module.path)) {
        return module
      }
    }
    return null
  }, [location.pathname])

  // User dropdown menu
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    ...(isHotelAdmin ? [{
      key: 'admin',
      icon: <TeamOutlined />,
      label: 'User Management',
      onClick: () => navigate('/suite/admin/users'),
    }] : []),
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => isHotelAdmin ? navigate('/suite/admin/settings') : undefined,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: () => {
        logout()
        navigate('/login', { replace: true })
      },
    },
  ]

  const userName = `${user.firstName} ${user.lastName}`
  const userRole = ROLE_LABELS[user.role] || user.role

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            padding: collapsed ? '16px 8px' : '16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {!collapsed ? (
            <>
              <Title level={4} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
                Hotel Suite
              </Title>
              <Tag 
                color="#1e88e5"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff',
                }}
              >
                {tenant.region}
              </Tag>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  display: 'block',
                  marginTop: 8,
                  fontSize: 12,
                }}
                ellipsis
              >
                {tenant.name}
              </Text>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                HS
              </Title>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={collapsed ? [] : menuOpenKeys}
          onOpenChange={setMenuOpenKeys}
          items={menuItems}
          style={{ 
            borderRight: 0, 
            paddingTop: 8,
            background: 'transparent',
          }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e8e8e8',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            {currentModule && (
              <Space>
                <span style={{ color: currentModule.accent, fontSize: 18 }}>{currentModule.icon}</span>
                <Text strong style={{ color: '#1e3c72', fontSize: 16 }}>{currentModule.name}</Text>
              </Space>
            )}
            {location.pathname.startsWith('/suite/admin') && (
              <Space>
                <span style={{ color: '#1e88e5' }}><SettingOutlined /></span>
                <Text strong style={{ color: '#1e3c72' }}>Administration</Text>
              </Space>
            )}
          </Space>

          <Space size="middle">
            <QuickActions />
            <NotificationCenter />
            
            <div
              style={{
                height: 32,
                width: 1,
                background: '#f0f0f0',
              }}
            />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Badge dot={isHotelAdmin} offset={[-2, 2]} color="#1e88e5">
                  <Avatar
                    style={{ 
                      backgroundColor: isHotelAdmin ? '#1e88e5' : '#2a5298',
                      boxShadow: '0 2px 8px rgba(30, 136, 229, 0.3)',
                    }}
                  >
                    {user.firstName[0]}{user.lastName[0]}
                  </Avatar>
                </Badge>
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ display: 'block' }}>{userName}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{userRole}</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            padding: 24,
            background: '#f8f9fa',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
