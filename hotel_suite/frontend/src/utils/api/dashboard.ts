import { apiClient } from './client'

export interface DashboardStats {
  totalBookings: number
  checkedInGuests: number
  availableRooms: number
  totalRevenue: number
  roomStatusCounts: {
    available: number
    occupied: number
    maintenance: number
    dirty: number
    reserved: number
  }
}

export const dashboardApi = {
  getStats: () =>
    apiClient.get<DashboardStats>('/dashboard/stats')
}