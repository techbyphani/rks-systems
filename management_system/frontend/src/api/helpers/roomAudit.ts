/**
 * Room Audit Logger
 * 
 * HARDENING FIX #8: Centralized audit logging for all room mutations.
 * 
 * Logs:
 * - All status changes
 * - All field updates
 * - Assignment/release operations
 * - Failed operations
 * - Conflict attempts
 * 
 * In production, this should write to:
 * - Database audit table
 * - Event log (for event sourcing)
 * - Security information and event management (SIEM) system
 */

import type { RoomHistory, RoomStatus } from '@/types';
import { generateSequentialId, now } from '../helpers';

// In-memory audit log (in production, this would be a database)
let auditLog: RoomHistory[] = [];

/**
 * Log a room operation to audit trail
 */
export function logRoomOperation(params: {
  tenantId: string;
  roomId: string;
  action: RoomHistory['action'];
  previousValue?: string;
  newValue?: string;
  performedBy: string;
  notes?: string;
  metadata?: Record<string, any>;
}): void {
  const entry: RoomHistory = {
    id: generateSequentialId('RH', auditLog.map(h => h.id)),
    tenantId: params.tenantId,
    roomId: params.roomId,
    action: params.action,
    previousValue: params.previousValue,
    newValue: params.newValue,
    performedBy: params.performedBy,
    notes: params.notes,
    metadata: params.metadata,
    createdAt: now(),
    updatedAt: now(),
  };

  auditLog.push(entry);
}

/**
 * Log a status change
 */
export function logStatusChange(
  tenantId: string,
  roomId: string,
  previousStatus: RoomStatus,
  newStatus: RoomStatus,
  performedBy: string,
  reason?: string
): void {
  logRoomOperation({
    tenantId,
    roomId,
    action: 'status_change',
    previousValue: previousStatus,
    newValue: newStatus,
    performedBy,
    notes: reason,
  });
}

/**
 * Log a room assignment
 */
export function logAssignment(
  tenantId: string,
  roomId: string,
  guestId: string,
  reservationId: string,
  performedBy: string
): void {
  logRoomOperation({
    tenantId,
    roomId,
    action: 'assignment',
    newValue: `Guest: ${guestId}, Reservation: ${reservationId}`,
    performedBy,
  });
}

/**
 * Log a room release
 */
export function logRelease(
  tenantId: string,
  roomId: string,
  previousGuestId: string | undefined,
  previousReservationId: string | undefined,
  performedBy: string
): void {
  logRoomOperation({
    tenantId,
    roomId,
    action: 'release',
    previousValue: previousGuestId && previousReservationId
      ? `Guest: ${previousGuestId}, Reservation: ${previousReservationId}`
      : undefined,
    performedBy,
  });
}

/**
 * Log a failed operation attempt
 */
export function logFailedOperation(
  tenantId: string,
  roomId: string,
  operation: string,
  error: string,
  performedBy: string
): void {
  logRoomOperation({
    tenantId,
    roomId,
    action: 'note_added', // Using note_added as generic action for failures
    newValue: `Failed ${operation}: ${error}`,
    performedBy,
    metadata: { failedOperation: operation, error },
  });
}

/**
 * Log a conflict detection
 */
export function logConflict(
  tenantId: string,
  roomId: string,
  conflictType: string,
  details: string,
  performedBy: string
): void {
  logRoomOperation({
    tenantId,
    roomId,
    action: 'note_added',
    newValue: `Conflict detected (${conflictType}): ${details}`,
    performedBy,
    metadata: { conflictType, details },
  });
}

/**
 * Log a field update (non-status)
 */
export function logFieldUpdate(
  tenantId: string,
  roomId: string,
  field: string,
  previousValue: any,
  newValue: any,
  performedBy: string
): void {
  logRoomOperation({
    tenantId,
    roomId,
    action: 'note_updated',
    previousValue: `${field}: ${String(previousValue)}`,
    newValue: `${field}: ${String(newValue)}`,
    performedBy,
    metadata: { field, previousValue, newValue },
  });
}

/**
 * Get audit log for a room
 */
export function getRoomAuditLog(
  tenantId: string,
  roomId: string,
  limit?: number
): RoomHistory[] {
  let result = auditLog.filter(
    h => h.tenantId === tenantId && h.roomId === roomId
  );
  
  result.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  if (limit) {
    result = result.slice(0, limit);
  }
  
  return result;
}

/**
 * Export audit log (for external systems)
 */
export function exportAuditLog(tenantId: string, startDate?: string, endDate?: string): RoomHistory[] {
  let result = auditLog.filter(h => h.tenantId === tenantId);
  
  if (startDate) {
    result = result.filter(h => h.createdAt >= startDate);
  }
  
  if (endDate) {
    result = result.filter(h => h.createdAt <= endDate);
  }
  
  return result.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

// Export for use in roomService
export { auditLog as roomHistory };

