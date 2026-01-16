/**
 * Reservation State Machine - Centralized Status Transition Control
 * 
 * HARDENING FIX: All reservation status changes MUST go through this function.
 * This ensures state machine validation is ALWAYS enforced.
 */

import type { ReservationStatus } from '@/types';
import { BusinessRuleError } from '../errors';

/**
 * Valid status transitions for reservation status state machine
 * 
 * Strict transitions only - no bypass paths allowed.
 */
const VALID_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  inquiry: ['confirmed'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['checked_out'],
  checked_out: [], // Terminal state - no transitions allowed
  cancelled: [], // Terminal state - no transitions allowed
  no_show: [], // Terminal state - no transitions allowed
};

/**
 * Validate if a status transition is allowed
 * 
 * HARDENING: This function MUST be called for every status change.
 * Throws BusinessRuleError if transition is invalid.
 */
export function validateReservationStatusTransition(
  currentStatus: ReservationStatus,
  newStatus: ReservationStatus
): void {
  // Same status is always allowed (idempotent)
  if (currentStatus === newStatus) {
    return;
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new BusinessRuleError(
      `Invalid reservation status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none (terminal state)'}`,
      'INVALID_RESERVATION_STATUS_TRANSITION'
    );
  }
}

/**
 * Get all allowed transitions for a given status
 */
export function getAllowedReservationTransitions(currentStatus: ReservationStatus): ReservationStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a transition is allowed (non-throwing version)
 */
export function isReservationTransitionAllowed(
  currentStatus: ReservationStatus,
  newStatus: ReservationStatus
): boolean {
  if (currentStatus === newStatus) {
    return true;
  }
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

/**
 * Check if a status is terminal (no transitions allowed)
 */
export function isTerminalStatus(status: ReservationStatus): boolean {
  return VALID_STATUS_TRANSITIONS[status]?.length === 0;
}

