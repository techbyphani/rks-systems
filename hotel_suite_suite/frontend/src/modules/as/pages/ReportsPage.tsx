import { useState } from 'react';
import { Card, Row, Col, Space, Button, Select, DatePicker, Statistic, Table, Progress, Typography } from 'antd';
import { DownloadOutlined, PrinterOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/shared';

const { Title, Text } = Typography;

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>('profit_loss');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf('month'), dayjs()]);

  // Mock report data
  const plData = {
    revenue: { rooms: 2850000, fnb: 890000, other: 245000, total: 3985000 },
    expenses: { salaries: 980000, utilities: 245000, supplies: 180000, marketing: 120000, other: 185000, total: 1710000 },
    netIncome: 2275000,
  };

  const occupancyData = [
    { month: 'Jan', rate: 72 }, { month: 'Feb', rate: 78 }, { month: 'Mar', rate: 82 },
    { month: 'Apr', rate: 75 }, { month: 'May', rate: 68 }, { month: 'Jun', rate: 85 },
  ];

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
          <Row gutter={16}>
            <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Revenue" value={plData.revenue.total} prefix="₹" valueStyle={{ color: '#52c41a' }} /></Card></Col>
            <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Expenses" value={plData.expenses.total} prefix="₹" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
            <Col xs={12} sm={6}><Card size="small"><Statistic title="Net Income" value={plData.netIncome} prefix="₹" valueStyle={{ color: '#1890ff', fontWeight: 600 }} /></Card></Col>
            <Col xs={12} sm={6}><Card size="small"><Statistic title="Margin" value={Math.round((plData.netIncome / plData.revenue.total) * 100)} suffix="%" valueStyle={{ color: '#722ed1' }} /></Card></Col>
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
      )}

      {reportType === 'occupancy' && (
        <Card title="Occupancy Trends">
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
