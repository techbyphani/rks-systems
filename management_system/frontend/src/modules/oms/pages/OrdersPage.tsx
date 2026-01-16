import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Space, Select, Tag, Statistic, Button, message, Table, Badge, Steps, Dropdown, Modal } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, MoreOutlined, CheckOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, StatusTag } from '@/components/shared';
import { orderService, workflowService } from '@/api';
import { useNotifications } from '@/context/NotificationContext';
import { useAppContext, useModuleEnabled } from '@/context/AppContext';
import type { Order, OrderStatus, PaginatedResponse } from '@/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'default',
  confirmed: 'blue',
  preparing: 'gold',
  ready: 'cyan',
  delivering: 'purple',
  delivered: 'green',
  completed: 'green',
  cancelled: 'red',
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { tenant } = useAppContext();
  const bmsEnabled = useModuleEnabled('bms'); // Check if BMS is enabled for charge-to-folio feature
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Order> | null>(null);
  const [stats, setStats] = useState<{
    todaysOrders: number;
    pendingOrders: number;
    roomServiceOpen: number;
    todaysRevenue: number;
    averageOrderValue: number;
    averagePrepTime: number;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();

  useEffect(() => {
    if (tenant?.id) {
      loadOrders();
    }
  }, [statusFilter, tenant?.id]);

  const loadOrders = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        orderService.getAll(tenant.id, { status: statusFilter, page: 1, pageSize: 50 }),
        orderService.getStats(tenant.id),
      ]);
      setData(ordersData);
      setStats(statsData);
    } catch (error) {
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (!tenant?.id) {
      message.error('Tenant context not available');
      return;
    }
    try {
      await orderService.updateStatus(tenant.id, orderId, newStatus);
      message.success('Order status updated');
      loadOrders();
    } catch (error) {
      message.error('Failed to update order');
    }
  };

  const handleCompleteAndCharge = async (order: Order) => {
    // Double-check BMS is enabled (defensive programming)
    if (!bmsEnabled) {
      message.warning('Billing module is not enabled. Cannot post charge to folio.');
      return;
    }
    
    if (!order.guestId) {
      message.warning('Cannot post charge: No guest associated with this order');
      return;
    }

    Modal.confirm({
      title: 'Complete Order & Post to Folio',
      content: `Post ₹${order.totalAmount.toLocaleString('en-IN')} to guest folio and mark order as complete?`,
      okText: 'Complete & Charge',
      cancelText: 'Cancel',
        onOk: async () => {
          try {
            if (!tenant?.id) {
              message.error('Tenant context not available');
              return;
            }
            
            // Post charge to guest folio
            await workflowService.postCrossModuleCharge(tenant.id, order.guestId!, {
              category: 'food_beverage',
              description: `Order ${order.orderNumber} - ${order.items?.length || 0} items`,
              amount: order.totalAmount,
              referenceType: 'order',
              referenceId: order.id,
            });

          // Update order status
          await orderService.updateStatus(tenant.id, order.id, 'completed');

          message.success('Order completed and charged to folio');
          addNotification({
            type: 'success',
            title: 'Order Charged',
            message: `₹${order.totalAmount.toLocaleString('en-IN')} posted to guest folio`,
            module: 'oms',
          });

          loadOrders();
        } catch (error: any) {
          message.error(error.message || 'Failed to post charge');
        }
      },
    });
  };

  const activeOrders = data?.data.filter((o) => !['completed', 'cancelled'].includes(o.status)).length || 0;
  const pendingOrders = data?.data.filter((o) => o.status === 'pending').length || 0;

  const columns: ColumnsType<Order> = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (value) => <span style={{ fontWeight: 500 }}>{value}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const colors: Record<string, string> = {
          room_service: 'blue',
          restaurant: 'green',
          bar: 'purple',
          spa: 'cyan',
          laundry: 'orange',
        };
        return <Tag color={colors[type] || 'default'}>{type.replace(/_/g, ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Location',
      key: 'location',
      width: 100,
      render: (_, record) => record.room?.roomNumber ? `Room ${record.room.roomNumber}` : record.tableNumber || '-',
    },
    {
      title: 'Guest',
      key: 'guest',
      width: 150,
      render: (_, record) => record.guest ? `${record.guest.firstName} ${record.guest.lastName}` : '-',
    },
    {
      title: 'Items',
      key: 'items',
      width: 80,
      align: 'center',
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => <Tag color={STATUS_COLORS[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Time',
      dataIndex: 'orderedAt',
      key: 'orderedAt',
      width: 100,
      render: (date: string) => dayjs(date).format('HH:mm'),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <EyeOutlined />, label: 'View Details' },
              ...(record.status === 'pending' ? [{ key: 'confirm', label: 'Confirm', onClick: () => handleStatusUpdate(record.id, 'confirmed') }] : []),
              ...(record.status === 'confirmed' ? [{ key: 'prepare', label: 'Start Preparing', onClick: () => handleStatusUpdate(record.id, 'preparing') }] : []),
              ...(record.status === 'preparing' ? [{ key: 'ready', label: 'Mark Ready', onClick: () => handleStatusUpdate(record.id, 'ready') }] : []),
              ...(record.status === 'ready' ? [{ key: 'deliver', label: 'Out for Delivery', onClick: () => handleStatusUpdate(record.id, 'delivering') }] : []),
              ...(record.status === 'delivering' ? [
                { key: 'complete', label: 'Complete', onClick: () => handleStatusUpdate(record.id, 'completed') },
                // Only show charge-to-folio option if BMS is enabled and order has a guest
                ...(bmsEnabled && record.guestId ? [{ key: 'charge', icon: <DollarOutlined />, label: 'Complete & Charge to Folio', onClick: () => handleCompleteAndCharge(record) }] : []),
              ] : []),
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Orders"
        subtitle="Manage room service and restaurant orders"
        breadcrumbs={[{ label: 'OMS', path: '/suite/oms' }, { label: 'Orders' }]}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadOrders}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />}>New Order</Button>
          </Space>
        }
      />

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Active Orders" value={activeOrders} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Pending" value={pendingOrders} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Completed Today" value={data?.data.filter((o) => o.status === 'completed').length || 0} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic 
              title="Avg. Time" 
              value={stats?.averagePrepTime || 14} 
              suffix="min" 
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Order Queue"
        extra={
          <Select
            placeholder="All Statuses"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.keys(STATUS_COLORS).map((s) => ({ label: s.replace(/_/g, ' ').toUpperCase(), value: s }))}
          />
        }
      >
        <Table columns={columns} dataSource={data?.data || []} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} size="middle" />
      </Card>
    </Space>
  );
}
