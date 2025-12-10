import { Card, Col, List, Row, Space, Statistic, Tag, Typography } from 'antd'
import { CalendarOutlined, TeamOutlined, WifiOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const channelMix = [
  { channel: 'Website', percentage: 46, status: 'Up 5% WoW' },
  { channel: 'OTA', percentage: 33, status: 'Flat' },
  { channel: 'Corporate', percentage: 14, status: 'Up 2 contracts' },
  { channel: 'Walk-in', percentage: 7, status: 'Down 2 bookings' },
]

const arrivals = [
  { guest: 'Isha Menon', time: '14:30', room: 'Deluxe 1204', status: 'VIP' },
  { guest: 'Oliver Grant', time: '16:15', room: 'Suite 210', status: 'Airport pickup' },
  { guest: 'Liu Wei', time: '18:00', room: 'Premier 804', status: 'Dinner reservation' },
]

export default function CRSDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Customer Reservation System</Title>
        <Text type="secondary">
          Centralized control for demand generation, booking pace, and arrival preparedness.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Active Reservations" value={132} suffix="stays" valueStyle={{ color: '#1677ff' }} />
            <Tag color="blue" style={{ marginTop: 12 }}>
              +12 since yesterday
            </Tag>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Pace vs Target" value={108} suffix="%" valueStyle={{ color: '#52c41a' }} />
            <Text type="secondary">Next 7 days pickup: 42 rooms</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Cancellation Risk" value={8.4} suffix="%" valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary">Monitor OTA bookings with flexible policy</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Channel Contribution" extra={<WifiOutlined />}>
            <List
              dataSource={channelMix}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.channel}
                    description={<Text type="secondary">{item.status}</Text>}
                  />
                  <Tag color="blue">{item.percentage}%</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Today's Arrivals" extra={<CalendarOutlined />}>
            <List
              dataSource={arrivals}
              renderItem={(arrival) => (
                <List.Item>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Space align="center" style={{ justifyContent: 'space-between' }}>
                      <Text strong>{arrival.guest}</Text>
                      <Tag color="geekblue">{arrival.status}</Tag>
                    </Space>
                    <Text type="secondary">
                      {arrival.time} · {arrival.room}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Pipeline Highlights" extra={<TeamOutlined />}>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 4 }}
          dataSource={[
            { label: 'Group Inquiries', value: 5 },
            { label: 'Waitlisted', value: 11 },
            { label: 'Upsell Opportunities', value: 18 },
            { label: 'Pending Approvals', value: 6 },
          ]}
          renderItem={(item) => (
            <List.Item>
              <Card bordered={false} style={{ textAlign: 'center' }}>
                <Statistic value={item.value} valueStyle={{ color: '#722ed1' }} />
                <Text type="secondary">{item.label}</Text>
              </Card>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
