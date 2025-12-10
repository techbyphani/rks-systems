import { Helmet } from 'react-helmet-async'
import Layout from '@/components/layout/Layout'
import { Typography, Row, Col, Card, Image } from 'antd'
import { PictureOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function Gallery() {
  const images = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    url: `https://via.placeholder.com/400x400?text=Image+${i + 1}`,
    title: `Gallery Image ${i + 1}`
  }))

  return (
    <>
      <Helmet>
        <title>Gallery - Hotel Management System</title>
        <meta name="description" content="Explore our hotel gallery" />
      </Helmet>
      <Layout>
        <div style={{ minHeight: '100vh', padding: '32px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <Title level={1} style={{ textAlign: 'center', marginBottom: '32px' }}>
              Hotel Gallery
            </Title>
            
            {/* Gallery Grid */}
            <Row gutter={[24, 24]}>
              {images.map((image) => (
                <Col xs={24} sm={12} lg={8} key={image.id}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ 
                        height: '300px', 
                        background: '#f0f0f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <PictureOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                      </div>
                    }
                  >
                    <Card.Meta title={image.title} />
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
