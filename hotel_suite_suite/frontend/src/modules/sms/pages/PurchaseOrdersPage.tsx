import { useEffect, useState } from 'react';
import { Card, Row, Col, Space, Tag, Button, message, Table, Select, Statistic, Steps } from 'antd';
import { PlusOutlined, EyeOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';

const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: 'default', pending_approval: 'orange', approved: 'blue', sent: 'cyan',
  acknowledged: 'purple', partial_received: 'gold', received: 'green', cancelled: 'red',
};

// Mock data
const mockPOs: PurchaseOrder[] = [
  { id: 'po-001', poNumber: 'PO-2024-001', vendorId: 'v1', vendor: { name: 'FreshServe Supplies' } as any, status: 'sent', items: [], subtotal: 45000, taxAmount: 8100, shippingCost: 500, totalAmount: 53600, currency: 'INR', expectedDeliveryDate: dayjs().add(3, 'day').format('YYYY-MM-DD'), createdBy: 'user1', createdAt: dayjs().subtract(2, 'day').toISOString(), updatedAt: dayjs().toISOString() },
  { id: 'po-002', poNumber: 'PO-2024-002', vendorId: 'v2', vendor: { name: 'Comfort Linen Co.' } as any, status: 'approved', items: [], subtotal: 28000, taxAmount: 5040, shippingCost: 0, totalAmount: 33040, currency: 'INR', expectedDeliveryDate: dayjs().add(5, 'day').format('YYYY-MM-DD'), createdBy: 'user1', createdAt: dayjs().subtract(1, 'day').toISOString(), updatedAt: dayjs().toISOString() },
  { id: 'po-003', poNumber: 'PO-2024-003', vendorId: 'v3', vendor: { name: 'CleanPro Chemicals' } as any, status: 'received', items: [], subtotal: 18500, taxAmount: 3330, shippingCost: 200, totalAmount: 22030, currency: 'INR', createdBy: 'user1', createdAt: dayjs().subtract(10, 'day').toISOString(), updatedAt: dayjs().subtract(5, 'day').toISOString() },
];

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | undefined>();

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setOrders(mockPOs);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => ['draft', 'pending_approval', 'approved', 'sent'].includes(o.status)).length;

  const columns: ColumnsType<PurchaseOrder> = [
    { title: 'PO #', dataIndex: 'poNumber', key: 'poNumber', width: 130, render: (value) => <span style={{ fontWeight: 500 }}>{value}</span> },
    { title: 'Vendor', key: 'vendor', width: 200, render: (_, record) => record.vendor?.name || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 130, render: (status: PurchaseOrderStatus) => <Tag color={STATUS_COLORS[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Expected', dataIndex: 'expectedDeliveryDate', key: 'expectedDeliveryDate', width: 120, render: (date: string) => date ? dayjs(date).format('DD MMM YYYY') : '-' },
    { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', width: 120, align: 'right', render: (value: number) => `₹${value.toLocaleString('en-IN')}` },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 120, render: (date: string) => dayjs(date).format('DD MMM YYYY') },
    { title: '', key: 'actions', width: 80, render: () => <Space><Button type="text" size="small" icon={<EyeOutlined />} /><Button type="text" size="small" icon={<PrinterOutlined />} /></Space> },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Purchase Orders"
        subtitle="Track procurement and deliveries"
        breadcrumbs={[{ label: 'SMS', path: '/suite/sms' }, { label: 'Purchase Orders' }]}
        actions={<Space><Button icon={<ReloadOutlined />} onClick={loadOrders}>Refresh</Button><Button type="primary" icon={<PlusOutlined />}>Create PO</Button></Space>}
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total POs" value={orders.length} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Pending" value={pendingCount} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Value" value={totalValue} prefix="₹" /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="Received" value={orders.filter((o) => o.status === 'received').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card
        title="All Purchase Orders"
        extra={<Select placeholder="Status" allowClear style={{ width: 160 }} value={statusFilter} onChange={setStatusFilter} options={Object.keys(STATUS_COLORS).map((s) => ({ label: s.replace(/_/g, ' ').toUpperCase(), value: s }))} />}
      >
        <Table columns={columns} dataSource={filteredOrders} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>
    </Space>
  );
}
