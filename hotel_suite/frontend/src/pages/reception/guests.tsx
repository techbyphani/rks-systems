import { Helmet } from 'react-helmet-async'
import ReceptionLayout from '@/components/layout/ReceptionLayout'
import { useState } from 'react'
import { useRouter } from '@/shims/router'
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Modal, 
  Space, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Statistic,
  Descriptions,
  Avatar
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  PlusOutlined,
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CalendarOutlined,
  SearchOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Search } = Input

interface Guest {
  id: number
  name: string
  phone: string
  email: string
  idProofType: string
  idProofNumber: string
  address: string
  currentBooking?: {
    bookingId: string
    room: { roomNumber: string }
    status: string
    checkInDate: string
    checkOutDate: string
  } | null
  totalBookings: number
  lastVisit: string
}

export default function ReceptionGuests() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

  // Mock data - replace with API call
  const guests: Guest[] = [
    {
      id: 1,
      name: 'John Doe',
      phone: '+911234567890',
      email: 'john@example.com',
      idProofType: 'Passport',
      idProofNumber: 'A1234567',
      address: '123 Main St, Mumbai',
      currentBooking: {
        bookingId: 'BK12345678',
        room: { roomNumber: '101' },
        status: 'checked_in',
        checkInDate: '2024-01-13',
        checkOutDate: '2024-01-15'
      },
      totalBookings: 3,
      lastVisit: '2024-01-13'
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone: '+919876543210',
      email: 'jane@example.com',
      idProofType: 'Aadhar',
      idProofNumber: '1234-5678-9012',
      address: '456 Park Ave, Delhi',
      currentBooking: null,
      totalBookings: 1,
      lastVisit: '2023-12-20'
    }
  ]

  const columns: ColumnsType<Guest> = [
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.phone}</Text>
          </div>
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Current Status',
      key: 'status',
      render: (_, record) => (
        record.currentBooking ? (
          <Tag color="green">Checked In - Room {record.currentBooking.room.roomNumber}</Tag>
        ) : (
          <Tag>Not Staying</Tag>
        )
      ),
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Total Bookings',
      dataIndex: 'totalBookings',
      key: 'totalBookings',
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: 'Last Visit',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      responsive: ['lg', 'xl'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedGuest(record)
            setShowGuestModal(true)
          }}
        >
          View
        </Button>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ]

  const filteredGuests = (guests || []).filter(guest => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        guest.name.toLowerCase().includes(search) ||
        guest.phone.includes(search) ||
        guest.email.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <>
      <Helmet>
        <title>Guests - Reception Dashboard</title>
      </Helmet>
      
      <ReceptionLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>Guest Directory</Title>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
              >
                Add New Guest
              </Button>
            </div>

            {/* Quick Stats */}
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic title="Total Guests" value={guests.length} valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic 
                    title="Currently Staying" 
                    value={guests.filter(g => g.currentBooking?.status === 'checked_in').length} 
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic 
                    title="Total Bookings" 
                    value={guests.reduce((sum, g) => sum + g.totalBookings, 0)} 
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic 
                    title="Repeat Guests" 
                    value={guests.filter(g => g.totalBookings > 1).length} 
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Search */}
            <Card>
              <Search
                placeholder="Search by name, phone, or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                enterButton={<SearchOutlined />}
              />
            </Card>

            {/* Guests Table */}
            <Card>
              <Table
                columns={columns}
                dataSource={ensureArray(filteredGuests)}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} guests`
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* Guest Detail Modal */}
            <Modal
              title={
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  {selectedGuest?.name}
                </Space>
              }
              open={showGuestModal}
              onCancel={() => {
                setShowGuestModal(false)
                setSelectedGuest(null)
              }}
              footer={[
                <Button key="close" onClick={() => {
                  setShowGuestModal(false)
                  setSelectedGuest(null)
                }}>
                  Close
                </Button>,
                selectedGuest?.currentBooking && (
                  <Button 
                    key="booking" 
                    type="primary"
                    icon={<CalendarOutlined />}
                    onClick={() => router.push(`/reception/bookings?id=${selectedGuest?.currentBooking?.bookingId}`)}
                  >
                    View Booking
                  </Button>
                ),
              ]}
              width={600}
            >
              {selectedGuest && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Contact Information">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                        {selectedGuest.phone}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><MailOutlined /> Email</>}>
                        {selectedGuest.email}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><HomeOutlined /> Address</>}>
                        {selectedGuest.address}
                      </Descriptions.Item>
                      <Descriptions.Item label="ID Proof">
                        {selectedGuest.idProofType}: {selectedGuest.idProofNumber}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {selectedGuest.currentBooking && (
                    <Card size="small" title="Current Booking">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Booking ID">
                          {selectedGuest.currentBooking.bookingId}
                        </Descriptions.Item>
                        <Descriptions.Item label="Room">
                          Room {selectedGuest.currentBooking.room.roomNumber}
                        </Descriptions.Item>
                        <Descriptions.Item label="Check-In">
                          {selectedGuest.currentBooking.checkInDate}
                        </Descriptions.Item>
                        <Descriptions.Item label="Check-Out">
                          {selectedGuest.currentBooking.checkOutDate}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                          <Tag color="green">{selectedGuest.currentBooking.status}</Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  )}

                  <Card size="small" title="Guest Statistics">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="Total Bookings" value={selectedGuest.totalBookings} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="Last Visit" value={selectedGuest.lastVisit} />
                      </Col>
                    </Row>
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
