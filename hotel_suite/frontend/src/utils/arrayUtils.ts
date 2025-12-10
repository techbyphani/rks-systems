/**
 * Ensures the value is always an array - FAILPROOF VERSION
 * @param value - The value to ensure is an array
 * @returns An array, always returns a new array instance
 */
export function ensureArray<T>(value: T[] | T | null | undefined): T[] {
  // Always return a new array to avoid reference issues
  if (Array.isArray(value)) {
    return [...value] // Return a copy to ensure it's a fresh array
  }
  // For any other case, return empty array
  return []
}

/**
 * Guarantees an array for Table dataSource - EXTRA SAFE
 * @param value - The value to ensure is an array
 * @returns An array, always returns a proper array instance
 */
export function ensureTableDataSource<T>(value: any): T[] {
  // Double check with multiple methods
  if (Array.isArray(value) && value.length >= 0) {
    // Verify it has array methods
    if (typeof value.forEach === 'function' && typeof value.map === 'function') {
      return [...value] // Return a copy
    }
  }
  // Return empty array for any other case
  return []
}

