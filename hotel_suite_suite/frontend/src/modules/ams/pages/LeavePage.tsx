import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Statistic, Avatar, Modal, Form, Input, DatePicker } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';
import { leaveService } from '@/api';
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/types';

const STATUS_COLORS: Record<LeaveStatus, string> = { pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default' };
const TYPE_COLORS: Record<LeaveType, string> = { annual: 'blue', sick: 'red', personal: 'purple', maternity: 'pink', paternity: 'cyan', bereavement: 'default', unpaid: 'default' };

export default function LeavePage() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | undefined>('pending');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { loadRequests(); }, [statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await leaveService.getAll(statusFilter ? { status: statusFilter } : undefined);
      setRequests(data);
    } catch (error) {
      message.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await leaveService.approve(id);
      message.success('Leave approved');
      loadRequests();
    } catch (error) {
      message.error('Failed to approve leave');
    }
  };

  const handleReject = async (id: string) => {
    Modal.confirm({
      title: 'Reject Leave Request',
      content: 'Are you sure you want to reject this leave request?',
      onOk: async () => {
        try {
          await leaveService.reject(id, 'Rejected by manager');
          message.success('Leave rejected');
          loadRequests();
        } catch (error) {
          message.error('Failed to reject leave');
        }
      },
    });
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const columns: ColumnsType<LeaveRequest> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{record.employee?.firstName?.[0]}</Avatar>
          <span>{record.employee?.firstName} {record.employee?.lastName}</span>
        </Space>
      ),
    },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 100, render: (type: LeaveType) => <Tag color={TYPE_COLORS[type]}>{type.toUpperCase()}</Tag> },
    { title: 'From', dataIndex: 'startDate', key: 'startDate', width: 110, render: (date: string) => dayjs(date).format('DD MMM YYYY') },
    { title: 'To', dataIndex: 'endDate', key: 'endDate', width: 110, render: (date: string) => dayjs(date).format('DD MMM YYYY') },
    { title: 'Days', dataIndex: 'days', key: 'days', width: 60, align: 'center' },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: LeaveStatus) => <Tag color={STATUS_COLORS[status]}>{status.toUpperCase()}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Button type="text" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }} onClick={() => handleApprove(record.id)} />
            <Button type="text" size="small" icon={<CloseOutlined />} style={{ color: '#ff4d4f' }} onClick={() => handleReject(record.id)} />
          </Space>
        ) : null,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Leave Requests"
        subtitle="Manage employee leave applications"
        breadcrumbs={[{ label: 'AMS', path: '/suite/ams' }, { label: 'Leave Requests' }]}
        actions={<Space><Button icon={<ReloadOutlined />} onClick={loadRequests}>Refresh</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New Request</Button></Space>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Pending" value={pendingCount} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Approved" value={requests.filter((r) => r.status === 'approved').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Rejected" value={requests.filter((r) => r.status === 'rejected').length} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total This Month" value={requests.length} /></Card></Col>
      </Row>

      <Card
        title="Leave Requests"
        extra={
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} allowClear placeholder="All Statuses" options={Object.keys(STATUS_COLORS).map((s) => ({ label: s.toUpperCase(), value: s }))} />
        }
      >
        <Table columns={columns} dataSource={requests} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      <Modal title="New Leave Request" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Submit">
        <Form form={form} layout="vertical" onFinish={() => { setModalOpen(false); message.success('Leave request submitted'); }}>
          <Form.Item name="type" label="Leave Type" rules={[{ required: true }]}>
            <Select options={Object.keys(TYPE_COLORS).map((t) => ({ label: t.toUpperCase(), value: t }))} />
          </Form.Item>
          <Form.Item name="dates" label="Dates" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
