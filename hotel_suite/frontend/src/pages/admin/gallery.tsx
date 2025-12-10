import { Helmet } from 'react-helmet-async'
import AdminLayout from '@/components/layout/AdminLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { useState, useEffect } from 'react'
import { useRouter } from '@/shims/router'
import { useSearchParams } from 'react-router-dom'
import { 
  Card, 
  Button, 
  Modal, 
  Space, 
  Typography, 
  Row, 
  Col,
  Descriptions,
  Image,
  Upload,
  Checkbox,
  Input
} from 'antd'
import { 
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  UploadOutlined,
  PictureOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface GalleryImage {
  id: number
  imageUrl: string
  description: string
  createdAt: string
}

export default function AdminGallery() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const urlId = searchParams.get('id')
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  // Mock data - replace with API call
  const images: GalleryImage[] = [
    {
      id: 1,
      imageUrl: 'https://via.placeholder.com/300x200',
      description: 'Hotel Lobby',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      imageUrl: 'https://via.placeholder.com/300x200',
      description: 'Standard Room',
      createdAt: '2024-01-16'
    },
    {
      id: 3,
      imageUrl: 'https://via.placeholder.com/300x200',
      description: 'Restaurant',
      createdAt: '2024-01-17'
    },
    {
      id: 4,
      imageUrl: 'https://via.placeholder.com/300x200',
      description: 'Swimming Pool',
      createdAt: '2024-01-18'
    }
  ]

  const handleImageSelect = (imageId: number) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const handleDeleteSelected = () => {
    if (selectedImages.length > 0) {
      // TODO: Implement API call to delete selected images
      console.log('Deleting images:', selectedImages)
      setSelectedImages([])
    }
  }

  // Handle URL parameters
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const image = images.find(img => img.id === Number(id))
      if (image) {
        setSelectedImage(image)
        setShowDetailModal(true)
      }
    }
  }, [searchParams])

  return (
    <>
      <Helmet>
        <title>Gallery - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Gallery', href: '/admin/gallery' },
            ...(selectedImage ? [{ label: selectedImage.description, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>Image Gallery</Title>
              <Space wrap>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push('/admin')}
                >
                  Back to Dashboard
                </Button>
                {selectedImages.length > 0 && (
                  <Button 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteSelected}
                  >
                    Delete Selected ({selectedImages.length})
                  </Button>
                )}
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddModal(true)}
                >
                  Upload Image
                </Button>
              </Space>
            </div>

            {/* Image Grid */}
            <Row gutter={[16, 16]}>
              {images.map((image) => (
                <Col xs={12} sm={8} md={6} lg={4} key={image.id}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ position: 'relative' }}>
                        <Image
                          src={image.imageUrl}
                          alt={image.description}
                          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                          preview={false}
                        />
                        <Checkbox
                          checked={selectedImages.includes(image.id)}
                          onChange={() => handleImageSelect(image.id)}
                          style={{ 
                            position: 'absolute', 
                            top: '8px', 
                            left: '8px',
                            background: 'rgba(255, 255, 255, 0.8)',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    }
                    onClick={() => {
                      setSelectedImage(image)
                      setShowDetailModal(true)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Meta
                      title={image.description}
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {image.createdAt}
                        </Text>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Image Detail Modal */}
            <Modal
              title={
                <Space>
                  <PictureOutlined />
                  {selectedImage?.description}
                </Space>
              }
              open={showDetailModal}
              onCancel={() => {
                setShowDetailModal(false)
                setSelectedImage(null)
                router.push('/admin/gallery')
              }}
              footer={[
                <Button key="close" onClick={() => {
                  setShowDetailModal(false)
                  setSelectedImage(null)
                  router.push('/admin/gallery')
                }}>
                  Close
                </Button>,
                <Button 
                  key="delete" 
                  danger
                  icon={<DeleteOutlined />}
                >
                  Delete Image
                </Button>,
                <Button 
                  key="edit" 
                  type="primary"
                  icon={<EyeOutlined />}
                >
                  Edit Details
                </Button>,
              ]}
              width={700}
            >
              {selectedImage && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Image
                    src={selectedImage.imageUrl}
                    alt={selectedImage.description}
                    style={{ width: '100%' }}
                  />
                  <Card size="small" title="Image Information">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Description">
                        {selectedImage.description}
                      </Descriptions.Item>
                      <Descriptions.Item label="Uploaded">
                        {selectedImage.createdAt}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Space>
              )}
            </Modal>

            {/* Upload Image Modal */}
            <Modal
              title="Upload New Image"
              open={showAddModal}
              onCancel={() => setShowAddModal(false)}
              footer={[
                <Button key="cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>,
                <Button key="upload" type="primary" icon={<UploadOutlined />}>
                  Upload
                </Button>,
              ]}
              width={500}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Upload.Dragger>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">
                    Support for single or bulk upload. Strictly prohibited from uploading company data or other
                    band files
                  </p>
                </Upload.Dragger>
                <Input placeholder="Image description" />
              </Space>
            </Modal>
          </div>
        </Space>
      </AdminLayout>
    </>
  )
}
