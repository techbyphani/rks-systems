import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Form, 
  Input,
  Select,
  Space, 
  Typography, 
  Spin,
  message,
  Avatar,
  Divider,
  Alert,
  Tag,
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAppContext } from '@/context/AppContext';
import { tenantService, tenantUserService } from '@/api';
import type { Tenant, TenantUser } from '@/types';

const { Title, Text, Paragraph } = Typography;

// Role display config
const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  hotel_admin: { label: 'Admin', color: 'red' },
  manager: { label: 'Manager', color: 'blue' },
  supervisor: { label: 'Supervisor', color: 'purple' },
  staff: { label: 'Staff', color: 'default' },
};

// ============================================================
// HOTEL LOGIN PAGE (with slug)
// ============================================================

function HotelLoginPage({ slug }: { slug: string }) {
  const { loginAsHotelUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenantBySlug();
  }, [slug]);

  const loadTenantBySlug = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantData = await tenantService.getBySlug(slug);
      if (!tenantData) {
        setError('Hotel not found. Please check the URL.');
        return;
      }
      if (tenantData.status === 'suspended') {
        setError('This hotel account is currently suspended.');
        return;
      }
      if (tenantData.status === 'cancelled') {
        setError('This hotel account has been cancelled.');
        return;
      }
      setTenant(tenantData);

      // Load users for demo mode
      const result = await tenantUserService.getAll({ 
        tenantId: tenantData.id, 
        isActive: true,
        pageSize: 100 
      });
      setUsers(result.data);
    } catch (err) {
      setError('Failed to load hotel information.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    if (user) {
      form.setFieldsValue({
        email: user.email,
        password: 'demo123',
      });
    }
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    if (!tenant) return;

    setSubmitting(true);
    try {
      // In demo mode, find user by email
      const user = users.find(u => u.email.toLowerCase() === values.email.toLowerCase());
      
      if (!user) {
        message.error('User not found. Please check your email or select from the dropdown.');
        return;
      }

      const result = await loginAsHotelUser(tenant.id, user.id);
      
      if (result.success) {
        const redirectTo = (location.state as { from?: string } | undefined)?.from ?? '/suite/overview';
        navigate(redirectTo, { replace: true });
      } else {
        message.error(result.message || 'Login failed');
      }
    } catch (err) {
      message.error('Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group users by department
  const usersByDepartment = users.reduce((acc, user) => {
    const dept = (user as any).department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {} as Record<string, TenantUser[]>);

  if (loading) {
    return (
      <LoginWrapper>
        <Card 
          style={{ 
            width: 480, 
            textAlign: 'center', 
            padding: 40,
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: 'none',
          }}
        >
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading hotel...</Text>
          </div>
        </Card>
      </LoginWrapper>
    );
  }

  if (error || !tenant) {
    return (
      <LoginWrapper>
        <Card 
          style={{ 
            width: 480,
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: 'none',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4} type="danger">Unable to Load</Title>
            <Paragraph type="secondary">{error}</Paragraph>
          </div>
          <Button 
            type="primary" 
            block 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/login')}
            style={{
              height: 44,
              fontSize: 16,
              fontWeight: 500,
              backgroundColor: '#1e88e5',
              borderColor: '#1e88e5',
            }}
          >
            Back to Hotel Finder
          </Button>
        </Card>
      </LoginWrapper>
    );
  }

  return (
    <LoginWrapper brandColor={tenant.primaryColor}>
      <Card 
        style={{ 
          width: 520,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: 'none',
        }}
      >
        {/* Hotel Branding */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {tenant.logo ? (
            <img 
              src={tenant.logo} 
              alt={tenant.name} 
              style={{ height: 60, marginBottom: 16 }}
            />
          ) : (
            <Avatar 
              size={72} 
              style={{ 
                backgroundColor: tenant.primaryColor || '#1e88e5',
                fontSize: 28,
                marginBottom: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {tenant.name.charAt(0)}
            </Avatar>
          )}
          <Title level={3} style={{ margin: 0, color: '#1e3c72' }}>{tenant.name}</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>{tenant.region}</Text>
        </div>

        <Divider style={{ margin: '16px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Staff Login</Text>
        </Divider>

        {/* User Selection (Demo Mode) */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined />
            <Text strong>Select User</Text>
            <Tag color="blue" style={{ marginLeft: 'auto' }}>Demo Mode</Tag>
          </div>
          <Select
            placeholder="Choose a user to login as..."
            size="large"
            style={{ width: '100%' }}
            onChange={handleUserSelect}
            value={selectedUser?.id}
            showSearch
            optionFilterProp="label"
          >
            {Object.entries(usersByDepartment).map(([dept, deptUsers]) => (
              <Select.OptGroup key={dept} label={dept}>
                {deptUsers.map(user => {
                  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.staff;
                  return (
                    <Select.Option 
                      key={user.id} 
                      value={user.id}
                      label={`${user.firstName} ${user.lastName}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                          <Avatar size="small" style={{ backgroundColor: tenant.primaryColor }}>
                            {user.firstName[0]}
                          </Avatar>
                          <div>
                            <div>{user.firstName} {user.lastName}</div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {(user as any).jobTitle || user.role}
                            </Text>
                          </div>
                        </Space>
                        <Tag color={roleConfig.color} style={{ marginLeft: 8 }}>
                          {roleConfig.label}
                        </Tag>
                      </div>
                    </Select.Option>
                  );
                })}
              </Select.OptGroup>
            ))}
          </Select>
        </div>

        {/* Selected User Info */}
        {selectedUser && (
          <Alert
            message={
              <Space>
                <Avatar style={{ backgroundColor: tenant.primaryColor }}>
                  {selectedUser.firstName[0]}
                </Avatar>
                <div>
                  <Text strong>{selectedUser.firstName} {selectedUser.lastName}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {(selectedUser as any).jobTitle || selectedUser.role} • {(selectedUser as any).department || 'Staff'}
                  </Text>
                </div>
              </Space>
            }
            description={
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Access: {selectedUser.moduleAccess.map(m => m.toUpperCase()).join(', ')}
                </Text>
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider style={{ margin: '16px 0' }} />

        {/* Login Form */}
        <Form form={form} layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="you@hotel.com" 
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="••••••••" 
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={submitting}
              style={{ 
                backgroundColor: tenant.primaryColor || '#1e88e5',
                borderColor: tenant.primaryColor || '#1e88e5',
                height: 44,
                fontSize: 16,
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(30, 136, 229, 0.3)',
              }}
            >
              Sign In
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Button 
              type="link" 
              size="small"
              style={{ color: '#1e88e5' }}
            >
              Forgot password?
            </Button>
          </div>
        </Form>
      </Card>

      {/* Footer */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/login')}
          style={{ 
            color: 'rgba(255,255,255,0.95)',
            fontWeight: 500,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          Not your hotel? Find yours
        </Button>
      </div>
    </LoginWrapper>
  );
}

// ============================================================
// HOTEL FINDER PAGE (main /login)
// ============================================================

function HotelFinderPage() {
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [hotels, setHotels] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      const [active, trial] = await Promise.all([
        tenantService.getAll({ status: 'active', pageSize: 50 }),
        tenantService.getAll({ status: 'trial', pageSize: 50 }),
      ]);
      setHotels([...active.data, ...trial.data]);
    } catch (err) {
      console.error('Failed to load hotels');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    try {
      const results = await tenantService.search(searchTerm);
      if (results.length === 1) {
        navigate(`/login/${results[0].slug}`);
      } else if (results.length > 1) {
        setHotels(results);
      } else {
        message.warning('No hotels found. Try a different search term.');
      }
    } catch (err) {
      message.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const filteredHotels = hotels.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LoginWrapper>
      <Card 
        style={{ 
          width: 520,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: 'none',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e88e5 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              fontSize: 32,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            🏨
          </div>
          <Title level={3} style={{ marginBottom: 4, color: '#1e3c72' }}>Hotel Suite</Title>
          <Text type="secondary">Find your hotel to sign in</Text>
        </div>

        {/* Search */}
        <Input.Search
          placeholder="Search by hotel name or region..."
          size="large"
          enterButton={<SearchOutlined />}
          loading={searching}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          style={{ marginBottom: 24 }}
        />

        {/* Hotel List */}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filteredHotels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Text type="secondary">No hotels found</Text>
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {filteredHotels.map(hotel => (
                <Card 
                  key={hotel.id}
                  size="small"
                  hoverable
                  onClick={() => navigate(`/login/${hotel.slug}`)}
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: 8,
                    transition: 'all 0.3s ease',
                  }}
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Avatar 
                        size={40}
                        style={{ 
                          backgroundColor: hotel.primaryColor || '#1e88e5',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        {hotel.name.charAt(0)}
                      </Avatar>
                      <div>
                        <Text strong style={{ color: '#1e3c72' }}>{hotel.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {hotel.region}
                        </Text>
                      </div>
                    </Space>
                    {hotel.status === 'trial' && (
                      <Tag color="#1e88e5" style={{ borderRadius: 4 }}>Trial</Tag>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </div>

        <Divider />

        {/* Operator Link */}
        <div style={{ textAlign: 'center' }}>
          <Button 
            type="link" 
            onClick={() => navigate('/operator/login')}
            style={{ color: '#1e88e5', fontWeight: 500 }}
          >
            Operator Admin Panel →
          </Button>
        </div>
      </Card>
    </LoginWrapper>
  );
}

// ============================================================
// WRAPPER COMPONENT
// ============================================================

// Consistent professional gradient for all hotels
function generateGradientFromBrand(brandColor?: string): string {
  // Use the same professional blue gradient for all hotels
  return 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e88e5 100%)';
}

function LoginWrapper({ 
  children, 
  brandColor 
}: { 
  children: React.ReactNode;
  brandColor?: string;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: generateGradientFromBrand(brandColor),
        position: 'relative',
      }}
    >
      {/* Subtle overlay pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// MAIN EXPORT - Route Handler
// ============================================================

export default function LoginPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { isAuthenticated, isOperator } = useAppContext();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (isOperator) {
        navigate('/operator/overview', { replace: true });
      } else {
        navigate('/suite/overview', { replace: true });
      }
    }
  }, [isAuthenticated, isOperator, navigate]);

  // If slug provided, show hotel-specific login
  if (slug) {
    return <HotelLoginPage slug={slug} />;
  }

  // Otherwise show hotel finder
  return <HotelFinderPage />;
}
