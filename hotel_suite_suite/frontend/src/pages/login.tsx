import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Select, Space, Typography } from 'antd'
import { UserOutlined, HomeOutlined } from '@ant-design/icons'
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
  const tenantUsers = useMemo(() => USERS, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/suite/overview', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    form.setFieldsValue({ userId: tenantUsers[0]?.id })
  }, [form, tenantUsers])

  const handleFinish = (values: { userId: string }) => {
    const result = login(values.userId)
    if (result.success) {
      const redirectTo = (location.state as { from?: string } | undefined)?.from ?? '/suite/overview'
      navigate(redirectTo, { replace: true })
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
        background: 'linear-gradient(125deg, #f2f6ff 0%, #ffffff 60%, #f8fbff 100%)',
      }}
    >
      <Card style={{ width: 480, maxWidth: '100%', boxShadow: '0 16px 60px rgba(15, 98, 254, 0.1)', borderRadius: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#eef3ff',
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
            <Text type="secondary">Select your role to enter the unified operations suite.</Text>
          </div>

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

            <Button type="primary" htmlType="submit" block size="large" icon={<UserOutlined />}>
              Continue
            </Button>
          </Form>

          <div style={{ background: '#f5f7fb', padding: 12, borderRadius: 12 }}>
            <Paragraph style={{ marginBottom: 8, fontWeight: 600 }}>Roles available</Paragraph>
            {tenantUsers.map((user) => (
              <Paragraph key={user.id} style={{ marginBottom: 4 }}>
                <Text strong>{user.name}</Text> · {user.role}
              </Paragraph>
            ))}
          </div>
        </Space>
      </Card>
    </div>
  )
}
