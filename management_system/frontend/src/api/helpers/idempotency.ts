/**
 * Idempotency Protection
 * Prevents duplicate operations from being executed multiple times
 */

import { ConflictError } from '../errors';

// In-memory store for completed operations
// In production, this would be a Redis cache or database table
interface IdempotencyRecord {
  key: string;
  result: any;
  completedAt: string;
  expiresAt: string;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();

// Cleanup expired records every 5 minutes
setInterval(() => {
  const now = new Date().toISOString();
  for (const [key, record] of idempotencyStore.entries()) {
    if (record.expiresAt < now) {
      idempotencyStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate idempotency key from operation details
 */
export function generateIdempotencyKey(
  operation: string,
  tenantId: string,
  ...params: (string | number | undefined)[]
): string {
  const paramString = params
    .filter(p => p !== undefined)
    .map(p => String(p))
    .join(':');
  return `${operation}:${tenantId}:${paramString}`;
}

/**
 * Check if operation was already completed
 * Returns the cached result if found, null otherwise
 */
export function checkIdempotency<T = any>(key: string): T | null {
  const record = idempotencyStore.get(key);
  
  if (!record) {
    return null;
  }
  
  // Check if expired
  if (record.expiresAt < new Date().toISOString()) {
    idempotencyStore.delete(key);
    return null;
  }
  
  return record.result as T;
}

/**
 * Store completed operation result
 */
export function storeIdempotencyResult<T = any>(
  key: string,
  result: T,
  ttlMinutes: number = 60
): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  
  idempotencyStore.set(key, {
    key,
    result,
    completedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

/**
 * Execute operation with idempotency protection
 * If operation was already completed, returns cached result
 * Otherwise executes operation and caches result
 */
export async function withIdempotency<T>(
  key: string,
  operation: () => Promise<T>,
  ttlMinutes: number = 60
): Promise<T> {
  // Check if already completed
  const cached = checkIdempotency<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Execute operation
  const result = await operation();
  
  // Store result
  storeIdempotencyResult(key, result, ttlMinutes);
  
  return result;
}

/**
 * Clear idempotency record (for testing or manual cleanup)
 */
export function clearIdempotency(key: string): void {
  idempotencyStore.delete(key);
}

/**
 * Clear all idempotency records (for testing)
 */
export function clearAllIdempotency(): void {
  idempotencyStore.clear();
}

