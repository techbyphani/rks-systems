import { Card, Col, List, Row, Space, Statistic, Tag, Timeline, Typography } from 'antd'
import { TruckOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const vendors = [
  { name: 'Harvest Foods', score: 4.8, lead: '48h', status: 'Preferred' },
  { name: 'Metro Logistics', score: 4.2, lead: '24h', status: 'On Call' },
  { name: 'AquaPure', score: 4.5, lead: '72h', status: 'Preferred' },
]

export default function SMSDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Supply Management System</Title>
        <Text type="secondary">Vendor orchestration, contract monitoring, and delivery windows.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Active Vendors" value={32} valueStyle={{ color: '#722ed1' }} />
            <Text type="secondary">5 contracts expiring in 30 days</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Deliveries This Week" value={58} suffix="loads" valueStyle={{ color: '#13c2c2' }} />
            <Text type="secondary">On-time rate 92%</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Savings vs Budget" value={6.4} suffix="%" valueStyle={{ color: '#52c41a' }} />
            <Text type="secondary">Bulk coffee renegotiation completed</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Delivery Timeline" extra={<TruckOutlined />}>
            <Timeline
              items={[
                { color: 'green', children: '08:00 · Fresh dairy · Dock A' },
                { color: 'blue', children: '10:30 · Housekeeping supplies · Dock B' },
                { color: 'orange', children: '13:00 · Banquet AV · Yard' },
                { color: 'red', children: '16:00 · Engineering spare parts · Hold' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Vendor Performance">
            <List
              dataSource={vendors}
              renderItem={(vendor) => (
                <List.Item>
                  <List.Item.Meta
                    title={vendor.name}
                    description={<Text type="secondary">Lead time {vendor.lead}</Text>}
                  />
                  <Space size="small">
                    <Tag color="gold">Score {vendor.score}</Tag>
                    <Tag color={vendor.status === 'Preferred' ? 'green' : 'blue'}>{vendor.status}</Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
