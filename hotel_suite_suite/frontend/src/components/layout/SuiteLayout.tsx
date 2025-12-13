import { useState, useMemo } from 'react'
import { Button, Layout, Menu, Space, Tag, Typography, Dropdown, Avatar } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { MODULES, MODULE_MAP, type ModuleId } from '@/config/modules'
import { useAppContext } from '@/context/AppContext'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

export default function SuiteLayout() {
  const { tenant, user, allowedModules, logout } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

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

    return items
  }, [allowedModules, navigate])

  // Get selected keys based on current path
  const selectedKeys = useMemo(() => {
    const path = location.pathname
    
    // Check for exact match first
    if (path === '/suite/overview') return ['/suite/overview']
    
    // Check sub-menu paths
    for (const module of MODULES) {
      if (module.subMenu) {
        for (const sub of module.subMenu) {
          if (path === sub.path || path.startsWith(sub.path + '/')) {
            return [sub.path]
          }
        }
      }
      if (path.startsWith(module.path)) {
        return [module.path]
      }
    }
    
    return []
  }, [location.pathname])

  // Get open keys for sub-menus
  const openKeys = useMemo(() => {
    const path = location.pathname
    for (const module of MODULES) {
      if (path.startsWith(module.path)) {
        return [module.path]
      }
    }
    return []
  }, [location.pathname])

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
      onClick: () => {
        logout()
        navigate('/login', { replace: true })
      },
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: '#001529',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
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
              <Tag color="blue">{tenant.region}</Tag>
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
          defaultOpenKeys={collapsed ? [] : openKeys}
          items={menuItems}
          style={{ borderRight: 0, paddingTop: 8 }}
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
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 100,
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
                <span style={{ color: currentModule.accent }}>{currentModule.icon}</span>
                <Text strong>{currentModule.name}</Text>
              </Space>
            )}
          </Space>

          <Space size="large">
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                {tenant.name}
              </Text>
            </div>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ display: 'block' }}>{user.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{user.role}</Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            padding: 24,
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
