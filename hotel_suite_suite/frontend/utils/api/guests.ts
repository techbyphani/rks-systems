import { apiClient } from './client'

export interface Guest {
  id: number
  name: string
  phone: string
  email?: string
  idProofType?: string
  idProofNumber?: string
  address?: string
  createdAt: string
}

export const guestsApi = {
  getAll: (search?: string) =>
    apiClient.get<Guest[]>('/guests', { params: { search } }),
  
  getById: (id: number) =>
    apiClient.get<Guest>(`/guests/${id}`),
  
  getBookings: (id: number) =>
    apiClient.get(`/guests/${id}/bookings`)
}