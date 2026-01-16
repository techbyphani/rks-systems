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
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e88e5 100%)',
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
      <Card 
        style={{ 
          width: 420,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <SettingOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ marginBottom: 4, color: '#1e3c72' }}>Operator Panel</Title>
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
                backgroundColor: '#1e88e5',
                borderColor: '#1e88e5',
                height: 44,
                fontSize: 16,
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(30, 136, 229, 0.3)',
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
      <div style={{ marginTop: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Button 
          type="link" 
          onClick={() => navigate('/login')}
          style={{ 
            color: 'rgba(255,255,255,0.95)',
            fontWeight: 500,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          ← Hotel Staff Login
        </Button>
      </div>
    </div>
  );
}
