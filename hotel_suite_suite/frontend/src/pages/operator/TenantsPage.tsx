import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Badge, 
  Button, 
  Card, 
  Space, 
  Table, 
  Tag, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Dropdown,
  message,
  Modal,
  Input,
  Select,
  Tooltip,
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  EyeOutlined, 
  SettingOutlined,
  StopOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  HomeOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { tenantService, type TenantFilters } from '@/api';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/config/plans';
import type { Tenant, PaginatedResponse, TenantStatus } from '@/types';
import CreateTenantModal from './CreateTenantModal';
import ModuleConfigDrawer from './ModuleConfigDrawer';

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<TenantStatus, { color: string; label: string }> = {
  trial: { color: 'processing', label: 'Trial' },
  active: { color: 'success', label: 'Active' },
  suspended: { color: 'error', label: 'Suspended' },
  cancelled: { color: 'default', label: 'Cancelled' },
};

export default function TenantsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Tenant> | null>(null);
  const [filters, setFilters] = useState<TenantFilters>({ page: 1, pageSize: 10 });
  const [stats, setStats] = useState<any>(null);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [moduleDrawerTenant, setModuleDrawerTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    loadTenants();
    loadStats();
  }, [filters]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const result = await tenantService.getAll(filters);
      setData(result);
    } catch (error) {
      message.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await tenantService.getStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (status: TenantStatus | undefined) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters(prev => ({ ...prev, page, pageSize }));
  };

  const handleStatusChange = async (tenant: Tenant, newStatus: TenantStatus) => {
    try {
      await tenantService.updateStatus(tenant.id, newStatus);
      message.success(`Hotel ${newStatus === 'active' ? 'activated' : newStatus}`);
      loadTenants();
      loadStats();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleDelete = (tenant: Tenant) => {
    Modal.confirm({
      title: 'Delete Hotel',
      content: (
        <div>
          <p>Are you sure you want to delete <strong>{tenant.name}</strong>?</p>
          <p style={{ color: '#ff4d4f' }}>This will remove all users and data associated with this hotel.</p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tenantService.delete(tenant.id);
          message.success('Hotel deleted successfully');
          loadTenants();
          loadStats();
        } catch (error) {
          message.error('Failed to delete hotel');
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    loadTenants();
    loadStats();
    message.success('Hotel created successfully!');
  };

  const handleModulesSaved = () => {
    setModuleDrawerTenant(null);
    loadTenants();
  };

  const columns: ColumnsType<Tenant> = [
    {
      title: 'Hotel',
      key: 'hotel',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{record.name}</Text>
            {record.status === 'trial' && (
              <Tag color="blue" style={{ fontSize: 10 }}>TRIAL</Tag>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.region}</Text>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'planId',
      key: 'plan',
      width: 120,
      render: (planId: string) => {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
        const colors: Record<string, string> = {
          starter: 'default',
          professional: 'blue',
          enterprise: 'purple',
          custom: 'gold',
        };
        return <Tag color={colors[planId]}>{plan?.name || planId}</Tag>;
      },
      filters: SUBSCRIPTION_PLANS.map(p => ({ text: p.name, value: p.id })),
      onFilter: (value, record) => record.planId === value,
    },
    {
      title: 'Modules',
      key: 'modules',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={record.enabledModules.map(m => m.toUpperCase()).join(', ')}>
          <Tag color="purple" style={{ cursor: 'pointer' }}>
            <AppstoreOutlined /> {record.enabledModules.length}/9
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Users',
      key: 'users',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <TeamOutlined />
          <span>{record.userCount || 0}</span>
          {record.maxUsers !== -1 && (
            <Text type="secondary" style={{ fontSize: 11 }}>/{record.maxUsers}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Rooms',
      key: 'rooms',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <HomeOutlined />
          <span>{record.roomCount || 0}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TenantStatus) => (
        <Badge
          status={STATUS_CONFIG[status].color as any}
          text={STATUS_CONFIG[status].label}
        />
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Trial', value: 'trial' },
        { text: 'Suspended', value: 'suspended' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Contact',
      dataIndex: 'contactEmail',
      key: 'contact',
      width: 200,
      ellipsis: true,
      render: (email: string) => (
        <Text copyable style={{ fontSize: 12 }}>{email}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Configure Modules">
            <Button 
              type="text" 
              icon={<SettingOutlined />} 
              onClick={() => setModuleDrawerTenant(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  icon: <EyeOutlined />,
                  label: 'View Details',
                  onClick: () => navigate(`/operator/tenants/${record.id}`),
                },
                {
                  key: 'modules',
                  icon: <AppstoreOutlined />,
                  label: 'Configure Modules',
                  onClick: () => setModuleDrawerTenant(record),
                },
                { type: 'divider' },
                ...(record.status === 'suspended' ? [{
                  key: 'activate',
                  icon: <PlayCircleOutlined />,
                  label: 'Activate',
                  onClick: () => handleStatusChange(record, 'active'),
                }] : []),
                ...(record.status === 'active' || record.status === 'trial' ? [{
                  key: 'suspend',
                  icon: <StopOutlined />,
                  label: 'Suspend',
                  danger: true,
                  onClick: () => handleStatusChange(record, 'suspended'),
                }] : []),
                { type: 'divider' },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Delete',
                  danger: true,
                  onClick: () => handleDelete(record),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Hotel Management</Title>
          <Text type="secondary">Add hotels, configure modules, and manage subscriptions</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setCreateModalOpen(true)}
        >
          Add New Hotel
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="Total Hotels" 
                value={stats.total} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="Active" 
                value={stats.active}
                suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {stats.total}</Text>}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="On Trial" 
                value={stats.trial}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="Total Users" 
                value={stats.totalUsers}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters & Table */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input.Search
              placeholder="Search hotels..."
              allowClear
              style={{ width: 280 }}
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              onSearch={handleSearch}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 150 }}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Trial', value: 'trial' },
                { label: 'Suspended', value: 'suspended' },
              ]}
              onChange={handleStatusFilter}
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadTenants} loading={loading}>
            Refresh
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: data?.page || 1,
            pageSize: data?.pageSize || 10,
            total: data?.total || 0,
            onChange: handlePageChange,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} hotels`,
          }}
        />
      </Card>

      {/* Create Hotel Modal */}
      <CreateTenantModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Module Configuration Drawer */}
      <ModuleConfigDrawer
        tenant={moduleDrawerTenant}
        onClose={() => setModuleDrawerTenant(null)}
        onSave={handleModulesSaved}
      />
    </Space>
  );
}
