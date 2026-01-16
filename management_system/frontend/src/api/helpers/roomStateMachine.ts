/**
 * Room State Machine - Centralized Status Transition Control
 * 
 * HARDENING FIX #1: All room status changes MUST go through this function.
 * This ensures state machine validation is ALWAYS enforced.
 * 
 * Future: In production, this should be backed by a database constraint or
 * event sourcing to prevent any bypass.
 */

import type { RoomStatus } from '@/types';
import { BusinessRuleError } from '../errors';

/**
 * Valid status transitions for room status state machine
 * 
 * NOTE: Some transitions may seem unsafe but are required for specific workflows.
 * All transitions are validated here to ensure consistency.
 */
const VALID_STATUS_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  available: ['reserved', 'occupied', 'out_of_order', 'out_of_service', 'cleaning', 'inspecting'],
  occupied: ['dirty', 'out_of_order'],
  reserved: ['available', 'occupied', 'out_of_order'],
  dirty: ['cleaning', 'out_of_order'],
  cleaning: ['inspecting', 'available', 'dirty', 'out_of_order'],
  inspecting: ['available', 'dirty', 'out_of_order'],
  out_of_order: ['dirty', 'cleaning', 'available', 'out_of_service'],
  out_of_service: ['out_of_order', 'available'],
};

/**
 * Validate if a status transition is allowed
 * 
 * HARDENING: This function MUST be called for every status change.
 * Throws BusinessRuleError if transition is invalid.
 */
export function validateStatusTransition(currentStatus: RoomStatus, newStatus: RoomStatus): void {
  // Same status is always allowed (idempotent)
  if (currentStatus === newStatus) {
    return;
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new BusinessRuleError(
      `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.join(', ')}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

/**
 * Get all allowed transitions for a given status
 */
export function getAllowedTransitions(currentStatus: RoomStatus): RoomStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a transition is allowed (non-throwing version)
 */
export function isTransitionAllowed(currentStatus: RoomStatus, newStatus: RoomStatus): boolean {
  if (currentStatus === newStatus) {
    return true;
  }
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

