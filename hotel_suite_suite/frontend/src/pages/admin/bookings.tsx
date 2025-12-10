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
  Tag, 
  Row, 
  Col,
  Descriptions,
  DatePicker
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  EyeOutlined,
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Search } = Input

interface Booking {
  id: number
  bookingId: string
  guest: { name: string; phone: string }
  room: { roomNumber: string; roomType: { name: string } }
  checkInDate: string
  checkOutDate: string
  status: string
  totalAmount: number
}

export default function AdminBookings() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const action = searchParams.get('action')
  const urlFilter = searchParams.get('filter')
  
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Mock data - replace with API call
  const bookings: Booking[] = [
    {
      id: 1,
      bookingId: 'BK12345678',
      guest: { name: 'John Doe', phone: '+911234567890' },
      room: { roomNumber: '101', roomType: { name: 'Standard' } },
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-17',
      status: 'confirmed',
      totalAmount: 4000
    },
    {
      id: 2,
      bookingId: 'BK87654321',
      guest: { name: 'Jane Smith', phone: '+919876543210' },
      room: { roomNumber: '205', roomType: { name: 'Deluxe' } },
      checkInDate: '2024-01-16',
      checkOutDate: '2024-01-18',
      status: 'checked_in',
      totalAmount: 7000
    }
  ]

  // Handle URL parameters
  useEffect(() => {
    const bookingId = searchParams.get('id')
    const actionParam = searchParams.get('action')
    const filterParam = searchParams.get('filter')
    
    if (bookingId) {
      const booking = bookings.find(b => b.id === Number(bookingId))
      if (booking) {
        setSelectedBooking(booking)
        setShowDetailModal(true)
      }
    }
    if (actionParam === 'create') {
      setShowAddForm(true)
    }
    if (filterParam === 'arrivals_today') {
      setFilter('arrivals_today')
    }
    if (filterParam === 'departures_today') {
      setFilter('departures_today')
    }
  }, [searchParams])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'blue'
      case 'checked_in': return 'green'
      case 'checked_out': return 'default'
      case 'cancelled': return 'red'
      default: return 'default'
    }
  }

  const columns: ColumnsType<Booking> = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record) => (
        <div>
          <div>{record.guest.name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.guest.phone}</Text>
        </div>
      ),
    },
    {
      title: 'Room',
      key: 'room',
      render: (_, record) => (
        <div>
          <div>Room {record.room.roomNumber}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.room.roomType.name}</Text>
        </div>
      ),
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => `${record.checkInDate} to ${record.checkOutDate}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBooking(record)
              setShowDetailModal(true)
            }}
          >
            View
          </Button>
          <Button type="link" style={{ color: '#52c41a' }}>Check-In</Button>
          <Button type="link" danger>Cancel</Button>
        </Space>
      ),
    },
  ]

  const filteredBookings = (bookings || []).filter(booking => {
    if (filter !== 'all' && booking.status !== filter) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        booking.bookingId.toLowerCase().includes(search) ||
        booking.guest.name.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <>
      <Helmet>
        <title>Bookings - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Bookings', href: '/admin/bookings' },
            ...(selectedBooking ? [{ label: selectedBooking.bookingId, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2}>Bookings Management</Title>
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
                onClick={() => setShowAddForm(true)}
              >
                New Booking
              </Button>
            </Space>
          </div>

          {/* Filters */}
          <Card>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Text strong>Status Filter</Text>
                <Select
                  value={filter}
                  onChange={setFilter}
                  style={{ width: '100%', marginTop: '8px' }}
                  options={[
                    { value: 'all', label: 'All Bookings' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'checked_in', label: 'Checked In' },
                    { value: 'checked_out', label: 'Checked Out' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              </Col>
              <Col xs={24} md={8}>
                <Text strong>Search</Text>
                <Search
                  placeholder="Search by guest name or booking ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Text strong>Date Range</Text>
                <DatePicker.RangePicker style={{ width: '100%', marginTop: '8px' }} />
              </Col>
            </Row>
          </Card>

          {/* Bookings Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={ensureArray(filteredBookings)}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>

          {/* Booking Detail Modal */}
          <Modal
            title={`Booking Details - ${selectedBooking?.bookingId}`}
            open={showDetailModal}
            onCancel={() => setShowDetailModal(false)}
            footer={[
              <Button key="close" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>,
              <Button 
                key="guest" 
                icon={<UserOutlined />}
                onClick={() => router.push(`/admin/guests?id=${selectedBooking?.id || 1}`)}
              >
                View Guest Profile
              </Button>,
              <Button 
                key="room" 
                icon={<HomeOutlined />}
                onClick={() => router.push(`/admin/rooms?id=${selectedBooking?.id || 1}`)}
              >
                View Room Details
              </Button>,
              <Button 
                key="bill" 
                icon={<FileTextOutlined />}
                onClick={() => router.push(`/admin/bills?bookingId=${selectedBooking?.id}`)}
              >
                View Bill
              </Button>,
              <Button 
                key="dashboard" 
                onClick={() => router.push('/admin')}
              >
                Back to Dashboard
              </Button>,
            ]}
            width={800}
          >
            {selectedBooking && (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Guest Name">{selectedBooking.guest.name}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedBooking.guest.phone}</Descriptions.Item>
                <Descriptions.Item label="Room">
                  Room {selectedBooking.room.roomNumber} - {selectedBooking.room.roomType.name}
                </Descriptions.Item>
                <Descriptions.Item label="Check-In Date">{selectedBooking.checkInDate}</Descriptions.Item>
                <Descriptions.Item label="Check-Out Date">{selectedBooking.checkOutDate}</Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  ₹{selectedBooking.totalAmount.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status.replace('_', ' ')}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            )}
          </Modal>

          {/* Add Booking Form Modal */}
          <Modal
            title="Create New Booking"
            open={showAddForm}
            onCancel={() => setShowAddForm(false)}
            footer={[
              <Button key="close" onClick={() => setShowAddForm(false)}>
                Close
              </Button>,
            ]}
            width={600}
          >
            <Text type="secondary">Add booking form will be implemented here</Text>
          </Modal>
        </Space>
      </AdminLayout>
    </>
  )
}
