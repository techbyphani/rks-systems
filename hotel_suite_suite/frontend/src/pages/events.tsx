import { Helmet } from 'react-helmet-async'
import Layout from '@/components/layout/Layout'
import { Typography, Row, Col, Card, Button, Space, List } from 'antd'
import { CalendarOutlined, SoundOutlined, ShoppingOutlined, GiftOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Events() {
  const eventSpaces = [
    {
      name: 'Grand Ballroom',
      description: 'Perfect for weddings and large celebrations',
      capacity: '500 guests',
      area: '5,000 sq ft',
      features: ['Audio/Visual equipment included']
    },
    {
      name: 'Conference Hall',
      description: 'Ideal for business meetings and seminars',
      capacity: '100 guests',
      area: '1,200 sq ft',
      features: ['High-speed WiFi']
    }
  ]

  const services = [
    {
      icon: <SoundOutlined />,
      title: 'Audio/Visual',
      description: 'Professional sound and lighting systems'
    },
    {
      icon: <ShoppingOutlined />,
      title: 'Catering',
      description: 'Customized menus for your event'
    },
    {
      icon: <GiftOutlined />,
      title: 'Decoration',
      description: 'Beautiful floral and theme decorations'
    }
  ]

  return (
    <>
      <Helmet>
        <title>Events - Hotel Management System</title>
        <meta name="description" content="Host your events at our luxury hotel" />
      </Helmet>
      <Layout>
        <div style={{ minHeight: '100vh', padding: '32px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <Title level={1} style={{ textAlign: 'center', marginBottom: '32px' }}>
              Events & Conferences
            </Title>
            
            {/* Event Spaces */}
            <Row gutter={[32, 32]} style={{ marginBottom: '48px' }}>
              {eventSpaces.map((space, idx) => (
                <Col xs={24} md={12} key={idx}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ 
                        height: '200px', 
                        background: '#f0f0f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <CalendarOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                      </div>
                    }
                  >
                    <Card.Meta
                      title={space.name}
                      description={space.description}
                    />
                    <div style={{ marginTop: '16px' }}>
                      <List
                        size="small"
                        dataSource={[
                          `Capacity: ${space.capacity}`,
                          `Area: ${space.area}`,
                          ...space.features
                        ]}
                        renderItem={(item) => <List.Item>{item}</List.Item>}
                      />
                      <Button type="primary" block style={{ marginTop: '16px' }}>
                        Inquire Now
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Services */}
            <Card title="Event Services">
              <Row gutter={[32, 32]}>
                {services.map((service, idx) => (
                  <Col xs={24} sm={8} key={idx}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        background: '#e6f7ff', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 16px',
                        fontSize: '32px',
                        color: '#1890ff'
                      }}>
                        {service.icon}
                      </div>
                      <Title level={4}>{service.title}</Title>
                      <Paragraph type="secondary">{service.description}</Paragraph>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </div>
        </div>
      </Layout>
    </>
  )
}
