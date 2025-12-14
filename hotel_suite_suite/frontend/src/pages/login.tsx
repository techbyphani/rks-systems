import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Form, 
  Select, 
  Space, 
  Typography, 
  Divider,
  Spin,
  message,
  Avatar,
  Tag,
  Alert,
} from 'antd';
import { 
  UserOutlined, 
  HomeOutlined,
  SettingOutlined,
  TeamOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useAppContext } from '@/context/AppContext';
import { MODULE_INFO } from '@/config/plans';
import type { Tenant, TenantUser } from '@/types';

const { Title, Text, Paragraph } = Typography;

type LoginMode = 'select' | 'operator' | 'hotel';

export default function Login() {
  const { 
    isAuthenticated, 
    isOperator,
    loginAsOperator, 
    loginAsHotelUser, 
    loadTenants, 
    loadTenantUsers 
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  const [mode, setMode] = useState<LoginMode>('select');
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  // Load tenants when hotel mode is selected
  useEffect(() => {
    if (mode === 'hotel') {
      loadTenantsData();
    }
  }, [mode]);

  const loadTenantsData = async () => {
    setLoadingTenants(true);
    try {
      const data = await loadTenants();
      setTenants(data);
    } catch (error) {
      message.error('Failed to load hotels');
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleTenantSelect = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    setSelectedTenant(tenant || null);
    setUsers([]);
    form.setFieldValue('userId', undefined);

    if (tenant) {
      setLoadingUsers(true);
      try {
        const data = await loadTenantUsers(tenantId);
        setUsers(data);
      } catch (error) {
        message.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const handleOperatorLogin = async () => {
    setLoading(true);
    try {
      const result = await loginAsOperator();
      if (result.success) {
        navigate('/operator/overview', { replace: true });
      } else {
        message.error(result.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHotelLogin = async (values: { tenantId: string; userId: string }) => {
    setLoading(true);
    try {
      const result = await loginAsHotelUser(values.tenantId, values.userId);
      if (result.success) {
        const redirectTo = (location.state as { from?: string } | undefined)?.from ?? '/suite/overview';
        navigate(redirectTo, { replace: true });
      } else {
        message.error(result.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderModeSelection = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
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
          }}
        >
          <HomeOutlined style={{ fontSize: 32, color: '#fff' }} />
        </div>
        <Title level={3} style={{ marginBottom: 4 }}>Hotel Suite</Title>
        <Text type="secondary">Unified Hotel Management Platform</Text>
      </div>

      <Divider>Select Access Type</Divider>

      <Card
        hoverable
        onClick={() => setMode('hotel')}
        style={{ cursor: 'pointer' }}
      >
        <Space align="start">
          <Avatar 
            size={48} 
            style={{ backgroundColor: '#1890ff' }}
            icon={<TeamOutlined />}
          />
          <div>
            <Text strong style={{ fontSize: 16 }}>Hotel Staff Login</Text>
            <br />
            <Text type="secondary">Access your hotel's management system</Text>
          </div>
        </Space>
      </Card>

      <Card
        hoverable
        onClick={() => setMode('operator')}
        style={{ cursor: 'pointer' }}
      >
        <Space align="start">
          <Avatar 
            size={48} 
            style={{ backgroundColor: '#722ed1' }}
            icon={<SettingOutlined />}
          />
          <div>
            <Text strong style={{ fontSize: 16 }}>Operator Panel</Text>
            <br />
            <Text type="secondary">Manage hotels and subscriptions (Admin only)</Text>
          </div>
        </Space>
      </Card>
    </Space>
  );

  const renderOperatorLogin = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#722ed1',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <SettingOutlined style={{ fontSize: 32, color: '#fff' }} />
        </div>
        <Title level={3} style={{ marginBottom: 4 }}>Operator Panel</Title>
        <Text type="secondary">Hotel Suite Administration</Text>
      </div>

      <Alert
        message="Demo Mode"
        description="Click below to access the operator panel. In production, this would require authentication."
        type="info"
        showIcon
      />

      <Button 
        type="primary" 
        block 
        size="large"
        onClick={handleOperatorLogin}
        loading={loading}
        style={{ background: '#722ed1', borderColor: '#722ed1' }}
      >
        Enter Operator Panel
      </Button>

      <Button type="link" block onClick={() => setMode('select')}>
        ← Back to selection
      </Button>
    </Space>
  );

  const renderHotelLogin = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#1890ff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <ApartmentOutlined style={{ fontSize: 32, color: '#fff' }} />
        </div>
        <Title level={3} style={{ marginBottom: 4 }}>Hotel Staff Login</Title>
        <Text type="secondary">Select your hotel and user account</Text>
      </div>

      {loadingTenants ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading hotels...</Text>
          </div>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleHotelLogin}>
          <Form.Item
            name="tenantId"
            label="Select Hotel"
            rules={[{ required: true, message: 'Please select a hotel' }]}
          >
            <Select
              placeholder="Choose your hotel"
              size="large"
              showSearch
              optionFilterProp="label"
              onChange={handleTenantSelect}
              options={tenants.map(t => ({
                label: (
                  <Space>
                    <span>{t.name}</span>
                    {t.status === 'trial' && <Tag color="blue">Trial</Tag>}
                  </Space>
                ),
                value: t.id,
                searchLabel: t.name,
              }))}
            />
          </Form.Item>

          {selectedTenant && (
            <>
              {/* Show tenant info */}
              <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                <Space direction="vertical" size={4}>
                  <Text strong>{selectedTenant.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedTenant.region} • {selectedTenant.enabledModules.length} modules
                  </Text>
                  <Space wrap size={4} style={{ marginTop: 4 }}>
                    {selectedTenant.enabledModules.slice(0, 5).map(m => (
                      <Tag key={m} color={MODULE_INFO[m].color} style={{ fontSize: 10 }}>
                        {m.toUpperCase()}
                      </Tag>
                    ))}
                    {selectedTenant.enabledModules.length > 5 && (
                      <Tag style={{ fontSize: 10 }}>+{selectedTenant.enabledModules.length - 5}</Tag>
                    )}
                  </Space>
                </Space>
              </Card>

              <Form.Item
                name="userId"
                label="Select User"
                rules={[{ required: true, message: 'Please select a user' }]}
              >
                <Select
                  placeholder={loadingUsers ? 'Loading users...' : 'Choose your account'}
                  size="large"
                  loading={loadingUsers}
                  disabled={loadingUsers}
                  showSearch
                  optionFilterProp="label"
                  options={users.map(u => ({
                    label: (
                      <Space>
                        <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                          {u.firstName[0]}
                        </Avatar>
                        <span>{u.firstName} {u.lastName}</span>
                        <Tag color={
                          u.role === 'hotel_admin' ? 'red' :
                          u.role === 'manager' ? 'blue' :
                          u.role === 'supervisor' ? 'purple' : 'default'
                        }>
                          {u.role.replace('_', ' ')}
                        </Tag>
                      </Space>
                    ),
                    value: u.id,
                    searchLabel: `${u.firstName} ${u.lastName}`,
                  }))}
                />
              </Form.Item>

              <Alert
                message="Demo Mode"
                description="In production, users would enter their password here."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large"
                loading={loading}
                icon={<UserOutlined />}
              >
                Sign In
              </Button>
            </>
          )}

          <Button 
            type="link" 
            block 
            onClick={() => {
              setMode('select');
              setSelectedTenant(null);
              setUsers([]);
              form.resetFields();
            }}
            style={{ marginTop: 8 }}
          >
            ← Back to selection
          </Button>
        </Form>
      )}
    </Space>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(125deg, #f2f6ff 0%, #ffffff 60%, #f8fbff 100%)',
      }}
    >
      <Card 
        style={{ 
          width: 480, 
          maxWidth: '100%', 
          boxShadow: '0 16px 60px rgba(15, 98, 254, 0.1)', 
          borderRadius: 16 
        }}
      >
        {mode === 'select' && renderModeSelection()}
        {mode === 'operator' && renderOperatorLogin()}
        {mode === 'hotel' && renderHotelLogin()}
      </Card>
    </div>
  );
}
