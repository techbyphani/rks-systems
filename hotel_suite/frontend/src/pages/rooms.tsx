import { Helmet } from 'react-helmet-async'
import Layout from '@/components/layout/Layout'
import { Button, Typography, Row, Col, Card, Space, Statistic } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Rooms() {
  const roomTypes = [
    {
      name: 'Standard Room',
      description: 'Comfortable room with essential amenities',
      price: 2000,
      image: 'https://via.placeholder.com/400x300'
    },
    {
      name: 'Deluxe Room',
      description: 'Spacious room with premium amenities',
      price: 3500,
      image: 'https://via.placeholder.com/400x300'
    },
    {
      name: 'Suite',
      description: 'Luxury suite with separate living area',
      price: 5000,
      image: 'https://via.placeholder.com/400x300'
    }
  ]

  return (
    <>
      <Helmet>
        <title>Rooms - Hotel Management System</title>
        <meta name="description" content="Explore our luxury rooms and suites" />
      </Helmet>
      <Layout>
        <div style={{ minHeight: '100vh', padding: '32px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <Title level={1} style={{ textAlign: 'center', marginBottom: '32px' }}>
              Our Rooms & Suites
            </Title>
            
            {/* Room Categories */}
            <Row gutter={[32, 32]}>
              {roomTypes.map((room, idx) => (
                <Col xs={24} md={12} lg={8} key={idx}>
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
                        <HomeOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                      </div>
                    }
                  >
                    <Card.Meta
                      title={room.name}
                      description={room.description}
                    />
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Statistic
                        value={room.price}
                        prefix="₹"
                        suffix="/night"
                        valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                      />
                      <Button type="primary">Book Now</Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </Layout>
    </>
  )
}
