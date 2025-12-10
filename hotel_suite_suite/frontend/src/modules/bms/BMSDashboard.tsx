import { Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
import { DollarCircleOutlined, FileTextOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const folios = [
  { id: 'F-8931', guest: 'Suite 2301', balance: 18200, status: 'Pending Card' },
  { id: 'F-8925', guest: 'Villa 02', balance: 5400, status: 'City Ledger' },
  { id: 'F-8910', guest: 'Room 909', balance: 0, status: 'Closed' },
]

export default function BMSDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Billing Management System</Title>
        <Text type="secondary">Central ledger for folios, invoices, and payment capture.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Revenue Today" value={248000} prefix="₹" valueStyle={{ color: '#eb2f96' }} />
            <Text type="secondary">ADR ₹8,900</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Pending Folios" value={14} suffix="folios" valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary">Oldest 3h</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Payment Success" value={96.5} suffix="%" valueStyle={{ color: '#52c41a' }} />
            <Progress percent={96.5} showInfo={false} strokeColor="#52c41a" style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Refunds" value={2} suffix="today" valueStyle={{ color: '#722ed1' }} />
            <Text type="secondary">Value ₹12,400</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Open Folios" extra={<FileTextOutlined />}>
            <List
              dataSource={folios}
              renderItem={(folio) => (
                <List.Item>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Space style={{ justifyContent: 'space-between' }}>
                      <Text strong>{folio.id}</Text>
                      <Tag color={folio.status === 'Closed' ? 'green' : folio.status === 'City Ledger' ? 'blue' : 'gold'}>
                        {folio.status}
                      </Tag>
                    </Space>
                    <Text type="secondary">{folio.guest}</Text>
                    <Text strong style={{ color: '#eb2f96' }}>₹{folio.balance.toLocaleString('en-IN')}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Payment Mix" extra={<DollarCircleOutlined />}>
            <List
              dataSource={[
                { method: 'Card', amount: 58, label: '58% · ₹144K' },
                { method: 'UPI', amount: 22, label: '22% · ₹54K' },
                { method: 'Cash', amount: 12, label: '12% · ₹30K' },
                { method: 'Wire', amount: 8, label: '8% · ₹20K' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item.method} description={<Text type="secondary">{item.label}</Text>} />
                  <Progress percent={item.amount} showInfo={false} style={{ width: 160 }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
