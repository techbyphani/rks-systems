import { Helmet } from 'react-helmet-async'
import ReceptionLayout from '@/components/layout/ReceptionLayout'
import { useState, useMemo, useEffect } from 'react'
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
  Statistic,
  Steps,
  Form,
  DatePicker,
  InputNumber,
  Radio,
  Divider,
  Tabs,
  Descriptions,
  Alert
} from 'antd'
import { 
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  CalendarOutlined,
  TableOutlined,
  UserOutlined,
  HomeOutlined,
  DollarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import AdvancedSearch from '@/components/search/AdvancedSearch'
import StatusIndicator from '@/components/common/StatusIndicator'
import RazorpayPaymentModal from '@/components/payments/RazorpayPaymentModal'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge'
import { Transaction, PaymentMethod } from '@/types/payment'
import toast from 'react-hot-toast'

const { Title, Text } = Typography
const { Search } = Input
const { RangePicker } = DatePicker

interface Booking {
  id: number
  bookingId: string
  guest: { name: string; phone: string; email?: string; id?: number }
  room: { roomNumber: string; roomType: { name: string } }
  checkInDate: string
  checkOutDate: string
  status: string
  totalAmount: number
  adults: number
  children: number
}

// Simple table row interface - flattened structure
interface TableRow {
  id: number
  bookingId: string
  guestName: string
  guestPhone: string
  guestId?: number
  roomNumber: string
  roomTypeName: string
  checkInDate: string
  checkOutDate: string
  status: string
  totalAmount: number
  originalData: Booking
}

export default function ReceptionBookings() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const [showNewBookingModal, setShowNewBookingModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [bookingStep, setBookingStep] = useState(0)
  const [bookingForm] = Form.useForm()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [calculatedAmount, setCalculatedAmount] = useState(0)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Handle query parameters
  useEffect(() => {
    const action = searchParams.get('action')
    const bookingId = searchParams.get('bookingId')
    
    if (action === 'new') {
      setShowNewBookingModal(true)
      setBookingStep(0)
      setPaymentCompleted(false)
    }
    
    if (bookingId) {
      const booking = mockData.find(b => b.id === Number(bookingId))
      if (booking) {
        setSelectedBooking(booking)
        setShowBookingDetails(true)
      }
    }
  }, [searchParams])

  // Calculate booking amount when step 2 is completed
  useEffect(() => {
    if (bookingStep === 3) {
      const dates = bookingForm.getFieldValue('dates')
      const roomType = bookingForm.getFieldValue('roomType')
      const adults = bookingForm.getFieldValue('adults') || 1
      
      if (dates && roomType) {
        // Mock calculation - in real app, this would come from API
        const roomPrices: Record<string, number> = {
          standard: 2000,
          deluxe: 3500,
          suite: 5000
        }
        const basePrice = roomPrices[roomType] || 2000
        const nights = dates[1] ? dates[1].diff(dates[0], 'day') : 1
        const total = basePrice * nights
        const advanceAmount = Math.round(total * 0.3) // 30% advance
        setCalculatedAmount(advanceAmount)
        bookingForm.setFieldsValue({ advanceAmount })
      }
    }
  }, [bookingStep, bookingForm])

  // Mock data - simple array initialization
  const mockData: Booking[] = useMemo(() => [
    {
      id: 1,
      bookingId: 'BK12345678',
      guest: { name: 'John Doe', phone: '+911234567890', email: 'john@example.com', id: 1 },
      room: { roomNumber: '101', roomType: { name: 'Standard' } },
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-17',
      status: 'confirmed',
      totalAmount: 4000,
      adults: 2,
      children: 0
    },
    {
      id: 2,
      bookingId: 'BK87654321',
      guest: { name: 'Jane Smith', phone: '+919876543210', email: 'jane@example.com', id: 2 },
      room: { roomNumber: '205', roomType: { name: 'Deluxe' } },
      checkInDate: '2024-01-16',
      checkOutDate: '2024-01-18',
      status: 'checked_in',
      totalAmount: 7000,
      adults: 1,
      children: 1
    },
    {
      id: 3,
      bookingId: 'BK11111111',
      guest: { name: 'Alice Brown', phone: '+911111111111', email: 'alice@example.com', id: 3 },
      room: { roomNumber: '301', roomType: { name: 'Suite' } },
      checkInDate: '2024-01-20',
      checkOutDate: '2024-01-22',
      status: 'confirmed',
      totalAmount: 10000,
      adults: 2,
      children: 2
    }
  ], [])

  // Transform to table rows
  const tableRows: TableRow[] = useMemo(() => {
    const rows: TableRow[] = []
    for (const item of mockData) {
      rows.push({
        id: item.id,
        bookingId: item.bookingId,
        guestName: item.guest.name || '',
        guestPhone: item.guest.phone || '',
        guestId: item.guest.id,
        roomNumber: item.room.roomNumber || '',
        roomTypeName: item.room.roomType.name || '',
        checkInDate: item.checkInDate,
        checkOutDate: item.checkOutDate,
        status: item.status,
        totalAmount: item.totalAmount,
        originalData: item
      })
    }
    return rows
  }, [mockData])

  // Filter rows
  const displayRows: TableRow[] = useMemo(() => {
    let filtered = tableRows
    if (filter !== 'all') {
      filtered = filtered.filter(row => row.status === filter)
    }
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(row => 
        row.bookingId.toLowerCase().includes(search) ||
        row.guestName.toLowerCase().includes(search) ||
        row.guestPhone.includes(search)
      )
    }
    return filtered
  }, [tableRows, filter, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'blue'
      case 'checked_in': return 'green'
      case 'checked_out': return 'default'
      case 'cancelled': return 'red'
      default: return 'default'
    }
  }

  const handleBookingNext = async () => {
    try {
      const values = await bookingForm.validateFields()
      if (bookingStep < 3) {
        setBookingStep(bookingStep + 1)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleBookingPrev = () => {
    setBookingStep(bookingStep - 1)
  }

  const handlePaymentSuccess = (
    transactionId: string,
    paymentMethod: PaymentMethod,
    razorpayOrderId: string,
    razorpayPaymentId: string
  ) => {
    const guestName = bookingForm.getFieldValue('guestName')
    const bookingId = `BK${Date.now().toString().slice(-8)}`

    // Create transaction record
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      transactionId,
      bookingId,
      amount: calculatedAmount,
      paymentMethod,
      status: 'success',
      razorpayOrderId,
      razorpayPaymentId,
      createdAt: new Date().toISOString(),
      guestName: guestName || 'Guest',
      description: `Advance payment for booking ${bookingId}`
    }

    // Add transaction to history
    setTransactions(prev => [newTransaction, ...prev])
    setPaymentCompleted(true)
    setShowPaymentModal(false)
    toast.success('Payment processed successfully!')
  }

  const handleBookingSubmit = async () => {
    try {
      if (!paymentCompleted) {
        toast.error('Please complete the payment first')
        return
      }

      const values = await bookingForm.validateFields()
      console.log('Creating booking:', values)
      
      // Generate booking ID
      const bookingId = `BK${Date.now().toString().slice(-8)}`
      
      toast.success(`Booking ${bookingId} created successfully!`)
      setShowNewBookingModal(false)
      setBookingStep(0)
      setPaymentCompleted(false)
      bookingForm.resetFields()
      // TODO: Show success notification and refresh data
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleOpenPayment = () => {
    setShowPaymentModal(true)
  }

  const columns: ColumnsType<TableRow> = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 140,
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text 
            strong
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={(e) => {
              e.stopPropagation()
              if (record.guestId) {
                router.push(`/reception/guests?id=${record.guestId}`)
              }
            }}
          >
            {record.guestName}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <UserOutlined /> {record.guestPhone}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Room',
      key: 'room',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text 
            strong
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/reception/rooms?room=${record.roomNumber}`)
            }}
          >
            <HomeOutlined /> {record.roomNumber}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.roomTypeName}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>
            <CalendarOutlined /> {record.checkInDate}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            to {record.checkOutDate}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          <DollarOutlined /> ₹{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBooking(record.originalData)
              setShowBookingDetails(true)
            }}
          >
            View
          </Button>
          {record.status === 'confirmed' && (
            <Button 
              type="link" 
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => router.push(`/reception/checkin?bookingId=${record.id}`)}
            >
              Check-In
            </Button>
          )}
          {record.status === 'checked_in' && (
            <Button 
              type="link" 
              size="small"
              icon={<LogoutOutlined />}
              style={{ color: '#fa8c16' }}
              onClick={() => router.push(`/reception/checkout?bookingId=${record.id}`)}
            >
              Check-Out
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const bookingSteps = [
    { title: 'Guest Info', icon: <UserOutlined /> },
    { title: 'Room Selection', icon: <HomeOutlined /> },
    { title: 'Booking Details', icon: <CalendarOutlined /> },
    { title: 'Payment', icon: <DollarOutlined /> },
  ]

  const confirmedCount = displayRows.filter(r => r.status === 'confirmed').length
  const checkedInCount = displayRows.filter(r => r.status === 'checked_in').length
  const totalRevenue = displayRows.reduce((sum, r) => sum + r.totalAmount, 0)

  return (
    <>
      <Helmet>
        <title>Bookings - Reception Dashboard</title>
      </Helmet>
      
      <ReceptionLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>Manage Bookings</Title>
              <Text type="secondary">View and manage all hotel bookings</Text>
            </div>
            <Space>
              <Radio.Group 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="list">
                  <TableOutlined /> List
                </Radio.Button>
                <Radio.Button value="calendar">
                  <CalendarOutlined /> Calendar
                </Radio.Button>
              </Radio.Group>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setShowNewBookingModal(true)
                  setBookingStep(0)
                  setPaymentCompleted(false)
                }}
              >
                New Booking
              </Button>
            </Space>
          </div>

          {/* Quick Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Total Bookings" 
                  value={displayRows.length} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Confirmed" 
                  value={confirmedCount} 
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Checked In" 
                  value={checkedInCount} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Total Revenue" 
                  value={totalRevenue} 
                  prefix="₹"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters and Search */}
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
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
              <Col xs={24} md={12}>
                <Text strong>Search</Text>
                <Search
                  placeholder="Search by booking ID or guest name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onSearch={setSearchTerm}
                  style={{ marginTop: '8px' }}
                  allowClear
                  enterButton
                />
              </Col>
            </Row>
          </Card>

          {/* Content Area */}
          {viewMode === 'list' ? (
            <Card>
              <Table<TableRow>
                columns={columns}
                dataSource={displayRows}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} bookings`
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Text type="secondary">
                  Calendar view coming soon. For now, please use the list view.
                </Text>
              </div>
            </Card>
          )}

          {/* New Booking Modal - Multi-Step Wizard */}
          <Modal
            title={
              <Space>
                <PlusOutlined />
                <span>Create New Booking</span>
              </Space>
            }
            open={showNewBookingModal}
            onCancel={() => {
              setShowNewBookingModal(false)
              setBookingStep(0)
              setPaymentCompleted(false)
              bookingForm.resetFields()
            }}
            footer={null}
            width={700}
          >
            <Steps current={bookingStep} items={bookingSteps} style={{ marginBottom: '24px' }} />
            
            <Form
              form={bookingForm}
              layout="vertical"
            >
              {bookingStep === 0 && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Guest Information">
                    <Form.Item
                      name="guestType"
                      label="Guest Type"
                      rules={[{ required: true, message: 'Please select guest type' }]}
                      initialValue="new"
                    >
                      <Radio.Group>
                        <Radio value="new">New Guest</Radio>
                        <Radio value="existing">Existing Guest</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item
                      name="guestName"
                      label="Full Name"
                      rules={[{ required: true, message: 'Please enter guest name' }]}
                    >
                      <Input placeholder="Enter guest full name" />
                    </Form.Item>
                    <Form.Item
                      name="guestPhone"
                      label="Phone Number"
                      rules={[{ required: true, message: 'Please enter phone number' }]}
                    >
                      <Input placeholder="Enter phone number" />
                    </Form.Item>
                    <Form.Item
                      name="guestEmail"
                      label="Email"
                    >
                      <Input type="email" placeholder="Enter email address" />
                    </Form.Item>
                  </Card>
                </Space>
              )}

              {bookingStep === 1 && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Room Selection">
                    <Form.Item
                      name="roomType"
                      label="Room Type"
                      rules={[{ required: true, message: 'Please select room type' }]}
                    >
                      <Select placeholder="Select room type">
                        <Select.Option value="standard">Standard</Select.Option>
                        <Select.Option value="deluxe">Deluxe</Select.Option>
                        <Select.Option value="suite">Suite</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="roomNumber"
                      label="Room Number"
                      rules={[{ required: true, message: 'Please select room number' }]}
                    >
                      <Select placeholder="Select room number">
                        <Select.Option value="101">101</Select.Option>
                        <Select.Option value="102">102</Select.Option>
                        <Select.Option value="205">205</Select.Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Space>
              )}

              {bookingStep === 2 && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Booking Details">
                    <Form.Item
                      name="dates"
                      label="Check-in & Check-out Dates"
                      rules={[{ required: true, message: 'Please select dates' }]}
                    >
                      <RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="adults"
                      label="Number of Adults"
                      rules={[{ required: true, message: 'Please enter number of adults' }]}
                      initialValue={1}
                    >
                      <InputNumber min={1} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="children"
                      label="Number of Children"
                      initialValue={0}
                    >
                      <InputNumber min={0} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="specialRequests"
                      label="Special Requests"
                    >
                      <Input.TextArea rows={3} placeholder="Any special requests or notes" />
                    </Form.Item>
                  </Card>
                </Space>
              )}

              {bookingStep === 3 && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Payment & Confirmation">
                    <Alert
                      message="Advance Payment Required"
                      description={`Please pay ₹${calculatedAmount.toLocaleString()} (30% advance) to confirm the booking.`}
                      type="info"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                    <Form.Item
                      name="advanceAmount"
                      label="Advance Amount"
                      initialValue={calculatedAmount}
                    >
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }} 
                        prefix="₹"
                        disabled
                        value={calculatedAmount}
                      />
                    </Form.Item>
                    {paymentCompleted ? (
                      <Alert
                        message="Payment Completed"
                        description="Payment has been processed successfully. You can now complete the booking."
                        type="success"
                        showIcon
                        style={{ marginTop: '16px' }}
                      />
                    ) : (
                      <Button
                        type="primary"
                        block
                        icon={<DollarOutlined />}
                        onClick={handleOpenPayment}
                        size="large"
                        style={{ marginTop: '16px' }}
                      >
                        Pay Advance (₹{calculatedAmount.toLocaleString()})
                      </Button>
                    )}
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: '16px' }}>Total Amount:</Text>
                      <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>
                        ₹{Math.round(calculatedAmount / 0.3).toLocaleString()}
                      </Text>
                    </div>
                  </Card>
                </Space>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <Button 
                  onClick={bookingStep === 0 ? () => {
                    setShowNewBookingModal(false)
                    setBookingStep(0)
                    setPaymentCompleted(false)
                    bookingForm.resetFields()
                  } : handleBookingPrev}
                >
                  {bookingStep === 0 ? 'Cancel' : 'Previous'}
                </Button>
                <Button 
                  type="primary"
                  onClick={bookingStep === 3 ? handleBookingSubmit : handleBookingNext}
                  disabled={bookingStep === 3 && !paymentCompleted}
                >
                  {bookingStep === 3 ? 'Create Booking' : 'Next'}
                </Button>
              </div>
            </Form>
          </Modal>

          {/* Payment Modal for Booking */}
          <RazorpayPaymentModal
            open={showPaymentModal}
            amount={calculatedAmount}
            description="Advance payment for new booking"
            guestName={bookingForm.getFieldValue('guestName')}
            onSuccess={handlePaymentSuccess}
            onCancel={() => {
              setShowPaymentModal(false)
            }}
          />

          {/* Booking Details Modal */}
          <Modal
            title={
              <Space>
                <EyeOutlined />
                <span>Booking Details - {selectedBooking?.bookingId}</span>
              </Space>
            }
            open={showBookingDetails}
            onCancel={() => {
              setShowBookingDetails(false)
              setSelectedBooking(null)
            }}
            footer={[
              <Button key="close" onClick={() => {
                setShowBookingDetails(false)
                setSelectedBooking(null)
              }}>
                Close
              </Button>,
              ...(selectedBooking?.status === 'confirmed' ? [
                <Button 
                  key="checkin"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setShowBookingDetails(false)
                    router.push(`/reception/checkin?bookingId=${selectedBooking.id}`)
                  }}
                >
                  Check-In
                </Button>
              ] : []),
              ...(selectedBooking?.status === 'checked_in' ? [
                <Button 
                  key="checkout"
                  type="primary"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    setShowBookingDetails(false)
                    router.push(`/reception/checkout?bookingId=${selectedBooking.id}`)
                  }}
                >
                  Check-Out
                </Button>
              ] : [])
            ]}
            width={600}
          >
            {selectedBooking && (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Card size="small" title="Guest Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Name">{selectedBooking.guest.name}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{selectedBooking.guest.phone}</Descriptions.Item>
                    {selectedBooking.guest.email && (
                      <Descriptions.Item label="Email">{selectedBooking.guest.email}</Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>

                <Card size="small" title="Booking Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Room">
                      Room {selectedBooking.room.roomNumber} - {selectedBooking.room.roomType.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Check-In Date">{selectedBooking.checkInDate}</Descriptions.Item>
                    <Descriptions.Item label="Check-Out Date">{selectedBooking.checkOutDate}</Descriptions.Item>
                    <Descriptions.Item label="Guests">
                      {selectedBooking.adults} Adults, {selectedBooking.children} Children
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <StatusIndicator 
                        status={selectedBooking.status === 'confirmed' ? 'info' : 
                               selectedBooking.status === 'checked_in' ? 'success' : 'default'}
                        text={selectedBooking.status.replace('_', ' ').toUpperCase()}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Amount">
                      ₹{selectedBooking.totalAmount.toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Space>
            )}
          </Modal>
        </Space>
      </ReceptionLayout>
    </>
  )
}
