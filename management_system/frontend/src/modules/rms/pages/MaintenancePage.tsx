import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Space,
  Typography,
  Spin,
  message,
  Tag,
  Button,
  Select,
  Table,
  Dropdown,
  Drawer,
  Form,
  Input,
  Statistic,
  Badge,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  ToolOutlined,
  MoreOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, StatusTag } from '@/components/shared';
import { maintenanceService } from '@/api';
import type { MaintenanceRequest, MaintenanceRequestStatus, MaintenanceCategory } from '@/types';
import { useAppContext } from '@/context/AppContext';

const { Text, Title } = Typography;

const STATUS_COLORS: Record<MaintenanceRequestStatus, string> = {
  reported: 'orange',
  acknowledged: 'blue',
  in_progress: 'gold',
  on_hold: 'default',
  completed: 'green',
  cancelled: 'red',
};

const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  furniture: 'Furniture',
  appliance: 'Appliance',
  structural: 'Structural',
  other: 'Other',
};

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<MaintenanceRequestStatus | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<MaintenanceCategory | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const loadRequests = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const response = await maintenanceService.getAll(tenant.id, {
        status: statusFilter,
        category: categoryFilter,
        pageSize: 100,
      });
      setRequests(response.data);
    } catch (error) {
      message.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      loadRequests();
    }
  }, [tenant?.id, statusFilter, categoryFilter]);

  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCreateRequest = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      await maintenanceService.create(tenant.id, {
        roomId: values.roomId,
        location: values.location,
        category: values.category,
        description: values.description,
        priority: values.priority,
        reportedBy: 'current-user',
      });
      setDrawerOpen(false);
      form.resetFields();
      message.success('Maintenance request created');
      loadRequests();
    } catch (error: any) {
      message.error(error.message || 'Failed to create request');
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: MaintenanceRequestStatus) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      if (newStatus === 'acknowledged') {
        await maintenanceService.acknowledge(tenant.id, requestId);
      } else if (newStatus === 'in_progress') {
        await maintenanceService.start(tenant.id, requestId);
      } else if (newStatus === 'completed') {
        await maintenanceService.complete(tenant.id, requestId, 'Issue resolved');
      } else if (newStatus === 'on_hold') {
        await maintenanceService.putOnHold(tenant.id, requestId);
      } else {
        await maintenanceService.update(tenant.id, requestId, { status: newStatus });
      }
      message.success('Request status updated');
      loadRequests();
    } catch (error: any) {
      message.error(error.message || 'Failed to update request');
    }
  };

  const columns: ColumnsType<MaintenanceRequest> = [
    {
      title: 'Ticket',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 130,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Location',
      key: 'location',
      width: 100,
      render: (_, record) =>
        record.room ? `Room ${record.room.roomNumber}` : record.location || '-',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (category: MaintenanceCategory) => (
        <Tag color="blue">{CATEGORY_LABELS[category]}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colors: Record<string, string> = {
          low: 'default',
          normal: 'blue',
          high: 'orange',
          emergency: 'red',
        };
        return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Assigned To',
      key: 'assignee',
      width: 150,
      render: (_, record) =>
        record.assignedEmployee ? (
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
              {record.assignedEmployee.firstName[0]}
            </Avatar>
            <Text>
              {record.assignedEmployee.firstName} {record.assignedEmployee.lastName}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">Unassigned</Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: MaintenanceRequestStatus) => (
        <Tag color={STATUS_COLORS[status]}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD MMM HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              ...(record.status === 'reported'
                ? [
                    {
                      key: 'acknowledge',
                      label: 'Acknowledge',
                      onClick: () => handleStatusUpdate(record.id, 'acknowledged'),
                    },
                  ]
                : []),
              ...(record.status === 'acknowledged'
                ? [
                    {
                      key: 'start',
                      label: 'Start Work',
                      onClick: () => handleStatusUpdate(record.id, 'in_progress'),
                    },
                  ]
                : []),
              ...(record.status === 'in_progress'
                ? [
                    {
                      key: 'complete',
                      label: 'Mark Complete',
                      onClick: () => handleStatusUpdate(record.id, 'completed'),
                    },
                    {
                      key: 'hold',
                      label: 'Put On Hold',
                      onClick: () => handleStatusUpdate(record.id, 'on_hold'),
                    },
                  ]
                : []),
              ...(record.roomId
                ? [
                    {
                      key: 'view-room',
                      label: 'View Room',
                      onClick: () => navigate(`/suite/rms/rooms/${record.roomId}`),
                    },
                  ]
                : []),
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
      <PageHeader
        title="Maintenance Requests"
        subtitle="Track and manage maintenance issues"
        breadcrumbs={[
          { label: 'RMS', path: '/suite/rms' },
          { label: 'Maintenance' },
        ]}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadRequests}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              New Request
            </Button>
          </Space>
        }
      />

      {/* Summary Stats */}
      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Open"
              value={(statusCounts.reported || 0) + (statusCounts.acknowledged || 0)}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="In Progress"
              value={statusCounts.in_progress || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Completed Today"
              value={statusCounts.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="On Hold"
              value={statusCounts.on_hold || 0}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small">
        <Space wrap>
          <Select
            placeholder="All Statuses"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(STATUS_COLORS).map(([value, color]) => ({
              label: value.replace(/_/g, ' ').toUpperCase(),
              value,
            }))}
          />
          <Select
            placeholder="All Categories"
            allowClear
            style={{ width: 150 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
              label,
              value,
            }))}
          />
        </Space>
      </Card>

      {/* Request Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      {/* New Request Drawer */}
      <Drawer
        title="New Maintenance Request"
        width={500}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Submit
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRequest}>
          <Form.Item name="location" label="Location">
            <Input placeholder="Room number or location (e.g., Lobby, Pool Area)" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Category is required' }]}
          >
            <Select
              placeholder="Select category"
              options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                label,
                value,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Priority is required' }]}
          >
            <Select
              placeholder="Select priority"
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Normal', value: 'normal' },
                { label: 'High', value: 'high' },
                { label: 'Emergency', value: 'emergency' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input.TextArea rows={4} placeholder="Describe the issue in detail..." />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
