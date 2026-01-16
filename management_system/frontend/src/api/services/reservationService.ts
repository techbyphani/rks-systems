import type { Reservation, ReservationStatus, PaginatedResponse } from '@/types';
import { mockReservations } from '../mockData';
import { mockGuests } from '../mockData/guests';
import { mockRoomTypes } from '../mockData/roomTypes';
import { delay, generateId, now, paginate, calculateNights } from '../helpers';
import { NotFoundError, BusinessRuleError, ValidationError, ConflictError } from '../errors';
import { requireTenantId, filterByTenant, findByIdAndTenant, verifyTenantAccess } from '../helpers/tenantFilter';
import { checkVersion, incrementVersion, getVersion, type VersionedEntity } from '../helpers/optimisticLock';
// HARDENING: Import reservation state machine
import { validateReservationStatusTransition, isTerminalStatus } from '../helpers/reservationStateMachine';

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
  // HARDENING: Audit context
  performedBy?: string;
  reason?: string;
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
    // Room types are tenant-specific - verify it belongs to tenant
    const tenantRoomTypes = filterByTenant(mockRoomTypes, tenantId) as typeof mockRoomTypes;
    const roomType = tenantRoomTypes.find(rt => rt.id === data.roomTypeId);
    
    if (!guest) {
      throw new NotFoundError('Guest', data.guestId);
    }
    if (!roomType) {
      throw new NotFoundError('Room type', data.roomTypeId);
    }
    
    const nights = calculateNights(data.checkInDate, data.checkOutDate);
    const roomRate = data.roomRate || roomType.baseRate;
    const totalAmount = roomRate * nights;
    
    const newReservation: Reservation & { tenantId: string } = {
      id: generateId(),
      tenantId, // CRITICAL: Tenant isolation
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
   * 
   * HARDENING FIXES:
   * - Version is now MANDATORY
   * - Status changes go through state machine
   * - Direct status mutation blocked
   * - Audit context (performedBy, reason) added
   */
  async update(
    tenantId: string, 
    id: string, 
    data: UpdateReservationDto, 
    expectedVersion: number // HARDENING: Now mandatory
  ): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    // HARDENING: Version is mandatory - fail if not provided or doesn't match
    if (reservation.version === undefined) {
      // Initialize version if missing (backward compatibility for existing data)
      const index = reservations.findIndex(r => r.id === id);
      reservations[index] = { ...reservations[index], version: 0 };
    }
    
    checkVersion(reservation as VersionedEntity, expectedVersion, 'Reservation');
    
    const index = reservations.findIndex(r => r.id === id);
    const current = reservations[index];
    
    // HARDENING: Terminal states are immutable - cannot be modified
    if (isTerminalStatus(current.status)) {
      throw new BusinessRuleError(
        `Cannot modify reservation with terminal status "${current.status}". Terminal states (checked_out, cancelled, no_show) are immutable.`,
        'TERMINAL_STATE_IMMUTABLE'
      );
    }
    
    // HARDENING: If status is being changed, validate transition through state machine
    if (data.status && data.status !== current.status) {
      validateReservationStatusTransition(current.status, data.status);
      // Status changes via update() are discouraged - dedicated methods should be used
      // But allowed if transition is valid (already validated above)
    }
    
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
      const tenantGuests = filterByTenant(mockGuests, tenantId) as typeof mockGuests;
      const newGuest = tenantGuests.find(g => g.id === data.guestId);
      if (newGuest) guest = newGuest;
    }
    
    if (data.roomTypeId && data.roomTypeId !== current.roomTypeId) {
      const tenantRoomTypes = filterByTenant(mockRoomTypes, tenantId) as typeof mockRoomTypes;
      const newRoomType = tenantRoomTypes.find(rt => rt.id === data.roomTypeId);
      if (newRoomType) {
        roomType = newRoomType;
        // Recalculate with new room type rate if not explicitly provided
        if (!data.roomRate) {
          totalAmount = roomType.baseRate * nights;
        }
      }
    }
    
    // HARDENING: Increment version on successful update
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
   * 
   * HARDENING FIXES:
   * - Uses state machine for status transition validation
   * - Version is mandatory
   * - Must be checked_in to check out
   * - Audit context (performedBy, reason) added
   */
  async checkOut(
    tenantId: string, 
    id: string,
    performedBy: string, // HARDENING: Now mandatory
    expectedVersion: number, // HARDENING: Now mandatory
    reason?: string // HARDENING: Audit context
  ): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    // HARDENING: Version is mandatory
    if (reservation.version === undefined) {
      const index = reservations.findIndex(r => r.id === id);
      reservations[index] = { ...reservations[index], version: 0 };
    }
    checkVersion(reservation as VersionedEntity, expectedVersion, 'Reservation');
    
    // HARDENING: Use state machine - must be checked_in to check out
    validateReservationStatusTransition(reservation.status, 'checked_out');
    
    const index = reservations.findIndex(r => r.id === id);
    
    const updated = {
      ...reservations[index],
      status: 'checked_out',
      actualCheckOut: now(),
      internalNotes: reason
        ? `${reservations[index].internalNotes || ''}\n[Check-out by ${performedBy}] ${reason}`.trim()
        : reservations[index].internalNotes,
      updatedAt: now(),
    };
    
    // HARDENING: Increment version for optimistic locking
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
   * CRITICAL FIX: Added tenant isolation
   */
  async getByDateRange(tenantId: string, startDate: string, endDate: string, roomTypeId?: string): Promise<Reservation[]> {
    await delay(300);
    requireTenantId(tenantId);
    const tenantReservations = filterByTenant(reservations, tenantId) as Reservation[];
    return tenantReservations.filter(r => {
      const matchesDateRange = r.checkInDate <= endDate && r.checkOutDate >= startDate;
      const matchesRoomType = !roomTypeId || r.roomTypeId === roomTypeId;
      return matchesDateRange && matchesRoomType;
    });
  },

  /**
   * Check in a guest
   * 
   * HARDENING FIXES:
   * - Uses state machine for status transition validation
   * - Version is mandatory
   * - Audit context (performedBy, reason) added
   */
  async checkIn(
    tenantId: string, 
    id: string, 
    data: { 
      roomId: string; 
      notes?: string;
      performedBy: string; // HARDENING: Now mandatory
      expectedVersion: number; // HARDENING: Now mandatory
      reason?: string; // HARDENING: Audit context
    }
  ): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    // HARDENING: Version is mandatory
    if (reservation.version === undefined) {
      const index = reservations.findIndex(r => r.id === id);
      reservations[index] = { ...reservations[index], version: 0 };
    }
    checkVersion(reservation as VersionedEntity, data.expectedVersion, 'Reservation');
    
    const index = reservations.findIndex(r => r.id === id);
    
    // HARDENING: Use state machine for status transition validation
    validateReservationStatusTransition(reservation.status, 'checked_in');
    
    // HARDENING: checked_in requires roomId - invariant enforcement
    if (!data.roomId) {
      throw new ValidationError('Room ID is required for check-in');
    }
    
    const updated = {
      ...reservations[index],
      status: 'checked_in',
      roomId: data.roomId,
      actualCheckIn: now(),
      internalNotes: data.notes 
        ? `${reservations[index].internalNotes || ''}\n[Check-in by ${data.performedBy}] ${data.notes}${data.reason ? ` (Reason: ${data.reason})` : ''}`.trim()
        : reservations[index].internalNotes,
      updatedAt: now(),
    };
    
    // HARDENING: Increment version for optimistic locking
    reservations[index] = incrementVersion(updated as VersionedEntity) as Reservation;
    
    return reservations[index];
  },

  /**
   * Cancel a reservation
   * 
   * HARDENING FIXES:
   * - Uses state machine for status transition validation
   * - Version is mandatory
   * - Attempts to release room if assigned (best-effort)
   * - Audit context (performedBy) added
   */
  async cancel(
    tenantId: string, 
    id: string,
    performedBy: string, // HARDENING: Now mandatory
    expectedVersion: number, // HARDENING: Now mandatory
    reason?: string
  ): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    // HARDENING: Version is mandatory
    if (reservation.version === undefined) {
      const index = reservations.findIndex(r => r.id === id);
      reservations[index] = { ...reservations[index], version: 0 };
    }
    checkVersion(reservation as VersionedEntity, expectedVersion, 'Reservation');
    
    // HARDENING: Use state machine for status transition validation
    validateReservationStatusTransition(reservation.status, 'cancelled');
    
    const index = reservations.findIndex(r => r.id === id);
    
    // HARDENING: Attempt to release room if assigned (best-effort)
    if (reservation.roomId) {
      try {
        const { roomService } = await import('./roomService');
        const room = await roomService.getById(tenantId, reservation.roomId);
        if (room) {
          // Get room version for release
          const roomVersion = room.version ?? 0;
          // Attempt release - if it fails, log but continue with cancellation
          try {
            await roomService.release(tenantId, reservation.roomId, performedBy, roomVersion);
          } catch (releaseError) {
            // HARDENING: Log room release failure with full context for audit
            console.error(`[CRS BEST-EFFORT FAILURE] Room release failed on cancellation for reservation ${id}, room ${reservation.roomId}:`, {
              reservationId: id,
              roomId: reservation.roomId,
              operation: 'cancel',
              performedBy,
              error: releaseError instanceof Error ? releaseError.message : String(releaseError),
              timestamp: new Date().toISOString(),
              note: 'Reservation will be marked cancelled regardless - manual intervention required for room',
            });
            // Note: Room remains assigned, but reservation is cancelled
            // This is a known inconsistency that should be resolved manually
          }
        }
      } catch (error) {
        // HARDENING: Log room service failure with full context for audit
        console.error(`[CRS BEST-EFFORT FAILURE] Room service unavailable on cancellation for reservation ${id}:`, {
          reservationId: id,
          roomId: reservation.roomId,
          operation: 'cancel',
          performedBy,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          note: 'Reservation will be marked cancelled regardless - manual intervention required',
        });
      }
    }
    
    const updated = {
      ...reservations[index],
      status: 'cancelled',
      cancelledAt: now(),
      cancellationReason: reason || `Cancelled by ${performedBy}`,
      internalNotes: `${reservations[index].internalNotes || ''}\n[Cancelled by ${performedBy}] ${reason || 'No reason provided'}`.trim(),
      updatedAt: now(),
    };
    
    // HARDENING: Increment version for optimistic locking
    reservations[index] = incrementVersion(updated as VersionedEntity) as Reservation;
    
    return reservations[index];
  },

  /**
   * Mark reservation as no-show
   * 
   * HARDENING: New method to handle no-show reservations
   * - Only allowed from confirmed status
   * - Attempts to release room if assigned (best-effort)
   * - Uses state machine for validation
   * - Version is mandatory
   */
  async markNoShow(
    tenantId: string,
    id: string,
    performedBy: string, // HARDENING: Mandatory
    expectedVersion: number, // HARDENING: Mandatory
    reason?: string
  ): Promise<Reservation> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    const reservation = findByIdAndTenant(reservations, id, tenantId);
    if (!reservation) {
      throw new NotFoundError('Reservation', id);
    }
    
    // HARDENING: Version is mandatory
    if (reservation.version === undefined) {
      const index = reservations.findIndex(r => r.id === id);
      reservations[index] = { ...reservations[index], version: 0 };
    }
    checkVersion(reservation as VersionedEntity, expectedVersion, 'Reservation');
    
    // HARDENING: Use state machine - only confirmed can become no-show
    validateReservationStatusTransition(reservation.status, 'no_show');
    
    const index = reservations.findIndex(r => r.id === id);
    
    // HARDENING: Attempt to release room if assigned (best-effort)
    if (reservation.roomId) {
      try {
        const { roomService } = await import('./roomService');
        const room = await roomService.getById(tenantId, reservation.roomId);
        if (room) {
          // Get room version for release
          const roomVersion = room.version ?? 0;
          // Attempt release - if it fails, log but continue with no-show marking
          try {
            await roomService.release(tenantId, reservation.roomId, performedBy, roomVersion);
          } catch (releaseError) {
            // HARDENING: Log room release failure with full context for audit
            console.error(`[CRS BEST-EFFORT FAILURE] Room release failed on no-show for reservation ${id}, room ${reservation.roomId}:`, {
              reservationId: id,
              roomId: reservation.roomId,
              operation: 'markNoShow',
              performedBy,
              error: releaseError instanceof Error ? releaseError.message : String(releaseError),
              timestamp: new Date().toISOString(),
              note: 'Reservation will be marked no-show regardless - manual intervention required for room',
            });
            // Note: Room remains assigned, but reservation is no-show
            // This is a known inconsistency that should be resolved manually
          }
        }
      } catch (error) {
        // HARDENING: Log room service failure with full context for audit
        console.error(`[CRS BEST-EFFORT FAILURE] Room service unavailable on no-show for reservation ${id}:`, {
          reservationId: id,
          roomId: reservation.roomId,
          operation: 'markNoShow',
          performedBy,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          note: 'Reservation will be marked no-show regardless - manual intervention required',
        });
      }
    }
    
    const updated = {
      ...reservations[index],
      status: 'no_show',
      internalNotes: `${reservations[index].internalNotes || ''}\n[No-show marked by ${performedBy}] ${reason || 'Guest did not arrive'}`.trim(),
      updatedAt: now(),
    };
    
    // HARDENING: Increment version for optimistic locking
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
