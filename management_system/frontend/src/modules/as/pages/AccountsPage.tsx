import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Statistic, Input, Drawer, Form } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/shared';
import { accountService, type AccountFilters } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Account, AccountType } from '@/types';

const TYPE_COLORS: Record<AccountType, string> = { asset: 'green', liability: 'red', equity: 'purple', revenue: 'blue', expense: 'orange' };

export default function AccountsPage() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<{
    totalAssets: number;
    totalLiabilities: number;
    totalRevenue: number;
    totalExpenses: number;
  } | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountType | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { 
    if (tenant?.id) {
      loadAccounts();
      loadStats();
    }
  }, [search, typeFilter, tenant?.id]);

  const loadAccounts = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const filters: AccountFilters = {
        search: search || undefined,
        type: typeFilter,
      };
      const data = await accountService.getAll(tenant.id, filters);
      setAccounts(data);
    } catch (error) {
      message.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!tenant?.id) return;
    try {
      const statsData = await accountService.getStats(tenant.id);
      setStats({
        totalAssets: statsData.totalAssets,
        totalLiabilities: statsData.totalLiabilities,
        totalRevenue: statsData.totalRevenue,
        totalExpenses: statsData.totalExpenses,
      });
    } catch (error) {
      // Silent fail for stats
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue(account);
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      if (editingAccount) {
        await accountService.update(tenant.id, editingAccount.id, values);
        message.success('Account updated successfully');
      } else {
        await accountService.create(tenant.id, values);
        message.success('Account created successfully');
      }
      setDrawerOpen(false);
      setEditingAccount(null);
      form.resetFields();
      loadAccounts();
      loadStats();
    } catch (error: any) {
      message.error(error.message || 'Failed to save account');
    }
  };

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
        actions={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAccount(null);
              form.resetFields();
              setDrawerOpen(true);
            }}
          >
            Add Account
          </Button>
        }
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Total Assets" 
              value={stats?.totalAssets || 0} 
              prefix="₹" 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Total Liabilities" 
              value={stats?.totalLiabilities || 0} 
              prefix="₹" 
              valueStyle={{ color: '#ff4d4f' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Total Revenue" 
              value={stats?.totalRevenue || 0} 
              prefix="₹" 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Total Expenses" 
              value={stats?.totalExpenses || 0} 
              prefix="₹" 
              valueStyle={{ color: '#fa8c16' }} 
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="All Accounts"
        extra={
          <Space>
            <Input 
              placeholder="Search..." 
              prefix={<SearchOutlined />} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ width: 180 }} 
              allowClear 
            />
            <Select 
              placeholder="Type" 
              allowClear 
              style={{ width: 120 }} 
              value={typeFilter} 
              onChange={setTypeFilter} 
              options={Object.keys(TYPE_COLORS).map((t) => ({ label: t.toUpperCase(), value: t }))} 
            />
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={accounts} 
          rowKey="id" 
          loading={loading} 
          pagination={false} 
          size="middle" 
        />
      </Card>

      <Drawer
        title={editingAccount ? 'Edit Account' : 'Add Account'}
        width={600}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingAccount(null);
          form.resetFields();
        }}
        extra={
          <Space>
            <Button onClick={() => {
              setDrawerOpen(false);
              setEditingAccount(null);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              Save
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="code"
            label="Account Code"
            rules={[{ required: true, message: 'Account code is required' }]}
          >
            <Input placeholder="e.g., 1000" disabled={!!editingAccount?.isSystemAccount} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Account Name"
            rules={[{ required: true, message: 'Account name is required' }]}
          >
            <Input placeholder="Enter account name" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Account Type"
            rules={[{ required: true, message: 'Account type is required' }]}
          >
            <Select
              placeholder="Select account type"
              disabled={!!editingAccount?.isSystemAccount}
              options={Object.keys(TYPE_COLORS).map((t) => ({
                label: t.toUpperCase(),
                value: t,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="currency"
            label="Currency"
            initialValue="INR"
          >
            <Select
              options={[
                { label: 'INR - Indian Rupee', value: 'INR' },
                { label: 'USD - US Dollar', value: 'USD' },
                { label: 'EUR - Euro', value: 'EUR' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
