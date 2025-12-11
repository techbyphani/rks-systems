import { Card, Col, List, Row, Statistic, Typography, Tag, Space, Progress } from 'antd'
import { useAppContext } from '@/context/AppContext'

const { Title, Paragraph, Text } = Typography

const quickMetrics = [
  { label: 'Occupancy', value: 82, suffix: '%', color: '#1677ff' },
  { label: 'Active Reservations', value: 124, suffix: '', color: '#2f54eb' },
  { label: 'Open Tasks', value: 19, suffix: '', color: '#fa8c16' },
  { label: 'Unpaid Folios', value: 7, suffix: '', color: '#eb2f96' },
]

const operationalAlerts = [
  { title: '12 arrivals pending pre-check-in', detail: 'CRS · action needed in next 2 hours', severity: 'blue' },
  { title: '7 rooms awaiting housekeeping clearance', detail: 'RMS · assign Team B for tower 2', severity: 'orange' },
  { title: 'Low stock: Coffee pods at 20% par', detail: 'IMS · PO #149 ready for approval', severity: 'magenta' },
]

export default function OverviewPage() {
  const { tenant } = useAppContext()

  if (!tenant) return null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {tenant.name} · Unified Command Center
        </Title>
        <Paragraph type="secondary">
          Monitor every hospitality workflow across reservations, rooms, inventory, billing, and more — powered by role-aware access.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {quickMetrics.map((metric) => (
          <Col xs={24} sm={12} lg={6} key={metric.label}>
            <Card>
              <Statistic
                title={metric.label}
                value={metric.value}
                suffix={metric.suffix}
                valueStyle={{ color: metric.color }}
              />
              <Progress percent={Math.min(metric.value, 100)} showInfo={false} strokeColor={metric.color} style={{ marginTop: 16 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Operational Alerts">
        <List
          dataSource={operationalAlerts}
          renderItem={(alert) => (
            <List.Item>
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Space align="baseline" size={12}>
                  <Tag color={alert.severity}>{alert.title}</Tag>
                  <Text>{alert.detail}</Text>
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
