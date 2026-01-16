import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Input, Statistic, Drawer, Form, Rate } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, StatusTag } from '@/components/shared';
import { vendorService } from '@/api';
import type { Vendor, VendorStatus } from '@/types';
import { useAppContext } from '@/context/AppContext';

const STATUS_COLORS: Record<VendorStatus, string> = { active: 'green', inactive: 'default', blacklisted: 'red' };

export default function VendorsPage() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VendorStatus | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { 
    if (tenant?.id) {
      loadVendors(); 
    }
  }, [tenant?.id, search, statusFilter]);

  const loadVendors = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await vendorService.getAll(tenant.id, { 
        search: search || undefined,
        status: statusFilter 
      });
      setVendors(data);
    } catch (error) {
      message.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  // Filtering is handled by the API, but we can add client-side filtering for search
  const filteredVendors = vendors.filter((v) => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    return true;
  });

  const handleEdit = (vendor: Vendor) => { setEditingVendor(vendor); form.setFieldsValue(vendor); setDrawerOpen(true); };

  const handleSubmit = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      if (editingVendor) {
        await vendorService.update(tenant.id, editingVendor.id, values);
        message.success('Vendor updated successfully');
      } else {
        await vendorService.create(tenant.id, values);
        message.success('Vendor created successfully');
      }
      setDrawerOpen(false);
      setEditingVendor(null);
      form.resetFields();
      loadVendors();
    } catch (error: any) {
      message.error(error.message || 'Failed to save vendor');
    }
  };

  const columns: ColumnsType<Vendor> = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 80 },
    { title: 'Name', dataIndex: 'name', key: 'name', width: 200, render: (value) => <span style={{ fontWeight: 500 }}>{value}</span> },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson', width: 150 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
    { title: 'Lead Time', dataIndex: 'leadTimeDays', key: 'leadTimeDays', width: 100, render: (days: number) => `${days} days` },
    { title: 'Rating', dataIndex: 'rating', key: 'rating', width: 120, render: (rating: number) => <Rate disabled defaultValue={rating} style={{ fontSize: 12 }} /> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: VendorStatus) => <Tag color={STATUS_COLORS[status]}>{status.toUpperCase()}</Tag> },
    { title: 'Categories', dataIndex: 'categories', key: 'categories', width: 200, render: (cats: string[]) => cats?.slice(0, 2).map((c) => <Tag key={c}>{c}</Tag>) },
    { title: '', key: 'actions', width: 50, render: (_, record) => <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /> },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Vendors"
        subtitle="Manage supplier relationships"
        breadcrumbs={[{ label: 'SMS', path: '/suite/sms' }, { label: 'Vendors' }]}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingVendor(null); form.resetFields(); setDrawerOpen(true); }}>Add Vendor</Button>}
      />

      <Row gutter={16}>
        <Col xs={8}><Card size="small"><Statistic title="Total Vendors" value={vendors.length} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title="Active" value={vendors.filter((v) => v.status === 'active').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title="Avg Rating" value={vendors.length ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length).toFixed(1) : 0} suffix="/ 5" /></Card></Col>
      </Row>

      <Card
        title="All Vendors"
        extra={
          <Space>
            <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
            <Select placeholder="Status" allowClear style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter} options={Object.keys(STATUS_COLORS).map((s) => ({ label: s.toUpperCase(), value: s }))} />
          </Space>
        }
      >
        <Table columns={columns} dataSource={filteredVendors} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      <Drawer
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={<Space><Button onClick={() => setDrawerOpen(false)}>Cancel</Button><Button type="primary" onClick={() => form.submit()}>Save</Button></Space>}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={16}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="contactPerson" label="Contact Person" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input prefix={<PhoneOutlined />} /></Form.Item></Col>
          </Row>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input prefix={<MailOutlined />} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="leadTimeDays" label="Lead Time (days)"><Input type="number" /></Form.Item></Col>
            <Col span={12}><Form.Item name="paymentTerms" label="Payment Terms"><Input placeholder="e.g., Net 30" /></Form.Item></Col>
          </Row>
          <Form.Item name="categories" label="Categories"><Select mode="tags" placeholder="Add categories" /></Form.Item>
          <Form.Item name="status" label="Status"><Select options={Object.keys(STATUS_COLORS).map((s) => ({ label: s.toUpperCase(), value: s }))} /></Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
