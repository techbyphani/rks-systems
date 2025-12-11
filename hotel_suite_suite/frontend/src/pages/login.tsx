import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Form, Input, Select, Space, Typography } from 'antd'
import { LockOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons'
import { TENANTS } from '@/config/tenants'
import { USERS } from '@/config/users'
import { useAppContext } from '@/context/AppContext'

const { Title, Text, Paragraph } = Typography

const PRIMARY_TENANT = TENANTS[0]

export default function Login() {
  const { login, isAuthenticated } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const tenantUsers = useMemo(() => USERS, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/suite/overview', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    form.setFieldsValue({ userId: tenantUsers[0]?.id })
  }, [form, tenantUsers])

  const handleFinish = async (values: { userId: string; password: string }) => {
    setLoading(true)
    setError(null)
    const result = login(values.userId, values.password)
    setLoading(false)
    if (result.success) {
      const redirectTo = (location.state as { from?: string } | undefined)?.from ?? '/suite/overview'
      navigate(redirectTo, { replace: true })
    } else {
      setError(result.message ?? 'Unable to log in')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #0f62fe 0%, #042b74 100%)',
      }}
    >
      <Card style={{ width: 460, maxWidth: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#e6f0ff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <HomeOutlined style={{ fontSize: 32, color: '#0f62fe' }} />
            </div>
            <Title level={3} style={{ marginBottom: 4 }}>
              {PRIMARY_TENANT.name} · Staff Login
            </Title>
            <Text type="secondary">Choose your role and enter the password to manage operations.</Text>
          </div>

          {error && <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />}

          <Form form={form} layout="vertical" initialValues={{ userId: tenantUsers[0]?.id }} onFinish={handleFinish}>
            <Form.Item name="userId" label="User" rules={[{ required: true, message: 'Please choose a user' }]}>
              <Select
                placeholder="Select user"
                options={tenantUsers.map((user) => ({
                  label: `${user.name} · ${user.role}`,
                  value: user.id,
                }))}
              />
            </Form.Item>

            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter password' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<UserOutlined />}>
              Sign In
            </Button>
          </Form>

          <div style={{ background: '#f5f7fb', padding: 12, borderRadius: 8 }}>
            <Paragraph style={{ marginBottom: 8, fontWeight: 600 }}>Demo credentials</Paragraph>
            {tenantUsers.map((user) => (
              <Paragraph key={user.id} style={{ marginBottom: 4 }}>
                <Text strong>{user.name}</Text> · {user.role} · <Text code>{user.password}</Text>
              </Paragraph>
            ))}
          </div>
        </Space>
      </Card>
    </div>
  )
}
