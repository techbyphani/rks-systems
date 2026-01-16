import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, List, Progress, Empty, Avatar, Statistic } from 'antd';
import { CheckOutlined, ClockCircleOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';
import { taskService } from '@/api';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { useAppContext } from '@/context/AppContext';

const STATUS_COLORS: Record<TaskStatus, string> = { pending: 'default', assigned: 'blue', in_progress: 'gold', on_hold: 'orange', completed: 'green', cancelled: 'default', overdue: 'red' };
const PRIORITY_COLORS: Record<TaskPriority, string> = { low: 'default', normal: 'blue', high: 'orange', urgent: 'red' };

export default function MyTasksPage() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => { 
    if (tenant?.id) {
      loadMyTasks(); 
    }
  }, [tenant?.id]);

  const loadMyTasks = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await taskService.getMyTasks(tenant.id);
      setTasks(data);
    } catch (error) {
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      await taskService.updateStatus(tenant.id, taskId, newStatus);
      message.success('Task updated');
      loadMyTasks();
    } catch (error) {
      message.error('Failed to update task');
    }
  };

  const pendingTasks = tasks.filter((t) => ['pending', 'assigned'].includes(t.status));
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} size="small" style={{ marginBottom: 8 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <Tag color={PRIORITY_COLORS[task.priority]}>{task.priority.toUpperCase()}</Tag>
            <span style={{ fontWeight: 500 }}>{task.title}</span>
          </div>
          <Tag color={STATUS_COLORS[task.status]}>{task.status.replace(/_/g, ' ')}</Tag>
        </div>
        {task.description && <div style={{ color: '#8c8c8c', fontSize: 12 }}>{task.description}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ClockCircleOutlined style={{ color: dayjs().isAfter(dayjs(task.dueDate)) ? '#ff4d4f' : '#8c8c8c' }} />
            <span style={{ fontSize: 12, color: dayjs().isAfter(dayjs(task.dueDate)) ? '#ff4d4f' : '#8c8c8c' }}>{dayjs(task.dueDate).format('DD MMM HH:mm')}</span>
          </Space>
          <Space>
            {task.status === 'pending' || task.status === 'assigned' ? (
              <Button size="small" icon={<PlayCircleOutlined />} onClick={() => handleStatusUpdate(task.id, 'in_progress')}>Start</Button>
            ) : null}
            {task.status === 'in_progress' ? (
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleStatusUpdate(task.id, 'completed')}>Complete</Button>
            ) : null}
          </Space>
        </div>
      </Space>
    </Card>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="My Tasks"
        subtitle="Your assigned tasks and to-dos"
        breadcrumbs={[{ label: 'TMS', path: '/suite/tms' }, { label: 'My Tasks' }]}
        actions={<Button icon={<ReloadOutlined />} onClick={loadMyTasks}>Refresh</Button>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Pending" value={pendingTasks.length} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="In Progress" value={inProgressTasks.length} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Completed" value={completedTasks.length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ marginBottom: 8 }}>Completion Rate</div>
            <Progress percent={completionRate} status="active" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card title={<><ClockCircleOutlined /> Pending ({pendingTasks.length})</>} size="small" loading={loading}>
            {pendingTasks.length ? pendingTasks.map(renderTaskCard) : <Empty description="No pending tasks" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<><PlayCircleOutlined /> In Progress ({inProgressTasks.length})</>} size="small" loading={loading}>
            {inProgressTasks.length ? inProgressTasks.map(renderTaskCard) : <Empty description="No tasks in progress" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<><CheckOutlined /> Completed ({completedTasks.length})</>} size="small" loading={loading}>
            {completedTasks.slice(0, 5).map(renderTaskCard)}
            {completedTasks.length === 0 && <Empty description="No completed tasks" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
