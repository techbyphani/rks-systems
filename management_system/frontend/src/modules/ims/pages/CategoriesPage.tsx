import { useEffect, useState } from 'react';
import { Card, Space, Tag, Button, message, Table, Input, Drawer, Form, Modal, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, DataTable } from '@/components/shared';
import { categoryService } from '@/api';
import type { InventoryCategory } from '@/types';
import { useAppContext } from '@/context/AppContext';

export default function CategoriesPage() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await categoryService.getAll(tenant.id);
      setCategories(data);
    } catch (error) {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: InventoryCategory) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setDrawerOpen(true);
  };

  const handleDelete = (category: InventoryCategory) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    Modal.confirm({
      title: 'Delete Category',
      content: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await categoryService.delete(tenant.id, category.id);
          message.success('Category deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Failed to delete category');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      if (editingCategory) {
        await categoryService.update(tenant.id, editingCategory.id, values);
        message.success('Category updated successfully');
      } else {
        await categoryService.create(tenant.id, values);
        message.success('Category created successfully');
      }
      setDrawerOpen(false);
      setEditingCategory(null);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save category');
    }
  };

  const filteredCategories = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const columns: ColumnsType<InventoryCategory> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value) => <span style={{ fontWeight: 500 }}>{value}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (value) => value || '-',
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? 'Active' : 'Inactive'}
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
            disabled={!record.isActive}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Categories"
        subtitle="Manage inventory categories"
        breadcrumbs={[{ label: 'IMS', path: '/suite/ims' }, { label: 'Categories' }]}
        actions={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setEditingCategory(null);
              form.resetFields();
              setDrawerOpen(true);
            }}
          >
            Add Category
          </Button>
        }
      />

      <Card
        title="All Categories"
        extra={
          <Input
            placeholder="Search categories..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Drawer
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        width={500}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        extra={
          <Space>
            <Button onClick={() => {
              setDrawerOpen(false);
              setEditingCategory(null);
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
            label="Category Name"
            rules={[{ required: true, message: 'Category name is required' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} placeholder="Enter category description" />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}

