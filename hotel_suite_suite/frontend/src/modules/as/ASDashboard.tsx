import { Card, Col, List, Progress, Row, Space, Statistic, Typography } from 'antd'
import { RiseOutlined, FallOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const financials = [
  { label: 'Revenue MTD', value: 5.4, suffix: 'Cr', trend: 'up' },
  { label: 'Expenses MTD', value: 3.1, suffix: 'Cr', trend: 'down' },
  { label: 'Gross Operating Profit', value: 2.3, suffix: 'Cr', trend: 'up' },
]

export default function ASDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Accounting System</Title>
        <Text type="secondary">Real-time ledgers, cash flow, and profitability snapshots.</Text>
      </div>

      <Row gutter={[16, 16]}>
        {financials.map((metric) => (
          <Col xs={24} md={8} key={metric.label}>
            <Card>
              <Statistic
                title={metric.label}
                value={metric.value}
                suffix={metric.suffix}
                valueStyle={{ color: metric.trend === 'up' ? '#52c41a' : '#fa541c' }}
                prefix={metric.trend === 'up' ? <RiseOutlined /> : <FallOutlined />}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Cash Flow" extra={<RiseOutlined />}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Operating Activities</Text>
              <Progress percent={78} strokeColor="#52c41a" />
              <Text>Investing Activities</Text>
              <Progress percent={34} strokeColor="#722ed1" />
              <Text>Financing Activities</Text>
              <Progress percent={52} strokeColor="#1677ff" />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Audit Notes">
            <List
              dataSource={[
                { id: 'AN-14', note: 'Reconcile banquet deposits', status: 'Due Friday' },
                { id: 'AN-15', note: 'Upload GST filings', status: 'In progress' },
                { id: 'AN-16', note: 'Archive FY24 docs', status: 'Complete' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.note}
                    description={<Text type="secondary">{item.status}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
