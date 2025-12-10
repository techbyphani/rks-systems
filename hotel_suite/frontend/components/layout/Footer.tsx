import Link from 'next/link'
import { Layout, Row, Col, Typography, Space } from 'antd'
import { 
  HomeOutlined, 
  FacebookOutlined, 
  InstagramOutlined, 
  TwitterOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

const { Footer: AntFooter } = Layout
const { Title, Paragraph, Text } = Typography

export default function Footer() {
  return (
    <AntFooter style={{ background: '#001529', color: '#fff', padding: '48px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <Row gutter={[32, 32]}>
          {/* Hotel Info */}
          <Col xs={24} sm={12} md={6}>
            <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
              <HomeOutlined /> Hotel Management
            </Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.65)', marginBottom: '16px' }}>
              Experience luxury and comfort at our premium hotel with world-class amenities and services.
            </Paragraph>
            <Space>
              <FacebookOutlined style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }} />
              <InstagramOutlined style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }} />
              <TwitterOutlined style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.65)', cursor: 'pointer' }} />
            </Space>
          </Col>

          {/* Quick Links */}
          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>Quick Links</Title>
            <Space direction="vertical" size="small">
              <Link href="/rooms" style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>
                Rooms & Suites
              </Link>
              <Link href="/restaurant" style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>
                Restaurant
              </Link>
              <Link href="/events" style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>
                Events
              </Link>
              <Link href="/gallery" style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>
                Gallery
              </Link>
            </Space>
          </Col>

          {/* Services */}
          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>Services</Title>
            <Space direction="vertical" size="small">
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>24/7 Room Service</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>Concierge Service</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>Spa & Wellness</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>Business Center</Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'block' }}>Airport Transfer</Text>
            </Space>
          </Col>

          {/* Contact Info */}
          <Col xs={24} sm={12} md={6}>
            <Title level={5} style={{ color: '#fff', marginBottom: '16px' }}>Contact Info</Title>
            <Space direction="vertical" size="small">
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                <EnvironmentOutlined /> 123 Hotel Street, City Center
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                <PhoneOutlined /> +91 22 1234 5678
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                <MailOutlined /> info@hotel.com
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                <ClockCircleOutlined /> 24/7 Available
              </Text>
            </Space>
          </Col>
        </Row>

        <div style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          marginTop: '32px', 
          paddingTop: '32px', 
          textAlign: 'center' 
        }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            &copy; 2024 Hotel Management System. All rights reserved.
          </Text>
        </div>
      </div>
    </AntFooter>
  )
}
