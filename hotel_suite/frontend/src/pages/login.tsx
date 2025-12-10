import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { useRouter } from '@/shims/router'
import { Form, Input, Button, Card, Typography, Space, Alert } from 'antd'
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [form] = Form.useForm()

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    
    try {
      // TODO: Implement login API call
      console.log('Login attempt:', values)
      
      // Simulate login success - redirect based on role
      // This will be replaced with actual API call
      setTimeout(() => {
        if (values.username === 'admin') {
          router.push('/admin')
        } else {
          router.push('/reception')
        }
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Login error:', error)
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Login - Hotel Management System</title>
        <meta name="description" content="Login to hotel management system" />
      </Helmet>
      
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          {/* Logo/Icon Section */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              borderRadius: '50%',
              marginBottom: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
            }}>
              <HomeOutlined style={{ fontSize: '40px', color: '#fff' }} />
            </div>
            <Title level={1} style={{ color: '#fff', marginBottom: '8px' }}>Hotel Management</Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Staff Portal</Text>
          </div>

          {/* Login Card */}
          <Card style={{ borderRadius: '16px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={2}>Welcome Back</Title>
              <Text type="secondary">Sign in to continue</Text>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please input your username!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter your username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                  size="large"
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            {/* Demo Credentials */}
            <Alert
              message="Demo Credentials"
              description={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Admin:</Text>
                    <Text code>admin / admin123</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Reception:</Text>
                    <Text code>reception / reception123</Text>
                  </div>
                </Space>
              }
              type="info"
              style={{ marginTop: '24px' }}
            />

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                © 2025 RKS Systems. All rights reserved.
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
