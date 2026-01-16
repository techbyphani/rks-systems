import type { 
  Room, 
  RoomType, 
  RoomStatus, 
  RoomCondition, 
  HousekeepingTask, 
  PaginatedResponse,
  RoomHistory,
  RoomNoteHistory,
  RoomBlock,
  RoomPhoto,
  RoomInspection,
  RoomCleaningSchedule,
  RoomAccessibility,
  Reservation
} from '@/types';
import { mockRooms, mockRoomTypes, getRoomStatusCounts } from '../mockData';
import { delay, now, paginate, generateSequentialId } from '../helpers';
import { NotFoundError, BusinessRuleError, ConflictError, ValidationError } from '../errors';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';
import { checkVersion, incrementVersion, type VersionedEntity } from '../helpers/optimisticLock';

// HARDENING: Import new helper utilities
import { validateStatusTransition } from '../helpers/roomStateMachine';
import { withRoomLock } from '../helpers/roomLock';
import {
  logStatusChange,
  logAssignment,
  logRelease,
  logFailedOperation,
  logConflict,
  logFieldUpdate,
  logRoomOperation,
  roomHistory,
} from '../helpers/roomAudit';
import { requirePermission, getUserRole, type UserRole } from '../helpers/authorization';

// Import reservationService to check availability
import { reservationService } from './reservationService';
// Import maintenanceService to check active maintenance
import { maintenanceService } from './maintenanceService';
// Import housekeepingService to auto-create tasks
import { housekeepingService } from './housekeepingService';

// In-memory stores
let rooms = [...mockRooms];
let roomTypes = [...mockRoomTypes];
// HARDENING: roomHistory is now managed by roomAudit helper
// Imported from roomAudit helper - using shared instance
let roomNoteHistory: RoomNoteHistory[] = [];
let roomBlocks: RoomBlock[] = [];
let roomPhotos: RoomPhoto[] = [];
let roomInspections: RoomInspection[] = [];
let roomCleaningSchedules: RoomCleaningSchedule[] = [];

// ============================================================
// HARDENING FIX #1: CENTRAL STATUS CHANGE FUNCTION
// ============================================================

/**
 * Central function for ALL room status changes
 * 
 * HARDENING: This is the ONLY way to change room status.
 * All status mutations MUST go through this function to ensure:
 * - State machine validation
 * - Optimistic locking
 * - Audit logging
 * - Proper error handling
 * 
 * @param tenantId - Tenant ID
 * @param roomId - Room ID
 * @param newStatus - Target status
 * @param performedBy - User performing the action
 * @param expectedVersion - Required version for optimistic locking
 * @param reason - Optional reason for status change
 * @returns Updated room
 */
async function changeRoomStatus(
  tenantId: string,
  roomId: string,
  newStatus: RoomStatus,
  performedBy: string,
  expectedVersion: number, // HARDENING: Now mandatory
  reason?: string
): Promise<Room> {
  requireTenantId(tenantId);
  
  const room = findByIdAndTenant(rooms, roomId, tenantId);
  if (!room) {
    throw new NotFoundError('Room', roomId);
  }

  // HARDENING FIX #2: Optimistic locking is now MANDATORY
  if (room.version === undefined) {
    // Initialize version if missing (backward compatibility for existing data)
    const index = rooms.findIndex(r => r.id === roomId);
    rooms[index] = { ...rooms[index], version: 0 };
  }
  
  checkVersion(room as VersionedEntity, expectedVersion, 'Room');

  const index = rooms.findIndex(r => r.id === roomId);
  const previousStatus = rooms[index].status;

  // HARDENING FIX #1: State machine validation (always enforced)
  if (previousStatus !== newStatus) {
    validateStatusTransition(previousStatus, newStatus);
  }

  // Update room status
  const updated = {
    ...rooms[index],
    status: newStatus,
    // Auto-update condition based on status
    condition: newStatus === 'available' ? 'clean' : 
               newStatus === 'dirty' ? 'dirty' : 
               rooms[index].condition,
    lastCleanedAt: newStatus === 'available' ? now() : rooms[index].lastCleanedAt,
    updatedAt: now(),
  };

  // HARDENING FIX #2: Increment version (mandatory)
  rooms[index] = incrementVersion(updated as VersionedEntity) as Room;

  // HARDENING FIX #8: Audit logging (always logged)
  if (previousStatus !== newStatus) {
    logStatusChange(tenantId, roomId, previousStatus, newStatus, performedBy, reason);
  }

  return rooms[index];
}

// ============================================================
// INTERFACES
// ============================================================

export interface RoomFilters {
  search?: string;
  status?: RoomStatus | RoomStatus[];
  roomTypeId?: string;
  floor?: number;
  isAvailable?: boolean;
  page?: number;
  pageSize?: number;
  tenantId?: string; // CRITICAL: Tenant isolation
}

export interface CreateRoomDto {
  roomNumber: string;
  roomTypeId: string;
  floor: number;
  building?: string;
  wing?: string;
  isSmokingAllowed?: boolean;
  hasBalcony?: boolean;
  viewType?: string;
  notes?: string;
  accessibility?: RoomAccessibility;
  rateOverride?: number;
  amenityOverrides?: string[];
}

export interface UpdateRoomDto extends Partial<CreateRoomDto> {
  status?: RoomStatus;
  condition?: RoomCondition;
  conditionScore?: number;
  notes?: string;
  accessibility?: RoomAccessibility;
  rateOverride?: number;
  amenityOverrides?: string[];
}

export interface TransferRoomDto {
  fromRoomId: string;
  toRoomId: string;
  reservationId: string;
  reason?: string;
}

export interface CreateRoomBlockDto {
  roomId: string;
  startDate: string;
  endDate: string;
  reason: RoomBlock['reason'];
  description?: string;
}

export interface CreateRoomInspectionDto {
  roomId: string;
  checklist: RoomInspection['checklist'];
  notes?: string;
}

export interface CreateRoomCleaningScheduleDto {
  roomId: string;
  type: RoomCleaningSchedule['type'];
  frequency: number;
  nextScheduledDate: string;
}

// ============================================================
// ROOM SERVICE
// ============================================================

// TODO: Future enhancement - Add room integrity validation methods:
// - validateRoomState(tenantId, roomId): Check room status consistency
// - reconcileRoomState(tenantId, roomId): Attempt to fix inconsistencies
// These would help detect and fix issues like: room occupied but reservation cancelled,
// room out_of_order but no active maintenance, etc.

export const roomService = {
  /**
   * Get all rooms with optional filtering
   * CRITICAL FIX: Added tenant isolation
   */
  async getAll(filters: RoomFilters = {}): Promise<PaginatedResponse<Room>> {
    await delay(300);
    
    // CRITICAL: Require tenantId for tenant isolation
    const tenantId = requireTenantId(filters.tenantId);
    
    // CRITICAL: Filter by tenant first
    let result = filterByTenant([...rooms], tenantId) as Room[];
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(r => statuses.includes(r.status));
    }
    
    // Room type filter
    if (filters.roomTypeId) {
      result = result.filter(r => r.roomTypeId === filters.roomTypeId);
    }
    
    // Floor filter
    if (filters.floor !== undefined) {
      result = result.filter(r => r.floor === filters.floor);
    }
    
    // Available filter
    if (filters.isAvailable) {
      result = result.filter(r => r.status === 'available');
    }
    
    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(r => 
        r.roomNumber.toLowerCase().includes(searchLower) ||
        r.roomType?.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by room number
    result.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
    
    return paginate(result, filters.page || 1, filters.pageSize || 20);
  },

  /**
   * Get a single room by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<Room | null> {
    await delay(200);
    requireTenantId(tenantId);
    return findByIdAndTenant(rooms, id, tenantId);
  },

  /**
   * Get room by room number
   * CRITICAL FIX: Added tenant isolation
   */
  async getByNumber(tenantId: string, roomNumber: string): Promise<Room | null> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    return tenantRooms.find(r => r.roomNumber === roomNumber) || null;
  },

  /**
   * Update room status with state machine validation
   * 
   * HARDENING FIX #1: Now uses central changeRoomStatus function
   * HARDENING FIX #2: Optimistic locking is now MANDATORY
   */
  async updateStatus(
    tenantId: string, 
    id: string, 
    status: RoomStatus,
    performedBy: string,
    expectedVersion: number, // HARDENING: Now mandatory
    reason?: string
  ): Promise<Room> {
    await delay(300);
    
    return changeRoomStatus(tenantId, id, status, performedBy, expectedVersion, reason);
  },

  /**
   * Assign room to guest with comprehensive validation
   * 
   * HARDENING FIXES:
   * #2: Optimistic locking is now MANDATORY
   * #3: Room-level locking to prevent race conditions
   * #4: Maintenance check - cannot assign if active maintenance
   * #6: Full revalidation during assignment (not just availability query)
   * #1: Uses central changeRoomStatus for state machine enforcement
   */
  async assignToGuest(
    tenantId: string, 
    id: string, 
    guestId: string, 
    reservationId: string,
    expectedVersion: number, // HARDENING: Now mandatory
    performedBy: string // HARDENING: Now mandatory for audit
  ): Promise<Room> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    // HARDENING FIX #3: Room-level locking to prevent concurrent assignments
    return withRoomLock(tenantId, id, 'assignToGuest', async () => {
      const room = findByIdAndTenant(rooms, id, tenantId);
      if (!room) {
        throw new NotFoundError('Room', id);
      }
      
      // HARDENING FIX #2: Optimistic locking check (mandatory)
      if (room.version === undefined) {
        const index = rooms.findIndex(r => r.id === id);
        rooms[index] = { ...rooms[index], version: 0 };
      }
      checkVersion(room as VersionedEntity, expectedVersion, 'Room');
      
      // HARDENING FIX #6: Full revalidation (not just availability query)
      // Check room status
      // NOTE: Both 'available' and 'reserved' rooms are assignable.
      // 'reserved' means room is held for a reservation but not yet assigned to a guest.
      // CRS is responsible for ensuring reservation-to-room binding semantics.
      if (room.status !== 'available' && room.status !== 'reserved') {
        logFailedOperation(tenantId, id, 'assignToGuest', 
          `Room status is ${room.status}, must be available or reserved`, performedBy);
        throw new BusinessRuleError(
          `Cannot assign room ${room.roomNumber} with status "${room.status}". Room must be available or reserved.`,
          'ROOM_NOT_AVAILABLE_FOR_ASSIGNMENT'
        );
      }
      
      // HARDENING FIX #4: Check for active maintenance requests
      const maintenanceRequests = await maintenanceService.getAll(tenantId, {
        roomId: id,
        status: ['reported', 'acknowledged', 'in_progress', 'on_hold'],
      });
      if (maintenanceRequests.data.length > 0) {
        logConflict(tenantId, id, 'active_maintenance', 
          `${maintenanceRequests.data.length} active maintenance request(s)`, performedBy);
        throw new BusinessRuleError(
          `Cannot assign room ${room.roomNumber}: ${maintenanceRequests.data.length} active maintenance request(s) exist`,
          'ROOM_HAS_ACTIVE_MAINTENANCE'
        );
      }
      
      // HARDENING FIX #6: Check for active room blocks
      const activeBlocks = await this.getRoomBlocks(tenantId, id, true);
      if (activeBlocks.length > 0) {
        logConflict(tenantId, id, 'active_block', 
          `${activeBlocks.length} active room block(s)`, performedBy);
        throw new BusinessRuleError(
          `Cannot assign room ${room.roomNumber}: Room is blocked`,
          'ROOM_IS_BLOCKED'
        );
      }
      
      // HARDENING FIX #6: Check for pending housekeeping tasks
      // INTENTIONAL: Pending housekeeping does NOT block assignment.
      // Rationale: Housekeeping can continue after guest checks in (deep cleaning, maintenance tasks).
      // This is logged for audit but assignment proceeds.
      const housekeepingTasks = await housekeepingService.getAll(tenantId, {
        roomId: id,
        status: ['pending', 'assigned', 'in_progress'],
      });
      if (housekeepingTasks.data.length > 0) {
        logConflict(tenantId, id, 'pending_housekeeping', 
          `${housekeepingTasks.data.length} pending housekeeping task(s)`, performedBy);
        // Note: This is a warning, not blocking - housekeeping can continue after assignment
        // But we log it for audit purposes
      }
      
      // Get the reservation to check its actual dates
      const reservation = await reservationService.getById(tenantId, reservationId);
      if (!reservation) {
        throw new NotFoundError('Reservation', reservationId);
      }
      
      // HARDENING FIX #6: Re-check conflicts AFTER acquiring lock (critical for race condition prevention)
      const conflictingReservations = await reservationService.getByDateRange(
        tenantId,
        reservation.checkInDate,
        reservation.checkOutDate
      );
      
      const roomConflicts = conflictingReservations.filter(
        r => r.roomId === id && 
             r.id !== reservationId && 
             r.status !== 'cancelled' && 
             r.status !== 'checked_out' &&
             r.status !== 'no_show'
      );
      
      if (roomConflicts.length > 0) {
        logConflict(tenantId, id, 'reservation_conflict', 
          `Conflicts with ${roomConflicts.length} reservation(s)`, performedBy);
        throw new ConflictError(
          `Room ${room.roomNumber} has conflicting reservations`,
          'ROOM_CONFLICT'
        );
      }
      
      // Validate capacity using reservation data
      await this.validateRoomCapacity(tenantId, id, reservation.adults, reservation.childrenCount, reservation.infants);
      
      const index = rooms.findIndex(r => r.id === id);
      const previousGuestId = rooms[index].currentGuestId;
      const previousReservationId = rooms[index].currentReservationId;
      
      // HARDENING FIX #1: Use central status change function (enforces state machine)
      const updatedRoom = await changeRoomStatus(
        tenantId,
        id,
        'occupied',
        performedBy,
        expectedVersion,
        `Assigned to guest ${guestId}, reservation ${reservationId}`
      );
      
      // Update assignment fields
      rooms[index] = {
        ...updatedRoom,
        currentGuestId: guestId,
        currentReservationId: reservationId,
        updatedAt: now(),
      };
      
      // HARDENING FIX #2: Increment version again after field update
      rooms[index] = incrementVersion(rooms[index] as VersionedEntity) as Room;
      
      // HARDENING FIX #8: Audit logging
      logAssignment(tenantId, id, guestId, reservationId, performedBy);
      
      return rooms[index];
    });
  },

  /**
   * Transfer guest from one room to another
   * 
   * HARDENING FIXES:
   * #1: Uses central changeRoomStatus for state machine enforcement
   * #2: Optimistic locking is now MANDATORY for both rooms
   * #3: Room-level locking for both rooms to prevent race conditions
   * #6: Full revalidation during transfer
   * #5: Auto-creates housekeeping task for from room
   * #8: Improved audit logging
   */
  async transferRoom(
    tenantId: string, 
    data: TransferRoomDto & { 
      fromRoomExpectedVersion: number; // HARDENING: Now mandatory
      toRoomExpectedVersion: number; // HARDENING: Now mandatory
    }, 
    performedBy: string // HARDENING: Now mandatory for audit
  ): Promise<{ fromRoom: Room; toRoom: Room }> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    const fromRoom = findByIdAndTenant(rooms, data.fromRoomId, tenantId);
    const toRoom = findByIdAndTenant(rooms, data.toRoomId, tenantId);
    
    if (!fromRoom || !toRoom) {
      throw new NotFoundError('Room', fromRoom ? data.toRoomId : data.fromRoomId);
    }
    
    // HARDENING FIX #3: Lock both rooms to prevent concurrent transfers
    // Lock from room first, then to room (consistent ordering prevents deadlocks)
    const lockOrder = [data.fromRoomId, data.toRoomId].sort();
    const fromLocked = lockOrder[0] === data.fromRoomId;
    
    // Acquire locks in sorted order to prevent deadlocks
    const lock1 = fromLocked ? data.fromRoomId : data.toRoomId;
    const lock2 = fromLocked ? data.toRoomId : data.fromRoomId;
    
    return withRoomLock(tenantId, lock1, 'transferRoom', async () => {
      return withRoomLock(tenantId, lock2, 'transferRoom', async () => {
        // Re-fetch rooms after acquiring locks (they may have changed)
        const fromRoomLocked = findByIdAndTenant(rooms, data.fromRoomId, tenantId);
        const toRoomLocked = findByIdAndTenant(rooms, data.toRoomId, tenantId);
        
        if (!fromRoomLocked || !toRoomLocked) {
          throw new NotFoundError('Room', fromRoomLocked ? data.toRoomId : data.fromRoomId);
        }
        
        // Validate from room is occupied
        if (fromRoomLocked.status !== 'occupied' || fromRoomLocked.currentReservationId !== data.reservationId) {
          logFailedOperation(tenantId, data.fromRoomId, 'transferRoom', 
            `Source room not occupied by this reservation`, performedBy);
          throw new BusinessRuleError(
            `Source room ${fromRoomLocked.roomNumber} is not occupied by this reservation`,
            'INVALID_TRANSFER_SOURCE'
          );
        }
        
        // Validate to room is available
        if (toRoomLocked.status !== 'available') {
          logFailedOperation(tenantId, data.toRoomId, 'transferRoom', 
            `Destination room status is ${toRoomLocked.status}`, performedBy);
          throw new BusinessRuleError(
            `Destination room ${toRoomLocked.roomNumber} is not available (status: ${toRoomLocked.status})`,
            'DESTINATION_ROOM_NOT_AVAILABLE'
          );
        }
        
        // HARDENING FIX #6: Re-check conflicts AFTER acquiring locks
        const reservation = await reservationService.getById(tenantId, data.reservationId);
        if (!reservation) {
          throw new NotFoundError('Reservation', data.reservationId);
        }
        
        const conflictingReservations = await reservationService.getByDateRange(
          tenantId,
          reservation.checkInDate,
          reservation.checkOutDate
        );
        
        const conflicts = conflictingReservations.filter(
          r => r.roomId === data.toRoomId && 
               r.id !== data.reservationId && 
               r.status !== 'cancelled' && 
               r.status !== 'checked_out' &&
               r.status !== 'no_show'
        );
        
        if (conflicts.length > 0) {
          logConflict(tenantId, data.toRoomId, 'reservation_conflict', 
            `Conflicts with ${conflicts.length} reservation(s)`, performedBy);
          throw new ConflictError('Destination room has conflicting reservations', 'ROOM_CONFLICT');
        }
        
        // HARDENING FIX #4: Check for active maintenance in destination room
        const toRoomMaintenance = await maintenanceService.getAll(tenantId, {
          roomId: data.toRoomId,
          status: ['reported', 'acknowledged', 'in_progress', 'on_hold'],
        });
        if (toRoomMaintenance.data.length > 0) {
          logConflict(tenantId, data.toRoomId, 'active_maintenance', 
            `${toRoomMaintenance.data.length} active maintenance request(s)`, performedBy);
          throw new BusinessRuleError(
            `Cannot transfer to room ${toRoomLocked.roomNumber}: ${toRoomMaintenance.data.length} active maintenance request(s) exist`,
            'DESTINATION_ROOM_HAS_ACTIVE_MAINTENANCE'
          );
        }
        
        const fromIndex = rooms.findIndex(r => r.id === data.fromRoomId);
        const toIndex = rooms.findIndex(r => r.id === data.toRoomId);
        
        const previousGuestId = fromRoomLocked.currentGuestId;
        const previousReservationId = fromRoomLocked.currentReservationId;
        
        // HARDENING FIX #1: Use central status change for from room
        const fromRoomUpdated = await changeRoomStatus(
          tenantId,
          data.fromRoomId,
          'dirty',
          performedBy,
          data.fromRoomExpectedVersion,
          `Transferred to room ${toRoomLocked.roomNumber} - ${data.reason || ''}`
        );
        
        // HARDENING FIX #1: Use central status change for to room
        const toRoomUpdated = await changeRoomStatus(
          tenantId,
          data.toRoomId,
          'occupied',
          performedBy,
          data.toRoomExpectedVersion,
          `Transferred from room ${fromRoomLocked.roomNumber} - ${data.reason || ''}`
        );
        
        // Update assignment fields
        rooms[fromIndex] = {
          ...fromRoomUpdated,
          condition: 'dirty',
          currentGuestId: undefined,
          currentReservationId: undefined,
          updatedAt: now(),
        };
        
        rooms[toIndex] = {
          ...toRoomUpdated,
          currentGuestId: previousGuestId,
          currentReservationId: data.reservationId,
          updatedAt: now(),
        };
        
        // HARDENING FIX #2: Increment versions
        rooms[fromIndex] = incrementVersion(rooms[fromIndex] as VersionedEntity) as Room;
        rooms[toIndex] = incrementVersion(rooms[toIndex] as VersionedEntity) as Room;
        
        // HARDENING FIX #8: Audit logging
        logRoomOperation({
          tenantId,
          roomId: data.fromRoomId,
          action: 'transfer',
          newValue: `Transferred to room ${toRoomLocked.roomNumber}`,
          performedBy,
          notes: data.reason,
        });
        
        logRoomOperation({
          tenantId,
          roomId: data.toRoomId,
          action: 'transfer',
          newValue: `Transferred from room ${fromRoomLocked.roomNumber}`,
          performedBy,
          notes: data.reason,
        });
        
        // HARDENING FIX #5: Auto-create housekeeping task for from room
        try {
          await housekeepingService.create(tenantId, {
            roomId: data.fromRoomId,
            type: 'checkout_clean',
            priority: 'normal',
            scheduledDate: now().split('T')[0],
            notes: `Auto-created on room transfer`,
          });
        } catch (error) {
          logFailedOperation(tenantId, data.fromRoomId, 'auto_create_housekeeping_task', 
            `Failed to create housekeeping task: ${error}`, performedBy);
          console.error('Failed to auto-create housekeeping task on room transfer:', error);
        }
        
        return { fromRoom: rooms[fromIndex], toRoom: rooms[toIndex] };
      });
    });
  },

  /**
   * Release room (after checkout)
   * 
   * HARDENING FIXES:
   * #1: Uses central changeRoomStatus for state machine enforcement
   * #2: Optimistic locking is now MANDATORY
   * #5: Auto-creates housekeeping task on release
   * #8: Improved audit logging
   */
  async release(
    tenantId: string, 
    id: string, 
    performedBy: string, // HARDENING: Now mandatory for audit
    expectedVersion: number // HARDENING: Now mandatory
  ): Promise<Room> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, id, tenantId);
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    
    // Business Rule Validation: Can only release occupied rooms
    if (room.status !== 'occupied') {
      logFailedOperation(tenantId, id, 'release', 
        `Room status is ${room.status}, must be occupied`, performedBy);
      throw new BusinessRuleError(
        `Cannot release room ${room.roomNumber} with status "${room.status}". Only occupied rooms can be released.`,
        'INVALID_STATUS_FOR_RELEASE'
      );
    }
    
    const index = rooms.findIndex(r => r.id === id);
    const previousGuestId = rooms[index].currentGuestId;
    const previousReservationId = rooms[index].currentReservationId;
    
    // HARDENING FIX #1: Use central status change function (enforces state machine)
    const updatedRoom = await changeRoomStatus(
      tenantId,
      id,
      'dirty',
      performedBy,
      expectedVersion,
      `Released after checkout - Guest: ${previousGuestId}, Reservation: ${previousReservationId}`
    );
    
    // Clear assignment fields
    rooms[index] = {
      ...updatedRoom,
      condition: 'dirty',
      currentGuestId: undefined,
      currentReservationId: undefined,
      updatedAt: now(),
    };
    
    // HARDENING FIX #2: Increment version after field update
    rooms[index] = incrementVersion(rooms[index] as VersionedEntity) as Room;
    
    // HARDENING FIX #8: Audit logging
    logRelease(tenantId, id, previousGuestId, previousReservationId, performedBy);
    
    // HARDENING FIX #5: Auto-create housekeeping task on release
    try {
      await housekeepingService.create(tenantId, {
        roomId: id,
        type: 'checkout_clean',
        priority: 'high',
        scheduledDate: now().split('T')[0], // Today
        notes: `Auto-created on room release`,
      });
    } catch (error) {
      // Log error but don't fail release (housekeeping task creation is best-effort)
      logFailedOperation(tenantId, id, 'auto_create_housekeeping_task', 
        `Failed to create housekeeping task: ${error}`, performedBy);
      console.error('Failed to auto-create housekeeping task on room release:', error);
    }
    
    return rooms[index];
  },

  /**
   * Get room status counts
   * CRITICAL FIX: Added tenant isolation
   */
  async getStatusCounts(tenantId: string): Promise<Record<RoomStatus, number>> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    return getRoomStatusCounts(tenantRooms);
  },

  /**
   * Get available rooms for a room type
   * CRITICAL FIX: Added tenant isolation
   */
  async getAvailableByType(tenantId: string, roomTypeId: string): Promise<Room[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    return tenantRooms.filter(r => r.roomTypeId === roomTypeId && r.status === 'available');
  },

  /**
   * Get all floors
   */
  async getFloors(tenantId: string): Promise<number[]> {
    await delay(100);
    requireTenantId(tenantId);
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    return [...new Set(tenantRooms.map(r => r.floor))].sort((a, b) => a - b);
  },

  /**
   * Get room statistics
   * CRITICAL FIX: Added tenant isolation
   */
  async getStats(tenantId: string): Promise<{
    total: number;
    available: number;
    occupied: number;
    dirty: number;
    outOfOrder: number;
    occupancyRate: number;
  }> {
    await delay(200);
    
    requireTenantId(tenantId);
    const filtered = filterByTenant(rooms, tenantId) as Room[];
    const counts = getRoomStatusCounts(filtered);
    const total = filtered.length;
    const available = counts.available || 0;
    const occupied = counts.occupied || 0;
    
    return {
      total,
      available,
      occupied,
      dirty: counts.dirty || 0,
      outOfOrder: (counts.out_of_order || 0) + (counts.out_of_service || 0),
      occupancyRate: total > 0 ? Math.round((occupied / (total - (counts.out_of_order || 0) - (counts.out_of_service || 0))) * 100) : 0,
    };
  },

  /**
   * Get available rooms for a room type (alias)
   * CRITICAL FIX: Added tenant isolation
   */
  async getAvailableRooms(tenantId: string, roomTypeId: string): Promise<Room[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    return tenantRooms.filter(r => r.roomTypeId === roomTypeId && r.status === 'available');
  },

  /**
   * Get all room types
   * CRITICAL FIX: Uses roomTypeService for tenant isolation
   */
  async getRoomTypes(tenantId: string): Promise<RoomType[]> {
    await delay(200);
    requireTenantId(tenantId);
    // Use roomTypeService to get tenant-specific room types
    return roomTypeService.getAll(tenantId);
  },

  /**
   * Create a new room
   */
  async create(tenantId: string, data: CreateRoomDto): Promise<Room> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    // Check if room number already exists (within tenant)
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    if (tenantRooms.some(r => r.roomNumber === data.roomNumber)) {
      throw new Error('Room number already exists');
    }
    
    // CRITICAL: Validate room type exists and belongs to tenant
    const tenantRoomTypes = filterByTenant(roomTypes, tenantId) as RoomType[];
    const roomType = tenantRoomTypes.find(rt => rt.id === data.roomTypeId);
    if (!roomType) {
      throw new Error('Room type not found');
    }
    
    const newRoom: Room & { tenantId: string } = {
      id: `RM${data.roomNumber}`,
      tenantId, // CRITICAL: Tenant isolation
      roomNumber: data.roomNumber,
      roomTypeId: data.roomTypeId,
      roomType,
      floor: data.floor,
      building: data.building,
      wing: data.wing,
      status: 'available',
      condition: 'clean',
      conditionScore: 100, // New room starts with perfect condition
      isSmokingAllowed: data.isSmokingAllowed || false,
      hasBalcony: data.hasBalcony || false,
      viewType: data.viewType,
      notes: data.notes,
      accessibility: data.accessibility,
      rateOverride: data.rateOverride,
      amenityOverrides: data.amenityOverrides,
      createdAt: now(),
      updatedAt: now(),
    };
    
    rooms.push(newRoom);
    
    // FEATURE #5: Record in history
    roomHistory.push({
      id: generateSequentialId('RH', roomHistory.map(h => h.id)),
      tenantId,
      roomId: newRoom.id,
      action: 'status_change',
      newValue: 'available',
      performedBy: 'system',
      notes: 'Room created',
      createdAt: now(),
      updatedAt: now(),
    });
    
    return newRoom;
  },

  /**
   * Update a room
   * 
   * HARDENING FIXES:
   * #1: Status changes use central changeRoomStatus function
   * #2: Optimistic locking is now MANDATORY
   * #8: All field changes are logged (not just status)
   */
  async update(
    tenantId: string,
    id: string,
    data: UpdateRoomDto,
    expectedVersion: number, // HARDENING: Now mandatory
    performedBy: string // HARDENING: Now mandatory for audit
  ): Promise<Room> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, id, tenantId);
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    
    // HARDENING FIX #2: Optimistic locking check (mandatory)
    if (room.version === undefined) {
      const index = rooms.findIndex(r => r.id === id);
      rooms[index] = { ...rooms[index], version: 0 };
    }
    checkVersion(room as VersionedEntity, expectedVersion, 'Room');
    
    const index = rooms.findIndex(r => r.id === id);
    const previousStatus = rooms[index].status;
    const previousData = { ...rooms[index] };
    
    // HARDENING FIX #1: If status is being changed, use central function
    if (data.status && data.status !== previousStatus) {
      await changeRoomStatus(tenantId, id, data.status, performedBy, expectedVersion);
      // Re-fetch after status change
      const updatedRoom = findByIdAndTenant(rooms, id, tenantId);
      if (updatedRoom) {
        rooms[index] = updatedRoom;
      }
    }
    
    // Check if room number is being changed and already exists (within tenant)
    if (data.roomNumber && data.roomNumber !== rooms[index].roomNumber) {
      const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
      if (tenantRooms.some(r => r.roomNumber === data.roomNumber && r.id !== id)) {
        throw new BusinessRuleError('Room number already exists', 'ROOM_NUMBER_EXISTS');
      }
    }
    
    // Validate room type if being changed and belongs to tenant
    if (data.roomTypeId && data.roomTypeId !== rooms[index].roomTypeId) {
      const tenantRoomTypes = filterByTenant(roomTypes, tenantId) as RoomType[];
      const roomType = tenantRoomTypes.find(rt => rt.id === data.roomTypeId);
      if (!roomType) {
        throw new Error('Room type not found');
      }
      rooms[index].roomType = roomType;
    }
    
    // Update other fields
    const updated = {
      ...rooms[index],
      ...data,
      roomTypeId: data.roomTypeId || rooms[index].roomTypeId,
      updatedAt: now(),
    };
    
    // HARDENING FIX #2: Increment version for optimistic locking
    rooms[index] = incrementVersion(updated as VersionedEntity) as Room;
    
    // HARDENING FIX #8: Log all field changes (not just status)
    if (data.condition !== undefined && data.condition !== previousData.condition) {
      logFieldUpdate(tenantId, id, 'condition', previousData.condition, data.condition, performedBy);
    }
    if (data.conditionScore !== undefined && data.conditionScore !== previousData.conditionScore) {
      logFieldUpdate(tenantId, id, 'conditionScore', previousData.conditionScore, data.conditionScore, performedBy);
    }
    if (data.notes !== undefined && data.notes !== previousData.notes) {
      logFieldUpdate(tenantId, id, 'notes', previousData.notes, data.notes, performedBy);
    }
    if (data.rateOverride !== undefined && data.rateOverride !== previousData.rateOverride) {
      logFieldUpdate(tenantId, id, 'rateOverride', previousData.rateOverride, data.rateOverride, performedBy);
    }
    
    return rooms[index];
  },

  /**
   * Delete a room
   * 
   * HARDENING FIXES:
   * #7: Authorization check for deletion
   * #8: Audit logging of deletion
   */
  async delete(
    tenantId: string, 
    id: string,
    performedBy: string // HARDENING: Now mandatory for audit
  ): Promise<void> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    // HARDENING FIX #7: Authorization check
    const userRole = getUserRole(performedBy);
    requirePermission(userRole, 'room.delete', id);
    
    const room = findByIdAndTenant(rooms, id, tenantId) as Room | null;
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    
    // Check if room is occupied or reserved
    if (room.status === 'occupied' || room.status === 'reserved') {
      logFailedOperation(tenantId, id, 'delete', 
        `Room status is ${room.status}, cannot delete`, performedBy);
      throw new BusinessRuleError(
        `Cannot delete room that is occupied or reserved`,
        'ROOM_IN_USE'
      );
    }
    
    // Check for active reservations (check all future reservations)
    const today = new Date().toISOString().split('T')[0];
    const reservationsResponse = await reservationService.getAll({ tenantId, pageSize: 10000 });
    const tenantReservations = filterByTenant(
      reservationsResponse.data,
      tenantId
    ) as Reservation[];
    
    // Check for any future reservations (check-out date is today or later)
    const roomReservations = tenantReservations.filter(
      r => r.roomId === id && 
           r.checkOutDate >= today && 
           r.status !== 'cancelled' && 
           r.status !== 'checked_out'
    );
    
    if (roomReservations.length > 0) {
      logFailedOperation(tenantId, id, 'delete', 
        `${roomReservations.length} active reservation(s) exist`, performedBy);
      throw new BusinessRuleError(
        `Cannot delete room: ${roomReservations.length} active reservation(s) exist`,
        'ROOM_HAS_ACTIVE_RESERVATIONS'
      );
    }
    
    // HARDENING FIX #8: Audit logging before deletion
    logRoomOperation({
      tenantId,
      roomId: id,
      action: 'note_added',
      newValue: `Room deleted: ${room.roomNumber}`,
      performedBy,
      notes: 'Room permanently removed from inventory',
    });
    
    const index = rooms.findIndex(r => r.id === id);
    rooms.splice(index, 1);
  },

  /**
   * Check room availability for a date range (Feature #7)
   * CRITICAL FIX: Added tenant isolation and reservation checking
   */
  async checkAvailability(
    tenantId: string,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: string
  ): Promise<Room[]> {
    await delay(200);
    
    requireTenantId(tenantId);
    
    // Get all rooms of this type for tenant
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    let availableRooms = tenantRooms.filter(r => r.roomTypeId === roomTypeId);
    
    // Filter by status - only available or reserved rooms can be checked
    availableRooms = availableRooms.filter(r => 
      r.status === 'available' || r.status === 'reserved'
    );
    
    // FEATURE #7: Check reservations for the date range
    const reservations = await reservationService.getByDateRange(
      tenantId,
      checkInDate,
      checkOutDate
    );
    
    // Filter out rooms with conflicting reservations
    const conflictingRoomIds = new Set(
      reservations
        .filter(r => 
          r.roomId && 
          r.id !== excludeReservationId && 
          r.status !== 'cancelled' && 
          r.status !== 'checked_out' &&
          r.status !== 'no_show'
        )
        .map(r => r.roomId!)
    );
    
    // FEATURE #4: Also check for active room blocks
    const tenantBlocks = filterByTenant(roomBlocks, tenantId) as RoomBlock[];
    const activeBlocks = tenantBlocks.filter(block => 
      block.isActive &&
      block.startDate <= checkOutDate &&
      block.endDate >= checkInDate
    );
    
    const blockedRoomIds = new Set(activeBlocks.map(b => b.roomId));
    
    // Return rooms that are available and not blocked
    return availableRooms.filter(r => 
      !conflictingRoomIds.has(r.id) && 
      !blockedRoomIds.has(r.id) &&
      r.status === 'available'
    );
  },

  /**
   * Update room notes with history tracking (Feature #13)
   * CRITICAL FIX: Added tenant isolation
   */
  async updateNotes(tenantId: string, id: string, notes: string, addedBy?: string): Promise<Room> {
    await delay(200);
    
    requireTenantId(tenantId);
    const room = findByIdAndTenant(rooms, id, tenantId) as Room | null;
    if (!room) throw new Error('Room not found');
    
    const index = rooms.findIndex(r => r.id === id);
    const previousNote = rooms[index].notes;
    
    rooms[index] = {
      ...rooms[index],
      notes,
      updatedAt: now(),
    };
    
    // FEATURE #13: Record note history
    roomNoteHistory.push({
      id: generateSequentialId('RNH', roomNoteHistory.map(nh => nh.id)),
      tenantId,
      roomId: id,
      note: notes,
      previousNote: previousNote,
      addedBy: addedBy || 'system',
      createdAt: now(),
      updatedAt: now(),
    });
    
    // FEATURE #5: Record in history
    roomHistory.push({
      id: generateSequentialId('RH', roomHistory.map(h => h.id)),
      tenantId,
      roomId: id,
      action: previousNote ? 'note_updated' : 'note_added',
      previousValue: previousNote,
      newValue: notes,
      performedBy: addedBy || 'system',
      createdAt: now(),
      updatedAt: now(),
    });
    
    return rooms[index];
  },

  /**
   * Bulk update room status with validation
   * 
   * HARDENING FIXES:
   * #1: Uses central changeRoomStatus for each room
   * #2: Optimistic locking required (but accepts array of versions)
   * #7: Authorization check for bulk operations
   * #8: Improved audit logging
   */
  async bulkUpdateStatus(
    tenantId: string, 
    roomIds: string[], 
    status: RoomStatus, 
    performedBy: string, // HARDENING: Now mandatory
    expectedVersions: Record<string, number> // HARDENING: Now mandatory - map of roomId -> version
  ): Promise<Room[]> {
    await delay(400);
    
    requireTenantId(tenantId);
    
    // HARDENING FIX #7: Authorization check
    const userRole = getUserRole(performedBy);
    requirePermission(userRole, 'room.bulk_update');
    
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    const tenantRoomIds = tenantRooms.map(r => r.id);
    const updatedRooms: Room[] = [];
    
    for (const roomId of roomIds) {
      // Verify room belongs to tenant
      if (!tenantRoomIds.includes(roomId)) {
        logFailedOperation(tenantId, roomId, 'bulkUpdateStatus', 
          'Room not found or does not belong to tenant', performedBy);
        throw new NotFoundError('Room', roomId);
      }
      
      const expectedVersion = expectedVersions[roomId];
      if (expectedVersion === undefined) {
        logFailedOperation(tenantId, roomId, 'bulkUpdateStatus', 
          'Expected version not provided', performedBy);
        throw new ValidationError(`Expected version required for room ${roomId}`);
      }
      
      try {
        // HARDENING FIX #1: Use central status change function
        const updated = await changeRoomStatus(
          tenantId,
          roomId,
          status,
          performedBy,
          expectedVersion,
          `Bulk status update to ${status}`
        );
        updatedRooms.push(updated);
      } catch (error) {
        // Log failure but continue with other rooms
        logFailedOperation(tenantId, roomId, 'bulkUpdateStatus', 
          String(error), performedBy);
        // Re-throw to fail the entire operation (or could continue - business decision)
        throw error;
      }
    }
    
    return updatedRooms;
  },

  // ============================================================
  // FEATURE #4: ROOM BLOCKING/SCHEDULING
  // ============================================================

  /**
   * Create a room block
   * 
   * HARDENING FIXES:
   * #7: Authorization check for room blocking
   * #1: Uses central changeRoomStatus when updating room status
   * #2: Optimistic locking required when updating room status
   * #8: Audit logging
   */
  async createRoomBlock(
    tenantId: string, 
    data: CreateRoomBlockDto, 
    createdBy: string,
    roomExpectedVersion?: number // Optional - only needed if room status will be updated
  ): Promise<RoomBlock> {
    await delay(300);
    requireTenantId(tenantId);
    
    // HARDENING FIX #7: Authorization check
    const userRole = getUserRole(createdBy);
    requirePermission(userRole, 'room.block', data.roomId);
    
    const room = findByIdAndTenant(rooms, data.roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', data.roomId);
    }
    
    // Validate date range
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new ValidationError('Start date must be before end date');
    }
    
    // Check for overlapping blocks
    const tenantBlocks = filterByTenant(roomBlocks, tenantId) as RoomBlock[];
    const overlapping = tenantBlocks.filter(block =>
      block.roomId === data.roomId &&
      block.isActive &&
      block.startDate < data.endDate &&
      block.endDate > data.startDate
    );
    
    if (overlapping.length > 0) {
      logConflict(tenantId, data.roomId, 'overlapping_block', 
        `Overlaps with ${overlapping.length} existing block(s)`, createdBy);
      throw new ConflictError('Room is already blocked for this period', 'OVERLAPPING_BLOCK');
    }
    
    const newBlock: RoomBlock & { tenantId: string } = {
      id: generateSequentialId('RB', roomBlocks.map(b => b.id)),
      tenantId,
      roomId: data.roomId,
      room,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      description: data.description,
      createdBy,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    
    roomBlocks.push(newBlock);
    
    // HARDENING FIX #8: Audit logging
    logRoomOperation({
      tenantId,
      roomId: data.roomId,
      action: 'note_added',
      newValue: `Room block created: ${data.reason} from ${data.startDate} to ${data.endDate}`,
      performedBy: createdBy,
      notes: data.description,
    });
    
    // Update room status if block starts today or earlier
    const today = new Date().toISOString().split('T')[0];
    if (data.startDate <= today) {
      // HARDENING FIX #1: Use central status change function
      // HARDENING FIX #2: Version required if provided
      if (roomExpectedVersion !== undefined) {
        await changeRoomStatus(
          tenantId, 
          data.roomId, 
          'out_of_order', 
          createdBy, 
          roomExpectedVersion,
          `Room blocked: ${data.reason}`
        );
      } else {
        // Fallback: Direct update if version not provided (backward compatibility)
        // But log warning
        logFailedOperation(tenantId, data.roomId, 'createRoomBlock', 
          'Room status update skipped - version not provided', createdBy);
      }
    }
    
    return newBlock;
  },

  /**
   * Get room blocks
   */
  async getRoomBlocks(tenantId: string, roomId?: string, activeOnly?: boolean): Promise<RoomBlock[]> {
    await delay(200);
    requireTenantId(tenantId);
    
    let result = filterByTenant(roomBlocks, tenantId) as RoomBlock[];
    
    if (roomId) {
      result = result.filter(b => b.roomId === roomId);
    }
    
    if (activeOnly) {
      result = result.filter(b => b.isActive);
    }
    
    return result.sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  /**
   * Cancel a room block
   */
  async cancelRoomBlock(tenantId: string, blockId: string): Promise<void> {
    await delay(200);
    requireTenantId(tenantId);
    
    const block = findByIdAndTenant(roomBlocks, blockId, tenantId) as RoomBlock | null;
    if (!block) {
      throw new NotFoundError('RoomBlock', blockId);
    }
    
    const index = roomBlocks.findIndex(b => b.id === blockId);
    roomBlocks[index] = {
      ...roomBlocks[index],
      isActive: false,
      updatedAt: now(),
    };
    
    // If room is out_of_order due to this block, consider making it available
    const room = await this.getById(tenantId, block.roomId);
    if (room && room.status === 'out_of_order') {
      // Check if there are other active blocks
      const otherBlocks = await this.getRoomBlocks(tenantId, block.roomId, true);
      if (otherBlocks.length === 0) {
        // HARDENING FIX #1: Use central status change function
      // Note: Version not available here - this is a limitation
      // TODO: cancelRoomBlock should accept room version parameter
      if (room.version !== undefined) {
        await changeRoomStatus(
          tenantId, 
          block.roomId, 
          'dirty', 
          'system', 
          room.version,
          'Room block cancelled'
        );
      } else {
        logFailedOperation(tenantId, block.roomId, 'cancelRoomBlock', 
          'Room status update skipped - version not available', 'system');
      }
      }
    }
  },

  // ============================================================
  // FEATURE #5: ROOM HISTORY/AUDIT TRAIL
  // ============================================================

  /**
   * Get room history
   */
  async getRoomHistory(tenantId: string, roomId: string, limit?: number): Promise<RoomHistory[]> {
    await delay(200);
    requireTenantId(tenantId);
    
    // Verify room belongs to tenant
    const room = findByIdAndTenant(rooms, roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', roomId);
    }
    
    let result = filterByTenant(roomHistory, tenantId) as RoomHistory[];
    result = result.filter(h => h.roomId === roomId);
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (limit) {
      result = result.slice(0, limit);
    }
    
    return result;
  },

  /**
   * Get room note history
   */
  async getRoomNoteHistory(tenantId: string, roomId: string): Promise<RoomNoteHistory[]> {
    await delay(200);
    requireTenantId(tenantId);
    
    let result = filterByTenant(roomNoteHistory, tenantId) as RoomNoteHistory[];
    result = result.filter(nh => nh.roomId === roomId);
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return result;
  },

  // ============================================================
  // FEATURE #6: ROOM INSPECTION WORKFLOW
  // ============================================================

  /**
   * Create room inspection
   */
  async createInspection(tenantId: string, data: CreateRoomInspectionDto, inspectedBy: string): Promise<RoomInspection> {
    await delay(300);
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, data.roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', data.roomId);
    }
    
    // Calculate score based on checklist
    const totalItems = data.checklist.length;
    const checkedItems = data.checklist.filter(item => item.checked).length;
    const score = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    
    const status: RoomInspection['status'] = 
      score >= 90 ? 'passed' :
      score >= 70 ? 'needs_attention' :
      'failed';
    
    const newInspection: RoomInspection & { tenantId: string } = {
      id: generateSequentialId('RI', roomInspections.map(i => i.id)),
      tenantId,
      roomId: data.roomId,
      room,
      inspectedBy,
      inspectionDate: now(),
      status,
      checklist: data.checklist,
      notes: data.notes,
      score,
      createdAt: now(),
      updatedAt: now(),
    };
    
    roomInspections.push(newInspection);
    
    // Update room condition based on inspection
    const index = rooms.findIndex(r => r.id === data.roomId);
    if (index !== -1) {
      rooms[index] = {
        ...rooms[index],
        condition: status === 'passed' ? 'inspected' : 'needs_repair',
        conditionScore: score,
        lastInspectedAt: now(),
        updatedAt: now(),
      };
      
      // HARDENING FIX #1: Use central status change function
      // Note: This requires version, but inspection creation doesn't have it
      // For now, we'll skip the status update if version is not available
      // TODO: Inspection creation should accept room version parameter
      if (status === 'passed' && rooms[index].status === 'inspecting') {
        // Check if room has version
        if (rooms[index].version !== undefined) {
          await changeRoomStatus(
            tenantId, 
            data.roomId, 
            'available', 
            inspectedBy, 
            rooms[index].version!,
            'Inspection passed'
          );
        } else {
          // Log warning but don't fail
          logFailedOperation(tenantId, data.roomId, 'createInspection', 
            'Room status update skipped - version not available', inspectedBy);
        }
      }
    }
    
    // FEATURE #5: Record in history
    roomHistory.push({
      id: generateSequentialId('RH', roomHistory.map(h => h.id)),
      tenantId,
      roomId: data.roomId,
      action: 'inspection',
      newValue: `Inspection ${status}, Score: ${score}`,
      performedBy: inspectedBy,
      notes: data.notes,
      createdAt: now(),
      updatedAt: now(),
    });
    
    return newInspection;
  },

  /**
   * Approve inspection
   * 
   * HARDENING FIXES:
   * #1: Uses central changeRoomStatus
   * #2: Optimistic locking required
   * #7: Authorization check
   */
  async approveInspection(
    tenantId: string, 
    inspectionId: string, 
    approvedBy: string,
    roomExpectedVersion: number // HARDENING: Now mandatory
  ): Promise<RoomInspection> {
    await delay(200);
    requireTenantId(tenantId);
    
    // HARDENING FIX #7: Authorization check
    const userRole = getUserRole(approvedBy);
    requirePermission(userRole, 'room.inspection_approve');
    
    const inspection = findByIdAndTenant(roomInspections, inspectionId, tenantId) as RoomInspection | null;
    if (!inspection) {
      throw new NotFoundError('RoomInspection', inspectionId);
    }
    
    const index = roomInspections.findIndex(i => i.id === inspectionId);
    roomInspections[index] = {
      ...roomInspections[index],
      status: 'passed',
      approvedBy,
      approvedAt: now(),
      updatedAt: now(),
    };
    
    // HARDENING FIX #1: Use central status change function
    const roomIndex = rooms.findIndex(r => r.id === inspection.roomId);
    if (roomIndex !== -1 && rooms[roomIndex].status === 'inspecting') {
      await changeRoomStatus(
        tenantId, 
        inspection.roomId, 
        'available', 
        approvedBy, 
        roomExpectedVersion,
        'Inspection approved'
      );
      // Update condition separately
      rooms[roomIndex] = {
        ...rooms[roomIndex],
        condition: 'inspected',
        updatedAt: now(),
      };
      rooms[roomIndex] = incrementVersion(rooms[roomIndex] as VersionedEntity) as Room;
    }
    
    return roomInspections[index];
  },

  /**
   * Get room inspections
   */
  async getRoomInspections(tenantId: string, roomId?: string): Promise<RoomInspection[]> {
    await delay(200);
    requireTenantId(tenantId);
    
    let result = filterByTenant(roomInspections, tenantId) as RoomInspection[];
    
    if (roomId) {
      result = result.filter(i => i.roomId === roomId);
    }
    
    return result.sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());
  },

  // ============================================================
  // FEATURE #8: ROOM CAPACITY VALIDATION
  // ============================================================

  /**
   * Validate room capacity
   */
  async validateRoomCapacity(tenantId: string, roomId: string, adults: number, children?: number, infants?: number): Promise<void> {
    await delay(100);
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', roomId);
    }
    
    const roomType = room.roomType;
    if (!roomType) {
      throw new Error('Room type not found');
    }
    
    const totalGuests = adults + (children || 0) + (infants || 0);
    
    // Check max occupancy
    if (totalGuests > roomType.maxOccupancy) {
      throw new ValidationError(
        `Room capacity exceeded. Max occupancy: ${roomType.maxOccupancy}, Requested: ${totalGuests}`,
        { maxOccupancy: roomType.maxOccupancy, requested: totalGuests }
      );
    }
    
    // Check max adults
    if (adults > roomType.maxAdults) {
      throw new ValidationError(
        `Max adults exceeded. Max adults: ${roomType.maxAdults}, Requested: ${adults}`,
        { maxAdults: roomType.maxAdults, requested: adults }
      );
    }
    
    // Check max children
    if (children && children > roomType.maxChildren) {
      throw new ValidationError(
        `Max children exceeded. Max children: ${roomType.maxChildren}, Requested: ${children}`,
        { maxChildren: roomType.maxChildren, requested: children }
      );
    }
    
    // Method throws on error, returns void on success (no return value needed)
  },

  // ============================================================
  // FEATURE #12: ROOM PHOTOS/ATTACHMENTS
  // ============================================================

  /**
   * Add room photo
   */
  async addRoomPhoto(tenantId: string, roomId: string, url: string, uploadedBy: string, caption?: string, category?: RoomPhoto['category']): Promise<RoomPhoto> {
    await delay(300);
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', roomId);
    }
    
    const newPhoto: RoomPhoto & { tenantId: string } = {
      id: generateSequentialId('RP', roomPhotos.map(p => p.id)),
      tenantId,
      roomId,
      url,
      thumbnailUrl: url, // In real app, generate thumbnail
      caption,
      category: category || 'other',
      uploadedBy,
      createdAt: now(),
      updatedAt: now(),
    };
    
    roomPhotos.push(newPhoto);
    
    // Update room photos array
    const index = rooms.findIndex(r => r.id === roomId);
    if (index !== -1) {
      if (!rooms[index].photos) {
        rooms[index].photos = [];
      }
      rooms[index].photos!.push(newPhoto);
      rooms[index].updatedAt = now();
    }
    
    return newPhoto;
  },

  /**
   * Get room photos
   */
  async getRoomPhotos(tenantId: string, roomId: string, category?: RoomPhoto['category']): Promise<RoomPhoto[]> {
    await delay(200);
    requireTenantId(tenantId);
    
    let result = filterByTenant(roomPhotos, tenantId) as RoomPhoto[];
    result = result.filter(p => p.roomId === roomId);
    
    if (category) {
      result = result.filter(p => p.category === category);
    }
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Delete room photo
   */
  async deleteRoomPhoto(tenantId: string, photoId: string): Promise<void> {
    await delay(200);
    requireTenantId(tenantId);
    
    const photo = findByIdAndTenant(roomPhotos, photoId, tenantId) as RoomPhoto | null;
    if (!photo) {
      throw new NotFoundError('RoomPhoto', photoId);
    }
    
    const index = roomPhotos.findIndex(p => p.id === photoId);
    roomPhotos.splice(index, 1);
    
    // Remove from room photos array
    const roomIndex = rooms.findIndex(r => r.id === photo.roomId);
    if (roomIndex !== -1 && rooms[roomIndex].photos) {
      rooms[roomIndex].photos = rooms[roomIndex].photos!.filter(p => p.id !== photoId);
      rooms[roomIndex].updatedAt = now();
    }
  },

  // ============================================================
  // FEATURE #15: ROOM ACCESSIBILITY FEATURES
  // ============================================================

  /**
   * Update room accessibility features
   */
  async updateRoomAccessibility(tenantId: string, roomId: string, accessibility: RoomAccessibility): Promise<Room> {
    await delay(200);
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', roomId);
    }
    
    const index = rooms.findIndex(r => r.id === roomId);
    rooms[index] = {
      ...rooms[index],
      accessibility,
      updatedAt: now(),
    };
    
    return rooms[index];
  },

  // ============================================================
  // FEATURE #16: ROOM RATE OVERRIDE
  // ============================================================

  /**
   * Set room rate override
   * 
   * HARDENING FIXES:
   * #7: Authorization check for rate override
   * #2: Optimistic locking required
   * #8: Audit logging
   */
  async setRateOverride(
    tenantId: string, 
    roomId: string, 
    rateOverride: number | undefined,
    performedBy: string, // HARDENING: Now mandatory
    expectedVersion: number // HARDENING: Now mandatory
  ): Promise<Room> {
    await delay(200);
    requireTenantId(tenantId);
    
    // HARDENING FIX #7: Authorization check
    const userRole = getUserRole(performedBy);
    requirePermission(userRole, 'room.rate_override', roomId);
    
    const room = findByIdAndTenant(rooms, roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', roomId);
    }
    
    // HARDENING FIX #2: Optimistic locking check
    if (room.version === undefined) {
      const index = rooms.findIndex(r => r.id === roomId);
      rooms[index] = { ...rooms[index], version: 0 };
    }
    checkVersion(room as VersionedEntity, expectedVersion, 'Room');
    
    const index = rooms.findIndex(r => r.id === roomId);
    const previousRate = rooms[index].rateOverride;
    
    rooms[index] = {
      ...rooms[index],
      rateOverride,
      updatedAt: now(),
    };
    
    // HARDENING FIX #2: Increment version
    rooms[index] = incrementVersion(rooms[index] as VersionedEntity) as Room;
    
    // HARDENING FIX #8: Audit logging
    logFieldUpdate(tenantId, roomId, 'rateOverride', previousRate, rateOverride, performedBy);
    
    return rooms[index];
  },

  // ============================================================
  // FEATURE #17: ROOM AMENITIES OVERRIDE
  // ============================================================

  /**
   * Set room amenity overrides
   */
  async setAmenityOverrides(tenantId: string, roomId: string, amenityOverrides?: string[]): Promise<Room> {
    await delay(200);
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', roomId);
    }
    
    const index = rooms.findIndex(r => r.id === roomId);
    rooms[index] = {
      ...rooms[index],
      amenityOverrides,
      updatedAt: now(),
    };
    
    return rooms[index];
  },

  // ============================================================
  // FEATURE #18: ROOM CONDITION TRACKING
  // ============================================================

  /**
   * Update room condition with score
   */
  async updateRoomCondition(tenantId: string, roomId: string, condition: RoomCondition, conditionScore?: number): Promise<Room> {
    await delay(200);
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', roomId);
    }
    
    const index = rooms.findIndex(r => r.id === roomId);
    rooms[index] = {
      ...rooms[index],
      condition,
      conditionScore: conditionScore !== undefined ? conditionScore : rooms[index].conditionScore,
      updatedAt: now(),
    };
    
    // FEATURE #5: Record in history
    roomHistory.push({
      id: generateSequentialId('RH', roomHistory.map(h => h.id)),
      tenantId,
      roomId,
      action: 'maintenance',
      newValue: `Condition: ${condition}, Score: ${conditionScore || 'N/A'}`,
      performedBy: 'system',
      createdAt: now(),
      updatedAt: now(),
    });
    
    return rooms[index];
  },

  // ============================================================
  // FEATURE #19: ROOM MAINTENANCE SCHEDULING
  // ============================================================

  /**
   * Schedule room maintenance (creates a room block)
   */
  async scheduleMaintenance(tenantId: string, roomId: string, startDate: string, endDate: string, description?: string, createdBy?: string): Promise<RoomBlock> {
    return this.createRoomBlock(tenantId, {
      roomId,
      startDate,
      endDate,
      reason: 'maintenance',
      description,
    }, createdBy || 'system');
  },

  // ============================================================
  // FEATURE #20: ROOM CLEANING SCHEDULE
  // ============================================================

  /**
   * Create room cleaning schedule
   */
  async createCleaningSchedule(tenantId: string, data: CreateRoomCleaningScheduleDto): Promise<RoomCleaningSchedule> {
    await delay(300);
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, data.roomId, tenantId);
    if (!room) {
      throw new NotFoundError('Room', data.roomId);
    }
    
    const newSchedule: RoomCleaningSchedule & { tenantId: string } = {
      id: generateSequentialId('RCS', roomCleaningSchedules.map(s => s.id)),
      tenantId,
      roomId: data.roomId,
      room,
      type: data.type,
      frequency: data.frequency,
      nextScheduledDate: data.nextScheduledDate,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    
    roomCleaningSchedules.push(newSchedule);
    
    // Update room with schedule reference
    const index = rooms.findIndex(r => r.id === data.roomId);
    if (index !== -1) {
      rooms[index].cleaningScheduleId = newSchedule.id;
      rooms[index].updatedAt = now();
    }
    
    return newSchedule;
  },

  /**
   * Get room cleaning schedules
   */
  async getCleaningSchedules(tenantId: string, roomId?: string, activeOnly?: boolean): Promise<RoomCleaningSchedule[]> {
    await delay(200);
    requireTenantId(tenantId);
    
    let result = filterByTenant(roomCleaningSchedules, tenantId) as RoomCleaningSchedule[];
    
    if (roomId) {
      result = result.filter(s => s.roomId === roomId);
    }
    
    if (activeOnly) {
      result = result.filter(s => s.isActive);
    }
    
    return result.sort((a, b) => a.nextScheduledDate.localeCompare(b.nextScheduledDate));
  },

  /**
   * Mark cleaning schedule as performed
   */
  async markCleaningPerformed(tenantId: string, scheduleId: string): Promise<RoomCleaningSchedule> {
    await delay(200);
    requireTenantId(tenantId);
    
    const schedule = findByIdAndTenant(roomCleaningSchedules, scheduleId, tenantId) as RoomCleaningSchedule | null;
    if (!schedule) {
      throw new NotFoundError('RoomCleaningSchedule', scheduleId);
    }
    
    // Check if schedule is still active
    if (!schedule.isActive) {
      throw new BusinessRuleError('Cannot mark cleaning performed for inactive schedule', 'SCHEDULE_INACTIVE');
    }
    
    const index = roomCleaningSchedules.findIndex(s => s.id === scheduleId);
    const nextDate = new Date(schedule.nextScheduledDate);
    nextDate.setDate(nextDate.getDate() + schedule.frequency);
    
    roomCleaningSchedules[index] = {
      ...roomCleaningSchedules[index],
      lastPerformedDate: now(),
      nextScheduledDate: nextDate.toISOString().split('T')[0],
      updatedAt: now(),
    };
    
    return roomCleaningSchedules[index];
  },
};

// ============================================================
// ROOM TYPE SERVICE
// ============================================================

export interface CreateRoomTypeDto {
  code: string;
  name: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  bedCount: number;
  size: number;
  amenities: string[];
  images?: string[];
  isActive?: boolean;
}

export interface UpdateRoomTypeDto extends Partial<CreateRoomTypeDto> {
  isActive?: boolean;
}

export const roomTypeService = {
  /**
   * Get all room types
   * CRITICAL FIX: Added tenant isolation - each hotel has custom room types
   */
  async getAll(tenantId: string): Promise<RoomType[]> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantRoomTypes = filterByTenant(roomTypes, tenantId) as RoomType[];
    return tenantRoomTypes.filter(rt => rt.isActive);
  },

  /**
   * Get room type by ID
   * CRITICAL FIX: Added tenant isolation
   */
  async getById(tenantId: string, id: string): Promise<RoomType | null> {
    await delay(200);
    requireTenantId(tenantId);
    const roomType = findByIdAndTenant(roomTypes, id, tenantId) as RoomType | null;
    return roomType;
  },

  /**
   * Get room count by type
   * CRITICAL FIX: Added tenant isolation
   */
  async getRoomCountByType(tenantId: string): Promise<Record<string, number>> {
    await delay(200);
    requireTenantId(tenantId);
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    const counts: Record<string, number> = {};
    tenantRooms.forEach(room => {
      counts[room.roomTypeId] = (counts[room.roomTypeId] || 0) + 1;
    });
    return counts;
  },

  /**
   * Create a new room type
   * 
   * HARDENING FIX #7: Authorization check for room type CRUD
   */
  async create(
    tenantId: string, 
    data: CreateRoomTypeDto,
    performedBy: string // HARDENING: Now mandatory for audit
  ): Promise<RoomType> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    // HARDENING FIX #7: Authorization check
    const userRole = getUserRole(performedBy);
    requirePermission(userRole, 'room_type.crud');
    
    // Check if code already exists within tenant
    const tenantRoomTypes = filterByTenant(roomTypes, tenantId) as RoomType[];
    if (tenantRoomTypes.some(rt => rt.code === data.code)) {
      throw new ValidationError('Room type code already exists');
    }
    
    const newRoomType: RoomType & { tenantId: string } = {
      id: generateSequentialId('RT', roomTypes.map(rt => rt.id)),
      tenantId, // CRITICAL: Tenant isolation
      code: data.code,
      name: data.name,
      description: data.description,
      baseRate: data.baseRate,
      maxOccupancy: data.maxOccupancy,
      maxAdults: data.maxAdults,
      maxChildren: data.maxChildren,
      bedType: data.bedType,
      bedCount: data.bedCount,
      size: data.size,
      amenities: data.amenities || [],
      images: data.images || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: now(),
      updatedAt: now(),
    };
    
    roomTypes.push(newRoomType);
    return newRoomType;
  },

  /**
   * Update a room type
   * 
   * HARDENING FIX #7: Authorization check
   */
  async update(
    tenantId: string, 
    id: string, 
    data: UpdateRoomTypeDto,
    performedBy: string // HARDENING: Now mandatory
  ): Promise<RoomType> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    // HARDENING FIX #7: Authorization check
    const userRole = getUserRole(performedBy);
    requirePermission(userRole, 'room_type.crud');
    
    const roomType = findByIdAndTenant(roomTypes, id, tenantId) as RoomType | null;
    if (!roomType) {
      throw new NotFoundError('RoomType', id);
    }
    
    const index = roomTypes.findIndex(rt => rt.id === id);
    
    // Check if code is being changed and already exists within tenant
    if (data.code && data.code !== roomTypes[index].code) {
      const tenantRoomTypes = filterByTenant(roomTypes, tenantId) as RoomType[];
      if (tenantRoomTypes.some(rt => rt.code === data.code && rt.id !== id)) {
        throw new ValidationError('Room type code already exists');
      }
    }
    
    roomTypes[index] = {
      ...roomTypes[index],
      ...data,
      updatedAt: now(),
    };
    
    return roomTypes[index];
  },

  /**
   * Delete a room type (soft delete by setting isActive to false)
   * 
   * HARDENING FIX #7: Authorization check
   */
  async delete(
    tenantId: string, 
    id: string,
    performedBy: string // HARDENING: Now mandatory
  ): Promise<void> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    // HARDENING FIX #7: Authorization check
    const userRole = getUserRole(performedBy);
    requirePermission(userRole, 'room_type.crud');
    
    const roomType = findByIdAndTenant(roomTypes, id, tenantId) as RoomType | null;
    if (!roomType) {
      throw new NotFoundError('RoomType', id);
    }
    
    const index = roomTypes.findIndex(rt => rt.id === id);
    
    // Check if any rooms are using this type (within tenant)
    const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
    const roomsUsingType = tenantRooms.filter(r => r.roomTypeId === id);
    if (roomsUsingType.length > 0) {
      throw new BusinessRuleError(
        `Cannot delete room type: ${roomsUsingType.length} room(s) are using this type`,
        'ROOM_TYPE_IN_USE'
      );
    }
    
    // Soft delete
    roomTypes[index] = {
      ...roomTypes[index],
      isActive: false,
      updatedAt: now(),
    };
  },
};
