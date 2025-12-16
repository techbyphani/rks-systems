import type { Room, RoomType, RoomStatus, RoomCondition, HousekeepingTask, PaginatedResponse } from '@/types';
import { mockRooms, mockRoomTypes, getRoomStatusCounts } from '../mockData';
import { delay, now, paginate, generateSequentialId } from '../helpers';
import { NotFoundError, BusinessRuleError, ConflictError } from '../errors';
import { requireTenantId, filterByTenant, findByIdAndTenant } from '../helpers/tenantFilter';
import { checkVersion, incrementVersion, type VersionedEntity } from '../helpers/optimisticLock';

// In-memory stores
let rooms = [...mockRooms];
let roomTypes = [...mockRoomTypes];

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
}

export interface UpdateRoomDto extends Partial<CreateRoomDto> {
  status?: RoomStatus;
  condition?: RoomCondition;
  notes?: string;
}

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
   */
  async getByNumber(roomNumber: string): Promise<Room | null> {
    await delay(200);
    return rooms.find(r => r.roomNumber === roomNumber) || null;
  },

  /**
   * Update room status
   * CRITICAL FIX: Added tenant isolation
   */
  async updateStatus(tenantId: string, id: string, status: RoomStatus): Promise<Room> {
    await delay(300);
    
    requireTenantId(tenantId);
    const room = findByIdAndTenant(rooms, id, tenantId);
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    
    const index = rooms.findIndex(r => r.id === id);
    rooms[index] = {
      ...rooms[index],
      status,
      condition: status === 'available' ? 'clean' : rooms[index].condition,
      lastCleanedAt: status === 'available' ? now() : rooms[index].lastCleanedAt,
      updatedAt: now(),
    };
    
    return rooms[index];
  },

  /**
   * Assign room to guest
   * CRITICAL FIX: Added tenant isolation
   */
  async assignToGuest(tenantId: string, id: string, guestId: string, reservationId: string): Promise<Room> {
    await delay(300);
    
    requireTenantId(tenantId);
    const room = findByIdAndTenant(rooms, id, tenantId);
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    
    const index = rooms.findIndex(r => r.id === id);
    
    const updated = {
      ...rooms[index],
      status: 'occupied',
      currentGuestId: guestId,
      currentReservationId: reservationId,
      updatedAt: now(),
    };
    
    // CRITICAL: Increment version for optimistic locking
    rooms[index] = incrementVersion(updated as VersionedEntity) as Room;
    
    return rooms[index];
  },

  /**
   * Release room (after checkout)
   * CRITICAL FIX: Added tenant isolation and business rule validation
   */
  async release(tenantId: string, id: string): Promise<Room> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, id, tenantId);
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    
    const index = rooms.findIndex(r => r.id === id);
    
    // Business Rule Validation: Can only release occupied rooms
    if (room.status !== 'occupied') {
      throw new BusinessRuleError(
        `Cannot release room ${room.roomNumber} with status "${room.status}". Only occupied rooms can be released.`,
        'INVALID_STATUS_FOR_RELEASE'
      );
    }
    
    rooms[index] = {
      ...rooms[index],
      status: 'dirty',
      condition: 'dirty',
      currentGuestId: undefined,
      currentReservationId: undefined,
      updatedAt: now(),
    };
    
    return rooms[index];
  },

  /**
   * Get room status counts
   */
  async getStatusCounts(): Promise<Record<RoomStatus, number>> {
    await delay(200);
    return getRoomStatusCounts();
  },

  /**
   * Get available rooms for a room type
   */
  async getAvailableByType(roomTypeId: string): Promise<Room[]> {
    await delay(200);
    return rooms.filter(r => r.roomTypeId === roomTypeId && r.status === 'available');
  },

  /**
   * Get all floors
   */
  async getFloors(): Promise<number[]> {
    await delay(100);
    return [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
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
   * Note: Room types are typically shared across tenants, but we accept tenantId for consistency
   */
  async getRoomTypes(tenantId?: string): Promise<RoomType[]> {
    await delay(200);
    return roomTypes.filter(rt => rt.isActive);
  },

  /**
   * Create a new room
   */
  async create(data: CreateRoomDto): Promise<Room> {
    await delay(300);
    
    // Check if room number already exists
    if (rooms.some(r => r.roomNumber === data.roomNumber)) {
      throw new Error('Room number already exists');
    }
    
    // Validate room type exists
    const roomType = roomTypes.find(rt => rt.id === data.roomTypeId);
    if (!roomType) {
      throw new Error('Room type not found');
    }
    
    const newRoom: Room = {
      id: `RM${data.roomNumber}`,
      roomNumber: data.roomNumber,
      roomTypeId: data.roomTypeId,
      roomType,
      floor: data.floor,
      building: data.building,
      wing: data.wing,
      status: 'available',
      condition: 'clean',
      isSmokingAllowed: data.isSmokingAllowed || false,
      hasBalcony: data.hasBalcony || false,
      viewType: data.viewType,
      notes: data.notes,
      createdAt: now(),
      updatedAt: now(),
    };
    
    rooms.push(newRoom);
    return newRoom;
  },

  /**
   * Update a room
   * CRITICAL FIX: Added tenant isolation and optimistic locking
   */
  async update(
    tenantId: string,
    id: string,
    data: UpdateRoomDto,
    expectedVersion?: number
  ): Promise<Room> {
    await delay(300);
    
    requireTenantId(tenantId);
    
    const room = findByIdAndTenant(rooms, id, tenantId);
    if (!room) {
      throw new NotFoundError('Room', id);
    }
    
    // CRITICAL: Check version for optimistic locking
    checkVersion(room as VersionedEntity, expectedVersion, 'Room');
    
    const index = rooms.findIndex(r => r.id === id);
    
    // Check if room number is being changed and already exists (within tenant)
    if (data.roomNumber && data.roomNumber !== rooms[index].roomNumber) {
      const tenantRooms = filterByTenant(rooms, tenantId) as Room[];
      if (tenantRooms.some(r => r.roomNumber === data.roomNumber && r.id !== id)) {
        throw new BusinessRuleError('Room number already exists', 'ROOM_NUMBER_EXISTS');
      }
    }
    
    // Validate room type if being changed
    if (data.roomTypeId && data.roomTypeId !== rooms[index].roomTypeId) {
      const roomType = roomTypes.find(rt => rt.id === data.roomTypeId);
      if (!roomType) {
        throw new Error('Room type not found');
      }
      rooms[index].roomType = roomType;
    }
    
    const updated = {
      ...rooms[index],
      ...data,
      roomTypeId: data.roomTypeId || rooms[index].roomTypeId,
      updatedAt: now(),
    };
    
    // CRITICAL: Increment version for optimistic locking
    rooms[index] = incrementVersion(updated as VersionedEntity) as Room;
    
    return rooms[index];
  },

  /**
   * Delete a room
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = rooms.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Room not found');
    
    // Check if room is occupied or reserved
    if (rooms[index].status === 'occupied' || rooms[index].status === 'reserved') {
      throw new Error('Cannot delete room that is occupied or reserved');
    }
    
    rooms.splice(index, 1);
  },

  /**
   * Check room availability for a date range
   */
  async checkAvailability(
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: string
  ): Promise<Room[]> {
    await delay(200);
    
    // Get all rooms of this type
    let availableRooms = rooms.filter(r => r.roomTypeId === roomTypeId);
    
    // Filter by status - only available or reserved rooms can be checked
    availableRooms = availableRooms.filter(r => 
      r.status === 'available' || r.status === 'reserved'
    );
    
    // In a real system, we'd check reservations for the date range
    // For now, we'll return rooms that are available
    return availableRooms.filter(r => r.status === 'available');
  },

  /**
   * Update room notes
   */
  async updateNotes(id: string, notes: string): Promise<Room> {
    await delay(200);
    
    const index = rooms.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Room not found');
    
    rooms[index] = {
      ...rooms[index],
      notes,
      updatedAt: now(),
    };
    
    return rooms[index];
  },

  /**
   * Bulk update room status
   */
  async bulkUpdateStatus(roomIds: string[], status: RoomStatus): Promise<Room[]> {
    await delay(400);
    
    const updatedRooms: Room[] = [];
    
    for (const roomId of roomIds) {
      const index = rooms.findIndex(r => r.id === roomId);
      if (index !== -1) {
        rooms[index] = {
          ...rooms[index],
          status,
          condition: status === 'available' ? 'clean' : rooms[index].condition,
          lastCleanedAt: status === 'available' ? now() : rooms[index].lastCleanedAt,
          updatedAt: now(),
        };
        updatedRooms.push(rooms[index]);
      }
    }
    
    return updatedRooms;
  },
};

// Room Type Service
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
   */
  async getAll(): Promise<RoomType[]> {
    await delay(200);
    return roomTypes.filter(rt => rt.isActive);
  },

  /**
   * Get room type by ID
   */
  async getById(id: string): Promise<RoomType | null> {
    await delay(200);
    return roomTypes.find(rt => rt.id === id) || null;
  },

  /**
   * Get room count by type
   */
  async getRoomCountByType(): Promise<Record<string, number>> {
    await delay(200);
    const counts: Record<string, number> = {};
    rooms.forEach(room => {
      counts[room.roomTypeId] = (counts[room.roomTypeId] || 0) + 1;
    });
    return counts;
  },

  /**
   * Create a new room type
   */
  async create(data: CreateRoomTypeDto): Promise<RoomType> {
    await delay(300);
    
    // Check if code already exists
    if (roomTypes.some(rt => rt.code === data.code)) {
      throw new Error('Room type code already exists');
    }
    
    const newRoomType: RoomType = {
      id: generateSequentialId('RT', roomTypes.map(rt => rt.id)),
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
   */
  async update(id: string, data: UpdateRoomTypeDto): Promise<RoomType> {
    await delay(300);
    
    const index = roomTypes.findIndex(rt => rt.id === id);
    if (index === -1) throw new Error('Room type not found');
    
    // Check if code is being changed and already exists
    if (data.code && data.code !== roomTypes[index].code) {
      if (roomTypes.some(rt => rt.code === data.code && rt.id !== id)) {
        throw new Error('Room type code already exists');
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
   */
  async delete(id: string): Promise<void> {
    await delay(300);
    
    const index = roomTypes.findIndex(rt => rt.id === id);
    if (index === -1) throw new Error('Room type not found');
    
    // Check if any rooms are using this type
    const roomsUsingType = rooms.filter(r => r.roomTypeId === id);
    if (roomsUsingType.length > 0) {
      throw new Error(`Cannot delete room type: ${roomsUsingType.length} room(s) are using this type`);
    }
    
    // Soft delete
    roomTypes[index] = {
      ...roomTypes[index],
      isActive: false,
      updatedAt: now(),
    };
  },
};
