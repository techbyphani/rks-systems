import { apiClient } from './client'

export interface Feedback {
  id: number
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
  roomRating: number
  serviceRating: number
  overallRating: number
  comments?: string
  feedbackType: string
  createdAt: string
}

export interface FeedbackRequest {
  bookingId: number
  roomRating: number
  serviceRating: number
  overallRating: number
  comments?: string
  feedbackType?: string
}

export const feedbackApi = {
  getAll: () =>
    apiClient.get<Feedback[]>('/feedback'),
  
  create: (data: FeedbackRequest) =>
    apiClient.post<Feedback>('/feedback', data)
}