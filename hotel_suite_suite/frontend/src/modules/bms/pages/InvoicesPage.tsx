import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Space, Select, Tag, Statistic, Button, message } from 'antd';
import { PlusOutlined, FileTextOutlined, PrinterOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, DataTable, StatusTag } from '@/components/shared';
import { billingService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Invoice, InvoiceStatus, PaginatedResponse } from '@/types';

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
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    outstanding: number;
    overdue: number;
    paidThisMonth: number;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>();

  useEffect(() => {
    if (tenant?.id) {
      loadInvoices();
    }
  }, [statusFilter, tenant?.id]);

  const loadInvoices = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [invoicesData, statsData] = await Promise.all([
        billingService.getAllInvoices(tenant.id, { status: statusFilter }),
        billingService.getInvoiceStats(tenant.id),
      ]);
      setData(invoicesData);
      setStats(statsData);
    } catch (error) {
      message.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => navigate(`/suite/bms/invoices/${record.id}`)}
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
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/suite/bms/folios')}
          >
            Create Invoice
          </Button>
        }
      />

      {/* Summary Stats */}
      {stats && (
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Invoices"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Outstanding"
                value={stats.outstanding}
                prefix="₹"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Overdue"
                value={stats.overdue}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Paid This Month"
                value={stats.paidThisMonth}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <DataTable<Invoice>
        title="All Invoices"
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={loading}
        onRefresh={loadInvoices}
        showSearch={false}
        pagination={{
          current: data?.page || 1,
          pageSize: data?.pageSize || 10,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`,
        }}
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
