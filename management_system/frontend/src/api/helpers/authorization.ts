/**
 * Authorization Guards
 * 
 * HARDENING FIX #7: Minimum viable authorization checks for privileged operations.
 * 
 * NOTE: This is a basic implementation. In production, this should integrate with:
 * - RBAC (Role-Based Access Control) system
 * - Permission management system
 * - User context from authentication middleware
 * 
 * Current implementation uses simple role checks. Future expansion needed.
 */

import { ForbiddenError, UnauthorizedError } from '../errors';

/**
 * User roles that can perform operations
 * 
 * TODO: This should come from user context, not be hardcoded
 */
export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'general_manager'
  | 'manager'
  | 'supervisor'
  | 'staff';

/**
 * Operation permissions
 */
export type Operation = 
  | 'room.delete'
  | 'room.bulk_update'
  | 'room.block'
  | 'room_type.crud'
  | 'room.rate_override'
  | 'room.inspection_approve'
  | 'room.maintenance_schedule';

/**
 * Required roles for operations
 */
const OPERATION_PERMISSIONS: Record<Operation, UserRole[]> = {
  'room.delete': ['super_admin', 'admin'],
  'room.bulk_update': ['super_admin', 'admin', 'general_manager', 'manager'],
  'room.block': ['super_admin', 'admin', 'general_manager', 'manager'],
  'room_type.crud': ['super_admin', 'admin'],
  'room.rate_override': ['super_admin', 'admin', 'general_manager', 'manager'],
  'room.inspection_approve': ['super_admin', 'admin', 'general_manager', 'manager', 'supervisor'],
  'room.maintenance_schedule': ['super_admin', 'admin', 'general_manager', 'manager'],
};

/**
 * Check if user has permission for operation
 * 
 * TODO: In production, user role should come from authenticated user context
 */
export function hasPermission(
  userRole: UserRole | undefined,
  operation: Operation
): boolean {
  if (!userRole) {
    return false;
  }

  const requiredRoles = OPERATION_PERMISSIONS[operation];
  return requiredRoles.includes(userRole);
}

/**
 * Require permission or throw ForbiddenError
 */
export function requirePermission(
  userRole: UserRole | undefined,
  operation: Operation,
  resource?: string
): void {
  if (!userRole) {
    throw new UnauthorizedError('User role is required for this operation');
  }

  if (!hasPermission(userRole, operation)) {
    throw new ForbiddenError(
      `Operation '${operation}' requires one of: ${OPERATION_PERMISSIONS[operation].join(', ')}. Current role: ${userRole}`,
      resource
    );
  }
}

/**
 * Authorization context (should come from request/auth middleware)
 * 
 * TODO: In production, this should be injected from authentication system
 */
export interface AuthContext {
  userId: string;
  role: UserRole;
  tenantId: string;
}

/**
 * Get user role from context (placeholder - should come from auth system)
 * 
 * TODO: Replace with actual auth context retrieval
 */
export function getUserRole(performedBy?: string): UserRole | undefined {
  // Placeholder: In production, this would query user service or auth system
  // For now, we'll use a simple heuristic based on performedBy
  if (!performedBy || performedBy === 'system') {
    return undefined;
  }
  
  // TODO: This is a temporary hack. Replace with actual user lookup.
  // For now, assume all users are 'staff' unless specified otherwise
  return 'staff';
}

