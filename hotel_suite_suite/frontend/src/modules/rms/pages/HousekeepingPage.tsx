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
  Badge,
  Avatar,
  Progress,
  Table,
  Dropdown,
  DatePicker,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MoreOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { PageHeader, StatusTag } from '@/components/shared';
import { taskService } from '@/api';
import type { HousekeepingTask, HousekeepingTaskStatus } from '@/types';

const { Text, Title } = Typography;

const STATUS_COLORS: Record<HousekeepingTaskStatus, string> = {
  pending: 'default',
  assigned: 'blue',
  in_progress: 'gold',
  completed: 'green',
  verified: 'purple',
  skipped: 'default',
};

// Mock housekeeping tasks for demo
const mockHousekeepingTasks: HousekeepingTask[] = [
  {
    id: 'HK001',
    roomId: 'room-101',
    room: { roomNumber: '101', floor: 1 } as any,
    type: 'checkout_clean',
    status: 'pending',
    priority: 'high',
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    updatedAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: 'HK002',
    roomId: 'room-205',
    room: { roomNumber: '205', floor: 2 } as any,
    type: 'stayover_clean',
    status: 'in_progress',
    priority: 'normal',
    assignedTo: 'emp-001',
    assignedEmployee: { firstName: 'Maria', lastName: 'Garcia' } as any,
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    startedAt: dayjs().subtract(30, 'minute').toISOString(),
    createdAt: dayjs().subtract(3, 'hour').toISOString(),
    updatedAt: dayjs().subtract(30, 'minute').toISOString(),
  },
  {
    id: 'HK003',
    roomId: 'room-301',
    room: { roomNumber: '301', floor: 3 } as any,
    type: 'checkout_clean',
    status: 'completed',
    priority: 'normal',
    assignedTo: 'emp-002',
    assignedEmployee: { firstName: 'Ana', lastName: 'Lopez' } as any,
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    startedAt: dayjs().subtract(2, 'hour').toISOString(),
    completedAt: dayjs().subtract(1, 'hour').toISOString(),
    createdAt: dayjs().subtract(4, 'hour').toISOString(),
    updatedAt: dayjs().subtract(1, 'hour').toISOString(),
  },
  {
    id: 'HK004',
    roomId: 'room-402',
    room: { roomNumber: '402', floor: 4 } as any,
    type: 'deep_clean',
    status: 'assigned',
    priority: 'low',
    assignedTo: 'emp-003',
    assignedEmployee: { firstName: 'Carlos', lastName: 'Silva' } as any,
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    createdAt: dayjs().subtract(5, 'hour').toISOString(),
    updatedAt: dayjs().subtract(1, 'hour').toISOString(),
  },
];

export default function HousekeepingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<HousekeepingTask[]>(mockHousekeepingTasks);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [statusFilter, setStatusFilter] = useState<HousekeepingTaskStatus | undefined>();

  const loadTasks = async () => {
    setLoading(true);
    try {
      // In real implementation, call API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTasks(mockHousekeepingTasks);
    } catch (error) {
      message.error('Failed to load housekeeping tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  const filteredTasks = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks;

  const taskCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completedPercentage = Math.round(
    ((taskCounts.completed || 0) + (taskCounts.verified || 0)) / tasks.length * 100
  ) || 0;

  const handleStatusUpdate = async (taskId: string, newStatus: HousekeepingTaskStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                startedAt: newStatus === 'in_progress' ? dayjs().toISOString() : t.startedAt,
                completedAt: newStatus === 'completed' ? dayjs().toISOString() : t.completedAt,
              }
            : t
        )
      );
      message.success('Task status updated');
    } catch (error) {
      message.error('Failed to update task');
    }
  };

  const columns: ColumnsType<HousekeepingTask> = [
    {
      title: 'Room',
      key: 'room',
      width: 100,
      render: (_, record) => (
        <Text strong>{record.room?.roomNumber || 'N/A'}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: string) => {
        const labels: Record<string, string> = {
          checkout_clean: 'Checkout Clean',
          stayover_clean: 'Stayover Clean',
          deep_clean: 'Deep Clean',
          turndown: 'Turndown',
          inspection: 'Inspection',
        };
        return <Tag>{labels[type] || type}</Tag>;
      },
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
          urgent: 'red',
        };
        return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Assigned To',
      key: 'assignee',
      width: 160,
      render: (_, record) =>
        record.assignedEmployee ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
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
      render: (status: HousekeepingTaskStatus) => (
        <Tag color={STATUS_COLORS[status]}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Time',
      key: 'time',
      width: 120,
      render: (_, record) => {
        if (record.completedAt) {
          return <Text type="secondary">Completed {dayjs(record.completedAt).fromNow()}</Text>;
        }
        if (record.startedAt) {
          return <Text type="warning">Started {dayjs(record.startedAt).fromNow()}</Text>;
        }
        return <Text type="secondary">Scheduled</Text>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              ...(record.status === 'pending' || record.status === 'assigned'
                ? [
                    {
                      key: 'start',
                      icon: <PlayCircleOutlined />,
                      label: 'Start',
                      onClick: () => handleStatusUpdate(record.id, 'in_progress'),
                    },
                  ]
                : []),
              ...(record.status === 'in_progress'
                ? [
                    {
                      key: 'complete',
                      icon: <CheckOutlined />,
                      label: 'Complete',
                      onClick: () => handleStatusUpdate(record.id, 'completed'),
                    },
                  ]
                : []),
              ...(record.status === 'completed'
                ? [
                    {
                      key: 'verify',
                      icon: <CheckCircleOutlined />,
                      label: 'Verify',
                      onClick: () => handleStatusUpdate(record.id, 'verified'),
                    },
                  ]
                : []),
              {
                key: 'view',
                label: 'View Room',
                onClick: () => navigate(`/suite/rms/rooms/${record.roomId}`),
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
      <PageHeader
        title="Housekeeping"
        subtitle="Manage room cleaning tasks and assignments"
        breadcrumbs={[
          { label: 'RMS', path: '/suite/rms' },
          { label: 'Housekeeping' },
        ]}
        actions={
          <Button icon={<ReloadOutlined />} onClick={loadTasks}>
            Refresh
          </Button>
        }
      />

      {/* Summary Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Space>
              <Badge color="gold" />
              <Text>Pending</Text>
            </Space>
            <Title level={3} style={{ margin: '8px 0 0' }}>
              {taskCounts.pending || 0}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Space>
              <Badge color="blue" />
              <Text>In Progress</Text>
            </Space>
            <Title level={3} style={{ margin: '8px 0 0' }}>
              {taskCounts.in_progress || 0}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Space>
              <Badge color="green" />
              <Text>Completed</Text>
            </Space>
            <Title level={3} style={{ margin: '8px 0 0' }}>
              {(taskCounts.completed || 0) + (taskCounts.verified || 0)}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Text>Today's Progress</Text>
            <Progress percent={completedPercentage} status="active" style={{ marginTop: 8 }} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small">
        <Row gutter={16} align="middle">
          <Col>
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              format="DD MMM YYYY"
            />
          </Col>
          <Col>
            <Select
              placeholder="All Statuses"
              allowClear
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Assigned', value: 'assigned' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Completed', value: 'completed' },
                { label: 'Verified', value: 'verified' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Task Table */}
      <Card title={`Tasks for ${selectedDate.format('DD MMM YYYY')}`}>
        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </Space>
  );
}
