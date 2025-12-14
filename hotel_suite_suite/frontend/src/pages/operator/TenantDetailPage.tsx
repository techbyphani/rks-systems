import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Spin,
  Tag,
  Statistic,
  Divider,
  Table,
  Badge,
  Dropdown,
  message,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Descriptions,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  SettingOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  PlayCircleOutlined,
  KeyOutlined,
  TeamOutlined,
  HomeOutlined,
  AppstoreOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { tenantService, tenantUserService } from '@/api';
import { SUBSCRIPTION_PLANS, MODULE_INFO, formatPrice } from '@/config/plans';
import type { Tenant, TenantUser, ModuleId, CreateTenantUserDto, TenantUserRole } from '@/types';
import ModuleConfigDrawer from './ModuleConfigDrawer';

const { Title, Text, Paragraph } = Typography;

const ROLE_LABELS: Record<TenantUserRole, { label: string; color: string }> = {
  hotel_admin: { label: 'Admin', color: 'red' },
  manager: { label: 'Manager', color: 'blue' },
  supervisor: { label: 'Supervisor', color: 'purple' },
  staff: { label: 'Staff', color: 'default' },
};

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Modals
  const [moduleDrawerOpen, setModuleDrawerOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadTenant();
      loadUsers();
    }
  }, [id]);

  const loadTenant = async () => {
    setLoading(true);
    try {
      const result = await tenantService.getById(id!);
      setTenant(result);
    } catch (error) {
      message.error('Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const result = await tenantUserService.getAll({ tenantId: id, pageSize: 100 });
      setUsers(result.data);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setUserModalOpen(true);
  };

  const handleEditUser = (user: TenantUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      moduleAccess: user.moduleAccess,
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        await tenantUserService.update(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        const data: CreateTenantUserDto = {
          tenantId: id!,
          ...values,
        };
        await tenantUserService.create(data);
        message.success('User created successfully');
      }
      
      setUserModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      message.error(error.message || 'Failed to save user');
    }
  };

  const handleToggleUserStatus = async (user: TenantUser) => {
    try {
      await tenantUserService.toggleActive(user.id);
      message.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch (error) {
      message.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (user: TenantUser) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
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
            <Text code copyable>{result.temporaryPassword}</Text>
            <p style={{ marginTop: 12, color: '#666' }}>
              The user should change this password on first login.
            </p>
          </div>
        ),
      });
    } catch (error) {
      message.error('Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <Card>
        <Alert
          message="Hotel not found"
          description="The requested hotel could not be found."
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/operator/tenants')}>
              Back to Hotels
            </Button>
          }
        />
      </Card>
    );
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === tenant.planId);

  const userColumns: ColumnsType<TenantUser> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.firstName} {record.lastName}</Text>
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
    },
    {
      title: 'Modules',
      key: 'modules',
      width: 200,
      render: (_, record) => (
        <Space wrap size={2}>
          {record.moduleAccess.slice(0, 4).map(m => (
            <Tag key={m} style={{ fontSize: 10 }}>{m.toUpperCase()}</Tag>
          ))}
          {record.moduleAccess.length > 4 && (
            <Tag style={{ fontSize: 10 }}>+{record.moduleAccess.length - 4}</Tag>
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
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLogin',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => handleEditUser(record),
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
                onClick: () => handleToggleUserStatus(record),
              },
              { type: 'divider' },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => handleDeleteUser(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Space>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/operator/tenants')}
          />
          <div>
            <Space align="center">
              <Title level={3} style={{ margin: 0 }}>{tenant.name}</Title>
              <Badge
                status={tenant.status === 'active' ? 'success' : tenant.status === 'trial' ? 'processing' : 'error'}
                text={tenant.status.toUpperCase()}
              />
            </Space>
            <Text type="secondary">{tenant.region}</Text>
          </div>
        </Space>
        <Space>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => setModuleDrawerOpen(true)}
          >
            Configure Modules
          </Button>
        </Space>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Plan"
              value={plan?.name || tenant.planId}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Modules"
              value={tenant.enabledModules.length}
              suffix="/ 9"
              prefix={<AppstoreOutlined />}
              valueStyle={{ fontSize: 18, color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Users"
              value={users.length}
              suffix={tenant.maxUsers !== -1 ? `/ ${tenant.maxUsers}` : ''}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: 18, color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Rooms"
              value={tenant.roomCount || 0}
              prefix={<HomeOutlined />}
              valueStyle={{ fontSize: 18, color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Details & Modules */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Hotel Details">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Contact Email">
                <Space>
                  <MailOutlined />
                  <Text copyable>{tenant.contactEmail}</Text>
                </Space>
              </Descriptions.Item>
              {tenant.contactPhone && (
                <Descriptions.Item label="Contact Phone">
                  <Space>
                    <PhoneOutlined />
                    <Text>{tenant.contactPhone}</Text>
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Timezone">{tenant.timezone}</Descriptions.Item>
              <Descriptions.Item label="Currency">{tenant.currency}</Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </Descriptions.Item>
              {tenant.subscribedAt && (
                <Descriptions.Item label="Subscribed">
                  {new Date(tenant.subscribedAt).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {tenant.trialEndsAt && (
                <Descriptions.Item label="Trial Ends">
                  <Text type="warning">
                    {new Date(tenant.trialEndsAt).toLocaleDateString()}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="Enabled Modules" 
            extra={
              <Button 
                type="link" 
                size="small"
                onClick={() => setModuleDrawerOpen(true)}
              >
                Configure
              </Button>
            }
          >
            <Space wrap>
              {tenant.enabledModules.map(moduleId => {
                const info = MODULE_INFO[moduleId];
                return (
                  <Tag 
                    key={moduleId} 
                    color={info.color}
                    style={{ padding: '4px 12px' }}
                  >
                    <strong>{moduleId.toUpperCase()}</strong>
                    <span style={{ marginLeft: 4, opacity: 0.8 }}>{info.shortName}</span>
                  </Tag>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Users Section */}
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>Users</span>
            <Tag>{users.length}</Tag>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddUser}
          >
            Add User
          </Button>
        }
      >
        <Table
          columns={userColumns}
          dataSource={users}
          rowKey="id"
          loading={usersLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Module Config Drawer */}
      <ModuleConfigDrawer
        tenant={moduleDrawerOpen ? tenant : null}
        onClose={() => setModuleDrawerOpen(false)}
        onSave={() => {
          setModuleDrawerOpen(false);
          loadTenant();
        }}
      />

      {/* User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={userModalOpen}
        onCancel={() => {
          setUserModalOpen(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onOk={handleSaveUser}
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
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
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
                <Input disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Required' }]}
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
            rules={[{ required: true, message: 'Select at least one module' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[8, 8]}>
                {tenant.enabledModules.map(moduleId => {
                  const info = MODULE_INFO[moduleId];
                  return (
                    <Col span={8} key={moduleId}>
                      <Checkbox value={moduleId}>
                        <Tag color={info.color}>{moduleId.toUpperCase()}</Tag>
                      </Checkbox>
                    </Col>
                  );
                })}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          {!editingUser && (
            <Alert
              message="Login credentials will be sent to the user's email"
              type="info"
              showIcon
            />
          )}
        </Form>
      </Modal>
    </Space>
  );
}
