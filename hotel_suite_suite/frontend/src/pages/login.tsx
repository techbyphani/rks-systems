import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Form, 
  Input,
  Space, 
  Typography, 
  Spin,
  message,
  Avatar,
  Divider,
  Alert,
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAppContext } from '@/context/AppContext';
import { tenantService, tenantUserService } from '@/api';
import type { Tenant, TenantUser } from '@/types';

const { Title, Text, Paragraph } = Typography;

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

  const handleLogin = async (values: { email: string; password: string }) => {
    if (!tenant) return;

    setSubmitting(true);
    try {
      // In demo mode, find user by email
      const user = users.find(u => u.email.toLowerCase() === values.email.toLowerCase());
      
      if (!user) {
        message.error('User not found. Please check your email.');
        return;
      }

      // In production, you'd validate password here
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

  if (loading) {
    return (
      <LoginWrapper>
        <Card style={{ width: 420, textAlign: 'center', padding: 40 }}>
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
        <Card style={{ width: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4} type="danger">Unable to Load</Title>
            <Paragraph type="secondary">{error}</Paragraph>
          </div>
          <Button 
            type="primary" 
            block 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/login')}
          >
            Back to Hotel Finder
          </Button>
        </Card>
      </LoginWrapper>
    );
  }

  return (
    <LoginWrapper brandColor={tenant.primaryColor}>
      <Card style={{ width: 420 }}>
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
                backgroundColor: tenant.primaryColor || '#1890ff',
                fontSize: 28,
                marginBottom: 16,
              }}
            >
              {tenant.name.charAt(0)}
            </Avatar>
          )}
          <Title level={3} style={{ margin: 0 }}>{tenant.name}</Title>
          <Text type="secondary">{tenant.region}</Text>
        </div>

        <Divider />

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
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
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
                backgroundColor: tenant.primaryColor || undefined,
                borderColor: tenant.primaryColor || undefined,
              }}
            >
              Sign In
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Button type="link" size="small">
              Forgot password?
            </Button>
          </div>
        </Form>

        {/* Demo Mode Helper */}
        {users.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Demo Mode</Text>
            </Divider>
            <Alert
              message="Quick Login (Demo)"
              description={
                <div style={{ fontSize: 12 }}>
                  <div style={{ marginBottom: 8 }}>Select a user to auto-fill:</div>
                  <Space wrap size={4}>
                    {users.slice(0, 4).map(user => (
                      <Button 
                        key={user.id}
                        size="small"
                        onClick={() => {
                          form.setFieldsValue({ 
                            email: user.email,
                            password: 'demo123',
                          });
                        }}
                      >
                        {user.firstName}
                      </Button>
                    ))}
                  </Space>
                </div>
              }
              type="info"
              style={{ marginBottom: 0 }}
            />
          </>
        )}
      </Card>

      {/* Footer */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/login')}
          style={{ color: 'rgba(255,255,255,0.8)' }}
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
        // Direct navigation if exact match
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
      <Card style={{ width: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              fontSize: 32,
            }}
          >
            🏨
          </div>
          <Title level={3} style={{ marginBottom: 4 }}>Hotel Suite</Title>
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
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
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
                  style={{ cursor: 'pointer' }}
                >
                  <Space>
                    <Avatar 
                      style={{ backgroundColor: hotel.primaryColor || '#1890ff' }}
                    >
                      {hotel.name.charAt(0)}
                    </Avatar>
                    <div>
                      <Text strong>{hotel.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {hotel.region}
                      </Text>
                    </div>
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
            onClick={() => navigate('/operator')}
            style={{ color: '#722ed1' }}
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
        background: brandColor 
          ? `linear-gradient(135deg, ${brandColor}dd 0%, ${brandColor}99 100%)`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {children}
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
