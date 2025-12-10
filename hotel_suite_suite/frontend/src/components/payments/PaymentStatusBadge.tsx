import React from 'react'
import { Tag, Space, Typography, Tooltip } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { PaymentMethod, PaymentStatus } from '@/types/payment'
import { getPaymentMethodName, getPaymentMethodIcon } from '@/utils/paymentUtils'

const { Text } = Typography

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  paymentMethod?: PaymentMethod
  transactionId?: string
  showTransactionId?: boolean
  size?: 'small' | 'default' | 'large'
}

export default function PaymentStatusBadge({
  status,
  paymentMethod,
  transactionId,
  showTransactionId = false,
  size = 'default'
}: PaymentStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'Paid',
          bgColor: '#f6ffed',
          borderColor: '#b7eb8f'
        }
      case 'failed':
        return {
          color: 'error',
          icon: <CloseCircleOutlined />,
          text: 'Failed',
          bgColor: '#fff2f0',
          borderColor: '#ffccc7'
        }
      case 'pending':
        return {
          color: 'warning',
          icon: <ClockCircleOutlined />,
          text: 'Pending',
          bgColor: '#fffbe6',
          borderColor: '#ffe58f'
        }
      default:
        return {
          color: 'default',
          icon: null,
          text: 'Unknown',
          bgColor: '#fafafa',
          borderColor: '#d9d9d9'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Space direction="vertical" size="small">
      <Tag
        color={config.color}
        icon={config.icon}
        style={{
          fontSize: size === 'large' ? '14px' : size === 'small' ? '12px' : '13px',
          padding: size === 'large' ? '4px 12px' : '2px 8px'
        }}
      >
        {config.text}
      </Tag>
      {paymentMethod && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {getPaymentMethodIcon(paymentMethod)} {getPaymentMethodName(paymentMethod)}
        </Text>
      )}
      {showTransactionId && transactionId && (
        <Tooltip title="Transaction ID">
          <Text 
            type="secondary" 
            copyable={{ text: transactionId }}
            style={{ fontSize: '11px', fontFamily: 'monospace' }}
          >
            {transactionId}
          </Text>
        </Tooltip>
      )}
    </Space>
  )
}

