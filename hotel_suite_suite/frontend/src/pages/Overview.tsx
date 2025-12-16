import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Typography, List, Tag, Space, Progress, Spin, Badge, Button, Divider } from 'antd'
import {
  UserOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  CheckSquareOutlined,
  AlertOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoginOutlined,
  LogoutOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'
import { workflowService } from '@/api'
import ActivityFeed from '@/components/shared/ActivityFeed'
import QuickActions from '@/components/shared/QuickActions'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface OperationalSummary {
  arrivals: { expected: number; completed: number; pending: number }
  departures: { expected: number; completed: number; pending: number }
  inHouse: number
  occupancy: number
  revenue: { today: number; mtd: number }
  alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'error' }>
}

export default function OverviewPage() {
  const { tenant, allowedModules } = useAppContext()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OperationalSummary | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadDashboardData()
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadDashboardData, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    if (!tenant?.id) return;
    setLoading(true)
    try {
      const summary = await workflowService.getOperationalSummary(tenant.id)
      setData(summary)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!tenant) return null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Command Center</Title>
            <Space style={{ marginTop: 8 }}>
              <Text type="secondary">{tenant.name}</Text>
              <Divider type="vertical" />
              <Text type="secondary">{dayjs().format('dddd, MMMM D, YYYY')}</Text>
              <Divider type="vertical" />
              <Text type="secondary">
                <ClockCircleOutlined /> Last updated: {dayjs(lastUpdated).format('HH:mm:ss')}
              </Text>
            </Space>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadDashboardData} loading={loading}>
              Refresh
            </Button>
            <QuickActions variant="button" />
          </Space>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Today's Operations */}
          <Row gutter={[16, 16]}>
            {/* Arrivals Card */}
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable 
                onClick={() => navigate('/suite/crs/reservations')}
                style={{ borderTop: '3px solid #52c41a' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Text type="secondary">Today's Arrivals</Text>
                      <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                        {data?.arrivals.expected || 0}
                      </Title>
                    </div>
                    <div 
                      style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        background: '#f6ffed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LoginOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    </div>
                  </Space>
                  <Progress 
                    percent={data?.arrivals.expected ? Math.round((data.arrivals.completed / data.arrivals.expected) * 100) : 0}
                    strokeColor="#52c41a"
                    size="small"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {data?.arrivals.completed || 0} checked in · {data?.arrivals.pending || 0} pending
                  </Text>
                </Space>
              </Card>
            </Col>

            {/* Departures Card */}
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable 
                onClick={() => navigate('/suite/crs/reservations')}
                style={{ borderTop: '3px solid #1e88e5' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Text type="secondary">Today's Departures</Text>
                      <Title level={2} style={{ margin: 0, color: '#1e88e5' }}>
                        {data?.departures.expected || 0}
                      </Title>
                    </div>
                    <div 
                      style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        background: '#e3f2fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LogoutOutlined style={{ fontSize: 24, color: '#1e88e5' }} />
                    </div>
                  </Space>
                  <Progress 
                    percent={data?.departures.expected ? Math.round((data.departures.completed / data.departures.expected) * 100) : 0}
                    strokeColor="#1e88e5"
                    size="small"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {data?.departures.completed || 0} checked out · {data?.departures.pending || 0} pending
                  </Text>
                </Space>
              </Card>
            </Col>

            {/* Occupancy Card */}
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable 
                onClick={() => navigate('/suite/rms/rooms')}
                style={{ borderTop: '3px solid #2a5298' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Text type="secondary">Occupancy Rate</Text>
                      <Title level={2} style={{ margin: 0, color: '#2a5298' }}>
                        {data?.occupancy || 0}%
                      </Title>
                    </div>
                    <div 
                      style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        background: '#e8f0f8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HomeOutlined style={{ fontSize: 24, color: '#2a5298' }} />
                    </div>
                  </Space>
                  <Progress 
                    percent={data?.occupancy || 0}
                    strokeColor="#2a5298"
                    size="small"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {data?.inHouse || 0} guests in-house
                  </Text>
                </Space>
              </Card>
            </Col>

            {/* Revenue Card */}
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable 
                onClick={() => navigate('/suite/bms/folios')}
                style={{ borderTop: '3px solid #eb2f96' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space align="start" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Text type="secondary">Today's Revenue</Text>
                      <Title level={2} style={{ margin: 0, color: '#eb2f96' }}>
                        ₹{((data?.revenue.today || 0) / 1000).toFixed(0)}K
                      </Title>
                    </div>
                    <div 
                      style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        background: '#fff0f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DollarCircleOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                    </div>
                  </Space>
                  <div style={{ height: 24 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    MTD: ₹{((data?.revenue.mtd || 0) / 100000).toFixed(1)}L
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Alerts and Activity */}
          <Row gutter={[16, 16]}>
            {/* Operational Alerts */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <AlertOutlined style={{ color: '#fa8c16' }} />
                    <span>Operational Alerts</span>
                    {(data?.alerts?.length || 0) > 0 && (
                      <Badge count={data?.alerts.length} style={{ backgroundColor: '#fa8c16' }} />
                    )}
                  </Space>
                }
              >
                {data?.alerts && data.alerts.length > 0 ? (
                  <List
                    dataSource={data.alerts}
                    renderItem={(alert, index) => (
                      <List.Item key={index}>
                        <Space align="start">
                          <Badge 
                            color={
                              alert.severity === 'error' ? 'red' : 
                              alert.severity === 'warning' ? 'orange' : 'blue'
                            } 
                          />
                          <div>
                            <Tag 
                              color={
                                alert.severity === 'error' ? 'red' : 
                                alert.severity === 'warning' ? 'orange' : 'blue'
                              }
                            >
                              {alert.type.toUpperCase()}
                            </Tag>
                            <Text>{alert.message}</Text>
                          </div>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <CheckSquareOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                    <Title level={4} style={{ marginTop: 16, color: '#52c41a' }}>All Clear</Title>
                    <Text type="secondary">No operational alerts at this time</Text>
                  </div>
                )}
              </Card>
            </Col>

            {/* Activity Feed */}
            <Col xs={24} lg={12}>
              <ActivityFeed limit={6} />
            </Col>
          </Row>

          {/* Module Quick Access */}
          <Card title="Quick Access">
            <Row gutter={[16, 16]}>
              {allowedModules.slice(0, 9).map((moduleId) => {
                const moduleConfig: Record<string, { label: string; path: string; color: string; icon: React.ReactNode }> = {
                  crs: { label: 'Reservations', path: '/suite/crs/reservations', color: '#1e88e5', icon: <CalendarOutlined /> },
                  rms: { label: 'Room Status', path: '/suite/rms/rooms', color: '#13c2c2', icon: <HomeOutlined /> },
                  bms: { label: 'Billing', path: '/suite/bms/folios', color: '#eb2f96', icon: <DollarCircleOutlined /> },
                  oms: { label: 'Orders', path: '/suite/oms/orders', color: '#fa8c16', icon: <CheckSquareOutlined /> },
                  tms: { label: 'Tasks', path: '/suite/tms/tasks', color: '#52c41a', icon: <CheckSquareOutlined /> },
                  ims: { label: 'Inventory', path: '/suite/ims/items', color: '#a0d911', icon: <CheckSquareOutlined /> },
                  sms: { label: 'Suppliers', path: '/suite/sms/vendors', color: '#2a5298', icon: <UserOutlined /> },
                  ams: { label: 'Attendance', path: '/suite/ams/attendance', color: '#fa541c', icon: <UserOutlined /> },
                  as: { label: 'Reports', path: '/suite/as/reports', color: '#08979c', icon: <CheckSquareOutlined /> },
                }

                const config = moduleConfig[moduleId]
                if (!config) return null

                return (
                  <Col xs={12} sm={8} md={6} lg={4} xl={3} key={moduleId}>
                    <Card
                      hoverable
                      size="small"
                      style={{ textAlign: 'center' }}
                      onClick={() => navigate(config.path)}
                    >
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: `${config.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}>
                        <span style={{ color: config.color, fontWeight: 600, fontSize: 12 }}>
                          {moduleId.toUpperCase()}
                        </span>
                      </div>
                      <Text style={{ fontSize: 12 }}>{config.label}</Text>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </Card>
        </>
      )}
    </Space>
  )
}
