import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Badge,
  Dropdown,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Row,
  Col,
  message,
  Alert,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  StopOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { tenantUserService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import { MODULE_INFO } from '@/config/plans';
import { PageHeader } from '@/components/shared';
import type { TenantUser, TenantUserRole, ModuleId, CreateTenantUserDto } from '@/types';

const { Text } = Typography;

const ROLE_LABELS: Record<TenantUserRole, { label: string; color: string }> = {
  hotel_admin: { label: 'Admin', color: 'red' },
  manager: { label: 'Manager', color: 'blue' },
  supervisor: { label: 'Supervisor', color: 'purple' },
  staff: { label: 'Staff', color: 'default' },
};

export default function UserManagementPage() {
  const { tenant, user: currentUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (tenant) {
      loadUsers();
    }
  }, [tenant]);

  const loadUsers = async () => {
    if (!tenant) return;
    setLoading(true);
    try {
      const result = await tenantUserService.getAll({ 
        tenantId: tenant.id, 
        pageSize: 100 
      });
      setUsers(result.data);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'staff', moduleAccess: [] });
    setModalOpen(true);
  };

  const handleEdit = (user: TenantUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      moduleAccess: user.moduleAccess,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!tenant) return;
    
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        await tenantUserService.update(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        const data: CreateTenantUserDto = {
          tenantId: tenant.id,
          ...values,
        };
        await tenantUserService.create(data);
        message.success('User created successfully. Login credentials will be sent to their email.');
      }
      
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (user: TenantUser) => {
    try {
      await tenantUserService.toggleActive(user.id);
      message.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch (error) {
      message.error('Failed to update user status');
    }
  };

  const handleDelete = (user: TenantUser) => {
    Modal.confirm({
      title: 'Delete User',
      content: (
        <div>
          <p>Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>?</p>
          <p style={{ color: '#666' }}>This action cannot be undone.</p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tenantUserService.delete(user.id);
          message.success('User deleted');
          loadUsers();
        } catch (error: any) {
          message.error(error.message || 'Failed to delete user');
        }
      },
    });
  };

  const handleResetPassword = async (user: TenantUser) => {
    try {
      const result = await tenantUserService.resetPassword(user.id);
      Modal.success({
        title: 'Password Reset',
        content: (
          <div>
            <p>Temporary password for <strong>{user.email}</strong>:</p>
            <Text code copyable style={{ fontSize: 16 }}>{result.temporaryPassword}</Text>
            <p style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
              Please share this password securely. The user should change it on first login.
            </p>
          </div>
        ),
      });
    } catch (error) {
      message.error('Failed to reset password');
    }
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(searchLower) ||
      u.lastName.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  });

  const columns: ColumnsType<TenantUser> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{record.firstName} {record.lastName}</Text>
            {record.id === currentUser?.id && (
              <Tag color="green">You</Tag>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: TenantUserRole) => (
        <Tag color={ROLE_LABELS[role].color}>{ROLE_LABELS[role].label}</Tag>
      ),
      filters: Object.entries(ROLE_LABELS).map(([value, { label }]) => ({ text: label, value })),
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Module Access',
      key: 'modules',
      width: 220,
      render: (_, record) => (
        <Space wrap size={2}>
          {record.moduleAccess.slice(0, 4).map(m => (
            <Tag key={m} color={MODULE_INFO[m]?.color} style={{ fontSize: 10 }}>
              {m.toUpperCase()}
            </Tag>
          ))}
          {record.moduleAccess.length > 4 && (
            <Tag style={{ fontSize: 10 }}>+{record.moduleAccess.length - 4}</Tag>
          )}
          {record.moduleAccess.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>No modules</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Badge
          status={record.isActive ? 'success' : 'error'}
          text={record.isActive ? 'Active' : 'Inactive'}
        />
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLogin',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => {
        const isCurrentUser = record.id === currentUser?.id;
        
        return (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: 'Edit',
                  onClick: () => handleEdit(record),
                },
                {
                  key: 'reset-password',
                  icon: <KeyOutlined />,
                  label: 'Reset Password',
                  onClick: () => handleResetPassword(record),
                },
                { type: 'divider' },
                {
                  key: 'toggle-status',
                  icon: record.isActive ? <StopOutlined /> : <PlayCircleOutlined />,
                  label: record.isActive ? 'Deactivate' : 'Activate',
                  disabled: isCurrentUser,
                  onClick: () => handleToggleStatus(record),
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Delete',
                  danger: true,
                  disabled: isCurrentUser,
                  onClick: () => handleDelete(record),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  if (!tenant) return null;

  const activeCount = users.filter(u => u.isActive).length;
  const maxUsers = tenant.maxUsers;
  const atLimit = maxUsers !== -1 && users.length >= maxUsers;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="User Management"
        subtitle={`Manage staff accounts for ${tenant.name}`}
        breadcrumbs={[
          { label: 'Administration' },
          { label: 'Users' },
        ]}
        actions={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={atLimit}
          >
            Add User
          </Button>
        }
      />

      {/* Stats */}
      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Total Users" 
              value={users.length}
              suffix={maxUsers !== -1 ? `/ ${maxUsers}` : undefined}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Active" 
              value={activeCount}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Inactive" 
              value={users.length - activeCount}
              valueStyle={{ color: users.length - activeCount > 0 ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Admins" 
              value={users.filter(u => u.role === 'hotel_admin').length}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {atLimit && (
        <Alert
          message="User Limit Reached"
          description={`Your plan allows a maximum of ${maxUsers} users. Contact support to upgrade your plan.`}
          type="warning"
          showIcon
        />
      )}

      {/* Users Table */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Input.Search
            placeholder="Search users..."
            allowClear
            style={{ width: 280 }}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={loadUsers} loading={loading}>
            Refresh
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onOk={handleSave}
        okText={editingUser ? 'Update' : 'Create'}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Doe" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'email', message: 'Invalid email' },
                ]}
              >
                <Input placeholder="john@hotel.com" disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="+91-9876543210" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Required' }]}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Admins can manage users. Managers can view all data. Staff have limited access.
              </Text>
            }
          >
            <Select
              options={[
                { label: 'Hotel Admin', value: 'hotel_admin' },
                { label: 'Manager', value: 'manager' },
                { label: 'Supervisor', value: 'supervisor' },
                { label: 'Staff', value: 'staff' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="moduleAccess"
            label="Module Access"
            rules={[{ required: true, message: 'Select at least one module', type: 'array', min: 1 }]}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Only modules enabled for your hotel are shown.
              </Text>
            }
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[8, 8]}>
                {tenant.enabledModules.map(moduleId => {
                  const info = MODULE_INFO[moduleId];
                  return (
                    <Col span={8} key={moduleId}>
                      <Checkbox value={moduleId}>
                        <Space size={4}>
                          <Tag color={info?.color} style={{ margin: 0 }}>{moduleId.toUpperCase()}</Tag>
                          <Text style={{ fontSize: 12 }}>{info?.shortName}</Text>
                        </Space>
                      </Checkbox>
                    </Col>
                  );
                })}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          {!editingUser && (
            <Alert
              message="Login credentials will be emailed"
              description="The user will receive an email with their login credentials."
              type="info"
              showIcon
            />
          )}
        </Form>
      </Modal>
    </Space>
  );
}
