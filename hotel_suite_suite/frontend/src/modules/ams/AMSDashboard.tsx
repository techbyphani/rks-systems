import { Calendar, Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const attendanceAlerts = [
  { team: 'Front Office', status: 'Fully Staffed', color: 'green' },
  { team: 'Housekeeping', status: '2 call-outs', color: 'orange' },
  { team: 'Kitchen', status: 'Shift swap pending', color: 'gold' },
]

export default function AMSDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Attendance Management System</Title>
        <Text type="secondary">Shift adherence, leave tracking, and policy compliance.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Team Strength" value={168} suffix="staff" valueStyle={{ color: '#fa541c' }} />
            <Text type="secondary">Scheduled today: 142</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="On Time" value={94} suffix="%" valueStyle={{ color: '#52c41a' }} />
            <Text type="secondary">Late arrivals: 7</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Leave Requests" value={5} suffix="pending" valueStyle={{ color: '#eb2f96' }} />
            <Text type="secondary">Average approval 6h</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Compliance" value={98} suffix="%" valueStyle={{ color: '#1677ff' }} />
            <Text type="secondary">Timesheet submission by 23:00</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Shift Calendar">
            <Calendar fullscreen={false} value={dayjs()} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Roster Alerts">
            <List
              dataSource={attendanceAlerts}
              renderItem={(alert) => (
                <List.Item>
                  <List.Item.Meta
                    title={alert.team}
                    description={<Text type="secondary">{alert.status}</Text>}
                  />
                  <Tag color={alert.color}>{alert.status}</Tag>
                </List.Item>
              )}
            />
            <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
              <Text strong>Timesheet Completion</Text>
              <Progress percent={86} status="active" />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
