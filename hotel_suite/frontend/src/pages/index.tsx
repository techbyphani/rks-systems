import { Helmet } from 'react-helmet-async'
import Layout from '@/components/layout/Layout'
import { Button, Typography, Row, Col, Card, Space } from 'antd'
import { HomeOutlined, RestOutlined, CalendarOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Hotel Management System - Home</title>
        <meta name="description" content="Welcome to our luxury hotel" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Helmet>
      <Layout>
        <div style={{ minHeight: '100vh' }}>
          {/* Hero Section */}
          <section style={{ 
            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', 
            color: '#fff', 
            padding: '80px 0',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
              <Title level={1} style={{ color: '#fff', marginBottom: '24px' }}>
                Welcome to Our Luxury Hotel
              </Title>
              <Paragraph style={{ fontSize: '20px', marginBottom: '32px', color: 'rgba(255, 255, 255, 0.9)' }}>
                Experience comfort and elegance like never before
              </Paragraph>
              <Button type="primary" size="large" style={{ background: '#fff', color: '#1890ff', border: 'none' }}>
                Book Now
              </Button>
            </div>
          </section>

          {/* Features Section */}
          <section style={{ padding: '64px 0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
              <Title level={2} style={{ textAlign: 'center', marginBottom: '48px' }}>Why Choose Us</Title>
              <Row gutter={[32, 32]}>
                <Col xs={24} md={8}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      background: '#e6f7ff', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 16px',
                      fontSize: '32px'
                    }}>
                      <HomeOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <Title level={4}>Luxury Rooms</Title>
                    <Paragraph type="secondary">
                      Comfortable and elegant rooms with modern amenities
                    </Paragraph>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      background: '#e6f7ff', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 16px',
                      fontSize: '32px'
                    }}>
                      <RestOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <Title level={4}>Fine Dining</Title>
                    <Paragraph type="secondary">
                      Exquisite cuisine prepared by world-class chefs
                    </Paragraph>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card style={{ textAlign: 'center', height: '100%' }}>
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      background: '#e6f7ff', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 16px',
                      fontSize: '32px'
                    }}>
                      <CalendarOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <Title level={4}>Events & Conferences</Title>
                    <Paragraph type="secondary">
                      Perfect venues for your special occasions
                    </Paragraph>
                  </Card>
                </Col>
              </Row>
            </div>
          </section>
        </div>
      </Layout>
    </>
  )
}
