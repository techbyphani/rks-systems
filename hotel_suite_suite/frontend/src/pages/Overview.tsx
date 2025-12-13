import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Typography, List, Tag, Space, Progress, Spin, Badge } from 'antd'
import {
  UserOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  CheckSquareOutlined,
  AlertOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'
import { reservationService, roomService, taskService, billingService } from '@/api'
import { PageHeader, StatCard, StatGrid } from '@/components/shared'

const { Title, Text } = Typography

interface DashboardData {
  reservations: {
    todaysArrivals: number
    todaysDepartures: number
    inHouse: number
  }
  rooms: {
    total: number
    available: number
    occupied: number
    dirty: number
    occupancyRate: number
  }
  tasks: {
    pending: number
    inProgress: number
    overdue: number
  }
  billing: {
    todaysRevenue: number
    openFolios: number
    totalOutstanding: number
  }
}

interface Alert {
  id: string
  title: string
  description: string
  type: 'info' | 'warning' | 'error'
  module: string
  time: string
}

export default function OverviewPage() {
  const { tenant, allowedModules } = useAppContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [reservationStats, roomStats, taskStats, billingMetrics] = await Promise.all([
        reservationService.getStats(),
        roomService.getStats(),
        taskService.getStats(),
        billingService.getMetrics(),
      ])

      setData({
        reservations: {
          todaysArrivals: reservationStats.todaysArrivals,
          todaysDepartures: reservationStats.todaysDepartures,
          inHouse: reservationStats.inHouse,
        },
        rooms: {
          total: roomStats.total,
          available: roomStats.available,
          occupied: roomStats.occupied,
          dirty: roomStats.dirty,
          occupancyRate: roomStats.occupancyRate,
        },
        tasks: {
          pending: taskStats.pending,
          inProgress: taskStats.inProgress,
          overdue: taskStats.overdue,
        },
        billing: {
          todaysRevenue: billingMetrics.todaysRevenue,
          openFolios: billingMetrics.openFolios,
          totalOutstanding: billingMetrics.totalOutstanding,
        },
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate alerts based on data
  const alerts: Alert[] = data ? [
    ...(data.reservations.todaysArrivals > 0 ? [{
      id: '1',
      title: `${data.reservations.todaysArrivals} arrivals pending check-in`,
      description: 'Review arrivals and prepare rooms',
      type: 'info' as const,
      module: 'CRS',
      time: 'Today',
    }] : []),
    ...(data.rooms.dirty > 5 ? [{
      id: '2',
      title: `${data.rooms.dirty} rooms awaiting housekeeping`,
      description: 'Assign housekeeping teams',
      type: 'warning' as const,
      module: 'RMS',
      time: 'Now',
    }] : []),
    ...(data.tasks.overdue > 0 ? [{
      id: '3',
      title: `${data.tasks.overdue} overdue tasks`,
      description: 'Review and escalate if needed',
      type: 'error' as const,
      module: 'TMS',
      time: 'Urgent',
    }] : []),
    ...(data.billing.openFolios > 10 ? [{
      id: '4',
      title: `${data.billing.openFolios} open folios pending settlement`,
      description: 'Review checkout billing',
      type: 'warning' as const,
      module: 'BMS',
      time: 'Today',
    }] : []),
  ] : []

  if (!tenant) return null

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title={`${tenant.name}`}
        subtitle="Unified Command Center - Real-time operational overview"
      />

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/suite/rms')}>
            <Statistic
              title="Occupancy Rate"
              value={data?.rooms.occupancyRate || 0}
              suffix="%"
              valueStyle={{ color: '#1677ff' }}
              prefix={<HomeOutlined />}
            />
            <Progress 
              percent={data?.rooms.occupancyRate || 0} 
              showInfo={false} 
              strokeColor="#1677ff" 
              style={{ marginTop: 12 }} 
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {data?.rooms.occupied} of {data?.rooms.total} rooms occupied
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/suite/crs')}>
            <Statistic
              title="Today's Arrivals"
              value={data?.reservations.todaysArrivals || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CalendarOutlined />}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Departures: {data?.reservations.todaysDepartures}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              In-house guests: {data?.reservations.inHouse}
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/suite/tms')}>
            <Statistic
              title="Open Tasks"
              value={(data?.tasks.pending || 0) + (data?.tasks.inProgress || 0)}
              valueStyle={{ color: data?.tasks.overdue ? '#fa8c16' : '#52c41a' }}
              prefix={<CheckSquareOutlined />}
            />
            <div style={{ marginTop: 12 }}>
              <Space>
                <Badge status="processing" text={`${data?.tasks.inProgress || 0} in progress`} />
              </Space>
            </div>
            {(data?.tasks.overdue || 0) > 0 && (
              <Text type="danger" style={{ fontSize: 12 }}>
                {data?.tasks.overdue} overdue
              </Text>
            )}
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/suite/bms')}>
            <Statistic
              title="Today's Revenue"
              value={data?.billing.todaysRevenue || 0}
              prefix="₹"
              valueStyle={{ color: '#eb2f96' }}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Open folios: {data?.billing.openFolios}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Outstanding: ₹{(data?.billing.totalOutstanding || 0).toLocaleString('en-IN')}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Alerts and Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <AlertOutlined style={{ color: '#fa8c16' }} />
                <span>Operational Alerts</span>
              </Space>
            }
          >
            {alerts.length > 0 ? (
              <List
                dataSource={alerts}
                renderItem={(alert) => (
                  <List.Item>
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Space align="baseline" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Tag color={
                          alert.type === 'error' ? 'red' : 
                          alert.type === 'warning' ? 'orange' : 'blue'
                        }>
                          {alert.module}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{alert.time}</Text>
                      </Space>
                      <Text strong>{alert.title}</Text>
                      <Text type="secondary">{alert.description}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <CheckSquareOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                <Text style={{ display: 'block', marginTop: 8 }}>All systems running smoothly</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Room Status Overview">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Available"
                  value={data?.rooms.available || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Occupied"
                  value={data?.rooms.occupied || 0}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Dirty / Cleaning"
                  value={data?.rooms.dirty || 0}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total Inventory"
                  value={data?.rooms.total || 0}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Module Quick Access */}
      <Card title="Quick Access">
        <Row gutter={[16, 16]}>
          {allowedModules.slice(0, 6).map((moduleId) => {
            const moduleConfig = {
              crs: { label: 'New Reservation', path: '/suite/crs/reservations', color: '#1677ff' },
              rms: { label: 'Room Status', path: '/suite/rms/rooms', color: '#13c2c2' },
              bms: { label: 'Collect Payment', path: '/suite/bms/folios', color: '#eb2f96' },
              oms: { label: 'New Order', path: '/suite/oms/orders', color: '#fa8c16' },
              tms: { label: 'View Tasks', path: '/suite/tms/tasks', color: '#52c41a' },
              ims: { label: 'Stock Levels', path: '/suite/ims/items', color: '#a0d911' },
              sms: { label: 'Purchase Orders', path: '/suite/sms/purchase-orders', color: '#722ed1' },
              ams: { label: 'Attendance', path: '/suite/ams/attendance', color: '#fa541c' },
              as: { label: 'Reports', path: '/suite/as/reports', color: '#08979c' },
            }[moduleId]

            if (!moduleConfig) return null

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={moduleId}>
                <Card
                  hoverable
                  size="small"
                  style={{ textAlign: 'center' }}
                  onClick={() => navigate(moduleConfig.path)}
                >
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: `${moduleConfig.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}>
                    <span style={{ color: moduleConfig.color, fontWeight: 600 }}>
                      {moduleId.toUpperCase()}
                    </span>
                  </div>
                  <Text>{moduleConfig.label}</Text>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>
    </Space>
  )
}
