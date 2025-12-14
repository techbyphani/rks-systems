import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Space, Select, Tag, Statistic, DatePicker, message } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, DataTable, StatusTag } from '@/components/shared';
import { billingService } from '@/api';
import type { Payment, PaymentMethod, PaginatedResponse } from '@/types';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Payment> | null>(null);
  const [filters, setFilters] = useState<{
    date?: string;
    method?: PaymentMethod;
    page: number;
    pageSize: number;
  }>({ page: 1, pageSize: 10 });
  const [breakdown, setBreakdown] = useState<Record<PaymentMethod, number> | null>(null);
  const [todaysTotal, setTodaysTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, breakdownData] = await Promise.all([
        billingService.getAllPayments(filters),
        billingService.getPaymentBreakdown(),
      ]);
      setData(paymentsData);
      setBreakdown(breakdownData);
      
      // Calculate today's total
      const today = dayjs().format('YYYY-MM-DD');
      const todaysPayments = paymentsData.data.filter(
        (p) => p.processedAt.startsWith(today)
      );
      setTodaysTotal(todaysPayments.reduce((sum, p) => sum + p.amount, 0));
    } catch (error) {
      message.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, pageSize }));
  };

  const columns: ColumnsType<Payment> = [
    {
      title: 'Receipt #',
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      width: 140,
      render: (value) => <span style={{ fontWeight: 500 }}>{value}</span>,
    },
    {
      title: 'Date & Time',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 160,
      render: (date: string) => dayjs(date).format('DD MMM YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.processedAt).unix() - dayjs(b.processedAt).unix(),
    },
    {
      title: 'Folio',
      dataIndex: 'folioId',
      key: 'folioId',
      width: 120,
      render: (_, record) => (
        <a onClick={() => navigate(`/suite/bms/folios/${record.folioId}`)}>
          {record.folio?.folioNumber || 'View'}
        </a>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 130,
      render: (method: PaymentMethod) => {
        const colors: Record<string, string> = {
          cash: 'green',
          credit_card: 'blue',
          debit_card: 'cyan',
          upi: 'purple',
          bank_transfer: 'geekblue',
          corporate_account: 'orange',
        };
        return (
          <Tag color={colors[method] || 'default'}>
            {method.replace(/_/g, ' ').toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: 'Cash', value: 'cash' },
        { text: 'Credit Card', value: 'credit_card' },
        { text: 'Debit Card', value: 'debit_card' },
        { text: 'UPI', value: 'upi' },
        { text: 'Bank Transfer', value: 'bank_transfer' },
      ],
      onFilter: (value, record) => record.method === value,
    },
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: 'Card',
      key: 'card',
      width: 100,
      render: (_, record) =>
        record.cardLastFour ? (
          <span>
            {record.cardType && <Tag>{record.cardType}</Tag>}
            ****{record.cardLastFour}
          </span>
        ) : (
          '-'
        ),
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
      width: 130,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          ₹{value.toLocaleString('en-IN')}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
  ];

  const methodLabels: Record<string, string> = {
    cash: 'Cash',
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    corporate_account: 'Corporate',
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Payments"
        subtitle="View all payment transactions"
        breadcrumbs={[
          { label: 'BMS', path: '/suite/bms' },
          { label: 'Payments' },
        ]}
      />

      {/* Summary Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Today's Collections"
              value={todaysTotal}
              prefix="₹"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={16}>
          <Card size="small" title="Payment Method Breakdown">
            <Space wrap>
              {breakdown &&
                Object.entries(breakdown).map(([method, amount]) => (
                  <Tag key={method} color="blue">
                    {methodLabels[method] || method}: ₹{amount.toLocaleString('en-IN')}
                  </Tag>
                ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <DataTable<Payment>
        title="All Payments"
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={loading}
        onRefresh={loadData}
        showSearch={false}
        pagination={{
          current: data?.page || 1,
          pageSize: data?.pageSize || 10,
          total: data?.total || 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} payments`,
        }}
        extra={
          <Space wrap>
            <DatePicker
              placeholder="Filter by date"
              onChange={(date) =>
                setFilters((prev) => ({
                  ...prev,
                  date: date?.format('YYYY-MM-DD'),
                  page: 1,
                }))
              }
            />
            <Select
              placeholder="Payment Method"
              allowClear
              style={{ width: 150 }}
              value={filters.method}
              onChange={(value) => setFilters((prev) => ({ ...prev, method: value, page: 1 }))}
              options={Object.entries(methodLabels).map(([value, label]) => ({
                label,
                value,
              }))}
            />
          </Space>
        }
      />
    </Space>
  );
}
