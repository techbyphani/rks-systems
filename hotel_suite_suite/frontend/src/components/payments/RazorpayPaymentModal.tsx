import React, { useState } from 'react'
import { Modal, Steps, Form, Input, Select, Button, Space, Typography, Card, Divider, Spin, Alert } from 'antd'
import { CreditCardOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { RazorpayPaymentModalProps, PaymentMethod } from '@/types/payment'
import { formatAmount, simulatePayment, getPaymentMethodName } from '@/utils/paymentUtils'
import PaymentMethodSelector from './PaymentMethodSelector'
import PaymentStatusBadge from './PaymentStatusBadge'
import './PaymentComponents.css'

const { Title, Text } = Typography
const { Option } = Select

export default function RazorpayPaymentModal({
  open,
  amount,
  description,
  onSuccess,
  onCancel,
  bookingId,
  billId,
  guestName
}: RazorpayPaymentModalProps) {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; transactionId?: string; orderId?: string; paymentId?: string } | null>(null)

  const steps = [
    { title: 'Select Method', icon: <CreditCardOutlined /> },
    { title: 'Enter Details', icon: <CreditCardOutlined /> },
    { title: 'Confirm', icon: <CheckCircleOutlined /> },
  ]

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setCurrentStep(1)
    form.setFieldsValue({ paymentMethod: method })
  }

  const handleNext = async () => {
    try {
      const values = await form.validateFields()
      if (currentStep === 1) {
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod) return

    setProcessing(true)
    try {
      const values = await form.validateFields()
      const result = await simulatePayment(amount, selectedMethod)

      if (result.success) {
        setPaymentResult({
          success: true,
          transactionId: result.transactionId,
          orderId: result.orderId,
          paymentId: result.paymentId
        })
        // Auto-close after 2 seconds and call onSuccess
        setTimeout(() => {
          onSuccess(result.transactionId, selectedMethod, result.orderId, result.paymentId)
          handleReset()
        }, 2000)
      } else {
        setPaymentResult({
          success: false,
          transactionId: result.transactionId
        })
      }
    } catch (error) {
      setPaymentResult({ success: false })
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setSelectedMethod(null)
    setPaymentResult(null)
    form.resetFields()
  }

  const handleCancel = () => {
    handleReset()
    onCancel()
  }

  const renderPaymentForm = () => {
    if (!selectedMethod) return null

    switch (selectedMethod) {
      case 'card':
        return (
          <>
            <Form.Item
              name="cardNumber"
              label="Card Number"
              rules={[
                { required: true, message: 'Please enter card number' },
                { pattern: /^\d{16}$/, message: 'Card number must be 16 digits' }
              ]}
            >
              <Input placeholder="1234 5678 9012 3456" maxLength={16} />
            </Form.Item>
            <Form.Item
              name="cardName"
              label="Cardholder Name"
              rules={[{ required: true, message: 'Please enter cardholder name' }]}
            >
              <Input placeholder="John Doe" />
            </Form.Item>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="expiry"
                label="Expiry"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: /^(0[1-9]|1[0-2])\/\d{2}$/, message: 'MM/YY format' }
                ]}
                style={{ flex: 1 }}
              >
                <Input placeholder="MM/YY" maxLength={5} />
              </Form.Item>
              <Form.Item
                name="cvv"
                label="CVV"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: /^\d{3,4}$/, message: 'Invalid CVV' }
                ]}
                style={{ flex: 1 }}
              >
                <Input placeholder="123" type="password" maxLength={4} />
              </Form.Item>
            </Space.Compact>
          </>
        )

      case 'upi':
        return (
          <Form.Item
            name="upiId"
            label="UPI ID"
            rules={[
              { required: true, message: 'Please enter UPI ID' },
              { pattern: /^[\w.-]+@[\w.-]+$/, message: 'Invalid UPI ID format' }
            ]}
          >
            <Input placeholder="yourname@upi" />
          </Form.Item>
        )

      case 'netbanking':
        return (
          <Form.Item
            name="bank"
            label="Select Bank"
            rules={[{ required: true, message: 'Please select a bank' }]}
          >
            <Select placeholder="Select your bank">
              <Option value="hdfc">HDFC Bank</Option>
              <Option value="icici">ICICI Bank</Option>
              <Option value="sbi">State Bank of India</Option>
              <Option value="axis">Axis Bank</Option>
              <Option value="kotak">Kotak Mahindra Bank</Option>
            </Select>
          </Form.Item>
        )

      case 'wallet':
        return (
          <Form.Item
            name="wallet"
            label="Select Wallet"
            rules={[{ required: true, message: 'Please select a wallet' }]}
          >
            <Select placeholder="Select your wallet">
              <Option value="paytm">Paytm</Option>
              <Option value="phonepe">PhonePe</Option>
              <Option value="gpay">Google Pay</Option>
              <Option value="amazon">Amazon Pay</Option>
            </Select>
          </Form.Item>
        )

      case 'cash':
        return (
          <Alert
            message="Cash Payment"
            description="Please confirm that you have received the cash payment of the amount shown below."
            type="info"
            showIcon
          />
        )

      default:
        return null
    }
  }

  return (
    <Modal
      title={
        <Space>
          <img 
            src="https://razorpay.com/assets/razorpay-glyph.svg" 
            alt="Razorpay" 
            style={{ width: '24px', height: '24px' }}
          />
          <span>Razorpay Payment</span>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      className="razorpay-payment-modal"
    >
      <Form form={form} layout="vertical">
        {/* Payment Amount Display */}
        <Card className="payment-amount-card">
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <Text type="secondary">Amount to Pay</Text>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              {formatAmount(amount)}
            </Title>
            {description && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {description}
              </Text>
            )}
            {guestName && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Guest: {guestName}
              </Text>
            )}
          </Space>
        </Card>

        {/* Steps Indicator */}
        <Steps current={currentStep} items={steps} style={{ margin: '24px 0' }} />

        {/* Step 0: Method Selection */}
        {currentStep === 0 && (
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelect={handleMethodSelect}
            disabled={processing}
          />
        )}

        {/* Step 1: Payment Details */}
        {currentStep === 1 && selectedMethod && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small" title={`Payment via ${getPaymentMethodName(selectedMethod)}`}>
              {renderPaymentForm()}
            </Card>
            <Form.Item name="paymentMethod" hidden initialValue={selectedMethod}>
              <Input />
            </Form.Item>
          </Space>
        )}

        {/* Step 2: Confirmation */}
        {currentStep === 2 && selectedMethod && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small" title="Payment Summary">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Amount:</Text>
                  <Text strong>{formatAmount(amount)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Payment Method:</Text>
                  <Text>{getPaymentMethodName(selectedMethod)}</Text>
                </div>
                {billId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Bill ID:</Text>
                    <Text>BILL{billId.toString().padStart(3, '0')}</Text>
                  </div>
                )}
                {bookingId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Booking ID:</Text>
                    <Text>{bookingId}</Text>
                  </div>
                )}
              </Space>
            </Card>
          </Space>
        )}

        {/* Payment Result */}
        {paymentResult && (
          <div style={{ marginTop: '16px' }}>
            {paymentResult.success ? (
              <Alert
                message="Payment Successful!"
                description={
                  <Space direction="vertical" size="small">
                    <Text>Transaction ID: {paymentResult.transactionId}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Your payment has been processed successfully.
                    </Text>
                  </Space>
                }
                type="success"
                icon={<CheckCircleOutlined />}
                showIcon
              />
            ) : (
              <Alert
                message="Payment Failed"
                description="The payment could not be processed. Please try again."
                type="error"
                icon={<CloseCircleOutlined />}
                showIcon
                action={
                  <Button size="small" onClick={() => setPaymentResult(null)}>
                    Retry
                  </Button>
                }
              />
            )}
          </div>
        )}

        {/* Footer Actions */}
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
          <Button onClick={handleCancel} disabled={processing}>
            Cancel
          </Button>
          <Space>
            {currentStep > 0 && currentStep < 2 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)} disabled={processing}>
                Back
              </Button>
            )}
            {currentStep === 1 && (
              <Button type="primary" onClick={handleNext} disabled={processing}>
                Continue
              </Button>
            )}
            {currentStep === 2 && !paymentResult && (
              <Button
                type="primary"
                onClick={handlePayment}
                loading={processing}
                icon={<CreditCardOutlined />}
              >
                {processing ? 'Processing...' : 'Pay Now'}
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </Modal>
  )
}

