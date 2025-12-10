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
  Modal, 
  Space, 
  Typography, 
  Row, 
  Col,
  Statistic,
  Descriptions,
  Form,
  Select,
  Tag,
  Badge,
  Divider
} from 'antd'
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  UserOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import SplitView from '@/components/layout/SplitView'
import StatusIndicator from '@/components/common/StatusIndicator'
import RazorpayPaymentModal from '@/components/payments/RazorpayPaymentModal'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge'
import { Transaction, PaymentMethod } from '@/types/payment'
import toast from 'react-hot-toast'

const { Title, Text } = Typography
const { Search } = Input

interface PendingCheckin {
  id: number
  bookingId: string
  guest: { 
    name: string
    phone: string
    email: string
    idProofType: string
    idProofNumber: string
  }
  room: { roomNumber: string; roomType: { name: string } }
  checkInDate: string
  checkOutDate: string
  adults: number
  children: number
  totalAmount: number
  expectedArrival: string
  paymentStatus?: 'paid' | 'pending' | 'partial'
}

// Simple table row interface - flattened structure
interface TableRow {
  id: number
  bookingId: string
  guestName: string
  guestPhone: string
  roomNumber: string
  roomTypeName: string
  checkInDate: string
  expectedArrival: string
  paymentStatus?: string
  originalData: PendingCheckin
}

export default function ReceptionCheckin() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<PendingCheckin | null>(null)
  const [form] = Form.useForm()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0]

  // Mock data - simple array initialization
  const mockData: PendingCheckin[] = useMemo(() => [
    {
      id: 1,
      bookingId: 'BK12345678',
      guest: { 
        name: 'John Doe', 
        phone: '+911234567890',
        email: 'john@example.com',
        idProofType: 'Passport',
        idProofNumber: 'A1234567'
      },
      room: { roomNumber: '101', roomType: { name: 'Standard' } },
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-17',
      adults: 2,
      children: 0,
      totalAmount: 4000,
      expectedArrival: '14:00',
      paymentStatus: 'paid'
    },
    {
      id: 2,
      bookingId: 'BK87654321',
      guest: { 
        name: 'Jane Smith', 
        phone: '+919876543210',
        email: 'jane@example.com',
        idProofType: 'Aadhar',
        idProofNumber: '1234-5678-9012'
      },
      room: { roomNumber: '205', roomType: { name: 'Deluxe' } },
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-18',
      adults: 1,
      children: 1,
      totalAmount: 10500,
      expectedArrival: '15:30',
      paymentStatus: 'pending'
    },
    {
      id: 3,
      bookingId: 'BK11111111',
      guest: { 
        name: 'Alice Brown', 
        phone: '+911111111111',
        email: 'alice@example.com',
        idProofType: 'Driving License',
        idProofNumber: 'DL123456'
      },
      room: { roomNumber: '301', roomType: { name: 'Suite' } },
      checkInDate: today,
      checkOutDate: '2024-01-20',
      adults: 2,
      children: 2,
      totalAmount: 15000,
      expectedArrival: '16:00',
      paymentStatus: 'pending'
    }
  ], [today])

  // Handle query parameters
  useEffect(() => {
    const bookingId = searchParams.get('bookingId')
    const guestName = searchParams.get('guest')
    const filterParam = searchParams.get('filter')
    
    if (bookingId) {
      // Find booking by ID and auto-open check-in modal
      const booking = mockData.find(b => b.id === Number(bookingId))
      if (booking) {
        setSelectedBooking(booking)
        setShowCheckinModal(true)
      }
    } else if (guestName) {
      // Filter/search by guest name
      setSearchTerm(guestName)
    } else if (filterParam === 'today') {
      // Filter to show only today's check-ins
      // The filter will be applied in displayRows based on checkInDate
    }
  }, [searchParams, mockData])

  // Transform to table rows - simple, direct transformation
  const tableRows: TableRow[] = useMemo(() => {
    const rows: TableRow[] = []
    for (const item of mockData) {
      rows.push({
        id: item.id,
        bookingId: item.bookingId,
        guestName: item.guest.name || '',
        guestPhone: item.guest.phone || '',
        roomNumber: item.room.roomNumber || '',
        roomTypeName: item.room.roomType.name || '',
        checkInDate: item.checkInDate,
        expectedArrival: item.expectedArrival,
        paymentStatus: item.paymentStatus,
        originalData: item
      })
    }
    return rows
  }, [mockData])

  // Filter rows - simple filter
  const displayRows: TableRow[] = useMemo(() => {
    let filtered = tableRows
    
    // Apply today filter if query parameter is set
    const filterParam = searchParams.get('filter')
    if (filterParam === 'today') {
      filtered = filtered.filter(row => row.checkInDate === today)
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(row => 
        row.bookingId.toLowerCase().includes(search) ||
        row.guestName.toLowerCase().includes(search) ||
        row.guestPhone.includes(search)
      )
    }
    
    return filtered
  }, [tableRows, searchTerm, searchParams, today])

  const handleCheckIn = (row: TableRow) => {
    setSelectedBooking(row.originalData)
    setShowCheckinModal(true)
  }

  const handlePaymentSuccess = (
    transactionId: string,
    paymentMethod: PaymentMethod,
    razorpayOrderId: string,
    razorpayPaymentId: string
  ) => {
    if (!selectedBooking) return

    // Create transaction record
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      transactionId,
      bookingId: selectedBooking.bookingId,
      amount: selectedBooking.totalAmount,
      paymentMethod,
      status: 'success',
      razorpayOrderId,
      razorpayPaymentId,
      createdAt: new Date().toISOString(),
      guestName: selectedBooking.guest.name,
      description: `Check-in payment for ${selectedBooking.bookingId}`
    }

    // Add transaction to history
    setTransactions(prev => [newTransaction, ...prev])

    // Update booking payment status
    setSelectedBooking(prev => prev ? {
      ...prev,
      paymentStatus: 'paid'
    } : null)

    setShowPaymentModal(false)
    toast.success('Payment processed successfully! You can now complete check-in.')
  }

  const handleProcessPayment = () => {
    if (selectedBooking) {
      setShowPaymentModal(true)
    }
  }

  const processCheckIn = async (values: any) => {
    console.log('Processing check-in for:', selectedBooking?.bookingId, values)
    setShowCheckinModal(false)
    setSelectedBooking(null)
    form.resetFields()
    toast.success('Check-in completed successfully!')
    // TODO: Show success notification and refresh data
  }

  const columns: ColumnsType<TableRow> = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      width: 120,
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.guestName}</Text>
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
          <Text strong>
            <HomeOutlined /> {record.roomNumber}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.roomTypeName}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Arrival',
      key: 'arrival',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>
            <CalendarOutlined /> {record.checkInDate}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <ClockCircleOutlined /> {record.expectedArrival}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          paid: { color: 'success', text: 'Paid' },
          pending: { color: 'warning', text: 'Pending' },
          partial: { color: 'info', text: 'Partial' }
        }
        const statusInfo = statusMap[status || 'pending']
        return (
          <PaymentStatusBadge
            status={statusInfo.color === 'success' ? 'success' : 'pending'}
            size="small"
          />
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button 
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => handleCheckIn(record)}
          block
        >
          Check-In
        </Button>
      ),
    },
  ]

  const todayCount = displayRows.length
  const pendingPaymentCount = displayRows.filter(r => r.paymentStatus === 'pending').length

  return (
    <>
      <Helmet>
        <title>Check-In - Reception Dashboard</title>
      </Helmet>
      
      <ReceptionLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Guest Check-In
                {searchParams.get('filter') === 'today' && (
                  <Tag color="blue" style={{ marginLeft: '12px' }}>Today Only</Tag>
                )}
              </Title>
              <Text type="secondary">Today: {new Date().toLocaleDateString()}</Text>
            </div>
            {searchParams.get('filter') === 'today' && (
              <Button 
                onClick={() => router.push('/reception/checkin')}
              >
                View All Check-ins
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title={searchParams.get('filter') === 'today' ? "Today's Check-ins" : "Pending Check-ins"} 
                  value={todayCount} 
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="Pending Payments" 
                  value={pendingPaymentCount} 
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic 
                  title="Completed Today" 
                  value={8} 
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Split View: List + Form */}
          <SplitView
            leftSpan={14}
            rightSpan={10}
            leftTitle={`Pending Check-ins (${displayRows.length})`}
            leftActions={
              <Search
                placeholder="Search by booking ID, guest name, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={setSearchTerm}
                allowClear
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
            }
            rightTitle="Quick Actions"
            left={
              <div>
                <Table<TableRow>
                  columns={columns}
                  dataSource={displayRows}
                  rowKey="id"
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} ${searchParams.get('filter') === 'today' ? "today's" : "pending"} check-ins`
                  }}
                  scroll={{ x: 'max-content', y: 500 }}
                  size="small"
                  onRow={(record) => ({
                    onClick: () => handleCheckIn(record),
                    style: { cursor: 'pointer' }
                  })}
                />
              </div>
            }
            right={
              <div>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {selectedBooking ? (
                    <>
                      <Card size="small" title="Selected Booking">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Guest">
                            <Text strong>{selectedBooking.guest.name}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Room">
                            Room {selectedBooking.room.roomNumber} - {selectedBooking.room.roomType.name}
                          </Descriptions.Item>
                          <Descriptions.Item label="Amount">
                            ₹{selectedBooking.totalAmount.toLocaleString()}
                          </Descriptions.Item>
                          <Descriptions.Item label="Payment">
                            <PaymentStatusBadge 
                              status={selectedBooking.paymentStatus === 'paid' ? 'success' : 'pending'}
                            />
                          </Descriptions.Item>
                        </Descriptions>
                        {selectedBooking.paymentStatus !== 'paid' && (
                          <Button 
                            type="primary" 
                            block 
                            icon={<DollarOutlined />}
                            onClick={handleProcessPayment}
                            style={{ marginTop: '12px' }}
                          >
                            Pay Now
                          </Button>
                        )}
                        <Button 
                          type="primary" 
                          block 
                          icon={<CheckCircleOutlined />}
                          onClick={() => setShowCheckinModal(true)}
                          disabled={selectedBooking.paymentStatus !== 'paid'}
                          style={{ marginTop: '8px' }}
                        >
                          Process Check-In
                        </Button>
                      </Card>
                    </>
                  ) : (
                    <Card size="small">
                      <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                        Select a booking from the list to view details
                      </Text>
                    </Card>
                  )}

                  <Card size="small" title="Quick Stats">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Total Pending:</Text>
                        <Text strong>{displayRows.length}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Payment Pending:</Text>
                        <Text strong style={{ color: '#fa8c16' }}>{pendingPaymentCount}</Text>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <Button 
                        type="dashed" 
                        block
                        onClick={() => router.push('/reception/bookings?action=new')}
                      >
                        Create New Booking
                      </Button>
                    </Space>
                  </Card>
                </Space>
              </div>
            }
          />

          {/* Check-In Modal */}
          <Modal
            title={
              <Space>
                <CheckCircleOutlined />
                <span>Check-In - {selectedBooking?.bookingId}</span>
              </Space>
            }
            open={showCheckinModal}
            onCancel={() => {
              setShowCheckinModal(false)
              setSelectedBooking(null)
              form.resetFields()
            }}
            footer={null}
            width={700}
          >
            {selectedBooking && (
              <Form
                form={form}
                layout="vertical"
                onFinish={processCheckIn}
              >
                <Card size="small" title="Guest Information" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Name">{selectedBooking.guest.name}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{selectedBooking.guest.phone}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedBooking.guest.email}</Descriptions.Item>
                    <Descriptions.Item label="ID Proof">
                      {selectedBooking.guest.idProofType}: {selectedBooking.guest.idProofNumber}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Booking Details" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Room">
                      Room {selectedBooking.room.roomNumber} - {selectedBooking.room.roomType.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Check-In Date">{selectedBooking.checkInDate}</Descriptions.Item>
                    <Descriptions.Item label="Check-Out Date">{selectedBooking.checkOutDate}</Descriptions.Item>
                    <Descriptions.Item label="Guests">
                      {selectedBooking.adults} Adults, {selectedBooking.children} Children
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Amount">
                      ₹{selectedBooking.totalAmount.toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Expected Arrival">
                      <ClockCircleOutlined /> {selectedBooking.expectedArrival}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Status">
                      <PaymentStatusBadge
                        status={selectedBooking.paymentStatus === 'paid' ? 'success' : 'pending'}
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {selectedBooking.paymentStatus !== 'paid' && (
                  <Card size="small" style={{ marginBottom: '16px', borderColor: '#fa8c16' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text type="warning" strong>
                        Payment Required
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Please process the payment before completing check-in.
                      </Text>
                      <Button 
                        type="primary"
                        block
                        icon={<DollarOutlined />}
                        onClick={() => {
                          setShowCheckinModal(false)
                          handleProcessPayment()
                        }}
                      >
                        Process Payment (₹{selectedBooking.totalAmount.toLocaleString()})
                      </Button>
                    </Space>
                  </Card>
                )}

                <Form.Item
                  name="roomKey"
                  label="Room Key Number"
                  rules={[{ required: true, message: 'Please enter room key number' }]}
                >
                  <Input placeholder="Enter room key number" />
                </Form.Item>

                <Form.Item
                  name="paymentMethod"
                  label="Payment Method"
                  rules={selectedBooking.paymentStatus !== 'paid' ? [{ required: true, message: 'Please select payment method' }] : []}
                >
                  <Select
                    placeholder="Select payment method"
                    disabled={selectedBooking.paymentStatus === 'paid'}
                    options={[
                      { value: 'cash', label: 'Cash' },
                      { value: 'card', label: 'Card' },
                      { value: 'upi', label: 'UPI' },
                    ]}
                  />
                </Form.Item>

                <Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={() => {
                      setShowCheckinModal(false)
                      setSelectedBooking(null)
                      form.resetFields()
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<CheckCircleOutlined />}
                      disabled={selectedBooking.paymentStatus !== 'paid'}
                    >
                      Complete Check-In
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Modal>

          {/* Payment Modal */}
          {selectedBooking && (
            <RazorpayPaymentModal
              open={showPaymentModal}
              amount={selectedBooking.totalAmount}
              description={`Check-in payment for ${selectedBooking.bookingId}`}
              bookingId={selectedBooking.bookingId}
              guestName={selectedBooking.guest.name}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setShowPaymentModal(false)
              }}
            />
          )}
        </Space>
      </ReceptionLayout>
    </>
  )
}
