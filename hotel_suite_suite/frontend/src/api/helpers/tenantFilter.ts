/**
 * Tenant Filtering Helper
 * Ensures all data operations are scoped to a specific tenant
 */

import { ForbiddenError, ValidationError } from '../errors';

/**
 * Validate tenant ID is provided
 */
export function requireTenantId(tenantId: string | undefined | null): string {
  if (!tenantId) {
    throw new ValidationError('Tenant ID is required for this operation');
  }
  return tenantId;
}

/**
 * Filter array by tenant ID
 * In a real backend, this would be done at the database level
 */
export function filterByTenant<T extends { tenantId?: string }>(
  items: any,
  tenantId: string
): T[] {
  return items.filter((item: any) => item.tenantId === tenantId) as T[];
}

/**
 * Find item by ID and tenant ID
 * Throws NotFoundError if not found or belongs to different tenant
 */
export function findByIdAndTenant<T extends { id: string; tenantId?: string }>(
  items: T[],
  id: string,
  tenantId: string
): T | null {
  const item = items.find(i => i.id === id);
  
  if (!item) {
    return null;
  }
  
  // If item has tenantId, verify it matches
  if (item.tenantId && item.tenantId !== tenantId) {
    // Don't reveal that item exists but belongs to different tenant
    return null;
  }
  
  return item;
}

/**
 * Verify item belongs to tenant
 * Throws ForbiddenError if item belongs to different tenant
 */
export function verifyTenantAccess<T extends { tenantId?: string }>(
  item: T | null,
  tenantId: string,
  resourceName: string = 'Resource'
): T {
  if (!item) {
    throw new Error('Item is null'); // Let NotFoundError be thrown by caller
  }
  
  // If item has tenantId, verify it matches
  if (item.tenantId && item.tenantId !== tenantId) {
    throw new ForbiddenError(
      `${resourceName} does not belong to your tenant`
    );
  }
  
  return item;
}

