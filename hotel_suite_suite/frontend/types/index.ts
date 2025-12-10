// User Types
export interface User {
  id: number
  username: string
  role: 'admin' | 'reception'
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  role: string
}

// Room Types
export interface RoomType {
  id: number
  name: string
  basePrice: number
  capacity: number
  amenities: string[]
  createdAt: string
}

export interface Room {
  id: number
  roomNumber: string
  roomType: RoomType
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'dirty'
  floor: number
  images: RoomImage[]
  createdAt: string
}

export interface RoomImage {
  id: number
  imageUrl: string
  description?: string
}

// Guest Types
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

// Booking Types
export interface RoomBooking {
  id: number
  bookingId: string
  guest: Guest
  room: Room
  checkInDate: string
  checkOutDate: string
  actualCheckIn?: string
  actualCheckOut?: string
  adults: number
  children: number
  totalAmount: number
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  bookingSource: 'website' | 'phone' | 'walk_in' | 'chatbot'
  createdAt: string
}

export interface BookingRequest {
  guestName: string
  guestPhone: string
  roomTypeId: number
  checkInDate: string
  checkOutDate: string
  adults?: number
  children?: number
  bookingSource?: string
}

// Bill Types
export interface Bill {
  id: number
  billNumber: string
  roomBooking: RoomBooking
  guest: Guest
  roomCharges: number
  foodCharges: number
  otherCharges: number
  discount: number
  taxAmount: number
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'partial'
  paymentMethod?: string
  items: BillItem[]
  createdAt: string
  updatedAt: string
}

export interface BillItem {
  id: number
  itemType: 'room' | 'food' | 'service' | 'other'
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
}

// Feedback Types
export interface Feedback {
  id: number
  guest: Guest
  roomBooking?: RoomBooking
  roomRating?: number
  serviceRating?: number
  overallRating?: number
  comments?: string
  feedbackType: 'checkout' | 'general'
  createdAt: string
}

export interface FeedbackRequest {
  guestId: number
  roomBookingId?: number
  roomRating?: number
  serviceRating?: number
  overallRating?: number
  comments?: string
}

// Gallery Types
export interface GalleryImage {
  id: number
  imageUrl: string
  description?: string
  createdAt: string
}

// Dashboard Types
export interface DashboardStats {
  totalBookings: number
  checkedIn: number
  pendingCheckout: number
  availableRooms: number
  occupiedRooms: number
  unavailableRooms: number
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface ErrorResponse {
  error: string
  message: string
  details?: Record<string, string>
  timestamp: string
}