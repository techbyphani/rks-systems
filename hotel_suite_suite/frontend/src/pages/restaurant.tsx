import { Helmet } from 'react-helmet-async'
import Layout from '@/components/layout/Layout'
import { Typography, Row, Col, Card, List, Divider } from 'antd'
import { RestOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Restaurant() {
  const menuItems = [
    { name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with herbs', price: 1200 },
    { name: 'Butter Chicken', description: 'Traditional Indian curry', price: 800 },
    { name: 'Pasta Carbonara', description: 'Classic Italian pasta', price: 900 },
    { name: 'Chocolate Soufflé', description: 'Decadent chocolate dessert', price: 500 }
  ]

  return (
    <>
      <Helmet>
        <title>Restaurant - Hotel Management System</title>
        <meta name="description" content="Discover our fine dining restaurant" />
      </Helmet>
      <Layout>
        <div style={{ minHeight: '100vh', padding: '32px 0' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px' }}>
            <Title level={1} style={{ textAlign: 'center', marginBottom: '32px' }}>
              Fine Dining Restaurant
            </Title>
            
            {/* Restaurant Info */}
            <Card 
              title="About Our Restaurant"
              style={{ marginBottom: '32px' }}
              cover={
                <div style={{ 
                  height: '300px', 
                  background: '#f0f0f0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <RestOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                </div>
              }
            >
              <Paragraph style={{ marginBottom: '24px' }}>
                Experience culinary excellence at our award-winning restaurant. Our world-class chefs 
                prepare exquisite dishes using the finest ingredients, creating memorable dining experiences 
                for our guests.
              </Paragraph>
              
              <Row gutter={[32, 32]}>
                <Col xs={24} md={12}>
                  <Title level={4}>
                    <ClockCircleOutlined /> Operating Hours
                  </Title>
                  <List
                    size="small"
                    dataSource={[
                      'Breakfast: 6:00 AM - 10:00 AM',
                      'Lunch: 12:00 PM - 3:00 PM',
                      'Dinner: 7:00 PM - 11:00 PM'
                    ]}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Col>
                
                <Col xs={24} md={12}>
                  <Title level={4}>Cuisine Types</Title>
                  <List
                    size="small"
                    dataSource={['Continental', 'Indian', 'Chinese', 'Mediterranean']}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Col>
              </Row>
            </Card>

            {/* Menu Highlights */}
            <Card title="Menu Highlights">
              <Row gutter={[32, 32]}>
                {menuItems.map((item, idx) => (
                  <Col xs={24} sm={12} key={idx}>
                    <div style={{ paddingBottom: '16px', borderBottom: idx < menuItems.length - 2 ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <Title level={5} style={{ margin: 0 }}>{item.name}</Title>
                        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>₹{item.price}</span>
                      </div>
                      <Paragraph type="secondary" style={{ margin: 0, fontSize: '14px' }}>
                        {item.description}
                      </Paragraph>
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
