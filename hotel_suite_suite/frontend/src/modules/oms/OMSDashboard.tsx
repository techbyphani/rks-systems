import { Card, Col, List, Row, Space, Statistic, Steps, Tag, Typography } from 'antd'
import { CoffeeOutlined, ShoppingCartOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const orderQueue = [
  { id: 'RS-1045', guest: 'Room 1107', items: 3, status: 'In Prep', eta: '12 min' },
  { id: 'FL-209', guest: 'Pool Bar', items: 5, status: 'Awaiting Runner', eta: '5 min' },
  { id: 'IR-88', guest: 'Villa 03', items: 2, status: 'Out for delivery', eta: '2 min' },
]

const workflow = ['Received', 'Kitchen', 'Runner', 'Delivered']

export default function OMSDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Order Management System</Title>
        <Text type="secondary">Guest orders, internal requisitions, and delivery orchestration.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Room Service" value={28} suffix="open" valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary">Median prep 14 min</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="POS Orders" value={64} suffix="today" valueStyle={{ color: '#1677ff' }} />
            <Text type="secondary">Pool bar driving 32%</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Internal Requisitions" value={9} suffix="pending" valueStyle={{ color: '#722ed1' }} />
            <Text type="secondary">Linked to IMS</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Average CSAT" value={4.7} suffix="/5" valueStyle={{ color: '#52c41a' }} />
            <Text type="secondary">Based on 63 surveys</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Room Service Queue" extra={<CoffeeOutlined />}>
            <List
              dataSource={orderQueue}
              renderItem={(order) => (
                <List.Item>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Space style={{ justifyContent: 'space-between' }}>
                      <Text strong>{order.id}</Text>
                      <Tag color="orange">{order.status}</Tag>
                    </Space>
                    <Text type="secondary">
                      {order.guest} · {order.items} items · ETA {order.eta}
                    </Text>
                    <Steps
                      current={workflow.indexOf('Runner')}
                      size="small"
                      items={workflow.map((label) => ({ title: label }))}
                    />
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Internal Orders" extra={<ShoppingCartOutlined />}>
            <List
              dataSource={[
                { dept: 'Spa', need: 'Essential oils restock', status: 'Approved' },
                { dept: 'Banquets', need: 'AV equipment check', status: 'Awaiting IMS' },
                { dept: 'Housekeeping', need: 'Night shift trolley prep', status: 'Fulfilled' },
              ]}
              renderItem={(entry) => (
                <List.Item>
                  <List.Item.Meta
                    title={entry.dept}
                    description={<Text type="secondary">{entry.need}</Text>}
                  />
                  <Tag color={entry.status === 'Approved' ? 'blue' : entry.status === 'Fulfilled' ? 'green' : 'gold'}>
                    {entry.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
