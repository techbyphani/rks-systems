import React from 'react'
import { Card, Row, Col, Statistic, Progress, Space, Typography, Tag } from 'antd'
import { DollarOutlined, CreditCardOutlined, MobileOutlined, BankOutlined, WalletOutlined } from '@ant-design/icons'
import { PaymentMethod } from '@/types/payment'
import { formatAmount, getPaymentMethodName } from '@/utils/paymentUtils'

const { Title, Text } = Typography

interface PaymentAnalyticsProps {
  totalRevenue: number
  paymentMethodDistribution: Array<{
    method: PaymentMethod
    amount: number
    count: number
    percentage: number
  }>
  successRate: number
  averageTransactionValue: number
  totalTransactions: number
}

export default function PaymentAnalytics({
  totalRevenue,
  paymentMethodDistribution,
  successRate,
  averageTransactionValue,
  totalTransactions
}: PaymentAnalyticsProps) {
  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'card':
        return <CreditCardOutlined />
      case 'upi':
        return <MobileOutlined />
      case 'netbanking':
        return <BankOutlined />
      case 'wallet':
        return <WalletOutlined />
      case 'cash':
        return <DollarOutlined />
      default:
        return <DollarOutlined />
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Payment Overview Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              formatter={(value) => `₹${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={totalTransactions}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={successRate}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
            <Progress 
              percent={successRate} 
              strokeColor="#52c41a" 
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Transaction"
              value={averageTransactionValue}
              prefix="₹"
              valueStyle={{ color: '#722ed1', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Payment Method Distribution */}
      <Card title="Payment Method Distribution">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {paymentMethodDistribution.map((item) => (
            <div key={item.method}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Space>
                  {getMethodIcon(item.method)}
                  <Text strong>{getPaymentMethodName(item.method)}</Text>
                </Space>
                <Space>
                  <Text type="secondary">{item.count} transactions</Text>
                  <Text strong>{formatAmount(item.amount)}</Text>
                  <Tag color="blue">{item.percentage}%</Tag>
                </Space>
              </div>
              <Progress 
                percent={item.percentage} 
                strokeColor={
                  item.method === 'card' ? '#1890ff' :
                  item.method === 'upi' ? '#52c41a' :
                  item.method === 'netbanking' ? '#722ed1' :
                  item.method === 'wallet' ? '#faad14' :
                  '#8c8c8c'
                }
                showInfo={false}
              />
            </div>
          ))}
        </Space>
      </Card>

      {/* Payment Trends (Placeholder for future implementation) */}
      <Card title="Payment Trends (Last 7 Days)">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="secondary">
            Payment trends chart will be displayed here
          </Text>
        </div>
      </Card>
    </Space>
  )
}

