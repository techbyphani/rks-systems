import { Helmet } from 'react-helmet-async'
import AdminLayout from '@/components/layout/AdminLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { useState, useEffect } from 'react'
import { useRouter } from '@/shims/router'
import { useSearchParams } from 'react-router-dom'
import { 
  Card, 
  Button, 
  Select, 
  Modal, 
  Space, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Statistic,
  Progress,
  Table,
  Divider,
  Avatar,
  Tabs
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  ArrowLeftOutlined,
  DollarOutlined,
  HomeOutlined,
  CalendarOutlined,
  StarOutlined,
  RiseOutlined,
  FallOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CreditCardOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PaymentAnalytics from '@/components/payments/PaymentAnalytics'
import { PaymentMethod } from '@/types/payment'

const { Title, Text, Paragraph } = Typography

interface TopPerformer {
  room: string
  bookings: number
  revenue: number
  occupancy: number
}

export default function Analytics() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const urlFocus = searchParams.get('focus')
  const urlDate = searchParams.get('date')
  const urlAction = searchParams.get('action')
  
  const [dateRange, setDateRange] = useState('30')
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - replace with real API calls
  const kpiData = {
    totalRevenue: 2450000,
    revenueChange: 12.5,
    occupancyRate: 78.5,
    occupancyChange: 5.2,
    totalBookings: 342,
    bookingsChange: 8.3,
    avgRating: 4.6,
    ratingChange: 0.3
  }

  const revenueByRoomType = [
    { type: 'Deluxe', revenue: 980000, bookings: 145 },
    { type: 'Suite', revenue: 750000, bookings: 85 },
    { type: 'Standard', revenue: 520000, bookings: 98 },
    { type: 'Executive', revenue: 200000, bookings: 14 }
  ]

  const bookingSources = [
    { source: 'Website', count: 156, percentage: 45.6 },
    { source: 'Phone', count: 102, percentage: 29.8 },
    { source: 'Walk-in', count: 58, percentage: 17.0 },
    { source: 'Chatbot', count: 26, percentage: 7.6 }
  ]

  const revenueTrend = [
    { day: 'Mon', revenue: 85000 },
    { day: 'Tue', revenue: 92000 },
    { day: 'Wed', revenue: 78000 },
    { day: 'Thu', revenue: 95000 },
    { day: 'Fri', revenue: 110000 },
    { day: 'Sat', revenue: 125000 },
    { day: 'Sun', revenue: 115000 }
  ]

  const topPerformers: TopPerformer[] = [
    { room: 'Suite 501', bookings: 28, revenue: 420000, occupancy: 93 },
    { room: 'Deluxe 301', bookings: 26, revenue: 312000, occupancy: 87 },
    { room: 'Suite 502', bookings: 25, revenue: 375000, occupancy: 83 },
    { room: 'Deluxe 302', bookings: 24, revenue: 288000, occupancy: 80 }
  ]

  const operationalMetrics = {
    todayCheckIns: 12,
    todayCheckOuts: 8,
    avgStayDuration: 3.2,
    pendingPayments: 5,
    maintenanceRooms: 3,
    cancellationRate: 4.2
  }

  const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue))

  // Handle URL parameters
  useEffect(() => {
    const focus = searchParams.get('focus')
    const date = searchParams.get('date')
    const action = searchParams.get('action')
    
    if (focus === 'occupancy') {
      const element = document.getElementById('occupancy-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    if (date) {
      setSelectedDate(date)
    }
    if (action === 'generate') {
      setShowReportGenerator(true)
    }
  }, [searchParams])

  const topPerformersColumns: ColumnsType<TopPerformer> = [
    {
      title: 'Room',
      dataIndex: 'room',
      key: 'room',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Bookings',
      dataIndex: 'bookings',
      key: 'bookings',
      align: 'right',
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (revenue: number) => `₹${(revenue / 1000).toFixed(0)}K`,
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Occupancy',
      dataIndex: 'occupancy',
      key: 'occupancy',
      align: 'right',
      render: (occupancy: number) => (
        <Tag color="success">{occupancy}%</Tag>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ]

  return (
    <>
      <Helmet>
        <title>Analytics - Hotel Management System</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Analytics', href: '/admin/analytics' }
          ]} />

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <Title level={2} style={{ margin: 0 }}>Analytics Dashboard</Title>
                <Paragraph type="secondary">Business intelligence and performance insights</Paragraph>
              </div>
              <Space wrap>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push('/admin')}
                >
                  Back to Dashboard
                </Button>
                <Select
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: 150 }}
                  options={[
                    { value: '7', label: 'Last 7 Days' },
                    { value: '30', label: 'Last 30 Days' },
                    { value: '90', label: 'Last 90 Days' },
                    { value: '365', label: 'Last Year' },
                  ]}
                />
              </Space>
            </div>

            {/* Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'overview',
                  label: 'Overview',
                  children: (
                    <>
                      {/* KPI Cards */}
                      <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Revenue"
                    value={(kpiData.totalRevenue / 100000).toFixed(1)}
                    suffix="L"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                  />
                  <div style={{ marginTop: '8px' }}>
                    {kpiData.revenueChange > 0 ? (
                      <Text type="success">
                        <RiseOutlined /> {kpiData.revenueChange}% from last period
                      </Text>
                    ) : (
                      <Text type="danger">
                        <FallOutlined /> {Math.abs(kpiData.revenueChange)}% from last period
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card
                  id="occupancy-section"
                  hoverable
                  onClick={() => router.push('/admin/analytics?focus=occupancy')}
                  style={{ cursor: 'pointer' }}
                >
                  <Statistic
                    title="Occupancy Rate"
                    value={kpiData.occupancyRate}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
                  />
                  <div style={{ marginTop: '8px' }}>
                    {kpiData.occupancyChange > 0 ? (
                      <Text type="success">
                        <RiseOutlined /> {kpiData.occupancyChange}% from last period
                      </Text>
                    ) : (
                      <Text type="danger">
                        <FallOutlined /> {Math.abs(kpiData.occupancyChange)}% from last period
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Bookings"
                    value={kpiData.totalBookings}
                    valueStyle={{ color: '#722ed1' }}
                    prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                  />
                  <div style={{ marginTop: '8px' }}>
                    {kpiData.bookingsChange > 0 ? (
                      <Text type="success">
                        <RiseOutlined /> {kpiData.bookingsChange}% from last period
                      </Text>
                    ) : (
                      <Text type="danger">
                        <FallOutlined /> {Math.abs(kpiData.bookingsChange)}% from last period
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Average Rating"
                    value={kpiData.avgRating}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<StarOutlined style={{ color: '#faad14' }} />}
                  />
                  <div style={{ marginTop: '8px' }}>
                    {kpiData.ratingChange > 0 ? (
                      <Text type="success">
                        <RiseOutlined /> {kpiData.ratingChange} from last period
                      </Text>
                    ) : (
                      <Text type="danger">
                        <FallOutlined /> {Math.abs(kpiData.ratingChange)} from last period
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
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
                  {selectedDate && (
                    <div style={{ marginTop: '16px', padding: '12px', background: '#e6f7ff', borderRadius: '6px' }}>
                      <Text type="secondary">Selected Date: <Text strong>{selectedDate}</Text></Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Click on any bar above to view detailed breakdown for that day.
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Booking Sources Distribution">
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {bookingSources.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <Text strong>{item.source}</Text>
                          <Text strong>{item.count} ({item.percentage}%)</Text>
                        </div>
                        <Progress 
                          percent={item.percentage} 
                          strokeColor={{
                            '0%': '#1890ff',
                            '100%': '#096dd9',
                          }}
                        />
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Revenue by Room Type */}
            <Card title="Revenue by Room Type">
              <Row gutter={[16, 16]}>
                {revenueByRoomType.map((item, idx) => (
                  <Col xs={24} sm={12} md={6} key={idx}>
                    <Card
                      hoverable
                      style={{ textAlign: 'center' }}
                    >
                      <Avatar 
                        size={64} 
                        style={{ 
                          backgroundColor: idx === 0 ? '#1890ff' : 
                                          idx === 1 ? '#722ed1' : 
                                          idx === 2 ? '#52c41a' : '#faad14',
                          marginBottom: '12px'
                        }}
                      >
                        {item.type[0]}
                      </Avatar>
                      <Title level={4}>{item.type}</Title>
                      <Statistic
                        value={(item.revenue / 100000).toFixed(1)}
                        suffix="L"
                        prefix="₹"
                        valueStyle={{ fontSize: '24px' }}
                      />
                      <Text type="secondary">{item.bookings} bookings</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

            {/* Bottom Section */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Top Performing Rooms">
                  <Table
                    columns={topPerformersColumns}
                    dataSource={ensureArray(topPerformers)}
                    rowKey="room"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Operational Metrics">
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <Statistic title="Today Check-Ins" value={operationalMetrics.todayCheckIns} />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic title="Today Check-Outs" value={operationalMetrics.todayCheckOuts} />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic title="Avg Stay Duration" value={operationalMetrics.avgStayDuration} suffix="days" />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic title="Pending Payments" value={operationalMetrics.pendingPayments} />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic title="Maintenance Rooms" value={operationalMetrics.maintenanceRooms} />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic title="Cancellation Rate" value={operationalMetrics.cancellationRate} suffix="%" />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* Report Generator */}
            <Card 
              title="Report Generator"
              extra={
                <Button 
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => setShowReportGenerator(true)}
                >
                  Generate Report
                </Button>
              }
            >
              <Text type="secondary">
                Generate comprehensive reports for revenue, occupancy, bookings, and guest satisfaction.
              </Text>
            </Card>

            {/* Report Generator Modal */}
            <Modal
              title="Generate Analytics Report"
              open={showReportGenerator}
              onCancel={() => setShowReportGenerator(false)}
              footer={[
                <Button key="cancel" onClick={() => setShowReportGenerator(false)}>
                  Cancel
                </Button>,
                <Button 
                  key="generate" 
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    // Handle report generation
                    setShowReportGenerator(false)
                  }}
                >
                  Generate Report
                </Button>,
              ]}
              width={600}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Text>Report generation form will be implemented here</Text>
              </Space>
            </Modal>
                    </>
                  )
                },
                {
                  key: 'payments',
                  label: (
                    <Space>
                      <CreditCardOutlined />
                      <span>Payments</span>
                    </Space>
                  ),
                  children: (
                    <PaymentAnalytics
                      totalRevenue={2450000}
                      paymentMethodDistribution={[
                        { method: 'card', amount: 1225000, count: 171, percentage: 50 },
                        { method: 'upi', amount: 735000, count: 103, percentage: 30 },
                        { method: 'netbanking', amount: 245000, count: 34, percentage: 10 },
                        { method: 'wallet', amount: 122500, count: 17, percentage: 5 },
                        { method: 'cash', amount: 122500, count: 17, percentage: 5 }
                      ]}
                      successRate={95.5}
                      averageTransactionValue={7164}
                      totalTransactions={342}
                    />
                  )
                }
              ]}
            />

          </div>
        </Space>
      </AdminLayout>
    </>
  )
}
