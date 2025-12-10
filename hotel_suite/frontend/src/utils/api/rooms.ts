import { apiClient } from './client'

export interface Room {
  id: number
  roomNumber: string
  roomType: {
    id: number
    name: string
    basePrice: number
    capacity: number
  }
  status: string
  floor: number
  description?: string
}

export interface RoomType {
  id: number
  name: string
  basePrice: number
  capacity: number
  description?: string
}

export interface RoomRequest {
  roomNumber: string
  roomTypeId: number
  floor: number
  description?: string
}

export const roomsApi = {
  getAll: (search?: string) =>
    apiClient.get<Room[]>('/rooms', { params: { search } }),
  
  getById: (id: number) =>
    apiClient.get<Room>(`/rooms/${id}`),
  
  create: (data: RoomRequest) =>
    apiClient.post<Room>('/rooms', data),
  
  getAvailable: (params?: { checkIn?: string; checkOut?: string; roomTypeId?: number }) =>
    apiClient.get<Room[]>('/rooms/available', { params }),
  
  getByStatus: (status: string) =>
    apiClient.get<Room[]>(`/rooms/status/${status}`),
  
  updateStatus: (id: number, status: string) =>
    apiClient.put<Room>(`/rooms/${id}/status`, { status })
}

export const roomTypesApi = {
  getAll: () =>
    apiClient.get<RoomType[]>('/room-types')
}