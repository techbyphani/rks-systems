import { apiClient } from './client'

export interface Booking {
  id: number
  bookingId: string
  guest: {
    id: number
    name: string
    phone: string
    email?: string
  }
  room: {
    id: number
    roomNumber: string
    roomType: {
      id: number
      name: string
      basePrice: number
    }
  }
  checkInDate: string
  checkOutDate: string
  adults: number
  children: number
  status: string
  totalAmount: number
  createdAt: string
}

export interface BookingRequest {
  guestName: string
  guestPhone: string
  roomTypeId: number
  checkInDate: string
  checkOutDate: string
  adults: number
  children: number
}

export const bookingsApi = {
  getAll: (params?: { status?: string; date?: string; limit?: number; search?: string }) =>
    apiClient.get<Booking[]>('/bookings', { params }),
  
  getById: (id: number) =>
    apiClient.get<Booking>(`/bookings/${id}`),
  
  create: (data: BookingRequest) =>
    apiClient.post<Booking>('/bookings', data),
  
  update: (id: number, data: BookingRequest) =>
    apiClient.put<Booking>(`/bookings/${id}`, data),
  
  cancel: (id: number) =>
    apiClient.delete(`/bookings/${id}`),
  
  checkIn: (id: number) =>
    apiClient.put<Booking>(`/bookings/${id}/checkin`),
  
  checkOut: (id: number) =>
    apiClient.put<Booking>(`/bookings/${id}/checkout`),
  
  getTodayArrivals: () =>
    apiClient.get<Booking[]>('/bookings/today/arrivals'),
  
  getTodayDepartures: () =>
    apiClient.get<Booking[]>('/bookings/today/departures')
}