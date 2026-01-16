/**
 * Retry Helper for RMS Operations
 * 
 * HARDENING: Implements retry logic for transient RMS failures
 * - Only retries ConflictError and LockTimeoutError
 * - Exponential backoff
 * - Max 2 retries
 */

import { ConflictError } from '../errors';
import { delay } from './helpers';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  initialDelay: 100, // 100ms
  maxDelay: 500, // 500ms
  backoffMultiplier: 2,
};

/**
 * Check if an error is retryable
 * HARDENING: Only ConflictError and LockTimeoutError are retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof ConflictError) {
    return true;
  }
  // Check for LockTimeoutError (if it exists)
  if (error && typeof error === 'object' && 'name' in error) {
    return error.name === 'LockTimeoutError';
  }
  return false;
}

/**
 * Retry a function with exponential backoff
 * 
 * HARDENING: Only retries ConflictError and LockTimeoutError
 * Fails explicitly after max retries exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If not retryable, fail immediately
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // If this was the last attempt, fail
      if (attempt >= opts.maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delayMs = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      
      await delay(delayMs);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError;
}

