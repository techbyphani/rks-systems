import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Statistic, DatePicker } from 'antd';
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';
import type { Transaction, TransactionType } from '@/types';

// Mock transactions
const mockTransactions: Transaction[] = [
  { id: 'txn-001', transactionNumber: 'TXN-2024-001', date: dayjs().format('YYYY-MM-DD'), accountId: 'acc-001', account: { name: 'Cash', code: '1000' } as any, type: 'credit', amount: 45000, balance: 1295000, description: 'Room payment - Folio #F-8931', createdAt: dayjs().toISOString(), updatedAt: dayjs().toISOString() },
  { id: 'txn-002', transactionNumber: 'TXN-2024-002', date: dayjs().format('YYYY-MM-DD'), accountId: 'acc-005', account: { name: 'Room Revenue', code: '4000' } as any, type: 'credit', amount: 45000, balance: 2895000, description: 'Room charge - Suite 210', createdAt: dayjs().toISOString(), updatedAt: dayjs().toISOString() },
  { id: 'txn-003', transactionNumber: 'TXN-2024-003', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), accountId: 'acc-003', account: { name: 'Accounts Payable', code: '2000' } as any, type: 'debit', amount: 28000, balance: 292000, description: 'Vendor payment - FreshServe Supplies', createdAt: dayjs().subtract(1, 'day').toISOString(), updatedAt: dayjs().subtract(1, 'day').toISOString() },
  { id: 'txn-004', transactionNumber: 'TXN-2024-004', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), accountId: 'acc-006', account: { name: 'F&B Revenue', code: '4100' } as any, type: 'credit', amount: 12500, balance: 902500, description: 'Restaurant sales', createdAt: dayjs().subtract(1, 'day').toISOString(), updatedAt: dayjs().subtract(1, 'day').toISOString() },
  { id: 'txn-005', transactionNumber: 'TXN-2024-005', date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), accountId: 'acc-008', account: { name: 'Utilities', code: '5100' } as any, type: 'debit', amount: 45000, balance: 290000, description: 'Electricity bill', createdAt: dayjs().subtract(2, 'day').toISOString(), updatedAt: dayjs().subtract(2, 'day').toISOString() },
];

export default function TransactionsPage() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => { loadTransactions(); }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    if (typeFilter && txn.type !== typeFilter) return false;
    if (dateRange) {
      const txnDate = dayjs(txn.date);
      if (txnDate.isBefore(dateRange[0], 'day') || txnDate.isAfter(dateRange[1], 'day')) return false;
    }
    return true;
  });

  const totalDebits = filteredTransactions.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = filteredTransactions.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);

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
        <Col xs={12} sm={8}><Card size="small"><Statistic title="Total Debits" value={totalDebits} prefix="₹" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col xs={12} sm={8}><Card size="small"><Statistic title="Total Credits" value={totalCredits} prefix="₹" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="Net" value={totalCredits - totalDebits} prefix="₹" valueStyle={{ color: totalCredits - totalDebits >= 0 ? '#52c41a' : '#ff4d4f' }} /></Card></Col>
      </Row>

      <Card
        title="Transaction Log"
        extra={
          <Space>
            <DatePicker.RangePicker onChange={(dates) => setDateRange(dates as any)} />
            <Select placeholder="Type" allowClear style={{ width: 120 }} value={typeFilter} onChange={setTypeFilter} options={[{ label: 'Debit', value: 'debit' }, { label: 'Credit', value: 'credit' }]} />
          </Space>
        }
      >
        <Table columns={columns} dataSource={filteredTransactions} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} size="middle" />
      </Card>
    </Space>
  );
}
