import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Input, Statistic, Progress, Drawer, Form, InputNumber, Switch } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, AlertOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/shared';
import { inventoryService, categoryService } from '@/api';
import type { InventoryItem, InventoryCategory, PaginatedResponse, InventoryItemUnit } from '@/types';
import { useAppContext } from '@/context/AppContext';

export default function ItemsPage() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<InventoryItem> | null>(null);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [showLowStock, setShowLowStock] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id, search, categoryFilter, showLowStock]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [itemsData, categoriesData] = await Promise.all([
        inventoryService.getAll(tenant.id, { search, categoryId: categoryFilter, isLowStock: showLowStock || undefined, page: 1, pageSize: 100 }),
        categoryService.getAll(tenant.id),
      ]);
      setData(itemsData);
      setCategories(categoriesData);
    } catch (error) {
      message.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      if (editingItem) {
        await inventoryService.update(tenant.id, editingItem.id, values);
        message.success('Item updated successfully');
      } else {
        await inventoryService.create(tenant.id, {
          ...values,
          isActive: true,
        });
        message.success('Item created successfully');
      }
      setDrawerOpen(false);
      setEditingItem(null);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save item');
    }
  };

  const lowStockCount = data?.data.filter((i) => i.currentStock <= i.reorderPoint).length || 0;
  const totalValue = data?.data.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0) || 0;

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.parLevel) * 100;
    if (item.currentStock <= item.reorderPoint) return { color: 'red', label: 'Low Stock' };
    if (percentage < 50) return { color: 'orange', label: 'Below Par' };
    return { color: 'green', label: 'OK' };
  };

  const columns: ColumnsType<InventoryItem> = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 100 },
    { title: 'Name', dataIndex: 'name', key: 'name', width: 200, render: (value) => <span style={{ fontWeight: 500 }}>{value}</span> },
    { title: 'Category', key: 'category', width: 120, render: (_, record) => <Tag>{record.category?.name || '-'}</Tag> },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Stock Level',
      key: 'stock',
      width: 180,
      render: (_, record) => {
        const percentage = Math.min((record.currentStock / record.parLevel) * 100, 100);
        const status = getStockStatus(record);
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <span>{record.currentStock} / {record.parLevel}</span>
            <Progress percent={percentage} size="small" strokeColor={status.color} showInfo={false} />
          </Space>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const status = getStockStatus(record);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    { title: 'Unit Cost', dataIndex: 'unitCost', key: 'unitCost', width: 100, align: 'right', render: (value: number) => `₹${value}` },
    { title: 'Value', key: 'value', width: 100, align: 'right', render: (_, record) => `₹${(record.currentStock * record.unitCost).toLocaleString()}` },
    { title: '', key: 'actions', width: 50, render: (_, record) => <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /> },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Inventory Items"
        subtitle="Track stock levels and manage inventory"
        breadcrumbs={[{ label: 'IMS', path: '/suite/ims' }, { label: 'Items' }]}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setDrawerOpen(true); }}>Add Item</Button>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Items" value={data?.total || 0} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Low Stock" value={lowStockCount} valueStyle={{ color: lowStockCount > 0 ? '#ff4d4f' : '#52c41a' }} prefix={lowStockCount > 0 ? <AlertOutlined /> : undefined} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Value" value={totalValue} prefix="₹" /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Categories" value={categories.length} /></Card></Col>
      </Row>

      <Card
        title="All Items"
        extra={
          <Space>
            <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
            <Select placeholder="Category" allowClear style={{ width: 150 }} value={categoryFilter} onChange={setCategoryFilter} options={categories.map((c) => ({ label: c.name, value: c.id }))} />
            <Button type={showLowStock ? 'primary' : 'default'} icon={<WarningOutlined />} onClick={() => setShowLowStock(!showLowStock)}>Low Stock</Button>
          </Space>
        }
      >
        <Table columns={columns} dataSource={data?.data || []} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} size="middle" />
      </Card>

      <Drawer
        title={editingItem ? 'Edit Item' : 'Add Item'}
        width={500}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={<Space><Button onClick={() => setDrawerOpen(false)}>Cancel</Button><Button type="primary" onClick={() => form.submit()}>Save</Button></Space>}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="sku" label="SKU" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={16}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}><Select options={categories.map((c) => ({ label: c.name, value: c.id }))} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="unit" label="Unit" rules={[{ required: true }]}><Select options={['piece', 'kg', 'liter', 'box', 'pack', 'roll'].map((u) => ({ label: u, value: u }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="unitCost" label="Unit Cost" rules={[{ required: true }]}><InputNumber prefix="₹" style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="currentStock" label="Current Stock" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="parLevel" label="Par Level" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="reorderPoint" label="Reorder Point" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="reorderQuantity" label="Reorder Quantity" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="location" label="Location"><Input placeholder="Storage location" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="isPerishable" label="Perishable" valuePropName="checked" initialValue={false}><Switch /></Form.Item></Col>
            {form.getFieldValue('isPerishable') && (
              <Col span={12}><Form.Item name="expiryAlertDays" label="Expiry Alert (days)"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
            )}
          </Row>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Drawer>
    </Space>
  );
}
