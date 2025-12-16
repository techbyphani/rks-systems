import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'antd';
import {
  PrinterOutlined,
  FileTextOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, StatusTag } from '@/components/shared';
import { billingService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Invoice, InvoiceItem } from '@/types';

const { Text, Title } = Typography;

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (id && tenant?.id) {
      loadInvoice();
    }
  }, [id, tenant?.id]);

  const loadInvoice = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await billingService.getInvoiceById(tenant.id, id!);
      setInvoice(data);
    } catch (error) {
      message.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns: ColumnsType<InvoiceItem> = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      title: 'Tax',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      width: 100,
      align: 'right',
      render: (value: number) => value ? `₹${value.toLocaleString('en-IN')}` : '-',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return <Empty description="Invoice not found" />;
  }

  const isOverdue = dayjs().isAfter(dayjs(invoice.dueDate)) && invoice.balance > 0;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={invoice.companyName || `${invoice.guest?.firstName} ${invoice.guest?.lastName}`}
        showBack
        backPath="/suite/bms/invoices"
        breadcrumbs={[
          { label: 'BMS', path: '/suite/bms' },
          { label: 'Invoices', path: '/suite/bms/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => message.info('Print functionality coming soon')}>
              Print
            </Button>
            {invoice.balance > 0 && (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => navigate(`/suite/bms/folios/${invoice.folioId}`)}
              >
                Make Payment
              </Button>
            )}
          </Space>
        }
      />

      {/* Invoice Header */}
      <Card>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={8}>
              <Title level={4} style={{ margin: 0 }}>
                {invoice.companyName || `${invoice.guest?.firstName} ${invoice.guest?.lastName}`}
              </Title>
              {invoice.companyAddress && (
                <Space direction="vertical" size={0}>
                  <Text>{invoice.companyAddress.street}</Text>
                  <Text>
                    {invoice.companyAddress.city}
                    {invoice.companyAddress.state && `, ${invoice.companyAddress.state}`}
                  </Text>
                  <Text>
                    {invoice.companyAddress.postalCode} {invoice.companyAddress.country}
                  </Text>
                </Space>
              )}
              {!invoice.companyAddress && invoice.guest && (
                <Space direction="vertical" size={0}>
                  <Text>{invoice.guest.email}</Text>
                  <Text>{invoice.guest.phone}</Text>
                </Space>
              )}
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ display: 'block' }}>Invoice Number</Text>
                <Title level={4} style={{ margin: 0 }}>{invoice.invoiceNumber}</Title>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Issue Date"
                    value={dayjs(invoice.issueDate).format('DD MMM YYYY')}
                    valueStyle={{ fontSize: 14 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Due Date"
                    value={dayjs(invoice.dueDate).format('DD MMM YYYY')}
                    valueStyle={{ fontSize: 14, color: isOverdue ? '#ff4d4f' : undefined }}
                  />
                </Col>
              </Row>
              <div style={{ textAlign: 'right' }}>
                <StatusTag status={invoice.status} type="invoice" />
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Invoice Items */}
      <Card title="Invoice Items">
        <Table
          columns={itemColumns}
          dataSource={invoice.items}
          rowKey="id"
          pagination={false}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>₹{invoice.subtotal.toLocaleString('en-IN')}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong>₹{invoice.taxAmount.toLocaleString('en-IN')}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* Payment Summary */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="Payment Summary">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Subtotal">
                ₹{invoice.subtotal.toLocaleString('en-IN')}
              </Descriptions.Item>
              <Descriptions.Item label="Tax (18%)">
                ₹{invoice.taxAmount.toLocaleString('en-IN')}
              </Descriptions.Item>
              <Divider style={{ margin: '8px 0' }} />
              <Descriptions.Item label="Total Amount">
                <Text strong style={{ fontSize: 18 }}>
                  ₹{invoice.totalAmount.toLocaleString('en-IN')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Paid Amount">
                <Text style={{ color: '#52c41a' }}>
                  ₹{invoice.paidAmount.toLocaleString('en-IN')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Balance">
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    color: invoice.balance > 0 ? '#ff4d4f' : '#52c41a',
                  }}
                >
                  ₹{invoice.balance.toLocaleString('en-IN')}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Related Information">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Folio">
                <Button
                  type="link"
                  onClick={() => navigate(`/suite/bms/folios/${invoice.folioId}`)}
                  style={{ padding: 0 }}
                >
                  View Folio
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="Guest">
                <Button
                  type="link"
                  onClick={() => navigate(`/suite/crs/guests/${invoice.guestId}`)}
                  style={{ padding: 0 }}
                >
                  {invoice.guest?.firstName} {invoice.guest?.lastName}
                </Button>
              </Descriptions.Item>
              {invoice.taxId && (
                <Descriptions.Item label="Tax ID">
                  {invoice.taxId}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Currency">
                {invoice.currency}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(invoice.createdAt).format('DD MMM YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
            {invoice.notes && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                    Notes
                  </Text>
                  <Text>{invoice.notes}</Text>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

