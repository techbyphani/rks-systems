import { useEffect, useState } from 'react';
import { Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography, Spin, message } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { taskService } from '@/api';
import type { Task } from '@/types';

const { Title, Text } = Typography

export default function TMSDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    todaysDue: number;
    urgent: number;
    completedToday: number;
    onTrack: number;
  } | null>(null);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [departmentStats, setDepartmentStats] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, urgentData] = await Promise.all([
        taskService.getStats(),
        taskService.getAll({ priority: 'urgent', status: ['pending', 'assigned', 'in_progress'], pageSize: 5 }),
      ]);
      setStats(statsData);
      setUrgentTasks(urgentData.data);
      
      // Calculate department breakdown
      const deptCounts: Record<string, { total: number; completed: number }> = {};
      const allTasks = await taskService.getAll({ pageSize: 1000 });
      allTasks.data.forEach(task => {
        if (task.assignedDepartment) {
          if (!deptCounts[task.assignedDepartment]) {
            deptCounts[task.assignedDepartment] = { total: 0, completed: 0 };
          }
          deptCounts[task.assignedDepartment].total++;
          if (task.status === 'completed') {
            deptCounts[task.assignedDepartment].completed++;
          }
        }
      });
      
      const deptPercentages: Record<string, number> = {};
      Object.entries(deptCounts).forEach(([dept, counts]) => {
        deptPercentages[dept] = counts.total > 0 
          ? Math.round((counts.completed / counts.total) * 100)
          : 0;
      });
      setDepartmentStats(deptPercentages);
    } catch (error) {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Task Management System</Title>
        <Text type="secondary">Cross-functional assignments, escalations, and SLAs.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Open Tasks" 
              value={stats ? stats.pending + stats.inProgress : 0} 
              valueStyle={{ color: '#52c41a' }} 
            />
            <Text type="secondary">Completed today: {stats?.completedToday || 0}</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Urgent" 
              value={stats?.urgent || 0} 
              suffix="items" 
              valueStyle={{ color: '#fa8c16' }} 
            />
            <Text type="secondary">Requires attention</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="On Track" 
              value={stats?.onTrack || 0} 
              suffix="%" 
              valueStyle={{ color: '#1677ff' }} 
            />
            <Progress percent={stats?.onTrack || 0} showInfo={false} style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Overdue" 
              value={stats?.overdue || 0} 
              suffix="tasks" 
              valueStyle={{ color: '#ff4d4f' }} 
            />
            <Text type="secondary">Need immediate action</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Urgent Tasks" extra={<CheckCircleOutlined />}>
            {urgentTasks.length > 0 ? (
              <List
                dataSource={urgentTasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      title={task.title}
                      description={
                        <Text type="secondary">
                          {task.assignedDepartment?.replace(/_/g, ' ').toUpperCase() || 'Unassigned'}
                        </Text>
                      }
                    />
                    <Space direction="vertical" align="end" size={0}>
                      <Tag color="red">URGENT</Tag>
                      <Text type="secondary">{task.status.replace(/_/g, ' ').toUpperCase()}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No urgent tasks</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Department Breakdown">
            {Object.keys(departmentStats).length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(departmentStats).slice(0, 4).map(([dept, percent]) => (
                  <div key={dept}>
                    <Text>{dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                    <Progress 
                      percent={percent} 
                      strokeColor={
                        percent >= 70 ? '#52c41a' : 
                        percent >= 50 ? '#1677ff' : 
                        percent >= 30 ? '#faad14' : 
                        '#ff4d4f'
                      } 
                    />
                  </div>
                ))}
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No department data</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
