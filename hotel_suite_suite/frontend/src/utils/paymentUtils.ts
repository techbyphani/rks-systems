import { PaymentMethod, PaymentStatus } from '@/types/payment'

/**
 * Generate a mock Razorpay transaction ID
 * Format: pay_XXXXXXXXXXXX (14 alphanumeric characters)
 */
export function generateTransactionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomChars = Array.from({ length: 14 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  return `pay_${randomChars}`
}

/**
 * Generate a mock Razorpay order ID
 * Format: order_XXXXXXXXXXXX (14 alphanumeric characters)
 */
export function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomChars = Array.from({ length: 14 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  return `order_${randomChars}`
}

/**
 * Generate a mock Razorpay payment ID
 * Format: pay_XXXXXXXXXXXX (14 alphanumeric characters)
 */
export function generatePaymentId(): string {
  return generateTransactionId()
}

/**
 * Simulate payment processing
 * Returns success 90% of the time for demo purposes
 */
export function simulatePayment(
  amount: number,
  paymentMethod: PaymentMethod
): Promise<{ success: boolean; transactionId: string; orderId: string; paymentId: string }> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const success = Math.random() > 0.1 // 90% success rate
      
      if (success) {
        resolve({
          success: true,
          transactionId: generateTransactionId(),
          orderId: generateOrderId(),
          paymentId: generatePaymentId(),
        })
      } else {
        resolve({
          success: false,
          transactionId: generateTransactionId(),
          orderId: generateOrderId(),
          paymentId: generatePaymentId(),
        })
      }
    }, 2000) // 2 second delay to simulate processing
  })
}

/**
 * Format amount with currency symbol
 */
export function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method: PaymentMethod): string {
  const names: Record<PaymentMethod, string> = {
    card: 'Credit/Debit Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
    cash: 'Cash',
  }
  return names[method]
}

/**
 * Get payment method icon (using Ant Design icons)
 */
export function getPaymentMethodIcon(method: PaymentMethod): string {
  const icons: Record<PaymentMethod, string> = {
    card: '💳',
    upi: '📱',
    netbanking: '🏦',
    wallet: '👛',
    cash: '💵',
  }
  return icons[method]
}

