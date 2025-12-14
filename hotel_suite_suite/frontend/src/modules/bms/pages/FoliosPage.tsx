import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, Dropdown, message, Select, Statistic, Row, Col, Card } from 'antd';
import { EyeOutlined, MoreOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader, DataTable, StatusTag } from '@/components/shared';
import { billingService, type FolioFilters } from '@/api';
import type { Folio, PaginatedResponse } from '@/types';

export default function FoliosPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedResponse<Folio> | null>(null);
  const [filters, setFilters] = useState<FolioFilters>({ page: 1, pageSize: 10 });
  const [metrics, setMetrics] = useState<{
    openFolios: number;
    totalOutstanding: number;
    todaysRevenue: number;
    pendingPayments: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [foliosData, metricsData] = await Promise.all([
        billingService.getAllFolios(filters),
        billingService.getMetrics(),
      ]);
      setData(foliosData);
      setMetrics(metricsData);
    } catch (error) {
      message.error('Failed to load folios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, pageSize }));
  };

  const columns: ColumnsType<Folio> = [
    {
      title: 'Folio #',
      dataIndex: 'folioNumber',
      key: 'folioNumber',
      fixed: 'left',
      width: 140,
      render: (value, record) => (
        <a onClick={() => navigate(`/suite/bms/folios/${record.id}`)}>{value}</a>
      ),
    },
    {
      title: 'Guest',
      key: 'guest',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>
            {record.guest?.firstName} {record.guest?.lastName}
          </span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            Room {record.room?.roomNumber || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <StatusTag status={status} type="folio" />,
    },
    {
      title: 'Total Charges',
      dataIndex: 'totalCharges',
      key: 'totalCharges',
      width: 130,
      align: 'right',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      title: 'Payments',
      dataIndex: 'totalPayments',
      key: 'totalPayments',
      width: 130,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: '#52c41a' }}>₹{value.toLocaleString('en-IN')}</span>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 130,
      align: 'right',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          ₹{value.toLocaleString('en-IN')}
        </span>
      ),
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => navigate(`/suite/bms/folios/${record.id}`),
              },
              {
                key: 'payment',
                icon: <DollarOutlined />,
                label: 'Collect Payment',
                onClick: () => navigate(`/suite/bms/folios/${record.id}?action=payment`),
              },
              {
                key: 'invoice',
                icon: <FileTextOutlined />,
                label: 'Generate Invoice',
                onClick: () => message.info('Invoice generation coming soon'),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Folios"
        subtitle="Manage guest folios and billing"
        breadcrumbs={[
          { label: 'BMS', path: '/suite/bms' },
          { label: 'Folios' },
        ]}
      />

      {/* Metrics */}
      {metrics && (
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Open Folios"
                value={metrics.openFolios}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Outstanding"
                value={metrics.totalOutstanding}
                prefix="₹"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Today's Revenue"
                value={metrics.todaysRevenue}
                prefix="₹"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Pending Payments"
                value={metrics.pendingPayments}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <DataTable<Folio>
        title="All Folios"
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={loading}
        onSearch={handleSearch}
        onRefresh={loadData}
        searchPlaceholder="Search by folio #, guest name..."
        pagination={{
          current: data?.page || 1,
          pageSize: data?.pageSize || 10,
          total: data?.total || 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} folios`,
        }}
        extra={
          <Space wrap>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 130 }}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
              options={[
                { label: 'Open', value: 'open' },
                { label: 'Closed', value: 'closed' },
                { label: 'Settled', value: 'settled' },
                { label: 'Disputed', value: 'disputed' },
              ]}
            />
            <Button
              onClick={() => setFilters((prev) => ({ ...prev, hasBalance: !prev.hasBalance, page: 1 }))}
              type={filters.hasBalance ? 'primary' : 'default'}
            >
              With Balance Only
            </Button>
          </Space>
        }
      />
    </Space>
  );
}
