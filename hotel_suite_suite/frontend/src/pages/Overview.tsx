import { Card, Col, Row, Statistic, Typography, Tag, Space, Progress, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { MODULES } from '@/config/modules'
import { useAppContext } from '@/context/AppContext'

const { Title, Paragraph, Text } = Typography

const quickMetrics = [
  { label: 'Occupancy', value: 82, suffix: '%', color: '#1677ff' },
  { label: 'Active Reservations', value: 124, suffix: '', color: '#2f54eb' },
  { label: 'Open Tasks', value: 19, suffix: '', color: '#fa8c16' },
  { label: 'Unpaid Folios', value: 7, suffix: '', color: '#eb2f96' },
]

export default function OverviewPage() {
  const { allowedModules, tenant } = useAppContext()
  const navigate = useNavigate()

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {tenant.name} · Unified Command Center
        </Title>
        <Paragraph type="secondary">
          Monitor every hospitality workflow across reservations, rooms, inventory, billing, and more — all powered by modular access control.
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

      <Card title="Enabled Management Systems">
        <Row gutter={[16, 16]}>
          {MODULES.filter((module) => allowedModules.includes(module.id)).map((module) => (
            <Col xs={24} md={12} xl={8} key={module.id}>
              <Card
                hoverable
                onClick={() => navigate(module.path)}
                style={{ borderLeft: `4px solid ${module.accent}` }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space align="center" size={12}>
                    <Tag color={module.accent} style={{ marginRight: 0 }}>
                      {module.shortName}
                    </Tag>
                    <Text strong>{module.name}</Text>
                  </Space>
                  <Paragraph type="secondary" style={{ minHeight: 48 }}>
                    {module.description}
                  </Paragraph>
                  <Button type="link" size="small" style={{ paddingLeft: 0 }}>
                    Open {module.shortName}
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </Space>
  )
}
