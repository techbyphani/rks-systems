import { Helmet } from 'react-helmet-async'
import ReceptionLayout from '@/components/layout/ReceptionLayout'
import { useRouter } from '@/shims/router'
import { useState, useMemo } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Typography, 
  Space, 
  Tag,
  List,
  Avatar,
  Input,
  Statistic,
  Divider
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  HomeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  BellOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import QuickActionCard from '@/components/dashboard/QuickActionCard'
import TaskQueue, { Task } from '@/components/tasks/TaskQueue'
import ContextualDashboard from '@/components/dashboard/ContextualDashboard'
import NotificationCenter, { Notification } from '@/components/notifications/NotificationCenter'
import StatusIndicator from '@/components/common/StatusIndicator'

const { Title, Text, Paragraph } = Typography
const { Search } = Input

export default function ReceptionDashboard() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Urgent Check-in',
      message: 'Guest John Smith arriving in 30 minutes',
      type: 'warning',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: false,
      action: {
        label: 'View',
        onClick: () => router.push('/reception/checkin?filter=today')
      }
    },
    {
      id: '2',
      title: 'Room Maintenance',
      message: 'Room 205 requires cleaning',
      type: 'info',
      timestamp: new Date(Date.now() - 2 * 3600000),
      read: false,
      action: {
        label: 'View Room',
        onClick: () => router.push('/reception/rooms?room=205')
      }
    }
  ])

  const arrivals = [
    { id: 1, name: 'John Smith', room: '205', time: '14:00 Expected', guestId: 1, bookingId: 'BK001', priority: 'urgent' as const },
    { id: 2, name: 'Alice Brown', room: '301', time: '15:30 Expected', guestId: 2, bookingId: 'BK002', priority: 'high' as const },
    { id: 3, name: 'Charlie Davis', room: '102', time: '16:00 Expected', guestId: 3, bookingId: 'BK003', priority: 'medium' as const },
  ]

  const departures = [
    { id: 1, name: 'Jane Doe', room: '101', time: '11:00 Checkout', guestId: 4, bookingId: 'BK004', priority: 'high' as const },
    { id: 2, name: 'Bob Wilson', room: '203', time: '12:00 Checkout', guestId: 5, bookingId: 'BK005', priority: 'medium' as const },
  ]

  const roomStatuses = Array.from({ length: 24 }, (_, i) => {
    const statuses = ['available', 'occupied', 'maintenance', 'dirty']
    const status = statuses[i % 4]
    return {
      number: 101 + i,
      status,
      color: status === 'available' ? 'success' : 
             status === 'occupied' ? 'processing' : 
             status === 'maintenance' ? 'warning' : 'error'
    }
  })

  // Create tasks from arrivals and departures
  const tasks: Task[] = useMemo(() => {
    const taskList: Task[] = []
    
    arrivals.forEach(arrival => {
      taskList.push({
        id: `arrival-${arrival.id}`,
        title: `Check-in: ${arrival.name}`,
        description: `Room ${arrival.room} - ${arrival.time}`,
        priority: arrival.priority,
        type: 'checkin',
        dueTime: arrival.time,
        onClick: () => router.push(`/reception/checkin?bookingId=${arrival.bookingId}`)
      })
    })

    departures.forEach(departure => {
      taskList.push({
        id: `departure-${departure.id}`,
        title: `Check-out: ${departure.name}`,
        description: `Room ${departure.room} - ${departure.time}`,
        priority: departure.priority,
        type: 'checkout',
        dueTime: departure.time,
        onClick: () => router.push(`/reception/checkout?bookingId=${departure.bookingId}`)
      })
    })

    return taskList
  }, [arrivals, departures, router])

  const urgentTasks = tasks.filter(t => t.priority === 'urgent')
  const highPriorityTasks = tasks.filter(t => t.priority === 'high')

  const handleNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleNotificationClear = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  // Filter arrivals and departures by search
  const filteredArrivals = useMemo(() => {
    if (!searchTerm.trim()) return arrivals
    const search = searchTerm.toLowerCase()
    return arrivals.filter(item => 
      item.name.toLowerCase().includes(search) ||
      item.room.includes(search) ||
      item.bookingId.toLowerCase().includes(search)
    )
  }, [arrivals, searchTerm])

  const filteredDepartures = useMemo(() => {
    if (!searchTerm.trim()) return departures
    const search = searchTerm.toLowerCase()
    return departures.filter(item => 
      item.name.toLowerCase().includes(search) ||
      item.room.includes(search) ||
      item.bookingId.toLowerCase().includes(search)
    )
  }, [departures, searchTerm])

  const availableRooms = roomStatuses.filter(r => r.status === 'available').length
  const occupiedRooms = roomStatuses.filter(r => r.status === 'occupied').length
  const maintenanceRooms = roomStatuses.filter(r => r.status === 'maintenance').length

  return (
    <>
      <Helmet>
        <title>Reception Dashboard - Hotel Management System</title>
        <meta name="description" content="Reception dashboard for hotel management" />
      </Helmet>
      
      <ReceptionLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header with Search and Notifications */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>Reception Dashboard</Title>
              <Paragraph type="secondary" style={{ margin: 0 }}>Manage daily operations and guest services.</Paragraph>
            </div>
            <Space>
              <Search
                placeholder="Search guests, rooms, bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={setSearchTerm}
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={handleNotificationRead}
                onMarkAllAsRead={handleMarkAllRead}
                onClear={handleNotificationClear}
                onClearAll={handleClearAll}
              />
            </Space>
          </div>

          {/* Quick Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Today's Arrivals" 
                  value={arrivals.length} 
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Today's Departures" 
                  value={departures.length} 
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<LogoutOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Available Rooms" 
                  value={availableRooms} 
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<HomeOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Occupied Rooms" 
                  value={occupiedRooms} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <QuickActionCard
                  icon={<FileTextOutlined />}
                  title="New Booking"
                  description="Create a new reservation"
                  onClick={() => router.push('/reception/bookings?action=new')}
                  color="#1890ff"
                />
              </Col>
              <Col xs={24} sm={8}>
                <QuickActionCard
                  icon={<CheckCircleOutlined />}
                  title="Check-In"
                  description="View today's check-ins"
                  onClick={() => router.push('/reception/checkin?filter=today')}
                  color="#52c41a"
                  badge={arrivals.length > 0 ? arrivals.length : undefined}
                />
              </Col>
              <Col xs={24} sm={8}>
                <QuickActionCard
                  icon={<LogoutOutlined />}
                  title="Check-Out"
                  description="View today's checkouts"
                  onClick={() => router.push('/reception/checkout?filter=today')}
                  color="#fa8c16"
                  badge={departures.length > 0 ? departures.length : undefined}
                />
              </Col>
            </Row>
          </Card>

          {/* Main Content - 3 Column Layout */}
          <Row gutter={[16, 16]}>
            {/* Left Column - Today's Timeline */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <ClockCircleOutlined />
                    <span>Today's Timeline</span>
                  </Space>
                }
                extra={
                  <Tag color="blue">{arrivals.length + departures.length} events</Tag>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {filteredArrivals.length > 0 && (
                    <div>
                      <Text strong style={{ color: '#52c41a' }}>Arrivals</Text>
                      <List
                        dataSource={ensureArray(filteredArrivals)}
                        renderItem={(item) => (
                          <List.Item
                            actions={[
                              <Button 
                                type="primary" 
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => router.push(`/reception/checkin?bookingId=${item.bookingId}`)}
                              >
                                Check-In
                              </Button>
                            ]}
                            onClick={() => router.push(`/reception/bookings?bookingId=${item.bookingId}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <List.Item.Meta
                              avatar={<Avatar icon={<UserOutlined />} />}
                              title={
                                <Text 
                                  style={{ cursor: 'pointer', color: '#1890ff' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/reception/guests?id=${item.guestId}`)
                                  }}
                                >
                                  {item.name}
                                </Text>
                              }
                              description={
                                <Space>
                                  <Text 
                                    style={{ cursor: 'pointer', color: '#1890ff' }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/reception/rooms?room=${item.room}`)
                                    }}
                                  >
                                    <HomeOutlined /> Room {item.room}
                                  </Text>
                                  <ClockCircleOutlined />
                                  <Text type="secondary">{item.time}</Text>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                  
                  {filteredArrivals.length > 0 && filteredDepartures.length > 0 && <Divider />}
                  
                  {filteredDepartures.length > 0 && (
                    <div>
                      <Text strong style={{ color: '#fa8c16' }}>Departures</Text>
                      <List
                        dataSource={ensureArray(filteredDepartures)}
                        renderItem={(item) => (
                          <List.Item
                            actions={[
                              <Button 
                                type="primary" 
                                danger
                                size="small"
                                icon={<LogoutOutlined />}
                                onClick={() => router.push(`/reception/checkout?bookingId=${item.bookingId}`)}
                              >
                                Check-Out
                              </Button>
                            ]}
                            onClick={() => router.push(`/reception/bookings?bookingId=${item.bookingId}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <List.Item.Meta
                              avatar={<Avatar icon={<UserOutlined />} />}
                              title={
                                <Text 
                                  style={{ cursor: 'pointer', color: '#1890ff' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/reception/guests?id=${item.guestId}`)
                                  }}
                                >
                                  {item.name}
                                </Text>
                              }
                              description={
                                <Space>
                                  <Text 
                                    style={{ cursor: 'pointer', color: '#1890ff' }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/reception/rooms?room=${item.room}`)
                                    }}
                                  >
                                    <HomeOutlined /> Room {item.room}
                                  </Text>
                                  <ClockCircleOutlined />
                                  <Text type="secondary">{item.time}</Text>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </Space>
              </Card>
            </Col>

            {/* Center Column - Priority Tasks */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <ExclamationCircleOutlined />
                    <span>Priority Tasks</span>
                  </Space>
                }
                extra={
                  <Tag color="red">{urgentTasks.length + highPriorityTasks.length} urgent</Tag>
                }
              >
                <TaskQueue
                  tasks={tasks}
                  onTaskClick={(task) => {
                    if (task.onClick) {
                      task.onClick()
                    }
                  }}
                  maxHeight={500}
                />
              </Card>
            </Col>

            {/* Right Column - Room Status Overview */}
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <HomeOutlined />
                    <span>Room Status</span>
                  </Space>
                }
                extra={
                  <Button 
                    type="link" 
                    onClick={() => router.push('/reception/rooms')}
                  >
                    View All
                  </Button>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic 
                          title="Available" 
                          value={availableRooms} 
                          valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic 
                          title="Occupied" 
                          value={occupiedRooms} 
                          valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic 
                          title="Maintenance" 
                          value={maintenanceRooms} 
                          valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic 
                          title="Dirty" 
                          value={roomStatuses.filter(r => r.status === 'dirty').length} 
                          valueStyle={{ color: '#ff4d4f', fontSize: '24px' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                  
                  <Divider style={{ margin: '8px 0' }} />
                  
                  <div>
                    <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                      Quick Room View
                    </Text>
                    <Row gutter={[4, 4]}>
                      {roomStatuses.slice(0, 12).map((room) => (
                        <Col xs={6} sm={4} key={room.number}>
                          <Card
                            size="small"
                            hoverable
                            onClick={() => router.push(`/reception/rooms?room=${room.number}`)}
                            style={{ 
                              cursor: 'pointer',
                              textAlign: 'center',
                              padding: '4px',
                              borderColor: room.color === 'success' ? '#52c41a' :
                                         room.color === 'processing' ? '#1890ff' :
                                         room.color === 'warning' ? '#faad14' : '#ff4d4f'
                            }}
                          >
                            <Text strong style={{ fontSize: '12px' }}>{room.number}</Text>
                            <br />
                            <StatusIndicator 
                              status={room.color as any}
                              size="small"
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      </ReceptionLayout>
    </>
  )
}
