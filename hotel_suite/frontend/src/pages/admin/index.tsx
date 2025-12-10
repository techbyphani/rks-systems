import { Helmet } from 'react-helmet-async'
import AdminLayout from '@/components/layout/AdminLayout'
import { useState } from 'react'
import { useRouter } from '@/shims/router'
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Button, 
  Modal, 
  Table, 
  Tag, 
  Typography, 
  Space, 
  Progress,
  Divider,
  Alert,
  Grid
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  DollarOutlined,
  RiseOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  FileTextOutlined,
  BarChartOutlined,
  StarFilled,
  ArrowRightOutlined,
  CreditCardOutlined,
  MobileOutlined,
  BankOutlined,
  WalletOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function AdminDashboard() {
  const router = useRouter()
  const screens = useBreakpoint()
  const [showBookingsModal, setShowBookingsModal] = useState(false)
  const [showCheckedInModal, setShowCheckedInModal] = useState(false)
  const [showAvailableRoomsModal, setShowAvailableRoomsModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [bookingFilter, setBookingFilter] = useState('today')
  const [customDate, setCustomDate] = useState('')

  // Mock data
  const allBookings = [
    { id: 1, bookingId: 'BK001', guest: 'John Doe', room: '101', checkIn: '2024-01-20', checkOut: '2024-01-22', amount: 4000, status: 'confirmed' },
    { id: 2, bookingId: 'BK002', guest: 'Jane Smith', room: '205', checkIn: '2024-01-19', checkOut: '2024-01-21', amount: 7000, status: 'confirmed' },
    { id: 3, bookingId: 'BK003', guest: 'Bob Wilson', room: '301', checkIn: '2024-01-15', checkOut: '2024-01-18', amount: 10000, status: 'checked_out' },
  ]

  const checkedInGuests = [
    { id: 1, guest: 'Alice Brown', room: '102', checkIn: '2024-01-19 14:30', phone: '+911234567890' },
    { id: 2, guest: 'Charlie Davis', room: '203', checkIn: '2024-01-20 10:15', phone: '+919876543210' },
    { id: 3, guest: 'Diana Evans', room: '305', checkIn: '2024-01-18 16:00', phone: '+911122334455' },
  ]

  const availableRooms = [
    { id: 1, roomNumber: '101', type: 'Standard', price: 2000, floor: 1 },
    { id: 2, roomNumber: '104', type: 'Standard', price: 2000, floor: 1 },
    { id: 3, roomNumber: '201', type: 'Deluxe', price: 3500, floor: 2 },
    { id: 4, roomNumber: '301', type: 'Suite', price: 5000, floor: 3 },
    { id: 5, roomNumber: '302', type: 'Suite', price: 5000, floor: 3 },
  ]

  const revenueData = {
    total: 50000,
    byPaymentMethod: [
      { method: 'Cash', amount: 15000 },
      { method: 'Card', amount: 25000 },
      { method: 'UPI', amount: 10000 },
    ],
    byRoomType: [
      { type: 'Standard', amount: 12000, bookings: 6 },
      { type: 'Deluxe', amount: 21000, bookings: 6 },
      { type: 'Suite', amount: 17000, bookings: 3 },
    ],
    pending: 8000,
    collected: 42000,
  }

  const revenueTrend = [
    { day: 'Mon', revenue: 45000 },
    { day: 'Tue', revenue: 52000 },
    { day: 'Wed', revenue: 48000 },
    { day: 'Thu', revenue: 55000 },
    { day: 'Fri', revenue: 50000 },
    { day: 'Sat', revenue: 58000 },
    { day: 'Sun', revenue: 50000 }
  ]

  const maxRevenue = 60000

  const bookingsColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
    },
    {
      title: 'Guest',
      dataIndex: 'guest',
      key: 'guest',
    },
    {
      title: 'Room',
      dataIndex: 'room',
      key: 'room',
    },
    {
      title: 'Check-In',
      dataIndex: 'checkIn',
      key: 'checkIn',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color="green">{status}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="link" 
          onClick={() => router.push(`/admin/bookings?id=${record.id}`)}
        >
          View Details <ArrowRightOutlined />
        </Button>
      ),
    },
  ]

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Hotel Management System</title>
        <meta name="description" content="Admin dashboard for hotel management" />
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Title level={2}>Admin Dashboard</Title>
            <Paragraph type="secondary">Welcome back! Here's what's happening at your hotel.</Paragraph>
          </div>

          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                onClick={() => setShowBookingsModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <Statistic
                  title="Total Bookings"
                  value={150}
                  prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                onClick={() => setShowCheckedInModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <Statistic
                  title="Checked In"
                  value={25}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                onClick={() => setShowAvailableRoomsModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <Statistic
                  title="Available Rooms"
                  value={45}
                  prefix={<HomeOutlined style={{ color: '#13c2c2' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                onClick={() => setShowRevenueModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <Statistic
                  title="Revenue Today"
                  value={50000}
                  prefix="₹"
                  suffix={<DollarOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
          </Row>

          {/* Revenue Trend Chart */}
          <Card title="Revenue Trend (Last 7 Days)">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {revenueTrend.map((item, idx) => {
                const dates = ['2024-01-20', '2024-01-21', '2024-01-22', '2024-01-23', '2024-01-24', '2024-01-25', '2024-01-26']
                const percentage = (item.revenue / maxRevenue) * 100
                return (
                  <div
                    key={idx}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => router.push(`/admin/analytics?date=${dates[idx]}`)}
                  >
                    <Text style={{ width: '48px' }}>{item.day}</Text>
                    <Progress
                      percent={percentage}
                      format={() => `₹${(item.revenue / 1000).toFixed(0)}K`}
                      strokeColor={{
                        '0%': '#1890ff',
                        '100%': '#096dd9',
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                )
              })}
            </Space>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              Click on any bar to view detailed analytics for that day
            </Text>
          </Card>

          {/* Alerts & Notifications */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Alert
                message="Today's Arrivals"
                description={
                  <div>
                    <Title level={3} style={{ margin: '8px 0', color: '#1890ff' }}>12 guests</Title>
                    <Text type="secondary">Check-in scheduled today</Text>
                  </div>
                }
                type="info"
                icon={<ArrowRightOutlined />}
                showIcon
                onClick={() => router.push('/admin/bookings?filter=arrivals_today')}
                style={{ cursor: 'pointer' }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Alert
                message="Today's Departures"
                description={
                  <div>
                    <Title level={3} style={{ margin: '8px 0', color: '#fa8c16' }}>8 guests</Title>
                    <Text type="secondary">Check-out scheduled today</Text>
                  </div>
                }
                type="warning"
                icon={<ArrowRightOutlined rotate={180} />}
                showIcon
                onClick={() => router.push('/admin/bookings?filter=departures_today')}
                style={{ cursor: 'pointer' }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Alert
                message="Pending Actions"
                description={
                  <div>
                    <Title level={3} style={{ margin: '8px 0', color: '#ff4d4f' }}>5 items</Title>
                    <Text type="secondary">Requires attention</Text>
                  </div>
                }
                type="error"
                icon={<ExclamationCircleOutlined />}
                showIcon
                onClick={() => setShowPendingModal(true)}
                style={{ cursor: 'pointer' }}
              />
            </Col>
          </Row>

          {/* Quick Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => router.push('/admin/analytics?focus=occupancy')}>
                <Statistic
                  title="Occupancy Rate"
                  value={78}
                  suffix="%"
                  prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
                />
                <Text type="success" style={{ fontSize: '12px' }}>↑ 5% from last week</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => router.push('/admin/pricing')}>
                <Statistic
                  title="Avg Daily Rate"
                  value={3200}
                  prefix={<DollarOutlined style={{ color: '#13c2c2' }} />}
                />
                <Text type="success" style={{ fontSize: '12px' }}>↑ 2% from last month</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => router.push('/admin/analytics')}>
                <Statistic
                  title="RevPAR"
                  value={2496}
                  prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
                />
                <Text type="success" style={{ fontSize: '12px' }}>↑ 7% from last week</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable onClick={() => router.push('/admin/feedback')}>
                <Statistic
                  title="Guest Satisfaction"
                  value={4.5}
                  suffix={<StarFilled style={{ color: '#faad14' }} />}
                />
                <Text type="success" style={{ fontSize: '12px' }}>Based on 45 reviews</Text>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Button
                  type="default"
                  block
                  size="large"
                  icon={<FileTextOutlined />}
                  onClick={() => router.push('/admin/bookings?action=create')}
                >
                  New Booking
                </Button>
              </Col>
              <Col xs={12} sm={6}>
                <Button
                  type="default"
                  block
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={() => router.push('/admin/bookings?filter=arrivals_today')}
                >
                  Quick Check-In
                </Button>
              </Col>
              <Col xs={12} sm={6}>
                <Button
                  type="default"
                  block
                  size="large"
                  icon={<ArrowRightOutlined rotate={90} />}
                  onClick={() => router.push('/admin/bookings?filter=departures_today')}
                >
                  Quick Check-Out
                </Button>
              </Col>
              <Col xs={12} sm={6}>
                <Button
                  type="default"
                  block
                  size="large"
                  icon={<BarChartOutlined />}
                  onClick={() => router.push('/admin/analytics?action=generate')}
                >
                  Generate Report
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Recent Activity */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="Recent Bookings"
                extra={
                  <Button 
                    type="link" 
                    onClick={() => router.push('/admin/bookings')}
                    icon={<ArrowRightOutlined />}
                  >
                    View All
                  </Button>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {allBookings.slice(0, 4).map((booking) => (
                    <Card
                      key={booking.id}
                      size="small"
                      hoverable
                      onClick={() => router.push(`/admin/bookings?id=${booking.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>{booking.guest}</Text>
                          <br />
                          <Text type="secondary">Room {booking.room} • {booking.checkIn}</Text>
                        </div>
                        <Tag color="green">{booking.status}</Tag>
                      </div>
                    </Card>
                  ))}
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Room Status">
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Button
                    block
                    style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                    onClick={() => router.push('/admin/rooms?status=available')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Available</Text>
                      <Text strong style={{ color: '#52c41a' }}>45 rooms</Text>
                    </div>
                  </Button>
                  <Button
                    block
                    style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                    onClick={() => router.push('/admin/rooms?status=occupied')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Occupied</Text>
                      <Text strong style={{ color: '#1890ff' }}>25 rooms</Text>
                    </div>
                  </Button>
                  <Button
                    block
                    style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                    onClick={() => router.push('/admin/rooms?status=maintenance')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Maintenance</Text>
                      <Text strong style={{ color: '#faad14' }}>5 rooms</Text>
                    </div>
                  </Button>
                  <Button
                    block
                    style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                    onClick={() => router.push('/admin/rooms?status=dirty')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Dirty</Text>
                      <Text strong style={{ color: '#ff4d4f' }}>5 rooms</Text>
                    </div>
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Bookings Modal */}
          <Modal
            title="Total Bookings"
            open={showBookingsModal}
            onCancel={() => setShowBookingsModal(false)}
            footer={[
              <Button key="viewAll" onClick={() => {
                setShowBookingsModal(false)
                router.push('/admin/bookings')
              }}>
                View All Bookings
              </Button>,
              <Button key="create" type="primary" onClick={() => router.push('/admin/bookings?action=create')}>
                + Create New Booking
              </Button>,
            ]}
            width={1000}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space>
                <Button 
                  type={bookingFilter === 'today' ? 'primary' : 'default'}
                  onClick={() => setBookingFilter('today')}
                >
                  Today
                </Button>
                <Button 
                  type={bookingFilter === '7days' ? 'primary' : 'default'}
                  onClick={() => setBookingFilter('7days')}
                >
                  Past 7 Days
                </Button>
                <Button 
                  type={bookingFilter === '30days' ? 'primary' : 'default'}
                  onClick={() => setBookingFilter('30days')}
                >
                  Past 30 Days
                </Button>
              </Space>
              <Table
                columns={bookingsColumns}
                dataSource={ensureArray(allBookings)}
                pagination={false}
                size="small"
              />
            </Space>
          </Modal>

          {/* Checked In Modal */}
          <Modal
            title="Currently Checked In Guests"
            open={showCheckedInModal}
            onCancel={() => setShowCheckedInModal(false)}
            footer={[
              <Button key="viewAll" onClick={() => router.push('/admin/guests')}>
                View All Guests
              </Button>,
            ]}
            width={700}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {checkedInGuests.map((guest) => (
                <Card
                  key={guest.id}
                  hoverable
                  onClick={() => router.push(`/admin/guests?id=${guest.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>{guest.guest}</Text>
                      <br />
                      <Text type="secondary">Room {guest.room}</Text>
                      <br />
                      <Text type="secondary">Phone: {guest.phone}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text type="secondary">Checked In</Text>
                      <br />
                      <Text>{guest.checkIn}</Text>
                      <br />
                      <Button type="link" size="small">View Profile <ArrowRightOutlined /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          </Modal>

          {/* Available Rooms Modal */}
          <Modal
            title="Available Rooms"
            open={showAvailableRoomsModal}
            onCancel={() => setShowAvailableRoomsModal(false)}
            footer={[
              <Button key="viewAll" onClick={() => router.push('/admin/rooms')}>
                View All Rooms
              </Button>,
            ]}
            width={700}
          >
            <Row gutter={[16, 16]}>
              {availableRooms.map((room) => (
                <Col xs={24} sm={12} lg={8} key={room.id}>
                  <Card
                    hoverable
                    onClick={() => router.push(`/admin/rooms?id=${room.id}`)}
                    style={{ cursor: 'pointer', borderColor: '#52c41a' }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <Title level={3}>{room.roomNumber}</Title>
                      <Text type="secondary">{room.type}</Text>
                      <br />
                      <Text strong>₹{room.price}/night</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>Floor {room.floor}</Text>
                      <br />
                      <Button type="link" size="small">View Details <ArrowRightOutlined /></Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Modal>

          {/* Revenue Modal */}
          <Modal
            title="Revenue Breakdown - Today"
            open={showRevenueModal}
            onCancel={() => setShowRevenueModal(false)}
            footer={[
              <Button key="viewAll" onClick={() => {
                setShowRevenueModal(false)
                router.push('/admin/bills')
              }}>
                View All Bills
              </Button>,
            ]}
            width={800}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Row gutter={16}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Total Revenue"
                      value={revenueData.total}
                      prefix="₹"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Collected"
                      value={revenueData.collected}
                      prefix="₹"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card hoverable onClick={() => router.push('/admin/bills?status=pending')}>
                    <Statistic
                      title="Pending"
                      value={revenueData.pending}
                      prefix="₹"
                      valueStyle={{ color: '#faad14' }}
                    />
                    <Button type="link" size="small">View Pending Bills <ArrowRightOutlined /></Button>
                  </Card>
                </Col>
              </Row>
              
              <Divider>By Payment Method</Divider>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {revenueData.byPaymentMethod.map((item, idx) => {
                  const getIcon = () => {
                    switch (item.method.toLowerCase()) {
                      case 'card': return <CreditCardOutlined />
                      case 'upi': return <MobileOutlined />
                      case 'netbanking': return <BankOutlined />
                      case 'wallet': return <WalletOutlined />
                      default: return <DollarOutlined />
                    }
                  }
                  const percentage = ((item.amount / revenueData.total) * 100).toFixed(1)
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px' }}>
                      <Space>
                        {getIcon()}
                        <Text>{item.method}</Text>
                      </Space>
                      <Space>
                        <Text type="secondary">{percentage}%</Text>
                        <Text strong>₹{item.amount.toLocaleString()}</Text>
                      </Space>
                    </div>
                  )
                })}
              </Space>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Button 
                  type="link" 
                  icon={<BarChartOutlined />}
                  onClick={() => {
                    setShowRevenueModal(false)
                    router.push('/admin/analytics?tab=payments')
                  }}
                >
                  View Detailed Payment Analytics
                </Button>
              </div>

              <Divider>By Room Type</Divider>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {revenueData.byRoomType.map((item, idx) => (
                  <Card
                    key={idx}
                    size="small"
                    hoverable
                    onClick={() => router.push(`/admin/analytics?focus=roomType&type=${item.type.toLowerCase()}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong>{item.type}</Text>
                        <Text type="secondary"> ({item.bookings} bookings)</Text>
                      </div>
                      <div>
                        <Text strong>₹{item.amount.toLocaleString()}</Text>
                        <Button type="link" size="small">View Analytics <ArrowRightOutlined /></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            </Space>
          </Modal>

          {/* Pending Actions Modal */}
          <Modal
            title="Pending Actions"
            open={showPendingModal}
            onCancel={() => setShowPendingModal(false)}
            footer={[
              <Button key="close" onClick={() => setShowPendingModal(false)}>
                Close
              </Button>,
            ]}
            width={500}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Card
                hoverable
                onClick={() => router.push('/admin/bills?status=pending')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Unpaid Bills</Text>
                    <br />
                    <Text type="secondary">Requires payment collection</Text>
                  </div>
                  <Title level={2} style={{ margin: 0, color: '#ff4d4f' }}>2</Title>
                </div>
              </Card>
              <Card
                hoverable
                onClick={() => router.push('/admin/rooms?status=maintenance')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Maintenance Requests</Text>
                    <br />
                    <Text type="secondary">Rooms need attention</Text>
                  </div>
                  <Title level={2} style={{ margin: 0, color: '#faad14' }}>2</Title>
                </div>
              </Card>
              <Card
                hoverable
                onClick={() => router.push('/admin/feedback?status=unresolved')}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Unresolved Feedback</Text>
                    <br />
                    <Text type="secondary">Guest concerns pending</Text>
                  </div>
                  <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>1</Title>
                </div>
              </Card>
            </Space>
          </Modal>
        </Space>
      </AdminLayout>
    </>
  )
}
