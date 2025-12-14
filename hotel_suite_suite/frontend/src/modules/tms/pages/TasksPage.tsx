import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Input, Statistic, Dropdown, Avatar, Progress } from 'antd';
import { PlusOutlined, ReloadOutlined, MoreOutlined, CheckOutlined, ClockCircleOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, StatusTag } from '@/components/shared';
import { taskService, type TaskFilters } from '@/api';
import type { Task, TaskStatus, TaskPriority, TaskCategory, PaginatedResponse } from '@/types';

const STATUS_COLORS: Record<TaskStatus, string> = { pending: 'default', assigned: 'blue', in_progress: 'gold', on_hold: 'orange', completed: 'green', cancelled: 'default', overdue: 'red' };
const PRIORITY_COLORS: Record<TaskPriority, string> = { low: 'default', normal: 'blue', high: 'orange', urgent: 'red' };
const CATEGORY_COLORS: Record<TaskCategory, string> = { housekeeping: 'cyan', maintenance: 'purple', guest_request: 'blue', internal: 'default', event: 'magenta', inspection: 'gold', delivery: 'green', other: 'default' };

export default function TasksPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Task> | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({ page: 1, pageSize: 20 });

  useEffect(() => { loadTasks(); }, [filters]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const result = await taskService.getAll(filters);
      setData(result);
    } catch (error) {
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateStatus(taskId, newStatus);
      message.success('Task updated');
      loadTasks();
    } catch (error) {
      message.error('Failed to update task');
    }
  };

  const stats = {
    pending: data?.data.filter((t) => t.status === 'pending').length || 0,
    inProgress: data?.data.filter((t) => t.status === 'in_progress').length || 0,
    overdue: data?.data.filter((t) => t.status === 'overdue').length || 0,
    completedToday: data?.data.filter((t) => t.status === 'completed' && t.completedAt?.startsWith(dayjs().format('YYYY-MM-DD'))).length || 0,
  };

  const columns: ColumnsType<Task> = [
    { title: 'Task #', dataIndex: 'taskNumber', key: 'taskNumber', width: 100, render: (value) => <span style={{ fontWeight: 500 }}>{value}</span> },
    { title: 'Title', dataIndex: 'title', key: 'title', width: 250, ellipsis: true },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 120, render: (cat: TaskCategory) => <Tag color={CATEGORY_COLORS[cat]}>{cat.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100, render: (priority: TaskPriority) => <Tag color={PRIORITY_COLORS[priority]}>{priority.toUpperCase()}</Tag> },
    {
      title: 'Assigned To',
      key: 'assignee',
      width: 150,
      render: (_, record) => record.assignedEmployee ? (
        <Space><Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{record.assignedEmployee.firstName[0]}</Avatar><span>{record.assignedEmployee.firstName}</span></Space>
      ) : <Tag>Unassigned</Tag>,
    },
    { title: 'Due', dataIndex: 'dueDate', key: 'dueDate', width: 100, render: (date: string) => <span style={{ color: dayjs().isAfter(dayjs(date)) ? '#ff4d4f' : undefined }}>{dayjs(date).format('DD MMM')}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (status: TaskStatus) => <Tag color={STATUS_COLORS[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Tag> },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              ...(record.status === 'pending' ? [{ key: 'start', label: 'Start', onClick: () => handleStatusUpdate(record.id, 'in_progress') }] : []),
              ...(record.status === 'in_progress' ? [{ key: 'complete', label: 'Complete', onClick: () => handleStatusUpdate(record.id, 'completed') }] : []),
              { key: 'view', label: 'View Details' },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const categories: TaskCategory[] = ['housekeeping', 'maintenance', 'guest_request', 'internal', 'event', 'inspection', 'delivery', 'other'];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Task Management"
        subtitle="Track and manage operational tasks"
        breadcrumbs={[{ label: 'TMS', path: '/suite/tms' }, { label: 'Tasks' }]}
        actions={<Space><Button icon={<ReloadOutlined />} onClick={loadTasks}>Refresh</Button><Button type="primary" icon={<PlusOutlined />}>New Task</Button></Space>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Pending" value={stats.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="In Progress" value={stats.inProgress} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Overdue" value={stats.overdue} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Completed Today" value={stats.completedToday} prefix={<CheckOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card
        title="All Tasks"
        extra={
          <Space>
            <Input placeholder="Search..." prefix={<SearchOutlined />} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))} style={{ width: 180 }} allowClear />
            <Select placeholder="Category" allowClear style={{ width: 140 }} onChange={(v) => setFilters((p) => ({ ...p, category: v, page: 1 }))} options={categories.map((c) => ({ label: c.replace(/_/g, ' ').toUpperCase(), value: c }))} />
            <Select placeholder="Status" allowClear style={{ width: 130 }} onChange={(v) => setFilters((p) => ({ ...p, status: v, page: 1 }))} options={Object.keys(STATUS_COLORS).map((s) => ({ label: s.replace(/_/g, ' ').toUpperCase(), value: s }))} />
            <Select placeholder="Priority" allowClear style={{ width: 120 }} onChange={(v) => setFilters((p) => ({ ...p, priority: v, page: 1 }))} options={Object.keys(PRIORITY_COLORS).map((p) => ({ label: p.toUpperCase(), value: p }))} />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={loading}
          pagination={{ current: data?.page, pageSize: data?.pageSize, total: data?.total, onChange: (page, pageSize) => setFilters((p) => ({ ...p, page, pageSize })), showSizeChanger: true }}
          size="middle"
        />
      </Card>
    </Space>
  );
}
