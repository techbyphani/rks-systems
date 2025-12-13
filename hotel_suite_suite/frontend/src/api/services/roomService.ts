import type { Room, RoomType, RoomStatus, HousekeepingTask, PaginatedResponse } from '@/types';
import { mockRooms, mockRoomTypes, getRoomStatusCounts } from '../mockData';
import { delay, now, paginate } from '../helpers';

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
}

export const roomService = {
  /**
   * Get all rooms with optional filtering
   */
  async getAll(filters: RoomFilters = {}): Promise<PaginatedResponse<Room>> {
    await delay(300);
    
    let result = [...rooms];
    
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
   */
  async getById(id: string): Promise<Room | null> {
    await delay(200);
    return rooms.find(r => r.id === id) || null;
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
   */
  async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    await delay(300);
    
    const index = rooms.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Room not found');
    
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
   */
  async assignToGuest(id: string, guestId: string, reservationId: string): Promise<Room> {
    await delay(300);
    
    const index = rooms.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Room not found');
    
    rooms[index] = {
      ...rooms[index],
      status: 'occupied',
      currentGuestId: guestId,
      currentReservationId: reservationId,
      updatedAt: now(),
    };
    
    return rooms[index];
  },

  /**
   * Release room (after checkout)
   */
  async release(id: string): Promise<Room> {
    await delay(300);
    
    const index = rooms.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Room not found');
    
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
   */
  async getStats(): Promise<{
    total: number;
    available: number;
    occupied: number;
    dirty: number;
    outOfOrder: number;
    occupancyRate: number;
  }> {
    await delay(200);
    
    const counts = getRoomStatusCounts();
    const total = rooms.length;
    const available = counts.available;
    const occupied = counts.occupied;
    
    return {
      total,
      available,
      occupied,
      dirty: counts.dirty,
      outOfOrder: counts.out_of_order + counts.out_of_service,
      occupancyRate: Math.round((occupied / (total - counts.out_of_order - counts.out_of_service)) * 100),
    };
  },
};

// Room Type Service
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
};
