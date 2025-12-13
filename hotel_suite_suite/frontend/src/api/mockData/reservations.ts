import type { Reservation, ReservationStatus, ReservationSource } from '@/types';
import { mockGuests } from './guests';
import { mockRoomTypes } from './roomTypes';
import { addDays, subtractDays } from '../helpers';

const today = new Date().toISOString().split('T')[0];

// Statuses for distribution
const statusDistribution: ReservationStatus[] = [
  'confirmed', 'confirmed', 'confirmed', 'confirmed',
  'checked_in', 'checked_in', 'checked_in', 'checked_in', 'checked_in',
  'checked_out', 'checked_out',
  'cancelled',
];

const sourceDistribution: ReservationSource[] = [
  'direct_website', 'direct_website', 'direct_website',
  'ota_booking', 'ota_booking',
  'ota_expedia',
  'phone', 'phone',
  'corporate',
  'walk_in',
];

export const mockReservations: Reservation[] = [];

// Generate past reservations (checked out)
for (let i = 1; i <= 30; i++) {
  const guest = mockGuests[Math.floor(Math.random() * 10)];
  const roomType = mockRoomTypes[Math.floor(Math.random() * mockRoomTypes.length)];
  const checkInDate = subtractDays(today, Math.floor(Math.random() * 30) + 5);
  const nights = Math.floor(Math.random() * 4) + 1;
  const checkOutDate = addDays(checkInDate, nights);
  
  mockReservations.push({
    id: `RES${String(i).padStart(5, '0')}`,
    confirmationNumber: `AGH${2024}${String(i).padStart(6, '0')}`,
    guestId: guest.id,
    guest,
    roomTypeId: roomType.id,
    roomType,
    roomId: `RM${Math.floor(Math.random() * 8) + 1}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
    checkInDate,
    checkOutDate,
    actualCheckIn: `${checkInDate}T14:00:00Z`,
    actualCheckOut: `${checkOutDate}T11:00:00Z`,
    nights,
    adults: Math.floor(Math.random() * 2) + 1,
    children: Math.floor(Math.random() * 2),
    infants: 0,
    status: 'checked_out',
    source: sourceDistribution[Math.floor(Math.random() * sourceDistribution.length)],
    roomRate: roomType.baseRate,
    totalAmount: roomType.baseRate * nights,
    depositAmount: roomType.baseRate,
    depositPaid: true,
    paymentMode: 'pay_at_hotel',
    createdAt: subtractDays(checkInDate, Math.floor(Math.random() * 14) + 1) + 'T10:00:00Z',
    updatedAt: checkOutDate + 'T11:00:00Z',
  });
}

// Generate current reservations (checked in)
for (let i = 31; i <= 55; i++) {
  const guest = mockGuests[Math.floor(Math.random() * mockGuests.length)];
  const roomType = mockRoomTypes[Math.floor(Math.random() * mockRoomTypes.length)];
  const checkInDate = subtractDays(today, Math.floor(Math.random() * 3));
  const nights = Math.floor(Math.random() * 5) + 2;
  const checkOutDate = addDays(checkInDate, nights);
  
  mockReservations.push({
    id: `RES${String(i).padStart(5, '0')}`,
    confirmationNumber: `AGH${2024}${String(i).padStart(6, '0')}`,
    guestId: guest.id,
    guest,
    roomTypeId: roomType.id,
    roomType,
    roomId: `RM${Math.floor(Math.random() * 8) + 1}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
    checkInDate,
    checkOutDate,
    actualCheckIn: `${checkInDate}T14:30:00Z`,
    nights,
    adults: Math.floor(Math.random() * 2) + 1,
    children: Math.floor(Math.random() * 2),
    infants: 0,
    status: 'checked_in',
    source: sourceDistribution[Math.floor(Math.random() * sourceDistribution.length)],
    roomRate: roomType.baseRate,
    totalAmount: roomType.baseRate * nights,
    depositAmount: roomType.baseRate,
    depositPaid: true,
    paymentMode: 'pay_at_hotel',
    createdAt: subtractDays(checkInDate, Math.floor(Math.random() * 7) + 1) + 'T10:00:00Z',
    updatedAt: checkInDate + 'T14:30:00Z',
  });
}

// Generate future reservations (confirmed)
for (let i = 56; i <= 85; i++) {
  const guest = mockGuests[Math.floor(Math.random() * mockGuests.length)];
  const roomType = mockRoomTypes[Math.floor(Math.random() * mockRoomTypes.length)];
  const checkInDate = addDays(today, Math.floor(Math.random() * 30) + 1);
  const nights = Math.floor(Math.random() * 4) + 1;
  const checkOutDate = addDays(checkInDate, nights);
  
  mockReservations.push({
    id: `RES${String(i).padStart(5, '0')}`,
    confirmationNumber: `AGH${2024}${String(i).padStart(6, '0')}`,
    guestId: guest.id,
    guest,
    roomTypeId: roomType.id,
    roomType,
    checkInDate,
    checkOutDate,
    nights,
    adults: Math.floor(Math.random() * 2) + 1,
    children: Math.floor(Math.random() * 2),
    infants: 0,
    status: 'confirmed',
    source: sourceDistribution[Math.floor(Math.random() * sourceDistribution.length)],
    roomRate: roomType.baseRate,
    totalAmount: roomType.baseRate * nights,
    depositAmount: roomType.baseRate,
    depositPaid: Math.random() > 0.3,
    paymentMode: Math.random() > 0.5 ? 'prepaid' : 'pay_at_hotel',
    createdAt: subtractDays(today, Math.floor(Math.random() * 14)) + 'T10:00:00Z',
    updatedAt: subtractDays(today, Math.floor(Math.random() * 7)) + 'T15:00:00Z',
  });
}

// Today's arrivals
for (let i = 86; i <= 95; i++) {
  const guest = mockGuests[Math.floor(Math.random() * mockGuests.length)];
  const roomType = mockRoomTypes[Math.floor(Math.random() * mockRoomTypes.length)];
  const nights = Math.floor(Math.random() * 3) + 1;
  
  mockReservations.push({
    id: `RES${String(i).padStart(5, '0')}`,
    confirmationNumber: `AGH${2024}${String(i).padStart(6, '0')}`,
    guestId: guest.id,
    guest,
    roomTypeId: roomType.id,
    roomType,
    checkInDate: today,
    checkOutDate: addDays(today, nights),
    nights,
    adults: Math.floor(Math.random() * 2) + 1,
    children: Math.floor(Math.random() * 2),
    infants: 0,
    status: 'confirmed',
    source: sourceDistribution[Math.floor(Math.random() * sourceDistribution.length)],
    roomRate: roomType.baseRate,
    totalAmount: roomType.baseRate * nights,
    depositAmount: roomType.baseRate,
    depositPaid: true,
    paymentMode: 'pay_at_hotel',
    specialRequests: Math.random() > 0.5 ? 'Early check-in requested' : undefined,
    createdAt: subtractDays(today, Math.floor(Math.random() * 14) + 3) + 'T10:00:00Z',
    updatedAt: subtractDays(today, 1) + 'T15:00:00Z',
  });
}

// Today's departures
for (let i = 96; i <= 105; i++) {
  const guest = mockGuests[Math.floor(Math.random() * mockGuests.length)];
  const roomType = mockRoomTypes[Math.floor(Math.random() * mockRoomTypes.length)];
  const nights = Math.floor(Math.random() * 3) + 1;
  const checkInDate = subtractDays(today, nights);
  
  mockReservations.push({
    id: `RES${String(i).padStart(5, '0')}`,
    confirmationNumber: `AGH${2024}${String(i).padStart(6, '0')}`,
    guestId: guest.id,
    guest,
    roomTypeId: roomType.id,
    roomType,
    roomId: `RM${Math.floor(Math.random() * 8) + 1}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
    checkInDate,
    checkOutDate: today,
    actualCheckIn: `${checkInDate}T14:00:00Z`,
    nights,
    adults: Math.floor(Math.random() * 2) + 1,
    children: 0,
    infants: 0,
    status: 'checked_in',
    source: sourceDistribution[Math.floor(Math.random() * sourceDistribution.length)],
    roomRate: roomType.baseRate,
    totalAmount: roomType.baseRate * nights,
    depositAmount: roomType.baseRate,
    depositPaid: true,
    paymentMode: 'pay_at_hotel',
    specialRequests: Math.random() > 0.5 ? 'Late check-out requested' : undefined,
    createdAt: subtractDays(checkInDate, Math.floor(Math.random() * 7) + 1) + 'T10:00:00Z',
    updatedAt: checkInDate + 'T14:00:00Z',
  });
}

// Cancelled reservations
for (let i = 106; i <= 110; i++) {
  const guest = mockGuests[Math.floor(Math.random() * mockGuests.length)];
  const roomType = mockRoomTypes[Math.floor(Math.random() * mockRoomTypes.length)];
  const checkInDate = addDays(today, Math.floor(Math.random() * 14));
  const nights = Math.floor(Math.random() * 3) + 1;
  
  mockReservations.push({
    id: `RES${String(i).padStart(5, '0')}`,
    confirmationNumber: `AGH${2024}${String(i).padStart(6, '0')}`,
    guestId: guest.id,
    guest,
    roomTypeId: roomType.id,
    roomType,
    checkInDate,
    checkOutDate: addDays(checkInDate, nights),
    nights,
    adults: 2,
    children: 0,
    infants: 0,
    status: 'cancelled',
    source: sourceDistribution[Math.floor(Math.random() * sourceDistribution.length)],
    roomRate: roomType.baseRate,
    totalAmount: roomType.baseRate * nights,
    depositAmount: roomType.baseRate,
    depositPaid: false,
    paymentMode: 'pay_at_hotel',
    cancelledAt: subtractDays(today, Math.floor(Math.random() * 5)) + 'T10:00:00Z',
    cancellationReason: 'Change of plans',
    createdAt: subtractDays(today, Math.floor(Math.random() * 21) + 7) + 'T10:00:00Z',
    updatedAt: subtractDays(today, Math.floor(Math.random() * 5)) + 'T10:00:00Z',
  });
}
