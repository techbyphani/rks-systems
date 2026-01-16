import { useState, useEffect } from 'react';
import { Card, Row, Col, Space, Button, Select, DatePicker, Statistic, Table, Progress, Typography, Spin, message } from 'antd';
import { DownloadOutlined, PrinterOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';
import { analyticsService } from '@/api';
import { useAppContext } from '@/context/AppContext';

const { Title, Text } = Typography;

export default function ReportsPage() {
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<string>('profit_loss');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf('month'), dayjs()]);
  const [plData, setPlData] = useState<{
    revenue: { rooms: number; fnb: number; other: number; total: number };
    expenses: { salaries: number; utilities: number; supplies: number; marketing: number; other: number; total: number };
    netIncome: number;
  } | null>(null);
  const [occupancyData, setOccupancyData] = useState<Array<{ month: string; rate: number }>>([]);

  useEffect(() => {
    if (tenant?.id) {
      if (reportType === 'profit_loss') {
        loadProfitLossReport();
      } else if (reportType === 'occupancy') {
        loadOccupancyReport();
      }
    }
  }, [reportType, dateRange, tenant?.id]);

  const loadProfitLossReport = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await analyticsService.getProfitLossReport(
        tenant.id,
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      );
      setPlData(data);
    } catch (error) {
      message.error('Failed to load profit & loss report');
    } finally {
      setLoading(false);
    }
  };

  const loadOccupancyReport = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await analyticsService.getOccupancyReport(tenant.id);
      setOccupancyData(data);
    } catch (error) {
      message.error('Failed to load occupancy report');
    } finally {
      setLoading(false);
    }
  };

  const reportOptions = [
    { label: 'Profit & Loss', value: 'profit_loss' },
    { label: 'Balance Sheet', value: 'balance_sheet' },
    { label: 'Cash Flow', value: 'cash_flow' },
    { label: 'Occupancy Report', value: 'occupancy' },
    { label: 'Revenue by Source', value: 'revenue_source' },
    { label: 'ADR & RevPAR', value: 'adr_revpar' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Financial Reports"
        subtitle="Generate and view financial reports"
        breadcrumbs={[{ label: 'Accounting', path: '/suite/as' }, { label: 'Reports' }]}
        actions={
          <Space>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button icon={<PrinterOutlined />}>Print</Button>
          </Space>
        }
      />

      <Card size="small">
        <Space wrap>
          <Select value={reportType} onChange={setReportType} style={{ width: 200 }} options={reportOptions} />
          <DatePicker.RangePicker value={dateRange} onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])} />
          <Button type="primary">Generate Report</Button>
        </Space>
      </Card>

      {reportType === 'profit_loss' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : plData ? (
            <>
              <Row gutter={16}>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic 
                      title="Total Revenue" 
                      value={plData.revenue.total} 
                      prefix="₹" 
                      valueStyle={{ color: '#52c41a' }} 
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic 
                      title="Total Expenses" 
                      value={plData.expenses.total} 
                      prefix="₹" 
                      valueStyle={{ color: '#ff4d4f' }} 
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic 
                      title="Net Income" 
                      value={plData.netIncome} 
                      prefix="₹" 
                      valueStyle={{ color: '#1890ff', fontWeight: 600 }} 
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic 
                      title="Margin" 
                      value={plData.revenue.total > 0 ? Math.round((plData.netIncome / plData.revenue.total) * 100) : 0} 
                      suffix="%" 
                      valueStyle={{ color: '#722ed1' }} 
                    />
                  </Card>
                </Col>
              </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card title="Revenue Breakdown" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Room Revenue</Text><Text strong>₹{plData.revenue.rooms.toLocaleString()}</Text></div>
                  <Progress percent={Math.round((plData.revenue.rooms / plData.revenue.total) * 100)} strokeColor="#1890ff" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>F&B Revenue</Text><Text strong>₹{plData.revenue.fnb.toLocaleString()}</Text></div>
                  <Progress percent={Math.round((plData.revenue.fnb / plData.revenue.total) * 100)} strokeColor="#52c41a" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Other Revenue</Text><Text strong>₹{plData.revenue.other.toLocaleString()}</Text></div>
                  <Progress percent={Math.round((plData.revenue.other / plData.revenue.total) * 100)} strokeColor="#722ed1" />
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Expense Breakdown" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Salaries & Wages</Text><Text strong>₹{plData.expenses.salaries.toLocaleString()}</Text></div>
                  <Progress percent={Math.round((plData.expenses.salaries / plData.expenses.total) * 100)} strokeColor="#ff4d4f" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Utilities</Text><Text strong>₹{plData.expenses.utilities.toLocaleString()}</Text></div>
                  <Progress percent={Math.round((plData.expenses.utilities / plData.expenses.total) * 100)} strokeColor="#fa8c16" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Supplies</Text><Text strong>₹{plData.expenses.supplies.toLocaleString()}</Text></div>
                  <Progress percent={Math.round((plData.expenses.supplies / plData.expenses.total) * 100)} strokeColor="#faad14" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Marketing</Text><Text strong>₹{plData.expenses.marketing.toLocaleString()}</Text></div>
                  <Progress percent={Math.round((plData.expenses.marketing / plData.expenses.total) * 100)} strokeColor="#13c2c2" />
                </Space>
              </Card>
            </Col>
          </Row>
            </>
          ) : null}
        </>
      )}

      {reportType === 'occupancy' && (
        <Card title="Occupancy Trends" loading={loading}>
          {occupancyData.length > 0 ? (
            <Row gutter={16}>
              <Col span={24}>
                <Table
                  dataSource={occupancyData}
                  rowKey="month"
                  pagination={false}
                  columns={[
                    { title: 'Month', dataIndex: 'month', key: 'month' },
                    { title: 'Occupancy Rate', dataIndex: 'rate', key: 'rate', render: (rate: number) => <Progress percent={rate} style={{ width: 200 }} /> },
                  ]}
                />
              </Col>
            </Row>
          ) : null}
        </Card>
      )}

      {!['profit_loss', 'occupancy'].includes(reportType) && (
        <Card>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <LineChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Title level={4} style={{ marginTop: 16, color: '#8c8c8c' }}>Report Preview</Title>
            <Text type="secondary">Select date range and click "Generate Report" to view</Text>
          </div>
        </Card>
      )}
    </Space>
  );
}
