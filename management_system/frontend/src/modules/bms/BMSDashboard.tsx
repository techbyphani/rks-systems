import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography, Spin, message } from 'antd'
import { DollarCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { billingService } from '@/api';
import { useAppContext } from '@/context/AppContext';
import type { Folio, PaymentMethod } from '@/types';

const { Title, Text } = Typography

interface DashboardStats {
  revenueToday: number;
  pendingFolios: number;
  paymentSuccess: number;
  refunds: number;
  refundsValue: number;
}

export default function BMSDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openFolios, setOpenFolios] = useState<Folio[]>([]);
  const [paymentMix, setPaymentMix] = useState<Array<{ method: string; amount: number; label: string }>>([]);

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id]);

  const loadData = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const [metrics, foliosData, paymentBreakdown] = await Promise.all([
        billingService.getMetrics(tenant.id),
        billingService.getAllFolios({ tenantId: tenant.id, status: 'open', pageSize: 5 }),
        billingService.getPaymentBreakdown(tenant.id),
      ]);
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const revenueToday = metrics.todaysRevenue;
      const pendingFolios = metrics.openFolios;
      const paymentSuccess = 96.5; // This would come from payment processing stats
      const refunds = 0; // Would come from refund tracking
      const refundsValue = 0;
      
      setStats({
        revenueToday,
        pendingFolios,
        paymentSuccess,
        refunds,
        refundsValue,
      });
      
      setOpenFolios(foliosData.data);
      
      // Calculate payment mix
      const totalPayments = Object.values(paymentBreakdown).reduce((sum, val) => sum + val, 0);
      const mix = Object.entries(paymentBreakdown)
        .map(([method, amount]) => {
          const percentage = totalPayments > 0 ? Math.round((amount / totalPayments) * 100) : 0;
          const methodLabels: Record<PaymentMethod, string> = {
            cash: 'Cash',
            credit_card: 'Card',
            debit_card: 'Card',
            upi: 'UPI',
            bank_transfer: 'Wire',
            corporate_account: 'Corporate',
            other: 'Other',
            travel_agent: 'Travel Agent',
            voucher: 'Voucher',
          };
          return {
            method: methodLabels[method as PaymentMethod] || method,
            amount: percentage,
            label: `${percentage}% · ₹${Math.round(amount / 1000)}K`,
          };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4);
      
      setPaymentMix(mix);
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Billing Management System</Title>
        <Text type="secondary">Central ledger for folios, invoices, and payment capture.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Revenue Today" 
              value={stats?.revenueToday || 0} 
              prefix="₹" 
              valueStyle={{ color: '#eb2f96' }} 
            />
            <Text type="secondary">Today's collections</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card hoverable onClick={() => navigate('/suite/bms/folios')}>
            <Statistic 
              title="Pending Folios" 
              value={stats?.pendingFolios || 0} 
              suffix="folios" 
              valueStyle={{ color: '#fa8c16' }} 
            />
            <Text type="secondary">Require attention</Text>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Payment Success" 
              value={stats?.paymentSuccess || 0} 
              suffix="%" 
              valueStyle={{ color: '#52c41a' }} 
            />
            <Progress 
              percent={stats?.paymentSuccess || 0} 
              showInfo={false} 
              strokeColor="#52c41a" 
              style={{ marginTop: 12 }} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Refunds" 
              value={stats?.refunds || 0} 
              suffix="today" 
              valueStyle={{ color: '#722ed1' }} 
            />
            <Text type="secondary">Value ₹{stats?.refundsValue?.toLocaleString('en-IN') || 0}</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Open Folios" 
            extra={<FileTextOutlined />}
            hoverable
            onClick={() => navigate('/suite/bms/folios')}
          >
            {openFolios.length > 0 ? (
              <List
                dataSource={openFolios}
                renderItem={(folio) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/suite/bms/folios/${folio.id}`)}
                  >
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Space style={{ justifyContent: 'space-between' }}>
                        <Text strong>{folio.folioNumber}</Text>
                        <Tag color={folio.status === 'settled' ? 'green' : folio.status === 'disputed' ? 'red' : 'gold'}>
                          {folio.status}
                        </Tag>
                      </Space>
                      <Text type="secondary">
                        {folio.guest?.firstName} {folio.guest?.lastName} · Room {folio.room?.roomNumber || '-'}
                      </Text>
                      <Text strong style={{ color: '#eb2f96' }}>
                        ₹{folio.balance.toLocaleString('en-IN')}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No open folios</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Payment Mix" extra={<DollarCircleOutlined />}>
            {paymentMix.length > 0 ? (
              <List
                dataSource={paymentMix}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta title={item.method} description={<Text type="secondary">{item.label}</Text>} />
                    <Progress percent={item.amount} showInfo={false} style={{ width: 160 }} />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">No payment data</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
