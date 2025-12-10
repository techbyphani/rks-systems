export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet' | 'cash'

export type PaymentStatus = 'success' | 'failed' | 'pending'

export interface Transaction {
  id: string
  transactionId: string // Mock Razorpay transaction ID
  billId?: number
  bookingId?: string
  amount: number
  paymentMethod: PaymentMethod
  status: PaymentStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  createdAt: string
  guestName: string
  description: string
}

export interface RazorpayPaymentModalProps {
  open: boolean
  amount: number
  description?: string
  onSuccess: (transactionId: string, paymentMethod: PaymentMethod, razorpayOrderId: string, razorpayPaymentId: string) => void
  onCancel: () => void
  bookingId?: string
  billId?: number
  guestName?: string
}

