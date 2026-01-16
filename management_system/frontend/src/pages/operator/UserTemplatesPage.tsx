import { Card, Col, Row, Space, Tag, Typography } from 'antd'
import { USER_TEMPLATES } from '@/config/operator'

const { Title, Text } = Typography

export default function UserTemplatesPage() {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Title level={3} style={{ margin: 0 }}>
        Role Templates
      </Title>
      <Row gutter={[16, 16]}>
        {USER_TEMPLATES.map((template) => (
          <Col xs={24} md={12} key={template.role}>
            <Card title={template.role}>
              <Text type="secondary">{template.description}</Text>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {template.modules.map((module) => (
                  <Tag key={module} color="geekblue">
                    {module}
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  )
}
