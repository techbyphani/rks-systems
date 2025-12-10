import { Helmet } from 'react-helmet-async'
import ReceptionLayout from '@/components/layout/ReceptionLayout'
import { useState } from 'react'
import { useRouter } from '@/shims/router'
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Space, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Rate,
  Descriptions,
  Form,
  Input,
  List,
  Avatar
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined,
  MessageOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { TextArea } = Input

interface Feedback {
  id: number
  guest: { name: string; phone: string }
  roomBooking: { 
    bookingId: string
    room: { roomNumber: string }
    checkOutDate: string
  }
  roomRating: number
  serviceRating: number
  overallRating: number
  comments: string
  feedbackType: string
  createdAt: string
}

interface EligibleGuest {
  id: number
  name: string
  phone: string
  roomBooking: {
    bookingId: string
    room: { roomNumber: string }
    checkOutDate: string
    status: string
  }
}

export default function ReceptionFeedback() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<EligibleGuest | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  // Mock data - replace with API call
  const feedbacks: Feedback[] = [
    {
      id: 1,
      guest: { name: 'John Doe', phone: '+911234567890' },
      roomBooking: { 
        bookingId: 'BK12345678', 
        room: { roomNumber: '101' },
        checkOutDate: '2024-01-15'
      },
      roomRating: 4,
      serviceRating: 5,
      overallRating: 4,
      comments: 'Great stay! The room was clean and the staff was very helpful. Would definitely come back.',
      feedbackType: 'checkout',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      guest: { name: 'Jane Smith', phone: '+919876543210' },
      roomBooking: { 
        bookingId: 'BK87654321', 
        room: { roomNumber: '205' },
        checkOutDate: '2024-01-14'
      },
      roomRating: 3,
      serviceRating: 4,
      overallRating: 3,
      comments: 'Room was okay but could be better. Service was good though. The breakfast was excellent.',
      feedbackType: 'checkout',
      createdAt: '2024-01-14'
    }
  ]

  // Mock data for guests who can provide feedback
  const eligibleGuests: EligibleGuest[] = [
    {
      id: 1,
      name: 'Bob Wilson',
      phone: '+911122334455',
      roomBooking: {
        bookingId: 'BK11223344',
        room: { roomNumber: '301' },
        checkOutDate: '2024-01-15',
        status: 'checked_out'
      }
    }
  ]

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
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.guest.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.guest.phone}</Text>
          </div>
        </Space>
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

  const collectFeedback = (guest: EligibleGuest) => {
    setSelectedGuest(guest)
    setShowFeedbackModal(true)
  }

  const submitFeedback = async (values: any) => {
    // TODO: Implement feedback submission
    console.log('Submitting feedback for:', selectedGuest?.name, values)
    setShowFeedbackModal(false)
    setSelectedGuest(null)
    form.resetFields()
  }

  return (
    <>
      <Helmet>
        <title>Feedback - Reception Dashboard</title>
      </Helmet>
      
      <ReceptionLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Title level={2} style={{ margin: 0 }}>Guest Feedback</Title>

            {/* Eligible Guests for Feedback */}
            <Card title="Collect Feedback from Checked-Out Guests">
              <List
                dataSource={ensureArray(eligibleGuests)}
                renderItem={(guest) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="primary"
                        icon={<MessageOutlined />}
                        onClick={() => collectFeedback(guest)}
                      >
                        Collect Feedback
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={guest.name}
                      description={
                        <Space>
                          <Text type="secondary">Booking: {guest.roomBooking.bookingId}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">Room: {guest.roomBooking.room.roomNumber}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">Check-Out: {guest.roomBooking.checkOutDate}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            {/* Feedback Table */}
            <Card title="Received Feedback">
              <Table
                columns={columns}
                dataSource={ensureArray(feedbacks)}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} feedback entries`
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* Collect Feedback Modal */}
            <Modal
              title={`Collect Feedback - ${selectedGuest?.name}`}
              open={showFeedbackModal}
              onCancel={() => {
                setShowFeedbackModal(false)
                setSelectedGuest(null)
                form.resetFields()
              }}
              footer={null}
              width={600}
            >
              {selectedGuest && (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={submitFeedback}
                >
                  <Card size="small" title="Guest Information" style={{ marginBottom: '16px' }}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Name">{selectedGuest.name}</Descriptions.Item>
                      <Descriptions.Item label="Phone">{selectedGuest.phone}</Descriptions.Item>
                      <Descriptions.Item label="Booking ID">{selectedGuest.roomBooking.bookingId}</Descriptions.Item>
                      <Descriptions.Item label="Room">Room {selectedGuest.roomBooking.room.roomNumber}</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Form.Item name="roomRating" label="Room Rating" rules={[{ required: true }]}>
                    <Rate />
                  </Form.Item>

                  <Form.Item name="serviceRating" label="Service Rating" rules={[{ required: true }]}>
                    <Rate />
                  </Form.Item>

                  <Form.Item name="overallRating" label="Overall Rating" rules={[{ required: true }]}>
                    <Rate />
                  </Form.Item>

                  <Form.Item name="comments" label="Comments">
                    <TextArea rows={4} placeholder="Please share your experience..." />
                  </Form.Item>

                  <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                      <Button onClick={() => {
                        setShowFeedbackModal(false)
                        setSelectedGuest(null)
                        form.resetFields()
                      }}>
                        Cancel
                      </Button>
                      <Button type="primary" htmlType="submit" icon={<MessageOutlined />}>
                        Submit Feedback
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              )}
            </Modal>

            {/* Feedback Detail Modal */}
            <Modal
              title={`Feedback Details - ${selectedFeedback?.guest.name}`}
              open={showDetailModal}
              onCancel={() => {
                setShowDetailModal(false)
                setSelectedFeedback(null)
              }}
              footer={[
                <Button key="close" onClick={() => {
                  setShowDetailModal(false)
                  setSelectedFeedback(null)
                }}>
                  Close
                </Button>,
                <Button 
                  key="guest" 
                  icon={<UserOutlined />}
                  onClick={() => router.push(`/reception/guests?name=${selectedFeedback?.guest.name}`)}
                >
                  View Guest
                </Button>,
              ]}
              width={600}
            >
              {selectedFeedback && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Guest & Booking Information">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Guest Name">{selectedFeedback.guest.name}</Descriptions.Item>
                      <Descriptions.Item label="Phone">{selectedFeedback.guest.phone}</Descriptions.Item>
                      <Descriptions.Item label="Booking ID">{selectedFeedback.roomBooking.bookingId}</Descriptions.Item>
                      <Descriptions.Item label="Room">Room {selectedFeedback.roomBooking.room.roomNumber}</Descriptions.Item>
                      <Descriptions.Item label="Check-Out Date">{selectedFeedback.roomBooking.checkOutDate}</Descriptions.Item>
                      <Descriptions.Item label="Date">{selectedFeedback.createdAt}</Descriptions.Item>
                    </Descriptions>
                  </Card>

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
                      <div>
                        <Text strong>Overall Rating: </Text>
                        <Rate disabled defaultValue={selectedFeedback.overallRating} />
                        <Tag color={getOverallRatingColor(selectedFeedback.overallRating)} style={{ marginLeft: '8px' }}>
                          {selectedFeedback.overallRating}/5
                        </Tag>
                      </div>
                    </Space>
                  </Card>

                  <Card size="small" title="Comments">
                    <Text>{selectedFeedback.comments}</Text>
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
