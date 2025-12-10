import { Helmet } from 'react-helmet-async'
import AdminLayout from '@/components/layout/AdminLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { useState, useEffect } from 'react'
import { useRouter } from '@/shims/router'
import { useSearchParams } from 'react-router-dom'
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Modal, 
  Space, 
  Typography, 
  Drawer,
  Descriptions,
  Row,
  Col,
  DatePicker,
  Tag,
  List,
  Avatar,
  Rate
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  ArrowLeftOutlined, 
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  StarOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined
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
  createdAt: string
  currentBooking?: {
    id: number
    bookingId: string
    room: { roomNumber: string }
    checkInDate: string
    checkOutDate: string
    status: string
  } | null
  bookingHistory: Array<{
    id: number
    bookingId: string
    checkIn: string
    checkOut: string
    amount: number
  }>
  feedback: Array<{
    id: number
    rating: number
    date: string
    comments: string
  }>
}

export default function AdminGuests() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const urlId = searchParams.get('id')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
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
      createdAt: '2024-01-15',
      currentBooking: {
        id: 1,
        bookingId: 'BK12345678',
        room: { roomNumber: '101' },
        checkInDate: '2024-01-20',
        checkOutDate: '2024-01-22',
        status: 'checked_in'
      },
      bookingHistory: [
        { id: 1, bookingId: 'BK12345678', checkIn: '2024-01-20', checkOut: '2024-01-22', amount: 4000 },
        { id: 2, bookingId: 'BK11111111', checkIn: '2023-12-15', checkOut: '2023-12-18', amount: 6000 }
      ],
      feedback: [
        { id: 1, rating: 4, date: '2024-01-15', comments: 'Great stay!' },
        { id: 2, rating: 5, date: '2023-12-18', comments: 'Excellent service' }
      ]
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone: '+919876543210',
      email: 'jane@example.com',
      idProofType: 'Aadhar',
      idProofNumber: '1234-5678-9012',
      address: '456 Park Ave, Delhi',
      createdAt: '2024-01-16',
      currentBooking: null,
      bookingHistory: [
        { id: 3, bookingId: 'BK87654321', checkIn: '2024-01-16', checkOut: '2024-01-18', amount: 7000 }
      ],
      feedback: [
        { id: 3, rating: 3, date: '2024-01-16', comments: 'Room was okay' }
      ]
    }
  ]

  // Handle URL parameters
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const guest = guests.find(g => g.id === Number(id))
      if (guest) {
        setSelectedGuest(guest)
        setShowProfileDrawer(true)
      }
    }
  }, [searchParams])

  const columns: ColumnsType<Guest> = [
    {
      title: 'Guest Details',
      key: 'name',
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
        </div>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div><PhoneOutlined /> {record.phone}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}><MailOutlined /> {record.email}</Text>
        </div>
      ),
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'ID Proof',
      key: 'idProof',
      render: (_, record) => (
        <div>
          <div>{record.idProofType}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.idProofNumber}</Text>
        </div>
      ),
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      responsive: ['lg', 'xl'],
    },
    {
      title: 'Registered',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedGuest(record)
              setShowProfileDrawer(true)
            }}
          >
            View
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />}>Edit</Button>
          <Button 
            type="link" 
            size="small"
            onClick={() => router.push(`/admin/bookings?guestId=${record.id}`)}
          >
            History
          </Button>
        </Space>
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
        <title>Guests - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Guests', href: '/admin/guests' },
            ...(selectedGuest ? [{ label: selectedGuest.name, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>Guest Management</Title>
              <Space wrap>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push('/admin')}
                >
                  Back to Dashboard
                </Button>
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add Guest
                </Button>
              </Space>
            </div>

            {/* Search and Filters */}
            <Card>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Text strong>Search Guests</Text>
                  <Search
                    placeholder="Search by name, phone, or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginTop: '8px' }}
                    allowClear
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Text strong>ID Proof Type</Text>
                  <Select
                    defaultValue=""
                    style={{ width: '100%', marginTop: '8px' }}
                    options={[
                      { value: '', label: 'All Types' },
                      { value: 'passport', label: 'Passport' },
                      { value: 'aadhar', label: 'Aadhar' },
                      { value: 'license', label: 'Driving License' },
                    ]}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Text strong>Registration Date</Text>
                  <DatePicker style={{ width: '100%', marginTop: '8px' }} />
                </Col>
              </Row>
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

            {/* Guest Profile Drawer - Mobile Friendly */}
            <Drawer
              title={
                <div>
                  <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                  {selectedGuest?.name}
                </div>
              }
              placement="right"
              onClose={() => {
                setShowProfileDrawer(false)
                setSelectedGuest(null)
                router.push('/admin/guests')
              }}
              open={showProfileDrawer}
              width={600}
              extra={
                <Space>
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => {
                      // Handle edit
                    }}
                  >
                    Edit
                  </Button>
                </Space>
              }
            >
              {selectedGuest && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* Personal Information */}
                  <Card title="Personal Information" size="small">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                        {selectedGuest.phone}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><MailOutlined /> Email</>}>
                        {selectedGuest.email}
                      </Descriptions.Item>
                      <Descriptions.Item label="ID Proof Type">
                        {selectedGuest.idProofType}
                      </Descriptions.Item>
                      <Descriptions.Item label="ID Proof Number">
                        {selectedGuest.idProofNumber}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><HomeOutlined /> Address</>}>
                        {selectedGuest.address}
                      </Descriptions.Item>
                      <Descriptions.Item label="Registered">
                        {selectedGuest.createdAt}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* Current Booking */}
                  {selectedGuest.currentBooking && (
                    <Card 
                      title="Current Booking" 
                      size="small"
                      extra={
                        <Button 
                          type="link" 
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => router.push(`/admin/bookings?id=${selectedGuest.currentBooking?.id}`)}
                        >
                          View Details
                        </Button>
                      }
                    >
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

                  {/* Booking History */}
                  <Card title="Booking History" size="small">
                    <List
                      dataSource={ensureArray(selectedGuest?.bookingHistory)}
                      renderItem={(booking) => (
                        <List.Item
                          actions={[
                            <Button 
                              type="link" 
                              size="small"
                              onClick={() => router.push(`/admin/bookings?id=${booking.id}`)}
                            >
                              View <ArrowLeftOutlined rotate={180} />
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            title={booking.bookingId}
                            description={
                              <Space direction="vertical" size="small">
                                <Text type="secondary">
                                  <CalendarOutlined /> {booking.checkIn} to {booking.checkOut}
                                </Text>
                                <Text strong>
                                  <DollarOutlined /> ₹{booking.amount.toLocaleString()}
                                </Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>

                  {/* Feedback Given */}
                  <Card title="Feedback Given" size="small">
                    <List
                      dataSource={ensureArray(selectedGuest?.feedback)}
                      renderItem={(fb) => (
                        <List.Item
                          actions={[
                            <Button 
                              type="link" 
                              size="small"
                              onClick={() => router.push(`/admin/feedback?id=${fb.id}`)}
                            >
                              View <ArrowLeftOutlined rotate={180} />
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <Rate disabled defaultValue={fb.rating} />
                                <Text type="secondary">{fb.date}</Text>
                              </Space>
                            }
                            description={fb.comments}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>

                  {/* Action Buttons */}
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Button 
                      block
                      icon={<EditOutlined />}
                      onClick={() => {
                        // Handle edit
                      }}
                    >
                      Edit Guest Info
                    </Button>
                    {selectedGuest.currentBooking && (
                      <Button 
                        block
                        icon={<CalendarOutlined />}
                        onClick={() => router.push(`/admin/bookings?id=${selectedGuest.currentBooking?.id}`)}
                      >
                        View Current Booking
                      </Button>
                    )}
                    <Button 
                      block
                      icon={<FileTextOutlined />}
                      onClick={() => router.push(`/admin/bookings?guestId=${selectedGuest.id}`)}
                    >
                      View All Bookings
                    </Button>
                    <Button 
                      block
                      icon={<DollarOutlined />}
                      onClick={() => router.push(`/admin/bills?guestId=${selectedGuest.id}`)}
                    >
                      View Bills
                    </Button>
                    <Button 
                      block
                      icon={<StarOutlined />}
                      onClick={() => router.push(`/admin/feedback?guestId=${selectedGuest.id}`)}
                    >
                      View Feedback
                    </Button>
                    <Button 
                      block
                      onClick={() => router.push('/admin')}
                    >
                      Back to Dashboard
                    </Button>
                  </Space>
                </Space>
              )}
            </Drawer>

            {/* Add Guest Modal */}
            <Modal
              title="Add New Guest"
              open={showAddModal}
              onCancel={() => setShowAddModal(false)}
              footer={[
                <Button key="cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>,
                <Button key="submit" type="primary" onClick={() => setShowAddModal(false)}>
                  Add Guest
                </Button>,
              ]}
              width={600}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Input placeholder="Name" />
                <Input placeholder="Phone" prefix={<PhoneOutlined />} />
                <Input placeholder="Email" prefix={<MailOutlined />} />
                <Select
                  placeholder="ID Proof Type"
                  style={{ width: '100%' }}
                  options={[
                    { value: 'passport', label: 'Passport' },
                    { value: 'aadhar', label: 'Aadhar' },
                    { value: 'license', label: 'Driving License' },
                  ]}
                />
                <Input placeholder="ID Proof Number" />
                <Input.TextArea placeholder="Address" rows={3} />
              </Space>
            </Modal>
          </div>
        </Space>
      </AdminLayout>
    </>
  )
}
