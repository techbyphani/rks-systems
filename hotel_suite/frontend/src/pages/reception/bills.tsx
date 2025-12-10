import { Helmet } from 'react-helmet-async'
import ReceptionLayout from '@/components/layout/ReceptionLayout'
import { useState, useEffect } from 'react'
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
  Divider,
  Tabs
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  PlusOutlined,
  EyeOutlined,
  DollarOutlined,
  PrinterOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import RazorpayPaymentModal from '@/components/payments/RazorpayPaymentModal'
import TransactionHistory from '@/components/payments/TransactionHistory'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge'
import { Transaction, PaymentMethod } from '@/types/payment'
import { generateTransactionId, generateOrderId, generatePaymentId } from '@/utils/paymentUtils'
import toast from 'react-hot-toast'

const { Title, Text } = Typography
const { Search } = Input

interface Bill {
  id: number
  billNumber: string
  guest: { name: string; phone: string }
  roomBooking: { 
    bookingId: string
    room: { roomNumber: string }
    checkInDate: string
    checkOutDate: string
  }
  roomCharges: number
  foodCharges: number
  otherCharges: number
  discount: number
  taxAmount: number
  totalAmount: number
  paymentStatus: string
  paymentMethod: string | null
  createdAt: string
}

export default function ReceptionBills() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [showBillModal, setShowBillModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bills, setBills] = useState<Bill[]>([
    {
      id: 1,
      billNumber: 'BILL001',
      guest: { name: 'John Doe', phone: '+911234567890' },
      roomBooking: { 
        bookingId: 'BK12345678', 
        room: { roomNumber: '101' },
        checkInDate: '2024-01-13',
        checkOutDate: '2024-01-15'
      },
      roomCharges: 4000,
      foodCharges: 500,
      otherCharges: 100,
      discount: 0,
      taxAmount: 460,
      totalAmount: 5060,
      paymentStatus: 'pending',
      paymentMethod: null,
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      billNumber: 'BILL002',
      guest: { name: 'Jane Smith', phone: '+919876543210' },
      roomBooking: { 
        bookingId: 'BK87654321', 
        room: { roomNumber: '205' },
        checkInDate: '2024-01-12',
        checkOutDate: '2024-01-15'
      },
      roomCharges: 10500,
      foodCharges: 800,
      otherCharges: 200,
      discount: 500,
      taxAmount: 1100,
      totalAmount: 12100,
      paymentStatus: 'paid',
      paymentMethod: 'Credit Card',
      createdAt: '2024-01-15'
    }
  ])

  // Handle query parameters
  useEffect(() => {
    const billId = searchParams.get('billId')
    const bookingId = searchParams.get('bookingId')
    
    if (billId) {
      const bill = bills.find(b => b.id === Number(billId))
      if (bill) {
        setSelectedBill(bill)
        setShowBillModal(true)
      }
    }
    
    if (bookingId) {
      const bill = bills.find(b => b.roomBooking.bookingId === bookingId)
      if (bill) {
        setSelectedBill(bill)
        setShowBillModal(true)
      }
    }
  }, [searchParams, bills])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'partial': return 'processing'
      default: return 'default'
    }
  }

  const handlePaymentSuccess = (
    transactionId: string,
    paymentMethod: PaymentMethod,
    razorpayOrderId: string,
    razorpayPaymentId: string
  ) => {
    if (!selectedBill) return

    // Create transaction record
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      transactionId,
      billId: selectedBill.id,
      bookingId: selectedBill.roomBooking.bookingId,
      amount: selectedBill.totalAmount,
      paymentMethod,
      status: 'success',
      razorpayOrderId,
      razorpayPaymentId,
      createdAt: new Date().toISOString(),
      guestName: selectedBill.guest.name,
      description: `Payment for ${selectedBill.billNumber}`
    }

    // Add transaction to history
    setTransactions(prev => [newTransaction, ...prev])

    // Update bill status
    setBills(prev => prev.map(bill => 
      bill.id === selectedBill.id 
        ? { ...bill, paymentStatus: 'paid', paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) }
        : bill
    ))

    // Update selected bill
    setSelectedBill(prev => prev ? {
      ...prev,
      paymentStatus: 'paid',
      paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
    } : null)

    setShowPaymentModal(false)
    toast.success('Payment processed successfully!')
  }

  const handleCollectPayment = (bill: Bill) => {
    setSelectedBill(bill)
    setShowPaymentModal(true)
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
        <Space size="small" wrap>
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBill(record)
              setShowBillModal(true)
            }}
          >
            View
          </Button>
          {record.paymentStatus === 'pending' && (
            <Button 
              type="link" 
              size="small"
              style={{ color: '#52c41a' }}
              icon={<DollarOutlined />}
              onClick={() => handleCollectPayment(record)}
            >
              Collect
            </Button>
          )}
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ]

  const filteredBills = (bills || []).filter(bill => {
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

  const pendingAmount = bills.filter(b => b.paymentStatus === 'pending').reduce((sum, b) => sum + b.totalAmount, 0)
  const paidAmount = bills.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0)
  const billTransactions = selectedBill 
    ? transactions.filter(t => t.billId === selectedBill.id)
    : []

  return (
    <>
      <Helmet>
        <title>Bills - Reception Dashboard</title>
      </Helmet>
      
      <ReceptionLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>Bills & Payments</Title>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
              >
                Generate Bill
              </Button>
            </div>

            {/* Summary Cards */}
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic title="Today's Bills" value={bills.length} valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic 
                    title="Pending Payments" 
                    value={pendingAmount} 
                    prefix="₹"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic 
                    title="Paid Today" 
                    value={paidAmount} 
                    prefix="₹"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic 
                    title="Total Revenue" 
                    value={bills.reduce((sum, b) => sum + b.totalAmount, 0)} 
                    prefix="₹"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Search */}
            <Card>
              <Search
                placeholder="Search by bill number, guest name, or booking ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                enterButton={<SearchOutlined />}
              />
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
              open={showBillModal}
              onCancel={() => {
                setShowBillModal(false)
                setSelectedBill(null)
              }}
              footer={[
                <Button
                  key="close"
                  onClick={() => {
                    setShowBillModal(false)
                    setSelectedBill(null)
                  }}
                >
                  Close
                </Button>,
                <Button
                  key="print"
                  icon={<PrinterOutlined />}
                  onClick={() => {
                    // Handle print
                  }}
                >
                  Print Bill
                </Button>,
                selectedBill?.paymentStatus === 'pending' ? (
                  <Button
                    key="collect"
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={() => {
                      setShowBillModal(false)
                      handleCollectPayment(selectedBill)
                    }}
                  >
                    Collect Payment
                  </Button>
                ) : null,
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
                          <Card size="small" title="Guest & Booking Information">
                            <Descriptions column={1} bordered size="small">
                              <Descriptions.Item label="Guest Name">{selectedBill.guest.name}</Descriptions.Item>
                              <Descriptions.Item label="Phone">{selectedBill.guest.phone}</Descriptions.Item>
                              <Descriptions.Item label="Booking ID">{selectedBill.roomBooking.bookingId}</Descriptions.Item>
                              <Descriptions.Item label="Room">Room {selectedBill.roomBooking.room.roomNumber}</Descriptions.Item>
                              <Descriptions.Item label="Check-In">{selectedBill.roomBooking.checkInDate}</Descriptions.Item>
                              <Descriptions.Item label="Check-Out">{selectedBill.roomBooking.checkOutDate}</Descriptions.Item>
                            </Descriptions>
                          </Card>

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

            {/* Payment Modal */}
            {selectedBill && (
              <RazorpayPaymentModal
                open={showPaymentModal}
                amount={selectedBill.totalAmount}
                description={`Payment for ${selectedBill.billNumber}`}
                billId={selectedBill.id}
                bookingId={selectedBill.roomBooking.bookingId}
                guestName={selectedBill.guest.name}
                onSuccess={handlePaymentSuccess}
                onCancel={() => {
                  setShowPaymentModal(false)
                }}
              />
            )}
          </div>
        </Space>
      </ReceptionLayout>
    </>
  )
}
