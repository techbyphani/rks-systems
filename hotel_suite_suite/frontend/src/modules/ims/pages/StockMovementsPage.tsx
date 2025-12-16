import { useEffect, useState } from 'react';
import { Card, Space, Tag, Button, message, Table, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, DataTable } from '@/components/shared';
import { inventoryService } from '@/api';
import type { StockMovement, PaginatedResponse, StockMovementType } from '@/types';

const MOVEMENT_TYPES: StockMovementType[] = [
  'purchase',
  'consumption',
  'adjustment_add',
  'adjustment_remove',
  'transfer_in',
  'transfer_out',
  'waste',
  'return',
];

const TYPE_COLORS: Record<StockMovementType, string> = {
  purchase: 'green',
  consumption: 'orange',
  adjustment_add: 'blue',
  adjustment_remove: 'red',
  transfer_in: 'cyan',
  transfer_out: 'magenta',
  waste: 'red',
  return: 'purple',
};

export default function StockMovementsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<StockMovement> | null>(null);
  const [filters, setFilters] = useState<{
    itemId?: string;
    type?: StockMovementType;
    page: number;
    pageSize: number;
  }>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const movementsData = await inventoryService.getAllStockMovements(filters);
      setData(movementsData);
    } catch (error) {
      message.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, pageSize }));
  };

  const columns: ColumnsType<StockMovement> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD MMM YYYY HH:mm'),
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    {
      title: 'Item',
      key: 'item',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{record.item?.name || 'N/A'}</span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{record.item?.sku || ''}</span>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: StockMovementType) => (
        <Tag color={TYPE_COLORS[type]}>
          {type.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (quantity: number, record) => (
        <span style={{ color: record.type.includes('add') || record.type === 'purchase' || record.type === 'transfer_in' ? '#52c41a' : '#ff4d4f' }}>
          {record.type.includes('add') || record.type === 'purchase' || record.type === 'transfer_in' ? '+' : '-'}{quantity}
        </span>
      ),
    },
    {
      title: 'Stock Change',
      key: 'stockChange',
      width: 150,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>
          {record.previousStock} → {record.newStock}
        </span>
      ),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 100,
      align: 'right',
      render: (value: number) => value ? `₹${value.toLocaleString('en-IN')}` : '-',
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      align: 'right',
      render: (value: number) => value ? `₹${value.toLocaleString('en-IN')}` : '-',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (value: string) => value || '-',
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Stock Movements"
        subtitle="Track all inventory stock changes"
        breadcrumbs={[{ label: 'IMS', path: '/suite/ims' }, { label: 'Stock Movements' }]}
      />

      <Card
        title="All Stock Movements"
        extra={
          <Space>
            <Input
              placeholder="Search items..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="Movement Type"
              allowClear
              style={{ width: 180 }}
              value={filters.type}
              onChange={(value) => setFilters((prev) => ({ ...prev, type: value, page: 1 }))}
              options={MOVEMENT_TYPES.map((type) => ({
                label: type.replace(/_/g, ' ').toUpperCase(),
                value: type,
              }))}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: data?.page || 1,
            pageSize: data?.pageSize || 20,
            total: data?.total || 0,
            onChange: handlePageChange,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} movements`,
          }}
        />
      </Card>
    </Space>
  );
}

