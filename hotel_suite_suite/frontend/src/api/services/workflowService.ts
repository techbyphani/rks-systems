/**
 * Workflow Service - Handles cross-module operations
 * Coordinates actions across CRS, RMS, and BMS modules
 */

import { reservationService } from './reservationService';
import { roomService } from './roomService';
import { billingService } from './billingService';
import { delay, generateId, now } from '../helpers';
import type { Reservation, Room, Folio, Guest } from '@/types';

export interface CheckInWorkflowResult {
  reservation: Reservation;
  room: Room;
  folio: Folio;
}

export interface CheckOutWorkflowResult {
  reservation: Reservation;
  room: Room;
  folio: Folio;
  invoice?: any;
}

export interface QuickBookingData {
  guestId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  source: Reservation['source'];
  paymentMode: Reservation['paymentMode'];
  specialRequests?: string;
  autoAssignRoom?: boolean;
  createFolio?: boolean;
}

export const workflowService = {
  /**
   * Complete check-in workflow:
   * 1. Update reservation status
   * 2. Assign room to guest
   * 3. Create folio for the stay
   */
  async performCheckIn(
    reservationId: string,
    roomId: string,
    notes?: string
  ): Promise<CheckInWorkflowResult> {
    await delay(500);

    // Step 1: Check in the reservation
    const reservation = await reservationService.checkIn(reservationId, { roomId, notes });

    // Step 2: Assign room to guest
    const room = await roomService.assignToGuest(roomId, reservation.guestId, reservationId);

    // Step 3: Create folio for the stay
    const folio = await billingService.createFolio(reservationId, reservation.guestId, roomId);

    // Step 4: Post room charges to folio
    await billingService.postCharge(folio.id, {
      category: 'room',
      description: `Room ${room.roomNumber} - ${reservation.nights} night(s)`,
      quantity: reservation.nights,
      unitPrice: reservation.roomRate,
      referenceType: 'reservation',
      referenceId: reservationId,
    });

    // Update reservation with folio ID
    reservation.folioId = folio.id;

    return { reservation, room, folio };
  },

  /**
   * Complete check-out workflow:
   * 1. Close/settle folio
   * 2. Release room
   * 3. Update reservation status
   */
  async performCheckOut(reservationId: string): Promise<CheckOutWorkflowResult> {
    await delay(500);

    // Get reservation
    const reservation = await reservationService.getById(reservationId);
    if (!reservation) throw new Error('Reservation not found');

    // Get folio
    let folio: Folio | null = null;
    if (reservation.folioId) {
      folio = await billingService.getFolioById(reservation.folioId);
    }

    // Check balance
    if (folio && folio.balance > 0) {
      throw new Error(`Outstanding balance of ₹${folio.balance}. Please settle before checkout.`);
    }

    // Step 1: Close folio
    if (folio && folio.status === 'open') {
      folio = await billingService.closeFolio(folio.id);
    }

    // Step 2: Release room
    let room: Room | null = null;
    if (reservation.roomId) {
      room = await roomService.release(reservation.roomId);
    }

    // Step 3: Check out reservation
    const updatedReservation = await reservationService.checkOut(reservationId);

    return {
      reservation: updatedReservation,
      room: room!,
      folio: folio!,
    };
  },

  /**
   * Quick booking workflow:
   * 1. Create reservation
   * 2. Optionally auto-assign room
   * 3. Optionally create folio
   */
  async quickBooking(data: QuickBookingData): Promise<{
    reservation: Reservation;
    room?: Room;
    folio?: Folio;
  }> {
    await delay(500);

    // Step 1: Create reservation
    const reservation = await reservationService.create({
      guestId: data.guestId,
      roomTypeId: data.roomTypeId,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      adults: data.adults,
      children: data.children,
      source: data.source,
      paymentMode: data.paymentMode,
      specialRequests: data.specialRequests,
    });

    let room: Room | undefined;
    let folio: Folio | undefined;

    // Step 2: Auto-assign room if requested
    if (data.autoAssignRoom) {
      const availableRooms = await roomService.getAvailableRooms(data.roomTypeId);
      if (availableRooms.length > 0) {
        room = availableRooms[0];
        reservation.roomId = room.id;
        reservation.room = room;
      }
    }

    // Step 3: Create folio if requested
    if (data.createFolio) {
      folio = await billingService.createFolio(
        reservation.id,
        reservation.guestId,
        room?.id
      );
      reservation.folioId = folio.id;
    }

    return { reservation, room, folio };
  },

  /**
   * Walk-in check-in workflow:
   * 1. Create guest (if new)
   * 2. Create reservation
   * 3. Assign room
   * 4. Create folio
   * 5. Check in
   */
  async walkInCheckIn(data: {
    guestId: string;
    roomId: string;
    nights: number;
    adults: number;
    children?: number;
    roomRate: number;
    paymentMode: Reservation['paymentMode'];
    depositAmount?: number;
  }): Promise<CheckInWorkflowResult> {
    await delay(600);

    const today = new Date().toISOString().split('T')[0];
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + data.nights);

    // Get room details
    const room = await roomService.getById(data.roomId);
    if (!room) throw new Error('Room not found');

    // Create reservation
    const reservation = await reservationService.create({
      guestId: data.guestId,
      roomTypeId: room.roomTypeId,
      checkInDate: today,
      checkOutDate: checkOutDate.toISOString().split('T')[0],
      adults: data.adults,
      children: data.children,
      source: 'walk_in',
      paymentMode: data.paymentMode,
      roomRate: data.roomRate,
    });

    // Perform check-in workflow
    return this.performCheckIn(reservation.id, data.roomId);
  },

  /**
   * Post charge from another module (e.g., OMS, Spa)
   */
  async postCrossModuleCharge(
    guestId: string,
    charge: {
      category: 'food_beverage' | 'spa' | 'laundry' | 'minibar' | 'telephone' | 'parking' | 'other';
      description: string;
      amount: number;
      referenceType: string;
      referenceId: string;
    }
  ): Promise<void> {
    await delay(300);

    // Find active folio for guest
    const folios = await billingService.getAllFolios({ guestId, status: 'open' });
    if (folios.data.length === 0) {
      throw new Error('No active folio found for guest');
    }

    const folio = folios.data[0];

    // Post charge
    await billingService.postCharge(folio.id, {
      category: charge.category,
      description: charge.description,
      quantity: 1,
      unitPrice: charge.amount,
      referenceType: charge.referenceType,
      referenceId: charge.referenceId,
    });
  },

  /**
   * Get today's operational summary
   */
  async getOperationalSummary(): Promise<{
    arrivals: { expected: number; completed: number; pending: number };
    departures: { expected: number; completed: number; pending: number };
    inHouse: number;
    occupancy: number;
    revenue: { today: number; mtd: number };
    alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'error' }>;
  }> {
    await delay(300);

    const [reservationStats, roomStats, billingMetrics] = await Promise.all([
      reservationService.getStats(),
      roomService.getStats(),
      billingService.getMetrics(),
    ]);

    const alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'error' }> = [];

    // Generate alerts based on data
    if (reservationStats.todaysArrivals > 0) {
      alerts.push({
        type: 'arrivals',
        message: `${reservationStats.todaysArrivals} arrivals expected today`,
        severity: 'info',
      });
    }

    if (billingMetrics.totalOutstanding > 100000) {
      alerts.push({
        type: 'billing',
        message: `High outstanding balance: ₹${billingMetrics.totalOutstanding.toLocaleString()}`,
        severity: 'warning',
      });
    }

    if (roomStats.dirty > 5) {
      alerts.push({
        type: 'housekeeping',
        message: `${roomStats.dirty} rooms need cleaning`,
        severity: 'warning',
      });
    }

    return {
      arrivals: {
        expected: reservationStats.todaysArrivals,
        completed: 0, // Would track actual check-ins
        pending: reservationStats.todaysArrivals,
      },
      departures: {
        expected: reservationStats.todaysDepartures,
        completed: 0,
        pending: reservationStats.todaysDepartures,
      },
      inHouse: reservationStats.inHouse,
      occupancy: roomStats.occupancyRate,
      revenue: {
        today: billingMetrics.todaysRevenue,
        mtd: billingMetrics.todaysRevenue * 15, // Mock MTD
      },
      alerts,
    };
  },
};
