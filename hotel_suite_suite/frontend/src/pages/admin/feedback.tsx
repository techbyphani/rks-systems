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
  Select, 
  Modal, 
  Space, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Descriptions,
  Rate,
  Divider
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  ArrowLeftOutlined, 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  DownloadOutlined,
  StarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface Feedback {
  id: number
  guest: { id: number; name: string; phone: string }
  roomBooking: { id: number; bookingId: string; room: { id: number; roomNumber: string } }
  roomRating: number
  serviceRating: number
  overallRating: number
  comments: string
  feedbackType: string
  createdAt: string
  resolved: boolean
}

export default function AdminFeedback() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const urlStatus = searchParams.get('status')
  const urlId = searchParams.get('id')
  const urlGuestId = searchParams.get('guestId')
  
  const [filter, setFilter] = useState('all')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  // Mock data - replace with API call
  const feedbacks: Feedback[] = [
    {
      id: 1,
      guest: { id: 1, name: 'John Doe', phone: '+911234567890' },
      roomBooking: { id: 1, bookingId: 'BK12345678', room: { id: 1, roomNumber: '101' } },
      roomRating: 4,
      serviceRating: 5,
      overallRating: 4,
      comments: 'Great stay! The room was clean and the staff was very helpful.',
      feedbackType: 'checkout',
      createdAt: '2024-01-15',
      resolved: true
    },
    {
      id: 2,
      guest: { id: 2, name: 'Jane Smith', phone: '+919876543210' },
      roomBooking: { id: 2, bookingId: 'BK87654321', room: { id: 2, roomNumber: '205' } },
      roomRating: 3,
      serviceRating: 4,
      overallRating: 3,
      comments: 'Room was okay but could be better. Service was good though.',
      feedbackType: 'checkout',
      createdAt: '2024-01-16',
      resolved: false
    }
  ]

  // Handle URL parameters
  useEffect(() => {
    const status = searchParams.get('status')
    const id = searchParams.get('id')
    const guestId = searchParams.get('guestId')
    
    if (status === 'unresolved') {
      setFilter('unresolved')
    }
    if (id) {
      const feedback = feedbacks.find(f => f.id === Number(id))
      if (feedback) {
        setSelectedFeedback(feedback)
        setShowDetailModal(true)
      }
    }
    if (guestId) {
      // Filter by guest ID if needed
    }
  }, [searchParams])

  const getOverallRatingColor = (rating: number) => {
    if (rating >= 4) return 'success'
    if (rating >= 3) return 'warning'
    return 'error'
  }

  const columns: ColumnsType<Feedback> = [
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record) => (
        <div>
          <div>{record.guest.name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.guest.phone}</Text>
        </div>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
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
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Overall Rating',
      dataIndex: 'overallRating',
      key: 'overallRating',
      render: (rating: number) => (
        <Space>
          <Rate disabled defaultValue={rating} />
          <Tag color={getOverallRatingColor(rating)}>{rating}/5</Tag>
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Status',
      key: 'resolved',
      render: (_, record) => (
        <Tag color={record.resolved ? 'success' : 'warning'}>
          {record.resolved ? 'Resolved' : 'Unresolved'}
        </Tag>
      ),
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedFeedback(record)
            setShowDetailModal(true)
          }}
        >
          View
        </Button>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ]

  const filteredFeedbacks = (feedbacks || []).filter(feedback => {
    if (filter === 'unresolved' && feedback.resolved) return false
    if (filter === 'resolved' && !feedback.resolved) return false
    return true
  })

  return (
    <>
      <Helmet>
        <title>Feedback - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Feedback', href: '/admin/feedback' },
            ...(selectedFeedback ? [{ label: `Feedback #${selectedFeedback.id}`, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>Guest Feedback</Title>
              <Space wrap>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push('/admin')}
                >
                  Back to Dashboard
                </Button>
                <Button 
                  type="primary"
                  icon={<DownloadOutlined />}
                >
                  Export Report
                </Button>
              </Space>
            </div>

            {/* Filters */}
            <Card>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Text strong>Filter</Text>
                  <Select
                    value={filter}
                    onChange={setFilter}
                    style={{ width: '100%', marginTop: '8px' }}
                    options={[
                      { value: 'all', label: 'All Feedback' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'unresolved', label: 'Unresolved' },
                    ]}
                  />
                </Col>
              </Row>
            </Card>

            {/* Feedback Table */}
            <Card>
              <Table
                columns={columns}
                dataSource={ensureArray(filteredFeedbacks)}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} feedback entries`
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* Feedback Detail Modal */}
            <Modal
              title={`Feedback Details - #${selectedFeedback?.id}`}
              open={showDetailModal}
              onCancel={() => setShowDetailModal(false)}
              footer={[
                <Button key="close" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>,
                <Button 
                  key="guest" 
                  icon={<UserOutlined />}
                  onClick={() => router.push(`/admin/guests?id=${selectedFeedback?.guest.id}`)}
                >
                  View Guest
                </Button>,
                <Button 
                  key="booking" 
                  icon={<CalendarOutlined />}
                  onClick={() => router.push(`/admin/bookings?id=${selectedFeedback?.roomBooking.id}`)}
                >
                  View Booking
                </Button>,
              ]}
              width={700}
            >
              {selectedFeedback && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* Guest & Booking Info */}
                  <Card size="small" title="Guest & Booking Information">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Guest Name">{selectedFeedback.guest.name}</Descriptions.Item>
                      <Descriptions.Item label="Phone">{selectedFeedback.guest.phone}</Descriptions.Item>
                      <Descriptions.Item label="Booking ID">{selectedFeedback.roomBooking.bookingId}</Descriptions.Item>
                      <Descriptions.Item label="Room">Room {selectedFeedback.roomBooking.room.roomNumber}</Descriptions.Item>
                      <Descriptions.Item label="Date">{selectedFeedback.createdAt}</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* Rating Breakdown */}
                  <Card size="small" title="Rating Breakdown">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div>
                        <Text strong>Room Rating: </Text>
                        <Rate disabled defaultValue={selectedFeedback.roomRating} />
                        <Text> ({selectedFeedback.roomRating}/5)</Text>
                      </div>
                      <div>
                        <Text strong>Service Rating: </Text>
                        <Rate disabled defaultValue={selectedFeedback.serviceRating} />
                        <Text> ({selectedFeedback.serviceRating}/5)</Text>
                      </div>
                      <Divider />
                      <div>
                        <Text strong>Overall Rating: </Text>
                        <Rate disabled defaultValue={selectedFeedback.overallRating} />
                        <Tag color={getOverallRatingColor(selectedFeedback.overallRating)} style={{ marginLeft: '8px' }}>
                          {selectedFeedback.overallRating}/5
                        </Tag>
                      </div>
                    </Space>
                  </Card>

                  {/* Comments */}
                  <Card size="small" title="Comments">
                    <Text>{selectedFeedback.comments}</Text>
                  </Card>

                  {/* Status */}
                  <Card size="small">
                    <Tag color={selectedFeedback.resolved ? 'success' : 'warning'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                      {selectedFeedback.resolved ? 'Resolved' : 'Unresolved'}
                    </Tag>
                  </Card>
                </Space>
              )}
            </Modal>
          </div>
        </Space>
      </AdminLayout>
    </>
  )
}
