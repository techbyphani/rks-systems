import { Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const tasks = [
  { id: 'TK-221', title: 'Turn Suite 210', owner: 'Housekeeping', priority: 'High', status: 'In Progress' },
  { id: 'TK-198', title: 'Setup wedding banquet', owner: 'Events', priority: 'Urgent', status: 'Due 16:00' },
  { id: 'TK-202', title: 'Replace lobby signage', owner: 'Engineering', priority: 'Medium', status: 'Waiting Vendor' },
]

export default function TMSDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Task Management System</Title>
        <Text type="secondary">Cross-functional assignments, escalations, and SLAs.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Open Tasks" value={41} valueStyle={{ color: '#52c41a' }} />
            <Text type="secondary">Completed today: 63</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Urgent" value={6} suffix="items" valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary">2 escalated</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="On Track" value={88} suffix="%" valueStyle={{ color: '#1677ff' }} />
            <Progress percent={88} showInfo={false} style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Automation" value={14} suffix="playbooks" valueStyle={{ color: '#722ed1' }} />
            <Text type="secondary">Triggered this week</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Command Queue" extra={<CheckCircleOutlined />}>
            <List
              dataSource={tasks}
              renderItem={(task) => (
                <List.Item>
                  <List.Item.Meta
                    title={task.title}
                    description={<Text type="secondary">{task.owner}</Text>}
                  />
                  <Space direction="vertical" align="end" size={0}>
                    <Tag color={task.priority === 'Urgent' ? 'red' : task.priority === 'High' ? 'orange' : 'blue'}>
                      {task.priority}
                    </Tag>
                    <Text type="secondary">{task.status}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Department Breakdown">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Front Office</Text>
              <Progress percent={72} strokeColor="#1677ff" />
              <Text>Housekeeping</Text>
              <Progress percent={54} strokeColor="#52c41a" />
              <Text>Engineering</Text>
              <Progress percent={63} strokeColor="#eb2f96" />
              <Text>F&B</Text>
              <Progress percent={48} strokeColor="#faad14" />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
