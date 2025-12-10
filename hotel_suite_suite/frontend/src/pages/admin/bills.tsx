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
  Statistic,
  Divider,
  Tabs
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  ArrowLeftOutlined, 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  PrinterOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import TransactionHistory from '@/components/payments/TransactionHistory'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge'
import { Transaction, PaymentMethod } from '@/types/payment'

const { Title, Text } = Typography
const { Search } = Input

interface Bill {
  id: number
  billNumber: string
  guest: { id: number; name: string; phone: string }
  roomBooking: { id: number; bookingId: string; room: { id: number; roomNumber: string } }
  roomCharges: number
  foodCharges: number
  otherCharges: number
  discount: number
  taxAmount: number
  totalAmount: number
  paymentStatus: string
  paymentMethod: string | null
  createdAt: string
  billItems: Array<{
    itemType: string
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export default function AdminBills() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const urlStatus = searchParams.get('status')
  const urlBookingId = searchParams.get('bookingId')
  
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      transactionId: 'pay_A1B2C3D4E5F6G7',
      billId: 1,
      bookingId: 'BK12345678',
      amount: 5060,
      paymentMethod: 'card',
      status: 'success',
      razorpayOrderId: 'order_ABCD1234EFGH',
      razorpayPaymentId: 'pay_A1B2C3D4E5F6G7',
      createdAt: '2024-01-15T10:30:00Z',
      guestName: 'John Doe',
      description: 'Payment for BILL001'
    },
    {
      id: '2',
      transactionId: 'pay_H8I9J0K1L2M3N4',
      billId: 2,
      bookingId: 'BK87654321',
      amount: 8250,
      paymentMethod: 'upi',
      status: 'success',
      razorpayOrderId: 'order_IJKL5678MNOP',
      razorpayPaymentId: 'pay_H8I9J0K1L2M3N4',
      createdAt: '2024-01-16T14:20:00Z',
      guestName: 'Jane Smith',
      description: 'Payment for BILL002'
    }
  ])

  // Mock data - replace with API call
  const bills: Bill[] = [
    {
      id: 1,
      billNumber: 'BILL001',
      guest: { id: 1, name: 'John Doe', phone: '+911234567890' },
      roomBooking: { id: 1, bookingId: 'BK12345678', room: { id: 1, roomNumber: '101' } },
      roomCharges: 4000,
      foodCharges: 500,
      otherCharges: 100,
      discount: 0,
      taxAmount: 460,
      totalAmount: 5060,
      paymentStatus: 'paid',
      paymentMethod: 'Card',
      createdAt: '2024-01-15',
      billItems: [
        { itemType: 'room', description: 'Room charges (2 nights)', quantity: 2, unitPrice: 2000, totalPrice: 4000 },
        { itemType: 'food', description: 'Restaurant - Dinner', quantity: 1, unitPrice: 500, totalPrice: 500 },
        { itemType: 'other', description: 'Laundry service', quantity: 1, unitPrice: 100, totalPrice: 100 }
      ]
    },
    {
      id: 2,
      billNumber: 'BILL002',
      guest: { id: 2, name: 'Jane Smith', phone: '+919876543210' },
      roomBooking: { id: 2, bookingId: 'BK87654321', room: { id: 2, roomNumber: '205' } },
      roomCharges: 7000,
      foodCharges: 800,
      otherCharges: 200,
      discount: 500,
      taxAmount: 750,
      totalAmount: 8250,
      paymentStatus: 'pending',
      paymentMethod: null,
      createdAt: '2024-01-16',
      billItems: [
        { itemType: 'room', description: 'Room charges (2 nights)', quantity: 2, unitPrice: 3500, totalPrice: 7000 },
        { itemType: 'food', description: 'Restaurant - Breakfast & Lunch', quantity: 2, unitPrice: 400, totalPrice: 800 },
        { itemType: 'other', description: 'Spa service', quantity: 1, unitPrice: 200, totalPrice: 200 }
      ]
    }
  ]

  // Handle URL parameters
  useEffect(() => {
    const status = searchParams.get('status')
    const bookingId = searchParams.get('bookingId')
    
    if (status) {
      setFilter(status)
    }
    if (bookingId) {
      const bill = bills.find(b => b.roomBooking.id === Number(bookingId))
      if (bill) {
        setSelectedBill(bill)
        setShowDetailModal(true)
      }
    }
  }, [searchParams])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'partial': return 'processing'
      default: return 'default'
    }
  }

  const columns: ColumnsType<Bill> = [
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
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
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Booking',
      key: 'booking',
      render: (_, record) => (
        <div>
          <div>{record.roomBooking.bookingId}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>Room {record.roomBooking.room.roomNumber}</Text>
        </div>
      ),
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string, record) => (
        <PaymentStatusBadge
          status={status === 'paid' ? 'success' : status === 'partial' ? 'pending' : 'pending'}
          paymentMethod={record.paymentMethod as PaymentMethod | undefined}
        />
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedBill(record)
            setShowDetailModal(true)
          }}
        >
          View
        </Button>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ]

  const filteredBills = (bills || []).filter(bill => {
    if (filter !== 'all' && bill.paymentStatus !== filter) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        bill.billNumber.toLowerCase().includes(search) ||
        bill.guest.name.toLowerCase().includes(search) ||
        bill.roomBooking.bookingId.toLowerCase().includes(search)
      )
    }
    return true
  })

  const billTransactions = selectedBill 
    ? transactions.filter(t => t.billId === selectedBill.id)
    : []

  return (
    <>
      <Helmet>
        <title>Bills - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Bills', href: '/admin/bills' },
            ...(selectedBill ? [{ label: selectedBill.billNumber, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>Bills & Payments</Title>
              <Space wrap>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push('/admin')}
                >
                  Back to Dashboard
                </Button>
              </Space>
            </div>

            {/* Filters */}
            <Card>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Text strong>Payment Status</Text>
                  <Select
                    value={filter}
                    onChange={setFilter}
                    style={{ width: '100%', marginTop: '8px' }}
                    options={[
                      { value: 'all', label: 'All Bills' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'partial', label: 'Partial' },
                    ]}
                  />
                </Col>
                <Col xs={24} md={16}>
                  <Text strong>Search</Text>
                  <Search
                    placeholder="Search by bill number, guest name, or booking ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginTop: '8px' }}
                    allowClear
                  />
                </Col>
              </Row>
            </Card>

            {/* Bills Table */}
            <Card>
              <Table
                columns={columns}
                dataSource={ensureArray(filteredBills)}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} bills`
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* Bill Detail Modal */}
            <Modal
              title={`Bill Details - ${selectedBill?.billNumber}`}
              open={showDetailModal}
              onCancel={() => setShowDetailModal(false)}
              footer={[
                <Button key="close" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>,
                <Button 
                  key="guest" 
                  icon={<UserOutlined />}
                  onClick={() => router.push(`/admin/guests?id=${selectedBill?.guest.id}`)}
                >
                  View Guest
                </Button>,
                <Button 
                  key="booking" 
                  icon={<CalendarOutlined />}
                  onClick={() => router.push(`/admin/bookings?id=${selectedBill?.roomBooking.id}`)}
                >
                  View Booking
                </Button>,
                <Button 
                  key="print" 
                  icon={<PrinterOutlined />}
                  type="primary"
                >
                  Print Bill
                </Button>,
              ]}
              width={800}
            >
              {selectedBill && (
                <Tabs
                  defaultActiveKey="details"
                  items={[
                    {
                      key: 'details',
                      label: 'Bill Details',
                      children: (
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                          {/* Guest & Booking Info */}
                          <Card size="small" title="Guest & Booking Information">
                            <Descriptions column={1} bordered size="small">
                              <Descriptions.Item label="Guest Name">{selectedBill.guest.name}</Descriptions.Item>
                              <Descriptions.Item label="Phone">{selectedBill.guest.phone}</Descriptions.Item>
                              <Descriptions.Item label="Booking ID">{selectedBill.roomBooking.bookingId}</Descriptions.Item>
                              <Descriptions.Item label="Room">Room {selectedBill.roomBooking.room.roomNumber}</Descriptions.Item>
                            </Descriptions>
                          </Card>

                          {/* Bill Items */}
                          <Card size="small" title="Itemized Charges">
                            <Table
                              dataSource={ensureArray(selectedBill?.billItems)}
                              columns={[
                                { title: 'Description', dataIndex: 'description', key: 'description' },
                                { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 80 },
                                { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: (price) => `₹${price}` },
                                { title: 'Total', dataIndex: 'totalPrice', key: 'totalPrice', render: (price) => `₹${price}` },
                              ]}
                              pagination={false}
                              size="small"
                            />
                          </Card>

                          {/* Summary */}
                          <Card size="small" title="Bill Summary">
                            <Row gutter={16}>
                              <Col xs={24} sm={12}>
                                <Statistic title="Room Charges" value={selectedBill.roomCharges} prefix="₹" />
                              </Col>
                              <Col xs={24} sm={12}>
                                <Statistic title="Food Charges" value={selectedBill.foodCharges} prefix="₹" />
                              </Col>
                              <Col xs={24} sm={12}>
                                <Statistic title="Other Charges" value={selectedBill.otherCharges} prefix="₹" />
                              </Col>
                              <Col xs={24} sm={12}>
                                <Statistic title="Discount" value={selectedBill.discount} prefix="₹" valueStyle={{ color: '#cf1322' }} />
                              </Col>
                              <Col xs={24} sm={12}>
                                <Statistic title="Tax" value={selectedBill.taxAmount} prefix="₹" />
                              </Col>
                              <Col xs={24} sm={12}>
                                <Statistic 
                                  title="Total Amount" 
                                  value={selectedBill.totalAmount} 
                                  prefix="₹" 
                                  valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}
                                />
                              </Col>
                            </Row>
                          </Card>

                          {/* Payment Status */}
                          <Card size="small" title="Payment Information">
                            <Descriptions column={1} bordered size="small">
                              <Descriptions.Item label="Payment Status">
                                <PaymentStatusBadge
                                  status={selectedBill.paymentStatus === 'paid' ? 'success' : 'pending'}
                                  paymentMethod={selectedBill.paymentMethod as PaymentMethod | undefined}
                                />
                              </Descriptions.Item>
                              <Descriptions.Item label="Payment Method">
                                {selectedBill.paymentMethod || 'Not Paid'}
                              </Descriptions.Item>
                              <Descriptions.Item label="Created Date">
                                {selectedBill.createdAt}
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Space>
                      )
                    },
                    {
                      key: 'transactions',
                      label: `Transactions (${billTransactions.length})`,
                      children: (
                        <TransactionHistory
                          transactions={billTransactions}
                          showFilters={false}
                        />
                      )
                    }
                  ]}
                />
              )}
            </Modal>
          </div>
        </Space>
      </AdminLayout>
    </>
  )
}
