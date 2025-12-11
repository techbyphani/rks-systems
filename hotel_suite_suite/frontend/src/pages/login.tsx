import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Form, Input, Select, Space, Typography } from 'antd'
import { LockOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons'
import { TENANTS } from '@/config/tenants'
import { USERS } from '@/config/users'
import { useAppContext } from '@/context/AppContext'

const { Title, Text, Paragraph } = Typography

export default function Login() {
  const { login, isAuthenticated } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const [tenantId, setTenantId] = useState(TENANTS[0].id)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const tenantUsers = useMemo(() => USERS.filter((user) => user.tenantId === tenantId), [tenantId])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/suite/overview', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    form.setFieldsValue({ tenantId, userId: tenantUsers[0]?.id })
  }, [form, tenantId, tenantUsers])

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
              Hotel Suite Login
            </Title>
            <Text type="secondary">Select your hotel and user role to continue.</Text>
          </div>

          {error && <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />}

          <Form
            form={form}
            layout="vertical"
            initialValues={{ tenantId: TENANTS[0].id, userId: tenantUsers[0]?.id }}
            onFinish={handleFinish}
          >
            <Form.Item name="tenantId" label="Hotel / Tenant" rules={[{ required: true, message: 'Please choose a hotel' }]}>
              <Select
                value={tenantId}
                onChange={(value) => {
                  setTenantId(value)
                  setError(null)
                }}
                options={TENANTS.map((tenant) => ({ label: tenant.name, value: tenant.id }))}
              />
            </Form.Item>

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
