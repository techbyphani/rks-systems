import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Statistic, Tree, Input } from 'antd';
import { PlusOutlined, SearchOutlined, BankOutlined, DollarOutlined, FundOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TreeDataNode } from 'antd';
import { PageHeader } from '@/components/shared';
import type { Account, AccountType } from '@/types';

const TYPE_COLORS: Record<AccountType, string> = { asset: 'green', liability: 'red', equity: 'purple', revenue: 'blue', expense: 'orange' };

// Mock accounts data
const mockAccounts: Account[] = [
  { id: 'acc-001', code: '1000', name: 'Cash', type: 'asset', balance: 1250000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: '', updatedAt: '' },
  { id: 'acc-002', code: '1100', name: 'Accounts Receivable', type: 'asset', balance: 450000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: '', updatedAt: '' },
  { id: 'acc-003', code: '2000', name: 'Accounts Payable', type: 'liability', balance: 320000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: '', updatedAt: '' },
  { id: 'acc-004', code: '3000', name: 'Equity', type: 'equity', balance: 5000000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: '', updatedAt: '' },
  { id: 'acc-005', code: '4000', name: 'Room Revenue', type: 'revenue', balance: 2850000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: '', updatedAt: '' },
  { id: 'acc-006', code: '4100', name: 'F&B Revenue', type: 'revenue', balance: 890000, currency: 'INR', isActive: true, isSystemAccount: true, createdAt: '', updatedAt: '' },
  { id: 'acc-007', code: '5000', name: 'Salaries & Wages', type: 'expense', balance: 980000, currency: 'INR', isActive: true, isSystemAccount: false, createdAt: '', updatedAt: '' },
  { id: 'acc-008', code: '5100', name: 'Utilities', type: 'expense', balance: 245000, currency: 'INR', isActive: true, isSystemAccount: false, createdAt: '', updatedAt: '' },
];

export default function AccountsPage() {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountType | undefined>();

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setAccounts(mockAccounts);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (search && !acc.name.toLowerCase().includes(search.toLowerCase()) && !acc.code.includes(search)) return false;
    if (typeFilter && acc.type !== typeFilter) return false;
    return true;
  });

  const totalAssets = accounts.filter((a) => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter((a) => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = accounts.filter((a) => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = accounts.filter((a) => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0);

  const columns: ColumnsType<Account> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 80 },
    { title: 'Account Name', dataIndex: 'name', key: 'name', width: 200, render: (value) => <span style={{ fontWeight: 500 }}>{value}</span> },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 100, render: (type: AccountType) => <Tag color={TYPE_COLORS[type]}>{type.toUpperCase()}</Tag> },
    { title: 'Balance', dataIndex: 'balance', key: 'balance', width: 150, align: 'right', render: (value: number, record) => <span style={{ color: ['revenue', 'asset'].includes(record.type) ? '#52c41a' : ['expense', 'liability'].includes(record.type) ? '#ff4d4f' : undefined }}>₹{value.toLocaleString('en-IN')}</span> },
    { title: 'System', dataIndex: 'isSystemAccount', key: 'isSystemAccount', width: 80, render: (value: boolean) => value ? <Tag>System</Tag> : null },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', width: 80, render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag> },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage financial accounts"
        breadcrumbs={[{ label: 'Accounting', path: '/suite/as' }, { label: 'Accounts' }]}
        actions={<Button type="primary" icon={<PlusOutlined />}>Add Account</Button>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Assets" value={totalAssets} prefix="₹" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Liabilities" value={totalLiabilities} prefix="₹" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Revenue" value={totalRevenue} prefix="₹" valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Expenses" value={totalExpenses} prefix="₹" valueStyle={{ color: '#fa8c16' }} /></Card></Col>
      </Row>

      <Card
        title="All Accounts"
        extra={
          <Space>
            <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 180 }} allowClear />
            <Select placeholder="Type" allowClear style={{ width: 120 }} value={typeFilter} onChange={setTypeFilter} options={Object.keys(TYPE_COLORS).map((t) => ({ label: t.toUpperCase(), value: t }))} />
          </Space>
        }
      >
        <Table columns={columns} dataSource={filteredAccounts} rowKey="id" loading={loading} pagination={false} size="middle" />
      </Card>
    </Space>
  );
}
