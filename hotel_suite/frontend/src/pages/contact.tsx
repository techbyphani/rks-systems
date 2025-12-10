import { Helmet } from 'react-helmet-async'
import Layout from '@/components/layout/Layout'
import { Typography, Row, Col, Card, Form, Input, Button, Space } from 'antd'
import { EnvironmentOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography
const { TextArea } = Input

export default function Contact() {
  const [form] = Form.useForm()

  const handleSubmit = (values: any) => {
    // TODO: Implement contact form submission
    console.log('Contact form submitted:', values)
  }

  return (
    <>
      <Helmet>
        <title>Contact - Hotel Management System</title>
        <meta name="description" content="Get in touch with us" />
      </Helmet>
      <Layout>
        <div style={{ minHeight: '100vh', padding: '32px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <Title level={1} style={{ textAlign: 'center', marginBottom: '32px' }}>
              Contact Us
            </Title>
            
            <Row gutter={[32, 32]}>
              {/* Contact Form */}
              <Col xs={24} md={12}>
                <Card title="Send us a Message">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                  >
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                      <Input placeholder="Your Name" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                      <Input placeholder="your@email.com" />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone">
                      <Input placeholder="+91 12345 67890" />
                    </Form.Item>
                    <Form.Item name="message" label="Message" rules={[{ required: true }]}>
                      <TextArea rows={4} placeholder="Your message..." />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" block>
                        Send Message
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>

              {/* Contact Information */}
              <Col xs={24} md={12}>
                <Card title="Get in Touch">
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        background: '#e6f7ff', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <EnvironmentOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                      </div>
                      <div>
                        <Title level={5}>Address</Title>
                        <Paragraph type="secondary">
                          123 Hotel Street, City Center<br />
                          Mumbai, Maharashtra 400001
                        </Paragraph>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        background: '#e6f7ff', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <PhoneOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                      </div>
                      <div>
                        <Title level={5}>Phone</Title>
                        <Paragraph type="secondary">
                          +91 22 1234 5678<br />
                          +91 22 8765 4321
                        </Paragraph>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        background: '#e6f7ff', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <MailOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                      </div>
                      <div>
                        <Title level={5}>Email</Title>
                        <Paragraph type="secondary">
                          info@hotel.com<br />
                          reservations@hotel.com
                        </Paragraph>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        background: '#e6f7ff', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                      </div>
                      <div>
                        <Title level={5}>Reception Hours</Title>
                        <Paragraph type="secondary">24/7 Available</Paragraph>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Layout>
    </>
  )
}
