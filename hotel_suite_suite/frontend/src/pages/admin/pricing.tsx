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
  Statistic,
  Form,
  InputNumber,
  Input,
  Drawer,
  Divider
} from 'antd'
import { 
  ArrowLeftOutlined,
  EditOutlined,
  DollarOutlined,
  HomeOutlined,
  CalendarOutlined,
  BarChartOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface RoomType {
  id: number
  name: string
  basePrice: number
  capacity: number
  description: string
  roomCount: number
  occupiedCount: number
}

export default function AdminPricing() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const urlId = searchParams.get('id')
  const [form] = Form.useForm()
  
  const [editingType, setEditingType] = useState<RoomType | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null)

  // Mock data - replace with API call
  const roomTypes: RoomType[] = [
    {
      id: 1,
      name: 'Standard Room',
      basePrice: 2000,
      capacity: 2,
      description: 'Comfortable room with basic amenities',
      roomCount: 15,
      occupiedCount: 8
    },
    {
      id: 2,
      name: 'Deluxe Room',
      basePrice: 3500,
      capacity: 3,
      description: 'Spacious room with premium amenities',
      roomCount: 10,
      occupiedCount: 6
    },
    {
      id: 3,
      name: 'Suite',
      basePrice: 5000,
      capacity: 4,
      description: 'Luxury suite with separate living area',
      roomCount: 5,
      occupiedCount: 2
    },
    {
      id: 4,
      name: 'Presidential Suite',
      basePrice: 10000,
      capacity: 6,
      description: 'Ultimate luxury with panoramic views',
      roomCount: 2,
      occupiedCount: 0
    }
  ]

  const handleEdit = (roomType: RoomType) => {
    setEditingType(roomType)
    form.setFieldsValue(roomType)
    setShowEditModal(true)
  }

  const handleSave = async (values: RoomType) => {
    // TODO: Implement API call to update room type
    console.log('Updating room type:', values)
    setShowEditModal(false)
    setEditingType(null)
    form.resetFields()
  }

  // Handle URL parameters
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const roomType = roomTypes.find(rt => rt.id === Number(id))
      if (roomType) {
        setSelectedRoomType(roomType)
        setShowDetailDrawer(true)
      }
    }
  }, [searchParams])

  return (
    <>
      <Helmet>
        <title>Room Pricing - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Pricing', href: '/admin/pricing' },
            ...(selectedRoomType ? [{ label: selectedRoomType.name, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <Title level={2} style={{ margin: 0 }}>Room Types & Pricing</Title>
                <Text type="secondary">Manage room categories and set pricing</Text>
              </div>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/admin')}
              >
                Back to Dashboard
              </Button>
            </div>

            {/* Room Types Grid */}
            <Row gutter={[16, 16]}>
              {roomTypes.map((roomType) => (
                <Col xs={24} sm={12} lg={6} key={roomType.id}>
                  <Card
                    hoverable
                    onClick={() => {
                      setSelectedRoomType(roomType)
                      setShowDetailDrawer(true)
                    }}
                    style={{ cursor: 'pointer' }}
                    extra={
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(roomType)
                        }}
                      />
                    }
                  >
                    <div style={{ textAlign: 'center' }}>
                      <Title level={4}>{roomType.name}</Title>
                      <Text type="secondary">{roomType.description}</Text>
                      <Divider />
                      <Statistic
                        title="Base Price"
                        value={roomType.basePrice}
                        prefix="₹"
                        suffix="/night"
                        valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      />
                      <Row gutter={16} style={{ marginTop: '16px' }}>
                        <Col span={12}>
                          <Statistic title="Total Rooms" value={roomType.roomCount} />
                        </Col>
                        <Col span={12}>
                          <Statistic title="Occupied" value={roomType.occupiedCount} />
                        </Col>
                      </Row>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                        Capacity: {roomType.capacity} guests
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Room Type Detail Drawer */}
            <Drawer
              title={selectedRoomType?.name}
              placement="right"
              onClose={() => {
                setShowDetailDrawer(false)
                setSelectedRoomType(null)
                router.push('/admin/pricing')
              }}
              open={showDetailDrawer}
              width={600}
              extra={
                <Space>
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => {
                      if (selectedRoomType) {
                        handleEdit(selectedRoomType)
                        setShowDetailDrawer(false)
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    icon={<HomeOutlined />}
                    onClick={() => router.push(`/admin/rooms?type=${selectedRoomType?.id}`)}
                  >
                    View Rooms
                  </Button>
                  <Button 
                    icon={<BarChartOutlined />}
                    onClick={() => router.push(`/admin/analytics?focus=roomType&type=${selectedRoomType?.name.toLowerCase()}`)}
                  >
                    View Analytics
                  </Button>
                </Space>
              }
            >
              {selectedRoomType && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Room Type Information">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Name">{selectedRoomType.name}</Descriptions.Item>
                      <Descriptions.Item label="Description">{selectedRoomType.description}</Descriptions.Item>
                      <Descriptions.Item label="Base Price">
                        ₹{selectedRoomType.basePrice}/night
                      </Descriptions.Item>
                      <Descriptions.Item label="Capacity">
                        {selectedRoomType.capacity} guests
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Rooms">
                        {selectedRoomType.roomCount}
                      </Descriptions.Item>
                      <Descriptions.Item label="Occupied">
                        {selectedRoomType.occupiedCount}
                      </Descriptions.Item>
                      <Descriptions.Item label="Available">
                        {selectedRoomType.roomCount - selectedRoomType.occupiedCount}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Space>
              )}
            </Drawer>

            {/* Edit Modal */}
            <Modal
              title="Edit Room Type Pricing"
              open={showEditModal}
              onCancel={() => {
                setShowEditModal(false)
                setEditingType(null)
                form.resetFields()
              }}
              footer={null}
              width={600}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
              >
                <Form.Item name="name" label="Room Type Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="basePrice" label="Base Price (₹/night)" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item name="capacity" label="Capacity (guests)" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={() => {
                      setShowEditModal(false)
                      setEditingType(null)
                      form.resetFields()
                    }}>
                      Cancel
                    </Button>
                    <Button type="primary" htmlType="submit">
                      Save Changes
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
          </div>
        </Space>
      </AdminLayout>
    </>
  )
}
