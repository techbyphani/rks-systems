import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space,
  Divider,
  Alert,
} from 'antd';
import { 
  LockOutlined, 
  MailOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppContext } from '@/context/AppContext';

const { Title, Text, Paragraph } = Typography;

export default function OperatorLogin() {
  const { isAuthenticated, isOperator, loginAsOperator } = useAppContext();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated as operator
  useEffect(() => {
    if (isAuthenticated && isOperator) {
      navigate('/operator/overview', { replace: true });
    }
  }, [isAuthenticated, isOperator, navigate]);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      // In production, validate credentials
      const result = await loginAsOperator();
      if (result.success) {
        navigate('/operator/overview', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
      }}
    >
      <Card style={{ width: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
              placeholder="admin@hotelsuite.com" 
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
              loading={loading}
              style={{ 
                backgroundColor: '#722ed1',
                borderColor: '#722ed1',
              }}
            >
              Sign In to Operator Panel
            </Button>
          </Form.Item>
        </Form>

        {/* Demo Mode */}
        <Alert
          message="Demo Mode"
          description={
            <div style={{ fontSize: 12 }}>
              <div>Click sign in to access the operator panel.</div>
              <div style={{ marginTop: 8 }}>
                <Button 
                  size="small" 
                  type="primary"
                  ghost
                  onClick={() => {
                    form.setFieldsValue({ 
                      email: 'admin@hotelsuite.com',
                      password: 'admin123',
                    });
                  }}
                >
                  Fill Demo Credentials
                </Button>
              </div>
            </div>
          }
          type="info"
        />
      </Card>

      {/* Footer */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button 
          type="link" 
          onClick={() => navigate('/login')}
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          ← Hotel Staff Login
        </Button>
      </div>
    </div>
  );
}
