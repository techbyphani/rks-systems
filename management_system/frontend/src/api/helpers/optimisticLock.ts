/**
 * Optimistic Locking
 * Prevents lost updates by checking version numbers before updates
 */

import { ConflictError } from '../errors';

/**
 * Interface for entities with version numbers
 */
export interface VersionedEntity {
  id: string;
  version?: number;
  [key: string]: any;
}

/**
 * Check if entity version matches expected version
 * Throws ConflictError if versions don't match
 */
export function checkVersion<T extends VersionedEntity>(
  entity: T | null,
  expectedVersion: number | undefined,
  resourceName: string = 'Resource'
): void {
  if (!entity) {
    return; // Let NotFoundError be thrown by caller
  }
  
  // If entity doesn't have version, it's not versioned (backward compatibility)
  if (entity.version === undefined) {
    return;
  }
  
  // If expected version not provided, skip check (backward compatibility)
  if (expectedVersion === undefined) {
    return;
  }
  
  // Check version match
  if (entity.version !== expectedVersion) {
    throw new ConflictError(
      `${resourceName} has been modified by another user. Please refresh and try again.`,
      resourceName
    );
  }
}

/**
 * Increment version number for entity
 */
export function incrementVersion<T extends VersionedEntity>(entity: T): T {
  return {
    ...entity,
    version: (entity.version || 0) + 1,
  };
}

/**
 * Get current version of entity
 */
export function getVersion<T extends VersionedEntity>(entity: T | null): number {
  if (!entity) {
    return 0;
  }
  return entity.version || 0;
}

