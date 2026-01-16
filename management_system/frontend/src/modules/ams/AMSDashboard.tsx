import { useEffect, useState } from 'react';
import { Calendar, Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { employeeService, attendanceService, leaveService } from '@/api';
import { useAppContext } from '@/context/AppContext';

const { Title, Text } = Typography

export default function AMSDashboard() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    onLeave: number;
    byDepartment: Record<string, number>;
  } | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<{
    present: number;
    absent: number;
    late: number;
    onLeave: number;
  } | null>(null);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [scheduledToday, setScheduledToday] = useState(0);

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [employeeStats, attendanceData, leaveCount] = await Promise.all([
        employeeService.getStats(tenant.id),
        attendanceService.getTodaySummary(tenant.id),
        leaveService.getPendingCount(tenant.id),
      ]);
      setStats(employeeStats);
      setAttendanceSummary(attendanceData);
      setPendingLeaveCount(leaveCount);
      setScheduledToday(attendanceData.present + attendanceData.absent + attendanceData.late);
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

  const onTimeRate = scheduledToday > 0 
    ? Math.round(((scheduledToday - (attendanceSummary?.late || 0)) / scheduledToday) * 100)
    : 100;

  const complianceRate = 98; // This would be calculated from timesheet submission data

  // Generate department alerts from stats
  const departmentAlerts = stats ? Object.entries(stats.byDepartment)
    .slice(0, 3)
    .map(([dept, count]) => ({
      team: dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      status: count > 10 ? 'Fully Staffed' : count > 5 ? 'Adequate' : 'Understaffed',
      color: count > 10 ? 'green' : count > 5 ? 'blue' : 'orange',
    }))
    : [];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Attendance Management System</Title>
        <Text type="secondary">Shift adherence, leave tracking, and policy compliance.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Team Strength" 
              value={stats?.total || 0} 
              suffix="staff" 
              valueStyle={{ color: '#fa541c' }} 
            />
            <Text type="secondary">Scheduled today: {scheduledToday}</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="On Time" 
              value={onTimeRate} 
              suffix="%" 
              valueStyle={{ color: '#52c41a' }} 
            />
            <Text type="secondary">Late arrivals: {attendanceSummary?.late || 0}</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Leave Requests" 
              value={pendingLeaveCount} 
              suffix="pending" 
              valueStyle={{ color: '#eb2f96' }} 
            />
            <Text type="secondary">Awaiting approval</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Compliance" 
              value={complianceRate} 
              suffix="%" 
              valueStyle={{ color: '#1677ff' }} 
            />
            <Text type="secondary">Timesheet submission by 23:00</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Shift Calendar">
            <Calendar fullscreen={false} value={dayjs()} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Department Status">
            {departmentAlerts.length > 0 ? (
              <List
                dataSource={departmentAlerts}
                renderItem={(alert) => (
                  <List.Item>
                    <List.Item.Meta
                      title={alert.team}
                      description={<Text type="secondary">{alert.status}</Text>}
                    />
                    <Tag color={alert.color}>{alert.status}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No department data</Text>
              </div>
            )}
            <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
              <Text strong>Attendance Rate</Text>
              <Progress 
                percent={scheduledToday > 0 ? Math.round(((attendanceSummary?.present || 0) / scheduledToday) * 100) : 0} 
                status="active" 
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
