import { useEffect, useState } from 'react';
import { Card, Col, List, Row, Space, Statistic, Tag, Timeline, Typography, Spin, message } from 'antd'
import { TruckOutlined } from '@ant-design/icons'
import { vendorService, purchaseOrderService } from '@/api';
import type { Vendor } from '@/types';

const { Title, Text } = Typography

export default function SMSDashboard() {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pendingValue: number;
    received: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorsData, statsData] = await Promise.all([
        vendorService.getAll({ status: 'active' }),
        purchaseOrderService.getStats(),
      ]);
      setVendors(vendorsData.slice(0, 3)); // Top 3 vendors
      setStats(statsData);
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

  // Calculate on-time delivery rate (mock calculation)
  const onTimeRate = 92; // This would be calculated from delivery data
  const savingsRate = 6.4; // This would be calculated from budget vs actual

  // Generate delivery timeline (mock - would come from delivery service)
  const deliveryTimeline = [
    { color: 'green', children: '08:00 · Fresh dairy · Dock A' },
    { color: 'blue', children: '10:30 · Housekeeping supplies · Dock B' },
    { color: 'orange', children: '13:00 · Banquet AV · Yard' },
    { color: 'red', children: '16:00 · Engineering spare parts · Hold' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Supply Management System</Title>
        <Text type="secondary">Vendor orchestration, contract monitoring, and delivery windows.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic 
              title="Active Vendors" 
              value={vendors.length} 
              valueStyle={{ color: '#722ed1' }} 
            />
            <Text type="secondary">Top performing suppliers</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic 
              title="Pending Orders" 
              value={stats?.total || 0} 
              suffix="POs" 
              valueStyle={{ color: '#13c2c2' }} 
            />
            <Text type="secondary">On-time rate {onTimeRate}%</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic 
              title="Savings vs Budget" 
              value={savingsRate} 
              suffix="%" 
              valueStyle={{ color: '#52c41a' }} 
            />
            <Text type="secondary">Cost optimization active</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Delivery Timeline" extra={<TruckOutlined />}>
            <Timeline items={deliveryTimeline} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Vendor Performance">
            {vendors.length > 0 ? (
              <List
                dataSource={vendors}
                renderItem={(vendor) => (
                  <List.Item>
                    <List.Item.Meta
                      title={vendor.name}
                      description={
                        <Text type="secondary">
                          Lead time {vendor.leadTimeDays} days
                        </Text>
                      }
                    />
                    <Space size="small">
                      {vendor.rating && (
                        <Tag color="gold">Score {vendor.rating.toFixed(1)}</Tag>
                      )}
                      <Tag color={vendor.status === 'active' ? 'green' : 'default'}>
                        {vendor.status.toUpperCase()}
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No vendor data</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
