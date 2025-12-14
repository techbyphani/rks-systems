import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Input, Statistic, Avatar, Drawer, Form } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, StatusTag } from '@/components/shared';
import { employeeService } from '@/api';
import type { Employee, EmployeeStatus, Department, PaginatedResponse } from '@/types';

const STATUS_COLORS: Record<EmployeeStatus, string> = { active: 'green', on_leave: 'orange', suspended: 'red', terminated: 'default' };
const DEPT_COLORS: Record<string, string> = { front_office: 'blue', housekeeping: 'cyan', food_beverage: 'orange', kitchen: 'red', engineering: 'purple', security: 'geekblue', finance: 'gold', hr: 'magenta', management: 'volcano' };

export default function EmployeesPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Employee> | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | undefined>();
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | undefined>();

  useEffect(() => { loadEmployees(); }, [search, deptFilter, statusFilter]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const result = await employeeService.getAll({ search, department: deptFilter, status: statusFilter, page: 1, pageSize: 100 });
      setData(result);
    } catch (error) {
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = data?.data.filter((e) => e.status === 'active').length || 0;
  const onLeaveCount = data?.data.filter((e) => e.status === 'on_leave').length || 0;
  const deptCounts = data?.data.reduce((acc, e) => { acc[e.department] = (acc[e.department] || 0) + 1; return acc; }, {} as Record<string, number>) || {};

  const columns: ColumnsType<Employee> = [
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode', width: 100 },
    {
      title: 'Employee',
      key: 'employee',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>{record.firstName[0]}{record.lastName[0]}</Avatar>
          <div><div style={{ fontWeight: 500 }}>{record.firstName} {record.lastName}</div><div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.designation}</div></div>
        </Space>
      ),
    },
    { title: 'Department', dataIndex: 'department', key: 'department', width: 130, render: (dept: string) => <Tag color={DEPT_COLORS[dept] || 'default'}>{dept.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: EmployeeStatus) => <Tag color={STATUS_COLORS[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Type', dataIndex: 'employmentType', key: 'employmentType', width: 100, render: (type: string) => <Tag>{type.replace(/_/g, ' ')}</Tag> },
    { title: '', key: 'actions', width: 50, render: () => <Button type="text" icon={<EditOutlined />} /> },
  ];

  const departments: Department[] = ['front_office', 'housekeeping', 'food_beverage', 'kitchen', 'engineering', 'security', 'finance', 'hr', 'management'];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Employees"
        subtitle="Manage staff records"
        breadcrumbs={[{ label: 'AMS', path: '/suite/ams' }, { label: 'Employees' }]}
        actions={<Button type="primary" icon={<PlusOutlined />}>Add Employee</Button>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Staff" value={data?.total || 0} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Active" value={activeCount} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="On Leave" value={onLeaveCount} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Departments" value={Object.keys(deptCounts).length} /></Card></Col>
      </Row>

      <Card
        title="All Employees"
        extra={
          <Space>
            <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 180 }} allowClear />
            <Select placeholder="Department" allowClear style={{ width: 140 }} value={deptFilter} onChange={setDeptFilter} options={departments.map((d) => ({ label: d.replace(/_/g, ' ').toUpperCase(), value: d }))} />
            <Select placeholder="Status" allowClear style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter} options={Object.keys(STATUS_COLORS).map((s) => ({ label: s.replace(/_/g, ' ').toUpperCase(), value: s }))} />
          </Space>
        }
      >
        <Table columns={columns} dataSource={data?.data || []} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} size="middle" />
      </Card>
    </Space>
  );
}
