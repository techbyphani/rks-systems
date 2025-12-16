import type { Reservation, ReservationStatus, PaginatedResponse } from '@/types';
import { mockReservations } from '../mockData';
import { mockGuests } from '../mockData/guests';
import { mockRoomTypes } from '../mockData/roomTypes';
import { delay, generateId, now, paginate, calculateNights } from '../helpers';
import { NotFoundError, BusinessRuleError, ValidationError, ConflictError } from '../errors';
import { requireTenantId, filterByTenant, findByIdAndTenant, verifyTenantAccess } from '../helpers/tenantFilter';
import { checkVersion, incrementVersion, getVersion, type VersionedEntity } from '../helpers/optimisticLock';

// In-memory store - ensure it's always a valid array
let reservations: Reservation[] = [];

try {
  reservations = [...(mockReservations || [])];
} catch (e) {
  reservations = [];
}

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
  tenantId?: string; // CRITICAL: Tenant isolation
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
   * CRITICAL FIX: Added tenant isolation
   */
  async getAll(filters: ReservationFilters = {}): Promise<PaginatedResponse<Reservation>> {
    await delay(300);
    
    // CRITICAL: Require tenantId for tenant isolation
    const tenantId = requireTenantId(filters.tenantId);
    
    // Ensure reservations is always an array
    if (!Array.isArray(reservations)) {
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
    
    // CRITICAL: Filter by tenant first
    let result = filterByTenant([...reservations], tenantId) as Reservation[];
    
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
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<Reservation | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(reservations, id, tenantId);
  },

  /**
   * Get reservation by confirmation number
   * CRITICAL FIX: Added tenant isolation
   */
  async getByConfirmation(tenantId: string, confirmationNumber: string): Promise<Reservation | null> {
    await delay(200);
    requireTenantId(tenantId);
    const filtered = filterByTenant(reservations, tenantId) as Reservation[];
    return filtered.find(r => r.confirmationNumber === confirmationNumber) || null;
  },

  /**
   * Create a new reservation
   * CRITICAL FIX: Added tenant isolation and input validation
   */
  async create(tenantId: string, data: CreateReservationDto): Promise<Reservation> {
    await delay(500);
    
    // CRITICAL: Require tenantId
    requireTenantId(tenantId);
    
    // Input Validation: Check-out date must be after check-in date
    if (data.checkOutDate <= data.checkInDate) {
      throw new ValidationError(
        'Check-out date must be after check-in date',
        { checkInDate: data.checkInDate, checkOutDate: data.checkOutDate }
      );
    }
    
    // Input Validation: Check-in date cannot be in the past (for confirmed reservations)
    const today = new Date().toISOString().split('T')[0];
    if (data.checkInDate < today) {
      throw new ValidationError(
        'Check-in date cannot be in the past',
        { checkInDate: data.checkInDate, today }
      );
    }
    
    // Input Validation: Must have at least 1 adult
    if (!data.adults || data.adults < 1) {
      throw new ValidationError(
        'Reservation must have at least 1 adult',
        { adults: data.adults }
      );
    }
    
    // CRITICAL: Verify guest belongs to tenant
    const tenantGuests = filterByTenant(mockGuests, tenantId) as typeof mockGuests;
    const guest = tenantGuests.find(g => g.id === data.guestId);
    // Room types are shared, but we should verify it exists
    const roomType = mockRoomTypes.find(rt => rt.id === data.roomTypeId);
    
    if (!guest) {
      throw new NotFoundError('Guest', data.guestId);
    }
    if (!roomType) {
      throw new NotFoundError('Room type', data.roomTypeId);
    }
    
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
      childrenCount: data.children || 0,
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
   * CRITICAL FIX: Added tenant isolation and optimistic locking
   */
  async update(tenantId: string, id: string, data: UpdateReservationDto, expectedVersion?: number): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    // Optimistic locking check
    if (expectedVersion !== undefined && (reservation as any).version !== expectedVersion) {
      throw new ConflictError('Reservation was modified by another operation. Please refresh and try again.');
    }
    
    const index = reservations.findIndex(r => r.id === id);
    
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
    
    // Update guest and room type references if changed
    let guest = current.guest;
    let roomType = current.roomType;
    
    if (data.guestId && data.guestId !== current.guestId) {
      const newGuest = mockGuests.find(g => g.id === data.guestId);
      if (newGuest) guest = newGuest;
    }
    
    if (data.roomTypeId && data.roomTypeId !== current.roomTypeId) {
      const newRoomType = mockRoomTypes.find(rt => rt.id === data.roomTypeId);
      if (newRoomType) {
        roomType = newRoomType;
        // Recalculate with new room type rate if not explicitly provided
        if (!data.roomRate) {
          totalAmount = roomType.baseRate * nights;
        }
      }
    }
    
    reservations[index] = {
      ...current,
      ...data,
      guestId: data.guestId || current.guestId,
      guest,
      roomTypeId: data.roomTypeId || current.roomTypeId,
      roomType,
      nights,
      totalAmount,
      childrenCount: data.children || current.childrenCount,
      updatedAt: now(),
      version: incrementVersion((current as any).version),
    } as Reservation;
    
    return reservations[index];
  },

  /**
   * Check out a guest
   * CRITICAL FIX: Added tenant isolation
   */
  async checkOut(tenantId: string, id: string): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    const index = reservations.findIndex(r => r.id === id);
    
    const updated = {
      ...reservations[index],
      status: 'checked_out',
      actualCheckOut: now(),
      updatedAt: now(),
    };
    
    // CRITICAL: Increment version for optimistic locking
    reservations[index] = incrementVersion(updated as VersionedEntity) as Reservation;
    
    return reservations[index];
  },

  /**
   * Get today's arrivals
   * CRITICAL FIX: Added tenant isolation
   */
  async getTodaysArrivals(tenantId: string): Promise<Reservation[]> {
    await delay(200);
    requireTenantId(tenantId);
    const filtered = filterByTenant(reservations, tenantId) as Reservation[];
    return filtered.filter(r => 
      r.checkInDate === today && r.status === 'confirmed'
    );
  },

  /**
   * Get today's departures
   * CRITICAL FIX: Added tenant isolation
   */
  async getTodaysDepartures(tenantId: string): Promise<Reservation[]> {
    await delay(200);
    requireTenantId(tenantId);
    const filtered = filterByTenant(reservations, tenantId) as Reservation[];
    return filtered.filter(r => 
      r.checkOutDate === today && r.status === 'checked_in'
    );
  },

  /**
   * Get in-house guests
   * CRITICAL FIX: Added tenant isolation
   */
  async getInHouse(tenantId: string): Promise<Reservation[]> {
    await delay(200);
    requireTenantId(tenantId);
    const filtered = filterByTenant(reservations, tenantId) as Reservation[];
    return filtered.filter(r => r.status === 'checked_in');
  },

  /**
   * Get reservation statistics
   * CRITICAL FIX: Added tenant isolation
   */
  async getStats(tenantId: string): Promise<{
    todaysArrivals: number;
    todaysDepartures: number;
    inHouse: number;
    totalReservations: number;
    confirmedUpcoming: number;
  }> {
    await delay(200);
    
    requireTenantId(tenantId);
    const tenantReservations = filterByTenant(reservations, tenantId) as Reservation[];
    
    return {
      todaysArrivals: tenantReservations.filter(r => r.checkInDate === today && r.status === 'confirmed').length,
      todaysDepartures: tenantReservations.filter(r => r.checkOutDate === today && r.status === 'checked_in').length,
      inHouse: tenantReservations.filter(r => r.status === 'checked_in').length,
      totalReservations: tenantReservations.length,
      confirmedUpcoming: tenantReservations.filter(r => r.status === 'confirmed' && r.checkInDate > today).length,
    };
  },

  /**
   * Get reservations by guest ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getByGuestId(tenantId: string, guestId: string): Promise<Reservation[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantReservations = filterByTenant(reservations, tenantId) as Reservation[];
    return tenantReservations
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
   * CRITICAL FIX: Added tenant isolation and business rule validation
   */
  async checkIn(tenantId: string, id: string, data: { roomId: string; notes?: string }): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    const index = reservations.findIndex(r => r.id === id);
    
    // Business Rule Validation: Can only check in confirmed reservations
    if (reservation.status !== 'confirmed') {
      if (reservation.status === 'checked_in') {
        throw new BusinessRuleError(
          'Reservation is already checked in',
          'ALREADY_CHECKED_IN'
        );
      }
      if (reservation.status === 'cancelled') {
        throw new BusinessRuleError(
          'Cannot check in a cancelled reservation',
          'CANNOT_CHECK_IN_CANCELLED'
        );
      }
      if (reservation.status === 'no_show') {
        throw new BusinessRuleError(
          'Cannot check in a no-show reservation',
          'CANNOT_CHECK_IN_NO_SHOW'
        );
      }
      
      // If we get here, status is invalid for check-in
      throw new BusinessRuleError(
        `Cannot check in reservation with status "${reservation.status}". Only "confirmed" reservations can be checked in.`,
        'INVALID_STATUS_FOR_CHECK_IN'
      );
    }
    
    const updated = {
      ...reservations[index],
      status: 'checked_in',
      roomId: data.roomId,
      actualCheckIn: now(),
      internalNotes: data.notes 
        ? `${reservations[index].internalNotes || ''}\n[Check-in] ${data.notes}`.trim()
        : reservations[index].internalNotes,
      updatedAt: now(),
    };
    
    // CRITICAL: Increment version for optimistic locking
    reservations[index] = incrementVersion(updated as VersionedEntity) as Reservation;
    
    return reservations[index];
  },

  /**
   * Cancel a reservation
   * CRITICAL FIX: Added tenant isolation and business rule validation
   */
  async cancel(tenantId: string, id: string, reason?: string): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    const index = reservations.findIndex(r => r.id === id);
    
    // Business Rule Validation: Cannot cancel already checked-in reservations
    if (reservation.status === 'checked_in') {
      throw new BusinessRuleError(
        'Cannot cancel a checked-in reservation. Please check out the guest first.',
        'CANNOT_CANCEL_CHECKED_IN'
      );
    }
    
    // Business Rule Validation: Cannot cancel already checked-out reservations
    if (reservation.status === 'checked_out') {
      throw new BusinessRuleError(
        'Cannot cancel a checked-out reservation',
        'CANNOT_CANCEL_CHECKED_OUT'
      );
    }
    
    // Business Rule Validation: Cannot cancel already cancelled reservations
    if (reservation.status === 'cancelled') {
      throw new BusinessRuleError(
        'Reservation is already cancelled',
        'ALREADY_CANCELLED'
      );
    }
    
    const updated = {
      ...reservations[index],
      status: 'cancelled',
      cancelledAt: now(),
      cancellationReason: reason || 'Cancelled by user',
      updatedAt: now(),
    };
    
    // CRITICAL: Increment version for optimistic locking
    reservations[index] = incrementVersion(updated as VersionedEntity) as Reservation;
    
    return reservations[index];
  },

  /**
   * Get channel statistics
   * CRITICAL FIX: Added tenant isolation
   */
  async getChannelStats(tenantId: string): Promise<Array<{
    channel: string;
    percentage: number;
    count: number;
    status: string;
  }>> {
    await delay(200);
    requireTenantId(tenantId);
    
    const tenantReservations = filterByTenant(reservations, tenantId) as Reservation[];
    const channelCounts: Record<string, number> = {};
    tenantReservations.forEach(r => {
      const channel = r.source;
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });
    
    const total = tenantReservations.length;
    const channelLabels: Record<string, string> = {
      direct_website: 'Website',
      ota_booking: 'Booking.com',
      ota_expedia: 'Expedia',
      ota_agoda: 'Agoda',
      phone: 'Phone',
      walk_in: 'Walk-in',
      corporate: 'Corporate',
      travel_agent: 'Travel Agent',
      group: 'Group',
    };
    
    const stats = Object.entries(channelCounts)
      .map(([source, count]) => ({
        channel: channelLabels[source] || source,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        count,
        status: 'Active',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Top 4 channels
    
    return stats;
  },
};
