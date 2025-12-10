import { Card, Col, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface RoomRow {
  key: string
  room: string
  status: string
  assignment: string
  eta: string
}

const rooms: RoomRow[] = [
  { key: '101', room: '101 · Deluxe', status: 'Occupied', assignment: 'Due out 11:00', eta: 'Housekeeping 12:00' },
  { key: '202', room: '202 · Premier', status: 'Dirty', assignment: 'Assigned to Team B', eta: 'Ready in 25m' },
  { key: '305', room: '305 · Suite', status: 'Maintenance', assignment: 'HVAC check', eta: 'Hold' },
  { key: '804', room: '804 · Premier', status: 'Available', assignment: 'Clean inspection done', eta: 'Ready' },
]

const columns: ColumnsType<RoomRow> = [
  { title: 'Room', dataIndex: 'room', key: 'room' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const color =
        status === 'Available'
          ? 'green'
          : status === 'Occupied'
          ? 'blue'
          : status === 'Dirty'
          ? 'orange'
          : 'magenta'
      return <Tag color={color}>{status}</Tag>
    },
  },
  { title: 'Assignment', dataIndex: 'assignment', key: 'assignment' },
  { title: 'ETA / Notes', dataIndex: 'eta', key: 'eta' },
]

export default function RMSDashboard() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Rooms Management System</Title>
        <Text type="secondary">Unify readiness, housekeeping, and engineering visibility.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Total Inventory" value={220} suffix="rooms" valueStyle={{ color: '#1677ff' }} />
            <Text type="secondary">14 rooms out of order</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Occupied" value={174} suffix="rooms" valueStyle={{ color: '#52c41a' }} />
            <Progress percent={79} showInfo={false} strokeColor="#52c41a" style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Dirty" value={18} suffix="rooms" valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary">6 due within 1 hour</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Maintenance" value={12} suffix="cases" valueStyle={{ color: '#eb2f96' }} />
            <Text type="secondary">3 escalated to engineering</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Room Readiness Board">
            <Table columns={columns} dataSource={rooms} pagination={false} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Housekeeping Progress">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Blocks</Text>
              <Progress percent={68} status="active" strokeColor="#13c2c2" />
              <Text type="secondary">Team A · Tower 1</Text>
              <Progress percent={54} status="active" strokeColor="#2f54eb" />
              <Text type="secondary">Team B · Tower 2</Text>
              <Progress percent={82} status="active" strokeColor="#52c41a" />
              <Text type="secondary">Team C · Villas</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
