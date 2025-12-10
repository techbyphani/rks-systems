import React, { useState } from 'react'
import { List, Tag, Space, Typography, Button, Select, DatePicker, Empty, Descriptions, Modal } from 'antd'
import { DownloadOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons'
import { Transaction, PaymentMethod, PaymentStatus } from '@/types/payment'
import { formatAmount, getPaymentMethodName, getPaymentMethodIcon } from '@/utils/paymentUtils'
import PaymentStatusBadge from './PaymentStatusBadge'
import './PaymentComponents.css'
import dayjs from 'dayjs'

const { Text } = Typography
const { RangePicker } = DatePicker

interface TransactionHistoryProps {
  transactions: Transaction[]
  onViewDetails?: (transaction: Transaction) => void
  showFilters?: boolean
  maxHeight?: number
}

export default function TransactionHistory({
  transactions,
  onViewDetails,
  showFilters = true,
  maxHeight = 400
}: TransactionHistoryProps) {
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const filteredTransactions = transactions.filter((txn) => {
    if (filterMethod !== 'all' && txn.paymentMethod !== filterMethod) return false
    if (filterStatus !== 'all' && txn.status !== filterStatus) return false
    return true
  })

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDetailsModal(true)
    if (onViewDetails) {
      onViewDetails(transaction)
    }
  }

  const handleDownloadReceipt = (transaction: Transaction) => {
    // Mock receipt download
    const receiptContent = `
      Payment Receipt
      ===============
      Transaction ID: ${transaction.transactionId}
      Amount: ${formatAmount(transaction.amount)}
      Payment Method: ${getPaymentMethodName(transaction.paymentMethod)}
      Status: ${transaction.status.toUpperCase()}
      Date: ${new Date(transaction.createdAt).toLocaleString()}
      Guest: ${transaction.guestName}
      Description: ${transaction.description}
    `
    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt_${transaction.transactionId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="transaction-history">
      {showFilters && (
        <Space style={{ marginBottom: '16px', width: '100%' }} wrap>
          <Select
            value={filterMethod}
            onChange={setFilterMethod}
            style={{ width: 150 }}
            placeholder="Payment Method"
            suffixIcon={<FilterOutlined />}
          >
            <Select.Option value="all">All Methods</Select.Option>
            <Select.Option value="card">Card</Select.Option>
            <Select.Option value="upi">UPI</Select.Option>
            <Select.Option value="netbanking">Net Banking</Select.Option>
            <Select.Option value="wallet">Wallet</Select.Option>
            <Select.Option value="cash">Cash</Select.Option>
          </Select>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 150 }}
            placeholder="Status"
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="success">Success</Select.Option>
            <Select.Option value="failed">Failed</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
          </Select>
        </Space>
      )}

      {filteredTransactions.length === 0 ? (
        <Empty description="No transactions found" />
      ) : (
        <div style={{ maxHeight, overflowY: 'auto' }}>
          <List
            dataSource={filteredTransactions}
            renderItem={(transaction) => (
              <List.Item
                className="transaction-history-item"
                actions={[
                  <Button
                    key="view"
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetails(transaction)}
                  >
                    View
                  </Button>,
                  transaction.status === 'success' && (
                    <Button
                      key="download"
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadReceipt(transaction)}
                    >
                      Receipt
                    </Button>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{formatAmount(transaction.amount)}</Text>
                      <PaymentStatusBadge
                        status={transaction.status}
                        paymentMethod={transaction.paymentMethod}
                        size="small"
                      />
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {transaction.guestName} • {transaction.description}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        {transaction.transactionId} • {dayjs(transaction.createdAt).format('DD MMM YYYY, hh:mm A')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Transaction Details Modal */}
      <Modal
        title="Transaction Details"
        open={showDetailsModal}
        onCancel={() => {
          setShowDetailsModal(false)
          setSelectedTransaction(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowDetailsModal(false)
            setSelectedTransaction(null)
          }}>
            Close
          </Button>,
          selectedTransaction?.status === 'success' && (
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => selectedTransaction && handleDownloadReceipt(selectedTransaction)}
            >
              Download Receipt
            </Button>
          )
        ].filter(Boolean)}
        width={600}
      >
        {selectedTransaction && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Transaction ID">
              <Text copyable={{ text: selectedTransaction.transactionId }} style={{ fontFamily: 'monospace' }}>
                {selectedTransaction.transactionId}
              </Text>
            </Descriptions.Item>
            {selectedTransaction.razorpayOrderId && (
              <Descriptions.Item label="Order ID">
                <Text copyable={{ text: selectedTransaction.razorpayOrderId }} style={{ fontFamily: 'monospace' }}>
                  {selectedTransaction.razorpayOrderId}
                </Text>
              </Descriptions.Item>
            )}
            {selectedTransaction.razorpayPaymentId && (
              <Descriptions.Item label="Payment ID">
                <Text copyable={{ text: selectedTransaction.razorpayPaymentId }} style={{ fontFamily: 'monospace' }}>
                  {selectedTransaction.razorpayPaymentId}
                </Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Amount">
              <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                {formatAmount(selectedTransaction.amount)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Method">
              <Space>
                <span>{getPaymentMethodIcon(selectedTransaction.paymentMethod)}</span>
                <Text>{getPaymentMethodName(selectedTransaction.paymentMethod)}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <PaymentStatusBadge
                status={selectedTransaction.status}
                paymentMethod={selectedTransaction.paymentMethod}
                transactionId={selectedTransaction.transactionId}
                showTransactionId
              />
            </Descriptions.Item>
            <Descriptions.Item label="Guest Name">
              {selectedTransaction.guestName}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedTransaction.description}
            </Descriptions.Item>
            <Descriptions.Item label="Date & Time">
              {dayjs(selectedTransaction.createdAt).format('DD MMMM YYYY, hh:mm:ss A')}
            </Descriptions.Item>
            {selectedTransaction.billId && (
              <Descriptions.Item label="Bill ID">
                BILL{selectedTransaction.billId.toString().padStart(3, '0')}
              </Descriptions.Item>
            )}
            {selectedTransaction.bookingId && (
              <Descriptions.Item label="Booking ID">
                {selectedTransaction.bookingId}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

