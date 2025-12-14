import type { Reservation, ReservationStatus, PaginatedResponse } from '@/types';
import { mockReservations } from '../mockData';
import { mockGuests } from '../mockData/guests';
import { mockRoomTypes } from '../mockData/roomTypes';
import { delay, generateId, now, paginate, calculateNights } from '../helpers';

// In-memory store
let reservations = [...mockReservations];

const today = new Date().toISOString().split('T')[0];

export interface ReservationFilters {
  search?: string;
  status?: ReservationStatus | ReservationStatus[];
  checkInDate?: string;
  checkOutDate?: string;
  checkInFrom?: string;
  checkInTo?: string;
  guestId?: string;
  roomTypeId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateReservationDto {
  guestId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  infants?: number;
  source: Reservation['source'];
  paymentMode: Reservation['paymentMode'];
  roomRate?: number;
  specialRequests?: string;
  internalNotes?: string;
}

export interface UpdateReservationDto extends Partial<CreateReservationDto> {
  status?: ReservationStatus;
}

export const reservationService = {
  /**
   * Get all reservations with optional filtering
   */
  async getAll(filters: ReservationFilters = {}): Promise<PaginatedResponse<Reservation>> {
    await delay(300);
    
    let result = [...reservations];
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(r => statuses.includes(r.status));
    }
    
    // Guest filter
    if (filters.guestId) {
      result = result.filter(r => r.guestId === filters.guestId);
    }
    
    // Room type filter
    if (filters.roomTypeId) {
      result = result.filter(r => r.roomTypeId === filters.roomTypeId);
    }
    
    // Date filters
    if (filters.checkInDate) {
      result = result.filter(r => r.checkInDate >= filters.checkInDate!);
    }
    if (filters.checkOutDate) {
      result = result.filter(r => r.checkOutDate <= filters.checkOutDate!);
    }
    // Date range filters (checkInFrom/checkInTo)
    if (filters.checkInFrom) {
      result = result.filter(r => r.checkInDate >= filters.checkInFrom!);
    }
    if (filters.checkInTo) {
      result = result.filter(r => r.checkInDate <= filters.checkInTo!);
    }
    
    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(r => 
        r.confirmationNumber.toLowerCase().includes(searchLower) ||
        r.guest?.firstName.toLowerCase().includes(searchLower) ||
        r.guest?.lastName.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by check-in date descending
    result.sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
    
    return paginate(result, filters.page || 1, filters.pageSize || 10);
  },

  /**
   * Get a single reservation by ID
   */
  async getById(id: string): Promise<Reservation | null> {
    await delay(200);
    return reservations.find(r => r.id === id) || null;
  },

  /**
   * Get reservation by confirmation number
   */
  async getByConfirmation(confirmationNumber: string): Promise<Reservation | null> {
    await delay(200);
    return reservations.find(r => r.confirmationNumber === confirmationNumber) || null;
  },

  /**
   * Create a new reservation
   */
  async create(data: CreateReservationDto): Promise<Reservation> {
    await delay(500);
    
    const guest = mockGuests.find(g => g.id === data.guestId);
    const roomType = mockRoomTypes.find(rt => rt.id === data.roomTypeId);
    
    if (!guest) throw new Error('Guest not found');
    if (!roomType) throw new Error('Room type not found');
    
    const nights = calculateNights(data.checkInDate, data.checkOutDate);
    const roomRate = data.roomRate || roomType.baseRate;
    const totalAmount = roomRate * nights;
    
    const newReservation: Reservation = {
      id: generateId(),
      confirmationNumber: `AGH${new Date().getFullYear()}${String(reservations.length + 1).padStart(6, '0')}`,
      guestId: data.guestId,
      guest,
      roomTypeId: data.roomTypeId,
      roomType,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      nights,
      adults: data.adults,
      children: data.children || 0,
      infants: data.infants || 0,
      status: 'confirmed',
      source: data.source,
      roomRate,
      totalAmount,
      depositAmount: roomRate,
      depositPaid: false,
      paymentMode: data.paymentMode,
      specialRequests: data.specialRequests,
      internalNotes: data.internalNotes,
      createdAt: now(),
      updatedAt: now(),
    };
    
    reservations.unshift(newReservation);
    return newReservation;
  },

  /**
   * Update a reservation
   */
  async update(id: string, data: UpdateReservationDto): Promise<Reservation> {
    await delay(400);
    
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reservation not found');
    
    const current = reservations[index];
    
    // Recalculate if dates changed
    let nights = current.nights;
    let totalAmount = current.totalAmount;
    
    if (data.checkInDate || data.checkOutDate) {
      nights = calculateNights(
        data.checkInDate || current.checkInDate,
        data.checkOutDate || current.checkOutDate
      );
      const roomRate = data.roomRate || current.roomRate;
      totalAmount = roomRate * nights;
    }
    
    reservations[index] = {
      ...current,
      ...data,
      nights,
      totalAmount,
      updatedAt: now(),
    };
    
    return reservations[index];
  },

  /**
   * Check out a guest
   */
  async checkOut(id: string): Promise<Reservation> {
    await delay(400);
    
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reservation not found');
    
    reservations[index] = {
      ...reservations[index],
      status: 'checked_out',
      actualCheckOut: now(),
      updatedAt: now(),
    };
    
    return reservations[index];
  },

  /**
   * Get today's arrivals
   */
  async getTodaysArrivals(): Promise<Reservation[]> {
    await delay(200);
    return reservations.filter(r => 
      r.checkInDate === today && r.status === 'confirmed'
    );
  },

  /**
   * Get today's departures
   */
  async getTodaysDepartures(): Promise<Reservation[]> {
    await delay(200);
    return reservations.filter(r => 
      r.checkOutDate === today && r.status === 'checked_in'
    );
  },

  /**
   * Get in-house guests
   */
  async getInHouse(): Promise<Reservation[]> {
    await delay(200);
    return reservations.filter(r => r.status === 'checked_in');
  },

  /**
   * Get reservation statistics
   */
  async getStats(): Promise<{
    todaysArrivals: number;
    todaysDepartures: number;
    inHouse: number;
    totalReservations: number;
    confirmedUpcoming: number;
  }> {
    await delay(200);
    
    return {
      todaysArrivals: reservations.filter(r => r.checkInDate === today && r.status === 'confirmed').length,
      todaysDepartures: reservations.filter(r => r.checkOutDate === today && r.status === 'checked_in').length,
      inHouse: reservations.filter(r => r.status === 'checked_in').length,
      totalReservations: reservations.length,
      confirmedUpcoming: reservations.filter(r => r.status === 'confirmed' && r.checkInDate > today).length,
    };
  },

  /**
   * Get reservations by guest ID
   */
  async getByGuestId(guestId: string): Promise<Reservation[]> {
    await delay(200);
    return reservations
      .filter(r => r.guestId === guestId)
      .sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
  },

  /**
   * Get reservations by date range (for calendar)
   */
  async getByDateRange(startDate: string, endDate: string, roomTypeId?: string): Promise<Reservation[]> {
    await delay(300);
    return reservations.filter(r => {
      const matchesDateRange = r.checkInDate <= endDate && r.checkOutDate >= startDate;
      const matchesRoomType = !roomTypeId || r.roomTypeId === roomTypeId;
      return matchesDateRange && matchesRoomType;
    });
  },

  /**
   * Check in a guest
   */
  async checkIn(id: string, data: { roomId: string; notes?: string }): Promise<Reservation> {
    await delay(400);
    
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reservation not found');
    
    reservations[index] = {
      ...reservations[index],
      status: 'checked_in',
      roomId: data.roomId,
      actualCheckIn: now(),
      internalNotes: data.notes 
        ? `${reservations[index].internalNotes || ''}\n[Check-in] ${data.notes}`.trim()
        : reservations[index].internalNotes,
      updatedAt: now(),
    };
    
    return reservations[index];
  },

  /**
   * Cancel a reservation
   */
  async cancel(id: string, reason?: string): Promise<Reservation> {
    await delay(400);
    
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reservation not found');
    
    reservations[index] = {
      ...reservations[index],
      status: 'cancelled',
      cancelledAt: now(),
      cancellationReason: reason || 'Cancelled by user',
      updatedAt: now(),
    };
    
    return reservations[index];
  },
};
