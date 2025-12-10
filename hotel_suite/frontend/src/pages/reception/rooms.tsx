import { Helmet } from 'react-helmet-async'
import ReceptionLayout from '@/components/layout/ReceptionLayout'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Card, 
  Button, 
  Select, 
  Space, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Statistic,
  Modal,
  Descriptions
} from 'antd'
import { 
  HomeOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface Room {
  id: number
  roomNumber: string
  roomType: { name: string; basePrice: number }
  status: string
  guest: { name: string; checkOut?: string; checkIn?: string } | null
}

export default function ReceptionRooms() {
  const [searchParams] = useSearchParams()
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const roomRef = useRef<HTMLDivElement>(null)

  // Handle query parameters
  useEffect(() => {
    const roomNumber = searchParams.get('room')
    if (roomNumber) {
      // Find room by number and open modal
      const room = rooms.find(r => r.roomNumber === roomNumber)
      if (room) {
        setSelectedRoom(room)
        setShowRoomModal(true)
        // Scroll to room card if it exists
        setTimeout(() => {
          roomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
  }, [searchParams])

  // Mock data - replace with API call
  const rooms: Room[] = [
    { id: 1, roomNumber: '101', roomType: { name: 'Standard', basePrice: 2000 }, status: 'available', guest: null },
    { id: 2, roomNumber: '102', roomType: { name: 'Standard', basePrice: 2000 }, status: 'occupied', guest: { name: 'John Doe', checkOut: '2024-01-15' } },
    { id: 3, roomNumber: '103', roomType: { name: 'Standard', basePrice: 2000 }, status: 'dirty', guest: null },
    { id: 4, roomNumber: '201', roomType: { name: 'Deluxe', basePrice: 3500 }, status: 'maintenance', guest: null },
    { id: 5, roomNumber: '202', roomType: { name: 'Deluxe', basePrice: 3500 }, status: 'occupied', guest: { name: 'Jane Smith', checkOut: '2024-01-16' } },
    { id: 6, roomNumber: '203', roomType: { name: 'Deluxe', basePrice: 3500 }, status: 'available', guest: null },
    { id: 7, roomNumber: '301', roomType: { name: 'Suite', basePrice: 5000 }, status: 'reserved', guest: { name: 'Bob Wilson', checkIn: '2024-01-16' } },
    { id: 8, roomNumber: '302', roomType: { name: 'Suite', basePrice: 5000 }, status: 'available', guest: null },
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

  const handleStatusChange = (roomId: number, newStatus: string) => {
    // TODO: Implement API call to update room status
    console.log(`Updating room ${roomId} to ${newStatus}`)
  }

  const filteredRooms = selectedStatus === 'all' 
    ? (rooms || []) 
    : (rooms || []).filter(room => room.status === selectedStatus)

  const roomStats = [
    { status: 'available', count: rooms.filter(r => r.status === 'available').length, color: '#52c41a' },
    { status: 'occupied', count: rooms.filter(r => r.status === 'occupied').length, color: '#1890ff' },
    { status: 'reserved', count: rooms.filter(r => r.status === 'reserved').length, color: '#faad14' },
    { status: 'maintenance', count: rooms.filter(r => r.status === 'maintenance').length, color: '#fa8c16' },
    { status: 'dirty', count: rooms.filter(r => r.status === 'dirty').length, color: '#ff4d4f' },
  ]

  return (
    <>
      <Helmet>
        <title>Room Status - Reception Dashboard</title>
      </Helmet>
      
      <ReceptionLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>Room Status</Title>
              <Text type="secondary">Last updated: {new Date().toLocaleTimeString()}</Text>
            </div>

            {/* Room Statistics */}
            <Row gutter={[16, 16]}>
              {roomStats.map((stat) => (
                <Col xs={12} sm={8} md={4} lg={4} key={stat.status}>
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

            {/* Status Filter */}
            <Card>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Text strong>Filter by Status</Text>
                <Select
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'all', label: 'All Rooms' },
                    { value: 'available', label: 'Available' },
                    { value: 'occupied', label: 'Occupied' },
                    { value: 'reserved', label: 'Reserved' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'dirty', label: 'Dirty' },
                  ]}
                />
              </Space>
            </Card>

            {/* Room Grid */}
            <Row gutter={[16, 16]}>
              {filteredRooms.map((room) => (
                <Col xs={12} sm={8} md={6} lg={4} xl={3} key={room.id}>
                  <div
                    ref={searchParams.get('room') === room.roomNumber ? roomRef : null}
                  >
                    <Card
                      hoverable
                      onClick={() => {
                        setSelectedRoom(room)
                        setShowRoomModal(true)
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
                      <Tag color={getStatusColor(room.status)} style={{ marginTop: '8px' }}>
                        {room.status}
                      </Tag>
                      {room.guest && (
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <UserOutlined /> {room.guest.name}
                          </Text>
                        </div>
                      )}
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
                </div>
                </Col>
              ))}
            </Row>

            {/* Room Detail Modal */}
            <Modal
              title={`Room ${selectedRoom?.roomNumber} Details`}
              open={showRoomModal}
              onCancel={() => {
                setShowRoomModal(false)
                setSelectedRoom(null)
              }}
              footer={[
                <Button key="close" onClick={() => {
                  setShowRoomModal(false)
                  setSelectedRoom(null)
                }}>
                  Close
                </Button>,
              ]}
              width={500}
            >
              {selectedRoom && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Room Information">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Room Number">{selectedRoom.roomNumber}</Descriptions.Item>
                      <Descriptions.Item label="Room Type">{selectedRoom.roomType.name}</Descriptions.Item>
                      <Descriptions.Item label="Base Price">
                        ₹{selectedRoom.roomType.basePrice}/night
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={getStatusColor(selectedRoom.status)}>
                          {selectedRoom.status}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {selectedRoom.guest && (
                    <Card size="small" title="Current Guest">
                      <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Guest Name">
                          <UserOutlined /> {selectedRoom.guest.name}
                        </Descriptions.Item>
                        {selectedRoom.guest.checkOut && (
                          <Descriptions.Item label="Check-Out Date">
                            <CalendarOutlined /> {selectedRoom.guest.checkOut}
                          </Descriptions.Item>
                        )}
                        {selectedRoom.guest.checkIn && (
                          <Descriptions.Item label="Expected Check-In">
                            <CalendarOutlined /> {selectedRoom.guest.checkIn}
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Card>
                  )}

                  <Card size="small" title="Change Status">
                    <Select
                      value={selectedRoom.status}
                      onChange={(value) => handleStatusChange(selectedRoom.id, value)}
                      style={{ width: '100%' }}
                      options={[
                        { value: 'available', label: 'Available' },
                        { value: 'occupied', label: 'Occupied' },
                        { value: 'reserved', label: 'Reserved' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'dirty', label: 'Dirty' },
                      ]}
                    />
                  </Card>
                </Space>
              )}
            </Modal>
          </div>
        </Space>
      </ReceptionLayout>
    </>
  )
}
