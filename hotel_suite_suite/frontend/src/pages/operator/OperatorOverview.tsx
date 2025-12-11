import { Card, Col, Row, Statistic, Typography, Timeline } from 'antd'
import { ApartmentOutlined, DeploymentUnitOutlined, TeamOutlined } from '@ant-design/icons'
import { TENANT_SUMMARIES } from '@/config/operator'

const { Title, Text } = Typography

export default function OperatorOverview() {
  const activeHotels = TENANT_SUMMARIES.filter((tenant) => tenant.status === 'active').length
  const totalUsers = 86 // mock summary

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Active Hotels" value={activeHotels} prefix={<ApartmentOutlined />} valueStyle={{ color: '#1677ff' }} />
          <Text type="secondary">{TENANT_SUMMARIES.length} total onboarded</Text>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Users provisioned" value={totalUsers} prefix={<TeamOutlined />} valueStyle={{ color: '#52c41a' }} />
          <Text type="secondary">12 role templates available</Text>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Deployments" value={3} prefix={<DeploymentUnitOutlined />} valueStyle={{ color: '#fa8c16' }} />
          <Text type="secondary">Latest: Jan 12, 2026</Text>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Activity">
          <Timeline
            items={[
              { color: 'green', children: 'Aurora Grand · Modules updated' },
              { color: 'blue', children: 'Pacific Breeze · Trial created' },
              { color: 'red', children: 'Serene Suites · Suspended due to billing' },
            ]}
          />
        </Card>
      </Col>
    </Row>
  )
}
