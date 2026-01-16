import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Statistic, DatePicker } from 'antd';
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';
import { transactionService, type TransactionFilters } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Transaction, TransactionType, PaginatedResponse } from '@/types';

export default function TransactionsPage() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Transaction> | null>(null);
  const [stats, setStats] = useState<{
    totalDebits: number;
    totalCredits: number;
    netAmount: number;
  } | null>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => { 
    if (tenant?.id) {
      loadTransactions();
      loadStats();
    }
  }, [typeFilter, dateRange, tenant?.id]);

  const loadTransactions = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const filters: TransactionFilters = {
        type: typeFilter,
        startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined,
        page: 1,
        pageSize: 50,
      };
      const result = await transactionService.getAll(tenant.id, filters);
      setData(result);
    } catch (error) {
      message.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!tenant?.id) return;
    try {
      const statsData = await transactionService.getStats(tenant.id, {
        startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined,
      });
      setStats(statsData);
    } catch (error) {
      // Silent fail for stats
    }
  };

  const columns: ColumnsType<Transaction> = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 100, render: (date: string) => dayjs(date).format('DD MMM YYYY') },
    { title: 'Transaction #', dataIndex: 'transactionNumber', key: 'transactionNumber', width: 140 },
    { title: 'Account', key: 'account', width: 180, render: (_, record) => <span>{record.account?.code} - {record.account?.name}</span> },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 100, render: (type: TransactionType) => <Tag color={type === 'credit' ? 'green' : 'red'} icon={type === 'credit' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}>{type.toUpperCase()}</Tag> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, align: 'right', render: (value: number, record) => <span style={{ color: record.type === 'credit' ? '#52c41a' : '#ff4d4f' }}>₹{value.toLocaleString('en-IN')}</span> },
    { title: 'Balance', dataIndex: 'balance', key: 'balance', width: 120, align: 'right', render: (value: number) => `₹${value.toLocaleString('en-IN')}` },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Transactions"
        subtitle="View all financial transactions"
        breadcrumbs={[{ label: 'Accounting', path: '/suite/as' }, { label: 'Transactions' }]}
        actions={<Button icon={<ReloadOutlined />} onClick={loadTransactions}>Refresh</Button>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic 
              title="Total Debits" 
              value={stats?.totalDebits || 0} 
              prefix="₹" 
              valueStyle={{ color: '#ff4d4f' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic 
              title="Total Credits" 
              value={stats?.totalCredits || 0} 
              prefix="₹" 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic 
              title="Net" 
              value={stats?.netAmount || 0} 
              prefix="₹" 
              valueStyle={{ color: (stats?.netAmount || 0) >= 0 ? '#52c41a' : '#ff4d4f' }} 
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Transaction Log"
        extra={
          <Space>
            <DatePicker.RangePicker 
              value={dateRange} 
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} 
            />
            <Select 
              placeholder="Type" 
              allowClear 
              style={{ width: 120 }} 
              value={typeFilter} 
              onChange={setTypeFilter} 
              options={[{ label: 'Debit', value: 'debit' }, { label: 'Credit', value: 'credit' }]} 
            />
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={data?.data || []} 
          rowKey="id" 
          loading={loading} 
          pagination={{ 
            current: data?.page, 
            pageSize: data?.pageSize, 
            total: data?.total,
            showSizeChanger: true,
          }} 
          size="middle" 
        />
      </Card>
    </Space>
  );
}
