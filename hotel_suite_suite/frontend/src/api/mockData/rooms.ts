import type { Room, RoomStatus } from '@/types';
import { mockRoomTypes } from './roomTypes';

const generateRooms = (): Room[] => {
  const rooms: Room[] = [];
  const now = new Date().toISOString();
  
  // Building configuration
  const floors = [1, 2, 3, 4, 5, 6, 7, 8];
  const roomsPerFloor = 12;
  
  // Status distribution for realistic data
  const statusDistribution: RoomStatus[] = [
    'available', 'available', 'available', 'available',
    'occupied', 'occupied', 'occupied', 'occupied', 'occupied',
    'dirty', 'dirty',
    'reserved',
    'cleaning',
    'out_of_order',
  ];
  
  floors.forEach(floor => {
    for (let i = 1; i <= roomsPerFloor; i++) {
      const roomNumber = `${floor}${String(i).padStart(2, '0')}`;
      
      // Assign room type based on floor
      let roomTypeId: string;
      if (floor <= 2) {
        roomTypeId = 'RT001'; // Standard
      } else if (floor <= 4) {
        roomTypeId = 'RT002'; // Deluxe
      } else if (floor <= 6) {
        roomTypeId = 'RT003'; // Premier
      } else if (floor === 7) {
        roomTypeId = i <= 6 ? 'RT004' : 'RT006'; // Suite or Family
      } else {
        roomTypeId = i <= 4 ? 'RT005' : 'RT004'; // Presidential or Executive Suite
      }
      
      const roomType = mockRoomTypes.find(rt => rt.id === roomTypeId);
      const status = statusDistribution[Math.floor(Math.random() * statusDistribution.length)];
      
      rooms.push({
        id: `RM${roomNumber}`,
        tenantId: 'tenant-001', // CRITICAL: Tenant isolation
        roomNumber,
        roomTypeId,
        roomType,
        floor,
        building: 'Main Tower',
        wing: i <= 6 ? 'East' : 'West',
        status,
        condition: status === 'available' || status === 'reserved' || status === 'occupied' ? 'clean' : 'dirty',
        isSmokingAllowed: false,
        hasBalcony: floor >= 5,
        viewType: i <= 6 ? 'City View' : 'Garden View',
        currentGuestId: status === 'occupied' ? `G${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}` : undefined,
        lastCleanedAt: status === 'available' ? now : undefined,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: now,
      });
    }
  });
  
  return rooms;
};

export const mockRooms: Room[] = generateRooms();

// Helper to get room counts by status
export const getRoomStatusCounts = (rooms?: typeof mockRooms) => {
  const roomsToCount = rooms || mockRooms;
  const counts: Record<RoomStatus, number> = {
    available: 0,
    occupied: 0,
    reserved: 0,
    dirty: 0,
    cleaning: 0,
    inspecting: 0,
    out_of_order: 0,
    out_of_service: 0,
  };
  
  roomsToCount.forEach(room => {
    counts[room.status]++;
  });
  
  return counts;
};
