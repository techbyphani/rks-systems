/**
 * Ensures the value is always an array
 * @param value - The value to ensure is an array
 * @returns An array, empty array if value is null/undefined, or the value if it's already an array
 */
export function ensureArray<T>(value: T[] | T | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value
  }
  if (value === null || value === undefined) {
    return []
  }
  // If it's not an array and not null/undefined, return empty array
  // This handles cases where value might be an object or other type
  return []
}

