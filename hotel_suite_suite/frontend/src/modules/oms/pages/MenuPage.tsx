import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Switch, Input, InputNumber, Select, Drawer, Form, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/shared';
import { menuService } from '@/api';
import type { MenuItem, MenuItemCategory } from '@/types';

const CATEGORIES: { label: string; value: MenuItemCategory }[] = [
  { label: 'Appetizer', value: 'appetizer' },
  { label: 'Main Course', value: 'main_course' },
  { label: 'Dessert', value: 'dessert' },
  { label: 'Beverage', value: 'beverage' },
  { label: 'Alcohol', value: 'alcohol' },
  { label: 'Snack', value: 'snack' },
  { label: 'Breakfast', value: 'breakfast' },
];

export default function MenuPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MenuItemCategory | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await menuService.getAll();
      setItems(data);
    } catch (error) {
      message.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await menuService.update(item.id, { isAvailable: !item.isAvailable });
      message.success(`${item.name} is now ${item.isAvailable ? 'unavailable' : 'available'}`);
      loadItems();
    } catch (error) {
      message.error('Failed to update item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await menuService.update(editingItem.id, values);
        message.success('Menu item updated');
      } else {
        await menuService.create(values);
        message.success('Menu item created');
      }
      setDrawerOpen(false);
      form.resetFields();
      loadItems();
    } catch (error) {
      message.error('Failed to save item');
    }
  };

  const filteredItems = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && item.category !== categoryFilter) return false;
    return true;
  });

  const columns: ColumnsType<MenuItem> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 200, render: (value) => <span style={{ fontWeight: 500 }}>{value}</span> },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 120, render: (cat: string) => <Tag>{cat.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Price', dataIndex: 'price', key: 'price', width: 100, align: 'right', render: (value: number) => `₹${value}` },
    { title: 'Prep Time', dataIndex: 'preparationTime', key: 'preparationTime', width: 100, render: (value: number) => `${value} min` },
    {
      title: 'Diet',
      key: 'diet',
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          {record.isVegetarian && <Tag color="green">VEG</Tag>}
          {record.isVegan && <Tag color="lime">VEGAN</Tag>}
          {record.isGlutenFree && <Tag color="blue">GF</Tag>}
        </Space>
      ),
    },
    {
      title: 'Available',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      width: 100,
      render: (value: boolean, record) => <Switch checked={value} onChange={() => handleToggleAvailability(record)} />,
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Menu Management"
        subtitle="Manage menu items and availability"
        breadcrumbs={[{ label: 'OMS', path: '/suite/oms' }, { label: 'Menu' }]}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setDrawerOpen(true); }}>Add Item</Button>}
      />

      <Card
        title={`Menu Items (${filteredItems.length})`}
        extra={
          <Space>
            <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
            <Select placeholder="Category" allowClear style={{ width: 140 }} value={categoryFilter} onChange={setCategoryFilter} options={CATEGORIES} />
          </Space>
        }
      >
        <Table columns={columns} dataSource={filteredItems} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      <Drawer
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        width={500}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={<Space><Button onClick={() => setDrawerOpen(false)}>Cancel</Button><Button type="primary" onClick={() => form.submit()}>Save</Button></Space>}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}><Select options={CATEGORIES} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="price" label="Price" rules={[{ required: true }]}><InputNumber prefix="₹" style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="preparationTime" label="Prep Time (min)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="isVegetarian" label="Vegetarian" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="isVegan" label="Vegan" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="isGlutenFree" label="Gluten Free" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
          <Form.Item name="isAvailable" label="Available" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
