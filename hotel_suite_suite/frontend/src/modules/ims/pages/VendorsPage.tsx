import { useEffect, useState } from 'react';
import { Card, Space, Tag, Button, message, Table, Input, Drawer, Form, Modal, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, DataTable } from '@/components/shared';
import { vendorService } from '@/api';
import type { Vendor } from '@/types';

export default function VendorsPage() {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Vendor['status'] | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getAll({ status: statusFilter, search });
      setVendors(data);
    } catch (error) {
      message.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.setFieldsValue(vendor);
    setDrawerOpen(true);
  };

  const handleDelete = (vendor: Vendor) => {
    Modal.confirm({
      title: 'Delete Vendor',
      content: `Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await vendorService.delete(vendor.id);
          message.success('Vendor deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Failed to delete vendor');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingVendor) {
        await vendorService.update(editingVendor.id, values);
        message.success('Vendor updated successfully');
      } else {
        await vendorService.create(values);
        message.success('Vendor created successfully');
      }
      setDrawerOpen(false);
      setEditingVendor(null);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save vendor');
    }
  };

  const columns: ColumnsType<Vendor> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value) => <span style={{ fontWeight: 500 }}>{value}</span>,
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
            disabled={record.status === 'inactive'}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Vendors"
        subtitle="Manage suppliers and vendors"
        breadcrumbs={[{ label: 'IMS', path: '/suite/ims' }, { label: 'Vendors' }]}
        actions={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setEditingVendor(null);
              form.resetFields();
              setDrawerOpen(true);
            }}
          >
            Add Vendor
          </Button>
        }
      />

      <Card
        title="All Vendors"
        extra={
          <Space>
            <Input
              placeholder="Search vendors..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={vendors}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Drawer
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        width={600}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingVendor(null);
          form.resetFields();
        }}
        extra={
          <Space>
            <Button onClick={() => {
              setDrawerOpen(false);
              setEditingVendor(null);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              Save
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Vendor Name"
            rules={[{ required: true, message: 'Vendor name is required' }]}
          >
            <Input placeholder="Enter vendor name" />
          </Form.Item>
          <Form.Item
            name="contactPerson"
            label="Contact Person"
            rules={[{ required: true, message: 'Contact person is required' }]}
          >
            <Input placeholder="Enter contact person name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Invalid email' }]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea rows={3} placeholder="Enter vendor address" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            initialValue="active"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}

