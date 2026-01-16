/**
 * Room-Level Concurrency Protection
 * 
 * HARDENING FIX #3: In-memory locking mechanism to prevent race conditions
 * during room assignment and transfer operations.
 * 
 * IMPORTANT: This is a temporary in-memory solution. In production, this should
 * be replaced with:
 * - Database row-level locking (SELECT FOR UPDATE)
 * - Distributed locking (Redis, etcd, etc.)
 * - Pessimistic locking with timeout
 * 
 * Current implementation uses a simple Map-based lock with automatic cleanup.
 */

// In-memory lock store: roomId -> lock metadata
interface LockMetadata {
  acquiredAt: number;
  tenantId: string;
  operation: string;
}

const roomLocks = new Map<string, LockMetadata>();
const LOCK_TIMEOUT_MS = 30000; // 30 seconds - prevents deadlocks

/**
 * Acquire a lock for a room
 * 
 * @param tenantId - Tenant ID for isolation
 * @param roomId - Room ID to lock
 * @param operation - Operation name for debugging
 * @returns true if lock acquired, false if already locked
 * @throws Error if lock acquisition fails
 */
export function acquireRoomLock(
  tenantId: string,
  roomId: string,
  operation: string
): boolean {
  const lockKey = `${tenantId}:${roomId}`;
  const existingLock = roomLocks.get(lockKey);

  // Check if lock exists and is still valid
  if (existingLock) {
    const lockAge = Date.now() - existingLock.acquiredAt;
    if (lockAge < LOCK_TIMEOUT_MS) {
      // Lock is still valid
      return false;
    }
    // Lock expired, remove it
    roomLocks.delete(lockKey);
  }

  // Acquire new lock
  roomLocks.set(lockKey, {
    acquiredAt: Date.now(),
    tenantId,
    operation,
  });

  return true;
}

/**
 * Release a lock for a room
 * 
 * @param tenantId - Tenant ID
 * @param roomId - Room ID
 */
export function releaseRoomLock(tenantId: string, roomId: string): void {
  const lockKey = `${tenantId}:${roomId}`;
  roomLocks.delete(lockKey);
}

/**
 * Check if a room is currently locked
 */
export function isRoomLocked(tenantId: string, roomId: string): boolean {
  const lockKey = `${tenantId}:${roomId}`;
  const lock = roomLocks.get(lockKey);
  
  if (!lock) {
    return false;
  }

  // Check if lock expired
  const lockAge = Date.now() - lock.acquiredAt;
  if (lockAge >= LOCK_TIMEOUT_MS) {
    roomLocks.delete(lockKey);
    return false;
  }

  return true;
}

/**
 * Cleanup expired locks (should be called periodically in production)
 */
export function cleanupExpiredLocks(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, lock] of roomLocks.entries()) {
    if (now - lock.acquiredAt >= LOCK_TIMEOUT_MS) {
      roomLocks.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Execute a function with a room lock
 * 
 * Automatically acquires and releases lock, even on error.
 */
export async function withRoomLock<T>(
  tenantId: string,
  roomId: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const acquired = acquireRoomLock(tenantId, roomId, operation);
  if (!acquired) {
    // Lock acquisition failure - caller should retry with backoff
    // Expected in high-concurrency scenarios
    throw new Error(
      `Room ${roomId} is currently locked by another operation. Please try again.`
    );
  }

  try {
    return await fn();
  } finally {
    releaseRoomLock(tenantId, roomId);
  }
}

