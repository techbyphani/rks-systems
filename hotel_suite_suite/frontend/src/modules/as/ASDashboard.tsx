import { useEffect, useState } from 'react';
import { Card, Col, List, Progress, Row, Space, Statistic, Typography, Spin, message } from 'antd'
import { RiseOutlined, FallOutlined } from '@ant-design/icons'
import { analyticsService, accountService } from '@/api';

const { Title, Text } = Typography

export default function ASDashboard() {
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState<{
    revenueMTD: number;
    expensesMTD: number;
    grossOperatingProfit: number;
    revenueTrend: 'up' | 'down';
    expensesTrend: 'up' | 'down';
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getFinancialSummary();
      setFinancials(data);
    } catch (error) {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Format values in Crores
  const formatInCrores = (value: number) => (value / 10000000).toFixed(1);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Accounting System</Title>
        <Text type="secondary">Real-time ledgers, cash flow, and profitability snapshots.</Text>
      </div>

      <Row gutter={[16, 16]}>
        {financials && (
          <>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Revenue MTD"
                  value={formatInCrores(financials.revenueMTD)}
                  suffix="Cr"
                  valueStyle={{ color: financials.revenueTrend === 'up' ? '#52c41a' : '#fa541c' }}
                  prefix={financials.revenueTrend === 'up' ? <RiseOutlined /> : <FallOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Expenses MTD"
                  value={formatInCrores(financials.expensesMTD)}
                  suffix="Cr"
                  valueStyle={{ color: financials.expensesTrend === 'down' ? '#52c41a' : '#fa541c' }}
                  prefix={financials.expensesTrend === 'down' ? <RiseOutlined /> : <FallOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Gross Operating Profit"
                  value={formatInCrores(financials.grossOperatingProfit)}
                  suffix="Cr"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<RiseOutlined />}
                />
              </Card>
            </Col>
          </>
        )}
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
