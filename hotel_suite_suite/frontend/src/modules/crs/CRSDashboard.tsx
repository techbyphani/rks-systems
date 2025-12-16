import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, List, Row, Space, Statistic, Tag, Typography, Button, Spin, Progress } from 'antd'
import { CalendarOutlined, TeamOutlined, WifiOutlined, PlusOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons'
import dayjs from 'dayjs';
import { reservationService, guestService } from '@/api';
import { useNotifications } from '@/context/NotificationContext';
import { useAppContext } from '@/context/AppContext';
import { StatusTag } from '@/components/shared';
import type { Reservation } from '@/types';

const { Title, Text } = Typography

interface DashboardStats {
  todaysArrivals: number;
  todaysDepartures: number;
  inHouse: number;
  totalReservations: number;
  confirmedUpcoming: number;
}

interface ChannelStat {
  channel: string;
  percentage: number;
  count: number;
  status: string;
}

export default function CRSDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [channelMix, setChannelMix] = useState<ChannelStat[]>([]);

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [statsData, arrivalsData, channelStats] = await Promise.all([
        reservationService.getStats(tenant.id),
        reservationService.getTodaysArrivals(tenant.id),
        reservationService.getChannelStats(tenant.id),
      ]);
      setStats(statsData);
      setArrivals(arrivalsData.slice(0, 5));
      setChannelMix(channelStats);
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3}>Customer Reservation System</Title>
          <Text type="secondary">
            Centralized control for demand generation, booking pace, and arrival preparedness.
          </Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => navigate('/suite/crs/reservations')}>
            New Reservation
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/suite/crs/reservations')}>
            <Statistic 
              title="Today's Arrivals" 
              value={stats?.todaysArrivals || 0} 
              suffix="guests" 
              valueStyle={{ color: '#52c41a' }}
              prefix={<LoginOutlined />}
            />
            <Progress percent={75} showInfo={false} strokeColor="#52c41a" style={{ marginTop: 8 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>0 checked in so far</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/suite/crs/reservations')}>
            <Statistic 
              title="Today's Departures" 
              value={stats?.todaysDepartures || 0} 
              suffix="guests" 
              valueStyle={{ color: '#1890ff' }}
              prefix={<LogoutOutlined />}
            />
            <Progress percent={50} showInfo={false} strokeColor="#1890ff" style={{ marginTop: 8 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>0 checked out so far</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/suite/crs/reservations')}>
            <Statistic 
              title="In-House" 
              value={stats?.inHouse || 0} 
              suffix="guests" 
              valueStyle={{ color: '#722ed1' }}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block', fontSize: 12 }}>
              {stats?.confirmedUpcoming || 0} upcoming confirmed
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/suite/crs/reservations')}>
            <Statistic 
              title="Total Reservations" 
              value={stats?.totalReservations || 0} 
              valueStyle={{ color: '#1677ff' }}
              prefix={<CalendarOutlined />}
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block', fontSize: 12 }}>
              All time bookings
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Channel Contribution" extra={<WifiOutlined />}>
            <List
              dataSource={channelMix}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.channel}
                    description={<Text type="secondary">{item.status}</Text>}
                  />
                  <Space>
                    <Progress 
                      type="circle" 
                      percent={item.percentage} 
                      size={40}
                      strokeColor="#1890ff"
                    />
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card 
            title="Today's Arrivals" 
            extra={
              <Button type="link" onClick={() => navigate('/suite/crs/reservations')}>
                View All
              </Button>
            }
          >
            {arrivals.length > 0 ? (
              <List
                dataSource={arrivals}
                renderItem={(arrival) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/suite/crs/reservations/${arrival.id}`)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>
                            {arrival.guest?.firstName} {arrival.guest?.lastName}
                          </Text>
                          {arrival.guest?.vipStatus !== 'none' && (
                            <Tag color="gold">{arrival.guest?.vipStatus?.toUpperCase()}</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space split="·">
                          <Text type="secondary">{arrival.roomType?.name}</Text>
                          <Text type="secondary">{arrival.nights} nights</Text>
                        </Space>
                      }
                    />
                    <StatusTag status={arrival.status} type="reservation" />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No arrivals scheduled for today</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Quick Actions">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              hoverable 
              style={{ textAlign: 'center' }}
              onClick={() => navigate('/suite/crs/reservations')}
            >
              <CalendarOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
              <div>Reservations</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              hoverable 
              style={{ textAlign: 'center' }}
              onClick={() => navigate('/suite/crs/guests')}
            >
              <TeamOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
              <div>Guests</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              hoverable 
              style={{ textAlign: 'center' }}
              onClick={() => navigate('/suite/crs/calendar')}
            >
              <CalendarOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
              <div>Calendar</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              hoverable 
              style={{ textAlign: 'center' }}
              onClick={() => navigate('/suite/crs/reservations')}
            >
              <PlusOutlined style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8 }} />
              <div>New Booking</div>
            </Card>
          </Col>
        </Row>
      </Card>
    </Space>
  )
}
