import { Badge, Button, Card, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TENANT_SUMMARIES, type TenantSummary } from '@/config/operator'

const { Title, Text } = Typography

const columns: ColumnsType<TenantSummary> = [
  {
    title: 'Hotel',
    dataIndex: 'name',
    key: 'name',
    render: (_, record) => (
      <Space direction="vertical" size={0}>
        <Text strong>{record.name}</Text>
        <Text type="secondary">{record.region}</Text>
      </Space>
    ),
  },
  {
    title: 'Plan',
    dataIndex: 'plan',
    key: 'plan',
  },
  {
    title: 'Modules',
    dataIndex: 'modules',
    key: 'modules',
    render: (count: number) => <Tag color="purple">{count}</Tag>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: TenantSummary['status']) => (
      <Badge
        status={status === 'active' ? 'success' : status === 'trial' ? 'processing' : 'error'}
        text={status}
      />
    ),
  },
  {
    title: 'Go-live',
    dataIndex: 'goLiveDate',
    key: 'goLiveDate',
  },
]

export default function TenantsPage() {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          Managed Hotels
        </Title>
        <Button type="primary">Provision Hotel</Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={TENANT_SUMMARIES} rowKey="id" pagination={{ pageSize: 5 }} />
      </Card>
    </Space>
  )
}
