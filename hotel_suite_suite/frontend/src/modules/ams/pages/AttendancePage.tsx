import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Statistic, DatePicker, Progress, Avatar } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';
import { attendanceService } from '@/api';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'green', absent: 'red', late: 'orange', half_day: 'gold',
  on_leave: 'purple', holiday: 'blue', weekend: 'default',
};

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [deptFilter, setDeptFilter] = useState<string | undefined>();

  useEffect(() => { loadAttendance(); }, [selectedDate, deptFilter]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getRecords({ date: selectedDate.format('YYYY-MM-DD') });
      setRecords(data);
    } catch (error) {
      message.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const attendanceRate = records.length ? Math.round((presentCount / records.length) * 100) : 0;

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{record.employee?.firstName?.[0]}</Avatar>
          <span>{record.employee?.firstName} {record.employee?.lastName}</span>
        </Space>
      ),
    },
    { title: 'Department', key: 'department', width: 130, render: (_, record) => <Tag>{record.employee?.department?.replace(/_/g, ' ')}</Tag> },
    { title: 'Shift', key: 'shift', width: 100, render: (_, record) => record.shift?.name || '-' },
    { title: 'Clock In', dataIndex: 'clockIn', key: 'clockIn', width: 100, render: (time: string) => time ? dayjs(time).format('HH:mm') : '-' },
    { title: 'Clock Out', dataIndex: 'clockOut', key: 'clockOut', width: 100, render: (time: string) => time ? dayjs(time).format('HH:mm') : '-' },
    { title: 'Hours', dataIndex: 'totalHours', key: 'totalHours', width: 80, render: (hours: number) => hours ? `${hours.toFixed(1)}h` : '-' },
    { title: 'Late', dataIndex: 'lateMinutes', key: 'lateMinutes', width: 80, render: (mins: number) => mins ? <Tag color="orange">{mins}m</Tag> : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: AttendanceStatus) => <Tag color={STATUS_COLORS[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Tag> },
  ];

  const departments = ['front_office', 'housekeeping', 'food_beverage', 'kitchen', 'engineering', 'security', 'finance', 'hr'];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Daily Attendance"
        subtitle="Track staff attendance and hours"
        breadcrumbs={[{ label: 'AMS', path: '/suite/ams' }, { label: 'Attendance' }]}
        actions={<Button icon={<ReloadOutlined />} onClick={loadAttendance}>Refresh</Button>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Present" value={presentCount} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Absent" value={absentCount} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Late" value={lateCount} valueStyle={{ color: '#fa8c16' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <span style={{ color: '#8c8c8c' }}>Attendance Rate</span>
              <Progress percent={attendanceRate} status="active" />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={`Attendance for ${selectedDate.format('DD MMM YYYY')}`}
        extra={
          <Space>
            <DatePicker value={selectedDate} onChange={(date) => date && setSelectedDate(date)} format="DD MMM YYYY" />
            <Select placeholder="Department" allowClear style={{ width: 140 }} value={deptFilter} onChange={setDeptFilter} options={departments.map((d) => ({ label: d.replace(/_/g, ' ').toUpperCase(), value: d }))} />
          </Space>
        }
      >
        <Table columns={columns} dataSource={records} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} size="middle" />
      </Card>
    </Space>
  );
}
