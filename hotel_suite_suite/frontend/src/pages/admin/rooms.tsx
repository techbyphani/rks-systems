import { Helmet } from 'react-helmet-async'
import AdminLayout from '@/components/layout/AdminLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { useState, useEffect } from 'react'
import { useRouter } from '@/shims/router'
import { useSearchParams } from 'react-router-dom'
import { 
  Card, 
  Button, 
  Select, 
  Modal, 
  Space, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Descriptions,
  Statistic,
  Drawer
} from 'antd'
import { 
  ArrowLeftOutlined, 
  PlusOutlined,
  EditOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface Room {
  id: number
  roomNumber: string
  roomType: { name: string; basePrice: number }
  status: string
}

export default function AdminRooms() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const urlStatus = searchParams.get('status')
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // Mock data - replace with API call
  const rooms: Room[] = [
    { id: 1, roomNumber: '101', roomType: { name: 'Standard', basePrice: 2000 }, status: 'available' },
    { id: 2, roomNumber: '102', roomType: { name: 'Standard', basePrice: 2000 }, status: 'occupied' },
    { id: 3, roomNumber: '201', roomType: { name: 'Deluxe', basePrice: 3500 }, status: 'maintenance' },
    { id: 4, roomNumber: '202', roomType: { name: 'Deluxe', basePrice: 3500 }, status: 'dirty' },
    { id: 5, roomNumber: '301', roomType: { name: 'Suite', basePrice: 5000 }, status: 'available' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success'
      case 'occupied': return 'processing'
      case 'reserved': return 'warning'
      case 'maintenance': return 'warning'
      case 'dirty': return 'error'
      default: return 'default'
    }
  }

  // Handle URL parameters
  useEffect(() => {
    const roomId = searchParams.get('id')
    const status = searchParams.get('status')
    
    if (roomId) {
      const room = rooms.find(r => r.id === Number(roomId))
      if (room) {
        setSelectedRoom(room)
        setShowDetailPanel(true)
      }
    }
    if (status) {
      setStatusFilter(status)
    }
  }, [searchParams])

  const handleStatusChange = (roomId: number, newStatus: string) => {
    // TODO: Implement API call to update room status
    console.log(`Updating room ${roomId} to ${newStatus}`)
  }

  const filteredRooms = statusFilter === 'all' ? (rooms || []) : (rooms || []).filter(r => r.status === statusFilter)

  const roomStats = [
    { status: 'available', count: 12, color: '#52c41a' },
    { status: 'occupied', count: 8, color: '#1890ff' },
    { status: 'reserved', count: 3, color: '#faad14' },
    { status: 'maintenance', count: 2, color: '#fa8c16' },
    { status: 'dirty', count: 5, color: '#ff4d4f' },
  ]

  return (
    <>
      <Helmet>
        <title>Rooms - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Rooms', href: '/admin/rooms' },
            ...(selectedRoom ? [{ label: `Room ${selectedRoom.roomNumber}`, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2}>Room Management</Title>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/admin')}
              >
                Back to Dashboard
              </Button>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
              >
                Add Room
              </Button>
            </Space>
          </div>

          {/* Filters */}
          <Card>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Text strong>Room Type</Text>
                <Select
                  defaultValue="all"
                  style={{ width: '100%', marginTop: '8px' }}
                  options={[
                    { value: 'all', label: 'All Room Types' },
                    { value: 'standard', label: 'Standard' },
                    { value: 'deluxe', label: 'Deluxe' },
                    { value: 'suite', label: 'Suite' },
                  ]}
                />
              </Col>
              <Col xs={24} md={8}>
                <Text strong>Status</Text>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%', marginTop: '8px' }}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'available', label: 'Available' },
                    { value: 'occupied', label: 'Occupied' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'dirty', label: 'Dirty' },
                  ]}
                />
              </Col>
              <Col xs={24} md={8}>
                <Text strong>Legend</Text>
                <Space style={{ marginTop: '8px' }} wrap>
                  <Tag color="success">Available</Tag>
                  <Tag color="processing">Occupied</Tag>
                  <Tag color="error">Dirty</Tag>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Room Grid */}
          <Row gutter={[16, 16]}>
            {filteredRooms.map((room) => (
              <Col xs={12} sm={8} md={6} lg={4} key={room.id}>
                <Card
                  hoverable
                  onClick={() => {
                    setSelectedRoom(room)
                    setShowDetailPanel(true)
                  }}
                  style={{ 
                    cursor: 'pointer',
                    borderColor: getStatusColor(room.status) === 'success' ? '#52c41a' :
                                 getStatusColor(room.status) === 'processing' ? '#1890ff' :
                                 getStatusColor(room.status) === 'error' ? '#ff4d4f' : undefined
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ margin: 0 }}>{room.roomNumber}</Title>
                    <Text type="secondary">{room.roomType.name}</Text>
                    <br />
                    <Text strong>₹{room.roomType.basePrice}/night</Text>
                    <br />
                    <Tag color={getStatusColor(room.status)} style={{ marginTop: '8px' }}>
                      {room.status}
                    </Tag>
                    <Select
                      value={room.status}
                      onChange={(value) => handleStatusChange(room.id, value)}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                      style={{ width: '100%', marginTop: '8px' }}
                      options={[
                        { value: 'available', label: 'Available' },
                        { value: 'occupied', label: 'Occupied' },
                        { value: 'reserved', label: 'Reserved' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'dirty', label: 'Dirty' },
                      ]}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Room Statistics */}
          <Row gutter={16}>
            {roomStats.map((stat) => (
              <Col xs={24} sm={12} md={8} lg={4} key={stat.status}>
                <Card>
                  <Statistic
                    title={stat.status.charAt(0).toUpperCase() + stat.status.slice(1)}
                    value={stat.count}
                    valueStyle={{ color: stat.color }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Room Detail Drawer */}
          <Drawer
            title={`Room ${selectedRoom?.roomNumber} Details`}
            placement="right"
            onClose={() => setShowDetailPanel(false)}
            open={showDetailPanel}
            width={600}
            extra={
              <Space>
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => {
                    // Handle edit
                  }}
                >
                  Edit Room
                </Button>
                <Button 
                  icon={<CalendarOutlined />}
                  onClick={() => router.push(`/admin/bookings?roomId=${selectedRoom?.id}`)}
                >
                  View Bookings
                </Button>
                <Button 
                  icon={<DollarOutlined />}
                  onClick={() => router.push('/admin/pricing')}
                >
                  Update Pricing
                </Button>
              </Space>
            }
          >
            {selectedRoom && (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Room Number">{selectedRoom.roomNumber}</Descriptions.Item>
                  <Descriptions.Item label="Room Type">{selectedRoom.roomType.name}</Descriptions.Item>
                  <Descriptions.Item label="Base Price">
                    ₹{selectedRoom.roomType.basePrice}/night
                  </Descriptions.Item>
                  <Descriptions.Item label="Current Status">
                    <Tag color={getStatusColor(selectedRoom.status)}>
                      {selectedRoom.status}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                <div>
                  <Text strong>Change Status</Text>
                  <Select
                    value={selectedRoom.status}
                    onChange={(value) => handleStatusChange(selectedRoom.id, value)}
                    style={{ width: '100%', marginTop: '8px' }}
                    options={[
                      { value: 'available', label: 'Available' },
                      { value: 'occupied', label: 'Occupied' },
                      { value: 'reserved', label: 'Reserved' },
                      { value: 'maintenance', label: 'Maintenance' },
                      { value: 'dirty', label: 'Dirty' },
                    ]}
                  />
                </div>

                <Button 
                  block
                  onClick={() => router.push('/admin')}
                >
                  Back to Dashboard
                </Button>
              </Space>
            )}
          </Drawer>
        </Space>
      </AdminLayout>
    </>
  )
}
