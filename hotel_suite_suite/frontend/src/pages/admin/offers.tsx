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
  Modal, 
  Space, 
  Typography, 
  Tag, 
  Row, 
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Switch,
  Drawer
} from 'antd'
import { ensureArray } from '@/utils/arrayUtils'
import { 
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  BarChartOutlined,
  GiftOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface Offer {
  id: number
  title: string
  description: string
  discount: number
  discountType: string
  validFrom: string
  validTo: string
  isActive: boolean
  usageCount: number
}

export default function AdminOffers() {
  const router = useRouter()
  const [searchParams] = useSearchParams()
  const urlId = searchParams.get('id')
  const [form] = Form.useForm()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)

  // Mock data - replace with API call
  const offers: Offer[] = [
    {
      id: 1,
      title: 'Weekend Special',
      description: '20% off on weekend stays',
      discount: 20,
      discountType: 'percentage',
      validFrom: '2024-01-15',
      validTo: '2024-03-15',
      isActive: true,
      usageCount: 15
    },
    {
      id: 2,
      title: 'Early Bird Discount',
      description: 'Book 30 days in advance and save ₹1000',
      discount: 1000,
      discountType: 'fixed',
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      isActive: true,
      usageCount: 8
    },
    {
      id: 3,
      title: 'Summer Sale',
      description: '15% off on all room types',
      discount: 15,
      discountType: 'percentage',
      validFrom: '2024-03-01',
      validTo: '2024-05-31',
      isActive: false,
      usageCount: 0
    }
  ]

  // Handle URL parameters
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const offer = offers.find(o => o.id === Number(id))
      if (offer) {
        setSelectedOffer(offer)
        setShowDetailDrawer(true)
      }
    }
  }, [searchParams])

  const columns: ColumnsType<Offer> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record) => (
        record.discountType === 'percentage' 
          ? `${record.discount}%` 
          : `₹${record.discount}`
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isActive ? 'success' : 'default'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Usage',
      dataIndex: 'usageCount',
      key: 'usageCount',
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
            setSelectedOffer(record)
            setShowDetailDrawer(true)
          }}
        >
          View
        </Button>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ]

  return (
    <>
      <Helmet>
        <title>Offers - Admin Dashboard</title>
      </Helmet>
      
      <AdminLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Offers', href: '/admin/offers' },
            ...(selectedOffer ? [{ label: selectedOffer.title, href: '#' }] : [])
          ]} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Title level={2} style={{ margin: 0 }}>Offers & Promotions</Title>
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
                  Create Offer
                </Button>
              </Space>
            </div>

            {/* Offers Table */}
            <Card>
              <Table
                columns={columns}
                dataSource={ensureArray(offers)}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} offers`
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>

            {/* Offer Detail Drawer */}
            <Drawer
              title={
                <Space>
                  <GiftOutlined />
                  {selectedOffer?.title}
                </Space>
              }
              placement="right"
              onClose={() => {
                setShowDetailDrawer(false)
                setSelectedOffer(null)
                router.push('/admin/offers')
              }}
              open={showDetailDrawer}
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
                  <Button 
                    icon={<BarChartOutlined />}
                    onClick={() => router.push(`/admin/analytics?focus=offers&offerId=${selectedOffer?.id}`)}
                  >
                    View Analytics
                  </Button>
                </Space>
              }
            >
              {selectedOffer && (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="Offer Details">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Title">{selectedOffer.title}</Descriptions.Item>
                      <Descriptions.Item label="Description">{selectedOffer.description}</Descriptions.Item>
                      <Descriptions.Item label="Discount">
                        {selectedOffer.discountType === 'percentage' 
                          ? `${selectedOffer.discount}%` 
                          : `₹${selectedOffer.discount}`}
                      </Descriptions.Item>
                      <Descriptions.Item label="Valid From">{selectedOffer.validFrom}</Descriptions.Item>
                      <Descriptions.Item label="Valid To">{selectedOffer.validTo}</Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={selectedOffer.isActive ? 'success' : 'default'}>
                          {selectedOffer.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Usage Count">{selectedOffer.usageCount}</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Button 
                      block
                      icon={<EditOutlined />}
                      onClick={() => {
                        // Handle edit
                      }}
                    >
                      Edit Offer
                    </Button>
                    <Button 
                      block
                      icon={<CalendarOutlined />}
                      onClick={() => router.push(`/admin/bookings?offerId=${selectedOffer.id}`)}
                    >
                      View Bookings Using This Offer
                    </Button>
                    <Button 
                      block
                      icon={<BarChartOutlined />}
                      onClick={() => router.push(`/admin/analytics?focus=offers&offerId=${selectedOffer.id}`)}
                    >
                      View Analytics
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

            {/* Add Offer Modal */}
            <Modal
              title="Create New Offer"
              open={showAddModal}
              onCancel={() => {
                setShowAddModal(false)
                form.resetFields()
              }}
              footer={null}
              width={600}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={(values) => {
                  // Handle add offer
                  console.log('Adding offer:', values)
                  setShowAddModal(false)
                  form.resetFields()
                }}
              >
                <Form.Item name="title" label="Offer Title" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="discountType" label="Discount Type" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'percentage', label: 'Percentage' },
                      { value: 'fixed', label: 'Fixed Amount' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="discount" label="Discount Value" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item name="validFrom" label="Valid From" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="validTo" label="Valid To" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
                  <Switch />
                </Form.Item>
                <Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={() => {
                      setShowAddModal(false)
                      form.resetFields()
                    }}>
                      Cancel
                    </Button>
                    <Button type="primary" htmlType="submit">
                      Create Offer
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
          </div>
        </Space>
      </AdminLayout>
    </>
  )
}
