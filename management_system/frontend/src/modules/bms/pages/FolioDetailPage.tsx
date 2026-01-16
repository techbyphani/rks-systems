import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Col,
  Row,
  Space,
  Spin,
  Typography,
  Descriptions,
  Tag,
  Button,
  Table,
  Empty,
  message,
  Divider,
  Statistic,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
} from 'antd';
import {
  DollarOutlined,
  PlusOutlined,
  PrinterOutlined,
  UserOutlined,
  FileTextOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, StatusTag } from '@/components/shared';
import { billingService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Folio, FolioCharge, Payment, ChargeCategory, PaymentMethod } from '@/types';

const { Text, Title } = Typography;

const CHARGE_CATEGORIES: { label: string; value: ChargeCategory }[] = [
  { label: 'Room', value: 'room' },
  { label: 'Food & Beverage', value: 'food_beverage' },
  { label: 'Spa', value: 'spa' },
  { label: 'Laundry', value: 'laundry' },
  { label: 'Minibar', value: 'minibar' },
  { label: 'Telephone', value: 'telephone' },
  { label: 'Parking', value: 'parking' },
  { label: 'Other', value: 'other' },
];

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Debit Card', value: 'debit_card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Corporate Account', value: 'corporate_account' },
];

export default function FolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [folio, setFolio] = useState<Folio | null>(null);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(searchParams.get('action') === 'payment');
  const [chargeForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    if (id && tenant?.id) {
      loadFolio();
    }
  }, [id, tenant?.id]);

  const loadFolio = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await billingService.getFolioById(tenant.id, id!);
      setFolio(data);
    } catch (error) {
      message.error('Failed to load folio');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCharge = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      await billingService.postCharge(tenant.id, id!, {
        category: values.category,
        description: values.description,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
      });
      message.success('Charge posted successfully');
      setChargeModalOpen(false);
      chargeForm.resetFields();
      loadFolio();
    } catch (error: any) {
      message.error(error.message || 'Failed to post charge');
    }
  };

  const handleProcessPayment = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      await billingService.processPayment(tenant.id, id!, {
        amount: values.amount,
        method: values.method,
        referenceNumber: values.referenceNumber,
        cardLastFour: values.cardLastFour,
        notes: values.notes,
      });
      message.success('Payment processed successfully');
      setPaymentModalOpen(false);
      paymentForm.resetFields();
      loadFolio();
    } catch (error: any) {
      message.error(error.message || 'Failed to process payment');
    }
  };

  const handleVoidCharge = async (chargeId: string) => {
    Modal.confirm({
      title: 'Void Charge',
      content: 'Are you sure you want to void this charge?',
      onOk: async () => {
        try {
          if (!tenant?.id) {
            message.error('Tenant context not available');
            return;
          }
          await billingService.voidCharge(tenant.id, id!, chargeId, 'Voided by user');
          message.success('Charge voided');
          loadFolio();
        } catch (error: any) {
          message.error(error.message || 'Failed to void charge');
        }
      },
    });
  };

  const handleCloseFolio = () => {
    Modal.confirm({
      title: 'Close Folio',
      content: 'Are you sure you want to close this folio? This action cannot be undone.',
      okText: 'Yes, Close',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          if (!tenant?.id) {
            message.error('Tenant context not available');
            return;
          }
          await billingService.closeFolio(tenant.id, id!);
          message.success('Folio closed successfully');
          loadFolio();
        } catch (error: any) {
          message.error(error.message || 'Failed to close folio');
        }
      },
    });
  };

  const chargeColumns: ColumnsType<FolioCharge> = [
    {
      title: 'Date',
      dataIndex: 'chargeDate',
      key: 'chargeDate',
      width: 100,
      render: (date: string) => dayjs(date).format('DD MMM'),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: string) => <Tag>{cat.replace(/_/g, ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      align: 'center',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      title: 'Tax',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      width: 80,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      align: 'right',
      render: (value: number, record) => (
        <span style={{ textDecoration: record.isVoided ? 'line-through' : 'none' }}>
          ₹{value.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) =>
        !record.isVoided && folio?.status === 'open' && (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleVoidCharge(record.id)}
          />
        ),
    },
  ];

  const paymentColumns: ColumnsType<Payment> = [
    {
      title: 'Date',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD MMM HH:mm'),
    },
    {
      title: 'Receipt #',
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      width: 140,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method: string) => <Tag color="blue">{method.replace(/_/g, ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <StatusTag status={status} type="payment" />,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>
          ₹{value.toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!folio) {
    return <Empty description="Folio not found" />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title={`Folio ${folio.folioNumber}`}
        subtitle={`${folio.guest?.firstName} ${folio.guest?.lastName}`}
        showBack
        backPath="/suite/bms/folios"
        breadcrumbs={[
          { label: 'BMS', path: '/suite/bms' },
          { label: 'Folios', path: '/suite/bms/folios' },
          { label: folio.folioNumber },
        ]}
        actions={
          <Space>
            {folio.status === 'open' && (
              <>
                <Button icon={<PlusOutlined />} onClick={() => setChargeModalOpen(true)}>
                  Post Charge
                </Button>
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() => setPaymentModalOpen(true)}
                >
                  Collect Payment
                </Button>
                {folio.balance === 0 && (
                  <Button
                    type="default"
                    icon={<FileTextOutlined />}
                    onClick={handleCloseFolio}
                  >
                    Close Folio
                  </Button>
                )}
              </>
            )}
            <Button icon={<PrinterOutlined />} onClick={() => message.info('Print coming soon')}>
              Print
            </Button>
          </Space>
        }
      />

      {/* Summary Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Charges"
              value={folio.totalCharges}
              prefix="₹"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Payments"
              value={folio.totalPayments}
              prefix="₹"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Balance Due"
              value={folio.balance}
              prefix="₹"
              valueStyle={{ color: folio.balance > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Left Column */}
        <Col xs={24} lg={16}>
          {/* Charges */}
          <Card
            title="Charges"
            extra={
              folio.status === 'open' && (
                <Button type="link" icon={<PlusOutlined />} onClick={() => setChargeModalOpen(true)}>
                  Add Charge
                </Button>
              )
            }
          >
            <Table
              columns={chargeColumns}
              dataSource={folio.charges}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>₹{folio.totalCharges.toLocaleString('en-IN')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Payments */}
          <Card title="Payments" style={{ marginTop: 16 }}>
            <Table
              columns={paymentColumns}
              dataSource={folio.payments}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No payments recorded' }}
            />
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          {/* Guest Info */}
          <Card
            title={
              <Space>
                <UserOutlined />
                Guest Details
              </Space>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">
                {folio.guest?.firstName} {folio.guest?.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">{folio.guest?.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{folio.guest?.phone}</Descriptions.Item>
              <Descriptions.Item label="Room">
                {folio.room?.roomNumber || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
            <Button
              type="link"
              block
              onClick={() => navigate(`/suite/crs/guests/${folio.guestId}`)}
            >
              View Guest Profile
            </Button>
          </Card>

          {/* Folio Info */}
          <Card title="Folio Information" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Folio Number">{folio.folioNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={folio.status} type="folio" />
              </Descriptions.Item>
              <Descriptions.Item label="Currency">{folio.currency}</Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(folio.createdAt).format('DD MMM YYYY HH:mm')}
              </Descriptions.Item>
              {folio.closedAt && (
                <Descriptions.Item label="Closed">
                  {dayjs(folio.closedAt).format('DD MMM YYYY HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
            {folio.reservationId && (
              <Button
                type="link"
                block
                onClick={() => navigate(`/suite/crs/reservations/${folio.reservationId}`)}
              >
                View Reservation
              </Button>
            )}
            {folio.status === 'settled' && folio.balance === 0 && (
              <Button
                type="link"
                block
                icon={<FileTextOutlined />}
                onClick={async () => {
                  try {
                    if (!tenant?.id) {
                      message.error('Tenant context not available');
                      return;
                    }
                    const invoice = await billingService.createInvoiceFromFolio(tenant.id, folio.id, {
                      dueDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
                    });
                    message.success('Invoice generated successfully');
                    navigate(`/suite/bms/invoices/${invoice.id}`);
                  } catch (error: any) {
                    message.error(error.message || 'Failed to generate invoice');
                  }
                }}
              >
                Generate Invoice
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      {/* Post Charge Modal */}
      <Modal
        title="Post Charge"
        open={chargeModalOpen}
        onCancel={() => setChargeModalOpen(false)}
        onOk={() => chargeForm.submit()}
        okText="Post Charge"
      >
        <Form form={chargeForm} layout="vertical" onFinish={handlePostCharge}>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Category is required' }]}
          >
            <Select options={CHARGE_CATEGORIES} placeholder="Select category" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input placeholder="Enter description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                initialValue={1}
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unitPrice"
                label="Unit Price"
                rules={[{ required: true, message: 'Price is required' }]}
              >
                <InputNumber style={{ width: '100%' }} prefix="₹" min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        title="Collect Payment"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={() => paymentForm.submit()}
        okText="Process Payment"
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleProcessPayment}>
          <Form.Item
            name="amount"
            label="Amount"
            initialValue={folio.balance}
            rules={[{ required: true, message: 'Amount is required' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="₹"
              min={0}
              max={folio.balance}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
          <Form.Item
            name="method"
            label="Payment Method"
            rules={[{ required: true, message: 'Method is required' }]}
          >
            <Select options={PAYMENT_METHODS} placeholder="Select method" />
          </Form.Item>
          <Form.Item name="referenceNumber" label="Reference Number">
            <Input placeholder="Transaction/Reference number" />
          </Form.Item>
          <Form.Item name="cardLastFour" label="Card Last 4 Digits">
            <Input placeholder="1234" maxLength={4} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Payment notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
