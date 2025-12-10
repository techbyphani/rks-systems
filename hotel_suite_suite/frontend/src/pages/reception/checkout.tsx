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
  Tag, 
  Row, 
  Col,
  Statistic,
  Descriptions,
  Divider
} from 'antd'
import { 
  LogoutOutlined,
  PrinterOutlined,
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

interface PendingCheckout {
  id: number
  bookingId: string
  guest: { name: string; phone: string }
  room: { roomNumber: string; roomType: { name: string } }
  checkInDate: string
  checkOutDate: string
  actualCheckIn: string
  adults: number
  children: number
  roomCharges: number
  foodCharges: number
  otherCharges: number
  totalAmount: number
  paymentStatus: string
}

// Simple table row interface - flattened structure
interface TableRow {
  id: number
  bookingId: string
  guestName: string
  guestPhone: string
  roomNumber: string
  roomTypeName: string
  checkOutDate: string
  totalAmount: number
  paymentStatus: string
  originalData: PendingCheckout
}

export default function ReceptionCheckout() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [showBillModal, setShowBillModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<PendingCheckout | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0]

  // Handle query parameters
  useEffect(() => {
    const bookingId = searchParams.get('bookingId')
    const guestName = searchParams.get('guest')
    const filterParam = searchParams.get('filter')
    
    if (bookingId) {
      // Find booking by ID and auto-open checkout modal
      const booking = mockData.find(b => b.id === Number(bookingId))
      if (booking) {
        setSelectedBooking(booking)
        setShowBillModal(true)
      }
    } else if (guestName) {
      // Filter/search by guest name
      setSearchTerm(guestName)
    } else if (filterParam === 'today') {
      // Filter to show only today's checkouts
      // The filter will be applied in displayRows based on checkOutDate
    }
  }, [searchParams])

  // Mock data - simple array initialization
  const mockData: PendingCheckout[] = useMemo(() => [
    {
      id: 1,
      bookingId: 'BK12345678',
      guest: { name: 'John Doe', phone: '+911234567890' },
      room: { roomNumber: '101', roomType: { name: 'Standard' } },
      checkInDate: '2024-01-13',
      checkOutDate: today,
      actualCheckIn: '2024-01-13 14:30',
      adults: 2,
      children: 0,
      roomCharges: 4000,
      foodCharges: 500,
      otherCharges: 100,
      totalAmount: 4600,
      paymentStatus: 'pending'
    },
    {
      id: 2,
      bookingId: 'BK87654321',
      guest: { name: 'Jane Smith', phone: '+919876543210' },
      room: { roomNumber: '205', roomType: { name: 'Deluxe' } },
      checkInDate: '2024-01-12',
      checkOutDate: today,
      actualCheckIn: '2024-01-12 15:00',
      adults: 1,
      children: 1,
      roomCharges: 10500,
      foodCharges: 800,
      otherCharges: 200,
      totalAmount: 11500,
      paymentStatus: 'paid'
    }
  ], [today])

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
        checkOutDate: item.checkOutDate,
        totalAmount: item.totalAmount,
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
      filtered = filtered.filter(row => row.checkOutDate === today)
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

  const handleCheckOut = (row: TableRow) => {
    setSelectedBooking(row.originalData)
    setShowBillModal(true)
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
      description: `Check-out payment for ${selectedBooking.bookingId}`
    }

    // Add transaction to history
    setTransactions(prev => [newTransaction, ...prev])

    // Update booking payment status
    setSelectedBooking(prev => prev ? {
      ...prev,
      paymentStatus: 'paid'
    } : null)

    setShowPaymentModal(false)
    toast.success('Payment processed successfully! Check-out can now be completed.')
  }

  const handleProcessPayment = () => {
    if (selectedBooking) {
      setShowBillModal(false)
      setShowPaymentModal(true)
    }
  }

  const processCheckOut = () => {
    console.log('Processing checkout for:', selectedBooking?.bookingId)
    setShowBillModal(false)
    setSelectedBooking(null)
    toast.success('Check-out completed successfully!')
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
      title: 'Check-Out Date',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{date}</Text>
        </Space>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          <DollarOutlined /> ₹{amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <PaymentStatusBadge
          status={status === 'paid' ? 'success' : 'pending'}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button 
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={() => handleCheckOut(record)}
          block
        >
          Check-Out
        </Button>
      ),
    },
  ]

  const todayCount = displayRows.length
  const pendingPaymentCount = displayRows.filter(r => r.paymentStatus === 'pending').length
  const totalRevenue = displayRows.reduce((sum, row) => sum + row.totalAmount, 0)

  return (
    <>
      <Helmet>
        <title>Check-Out - Reception Dashboard</title>
      </Helmet>
      
      <ReceptionLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Guest Check-Out
                {searchParams.get('filter') === 'today' && (
                  <Tag color="orange" style={{ marginLeft: '12px' }}>Today Only</Tag>
                )}
              </Title>
              <Text type="secondary">Today: {new Date().toLocaleDateString()}</Text>
            </div>
            {searchParams.get('filter') === 'today' && (
              <Button 
                onClick={() => router.push('/reception/checkout')}
              >
                View All Check-outs
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title={searchParams.get('filter') === 'today' ? "Today's Check-outs" : "Pending Check-outs"} 
                  value={todayCount} 
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<LogoutOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Completed Today" 
                  value={5} 
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Pending Payments" 
                  value={pendingPaymentCount} 
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic 
                  title="Total Revenue" 
                  value={totalRevenue} 
                  prefix="₹"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Split View: List + Bill Summary */}
          <SplitView
            leftSpan={14}
            rightSpan={10}
            leftTitle={`Pending Check-outs (${displayRows.length})`}
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
            rightTitle="Bill Summary"
            left={
              <div>
                <Table<TableRow>
                  columns={columns}
                  dataSource={displayRows}
                  rowKey="id"
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} ${searchParams.get('filter') === 'today' ? "today's" : "pending"} check-outs`
                  }}
                  scroll={{ x: 'max-content', y: 500 }}
                  size="small"
                  onRow={(record) => ({
                    onClick: () => handleCheckOut(record),
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
                          <Descriptions.Item label="Check-Out">
                            {selectedBooking.checkOutDate}
                          </Descriptions.Item>
                          <Descriptions.Item label="Total Amount">
                            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                              ₹{selectedBooking.totalAmount.toLocaleString()}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Payment Status">
                            <PaymentStatusBadge
                              status={selectedBooking.paymentStatus === 'paid' ? 'success' : 'pending'}
                            />
                          </Descriptions.Item>
                        </Descriptions>
                        <Button 
                          type="primary" 
                          danger
                          block 
                          icon={<LogoutOutlined />}
                          onClick={() => setShowBillModal(true)}
                          disabled={selectedBooking.paymentStatus !== 'paid'}
                          style={{ marginTop: '12px' }}
                        >
                          Process Check-Out
                        </Button>
                        {selectedBooking.paymentStatus !== 'paid' && (
                          <Button 
                            type="primary"
                            block 
                            icon={<DollarOutlined />}
                            onClick={handleProcessPayment}
                            style={{ marginTop: '8px' }}
                          >
                            Process Payment
                          </Button>
                        )}
                      </Card>

                      <Card size="small" title="Bill Breakdown">
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Room Charges:</Text>
                            <Text>₹{selectedBooking.roomCharges.toLocaleString()}</Text>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Food Charges:</Text>
                            <Text>₹{selectedBooking.foodCharges.toLocaleString()}</Text>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">Other Charges:</Text>
                            <Text>₹{selectedBooking.otherCharges.toLocaleString()}</Text>
                          </div>
                          <Divider style={{ margin: '8px 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>Total:</Text>
                            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                              ₹{selectedBooking.totalAmount.toLocaleString()}
                            </Text>
                          </div>
                        </Space>
                      </Card>
                    </>
                  ) : (
                    <Card size="small">
                      <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                        Select a booking from the list to view bill details
                      </Text>
                    </Card>
                  )}

                  <Card size="small" title="Today's Summary">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Total Check-outs:</Text>
                        <Text strong>{todayCount}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Pending Payments:</Text>
                        <Text strong style={{ color: '#ff4d4f' }}>{pendingPaymentCount}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Total Revenue:</Text>
                        <Text strong style={{ color: '#1890ff' }}>₹{totalRevenue.toLocaleString()}</Text>
                      </div>
                    </Space>
                  </Card>
                </Space>
              </div>
            }
          />

          {/* Check-Out Bill Modal */}
          <Modal
            title={
              <Space>
                <LogoutOutlined />
                <span>Check-Out - {selectedBooking?.bookingId}</span>
              </Space>
            }
            open={showBillModal}
            onCancel={() => {
              setShowBillModal(false)
              setSelectedBooking(null)
            }}
            footer={[
              <Button key="cancel" onClick={() => {
                setShowBillModal(false)
                setSelectedBooking(null)
              }}>
                Cancel
              </Button>,
              <Button 
                key="print" 
                icon={<PrinterOutlined />}
                onClick={() => {
                  // Handle print
                  window.print()
                }}
              >
                Print Bill
              </Button>,
              <Button 
                key="checkout" 
                type="primary"
                danger
                icon={<LogoutOutlined />}
                onClick={processCheckOut}
                disabled={selectedBooking?.paymentStatus !== 'paid'}
              >
                Complete Check-Out
              </Button>,
            ]}
            width={700}
          >
            {selectedBooking && (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Card size="small" title="Guest & Booking Information">
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Guest Name">{selectedBooking.guest.name}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{selectedBooking.guest.phone}</Descriptions.Item>
                    <Descriptions.Item label="Room">
                      Room {selectedBooking.room.roomNumber} - {selectedBooking.room.roomType.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Check-In Date">{selectedBooking.checkInDate}</Descriptions.Item>
                    <Descriptions.Item label="Actual Check-In">{selectedBooking.actualCheckIn}</Descriptions.Item>
                    <Descriptions.Item label="Check-Out Date">{selectedBooking.checkOutDate}</Descriptions.Item>
                    <Descriptions.Item label="Guests">
                      {selectedBooking.adults} Adults, {selectedBooking.children} Children
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Bill Summary">
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Statistic title="Room Charges" value={selectedBooking.roomCharges} prefix="₹" />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Food Charges" value={selectedBooking.foodCharges} prefix="₹" />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic title="Other Charges" value={selectedBooking.otherCharges} prefix="₹" />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Statistic 
                        title="Total Amount" 
                        value={selectedBooking.totalAmount} 
                        prefix="₹" 
                        valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}
                      />
                    </Col>
                  </Row>
                </Card>

                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <PaymentStatusBadge
                      status={selectedBooking.paymentStatus === 'paid' ? 'success' : 'pending'}
                    />
                    {selectedBooking.paymentStatus !== 'paid' && (
                      <Button 
                        type="primary" 
                        block 
                        icon={<DollarOutlined />}
                        style={{ marginTop: '16px' }}
                        onClick={handleProcessPayment}
                      >
                        Process Payment
                      </Button>
                    )}
                  </Space>
                </Card>
              </Space>
            )}
          </Modal>

          {/* Payment Modal */}
          {selectedBooking && (
            <RazorpayPaymentModal
              open={showPaymentModal}
              amount={selectedBooking.totalAmount}
              description={`Check-out payment for ${selectedBooking.bookingId}`}
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
