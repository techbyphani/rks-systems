import React from 'react'
import { Card, Space, Typography } from 'antd'
import { PaymentMethod } from '@/types/payment'
import { getPaymentMethodName, getPaymentMethodIcon } from '@/utils/paymentUtils'
import './PaymentComponents.css'

const { Text } = Typography

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
  disabled?: boolean
}

const paymentMethods: PaymentMethod[] = ['card', 'upi', 'netbanking', 'wallet', 'cash']

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  disabled = false
}: PaymentMethodSelectorProps) {
  return (
    <div className="payment-method-selector">
      <Text strong style={{ display: 'block', marginBottom: '12px' }}>
        Select Payment Method
      </Text>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {paymentMethods.map((method) => (
          <Card
            key={method}
            className={`payment-method-card ${selectedMethod === method ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            hoverable={!disabled}
            onClick={() => !disabled && onSelect(method)}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <Space>
              <span className="payment-method-icon" style={{ fontSize: '24px' }}>
                {getPaymentMethodIcon(method)}
              </span>
              <Text strong={selectedMethod === method}>
                {getPaymentMethodName(method)}
              </Text>
            </Space>
          </Card>
        ))}
      </Space>
    </div>
  )
}

