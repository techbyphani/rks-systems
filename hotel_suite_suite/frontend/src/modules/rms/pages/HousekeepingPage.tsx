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
import { housekeepingService } from '@/api';
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

export default function HousekeepingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [statusFilter, setStatusFilter] = useState<HousekeepingTaskStatus | undefined>();

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await housekeepingService.getAll({
        scheduledDate: selectedDate.format('YYYY-MM-DD'),
        status: statusFilter,
        pageSize: 100,
      });
      setTasks(response.data);
    } catch (error) {
      message.error('Failed to load housekeeping tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedDate, statusFilter]);

  const taskCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completedPercentage = Math.round(
    ((taskCounts.completed || 0) + (taskCounts.verified || 0)) / tasks.length * 100
  ) || 0;

  const handleStatusUpdate = async (taskId: string, newStatus: HousekeepingTaskStatus) => {
    try {
      if (newStatus === 'in_progress') {
        await housekeepingService.start(taskId);
      } else if (newStatus === 'completed') {
        await housekeepingService.complete(taskId);
      } else if (newStatus === 'verified') {
        await housekeepingService.verify(taskId, 'current-user');
      } else {
        await housekeepingService.update(taskId, { status: newStatus });
      }
      message.success('Task status updated');
      loadTasks();
    } catch (error: any) {
      message.error(error.message || 'Failed to update task');
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
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </Space>
  );
}
