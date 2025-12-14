import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Space, Select, Tag, Statistic, Button, message, Empty } from 'antd';
import { PlusOutlined, FileTextOutlined, PrinterOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, DataTable, StatusTag } from '@/components/shared';
import type { Invoice, InvoiceStatus } from '@/types';

// Mock invoices for demo
const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-001',
    folioId: 'folio-001',
    guestId: 'guest-001',
    guest: { firstName: 'John', lastName: 'Smith', email: 'john@example.com' } as any,
    companyName: 'Acme Corp',
    status: 'issued',
    issueDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    dueDate: dayjs().add(28, 'day').format('YYYY-MM-DD'),
    items: [],
    subtotal: 45000,
    taxAmount: 8100,
    totalAmount: 53100,
    paidAmount: 0,
    balance: 53100,
    currency: 'INR',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    updatedAt: dayjs().subtract(2, 'day').toISOString(),
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-002',
    folioId: 'folio-002',
    guestId: 'guest-002',
    guest: { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.com' } as any,
    status: 'paid',
    issueDate: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
    dueDate: dayjs().add(20, 'day').format('YYYY-MM-DD'),
    items: [],
    subtotal: 28000,
    taxAmount: 5040,
    totalAmount: 33040,
    paidAmount: 33040,
    balance: 0,
    currency: 'INR',
    createdAt: dayjs().subtract(10, 'day').toISOString(),
    updatedAt: dayjs().subtract(5, 'day').toISOString(),
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2024-003',
    folioId: 'folio-003',
    guestId: 'guest-003',
    guest: { firstName: 'Mike', lastName: 'Brown', email: 'mike@example.com' } as any,
    companyName: 'TechStart Inc',
    status: 'overdue',
    issueDate: dayjs().subtract(45, 'day').format('YYYY-MM-DD'),
    dueDate: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
    items: [],
    subtotal: 72000,
    taxAmount: 12960,
    totalAmount: 84960,
    paidAmount: 40000,
    balance: 44960,
    currency: 'INR',
    createdAt: dayjs().subtract(45, 'day').toISOString(),
    updatedAt: dayjs().subtract(10, 'day').toISOString(),
  },
];

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'default',
  issued: 'blue',
  sent: 'cyan',
  paid: 'green',
  overdue: 'red',
  cancelled: 'default',
};

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setInvoices(mockInvoices);
    } catch (error) {
      message.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = statusFilter
    ? invoices.filter((inv) => inv.status === statusFilter)
    : invoices;

  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
      render: (value) => <span style={{ fontWeight: 500 }}>{value}</span>,
    },
    {
      title: 'Guest/Company',
      key: 'guest',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.companyName || `${record.guest?.firstName} ${record.guest?.lastName}`}</span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{record.guest?.email}</span>
        </Space>
      ),
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 110,
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 110,
      render: (date: string, record) => {
        const isOverdue = dayjs().isAfter(dayjs(date)) && record.balance > 0;
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {dayjs(date).format('DD MMM YYYY')}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: InvoiceStatus) => (
        <Tag color={STATUS_COLORS[status]}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: '#52c41a' }}>₹{value.toLocaleString('en-IN')}</span>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          ₹{value.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => message.info('Invoice detail view coming soon')}
          />
          <Button
            type="text"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => message.info('Print functionality coming soon')}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Invoices"
        subtitle="Manage invoices and track payments"
        breadcrumbs={[
          { label: 'BMS', path: '/suite/bms' },
          { label: 'Invoices' },
        ]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('Create invoice coming soon')}>
            Create Invoice
          </Button>
        }
      />

      {/* Summary Stats */}
      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Invoices"
              value={invoices.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Outstanding"
              value={totalOutstanding}
              prefix="₹"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Overdue"
              value={overdueCount}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Paid This Month"
              value={invoices.filter((inv) => inv.status === 'paid').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <DataTable<Invoice>
        title="All Invoices"
        columns={columns}
        dataSource={filteredInvoices}
        rowKey="id"
        loading={loading}
        onRefresh={loadInvoices}
        showSearch={false}
        pagination={{ pageSize: 10 }}
        extra={
          <Select
            placeholder="All Statuses"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.keys(STATUS_COLORS).map((status) => ({
              label: status.toUpperCase(),
              value: status,
            }))}
          />
        }
      />
    </Space>
  );
}
