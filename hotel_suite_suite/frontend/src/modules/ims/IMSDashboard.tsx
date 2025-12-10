import { Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
import { AlertOutlined, InboxOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const lowStock = [
  { item: 'Bath Amenities', par: 600, onHand: 320, consumption: 'High' },
  { item: 'Housekeeping Linen', par: 450, onHand: 210, consumption: 'Medium' },
  { item: 'Coffee Pods', par: 900, onHand: 180, consumption: 'Critical' },
]

const inbound = [
  { vendor: 'FreshServe Supplies', eta: 'Today 16:00', content: 'Perishables · OMS-1198' },
  { vendor: 'Comfort Linen Co.', eta: 'Tomorrow 09:00', content: 'Rooms linen restock' },
]

export default function IMSDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Inventory Management System</Title>
        <Text type="secondary">Stock visibility, par compliance, and usage analytics.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="SKUs Tracked" value={184} suffix="items" valueStyle={{ color: '#a0d911' }} />
            <Text type="secondary">18 flagged at risk</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Monthly Consumption" value={3120} suffix="units" valueStyle={{ color: '#13c2c2' }} />
            <Text type="secondary">+4.2% vs forecast</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Reorder Pending" value={11} suffix="POs" valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary">Average approval 3h</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Valuation" value={418000} prefix="₹" valueStyle={{ color: '#722ed1' }} />
            <Text type="secondary">Storage utilization 68%</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Low Stock Watchlist" extra={<AlertOutlined />}>
            <List
              dataSource={lowStock}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.item}
                    description={<Text type="secondary">Par {item.par} · On hand {item.onHand}</Text>}
                  />
                  <Tag color={item.consumption === 'Critical' ? 'red' : item.consumption === 'High' ? 'orange' : 'blue'}>
                    {item.consumption}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Inbound Shipments" extra={<InboxOutlined />}>
            <List
              dataSource={inbound}
              renderItem={(shipment) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <Text strong>{shipment.vendor}</Text>
                    <Text type="secondary">ETA {shipment.eta}</Text>
                    <Text type="secondary">{shipment.content}</Text>
                  </Space>
                  <Progress percent={Math.floor(Math.random() * 50) + 40} showInfo={false} style={{ width: 120 }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
