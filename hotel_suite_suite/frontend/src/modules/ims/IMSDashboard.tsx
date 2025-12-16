import { useEffect, useState } from 'react';
import { Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography, Spin, message } from 'antd'
import { AlertOutlined, InboxOutlined } from '@ant-design/icons'
import { inventoryService } from '@/api';
import type { InventoryItem } from '@/types';

const { Title, Text } = Typography

export default function IMSDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalItems: number;
    lowStockItems: number;
    outOfStock: number;
    totalValue: number;
  } | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, lowStockData] = await Promise.all([
        inventoryService.getStats(),
        inventoryService.getLowStock(),
      ]);
      setStats(statsData);
      setLowStockItems(lowStockData.slice(0, 5));
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

  const getConsumptionLevel = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.parLevel) * 100;
    if (percentage < 20) return 'Critical';
    if (percentage < 50) return 'High';
    return 'Medium';
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Inventory Management System</Title>
        <Text type="secondary">Stock visibility, par compliance, and usage analytics.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="SKUs Tracked" 
              value={stats?.totalItems || 0} 
              suffix="items" 
              valueStyle={{ color: '#a0d911' }} 
            />
            <Text type="secondary">{stats?.lowStockItems || 0} flagged at risk</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Out of Stock" 
              value={stats?.outOfStock || 0} 
              suffix="items" 
              valueStyle={{ color: '#ff4d4f' }} 
            />
            <Text type="secondary">Requires immediate attention</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Low Stock Items" 
              value={stats?.lowStockItems || 0} 
              suffix="items" 
              valueStyle={{ color: '#fa8c16' }} 
            />
            <Text type="secondary">Below reorder point</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Total Valuation" 
              value={stats?.totalValue || 0} 
              prefix="₹" 
              valueStyle={{ color: '#722ed1' }} 
            />
            <Text type="secondary">Current inventory value</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Low Stock Watchlist" extra={<AlertOutlined />}>
            {lowStockItems.length > 0 ? (
              <List
                dataSource={lowStockItems}
                renderItem={(item) => {
                  const consumption = getConsumptionLevel(item);
                  const percentage = Math.min((item.currentStock / item.parLevel) * 100, 100);
                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={item.name}
                        description={
                          <Text type="secondary">
                            Par {item.parLevel} · On hand {item.currentStock} · Reorder at {item.reorderPoint}
                          </Text>
                        }
                      />
                      <Space direction="vertical" size={4} align="end">
                        <Tag color={consumption === 'Critical' ? 'red' : consumption === 'High' ? 'orange' : 'blue'}>
                          {consumption}
                        </Tag>
                        <Progress 
                          percent={percentage} 
                          showInfo={false} 
                          size="small" 
                          strokeColor={consumption === 'Critical' ? '#ff4d4f' : consumption === 'High' ? '#fa8c16' : '#1890ff'}
                          style={{ width: 100 }}
                        />
                      </Space>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No low stock items</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" extra={<InboxOutlined />}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Text type="secondary">Inventory management tools</Text>
              <List
                dataSource={[
                  { label: 'View All Items', path: '/suite/ims/items' },
                  { label: 'Manage Categories', path: '/suite/ims/categories' },
                  { label: 'Manage Vendors', path: '/suite/ims/vendors' },
                  { label: 'Stock Movements', path: '/suite/ims/movements' },
                ]}
                renderItem={(action) => (
                  <List.Item style={{ cursor: 'pointer', padding: '8px 0' }}>
                    <Text>{action.label}</Text>
                  </List.Item>
                )}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
