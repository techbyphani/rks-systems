import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Input, Statistic, Dropdown, Avatar, Progress, Drawer, Form, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, ReloadOutlined, MoreOutlined, CheckOutlined, ClockCircleOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, StatusTag } from '@/components/shared';
import { taskService, employeeService, type TaskFilters, type CreateTaskDto } from '@/api';
import type { Task, TaskStatus, TaskPriority, TaskCategory, PaginatedResponse, Department } from '@/types';

const STATUS_COLORS: Record<TaskStatus, string> = { pending: 'default', assigned: 'blue', in_progress: 'gold', on_hold: 'orange', completed: 'green', cancelled: 'default', overdue: 'red' };
const PRIORITY_COLORS: Record<TaskPriority, string> = { low: 'default', normal: 'blue', high: 'orange', urgent: 'red' };
const CATEGORY_COLORS: Record<TaskCategory, string> = { housekeeping: 'cyan', maintenance: 'purple', guest_request: 'blue', internal: 'default', event: 'magenta', inspection: 'gold', delivery: 'green', other: 'default' };

export default function TasksPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Task> | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({ page: 1, pageSize: 20 });
  const [stats, setStats] = useState<{
    pending: number;
    inProgress: number;
    overdue: number;
    completedToday: number;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { 
    loadTasks();
    loadStats();
  }, [filters]);

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

  const loadStats = async () => {
    try {
      const statsData = await taskService.getStats();
      setStats({
        pending: statsData.pending,
        inProgress: statsData.inProgress,
        overdue: statsData.overdue,
        completedToday: statsData.completedToday,
      });
    } catch (error) {
      // Silent fail for stats
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateStatus(taskId, newStatus);
      message.success('Task updated');
      loadTasks();
      loadStats();
    } catch (error) {
      message.error('Failed to update task');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const taskData: CreateTaskDto = {
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
        assignedTo: values.assignedTo,
        assignedDepartment: values.assignedDepartment,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        dueTime: values.dueTime,
        estimatedMinutes: values.estimatedMinutes,
      };
      await taskService.create(taskData);
      message.success('Task created successfully');
      setDrawerOpen(false);
      form.resetFields();
      loadTasks();
      loadStats();
    } catch (error: any) {
      message.error(error.message || 'Failed to create task');
    }
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
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadTasks}>Refresh</Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setDrawerOpen(true);
              }}
            >
              New Task
            </Button>
          </Space>
        }
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Pending" 
              value={stats?.pending || 0} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#fa8c16' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="In Progress" 
              value={stats?.inProgress || 0} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Overdue" 
              value={stats?.overdue || 0} 
              prefix={<ExclamationCircleOutlined />} 
              valueStyle={{ color: '#ff4d4f' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Completed Today" 
              value={stats?.completedToday || 0} 
              prefix={<CheckOutlined />} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
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

      <Drawer
        title="Create New Task"
        width={600}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          form.resetFields();
        }}
        extra={
          <Space>
            <Button onClick={() => {
              setDrawerOpen(false);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              Create Task
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true, message: 'Task title is required' }]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Category is required' }]}
              >
                <Select
                  placeholder="Select category"
                  options={categories.map((c) => ({
                    label: c.replace(/_/g, ' ').toUpperCase(),
                    value: c,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true }]}
                initialValue="normal"
              >
                <Select
                  options={Object.keys(PRIORITY_COLORS).map((p) => ({
                    label: p.toUpperCase(),
                    value: p,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignedDepartment"
                label="Department"
              >
                <Select
                  placeholder="Select department"
                  allowClear
                  options={[
                    { label: 'Front Office', value: 'front_office' },
                    { label: 'Housekeeping', value: 'housekeeping' },
                    { label: 'Food & Beverage', value: 'food_beverage' },
                    { label: 'Kitchen', value: 'kitchen' },
                    { label: 'Engineering', value: 'engineering' },
                    { label: 'Security', value: 'security' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assignedTo"
                label="Assign To Employee"
              >
                <Select
                  placeholder="Select employee (optional)"
                  allowClear
                  showSearch
                  filterOption={(input: string, option: any) => {
                    const label = option?.label;
                    if (typeof label === 'string') {
                      return label.toLowerCase().includes(input.toLowerCase());
                    }
                    return false;
                  }}
                  options={[]} // Would be populated from employeeService in real app
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true, message: 'Due date is required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueTime"
                label="Due Time"
              >
                <Input placeholder="HH:mm (e.g., 14:30)" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="estimatedMinutes"
            label="Estimated Duration (minutes)"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Estimated time" />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
