import { apiClient } from './client'

export interface Bill {
  id: number
  billNumber: string
  guest: {
    id: number
    name: string
  }
  roomBooking: {
    id: number
    bookingId: string
    room: {
      roomNumber: string
    }
  }
  roomCharges: number
  foodCharges: number
  otherCharges: number
  taxAmount: number
  totalAmount: number
  paymentStatus: string
  paymentMethod?: string
  transactionId?: string
  items?: BillItem[]
  createdAt: string
}

export interface BillItem {
  id: number
  description: string
  amount: number
  quantity: number
}

export interface BillRequest {
  bookingId: number
  roomCharges: number
  foodCharges?: number
  otherCharges?: number
  taxAmount?: number
}

export interface BillItemRequest {
  description: string
  amount: number
  quantity?: number
}

export interface PaymentUpdateRequest {
  paymentStatus: string
  paymentMethod?: string
  transactionId?: string
}

export const billsApi = {
  getAll: () =>
    apiClient.get<Bill[]>('/bills'),
  
  getById: (id: number) =>
    apiClient.get<Bill>(`/bills/${id}`),
  
  create: (data: BillRequest) =>
    apiClient.post<Bill>('/bills', data),
  
  updatePayment: (id: number, data: PaymentUpdateRequest) =>
    apiClient.put<Bill>(`/bills/${id}/payment`, data),
  
  getByBooking: (bookingId: number) =>
    apiClient.get<Bill[]>(`/bills/booking/${bookingId}`),
  
  getByGuest: (guestId: number) =>
    apiClient.get<Bill[]>(`/bills/guest/${guestId}`),
  
  addItem: (billId: number, data: BillItemRequest) =>
    apiClient.post<BillItem>(`/bills/${billId}/items`, data),
  
  updateItem: (billId: number, itemId: number, data: BillItemRequest) =>
    apiClient.put<BillItem>(`/bills/${billId}/items/${itemId}`, data),
  
  deleteItem: (billId: number, itemId: number) =>
    apiClient.delete(`/bills/${billId}/items/${itemId}`)
}