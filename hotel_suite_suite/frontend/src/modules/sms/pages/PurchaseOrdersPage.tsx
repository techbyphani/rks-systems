import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';
import { purchaseOrderService, type PurchaseOrderFilters } from '@/api';
import type { PurchaseOrder, PurchaseOrderStatus, PaginatedResponse } from '@/types';

const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: 'default', pending_approval: 'orange', approved: 'blue', sent: 'cyan',
  acknowledged: 'purple', partial_received: 'gold', received: 'green', cancelled: 'red',
};

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<PurchaseOrder> | null>(null);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | undefined>();
  const [stats, setStats] = useState<{
    total: number;
    pendingValue: number;
    received: number;
  } | null>(null);

  useEffect(() => { 
    loadOrders();
    loadStats();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const filters: PurchaseOrderFilters = {
        status: statusFilter,
        page: 1,
        pageSize: 50,
      };
      const result = await purchaseOrderService.getAll(filters);
      setData(result);
    } catch (error) {
      message.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await purchaseOrderService.getStats();
      setStats({
        total: statsData.total,
        pendingValue: statsData.pendingValue,
        received: statsData.received,
      });
    } catch (error) {
      // Silent fail for stats
    }
  };

  const handleStatusUpdate = async (id: string, status: PurchaseOrderStatus) => {
    try {
      await purchaseOrderService.updateStatus(id, status);
      message.success('Purchase order updated');
      loadOrders();
      loadStats();
    } catch (error: any) {
      message.error(error.message || 'Failed to update purchase order');
    }
  };

  const totalValue = data?.data.reduce((sum, o) => sum + o.totalAmount, 0) || 0;
  const pendingCount = data?.data.filter((o) => ['draft', 'pending_approval', 'approved', 'sent'].includes(o.status)).length || 0;

  const columns: ColumnsType<PurchaseOrder> = [
    { title: 'PO #', dataIndex: 'poNumber', key: 'poNumber', width: 130, render: (value) => <span style={{ fontWeight: 500 }}>{value}</span> },
    { title: 'Vendor', key: 'vendor', width: 200, render: (_, record) => record.vendor?.name || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 130, render: (status: PurchaseOrderStatus) => <Tag color={STATUS_COLORS[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Expected', dataIndex: 'expectedDeliveryDate', key: 'expectedDeliveryDate', width: 120, render: (date: string) => date ? dayjs(date).format('DD MMM YYYY') : '-' },
    { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', width: 120, align: 'right', render: (value: number) => `₹${value.toLocaleString('en-IN')}` },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 120, render: (date: string) => dayjs(date).format('DD MMM YYYY') },
    { 
      title: '', 
      key: 'actions', 
      width: 80, 
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} />
          <Button type="text" size="small" icon={<PrinterOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Purchase Orders"
        subtitle="Track procurement and deliveries"
        breadcrumbs={[{ label: 'SMS', path: '/suite/sms' }, { label: 'Purchase Orders' }]}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadOrders}>Refresh</Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => message.info('Create PO functionality coming soon')}
            >
              Create PO
            </Button>
          </Space>
        }
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total POs" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Pending" value={pendingCount} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Value" value={totalValue} prefix="₹" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Received" value={stats?.received || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="All Purchase Orders"
        extra={
          <Select 
            placeholder="Status" 
            allowClear 
            style={{ width: 160 }} 
            value={statusFilter} 
            onChange={setStatusFilter} 
            options={Object.keys(STATUS_COLORS).map((s) => ({ label: s.replace(/_/g, ' ').toUpperCase(), value: s }))} 
          />
        }
      >
        <Table 
          columns={columns} 
          dataSource={data?.data || []} 
          rowKey="id" 
          loading={loading} 
          pagination={{ 
            current: data?.page, 
            pageSize: data?.pageSize, 
            total: data?.total,
            showSizeChanger: true,
          }} 
          size="middle" 
        />
      </Card>
    </Space>
  );
}
