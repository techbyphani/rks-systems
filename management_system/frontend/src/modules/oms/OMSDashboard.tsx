import { useEffect, useState } from 'react';
import { Card, Col, List, Row, Space, Statistic, Steps, Tag, Typography, Spin, message } from 'antd'
import { CoffeeOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { orderService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Order } from '@/types';

const { Title, Text } = Typography

const workflow = ['Received', 'Kitchen', 'Runner', 'Delivered'];

const getWorkflowStep = (status: Order['status']): number => {
  const statusMap: Record<Order['status'], number> = {
    pending: 0,
    confirmed: 0,
    preparing: 1,
    ready: 2,
    delivering: 2,
    delivered: 3,
    completed: 3,
    cancelled: -1,
  };
  return statusMap[status] ?? 0;
};

export default function OMSDashboard() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    todaysOrders: number;
    pendingOrders: number;
    roomServiceOpen: number;
    todaysRevenue: number;
    averageOrderValue: number;
    averagePrepTime: number;
  } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [statsData, pendingData] = await Promise.all([
        orderService.getStats(tenant.id),
        orderService.getPending(tenant.id),
      ]);
      setStats(statsData);
      setPendingOrders(pendingData.filter(o => o.type === 'room_service').slice(0, 5));
      setInternalOrders(pendingData.filter(o => o.type === 'internal_requisition').slice(0, 5));
    } catch (error) {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Order Management System</Title>
        <Text type="secondary">Guest orders, internal requisitions, and delivery orchestration.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Room Service" 
              value={stats?.roomServiceOpen || 0} 
              suffix="open" 
              valueStyle={{ color: '#fa8c16' }} 
            />
            <Text type="secondary">Median prep {stats?.averagePrepTime || 0} min</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Today's Orders" 
              value={stats?.todaysOrders || 0} 
              suffix="orders" 
              valueStyle={{ color: '#1677ff' }} 
            />
            <Text type="secondary">Revenue ₹{stats?.todaysRevenue?.toLocaleString('en-IN') || 0}</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Pending Orders" 
              value={stats?.pendingOrders || 0} 
              suffix="orders" 
              valueStyle={{ color: '#722ed1' }} 
            />
            <Text type="secondary">Awaiting processing</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Avg Order Value" 
              value={stats?.averageOrderValue || 0} 
              prefix="₹" 
              valueStyle={{ color: '#52c41a' }} 
            />
            <Text type="secondary">Based on today's orders</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Room Service Queue" extra={<CoffeeOutlined />}>
            {pendingOrders.length > 0 ? (
              <List
                dataSource={pendingOrders}
                renderItem={(order) => {
                  const currentStep = getWorkflowStep(order.status);
                  return (
                    <List.Item>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between' }}>
                          <Text strong>{order.orderNumber}</Text>
                          <Tag color={order.status === 'preparing' ? 'orange' : order.status === 'ready' ? 'cyan' : 'blue'}>
                            {order.status.replace(/_/g, ' ').toUpperCase()}
                          </Tag>
                        </Space>
                        <Text type="secondary">
                          {order.room?.roomNumber ? `Room ${order.room.roomNumber}` : order.tableNumber || 'N/A'} · {order.items?.length || 0} items
                        </Text>
                        <Steps
                          current={currentStep >= 0 ? currentStep : 0}
                          size="small"
                          items={workflow.map((label) => ({ title: label }))}
                        />
                      </Space>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No pending room service orders</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Internal Requisitions" extra={<ShoppingCartOutlined />}>
            {internalOrders.length > 0 ? (
              <List
                dataSource={internalOrders}
                renderItem={(order) => (
                  <List.Item>
                    <List.Item.Meta
                      title={order.specialInstructions || 'Internal Requisition'}
                      description={<Text type="secondary">{order.items?.length || 0} items · {order.orderNumber}</Text>}
                    />
                    <Tag color={order.status === 'confirmed' ? 'blue' : order.status === 'completed' ? 'green' : 'gold'}>
                      {order.status.replace(/_/g, ' ').toUpperCase()}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No pending internal requisitions</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
