import { Helmet } from 'react-helmet-async'
import AdminLayout from '@/components/layout/AdminLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { useState, useEffect } from 'react'
import { useRouter } from '@/shims/router'
import { useSearchParams } from 'react-router-dom'
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Space, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Descriptions,
  Form,
  Input,
  Select,
  Drawer,
  List,
  Avatar
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  UserOutlined,
  LockOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface User {
  id: number
  username: string
  role: string
  createdAt: string
  lastLogin: string
  isActive: boolean
}

interface ActivityLog {
  id: number
  action: string
  timestamp: string
  ipAddress: string
}

export default function AdminUsers() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const urlId = searchParams.get('id')
  const [form] = Form.useForm()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Mock data - replace with API call
  const users: User[] = [
    {
      id: 1,
      username: 'admin',
      role: 'admin',
      createdAt: '2024-01-01',
      lastLogin: '2024-01-20',
      isActive: true
    },
    {
      id: 2,
      username: 'reception1',
      role: 'reception',
      createdAt: '2024-01-05',
      lastLogin: '2024-01-19',
      isActive: true
    },
    {
      id: 3,
      username: 'reception2',
      role: 'reception',
      createdAt: '2024-01-10',
      lastLogin: '2024-01-18',
      isActive: false
    }
  ]

  // Mock activity log data
  const activityLogs: ActivityLog[] = [
    { id: 1, action: 'Login', timestamp: '2024-01-20 10:30:00', ipAddress: '192.168.1.1' },
    { id: 2, action: 'Created Booking', timestamp: '2024-01-20 11:15:00', ipAddress: '192.168.1.1' },
    { id: 3, action: 'Updated Room Status', timestamp: '2024-01-20 12:00:00', ipAddress: '192.168.1.1' },
  ]

  // Handle URL parameters
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const user = users.find(u => u.id === Number(id))
      if (user) {
        setSelectedUser(user)
        setShowDetailDrawer(true)
      }
    }
  }, [searchParams])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'purple'
      case 'reception': return 'blue'
      default: return 'default'
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isActive ? 'success' : 'error'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedUser(record)
            setShowDetailDrawer(true)
          }}
        >
          View
        </Button>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ]

  return (
    <>
      <Helmet>
        <title>Users - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Users', href: '/admin/users' },
            ...(selectedUser ? [{ label: selectedUser.username, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>User Management</Title>
              <Space wrap>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push('/admin')}
                >
                  Back to Dashboard
                </Button>
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add User
                </Button>
              </Space>
            </div>

            {/* Users Table */}
            <Card>
              <Table
                columns={columns}
                dataSource={ensureArray(users)}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} users`
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* User Detail Drawer */}
            <Drawer
              title={
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  {selectedUser?.username}
                </Space>
              }
              placement="right"
              onClose={() => {
                setShowDetailDrawer(false)
                setSelectedUser(null)
                router.push('/admin/users')
              }}
              open={showDetailDrawer}
              width={600}
              extra={
                <Space>
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => {
                      // Handle edit
                    }}
                  >
                    Edit User
                  </Button>
                  <Button 
                    icon={<LockOutlined />}
                  >
                    Reset Password
                  </Button>
                </Space>
              }
            >
              {selectedUser && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="User Information">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Username">{selectedUser.username}</Descriptions.Item>
                      <Descriptions.Item label="Role">
                        <Tag color={getRoleColor(selectedUser.role)}>{selectedUser.role.toUpperCase()}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={selectedUser.isActive ? 'success' : 'error'}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Created">{selectedUser.createdAt}</Descriptions.Item>
                      <Descriptions.Item label="Last Login">{selectedUser.lastLogin}</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card size="small" title="Recent Activity" extra={<HistoryOutlined />}>
                    <List
                      dataSource={ensureArray(activityLogs)}
                      renderItem={(log) => (
                        <List.Item>
                          <List.Item.Meta
                            title={log.action}
                            description={
                              <Space>
                                <Text type="secondary">{log.timestamp}</Text>
                                <Text type="secondary">•</Text>
                                <Text type="secondary">{log.ipAddress}</Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>

                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Button 
                      block
                      icon={<EditOutlined />}
                      onClick={() => {
                        // Handle edit
                      }}
                    >
                      Edit User
                    </Button>
                    <Button 
                      block
                      icon={<LockOutlined />}
                    >
                      Reset Password
                    </Button>
                    {selectedUser.isActive ? (
                      <Button 
                        block
                        danger
                      >
                        Deactivate User
                      </Button>
                    ) : (
                      <Button 
                        block
                        type="primary"
                      >
                        Activate User
                      </Button>
                    )}
                    <Button 
                      block
                      icon={<HistoryOutlined />}
                    >
                      View Full Activity Log
                    </Button>
                    <Button 
                      block
                      onClick={() => router.push('/admin')}
                    >
                      Back to Dashboard
                    </Button>
                  </Space>
                </Space>
              )}
            </Drawer>

            {/* Add User Modal */}
            <Modal
              title="Add New User"
              open={showAddModal}
              onCancel={() => {
                setShowAddModal(false)
                form.resetFields()
              }}
              footer={null}
              width={500}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={(values) => {
                  // Handle add user
                  console.log('Adding user:', values)
                  setShowAddModal(false)
                  form.resetFields()
                }}
              >
                <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                  <Input.Password />
                </Form.Item>
                <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'admin', label: 'Admin' },
                      { value: 'reception', label: 'Reception' },
                    ]}
                  />
                </Form.Item>
                <Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={() => {
                      setShowAddModal(false)
                      form.resetFields()
                    }}>
                      Cancel
                    </Button>
                    <Button type="primary" htmlType="submit">
                      Add User
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
          </div>
        </Space>
      </AdminLayout>
    </>
  )
}
