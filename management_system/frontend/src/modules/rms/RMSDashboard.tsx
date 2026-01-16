import { useEffect, useState } from 'react'
import { Card, Col, Progress, Row, Space, Statistic, Table, Tag, Typography, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { roomService, housekeepingService } from '@/api'
import { useAppContext } from '@/context/AppContext'
import type { Room, HousekeepingTask } from '@/types'

const { Title, Text } = Typography

interface RoomRow {
  key: string
  room: string
  status: string
  assignment: string
  eta: string
}

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
  const { tenant } = useAppContext()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    dirty: 0,
    outOfOrder: 0,
    occupancyRate: 0,
  })
  const [roomRows, setRoomRows] = useState<RoomRow[]>([])
  const [housekeepingProgress, setHousekeepingProgress] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
  })

  useEffect(() => {
    if (tenant?.id) {
      loadData()
    }
  }, [tenant?.id])

  const loadData = async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      const [roomStats, roomsData, hkStats] = await Promise.all([
        roomService.getStats(tenant.id),
        roomService.getAll({ tenantId: tenant.id, pageSize: 20 }),
        housekeepingService.getStats(tenant.id),
      ])
      
      setStats(roomStats)
      
      // Create room rows from recent rooms
      const rows: RoomRow[] = roomsData.data.slice(0, 10).map((room: Room) => {
        const statusLabels: Record<string, string> = {
          available: 'Available',
          occupied: 'Occupied',
          dirty: 'Dirty',
          cleaning: 'Cleaning',
          out_of_order: 'Maintenance',
        }
        return {
          key: room.id,
          room: `${room.roomNumber} · ${room.roomType?.name || 'Unknown'}`,
          status: statusLabels[room.status] || room.status,
          assignment: room.status === 'dirty' ? 'Needs cleaning' : room.status === 'occupied' ? 'Guest in room' : 'Ready',
          eta: room.status === 'dirty' ? 'Pending' : room.status === 'available' ? 'Ready' : '-',
        }
      })
      setRoomRows(rows)
      
      setHousekeepingProgress({
        total: hkStats.total,
        completed: hkStats.completed + hkStats.verified,
        inProgress: hkStats.inProgress,
      })
    } catch (error) {
      // Error handling - in production, could log to error tracking service
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    )
  }
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Rooms Management System</Title>
        <Text type="secondary">Unify readiness, housekeeping, and engineering visibility.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Total Inventory" value={stats.total} suffix="rooms" valueStyle={{ color: '#1677ff' }} />
            <Text type="secondary">{stats.outOfOrder} rooms out of order</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Occupied" value={stats.occupied} suffix="rooms" valueStyle={{ color: '#52c41a' }} />
            <Progress percent={stats.occupancyRate} showInfo={false} strokeColor="#52c41a" style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Dirty" value={stats.dirty} suffix="rooms" valueStyle={{ color: '#fa8c16' }} />
            <Text type="secondary">Needs cleaning</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Available" value={stats.available} suffix="rooms" valueStyle={{ color: '#13c2c2' }} />
            <Text type="secondary">Ready for guests</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Room Readiness Board">
            <Table columns={columns} dataSource={roomRows} pagination={false} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Housekeeping Progress">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Today's Tasks</Text>
              <Progress 
                percent={housekeepingProgress.total > 0 ? Math.round((housekeepingProgress.completed / housekeepingProgress.total) * 100) : 0} 
                status="active" 
                strokeColor="#13c2c2" 
              />
              <Text type="secondary">
                {housekeepingProgress.completed} of {housekeepingProgress.total} completed
              </Text>
              {housekeepingProgress.inProgress > 0 && (
                <>
                  <Progress 
                    percent={housekeepingProgress.total > 0 ? Math.round((housekeepingProgress.inProgress / housekeepingProgress.total) * 100) : 0} 
                    status="active" 
                    strokeColor="#2f54eb" 
                  />
                  <Text type="secondary">{housekeepingProgress.inProgress} in progress</Text>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
