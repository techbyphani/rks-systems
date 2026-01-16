import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Col, 
  Row, 
  Statistic, 
  Typography, 
  Timeline, 
  Button, 
  Space,
  Spin,
  List,
  Tag,
  Badge,
  Progress,
} from 'antd';
import { 
  ApartmentOutlined, 
  TeamOutlined,
  HomeOutlined,
  PlusOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { tenantService } from '@/api';
import { SUBSCRIPTION_PLANS } from '@/config/plans';
import type { Tenant } from '@/types';

const { Title, Text } = Typography;

interface DashboardStats {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  byPlan: Record<string, number>;
  totalUsers: number;
  totalRooms: number;
}

export default function OperatorOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, tenantsData] = await Promise.all([
        tenantService.getStats(),
        tenantService.getAll({ pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setStats(statsData);
      setRecentTenants(tenantsData.data);
    } catch (error) {
      console.error('Failed to load dashboard data');
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Operator Dashboard</Title>
          <Text type="secondary">Manage hotels, users, and subscriptions</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/operator/tenants')}
        >
          Add New Hotel
        </Button>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/operator/tenants')}>
            <Statistic 
              title="Total Hotels" 
              value={stats?.total || 0} 
              prefix={<ApartmentOutlined />} 
              valueStyle={{ color: '#1677ff' }} 
            />
            <div style={{ marginTop: 8 }}>
              <Space split="·">
                <Text type="success">{stats?.active || 0} active</Text>
                <Text type="warning">{stats?.trial || 0} trial</Text>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Total Users" 
              value={stats?.totalUsers || 0} 
              prefix={<TeamOutlined />} 
              valueStyle={{ color: '#52c41a' }} 
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              Across all hotels
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Total Rooms" 
              value={stats?.totalRooms || 0} 
              prefix={<HomeOutlined />} 
              valueStyle={{ color: '#722ed1' }} 
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              Under management
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Modules Avg" 
              value="6.5" 
              suffix="/ 9"
              prefix={<AppstoreOutlined />} 
              valueStyle={{ color: '#fa8c16' }} 
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              Per hotel
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Plan Distribution */}
        <Col xs={24} lg={8}>
          <Card title="Subscription Distribution">
            <Space direction="vertical" style={{ width: '100%' }}>
              {SUBSCRIPTION_PLANS.filter(p => p.id !== 'custom').map(plan => {
                const count = stats?.byPlan[plan.id] || 0;
                const percent = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                
                return (
                  <div key={plan.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>{plan.name}</Text>
                      <Text strong>{count} hotels</Text>
                    </div>
                    <Progress 
                      percent={percent} 
                      showInfo={false}
                      strokeColor={
                        plan.id === 'enterprise' ? '#722ed1' :
                        plan.id === 'professional' ? '#1890ff' : '#52c41a'
                      }
                    />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>

        {/* Recent Hotels */}
        <Col xs={24} lg={16}>
          <Card 
            title="Recently Added Hotels"
            extra={
              <Button type="link" onClick={() => navigate('/operator/tenants')}>
                View All <RightOutlined />
              </Button>
            }
          >
            <List
              dataSource={recentTenants}
              renderItem={(tenant) => {
                const plan = SUBSCRIPTION_PLANS.find(p => p.id === tenant.planId);
                return (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/operator/tenants/${tenant.id}`)}
                    actions={[
                      <Badge
                        key="status"
                        status={
                          tenant.status === 'active' ? 'success' :
                          tenant.status === 'trial' ? 'processing' : 'error'
                        }
                        text={tenant.status}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{tenant.name}</Text>
                          <Tag color={
                            tenant.planId === 'enterprise' ? 'purple' :
                            tenant.planId === 'professional' ? 'blue' : 'green'
                          }>
                            {plan?.name}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space split="·">
                          <Text type="secondary">{tenant.region}</Text>
                          <Text type="secondary">{tenant.enabledModules.length} modules</Text>
                          <Text type="secondary">{tenant.userCount || 0} users</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Activity Timeline */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity">
            <Timeline
              items={[
                { 
                  color: 'green', 
                  dot: <CheckCircleOutlined />,
                  children: (
                    <div>
                      <Text strong>Aurora Grand Hotel</Text>
                      <br />
                      <Text type="secondary">Modules updated - Added IMS, SMS</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>2 hours ago</Text>
                    </div>
                  ),
                },
                { 
                  color: 'blue', 
                  dot: <ClockCircleOutlined />,
                  children: (
                    <div>
                      <Text strong>Pacific Breeze Resort</Text>
                      <br />
                      <Text type="secondary">Trial started - Professional plan</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>1 day ago</Text>
                    </div>
                  ),
                },
                { 
                  color: 'orange', 
                  dot: <ExclamationCircleOutlined />,
                  children: (
                    <div>
                      <Text strong>Budget Stay Inn</Text>
                      <br />
                      <Text type="secondary">Suspended - Payment overdue</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>3 days ago</Text>
                    </div>
                  ),
                },
                { 
                  color: 'green', 
                  dot: <CheckCircleOutlined />,
                  children: (
                    <div>
                      <Text strong>Marina Bay Suites</Text>
                      <br />
                      <Text type="secondary">New user added - Wei Lin Tan</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>5 days ago</Text>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card 
                  size="small" 
                  hoverable 
                  style={{ textAlign: 'center' }}
                  onClick={() => navigate('/operator/tenants')}
                >
                  <ApartmentOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                  <div>Add Hotel</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small" 
                  hoverable 
                  style={{ textAlign: 'center' }}
                  onClick={() => navigate('/operator/users')}
                >
                  <TeamOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                  <div>User Templates</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small" 
                  hoverable 
                  style={{ textAlign: 'center' }}
                  onClick={() => navigate('/operator/tenants')}
                >
                  <AppstoreOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
                  <div>Manage Modules</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card 
                  size="small" 
                  hoverable 
                  style={{ textAlign: 'center' }}
                >
                  <HomeOutlined style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8 }} />
                  <div>View Reports</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
